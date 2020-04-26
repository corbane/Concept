
import { Unit, getUnit } from "./unit.js"

type DOMElement = HTMLElement | SVGElement

export function get ( element: DOMElement, property: keyof CSSStyleDeclaration )
{
    var value = element.style [ property ]

    if ( typeof value == "string" && value.trim ().length != 0 )
        return value

    return window.getComputedStyle ( element ).getPropertyValue ( property as string )
}

export function getInt ( element: DOMElement, property: keyof CSSStyleDeclaration )
{
    var value = parseInt ( element.style [ property ] )

    if ( Number.isNaN ( value ) )
    {
        value = parseInt ( window.getComputedStyle ( element ) [ property ] )

        if ( Number.isNaN ( value ) )
                value = 0
    }

    return value
}

export function getFloat ( element: DOMElement, property: keyof CSSStyleDeclaration )
{
    var value = parseFloat ( element.style [ property ] )

    if ( Number.isNaN ( value ) )
    {
        value = parseFloat ( window.getComputedStyle ( element ) [ property ] )

        if ( Number.isNaN ( value ) )
                value = 0
    }

    return value
}

const cacheConverted = {} as Record <string, number>

export function convertPxToUnit ( el: Element, value: string|number, unit: Unit )
{
    if ( typeof value == "string" )
    {
        const valueUnit = getUnit ( value )

        if ( valueUnit === unit )
            return value

        if ( ['deg', 'rad', 'turn'].indexOf ( valueUnit ) )
            return value
    }

    const cached = cacheConverted [value + unit]

    if ( typeof cached != "undefined" )
        return cached

    const baseline = 100
    const tempEl   = document.createElement( el.tagName )
    const parentEl = el.parentNode && el.parentNode !== document
                    ? el.parentNode
                    : document.body

    parentEl.appendChild( tempEl )

    tempEl.style.position = 'absolute';
    tempEl.style.width = baseline + unit

    const factor = baseline / tempEl.offsetWidth

    parentEl.removeChild ( tempEl )

    const convertedUnit = factor * parseFloat ( value as string )

    cacheConverted [ value + unit ] = convertedUnit

    return convertedUnit
}
