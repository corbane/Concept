
import "../../types.js"
import { Component } from "../../Base/Component/index.jsx"
import { SideMenu } from "../SideMenu/index.jsx"

declare global
{
     interface $Panel extends $Component
     {
          type         : "panel"
          header?      : $AnyComponents,
          children?    : $AnyComponents []
          footer?      : $AnyComponents
          position: "left" | "right" | "top" | "bottom"
     }
}


var current: Panel = null
const elems = {} as Record <string, Panel>

export function panel (): Panel
export function panel ( id: string ): Panel
export function panel ( definition: $Panel ): Panel
export function panel ( id: string, definition: $Panel ): Panel
export function panel ( a?: string | $Panel, b?: $Panel ): Panel
{
     switch ( arguments.length )
     {
     case 0: // panel ()

          return current;

     case 1: // panel ( id ) | panel ( definition )

          if ( typeof a == "string" )
               return elems [a];

          if ( typeof a != "object" || a == null || Array.isArray (a) )
               throw `Bad panel definition : ${ a }`

          b = a;
          a = b.id;

     case 2: // panel ( id, definition )

          if ( typeof a != "string" )
               throw `Bad id name : ${ a }`

          if ( a in elems )
               throw `Panel already exists : ${ a }`

          if ( typeof b != "object" || b == null || Array.isArray (b) )
               throw `Bad panel definition : ${ b }`

          ;(b as any).id = a

          const cfg = {
               context      : "concept-ui" as "concept-ui",
               type         : "side-menu"  as "side-menu",
               hasMainButton: true,
          }

          var menu: SideMenu

          switch ( b.position )
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

          break

     default:
          throw "Wrong function call"
     }

     const panel = new Panel ( b, menu )
     elems [a] = panel
     menu.append ( panel )
}



type Direction = "lr" | "rl" | "tb" | "bt"

const toPosition = {
     lr : "left",
     rl : "right",
     tb : "top",
     bt : "bottom",
}

class Panel extends Component <$Panel>
{
     content    : Component
     header     : Component
     _header: JSX.Element
     _content: JSX.Element

     constructor ( data: $Panel, private menu: SideMenu )
     {
          super ( data )
     }

     /** @override */
     getHtml (): (HTMLElement | SVGElement) []
     {
          return super.getHtml ()
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

