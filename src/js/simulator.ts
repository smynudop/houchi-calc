import { Unit, Matrix, CalcRequest } from "./houchi"
import { keyof } from "./data/data"
import { LIFE_DEFAULT, MUSIC_MAXTIME, CONF, DECREASE_LIFE } from "./data/constants"

class Score {
    notes: INoteDetail[]
    offset: number
    longInfo: { [key: number]: LongInfo }

    constructor(notes: INote[], offset: number) {
        this.notes = notes.map(x => {
            return {
                ...x,
                score: 0,
                result: "miss"
            }
        })
        this.offset = offset
        this.longInfo = {}
        this.setlongInfo()
        this.reset()
    }

    setlongInfo() {
        let keys = this.notes.map((n) => n.no)
        keys = Array.from(new Set(keys)).filter((x) => x != 0)
        for (let key of keys) {
            let frames = this.notes.filter((n) => n.no == key).map((n) => n.frame)
            let begin = Math.min(...frames)
            let end = Math.max(...frames)
            this.longInfo[key] = {
                begin: begin,
                end: end,
                isContinue: true,
            }
        }
    }

    /**
     * 指定したmomentにあるノーツをmiss扱いにし、つながっているノーツを無効にする
     * ライフ計算のため、missになった最初のノーツを返す。
     * @param moment
     * @returns
     */
    disConnectLong(moment: number) {
        let frame = moment * 30 - this.offset
        let result: INote[] = []

        for (let k of keyof(this.longInfo)) {
            let li = this.longInfo[k]
            if (!li.isContinue) continue
            if (li.begin <= frame && frame <= li.end) {
                li.isContinue = false
                let notes = this.notes
                    .filter((n) => n.no == k && n.frame >= frame)
                    .sort((a, b) => a.frame - b.frame)
                result.push(notes[0])
            }
        }
        return result
    }

    isContinue(no: number) {
        if (no == 0) return true
        return this.longInfo[no].isContinue
    }

    disConnect(no: number) {
        if (no == 0) return false
        this.longInfo[no].isContinue = false
    }

    reset() {
        this.notes.forEach((n) => {
            n.score = 0
            n.result = "guard"
        })
        for (let k in this.longInfo) {
            this.longInfo[k].isContinue = true
        }
    }

    setOffset(offset: number) {
        this.offset = offset
    }

    get length() {
        return this.notes.length
    }

    get longlength() {
        return Math.max(...this.notes.map((n) => n.no))
    }

    get totalScore() {
        return this.notes.reduce((a, c) => a + c.score!, 0)
    }

    get perfectnum() {
        return this.notes.filter((n) => n.score).length
    }

    pick(moment: number) {
        return this.notes.filter(
            (n) => n.frame >= moment * 30 - this.offset && n.frame < moment * 30 + 30 - this.offset
        )
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

    constructor() {
        this.name = "hoge"
        this.level = 28
        this.coefficient = 2
        this.difficulity = "master"
        this.liveType = "normal"
        this.musictime = 121
        this.decreaseLife = DECREASE_LIFE.normal
    }

    set(name: string, level: number, difficulity: IDifficult) {
        this.name = name
        this.level = level
        this.difficulity = difficulity

        switch (difficulity) {
            case "piano":
            case "forte":
                this.liveType = "grand"
                break

            case "pro":
            case "master":
            case "master+":
            case "witch":
                this.liveType = "normal"
                break

            default:
                console.warn("difficulityが不正です")
        }

        this.calcParam()
    }

    calcParam() {
        if (this.level in CONF) {
            this.coefficient = CONF[this.level]
        }
        this.decreaseLife = DECREASE_LIFE[this.liveType]
    }

    setMusictime(time: number) {
        this.musictime = time
    }

    notesLife(note: INote) {
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
    notes: Score
    isGrand: boolean
    music: Music
    isHouchi: boolean
    cache: Map<string, IMusic>

    constructor(unit: Unit, isGrand: boolean, isHouchi = true) {
        this.unit = unit
        this.notes = new Score([], 0)
        this.isGrand = isGrand
        this.music = new Music()
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


        this.notes = new Score(score.notes, score.offset)
        this.music.set(score.name, score.level, score.difficulity)
        this.music.setMusictime(score.musictime)
    }

    get totalScore() {
        return this.notes.totalScore
    }

    get perfectnum() {
        return this.notes.perfectnum
    }

    setOffset(offset: number) {
        this.notes.setOffset(offset)
    }

    setMusictime(time: number) {
        this.music.setMusictime(time)
    }

    reset() {
        this.notes.reset()
    }

    basicValue(appeal: number) {
        return (appeal * this.music.coefficient) / this.notes.length
    }

    combobonus(combo: number) {
        let allnote = this.notes.length
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
                } else if (skill.guard > 0) {
                    judge = "guard"
                }
            }

            let jres: JudgeResponse
            switch (judge) {
                case "perfect":
                    jres = this.perfect(moment, skill, combo, req.appeal)
                    break
                case "guard":
                    jres = this.guard(moment)
                    break
                case "miss":
                    jres = this.miss(moment)
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
                notes: this.notes.pick(moment)
            })


        }

        const lifeResponse = this.calcLife(addLifes)
        for (const [i, info] of momentInfos.entries()) {
            info.life = lifeResponse.percentList[i]
        }


        return {
            momentInfos,
            musicName: this.music.name,
            totalScore: this.totalScore,
            unitLife: lifeResponse.requiredLife,
            dangerTime: dangerMoment / 2,
            maxCombo: Math.max(...combos, 0)
        }



    }

    calcLife(lifes: number[]) {

        const requiredLife = this.getRequiredLife(lifes)
        const unitlife = Math.max(requiredLife, LIFE_DEFAULT)

        let simuLife = unitlife

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

    getRequiredLife(lifes: number[]) {
        let lifeSimu: number[] = []
        let life = 0
        for (let l of lifes) {
            life -= l
            lifeSimu.push(life)
        }
        return Math.max(...lifeSimu) + 1
    }

    perfect(moment: number, bonus: RequiredBuff, nowcombo: number, appeal: number): JudgeResponse {
        let scoreBonus = (100 + bonus.score) / 100
        let comboBonus = (100 + bonus.combo) / 100
        let slide = (100 + bonus.slide) / 100

        let basicValue = this.basicValue(appeal)

        let life = 0
        let combo = nowcombo

        let notes = this.notes.pick(moment)
        for (let n of notes) {
            if (!this.notes.isContinue(n.no)) {
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
        let notes = this.notes.disConnectLong(moment)
        for (let n of notes) {
            life -= this.music.notesLife(n)!
        }
        return life
    }

    guard(moment: number): JudgeResponse {
        let life = this.disConnectLong(moment)
        let isReset = life < 0

        let notes = this.notes.pick(moment)
        for (let n of notes) {
            if (!this.notes.isContinue(n.no)) {
                n.result = "gone"
                continue
            }
            n.result = "guard"
            isReset = true
            this.notes.disConnect(n.no)
        }
        return {
            addLife: 0,
            combo: 0,
            breakCombo: isReset,
            danger: false
        }
    }

    miss(moment: number): JudgeResponse {
        let life = this.disConnectLong(moment)
        let isReset = life < 0

        let notes = this.notes.pick(moment)

        for (let n of notes) {
            if (!this.notes.isContinue(n.no)) {
                n.result = "gone"
                continue
            }
            n.result = "miss"
            this.notes.disConnect(n.no)

            let l = this.music.notesLife(n)!
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
