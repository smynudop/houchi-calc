<script setup lang="ts">

import { ref, reactive, onMounted, withDefaults, computed } from "vue"
import { Unit, CalcResponse, CalcMomentInfo } from "../js/houchi"
import { getScoreList } from "../js/data/score";
import { Idol, idols, damyidol } from "../js/idol"

import IdolList from "./IdolList.vue"
import Tabs from "./Tabs.vue"
import SkillTable from "./SkillTable.vue"
import Markdown from "./Markdown.vue";
import Timeline from "./Timeline.vue";

const props = withDefaults(defineProps<{
    isGrand: boolean,
    isHouchi: boolean
}>(), {
    isGrand: true,
    isHouchi: true
})

const tabs = [
    { id: "unit", name: "編成" },
    { id: "timeline", name: "タイムライン" },
    { id: "unitDetail", name: "発動詳細" },
    { id: "log", name: "発動ログ" },
    { id: "usage", name: "つかいかた" },

]

const scores = getScoreList(props.isGrand)
const option = reactive<{
    isGuestRezo: boolean,
    appeal: number,
    scorePath: string
}>({
    isGuestRezo: false,
    appeal: props.isGrand ? 420000 : 280000,
    scorePath: scores[0].path
})
const idolnum = ref<number>(15)
//const isShowIdolList = ref<boolean>(true)
const selectedNo = ref<number>(0)


let unit = new Unit(props.isGrand, props.isHouchi)
idolnum.value = unit.idolnum

const usage = `
# 放置編成シミュレータ v2

デレステの放置編成をシミュレーションできます。本家ぽいタイムラインとかの機能があります。

## 既知の不具合

- V1とスコアが合わない場合がある。
- 現在ライフ計算ができない。
- ほか多数

## 更新履歴

- 1/29 このドキュメントを書いた。

`
type StorageUnits = {
    name: string
    isRezo: boolean
    idols: string[]
}
const units = ref<StorageUnits[]>([])
const currentUnitIndex = ref(0)
const currentUnit = computed<StorageUnits>(() => {
    const result = units.value[currentUnitIndex.value]
    return result ?? {
        name: "",
        idols: []
    }
})
const currentUnitIdols = ref<Idol[]>([])
for (let i = 0; i < idolnum.value; i++) {
    currentUnitIdols.value.push(damyidol)
}

const rezoChange = (e: Event) => {
    currentUnit.value.isRezo = option.isGuestRezo
    calc()
}

const calcResponse = ref<CalcResponse>({
    momentInfo: [],
    logs: [],
    musicName: "",
    totalScore: 0,
    unitLife: 0,
    dangerTime: 0,
    maxCombo: 0
})

const setUnit = () => {
    option.isGuestRezo = currentUnit.value.isRezo
    const idolnames = currentUnit.value.idols
    for (let i = 0; i < idolnames.length; i++) {
        const idol = idols.get(idolnames[i]) ?? damyidol
        currentUnitIdols.value[i] = idol
    }
    calc()
    save()
}

const changeIdol = async (idolname: string | null) => {
    let idol: Idol | undefined
    if (idolname == null) {
        idol = damyidol
    } else {
        idol = idols.get(idolname)
        if (idol == null) idol = damyidol
    }
    currentUnitIdols.value[selectedNo.value] = idol
    currentUnit.value.idols[selectedNo.value] = idol.name

    calc()
}

const calc = async () => {
    calcResponse.value = await unit.calc({
        ...option,
        idols: currentUnitIdols.value,
    })
    save()
}

const swap = (a: number, b: number) => {
    for (let i = 0; i < 5; i++) {
        let x = a * 5 + i
        let y = b * 5 + i

        const tmp = currentUnitIdols.value[x]
        currentUnitIdols.value[x] = currentUnitIdols.value[y]
        currentUnitIdols.value[y] = tmp
    }
    calc()
}

const resetAll = () => {
    for (let i = 0; i < currentUnitIdols.value.length; i++) {
        currentUnitIdols.value[i] = damyidol
    }
    calc()
}
const selectFrame = (frame: number) => {
    selectedNo.value = frame
}

const initUnits = () => {
    const damyUnit: string[] = []
    for (let i = 0; i < unit.idolnum; i++) {
        damyUnit.push("damy")
    }

    units.value = []
    for (let i = 0; i < 18; i++) {
        units.value.push({ name: "ユニット" + (i + 1), idols: damyUnit.slice(), isRezo: false })
    }
    save()
}

const prevUnit = () => {
    currentUnitIndex.value--
    if (currentUnitIndex.value < 0) currentUnitIndex.value += 18
    isUnitnameEdit.value = false
    setUnit()
}

const nextUnit = () => {
    currentUnitIndex.value++
    if (currentUnitIndex.value >= 18) currentUnitIndex.value -= 18
    isUnitnameEdit.value = false
    setUnit()
}

const storageKey = computed(() => {
    const grand = props.isGrand ? "grand" : "normal"
    const houchi = props.isHouchi ? "houchi" : "gachi"
    return `units_${grand}_${houchi}`
})

