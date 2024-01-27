import { SkillHelper } from "./skillHelper"

class Skill implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: ATime

    constructor(type: ISkillName, nameja: string, activeSkill: Buff, atype: ATime) {
        this.type = type
        this.nameja = nameja
        this.activeSkill = activeSkill
        this.isMagic = false
        this.isEncore = false
        this.atype = atype
    }

    execute(): Ability | null {
        const skillEffect: SkillEffect = {
            name: this.type,
            nameja: this.nameja,
            ...this.activeSkill,
        }


        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: false,
            isEncoreTarget: true,
            isApplyTarget: true,
            message: `${this.nameja}が発動しました`,
            exec: ({ life }: AbilityExecProp) => skillEffect,
        }
    }
}

class DummySkill extends Skill {
    constructor() {
        super("none", "なし", {}, "m")
    }

    execute(): Ability | null {
        return null
    }
}

class SlideAct extends Skill {

    constructor(type: ISkillName, nameja: string, activeSkill: Buff, atype: ATime) {
        super("slideact", "スラアク", { score: 10 }, "ml")
    }

    execute(): Ability | null {
        const skillEffect: SkillEffect = {
            name: this.type,
            nameja: this.nameja,
            ...this.activeSkill,
        }

        const exec = ({ life, noteType }: AbilityExecProp): SkillEffect => {
            if (noteType == "slide" || noteType == "slideflick") {
                return { name: "slideact", nameja: "スラアク", score: 40 }
            } else {
                return { name: "slideact", nameja: "スラアク", score: 10 }
            }
        }


        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: false,
            isEncoreTarget: true,
            isApplyTarget: true,
            message: `${this.nameja}が発動しました`,
            exec,
        }
    }
}

class Cristal extends Skill {
    canNOTmagicExecute?: boolean | undefined = true
    constructor() {
        super("cristal", "クリヒ", { cut: 0.5 }, "eternal")
    }

    override execute(): Ability | null {
        const ab = super.execute()
        if (!ab) return null
        return {
            ...ab,
            isEncoreTarget: false,
            isApplyTarget: false,
            message: null
        }
    }
}

class Refrain implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: ATime

    constructor() {
        this.type = "refrain"
        this.nameja = "リフレ"
        this.activeSkill = {}
        this.isMagic = false
        this.isEncore = false
        this.atype = "m"
    }

    execute({ applyTargetAbilities }: SkillExecuteProp): Ability {
        const exec: AbilityExecute = (prop: AbilityExecProp) => {
            const applyBuffList = applyTargetAbilities.map(a => a.exec(prop))
            return {
                name: this.type,
                nameja: this.nameja,
                score: SkillHelper.max(applyBuffList, "score"),
                combo: SkillHelper.max(applyBuffList, "combo"),
            }
        }

        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: false,
            isEncoreTarget: true,
            isApplyTarget: false,
            message: `リフレインが発動しました。`,
            exec,
        }
    }
}

class Alternate implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: ATime

    constructor() {
        this.type = "alternate"
        this.nameja = "オルタ"
        this.activeSkill = {}
        this.isMagic = false
        this.isEncore = false
        this.atype = "m"
    }

    execute({ applyTargetAbilities }: SkillExecuteProp): Ability {
        const exec: AbilityExecute = (prop: AbilityExecProp) => {
            const applyBuffList = applyTargetAbilities.map(a => a.exec(prop))
            return {
                name: this.type,
                nameja: this.nameja,
                score: Math.ceil(SkillHelper.max(applyBuffList, "score") * 1.7),
                combo: -20,
            }
        }

        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: false,
            isEncoreTarget: true,
            isApplyTarget: false,
            message: `オルタネイトが発動しました。`,
            exec,
        }
    }
}

