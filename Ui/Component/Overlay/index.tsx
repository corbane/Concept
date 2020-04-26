
import { uEvent } from "../../../Lib/index.js"
import { xnode } from "../../Base/xnode.js"

export interface Overlay
{
    elements (): HTMLElement []
    onClick : uEvent.IEvent <() => void>
    show (): void
    hide (): void
}

export function createOverlay ()
{
    const self = {} as Overlay

    const element = <div class="overlay" click={ onClick }></div> as HTMLDivElement

    self.onClick  = uEvent.create <() => void> ()
    self.elements = () => [ element ]
    self.show     = show
    self.hide     = hide

    function show () { element.classList.add ("visible") }
    function hide () { element.classList.remove ("visible") }

    function onClick () { self.onClick.dispatch () }

    return self
}

