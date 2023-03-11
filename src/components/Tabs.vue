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
            <div v-for="tab in tabs" class="tab" @click="selectTab(tab.id)">{{ tab.name }}</div>
        </div>

        <div class="content" v-for="tab in tabs" v-show="activeTab == tab.id">
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

    margin-bottom: 1rem;

    .tab {
        flex: 1;
        text-align: center;
        background-color: #ccc;
    }
}
</style>