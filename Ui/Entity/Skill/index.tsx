
import { Component } from "../../Base/Component/index.js"
import { xnode } from "../../Base/xnode.js"
import { define } from "../../db.js"
import * as db from "../../../Application/data.js"


declare global
{
     interface $SkillViewer extends $Component
     {
          type: "skill-viewer"
     }
}

export class SkillViewer extends Component <$SkillViewer>
{
     display ( skill: $Skill )
     {
          const target = <div class="people"></div>

          for ( const name of skill.items )
          {
               const person = db.getNode <$Person> ( name )

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

               target.append ( card )
          }

          this.container.classList.add ( "container" )
          this.container.innerHTML = ""
          this.container.append ( <h1>{ skill.id }</h1> )
          this.container.append ( <p>{ skill.description }</p> )
          this.container.append ( target )

          // https://github.com/LorDOniX/json-viewer/blob/master/src/json-viewer.js
          this.container.append ( <pre>{ JSON.stringify ( skill, null, 3 ) }</pre> )
     }
}

define ( SkillViewer, {
     context: "concept-ui",
     type   : "skill-viewer",
     id     : undefined,
})
