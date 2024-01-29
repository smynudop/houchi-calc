import { SkillBase } from "./skillBase"

export class Coode extends SkillBase {
    constructor() {
        super("coode", "コーデ", { score: 10, combo: 15 }, "m")
    }

    execute(prop: SkillExecuteProp): Ability | null {
        const Ability = super.execute(prop)
        if (!Ability) return null
        return {
            ...Ability,
            exec: ({ judge }: AbilityExecProp) => {
                const score = judge == "perfect" ? 10 : undefined
                return {
                    ...this.skillEffect(),
                    score
                }
            }
        }
    }

}