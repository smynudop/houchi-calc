import { SkillBase } from "./skillBase"

export class Heal extends SkillBase {
    constructor() {
        super("heal", "回復", { heal: 3 }, "ms")
    }

    execute(prop: SkillExecuteProp): Ability | null {
        const Ability = super.execute(prop)
        if (!Ability) return null
        return {
            ...Ability,
            exec: ({ judge }: AbilityExecProp) => {
                const heal = judge == "perfect" || judge == "great" ? 3 : undefined
                return {
                    ...this.skillEffect(),
                    heal
                }
            }
        }
    }

}