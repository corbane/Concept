
import { Optional, Require } from "../Lib/typing.js"
import { DataTree } from "./data-tree.js"


type Ref <N extends $Node> = Require <Partial <N>, "context" | "type" | "id">

type D <N extends $Node> = Optional <N, "context" | "type" | "id">


export class Database <N extends $Node = $Node> extends DataTree <N>
{
     has ( node: Ref <N> )      : boolean
     has ( ... path: string [] ): boolean
     has (): boolean
     {
          if ( arguments.length == 0 )
               return

          if ( arguments.length == 1 )
          {
               const o: N = arguments [0]
               return super.near ( [o.context, o.type, o.id] ) !== undefined
          }
          else
          {
               return super.near ( arguments ) !== undefined
          }
     }

     count ( node: Ref <N> )      : number
     count ( ... path: string [] ): number
     count (): number
     {
          if ( arguments.length == 0 )
               return

          if ( arguments.length == 1 )
          {
               const o: N = arguments [0]
               return super.count ( [o.context, o.type, o.id] )
          }
          else
          {
               return super.count ( arguments )
          }
     }

     set <$ extends N> ( node: $ )                     : $
     set <$ extends N> ( path: string [], data: D <$> ): $
     set (): N
     {
          if ( arguments.length == 0 )
               return

          if ( arguments.length == 1 )
          {
               const o: N = arguments [0]
               return super.set ( [o.context, o.type, o.id], o )
          }
          else
          {
               return super.set ( arguments [0], arguments [1] )
          }
     }

     get <$ extends N> ( node: Ref <$Node> )  : $
     get <$ extends N> ( ... path: string [] ): $
     get (): N
     {
          if ( arguments.length == 0 )
               return

          const result = {} as N

          if ( arguments.length == 1 )
          {
               const o: $Node = arguments [0]
               super.walk ( [o.context, o.type, o.id], data => {
                    Object.assign ( result, data )
               })
               return Object.assign ( result, o )
          }
          else
          {
               super.walk ( arguments, data => {
                    Object.assign ( result, data )
               })

               return Object.assign ( result, {
                    context: arguments [0],
                    type   : arguments [1],
                    id     : arguments [2],
               })
          }
     }
}
