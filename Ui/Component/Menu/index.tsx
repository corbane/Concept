
import { xnode } from "../../Base/xnode.js"
import { css } from "../../Base/dom.js"

export interface $Menu
{
    elements (): (HTMLElement | SVGElement) []
    open (): void
    close (): void
}

export function createMenu ()
{
    const self = {} as $Menu

    const button =
        <button class="w3-button w3-xxlarge" click={ open }>
            &#9776;
        </button>

    const overlay =
        <div class="w3-overlay w3-animate-opacity" style="cursor:pointer"
            click={ close }></div>

    const sidebar =
        <div class="w3-sidebar w3-bar-block">
            <button class="w3-bar-item w3-button" click={ close }>
                Close
            </button>
            <button class="w3-bar-item w3-button" click={ rotateLayout }>
                ⤴ Rotate layout
            </button>
            <button class="w3-bar-item w3-button" click={ reverseLayout }>
                ⇅ Switch layout
            </button>
        </div>

    css ( sidebar, {
        zIndex    : "4",
        transition: "all 0.4s",
        left      : "-300px"
    })

    button.style.position = "fixed"
    button.style.zIndex   = "2"

    self.elements = () =>  [ button, overlay, sidebar ]
    self.open = open
    self.close = close

    return self

    function open ()
    {
        sidebar.style.left    = "0px"
        overlay.style.display = "block"
    }
    function close ()
    {
        sidebar.style.left    = "-300px"
        overlay.style.display = "none";
    }

    function rotateLayout ()
    {
        // const panel = Application.panel
        // switch ( panel.getOrientation () )
        // {
        // case "bt": panel.setOrientation ( "rl"  ) ; break
        // case "rl": panel.setOrientation ( "bt" ) ; break
        // case "lr": panel.setOrientation ( "tb"    ) ; break
        // default  : panel.setOrientation ( "lr"   ) ; break
        // }
    }
    function reverseLayout ()
    {
        // const panel = Application.panel
        // switch ( panel.getOrientation () )
        // {
        // case "bt": panel.setOrientation ( "tb"    ) ; break
        // case "tb": panel.setOrientation ( "bt" ) ; break
        // case "lr": panel.setOrientation ( "rl"  ) ; break
        // default  : panel.setOrientation ( "lr"   ) ; break
        // }
    }
}
