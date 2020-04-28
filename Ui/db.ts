// <reference path="../Data/index.ts" />

declare global
{
     const CONTEXT_UI: "concept-ui"
}
Object.defineProperty ( globalThis, "CONTEXT_UI", {
     enumerable: false,
     configurable: false,
     writable: false,
     value: "concept-ui"
} )

import { Factory, Database } from "../Data/index.js"
import { Component } from "./Component/index.js"

//const CONTEXT_UI = "concept-ui"
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

export const define = factory.define.bind ( factory ) as typeof factory.define
//export const define: typeof factory.define = function ( ctor: any, ... rest: any )
//{
//     const arg = rest.length == 1
//               ? normalize ( rest [0] )
//               : normalize ( [... rest] )
//
//     const path = factory.getPath ( arg )
//
//     factory._define ( ctor, path )
//}


function isNode ( obl: any )
{
     return typeof obl == "object" && ! Array.isArray (obl)
}

function normalize ( arg: any )
{
     if ( Array.isArray (arg) )
     {
          if ( arg [0] !== CONTEXT_UI )
               arg.unshift ( CONTEXT_UI )
     }
     else if ( typeof arg == "object" )
     {
          if ( "context" in arg )
          {
               if ( arg.context !== CONTEXT_UI )
                    throw "Bad context value"
          }
          else
          {
               (arg as any).context = CONTEXT_UI
          }
     }

     return arg
}
