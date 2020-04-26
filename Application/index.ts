
import "../Lib/index.js"
import "../Data/index.js"
import "../Ui/index.js"

import "./Aspect/index.js"

export * from "./Data/index.js"

import "./menu.js"
import "./panel.js"
import "./area.js"

export * from "./command.js"
export * from "./area.js"

import { area, contextualMenu } from "./area.js"
import { panel } from "./panel.js"
import { menu } from "./menu.js"
import { onCommand } from "./command.js"

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

onCommand ( "open-menu", () =>
{
     panel.close ()
     contextualMenu.hide ()
})
onCommand ( "open-panel", () =>
{
     menu.close ()
     contextualMenu.hide ()
})
