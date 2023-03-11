<script setup lang="ts">

import { ref, reactive, onMounted, withDefaults, computed } from "vue"
import { Unit, CalcResponse, CalcMomentInfo } from "../js/houchi"
import { getScoreList } from "../js/data/score";
import { Idol, idols, damyidol } from "../js/idol"

import IdolList from "./IdolList.vue"
import AppHeader from "./AppHeader.vue";
import Memory from "./Memory.vue";
import Tabs from "./Tabs.vue"
import SkillTable from "./SkillTable.vue"
import Markdown from "./Markdown.vue";

const props = withDefaults(defineProps<{
    isGrand: boolean,
    isHouchi: boolean
}>(), {
    isGrand: true,
    isHouchi: true
})

const headerTabs = [
    { id: "memory", name: "編成記憶" }
]
const tabs = [
    { id: "unit", name: "編成" },
    { id: "unitDetail", name: "発動詳細" },
    { id: "log", name: "発動ログ" },
    { id: "usage", name: "つかいかた" }
]

const scores = getScoreList(props.isGrand)
const option = reactive<{
    isGuestRezo: boolean,
    appeal: number,
    musictime: number,
    scorePath: string
}>({
    isGuestRezo: false,
    appeal: 420000,
    musictime: 120,
    scorePath: scores[0].path
})
const idolnum = ref<number>(15)
//const isShowIdolList = ref<boolean>(true)
const selectedNo = ref<number>(0)


let unit = new Unit(props.isGrand, props.isHouchi)
idolnum.value = unit.idolnum

const usage = `
# 放置編成シミュレータ

デレステの放置編成をシミュレーションできます。

## h2

あああ

### h3

- リスト
- リスト 
- リスト

`

const _idols = ref<Idol[]>([])
for (let i = 0; i < idolnum.value; i++) {
    _idols.value.push(damyidol)
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

const changeIdol = async (idolname: string | null) => {
    let idol: Idol
    if (idolname == null) {
        idol = damyidol
    } else {
        idol = idols[idolname]
        if (idol == null) idol = damyidol
    }
    _idols.value[selectedNo.value] = idol

    calc()
}

const calc = async () => {
    calcResponse.value = await unit.calc({
        ...option,
        idols: _idols.value,
    })
}
const swap = (a: number, b: number) => {
    for (let i = 0; i < 5; i++) {
        let x = a * 5 + i
        let y = b * 5 + i

        const tmp = _idols.value[x]
        _idols.value[x] = _idols.value[y]
        _idols.value[y] = tmp
    }
    calc()
}
const resetAll = () => {
    for (let i = 0; i < _idols.value.length; i++) {
        _idols.value[i] = damyidol
    }
    calc()
}
const selectFrame = (frame: number) => {
    selectedNo.value = frame
}

const idolsByPlatoon = computed(() => {
    const result: Idol[][] = []
    for (let i = 0; i < _idols.value.length / 5; i++) {
        result.push(_idols.value.slice(i * 5, (i + 1) * 5))
    }
    return result
})


onMounted(async () => {
    calc()
})

</script>

<template>
    <!-- <app-header :tabs="headerTabs">
        <template v-slot:usage>
            ・TODO
        </template>
        <template v-slot:memory>
            <memory :unit="_idols" :appeal="option.appeal" @load="loadMemory"></memory>
        </template>
    </app-header>

    <div style="height: 20px;"></div> -->

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
            曲の秒数：
            <input type="number" v-model="option.musictime" @change="calc" /><br />
            スコア：{{ calcResponse?.totalScore }}<br />
            必要ライフ：{{ calcResponse?.unitLife }}<br />
            miss区間：{{ calcResponse?.dangerTime }}秒<br />
            MAXコンボ：{{ calcResponse?.maxCombo }}<br />
        </div>

        <Tabs :tabs="tabs">
            <template v-slot:unit>
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
                <idol-list :idols="_idols" :selected-no="selectedNo" @clear="changeIdol(null)"
                    @select-idol="(idol) => changeIdol(idol[0])" @select-frame="selectFrame" />
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
                <SkillTable :idols="_idols" :moment-info="calcResponse?.momentInfo" :selected-no="selectedNo"
                    @select-frame="selectFrame"></SkillTable>
            </template>
            <template v-slot:log>
                <div class="eachlog" v-for="log in calcResponse?.logs">{{ log }}</div>
            </template>
            <template v-slot:usage>
                <Markdown v-html="usage" />
            </template>
        </Tabs>
    </main>

    <div id="skilldetail">
    </div>
</template>

<style scoped lang="scss">
input[type="text"],
input[type="number"] {
    width: 80px;
}

select {
    max-width: 150px;
}


header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: var(--bg-color);
}

main {
    padding: 5px;
}

#simulator {
    width: 100%;
    max-width: 640px;
    border: 2px solid #666;
    padding: 5px;
    margin-bottom: 10px;
}


.idollist {
    margin-top: 5px;
}
</style>