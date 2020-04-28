
import "../Lib/index.js"
import "../Data/index.js"

import "./Aspect/index.js"
import { getAspect } from "./Aspect/db.js"

export * from "./data.js"
import * as db  from "./data.js"

import * as ui from "../Ui/index.js"
const command = ui.command

// #region DRAWING AREA

export const area =  (() =>
{
     const canvas = document.createElement ( "canvas" )

     canvas.width  = document.body.clientWidth
     canvas.height = document.body.clientHeight

     document.body.append ( canvas )

     return new ui.Area ( canvas )
}) ()

export const contextualMenu = new ui.RadialMenu ({
     context: "concept-ui",
     type: "radial-menu",
     id: "area-menu",
     buttons: [
          //{ type: "button", id: "add-thing" , text: "", icon: "&#xe3c8;", fontFamily: "Material Icons", callback: () => { runCommand ( "zoom-extends" ) } }, // details
          { type: "button", id: "add-thing" , text: "", icon: "&#xe3c8;", fontFamily: "Material Icons" }, // details
          { type: "button", id: "add-bubble", text: "", icon: "&#xe6dd;", fontFamily: "Material Icons" },
          { type: "button", id: "add-note"  , text: "", icon: "&#xe244;", fontFamily: "Material Icons", command: "pack-view" }, // format_quote
          { type: "button", id: "add-people", text: "", icon: "&#xe87c;", fontFamily: "Material Icons" }, // face
          { type: "button", id: "add-tag"   , text: "", icon: "&#xe867;", fontFamily: "Material Icons" }, // bookmark_border
     ] as any,
     rotation: Math.PI/2,
})
document.body.append ( ... contextualMenu.getHtml () )

// Area events

area.onDoubleTouchObject = ( shape ) =>
{
     if ( shape.config.onTouch != undefined )
          shape.config.onTouch ( shape )
}

area.onTouchArea = ( x, y ) =>
{
     command ( "open-contextal-menu" ).run ()
     //run Command ( "open-contextal-menu", x, y )
}

area.onOverObject = ( shape ) =>
{
     shape.hover ( true )
     area.fcanvas.requestRenderAll ()
}

area.onOutObject = ( shape ) =>
{
     shape.hover ( false )
     area.fcanvas.requestRenderAll ()
}

// Area commands

command ( "open-contextal-menu", ( e: fabric.IEvent ) =>
{
     contextualMenu.show ( e.pointer.x, e.pointer.y )
} )

command ( "close-contextal-menu", () =>
{
     contextualMenu.hide ()
})

command ( "add-skill", ( title ) =>
{
     console.log ( "Add skill" )
})

command ( "add-person", ( name ) =>
{

})

command ( "zoom-extends", () =>
{
     area.zoom ()
})

command ( "zoom-to", ( shape ) =>
{
     // area.zoom ( shape )
     // area.isolate ( shape )
})

command ( "pack-view", () =>
{
     area.pack ()
})

// test

if ( navigator.maxTouchPoints > 0 )
{

     window.addEventListener ( "pointermove", event =>
     {
          //const target = area.fcanvas.findTarget ( event, true )
          //if ( target )
          //     console.log ( target )
     })
}
else
{
     window.addEventListener ( "mousemove", event =>
     {
          //const target = area.fcanvas.findTarget ( event, true )
          //if ( target )
          //     console.log ( target )
     })
}

// #endregion

// #region MENU

export const menu = ui.make <ui.SideMenu, $SideMenu> ({
     context      : CONTEXT_UI,
     type         : "side-menu",
     id           : "menu",
     hasMainButton: true,
     direction    : "lr"
})
document.body.append ( ... menu.getHtml () )

// #endregion

// #region PANEL

var direction = "rl" as "rl" | "lr" | "tb" | "bt"

export const panel = ui.make <ui.SideMenu, $SideMenu> ({
     context      : CONTEXT_UI,
     type         : "side-menu",
     id           : undefined,
     direction    : direction,
     hasMainButton: true,

     header: {
          context  : CONTEXT_UI,
          type     : "toolbar",
          id       : undefined,
          title    : "Title ..",
          direction: direction == "lr" || direction == "rl" ? "tb" : "lr",

          buttons: [{
               context : CONTEXT_UI,
               type    : "button",
               id      : "console",
               icon    : "⚠",
               text    : "",
               handleOn: "*",
               command : "pack-view"
          },{
               context : CONTEXT_UI,
               type    : "button",
               id      : "properties",
               icon    : "",
               text    : "panel properties",
               handleOn: "*",
          }]
     },

     children: [{
          context: CONTEXT_UI,
          type   : "slideshow",
          id     : "panel-slideshow",

          children: [{
               context : CONTEXT_UI,
               type    : "skill-viewer",
               id      : "slide-skill",
               position: "left"
          },{
               context : CONTEXT_UI,
               type    : "person-viewer",
               id      : "slide-person",
               position: "left"
          }]
     }]
})

document.body.append ( ... panel.getHtml () )

// Pannels commands

const slideInfos = ui.pick <ui.SkillViewer> ( "skill-viewer", "slide-skill" )

command ( "open-panel", ( name, ... content ) =>
{
     // if ( name )
     //      slideshow.show ( name, ... content )
     // else
     //      panel.open ()
})

command ( "open-infos-panel", ( e ) =>
{
     const aspect = getAspect ( ui.Area.currentEvent.target )

     if ( aspect )
     {
          const skill = db.node ( aspect.config.type, aspect.config.id )
          if ( skill )
          {
               slideInfos.display ( skill as any )
               panel.open ()
          }
     }
})

command ( "close-panel" , () =>
{
     panel.close ()
})

// #endregion

// #region APPLICATION

command ( "open-menu", () =>
{
     panel.close ()
     contextualMenu.hide ()
})
command ( "open-panel", () =>
{
     menu.close ()
     contextualMenu.hide ()
})

export function width ()
{
     return area.fcanvas.getWidth ()
}

export function height ()
{
     return area.fcanvas.getHeight ()
}

export function refresh ()
{
     //$area.setZoom (0.1)
     area.fcanvas.requestRenderAll ()
}

// #endregion
