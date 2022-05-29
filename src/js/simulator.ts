import { Unit } from "./houchi"
import { keyof } from "./data/data"
import {
    DAMY_SCORE,
    SCORES_GRAND,
    SCORES_NORMAL,
    SCORE_DEFAULT_GRAND,
    SCORE_DEFAULT_NORMAL,
} from "./data/score"
import { LIFE_DEFAULT, MUSIC_MAXTIME, CONF, DECREASE_LIFE } from "./data/constants"

class Note {
    no: number
    type: INoteType
    frame: number

    score: number
    result: IJudge
    enabled: boolean

    constructor(note: INote) {
        this.no = note.no
        this.type = note.type
        this.frame = note.frame

        this.score = 0
        this.result = "guard"
        this.enabled = true
    }

    reset() {
        this.score = 0
        this.result = "guard"
        this.enabled = true
    }

    disabling() {
        this.enabled = false
    }
}

class Score {
    notes: Note[]
    offset: number
    longInfo: {
        startFrame: number
        endFrame: number
        no: number
        enabled: boolean
    }[]

    constructor(notes: INote[], offset: number) {
        this.notes = notes.map((n) => new Note(n))
        this.offset = offset
        this.longInfo = []

        this.setLongInfo()
    }

    setLongInfo() {
        const uniqNos = Array.from(new Set(this.notes.map((x) => x.no))).filter((x) => x != 0)

        for (let no of uniqNos) {
            let notes = this.notes.filter((x) => x.no == no)
            let min = Math.min(...notes.map((n) => n.frame))
            let max = Math.max(...notes.map((n) => n.frame))
            this.longInfo.push({
                startFrame: min,
                endFrame: max,
                no: no,
                enabled: true,
            })
        }
    }

    /**
     * 指定したmomentにあるノーツをmiss扱いにし、つながっているノーツを無効にする
     * ライフ計算のため、missになった最初のノーツを返す。
     * @param moment
     * @returns
     */
    interruptSupport(moment: number) {
        let frame = moment * 30 - this.offset
        let result: INote[] = []

        for (let li of this.longInfo) {
            if (!li.enabled) continue
            if (li.startFrame <= frame && frame <= li.endFrame) {
                li.enabled = false
                let notes = this.notes
                    .filter((n) => n.no == li.no && n.frame > frame)
                    .sort((a, b) => a.frame - b.frame)
                result.push(notes[0])
            }
        }
        return result
    }

    disConnect(no: number) {
        if (no == 0) return false
        this.notes.filter((n) => n.no == no).forEach((n) => n.disabling())
        let li = this.longInfo.find((x) => x.no == no)
        if (li) li.enabled = false
    }

    reset() {
        this.notes.forEach((n) => n.reset())
    }

    setOffset(offset: number) {
        this.offset = offset
    }

    get length() {
        return this.notes.length
    }

    get totalScore() {
        return this.notes.reduce((a, c) => a + c.score, 0)
    }

    get perfectnum() {
        return this.notes.filter((n) => n.result == "perfect").length
    }

    pick(moment: number) {
        return this.notes.filter((n) => {
            let base = moment * 30 - this.offset
            return base <= n.frame && n.frame < base + 30
        })
    }
}

class Music {
    level: number
    name: string
    coefficient: number
    difficulity: IDifficult
    liveType: ILiveType
    decreaseLife: IDecreaseLife
    musictime: number
    offset: number
    notes: INote[]

    constructor(score: IScore) {
        this.name = score.name
        this.level = score.level
        this.difficulity = score.difficulity
        this.musictime = score.musictime
        this.offset = score.offset
        this.notes = score.notes

        switch (score.difficulity) {
            case "piano":
            case "forte":
                this.liveType = "grand"
                break

            default:
                this.liveType = "normal"
                break
        }
        this.decreaseLife = DECREASE_LIFE[this.liveType]

        if (this.level in CONF) {
            this.coefficient = CONF[this.level]
        } else {
            this.coefficient = 2
        }
    }

