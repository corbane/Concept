/// <reference path="../Data/index.ts" />
import { Factory, Database } from "../Data/index.js";
const CONTEXT = "concept-ui";
const db = new Database();
const factory = new Factory(db);
export const inStock = function () {
    const arg = arguments.length == 1
        ? normalize(arguments[0])
        : normalize([...arguments]);
    const path = factory.getPath(arg);
    return factory._inStock(path);
};
export const pick = function (...rest) {
    const arg = arguments.length == 1
        ? normalize(arguments[0])
        : normalize([...arguments]);
    const path = factory.getPath(arg);
    return factory._pick(path);
};
export const make = function () {
    const arg = arguments.length == 1
        ? normalize(arguments[0])
        : normalize([...arguments]);
    const path = factory.getPath(arg);
    if (isNode(arg))
        var data = arg;
    return factory._make(path, data);
};
export const set = function () {
    const arg = normalize(arguments[0]);
    if (arguments.length == 1)
        db.set(arg);
    else
        db.set(arg, normalize(arguments[1]));
};
export const define = function (ctor, ...rest) {
    const arg = rest.length == 1
        ? normalize(rest[0])
        : normalize([...rest]);
    const path = factory.getPath(arg);
    factory._define(ctor, path);
};
function isNode(obl) {
    return typeof obl == "object" && !Array.isArray(obl);
}
function normalize(arg) {
    if (Array.isArray(arg)) {
        if (arg[0] !== CONTEXT)
            arg.unshift(CONTEXT);
    }
    else if (typeof arg == "object") {
        if ("context" in arg) {
            if (arg.context !== CONTEXT)
                throw "Bad context value";
        }
        else {
            arg.context = CONTEXT;
        }
    }
    return arg;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9VaS9kYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx5Q0FBeUM7QUFFekMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQTtBQUdwRCxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUE7QUFDNUIsTUFBTSxFQUFFLEdBQVEsSUFBSSxRQUFRLEVBQW9CLENBQUE7QUFDaEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQStCLEVBQUUsQ0FBRSxDQUFBO0FBRTlELE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBMkI7SUFFMUMsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxTQUFTLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFFO1FBQzdCLENBQUMsQ0FBQyxTQUFTLENBQUcsQ0FBQyxHQUFJLFNBQVMsQ0FBQyxDQUFFLENBQUE7SUFFekMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBRyxHQUFHLENBQUUsQ0FBQTtJQUVwQyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUcsSUFBSSxDQUFFLENBQUE7QUFDckMsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUF3QixVQUFXLEdBQUksSUFBWTtJQUUvRCxNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7UUFDdkIsQ0FBQyxDQUFDLFNBQVMsQ0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUU7UUFDN0IsQ0FBQyxDQUFDLFNBQVMsQ0FBRyxDQUFDLEdBQUksU0FBUyxDQUFDLENBQUUsQ0FBQTtJQUV6QyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFHLEdBQUcsQ0FBRSxDQUFBO0lBRXBDLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBRyxJQUFJLENBQUUsQ0FBQTtBQUNsQyxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQXdCO0lBRXBDLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztRQUN2QixDQUFDLENBQUMsU0FBUyxDQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBRTtRQUM3QixDQUFDLENBQUMsU0FBUyxDQUFHLENBQUMsR0FBSSxTQUFTLENBQUMsQ0FBRSxDQUFBO0lBRXpDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUcsR0FBRyxDQUFFLENBQUE7SUFFcEMsSUFBSyxNQUFNLENBQUcsR0FBRyxDQUFFO1FBQ2QsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFBO0lBRW5CLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFFLENBQUE7QUFDeEMsQ0FBQyxDQUFBO0FBRUQsTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFrQjtJQUU3QixNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFFLENBQUE7SUFFdkMsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7UUFDckIsRUFBRSxDQUFDLEdBQUcsQ0FBRyxHQUFHLENBQUUsQ0FBQTs7UUFFZCxFQUFFLENBQUMsR0FBRyxDQUFHLEdBQUcsRUFBRSxTQUFTLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFFLENBQUUsQ0FBQTtBQUNyRCxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxNQUFNLEdBQTBCLFVBQVcsSUFBUyxFQUFFLEdBQUksSUFBUztJQUUzRSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUM7UUFDbEIsQ0FBQyxDQUFDLFNBQVMsQ0FBRyxJQUFJLENBQUUsQ0FBQyxDQUFDLENBQUU7UUFDeEIsQ0FBQyxDQUFDLFNBQVMsQ0FBRyxDQUFDLEdBQUksSUFBSSxDQUFDLENBQUUsQ0FBQTtJQUVwQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFHLEdBQUcsQ0FBRSxDQUFBO0lBRXBDLE9BQU8sQ0FBQyxPQUFPLENBQUcsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFBO0FBQ25DLENBQUMsQ0FBQTtBQUdELFNBQVMsTUFBTSxDQUFHLEdBQVE7SUFFckIsT0FBTyxPQUFPLEdBQUcsSUFBSSxRQUFRLElBQUksQ0FBRSxLQUFLLENBQUMsT0FBTyxDQUFFLEdBQUcsQ0FBQyxDQUFBO0FBQzNELENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBRyxHQUFRO0lBRXhCLElBQUssS0FBSyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUMsRUFDeEI7UUFDSyxJQUFLLEdBQUcsQ0FBRSxDQUFDLENBQUMsS0FBSyxPQUFPO1lBQ25CLEdBQUcsQ0FBQyxPQUFPLENBQUcsT0FBTyxDQUFFLENBQUE7S0FDaEM7U0FDSSxJQUFLLE9BQU8sR0FBRyxJQUFJLFFBQVEsRUFDaEM7UUFDSyxJQUFLLFNBQVMsSUFBSSxHQUFHLEVBQ3JCO1lBQ0ssSUFBSyxHQUFHLENBQUMsT0FBTyxLQUFLLE9BQU87Z0JBQ3ZCLE1BQU0sbUJBQW1CLENBQUE7U0FDbEM7YUFFRDtZQUNNLEdBQVcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1NBQ2xDO0tBQ0w7SUFFRCxPQUFPLEdBQUcsQ0FBQTtBQUNmLENBQUMifQ==