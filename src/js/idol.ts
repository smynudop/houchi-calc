import { keyof, atimes } from "./data/data"
import { cards } from "./data/idol"
import { SkillList } from "./skill"

export class Idol {
    name: string
    attr: IAttr
    interval: number
    per: string
    secper: string
    type: ISkillName
    atime: number
    skill: ISkill
    isEternal: boolean = false
    /** ユニット番号 */
    unitno: number = 0
    /** 全体の通し番号 */
    no: number = 0

    constructor(data: IdolProfile) {
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
        this.isEternal = skill.atype == "eternal"
    }


    get isRezo() {
        return this.type == "motif"
    }

    /**
     * 起動タイミングかどうか
     * @param sec 
     * @param unitno 
     * @param musictime 
     * @param isGrand 
     * @returns 
     */
    isActiveTiming(sec: number, isGrand: boolean) {
        if (this.isEternal) {
            return sec == 0
        }

        let mod = [2, 1, 0][this.unitno]

        let isTiming = sec % this.interval == 0
        let isNotFirst = sec >= this.interval
        let isMyTurn = !isGrand || (sec / this.interval) % 3 == mod

        return isTiming && isNotFirst && isMyTurn
    }

    executeSkill(prop: SkillExecuteProp) {
        return {
            no: this.no,
            unitno: this.unitno,
            atime: this.atime,
            skill: this.skill.execute(prop)
        }
    }
}

export const idols: Map<string, Idol> = new Map
export const damyidol = new Idol(["damy", "cu", 7, "無", "none"])

for (let type of keyof(cards)) {
    for (let card of cards[type]) {
        //card.push(type)
        idols.set(card[0], new Idol(card))
    }
}
idols.set("damy", damyidol)
