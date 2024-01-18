import { Simulator } from "./simulator"
import { keyof } from "./data/data"
import { MUSIC_MAXTIME } from "./data/constants"
import { Idol, idols, damyidol } from "./idol"
import { cards } from "./data/idol"
import { SkillList } from "./skill"
import { SkillHelper } from "./skillHelper"

export class Unit {
    isGrand: boolean
    idolnum: 5 | 15
    list: Idol[]
    matrix: Matrix
    ui: UI
    memory: Memory
    isGuestRezo: boolean
    appeal: number
    simulator: Simulator
    isHouchi: boolean
    constructor(isGrand: boolean, isHouchi = true) {
        this.isGrand = isGrand
        this.isHouchi = isHouchi

        this.idolnum = isGrand ? 15 : 5
        this.list = []
        this.isGuestRezo = false
        this.appeal = isGrand ? 420000 : 280000
        this.matrix = new Matrix(this.idolnum)
        this.ui = new UI(this.idolnum, this)
        this.memory = new Memory(this, isGrand)
        this.simulator = new Simulator(this, this.appeal, isGrand, isHouchi)

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

        this.matrix.putIdol(no, idol)
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
        let musictime = this.simulator.music.musictime

        this.matrix.resetSkill()

        let activateSkillList: Buff[] = []
        let applyResutLogList = new AbilityList()
        let logs: string[] = []

        for (let time = 0; time < MUSIC_MAXTIME; time++) {
            for (let no = 0; no < this.idolnum; no++) {
                let idol = this.list[no]
                let unitno = Math.floor(no / 5)

                let isActiveTiming = idol.isActiveTiming(time, unitno, musictime, this.isGrand) || idol.isEternal

                if (isActiveTiming && idol.skill.type != "none") {
                    let skills = this.list
                        .filter((x, i) => Math.floor(i / 5) == unitno)
                        .map((x) => x.skill)

                    let encoreAbility = applyResutLogList.getEncoreTarget(time)

                    let ability = idol.skill.execute(activateSkillList, encoreAbility, skills)
                    if (ability.isEncoreTarget) {
                        applyResutLogList.push(time, no, ability)
                    }

                    logs.push(`${time}s: ${ability.message}`)

                    let response = ability.exec(0)
                    activateSkillList = activateSkillList.concat(response.activateBuffs)

                    this.matrix.useSkill(time, idol.atime, no, ability)
                }
            }
        }

        let skills: FinallyAbility[] = []

        for (let moment = 0; moment < MUSIC_MAXTIME * 2; moment++) {
            let result = this.matrix.calculate(moment, this.isRezo)
            skills.push(result)

            //this.matrix.setTotalSkill(moment, result)
        }

        this.simulator.setSkill(skills)

        console.log(logs.join("\n"))

        this.save()
    }
}

class AbilityList {
    list: AbilityLog[]
    constructor() {
        this.list = []
    }

    clear() {
        this.list = []
    }

    push(time: number, position: number, ability: Ability) {
        this.list.push({
            time: time,
            position: position,
            ability: ability,
        })
    }

    getEncoreTarget(time: number) {
        //アンコールターゲットを確認
        let order = [9, 7, 6, 8, 10, 4, 2, 1, 3, 5, 14, 12, 11, 13, 15]

        const list = this.list
            .filter((x) => x.ability != null)
            .filter((x) => x.time < time)
            .sort((a, b) => a.time - b.time || order[b.position] - order[a.position] || 0)
            .reverse()

        if (list.length == 0) {
            return null
        } else {
            return list[0].ability
        }
    }
}

class Skills {
    list: (Ability | null)[]
    isRezo: boolean

    constructor(list: (Ability | null)[], isRezo: boolean = false) {
        this.isRezo = isRezo
        this.list = list
    }

    static of(num: number = 0, isRezo: boolean = false) {
        let list: (Ability | null)[] = []
        for (let i = 0; i < num; i++) {
            list.push(null)
        }
        return new Skills(list, isRezo)
    }

    put(no: number, skill: Ability | null) {
        this.list[no] = skill
    }

    reset(no: number) {
        this.list[no] = null
    }
}

class Matrix {
    idolnum: 5 | 15
    skillMatrix: Skills[]

    constructor(idolnum: 5 | 15) {
        this.idolnum = idolnum
        this.make()
        this.on()

        this.skillMatrix = []
        for (let i = 0; i < MUSIC_MAXTIME * 2; i++) {
            this.skillMatrix.push(Skills.of(this.idolnum, false))
        }
    }

    on() {
        $("#skilltable").on("click", "td", function () {
            let skillname = $(this).data("skillname")
            if (!skillname) {
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

    calculate(time: number, isRezo: boolean[]) {
        return SkillHelper.calc(this.skillMatrix[time].list, isRezo)
    }

    useSkill(time: number, mDuration: number, no: number, skill: Ability | null) {
        if (skill == null) {
            return
        }

        if (skill.type == "none") return

        for (let d = 0; d < mDuration; d++) {
            let moment = time * 2 + d
            this.skillMatrix[moment]?.put(no, skill)
            $(`#time_${moment}_${no}`).addClass(skill.type).data("skillname", skill.nameja)
        }
    }

    setTotalSkill(moment: number, skill: RequiredBuff) {
        const cut = skill.guard >= 1 ? "100%" : `${skill.cut}%`
        $("#notes_" + moment).data(
            "skillname",
            `スコア${skill.score}/コンボ${skill.combo}
サポ${skill.support}
回復${skill.heal}/ダメカ${cut}`
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

    resetSkill() {
        for (let no = 0; no < this.idolnum; no++) {
            this.skillMatrix.forEach(function (skills) {
                skills.reset(no)
            })
            $(".member_" + no).attr("class", `member_${no}`)
        }
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
        for (let type of keyof(cards)) {
            if (!(type in cards)) continue

            let genrename = ""
            if (type in SkillList) {
                //@ts-ignore
                genrename = SkillList[type].nameja
            } else {
                genrename = type.toString()
            }

            //タブ
            let tab = `<div class="tab" data-type="${type}">${genrename}</div>`
            $("#il_tab").append(tab)

            // カード一覧
            let listgroop = `<div id="il_list_${type}" class="listgroop">`

            //各カード
            let beforeIdol = null
            for (let idol of cards[type]) {
                if (!beforeIdol || beforeIdol[4] != idol[4]) {
                    listgroop += `<div class="il_skillname">${SkillList[idol[4]].nameja}</div>`
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
