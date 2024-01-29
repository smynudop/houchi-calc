import { expect, it } from 'vitest';
import { SkillHelper } from "../js/skillHelper"
import { SkillList } from '../js/skill';
it('max', () => {
    const s1 = SkillHelper.max([
        { score: 17 },
        { score: -20 },
        { score: 0 },
        null,
        null
    ], "score")
    expect(s1).toBe(17)

    const s2 = SkillHelper.max([
        null,
        { score: -20 },
        null,
        null,
        null
    ], "score")
    expect(s2).toBe(-20)
})

it('sum', () => {
    const s1 = SkillHelper.sum([
        { score: 22 },
        { score: -20 },
        null,
        null,
        null
    ], "score")
    expect(s1).toBe(2)

    const s2 = SkillHelper.sum([
        { score: 18 },
        { score: 20 },
        { score: 22 },
        null,
        null
    ], "score")
    expect(s2).toBe(60)
})


it('boost', () => {
    const s1 = SkillHelper.boost({
        score: -20,
        combo: 21,

        heal: 3,
        support: 3,
        cut: 0.5,

    }, {
        boost: 0.5,
        boost2: 0.2,
        cover: 1
    })
    expect(s1?.score).toBe(-20)
    expect(s1?.combo).toBe(32)
    expect(s1?.heal).toBe(4)
    expect(s1?.cut).toBe(0.6)



})


const boost = SkillList.boost.execute({ applyTargetAbilities: [], encoreAbility: null, platoonIdols: [] })!
const symfony = SkillList.symfony.execute({ applyTargetAbilities: [], encoreAbility: null, platoonIdols: [] })!

it('calcBoostEffect', () => {
    const map = new Map<number, Ability[]>
    map.set(0, [])
    map.get(0)!.push(boost)
    map.get(0)!.push(symfony)

    const s1 = SkillHelper.calcBoostEffect(map)
    expect(s1.rezo.boost).toBe(0.7)
    expect(s1.rezo.boost2).toBe(0.4)
    expect(s1.rezo.cover).toBe(2)
    expect(s1.normal.boost).toBe(0.5)
    expect(s1.normal.boost2).toBe(0.2)
    expect(s1.normal.cover).toBe(1)
})

it('calcBoostEffect_grand', () => {
    const map = new Map<number, Ability[]>
    map.set(0, [])
    map.get(0)!.push(boost)
    map.get(0)!.push(symfony)

    map.set(1, [])
    map.get(1)!.push(symfony)
    map.get(1)!.push(symfony)
    map.get(1)!.push(symfony)
    map.get(1)!.push(symfony)


    const s1 = SkillHelper.calcBoostEffect(map)
    expect(s1.rezo.boost).toBe(2.7)
    expect(s1.rezo.boost2).toBe(1.2)
    expect(s1.rezo.cover).toBe(6)
    expect(s1.normal.boost).toBe(0.5)
    expect(s1.normal.boost2).toBe(0.2)
    expect(s1.normal.cover).toBe(1)
})

it('calcBoostEffect_magic', () => {
    const map = new Map<number, Ability[]>
    map.set(0, [])
    map.get(0)!.push({ ...boost, isMagic: true })
    map.get(0)!.push({ ...symfony, isMagic: true })

    const s1 = SkillHelper.calcBoostEffect(map)
    expect(s1.rezo.boost).toBe(0.5)
    expect(s1.rezo.boost2).toBe(0.2)
    expect(s1.rezo.cover).toBe(1)
    expect(s1.normal.boost).toBe(0.5)
    expect(s1.normal.boost2).toBe(0.2)
    expect(s1.normal.cover).toBe(1)
})

it('calcBoostEffect_magic2', () => {
    const map = new Map<number, Ability[]>
    map.set(0, [])
    map.get(0)!.push({ ...boost, isMagic: true })
    map.get(0)!.push({ ...symfony, isMagic: true })
    map.set(1, [])
    map.get(1)!.push({ ...boost, isMagic: true })
    map.get(1)!.push({ ...symfony, isMagic: true })

    const s1 = SkillHelper.calcBoostEffect(map)
    expect(s1.rezo.boost).toBe(1.0)
    expect(s1.rezo.boost2).toBe(0.4)
    expect(s1.rezo.cover).toBe(2)
    expect(s1.normal.boost).toBe(0.5)
    expect(s1.normal.boost2).toBe(0.2)
    expect(s1.normal.cover).toBe(1)
})