
import { Component } from "../Component/index.js"
import { xnode }     from "../Base/xnode.js"
//import { Commands }  from "../../Base/command.js"
import { define }    from "../db.js"
import { command } from "../command.js"

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
