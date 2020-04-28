
import "../types"
import { Component } from "./component"
import { SideMenu } from "./sideMenu"

declare global
{
     interface $Panel extends $Component
     {
          //type         : "panel"
          header?      : $AnyComponents,
          children?    : $AnyComponents []
          footer?      : $AnyComponents
          position: "left" | "right" | "top" | "bottom",
          button: $Button
     }
}

type Direction = "lr" | "rl" | "tb" | "bt"

const toPosition = {
     lr : "left",
     rl : "right",
     tb : "top",
     bt : "bottom",
}

export /*abstract*/ class Panel <C extends $Panel = $Panel> extends Component <C>
{
     private menu: SideMenu

     placeTo ( side: "left" | "right" | "top" | "bottom" )
     {
          const data = this.data

          if ( data.position == side && this.menu != null ) return

          const cfg = {
               context      : "concept-ui" as "concept-ui",
               type         : "side-menu"  as "side-menu",
               hasMainButton: true,
          }

          var menu: SideMenu

          switch ( side )
          {
          case "left":

               if ( SideMenu.atLeft == null ) SideMenu.atLeft = new SideMenu ({
                    id: "side-menu-left",
                    direction: "lr",
                    ... cfg,
               })
               menu = SideMenu.atLeft
               break

          case "right":

               if ( SideMenu.atRight == null ) SideMenu.atRight = new SideMenu ({
                    id: "side-menu-right",
                    direction: "rl",
                    ... cfg,
               })
               menu = SideMenu.atRight
               break

          case "top":

               if ( SideMenu.atTop == null ) SideMenu.atTop = new SideMenu ({
                    id: "side-menu-top",
                    direction: "tb",
                    ... cfg,
               })
               menu = SideMenu.atTop
               break

          case "bottom":

               if ( SideMenu.atBottom == null ) SideMenu.atBottom = new SideMenu ({
                    id: "side-menu-bottom",
                    direction: "bt",
                    ... cfg,
               })
               menu = SideMenu.atBottom
               break
          }

          if ( this.menu != undefined )
               this.menu.remove ( this )

          menu.append ( this )
          data.position = side
     }

     open ()
     {
          this.menu.clear ()
          this.menu.append ( this )
          this.menu.open ()
     }

     close ()
     {
          this.menu.close ()
     }

}

