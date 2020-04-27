

import { set }      from "../../db.js"
//import { Commands } from "../../Base/command.js"
import { xnode }    from "../../Base/xnode.js"
import { command } from "../../command.js"

declare global
{
     export interface $Button extends $Component
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

const _Button = ( data: $Button ) =>
{
     const onTouch = () =>
     {
          if ( data.callback && data.callback () !== true )
               return

          if ( data.command )
               //Commands.current.run ( data.command )
               command ( data.command )
     }

     const node =
          <div class="button" onClick={ data.callback || data.command ? onTouch : null }>
               { data.icon ? <span class="icon">{ data.icon }</span> : null }
               { data.text ? <span class="text">{ data.text }</span> : null }
          </div>

     return node
}


export { Button } from "./html.js"

export const $default = {
     type: "button" as "button",
     id  : undefined,
     icon: undefined,
}

set <$Button> ( [ "button" ], $default )
