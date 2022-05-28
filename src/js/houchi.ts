import { Simulator } from "./simulator"
import { keyof } from "./data/data"
import { MUSIC_MAXTIME } from "./data/constants"
import { Idol, idols, damyidol } from "./idol"
import { Skill, skillList } from "./skill"
import { cards } from "./data/idol"

class SkillList {
    isGrand: boolean
    list: activatedSkill[]

    constructor(isGrand: boolean) {
        this.isGrand = isGrand
        this.list = []
    }

    push(time: number, no: number, skill: Skill) {
        let askill: activatedSkill = {
            no: no,
            time: time,
            skill: skill,
        }
        this.list.push(askill)
    }

    reset(no: number) {
        this.list = this.list.filter((s) => s.no != no)
    }

    encoreSkill(time: number): Skill {
        let no = [6, 8, 9, 7, 5, 11, 13, 14, 12, 10, 1, 3, 4, 2, 0]
        let list = this.list
            .filter((skill) => {
                return skill.time < time
            })
            .sort((a, b) => {
                if (a.time != b.time) return a.time - b.time
                return no[a.no] - no[b.no]
            })
            .reverse()

        if (!list.length) return skillList.none

        let skill = list[0].skill.copy()
        skill.nameja = `アンコール(${skill.nameja})`
        return skill
    }

    refrainSkill(time: number, no: number): Skill {
        let unitno = Math.floor(no / 5)
        let list = this.list
            .filter((skill) => {
                return (
                    skill.time <= time &&
                    Math.floor(skill.no / 5) == unitno &&
                    skill.skill.name != "refrain"
                )
            })
            .sort((a, b) => a.time - b.time)

        let max = {
            score: 0,
            combo: 0,
            sname: "なし",
            cname: "なし",
        }

        for (let askill of list) {
            let skill = askill.skill
            if (max.score < skill.score) {
                max.score = skill.score
                max.sname = skill.nameja
            }
            if (max.combo < skill.combo) {
                max.combo = skill.combo
                max.cname = skill.nameja
            }
        }

        return new Skill({
            name: "refrain",
            nameja: `リフレイン\n${max.sname}\n${max.cname}`,
            score: max.score,
            combo: max.combo,
        })
    }
}

export class Unit {
    isGrand: boolean
    idolnum: 5 | 15
    list: Idol[]
    timeline: Timeline
    matrix: Matrix
    ui: UI
    memory: Memory
    isGuestRezo: boolean
    appeal: number
    simulator: Simulator
    skillList: SkillList
    constructor(isGrand: boolean) {
        this.isGrand = isGrand

        this.idolnum = isGrand ? 15 : 5
        this.list = []
        this.isGuestRezo = false
        this.appeal = isGrand ? 420000 : 280000
        this.timeline = new Timeline(this.idolnum)
        this.matrix = new Matrix(this.idolnum)
        this.ui = new UI(this.idolnum, this)
        this.memory = new Memory(this, isGrand)
        this.simulator = new Simulator(this, this.appeal, isGrand)

        this.skillList = new SkillList(isGrand)

        this.load()
        //this.disp()
    }

    changeOffset(offset: number) {
        this.simulator.setOffset(offset)
        this.calc()
    }

    forSave(): IMemory {
        return {
            name: "hogehoge",
            member: this.list.map((i) => i.name),
            appeal: this.appeal,
        }
    }

    update(unit: IMemory) {
        this.list = unit.member.map((name) => {
            return name in idols ? idols[name] : damyidol
        })
        this.appeal = unit.appeal
        $("#appeal").val(unit.appeal)
        this.disp()
    }

    toggleisRezo(bool: boolean) {
        this.isGuestRezo = bool
        this.calc()
    }

    changeAppeal(num: number) {
        this.appeal = num
        this.simulator.setAppeal(this.appeal)
        this.simulator.calc()
    }

    changeMusicTime(num: number) {
        this.simulator.setMusictime(num)
    }

