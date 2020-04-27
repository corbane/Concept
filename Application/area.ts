
import { RadialMenu } from "../Ui/Component/CircularMenu/index.js"
import { Area } from "../Ui/Component/Area/area.js"
//import * as Aspect from "./Aspect/index.js"

//import { addCommand, runCommand } from "./command.js"
//import { command } from "./command.js"

export const area =  (() =>
{
     const canvas = document.createElement ( "canvas" )

     canvas.width  = document.body.clientWidth
     canvas.height = document.body.clientHeight

     document.body.append ( canvas )

     return new Area ( canvas )
}) ()

export const contextualMenu = new RadialMenu ({
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


// CLICK EVENTS

// area.onTouchObject = ( shape ) =>
// {
//      run Command ( "zoom-to", shape )
// }

// HOVER EVENTS

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

// TEST

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
