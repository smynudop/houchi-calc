<script setup lang="ts">
import { ref, withDefaults } from 'vue';
type Tab = {
    id: string
    name: string
}
const props = defineProps<{
    tabs: Tab[]
}>()
const activeTab = ref<string>(props.tabs[0].id)
const selectTab = (tab: string) => {
    activeTab.value = tab

}
</script>


<template>
    <div>
        <div id="tabs">
            <div v-for="tab in tabs" class="tab" :class="{ 'selected': activeTab == tab.id }" @click="selectTab(tab.id)">
                {{ tab.name }}</div>
        </div>
        <slot name="common" />

        <div class="content" v-for="tab in tabs" v-show="activeTab == tab.id" :key="'tab_' + tab.id">
            <slot :name="tab.id">
            </slot>
        </div>

    </div>
</template>

<style scoped lang="scss">
/* ヘッダ関係 ここから */

#tabs {
    display: flex;
    width: 100%;
    max-width: 640px;

    gap: 0.5rem;

    margin-bottom: 1rem;

    .tab {
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;

        width: 3rem;
        height: 3rem;
        padding: 2px;
        border-radius: 0.25rem;
        font-size: 0.8rem;
        user-select: none;
        cursor: pointer;
        background-color: #ccc;
        border: #ccc 1px solid;

        &.selected {
            background-color: white;
        }
    }
}
</style>