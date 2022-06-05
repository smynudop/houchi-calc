type IJudge = "perfect" | "gone" | "guard" | "miss"
type IAttr = "cu" | "co" | "pa"
type IATime = "l" | "ml" | "m" | "ms" | "s" | "sp"
type IDifficult = "debut" | "regular" | "pro" | "master" | "master+" | "witch" | "piano" | "forte"
type ILiveType = "normal" | "grand"
type INoteType = "tap" | "flick_left" | "flick_right" | "long" | "slide"
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
    "boost",
    "srboost",

    "motif",

    "concent",
    "slideact",

    "combona",
    "coode",

    "encore",
    "refrain",
    "magic",

    "none",
] as const
type ISkillName = typeof skillNameList[number]

interface INote {
    type: INoteType
    no: number
    frame: number
    score?: number
    result?: IJudge
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

type IidolProfile = readonly [string, IAttr, number, string, ISkillName]

type IboostEffect = {
    boost: number
    cover: number
}

type IDecreaseLife = {
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

type ISkill = {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean
    isEncore: boolean
    atype: IATime
    execute(applyBuffList: Buff[], encoreAbility: MaybeAbility, magicSkillList: ISkill[]): Ability
}

type Ability = {
    name: ISkillName
    nameja: string
    isMagic: boolean
    isEncoreTarget: boolean
    message: string
    exec: (life: number) => AbilityResponse
}
type MaybeAbility = Ability | null

type AbilityResponse = {
    isMagic: boolean
    applyBuff: SkillEffect | null
    activateBuffs: SkillEffect[]
}

type AbilityLog = {
    time: number
    position: number
    ability: EncoreAbility
}

type FinallyAbility = (life: number) => RequiredBuff
