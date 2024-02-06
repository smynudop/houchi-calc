export const SCORES_NORMAL = [
    { name: "Unlock Starbeat[mas]", path: "./score/us.json" },
    { name: "サマカニ!![mas+]", path: "./score/samacani.json" },
    { name: "輝く世界の魔法[witch]", path: "./score/kagaseka.json" },
    { name: "ドレミファクトリー！[pro]", path: "./score/doremi.json" },
    { name: "美に入り彩を穿つ[pro]", path: "./score/bisai.json" },
    { name: "ミラーボール・ラブ[mas]", path: "./score/mirror.json" },
    { name: "ミラーボール・ラブv2[mas]", path: "./score/mirror_V2.json" },
    { name: "ビートシューター[mas]", path: "./score/beat_new.json" },
    { name: "サラバ[mas+]", path: "./score/saraba.json" }
]

export const SCORES_GRAND = [
    { name: "Stage Bye Stage", path: "./score/sbs.json" },
    { name: "M@GIC", path: "./score/magic.json" },
    { name: "星環世界", path: "./score/seikan.json" },
    { name: "Starry-Go-Round", path: "./score/sgr.json" }
]

export const SCORE_DEFAULT_GRAND = "./score/sbs.json"
export const SCORE_DEFAULT_NORMAL = "./score/us.json"

export function getScoreList(isGrand: boolean) {
    return isGrand ? SCORES_GRAND : SCORES_NORMAL
}
