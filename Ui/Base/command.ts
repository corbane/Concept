

import { uEvent } from "../../Lib/index.js"

type Records = Record <string, ( ... args: any ) => any>

export interface $Command extends $Node
{
     context: "concept-application"
     type: "command"
     name: string
     shortcut: string
}

export class Commands <
     Cmds   extends Records,
     CNames extends keyof Cmds
>
{
     static get current () { return current }

     readonly db = {} as Cmds
     readonly events = {} as Record <CNames, uEvent.IEvent>

     constructor () {}

     add <K extends CNames> ( name: K, callback: Cmds [K] )
     {
          if ( name in this.db )
               return

               this.db [name] = callback
     }

     has ( key: string )
     {
          return key in this.db
     }

     run <K extends CNames> ( name: K, ... args: Parameters <Cmds [K]> )
     {
          if ( name in this.db )
          {
               this.db [name] ( ... args as any )

               if ( name in this.events )
                    this.events [name].dispatch ()
          }
     }

     on ( name: CNames, callback: () => void )
     {
          const callbacks = name in this.events
                              ? this.events [name]
                              : this.events [name] = uEvent.create ()

          callbacks ( callback )
     }

     remove ( key: string )
     {
          delete this.db [key]
     }
}

const current = new Commands ()
