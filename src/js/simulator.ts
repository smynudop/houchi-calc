import { Unit, Matrix, CalcRequest } from "./houchi"
import { LIFE_DEFAULT, MUSIC_MAXTIME, CONF, DECREASE_LIFE } from "./data/constants"

const getLiveType = (difficulity: IDifficult): ILiveType => {
    switch (difficulity) {
        case "piano":
        case "forte":
            return "grand"

        case "debut":
        case "regular":
        case "pro":
        case "master":
        case "master+":
        case "witch":
            return "normal"
            break

        default:
            console.warn(`デ譜面難易度が不正です(${difficulity})`)
            return "normal"
    }
}

class Music {
    level: number
    name: string
    coefficient: number
    difficulity: IDifficult
    liveType: ILiveType
    decreaseLife: DecreaseLife
    musictime: number
    notes: INoteDetail[]
    offset: number
    longInfo: Map<Number, LongInfo>

    constructor(data: Partial<IMusic>) {
        this.name = data.name ?? ""
        this.level = data.level ?? 28
        this.difficulity = data.difficulity ?? "master"
        this.musictime = data.musictime ?? 120
        this.notes = data.notes?.map(n => { return { ...n, score: 0, result: "guard" } }) ?? []
        this.offset = data.offset ?? 0
        this.longInfo = new Map()
        this.initLongInfo()

        this.liveType = getLiveType(this.difficulity)
        this.decreaseLife = DECREASE_LIFE[this.liveType]
        this.coefficient = CONF[this.level] || 2
    }


    initLongInfo() {
        let noList = this.notes.map((n) => n.no)
        noList = [...new Set(noList)].filter((x) => x != 0)
        for (let no of noList) {
            let frames = this.notes.filter((n) => n.no == no).map((n) => n.frame)
            this.longInfo.set(no, {
                begin: Math.min(...frames),
                end: Math.max(...frames),
                isContinue: true,
            })
        }
    }


    resetNotes() {
        this.notes.forEach((n) => {
            n.score = 0
            n.result = "guard"
        })
        for (let [k, info] of this.longInfo) {
            info.isContinue = true
        }
    }

    getLifeOfNote(note: INote) {
        let result
        switch (this.liveType) {
            case "grand":
                //短フリックはタップ扱い
                if (note.no == 0) {
                    return this.decreaseLife.tap
                }
                return this.decreaseLife[note.type]

            case "normal":
                if (note.no != 0) {
                    return this.decreaseLife.long
                }
                return this.decreaseLife[note.type]
        }
        if (result === undefined) {
            console.warn("ライフが取得できません", note.type)
        }
        return result
    }

    frame(moment: number) {
        return moment * 30 - this.offset
    }

    /**
 * 指定したmomentにあるノーツをmiss扱いにし、つながっているノーツを無効にする
 * ライフ計算のため、missになった最初のノーツを返す。
 * @param moment
 * @returns
 */
    disConnectLong(moment: number) {
        let frame = this.frame(moment)
        let result: INote[] = []

        for (let [key, info] of this.longInfo) {
            if (!info.isContinue) continue
            if (info.begin <= frame && frame <= info.end) {
                info.isContinue = false
                let notes = this.notes
                    .filter((n) => n.no == key && n.frame >= frame)
                    .sort((a, b) => a.frame - b.frame)
                result.push(notes[0])
            }
        }
        return result
    }

    isContinue(no: number) {
        if (no == 0) return true
        return this.longInfo.get(no)!.isContinue
    }

    disConnect(no: number) {
        if (no == 0) return;
        this.longInfo.get(no)!.isContinue = false
    }


    get notesCount() {
        return this.notes.length
    }

    get totalScore() {
        return this.notes.reduce((a, c) => a + c.score!, 0)
    }

    get perfectnum() {
        return this.notes.filter((n) => n.score).length
    }

    pickNotesByMoment(moment: number) {
        return this.notes.filter(
            (n) => n.frame >= this.frame(moment) && n.frame < this.frame(moment + 1)
        )
    }
}

type SimulatorResponse = {
    momentInfos: SimulatorMomentInfo[]
    musicName: string
    totalScore: number
    unitLife: number
    dangerTime: number
    maxCombo: number
}

export type SimulatorMomentInfo = {
    finallyBuff: RequiredBuff | null
    judge: Judge
    notes: INoteDetail[]
    life: number
}

type JudgeResponse = {
    addLife: number
    combo: number
    breakCombo: boolean
    danger: boolean
}

export class Simulator {
    unit: Unit
    isGrand: boolean
    music: Music
    isHouchi: boolean
    cache: Map<string, IMusic>

    constructor(unit: Unit, isGrand: boolean, isHouchi = true) {
        this.unit = unit
        this.isGrand = isGrand
        this.music = new Music({})
        this.isHouchi = isHouchi
        this.cache = new Map<string, IMusic>()
    }

    async fetch(filename: string) {
        let score: IMusic
        if (this.cache.has(filename)) {
            score = this.cache.get(filename)!
        } else {
            const res = await fetch(filename)
            score = await res.json() as IMusic
            this.cache.set(filename, score)
        }

        this.music = new Music(score)

    }

    reset() {
        this.music.resetNotes()
    }

    basicValue(appeal: number) {
        return (appeal * this.music.coefficient) / this.music.notesCount
    }

    combobonus(combo: number) {
        let allnote = this.music.notesCount
        if (combo >= Math.floor(allnote * 0.9)) return 2.0
        if (combo >= Math.floor(allnote * 0.8)) return 1.7
        if (combo >= Math.floor(allnote * 0.7)) return 1.5
        if (combo >= Math.floor(allnote * 0.5)) return 1.4
        if (combo >= Math.floor(allnote * 0.25)) return 1.3
        if (combo >= Math.floor(allnote * 0.1)) return 1.2
        if (combo >= Math.floor(allnote * 0.05)) return 1.1
        return 1.0
    }

