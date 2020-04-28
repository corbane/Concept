// <reference path="../Application/nodes.d.ts" />

import { Database } from "@data"
import { Optional } from "@lib"


declare global
{
     const CONTEXT_DATA: "concept-data"
     // function node <T extends $InputNode> ( type: string, id: string )    : $OutputNode <T>
     // function node <T extends $InputNode> ( type: string, description: T ): $OutputNode <T>
     // function node <T extends $InputNode> ( description: T )              : $OutputNode <T>
}
Object.defineProperty ( globalThis, "CONTEXT_DATA", {
     configurable: false,
     writable: false,
     value: "concept-data"
})


const db = new Database ()


type $InThing  = Optional <$Thing, "context" | "type">
type $InThing2 = Optional <$Thing, "context" | "type" | "id">
type $OutThing <In extends $InThing2> = $Thing & Required <In>

export function data <T extends $InThing> ( type: string, id: string )    : $OutThing <T>
export function data <T extends $InThing> ( type: string, description: T ): $OutThing <T>
export function data <T extends $InThing> ( description: T )              : $OutThing <T>

export function data ( a: string | $InThing, b?: string | $InThing ) : $Thing
{
     switch ( arguments.length )
     {
     case 1: // data ( description )

          if ( typeof a != "object" || a == null || Array.isArray (a) )
               throw `Bad argument "description" : ${ a }`

          b = a
          a = b.type

     case 2: // data ( type, id ) | data ( type, description )

          if ( typeof a != "string" )
               throw `Bad argument "type" : ${ a }`

          if ( typeof b == "string" )
               return db.get ( CONTEXT_DATA, a, b )

          if ( typeof b != "object" || b == null || Array.isArray (b) )
               throw `Bad argument "description" : ${ b }`

          ;(b as any).context = CONTEXT_DATA
          ;(b as any).type = a
          return db.set ( b as $Thing )

     default:
          throw `Bad arguments: 2 arguments expected but ${ arguments.length } received`
     }
}

export function alias <T extends $Thing> ( fn: Function, type: string )
{
     switch ( fn.name )
     {
     case "data": return create <T> ( CONTEXT_DATA, type )
     }
}

function create <T extends $Thing> ( context: string, type: string )
{
     // fn ( id )
     // fn ( description )
     // fn ( id, description )
     return (( id: string | T, description?: T ) : T =>
     {
          if ( arguments.length == 1 )
          {
               if ( typeof id != "string" )
                    throw `Bag id: ${ id }`

               return db.get <T> ( context, type, id )
          }

          if ( typeof id != "string" )
          {
               description = id

               if ( typeof description.id != "string" )
                    throw `Bag argument "description": invalid id`

               id = description.id
          }

          if ( typeof description != "object" || description == null || isArray (description) )
               throw `Bag argument "description" : id not found`

          return db.set <T>  ({ ... description, context, type,  id: id })
     }) as
     {
          ( id: string ): T
          ( description: Optional <T, "context" | "type"> ): T
          ( id: string, description: Optional <T, "context" | "type" | "id"> ): T
     }
}

const isArray = Array.isArray
