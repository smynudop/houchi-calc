type Judge = "perfect" | "gone" | "guard" | "miss"
type IAttr = "cu" | "co" | "pa"
type ATime = "l" | "ml" | "m" | "ms" | "s" | "sp"
type IDifficult = "debut" | "regular" | "pro" | "master" | "master+" | "witch" | "piano" | "forte"
type ILiveType = "normal" | "grand"
type INoteType = "tap" | "flick_left" | "flick_right" | "flick" | "long" | "slide"
type ISkillFrame = "score" | "combo" | "slide" | "heal" | "support" | "guard" | "boost" | "cover"

const skillNameList = [
    "support",
    "tuning",

    "heal",
    "synergy",
    "allround",

    "ssrguard",
    "guard",

    "symfony",
    "ensemble",
    "boost",
    "srboost",

    "motif",

    "concent",
    "slideact",

    "combona",
    "coode",

    "encore",
    "refrain",

    "alternate",
    "mutual",

    "magic",

    "none",
] as const
type ISkillName = typeof skillNameList[number]

interface INote {
    type: INoteType
    no: number
    frame: number
    score?: number
    result?: Judge
}

interface LongInfo {
    begin: number
    end: number
    isContinue: boolean
}

interface IMemory {
    name: string
    appeal: number
    member: string[]
}

type IdolProfile = readonly [string, IAttr, number, string, ISkillName]

type BoostEffect = {
    boost: number
    cover: number
}

type DecreaseLife = {
    [k in INoteType]: number
}

type Buff = {
    [k in ISkillFrame]?: number
}
type RequiredBuff = Required<Buff>

type SkillEffect = {
    name: ISkillName
    nameja: string
} & Buff
type MaybeSkillEffect = SkillEffect | null

type ISkill = {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: ATime
    execute(applyBuffList: Buff[], encoreAbility: MaybeAbility, magicSkillList: ISkill[]): Ability
}

type Ability = {
    type: ISkillName
    nameja: string
    executeType: ISkillName
    isMagic: boolean
    isEncoreTarget: boolean
    message: string
    exec: (life: number) => AbilityResponse
}
type MaybeAbility = Ability | null

type AbilityResponse = {
    applyBuff: SkillEffect | null
    activateBuffs: SkillEffect[]
}

type FinallyAbility = (life: number) => RequiredBuff
