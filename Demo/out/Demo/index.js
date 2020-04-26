/// <reference types="faker" />
import * as app from "../Application/index.js";
const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const area = app.area;
const view = area.createView("compétances");
area.use(view);
// Person
const personNames = [];
for (var i = 1; i <= 20; i++) {
    app.setData({
        type: "person",
        id: "user" + i,
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        avatar: `./avatars/f (${i}).jpg`,
        isCaptain: randomInt(0, 4) == 1 //i % 4 == 0,
    });
    app.setData({
        type: "person",
        id: "user" + (20 + i),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        avatar: `./avatars/h (${i}).jpg`,
        isCaptain: randomInt(0, 4) == 1 // (20 + i) % 4 == 0,
    });
    personNames.push("user" + i, "user" + (20 + i));
    // area.add ( "person", "user" + i )
    // area.add ( "person", "user" + (i + 20) )
}
// Badges
// https://drive.google.com/drive/folders/1KwWl9G_A8v91NLXApjZGHCfnx_mnfME4
// https://reconnaitre.openrecognition.org/ressources/
// https://www.letudiant.fr/educpros/actualite/les-open-badges-un-complement-aux-diplomes-universitaires.html
// https://www.echosciences-normandie.fr/communautes/le-dome/articles/badge-dome
const badgePresets = {
    default: { id: "default", emoji: "🦁" },
    hat: { id: "hat", emoji: "🎩" },
    star: { id: "star", emoji: "⭐" },
    clothes: { id: "clothes", emoji: "👕" },
    ecology: { id: "ecology", emoji: "💧" },
    programming: { id: "programming", emoji: "💾" },
    communication: { id: "communication", emoji: "📢" },
    construction: { id: "construction", emoji: "🔨" },
    biology: { id: "biology", emoji: "🔬" },
    robotic: { id: "robotic", emoji: "🤖" },
    game: { id: "game", emoji: "🤡" },
    music: { id: "music", emoji: "🥁" },
    lion: { id: "lion", emoji: "🦁" },
    voltage: { id: "voltage", emoji: "⚡" },
};
for (const name in badgePresets)
    app.setData(Object.assign({ context: "concept-data", type: "badge" }, badgePresets[name]));
// Skills
for (const name in badgePresets) {
    const people = [];
    for (var j = randomInt(0, 6); j > 0; j--) {
        const name = personNames.splice(randomInt(1, personNames.length), 1)[0];
        if (name)
            people.push(app.getData("person", name));
    }
    app.setData({
        context: "concept-data",
        type: "skill",
        id: name,
        icon: name,
        items: people
    });
}
//
for (const name in badgePresets)
    area.add("skill", name);
// Notes
// const note =  new B.Note ({
//      text: "A note ...",
// })
// area.add ( Aspect.create ( note ) )
area.pack();
area.zoom();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrQkFBK0I7QUFHL0IsT0FBTyxLQUFLLEdBQUcsTUFBTSx5QkFBeUIsQ0FBQTtBQUU5QyxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsRUFBRTtJQUUxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUM5RCxDQUFDLENBQUE7QUFFRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFBO0FBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUcsYUFBYSxDQUFFLENBQUE7QUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUUsQ0FBQTtBQUVqQixTQUFTO0FBRVQsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFBO0FBQ3RCLEtBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsSUFBSSxFQUFFLEVBQUcsQ0FBQyxFQUFFLEVBQy9CO0lBQ0ssR0FBRyxDQUFDLE9BQU8sQ0FBWTtRQUNsQixJQUFJLEVBQU8sUUFBUTtRQUNuQixFQUFFLEVBQVMsTUFBTSxHQUFHLENBQUM7UUFDckIsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFHO1FBQ2xDLFFBQVEsRUFBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRztRQUNqQyxNQUFNLEVBQUssZ0JBQWdCLENBQUMsT0FBTztRQUNuQyxTQUFTLEVBQUUsU0FBUyxDQUFFLENBQUMsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsYUFBYTtLQUNqRCxDQUFDLENBQUE7SUFFRixHQUFHLENBQUMsT0FBTyxDQUFZO1FBQ2xCLElBQUksRUFB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