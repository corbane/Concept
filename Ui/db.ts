/// <reference path="../Data/index.ts" />

import { Factory, Database } from "../Data/index.js"
import { Component } from "./Base/Component/index.js"

const CONTEXT = "concept-ui"
const db      = new Database <$AnyComponents> ()
const factory = new Factory <Component, $AnyComponents> ( db )

export const inStock: typeof factory.inStock = function ()
{
     const arg = arguments.length == 1
               ? normalize ( arguments [0] )
               : normalize ( [... arguments] )

     const path = factory.getPath ( arg )

     return factory._inStock ( path )
}

export const pick: typeof factory.pick = function ( ... rest: any [] )
{
     const arg = arguments.length == 1
               ? normalize ( arguments [0] )
               : normalize ( [... arguments] )

     const path = factory.getPath ( arg )

     return factory._pick ( path )
}

export const make: typeof factory.make = function ()
{
     const arg = arguments.length == 1
               ? normalize ( arguments [0] )
               : normalize ( [... arguments] )

     const path = factory.getPath ( arg )

     if ( isNode ( arg ) )
          var data = arg

     return factory._make ( path, data )
}

export const set: typeof db.set = function ()
{
     const arg = normalize ( arguments [0] )

     if ( arguments.length == 1 )
          db.set ( arg )
     else
          db.set ( arg, normalize ( arguments [1] ) )
}

export const define: typeof factory.define = function ( ctor: any, ... rest: any )
{
     const arg = rest.length == 1
               ? normalize ( rest [0] )
               : normalize ( [... rest] )

     const path = factory.getPath ( arg )

     factory._define ( ctor, path )
}


function isNode ( obl: any )
{
     return typeof obl == "object" && ! Array.isArray (obl)
}

function normalize ( arg: any )
{
     if ( Array.isArray (arg) )
     {
          if ( arg [0] !== CONTEXT )
               arg.unshift ( CONTEXT )
     }
     else if ( typeof arg == "object" )
     {
          if ( "context" in arg )
          {
               if ( arg.context !== CONTEXT )
                    throw "Bad context value"
          }
          else
          {
               (arg as any).context = CONTEXT
          }
     }

     return arg
}
