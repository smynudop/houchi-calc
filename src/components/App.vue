<script setup lang="ts">

import { ref, reactive, onMounted, withDefaults } from "vue"
import { Unit, CalcResponse, CalcMomentInfo } from "../js/houchi"
import { getScoreList } from "../js/data/score";
import { Idol, idols, damyidol } from "../js/idol"

import IdolList from "./IdolList.vue"
import AppHeader from "./AppHeader.vue";
import Memory from "./Memory.vue";

const props = withDefaults(defineProps<{
    isGrand: boolean,
    isHouchi: boolean
}>(), {
    isGrand: true,
    isHouchi: true
})

const tabs = [
    { id: "usage", name: "つかいかた" },
    { id: "memory", name: "編成記憶" }
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
const isShowIdolList = ref<boolean>(true)
const showAllLog = ref<boolean>(false)
const selectedNo = ref<number>(0)






let unit = new Unit(props.isGrand, props.isHouchi)
idolnum.value = unit.idolnum
// const res = await unit.calc()

const _idols = ref<Idol[]>([])
for (let i = 0; i < idolnum.value; i++) {
    _idols.value.push(damyidol)
}

const calcResponse = ref<CalcResponse>()

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
const changeIsRezo = () => {
    calc()
}
const changeAppeal = () => {
    calc()
}
const changeMusicTime = () => {
    calc()
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
    isShowIdolList.value = true
}
const onMusicChange = async () => {
    calc()
}
const noteCssClass = (info: CalcMomentInfo) => {
    return `notenum_${info.notesLength} notes_${info.judge}`
}

const loadMemory = (memory: IMemory) => {
    option.appeal = memory.appeal
    for (let [i, member] of memory.member.entries()) {
        const idol = idols[member] ?? damyidol
        _idols.value[i] = idol
    }
    calc()
}

onMounted(async () => {
    calc()
})

</script>

<template>
    <div>
        <app-header :tabs="tabs">
            <template v-slot:usage>
                ・TODO
            </template>
            <template v-slot:memory>
                <memory :unit="_idols" :appeal="option.appeal" @load="loadMemory"></memory>
            </template>
        </app-header>

        <div style="height: 20px;"></div>

        <div id="main">
            <div id="simulator">
                曲名：{{ calcResponse?.musicName }}<br />
                スコア：{{ calcResponse?.totalScore }}<br />
                必要ライフ：{{ calcResponse?.unitLife }}<br />
                miss区間：{{ calcResponse?.dangerTime }}<br />
                MAXコンボ：{{ calcResponse?.maxCombo }}<br />
            </div>
            <div id="log">
                <a @click="showAllLog = !showAllLog">ログを表示</a>
                <div v-if="showAllLog">
                    <div v-for="log in calcResponse?.logs">{{ log }}</div>
                </div>
            </div>
            <div id="status">
                <div class="status_box">
                    曲の秒数：
                    <input type="number" v-model="option.musictime" @change="changeMusicTime" />
                </div>
                <div class="status_box">
                    アピール値:
                    <input type="number" v-model="option.appeal" @change="changeAppeal" />
                </div>
                <div class="status_box">
                    レゾ判定
                    <input type="checkbox" v-model="option.isGuestRezo" @change="changeIsRezo" />
                </div>
                <div class="status_box">
                    シミュレータ:
                    <select id="simulator_music" v-model="option.scorePath" @change="onMusicChange">
                        <option value="">
                            ▼選択
                        </option>
                        <option v-for="score in scores" :value="score.path">
                            {{ score.name }}
                        </option>
                    </select>
                </div>

                <input type="button" value="AB入替●●○" @click="swap(0, 1)" />
                <input type="button" value="BC入替●○●" @click="swap(0, 2)" />
                <input type="button" value="AC入替○●●" @click="swap(1, 2)" />
                <input type="button" value="全リセット" @click="resetAll" />

            </div>

            <div id="matrix">
                <table id="skilltable">
                    <tr>
                        <td colspan="5">ユニットB</td>
                        <td colspan="5">ユニットA</td>
                        <td colspan="5">ユニットC</td>
                    </tr>

                    <tr id="members">
                        <td v-for="idol, i in _idols" class="member" :key="i">
                            <div class="icon" :class="{ 'icon_selected': selectedNo == i }" @click="selectFrame(i)">
                                <img :src="'img/' + idol.name + '.png'" width="48" height="48" />
                            </div>
                            <div class="disc" :class="idol.type" v-if="!idol.isdamy">
                                {{ idol.skill.nameja }}<br />
                                {{ idol.secper }}

                            </div>
                        </td>
                        <td class='menu' id='menu_life'>ライフ</td>
                        <td class='menu' colspan='2'>ノーツ</td>
                        <td></td>
                    </tr>

                    <tr v-for="info in calcResponse?.momentInfo" class="timeline">
                        <td v-for="skill in info.skillList" :class="skill?.type">
                        </td>
                        <td class="life" :class="'lifeper-' + info.life"></td>
                        <td class="lifestate" :class="{ 'danger': info.judge == 'miss' }"></td>
                        <td class="notes" :class="noteCssClass(info)"></td>
                        <td v-if="info.moment % 20 == 0" rowspan="20" class="sec">{{ (info.moment) / 2 + 10}}</td>
                    </tr>
                </table>
            </div>
            <div style="height: 50px"></div>

        </div>
        <idol-list v-show="isShowIdolList" @close="isShowIdolList = false" @clear="changeIdol(null)"
            @select-idol="(idol) => changeIdol(idol[0])" />
        <div id="skilldetail">
        </div>
    </div>
</template>

<style scoped lang="scss">
header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: var(--bg-color);
}

#simulator,
#log,
#status {
    width: 100%;
    max-width: 640px;
    border: 2px solid #666;
    padding: 5px;
    margin-bottom: 10px;
}

#log {
    white-space: pre-wrap;
    font-family: monospace;
}
</style>