    load() {
        let unit = this.memory.loadDefault()
        if (!unit) {
            for (let i = 0; i < this.idolnum; i++) {
                this.list.push(damyidol)
            }
            return false
        }

        this.list = unit.member.map((name) => {
            return name in idols ? idols[name] : damyidol
        })
        this.appeal = unit.appeal
        $("#appeal").val(unit.appeal)

        this.simulator.setAppeal(this.appeal)
    }

    disp() {
        for (let i = 0; i < this.idolnum; i++) {
            if (this.list[i]) this.put(i)
        }
        this.calc()
    }

    resetAll() {
        for (let no = 0; no < this.idolnum; no++) {
            this.put(no, damyidol)
        }
        this.calc()
    }

    change(no: number, idolname: string) {
        let idol = idols[idolname]
        this.put(no, idol)
        this.calc()
    }

    put(no: number, idol?: Idol) {
        if (idol) this.list[no] = idol
        idol = this.list[no]

        let musictime = this.simulator.music.musictime

        let skill = idol.skill
        let unitno = Math.floor(no / 5)

        this.matrix.resetSkill(no)
        this.timeline.resetSkill(no)

        this.matrix.putIdol(no, idol)

        this.skillList.reset(no)

        if (idol.isMagic) {
            skill = this.magicSkill(no)
        }

        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            if (!idol.isActive(moment, unitno, musictime, this.isGrand)) continue
            let time = Math.floor(moment / 2)

            let isActiveTiming =
                idol.isActiveTiming(time, unitno, this.isGrand) && time == moment / 2

            if (isActiveTiming) {
                if (idol.isEncore) {
                    skill = this.skillList.encoreSkill(time)
                }
                if (idol.isRefrain) {
                    skill = this.skillList.refrainSkill(time, no)
                }

                this.skillList.push(time, no, skill)
            }

            this.timeline.useSkill(moment, no, skill)
            this.matrix.useSkill(moment, no, skill)
        }
    }

    magicSkill(no: number) {
        let unitno = Math.floor(no / 5)
        let s = {
            name: "magic",
            nameja: "マジック",
            score: 0,
            combo: 0,
            boost: 0,
            support: 0,
            heal: 0,
            cover: 0,
            guard: 0,
            slide: 0,
        }
        for (let i = 0; i < 5; i++) {
            let n = unitno * 5 + i
            let eachSkill = this.list[n].skill

            s.score = Math.max(eachSkill.score, s.score)
            s.combo = Math.max(eachSkill.combo, s.combo)
            s.boost = Math.max(eachSkill.boost, s.boost)
            s.cover = Math.max(eachSkill.cover, s.cover)
            s.guard = Math.max(eachSkill.guard, s.guard)
            s.slide = Math.max(eachSkill.slide, s.slide)
            s.heal = Math.max(eachSkill.heal, s.heal)
            s.support = Math.max(eachSkill.support, s.support)
        }
        s.nameja = `スコア${s.score}/コンボ${s.combo}\nサポ${s.support}/スキブ${s.boost}\n回復${s.heal}/ダメガ${s.guard}`
        let sk = new Skill(s)
        return sk
    }

    reputEncore() {
        for (let i = 0; i < this.idolnum; i++) {
            if (this.list[i].isMagic) {
                this.put(i)
            }
        }
        for (let i = 0; i < this.idolnum; i++) {
            if (this.list[i].isCopy) {
                this.put(i)
            }
        }
    }

    platoon(no: number) {
        return this.list.slice(no * 5, no * 5 + 5)
    }

    center(no: number) {
        return this.list[no * 5 + 2]
    }

    swap(no1: number, no2: number) {
        let pl1 = this.platoon(no1)
        let pl2 = this.platoon(no2)

        for (let i = 0; i < 5; i++) {
            this.put(no1 * 5 + i, pl2[i])
            this.put(no2 * 5 + i, pl1[i])
        }
        this.calc()
    }

    save() {
        let unit: IMemory = {
            name: "前回保存",
            appeal: this.appeal,
            member: this.list.map((idol) => idol.name),
        }
        this.memory.saveDefault(unit)
    }

    get isRezo(): boolean[] {
        if (this.isGrand) {
            return [
                this.platoon(0).some((x) => x.isRezo),
                this.platoon(1).some((x) => x.isRezo),
                this.platoon(2).some((x) => x.isRezo),
            ]
        } else {
            return [this.list.some((x) => x.isRezo) || this.isGuestRezo]
        }
    }

    calc() {
        let skills: activeSkill[] = []

        this.reputEncore()

        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            let result = this.timeline.calculate(moment, this.isRezo)
            skills.push(result)

            this.matrix.setTotalSkill(moment, result)
        }

        this.simulator.setSkill(skills)

        this.save()
    }
}

