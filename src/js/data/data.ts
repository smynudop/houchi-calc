export const keyof = function <T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[]
}

export const atimes: Record<ATime, Record<string, number>> = {
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
    eternal: {
        "1高": 280
    }
} as const
