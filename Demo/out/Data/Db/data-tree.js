export class DataTree {
    constructor() {
        this.records = {};
    }
    has(path) {
        var rec = this.records;
        var count = 0;
        for (const k of path) {
            count++;
            if (k in rec) {
                if (k === undefined)
                    break;
                rec = rec[k];
            }
            else {
                return false;
            }
        }
        return path.length == count;
    }
    count(path) {
        var rec = this.records;
        for (const k of path) {
            if (k === undefined)
                break;
            if (k in rec)
                rec = rec[k];
            else
                return 0;
        }
        //@ts-ignore
        return undefined in rec
            ? Object.keys(rec).length - 1
            : Object.keys(rec).length;
    }
    set(path, data) {
        const und = undefined;
        var rec = this.records;
        for (const k of path) {
            if (k === undefined)
                break;
            if (k in rec)
                rec = rec[k];
            else
                rec = rec[k] = {};
        }
        return rec[und] = data;
    }
    get(path) {
        const und = undefined;
        var rec = this.records;
        for (const k of path) {
            if (k === undefined)
                break;
            if (k in rec)
                rec = rec[k];
            else
                break;
        }
        return rec[und];
    }
    near(path) {
        var rec = this.records;
        const und = undefined;
        for (const k of path) {
            if (k === undefined)
                break;
            if (k in rec)
                rec = rec[k];
            else
                break;
        }
        return rec[und];
    }
    walk(path, cb) {
        var rec = this.records;
        const und = undefined;
        for (const k of path) {
            if (und in rec)
                cb(rec[und]);
            if (k === undefined)
                break;
            if (k in rec)
                rec = rec[k];
            else
                break;
        }
        if (und in rec)
            cb(rec[und]);
        return;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS10cmVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vRGF0YS9EYi9kYXRhLXRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTUEsTUFBTSxPQUFPLFFBQVE7SUFBckI7UUFFSyxZQUFPLEdBQUcsRUFNVCxDQUFBO0lBa0lOLENBQUM7SUFoSUksR0FBRyxDQUFHLElBQVU7UUFFWCxJQUFNLEdBQUcsR0FBSSxJQUFJLENBQUMsT0FBYyxDQUFBO1FBQ2hDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUViLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxFQUNyQjtZQUNLLEtBQUssRUFBRyxDQUFBO1lBRVIsSUFBSyxDQUFDLElBQUksR0FBRyxFQUNiO2dCQUNLLElBQUssQ0FBQyxLQUFLLFNBQVM7b0JBQ2YsTUFBSztnQkFFVixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFBO2FBQ2pCO2lCQUVEO2dCQUNLLE9BQU8sS0FBSyxDQUFBO2FBQ2hCO1NBQ0w7UUFFRCxPQUFPLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFBO0lBQ2hDLENBQUM7SUFFRCxLQUFLLENBQUcsSUFBVTtRQUViLElBQUssR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFjLENBQUE7UUFFOUIsS0FBTSxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQ3JCO1lBQ0ssSUFBSyxDQUFDLEtBQUssU0FBUztnQkFDZixNQUFLO1lBRVYsSUFBSyxDQUFDLElBQUksR0FBRztnQkFDUixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFBOztnQkFFYixPQUFPLENBQUMsQ0FBQTtTQUNqQjtRQUVELFlBQVk7UUFDWixPQUFPLFNBQVMsSUFBSSxHQUFHO1lBQ2xCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFHLEdBQUcsQ0FBRSxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFHLEdBQUcsQ0FBRSxDQUFDLE1BQU0sQ0FBQTtJQUV0QyxDQUFDO0lBRUQsR0FBRyxDQUFHLElBQVUsRUFBRSxJQUFPO1FBRXBCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQTtRQUNyQixJQUFNLEdBQUcsR0FBSSxJQUFJLENBQUMsT0FBYyxDQUFBO1FBRWhDLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxFQUNyQjtZQUNLLElBQUssQ0FBQyxLQUFLLFNBQVM7Z0JBQ2YsTUFBSztZQUVWLElBQUssQ0FBQyxJQUFJLEdBQUc7Z0JBQ1IsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQTs7Z0JBRWIsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7U0FDM0I7UUFFRCxPQUFPLEdBQUcsQ0FBRSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUE7SUFDNUIsQ0FBQztJQUVELEdBQUcsQ0FBRyxJQUFVO1FBRVgsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFBO1FBQ3JCLElBQU0sR0FBRyxHQUFJLElBQUksQ0FBQyxPQUFjLENBQUE7UUFFaEMsS0FBTSxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQ3JCO1lBQ0ssSUFBSyxDQUFDLEtBQUssU0FBUztnQkFDZixNQUFLO1lBRVYsSUFBSyxDQUFDLElBQUksR0FBRztnQkFDUixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFBOztnQkFFYixNQUFLO1NBQ2Q7UUFFRCxPQUFPLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBQTtJQUNyQixDQUFDO0lBRUQsSUFBSSxDQUFHLElBQVU7UUFFWixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBYyxDQUFBO1FBQzdCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQTtRQUVyQixLQUFNLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFDckI7WUFDSyxJQUFLLENBQUMsS0FBSyxTQUFTO2dCQUNmLE1BQUs7WUFFVixJQUFLLENBQUMsSUFBSSxHQUFHO2dCQUNSLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUE7O2dCQUViLE1BQUs7U0FDZDtRQUVELE9BQU8sR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQ3JCLENBQUM7SUFFRCxJQUFJLENBQUcsSUFBVSxFQUFFLEVBQXVCO1FBRXJDLElBQU0sR0FBRyxHQUFJLElBQUksQ0FBQyxPQUFjLENBQUE7UUFDaEMsTUFBTSxHQUFHLEdBQUksU0FBUyxDQUFBO1FBRXRCLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxFQUNyQjtZQUNLLElBQUssR0FBRyxJQUFJLEdBQUc7Z0JBQ1YsRUFBRSxDQUFHLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBRSxDQUFBO1lBRXJCLElBQUssQ0FBQyxLQUFLLFNBQVM7Z0JBQ2YsTUFBSztZQUVWLElBQUssQ0FBQyxJQUFJLEdBQUc7Z0JBQ1IsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQTs7Z0JBRWIsTUFBSztTQUNkO1FBRUQsSUFBSyxHQUFHLElBQUksR0FBRztZQUNWLEVBQUUsQ0FBRyxHQUFHLENBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQTtRQUVyQixPQUFNO0lBQ1gsQ0FBQztDQUNMIn0=