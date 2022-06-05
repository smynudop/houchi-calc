import { SkillHelper } from "./skillHelper"

class Skill2 implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: IATime

    constructor(type: ISkillName, nameja: string, activeSkill: Buff, atype: IATime) {
        this.type = type
        this.nameja = nameja
        this.activeSkill = activeSkill
        this.isMagic = false
        this.isEncore = false
        this.atype = atype
    }

    execute(): Ability {
        const skillEffect = {
            name: this.type,
            nameja: this.nameja,
            ...this.activeSkill,
        }

        const result: AbilityResponse = {
            isMagic: false,
            activateBuffs: [skillEffect],
            applyBuff: skillEffect,
        }

        return {
            name: this.type,
            nameja: this.nameja,
            isMagic: false,
            isEncoreTarget: true,
            message: `${this.nameja}が発動しました`,
            exec: (life: number) => result,
        }
    }
}

class Refrain implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: IATime

    constructor() {
        this.type = "refrain"
        this.nameja = "リフレ"
        this.activeSkill = {}
        this.isMagic = false
        this.isEncore = false
        this.atype = "m"
    }

    execute(applyBuffList: Buff[]): Ability {
        const skillEffect = {
            name: this.type,
            nameja: this.nameja,
            score: SkillHelper.max(applyBuffList, "score"),
            combo: SkillHelper.max(applyBuffList, "combo"),
        }

        const result: AbilityResponse = {
            isMagic: false,
            activateBuffs: [],
            applyBuff: skillEffect,
        }

        return {
            name: this.type,
            nameja: this.nameja,
            isMagic: false,
            isEncoreTarget: true,
            message: `リフレインが発動しました。スコア${skillEffect.score}%, コンボ${skillEffect.combo}%`,
            exec: (life: number) => result,
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

class Encore implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: IATime

    constructor() {
        this.type = "encore"
        this.nameja = "アンコ"
        this.activeSkill = {}
        this.isMagic = false
        this.isEncore = true
        this.atype = "s"
    }

    execute(applyBuffList: Buff[], encoreAbility: MaybeAbility, magicSkillList: ISkill[]): Ability {
        if (encoreAbility == null) {
            return {
                name: this.type,
                nameja: this.nameja,
                isMagic: false,
                isEncoreTarget: false,
                message: "模倣対象がなかったため、アンコールは発動しません。",
                exec: (life: number) => {
                    return {
                        isMagic: false,
                        applyBuff: null,
                        activateBuffs: [],
                        isEncoreTarget: false,
                    }
                },
            }
        }

        const exec = (life: number) => {
            const result = encoreAbility.exec(life)
            if (result.applyBuff != null) {
                result.applyBuff.nameja = `アンコール(${result.applyBuff.nameja})`
            }
            return result
        }

        return {
            name: this.type,
            nameja: `アンコール(${encoreAbility.nameja})`,
            isMagic: false,
            isEncoreTarget: false,
            message: `アンコールは${encoreAbility.nameja}を模倣しました。${encoreAbility.message}`,
            exec: exec,
        }
    }
}

class Magic implements ISkill {
    type: ISkillName
    nameja: string

    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: IATime

    constructor() {
        this.type = "magic"
        this.nameja = "マジック"
        this.activeSkill = {}
        this.isMagic = true
        this.isEncore = false
        this.atype = "sp"
    }

    execute(
        applyTargetList: Buff[],
        encoreAbility: MaybeAbility,
        magicSkillList: ISkill[]
    ): Ability {
        let executeSkills = magicSkillList.filter((s) => !s.isMagic && s.type != "none")

        if (encoreAbility == null || encoreAbility.isMagic) {
            executeSkills = executeSkills.filter((s) => !s.isEncore)
        }

        if (executeSkills.length == 0) {
            const exec = (life: number) => {
                return {
                    applyBuff: null,
                    activateBuffs: [],
                    isMagic: true,
                    isEncoreTarget: false,
                }
            }
            return {
                name: "none",
                nameja: "",
                isMagic: false,
                isEncoreTarget: false,
                message: "発動対象がなかったため、マジックは発動しません。",
                exec: exec,
            }
        }

        const abilities = executeSkills.map((s) =>
            s.execute(applyTargetList, encoreAbility, magicSkillList)
        )

        const exec = (life: number) => {
            const responses = abilities.map((s) => s.exec(life)).filter((s) => !s.isMagic)

            const activateBuffs = responses.flatMap((s) => s.activateBuffs)
            const applyBuff = {
                name: this.type,
                nameja: this.nameja,
                ...SkillHelper.calcmax(responses.map((s) => s.applyBuff)),
            }

            return {
                isMagic: true,
                activateBuffs: activateBuffs,
                applyBuff: applyBuff,
                isEncoreTarget: true,
            }
        }

        const skillNames = abilities.map((s) => s.nameja).join("、")
        const messages = abilities.map((s) => "[マジック]" + s.message).join("\n")

        return {
            name: this.type,
            nameja: this.nameja,
            isMagic: true,
            isEncoreTarget: true,
            message: `マジックは${skillNames}を発動しました。\n${messages}`,
            exec: exec,
        }
    }
}

export const SkillList: Record<ISkillName, ISkill> = {
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
