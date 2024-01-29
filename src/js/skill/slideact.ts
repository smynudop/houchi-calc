
import { SkillBase } from "./skillBase"

export class SlideAct extends SkillBase {

    constructor() {
        super("slideact", "スラアク", { score: 10 }, "ml")
    }

    execute(prop: SkillExecuteProp): Ability | null {
        const Ability = super.execute(prop)
        if (!Ability) return null
        return {
            ...Ability,
            exec: ({ judge, noteType }: AbilityExecProp) => {
                const score = judge == "perfect"
                    ? (noteType == "slide" || noteType == "slideflick") ? 40 : 10
                    : undefined
                return {
                    ...this.skillEffect(),
                    score
                }
            }
        }
    }
}