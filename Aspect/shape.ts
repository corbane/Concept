
import { Geometry } from "./geometry"
import { Ctor as DataCtor } from "../Data/index"

declare global
{
     interface $ShapeEvents <D extends $Node = any>
     {
          onCreate: ( entity: D, aspect: Shape ) => void,
          onDelete: ( entity: D, shape: Shape ) => void,
          onTouch: ( aspect: Shape ) => void
     }

     interface $Shape <D extends $Thing = $Thing> extends $Node, $Geometry, $ShapeEvents
     {
          context: "concept-aspect"

          data: D

          minSize   : number
          sizeOffset: number
          sizeFactor: number
     }
}

export type Ctor <Data extends $Shape = $Shape, T extends Shape = Shape> = DataCtor <Data, T>

export class Shape <$ extends $Shape = $Shape>
{
     defaultConfig (): $Shape
     {
          return {
               context: "concept-aspect",
               type   : "shape",
               id     : undefined,
               data   : undefined,
               x      : 0,
               y      : 0,
               //size      : 20,
               minSize   : 1,
               sizeFactor: 1,
               sizeOffset: 0,

               shape           : "circle",
               borderColor     : "gray",
               borderWidth     : 5,

               backgroundColor : "transparent",
               backgroundImage : undefined,
               backgroundRepeat: false,

               onCreate        : undefined,
               onDelete        : undefined,
               onTouch         : undefined,
          }
     }

     readonly config: $

     group = undefined as fabric.Group

     readonly background: Geometry
     readonly border: Geometry

     constructor ( data: $ )
     {
          this.background = undefined
          this.border = undefined
          this.config = {
               ... this.defaultConfig (),
               ... data
          }

          const { config } = this

          const group = this.group = new fabric.Group ( [],
          {
               width      : this.displaySize (),
               height     : this.displaySize (),
               left       : config.x,
               top        : config.y,
               hasBorders : true,
               hasControls: true,
               originX    : "center",
               originY    : "center",
          })

          ;(this.background as Geometry) = new Geometry ( this )

          group.setCoords ()
     }

     displaySize ()
     {
          const config = this.config

          var size = (1 + config.sizeOffset) * config.sizeFactor

          if ( size < config.minSize )
               size = config.minSize

          return size || 1
     }

     updateSize ()
     {
          const { group, config } = this

          if ( this.background )
               this.background.updateSize ()

          if ( this.border )
               this.border.updateSize ()

          group.set ({
               width : this.displaySize (),
               height: this.displaySize (),
          })

          if ( group.canvas )
               group.canvas.requestRenderAll ()
     }

     coords ()
     {
          return this.group.getCoords ()
     }

     setBackground ( options: Partial <$Geometry> )
     {
          Object.assign ( this.config, options )

          this.background.update ( options )

          this.updateSize ()
     }

     setPosition ( x: number, y: number )
     {
          const { group, config } = this

          config.x = x
          config.y = y
          group.set ({ left: x, top : y }).setCoords ()

          if ( group.canvas )
               group.canvas.requestRenderAll ()
     }

     hover ( up: boolean )
     {
          const target = this.background != undefined
                         ? this.background.object
                         : this.group

          target.setShadow( 'rgba(0,0,0,0.3)' )

          fabric.util.animate({
               startValue: up ? 0 : 1,
               endValue  : up ? 1 : 0,
               easing    : fabric.util.ease.easeOutCubic,
               byValue   : undefined,
               duration  : 100,
               onChange  : ( value: number ) =>
               {
                    const offset = 1 * value

                    target.setShadow( `${ offset }px ${ offset }px ${ 10 * value }px rgba(0,0,0,0.3)` )
                    target.scale( 1 + 0.1 * value )
                    target.canvas.requestRenderAll ()
               },
          })
     }

     toJson ()
     {
          return JSON.stringify ( this.config )
     }
}
