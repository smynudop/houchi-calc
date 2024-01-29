export class SkillBase implements ISkill {
    type: ISkillName
    nameja: string
    activeSkill: Buff
    isMagic: boolean = false
    isEncore: boolean = false
    atype: ATime

    constructor(type: ISkillName, nameja: string, activeSkill: Buff, atype: ATime) {
        this.type = type
        this.nameja = nameja
        this.activeSkill = activeSkill
        this.atype = atype
    }

    skillEffect(): SkillEffect {
        return {
            name: this.type,
            nameja: this.nameja,
            ...this.activeSkill
        }
    }

    execute({ logger }: SkillExecuteProp): Ability | null {
        logger.log(`${this.nameja}が発動しました`)


        return {
            type: this.type,
            nameja: this.nameja,
            executeType: this.type,
            isMagic: false,
            isEncoreTarget: true,
            isApplyTarget: true,
            exec: (prop: AbilityExecProp) => this.skillEffect(),
        }
    }
}