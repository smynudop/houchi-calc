import { Music } from "./simulator"
import { MUSIC_MAXTIME } from "./data/constants"
import { Idol } from "./idol"
import { SkillHelper } from "./skillHelper"



type SkillList = {
    moment: number,
    skillList: (Ability | null)[]
}
export type CalcMomentInfo = SkillList
export type CalcRequest = {
    idols: Idol[],
    isGuestRezo: boolean,
    appeal: number,
    scorePath: string,
}
export type CalcResponse = {
    momentInfo: CalcMomentInfo[]
    logs: string[],
}

export class Unit {
    isGrand: boolean
    idolnum: 5 | 15
    isHouchi: boolean
    cache: Map<string, IMusic> = new Map()
    music: Music
    constructor(isGrand: boolean, isHouchi = true) {
        this.isGrand = isGrand
        this.isHouchi = isHouchi
        this.music = new Music({})
        this.idolnum = isGrand ? 15 : 5
    }

    isRezo(idols: Idol[], isGuestRezo: boolean): boolean[] {
        if (this.isGrand) {
            return [
                idols.slice(0, 5).some((x) => x.isRezo),
                idols.slice(5, 10).some((x) => x.isRezo),
                idols.slice(10, 15).some((x) => x.isRezo),
            ]
        } else {
            return [idols.some((x) => x.isRezo) || isGuestRezo]
        }
    }



    async fetch(filename: string) {
        let score: IMusic
        if (this.cache.has(filename)) {
            score = this.cache.get(filename)!
        } else {
            const res = await fetch(filename)
            score = await res.json() as IMusic
            this.cache.set(filename, score)
        }

        this.music = new Music(score)

    }

    basicValue(appeal: number) {
        return (appeal * this.music.coefficient) / this.music.notesCount
    }

    combobonus(combo: number) {
        let allnote = this.music.notesCount
        if (combo >= Math.floor(allnote * 0.9)) return 2.0
        if (combo >= Math.floor(allnote * 0.8)) return 1.7
        if (combo >= Math.floor(allnote * 0.7)) return 1.5
        if (combo >= Math.floor(allnote * 0.5)) return 1.4
        if (combo >= Math.floor(allnote * 0.25)) return 1.3
        if (combo >= Math.floor(allnote * 0.1)) return 1.2
        if (combo >= Math.floor(allnote * 0.05)) return 1.1
        return 1.0
    }

    judgeKeisu(judge: Judge) {
        switch (judge) {
            case "perfect":
                return 1
            default:
                return 0
        }
    }

    async calc(req: CalcRequest): Promise<CalcResponse> {
        const {
            idols,
            isGuestRezo,
            appeal,
            scorePath
        } = req
        const matrix = new Matrix(this.idolnum)
        for (let no = 0; no < this.idolnum; no++) {
            const idol = idols[no]
            idol.no = no
            idol.unitno = Math.floor(no / 5)
        }

        const abilities = new AbilityList()
        let logs: string[] = []

        let life = 300
        let combo = 0
        const basicValue = this.basicValue(appeal)
        let score = 0

        await this.fetch(scorePath)

        const isRezo = this.isRezo(idols, isGuestRezo)
        for (let time = 0; time < MUSIC_MAXTIME; time++) {
            if (time <= this.music.musictime - 3) {
                const encoreAbility = abilities.getEncoreTarget(time)
                const executeSkills = idols.filter(i => i.isActiveTiming(time, this.isGrand))
                    .map(i => {
                        return {
                            unitno: i.unitno,
                            no: i.no,
                            atime: i.atime,
                            skill: i.skill
                        }
                    })
                executeSkills.sort()

                while (executeSkills.length > 0) {
                    const info = executeSkills.shift()!
                    const magicSkillList = idols.filter(i => i.unitno == info.unitno).map(i => i.skill)

                    const ability = info.skill.execute({
                        applyTargetAbilities: abilities.getApplyTarget(info.unitno),
                        encoreAbility,
                        magicSkillList
                    })


                    abilities.push(time, info.no, ability)
                    matrix.useSkill(time, info.atime, info.no, ability)

                }
            }

            for (let m = 0; m < 2; m++) {
                const moment = time * 2 + m
                const notes: INoteDetail[] = []
                const momentinfo = matrix.getAbilities(moment)
                const boost = SkillHelper.calcBoostEffect(momentinfo)
                const { support, cut } = SkillHelper.calc2(momentinfo, isRezo, boost)

                //パーフェクトじゃない場合、つながっているノーツを切る
                if (support < 4) {
                    let { damage, notes } = this.music.disConnectLong(moment)
                    damage = damage * (1 - cut)
                    life -= damage

                    //切れたノーツがある場合、コンボをリセットする
                    if (notes.length >= 0) {
                        combo = 0
                    }
                }

                for (const note of notes) {
                    if (note.result == "gone") continue

                    let judge: Judge = "miss"
                    if (support >= 4) judge = "perfect"

                    //ミスの場合、ライフを減らす
                    if (judge == "miss") {
                        let damage = 0
                        damage = damage * (1 - cut)
                        life -= damage
                        this.music.disConnect(note.no)
                    }

                    //ライフを回復する
                    const { heal } = SkillHelper.calc2(momentinfo, isRezo, boost)
                    life += heal

                    if (judge == "perfect") combo++
                    else combo = 0

                    const { score: scoreBonus, combo: comboBonus } = SkillHelper.calc2(momentinfo, isRezo, boost, { life, noteType: note.type, judge })
                    const comboKeisu = this.combobonus(combo)
                    const judgeKeisu = this.judgeKeisu(judge)

                    const noteScore = basicValue * (1 + scoreBonus) * (1 + comboBonus) * comboKeisu * judgeKeisu
                    score += noteScore
                }

            }

        }

        return {
            // momentInfo: matrix.skillMatrix.map((x, i) => {
            //     return {
            //         moment: i,
            //         skillList: x,
            //         ...simuRes.momentInfos[i]
            //     }
            // }),
            momentInfo: [],
            logs,
        }
    }
}

