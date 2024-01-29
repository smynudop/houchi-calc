import { SkillBase } from "./skillBase"

export class AllRound extends SkillBase {
    constructor() {
        super("support", "サポート", { heal: 1, combo: 13 }, "ms")
    }

    execute(prop: SkillExecuteProp): Ability | null {
        const Ability = super.execute(prop)
        if (!Ability) return null
        return {
            ...Ability,
            exec: ({ judge }: AbilityExecProp) => {
                const heal = judge == "perfect" ? 1 : undefined
                return {
                    ...this.skillEffect(),
                    heal
                }

            }
        }
    }

}