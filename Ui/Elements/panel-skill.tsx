
import { xnode } from "../Base/xnode"
import { define } from "../db"
import { Panel } from "./panel"
import * as db from "@api/data"


declare global
{
     interface $SkillViewer extends $Panel
     {
          type: "skill-viewer"
     }
}

export class SkillViewer extends Panel <$SkillViewer>
{
     display ( skill: $Skill )
     {
          const target = <div class="people"></div>

          for ( const item of skill.items )
          {
               const person = db.data <$Person> ( item.type, item.id )

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
     context : CONTEXT_UI,
     type    : "skill-viewer",
     id      : undefined,
     position: "left",
     button: null
})
