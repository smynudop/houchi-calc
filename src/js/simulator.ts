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

export class Music {
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
        this.notes = data.notes?.map(n => { return { ...n, score: 0, result: "unset" } }) ?? []
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
            n.result = "unset"
        })
        for (let [k, info] of this.longInfo) {
            info.isContinue = true
        }
    }

    getLifeOfNote(note: INote) {
        return this.decreaseLife[note.type]
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
        let damage = 0
        for (let [key, info] of this.longInfo) {
            if (!info.isContinue) continue
            if (info.begin <= frame && frame <= info.end) {
                info.isContinue = false
                let notes = this.notes
                    .filter((n) => n.no == key && n.frame >= frame)
                    .sort((a, b) => a.frame - b.frame)

                for (let i = 0; i < notes.length; i++) {
                    if (i == 0) notes[i].result = "miss"
                    else notes[i].result = "gone"
                }
                result.push(notes[0])
                damage += this.getLifeOfNote(notes[0])
            }
        }
        return {
            notes: result,
            damage
        }
    }

    isContinue(no: number) {
        if (no == 0) return true
        return this.longInfo.get(no)!.isContinue
    }

    disConnect(no: number) {
        if (no == 0) return;
        this.longInfo.get(no)!.isContinue = false

        for (const note of this.notes.filter(n => n.no == no)) {
            if (note.result == "unset") note.result = "gone"
        }
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
