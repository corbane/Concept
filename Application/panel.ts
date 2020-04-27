
import "../Ui/db.js"
import "../Ui/Component/SlideShow/index.js"
import "../Ui/Component/Panel/skill.js"

import * as ui from "../Ui/index.js"
import { SideMenu } from "../Ui/index.js"

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
               context : "concept-ui",
               type    : "button",
               id      : "console",
               icon    : "⚠",
               text    : "",
               handleOn: "*",
               command : "pack-view"
          },{
               context : "concept-ui",
               type    : "button",
               id      : "properties",
               icon    : "",
               text    : "panel properties",
               handleOn: "*",
          }]
     },

     children: [{
          context: "concept-ui",
          type   : "slideshow",
          id     : "panel-slideshow",

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