class Skills {
    list: Skill[]
    isRezo: boolean

    constructor(isRezo: boolean, num: number = 0) {
        this.isRezo = isRezo
        this.list = []
        for (let i = 0; i < num; i++) {
            this.list.push(skillList.none)
        }
    }

    static of(list: Skill[], isRezo: boolean = false) {
        let s = new Skills(isRezo)
        s.list = list.map((s) => s.copy())
        return s
    }

    copy() {
        return Skills.of(this.list, this.isRezo)
    }

    put(no: number, skill: Skill) {
        this.list[no] = skill
    }

    reset(no: number) {
        this.list[no] = skillList.none
    }

    boost(effect: IboostEffect) {
        return Skills.of(
            this.list.map((x) => x.boostEffect(effect)),
            this.isRezo
        )
    }

    sum(type: ISkillFrame): eachSkill {
        let sum: eachSkill = { name: "rezo", num: 0 }
        let magicflg = false
        for (let skill of this.list) {
            const value = +skill[type]

            if (skill.name == "magic" && magicflg) continue
            sum.num += value
            if (skill.name == "magic") magicflg = true
        }
        return sum
    }

    max(type: ISkillFrame): eachSkill {
        let max: eachSkill = { name: "damy", num: 0 }

        for (let skill of this.list) {
            const value = skill[type]

            if (value > max.num) {
                max.name = skill.name
                max.num = value
            }
        }
        return max
    }

    sumBoost(): IboostEffect {
        let boost = this.sum("boost")
        let cover = this.sum("cover")
        return {
            boost: boost.num,
            cover: cover.num,
        }
    }

    maxBoost(): IboostEffect {
        let boost = this.max("boost")
        let cover = this.max("cover")
        return {
            boost: boost.num,
            cover: cover.num,
        }
    }

    sumBuff(): activeSkill {
        return {
            support: this.sum("support").num,
            score: this.sum("score").num,
            combo: this.sum("combo").num,
            heal: this.sum("heal").num,
            guard: this.sum("guard").num,
            boost: this.sum("boost").num,
            slide: this.sum("slide").num,
            cover: 0,
        }
    }

    maxBuff(): activeSkill {
        return {
            support: this.max("support").num,
            score: this.max("score").num,
            combo: this.max("combo").num,
            heal: this.max("heal").num,
            guard: this.max("guard").num,
            boost: this.max("boost").num,
            slide: this.max("slide").num,
            cover: 0,
        }
    }

    combine(): Skills {
        let result = this.sumBuff()

        return Skills.of(
            [
                new Skill({
                    name: "rezo",
                    nameja: "レゾナンス",
                    support: result.support,
                    score: result.score,
                    combo: result.combo,
                    heal: result.heal,
                    guard: result.guard,
                    slide: result.slide,
                }),
            ],
            false
        )
    }
}

class SkillCalclator {
    static calc(skillsList: Skills[]) {
        let allSkill = Skills.of(skillsList.flatMap((x) => x.list))

        let rezoBoost = allSkill.sumBoost()
        let normalBoost = allSkill.maxBoost()

        skillsList = skillsList.map((x) => {
            if (x.isRezo) {
                return x.boost(rezoBoost).combine()
            } else {
                return x.boost(normalBoost)
            }
        })

        let skills = Skills.of(skillsList.flatMap((x) => x.list))

        return skills.maxBuff()
    }
}

class Timeline {
    idolnum: 5 | 15
    skillMatrix: Skills[]
    constructor(idolnum: 5 | 15) {
        this.idolnum = idolnum
        this.skillMatrix = []
        for (let i = 0; i < MUSIC_MAXTIME * 2; i++) {
            this.skillMatrix.push(new Skills(false, this.idolnum))
        }
    }