export type AbilityLog = {
    time: number
    position: number
    ability: Ability
}

class AbilityList {
    allList: AbilityLog[] = []
    encoreTargetList: AbilityLog[] = []
    applyTargetList: { [unitno: number]: Ability[] } = {}
    constructor() {
    }

    push(time: number, position: number, ability: Ability | null) {
        if (ability == null) return;

        this.allList.push({
            time: time,
            position: position,
            ability: ability,
        })
        if (ability.isEncoreTarget) {
            this.encoreTargetList.push({
                time: time,
                position: position,
                ability: ability,
            })
        }
        if (ability.isApplyTarget) {
            const unitno = Math.floor(position / 5)
            if (this.applyTargetList[unitno] == undefined) {
                this.applyTargetList[unitno] = []
            }
            this.applyTargetList[unitno].push(ability)
        }
        if (ability.childAbilities != null) {
            for (const c of ability.childAbilities) {
                if (c.isApplyTarget) {
                    const unitno = Math.floor(position / 5)
                    if (this.applyTargetList[unitno] == undefined) {
                        this.applyTargetList[unitno] = []
                    }
                    this.applyTargetList[unitno].push(ability)
                }
            }
        }

    }

    getEncoreTarget(time: number) {
        //アンコールターゲットを確認
        let order = [9, 7, 6, 8, 10, 4, 2, 1, 3, 5, 14, 12, 11, 13, 15]

        const list = this.encoreTargetList
            .filter((x) => x.ability != null)
            .filter((x) => x.time < time)
            .sort((a, b) => a.time - b.time || order[b.position] - order[a.position] || 0)
            .reverse()

        if (list.length == 0) {
            return null
        } else {
            return list[0].ability
        }
    }

    getApplyTarget(unitno: number) {
        return this.applyTargetList[unitno] ?? []
    }
}

type AbilityInfo = {
    ability: Ability
    no: number
    unitno: number
}


export class Matrix {
    idolnum: 5 | 15
    skillMatrix: AbilityInfo[][]

    constructor(idolnum: 5 | 15) {
        this.idolnum = idolnum

        this.skillMatrix = []
        for (let i = 0; i < MUSIC_MAXTIME * 2; i++) {
            const skills: AbilityInfo[] = []
            this.skillMatrix.push(skills)
        }
    }

    useSkill(time: number, mDuration: number, no: number, ability: Ability | null) {
        if (ability == null) {
            return
        }

        if (ability.type == "none") return

        for (let d = 0; d < mDuration; d++) {
            let moment = time * 2 + d
            this.skillMatrix[moment].push({
                no,
                unitno: Math.floor(no / 5),
                ability
            })
        }
    }

    getAbilities(moment: number) {
        const infos = this.skillMatrix[moment]
        const result = new Map<number, Ability[]>

        for (const info of infos) {
            if (!result.has(info.unitno)) {
                result.set(info.unitno, [])
            }
            result.get(info.unitno)!.push(info.ability)
        }
        return result
    }
}


