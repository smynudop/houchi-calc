
type BoostEffect2 = {
    rezo: BoostEffect,
    normal: BoostEffect
}

export class SkillHelper {
    static max(skills: (Buff | null)[], frame: keyof Buff): number {
        let result = -9999
        for (let skill of skills) {
            if (skill == null) continue
            const value = skill[frame]
            if (value == null || value == 0) continue
            result = Math.max(result, value)
        }
        if (result == -9999) result = 0
        return result
    }

    static maxRezo(skills: (Buff | null)[], frame: keyof Buff): number | undefined {
        let result: number | undefined = -9999
        for (let skill of skills) {
            if (skill == null) continue
            const value = skill[frame]
            if (value == null || value == 0) continue
            result = Math.max(result, value)
        }
        if (result == -9999) result = undefined
        return result
    }

    static sum(skills: (Buff | null)[], frame: keyof Buff): number {
        let skills2 = skills.filter((s): s is SkillEffect => s != null)
        let result = 0
        for (let skill of skills2) {
            result += skill[frame] ?? 0
        }
        return result
    }

    static boost(skill: Buff, boostEffect: BoostEffect): Buff {
        //if (skill == null) return null

        const boost = 1 + boostEffect.boost
        const boost2 = 1 + boostEffect.boost2

        let r = {
            score: skill.score == null ? 0
                : skill.score < 0 ? skill.score
                    : Math.ceil(skill.score * boost),
            combo: skill.combo == null ? 0
                : skill.combo < 0 ? skill.combo
                    : Math.ceil(skill.combo * boost),
            heal:
                Math.max(
                    Math.ceil((skill.heal ?? 0) * boost2),
                    skill.heal2 != null ? skill.heal2 + boostEffect.cover : 0
                ),
            support: skill.support ? skill.support + boostEffect.cover : 0,
            boost: skill.boost ?? 0,
            cover: skill.cover ?? 0,
            cut: skill.cut == null ? 0 : skill.cut * boost2
        }

        return r
    }

    static calcmax(skills: Buff[]): RequiredBuff {
        return {
            support: SkillHelper.max(skills, "support"),
            score: SkillHelper.max(skills, "score"),
            combo: SkillHelper.max(skills, "combo"),
            heal: SkillHelper.max(skills, "heal"),
            heal2: SkillHelper.max(skills, "heal2"),
            boost: SkillHelper.max(skills, "boost"),
            boost2: SkillHelper.max(skills, "boost2"),
            cover: SkillHelper.max(skills, "cover"),
            cut: SkillHelper.max(skills, "cut")
        }
    }

    static calcmaxRezo(skills: Buff[]): Buff {
        return {
            support: SkillHelper.maxRezo(skills, "support"),
            score: SkillHelper.maxRezo(skills, "score"),
            combo: SkillHelper.maxRezo(skills, "combo"),
            heal: SkillHelper.maxRezo(skills, "heal"),
            heal2: SkillHelper.maxRezo(skills, "heal2"),
            boost: SkillHelper.maxRezo(skills, "boost"),
            boost2: SkillHelper.maxRezo(skills, "boost2"),
            cover: SkillHelper.maxRezo(skills, "cover"),
            cut: SkillHelper.maxRezo(skills, "cut")
        }
    }

    static combine(skills: Buff[]): Buff {
        return {
            support: SkillHelper.sum(skills, "support"),
            score: SkillHelper.sum(skills, "score"),
            combo: SkillHelper.sum(skills, "combo"),
            heal: SkillHelper.sum(skills, "heal"),
            heal2: SkillHelper.max(skills, "heal2"),
            boost: SkillHelper.sum(skills, "boost"),
            cover: SkillHelper.sum(skills, "cover"),
            cut: SkillHelper.sum(skills, "cut")
        }
    }

    static calcBoostEffect(skills: Map<number, Ability[]>): BoostEffect2 {

        const effects: Buff[] = []
        for (const [unitno, abilities] of skills) {
            const magicAbilities = abilities.filter(a => a.isMagic)
            const magicBuff = SkillHelper.calcmax(magicAbilities.map(a => a.exec({ life: 0, noteType: "tap", judge: "perfect" })))
            effects.push(magicBuff)

            const nomagic = abilities.filter(a => !a.isMagic)
            effects.push(...nomagic.map(a => a.exec({ life: 0, noteType: "tap", judge: "perfect" })))
        }

        return {
            rezo: {
                boost: SkillHelper.sum(effects, "boost"),
                boost2: SkillHelper.sum(effects, "boost2"),
                cover: SkillHelper.sum(effects, "cover")
            },
            normal: {
                boost: SkillHelper.max(effects, "boost"),
                boost2: SkillHelper.max(effects, "boost2"),
                cover: SkillHelper.max(effects, "cover")

            }
        }
    }

    static calc2(skills: Map<number, Ability[]>, isRezo: boolean[], boost: BoostEffect2, prop?: AbilityExecProp, debug?: boolean) {

        if (!prop) prop = { life: 0, noteType: "tap", judge: "perfect" }
        debug ??= false

        const effectByPlatoon: Buff[] = []
        for (const [unitno, abilities] of skills) {
            const effects: Buff[] = []

            const magicAbilities = abilities.filter(a => a.isMagic)
            const magicBuff = SkillHelper.calcmaxRezo(magicAbilities.map(a => a.exec(prop!)))
            effects.push(magicBuff)

            const nomagic = abilities.filter(a => !a.isMagic)
            effects.push(...nomagic.map(a => a.exec(prop!)))

            if (debug) console.log(effects)

            const rezo = !!isRezo[unitno]

            const boostedEffects = effects.map(e => SkillHelper.boost(e, rezo ? boost.rezo : boost.normal))

            if (isRezo[unitno]) {
                effectByPlatoon.push(SkillHelper.combine(boostedEffects))
            } else {
                effectByPlatoon.push(SkillHelper.calcmax(boostedEffects))

            }
        }

        return SkillHelper.calcmax(effectByPlatoon)
    }

}
