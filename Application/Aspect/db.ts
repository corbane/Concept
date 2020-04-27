// <reference path="../typings.d.ts" />
//import * as fabric from "fabric/fabric-impl"

import { Database, Factory } from "../../Data/index.js"
import { Shape } from "./Element/shape.js"
import { Writable, Optional } from "../../Lib/index.js"


const CONTEXT = "concept-aspect"
const db      = new Database ()
const factory = new Factory <Shape> ( db )
const ASPECT  = Symbol.for ( "ASPECT" )

// svgFactory
// htmlFactory
// fabricFactory

// ui.factory.set ( ["concept-ui", "button", "html"  , "btn1"], ctor )
// ui.factory.set ( ["concept-ui", "button", "svg"   , "btn1"], ctor )
// ui.factory.set ( ["concept-ui", "button", "fabric", "btn1"], ctor )

type $In <$ extends $Shape = $Shape> = Optional <$, "context">

/**
 * Assigne si besoin le contexte "aspect" au noeud
 */
function normalize ( node: $In )
{
     if ( "context" in node )
     {
          if ( node.context !== CONTEXT )
               throw "Bad context value"
     }
     else
     {
          (node as Writable <$Shape>).context = CONTEXT
     }

     return node as $Shape
}


export function getAspect <T extends Shape> ( obj: $Node | Shape | fabric.Object ): T | undefined
{
     if ( obj == undefined )
          return undefined

     if ( obj instanceof Shape )
          return obj as T

     if ( obj instanceof fabric.Object )
          return obj [ASPECT]

     if ( factory.inStock ( CONTEXT, obj.type, obj.id ) )
          return factory.make ( CONTEXT, obj.type, obj.id )

     const options  = obj.context == CONTEXT
                    ? obj as $Shape
                    : {
                         context: CONTEXT,
                         type   : obj.type,
                         id     : obj.id,
                         data   : obj,
                    } as $Shape

     if ( ! isFinite (options.x) )
          options.x = 0

     if ( ! isFinite (options.y) )
          options.y = 0

     const shape = factory.make ( options )

     // shape.events = arguments.events
     // Object.assign ( shape, events )

     //shape.init ()
     shape.group [ASPECT] = shape

     if ( shape.config.onCreate )
          shape.config.onCreate ( shape.config.data, shape )

     return shape as T
}


export function setAspect <$ extends $Shape> ( node: $In <$> )
{
     db.set ( normalize ( node ) )
}


export function defineAspect ( ctor: new ( data: $Shape ) => Shape, type: string )
{
     factory._define ( ctor, [CONTEXT, type] )
}
