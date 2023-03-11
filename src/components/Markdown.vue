<script setup lang="ts">
import { marked } from "marked"
import { onMounted, ref } from "vue";

const container = ref<HTMLElement | null>(null)

onMounted(() => {
    if (container.value) {
        container.value.innerHTML = marked(container.value?.innerHTML ?? "")
    }
})
</script>

<template>
    <div v-once ref="container" class="md">
        <div class="md-inner">
            <slot name="default"></slot>
        </div>
    </div>
</template>

<style scoped lang="scss">
.md {

    &:v-deep(.md-inner) {

        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        p {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }

        h1 {
            font-size: 1.6rem;
        }

        h2 {
            font-size: 1.4rem;
        }

        h3 {
            font-size: 1.2rem;
        }
    }
}
</style>