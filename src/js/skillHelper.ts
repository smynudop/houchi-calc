export class SkillHelper {
    static max(skills: SkillEffect[], frame: keyof SkillEffect): number {
        let result = 0
        for (let skill of skills) {
            const value = skill[frame]
            if (value == undefined) {
                continue
            }
            result = Math.max(result, value)
        }
        return result
    }

    static sum(skills: SkillEffect[], frame: keyof SkillEffect): number {
        let result = 0
        for (let skill of skills) {
            const value = skill[frame]
            if (value == undefined) {
                continue
            }
            result += value
        }
        return result
    }

    static boost(skill: SkillEffect, boostEffect: IboostEffect): activeSkill {
        const boost = 1 + boostEffect.boost
        let r = {
            score: Math.ceil((skill.score ?? 0) * boost),
            combo: Math.ceil((skill.combo ?? 0) * boost),
            slide: Math.ceil((skill.slide ?? 0) * boost),
            heal:
                Math.ceil((skill.heal ?? 0) * boost) +
                ((skill.guard ?? 0) >= 1 ? boostEffect.cover : 0),
            support: skill.support ? skill.support + boostEffect.cover : 0,
            guard: skill.guard ?? 0,
            boost: skill.boost ?? 0,
            cover: skill.cover ?? 0,
        }
        return r
    }

    static calcmax(skills: SkillEffect[]): activeSkill {
        return {
            support: SkillHelper.max(skills, "support"),
            score: SkillHelper.max(skills, "score"),
            combo: SkillHelper.max(skills, "combo"),
            heal: SkillHelper.max(skills, "heal"),
            guard: SkillHelper.max(skills, "guard"),
            boost: SkillHelper.max(skills, "boost"),
            slide: SkillHelper.max(skills, "slide"),
            cover: SkillHelper.max(skills, "cover"),
        }
    }

    static combine(skills: SkillEffect[]): activeSkill {
        return {
            support: SkillHelper.sum(skills, "support"),
            score: SkillHelper.sum(skills, "score"),
            combo: SkillHelper.sum(skills, "combo"),
            heal: SkillHelper.sum(skills, "heal"),
            guard: SkillHelper.sum(skills, "guard"),
            slide: SkillHelper.sum(skills, "slide"),
            boost: SkillHelper.sum(skills, "boost"),
            cover: SkillHelper.sum(skills, "cover"),
        }
    }

    static calcBoostEffect(skills: SkillEffect[], isRezo: boolean): IboostEffect {
        if (isRezo) {
            return {
                boost: skills
                    .map((x) => x.boost)
                    .filter((x): x is number => x !== undefined)
                    .reduce((a, c) => a + c, 0),
                cover: skills
                    .map((x) => x.cover)
                    .filter((x): x is number => x !== undefined)
                    .reduce((a, c) => a + c, 0),
            }
        } else {
            return {
                boost: skills
                    .map((x) => x.boost)
                    .filter((x): x is number => x !== undefined)
                    .reduce((a, c) => Math.max(a, c), 0),
                cover: skills
                    .map((x) => x.cover)
                    .filter((x): x is number => x !== undefined)
                    .reduce((a, c) => Math.max(a, c), 0),
            }
        }
    }

    static calc(applySkills: ApplySkill[], isRezo: boolean[]) {
        return (life: number) => {
            let allSkill = applySkills.map((s) => s.exec(life))

            let rezoBoost = SkillHelper.calcBoostEffect(allSkill, true)
            let normalBoost = SkillHelper.calcBoostEffect(allSkill, false)

            let skillGroups: SkillEffect[][] = []
            for (let i = 0; i < Math.ceil(allSkill.length / 5); i++) {
                skillGroups.push(allSkill.slice(i * 5, i * 5 + 5))
            }

            skillGroups = skillGroups.map((x, i) => {
                if (isRezo[i]) {
                    let tmp = x.map((y) => SkillHelper.boost(y, rezoBoost))
                    return [SkillHelper.combine(tmp)]
                } else {
                    return x.map((y) => SkillHelper.boost(y, normalBoost))
                }
            })

            let skills = skillGroups.flat()

            return SkillHelper.calcmax(skills)
        }
    }
}
