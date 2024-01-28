type Judge = "perfect" | "gone" | "miss" | "unset"
type IAttr = "cu" | "co" | "pa"
type ATime = "l" | "ml" | "m" | "ms" | "s" | "sp" | "eternal"
type IDifficult = "debut" | "regular" | "pro" | "master" | "master+" | "witch" | "piano" | "forte"
type ILiveType = "normal" | "grand"
type INoteType = "tap" | "flick_left" | "flick_right" | "flick" | "long" | "slide" | "longflick" | "slideflick"
type ISkillFrame = "score" | "combo" | "heal" | "heal2" | "support" | "boost" | "boost2" | "cover" | "cut"

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
    "cristal",

    "none",
] as const
type ISkillName = typeof skillNameList[number]



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
    boost2: number
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


type ILogger = {
    log: (message: string) => void
}
type ISkill = {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    canNOTmagicExecute?: boolean
    atype: ATime
    execute(props: SkillExecuteProp): Ability | null
}
type SkillExecuteProp = {
    applyTargetAbilities: Ability[]
    encoreAbility: Ability | null
    magicSkillList: ISkill[],
    logger: ILogger
}
type AbilityExecProp = {
    life: number
    noteType: INoteType
    judge: Judge
}
type AbilityExecute = (prop: AbilityExecProp) => SkillEffect
type Ability = {
    type: ISkillName
    nameja: string
    executeType: ISkillName
    isMagic: boolean
    isEncoreTarget: boolean
    isApplyTarget: boolean
    exec: AbilityExecute
    childSkills?: ISkill[]
}
type MaybeAbility = Ability | null


type FinallyAbility = (prop: AbilityExecProp) => RequiredBuff

interface INote {
    type: INoteType
    no: number
    frame: number
}
type INoteDetail = INote & {
    score: number,
    result: Judge
}
type IMusic = {
    name: string
    difficulity: IDifficult
    level: number
    offset: number
    musictime: number
    notes: INote[]
}