
import "../Lib/index.js"
import "../Data/index.js"
import "../Ui/index.js"

import "./command.js"
//import "./menu.js"
//import "./panel.js"
//import "./area.js"

import "./Aspect/index.js"

export * from "./data.js"

//export * from "./area.js"
import { area } from "./area.js"
export { area };

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

