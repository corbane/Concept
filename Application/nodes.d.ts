/// <reference path="../Data/index.ts" />

//export as namespace global

type $AllEntities = $Person
                  | $Skill

interface $Thing extends $Node
{
     context: "concept-data"
}

interface $Ref extends $Node
{
     context: "concept-data-ref"
}

interface $Group extends $Thing
{
     context: "concept-data"

     items: $Thing []
}


interface $Person extends $Thing
{
     type     : "person"
     firstName: string
     lastName : string
     avatar   : string
     isCaptain: boolean
}

interface $Skill extends $Group
{
     type: "skill"
     description?: string
     icon: any
     medias?: any []
}

interface $Badge extends $Thing
{
     type: "badge"
     emoji?: string
}
