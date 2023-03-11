<script setup lang="ts">
import { ref, computed } from "vue"
import { cards } from "../js/data/idol"
import { Idol, idols } from "../js/idol";
import IdolVue from "./Idol.vue";
import Flicking from "@egjs/vue3-flicking"


const props = defineProps<{
    idols: Idol[]
    selectedNo: number
}>()

const emits = defineEmits<{
    (e: "clear"): void
    (e: "selectFrame", val: number): void
    (e: "select-idol", idol: IdolProfile): void
}>()
const skillTypes = Object.keys(cards)
const currentTab = ref<string>(skillTypes[0])

function onClearButtonClick() {
    emits("clear")
}
function changeTab(tabName: string) {
    currentTab.value = tabName
}
function selectIdol(idol: IdolProfile) {
    emits("select-idol", idol)
}
function selectFrame(frame: number) {
    emits("selectFrame", frame)
}

const idolsByPlatoon = computed(() => {
    const result: Idol[][] = []
    for (let i = 0; i < props.idols.length / 5; i++) {
        result.push(props.idols.slice(i * 5, (i + 1) * 5))
    }
    return result
})

const flicking = ref<Flicking>()
const flickingIndex = ref<number>(0)
const hasPrev = computed(() => {
    return flickingIndex.value > 0
})
const hasNext = computed(() => {
    return flickingIndex.value < (flicking.value?.panelCount ?? 0) - 1
})

const onMoveEnd = (e: any) => {
    flickingIndex.value = e.index
}

const selectPrev = () => {
    if (hasPrev) {
        flicking.value?.prev()
    }
}

const selectNext = () => {
    if (hasNext) {
        flicking.value?.next()
    }
}

const isTate = ref<boolean>(false)


</script>

<template>
    <button type="button" @click="isTate = !isTate">一覧表示</button>
    <button type="button" @click="onClearButtonClick">クリア</button>
    <div class="unit">
        <Flicking v-if="!isTate" ref="flicking" @changed="onMoveEnd" class="unit-yoko">
            <div v-for="platoon, p in idolsByPlatoon" :key="p" class="platoon">
                <idol-vue v-for="idol, i in platoon" @click="selectFrame(p * 5 + i)" :idol="idol"
                    :selected="selectedNo == p * 5 + i" />
                <!-- <div v-for="idol, i in platoon" :key="(p * 5 + i)" class="icon"
                    :class="{ 'icon_selected': selectedNo == p * 5 + i }" @click="selectFrame(p * 5 + i)">
                    <img :src="'img/' + idol.name + '.png'" width="48" height="48" />
                </div> -->
            </div>
        </Flicking>
        <div class="unit-tate" v-else>
            <div v-for="platoon, p in idolsByPlatoon" :key="p" class="platoon">
                <idol-vue v-for="idol, i in platoon" @click="selectFrame(p * 5 + i)" :idol="idol"
                    :selected="selectedNo == p * 5 + i" />
            </div>
        </div>
        <div v-if="!isTate" class="prev navi-button" @click="selectPrev" v-show="hasPrev">←</div>
        <div v-if="!isTate" class="next navi-button" @click="selectNext" v-show="hasNext">→</div>
    </div>
    <div id="idollist">

        <div id="il_tab">
            <div v-for="t in skillTypes" class="tab" @click="changeTab(t)" :class="{ 'tab_selected': currentTab == t }">
                {{ t }}
            </div>
        </div>
        <div id="il_list">
            <div class="listgroop" v-for="skilltype in skillTypes" v-show="skilltype == currentTab">
                <div v-for="idol of cards[skilltype]" class="idol" :data-name="idol[0]" @click="selectIdol(idol)">
                    <img :src="'img/' + idol[0] + '.png'" loading="lazy" />
                    <div class="secper">
                        {{ idol[2] + idol[3] }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
//@import url("node_modules/@egjs/vue-flicking/dist/flicking.css");

$bgColor: rgb(227, 229, 233);

#idollist {
    //position: fixed;
    //right: 0;
    //bottom: 0;
    //width: 400px;
    //height: 550px;
    width: 100%;
    max-width: 480px;
    //height: 600px;
    padding: 5px;
    //box-shadow: 0 10px 10px 0 rgba(0, 0, 0, 0.5);
    background-color: rgba($bgColor, 1);
}

@media screen and(max-width: 750px) {
    #idollist {
        width: 100%;
        //height: calc(100dvh - 10px);
        //height: calc(100vh - 10px);
    }
}




#il_tab {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: start;
    align-content: flex-start;

    .tab {
        flex-basis: 25%;
        height: 30px;
        line-height: 30px;
        font-size: 12px;
        text-align: center;
        background-color: var(--bg-color);
        color: black;

        border-right: 1px solid gray;
        border-bottom: 1px solid gray;
        margin: 1px 0px;

        user-select: none;

        &.tab_selected {
            border-top: var(--highlight) 3px solid;
            line-height: 24px;
            background-color: white;
            color: black;
        }
    }
}

#il_list {
    padding: 5px;
    width: 100%;
    overflow-x: hidden;
    //height: calc(100% - 250px);
    overflow-y: auto;
}

.unit {
    position: relative;
    overflow-y: hidden;
    width: 100%;
    max-width: 480px;

    .navi-button {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 10px;
        background-color: #666;
        color: white;
        text-align: center;
        user-select: none;
        z-index: 1;

        &.prev {
            top: calc(50% - 10px);
            left: 0;
        }

        &.next {
            top: calc(50% - 10px);
            right: 0;
        }
    }

    .platoon {
        flex: none;
        display: flex;
        justify-content: center;
        scroll-snap-align: center;
        width: 100%;

        position: relative;
    }
}

.listgroop {
    //display: none;
    height: 100%;
    overflow: auto;
    display: flex;
    flex-wrap: wrap;

    .idol {
        flex-basis: 33%;

        img {
            width: 48px;
            height: 48px;
            display: inline;
            cursor: pointer;
        }

        div.secper {
            display: inline;
        }
    }
}
</style>