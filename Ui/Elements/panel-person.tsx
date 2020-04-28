
import { Component } from "./component.js"
import { xnode } from "../Base/xnode.js"
import { define } from "../db.js"
import { Panel } from "../panel.js"

declare global
{

     export interface $PersonViewer extends $Panel
     {
          readonly type: "person-viewer"
     }
}

export class PersonViewer extends Component <$PersonViewer>
{
     display ( person: $Person )
     {
          const card = <div class="w3-card-4 person-card">
               <img src={ person.avatar } alt="Avatar"/>
               <div class="w3-container">
                    <h4>
                         <b>{ person.firstName }</b>
                    </h4>
                    <label>
                         <b>{ person.isCaptain ? "Expert" : null }</b>
                    </label>
               </div>
          </div>


          this.container.innerHTML = ""
          this.container.append ( card )
     }
}

define ( PersonViewer, {
     context : CONTEXT_UI,
     type    : "person-viewer",
     id      : undefined,
     position: "left",
     button  : null
})
