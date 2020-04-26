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
export function css(el, props) {
    Object.assign(el.style, props);
}
export function cssFloat(el, property) {
    var value = parseFloat(el.style[property]);
    if (Number.isNaN(value)) {
        value = parseFloat(window.getComputedStyle(el)[property]);
        if (Number.isNaN(value))
            value = 0;
    }
    return value;
}
export function cssInt(el, property) {
    var value = parseInt(el.style[property]);
    if (Number.isNaN(value)) {
        const style = window.getComputedStyle(el);
        value = parseInt(style[property]);
        if (Number.isNaN(value))
            value = 0;
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vVWkvQ29yZS9kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBV0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxRkc7QUFFSCxNQUFNLFVBQVUsR0FBRyxDQUFHLEVBQTRCLEVBQUUsS0FBNEM7SUFFM0YsTUFBTSxDQUFDLE1BQU0sQ0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBRSxDQUFBO0FBQ3RDLENBQUM7QUFFRCxNQUFNLFVBQVUsUUFBUSxDQUFHLEVBQTRCLEVBQUUsUUFBZ0I7SUFFcEUsSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUcsUUFBUSxDQUFFLENBQUUsQ0FBQTtJQUVoRCxJQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUcsS0FBSyxDQUFFLEVBQzNCO1FBQ0ssS0FBSyxHQUFHLFVBQVUsQ0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUcsRUFBRSxDQUFFLENBQUcsUUFBUSxDQUFFLENBQUUsQ0FBQTtRQUVsRSxJQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUcsS0FBSyxDQUFFO1lBQ3RCLEtBQUssR0FBRyxDQUFDLENBQUE7S0FDbEI7SUFFRCxPQUFPLEtBQUssQ0FBQTtBQUNqQixDQUFDO0FBRUQsTUFBTSxVQUFVLE1BQU0sQ0FBRyxFQUE0QixFQUFFLFFBQWdCO0lBRWxFLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBRyxFQUFFLENBQUMsS0FBSyxDQUFHLFFBQVEsQ0FBRSxDQUFFLENBQUE7SUFFOUMsSUFBSyxNQUFNLENBQUMsS0FBSyxDQUFHLEtBQUssQ0FBRSxFQUMzQjtRQUNLLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRyxFQUFFLENBQUUsQ0FBQTtRQUU1QyxLQUFLLEdBQUcsUUFBUSxDQUFHLEtBQUssQ0FBRyxRQUFRLENBQUUsQ0FBRSxDQUFBO1FBRXZDLElBQUssTUFBTSxDQUFDLEtBQUssQ0FBRyxLQUFLLENBQUU7WUFDdEIsS0FBSyxHQUFHLENBQUMsQ0FBQTtLQUNsQjtJQUVELE9BQU8sS0FBSyxDQUFBO0FBQ2pCLENBQUMifQ==