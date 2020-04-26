
//import * as fabric from "fabric/fabric-impl.js"

import { $Geometry } from "./geometry.js"

export interface TextDefinition extends $Geometry
{
     text: string
}

export interface PathDefinition extends $Geometry
{
     path: string
}

const fabric_base_obtions: fabric.IObjectOptions = {
     left   : 0,
     top    : 0,
     originX: "center",
     originY: "center",
}

export const Factory =
{
     group ( def: $Geometry, size: number, opt: fabric.ICircleOptions )
     {
          return new fabric.Group ( undefined,
          {
               ... fabric_base_obtions,
               ... opt,
               width: size,
               height: size,
          })
     },

     // To get points of triangle, square, [panta|hexa]gon
     //
     // var a = Math.PI*2/4
     // for ( var i = 0 ; i != 4 ; i++ )
     //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )

     circle ( def: $Geometry, size: number, opt: fabric.ICircleOptions )
     {

          return new fabric.Circle (
          {
               ... fabric_base_obtions,
               ... opt,
               radius: size / 2,
          })
     },

     triangle ( def: $Geometry, size: number, opt: fabric.ITriangleOptions )
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
     },


     square ( def: $Geometry, size: number, opt: fabric.IRectOptions )
     {
          const scale = 0.9
          return new fabric.Rect (
          {
               ... fabric_base_obtions,
               ... opt,
               width : size * scale,
               height: size * scale,
          })
     },

     pantagon ( def: $Geometry, size: number, opt: fabric.IObjectOptions )
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
     },

     hexagon ( def: $Geometry, size: number, opt: fabric.IObjectOptions )
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
     },


     text ( def: TextDefinition, size: number, opt: fabric.TextOptions )
     {
          return new fabric.Text ( "...", {
               ... fabric_base_obtions,
               ... opt,
               fontSize: size,
          })
     },

     textbox ( def: TextDefinition, size: number, opt: fabric.TextOptions )
     {
          return new fabric.Textbox ( "...", {
               ... fabric_base_obtions,
               ... opt,
               fontSize: size,
          })
     },


     path ( def: PathDefinition, size: number, opt: fabric.IObjectOptions )
     {
          return new fabric.Path ( def.path,
          {
               ... fabric_base_obtions,
               ... opt,
               scaleX: size / 100, // En supposant que le viewBox
               scaleY: size / 100, // est "0 0 100 100"
          })
     },
}


