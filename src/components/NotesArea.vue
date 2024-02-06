<script setup lang="ts">
import { ref, computed } from 'vue'
import { Idol } from '../js/idol';
import Avatar from "./Avatar.vue"
import { CalcMomentInfo } from '../js/houchi';

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
  notes: INoteV2Detail[] | NoteV2[],
  bpm: number
  offset: number
  idols?: Idol[]
  momentInfo?: CalcMomentInfo[]
  readonly?: boolean
}>()

type DisplayNote = NoteV2 & {
  prevNote?: NoteV2,
  nextNote?: NoteV2
}
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
  e.preventDefault()
  if (e.deltaY > 0) {
    measure.value -= 1
    if (measure.value < 1) measure.value = 1

  }
  if (e.deltaY < 0) {
    measure.value += 1
    if (measure.value > 200) measure.value = 200

  }  //emit("wheel", e)
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

const calcY2 = (basisNote: NoteV2, targetNote: NoteV2) => {
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
const measure = ref(1)
const displayNotes = computed(() => {
  return props.notes.filter(n => n.measure == measure.value)
})

const measureToSec = (measure: number) => {
  return measure * 4 / props.bpm * 60 + (props.offset / 60)
}


const secBlocks = computed(() => {
  if (props.bpm == 0) return []

  const startMoment = measureToSec(measure.value) * 2
  const endMoment = measureToSec(measure.value + 1) * 2

  const result: { moment: number, timing: number, next: number, info?: CalcMomentInfo }[] = []

  const calcTiming = (moment: number) => {
    return Math.round((moment - startMoment) / (endMoment - startMoment) * 48 * 10) / 10
  }


  let moment = Math.floor(startMoment) - 1
  while (moment <= endMoment) {

    //if (startMoment <= moment && moment <= endMoment) {
    const timing = calcTiming(moment)
    const next = calcTiming(moment + 1)
    const info = props.momentInfo ? props.momentInfo[moment] : undefined
    result.push({ moment, timing, next, info })
    //}

    moment += 1
  }

  return result
})
const MARGIN_PX = computed(() => {
  return MARGIN.toString() + "px"
})
const MOMENT_HEIGHT = computed(() => {
  const a = props.bpm / 60 * 0.5
  return MEASURE_Y / 4 * a
})
const selectNote = ref<INoteV2Detail | null>(null)
const noteClick = (ev: MouseEvent, note: NoteV2) => {
  selectNote.value = note as INoteV2Detail // TODO

  var clickX = ev.pageX;
  var clickY = ev.pageY;

  // 要素の位置を取得
  var clientRect = document.querySelector(".notesarea")!.getBoundingClientRect();
  var positionX = clientRect.left + window.scrollX;
  var positionY = clientRect.top + window.scrollY;

  // 要素内におけるクリック位置を計算
  var x = clickX - positionX;
  var y = clickY - positionY;

  const noteInfo = document.querySelector(".noteInfo")! as HTMLElement
  noteInfo.style.top = y + "px"
  noteInfo.style.left = x + "px"

}
const noteInfoText = (note: INoteV2Detail | null) => {
  if (!note) return ""

  const score = ((note.buff.score ?? 0) / 100 + 1).toFixed(2)
  const combo = ((note.buff.combo ?? 0) / 100 + 1).toFixed(2)


  return `判定: ${note.result}
  スコア: ${note.score}
  計算式: 1234 * スコア(${score}) * コンボ(${combo})`
}
</script>

<template>
  <div class="notesarea" :style="{ width: (FRAME_X + MARGIN * 2) + 'px' }">
    <div>小節: {{ measure }}</div>
    <svg xmlns="http://www.w3.org/2000/svg" :width="FRAME_X + MARGIN * 2" height="540" viewBox="-20 -20 290 540"
      @mousemove="mouseMove" @mouseleave="mouseLeave" @click="click" @contextmenu="rightClick" @wheel="wheel">
      <defs>
        <linearGradient id="magic">
          <stop offset="0%" stop-color="#f99" stop-opacity="30%" />
          <stop offset="20%" stop-color="#ff9" stop-opacity="30%" />
          <stop offset="40%" stop-color="#9f9" stop-opacity="30%" />
          <stop offset="60%" stop-color="#9ff" stop-opacity="30%" />
          <stop offset="80%" stop-color="#99f" stop-opacity="30%" />
          <stop offset="100%" stop-color="#f9f" stop-opacity="30%" />
        </linearGradient>
      </defs>
      <g id="bg">
        <rect x="-20" y="-20" width="290" height="540" fill="#333333"></rect>
        <template v-for=" i  in  5 ">
          <line :x1="(i - 0.5) * 48 + 5" y1="10" :x2="(i - 0.5) * 48 + 5" y2="490" stroke="#cccccc" stroke-width="1">
          </line>
        </template>
      </g>
      <g id="skill">
        <template v-for=" line  in  secBlocks ">
          <template v-if="line.info != null" v-for="(info, x) in line.info?.skillList">
            <rect :x="calcX({ timing: line.timing, lane: x - 0.5 })" :width="LANE_WIDTH" :height="MOMENT_HEIGHT"
              :y="calcY({ timing: line.next, lane: 5 })" :class="info?.type" fill="transparent"></rect>
          </template>
        </template>
      </g>
      <g id="line8">
        <template v-for=" i  in  9 ">
          <line :x1="0" :y1="(i - 1) * DISTANCE_8 + PADDING_Y" :x2="250" :y2="(i - 1) * DISTANCE_8 + PADDING_Y"
            stroke="white" :stroke-width="i % 2 == 1 ? 2 : 1">
          </line>
        </template>
      </g>
      <g id="line16" v-show="mode == 16 || mode == 32">
        <template v-for=" i  in  16 ">
          <template v-if="i % 2 == 0">
            <line :x1="0" :y1="(i - 1) * DISTANCE_16 + PADDING_Y" :x2="250" :y2="(i - 1) * DISTANCE_16 + PADDING_Y"
              stroke="#666666" :stroke-width="1">
            </line>
          </template>
        </template>
      </g>
      <g id="line24" v-show="mode == 24">
        <template v-for=" i  in  24 ">
          <template v-if="i % 3 != 1">
            <line :x1="0" :y1="(i - 1) * DISTANCE_24 + PADDING_Y" :x2="250" :y2="(i - 1) * DISTANCE_24 + PADDING_Y"
              stroke="#666666" :stroke-width="1">
            </line>
          </template>
        </template>
      </g>
      <g id="guide">
        <template v-for=" note  in  displayNotes ">
          <!-- <line v-if="note.prevNote != null" :x1="calcX(note)" :y1="calcY(note)" :x2="calcX(note.prevNote)"
            :y2="calcY2(note, note.prevNote)" stroke="#ccc" stroke-width="16"></line>
          <line v-if="note.nextNote != null" :x1="calcX(note)" :y1="calcY(note)" :x2="calcX(note.nextNote)"
            :y2="calcY2(note, note.nextNote)" stroke="#ccc" stroke-width="16"></line> -->
        </template>
      </g>
      <g id="notes">
        <use v-for="note in displayNotes " :x="calcX(note) - 10" :y="calcY(note) - 10"
          :href="'#' + displayNotesType(note.type)" :width="20" :height="20" @click="ev => noteClick(ev, note)"></use>
      </g>
      <g id="secline">
        <template v-for=" line  in  secBlocks ">
          <line :x1="-10" :y1="calcY({ timing: line.timing, lane: 0 })" :x2="FRAME_X + 10"
            :y2="calcY({ timing: line.timing, lane: 5 })" stroke="yellow" stroke-width="1"></line>
          <text fill="yellow" x="-15" :y="calcY({ timing: line.timing, lane: 0 })">{{ line.moment / 2 }}</text>
        </template>
      </g>

      <g id="cursor" v-if="!readonly">
        <circle stroke="yellow" stroke-width="2" fill="transparent" :cx="calcX(cursor)" :cy="calcY(cursor)" r="10">
        </circle>
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
    <div class="idols">
      <Avatar v-for=" idol  in  idols " :idol="idol" :style="{ width: (FRAME_X / 5) + 'px' }"></Avatar>
    </div>
    <div class="noteInfo" v-show="selectNote != null" v-text="noteInfoText(selectNote)">

    </div>
  </div>
</template>

<style scoped lang="scss">
svg {
  //margin: 1rem;
}

.notesarea {
  position: relative;
}

.noteInfo {
  position: absolute;
  background-color: white;
  width: 300px;
  font-size: 13px;
  border: 2px solid #ccc;
  border-radius: 3px;

  white-space: pre-wrap;
}

.magic {
  fill: url(#magic);
}

.idols {
  margin: 0 v-bind(MARGIN_PX);
}
</style>
