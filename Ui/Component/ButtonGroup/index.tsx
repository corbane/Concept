
import { xnode } from "../../Base/xnode.js"
import { pick } from "../../db.js"

export interface ButtonGroupConfig
{
     buttons: $Button []
}

type Orientation = "vertical" | "horizontal"

export class ButtonGroup
{
     buttons = [] //as Button []

     container = <div class="button-group"></div>

     add ( ... elements: $Button [] )
     {
          const { buttons, container } = this

          for ( var obj of elements )
          {
               const comp = pick ( obj )

               buttons.push ( comp )
               container.append ( ... comp.getHtml () )
          }
     }

     setOrientation ( orientation: Orientation )
     {
          const classList = this.container.classList

          var new_orientation = classList.contains ( "vertical" )
                              ? "horizontal"
                              : "vertical"

          if ( orientation == new_orientation )
               return

          classList.replace  ( orientation, new_orientation )
     }
}

