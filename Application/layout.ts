
import { $Node } from "../Data/index.js"

import { createPanel } from "./panel.js"

export interface $Layout extends $Node
{
    context: "concept-application"
    type: "layout"
    panel?: boolean
}

export class Layout
{
    constructor ( readonly data: $Layout )
    {
        const panel = createPanel ()
        document.body.append ( ... panel.getHtml () )
    }
}
