import { expect, it } from 'vitest';
import { SkillHelper } from "../js/skillHelper"

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
        { name: "concent", nameja: "", score: 22 },
        { name: "alternate", nameja: "", score: -20 },
        null,
        null,
        null
    ], "score")
    expect(s1).toBe(2)

    const s2 = SkillHelper.sum([
        { name: "magic", nameja: "", score: 18 },
        { name: "magic", nameja: "", score: 20 },
        { name: "concent", nameja: "", score: 22 },
        null,
        null
    ], "score")
    expect(s2).toBe(42)
})


it('boost', () => {
    const s1 = SkillHelper.boost({
        name: "magic",
        nameja: "",
        score: -20,
        combo: 21,
        slide: 40,

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
    expect(s1?.slide).toBe(60)
    expect(s1?.heal).toBe(4)
    expect(s1?.cut).toBe(0.6)



})