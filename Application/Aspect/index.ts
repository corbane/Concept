

export { defineAspect, getAspect, setAspect } from "./db.js"

export { Geometry, $Geometry } from "./Geometry/geometry.js"
export { Shape, $Shape, $ShapeEvents } from "./Element/shape.js"
export { Note }      from "./Element/note.js"
export { Badge }     from "./Element/badge.js"
export { Container } from "./Element/group.js"


import { getData} from "../Data/db.js"
import { getAspect, defineAspect, setAspect } from "./db.js"
import { Shape } from "./Element/shape.js"
import { $Shape } from "./Element/shape.js"
import { Container } from "./Element/group.js"
import { Badge }     from "./Element/badge.js"

import { runCommand } from "../command.js"

defineAspect ( Shape    , "person" /* , { onCreate: () => ..., onTouch: () => ... } */ )
defineAspect ( Container, "skill" )
defineAspect ( Badge    , "badge" )

setAspect <$Shape> ({
     type   : "person",
     id     : undefined,

     data   : undefined,

     shape  : "circle",

     x: 0,
     y: 0,

     minSize    : 30,
     sizeFactor: 1,
     sizeOffset: 0,

     borderColor     : "#00c0aa",
     borderWidth     : 4,
     backgroundColor : "transparent",
     backgroundImage : undefined,
     backgroundRepeat: false,

     onCreate   : ( person: $Person, aspect ) =>
     {
          aspect.setBackground ({
               backgroundImage: person.avatar,
               shape: person.isCaptain ? "square" : "circle",
          } as any)
     },
     onDelete: undefined,
     onTouch: undefined,
})

setAspect <$Shape> ({
     type   : "skill",
     id     : undefined,

     data: undefined,

     shape: "circle",
     x: 0,
     y: 0,

     borderColor     : "#f1bc31",
     borderWidth     : 8,
     backgroundColor : "#FFFFFF",
     backgroundImage : undefined,
     backgroundRepeat: false,
     minSize         : 50,
     sizeOffset      : 10,
     sizeFactor      : 1,

     onCreate ( skill: $Skill, aspect )
     {
          const data = getData ({
               type: "badge",
               id  : skill.icon,
          })

          const badge = getAspect <Badge> ( data )

          //badge.init ()
          badge.attach ( aspect )
     },

     onTouch ( shape )
     {
          const skill = getData <$Skill> ({
               type: shape.config.type,
               id  : shape.config.id
          })

          runCommand ( "open-infos-panel", skill )
     },

     onDelete: undefined
})

setAspect <$Shape> ({
     type   : "badge",
     id     : undefined,

     data: undefined,

     x         : 0,
     y         : 0,
     minSize   : 1,
     sizeFactor: 1,
     sizeOffset: 0,

     shape           : "circle",
     borderColor     : "gray",
     borderWidth     : 0,

     backgroundColor : "transparent",
     backgroundImage : undefined,
     backgroundRepeat: false,

     onCreate        : undefined,
     onDelete        : undefined,
     onTouch         : undefined,
})
