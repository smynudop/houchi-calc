import { Unit } from "./houchi"
import { keyof } from "./data/data"
import {
    SCORES_GRAND,
    SCORES_NORMAL,
    SCORE_DEFAULT_GRAND,
    SCORE_DEFAULT_NORMAL,
} from "./data/score"
import { LIFE_DEFAULT, MUSIC_MAXTIME, CONF, DECREASE_LIFE } from "./data/constants"

class Score {
    notes: INote[]
    offset: number
    longInfo: { [key: number]: LongInfo }

    constructor(notes: INote[], offset: number) {
        this.notes = notes
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
                    .filter((n) => n.no == k && n.frame > frame)
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
    decreaseLife: IDecreaseLife
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

            default:
                this.liveType = "normal"
                break
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
        $("#musictime").val(time)
    }

    notesLife(note: INote) {
        let result
        switch (this.liveType) {
            case "grand":
                //短フリックはタップ扱い
                if (note.no == 0) {
                    return this.decreaseLife.tap
                }
                result = this.decreaseLife[note.type]

            case "normal":
                if (note.no != 0) {
                    result = this.decreaseLife.long
                }
                result = this.decreaseLife[note.type]
        }
        if (result === undefined) {
            console.warn("ライフが取得できません", note.type)
        }
        return result
    }
}

export class Simulator {
    unit: Unit
    notes: Score
    appeal: number
    combo: number
    combos: number[]
    life: number
    lifes: number[]
    unitlife: number
    skills: FinallyAbility[]
    isGrand: boolean
    music: Music
    dangerMoment: number

    constructor(unit: Unit, appeal: number, isGrand: boolean) {
        this.unit = unit
        this.notes = new Score([], 0)
        this.appeal = appeal
        this.combo = 0
        this.combos = []
        this.life = 1000
        this.lifes = []
        this.unitlife = LIFE_DEFAULT
        this.skills = []
        this.isGrand = isGrand
        this.music = new Music()
        this.dangerMoment = 0

        this.init()
        this.load()
    }

    load() {
        if (this.isGrand) {
            this.fetch(SCORE_DEFAULT_GRAND)
        } else {
            this.fetch(SCORE_DEFAULT_NORMAL)
        }
    }

    fetch(filename: string) {
        fetch(filename)
            .then(function (r) {
                return r.json()
            })
            .then((json) => {
                this.notes = new Score(json.notes, json.offset)
                this.music.set(json.name, json.level, json.difficulity)
                this.music.setMusictime(json.musictime)
                this.setnotesbar()
                this.unit.disp()
            })
            .catch((e) => {
                //console.log(e)
            })
    }

    setnotesbar() {
        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            let noteslength = this.notes.pick(moment).length
            if (noteslength > 10) noteslength = 10
            $(`#notes_${moment}`).attr("class", "notes").addClass(`notenum_${noteslength}`)
        }
    }

    init() {
        let opts = this.isGrand ? SCORES_GRAND : SCORES_NORMAL
        for (let opt of keyof(opts)) {
            $("<option></option>").html(opt).val(opts[opt]).appendTo("#simulator_music")
        }

        let _this = this
        $("#simulator_music").change(function () {
            _this.fetch(String($(this).val()!))
        })
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

    setAppeal(appeal: number) {
        this.appeal = appeal
    }

    setMusictime(time: number) {
        this.music.setMusictime(time)
    }

    setSkill(skills: FinallyAbility[]) {
        this.skills = skills
        this.calc()
    }

    reset() {
        this.combo = 0
        this.combos = []
        this.life = 1000
        this.lifes = []
        this.dangerMoment = 0
        this.notes.reset()
        $(".notes").removeClass("notes_perfect notes_miss notes_danger")
        $(".life").attr("style", "")
        $(".lifestate").attr("class", "lifestate")
    }

    resetCombo() {
        if (this.combo) this.combos.push(this.combo)
        this.combo = 0
    }

    get basicValue() {
        return (this.appeal * this.music.coefficient) / this.notes.length
    }

    get combobonus() {
        let allnote = this.notes.length
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
        for (let moment = 0; moment < this.skills.length; moment++) {
            let skill = this.skills[moment](this.life)
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
        スコア: ${this.totalScore}<br>
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

    perfect(moment: number, bonus: RequiredBuff) {
        let score = (100 + bonus.score) / 100
        let combo = (100 + bonus.combo) / 100
        let slide = (100 + bonus.slide) / 100

        let life = 0

        let notes = this.notes.pick(moment)
        for (let n of notes) {
            if (!this.notes.isContinue(n.no)) {
                n.result = "gone"
                continue
            }
            this.combo++
            let skill_scorebonus = n.no && this.isGrand ? Math.max(score, slide) : score
            let combobonus = this.combobonus
            let skill_combobonus = this.combo == 1 ? 1 : combo

            n.score = Math.round(this.basicValue * skill_scorebonus * skill_combobonus * combobonus)
            n.result = "perfect"
            life += bonus.heal
        }
        this.lifes.push(life)
        $(`#notes_${moment}`).addClass(`notes_perfect`)
    }

    disConnectLong(moment: number) {
        let life = 0
        let notes = this.notes.disConnectLong(moment)
        for (let n of notes) {
            life -= this.music.notesLife(n)
        }
        return life
    }

    guard(moment: number) {
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
        if (isReset) this.resetCombo()
        this.lifes.push(0)
        $(`#notes_${moment}`).addClass(`notes_miss`)
    }

    miss(moment: number) {
        let life = this.disConnectLong(moment)
        let isReset = life < 0

        let notes = this.notes.pick(moment)

        if (moment < this.music.musictime * 2) {
            this.dangerMoment++
        }

        for (let n of notes) {
            if (!this.notes.isContinue(n.no)) {
                n.result = "gone"
                continue
            }
            n.result = "miss"
            isReset = true
            this.notes.disConnect(n.no)

            let l = this.music.notesLife(n)
            life -= l
        }
        this.lifes.push(life)
        if (isReset) this.resetCombo()
        $(`#lifestate_${moment}`).addClass(`danger`)
        $(`#notes_${moment}`).addClass(`notes_danger`)
    }
}
