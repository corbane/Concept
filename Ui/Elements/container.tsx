
import { pick, inStock, make } from "../db"
import { Component } from "./component"

declare global
{
     interface $Container extends $Component
     {
          direction?: "lr" | "rl" | "tb" | "bt"
          children?: $AnyComponents []
     }
}

export class Container <$ extends $Container = $Container> extends Component <$>
{
     children = {} as Record <string, Component>
     slot: JSX.Element

     readonly is_vertical: boolean

     defaultData () : $Container
     {
          return {
               context: "concept-ui",
               type     : "component",
               id       : undefined,
               direction: "lr",
          }
     }

     constructor ( data: $ )
     {
          super ( data )

          data = this.data
          const children = data.children

          if ( children )
          {
               for ( const child of children )
               {
                    if ( ! inStock ( child ) )
                         make ( child )
               }
          }

          this.is_vertical = data.direction == "bt" || data.direction == "tb"
     }

     /** @override */
     getHtml ()
     {
          if ( this.container != undefined )
               return [this.container]

          const elements  = super.getHtml ()
          const container = this.container
          const data      = this.data
          const children  = this.children
          const und = undefined

          if ( this.is_vertical )
               container.classList.add ( "vertical" )
          else
               container.classList.remove ( "vertical" )

          if ( this.slot == undefined )
               this.slot = container

          const slot = this.slot

          if ( data.children )
          {
               const new_children = [] as Component []

               for ( const child of data.children )
               {
                    const o = pick ( child )
                    slot.append ( ... o.getHtml () )
                    children [o.data.id] = o
               }

               //this.onChildrenAdded ( new_children )
          }

          return elements
     }

     //onChildrenAdded ( components: Component [] )
     //{

     //}

     append ( ... elements: (string | Element | Component | $AnyComponents) [] )
     {

          if ( this.container == undefined )
               this.getHtml ()

          const slot      = this.slot
          const children  = this.children
          const new_child = [] as Component []

          for ( var e of elements )
          {
               if ( typeof e == "string" )
               {
                    e = new Phantom ({
                         context: "concept-ui",
                         type   : "phantom",
                         id  : undefined,
                         content: e
                    })
               }
               else if ( e instanceof Element )
               {
                    const UI_COMPONENT = Symbol.for ( "UI_COMPONENT" )

                    e = e [UI_COMPONENT] != undefined
                         ? e [UI_COMPONENT]
                         : new Phantom ({
                              context: "concept-ui",
                              type   : "phantom",
                              id  : undefined,
                              content: e.outerHTML
                         })
               }
               else if ( !(e instanceof Component) )
               {
                    e = inStock ( e ) ? pick ( e ) : make ( e )
               }

               children [(e as Component).data.id] = e as Component
               slot.append ( ... (e as Component).getHtml () )
               new_child.push ( e as Component )
          }

          //if ( new_child.length > 0 )
          //     this.onChildrenAdded ( new_child )
     }

     remove ( ... elements: Component [] )
     {
          const slot      = this.slot
          const children  = this.children

          for ( var e of elements )
          {
               if ( e.data.id in children )
               {
                    e.container.remove ()
                    delete children [e.data.id]
               }
          }
     }

     clear ()
     {
          this.children = {}

          if ( this.container )
               this.container.innerHTML = ""
     }

}


interface $Phantom extends $Component
{
     type: "phantom"
     content: string
}

class Phantom extends Component <$Phantom>
{
     container: HTMLElement | SVGElement

     /** @override */
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
