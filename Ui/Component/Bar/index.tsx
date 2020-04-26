import { Component } from "../../Base/Component/index.js"
import { xnode } from "../../Base/xnode.js"
import { define } from "../../db.js"

declare global
{
     export interface $Block extends $Component
     {
          type: "block"
          orientation: Orientation
          elements: Component []
     }
}

type Orientation = "vertical" | "horizontal"

export class Block extends Component <$Block>
{
     container = <div class="bar"></div>

     get orientation ()
     {
          return this.container.classList.contains ( "vertical" )
               ? "horizontal"
               : "vertical"
     }

     set orientation ( orientation: Orientation )
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


define ( Block, ["block"] )
