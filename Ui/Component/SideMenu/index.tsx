
import { xnode } from "../../Base/xnode.js"
import { Panel } from "../Panel/index.js"
import { expandable, ExpendableElement } from "../../Base/expendable.js"
import { define } from "../../db.js"

declare global
{
     interface $SideMenu extends Omit <$Panel, "type">
     {
          type: "side-menu"
          hasMainButton: boolean,
     }
}

type Direction = "lr" | "rl" | "tb" | "bt"

export class SideMenu extends Panel <$SideMenu>
{
     main_button: JSX.Element
     expandable: ExpendableElement

     getHtml ()
     {
          const elements = super.getHtml ()

          const data      = this.data
          const container = this.container
          const header    = this._header
          const content   = this._content

          container.classList.replace ( "panel"        , "side-menu" )
          header   .classList.replace ( "panel-header" , "side-menu-header" )
          content  .classList.replace ( "panel-content", "side-menu-content" )

          if ( data.hasMainButton )
          {
               const btn = <span class="side-menu-main-button">
                    <span class="icon">⇕</span>
               </span>

               this.main_button = btn
               //this.container.insertAdjacentElement ( "afterbegin", btn )
               header.insertAdjacentElement ( "afterbegin", btn )
          }

          this.expandable = expandable ( this.container, {
               direction    : data.direction,
               near         : 60,
               handles      : Array.of ( this.main_button ),
               onAfterOpen  : () => {
                    content.classList.remove ( "hidden" )
               },
               onBeforeClose: () => {
                    content.classList.add ( "hidden" )
               }
          })

          this.expandable.activate ()

          return elements
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

     // setOrientation ( value: Direction )
     // {
     //      super.setOrientation ( value )

     //      const { expandable } = this

     //      expandable.updateConfig ({ direction: value })

     // }
}

define ( SideMenu, ["side-menu"] )
