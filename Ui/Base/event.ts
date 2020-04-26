
import { Area } from "../Component/Area/area.js"

interface EventConfig
{
     onTap: () => void,
     onDblTap: () => void
}

var selection
const config = defaultConfig ()

function defaultConfig ()
{
     return {
          onOverObject       : null as () => void,
          onOutObject        : null as () => void,
          onTouchObject      : null as () => void,
          onDoubleTouchObject: null as () => void,
          onTouchArea        : null as ( x: number, y: number ) => void,
     }
}


export function lock ()
{

}

export function unlock ()
{

}


function init ()
{
     console.log ( "ontouchstart" in window )
     window.addEventListener ( "pointerdown", event => { console.log ( "pointerdown", event ) })
     window.addEventListener ( "pointermove", event => { console.log ( "pointermove", event ) })
     window.addEventListener ( "pointerup"  , event => { console.log ( "pointerup"  , event ) })
}
//init ()
