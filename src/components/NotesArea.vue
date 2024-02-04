<script setup lang="ts">
import { ref, vModelCheckbox } from 'vue'

const RESOLUTION = 48
const RESOLUTION_32 = RESOLUTION / 32

const MARGIN = 20

const FRAME_X = 250
const FRAME_Y = 500

const MEASURE_X = 240
const MEASURE_Y = 480

const PADDING_X = (FRAME_X - MEASURE_X) / 2
const PADDING_Y = (FRAME_Y - MEASURE_Y) / 2

const DISTANCE_8 = MEASURE_Y / 8
const DISTANCE_16 = MEASURE_Y / 16
const DISTANCE_24 = MEASURE_Y / 24
const DISTANCE_32 = MEASURE_Y / 32

const LANE_WIDTH = MEASURE_X / 5

const NOTE_WIDTH = 20


const props = defineProps<{
  mode: 8 | 16 | 24 | 32,
  notes: DisplayNote[],
  secs: { sec: number, timing: number }[],
  displaySecLine: boolean
}>()
const emit = defineEmits<{
  (e: "click", pos: Pos): void,
  (e: "rightclick", pos: Pos): void,
  (e: "wheel", ev: WheelEvent): void
}>()

const cursor = ref<Pos>({ lane: -999, timing: -999 })
//emit('click')

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

const click = (e: MouseEvent) => {
  const x = e.offsetX
  const y = e.offsetY

  const pos = adjust(x, y)

  emit("click", pos)
}

const rightClick = (e: MouseEvent) => {
  e.preventDefault()

  const x = e.offsetX
  const y = e.offsetY

  const pos = adjust(x, y)

  emit("rightclick", pos)
}

const wheel = (e: WheelEvent) => {
  emit("wheel", e)
}
const mouseMove = (e: MouseEvent) => {
  const x = e.offsetX
  const y = e.offsetY

  cursor.value = adjust(x, y)
}

const mouseLeave = (e: MouseEvent) => {

  cursor.value = {
    lane: -999,
    timing: -999,
  }
}

const adjust = (x: number, y: number): Pos => {
  x -= PADDING_X + MARGIN
  y -= PADDING_Y + MARGIN

  let lane = clamp(Math.floor(x / LANE_WIDTH), 0, 4)
  let timing = Math.round(y / (MEASURE_Y / props.mode))
  timing = props.mode - timing
  timing = clamp(timing, 0, props.mode - 1)

  timing = timing / props.mode * RESOLUTION

  return { lane, timing }
}

const calcX = (note: Pos) => {
  return (note.lane + 0.5) * LANE_WIDTH + PADDING_X
}

const calcY = (note: Pos) => {
  return FRAME_Y - (note.timing * (MEASURE_Y / RESOLUTION) + PADDING_Y)
}

const calcY2 = (basisNote: Note, targetNote: Note) => {
  const timing = (targetNote.measure - basisNote.measure) * 48 + targetNote.timing
  return calcY({ lane: targetNote.lane, timing: timing })
}

const displayNotesType = (type: NoteType): NoteType => {
  switch (type) {
    case "slideflick_left":
    case "longflick_left":
      return "flick_left"

    case "slideflick_right":
    case "longflick_right":
      return "flick_right"

    default:
      return type
  }

}


</script>

