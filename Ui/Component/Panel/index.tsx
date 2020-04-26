
import { xnode } from "../../Base/xnode.js"
import { Component } from "../../Base/Component/index.js"
import { Container } from "../../Base/Container/index.js"
//import { expandable, ExpendableElement } from "../../Base/expendable.js"
import { scollable } from "../../Base/scrollable.js"
import { pick, define, inStock, make } from "../../db.js"

type Direction = "lr" | "rl" | "tb" | "bt"

declare global
{
     interface $Panel extends $Container
     {
          type         : "panel",
          //hasMainButton: boolean,
          header?      : $AnyComponents,
          children?    : $AnyComponents [],
          footer?      : $AnyComponents,
     }
}

const toPosition = {
     lr : "left",
     rl : "right",
     tb : "top",
     bt : "bottom",
}

/**
 *   ```
 *   .panel
 *        .panel-header
 *             .panel-main-buttton
 *             [...]
 *        .panel-content
 *             [...]
 *        .panel-footer
 *             [...]
 *   ```
 */
export class Panel <$ extends $Extends <$Panel>> extends Container <$>
{
     //main_button: JSX.Element
     content    : Component
     header     : Component
     _header: JSX.Element
     _content: JSX.Element

     //protected expandable: ExpendableElement

     defaultData (): $Panel
     {
          return {
               ... super.defaultData (),
               type         : "panel",
               children     : [],
               direction    : "rl",
               //hasMainButton: true,
          }
     }

     getHtml ()
     {
          if ( this.container == undefined )
          {
               const header    = <div class="panel-header" />
               const content   = <div class="panel-content" />
               const container = <div class="panel close">
                    { header }
                    { content }
               </div>

               const data = this.data

               // if ( data.hasMainButton )
               // {
               //      const btn = <span class="panel-main-button">
               //           <span class="icon">⇕</span>
               //      </span>

               //      this.main_button = btn
               //      header.append ( btn )
               // }

               if ( data.header )
               {
                    this.header = inStock ( data.header )
                                ? pick ( data.header )
                                : make ( data.header )

                    header.append ( ... this.header.getHtml () )
               }

               if ( data.children )
               {
                    //super.append ( ... data.children )
                    for ( const child of data.children )
                    {
                         this.content = inStock ( child )
                                      ? pick ( child )
                                      : make ( child )

                         content.append ( ... this.content.getHtml () )
                    }
               }

               this.container  = container

               // this.expandable = expandable ( container, {
               //      direction    : data.direction,
               //      near         : 60,
               //      handles      : Array.of ( this.main_button ),
               //      onAfterOpen  : () => {
               //           //content.style.overflow = ""
               //           content.classList.remove ( "hidden" )
               //      },
               //      onBeforeClose: () => {
               //           //content.style.overflow = "hidden"
               //           content.classList.add ( "hidden" )
               //      }
               // })

               // this.expandable.activate ()

               scollable ({
                    handles: [content],
                    direction: "bt"
               })
               .activate ()

               this._header = header
               this._content = content

               this.container.classList.add ( toPosition [data.direction] )
          }

          return [ this.container ] as HTMLElement []
     }

     // private onClickTab ()
     // {
     //      this.open ()
     // }

     //isOpen ()
     //{
     //     return this.expandable.isOpen ()
     //}

     //isClose ()
     //{
     //     return this.expandable.isClose ()
     //}

     setOrientation ( value: Direction )
     {
          const { data } = this

          this.container.classList.remove ( toPosition [data.direction] )
          this.container.classList.add ( toPosition [value] )

          super.setOrientation ( value )

          //expandable.updateConfig ({ direction: value })

          data.direction = value
     }

     // open ( id?: string, ... content: (string | Element | Component | $Component) [] )
     // {
     //      //if ( arguments.length > 1 )
     //      //     this.slideshow.show ( id, ... content )

     //      //this.expandable.open ()

     //      //this.content ( ... args )

     //      return this
     // }

     // close ()
     // {
     //      this.expandable.close ()

     //      return this
     // }

     //size = 0

     // resize ( size: number )
     // {
     //      const { expandable, container } = this

     //      if ( expandable.isVertical () )
     //           container.style.height = size + "px"
     //      else
     //           container.style.width = size + "px"

     //      this.size = size
     // }

     // expand ( offset: number )
     // {
     //      const { expandable, container } = this

     //      const size = this.size + offset

     //      if ( expandable.isVertical () )
     //           container.style.height = size + "px"
     //      else
     //           container.style.width = size + "px"

     //      this.size = size
     // }
}

define ( Panel, ["panel"] )

