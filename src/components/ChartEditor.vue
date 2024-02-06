<script setup lang="ts">
import { computed, onMounted, defineAsyncComponent, ref, toRaw } from 'vue'

import NotesArea from './NotesArea.vue';
//import saraba from "./voyager.json"

const modeList = [8, 16, 24, 32] as const


const inputModeList: Readonly<InputModeInfo[]> = [
  {
    name: "tap",
    note: "tap",
    desc: "タップ"
  },
  {
    name: "long",
    note: "long",
    desc: "ロング"
  },
  {
    name: "slide",
    note: "slide",
    desc: "スライド"
  },
  {
    name: "flick_left",
    note: "flick_left",
    desc: "フリック←"
  },
  {
    name: "flick_right",
    note: "flick_right",
    desc: "フリック→"
  },
  {
    name: "flick_left2",
    note: "flick_left",
    desc: "フリック←←"
  },
  {
    name: "flick_right2",
    note: "flick_right",
    desc: "フリック→→"
  },
] as const

type InputMode = typeof inputModeList[number]["name"]

const mode = ref<typeof modeList[number]>(8)
const inputMode = ref<InputMode>("tap")
const state = ref<State>({ mode: "normal", prevNote: null })
const group = ref<number>(1)
const measure = ref<number>(1)

const music = ref<IMusicV2>({
  version: 2,
  name: "",
  bpm: 120,
  offset: 0,
  difficulity: 'master',
  level: 28,
  musictime: 120,
  notes: []
})
const notesList = ref<NoteV2[]>([])

const setNotes = (notes: NoteV2[]) => {
  notesList.value = notes.slice()
  group.value = notesList.value.reduce((a, b) => Math.max(a, b.no), 0) + 1
}

//const initialNotes = saraba.map(x => { return { group: x.group, notesType: x.type, timing: x.timing, lane: x.lane, measure: x.measure } }) as Note[]
// const mounted = onMounted(() => {
//   notesList.value = initialNotes
//   group.value = notesList.value.reduce((a, b) => Math.max(a, b.group), 0) + 1
// })

const measureUp = () => {
  measure.value++
  if (measure.value > 200) measure.value = 200
}

const measureDown = () => {
  measure.value--
  if (measure.value < 1) measure.value = 1
}


const isSamePositionNote = (note1: Readonly<NoteV2>, note2: Readonly<NoteV2>): boolean => {
  return note1.measure == note2.measure
    //&& note1.notesType == note2.notesType 
    && note1.lane == note2.lane
    && note1.timing == note2.timing
  //&& note1.group == note2.group
}

const isSameTimingNote = (note1: Readonly<NoteV2>, note2: Readonly<NoteV2>): boolean => {
  return note1.measure == note2.measure
    //&& note1.notesType == note2.notesType 
    //&& note1.pos.lane == note2.pos.lane 
    && note1.timing == note2.timing
    && note1.no == note2.no
}

const existNote = (note: NoteV2) => {
  return notesList.value.some(x => isSamePositionNote(x, note))
}

const removeNote = (note: NoteV2) => {
  notesList.value = notesList.value.filter(x => !isSamePositionNote(x, note))
}

const removeSameTimingNote = (note: NoteV2) => {
  notesList.value = notesList.value.filter(x => !(isSameTimingNote(x, note) && x.type == "slide"))
}

const position = (note: NoteV2) => {
  return note.measure * 100 + note.timing
}

