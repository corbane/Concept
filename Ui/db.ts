
import { Factory, Database } from "../Data/index.js"
import { Component } from "./Elements/component.js"

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

const db      = new Database <$AnyComponents> ()
const factory = new Factory <Component, $AnyComponents> ( db )

const inStock: typeof factory.inStock = function ()
{
     const arg = arguments.length == 1
               ? normalize ( arguments [0] )
               : normalize ( [... arguments] )

     const path = factory.getPath ( arg )

     return factory._inStock ( path )
}

const pick: typeof factory.pick = function ( ... rest: any [] )
{
     const arg = arguments.length == 1
               ? normalize ( arguments [0] )
               : normalize ( [... arguments] )

     const path = factory.getPath ( arg )

     return factory._pick ( path )
}

const make: typeof factory.make = function ()
{
     const arg = arguments.length == 1
               ? normalize ( arguments [0] )
               : normalize ( [... arguments] )

     const path = factory.getPath ( arg )

     if ( isNode ( arg ) )
          var data = arg

     return factory._make ( path, data )
}

const set: typeof db.set = function ()
{
     const arg = normalize ( arguments [0] )

     if ( arguments.length == 1 )
          db.set ( arg )
     else
          db.set ( arg, normalize ( arguments [1] ) )
}

const define = factory.define.bind ( factory ) as typeof factory.define

export {
     inStock,
     pick,
     make,
     set,
     define,
}


// Utilities


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
