type Pos = {
    lane: number
    timing: number
}

type NoteV2 = {
    lane: number,
    timing: number,
    measure: number,
    type: NoteType,
    no: number,
    frame: number
}

type DisplayNote = NoteV2 & {
    prevNote?: NoteV2,
    nextNote?: NoteV2
}

type NormalState = {
    mode: "normal",
    prevNote: null
}

type LongState = {
    mode: "long",
    prevNote: NoteV2
}

type SlideState = {
    mode: "slide",
    prevNote: NoteV2
}

type State = NormalState | LongState | SlideState

type NoteType = "tap"
    | "long"
    | "slide"
    | "flick_left"
    | "flick_right"
    | "longflick_left"
    | "longflick_right"
    | "slideflick_left"
    | "slideflick_right"

type InputModeInfo = {
    name: string,
    note: NoteType,
    desc: string
}