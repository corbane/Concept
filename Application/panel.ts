
import "../Ui/db.js"
import "../Ui/Component/Slideshow/index.js"
//import "./Component/infos.js"
import "../Ui/Entity/Skill/infos.js"

import * as ui from "../Ui/index.js"
import { Slideshow, SideMenu } from "../Ui/index.js"
import { SkillViewer } from "../Ui/Entity/Skill/infos.js"
import { addCommand } from "./command.js"

export type PanelCommands = {
     "open-panel": ( name: string, ... content: any [] ) => void,
     "open-infos-panel": ( data: $Node ) => void,
     "close-panel": () => void,
};

var direction = "rl" as "rl" | "lr" | "tb" | "bt"

export const panel = ui.make <SideMenu, $SideMenu> ({
     context      : "concept-ui",
     type         : "side-menu",
     id           : undefined,
     direction    : direction,
     hasMainButton: true,

     header: {
          context  : "concept-ui",
          type     : "toolbar",
          id       : undefined,
          title    : "Title ..",
          direction: direction == "lr" || direction == "rl" ? "tb" : "lr",

          buttons: [{
               context: "concept-ui",
               type    : "button",
               id      : "console",
               icon    : "⚠",
               text    : "",
               handleOn: "*",
               command: "pack-view"
          },{
               context: "concept-ui",
               type    : "button",
               id      : "properties",
               icon    : "",
               text    : "panel properties",
               handleOn: "*",
          }]
     },

     children: [{
          context  : "concept-ui",
          type     : "slideshow",
          id       : "panel-slideshow",

          children: [{
               context: "concept-ui",
               type   : "skill-viewer",
               id     : "slide-skill"
          },{
               context: "concept-ui",
               type   : "person-viewer",
               id     : "slide-person"
          }]
     }]
})

document.body.append ( ... panel.getHtml () )

const slideshow  = ui.pick <Slideshow>   ( "slideshow", "panel-slideshow" )
const slideInfos = ui.pick <SkillViewer> ( "skill-viewer", "slide-skill" )

addCommand ( "open-panel", ( name, ... content ) =>
{
     if ( name )
          slideshow.show ( name, ... content )
     else
          panel.open ()
})

addCommand ( "open-infos-panel", ( data ) =>
{
     if ( data )
     {
          slideInfos.display ( data as any )
          panel.open ()
     }
})

addCommand ( "close-panel" , () =>
{
     panel.close ()
})

