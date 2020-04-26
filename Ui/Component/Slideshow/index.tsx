import { Component } from "../../Base/Component/index.js"
import { Container } from "../../Base/Container/index.js"
import { swipeable, SwipeableElement } from "../../Base/swipeable.js"
import { define } from "../../db.js"

declare global
{
     export interface $Slideshow extends $Container
     {
          type        : "slideshow"
          children    : $AnyComponents []
          isSwipeable?: boolean
     }

     export interface $Slide extends $Container
     {
          type: "slide"
     }
}

//   ```
//   .slideshow
//        [...]
//   ```
export class Slideshow extends Container <$Slideshow>
{
     children = {} as Record <string, Container>
     current: Component
     private swipeable: SwipeableElement

     getHtml ()
     {
          const elements = super.getHtml ()

          const data = this.data
          const container = this.container

          if ( data.isSwipeable )
          {
               this.swipeable = swipeable ( container, {
                    handles   : [ container ],
                    minValue  : -0,
                    maxValue  : 0,
                    porperty  : data.direction == "bt" || data.direction == "tb" ? "top": "left",
                    units     : "px",
                    mouseWheel: true,
               })
               this.swipeable.activate ()
          }

          return elements
     }

     show ( id: string, ... content: (string | Element | Component | $AnyComponents ) [] )
     {
          const child = this.children [id]

          if ( child == undefined )
               return

          if ( this.current )
               this.current = child

          if ( content )
          {
               child.clear ()
               console.log ( content )
               child.append ( ... content )
          }

          child.container.style.display = "block"
     }
}

define ( Slideshow, ["slideshow"] )
define ( Container, ["slide"]     )
