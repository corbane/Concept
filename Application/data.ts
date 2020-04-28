/// <reference path="./nodes.d.ts" />

import { Database } from "../Data/index"
import { Optional } from "../Lib/index"


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


type $InputNode = Optional <$Thing, "context" | "type">
type $OutputNode <In extends $InputNode> = Required <In>


const db = new Database ()


export function node <T extends $InputNode> ( type: string, id: string )    : $OutputNode <T>
export function node <T extends $InputNode> ( type: string, description: T ): $OutputNode <T>
export function node <T extends $Thing>     ( description: T )              : $Thing

export function node ( a: string | $InputNode, b?: string | $InputNode ) : $Thing
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

