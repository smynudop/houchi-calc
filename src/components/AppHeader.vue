<script setup lang="ts">
import { ref, defineProps, withDefaults } from 'vue';
type Tab = {
    id: string
    name: string
}
const props = defineProps<{
    tabs: Tab[]
}>()
const activeTab = ref<string>("")
const selectTab = (tab: string) => {
    if (activeTab.value == tab) {
        activeTab.value = ""
    } else {
        activeTab.value = tab
    }
}
</script>


<template>
    <header>
        <div id="menu">
            <ul>
                <li v-for="tab in tabs" @click="selectTab(tab.id)">{{ tab.name }}</li>
            </ul>
        </div>
        <div class="header-content" v-for="tab in tabs" v-show="activeTab == tab.id">
            <slot :name="tab.id">

            </slot>
        </div>

    </header>
</template>

<style scoped lang="scss">
/* ヘッダ関係 ここから */

.small {
    font-size: 11px;
}

#unitname {
    font-weight: bold;
}

#menu ul {
    margin: 0;
    padding-left: 0;
    font-size: 0;
}

#menu li {
    display: inline-block;
    width: 100px;
    text-align: center;
    border-width: 0px 1px;
    border-color: darkgray;
    border-style: solid;
    font-size: 14px;
    line-height: 24px;
    cursor: pointer;
    user-select: none;
}

#menu li:hover {
    background-color: darkgray;
    color: white;
}

.header-content {
    padding: 10px;
    background-color: var(--bg-color);
}
</style>