    calculate(time: number, isRezo: boolean[]) {
        let skills: Skills[] = []
        for (let i = 0; i < this.idolnum / 5; i++) {
            skills.push(Skills.of(this.skillMatrix[time].list.slice(i * 5, (i + 1) * 5), isRezo[i]))
        }
        return SkillCalclator.calc(skills)
    }

    useSkill(time: number, no: number, skill: Skill) {
        this.skillMatrix[time].put(no, skill)
    }

    resetSkill(no: number) {
        this.skillMatrix.forEach(function (skills) {
            skills.reset(no)
        })
    }
}

class Matrix {
    idolnum: number
    constructor(idolnum: number) {
        this.idolnum = idolnum
        this.make()
        this.on()
    }

    on() {
        $("#skilltable").on("click", "td", function () {
            let skillname = $(this).data("skillname")
            if (!/\n/.test(skillname)) {
                $("#skilldetail").hide()
                return false
            }

            let cl = $(this).attr("class")!.split(" ").pop()

            let offset = $(this).offset()!
            let detail = $("#skilldetail")
            detail.html(skillname)
            detail.css("top", Math.floor(offset.top) + "px")
            detail.css("left", Math.floor(offset.left) + 5 + "px")
            detail.attr("class", String(cl))
            detail.show()
        })
    }

    make() {
        let table = $("#skilltable")

        let tr = ""

        if (this.idolnum == 15) {
            tr +=
                "<tr><td colspan='5'>ユニットB</td><td colspan='5'>ユニットA</td><td colspan='5'>ユニットC</td><td></td><td></td><td></td></tr>"
        } else {
            tr += "<tr><td></td></tr>"
        }

        tr += "<tr id='members'>"

        for (let i = 0; i < this.idolnum; i++) {
            tr += `<td id="member_${i}" class="member">`
            tr += `<div class="icon" id="icon_${i}" data-num="${i}" ><img src="img/damy.png" width="48" height="48"/></div>`
            tr += `<div id="disc_${i}" class="disc"></div>`
            tr += "</td>"
        }

        tr += "<td class='menu' id='menu_life'>ライフ</td>"
        tr += "<td class='menu' colspan='2'>ノーツ</td>"
        tr += "<td></td>"
        tr += "</tr>"

        for (var i = 0; i < MUSIC_MAXTIME * 2; i++) {
            tr += `<tr class='timeline' id='time_${i}'>`

            for (let j = 0; j < this.idolnum; j++) {
                tr += `<td id="time_${i}_${j}" class="member_${j}"></td>`
            }
            tr += `<td id="life_${i}" class="life"></td>`
            tr += `<td id="lifestate_${i}" class="lifestate"></td>`
            tr += `<td id="notes_${i}" class="notes"></td>`

            if ((i + 1) % 20 == 1) {
                tr += `<td rowspan="20" class="sec">${i / 2 + 10}</td>`
            }

            tr += `</tr>`
        }
        table.append(tr)
    }

    useSkill(time: number, no: number, skill: Skill) {
        if (skill.name == "none") return
        $("#time_" + time + "_" + no)
            .addClass(skill.name)
            .data("skillname", skill.nameja)
    }

    setTotalSkill(moment: number, skill: activeSkill) {
        $("#notes_" + moment).data(
            "skillname",
            `スコア${skill.score}/コンボ${skill.combo}
サポ${skill.support}
回復${skill.heal}/ダメガ${skill.guard}`
        )
    }

    putIdol(no: number, idol: Idol) {
        $(`#icon_${no} img`).attr("src", "img/" + idol.name + ".png")

        if (idol.isdamy) {
            $("#disc_" + no).css("visibility", "hidden")
        } else {
            let skillname = idol.skill.nameja
            $("#disc_" + no)
                .html(skillname + "<br>" + idol.secper)
                .attr("class", `disc ${idol.type}`)
                .css("visibility", "visible")
        }
    }