const load = () => {


    const val = localStorage.getItem(storageKey.value)
    if (val == null) {
        initUnits()
    } else {
        try {
            units.value = JSON.parse(val)
        } catch (e) {
            initUnits()
        }
    }
}

const save = () => {
    localStorage.setItem(storageKey.value, JSON.stringify(units.value.slice()))
}

const isUnitnameEdit = ref<boolean>(false)
const endUnitNameEdit = () => {
    isUnitnameEdit.value = false
    save()
}

onMounted(async () => {
    load()
    setUnit()
    calc()
})

</script>

<template>
    <main>
        <div id="simulator">
            曲名：
            <select id="simulator_music" v-model="option.scorePath" @change="calc">
                <option value="">
                    ▼選択
                </option>
                <option v-for="score in scores" :value="score.path">
                    {{ score.name }}
                </option>
            </select><br />
            アピール値:
            <input type="number" v-model="option.appeal" @change="calc" /><br />
            スコア：{{ calcResponse?.totalScore }}<br />
            必要ライフ：{{ calcResponse?.unitLife }}<br />
            miss区間：{{ calcResponse?.dangerTime }}秒<br />
            MAXコンボ：{{ calcResponse?.maxCombo }}<br />
        </div>



        <Tabs :tabs="tabs" class="tabs">
            <template v-slot:common>
                <div class="unitchange">
                    <div class="navi" @click="prevUnit">＜</div>
                    <div class="unitname">
                        <div v-if="isUnitnameEdit">
                            <input type="text" v-model="currentUnit.name">
                            <button type="button" @click="endUnitNameEdit">完了</button>
                        </div>
                        <div v-else>
                            {{ currentUnit.name }}
                            <button type="button" @click="isUnitnameEdit = true">編集</button>
                        </div>
                    </div>
                    <div class="navi" @click="nextUnit">＞</div>
                </div>
            </template>
            <template v-slot:timeline>
                <Timeline :idols="currentUnitIdols" :moment-info="calcResponse?.momentInfo" />
            </template>
            <template v-slot:unit>
                <template v-if="isGrand">
                    <button type="button" @click="swap(0, 1)">AB入替●●○</button>
                    <button type="button" @click="swap(0, 2)">BC入替●○●</button>
                    <button type="button" @click="swap(1, 2)">AC入替○●●</button>
                </template>
                <template v-if="!isGrand">
                    ゲストレゾ
                    <input type="checkbox" v-model="option.isGuestRezo" @change="rezoChange" />
                </template>
                <button type="button" @click="resetAll">編成リセット</button>
                <idol-list :idols="currentUnitIdols" :selected-no="selectedNo" @clear="changeIdol(null)"
                    @select-idol="(idol: IdolProfile) => changeIdol(idol[0])" @select-frame="selectFrame" />
            </template>
            <template v-slot:unitDetail>
                <template v-if="isGrand">
                    <button type="button" @click="swap(0, 1)">AB入替●●○</button>
                    <button type="button" @click="swap(0, 2)">BC入替●○●</button>
                    <button type="button" @click="swap(1, 2)">AC入替○●●</button>
                </template>
                <template v-if="!isGrand">
                    ゲストレゾ
                    <input type="checkbox" v-model="option.isGuestRezo" @change="calc" />
                </template>
                <button type="button" @click="resetAll">全リセット</button>
                <SkillTable :idols="currentUnitIdols" :moment-info="calcResponse?.momentInfo" :selected-no="selectedNo"
                    @select-frame="selectFrame"></SkillTable>
            </template>
            <template v-slot:log>
                <div class="logcontainer">
                    <div class="eachlog" v-for="log in calcResponse?.logs">{{ log }}</div>
                </div>
            </template>
            <template v-slot:usage>
                <Markdown v-html="usage" />
            </template>
        </Tabs>
    </main>

    <div id="skilldetail">
    </div>
</template>

<style lang="scss">
button {
    border-radius: 3px;
    border: 1px solid #999;
}
</style>

<style scoped lang="scss">
input[type="text"],
input[type="number"] {
    width: 80px;
}

select {
    max-width: 200px;
}


header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: var(--bg-color);
}

main {
    width: 100%;
    padding: 5px;
}

.unitchange {
    display: flex;
    width: 100%;
    max-width: 640px;
    margin: 1em 0;
    height: 2em;
    line-height: 2em;

    gap: 0.25rem;

    .unitname {
        flex-grow: 1;
        text-align: center;
        border: 1px solid #666;
        border-radius: .5em;
    }

    .navi {
        flex-basis: 2em;
        flex-shrink: 1;
        text-align: center;
        border-radius: 1em;
        background-color: #666;
        color: white;
        user-select: none;
        cursor: pointer;
    }
}

.tabs {
    width: 100%;
}

#simulator {
    width: 100%;
    max-width: 640px;
    border: 2px solid #666;
    padding: 5px;
    margin-bottom: 10px;
}

.logcontainer {
    font-size: 0.8rem;
    white-space: pre-wrap;
}


.idollist {
    margin-top: 5px;
}
</style>