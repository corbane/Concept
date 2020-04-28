
import { createNode } from "../../../Data/index.js"
import { xnode } from "../xnode.js"

declare global
{
     interface $Component extends $Cluster
     {
          readonly context: typeof CONTEXT_UI
          type: string
          children?: $Component [] // Record <string, $Child>
     }
}

export class Component <$ extends $Component = $Component>
{
     data: $

     container: HTMLElement | SVGElement

     defaultData () : $Component
     {
          return {
               context: CONTEXT_UI,
               type   : "component",
               id     : undefined,
          }
     }

     constructor ( data: $ )
     {
          this.data = Object.assign (
               this.defaultData (),
               createNode ( data.type, data.id, data ) as any
          )
     }

     getHtml (): (HTMLElement | SVGElement) []
     {
          if ( this.container == undefined )
          {
               this.container = <div class={ this.data.type }></div>
               this.onCreate ()
          }

          return [this.container]
     }

     onCreate ()
     {

     }

}


