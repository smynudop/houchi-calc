<script setup lang="ts">
import { ref, computed } from "vue"
import { cards } from "../js/data/idol"
const emits = defineEmits<{
    (e: "close"): void,
    (e: "clear"): void,
    (e: "select-idol", idol: IdolProfile): void
}>()
const skillTypes = Object.keys(cards)
const currentTab = ref<string>(skillTypes[0])

function onCloseButtonClick() {
    emits("close")
}
function onClearButtonClick() {
    emits("clear")
}
function changeTab(tabName: string) {
    currentTab.value = tabName
}
function selectIdol(idol: IdolProfile) {
    emits("select-idol", idol)
}

</script>

<template>
    <div id="idollist">
        <div id="idollist_container">

            <div id="il_unit"></div>
            <div id="il_tab">
                <div v-for="t in skillTypes" class="tab" @click="changeTab(t)"
                    :class="{ 'tab_selected': currentTab == t }">
                    {{ t }}
                </div>
            </div>
            <div id="il_list">
                <div class="listgroop">
                    <div v-for="idol of cards[currentTab]" class="idol" :data-name="idol[0]" @click="selectIdol(idol)">
                        <img :src="'img/' + idol[0] + '.png'" />
                        <div>
                            {{ idol[2] + idol[3] }}</div>
                    </div>
                </div>
            </div>
            <div id="il_menubar">
                <div id="il_clear" class="button" @click="onClearButtonClick">クリア</div>
                <div id="il_close" class="button" @click="onCloseButtonClick">閉じる</div>
            </div>
        </div>
    </div>
</template>