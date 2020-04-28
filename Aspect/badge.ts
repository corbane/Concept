
import * as db from "../Application/data"
import { Shape } from "./shape"

export type BadgePosition = { angle: number, offset: number }

export class Badge extends Shape
{
     readonly owner = undefined as Shape

     readonly position = { angle: 0, offset: 0 }

     constructor ( options: $Shape )
     {
          super ( options )

          const { group } = this

          const thisdata = this.config.data
          const entity = db.node <$Badge> ( thisdata.type, thisdata.id )

          const text = new fabric.Textbox ( entity.emoji || "X", {
               fontSize: this.displaySize (),
               originX : "center",
               originY : "center",
               left    : group.left,
               top     : group.top,
          })

          group.addWithUpdate ( text )
     }

     displaySize ()
     {
          return 20
     }

     attach ( target: Shape, pos = {} as BadgePosition )
     {
          const { random, PI } = Math

          if ( ! isFinite ( pos.angle ) )
               pos.angle = random () * PI * 2

          if ( ! isFinite ( pos.offset ) )
               pos.offset = 0.1

          ;(this.position as BadgePosition) = { ... pos }

          if ( this.owner != undefined )
               target.group.remove ( this.group )

          target.group.add ( this.group )

          ;(this.owner as Shape) = target

          this.updatePosition ()
     }

     updatePosition ()
     {
          const { position: pos, owner } = this

          if ( owner == undefined )
               return

          const { random, PI, cos, sin } = Math

          const rad    = pos.angle || random () * PI * 2
          const x      = sin (rad)
          const y      = cos (rad)
          const s      = owner.displaySize () / 2
          const offset = typeof pos.offset == "number"
                         ? this.displaySize () * pos.offset
                         : this.displaySize () * 0.1

          this.setPosition ( x * (s + offset), y * (s + offset) )
     }
}