class Mutual implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: ATime

    constructor() {
        this.type = "mutual"
        this.nameja = "ミュー"
        this.activeSkill = {}
        this.isMagic = false
        this.isEncore = false
        this.atype = "m"
    }

    execute({ applyTargetAbilities }: SkillExecuteProp): Ability {

        const exec: AbilityExecute = (prop: AbilityExecProp) => {
            const applyBuffList = applyTargetAbilities.map(a => a.exec(prop))

            return {
                name: this.type,
                nameja: this.nameja,
                score: -20,
                combo: Math.ceil(SkillHelper.max(applyBuffList, "combo") * 1.7),
            }
        }

        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: false,
            isEncoreTarget: true,
            isApplyTarget: false,
            message: `ミューチャルが発動しました。`,
            exec,
        }
    }
}

class Encore implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: ATime

    constructor() {
        this.type = "encore"
        this.nameja = "アンコ"
        this.activeSkill = {}
        this.isMagic = false
        this.isEncore = true
        this.atype = "s"
    }

    execute({ encoreAbility }: SkillExecuteProp): Ability | null {
        if (encoreAbility == null) {
            return null
        }

        return {
            ...encoreAbility,
            type: this.type,
            nameja: `アンコール(${encoreAbility.nameja})`,
            executeType: encoreAbility.executeType,
            isMagic: false,
            isEncoreTarget: false,
        }
    }
}

class Magic implements ISkill {
    type: ISkillName
    nameja: string

    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: ATime
    canNOTmagicExecute?: boolean | undefined = true

    constructor() {
        this.type = "magic"
        this.nameja = "マジック"
        this.activeSkill = {}
        this.isMagic = true
        this.isEncore = false
        this.atype = "sp"
    }

    execute(prop: SkillExecuteProp): Ability | null {

        let executeSkills = prop.magicSkillList.filter((s) => !s.canNOTmagicExecute && s.type != "none")

        const abilities = executeSkills.map((s) => s.execute(prop))
            .filter((a): a is Ability => a != null)
            .filter(a => a.executeType != "magic")

        if (abilities.length) {
            return null
        }

        const skillNames = abilities.map((s) => s.nameja).join("、")
        const messages = abilities.map((s) => "[マジック]" + s.message).join("\n")

        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: true,
            isEncoreTarget: true,
            isApplyTarget: false,
            message: `マジックは${skillNames}を発動しました。\n${messages}`,
            exec: (prop: AbilityExecProp) => { return { name: "magic", nameja: "マジック" } },
            childAbilities: abilities
        }
    }
}

export const SkillList: Record<ISkillName, ISkill> = {
    support: new Skill("support", "サポート", { support: 3 }, "s"),
    tuning: new Skill("tuning", "チューン", { support: 2, combo: 12 }, "m"),

    heal: new Skill("heal", "回復", { heal: 3 }, "ms"),
    synergy: new Skill("synergy", "シナジー", { score: 16, combo: 15, heal: 1 }, "m"),
    allround: new Skill("allround", "オルラン", { combo: 13, heal: 1 }, "ms"),
    ssrguard: new Skill("guard", "ダメガ", { cut: 1 }, "l"),
    guard: new Skill("guard", "ダメガ", { cut: 1 }, "m"),

    symfony: new Skill("symfony", "シンフォ", { boost: 0.5, boost2: 0.2, cover: 1 }, "m"),
    ensemble: new Skill("ensemble", "アンサン", { boost: 0.5 }, "m"),
    boost: new Skill("boost", "スキブ", { boost: 0.2, boost2: 0.2, cover: 1 }, "l"),
    srboost: new Skill("srboost", "SRスキブ", { boost: 0.1, boost2: 0.1, cover: 1 }, "m"),

    motif: new Skill("motif", "モチーフ", { score: 18 }, "m"),

    concent: new Skill("concent", "コンセ", { score: 22 }, "m"),
    slideact: new Skill("slideact", "スラアク", { score: 10 }, "ml"),

    combona: new Skill("combona", "コンボナ", { combo: 18 }, "m"),
    coode: new Skill("coode", "コーデ", { score: 10, combo: 15 }, "m"),

    encore: new Encore(),
    refrain: new Refrain(),
    magic: new Magic(),

    alternate: new Alternate(),
    mutual: new Mutual(),

    cristal: new Cristal(),

    none: new DummySkill(),
}
