
export type Path = {
     length: number
     [Symbol.iterator](): IterableIterator<string>
}

export class DataTree <T>
{
     records = {} as {
          [context: string]: T | {
               [type: string]: T | {
                    [id: string]: T
               }
          }
     }

     has ( path: Path )  : boolean
     {
          var   rec  = this.records as any
          var count = 0

          for ( const k of path )
          {
               count ++

               if ( k in rec )
               {
                    if ( k === undefined )
                         break

                    rec = rec [k]
               }
               else
               {
                    return false
               }
          }

          return path.length == count
     }

     count ( path: Path )
     {
          var  rec = this.records as any

          for ( const k of path )
          {
               if ( k === undefined )
                    break

               if ( k in rec )
                    rec = rec [k]
               else
                    return 0
          }

          //@ts-ignore
          return undefined in rec
               ? Object.keys ( rec ).length - 1
               : Object.keys ( rec ).length

     }

     set ( path: Path, data: T ): T
     {
          const und = undefined
          var   rec  = this.records as any

          for ( const k of path )
          {
               if ( k === undefined )
                    break

               if ( k in rec )
                    rec = rec [k]
               else
                    rec = rec [k] = {}
          }

          return rec [und] = data
     }

     get ( path: Path ): T
     {
          const und = undefined
          var   rec  = this.records as any

          for ( const k of path )
          {
               if ( k === undefined )
                    break

               if ( k in rec )
                    rec = rec [k]
               else
                    break
          }

          return rec [und]
     }

     near ( path: Path ): T
     {
          var rec = this.records as any
          const und = undefined

          for ( const k of path )
          {
               if ( k === undefined )
                    break

               if ( k in rec )
                    rec = rec [k]
               else
                    break
          }

          return rec [und]
     }

     walk ( path: Path, cb: ( data: T ) => void )
     {
          var   rec  = this.records as any
          const und  = undefined

          for ( const k of path )
          {
               if ( und in rec )
                    cb ( rec [und] )

               if ( k === undefined )
                    break

               if ( k in rec )
                    rec = rec [k]
               else
                    break
          }

          if ( und in rec )
               cb ( rec [und] )

          return
     }
}
