import { SkillBase } from "./skillBase"

export class SsrGuard extends SkillBase {
    constructor() {
        super("guard", "ダメガ", { cut: 1 }, "ml")
    }

}

export class SrGuard extends SkillBase {
    constructor() {
        super("guard", "ダメガ", { cut: 1 }, "m")
    }

}