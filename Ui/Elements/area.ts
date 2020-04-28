
/*
example:
https://prezi.com/p/9jqe2wkfhhky/la-bulloterie-tpcmn/
https://movilab.org/index.php?title=Utilisateur:Aur%C3%A9lienMarty
*/


import { Geometry } from "../../Lib/index"

import { Shape }   from "@aspect/shape"
import * as aspect from "@aspect/db"
import * as db     from "@app/node"

import "fabric"

fabric.Object.prototype.padding            = 0
fabric.Object.prototype.objectCaching      = false
fabric.Object.prototype.hasControls        = true
fabric.Object.prototype.hasBorders         = true
fabric.Object.prototype.hasRotatingPoint   = false
fabric.Object.prototype.transparentCorners = false
fabric.Object.prototype.centeredScaling    = true
fabric.Object.prototype.cornerStyle        = "circle"
fabric.Object.prototype.setControlVisible ( "ml", false )
fabric.Object.prototype.setControlVisible ( "mt", false )
fabric.Object.prototype.setControlVisible ( "mr", false )
fabric.Object.prototype.setControlVisible ( "mb", false )
fabric.Object.prototype.setControlVisible ( "tl", false )
fabric.Object.prototype.setControlVisible ( "bl", false )
fabric.Object.prototype.setControlVisible ( "br", false )

export interface View
{
     name: string
     active: boolean
     children : Shape []
     thumbnail: string
     packing  : "enclose"
}

export class Area
{
     readonly fcanvas: fabric.Canvas
     private active: View
     private views = {} as Record <string, View>

     constructor ( canvas: HTMLCanvasElement )
     {
          this.fcanvas = new fabric.Canvas ( canvas )
          this.enableEvents ()
     }

     get view ()
     {
          return this.active
     }

     overFObject: fabric.Object = undefined

     static currentEvent: fabric.IEvent
     onOverObject  = null as ( obj: Shape ) => void
     onOutObject   = null as ( obj: Shape ) => void
     onTouchObject = null as ( obj: Shape ) => void
     onDoubleTouchObject = null as ( obj: Shape ) => void
     onTouchArea   = null as ( x: number, y: number ) => void

     createView ( name: string )
     {
          const { views } = this

          if ( name in views )
               throw "The view already exists"

          return views [name] = {
               name,
               active   : false,
               children : [],
               packing  : "enclose",
               thumbnail: null,
          }
     }

     use ( name: string ): View
     use ( view: View )  : View
     use ( name: string | View ): View
     {
          const { fcanvas, views } = this

          if ( typeof name != "string" )
               name = name.name

          if ( this.active && this.active.name == name )
               return

          if ( ! (name in views) )
               return

          const active = this.active = views [name]

          fcanvas.clear ()

          for ( const shape of active.children )
               fcanvas.add ( shape.group )

          return active
     }

     add ( ... shapes: (Shape | $Node) [] ): void
     add ( ... path: string [] ): void
     add ()
     {
          const { active, fcanvas } = this

          if ( arguments.length == 0 )
               return

          if ( typeof arguments [0] == "string" )
          {
               //const node = db.getNode ( ... arguments as any as string [] )
               const node = db.node ( arguments [0], arguments [1] as string  )
               const shp = aspect.getAspect ( node )
               active.children.push ( shp )
               fcanvas.add ( shp.group )
          }
          else for ( const s of arguments )
          {
               const shp = aspect.getAspect ( s as $Node | Shape )

               // shp.getFabric
               // shp.getHtml
               // shp.getSvg

               // factory

               active.children.push ( shp )
               fcanvas.add ( shp.group )
          }

          fcanvas.requestRenderAll ()
     }

     clear ()
     {
          this.fcanvas.clear ()
     }

     pack ()
     {
          const { fcanvas } = this

          const objects = fcanvas.getObjects ()
          const positions = [] as Geometry.Circle []

          for ( const g of objects )
          {
               const r = (g.width > g.height ? g.width : g.height) / 2
               positions.push ( { x: g.left, y: g.top, r: r + 20 } )
          }

          Geometry.packEnclose ( positions ) * 2

          for ( var i = 0 ; i < objects.length ; i++ )
          {
               const g = objects [i]
               const p = positions [i]

               g.left = p.x
               g.top  = p.y
               g.setCoords ()
          }

          fcanvas.requestRenderAll ()
     }

