import { create as createEvent } from "./event.js";
//export function create <T extends ICollectionItem> (): ICollection <T>
export function create() {
    const self = {};
    const registry = {};
    var length = 0;
    const onItemsAdded = self.onItemsAdded = createEvent();
    const onItemsRemoved = self.onItemsRemoved = createEvent();
    self.count = () => length;
    self.add = (...args) => {
        const added = [];
        for (const arg of args) {
            const key = arg.key;
            if (typeof key != "string" || key.length == 0)
                throw "ICollection; Invalid item key: " + arg.toString();
            if (self.has(key))
                continue;
            registry[arg.key] = arg;
            length++;
            added.push(arg);
        }
        onItemsAdded.dispatch(added);
        return self;
    };
    self.has = (item) => {
        const key = typeof item == "string" || typeof item == "number" ? item : item.key;
        return registry[key] != undefined;
    };
    self.get = (key) => {
        if (typeof key == "number") {
            key = Object.keys(registry)[key];
        }
        const item = registry[key];
        if (item)
            return item;
        return undefined;
    };
    self.remove = (...items) => {
        const removed = [];
        for (const item of items) {
            const key = typeof item == "string" || typeof item == "number" ? item : item.key;
            if (self.has(key)) {
                removed.push(registry[key]);
                delete registry[key];
                length--;
            }
        }
        onItemsRemoved.dispatch(removed);
        return self;
    };
    self.clear = () => {
        const removed = Object.values(registry);
        for (const key in registry)
            delete registry[key];
        length = 0;
        onItemsRemoved.dispatch(removed);
        return self;
    };
    self[Symbol.iterator] = function* () {
        for (const key in registry)
            yield registry[key];
    };
    return self;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0xpYi9jb2xsZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxNQUFNLElBQUksV0FBVyxFQUFVLE1BQU0sWUFBWSxDQUFBO0FBdUIxRCx3RUFBd0U7QUFFeEUsTUFBTSxVQUFVLE1BQU07SUFFbEIsTUFBTSxJQUFJLEdBQU8sRUFBcUIsQ0FBQTtJQUN0QyxNQUFNLFFBQVEsR0FBRyxFQUFnQyxDQUFBO0lBQ2pELElBQU0sTUFBTSxHQUFLLENBQUMsQ0FBQTtJQUVsQixNQUFNLFlBQVksR0FBSyxJQUFJLENBQUMsWUFBWSxHQUFLLFdBQVcsRUFBNkIsQ0FBQTtJQUNyRixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLFdBQVcsRUFBNkIsQ0FBQTtJQUVyRixJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQTtJQUV6QixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUUsR0FBSSxJQUFJLEVBQUcsRUFBRTtRQUV0QixNQUFNLEtBQUssR0FBRyxFQUFVLENBQUE7UUFFeEIsS0FBTSxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQ3ZCO1lBQ0ksTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQTtZQUVuQixJQUFLLE9BQU8sR0FBRyxJQUFJLFFBQVEsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQzFDLE1BQU0saUNBQWlDLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRyxDQUFBO1lBRTdELElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBRyxHQUFHLENBQUU7Z0JBQ2pCLFNBQVE7WUFFWixRQUFRLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBRSxHQUFHLEdBQUcsQ0FBQTtZQUN6QixNQUFNLEVBQUUsQ0FBQTtZQUNSLEtBQUssQ0FBQyxJQUFJLENBQUcsR0FBRyxDQUFFLENBQUE7U0FDckI7UUFFRCxZQUFZLENBQUMsUUFBUSxDQUFHLEtBQUssQ0FBRSxDQUFBO1FBQy9CLE9BQU8sSUFBSSxDQUFBO0lBQ2YsQ0FBQyxDQUFBO0lBR0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFFLElBQUksRUFBRyxFQUFFO1FBRWxCLE1BQU0sR0FBRyxHQUFHLE9BQU8sSUFBSSxJQUFJLFFBQVEsSUFBSSxPQUFPLElBQUksSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQTtRQUNoRixPQUFPLFFBQVEsQ0FBRSxHQUFHLENBQUUsSUFBSSxTQUFTLENBQUE7SUFDdkMsQ0FBQyxDQUFBO0lBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFFLEdBQUcsRUFBRyxFQUFFO1FBRWpCLElBQUssT0FBTyxHQUFHLElBQUksUUFBUSxFQUMzQjtZQUNJLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFFLFFBQVEsQ0FBQyxDQUFFLEdBQUcsQ0FBQyxDQUFBO1NBQ3JDO1FBRUQsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFFLEdBQUcsQ0FBRSxDQUFBO1FBRTVCLElBQUssSUFBSTtZQUNMLE9BQU8sSUFBSSxDQUFBO1FBRWYsT0FBTyxTQUFTLENBQUE7SUFDcEIsQ0FBQyxDQUFBO0lBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFFLEdBQUksS0FBSyxFQUFHLEVBQUU7UUFFMUIsTUFBTSxPQUFPLEdBQUcsRUFBVSxDQUFBO1FBRTFCLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUN4QjtZQUNJLE1BQU0sR0FBRyxHQUFHLE9BQU8sSUFBSSxJQUFJLFFBQVEsSUFBSSxPQUFPLElBQUksSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQTtZQUVoRixJQUFLLElBQUksQ0FBQyxHQUFHLENBQUcsR0FBRyxDQUFFLEVBQ3JCO2dCQUNJLE9BQU8sQ0FBQyxJQUFJLENBQUcsUUFBUSxDQUFHLEdBQUcsQ0FBRSxDQUFFLENBQUE7Z0JBQ2pDLE9BQU8sUUFBUSxDQUFFLEdBQUcsQ0FBRSxDQUFBO2dCQUN0QixNQUFNLEVBQUUsQ0FBQTthQUNYO1NBQ0o7UUFFRCxjQUFjLENBQUMsUUFBUSxDQUFHLE9BQU8sQ0FBRSxDQUFBO1FBQ25DLE9BQU8sSUFBSSxDQUFBO0lBQ2YsQ0FBQyxDQUFBO0lBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUU7UUFFZCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFHLFFBQVEsQ0FBRSxDQUFBO1FBRTFDLEtBQU0sTUFBTSxHQUFHLElBQUksUUFBUTtZQUN2QixPQUFPLFFBQVEsQ0FBRSxHQUFHLENBQUUsQ0FBQTtRQUMxQixNQUFNLEdBQUcsQ0FBQyxDQUFBO1FBRVYsY0FBYyxDQUFDLFFBQVEsQ0FBRyxPQUFPLENBQUUsQ0FBQTtRQUNuQyxPQUFPLElBQUksQ0FBQTtJQUNmLENBQUMsQ0FBQTtJQUVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUyxDQUFDO1FBRTlCLEtBQU0sTUFBTSxHQUFHLElBQUksUUFBUTtZQUN2QixNQUFNLFFBQVEsQ0FBRSxHQUFHLENBQUUsQ0FBQTtJQUM3QixDQUFDLENBQUE7SUFFRCxPQUFPLElBQUksQ0FBQTtBQUNmLENBQUMifQ==