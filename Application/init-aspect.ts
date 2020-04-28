import { data }    from "@api/data"
import { command } from "@api/command"
import { get, define, set, Shape, Group, Badge } from "@aspect"

define ( Shape, "person" )
define ( Group, "skill" )
define ( Badge, "badge" )

set <$Shape> ({
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

set <$Shape> ({
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
          const node = data <$Badge> ( "badge", skill.icon )
          const badge = get <Badge> ( node )

          badge.attach ( aspect )
     },

     onTouch ( shape )
     {
          command ( "open-infos-panel" ).run ()
     },

     onDelete: undefined
})

set <$Shape> ({
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
