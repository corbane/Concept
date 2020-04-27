

import * as ui from "../Ui/index.js"
import { SideMenu } from "../Ui/index.js"


//export const menu = createMenu ()

//document.body.append ( ... menu.elements () )

export const menu = ui.make <SideMenu, $SideMenu> ({
     context      : "concept-ui",
     type         : "side-menu",
     id           : "menu",
     hasMainButton: true,
     direction    : "lr"
})
document.body.append ( ... menu.getHtml () )

//export type MenuCommands = {
//     "open-menu": () => void,
//     "close-menu": () => void,
//}

//addCommand ( "open-menu", () => { menu.open () })
//addCommand ( "close-menu", () => { menu.close () })
