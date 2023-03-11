import { Simulator, SimulatorMomentInfo } from "./simulator"
import { MUSIC_MAXTIME } from "./data/constants"
import { Idol } from "./idol"
import { SkillHelper } from "./skillHelper"

function union<T, U>(a: T, b: U): T & U {
    return {
        ...a,
        ...b
    }
}

type MomentInfo = {
    skills: (Ability | null)[]
    finallyAbility: FinallyAbility | null,
}
type SkillList = {
    moment: number,
    skillList: (Ability | null)[]
}
export type CalcMomentInfo = SkillList & SimulatorMomentInfo
export type CalcRequest = {
    idols: Idol[],
    isGuestRezo: boolean,
    appeal: number,
    musictime: number
    scorePath: string
}
export type CalcResponse = {
    momentInfo: CalcMomentInfo[]
    logs: string[],
    musicName: string
    totalScore: number
    unitLife: number
    dangerTime: number
    maxCombo: number
}

export class Unit {
    isGrand: boolean
    idolnum: 5 | 15
    simulator: Simulator
    isHouchi: boolean
    constructor(isGrand: boolean, isHouchi = true) {
        this.isGrand = isGrand
        this.isHouchi = isHouchi

        this.idolnum = isGrand ? 15 : 5
        this.simulator = new Simulator(this, isGrand, isHouchi)
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

    async calc(req: CalcRequest): Promise<CalcResponse> {
        const {
            idols,
            isGuestRezo,
            appeal,
            musictime,
            scorePath
        } = req
        const matrix = new Matrix(this.idolnum)

        let activateSkillList: Buff[] = []
        let applyResutLogList = new AbilityList()
        let logs: string[] = []

        for (let time = 0; time < MUSIC_MAXTIME; time++) {
            for (let no = 0; no < this.idolnum; no++) {
                let idol = idols[no]
                let unitno = Math.floor(no / 5)

                let isActiveTiming = idol.isActiveTiming(time, unitno, musictime, this.isGrand)

                if (isActiveTiming && idol.skill.type != "none") {
                    let skills = idols
                        .filter((x, i) => Math.floor(i / 5) == unitno)
                        .map((x) => x.skill)

                    let encoreAbility = applyResutLogList.getEncoreTarget(time)

                    let ability = idol.skill.execute(activateSkillList, encoreAbility, skills)
                    if (ability.isEncoreTarget) {
                        applyResutLogList.push(time, no, ability)
                    }

                    logs.push(`${time}s: [${no}] ${ability.message}`)

                    let response = ability.exec(0)
                    activateSkillList = activateSkillList.concat(response.activateBuffs)

                    matrix.useSkill(time, idol.atime, no, ability)
                }
            }
        }

        matrix.calc(this.isRezo(idols, isGuestRezo))

        const simuRes = await this.simulator.calc(matrix, req)

        return {
            momentInfo: matrix.skillMatrix.map((x, i) => {
                return union({
                    moment: i,
                    skillList: x.skills
                }, simuRes.momentInfos[i])
            }),
            logs,
            musicName: simuRes.musicName,
            maxCombo: simuRes.maxCombo,
            totalScore: simuRes.totalScore,
            unitLife: simuRes.unitLife,
            dangerTime: simuRes.dangerTime
        }
    }
}

type AbilityLog = {
    time: number
    position: number
    ability: Ability
}

class AbilityList {
    list: AbilityLog[]
    constructor() {
        this.list = []
    }

    clear() {
        this.list = []
    }

    push(time: number, position: number, ability: Ability) {
        this.list.push({
            time: time,
            position: position,
            ability: ability,
        })
    }

    getEncoreTarget(time: number) {
        //アンコールターゲットを確認
        let order = [9, 7, 6, 8, 10, 4, 2, 1, 3, 5, 14, 12, 11, 13, 15]

        const list = this.list
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
}



export class Matrix {
    idolnum: 5 | 15
    skillMatrix: MomentInfo[]

    constructor(idolnum: 5 | 15) {
        this.idolnum = idolnum

        this.skillMatrix = []
        for (let i = 0; i < MUSIC_MAXTIME * 2; i++) {
            const skills: (Ability | null)[] = new Array(idolnum)
            skills.fill(null)

            this.skillMatrix.push({
                skills,
                finallyAbility: null,
            })
        }
    }

    calc(isRezo: boolean[]) {
        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            const info = this.skillMatrix[moment]
            info.finallyAbility = SkillHelper.calc(info.skills, isRezo)
        }
    }

    getFinallyAbilities() {
        return this.skillMatrix
            .map(x => x.finallyAbility)
            .filter((x): x is FinallyAbility => x != null)
    }

    useSkill(time: number, mDuration: number, no: number, skill: Ability | null) {
        if (skill == null) {
            return
        }

        if (skill.type == "none") return

        for (let d = 0; d < mDuration; d++) {
            let moment = time * 2 + d
            const info = this.skillMatrix?.[moment]
            if (info) info.skills[no] = skill
        }
    }
}


