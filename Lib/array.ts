


     type GetKeyFunction <T, K> = ( item: T ) => K
     type CompareFunction <T> = ( object: T, other: T ) => number

     export interface KeyedStack <T, K>
     {
          items    : T []
          includes ( item: T )    : boolean
          add      ( items: T[] ) : this
          remove   ( items: T[] ) : this
          clear    ()             : this
          indexOf  ( key: K )     : number
          get      ( key: K )     : T | undefined
          search   ( item: T, comparator: CompareFunction <K> ): T | undefined
     }

     export function binaryKeyedStack <T, K> ( getKey: GetKeyFunction <T, K>, compareKey?: CompareFunction <K> )
     {
          const keys = [] as K []
          const arr  = [] as T []


          const self: KeyedStack <T, K> = typeof compareKey == "function"
               ? {
                    items   : arr,
                    includes: includes_c,
                    add     : add_c,
                    remove  : remove_c,
                    clear,
                    indexOf: indexOf_c,
                    get    : get_c,
                    search,
               }
               : {
                    items: arr,
                    includes,
                    add,
                    remove,
                    clear,
                    indexOf,
                    get,
                    search
               }

          return self

          function add_c ( items: T [] )
          {
               for ( const item of items )
               {
                    const key = (getKey as GetKeyFunction <T, K>) ( item )
                    const index = indexOf_c ( key )

                    if ( index < 0 )
                    {
                         keys.splice ( ~index, 0, key )
                         arr.splice  ( ~index, 0, item )
                    }
               }

               return self
          }

          function add ( items: T [] )
          {
               for ( const item of items )
               {
                    const key = (getKey as GetKeyFunction <T, K>) ( item )
                    const index = indexOf ( key )

                    if ( index < 0 )
                    {
                         arr.splice  ( ~index, 0, item )
                         keys.splice ( ~index, 0, key )
                    }
               }

               return self
          }

          function remove_c ( items: T [] )
          {
               for ( const item of items )
               {
                    const key = (getKey as GetKeyFunction <T, K>) ( item )
                    const index = indexOf_c ( key )

                    if ( index > -1 )
                    {
                         keys.splice ( index, 1 )
                         arr.splice  ( index, 1 )
                    }
               }

               return self
          }

          function remove ( items: T [] )
          {
               for ( const item of items )
               {
                    const key = (getKey as GetKeyFunction <T, K>) ( item )
                    const index = indexOf ( key )

                    if ( index > -1 )
                    {
                         keys.splice ( index, 1 )
                         arr.splice  ( index, 1 )
                    }
               }

               return self
          }

          function clear ()
          {
               keys.splice (0)
               arr.splice  (0)

               return self
          }

          function includes_c ( item: T )
          {
               return indexOf_c ( getKey ( item ) ) != -1
          }

          function includes ( item: T )
          {
               return indexOf ( getKey ( item ) ) != -1
          }

          function indexOf_c ( key: K )
          {
               const floor = Math.floor

               var mid = 0
               var end = keys.length

               while ( mid <= end )
               {
                    mid = floor ( (mid + end) / 2 )
                    const equal = compareKey ( key, keys [mid] )

                    if ( equal == 0 )
                         return mid

                    if ( equal < 0 )
                         mid++
                    else
                         end = mid - 1
               }

               return ~mid
          }

          function indexOf ( key: K )
          {
               const floor = Math.floor

               var mid = 0
               var end = keys.length

               while ( mid <= end )
               {
                    mid = floor ( (mid + end) / 2 )
                    const cur = keys [mid]

                    if ( cur == key )
                         return mid

                    if ( cur < key )
                         mid++
                    else
                         end = mid - 1
               }

               return ~mid
          }

          function search ( item: T, comparator: CompareFunction <K> )
          {
               const floor   = Math.floor
               const key     = getKey ( item )

               var mid = 0
               var end = keys.length

               while ( mid <= end )
               {
                    mid = floor ( (mid + end) / 2 )
                    const equal = comparator ( key, keys [mid] )

                    if ( equal == 0 )
                         return arr [mid]

                    if ( equal < 0 )
                         mid++
                    else
                         end = mid - 1
               }

               return undefined
          }

          function get_c ( key: K )
          {
               const index = indexOf_c ( key )
               return index < 0 ? undefined : arr [index]
          }

          function get ( key: K )
          {
               const index = indexOf ( key )
               return index < 0 ? undefined : arr [index]
          }
     }

     export function binaryStack <T> ( compare?: CompareFunction <T> )
     {
          const arr  = [] as T []

          if ( compare ) return {
               items : arr,
               add   : add_c,
               remove: remove_c,
               clear,
               indexOf: index_c,
          }
          else return {
               items: arr,
               add,
               remove,
               clear,
               indexOf,
          }

          function add_c ( items: T [] )
          {
               for ( const item of items )
               {
                    const index = index_c ( item )

                    if ( index < 0 )
                         arr.splice ( ~index, 0, item )
               }
          }

          function add ( items: T [] )
          {
               for ( const item of items )
               {
                    const index = indexOf ( item )

                    if ( index < 0 )
                         arr.splice ( ~index, 0, item )
               }
          }

          function remove_c ( items: T [] )
          {
               for ( const item of items )
               {
                    const index = index_c ( item )

                    if ( index > -1 )
                         arr.splice ( index, 1 )
               }
          }

          function remove ( items: T [] )
          {
               for ( const item of items )
               {
                    const index = indexOf ( item )

                    if ( index > -1 )
                         arr.splice ( index, 1 )
               }
          }

          function clear ()
          {
               arr.splice (0)
          }

          function index_c ( item: T )
          {
               const floor = Math.floor

               var mid = 0
               var end = arr.length

               while ( mid <= end )
               {
                    mid = floor ( (mid + end) / 2 )
                    var equal = compare ( item, arr [mid] )

                    if ( equal == 0 )
                         return mid

                    if ( equal < 0 )
                         mid++
                    else
                         end = mid - 1
               }

               return ~mid
          }

          function indexOf ( item: T )
          {
               const floor = Math.floor

               var mid = 0
               var end = arr.length

               while ( mid <= end )
               {
                    mid = floor ( (mid + end) / 2 )
                    var cur = arr [mid]

                    if ( cur == item )
                         return mid

                    if ( cur < item )
                         mid++
                    else
                         end = mid - 1
               }

               return ~mid
          }
     }

