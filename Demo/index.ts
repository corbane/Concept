/// <reference types="faker" />
declare const faker: Faker.FakerStatic

import * as app from "../Application/index.js"

const randomInt = (min: number, max: number) =>
{
     return Math.floor(Math.random() * (max - min + 1)) + min;
}

const area = app.area
const view = area.createView ( "compétances" )
area.use ( view )

// Ici on ajoute des personnes à l’application.

const personNames = []
for ( var i = 1 ; i <= 20 ; i++ )
{
     app.setNode <$Person> ({
          type     : "person",
          id       : "user" + i,
          firstName: faker.name.firstName (),
          lastName : faker.name.lastName (),
          avatar   : `./avatars/f (${i}).jpg`,
          isCaptain: randomInt (0,4) == 1 //i % 4 == 0,
     })

     app.setNode <$Person> ({
          type     : "person",
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

const badgePresets = { // Partial <$Badge>
     default       : { id: "default"      , emoji: "🦁" },
     hat           : { id: "hat"          , emoji: "🎩" },
     star          : { id: "star"         , emoji: "⭐" },
     clothes       : { id: "clothes"      , emoji: "👕" },
     ecology       : { id: "ecology"      , emoji: "💧" },
     programming   : { id: "programming"  , emoji: "💾" },
     communication : { id: "communication", emoji: "📢" },
     construction  : { id: "construction" , emoji: "🔨" },
     biology       : { id: "biology"      , emoji: "🔬" },
     robotic       : { id: "robotic"      , emoji: "🤖" },
     game          : { id: "game"         , emoji: "🤡" },
     music         : { id: "music"        , emoji: "🥁" },
     lion          : { id: "lion"         , emoji: "🦁" },
     voltage       : { id: "voltage"      , emoji: "⚡" },
}

for ( const name in badgePresets )
     app.setNode ({ context: "concept-data", type: "badge", ... badgePresets [name] })

// Skills

for ( const name in badgePresets )
{
     const people = [] as $Person []

     for ( var j = randomInt ( 0, 6 ) ; j > 0 ; j-- )
     {
          const name = personNames.splice ( randomInt ( 1, personNames.length ), 1 ) [0]

          if ( name )
               people.push ( app.getNode <$Person> ( "person", name ) )
     }

     app.setNode <$Skill> ({
          context: "concept-data",
          type   : "skill",
          id     : name,
          icon   : name,
          items  : people
     })

}

//

for ( const name in badgePresets )
     area.add ( "skill", name )

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