const onAreaClick = (pos: Pos) => {

  let g = group.value
  if (inputMode.value == "tap") g = 0
  if ((inputMode.value == "flick_left" || inputMode.value == "flick_right" || inputMode.value == "flick_left2" || inputMode.value == "flick_right2")
    && state.value.mode == "normal") g = 0

  const tmpNote: NoteV2 = {
    measure: measure.value,
    type: inputModeList.find(x => x.name == inputMode.value)!.note,
    ...pos,
    no: g,
    frame: 0
  }

  switch (inputMode.value) {
    case "tap":

      if (existNote(tmpNote)) {
        removeNote(tmpNote)
      } else {
        notesList.value.push(tmpNote)
      }
      break;

    case "long":

      if (state.value.mode == "long") {
        //終点モード
        const prevNote = state.value.prevNote
        if (existNote(tmpNote)) {
          break
        }

        if (prevNote.lane != pos.lane) {
          break
        }

        notesList.value.push(tmpNote)
        group.value++
        state.value = { mode: "normal", prevNote: null }

      } else if (state.value.mode == "slide") {

      } else {
        if (existNote(tmpNote)) {
          removeNote(tmpNote)
        } else {
          notesList.value.push(tmpNote)
          state.value = { mode: "long", prevNote: tmpNote }
        }
      }
      break;

    case "flick_left":
    case "flick_right":
    case "flick_left2":
    case "flick_right2":
      if (state.value.mode == "normal") {
        if (existNote(tmpNote)) {
          removeNote(tmpNote)
          break
        }

        notesList.value.push(tmpNote)

        if (inputMode.value == "flick_left2" && tmpNote.lane > 0) {
          const note = { ...tmpNote, timing: tmpNote.timing + 1.5, lane: tmpNote.lane - 1 }
          notesList.value.push(note)
        }

        if (inputMode.value == "flick_right2" && tmpNote.lane < 4) {
          const note = { ...tmpNote, timing: tmpNote.timing + 1.5, lane: tmpNote.lane + 1 }
          notesList.value.push(note)
        }

      } else if (state.value.mode == "long") {
        //終点モード
        const prevNote = state.value.prevNote
        if (existNote(tmpNote)) {
          break
        }

        if (prevNote.lane != pos.lane) {
          break
        }
        tmpNote.type = ("long" + tmpNote.type) as NoteType
        notesList.value.push(tmpNote)
        group.value++
        state.value = { mode: "normal", prevNote: null }
      } else {
        //終点モード
        const prevNote = state.value.prevNote
        if (existNote(tmpNote)) {
          break
        }

        tmpNote.type = ("slide" + tmpNote.type) as NoteType
        notesList.value.push(tmpNote)
        group.value++
        state.value = { mode: "normal", prevNote: null }
      }

      break

    case "slide":
      if (state.value.mode == "normal") {

        if (existNote(tmpNote)) {
          removeNote(tmpNote)
        } else {
          notesList.value.push(tmpNote)
          state.value = { mode: "slide", prevNote: tmpNote }
        }

      } else if (state.value.mode == "long") {

      } else {
        //中点モード
        const prevNote = state.value.prevNote
        if (existNote(tmpNote)) {
          removeNote(tmpNote)
          break
        }

        removeSameTimingNote(tmpNote)

        notesList.value.push(tmpNote)
        state.value.prevNote = tmpNote
      }


    default:


  }
}

const onAreaRightClick = (pos: Pos) => {
  if (state.value.mode == "long") {
    removeNote(state.value.prevNote)
  }

  state.value = { mode: "normal", prevNote: null }
  group.value++
}


const onWheel = (ev: WheelEvent) => {
  if (ev.deltaY > 0) {
    measureDown()
  }
  if (ev.deltaY < 0) {
    measureUp()
  }
}

const copyNotes = (num: number) => {
  const targetNotes = notesList.value.filter(x => x.measure >= measure.value - num && x.measure < measure.value)
  const groupList = [... new Set(targetNotes.map(x => x.no))].filter(x => x != 0).sort()

  const map: Record<number, number> = {}
  map[0] = 0
  for (const no of groupList) {
    map[no] = group.value
    group.value++
  }

  for (const note of targetNotes) {
    notesList.value.push({
      lane: note.lane,
      timing: note.timing,
      measure: note.measure + num,
      type: note.type,
      no: map[note.no],
      frame: 0
    })
  }


}


const calcFrame = (bpm: number, offset: number, note: NoteV2) => {
  const measureMs = 60 * 1000 / bpm * 4
  const ms = measureMs * (note.measure + note.timing / 48)
  const frame = ms / 1000 * 60
  return Math.round(frame * 10) / 10
}

const output = () => {
  let data: IMusicV2 = toRaw(music.value)
  const notes = toRaw(notesList.value)
  for (let note of notes) {
    note.frame = calcFrame(data.bpm, data.offset, note)
  }
  data = {
    ...data,
    notes
  }

  const datastring = JSON.stringify(data)

  const blob = new Blob([datastring], { type: 'text/plain' }); // Blob オブジェクトの作成
  const link = document.querySelector("#dllink") as any
  link.href = URL.createObjectURL(blob); // オブジェクト URL を生成
  link.download = `${data.name || "score"}.json`
  link.click(); // クリックイベントを発生させる
  URL.revokeObjectURL(link.href); // オブジェクト URL を解放」
}

