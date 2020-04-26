import * as uEvent from "../event.js"

type ConfigurableCallback <C> = ( key: keyof C, value: any, previous: any) => void
type EventNames <C> = "@new" | "@change" | "@delete" | keyof C

export interface Configurable <T, C>
{
     config: {
          ()                                          : C
          <K extends keyof C> ( key: K, )             : C [K]
          <K extends keyof C> ( key: K, value: C [K] ): void
          ( data: Partial <C> )                       : void

          get <K extends keyof C> ( key: K ): C [K]

          set <K extends keyof C> ( key: K, value: C [K] ): void
          set ( data: Partial <C> )                       : void

          on ( event: EventNames <C>, callback: ConfigurableCallback <C> ): void

          off ( event: EventNames <C>, callback: ConfigurableCallback <C> ): void
     }
}

export function configurable <T, C> ( obj: T, options: Partial <C>, defaultConfig: C )
{
     if ( typeof (obj as any).config     == "function"
          && typeof (obj as any).config.get == "function"
          && typeof (obj as any).config.on  == "function"
          && typeof (obj as any).config.off == "function" ) return obj as T & Configurable <T, C>

     const onPrp = {} as Record <keyof C, uEvent.IEvent <ConfigurableCallback <C>>>

     var onNew = uEvent.create <ConfigurableCallback <C>> ()
     var onDel = uEvent.create <ConfigurableCallback <C>> ()
     var onDif = uEvent.create <ConfigurableCallback <C>> ()

     var asNew = false
     var asDif = false
     var asDel = false

     function set ( key: keyof C, value?: C [keyof C] ): void
     {
          if ( key in options )
          {
               const old = options [key]
               options [key] = value

               if ( key in onPrp )
                    onPrp [key].dispatch ( key, value, old )

               if ( onDif )
                    onDif.dispatch ( key, value, old )
          }
          else
          {
               const old = defaultConfig [key]
               options [key] = value

               if ( key in onPrp )
                    onPrp [key].dispatch ( key, value, old )

               if ( onNew )
                    onNew.dispatch ( key, value, old )
          }
     }

     function setAll ( data: Partial <C> )
     {
          const delk = Object.keys ( options ) as (keyof C) []
          const difk = [] as (keyof C) []
          const newk = [] as (keyof C) []

          for ( const k in data )
          {
               const index = delk.indexOf ( k )

               if ( index < 0 )
               {
                    newk.push ( k )
               }
               else
               {
                    difk.push ( k )
                    delk.splice ( index, 1 )
               }
          }


          if ( asDel ) for ( const k of delk )
          {
               const old = options [k]
               const val = defaultConfig [k]

               delete options [k]

               if ( k in onPrp )
                    onPrp [k].dispatch ( k, val, old )

               onDel.dispatch ( k, val, old )
          }
          else for ( const k of delk ) if ( k in onPrp )
          {
               const old = options [k]
               const val = defaultConfig [k]

               delete options [k]

               onPrp [k].dispatch ( k, val, old )
          }


          if ( asDif ) for ( const k of difk )
          {
               const old = options [k]
               const val = data [k]

               options [k] = val

               if ( k in onPrp )
                    onPrp [k].dispatch ( k, val, old )

               onDif.dispatch ( k, val, old )
          }
          else for ( const k of difk ) if ( k in onPrp )
          {
               const old = options [k]
               const val = data [k]

               options [k] = val

               onPrp [k].dispatch ( k, val, old )
          }


          if ( asNew ) for ( const k of newk )
          {
               const old = defaultConfig [k]
               const val = data [k]

               options [k] = val

               if ( k in onPrp )
                    onPrp [k].dispatch ( k, val, old )

               onNew.dispatch ( k, val, old )
          }
          else for ( const k of newk ) if ( k in onPrp )
          {
               const old = defaultConfig [k]
               const val = data [k]

               options [k] = val

               onPrp [k].dispatch ( k, val, old )
          }
     }

     function self ( k?: keyof C | object, v?: C [keyof C] ): C | C [keyof C] | void
     {
          if ( arguments.length == 0 )
          {
               return { ... defaultConfig, ... options }
          }

          if ( arguments.length == 1 )
          {
               if ( typeof k == "string" )
                    return config.get ( k )

               setAll ( k as Partial <C> )
               return
          }

          set ( k as keyof C, v )
     }

     const config = self as Configurable <T, C> ["config"]

     config.set = ( k: keyof C | object, v?: C[keyof C] ) =>
     {
          if ( arguments.length == 1 )
               setAll ( k as Partial <C> )
          else
               set ( k as keyof C, v )
     }

     config.get = ( key ) =>
     {
          return key in options
               ? options [key]
               : defaultConfig [key]
     }

     config.on = ( event, cb ) =>
     {
          if ( event in defaultConfig )
          {
               if ( onPrp [event as keyof C] === undefined )
                    onPrp [event as keyof C] = uEvent.create ()

               onPrp [event as keyof C] ( cb )
          }
          else switch ( event )
          {
          case "@new"  :

               if ( onNew === undefined )
                    onNew = uEvent.create ()

               onNew ( cb )
               asNew = true
               break

          case "@change":

               if ( onDif === undefined )
                    onDif = uEvent.create ()

               onDif ( cb )
               asDif = true
               break

          case "@delete":

               if ( onDel === undefined )
                    onDel = uEvent.create ()

               onDel ( cb )
               asDel = true
               break

          }
     }

     config.off = ( event, cb ) =>
     {
          if ( event in defaultConfig )
          {
               const prp = onPrp [event as keyof C]

               if ( prp !== undefined )
               {
                    prp.remove ( cb )

                    if ( prp.count () == 0 )
                         delete onPrp [event as keyof C]
               }
          }
          else switch ( event )
          {
          case "@new"   :

               if ( onDel !== undefined )
               {
                    onNew.remove ( cb )
                    asNew = onNew.count () > 0
               }
               break

          case "@change":

               if ( onDel !== undefined )
               {
                    onDif.remove ( cb )
                    asDif = onDif.count () > 0
               }
               break

          case "@delete":

               if ( onDel !== undefined )
               {
                    onDel.remove ( cb )
                    asDel = onDel.count () > 0
               }
               break

          }
     }


     Object.defineProperty ( obj, "config",
     {
          value       : config,
          configurable: false,
          writable    : false,
          enumerable  : true,
     })

     return obj as T & Configurable <T, C>
}

