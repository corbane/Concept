

export type Unit
    = "%"
    | "px" | "pt" | "em" | "rem" | "in" | "cm" | "mm"
    | "ex" | "ch" | "pc"
    | "vw" | "vh" | "vmin" | "vmax"
    | "deg" | "rad" | "turn"

export function getUnit ( value: any ): Unit | undefined
{
    if ( typeof value != "string" )
         return undefined

    const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/
              .exec( value );

    if ( split )
         return split [1] as Unit

    return undefined
}


export function getTransformUnit ( propName: string )
{
    if ( propName.includes ( 'translate' ) || propName === 'perspective' )
        return 'px'

    if ( propName.includes ( 'rotate' ) || propName.includes ( 'skew' ) )
        return 'deg'
}