    score() {
        return new Score(this.notes, this.offset)
    }

    setMusictime(time: number) {
        this.musictime = time
        $("#musictime").val(time)
    }

    notesLife(note: INote) {
        switch (this.liveType) {
            case "grand":
                return this.decreaseLife[note.type]

            case "normal":
                if (note.no != 0) {
                    return this.decreaseLife.long
                }
                return this.decreaseLife[note.type]
        }
    }
}

export class Simulator {
    unit: Unit
    score: Score
    appeal: number
    combo: number
    combos: number[]
    lifes: number[]
    unitlife: number
    skills: activeSkill[]
    isGrand: boolean
    music: Music
    dangerMoment: number

    default_score: string
    scoreList: Record<string, string>

    constructor(unit: Unit, appeal: number, isGrand: boolean) {
        this.unit = unit
        this.score = new Score([], 0)
        this.appeal = appeal
        this.combo = 0
        this.combos = []
        this.lifes = []
        this.unitlife = LIFE_DEFAULT
        this.skills = []
        this.isGrand = isGrand
        this.music = new Music(DAMY_SCORE)
        this.dangerMoment = 0

        this.default_score = isGrand ? SCORE_DEFAULT_GRAND : SCORE_DEFAULT_NORMAL
        this.scoreList = isGrand ? SCORES_GRAND : SCORES_NORMAL

        this.init()
        this.fetch(this.default_score)
    }

    fetch(filename: string) {
        fetch(filename)
            .then(function (r) {
                return r.json()
            })
            .then((data: IScore) => {
                this.music = new Music(data)
                this.score = this.music.score()

                this.setnotesbar()
                this.unit.disp()
            })
            .catch((e) => {
                //console.log(e)
            })
    }

