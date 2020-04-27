
import { menu , } from "./menu.js"
import { panel, } from "./panel.js"
import { area , contextualMenu } from "./area.js"
import { command } from "../Ui/command.js"


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


// PANELS COMMANDS

import * as ui from "../Ui/index.js"
import { Slideshow } from "../Ui/index.js"
import { SkillViewer } from "../Ui/Component/Panel/skill.js"
import { getNode } from "./data.js";
import { getAspect } from "./Aspect/db.js";
import { Area } from "../Ui/Component/Area/area.js"

const slideshow  = ui.pick <Slideshow>   ( "slideshow", "panel-slideshow" )
const slideInfos = ui.pick <SkillViewer> ( "skill-viewer", "slide-skill" )

command ( "open-panel", ( name, ... content ) =>
{
     // if ( name )
     //      slideshow.show ( name, ... content )
     // else
     //      panel.open ()
})

command ( "open-infos-panel", ( e ) =>
{
     const aspect = getAspect ( Area.currentEvent.target )

     if ( aspect )
     {
          const skill = getNode <$Skill> ({
               type: aspect.config.type,
               id  : aspect.config.id
          })

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

// AREA EVENTS

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


// AREA COMMANDS

//export type AreaCommands =
//{
//     "add-skill"           : ( title: string ) => void,
//     "add-person"          : ( name: string ) => void,
//     "zoom-extends"        : () => void,
//     "zoom-to"             : ( shape: Aspect.Shape ) => void,
//     "pack-view"           : () => void,
//     "open-contextal-menu" : ( x: number, y: number ) => void,
//     "close-contextal-menu": () => void,
//}


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
