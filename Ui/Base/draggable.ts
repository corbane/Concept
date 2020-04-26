
export interface  DraggableOptions
{
     handles        : JSX.Element []
     minVelocity?   : number
     maxVelocity?   : number
     velocityFactor?: number
     onDrag?        : ( event: DragEvent ) => void
     onStartDrag?   : () => void
     onStopDrag?    : ( event: DragEvent ) => boolean
     onEndAnimation?: (  event: DragEvent  ) => void
}

export type DraggableConfig = Required <DraggableOptions>

export interface DragEvent
{
     x        : number
     y        : number
     offsetX  : number
     offsetY  : number
     targetX: number
     targetY: number
     delay    : number
}

function defaultConfig (): DraggableConfig
{
     return {
          handles       : [],
          minVelocity   : 0,
          maxVelocity   : 1,
          onStartDrag   : () => {},
          onDrag        : () => {},
          onStopDrag    : () => true,
          onEndAnimation: () => {},
          velocityFactor: (window.innerHeight < window.innerWidth
                         ? window.innerHeight : window.innerWidth) / 2,
     }
}

var is_drag    = false
var pointer: MouseEvent | Touch

// https://gist.github.com/gre/1650294
var EasingFunctions = {
     linear        : ( t: number ) => t,
     easeInQuad    : ( t: number ) => t*t,
     easeOutQuad   : ( t: number ) => t*(2-t),
     easeInOutQuad : ( t: number ) => t<.5 ? 2*t*t : -1+(4-2*t)*t,
     easeInCubic   : ( t: number ) => t*t*t,
     easeOutCubic  : ( t: number ) => (--t)*t*t+1,
     easeInOutCubic: ( t: number ) => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
     easeInQuart   : ( t: number ) => t*t*t*t,
     easeOutQuart  : ( t: number ) => 1-(--t)*t*t*t,
     easeInOutQuart: ( t: number ) => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
     easeInQuint   : ( t: number ) => t*t*t*t*t,
     easeOutQuint  : ( t: number ) => 1+(--t)*t*t*t*t,
     easeInOutQuint: ( t: number ) => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t
}

export function draggable ( options: DraggableOptions )
{
     const config     = defaultConfig ()

     var is_active  = false
     var is_animate = false
     var current_event: DragEvent

     var start_time = 0
     var start_x    = 0
     var start_y    = 0

     var velocity_delay = 500
     var velocity_x: number
     var velocity_y: number

     var current_animation = -1

     updateConfig ( options )

     function updateConfig ( options: DraggableOptions )
     {
          if ( is_drag )
          {
               return
          }

          if ( navigator.maxTouchPoints > 0 )
               document.body.style.touchAction = "none"

          disableEvents ()

          Object.assign ( config, options )

          enableEvents ()
     }

     function addHandles ( ... handles: JSX.Element [] )
     {
          for ( const h of handles )
          {
               if ( ! config.handles.includes (h) )
                    config.handles.push (h)
          }

          if ( is_active )
          {
               desactivate ()
               activate ()
          }
     }

     function activate ()
     {
          enableEvents ()
          is_active = true
     }

     function desactivate ()
     {
          disableEvents ()
          is_active = false
     }

     return {
          updateConfig,
          addHandles,
          isActive: () => is_active,
          activate,
          desactivate,
     }

     function enableEvents ()
     {
          for ( const h of config.handles )
               h.addEventListener ( "pointerdown", onStart, { passive: true } )
     }
     function disableEvents ()
     {
          for ( const h of config.handles )
               h.removeEventListener ( "pointerdown" , onStart )
     }

     function onStart ( event: MouseEvent | TouchEvent )
     {
          if ( is_drag )
          {
               console.warn ( "Tentative de démarrage des événements "
                              + "\"draggable \" déjà en cours." )
               return
          }

          if ( is_animate )
          {
               stopVelocityFrame ()
          }

          pointer = (event as TouchEvent).touches
                    ? (event as TouchEvent).touches [0]
                    : (event as MouseEvent)

          window.addEventListener ("pointermove", onMove)
          window.addEventListener ("pointerup"  , onEnd)
          disableEvents ()

          current_animation = window.requestAnimationFrame ( onAnimationStart )

          is_drag = true
     }
     function onMove ( event: MouseEvent | TouchEvent )
     {
          if ( is_drag == false )
               return

          pointer = (event as TouchEvent).touches !== undefined
                    ? (event as TouchEvent).touches [0]
                    : (event as MouseEvent)
     }
     function onEnd ( event: MouseEvent | TouchEvent )
     {
          window.removeEventListener ("pointermove", onMove)
          window.removeEventListener ("pointerup"  , onEnd)
          enableEvents ()

          is_drag = false
     }

     function onAnimationStart ( now: number )
     {
          start_x    = pointer.clientX
          start_y    = pointer.clientY
          start_time = now

          current_event = {
               delay    : 0,
               x        : 0,
               y        : 0,
               offsetX  : 0,
               offsetY  : 0,
               targetX: 0,
               targetY: 0,
          }

          config.onStartDrag ()

          current_animation = window.requestAnimationFrame ( onAnimationFrame )
     }
     function onAnimationFrame ( now: number )
     {
          const { velocityFactor } = config

          const x           = pointer.clientX - start_x
          const y           = start_y - pointer.clientY
          const delay       = now - start_time
          const offsetDelay = delay - current_event.delay
          const offsetX     = x - current_event.x
          const offsetY     = y - current_event.y

          current_event = {
               delay,
               x,
               y,
               targetX: x,
               targetY: y,
               offsetX,
               offsetY,
          }

          if ( is_drag )
          {
               config.onDrag ( current_event )
               current_animation = window.requestAnimationFrame ( onAnimationFrame )
          }
          else
          {
               start_time     = now
               start_x        = x
               start_y        = y
               velocity_x       = velocityFactor * norm ( offsetX / offsetDelay )
               velocity_y       = velocityFactor * norm ( offsetY / offsetDelay )

               current_event.targetX += velocity_x
               current_event.targetY += velocity_y

               if ( config.onStopDrag ( current_event ) === true )
               {
                    is_animate = true
                    current_animation = window.requestAnimationFrame ( onVelocityFrame )
               }
          }

          function norm ( value: number )
          {
               if (value < -1 )
                    return -1

               if ( value > 1 )
                    return 1

               return value
          }
     }
     function onVelocityFrame ( now: number )
     {
          const delay = now - start_time

          const t = delay >= velocity_delay
                  ? 1
                  : delay / velocity_delay

          const factor  = EasingFunctions.easeOutQuart (t)
          const offsetX = velocity_x * factor
          const offsetY = velocity_y * factor

          current_event.x       = start_x + offsetX
          current_event.y       = start_y + offsetY
          current_event.offsetX = velocity_x - offsetX
          current_event.offsetY = velocity_y - offsetY

          config.onDrag ( current_event )

          if ( t == 1 )
          {
               is_animate = false
               config.onEndAnimation ( current_event )
               return
          }

          current_animation = window.requestAnimationFrame ( onVelocityFrame )
     }
     function stopVelocityFrame ()
     {
          is_animate = false
          window.cancelAnimationFrame ( current_animation )
          config.onEndAnimation ( current_event )
     }
}
