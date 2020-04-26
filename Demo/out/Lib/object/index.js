export * from "./configurable.js";
export * from "./observable.js";
export function deepAssign(obj1, obj2) {
    const isArray = Array.isArray;
    const descriptors = Object.getOwnPropertyDescriptors(obj2);
    for (const name in descriptors) {
        const prop = descriptors[name];
        if (prop.enumerable === false)
            continue;
        const value = prop.value;
        if (value === null || isArray(value) || typeof prop.value !== "object")
            obj1[name] = value;
        else
            deepAssign(obj1[name] || (obj1[name] = {}), value);
    }
    return obj1;
}
export function assignOwnProperties(a, b) {
    for (let p in a)
        a[p] = b.hasOwnProperty(p) ? b[p] : a[p];
    return a;
}
export function copy(o) {
    return Object.assign({}, o);
}
export function deepCopy(obj) {
    // https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
    // https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/10916838#10916838
    return JSON.parse(JSON.stringify(obj));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9MaWIvb2JqZWN0L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLGNBQWMsbUJBQW1CLENBQUE7QUFDakMsY0FBYyxpQkFBaUIsQ0FBQTtBQUUvQixNQUFNLFVBQVUsVUFBVSxDQUFZLElBQVEsRUFBRSxJQUFRO0lBSW5ELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUE7SUFDN0IsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLHlCQUF5QixDQUFHLElBQUksQ0FBRSxDQUFBO0lBRTdELEtBQU0sTUFBTSxJQUFJLElBQUksV0FBVyxFQUMvQjtRQUNLLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBRSxJQUFJLENBQUMsQ0FBQTtRQUUvQixJQUFLLElBQUksQ0FBQyxVQUFVLEtBQUssS0FBSztZQUN6QixTQUFRO1FBRWIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtRQUV4QixJQUFLLEtBQUssS0FBSyxJQUFJLElBQUksT0FBTyxDQUFFLEtBQUssQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxRQUFRO1lBQ25FLElBQUksQ0FBRSxJQUFTLENBQUMsR0FBRyxLQUFLLENBQUE7O1lBRXhCLFVBQVUsQ0FBRyxJQUFJLENBQUUsSUFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsSUFBUyxDQUFDLEdBQUcsRUFBVyxDQUFDLEVBQUUsS0FBSyxDQUFFLENBQUE7S0FDbkY7SUFFRCxPQUFPLElBQWUsQ0FBQTtBQUMzQixDQUFDO0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFPLENBQUksRUFBRSxDQUFNO0lBRWpELEtBQU0sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNYLENBQUMsQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFHLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtJQUVuRCxPQUFPLENBQUMsQ0FBQTtBQUNiLENBQUM7QUFFRCxNQUFNLFVBQVUsSUFBSSxDQUFPLENBQUk7SUFFMUIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFHLEVBQUUsRUFBRSxDQUFDLENBQUUsQ0FBQTtBQUNuQyxDQUFDO0FBRUQsTUFBTSxVQUFVLFFBQVEsQ0FBTyxHQUFNO0lBRWhDLGtIQUFrSDtJQUNsSCxvSUFBb0k7SUFDcEksT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFHLElBQUksQ0FBQyxTQUFTLENBQUcsR0FBRyxDQUFFLENBQUUsQ0FBQTtBQUNqRCxDQUFDIn0=