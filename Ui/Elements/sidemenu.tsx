
import { Container } from "./container"
import { Component } from "./component"
import { xnode } from "../Base/xnode"
import { expandable, ExpendableElement } from "../Base/expendable"
import { define } from "../db"
import { scollable } from "../Base/scrollable"
import { swipeable, SwipeableElement } from "../Base/swipeable"
import { Toolbar } from "./toolbar"



declare global
{
     interface $SideMenu extends $Container
     {
          type: "side-menu"
          hasMainButton: boolean,
          buttons ? : $Button []
          children?    : $Panel []

          // header?      : $AnyComponents
          // footer?      : $AnyComponents
     }

     interface $Slideshow extends $Container
     {
          type        : "slideshow"
          children    : $AnyComponents []
          isSwipeable?: boolean
     }

     interface $Slide extends $Container
     {
          type: "slide"
     }
}

type Direction = "lr" | "rl" | "tb" | "bt"


var left_menu   = null as SideMenu
var right_menu  = null as SideMenu
var top_menu    = null as SideMenu
var bottom_menu = null as SideMenu

const toPosition = {
     lr : "left",
     rl : "right",
     tb : "top",
     bt : "bottom",
}


export class SideMenu extends Container <$SideMenu>
{
     static atLeft: SideMenu
     static atRight: SideMenu
     static atTop: SideMenu
     static atBottom: SideMenu

     main_button: JSX.Element
     expandable : ExpendableElement
     slideshow  : Slideshow
     toolbar     : Container

     /** @override */
     getHtml ()
     {
          const data = this.data
          const header    = <div class="side-menu-header" />
          const content   = <div class="side-menu-content" />
          const container = <div class="side-menu close">
               { header }
               { content }
          </div>

          this.toolbar = new Toolbar ({
               context  : CONTEXT_UI,
               type     : "toolbar",
               id       : data.id + "-toolbar",
               direction: data.direction == "lr" || data.direction == "rl" ? "tb" : "lr",
               title    : null,
               buttons  : data.buttons,
               children : null,
               //children: data.children,
          })
          header.append ( ... this.toolbar.getHtml () )

          // data.additionalButtons
          // if ( data.buttons )
          // {
          //      for ( const child of data.buttons )
          //           this.header.append ( child )
          // }

          if ( data.hasMainButton )
          {
               const btn = <span class="side-menu-main-button">
                    <span class="icon">⇕</span>
               </span>

               this.main_button = btn
               header.insertAdjacentElement ( "afterbegin", btn )
          }

          this.slideshow = new Slideshow ({
               context    : CONTEXT_UI,
               type       : "slideshow",
               id         : data.id + "-slideshow",
               direction  : data.direction,
               isSwipeable: false,
               children   : []
          })
          content.append ( ... this.slideshow.getHtml ()  )

          if ( data.children )
          {
               for ( const child of data.children )
               {
                    this.slideshow.append ( child )
                    if ( child.button )
                         this.toolbar.append ( child.button )
               }
          }

          container.classList.add ( toPosition [data.direction] )
          scollable ({ handles: [content], direction: "bt" }).activate ()

          this.container  = container
          this.expandable = expandable ( this.container, {
               direction    : data.direction,
               near         : 60,
               handles      : Array.of ( this.main_button ),
               onAfterOpen  : () => content.classList.remove ( "hidden" ),
               onBeforeClose: () => content.classList.add ( "hidden" )
          })
          this.expandable.activate ()

          return [ this.container ] as HTMLElement []
     }

     /** @override */
     append ( ... elements: (string | Element | Component | $AnyComponents) [] )
     {
          this.slideshow.append ( ... elements )
     }

     /** @override */
     remove ( ... elements: Component [] )
     {
          this.slideshow.remove ( ... elements )
     }

     open ()
     {

     }

     close ()
     {
          this.expandable.close ()

          return this
     }
}


export class Slideshow extends Container <$Slideshow>
{
     children = {} as Record <string, Container>
     current: Component
     private swipeable: SwipeableElement

     /** @override */
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
}


define ( SideMenu, [CONTEXT_UI, "side-menu"] )
define ( Slideshow, [CONTEXT_UI, "slideshow"] )
define ( Container, [CONTEXT_UI, "slide"]     )
