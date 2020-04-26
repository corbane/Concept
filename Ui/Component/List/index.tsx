
import { xnode } from "../../Base/xnode.js"
import { Unit } from "../../../Lib/css/unit.js"
import { Container } from "../../Base/Container/index.js"
import { SwipeableElement, swipeable } from "../../Base/swipeable.js"
import { ExpendableElement, expandable } from "../../Base/expendable.js"
import { cssFloat } from "../../Base/dom.js"
import { Component } from "../../Base/Component/index.js"

declare global
{
     interface $ListView extends $Container
     {
          type: "list-view"
     }
}

export class ListView <$ extends $Extends <$ListView>> extends Container <$>
{
     swipeable: ExpendableElement

     getHtml ()
     {
          if ( this.container != undefined )
               return [this.container]

          const slot = this.slot = <div class="list-view-slide"></div>

          super.getHtml ()

          const container = this.container

          container.append ( slot )
          container.classList.add ( "list-view" )

          this.swipeable = expandable ( slot, {
               handles   : [ container ],
               minSize  : 0,
               maxSize  : 0,
               property  : this.is_vertical ? "top": "left",
               direction : this.data.direction,
               unit     : "px",
               //mouseWheel: true,
          })
          this.swipeable.activate ()

          window.addEventListener ( "DOMContentLoaded", () =>
          {
               this.swipeable.updateConfig ({
                    minSize: -this.slideSize (),
               })
          })

          return [this.container]
     }

     onChildrenAdded ( elements: Component [] )
     {
          this.swipeable.updateConfig ({
               minSize  : -this.slideSize (),
               property : this.is_vertical ? "top": "left",
               direction: this.data.direction,
          })
     }

     private slideSize ()
     {
          const { slot } = this

          return cssFloat ( slot, this.is_vertical ? "height" : "width" )
     }

     swipe ( offset: string|number, unit?: "px" | "%" )
     {
         // if ( typeof offset == "string" )
         //      this.swipeable.swipe ( offset )
         // else
         //      this.swipeable.swipe ( offset, unit )
     }
}
