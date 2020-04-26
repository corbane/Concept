
import { draggable, DragEvent } from "./draggable.js"

type Direction = "lr" | "rl" | "bt" | "tb"
type DOMElement = HTMLElement | SVGElement

export interface ScollableConfig
{
     handles: DOMElement []
     direction: Direction
}

function defaultConfig (): ScollableConfig
{
     return {
          handles  : [],
          direction: "tb"
     }
}

function scrollableNative ( options: ScollableConfig )
{
     desactivate ()

     return {
          activate,
          desactivate,
     }

     function activate ()
     {
          const dir = options.direction == "bt" || options.direction == "tb"
                    ? "pan-y" : "pan-x"

          for ( const h of options.handles )
               h.style.touchAction = dir
     }

     function desactivate ()
     {
          const dir = options.direction == "bt" || options.direction == "tb"
                    ? "pan-y" : "pan-x"

          for ( const h of options.handles )
               h.style.touchAction = "none"
     }
}

export function scollable ( options: ScollableConfig )
{
     if ( "ontouchstart" in window )
          return scrollableNative ( options )

     const drag = draggable ({
          handles       : options.handles,
          velocityFactor: 100,
          onStartDrag,
          onDrag     : options.direction == "bt" || options.direction == "tb"
                     ? onDragVertical
                     : onDragHorizontal,
          onStopDrag: options.direction == "bt" || options.direction == "tb"
                    ? onStopDragVertical
                    : onStopDragHorizontal,
     })

     return {
          activate: () => { drag.activate () }
     }

     function onStartDrag ()
     {
          for ( const h of options.handles )
               h.style.scrollBehavior = "unset"
     }
     function onDragVertical ( event: DragEvent )
     {
          for ( const h of options.handles )
               h.scrollBy ( 0, event.offsetY )
     }
     function onDragHorizontal ( event: DragEvent )
     {
          for ( const h of options.handles )
               h.scrollBy ( event.offsetX, 0 )
     }
     function onStopDragVertical ( event: DragEvent )
     {
          for ( const h of options.handles )
          {
               h.scrollBy ( 0, event.offsetY )
               //h.style.scrollBehavior = "smooth"
               //h.scrollBy ( 0, event.offsetY + event.velocityY )
          }
          return true
     }
     function onStopDragHorizontal ( event: DragEvent )
     {
          for ( const h of options.handles )
          {
               h.scrollBy ( event.offsetX, 0 )
               //h.style.scrollBehavior = "smooth"
               //h.scrollBy ( event.offsetX + event.velocityX, 0 )
          }
          return true
     }
}
