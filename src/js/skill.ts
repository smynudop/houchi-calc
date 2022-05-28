import { keyof, skilltypes, Iatype } from "./data"
import { IboostEffect } from "./houchi"

export class Skill {
    name: string
    nameja: string
    atype: Iatype
    score: number
    combo: number
    boost: number
    support: number
    heal: number
    isheal: boolean
    cover: number
    guard: number
    slide: number

    hastarget: boolean

    attr: string
    target: string
    constructor(data: Partial<Skill>) {
        this.name = data.name || "none"
        this.nameja = data.nameja || "なし"
        this.atype = data.atype || "m"
        this.score = data.score || 0
        this.combo = data.combo || 0
        this.boost = data.boost || 0
        this.support = data.support || 0
        this.heal = data.heal || 0
        this.isheal = data.isheal || false
        this.cover = data.cover || 0
        this.guard = data.guard || 0
        this.slide = data.slide || 0
        this.hastarget = data.hastarget || false

        this.attr = data.attr || ""
        this.target = data.target || ""
    }

    boostEffect(effect: IboostEffect) {
        let newskill = this.copy()

        let per = effect.boost + 1
        newskill.score = Math.ceil(newskill.score * per)
        newskill.combo = Math.ceil(newskill.combo * per)
        newskill.slide = Math.ceil(newskill.slide * per)
        newskill.heal = Math.ceil(newskill.heal * per)
        if (newskill.support) {
            newskill.support += effect.cover || 0
        }
        if (newskill.isheal) {
            newskill.heal += effect.cover || 0
        }

        return newskill
    }

    copy() {
        return new Skill(this)
    }
}

export type IskillFrame = keyof Skill

export const skillList: {
    [k: string]: Skill
} = {}

export type skillLike = {
    name: string
    num: number
}

for (let key of keyof(skilltypes)) {
    let s = new Skill(skilltypes[key])
    skillList[key] = s
}
