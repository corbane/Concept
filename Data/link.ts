
import { equalNodes, createNode } from "../Data/node.js"


type Store <N> = { [a:string]: { [b:string]: { [c:string]: N } } }

export interface $Link <D = any> extends $Node
{
     subject  : $Node
     predicate: $Node
     object   : $Node
     graph    : string,
     data     : D
}

export function link ( a: $Node, link: string, b: $Node, data: any )
{

}

export function createLink ( subject: $Node, predicate: $Node, object: $Node, graph?: string )
{
     return createNode <$Link> ( "link", undefined, {
          context: "concept-data-link",
          subject,
          predicate,
          object,
          graph: graph ? graph: "",
          data : undefined
     })
}

export function equalLinks ( a: $Link, b: $Link )
{
     return !!b && !!a
          && a.graph === b.graph
          && equalNodes ( a.subject  , b.subject )
          && equalNodes ( a.predicate, b.predicate )
          && equalNodes ( a.object   , b.object )
}

/*export class Link extends Node //<"Link">
{
     subject  : $Node
     predicate: $Node
     object   : $Node
     graph    : string

     constructor ( subject: $Node, predicate: $Node, object: $Node, data?: $Node, graph?: string )
     {
          //super ( "Link", undefined, data )
          data.type = "link"
          super ( data )
          this.subject   = subject
          this.predicate = predicate
          this.object    = object

          if (graph)
               this.graph = graph
          else
               this.graph = ""
     }

     equals ( other: Link )
     {
          return !!other
               && other.graph === this.graph
               && other.subject.equals   (this.subject)
               && other.predicate.equals (this.predicate)
               && other.object.equals    (this.object)
     }
}*/

export class TripleStore <N extends $Node = $Node>
{
     private spo = {} as Store <N>
     private sop = {} as Store <N>
     private pos = {} as Store <N>
     private osp = {} as Store <N>

     set ( link: $Link )  : void
     {
          const S = link.subject.id
          const P = link.predicate.id
          const O = link.object.id

          var a, b, c

          a = this.spo
          b = a [S] === undefined ? ( a [S] = {} ) : a [S]
          c = b [P] === undefined ? ( b [P] = {} ) : b [P]
              c [O] = link

          a = this.sop
          b = a [S] === undefined ? ( a [S] = {} ) : a [S]
          c = b [O] === undefined ? ( b [O] = {} ) : b [O]
              c [P] = link

          a = this.osp
          b = a [O] === undefined ? ( a [O] = {} ) : a [O]
          c = b [S] === undefined ? ( b [S] = {} ) : b [S]
              c [P] = link

          a = this.pos
          b = a [P] === undefined ? ( a [P] = {} ) : a [P]
          c = b [O] === undefined ? ( b [O] = {} ) : b [O]
              c [S] = link
     }

     has ( link: $Link )
     {
          const S = link.subject.id
          const P = link.predicate.id
          const O = link.object.id

          const spo = this.spo
          if ( spo === undefined )
               return false

          const po = spo [S]
          if ( po === undefined )
               return false

          const o = po [P]
          if ( o === undefined )
               return false

          const v = o [O]
          if ( v === undefined )
               return false

          return true
     }

     get ( link: $Link ): N []
     get ( subject: string, predicate: string, object: string ): N []
     get ( subject: string | $Link, predicate?: string, object?: string )
     {
          if ( typeof subject != "string" )
          {
               object    = subject.subject.id
               predicate = subject.predicate.id
               subject   = subject.object.id
          }

          if ( subject !== undefined )
          {
               if ( predicate !== undefined )
               {
                    return object !== undefined
                         ? this.match0 ( subject, predicate, object )
                         : this.match1 ( this.spo, subject, predicate )
               }
               else
               {
                    return object !== undefined
                         ? this.match1 ( this.sop, subject, object )
                         : this.match2 ( this.sop, subject )
               }
          }
          else
          {
               if ( predicate !== undefined )
               {
                    return object !== undefined
                         ? this.match1 ( this.pos, predicate, object )
                         : this.match2 ( this.pos, predicate )
               }
               else
               {
                    return object !== undefined
                         ? this.match2 ( this.osp, object )
                         : this.match3 ()
               }
          }
     }

     delete ( link: $Link )
     {
          if ( ! this.has ( link ) )
               return

          const S = link.subject.id
          const P = link.predicate.id
          const O = link.object.id

          delete this.spo [S] [P] [O]
          delete this.sop [S] [O] [P]
          delete this.osp [O] [S] [P]
          delete this.pos [P] [O] [S]
     }

     *nodes ()
     {
          const a = this.spo

          for ( const ka in a )
          {
               const b = a[ka]

               for ( const kb in b )
               {
                    const c = b [kb]

                    for ( const kc in c )
                         return yield c [kc]
               }
          }
     }

     import ( data: Store <N> )
     {
          const a = this.spo

          for ( const ka in data )
          {
               const _b = data [ka]
               const b = a [ka] == undefined ? a [ka] = {} : a [ka]

               for ( const kb in _b )
               {
                    const _c = _b [kb]
                    const c = b [kb] == undefined ? b [kb] = {} : b [kb]

                    for ( const kc in _c )
                         c [kc] = _c [kc]
               }
          }
     }

     export ()
     {
          return JSON.stringify ( this.spo )
     }

     private match0 ( subject: string, predicate: string, object: string )
     {
          const s = this.spo [subject]

          const p = s [predicate]
          if ( p === undefined ) return [] as N []

          const o = p [object]
          if ( o === undefined ) return [] as N []

          return [o] as N []
     }

     private match1 ( abc: Store <N>, A: string, B: string )
     {
          const res = [] as N []

          var a = abc [A]
          if ( a === undefined ) return res

          var b = a [B]
          if ( b === undefined ) return res

          for ( var k in b )
               res.push ( b [k] )

          return res
     }

     private match2 ( abc: Store <N>, A: string )
     {
          const res = [] as N []

          const a = abc [A]
          if ( a === undefined ) return res

          for ( const ka in a )
          {
               const b = a [ka]

               for ( const kb in b )
                    res.push ( b [kb] )
          }

          return res
     }

     private match3 ()
     {
          const res = [] as N []
          const a = this.spo

          for ( const ka in a )
          {
               const b = a[ka]

               for ( const kb in b )
               {
                    const c = b [kb]

                    for ( const kc in c )
                         res.push ( c [kc] )
               }
          }

          return res
     }
}
