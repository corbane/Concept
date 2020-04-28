
import { xnode } from "../Base/xnode.js"
import { Container } from "../Container/index.js"
import { Component } from "../Component/index.js"
import { expandable, ExpendableElement } from "../Base/expendable.js"
import { pick, define, inStock, make } from "../db.js"
import { scollable } from "../Base/scrollable.js"

declare global
{
     interface $SideMenu extends $Container
     {
          type: "side-menu"
          hasMainButton: boolean,
          header?      : $AnyComponents,
          children?    : $AnyComponents [],
          footer?      : $AnyComponents,
     }
}

type Direction = "lr" | "rl" | "tb" | "bt"

const toPosition = {
     lr : "left",
     rl : "right",
     tb : "top",
     bt : "bottom",
}

var left_menu   = null as SideMenu
var right_menu  = null as SideMenu
var top_menu    = null as SideMenu
var bottom_menu = null as SideMenu

export class SideMenu extends Container <$SideMenu>
{
     static atLeft: SideMenu
     static atRight: SideMenu
     static atTop: SideMenu
     static atBottom: SideMenu

     main_button: JSX.Element
     expandable: ExpendableElement
     content    : Component
     header     : Component

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

          if ( data.header )
          {
               this.header = inStock ( data.header )
                           ? pick ( data.header )
                           : make ( data.header )

               header.append ( ... this.header.getHtml () )
          }

          if ( data.hasMainButton )
          {
               const btn = <span class="side-menu-main-button">
                    <span class="icon">⇕</span>
               </span>

               this.main_button = btn
               header.insertAdjacentElement ( "afterbegin", btn )
          }

          if ( data.children )
          {
               for ( const child of data.children )
               {
                    this.content = inStock ( child ) ? pick ( child ) : make ( child )

                    content.append ( ... this.content.getHtml () )
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

     isOpen ()
     {
          return this.expandable.isOpen ()
     }

     isClose ()
     {
          return this.expandable.isClose ()
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

define ( SideMenu, [CONTEXT_UI, "side-menu"] )