    resetSkill(no: number) {
        $(".member_" + no).attr("class", `member_${no}`)
    }
}

class UI {
    unit: Unit
    idolnum: number
    selectedno: number | null
    constructor(idolnum: number, parent: Unit) {
        this.unit = parent
        this.idolnum = idolnum
        this.selectedno = null
        this.make()
        this.on()
    }

    make() {
        for (let type of keyof(skillList)) {
            if (!(type in cards)) continue

            //タブ
            let tab = `<div class="tab" data-type="${type}">${skillList[type].nameja}</div>`
            $("#il_tab").append(tab)

            // カード一覧
            let listgroop = `<div id="il_list_${type}" class="listgroop">`

            //各カード
            let beforeIdol = null
            for (let idol of cards[type]) {
                if (!beforeIdol || beforeIdol[4] != idol[4]) {
                    listgroop += `<div class="il_skillname">${skillList[idol[4]].nameja}</div>`
                }
                let p = idol[0] == "damy" ? "" : `<div><br>${idol[2] + idol[3]}</div>`
                let img = `<img src="img/alt.png" class="lazy" data-src="img/${idol[0]}.png"/>`

                listgroop += `<div class="idol" data-name="${idol[0]}">${img}${p}</div>`

                beforeIdol = idol
            }
            $("#il_list").append(listgroop)
        }

        var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"))

        let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    let lazyImage = <HTMLImageElement>entry.target
                    lazyImage.src = lazyImage.dataset.src!
                    lazyImage.classList.remove("lazy")
                    lazyImageObserver.unobserve(lazyImage)
                }
            })
        })

        lazyImages.forEach(function (lazyImage) {
            lazyImageObserver.observe(lazyImage)
        })
    }

    selectPrev() {
        if (this.selectedno === null) return false
        let no = this.selectedno - 1
        if (no < 0) no = this.idolnum - 1
        this.select(no)
    }

    selectNext() {
        if (this.selectedno === null) return false

        let no = this.selectedno + 1
        if (no >= this.idolnum) no = 0
        this.select(no)
    }

    select(num: number) {
        this.selectedno = num
        $(".icon").removeClass("icon_selected")
        $("#icon_" + num).addClass("icon_selected")
        this.mirrorToIdollist(num)
    }

    mirrorToIdollist(num: number) {
        let unit = this.unit.platoon(Math.floor(num / 5))
        $("#il_unit").empty()
        for (let [i, idol] of unit.entries()) {
            let div = $("<div></div>")
            div.addClass("icon")

            let img = $("<img />")
            img.attr("src", `img/${idol.name}.png`)

            div.append(img)
            if (i == num % 5) div.addClass("icon_selected")
            $("#il_unit").append(div)
        }
    }

    getno() {
        return this.selectedno
    }

    on() {
        let _this = this
        let unit = this.unit

        //$("#il_list").hide()

        $(".icon").click(function () {
            let num = $(this).data("num") - 0
            _this.select(num)
            $("#idollist").removeClass("hide")
        })
        $(window).keydown((e) => {
            if (e.keyCode == 37) {
                this.selectPrev()
                e.preventDefault()
            }
            if (e.keyCode == 39) {
                this.selectNext()
                e.preventDefault()
            }
            if (e.keyCode == 9) {
                e.shiftKey ? this.selectPrev() : this.selectNext()
                e.preventDefault()
            }
        })
        $("#il_close").click(function () {
            $("#idollist").addClass("hide")
        })

        $("#il_clear").click(function () {
            let num = _this.getno()
            if (num === null) return false

            unit.change(num, "damy")
            _this.mirrorToIdollist(num)
            if (window.innerWidth <= 768) {
                $("#idollist").addClass("hide")
            }
        })

        $(".idol").click(function () {
            let num = _this.getno()
            if (num === null) return false
            unit.change(num, $(this).data("name"))
            _this.mirrorToIdollist(num)
            if (window.innerWidth <= 768) {
                $("#idollist").addClass("hide")
            }
        })

        $(".tab").click(function () {
            $("div.listgroop").hide()
            $("#il_list_" + $(this).data("type"))
                .show()
                .scrollTop(0)
            //$("#il_list").show()
            //$("#il_tab").hide()
            $("div.tab").removeClass("tab_selected")
            $(this).addClass("tab_selected")
        })

        $("#il_back").click(function () {
            $("#il_tab").show()
            $("#il_list").hide()
            //$("div.tab").removeClass("tab_selected")
            //$(this).addClass("tab_selected")
        })

        $("#musictime").change(() => {
            unit.changeMusicTime(+$("#musictime").val()!)
            unit.disp()
        })

        $("#appeal").change(() => {
            unit.changeAppeal(+$("#appeal").val()!)
        })

        $("#isRezo").change(function () {
            unit.toggleisRezo($(this).prop("checked"))
        })

        $("#swapAB").click(() => unit.swap(0, 1))
        $("#swapAC").click(() => unit.swap(1, 2))
        $("#swapBC").click(() => unit.swap(0, 2))

        $("#resetAll").click(function () {
            unit.resetAll()
        })

        if (window.innerWidth > 768) {
            $("#idollist").removeClass("hide")
        }
    }
}

