export class SkillHelper {
    static max(skills: (Buff | null)[], frame: keyof Buff): number {
        let result = 0
        for (let skill of skills) {
            if (skill == null) continue
            const value = skill[frame] ?? 0
            result = Math.max(result, value)
        }
        return result
    }

    static sum(skills: (SkillEffect | null)[], frame: keyof Buff): number {
        let skills2 = skills.filter((s): s is SkillEffect => s != null)

        let result = 0
        let magicSkill = {
            name: "magic",
            nameja: "マジック統合",
            [frame]: SkillHelper.max(
                skills2.filter((s) => s.name == "magic"),
                frame
            ),
        } as SkillEffect
        skills2 = skills2.filter((s) => s.name != "magic").concat(magicSkill)

        for (let skill of skills2) {
            result += skill[frame] ?? 0
        }
        return result
    }

    static boost(skill: SkillEffect, boostEffect: IboostEffect): SkillEffect {
        const boost = 1 + boostEffect.boost
        let r = {
            name: skill.name,
            nameja: skill.nameja,
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

    static calcmax(skills: MaybeSkillEffect[]): RequiredBuff {
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

    static combine(skills: MaybeSkillEffect[]): MaybeSkillEffect {
        return {
            name: "none",
            nameja: "レゾナンス統合",
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

    static calcBoostEffect(skills: MaybeSkillEffect[], isRezo: boolean): IboostEffect {
        if (isRezo) {
            return {
                boost: SkillHelper.sum(skills, "boost"),
                cover: SkillHelper.sum(skills, "cover"),
            }
        } else {
            return {
                boost: SkillHelper.max(skills, "boost"),
                cover: SkillHelper.max(skills, "cover"),
            }
        }
    }

    static calc(abilities: (Ability | null)[], isRezo: boolean[]) {
        return (life: number) => {
            const allBuffs = abilities.map((s) => (s != null ? s.exec(life).applyBuff : null))

            let rezoBoost = SkillHelper.calcBoostEffect(allBuffs, true)
            let normalBoost = SkillHelper.calcBoostEffect(allBuffs, false)

            let skillGroups: MaybeSkillEffect[][] = []
            for (let i = 0; i < Math.ceil(abilities.length / 5); i++) {
                skillGroups.push(allBuffs.slice(i * 5, i * 5 + 5))
            }

            skillGroups = skillGroups.map((x, i) => {
                if (isRezo[i]) {
                    let tmp = x.map((y) => (y != null ? SkillHelper.boost(y, rezoBoost) : null))
                    return [SkillHelper.combine(tmp)]
                } else {
                    return x.map((y) => (y != null ? SkillHelper.boost(y, normalBoost) : null))
                }
            })

            let skills = skillGroups.flat()

            return SkillHelper.calcmax(skills)
        }
    }
}
