export const LIFE_DEFAULT = 264
export const MUSIC_MAXTIME = 140
export const CONF: Record<number, number> = {
    18: 1.475,
    25: 1.85,
    26: 1.9,
    27: 1.95,
    28: 2,
    29: 2.1,
    30: 2.2,
    31: 2.3,
    32: 2.4,
} as const

export const DECREASE_LIFE: Record<ILiveType, DecreaseLife> = {
    normal: {
        tap: 20,
        long: 10,
        flick: 20,
        flick_left: 20,
        flick_right: 20,
        slide: 10,
        longflick: 10,
        slideflick: 10
    },
    grand: {
        tap: 10,
        long: 10,
        flick: 20,
        flick_left: 20,
        flick_right: 20,
        slide: 20,
        longflick: 20,
        slideflick: 20
    },
}