class Memory {
    unit: Unit
    list: IMemory[]
    isGrand: boolean
    selectedno: number | null
    constructor(parent: Unit, isGrand: boolean) {
        this.unit = parent
        this.list = []
        this.isGrand = isGrand
        this.selectedno = null

        this.load()
        this.refresh()
        this.init()
    }

    init() {
        let _this = this
        $("#memory-newsave").click(() => {
            let unit = this.unit.forSave()
            unit.name = String($("#memory-unitname").val())
            this.list.push(unit)
            this.save()
            this.refresh()
        })
        $("#memory-open").click(() => {
            if (!this.selectedno) return false
            this.unit.update(this.list[this.selectedno])
        })
        $("#memory-update").click(() => {
            if (!this.selectedno) return false
            let unitname = this.list[this.selectedno].name
            let unit = this.unit.forSave()

            unit.name = unitname
            this.list[this.selectedno] = unit
            this.save()
            this.refresh()

            alert(`${unitname}を更新しました。`)
        })
        $("#memory-delete").click(() => {
            if (!this.selectedno) return false
            let unitname = this.list[this.selectedno].name
            if (!window.confirm(`${unitname}を削除します。よろしいですか？`)) return false
            this.list.splice(this.selectedno, 1)
            this.save()
            this.refresh()
        })
    }

    refresh() {
        $("#memoryList").empty()
        for (let [i, unit] of this.list.entries()) {
            if (i == 0) continue
            $("<li></li>")
                .html(unit.name)
                .data("no", i)
                .toggleClass("selected", this.selectedno == i)
                .appendTo("#memoryList")
        }

        let _this = this
        $("#memoryList li").click(function () {
            _this.selectedno = +$(this).data("no")
            $("#memoryList li").removeClass("selected")
            $(this).addClass("selected")
        })
    }

    loadDefault(): IMemory | null {
        let name = this.isGrand ? "member_grand" : "member_normal"
        let unitold = localStorage.getItem(name)

        if (this.list.length) {
            return this.list[0]
        } else if (unitold) {
            return {
                name: "前回保存",
                member: JSON.parse(unitold),
                appeal: 420000,
            }
        } else {
            return null
        }
    }

    saveDefault(unit: IMemory) {
        this.list[0] = unit
        this.save()
    }

    get(index: number) {
        return this.list[index]
    }

    load() {
        let name = this.isGrand ? "memory_grand" : "memory_normal"

        let units = localStorage.getItem(name)
        if (!units) return false
        this.list = JSON.parse(units)
    }

    save() {
        let name = this.isGrand ? "memory_grand" : "memory_normal"
        localStorage.setItem(name, JSON.stringify(this.list))
    }

    add(unit: IMemory) {
        this.list.push(unit)
    }
}

let headerTarget: any = null

$(function () {
    $("#menu li").click(function () {
        $(".header-content").hide()
        let target = $(this).data("target")
        if (target != headerTarget) {
            $(`#header-${target}`).show()
            headerTarget = target
        } else {
            headerTarget = null
        }
    })
})