     zoom ( factor?: number | Shape )
     {
          const { fcanvas } = this

          if ( typeof factor == "number" )
          {
               return
          }

          const objects = fcanvas.getObjects ()

          if ( typeof factor == "object" )
          {
               const o = factor.group

               var left   = o.left - o.width
               var right  = o.left + o.width
               var top    = o.top  - o.height
               var bottom = o.top  + o.height

          }
          else
          {
               var left   = 0
               var right  = 0
               var top    = 0
               var bottom = 0

               for ( const o of objects )
               {
                    const l = o.left - o.width
                    const r = o.left + o.width
                    const t = o.top  - o.height
                    const b = o.top  + o.height

                    if ( l < left )
                         left = l

                    if ( r > right )
                         right = r

                    if ( t < top )
                         top = t

                    if ( b > bottom )
                         bottom = b
               }
          }

          const w  = right - left
          const h  = bottom - top
          const vw = fcanvas.getWidth  ()
          const vh = fcanvas.getHeight ()

          const f = w > h
                    ? (vw < vh ? vw : vh) / w
                    : (vw < vh ? vw : vh) / h

          fcanvas.viewportTransform [0] = f
          fcanvas.viewportTransform [3] = f

          const cx = left + w / 2
          const cy = top  + h / 2

          fcanvas.viewportTransform [4] = -(cx * f) + vw / 2
          fcanvas.viewportTransform [5] = -(cy * f) + vh / 2

          for ( const o of objects )
               o.setCoords ()

          fcanvas.requestRenderAll ()
     }

     isolate ( shape: Shape )
     {
          for ( const o of this.fcanvas.getObjects () )
          {
               o.visible = false
          }

          shape.group.visible = true
     }

     getThumbnail ()
     {
          const { active: cview } = this

          const thumbnail = cview.thumbnail

          if ( thumbnail || cview.active == false )
               thumbnail

          return cview.thumbnail = this.fcanvas.toDataURL ({ format: "jpeg" })
     }

     // UI EVENTS

     enableEvents ()
     {
          this.initClickEvent ()
          this.initOverEvent  ()
          this.initPanEvent   ()
          this.initZoomEvent  ()
          //this.initMoveObject ()
          //this.initDragEvent  ()

          window.addEventListener ( "resize", this.responsive.bind (this) )
     }

     private responsive ()
     {
          var width   = (window.innerWidth  > 0) ? window.innerWidth  : screen.width
          var height  = (window.innerHeight > 0) ? window.innerHeight : screen.height

          this.fcanvas.setDimensions({
               width: width,
               height: height
          })
     }

     private initClickEvent ()
     {
          const page           = this.fcanvas
          const max_clich_area = 25 * 25
          var   last_click     = -1
          var   last_pos       = { x: -9999, y: -9999 }

          page.on ( "mouse:down", fevent =>
          {
               console.log ( "mouse:down" )
               const now   = Date.now ()
               const pos   = fevent.pointer
               const reset = () => {
                    last_click = now
                    last_pos   = pos
               }

               // Nous vérifions que soit un double-clique.
               if ( 500 < now - last_click )
               {
                    if ( this.onTouchObject )
                    {
                         const element = aspect.getAspect ( fevent.target )

                         Area.currentEvent = fevent;
                         if ( element )
                              this.onTouchObject ( element )
                         Area.currentEvent = null;

                         fevent.e.stopImmediatePropagation ()
                         return
                    }
                    else
                    {

                         return reset ()
                    }
               }

               // Nous vérifions que les deux cliques se trouve dans une région proche.
               const zone = (pos.x - last_pos.x) * (pos.y - last_pos.y)
               if ( zone < -max_clich_area || max_clich_area < zone )
                    return reset ()

               // Si le pointer est au-dessus d’une forme.
               if ( fevent.target != undefined )
               {
                    if ( this.onDoubleTouchObject )
                    {
                         const element = aspect.getAspect ( fevent.target )

                         Area.currentEvent = fevent;
                         if ( element )
                              this.onDoubleTouchObject ( element )
                         Area.currentEvent = null;
                    }

                    last_click   = -1
               }
               // Si le pointer est au-dessus d’une zone vide.
               else
               {
                    Area.currentEvent = fevent;
                    if ( this.onTouchArea )
                         this.onTouchArea ( pos.x, pos.y )
                    Area.currentEvent = null;
               }

               fevent.e.stopImmediatePropagation ()

               return
          })
     }

