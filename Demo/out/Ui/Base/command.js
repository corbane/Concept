import { uEvent } from "../../Lib/index.js";
export class Commands {
    constructor() {
        this.db = {};
        this.events = {};
    }
    static get current() { return current; }
    add(name, callback) {
        if (name in this.db)
            return;
        this.db[name] = callback;
    }
    has(key) {
        return key in this.db;
    }
    run(name, ...args) {
        if (name in this.db) {
            this.db[name](...args);
            if (name in this.events)
                this.events[name].dispatch();
        }
    }
    on(name, callback) {
        const callbacks = name in this.events
            ? this.events[name]
            : this.events[name] = uEvent.create();
        callbacks(callback);
    }
    remove(key) {
        delete this.db[key];
    }
}
const current = new Commands();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL1VpL0Jhc2UvY29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFZM0MsTUFBTSxPQUFPLFFBQVE7SUFVaEI7UUFIUyxPQUFFLEdBQUcsRUFBVSxDQUFBO1FBQ2YsV0FBTSxHQUFHLEVBQW9DLENBQUE7SUFFdEMsQ0FBQztJQUxqQixNQUFNLEtBQUssT0FBTyxLQUFNLE9BQU8sT0FBTyxDQUFBLENBQUMsQ0FBQztJQU94QyxHQUFHLENBQXNCLElBQU8sRUFBRSxRQUFrQjtRQUUvQyxJQUFLLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRTtZQUNmLE9BQU07UUFFTixJQUFJLENBQUMsRUFBRSxDQUFFLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQTtJQUNuQyxDQUFDO0lBRUQsR0FBRyxDQUFHLEdBQVc7UUFFWixPQUFPLEdBQUcsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFBO0lBQzFCLENBQUM7SUFFRCxHQUFHLENBQXNCLElBQU8sRUFBRSxHQUFJLElBQTJCO1FBRTVELElBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQ3BCO1lBQ0ssSUFBSSxDQUFDLEVBQUUsQ0FBRSxJQUFJLENBQUMsQ0FBRyxHQUFJLElBQVcsQ0FBRSxDQUFBO1lBRWxDLElBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNO2dCQUNuQixJQUFJLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRyxDQUFBO1NBQ3ZDO0lBQ04sQ0FBQztJQUVELEVBQUUsQ0FBRyxJQUFZLEVBQUUsUUFBb0I7UUFFbEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNO1lBQ2pCLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQztZQUNwQixDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFHLENBQUE7UUFFM0QsU0FBUyxDQUFHLFFBQVEsQ0FBRSxDQUFBO0lBQzNCLENBQUM7SUFFRCxNQUFNLENBQUcsR0FBVztRQUVmLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBRSxHQUFHLENBQUMsQ0FBQTtJQUN6QixDQUFDO0NBQ0w7QUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLFFBQVEsRUFBRyxDQUFBIn0=