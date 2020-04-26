import { $default }       from "./index.js"
import { createSvgShape } from "../../Base/Svg/index.js"
import { set, define }    from "../../db.js"
import { Component }      from "../../Base/Component/index.js"

declare global
{
     interface $SvgButton extends $Button
     {
          radius: number
          x: number
          y: number
     }
}


const _SvgButton = ( data: $SvgButton ) =>
{
     const group = <g class="button" />

     const circle = createSvgShape ( "circle", {
          size: data.radius * 2,
          x: data.x,
          y: data.y
     })

     const text = <text
          x = { data.x }
          y = { data.y }
          font-size="30"
          fill="black"
          style={[
               "user-select: none; cursor: pointer; dominant-baseline: central; text-anchor: middle;",
               data.fontFamily ? "font-family: " + data.fontFamily : null
          ] as any}
     >
          { data.icon }
     </text>

     group.append ( circle )
     group.append ( text )

     return group
}

set <$SvgButton> ( ["button", "svg"],
{
     ... $default,
     radius: 30,
     x     : 0,
     y     : 0,
})

class SvgButton extends Component <$SvgButton>
{
     toSvg ()
     {
          const def = this.data

          const group = <g class="button" />

          const circle = createSvgShape ( "circle", {
               size: def.radius * 2,
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

          if ( def.fontFamily != undefined )
               text.setAttribute ( "font-family", def.fontFamily )

          text.innerHTML = def.icon

          group.append ( circle )
          group.append ( text )

          return [group]
     }
}

define ( SvgButton, ["button", "svg"] )
