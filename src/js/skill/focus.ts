import { SkillBase } from "./skillBase"

export class CuteFocus extends SkillBase {
    constructor() {
        super("focus", "フォーカス", { score: 16, combo: 14 }, "m")
    }

    execute(prop: SkillExecuteProp): Ability | null {
        if (!prop.platoonIdols.every(i => i.attr == "cu")) {
            prop.logger.log("条件を満たしていないため、フォーカスは発動しません。")
            return null
        }

        prop.logger.log(`${this.nameja}が発動しました`)

        const exec = ({ judge }: AbilityExecProp) => {
            const score = judge == "perfect" ? 16 : undefined
            return {
                ...this.skillEffect(),
                score
            }
        }

        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: false,
            isEncoreTarget: true,
            isApplyTarget: true,
            exec,
        }
    }

}