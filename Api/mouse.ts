
import { Area } from "@ui/Elements/area"


declare global
{
     interface Mouse$
     {
          cursor: string
     }
}


class Mouse
{
     get x (): number
     {
          if ( Area.currentEvent != null )
               return Area.currentEvent.pointer.x
          return 0;
     }
     get y (): number
     {
          if ( Area.currentEvent != null )
               return Area.currentEvent.pointer.y
          return 0;
     }
}

export function mouse ()             : Mouse
export function mouse ( definition ) : void
export function mouse ( definition? ): void | Mouse
{
     switch ( arguments.length )
     {
     case 0:
          return new Mouse ()
     case 1:
          break
     default:
          throw ""
     }
}