     private initOverEvent ()
     {
          const page = this.fcanvas

          page.on ( "mouse:over", fevent =>
          {
               this.overFObject = fevent.target

               if ( this.onOverObject )
               {
                    const element = aspect.getAspect ( fevent.target )

                    Area.currentEvent = fevent;
                    if ( element )
                         this.onOverObject ( element )
                    Area.currentEvent = null;
               }
          })

          page.on ( "mouse:out", fevent =>
          {
               this.overFObject = undefined

               if ( this.onOutObject )
               {
                    const element = aspect.getAspect ( fevent.target )

                    Area.currentEvent = fevent;
                    if ( element )
                         this.onOutObject ( element )
                    Area.currentEvent = null;
               }
          })
     }

     private initPanEvent ()
     {
          const page       = this.fcanvas
          var   isDragging = false
          var   lastPosX   = -1
          var   lastPosY   = -1

          page.on ( "mouse:down", fevent =>
          {
               if ( this.overFObject == undefined )
               {
                    page.selection = false
                    page.discardActiveObject ()
                    page.forEachObject ( o => { o.selectable = false } )

                    isDragging = true
                    lastPosX   = fevent.pointer.x
                    lastPosY   = fevent.pointer.y

                    page.requestRenderAll ()
               }
          })

          page.on ( "mouse:move", fevent =>
          {
               if ( isDragging )
               {
                    const pointer  = fevent.pointer

                    page.viewportTransform [4] += pointer.x - lastPosX
                    page.viewportTransform [5] += pointer.y - lastPosY

                    page.requestRenderAll()

                    lastPosX = pointer.x
                    lastPosY = pointer.y
               }
          })

          page.on ( "mouse:up", () =>
          {
               page.selection = true

               page.forEachObject ( o =>
               {
                    o.selectable = true
                    o.setCoords()
               })

               isDragging = false

               page.requestRenderAll ()
          })
     }

     private initZoomEvent ()
     {
          const page = this.fcanvas

          page.on ( "mouse:wheel", fevent =>
          {
               const event   = fevent.e as WheelEvent
               var   delta   = event.deltaY
               var   zoom    = page.getZoom()
                    zoom    = zoom - delta * 0.005

               if (zoom > 9)
                    zoom = 9

               if (zoom < 0.5)
                    zoom = 0.5

               page.zoomToPoint( new fabric.Point ( event.offsetX, event.offsetY ), zoom )

               event.preventDefault()
               event.stopPropagation()

               page.requestRenderAll ()
          })
     }

     private initMoveObject ()
     {
          const page      = this.fcanvas
          var   cluster   = undefined as fabric.Object []
          var   positions = undefined as number [][]
          var   originX   = 0
          var   originY   = 0

          function on_selection (fevent: fabric.IEvent)
          {
               const target = fevent.target
               console.log ( target )
               cluster = target ["cluster"] as fabric.Object []

               if ( cluster == undefined )
                    return

               originX   = target.left
               originY   = target.top
               positions = []

               for ( const o of cluster )
                    positions.push ([ o.left, o.top ])

               console.log ("created")
          }

          page.on ( "selection:created", on_selection )
          page.on ( "selection:updated", on_selection )

          page.on ( "object:moving", fevent =>
          {
               if ( cluster == undefined )
                    return

               const target   = fevent.target
               const offsetX  = target.left - originX
               const offsetY  = target.top  - originY

               for ( var i = 0 ; i < cluster.length ; i++ )
               {
                    const obj = cluster [i]
                    const pos = positions [i]
                    obj.set ({
                         left: pos [0] + offsetX,
                         top : pos [1] + offsetY
                    })
               }
          })

          page.on ( "selection:cleared", fevent =>
          {
               cluster = undefined

               console.log ("cleared")
          })
     }

     private initDragEvent ()
     {
          // https://www.w3schools.com/html/html5_draganddrop.asp
          // https://github.com/Shopify/draggable/blob/master/src/Draggable/Draggable.js

          const page      = this.fcanvas

          page.on ( "touch:drag", fevent =>
          {
               //console.log ( fevent )
               console.log ( "touch:drag" )
          })

          page.on ( "dragenter", fevent =>
          {
               //console.log ( "DROP-ENTER", fevent )
          })

          page.on ( "dragover", fevent =>
          {
               //console.log ( "DROP-OVER", fevent )
          })

          page.on ( "drop", fevent =>
          {
               //const e = fevent.e as DragEvent
               //console.log ( "DROP", e.dataTransfer.getData ("text") )
          })
     }
}
