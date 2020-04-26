
import { Css } from "../../Lib/index.js"
import { cssFloat } from "./dom.js"
import * as Ui from "./draggable.js"
import { xnode } from "./xnode.js"

type Direction   = "lr" | "rl" | "bt" | "tb"
type Orientation = "vertical" | "horizontal"
type Units       = "px" | "%"
type SwipeableProperty = "top" | "left" | "bottom" | "right"
                         | "x" | "y"

type SwipeableOptions = Partial <SwipeableConfig>

type SwipeableConfig = {
     handles   : JSX.Element []
     direction : Direction,
     porperty? : SwipeableProperty
     minValue  : number,
     maxValue  : number,
     units     : Units,
     mouseWheel: boolean
}

export type SwipeableElement = ReturnType <typeof swipeable>

function defaultConfig (): SwipeableConfig
{
     return {
          handles   : [],
          direction : "lr",
          porperty  : "left",
          minValue  : -100,
          maxValue  : 0,
          units     : "%",
          mouseWheel: true,
     }
}

var start_position = 0
var is_vertical    = false
var prop : SwipeableProperty

export function swipeable ( element: JSX.Element, options: SwipeableOptions )
{
     const config = defaultConfig ()

     const draggable = Ui.draggable ({
          handles: [],
          onStartDrag,
          onStopDrag,
     })

     element.classList.add ( "swipeable" )

     updateConfig ( options )

     function updateConfig ( options: SwipeableOptions )
     {
          Object.assign ( config, options )

          is_vertical = config.direction == "bt" || config.direction == "tb"

          if ( options.porperty == undefined )
               config.porperty = is_vertical ? "top" : "left"

          // switch ( config.porperty )
          // {
          // case "top": case "bottom": case "y": is_vertical = true  ; break
          // case "left": case "right": case "x": is_vertical = false ; break
          // default: debugger ; return
          // }

          draggable.updateConfig ({
               handles: config.handles,
               onDrag: is_vertical ? onDragVertical : onDragHorizontal
          })

          prop = config.porperty

          if ( draggable.isActive () )
               activeEvents ()
          else
               desactiveEvents ()
     }

     function position ()
     {
          return cssFloat ( element, prop )
     }

     function activate ()
     {
          draggable.activate ()
          activeEvents ()
     }
     function desactivate ()
     {
          draggable.desactivate ()
          desactiveEvents ()
     }

     function swipe ( offset: string ): void
     function swipe ( offset: number, units: Units ): void
     function swipe ( offset: string|number, u?: Units )
     {
          if ( typeof offset == "string" )
          {
               u = Css.getUnit ( offset ) as Units
               offset = parseFloat ( offset )
          }

          if ( ! ["px", "%"].includes ( u ) )
               u = "px"

          if ( u != config.units )
          {
               if ( (u = config.units) == "%" )
                    offset = toPercents ( offset )
               else
                    offset = toPixels ( offset )
          }

          element.style [prop] = clamp ( offset ) + u
     }

     return {
          updateConfig,
          activate,
          desactivate,
          position,
          swipe,
     }

     function activeEvents ()
     {
          if ( config.mouseWheel )
          {
               for ( const h of config.handles )
                    h.addEventListener ( "wheel", onWheel, { passive: true } )
          }
     }
     function desactiveEvents ()
     {
          for ( const h of config.handles )
               h.removeEventListener ( "wheel", onWheel )
     }

     function toPixels ( percentage: number )
     {
          const { minValue: min, maxValue: max } = config

          if ( percentage < 100 )
               percentage = 100 + percentage

          return min + (max - min) * percentage / 100
     }
     function toPercents ( pixels: number )
     {
          const { minValue: min, maxValue: max } = config
          return Math.abs ( (pixels - min) / (max - min) * 100 )
     }

     function onStartDrag ()
     {
          element.classList.remove ( "animate" )
          start_position = position ()
     }
     function onDragVertical ( event: Ui.DragEvent )
     {
          element.style [prop] = clamp ( start_position + event.y ) + config.units
     }
     function onDragHorizontal ( event: Ui.DragEvent )
     {
          element.style [prop] = clamp ( start_position + event.x ) + config.units
     }
     function onStopDrag ( event: Ui.DragEvent )
     {
          element.classList.add ( "animate" )

          const offset = is_vertical
                         ? event.y //+ event.velocityY
                         : event.x //+ event.velocityX

          element.style [prop] = clamp ( start_position + offset ) + config.units
          return true
     }
     function onWheel ( event: WheelEvent )
     {
          if ( event.deltaMode != WheelEvent.DOM_DELTA_PIXEL )
               return

          if ( is_vertical )
          {
               var delta = event.deltaY
          }
          else
          {
               var delta = event.deltaX

               if ( delta == 0 )
                    delta = event.deltaY
          }

          element.style [prop] = clamp ( position () + delta ) + config.units
     }
     function clamp ( value: number )
     {
          return value < config.minValue ? config.minValue
               : value > config.maxValue ? config.maxValue
               : value
     }
}
