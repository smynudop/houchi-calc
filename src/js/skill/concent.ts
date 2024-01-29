import { SkillBase } from "./skillBase"

export class Concent extends SkillBase {
    constructor() {
        super("concent", "コンセ", { score: 22 }, "m")
    }

    execute(prop: SkillExecuteProp): Ability | null {
        const Ability = super.execute(prop)
        if (!Ability) return null
        return {
            ...Ability,
            exec: ({ judge }: AbilityExecProp) => {
                const score = judge == "perfect" ? 22 : undefined
                return {
                    ...this.skillEffect(),
                    score
                }
            }
        }
    }

}