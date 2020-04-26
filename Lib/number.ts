
const { min, max } = Math

export function limitedValues ( min: number [], max: number [] )
{
     if ( min.length < max.length )
          max = max.slice ( 0, min.length )
     else
          min = min.slice ( 0, max.length  )

     const count = min.length
     const ranges = [] as number []

     for ( var i = 0 ; i != count ; i++ )
          ranges.push ( max [i] - min [i] )

     return ( nums: number ) =>
     {
          const result = [] as number []

          for ( var i = 0 ; i != count ; i++ )
               result.push ( min [i] + ranges [i] * nums )

          return result
     }
}

export function clamp  ( value: number, start: number, end: number ): number
{
     return min ( max( value, start ), end )
}


declare module global
{
     export interface NumberConstructor
     {
          wrapStringValue (
               value     : number | string | (number | string) [],
               decompose?: ( value: string ) => { numbers: number [], recompose: () => string },
               minValue? : number | string | (number | string) [] | null,
               maxValue? : number | string | (number | string) [] | null,
               onUpdate? : () => void
          ): WrappedStringNumber

          decomposeStringValue ( value: string ): {
               strings: string [],
               numbers: number [],
               recompose: () => string
          }
     }
}


interface WrappedStringNumber // extends MultipleLimitedValue
{
     numbers: number [],
     set ( values: number | string | (number | string) [] ): this,
     limit ( min?: number | string | (number | string) [], max?: number | string | (number | string) [] ): this,
     factor ( factors: number | number [] ): this,
     reset (): this,
     toString (): string,
}

module NumberLib
{
     export interface LimitedValue
     {
          set ( value: number ): this
          limit ( min?: number, max?: number ): this
          factor ( value: number ): this
     }

     export function limitedValue ( value: number, min?: number, max?: number )
     {
          var iclamp = 0

          const self: LimitedValue = {
               limit,
               set,
               factor,
          }

          limit ( min, max )

          return self

          function limit ( minValue?: number, maxValue?: number )
          {
               min = minValue
               max = maxValue

               const clampStart = Number.isFinite ( min )
               const clampEnd   = Number.isFinite ( max )

               iclamp = clampStart && clampEnd ? 1
                      : clampStart             ? 2
                      : clampEnd               ? 3
                      : 0

               return self
          }

          function set ( newValue: number )
          {
               value = newValue

               switch ( iclamp )
               {
               case 1:
                    if ( value < min )
                         value = min
                    else if ( value > max )
                         value = max
                    break
               case 2:
                    if ( value < min )
                         value = min
                    break
               case 3:
                    if ( value > max )
                         value = max
                    break
               }

               return self
          }

          function factor ( num: number )
          {
               value = min + ( max - min ) * num

               return self
          }
     }

     export interface MultipleLimitedValues extends LimitedValue
     {
          set ( values: number | number [] ): this
          limit ( min?: number | number [], max?: number | number [] ): this
          factor ( values: number | number [] ): this
     }

     export function multipleLimitedValues ( values: number [], min?: number [], max?: number [] )
     {
          const ranges = [] as number []

          var iclamp = 0

          const self: MultipleLimitedValues = {
               limit,
               set,
               factor
          }

          limit ( min, max )

          return self

          function limit ( minValues?: number | number [], maxValues?: number | number [] )
          {
               if ( typeof minValues == "number" )
                    minValues = [minValues]

               if ( typeof maxValues == "number" )
                    maxValues = [maxValues]

               const minCount = minValues.length
               const maxCount = maxValues.length
               const count    = values.length

               min = []
               max = []

               for ( var i = 0 ; i < count ; i++ )
               {
                    if ( i < minCount && Number.isFinite ( minValues [i] ) )
                         min [i] = minValues [i]
                    else
                         min [i] = 0
               }

               for ( var i = 0 ; i < count ; i++ )
               {
                    if ( i < maxCount && Number.isFinite ( maxValues [i] ) )
                         max [i] = maxValues [i]
                    else
                         max [i] = values [i] // || min [i]
               }

               // clamp

               const clampStart = minCount != 0
               const clampEnd   = maxCount != 0

               iclamp = clampStart && clampEnd ? 1
                      : clampStart             ? 2
                      : clampEnd               ? 3
                      : 0

               // range

               ranges.splice (0)

               if ( clampStart && clampEnd )
               {
                    for ( var i = 0 ; i != count ; i++ )
                         ranges.push ( max [i] - min [i] )
               }

               // update

               set ( values )

               return self
          }

          function set ( newValues: number | number [] )
          {
               if ( typeof newValues == "number" )
                    newValues = [newValues]

               const count = values.length < newValues.length ? values.length : newValues.length

               for ( var i = 0 ; i != count ; i++ )
                    values [i] = newValues [i]

               switch ( iclamp )
               {
               case 0:

                    for ( var i = 0 ; i != count ; i++ )
                         values [i] = newValues [i]
                    break

               case 1:

                    for ( var i = 0 ; i != count ; i++ )
                    {
                         const n = newValues [i]
                         values [i] = n < min [i] ? min [i]
                                    : n > max [i] ? max [i]
                                    : n
                    }
                    break

               case 2:

                    for ( var i = 0 ; i != count ; i++ )
                    {
                         const n = newValues [i]
                         values [i] = n < min [i] ? min [i] : n
                    }
                    break

               case 3:

                    for ( var i = 0 ; i != count ; i++ )
                    {
                         const n = newValues [i]
                         values [i] = n > max [i] ? max [i] : n
                    }
                    break
               }

               return self
          }

          function factor ( factors: number | number [] )
          {
               if ( typeof factors == "number" )
               {
                    if ( ! Number.isFinite ( factors ) )
                         return self

                    for ( var i = 0 ; i != values.length ; i++ )
                         values [i] = min [i] + ranges [i] * factors
               }
               else if ( Array.isArray ( factors ) )
               {
                    const count = values.length < factors.length ? values.length : factors.length

                    if ( count == 0 )
                         return self

                    for ( var i = 0 ; i != count ; i++ )
                    {
                         if ( isFinite ( factors [i] ) )
                              values [i] = min [i] + ranges [i] * factors [i]
                    }
               }

               return self
          }
     }
}