const clear = () => {
  if (!window.confirm("譜面をすべてクリアします。よろしいですか？")) return

  notesList.value = []
  group.value = 1
}

const displaySecLine = ref(false)

const fileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || !files[0]) return
  const file = files[0]

  const filereader = new FileReader();

  filereader.onload = (ev) => {
    try {
      const result = filereader.result as string
      console.log(result)
      const data = JSON.parse(result) as NoteV2[] | IMusicV2
      if (Array.isArray(data)) {
        setNotes(data)
      } else {
        music.value = data
        setNotes(data.notes)
      }
    } catch (e) {
      alert(e)
    }
  };
  filereader.onerror = () => {
    alert("ファイル読み時エラー")
  }
  filereader.readAsText(file);

}

</script>

<template>
  <div class="container m-4">
    <div class="row">
      <div class="col-6">
        <div class="p-2">
          小節：{{ measure }}
          <button type="button" class="btn btn-outline-info" @click="measureUp">↑</button>
          <button type="button" class="btn btn-outline-info" @click="measureDown">↓</button>
        </div>
        <NotesArea :mode="mode" :notes="notesList" :bpm="music.bpm" :offset="music.offset" @click="onAreaClick"
          @rightclick="onAreaRightClick" @wheel="onWheel" />

      </div>
      <div class="col-6">


        <div class="p-2">
          <template v-for="m in modeList">
            <input type="radio" :id="'notes' + m" class="btn-check" :value="m" v-model="mode" />
            <label :for="'notes' + m" class="btn btn-outline-secondary">
              {{ m }}分
            </label>
          </template>
        </div>

        <div class="p-2">
          <template v-for="nm in inputModeList">
            <input type="radio" :id="'notemode_' + nm.name" class="btn-check" :value="nm.name" v-model="inputMode" />
            <label :for="'notemode_' + nm.name" class="btn btn-outline-secondary">
              {{ nm.desc }}
            </label>
          </template>
        </div>
        {{ state.mode }}
        ノーツ数：{{ notesList.length }}
        グループ: {{ group }}
        <a download="score.json" id="dllink" style="display:none;">aaa</a>
        <div class="p-2">
          <button type="button" class="btn btn-primary" @click="output">出力</button>
          <button type="button" class="btn btn-warning" @click="clear">クリア</button>

        </div>
        <div class="p-2">
          <input type="file" @change="fileChange">
        </div>
        <div class="p-2">
          <div class="row">
            <label class="col-sm-3">曲名</label>
            <div class="col-sm-9">
              <input v-model="music.name" type="text" />
            </div>
          </div>
          <div class="row">
            <label class="col-sm-3">BPM</label>
            <div class="col-sm-9">
              <input v-model="music.bpm" type="number" />
            </div>
          </div>
          <div class="row">
            <label class="col-sm-3">offset </label>
            <div class="col-sm-9">
              <input v-model="music.offset" type="number" />
            </div>
          </div>
          <div class="row">
            <label class="col-sm-3">レベル </label>
            <div class="col-sm-9">
              <input v-model="music.level" type="number" />
            </div>
          </div>
          <div class="row">
            <label class="col-sm-3">曲の長さ </label>
            <div class="col-sm-9">
              <input v-model="music.musictime" type="number" />
            </div>
          </div>
          <div class="row">
            <label class="col-sm-3">難易度 </label>
            <div class="col-sm-9">
              <input v-model="music.difficulity" type="text" />
            </div>
          </div>
          秒数の線を表示 <input v-model="displaySecLine" type="checkbox" />
        </div>
      </div>


      <div class="p-2">
        <button type="button" class="btn btn-outline-info" @click="copyNotes(1)">1小節コピー</button>
        <button type="button" class="btn btn-outline-info" @click="copyNotes(2)">2小節コピー</button>
        <button type="button" class="btn btn-outline-info" @click="copyNotes(4)">4小節コピー</button>
        <button type="button" class="btn btn-outline-info" @click="copyNotes(8)">8小節コピー</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.container {
  margin: 1rem;
  background-color: #f2f2f2;
}
</style>
