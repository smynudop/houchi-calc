type Pos = {
    lane: number
    timing: number
}

type Note = {
    lane: number,
    timing: number,
    measure: number,
    type: NoteType,
    no: number
}

type DisplayNote = Note & {
    prevNote?: Note,
    nextNote?: Note
}

type NormalState = {
    mode: "normal",
    prevNote: null
}

type LongState = {
    mode: "long",
    prevNote: Note
}

type SlideState = {
    mode: "slide",
    prevNote: Note
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