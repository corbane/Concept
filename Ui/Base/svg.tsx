
import { xnode } from "./xnode"

export type ShapeNames = keyof ShapeDefinitions

export interface ShapeDefinitions
{
     circle   : ObjectDefinition,
     triangle : ObjectDefinition,
     square   : ObjectDefinition,
     pantagon : ObjectDefinition,
     hexagon  : ObjectDefinition,
     text     : TextDefinition,
     textbox  : TextDefinition,
     path     : PathDefinition,
}

export interface ObjectDefinition
{
     size: number,
     x?  : number,
     y?  : number
}

export interface TextDefinition extends ObjectDefinition
{
     text: string
}

export interface PathDefinition extends ObjectDefinition
{
     path: string
}

export function createSvgShape <T extends ShapeNames> (
     type: T,
     def : ShapeDefinitions [T],
): ReturnType <typeof SvgFactory [T]>

export function createSvgShape ( type: ShapeNames, def: any )
{
     switch ( type )
     {
     case "circle"  : return SvgFactory.circle   ( def )
     case "triangle": return SvgFactory.triangle ( def )
     case "square"  : return SvgFactory.square   ( def )
     case "pantagon": return SvgFactory.pantagon ( def )
     case "hexagon" : return SvgFactory.hexagon  ( def )
     case "square"  : return SvgFactory.square   ( def )
     case "text"    : return SvgFactory.text     ( def )
     case "textbox" : return SvgFactory.textbox  ( def )
     case "path"    : return SvgFactory.path     ( def )
     }
}

class SvgFactory
{
     // To get triangle, square, [panta|hexa]gon points
     //
     // var a = Math.PI*2/4
     // for ( var i = 0 ; i != 4 ; i++ )
     //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )

     static circle ( def: ObjectDefinition )
     {
          const node = <circle
               cx = { def.x || 0 }
               cy = { def.y || 0 }
               r  = { def.size / 2 }
          />

          return node
     }

     static triangle ( def: ObjectDefinition )
     {
     }


     static square ( def: ObjectDefinition )
     {
     }

     static pantagon ( def: ObjectDefinition )
     {
     }

     static hexagon ( def: ObjectDefinition )
     {
     }


     static text ( def: TextDefinition )
     {
     }

     static textbox ( def: TextDefinition )
     {
     }


     static path ( def: PathDefinition )
     {
     }
}
