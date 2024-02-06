type Pos = {
    lane: number
    timing: number
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
    | "flick"
    | "flick_left"
    | "flick_right"
    | "longflick"
    | "longflick_left"
    | "longflick_right"
    | "slideflick"
    | "slideflick_left"
    | "slideflick_right"

type InputModeInfo = {
    name: string,
    note: NoteType,
    desc: string
}