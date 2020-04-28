

import { set, define } from "../db"
import { xnode }       from "../Base/xnode"
import { command }     from "../../Api/command"

import { Component }   from "./component"

declare global
{
     interface $Button extends $Component
     {
          type       : "button"
          icon       : string
          text?      : string
          tooltip?   : JSX.Element
          fontFamily?: string,
          callback?  : () => boolean | void,
          command?   : string,
          handleOn?  : "toggle" | "drag" | "*"
     }
}

export class Button extends Component <$Button>
{
     /** @override */
     getHtml ()
     {
          if ( this.container == undefined )
          {
               const data = this.data

               const node = <div class="button">
                    { data.icon ? <span class="icon">{ data.icon }</span> : null }
                    { data.text ? <span class="text">{ data.text }</span> : null }
               </div>

               if ( this.data.callback != undefined || this.data.command != undefined )
                    node.addEventListener ( "click", this.onTouch.bind (this) )

               this.container = node
          }

          return [ this.container ] as HTMLElement []
     }

     onTouch ()
     {
          if ( this.data.callback && this.data.callback () !== true )
               return

          if ( this.data.command )
               //Commands.current.run ( this.data.command )
               command ( this.data.command ).run ()
     }

     protected onHover ()
     {

     }
}


define ( Button, [CONTEXT_UI, "button"] )

set <$Button> ( [ "button" ], {
     type: "button" as "button",
     id  : undefined,
     icon: undefined,
})
