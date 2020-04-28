/// <reference types="faker" />
declare const faker: Faker.FakerStatic

import * as app from "@app"
import { data, alias } from "@api"

const randomInt = (min: number, max: number) =>
{
     return Math.floor(Math.random() * (max - min + 1)) + min;
}

const area = app.area
const view = area.createView ( "compétances" )
area.use ( view )

const person = alias <$Person> ( data, "person" )
const badge  = alias <$Badge>  ( data, "badge" )
const skill  = alias <$Skill>  ( data, "skill" )

// Ici on ajoute des personnes à l’application.

const personNames = []
for ( var i = 1 ; i <= 20 ; i++ )
{
     person ({
          id       : "user" + i,
          firstName: faker.name.firstName (),
          lastName : faker.name.lastName (),
          avatar   : `./avatars/f (${i}).jpg`,
          isCaptain: randomInt (0,4) == 1 //i % 4 == 0,
     })

     person ({
          id       : "user" + (20 + i),
          firstName: faker.name.firstName (),
          lastName : faker.name.lastName (),
          avatar   : `./avatars/h (${i}).jpg`,
          isCaptain: randomInt (0,4) == 1 // (20 + i) % 4 == 0,
     })

     personNames.push ( "user" + i, "user" + (20 + i) )

     // area.add ( "person", "user" + i )
     // area.add ( "person", "user" + (i + 20) )
}

// Badges

// https://drive.google.com/drive/folders/1KwWl9G_A8v91NLXApjZGHCfnx_mnfME4
// https://reconnaitre.openrecognition.org/ressources/
// https://www.letudiant.fr/educpros/actualite/les-open-badges-un-complement-aux-diplomes-universitaires.html

// https://www.echosciences-normandie.fr/communautes/le-dome/articles/badge-dome

const badges = [
     badge ( "default"      , { emoji: "🦁" } ),
     badge ( "hat"          , { emoji: "🎩" } ),
     badge ( "star"         , { emoji: "⭐" } ),
     badge ( "clothes"      , { emoji: "👕" } ),
     badge ( "ecology"      , { emoji: "💧" } ),
     badge ( "programming"  , { emoji: "💾" } ),
     badge ( "communication", { emoji: "📢" } ),
     badge ( "construction" , { emoji: "🔨" } ),
     badge ( "biology"      , { emoji: "🔬" } ),
     badge ( "robotic"      , { emoji: "🤖" } ),
     badge ( "game"         , { emoji: "🤡" } ),
     badge ( "music"        , { emoji: "🥁" } ),
     badge ( "lion"         , { emoji: "🦁" } ),
     badge ( "voltage"      , { emoji: "⚡" } )
]

// Skills

//for ( const name in badgePresets )
for ( const badge of badges )
{
     const people = [] as $Person []

     for ( var j = randomInt ( 0, 6 ) ; j > 0 ; j-- )
     {
          const name = personNames.splice ( randomInt ( 1, personNames.length ), 1 ) [0]
          if ( name )
               people.push ( data <$Person> ( "person", name ) )
     }

     skill ({
          id     : badge.id,
          icon   : badge.id,
          items  : people
     })

}

//

for ( const badge of badges )
     area.add ( "skill", badge.id )

// Notes

// const note =  new B.Note ({
//      text: "A note ...",
// })
// area.add ( Aspect.create ( note ) )


area.pack ()
area.zoom ()


// Cluster -----------------------------------------------------------------
//
// const t1 = new fabric.Textbox ( "Editable ?", {
//      top: 50,
//      left: 300,
//      fontSize: 30,
//      selectable: true,
//      editable: true,
//      originX: "center",
//      originY: "center",
// })
// const r1 = new fabric.Rect ({
//      top   : 0,
//      left  : 300,
//      width : 50,
//      height: 50,
//      fill  : "blue",
//      selectable: true,
//      originX: "center",
//      originY: "center",
// })
// $app._layout.area.add (t1)
// $app._layout.area.add (r1)
// t1["cluster"] = [ r1 ]
// r1["cluster"] = [ t1 ]

