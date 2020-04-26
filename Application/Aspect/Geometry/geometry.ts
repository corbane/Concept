
//import * as fabric from "fabric/fabric-impl.js"

import { $Shape, Shape } from "../Element/shape.js"
import { Factory } from "./factory.js"

export type GeometryNames = keyof typeof Factory

export interface $Geometry
{
     shape: GeometryNames
     x         : number
     y         : number

     borderWidth    : number
     borderColor    : string

     backgroundColor : string
     backgroundImage : string
     backgroundRepeat: boolean
}

export class Geometry <T extends GeometryNames = GeometryNames>
{
     config: $Geometry
     object: ReturnType <typeof Factory [T]>

     constructor ( readonly owner: Shape )
     {
          this.config = owner.config
          this.updateShape ()
     }

     update ( options: Partial <$Geometry> )
     {
          Object.assign ( this.config, options )

          if ( "shape" in options )
          {
               this.updateShape ()
          }
          else if ( "backgroundImage" in options || "backgroundRepeat" in options )
          {
               this.updateBackgroundImage ()
          }
     }

     updatePosition ()
     {
          const { config, object } = this

          ;(object as fabric.Object).set ({
               left: config.x,
               top : config.y,
          })
          .setCoords ()
     }

     updateSize ()
     {
          const { owner, config, object } = this

          const size = owner.displaySize ()

          if ( config.shape == "circle" )
          {
               (object as fabric.Circle).set ({
                    radius: size / 2
               })
          }
          else
          {
               (object as fabric.Object).set ({
                    width : size,
                    height: size,
               })
          }

          object.setCoords ()
     }

     updateShape ( shape?: GeometryNames )
     {
          const { config, owner } = this

          if ( arguments.length == 0 )
               shape = config.shape
          else
               config.shape = shape

          if ( owner.group != undefined && this.object != undefined )
               owner.group.remove ( this.object )

          const obj = this.object
                    = Factory [config.shape as any] ( config, owner.displaySize (), {
                         left       : 0, //config.x,
                         top        : 0, //config.y,
                         originX    : "center",
                         originY    : "center",
                         fill       : config.backgroundColor,
                         stroke     : config.borderColor,
                         strokeWidth: config.borderWidth,
                    })

          owner.group.add ( obj )
          obj.sendToBack ()

          if ( config.backgroundImage != undefined )
               this.updateBackgroundImage ()

          if ( obj.canvas != undefined )
               obj.canvas.requestRenderAll ()

     }

     updateBackgroundImage ( path?: string )
     {
          if ( arguments.length == 0 )
               path = this.config.backgroundImage
          else
               this.config.backgroundImage = path

          if ( typeof path == "string" && path.length > 0 )
               fabric.util.loadImage ( path, this.on_pattern.bind (this) )
     }

     private on_pattern ( dimg: HTMLImageElement )
     {
          const { owner } = this

          const factor = dimg.width < dimg.height
                         ? owner.displaySize () / dimg.width
                         : owner.displaySize () / dimg.height

          ;(this.object as any).set ({
               fill: new fabric.Pattern ({
                    source: dimg,
                    repeat: "no-repeat",
                    patternTransform: [
                         factor, 0, 0,
                         factor, 0, 0,
                    ]
               })
          })
          .setCoords ()

          if ( this.object.canvas )
               this.object.canvas.renderAll ()
     }
}
