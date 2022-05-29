type SkillEffect = Partial<activeSkill>
type ActivateSkill = (life: number) => SkillEffect
type ApplySkill = (life: number) => ApplyResult

interface ApplyResult {
    result: SkillEffect
    activatedSkill: ActivateSkill[]
}

interface ApplyResultLog {
    time: number
    position: number
    result: ApplySkill
}

type ISkill2 = {
    type: ISkillName
    activeSkill: SkillEffect
    isMagic: boolean
    activate(): (life: number) => SkillEffect
    apply(
        activateSkillList: ActivateSkill[],
        ApplyResutLogs: ApplyResultLog[],
        skills: ISkill2[]
    ): ApplySkill
}

class Skill2 implements ISkill2 {
    type: ISkillName
    activeSkill: SkillEffect
    isMagic: boolean

    constructor(type: ISkillName, activeSkill: SkillEffect) {
        this.type = type
        this.activeSkill = activeSkill
        this.isMagic = false
    }

    activate(): (life: number) => SkillEffect {
        return (life: number) => {
            return this.activeSkill
        }
    }

    apply(): ApplySkill {
        const activate = this.activate()

        return (life: number) => {
            return {
                result: activate(life),
                activatedSkill: [activate],
            }
        }
    }
}

class Refrain implements ISkill2 {
    type: ISkillName
    activeSkill: SkillEffect
    isMagic: boolean

    constructor() {
        this.type = "refrain"
        this.activeSkill = {}
        this.isMagic = false
    }

    activate(): (life: number) => SkillEffect {
        return (life: number) => {
            return {}
        }
    }

    apply(activateSkillList: ActivateSkill[]) {
        return (life: number) => {
            const skillList = activateSkillList.map((s) => s(life))
            let score = ActivateSkillHelper.max(skillList, "score")
            let combo = ActivateSkillHelper.max(skillList, "combo")

            let result: SkillEffect = {
                score: score,
                combo: combo,
            }
            return {
                result: result,
                activatedSkill: [],
            }
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
    activeSkill: SkillEffect
    isMagic: boolean

    constructor() {
        this.type = "encore"
        this.activeSkill = {}
        this.isMagic = false
    }

    activate(): (life: number) => SkillEffect {
        return (life: number) => {
            return {}
        }
    }

    apply(activateSkillList: ActivateSkill[], applyResutLogs: ApplyResultLog[]): ApplySkill {
        if (appliedSkillList.length == 0) {
            return (life: number) => {
                return {
                    result: {},
                    activatedSkill: [],
                }
            }
        }

        applyResutLogs = applyResutLogs
            .slice()
            .sort((a, b) => a.time - b.time || a.position - b.position || 0)
        return applyResutLogs.reverse()[0].result
    }
}

class Magic implements ISkill2 {
    type: ISkillName
    activeSkill: SkillEffect
    isMagic: boolean

    constructor() {
        this.type = "magic"
        this.activeSkill = {}
        this.isMagic = false
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
    ): ApplySkill {
        skills = skills.filter((s) => !s.isMagic)
        const applySkills = skills.map((s) => s.apply(activateSkillList, applyResutLogs, skills))

        return (life: number) => {
            const applyResults = applySkills.map((s) => s(life))

            const results = applyResults.map((r) => r.result)
            const activeSkills = applyResults.map((r) => r.activatedSkill)

            return {
                result: ActivateSkillHelper.calcmax(results),
                activatedSkill: activeSkills[0],
            }
        }
    }
}

class ActivateSkillHelper {
    static max(skills: Partial<SkillEffect>[], frame: keyof SkillEffect): number {
        let result = 0
        for (let skill of skills) {
            const value = skill[frame]
            if (value == undefined) {
                continue
            }
            result = Math.max(result, value)
        }
        return result
    }

    static calcmax(skills: Partial<ActivateSkill>[]): Partial<ActivateSkill> {
        return skills[0]
    }
}

const SkillList: Record<ISkillName, ISkill2> = {
    support: new Skill2("support", { support: 3 }),
    tuning: new Skill2("tuning", { support: 2, combo: 12 }),

    heal: new Skill2("heal", { heal: 3 }),
    synergy: new Skill2("synergy", { score: 16, combo: 15, heal: 1 }),
    allround: new Skill2("allround", { combo: 13, heal: 1 }),
    ssrguard: new Skill2("guard", { guard: 1 }),
    guard: new Skill2("guard", { guard: 1 }),

    symfony: new Skill2("symfony", { boost: 0.5, cover: 1 }),
    boost: new Skill2("boost", { boost: 0.2, cover: 1 }),
    srboost: new Skill2("srboost", { boost: 0.1, cover: 1 }),

    motif: new Skill2("motif", { score: 18 }),

    concent: new Skill2("concent", { score: 22 }),
    slideact: new Skill2("slideact", { score: 10, slide: 40 }),

    combona: new Skill2("combona", { combo: 18 }),
    coode: new Skill2("coode", { score: 10, combo: 15 }),

    encore: new Encore(),
    refrain: new Refrain(),
    magic: new Magic(),

    none: new Skill2("none", {}),
}

//こんな感じで処理がしたいなあ
// @ts-ignore
const appliedSkillList = skills.map((s) => s.apply(activatedSkillList, UnitSkills)(life))
