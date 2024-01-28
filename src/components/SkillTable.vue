<script setup lang="ts">
import { Idol } from "../js/idol"
import IdolVue from "./Idol.vue";
import { CalcMomentInfo } from "../js/houchi"

defineProps<{
    idols: Idol[]
    selectedNo: number
    momentInfo: CalcMomentInfo[]
}>()
const emits = defineEmits<{
    (e: "selectFrame", val: number): void
}>()
const noteCssClass = (info: CalcMomentInfo) => {
    if (!info.danger && info.judge == "miss") {
        return `notes_guard`
    }
    return `notes_${info.judge}`
}
const selectFrame = (frame: number) => {
    emits("selectFrame", frame)
}
</script>


<template>
    <div id="tableWrapper">
        <table id="skilltable">
            <tr v-show="idols.length == 15">
                <td colspan="5">ユニットB</td>
                <td colspan="5">ユニットA</td>
                <td colspan="5">ユニットC</td>
            </tr>

            <tr id="members">
                <td v-for="idol, i in idols" class="member" :key="i">
                    <idol-vue @click="selectFrame(i)" :idol="idol" :selected="selectedNo == i" />
                </td>
                <td class='menu' id='menu_life'>ライフ</td>
                <td class='menu' colspan='2'>ノーツ</td>
                <td></td>
            </tr>

            <tr v-for="info in momentInfo" class="timeline">
                <td v-for="skill in info.skillList" :class="skill?.executeType">
                </td>
                <td class="life" :class="'lifeper-' + info.life"></td>
                <td class="lifestate" :class="{ 'danger': info.danger }"></td>
                <td class="notes">
                    <div v-for="note in info.notes" class="note" :class="noteCssClass(info)"></div>
                </td>
                <td v-if="info.moment % 20 == 0" rowspan="20" class="sec">{{ (info.moment) / 2 + 10 }}
                </td>
            </tr>
        </table>
    </div>
</template>

<style scoped lang="scss">
#skilltable {
    border-collapse: collapse;
    border-spacing: 0;
    table-layout: fixed;
}

td {
    text-align: center;

    &.sec {
        width: 15px;
        font-size: 8px;
        text-align: left;
        vertical-align: bottom;
        border-bottom: 1px solid #666;
    }

    &.lifestate {
        width: 10px;
    }

    &.life {
        width: 50px;
        min-width: 50px;
        border-right: 1px solid #666;
    }

    &.notes {
        width: 80px;
        min-width: 80px;
        display: flex;
        border-right: 1px solid #666;



        .note {
            width: 5px;
            height: 5px;
            border: 1px solid rgba(255, 255, 255, 0.8);

            &.notes_perfect {
                background-color: navy;
            }

            &.notes_danger,
            &.notes_miss {
                background-color: darkorange;
            }

            &.notes_guard {
                background-color: darkgray;
            }
        }
    }

    &.info {
        width: 50px;
    }

}


tr.timeline {

    &:nth-of-type(10n + 2) td {
        border-bottom: 1px solid #666;
    }

    td {
        height: 5px;

        &:nth-child(1) {
            border-left: 1px solid #666;
        }

        &:nth-child(5),
        &:nth-child(10),
        &:nth-child(15) {
            border-right: 1px solid #666;

        }
    }


}

td.member {
    border-top: 1px solid #666;
}



tr#members td {
    position: sticky;
    top: 0px;
    background-color: white;
    border-bottom: 1px solid #666;

    &:first-of-type {
        border-left: 1px solid #666;
    }

    &:nth-of-type(5n) {
        border-right: 1px solid #666;
    }
}


.menu {
    border-right: 1px solid #666;
    border-top: 1px solid #666;
    font-size: 10pt;
}
</style>