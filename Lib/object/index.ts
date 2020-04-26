
export * from "./configurable.js"
export * from "./observable.js"

export function deepAssign <T1, T2> ( obj1: T1, obj2: T2 ): T1 & T2
{
     type K = keyof T1

     const isArray = Array.isArray
     const descriptors = Object.getOwnPropertyDescriptors ( obj2 )

     for ( const name in descriptors )
     {
          const prop = descriptors [name]

          if ( prop.enumerable === false )
               continue

          const value = prop.value

          if ( value === null || isArray (value) || typeof prop.value !== "object" )
               obj1 [name as K] = value
          else
               deepAssign ( obj1 [name as K] || (obj1 [name as K] = {} as T1[K]), value )
     }

     return obj1 as T1 & T2
}

export function assignOwnProperties <T> ( a: T, b: any ): T
{
     for ( let p in a )
          a [p] = b.hasOwnProperty ( p ) ? b [p] : a [p]

     return a
}

export function copy <T> ( o: T ): T
{
     return Object.assign ( {}, o )
}

export function deepCopy <T> ( obj: T ): T
{
     // https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
     // https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/10916838#10916838
     return JSON.parse ( JSON.stringify ( obj ) )
}

