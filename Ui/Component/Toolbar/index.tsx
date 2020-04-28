
import { xnode } from "../../Base/xnode.js"
import { Container } from "../../Base/Container/index.js"
import { ExpendableElement, expandable } from "../../Base/expendable.js"
import { cssFloat } from "../../Base/dom.js"
import { Component } from "../../Base/Component/index.js"

import { define } from "../../db.js"

interface $ListView extends $Container
{
     type: "list-view"
}

declare global
{
     interface $Toolbar extends $Extends <$ListView> // $Container
     {
          type     : "toolbar"
          title    : string
          buttons  : $Button []
     }

}

class ListView <$ extends $Extends <$ListView>> extends Container <$>
{
     swipeable: ExpendableElement

     /** @override */
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

/**
 *   ```pug
 *   .toolbar
 *        .toolbar-backgroung
 *        .toolbar-slide
 *             [...]
 *   ```
 */
export class Toolbar extends ListView <$Toolbar>
{
     tabs      : JSX.Element []
     background: JSX.Element

     defaultConfig (): $Toolbar
     {
          return {
               ... super.defaultData (),
               type     : "toolbar",
               title    : "Title ...",
               direction: "lr",
               //reverse  : false,
               buttons: []
          }
     }

     /** @override */
     getHtml ()
     {
          if ( this.container != undefined )
               return [this.container]

          super.getHtml ()

          if ( this.data.buttons )
               this.append ( ... this.data.buttons )

          return [this.container]
     }
}

define ( Toolbar, [CONTEXT_UI, "toolbar"] )


// type Direction = "lr" | "rl" | "tb" | "bt"
//
// type Units = "px" | "%"
//
// const toFlexDirection = {
//      lr: "row"            as "row",
//      rl: "row-reverse"    as "row-reverse",
//      tb: "column"         as "column",
//      bt: "column-reverse" as "column-reverse",
// }
//
// const toReverse = {
//      lr: "rl" as "rl",
//      rl: "lr" as "lr",
//      tb: "bt" as "bt",
//      bt: "tb" as "tb",
// }
