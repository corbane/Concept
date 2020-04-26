import { Component } from "../../Base/Component/index.js"

declare global
{
     export interface $Phantom extends $Component
     {
          type: "phantom"
          content: string
     }
}

export class Phantom extends Component <$Phantom>
{
     container: HTMLElement | SVGElement

     getHtml ()
     {
          if ( this.container == undefined )
          {
               this.container = document.createElement ( "div" )
               this.container.innerHTML = this.data.content
          }

          return this.container.childNodes as any as HTMLElement []
     }
}