<template>
  <svg id="score" xmlns="http://www.w3.org/2000/svg" width="290" height="540" viewBox="-20 -20 290 540"
    @mousemove="mouseMove" @mouseleave="mouseLeave" @click="click" @contextmenu="rightClick" @wheel="wheel">
    <g id="bg">
      <rect x="-20" y="-20" width="290" height="540" fill="#333333"></rect>
      <template v-for="i in 5">
        <line :x1="(i - 0.5) * 48 + 5" y1="10" :x2="(i - 0.5) * 48 + 5" y2="490" stroke="#cccccc" stroke-width="1"></line>
      </template>
    </g>
    <g id="line8">
      <template v-for="i in 9">
        <line :x1="0" :y1="(i - 1) * DISTANCE_8 + PADDING_Y" :x2="250" :y2="(i - 1) * DISTANCE_8 + PADDING_Y"
          stroke="white" :stroke-width="i % 2 == 1 ? 2 : 1">
        </line>
      </template>
    </g>
    <g id="line16" v-show="mode == 16 || mode == 32">
      <template v-for="i in 16">
        <template v-if="i % 2 == 0">
          <line :x1="0" :y1="(i - 1) * DISTANCE_16 + PADDING_Y" :x2="250" :y2="(i - 1) * DISTANCE_16 + PADDING_Y"
            stroke="#666666" :stroke-width="1">
          </line>
        </template>
      </template>
    </g>
    <g id="line24" v-show="mode == 24">
      <template v-for="i in 24">
        <template v-if="i % 3 != 1">
          <line :x1="0" :y1="(i - 1) * DISTANCE_24 + PADDING_Y" :x2="250" :y2="(i - 1) * DISTANCE_24 + PADDING_Y"
            stroke="#666666" :stroke-width="1">
          </line>
        </template>
      </template>
    </g>
    <g id="guide">
      <template v-for="note in notes">
        <line v-if="note.prevNote != null" :x1="calcX(note)" :y1="calcY(note)" :x2="calcX(note.prevNote)"
          :y2="calcY2(note, note.prevNote)" stroke="#ccc" stroke-width="16"></line>
        <line v-if="note.nextNote != null" :x1="calcX(note)" :y1="calcY(note)" :x2="calcX(note.nextNote)"
          :y2="calcY2(note, note.nextNote)" stroke="#ccc" stroke-width="16"></line>
      </template>
    </g>
    <g id="notes">
      <use v-for="note in notes" :x="calcX(note) - 10" :y="calcY(note) - 10" :href="'#' + displayNotesType(note.type)"
        :width="20" :height="20"></use>
    </g>
    <g id="secline" v-show="displaySecLine">
      <template v-for="line in secs">
        <line :x1="-10" :y1="calcY({ timing: line.timing, lane: 0 })" :x2="FRAME_X + 10"
          :y2="calcY({ timing: line.timing, lane: 5 })" stroke="yellow" stroke-width="1"></line>
        <text fill="yellow" x="-15" :y="calcY({ timing: line.timing, lane: 0 })">{{ line.sec }}</text>
      </template>
    </g>

    <g id="cursor">
      <circle stroke="yellow" stroke-width="2" fill="transparent" :cx="calcX(cursor)" :cy="calcY(cursor)" r="10"></circle>
    </g>
    <symbol viewBox="0 0 20 20" width="20" height="20" id="tap">
      <circle cx="10" cy="10" r="10" fill="white"></circle>
      <circle cx="10" cy="10" r="8" fill="red"></circle>
    </symbol>
    <symbol viewBox="0 0 20 20" width="20" height="20" id="long">
      <circle cx="10" cy="10" r="10" fill="white"></circle>
      <circle cx="10" cy="10" r="8" fill="orange"></circle>
      <circle cx="10" cy="10" r="4" fill="white"></circle>
    </symbol>
    <symbol viewBox="0 0 20 20" width="20" height="20" id="flick_left">
      <circle cx="10" cy="10" r="10" fill="white"></circle>
      <circle cx="10" cy="10" r="8" fill="green"></circle>
      <path d="M 13,5 L 13,15 L 6,10" fill="white"></path>
    </symbol>
    <symbol viewBox="0 0 20 20" width="20" height="20" id="flick_right">
      <circle cx="10" cy="10" r="10" fill="white"></circle>
      <circle cx="10" cy="10" r="8" fill="blue"></circle>
      <path d="M 7,5 L 7,15 L 14,10" fill="white"></path>
    </symbol>
    <symbol viewBox="0 0 20 20" width="20" height="20" id="slide">
      <circle cx="10" cy="10" r="10" fill="white"></circle>
      <circle cx="10" cy="10" r="8" fill="purple"></circle>
      <circle cx="10" cy="10" r="4" fill="white"></circle>
    </symbol>
  </svg>
</template>

<style scoped>
svg {
  margin: 1rem;
}
</style>