    async calc(matrix: Matrix, req: CalcRequest): Promise<SimulatorResponse> {
        this.reset()
        if (req.scorePath != "") {
            await this.fetch(req.scorePath)

        }

        const momentInfos: SimulatorMomentInfo[] = []

        let dangerMoment = 0
        let life = 0
        const addLifes = []
        const combos: number[] = []
        let combo: number = 0

        for (let moment = 0; moment < matrix.skillMatrix.length; moment++) {
            const info = matrix.skillMatrix[moment]

            const skill = info.finallyAbility!(life)

            let judge: Judge = "miss"
            if (!this.isHouchi) {
                judge = "perfect"
            } else {
                if (skill.support >= 4) {
                    judge = "perfect"
                }
            }

            let jres: JudgeResponse
            switch (judge) {
                case "perfect":
                    jres = this.perfect(moment, skill, combo, req.appeal)
                    break
                // case "guard":
                //     jres = this.guard(moment)
                //     break
                case "miss":
                    jres = this.miss(moment, skill)
                    break
            }
            addLifes.push(jres.addLife)
            if (jres.breakCombo) {
                combos.push(combo)
                combo = 0
            } else {
                combo = jres.combo
            }
            if (jres.danger && moment < this.music.musictime * 2) {
                dangerMoment++
            }

            momentInfos.push({
                finallyBuff: skill,
                judge,
                life: 0,
                notes: this.music.pickNotesByMoment(moment)
            })


        }

        const lifeResponse = this.calcLife(addLifes, req.idols.some(i => i.type == "cristal"))
        for (const [i, info] of momentInfos.entries()) {
            info.life = lifeResponse.percentList[i]
        }


        return {
            momentInfos,
            musicName: this.music.name,
            totalScore: this.music.totalScore,
            unitLife: lifeResponse.requiredLife,
            dangerTime: dangerMoment / 2,
            maxCombo: Math.max(...combos, 0)
        }



    }

    calcLife(lifes: number[], start200: boolean) {

        const requiredLife = this.getRequiredLife(lifes, start200)
        const unitlife = Math.max(requiredLife, LIFE_DEFAULT)

        let simuLife = start200 ? unitlife * 2 : unitlife

        let percentList: number[] = []

        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            simuLife += lifes[moment]
            simuLife = Math.min(simuLife, unitlife * 2)

            let percent = Math.ceil((simuLife * 100) / unitlife)
            percent = Math.min(200, percent)
            percent = Math.max(0, percent)

            percentList.push(percent)
        }

        return {
            requiredLife,
            percentList
        }
    }

    getRequiredLife(lifes: number[], start200: boolean) {
        let lifeSimu: number[] = []
        let life = 0
        for (let l of lifes) {
            life -= l
            lifeSimu.push(life)
        }
        if (start200) {
            console.log(lifeSimu)
            const max = Math.max(...lifeSimu) - Math.min(...lifeSimu)
            return Math.floor(max / 2) + 1
        } else {
            const max = Math.max(...lifeSimu)
            return max + 1
        }

    }

    perfect(moment: number, bonus: RequiredBuff, nowcombo: number, appeal: number): JudgeResponse {
        let scoreBonus = (100 + bonus.score) / 100
        let comboBonus = (100 + bonus.combo) / 100
        let slide = (100 + bonus.slide) / 100

        let basicValue = this.basicValue(appeal)

        let life = 0
        let combo = nowcombo

        let notes = this.music.pickNotesByMoment(moment)
        for (let n of notes) {
            if (!this.music.isContinue(n.no)) {
                n.result = "gone"
                continue
            }
            combo++
            let skill_scorebonus = n.no && this.isGrand ? Math.max(scoreBonus, slide) : scoreBonus
            let skill_combobonus = combo == 1 ? 1 : comboBonus

            n.score = Math.round(basicValue * skill_scorebonus * skill_combobonus * this.combobonus(combo))
            n.result = "perfect"
            life += bonus.heal
        }
        return {
            addLife: life,
            combo,
            breakCombo: false,
            danger: false
        }
    }

    disConnectLong(moment: number) {
        let life = 0
        let notes = this.music.disConnectLong(moment)
        for (let n of notes) {
            life -= this.music.getLifeOfNote(n)!
        }
        return life
    }

    guard(moment: number): JudgeResponse {
        let life = this.disConnectLong(moment)
        let isReset = life < 0

        let notes = this.music.pickNotesByMoment(moment)
        for (let n of notes) {
            if (!this.music.isContinue(n.no)) {
                n.result = "gone"
                continue
            }
            n.result = "guard"
            isReset = true
            this.music.disConnect(n.no)
        }
        return {
            addLife: 0,
            combo: 0,
            breakCombo: isReset,
            danger: false
        }
    }

    miss(moment: number, bonus: RequiredBuff): JudgeResponse {
        let life = this.disConnectLong(moment)
        let isReset = life < 0

        let notes = this.music.pickNotesByMoment(moment)

        for (let n of notes) {
            if (!this.music.isContinue(n.no)) {
                n.result = "gone"
                continue
            }
            n.result = "miss"
            this.music.disConnect(n.no)

            let l = this.music.getLifeOfNote(n)!
            const cut = Math.min(bonus.cut, 1)
            l = Math.floor(l * (1 - cut))
            life -= l
        }
        return {
            addLife: life,
            combo: 0,
            breakCombo: isReset,
            danger: true
        }
    }
}
