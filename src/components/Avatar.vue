<script setup lang="ts">
import { Idol } from '../js/idol';

defineProps<{
    idol: Idol
}>()
</script>

<template>
    <img :src="'img/' + idol.name + '.png'" />
</template>