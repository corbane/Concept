
import * as Ui from "./draggable.js"
import { cssInt } from "./dom.js"

type Direction = "lr" | "rl" | "bt" | "tb"

//export type ExpendableProperty = "width" | "height"
//                               | "top" | "left" | "bottom" | "right"
//                               | "x" | "y"

export type ExpendableElement = ReturnType <typeof expandable>

type ExpendableOptions = Partial <ExpendableConfig>

interface ExpendableConfig
{
     handles      : JSX.Element []
     property?    : string,
     open         : boolean
     near         : number
     delay        : number
     direction    : Direction
     minSize      : number
     maxSize      : number
     unit         : "px" | "%" | "",
     onBeforeOpen : () => void
     onAfterOpen  : () => void
     onBeforeClose: () => void
     onAfterClose : () => void
}

const verticalProperties = [ "height", "top", "bottom" ]

function defaultConfig (): ExpendableConfig
{
     return {
          handles      : [],
          property     : "height",
          open         : false,
          near         : 40,
          delay        : 250,
          minSize      : 0,
          maxSize      : window.innerHeight,
          unit         : "px",
          direction    : "tb",
          onBeforeOpen : () => {},
          onAfterOpen  : () => {},
          onBeforeClose: () => {},
          onAfterClose : () => {},
     }
}

const toSign = {
     lr : 1,
     rl : -1,
     tb : -1,
     bt : 1,
}
const toProperty : Record <Direction, string> = {
     lr : "width",
     rl : "width",
     tb : "height",
     bt : "height",
}

export function expandable ( element: JSX.Element, options: ExpendableOptions = {} )
{
     const config = defaultConfig ()

     var is_open    : boolean
     var is_vertical: boolean
     var sign       : number
     var unit       : ExpendableConfig ["unit"]
     var cb         : () => void
     var minSize    : number
     var maxSize    : number
     var start_size  = 0
     var open_size   = 100

     const draggable = Ui.draggable ({
          handles       : [],
          onStartDrag   : onStartDrag,
          onStopDrag    : onStopDrag,
          onEndAnimation: onEndAnimation,
     })

     updateConfig ( options )

     function updateConfig ( options = {} as ExpendableOptions )
     {
          if ( options.property == undefined && options.direction != undefined )
               options.property = toProperty [options.direction]

          Object.assign ( config, options )

          is_open     = config.open
          sign        = toSign [config.direction]
          unit        = config.unit
          is_vertical = config.direction == "bt" || config.direction == "tb" ? true : false
          minSize = config.minSize
          maxSize = config.maxSize

          element.classList.remove ( is_vertical ? "horizontal" : "vertical" )
          element.classList.add    ( is_vertical ? "vertical" : "horizontal" )

          draggable.updateConfig ({
               handles: config.handles,
               onDrag : is_vertical ? onDragVertical: onDragHorizontal,
          })
     }
     function size ()
     {
          return is_open ? cssInt ( element, config.property ) : 0
     }
     function toggle ()
     {
          if ( is_open )
               close ()
          else
               open ()
     }
     function open ()
     {
          config.onBeforeOpen ()

          element.classList.add ( "animate" )
          element.classList.replace ( "close", "open" )

          if ( cb )
               onTransitionEnd ()

          cb = config.onAfterOpen
          element.addEventListener ( "transitionend", () => onTransitionEnd )

          element.style [ config.property ] = open_size + unit

          is_open = true
     }
     function close ()
     {
          config.onBeforeClose ()

          open_size = size ()

          element.classList.add ( "animate" )
          element.classList.replace ( "open", "close" )

          if ( cb )
               onTransitionEnd ()

          cb = config.onAfterClose
          element.addEventListener ( "transitionend", onTransitionEnd )

          element.style [ config.property ] = "0" + unit

          is_open = false
     }

     return {
          updateConfig,
          open,
          close,
          toggle,
          isOpen     : () => is_open,
          isClose    : () => ! is_open,
          isVertical : () => is_vertical,
          isActive   : () => draggable.isActive (),
          activate   : () => draggable.activate (),
          desactivate: () => draggable.desactivate (),
     }

     function onTransitionEnd ()
     {
          if ( cb )
               cb ()
          element.removeEventListener ( "transitionend", () => onTransitionEnd )
          cb = null
     }

     function onStartDrag ()
     {
          start_size = size ()
          element.classList.remove ( "animate" )
     }
     function onDragVertical ( event: Ui.DragEvent )
     {
          console.log ( minSize, event.y, maxSize )
          console.log ( clamp ( start_size + sign * event.y ) + unit )
          element.style [ config.property ] = clamp ( start_size + sign * event.y ) + unit
     }
     function onDragHorizontal ( event: Ui.DragEvent )
     {
          element.style [ config.property ] = clamp ( start_size + sign * event.x ) + unit
     }
     function onStopDrag ( event: Ui.DragEvent )
     {
          var is_moved = is_vertical ? sign * event.y > config.near
                                     : sign * event.x > config.near

          if ( (is_moved == false) && event.delay <= config.delay )
          {
               toggle ()
               return false
          }

          const target_size = clamp (
               is_vertical ? start_size + sign * event.targetY
                           : start_size + sign * event.targetX
          )

          if ( target_size <= config.near )
          {
               close ()
               return false
          }

          return true

     }
     function onEndAnimation ()
     {
          open_size = cssInt ( element, config.property )
          open ()
     }

     function clamp ( v: number )
     {
          if ( v < minSize )
               return minSize

          if ( v > maxSize )
               return maxSize

          return v
     }
}
