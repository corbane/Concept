import { runCommand } from "./command.js";
const db = {};
export function addButton(name, definition) {
    Object.assign(definition, {
        id: name,
        callback: () => { runCommand(definition.command); },
    });
    if (name in db)
        throw "The button definition already exists";
    db[name] = definition;
}
export function getButton(name) {
    const def = db[name];
    if (def == undefined)
        return {};
    return Object.assign({}, def);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQXBwbGljYXRpb24vYnV0dG9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBZ0IsVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFBO0FBYXZELE1BQU0sRUFBRSxHQUFHLEVBQXVDLENBQUE7QUFFbEQsTUFBTSxVQUFVLFNBQVMsQ0FBRyxJQUFpQixFQUFFLFVBQXlCO0lBRW5FLE1BQU0sQ0FBQyxNQUFNLENBQUcsVUFBVSxFQUFFO1FBQ3ZCLEVBQUUsRUFBRSxJQUFJO1FBQ1IsUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLFVBQVUsQ0FBRyxVQUFVLENBQUMsT0FBTyxDQUFFLENBQUEsQ0FBQyxDQUFDO0tBQ3JDLENBQUUsQ0FBQTtJQUV2QixJQUFLLElBQUksSUFBSSxFQUFFO1FBQ1YsTUFBTSxzQ0FBc0MsQ0FBQTtJQUVqRCxFQUFFLENBQUUsSUFBSSxDQUFDLEdBQUcsVUFBOEIsQ0FBQTtBQUMvQyxDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBRyxJQUFpQjtJQUV4QyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUUsSUFBSSxDQUFDLENBQUE7SUFFckIsSUFBSyxHQUFHLElBQUksU0FBUztRQUNoQixPQUFPLEVBQUUsQ0FBQTtJQUVkLHlCQUNTLEdBQUcsRUFDWDtBQUNOLENBQUMifQ==