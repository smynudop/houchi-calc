<script setup lang="ts">
import { Idol } from "../js/idol"
import IdolVue from "./Idol.vue";
import { CalcMomentInfo } from "../js/houchi"
import { ref, computed } from "vue";

const props = defineProps<{
    idols: Idol[]
    momentInfo?: CalcMomentInfo[]
}>()
const emits = defineEmits<{
    (e: "selectFrame", val: number): void
}>()
const timeBlockNum = computed(() => {
    return Math.ceil((props.momentInfo?.length ?? 0) / 10)
})

const timeline = ref<HTMLElement>()
const scroll = (e: WheelEvent) => {
    if (!timeline.value) return

    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

    const maxScrollLeft = timeline.value.scrollWidth - timeline.value.clientWidth;
    if (
        (timeline.value.scrollLeft <= 0 && e.deltaY < 0) ||
        (timeline.value.scrollLeft >= maxScrollLeft && e.deltaY > 0)
    )
        return;
    e.preventDefault();
    timeline.value.scrollLeft += e.deltaY;
}

const isDanger = (buff: RequiredBuff | null) => {
    if (!buff) return true

    if (buff.cut >= 1 || buff.support >= 4) {
        return false
    } else {
        return true
    }
}
const isSupport = (buff: RequiredBuff | null) => {
    if (!buff) return false

    if (buff.support >= 4) {
        return true
    } else {
        return false
    }
}
</script>


<template>
    <div class="timeline" @wheel="scroll" ref="timeline">
        <div class="jotai">
            <div class="corner"></div>
            <div class="block" :class="m.danger ? 'danger' : ''" v-for="m in momentInfo">
            </div>
        </div>
        <div class="notes">
            <div class="corner"></div>
            <div class="block" v-for="m in momentInfo">
                <div class="note" :class="n.type" v-for="n in m.notes"></div>
            </div>
        </div>
        <div class="time">
            <div class="corner"></div>
            <div class="timeblock" v-for="m in timeBlockNum">
                {{ (m - 1) * 5 }}
            </div>
        </div>
        <div class="idols">
            <div v-for="idol, i in idols" class="idol">
                <img :src="'img/' + idol.name + '.png'" />
                <div class="block" :class="m.skillList[i] != null ? 'active' : 'negative'" v-for="m in momentInfo">
                    <div v-if="m.skillList[i] != null" class="line" :class="m.skillList[i]?.type"></div>
                </div>
            </div>
            <!-- <div class="idol">
                <div class="corner">危険</div>
                <div class="block" :class="isDanger(m.finallyBuff) ? 'active' : 'negative'" v-for="m in momentInfo">
                    <div v-if="isDanger(m.finallyBuff)" class="bg danger"></div>
                </div>
            </div> -->
            <!-- <div class="idol">
                <div class="corner">ライフ</div>
                <div class="block" :class="isSupport(m.finallyBuff) ? 'active' : 'negative'" v-for="m in momentInfo">
                    <div v-if="isSupport(m.finallyBuff)" class="bg support"></div>
                </div>
            </div> -->
        </div>

    </div>
</template>

<style scoped lang="scss">
.timeline {
    position: relative;
    overflow-x: scroll;

    width: 100%;


}

$height: 32px;
$width: 24px;
$lineHeight: 8px;
$margin: calc(calc($height - $lineHeight) / 2);
$radius: calc($lineHeight / 2);

.corner {
    width: 32px;
    min-width: 32px;
}

.block {
    width: $width;
    min-width: $width;
}

.time {
    display: flex;



    .timeblock {
        width: $width * 10;
        min-width: $width * 10;
    }
}

.idols {
    width: max-content;
}

.idol {
    height: $height;
    display: flex;
    //width: 100%;
    justify-self: unset;


    .block {
        background-color: #929797;

    }

    &:nth-child(2n) .block {
        background-color: #a9afaf;
    }

    img {
        width: 32px;
        height: 32px;
        position: sticky;
        left: 0;
        z-index: 1;
    }

    >.block:nth-child(10n+2) {
        border-left: white 1px solid;
    }

    .block {

        .line {
            margin-top: $margin;
            width: 100%;
            height: $lineHeight;
            opacity: .7;
            margin-left: -1px;
            box-shadow: 0px 2px rgba(0, 0, 0, .5);

        }

        .bg {
            opacity: .5;
            width: 100%;
            height: 100%;
        }



    }

    .block.negative+.block.active .line {
        border-radius: $radius 0 0 $radius;
    }

    .block.active:has(+ .negative) .line {
        border-radius: 0 $radius $radius 0;
    }


}

.notes {
    position: absolute;
    bottom: 0;
    display: flex;

    .block {

        display: flex;
        flex-direction: column;
        justify-content: end;
        align-items: center;
        gap: 2px;


        $noteWidth: 10px;

        .note {
            width: $noteWidth;
            height: $noteWidth;
            border-radius: calc($noteWidth /2);

            &.tap {
                background-color: rgb(206, 102, 84);

            }

            &.long {
                background-color: rgb(207, 209, 66);

            }

            &.flick_left,
            &.flick_right,
            &.flick {
                background-color: rgb(70, 169, 226);

            }

            &.slide {
                background-color: rgb(140, 86, 202);

            }
        }
    }
}

.jotai {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    height: 100%;
    opacity: .15;
}
</style>