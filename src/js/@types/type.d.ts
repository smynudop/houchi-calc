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

type activeSkill = {
    [k in ISkillFrame]: number
}

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

type SkillEffect = Partial<activeSkill>
type ActivateSkill = (life: number) => SkillEffect
type ApplySkill = {
    exec: (life: number) => SkillEffect
    name: ISkillName
    nameja: string
}

interface ApplyResultLog {
    time: number
    position: number
    result: ApplyResponse
}

type ApplyResponse = {
    skill: ApplySkill
    activatedSkill: ActivateSkill[]
    isEncore: boolean
}

type ISkill2 = {
    type: ISkillName
    nameja: string
    activeSkill: SkillEffect
    isMagic: boolean
    atype: IATime
    activate(): (life: number) => SkillEffect
    apply(
        activateSkillList: ActivateSkill[],
        ApplyResutLogs: ApplyResultLog[],
        skills: ISkill2[]
    ): ApplyResponse
}

type IFinnalySkill = (life: number) => activeSkill
