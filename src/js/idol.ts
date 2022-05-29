import { keyof, atimes } from "./data/data"
import { cards } from "./data/idol"
import { SkillList } from "./skill2"

export class Idol {
    name: string
    attr: IAttr
    interval: number
    per: string
    secper: string
    type: ISkillName
    atime: number
    skill: ISkill2

    constructor(data: IidolProfile) {
        let type = data[4]
        let skill = SkillList[type]

        // skill.attr = data[1]
        // skill.target = data[1]

        this.name = data[0]
        this.attr = data[1]
        this.interval = data[2]
        this.per = data[3]
        this.secper = data[2] + data[3]
        this.type = type

        if (this.secper in atimes[skill.atype]) {
            this.atime = atimes[skill.atype][this.secper]
        } else {
            console.warn(this.secper + "に該当するデータが存在しません")
            this.atime = 0
        }
        this.skill = skill
    }

    copy() {
        return new Idol([this.name, this.attr, this.interval, this.per, this.type])
    }

    get isdamy() {
        return this.name == "damy"
    }

    get isEncore() {
        return this.type == "encore"
    }

    get isRefrain() {
        return this.type == "refrain"
    }

    get isMagic() {
        return this.type == "magic"
    }

    get isCopy() {
        return this.isEncore || this.isRefrain
    }

    get isRezo() {
        return this.type == "motif"
    }

    isActiveTiming(sec: number, unitno: number, musictime: number, isGrand: boolean) {
        let mod = [2, 1, 0][unitno]

        let isTiming = sec % this.interval == 0
        let isNotFirst = sec >= this.interval
        let isMyTurn = !isGrand || (sec / this.interval) % 3 == mod
        let isNotNearEnd = sec <= musictime - 3

        return isTiming && isNotFirst && isMyTurn && isNotNearEnd
    }

    isActive(moment: number, unitno: number, musictime: number, isGrand: boolean) {
        let m = moment % (this.interval * 2)
        let sec = Math.floor(moment / 2)
        let turn = Math.floor(sec / this.interval)
        let startsec = turn * this.interval
        let mod = [2, 1, 0][unitno]

        if (m >= this.atime) return false
        if (!turn) return false
        if (turn % 3 != mod && isGrand) return false
        if (startsec > musictime - 3) return false
        return true
    }
}

export const idols: Record<string, Idol> = {}
export const damyidol = new Idol(["damy", "cu", 7, "無", "none"])

for (let type of keyof(cards)) {
    for (let card of cards[type]) {
        //card.push(type)
        idols[card[0]] = new Idol(card)
    }
}
idols["damy"] = damyidol
