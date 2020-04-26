
import { xnode, Component, define } from "../../index.js"
import * as db from "../../../Application/Data/db.js"

declare global
{

     export interface $PersonViewer extends $Component
     {
          type: "person-viewer"
     }
}

export class PersonVieweer extends Component <$PersonViewer>
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

define ( PersonVieweer, {
     context: "concept-ui",
     type   : "person-viewer",
     id     : undefined,
})
