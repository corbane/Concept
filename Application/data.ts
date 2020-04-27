/// <reference path="./nodes.d.ts" />

import { Database } from "../Data/index.js"
import { Writable, Optional } from "../Lib/index.js"

const CONTEXT = "concept-data"
const Data = new Database ()

type $In <$ extends $Thing = $Thing> = Optional <$, "context">

function normalize ( node: $In )
{
     if ( "context" in node )
     {
          if ( node.context !== CONTEXT )
               throw "Bad context value"
     }
     else
     {
          (node as Writable <$Node>).context = CONTEXT
     }

     return node as $Node
}



export function getNode <$ extends $Thing> ( node: $In ): $
export function getNode <$ extends $Thing> ( ... path: string [] ): $
export function getNode ()
{
     if ( arguments.length == 0 )
          return

     if ( arguments.length == 1 )
          return Data.get ( normalize ( arguments [0] ) )
     else
          return Data.get ( CONTEXT, ... arguments )
}

export function setNode <$ extends $Thing> ( node: $In <$> )
{
     Data.set ( normalize ( node ) )
}


export function countData ( type: string )
{
     return Data.count ( "concept-data", type )
}