    setnotesbar() {
        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            let noteslength = this.score.pick(moment).length
            if (noteslength > 10) noteslength = 10
            $(`#notes_${moment}`).attr("class", "notes").addClass(`notenum_${noteslength}`)
        }
    }

    init() {
        for (let opt of keyof(this.scoreList)) {
            $("<option></option>").html(opt).val(this.scoreList[opt]).appendTo("#simulator_music")
        }

        let _this = this
        $("#simulator_music").change(function () {
            _this.fetch(String($(this).val()!))
        })
    }

    setOffset(offset: number) {
        this.score.setOffset(offset)
    }

    setAppeal(appeal: number) {
        this.appeal = appeal
    }

    setMusictime(time: number) {
        this.music.setMusictime(time)
    }

    setSkill(skills: activeSkill[]) {
        this.skills = skills
        this.calc()
    }

    reset() {
        this.combo = 0
        this.combos = []
        this.lifes = []
        this.dangerMoment = 0
        this.score.reset()
        $(".notes").removeClass("notes_perfect notes_miss notes_danger")
        $(".life").attr("style", "")
        $(".lifestate").attr("class", "lifestate")
    }

    resetCombo() {
        if (this.combo) this.combos.push(this.combo)
        this.combo = 0
    }

    basicValue() {
        return (this.appeal * this.music.coefficient) / this.score.length
    }

    combobonus() {
        let allnote = this.score.length
        if (this.combo >= Math.floor(allnote * 0.9)) return 2.0
        if (this.combo >= Math.floor(allnote * 0.8)) return 1.7
        if (this.combo >= Math.floor(allnote * 0.7)) return 1.5
        if (this.combo >= Math.floor(allnote * 0.5)) return 1.4
        if (this.combo >= Math.floor(allnote * 0.25)) return 1.3
        if (this.combo >= Math.floor(allnote * 0.1)) return 1.2
        if (this.combo >= Math.floor(allnote * 0.05)) return 1.1
        return 1.0
    }

    calc() {
        this.reset()
        for (let [moment, skill] of this.skills.entries()) {
            if (skill.support >= 4) {
                this.perfect(moment, skill)
            } else if (skill.guard > 0) {
                this.guard(moment)
            } else {
                this.miss(moment)
            }
        }
        this.resetCombo()
        this.dispLife()

        let result = `シミュレータ(β): ${this.music.name}<br>
        スコア: ${this.score.totalScore}<br>
        必要ライフ: ${this.unitlife}<br>
        miss区間：${this.dangerMoment / 2}秒`
        $("#simulator").html(result)
    }

    dispLife() {
        let lifeSimu: number[] = []
        let life = 0
        for (let l of this.lifes) {
            life -= l
            lifeSimu.push(life)
        }
        let requiredLife = Math.max(...lifeSimu) + 1
        this.unitlife = requiredLife

        let unitlife = Math.max(requiredLife, LIFE_DEFAULT)
        life = unitlife

        $("#menu_life").html(`ライフ<br>(${life})`)

        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            life += this.lifes[moment]
            if (life > unitlife * 2) life = unitlife * 2

            let percent = Math.ceil((life * 100) / (unitlife * 2))
            if (percent > 100) percent = 100
            if (percent < 0) percent = 0

            if (percent > 50) {
                percent = (percent - 50) * 2
                $(`#life_${moment}`).attr(
                    "style",
                    `background:linear-gradient(to right, deepskyblue, deepskyblue ${percent}%, limegreen ${percent}%, limegreen);`
                )
            } else if (percent > 0) {
                percent = percent * 2
                $(`#life_${moment}`).attr(
                    "style",
                    `background:linear-gradient(to right, limegreen, limegreen ${percent}%, white ${percent}%, white);`
                )
            } else {
                $(`#life_${moment}`).attr("style", `background-color:lightsalmon;`)
            }
        }
    }

    perfect(moment: number, bonus: activeSkill) {
        let score = (100 + bonus.score) / 100
        let combo = (100 + bonus.combo) / 100
        let slide = (100 + bonus.slide) / 100

        let life = 0

        let notes = this.score.pick(moment)
        for (let n of notes) {
            if (!n.enabled) {
                n.result = "gone"
                continue
            }
            this.combo++
            let skill_scorebonus = n.no && this.isGrand ? Math.max(score, slide) : score
            let combobonus = this.combobonus()
            let skill_combobonus = this.combo == 1 ? 1 : combo

            n.score = Math.round(
                this.basicValue() * skill_scorebonus * skill_combobonus * combobonus
            )
            n.result = "perfect"
            life += bonus.heal
        }
        this.lifes.push(life)
        $(`#notes_${moment}`).addClass(`notes_perfect`)
    }

    disConnectLong(moment: number) {
        let life = 0
        let notes = this.score.interruptSupport(moment)
        for (let n of notes) {
            life -= this.music.notesLife(n)
        }
        return life
    }

    guard(moment: number) {
        let life = this.disConnectLong(moment)
        let isReset = life < 0

        let notes = this.score.pick(moment)
        for (let n of notes) {
            if (!n.enabled) {
                n.result = "gone"
                continue
            }
            n.result = "guard"
            isReset = true
            this.score.disConnect(n.no)
        }
        if (isReset) this.resetCombo()
        this.lifes.push(0)
        $(`#notes_${moment}`).addClass(`notes_miss`)
    }

    miss(moment: number) {
        let life = this.disConnectLong(moment)
        let isReset = life < 0

        let notes = this.score.pick(moment)

        if (moment < this.music.musictime * 2) {
            this.dangerMoment++
        }

        for (let n of notes) {
            if (!n.enabled) {
                n.result = "gone"
                continue
            }
            n.result = "miss"
            isReset = true
            this.score.disConnect(n.no)

            let l = this.music.notesLife(n)
            life -= l
        }
        this.lifes.push(life)
        if (isReset) this.resetCombo()
        $(`#lifestate_${moment}`).addClass(`danger`)
        $(`#notes_${moment}`).addClass(`notes_danger`)
    }
}
