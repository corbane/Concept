
import { Database } from "./db.js"
import { DataTree, Path } from "./data-tree.js"

import { Optional } from "../Lib/index.js"


type Item <T = any, $ extends $Node = $Node> =
{
     multiple: boolean
     instances: T []
     constructor: new ( data: $ ) => T
}

type $In <N extends $Node = $Node> = Optional <N, "context">

//export type Ctor <N extends $Node = $Node, T = any> = new ( data: N ) => T
export type Ctor <N extends $Node = $Node, T = any> = new ( data: N, children?: any [] ) => T

type Arg <F> = F extends new ( data: infer D ) => any ? D : any


export class Factory <E = any, N extends $Node = $Node>
{
     constructor ( readonly db: Database <N> ) {}

     private ctors = new DataTree <Ctor <$Node, E>> ()
     private insts =  new DataTree <E> ()


     getPath ( node: $Node )        : Path
     getPath ( path: Path )         : Path
     getPath ( ... path: string [] ): Path

     getPath ()
     {
          if ( arguments.length == 0 )
               throw new Error ( "Null argument" )

          const arg  = arguments [0]

          if ( typeof arg == "string" )
               return arguments as Path

          if ( Array.isArray ( arg) )
               return arg.flat () as Path

          return [ arg.context, arg.type, arg.id ] as Path
     }

     inStock ( node: $Node )        : boolean
     inStock ( path: Path )         : boolean
     inStock ( ... path: string [] ): boolean

     inStock (): boolean
     {
          return this.insts.has ( this.getPath ( ... arguments ) as Path )
     }
     _inStock ( path: Path )
     {
          return this.insts.has ( path )
     }

     define <F extends Ctor> ( ctor: F, node: Arg <F> )      : void
     define <F extends Ctor> ( ctor: F, path: Path )         : void
     define <F extends Ctor> ( ctor: F, ... path: string [] ): void

     define ( ctor: Ctor, ... rest: any [] )
     {
          var path = this.getPath ( ... rest )

          if ( this.ctors.has ( path ) )
               throw "Bad argument"

          return this.ctors.set ( path, ctor )
     }
     _define ( ctor: Ctor, path: Path )
     {
          if ( this.ctors.has ( path ) )
               throw "Bad argument"

          return this.ctors.set ( path, ctor )
     }

     pick <R extends E, $ extends N = N> ( node: $Node ): R
     pick <R extends E> ( ... path: string [] )         : R
     pick <R extends E> ( path: Path )                  : R

     pick (): E
     {
          var path = this.getPath ( ... arguments )

          if ( this.insts.has ( path ) )
               return this.insts.get ( path )

          throw "Bad argument"
     }
     _pick ( path: Path )
     {
          if ( this.insts.has ( path ) )
               return this.insts.get ( path )

          throw "Bad argument"
     }

     make <R extends E, $ extends N = N> ( node: $ ): R
     make <R extends E> ( path: Path )              : R
     make <R extends E> ( ... path: string [] )     : R

     make (): E
     {
          var path = this.getPath ( ... arguments )

          const arg  = arguments [0]

          if ( typeof arg == "object" && ! Array.isArray (arg) )
               return this._make ( path, arg )
          else
               return this._make ( path )
     }
     _make ( path: Path, data?: Partial <N> )
     {
          if ( this.insts.has ( path ) )
               return this.insts.get ( path )

          const ctor = this.ctors.near ( path )

          if ( ctor == undefined )
               throw "Bad argument"

          const tmp = this.db.get ( ... path )

          data = data == undefined
               ? tmp
               : Object.assign ( tmp, data )

          return this.insts.set ( path, new ctor ( data as N ) )
     }
}
