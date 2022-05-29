export const keyof = function <T>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[]
}

export const skilltypes = {
    boost: {
        name: "boost",
        nameja: "スキブ",
        atype: "l",
        boost: 0.2,
        cover: 1,
    },
    srboost: {
        name: "srboost",
        nameja: "SRスキブ",
        atype: "m",
        boost: 0.1,
        cover: 1,
    },
    symfony: {
        name: "symfony",
        nameja: "シンフォ",
        atype: "m",
        boost: 0.5,
        cover: 1,
    },
    combona: {
        name: "combona",
        nameja: "コンボナ",
        combo: 18,
        atype: "m",
    },
    unison: {
        name: "unison",
        nameja: "ユニゾン",
        atype: "m",
        boost: 0.5,
        hastarget: true,
    },
    motif: {
        name: "motif",
        nameja: "モチーフ",
        atype: "m",
        score: 17,
    },

    slideact: {
        name: "slideact",
        nameja: "スラアク",
        atype: "ml",
        score: 10,
        slide: 40,
    },
    support: {
        name: "support",
        nameja: "サポート",
        atype: "s",
        support: 3,
    },
    rsupport: {
        name: "rsupport",
        nameja: "Rサポ",
        atype: "m",
        support: 1,
    },
    tuning: {
        name: "tuning",
        nameja: "チューン",
        atype: "m",
        combo: 12,
        support: 2,
    },
    synergy: {
        name: "synergy",
        nameja: "シナジー",
        atype: "m",
        score: 16,
        combo: 15,
        heal: 1,
    },
    coode: {
        name: "coode",
        nameja: "コーデ",
        atype: "m",
        score: 10,
        combo: 15,
    },
    concent: {
        name: "concent",
        nameja: "コンセ",
        atype: "m",
        score: 22,
    },

    heal: {
        name: "heal",
        nameja: "回復",
        atype: "ms",
        heal: 3,
    },
    guard: {
        name: "guard",
        nameja: "ダメガ",
        atype: "m",
        heal: 0,
        guard: 1,
        isheal: true,
    },
    ssrguard: {
        name: "ssrguard",
        nameja: "ダメガ",
        atype: "ml",
        heal: 0,
        guard: 1,
        isheal: true,
    },
    allround: {
        name: "allround",
        nameja: "オルラン",
        atype: "ms",
        combo: 13,
        heal: 1,
    },
    encore: {
        name: "encore",
        nameja: "アンコ",
        atype: "s",
    },
    refrain: {
        name: "refrain",
        nameja: "リフレ",
        atype: "m",
    },
    magic: {
        name: "magic",
        nameja: "マジック",
        atype: "sp",
    },
    scoregenre: {
        name: "scoregenre",
        nameja: "スコア系",
        atype: "m",
    },
    combogenre: {
        name: "combogenre",
        nameja: "コンボナ系",
        atype: "m",
    },
    bothgenre: {
        name: "bothgenre",
        nameja: "コーデ系",
        atype: "m",
    },
    none: {
        name: "none",
        nameja: "なし",
        atype: "m",
    },
} as const

//export type IskillName = keyof typeof skilltypes

export const atimes: Record<IATime, Record<string, number>> = {
    l: {
        "7無": 0,
        "7高": 12,
        "8高": 15,
        "10高": 18,
    },
    ml: {
        "7無": 0,
        "7高": 12,
        "9高": 15,
        "11高": 18,
    },
    m: {
        "4高": 6,
        "6中": 9,
        "7無": 0,
        "7高": 9,
        "7中": 12,
        "8中": 9,
        "9高": 12,
        "9中": 15,
        "11高": 15,
        "11中": 18,
        "13高": 18,
        "9低": 12,
        "11低": 15,
        "13低": 18,
    },
    ms: {
        "5高": 6,
        "7中": 9,
        "7無": 0,
        "8高": 9,
        "9中": 12,
        "11高": 12,
        "13高": 15,
        "13中": 18,
    },
    s: {
        "7無": 0,
        "9中": 9,
        "9高": 9,
        "12高": 12,
        "12中": 12,
        "15高": 15,
        "15中": 15,
        "18高": 18,
        "18中": 18,
    },
    sp: {
        "12中": 15,
        "7無": 0,
    },
} as const
