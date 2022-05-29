import { SkillHelper } from "./skillHelper"

class Skill2 implements ISkill2 {
    type: ISkillName
    nameja: string
    activeSkill: SkillEffect
    isMagic: boolean
    atype: IATime

    constructor(type: ISkillName, nameja: string, activeSkill: SkillEffect, atype: IATime) {
        this.type = type
        this.nameja = nameja
        this.activeSkill = activeSkill
        this.isMagic = false
        this.atype = atype
    }

    activate(): (life: number) => SkillEffect {
        return (life: number) => {
            return this.activeSkill
        }
    }

    apply(): ApplyResponse {
        const activate = this.activate()

        const skill = (life: number) => activate(life)
        return {
            skill: {
                exec: skill,
                name: this.type,
                nameja: this.nameja,
            },
            activatedSkill: [activate],
            isEncore: false,
        }
    }
}

class Refrain implements ISkill2 {
    type: ISkillName
    nameja: string
    activeSkill: SkillEffect
    isMagic: boolean
    atype: IATime

    constructor() {
        this.type = "refrain"
        this.nameja = "リフレ"
        this.activeSkill = {}
        this.isMagic = false
        this.atype = "m"
    }

    activate(): (life: number) => SkillEffect {
        return (life: number) => {
            return {}
        }
    }

    apply(activateSkillList: ActivateSkill[]): ApplyResponse {
        const skill = (life: number) => {
            const skillList = activateSkillList.map((s) => s(life))
            let score = SkillHelper.max(skillList, "score")
            let combo = SkillHelper.max(skillList, "combo")

            return {
                score: score,
                combo: combo,
            }
        }

        return {
            skill: {
                exec: skill,
                name: this.type,
                nameja: this.nameja,
            },
            activatedSkill: [],
            isEncore: false,
        }
    }
}

// class Alternate implements ISkill2 {
//     type: ISkillName
//     activeSkill: SkillEffect
//     isMagic: boolean

//     constructor() {
//         this.type = "alternate"
//         this.activeSkill = {}
//         this.isMagic = false
//     }

//     activate(): (life: number) => SkillEffect {
//         return (life: number) => {
//             return {}
//         }
//     }

//     apply(activateSkillList: ActivateSkill[]) {
//         return (life: number) => {
//             const skillList = activateSkillList.map((s) => s(life))
//             let score = ActivateSkillHelper.max(skillList, "score")

//             score = Math.ceil(score * 1.7)

//             let result: SkillEffect = {}
//             if (score > 0) {
//                 result = {
//                     score: score,
//                     combo: -20,
//                 }
//             }
//             return {
//                 result: result,
//                 activatedSkill: [],
//             }
//         }
//     }
// }

class Encore implements ISkill2 {
    type: ISkillName
    nameja: string
    activeSkill: SkillEffect
    isMagic: boolean
    atype: IATime

    constructor() {
        this.type = "encore"
        this.nameja = "アンコ"
        this.activeSkill = {}
        this.isMagic = false
        this.atype = "s"
    }

    activate(): (life: number) => SkillEffect {
        return (life: number) => {
            return {}
        }
    }

    apply(activateSkillList: ActivateSkill[], applyResutLogs: ApplyResultLog[]): ApplyResponse {
        let order = [9, 7, 6, 8, 10, 4, 2, 1, 3, 5, 14, 12, 11, 13, 15]

        applyResutLogs = applyResutLogs
            .filter((x) => !x.result.isEncore)
            .sort((a, b) => a.time - b.time || order[b.position] - order[a.position] || 0)

        if (applyResutLogs.length == 0) {
            return {
                skill: DAMY_APPLY_SKILL,
                activatedSkill: [],
                isEncore: true,
            }
        }

        let log = applyResutLogs.reverse()[0]
        let target = log.result

        console.log(
            `アンコールは${log.time}秒,${log.position}の${target.skill.nameja}を模倣先に選択しました。`
        )
        return {
            skill: {
                name: target.skill.name,
                nameja: `アンコール(${target.skill.nameja})`,
                exec: target.skill.exec,
            },
            isEncore: true,
            activatedSkill: target.activatedSkill,
        }
    }
}

class Magic implements ISkill2 {
    type: ISkillName
    nameja: string

    activeSkill: SkillEffect
    isMagic: boolean
    atype: IATime

    constructor() {
        this.type = "magic"
        this.nameja = "マジック"
        this.activeSkill = {}
        this.isMagic = true
        this.atype = "sp"
    }

    activate(): (life: number) => SkillEffect {
        return (life: number) => {
            return {}
        }
    }

    apply(
        activateSkillList: ActivateSkill[],
        applyResutLogs: ApplyResultLog[],
        skills: ISkill2[]
    ): ApplyResponse {
        skills = skills.filter((s) => !s.isMagic)

        const applyResponses = skills.map((s) => s.apply(activateSkillList, applyResutLogs, skills))

        const applySkills = applyResponses.map((x) => x.skill)
        const activatedSkill = applyResponses.map((x) => x.activatedSkill).flat()

        const skill = (life: number) => {
            const skills = applySkills.map((s) => s.exec(life))
            return SkillHelper.calcmax(skills)
        }

        return {
            skill: {
                exec: skill,
                name: this.type,
                nameja: this.nameja,
            },
            activatedSkill: activatedSkill,
            isEncore: false,
        }
    }
}

export const SkillList: Record<ISkillName, ISkill2> = {
    support: new Skill2("support", "サポート", { support: 3 }, "s"),
    tuning: new Skill2("tuning", "チューン", { support: 2, combo: 12 }, "m"),

    heal: new Skill2("heal", "回復", { heal: 3 }, "ms"),
    synergy: new Skill2("synergy", "シナジー", { score: 16, combo: 15, heal: 1 }, "m"),
    allround: new Skill2("allround", "オルラン", { combo: 13, heal: 1 }, "ms"),
    ssrguard: new Skill2("guard", "ダメガ", { guard: 1 }, "m"),
    guard: new Skill2("guard", "ダメガ", { guard: 1 }, "m"),

    symfony: new Skill2("symfony", "シンフォ", { boost: 0.5, cover: 1 }, "m"),
    boost: new Skill2("boost", "スキブ", { boost: 0.2, cover: 1 }, "l"),
    srboost: new Skill2("srboost", "SRスキブ", { boost: 0.1, cover: 1 }, "m"),

    motif: new Skill2("motif", "モチーフ", { score: 18 }, "m"),

    concent: new Skill2("concent", "コンセ", { score: 22 }, "m"),
    slideact: new Skill2("slideact", "スラアク", { score: 10, slide: 40 }, "ml"),

    combona: new Skill2("combona", "コンボナ", { combo: 18 }, "m"),
    coode: new Skill2("coode", "コーデ", { score: 10, combo: 15 }, "m"),

    encore: new Encore(),
    refrain: new Refrain(),
    magic: new Magic(),

    none: new Skill2("none", "なし", {}, "m"),
}

export const DAMY_APPLY_SKILL: ApplySkill = {
    exec: (life: number) => {
        return {}
    },
    name: "none",
    nameja: "なし",
}
