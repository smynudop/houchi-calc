<script lang="ts" setup>
import { ref, defineProps, defineEmits } from "vue"
import { Idol } from "../js/idol"
const load = () => {
    try {
        const m = localStorage.getItem("unit_memory")
        if (m != null) {
            memoryList.value = JSON.parse(m)
        }
    } catch (e) {
        console.log(e)
    }
}
const save = () => {
    localStorage.setItem("unit_memory", JSON.stringify(memoryList.value))
}
const memoryList = ref<IMemory[]>([])
load()
const unitName = ref<string>("")
const props = defineProps<{
    unit: Idol[],
    appeal: number,
}>()
const emits = defineEmits<{
    (e: "load", value: IMemory): void
}>()
const select = (memory: IMemory) => {
    emits("load", memory)
}
const del = (memory: IMemory) => {
    memoryList.value = memoryList.value.filter(x => x.name != memory.name)
    save()
}
const add = () => {
    if (unitName.value.length == 0) {
        return
    }
    memoryList.value.push({
        appeal: props.appeal,
        name: unitName.value,
        member: props.unit.map(x => x.name)
    })
    save()
}

</script>

<template>
    <input type="text" id="unitname" v-model="unitName" placeholder="ユニット名を入力">
    <input type="button" value="新規保存" @click="add">
    <ul id="memoryList">
        <li v-for="memory in memoryList">
            {{ memory.name }}
            <button type="button" @click="select(memory)">読み込み</button>
            <button type="button" @click="del(memory)">削除</button>
        </li>
    </ul>
</template>

<style scoped lang="scss">
#unitname {
    width: 200px;
}

#memoryList {
    margin: 10px 0px 0px;
    padding-left: 0;
}

#memoryList li {
    font-size: 12px;
}

#memoryList li.selected {
    background-color: #666;
    color: white;
}
</style>