// https://github.com/AntonLapshin/proxy-observable


     export type Observable <T extends object = object> = T & {
          on   <V> ( e: keyof T, fn: Callback <V> ): Callback <V>
          once <V> ( e: keyof T, fn: Callback <V> ): Callback <V>
          off ( fn: Callback ): true
     }
     type Callback <T = any> = ( value: T, previous: T, property?: number | string | symbol ) => void

     export class ObservableEmitter <T = any>
     {
          fns: Record <keyof T | "*", Callback []>

          constructor ()
          {
               this.fns = { "*": [] } as any
          }

          has ( e: keyof T | "*" )
          {
               return (this.fns [e] !== undefined && this.fns [e].length > 0)
                    || this.fns ["*"].length > 0
          }

          on ( e: keyof T | "*", fn: Callback )
          {
               if ( this.fns [e] === undefined )
                    this.fns [e] = []

               this.fns [e].push ( fn )

               return fn
          }

          fire ( e: keyof T | "*", value: any, prev?: any )
          {
               this.fns ["*"]
                   .concat ( this.fns [e] !== undefined ? this.fns [e] : [] )
                   .forEach ( fn => fn ( value, prev, e ) )

               return this
          }

          off ( fn: Callback )
          {
               for ( const e in this.fns )
               {
                    const fns = this.fns [e as keyof T]
                    for ( let i = 0; i < fns.length; i++ )
                    {
                         if ( fns [i] === fn )
                         {
                              fns.splice ( i, 1 )
                              return true
                         }
                    }
               }

               return false
          }

          once ( e: keyof T | "*", fn: Callback )
          {
               const cb = ( value: any, prev: any, prop: string ) =>
               {
                    fn ( value, prev, prop )
                    this.off( cb )
               }

               this.on ( e, cb )

               return fn
          }
     }

     /**
      * Creates a proxy observable for an object or array
      *
      * @param target Input Object
      * @returns Observable (ES6 Proxy)
      */
     export function observable <T extends object> ( target: T ) : Observable <T>
     export function observable ( target: any )
     {
          if ( (target as any).on && (target as any).off )
               return target

          const pub = new ObservableEmitter ()

          const observable = new Proxy ( target,
          {
               get: ( target, prop ) =>
               {
                    if ( prop in target )
                    {
                         if ( Array.isArray ( target ) )
                         {
                              let v = observable

                              if ( prop === "pop" )
                                   v = target [target.length - 1]
                              else if ( prop === "shift" )
                                   v = target [0]

                              if ( prop !== "push" && prop !== "length" )
                                   pub.fire ( prop, v )
                         }
                         return target [prop]
                    }

                    switch ( prop )
                    {
                    case "on"  : return pub.on.bind ( pub )
                    case "once": return pub.once.bind ( pub )
                    case "off" : return pub.off.bind ( pub )
                    }

                    return undefined
               },

               set: ( target, prop, v ) =>
               {
                    if ( target.constructor === Array )
                    {
                         if ( prop !== "length" )
                              pub.fire ( "change", v )
                    }
                    else if ( pub.has ( prop ) )
                    {
                         pub.fire ( prop, v, target [prop] )
                    }

                    target [prop] = v

                    return true
               }
          })

          return observable
     }

