
import { Shape } from "./Element/shape.js"
//import * as Factory from "./factory.js"

declare global
{
     type GeometryNames = keyof typeof Factory

     interface $Geometry
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

     interface $TextDefinition extends $Geometry
     {
          text: string
     }

     interface $PathDefinition extends $Geometry
     {
          path: string
     }
}

const fabric_base_obtions: fabric.IObjectOptions = {
     left   : 0,
     top    : 0,
     originX: "center",
     originY: "center",
}

export function group ( def: $Geometry, size: number, opt: fabric.ICircleOptions )
{
     return new fabric.Group ( undefined,
     {
          ... fabric_base_obtions,
          ... opt,
          width: size,
          height: size,
     })
}

// To get points of triangle, square, [panta|hexa]gon
//
// var a = Math.PI*2/4
// for ( var i = 0 ; i != 4 ; i++ )
//     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )

export function circle ( def: $Geometry, size: number, opt: fabric.ICircleOptions )
{

     return new fabric.Circle (
     {
          ... fabric_base_obtions,
          ... opt,
          radius: size / 2,
     })
}

export function triangle ( def: $Geometry, size: number, opt: fabric.ITriangleOptions )
{
     const points = []
     const scale = 1.2
     const r = size / 2 * scale

     for ( const p of [
          [ 0, 1 ],
          [ 0.8660254037844387, -0.4999999999999998 ],
          [ -0.8660254037844385, -0.5000000000000004 ]
     ]) points.push ({ x: p[0] * r, y: p[1] * r })

     return new fabric.Polygon ( points, {
          ... fabric_base_obtions,
          ... opt,
          angle: 180,
     })
}

export function square ( def: $Geometry, size: number, opt: fabric.IRectOptions )
{
     const scale = 0.9
     return new fabric.Rect (
     {
          ... fabric_base_obtions,
          ... opt,
          width : size * scale,
          height: size * scale,
     })
}

export function pantagon ( def: $Geometry, size: number, opt: fabric.IObjectOptions )
{
     const points = []
     const scale = 1.1
     const r = size / 2 * scale

     for ( const p of [
          [ 0, 1 ],
          [ 0.9510565162951535, 0.30901699437494745 ],
          [ 0.5877852522924732, -0.8090169943749473 ],
          [ -0.587785252292473, -0.8090169943749475 ],
          [ -0.9510565162951536, 0.30901699437494723 ]
     ]) points.push ({ x: p[0] * r, y: p[1] * r })

     return new fabric.Polygon ( points, {
          ... fabric_base_obtions,
          ... opt,
          angle: 180,
     })
}

export function hexagon ( def: $Geometry, size: number, opt: fabric.IObjectOptions )
{
     const points = []
     const scale = 1.1
     const r = size / 2 * scale

     for ( const p of [
          [ 0, 1 ],
          [ 0.8660254037844386, 0.5000000000000001 ],
          [ 0.8660254037844387, -0.4999999999999998 ],
          [ 1.2246467991473532e-16, -1 ],
          [ -0.8660254037844385, -0.5000000000000004 ],
          [ -0.866025403784439, 0.49999999999999933 ],
     ]) points.push ({ x: p[0] * r, y: p[1] * r })

     return new fabric.Polygon ( points, {
          ... fabric_base_obtions,
          ... opt,
          angle: 90,
     })
}

export function text ( def: $TextDefinition, size: number, opt: fabric.TextOptions )
{
     return new fabric.Text ( "...", {
          ... fabric_base_obtions,
          ... opt,
          fontSize: size,
     })
}

export function textbox ( def: $TextDefinition, size: number, opt: fabric.TextOptions )
{
     return new fabric.Textbox ( "...", {
          ... fabric_base_obtions,
          ... opt,
          fontSize: size,
     })
}

export function path ( def: $PathDefinition, size: number, opt: fabric.IObjectOptions )
{
     return new fabric.Path ( def.path,
     {
          ... fabric_base_obtions,
          ... opt,
          scaleX: size / 100, // En supposant que le viewBox
          scaleY: size / 100, // est "0 0 100 100"
     })
}

const Factory = {
     group,
     circle,
     triangle,
     square,
     pantagon,
     hexagon ,
     text,
     textbox ,
     path,
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
