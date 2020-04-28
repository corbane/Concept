
import { Area } from "@elements/area"
const cmds = {} as Record <string, Command>

class Command
{
     constructor ( private callback: ( event: fabric.IEvent ) => void ) {}

     run ()
     {
          try {
               this.callback ( Area.currentEvent );
          } catch (error) {

          }
     }
}

export function command ( name: string, callback?: ( event: fabric.IEvent ) => void )
{
     if ( typeof callback == "function" )
     {
          if ( name in cmds ) return
          cmds [name] = new Command ( callback )
     }

     return cmds [name]
}
