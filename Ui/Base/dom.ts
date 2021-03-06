
export type ExtendedCSSStyleDeclaration = CSSStyleDeclaration &
{
    display      : "inline" | "block" | "contents" | "flex" | "grid" | "inline-block" | "inline-flex" | "inline-grid" | "inline-table" | "list-item" | "run-in" | "table" | "table-caption" | "table-column-group" | "table-header-group" | "table-footer-group" | "table-row-group" | "table-cell" | "table-column" | "table-row" | "none" | "initial" | "inherit"
    flexDirection: "row" | "row-reverse" | "column" | "column-reverse" | "initial" | "inherit"
    overflow     : "visible" | "hidden" | "scroll" | "auto" | "initial" | "inherit"
    overflowX    : "visible" | "hidden" | "scroll" | "auto" | "initial" | "inherit"
    overflowY    : "visible" | "hidden" | "scroll" | "auto" | "initial" | "inherit"
    position     : "static" | "absolute" | "fixed" | "relative" | "sticky" | "initial" | "inherit"
}

/*declare global{

     interface Window
     {
          on: Window ["addEventListener"]
          off: Window ["removeEventListener"]
     }

     interface Element
     {
          css ( properties: Partial <ExtendedCSSStyleDeclaration> ): this

          cssInt   ( property: string ): number
          cssFloat ( property: string ): number

          on : HTMLElement ["addEventListener"]
          off: HTMLElement ["removeEventListener"]
          $  : HTMLElement ["querySelector"]
          $$ : HTMLElement ["querySelectorAll"]
     }
}

Window.prototype.on  = Window.prototype.addEventListener
Window.prototype.off = Window.prototype.removeEventListener

Element.prototype.css = function ( props )
{
Object.assign ( this.style, props )
return this
}

Element.prototype.cssInt = function ( property: string )
{
     var value = parseInt ( this.style [ property ] )

     if ( Number.isNaN ( value ) )
     {
          value = parseInt ( window.getComputedStyle ( this ) [ property ] )

          if ( Number.isNaN ( value ) )
               value = 0
     }

     return value
}

Element.prototype.cssFloat = function ( property: string )
{
     var value = parseFloat ( this.style [ property ] )

     if ( Number.isNaN ( value ) )
     {
          value = parseFloat ( window.getComputedStyle ( this ) [ property ] )

          if ( Number.isNaN ( value ) )
               value = 0
     }

     return value
}

Element.prototype.on  = Element.prototype.addEventListener

Element.prototype.off = Element.prototype.removeEventListener

Element.prototype.$   = Element.prototype.querySelector

Element.prototype.$$  = Element.prototype.querySelectorAll


Element.prototype.cssInt = function ( property: string )
{
     var value = parseInt ( this.style [ property ] )

     if ( Number.isNaN ( value ) )
     {
          const style = window.getComputedStyle ( this )

          value = parseInt ( style [ property ] )

          if ( Number.isNaN ( value ) )
               value = 0
     }

     return value
}*/

export function css ( el: HTMLElement | SVGElement, props: Partial <ExtendedCSSStyleDeclaration> )
{
     Object.assign ( el.style, props )
}

export function cssFloat ( el: HTMLElement | SVGElement, property: string )
{
     var value = parseFloat ( el.style [ property ] )

     if ( Number.isNaN ( value ) )
     {
          value = parseFloat ( window.getComputedStyle ( el ) [ property ] )

          if ( Number.isNaN ( value ) )
               value = 0
     }

     return value
}

export function cssInt ( el: HTMLElement | SVGElement, property: string )
{
     var value = parseInt ( el.style [ property ] )

     if ( Number.isNaN ( value ) )
     {
          const style = window.getComputedStyle ( el )

          value = parseInt ( style [ property ] )

          if ( Number.isNaN ( value ) )
               value = 0
     }

     return value
}

