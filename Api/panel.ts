
import "@ui/types"
import * as ui from "../Ui/db"
import { Panel } from "../Ui/Elements/panel"

var current: Panel = null
const elems = {} as Record <string, Panel>

export function panel (): Panel
export function panel ( id: string ): Panel
export function panel ( definition: $Panel ): Panel
export function panel ( id: string, definition: $Panel ): Panel
export function panel ( a?: string | $Panel, b?: $Panel ): Panel
{
     switch ( arguments.length )
     {
     case 0: // panel ()

          return current;

     case 1: // panel ( id ) | panel ( definition )

          if ( typeof a == "string" )
               return elems [a];

          if ( typeof a != "object" || a == null || Array.isArray (a) )
               throw `Bad panel definition : ${ a }`

          b = a;
          a = b.id;

     case 2: // panel ( id, definition )

          if ( typeof a != "string" )
               throw `Bad id name : ${ a }`

          if ( a in elems )
               throw `Panel already exists : ${ a }`

          if ( typeof b != "object" || b == null || Array.isArray (b) )
               throw `Bad panel definition : ${ b }`

          ;(b as any).id = a
          //elems [a] = new Panel ( b )
          elems [a] = ui.inStock ( b ) ? ui.pick ( b ) : ui.make ( b )
          this.placeTo ( b.position );
          break

     default:
          throw "Wrong function call"
     }

}


