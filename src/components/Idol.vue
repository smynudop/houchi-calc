<script setup lang="ts">
import { Idol } from "../js/idol"

defineProps<{
    idol: Idol
    selected: boolean
}>()
const emits = defineEmits<{
    (e: "click"): void
}>()
</script>

<template>
    <div>
        <div class="icon" :class="{ 'icon_selected': selected }" @click="emits('click')">
            <img :src="'img/' + idol.name + '.png'" width="48" height="48" />
        </div>
        <div class="disc" :class="idol.type" v-if="!idol.isdamy">
            {{ idol.skill.nameja }}<br />
            {{ idol.secper }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.icon {
    width: 52px;
    height: 52px;
    display: block;
    border-radius: 2px;

    margin-bottom: 3px;

    &.icon_selected img {
        border-color: var(--highlight);
    }

    img {
        width: 52px;
        height: 52px;
        border: 2px solid transparent;
        border-radius: 8px;
        cursor: pointer;
    }
}

.disc {
    font-size: 8pt;
    width: 52px;
    height: 32px;
    text-align: center;
}
</style>