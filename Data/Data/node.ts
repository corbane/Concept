
// https://github.com/rdfjs-base/data-model/tree/master/lib

declare global
{
     interface $Node
     {
          readonly context: string
          readonly type: string
          readonly id: string
     }

     interface $Cluster extends $Node
     {
          children?: $Node []
     }
}

var nextId = 0

export function createNode <D extends $Node = $Node, T extends string = D ["type"]> ( type: T, id: string, data: Partial <Omit <D, "type" | "id">> )
{
     type N = { -readonly [K in keyof D]: D[K] }

     ;(data as N).type = type
     ;(data as N).id   = id || (++nextId).toString ()
     return data as D
}

export function getUId ( node: $Node )
{
     return node.context + '#' + node.type + ':' + node.id
}

export function equalNodes ( a: $Node, b: $Node )
{
     return !!a && !!b
          && a.type === b.type
          && a.id   === b.id
}

/*export class Node <D extends $Node = $Node, T extends string = D ["type"]>
{
     static nextId = 0

     readonly type: string

     readonly id: string

     readonly uid: number

     readonly data: D

     defaultData (): $Node
     {
          return {
               context: "",
               type   : "node",
               id     : undefined,
          }
     }

     constructor ( data: D )
     {
          this.type = data.type
          this.uid  = ++Node.nextId
          this.id   = data.id || (data.id = this.uid.toString ())

          this.data = Object.assign ( this.defaultData (), data as D )
     }

     equals ( other: Node <any> )
     {
          return !!other
               && other.type === this.type
               && other.id   === this.id
     }

     toJson ()
     {
          return JSON.stringify ( this.data )
     }
}*/
