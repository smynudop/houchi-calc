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

    static boost(skill: MaybeSkillEffect, boostEffect: BoostEffect): MaybeSkillEffect {
        if (skill == null) return null

        const boost = 1 + boostEffect.boost
        const boost2 = 1 + boostEffect.boost2
        let r = {
            name: skill.name,
            nameja: skill.nameja,
            score: skill.score == null ? 0
                : skill.score < 0 ? skill.score
                    : Math.ceil(skill.score * boost),
            combo: skill.combo == null ? 0
                : skill.combo < 0 ? skill.combo
                    : Math.ceil(skill.combo * boost),
            slide: skill.slide == null ? 0
                : skill.slide < 0 ? skill.slide
                    : Math.ceil(skill.slide * boost),
            heal:
                Math.max(
                    Math.ceil((skill.heal ?? 0) * boost2),
                    (skill.guard ?? 0) >= 1 ? boostEffect.cover : 0
                ),
            support: skill.support ? skill.support + boostEffect.cover : 0,
            guard: skill.guard ?? 0,
            boost: skill.boost ?? 0,
            cover: skill.cover ?? 0,
            cut: skill.cut == null ? 0 : skill.cut * boost2
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
            boost2: SkillHelper.max(skills, "boost2"),
            slide: SkillHelper.max(skills, "slide"),
            cover: SkillHelper.max(skills, "cover"),
            cut: SkillHelper.max(skills, "cut")
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
            cut: SkillHelper.sum(skills, "cut")
        }
    }

    static calcBoostEffect(skills: MaybeSkillEffect[], isRezo: boolean): BoostEffect {
        if (isRezo) {
            return {
                boost: SkillHelper.sum(skills, "boost"),
                boost2: SkillHelper.sum(skills, "boost2"),
                cover: SkillHelper.sum(skills, "cover"),
            }
        } else {
            return {
                boost: SkillHelper.max(skills, "boost"),
                boost2: SkillHelper.max(skills, "boost2"),
                cover: SkillHelper.max(skills, "cover"),
            }
        }
    }

    static calc(abilities: (Ability | null)[], isRezo: boolean[]) {
        return (life: number) => {
            const allBuffs = abilities.map((s) => (s != null ? s.exec(life).applyBuff : null))

            for (const buff of allBuffs) {
                if (!buff) continue
                if (buff.slide == null || buff.slide < (buff.score ?? 0)) {
                    buff.slide = buff.score
                }
            }

            let rezoBoost = SkillHelper.calcBoostEffect(allBuffs, true)
            let normalBoost = SkillHelper.calcBoostEffect(allBuffs, false)

            let skillGroups: MaybeSkillEffect[][] = []
            for (let i = 0; i < Math.ceil(abilities.length / 5); i++) {
                skillGroups.push(allBuffs.slice(i * 5, i * 5 + 5))
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

            const s = SkillHelper.calcmax(skills)
            return s
        }
    }
}