type InputValue = number | string | (number | string) [];

export function wrapStringValue (
     value     : number | string | (number | string) [],
     decompose?: ( value: string ) => { numbers: number [], recompose: () => string },
     minValue? : number | string | (number | string) [] | null,
     maxValue? : number | string | (number | string) [] | null,
     onUpdate? : () => void
): WrappedStringNumber
{
     if ( typeof decompose != "function" )
          decompose == decomposeStringValue

     var parts: ReturnType <typeof decompose>
     var nums: NumberLib.MultipleLimitedValues

     const self: WrappedStringNumber = {
          limit,
          set,
          factor,
          reset,
          toString () { return parts.recompose () },
          get numbers () { return parts.numbers }
     }

     ;{
          const tmp = onUpdate
          onUpdate = null

          reset ()

          if ( typeof tmp == "function" )
               onUpdate = tmp
     }

     function limit ( min?: InputValue, max?: InputValue )
     {
          minValue = min
          maxValue = max

          nums.limit (
               decompose ( norm ( min ) ).numbers,
               decompose ( norm ( max ) ).numbers
          )

          if ( onUpdate )
               onUpdate ()

          return self
     }

     function reset ()
     {
          const old = parts != undefined ? parts.recompose () : ""

          parts = decompose ( norm ( value ) )

          nums = NumberLib.multipleLimitedValues (
               parts.numbers,
               decompose ( norm ( minValue ) ).numbers,
               decompose ( norm ( maxValue ) ).numbers,
          )

          if ( onUpdate && old != parts.recompose () )
               onUpdate ()

          return self
     }

     function set ( values: InputValue )
     {
          nums.set (
               typeof values == "number"
               ? [values]
               : decompose ( norm ( values ) ).numbers
          )

          if ( onUpdate )
               onUpdate ()

          return self
     }

     function factor ( factors: number | number [] )
     {
          nums.factor ( factors )

          if ( onUpdate )
               onUpdate ()

          return self
     }

     function norm ( input: InputValue )
     {
          if ( Array.isArray ( input ) )
               return input.join (' ')

          if ( typeof input == "number" )
               return input.toString ()

          if ( typeof input == "string" )
               return input

          return ""
     }

     return self
}

const regex = /([+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g


function decomposeStringValue ( value: string ): {
     strings: string [],
     numbers: number [],
     recompose: () => string
}
{
     const strings = [] as string []
     const numbers = [] as number []

     var start = 0
     var match: RegExpExecArray

     while ( (match = regex.exec ( value )) !== null )
     {
          strings.push ( value.substring ( start, match.index ) )
          numbers.push  ( parseFloat ( match [1] ) )

          start = match.index + match [0].length
     }

     strings.push ( value.substring ( start ) )

     const recompose = () =>
     {
          var result = ""

          for ( var i = 0 ; i != numbers.length ; i++ )
               result += strings [i] + numbers [i]

          return result + strings [i]
     }

     return {
          strings,
          numbers,
          recompose
     }
}
