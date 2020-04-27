import { Geometry } from "../../../Lib/index.js"
import { Component } from "../../Base/Component/index.js"
import * as Svg from "../../Base/Svg/index.js"
import { xnode } from "../../Base/xnode.js"

const G = Geometry

type Renderer = ( definition: RadialDefinition ) => SVGElement []
type RadialDefinition = Geometry.RadialDefinition
type RadialOption     = Geometry.RadialOption

declare global
{
     interface $RadialMenu extends $Component
     {
          type: "radial-menu",
          buttons: Partial <$Button> [],
          rotation: number
     }
}


export class RadialMenu extends Component <$RadialMenu>
{
     container: SVGSVGElement
     definition: RadialDefinition

     readonly renderers: Record <string, Renderer> = {
          "circle": this.renderSvgCircles.bind (this)
     }

     /** @override */
     getHtml ()
     {
          this.update ()

          return [this.container as any]
     }

     add ( ... buttons: $Button [] )
     {
          this.data.buttons.push ( ... buttons as any )

          this.update ()
     }

     update ()
     {
          const { data } = this

          const def: RadialOption = {
               count  : data.buttons.length,
               r      : 75,
               padding: 6,
               rotation: data.rotation || 0
          }

          this.definition = G.getRadialDistribution ( def )
          this.container  = this.toSvg ( "circle" )
     }

     private enableEvents ()
     {
          //const { options } = this
          //for ( const btn of options.buttons )
          //     btn.
     }

     show ( x: number, y: number ): void
     {
          const n = this.container
          const offset = this.definition.width / 2

          n.style.left = (x - offset) + "px"
          n.style.top  = (y - offset) + "px"
          n.classList.remove ( "close" )
          window.addEventListener ( "mousedown", this.hide.bind (this), true )
     }

     hide ()
     {
          this.container.classList.add ("close")
          document.removeEventListener ( "mousedown", this.hide )
     }

     toSvg ( style: string )
     {
          const { definition: def, renderers, data } = this

          const svg =
               <svg
                    class   ="radial-menu close"
                    width   ={ def.width + "px" }
                    height  ={ def.height + "px" }
                    viewBox ={ `0 0 ${ def.width } ${ def.height }` }
               /> as SVGSVGElement

          const buttons = style in renderers
                         ? renderers [style] ( def )
                         : this.renderSvgCircles ( def )

          svg.append ( ... buttons as Node [] )

          for ( var i = 0 ; i != buttons.length ; i++ )
          {
               const opt = data.buttons [i]

               if ( typeof opt.callback == "function" )
                    buttons [i].addEventListener ( "mousedown", () => opt.callback () )
          }

          return svg
     }

     renderSvgCircles ( definition: RadialDefinition )
     {
          const points  = definition.points
          const padding = definition.padding
          const buttuns = [] as SVGElement []

          for ( var i = 0; i < points.length; ++i )
          {
               const def = points [i]
               const btn = this.data.buttons [i]

               const group = <g class="button" />

               const circle = Svg.createSvgShape ( "circle", {
                    size: def.chord.length - padding * 2,
                    x: def.x,
                    y: def.y
               })

               const text = <text
                    x = { def.x }
                    y = { def.y }
                    font-size="30"
                    fill="black"
                    style="user-select: none; cursor: pointer; dominant-baseline: central; text-anchor: middle;"
               />

               if ( btn.fontFamily != undefined )
                    text.setAttribute ( "font-family", btn.fontFamily )

               text.innerHTML = btn.icon

               group.append ( circle )
               group.append ( text )

               buttuns.push ( group as SVGElement )
          }

          return buttuns
     }
}

