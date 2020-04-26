import * as uEvent from "../event.js";
export function configurable(obj, options, defaultConfig) {
    if (typeof obj.config == "function"
        && typeof obj.config.get == "function"
        && typeof obj.config.on == "function"
        && typeof obj.config.off == "function")
        return obj;
    const onPrp = {};
    var onNew = uEvent.create();
    var onDel = uEvent.create();
    var onDif = uEvent.create();
    var asNew = false;
    var asDif = false;
    var asDel = false;
    function set(key, value) {
        if (key in options) {
            const old = options[key];
            options[key] = value;
            if (key in onPrp)
                onPrp[key].dispatch(key, value, old);
            if (onDif)
                onDif.dispatch(key, value, old);
        }
        else {
            const old = defaultConfig[key];
            options[key] = value;
            if (key in onPrp)
                onPrp[key].dispatch(key, value, old);
            if (onNew)
                onNew.dispatch(key, value, old);
        }
    }
    function setAll(data) {
        const delk = Object.keys(options);
        const difk = [];
        const newk = [];
        for (const k in data) {
            const index = delk.indexOf(k);
            if (index < 0) {
                newk.push(k);
            }
            else {
                difk.push(k);
                delk.splice(index, 1);
            }
        }
        if (asDel)
            for (const k of delk) {
                const old = options[k];
                const val = defaultConfig[k];
                delete options[k];
                if (k in onPrp)
                    onPrp[k].dispatch(k, val, old);
                onDel.dispatch(k, val, old);
            }
        else
            for (const k of delk)
                if (k in onPrp) {
                    const old = options[k];
                    const val = defaultConfig[k];
                    delete options[k];
                    onPrp[k].dispatch(k, val, old);
                }
        if (asDif)
            for (const k of difk) {
                const old = options[k];
                const val = data[k];
                options[k] = val;
                if (k in onPrp)
                    onPrp[k].dispatch(k, val, old);
                onDif.dispatch(k, val, old);
            }
        else
            for (const k of difk)
                if (k in onPrp) {
                    const old = options[k];
                    const val = data[k];
                    options[k] = val;
                    onPrp[k].dispatch(k, val, old);
                }
        if (asNew)
            for (const k of newk) {
                const old = defaultConfig[k];
                const val = data[k];
                options[k] = val;
                if (k in onPrp)
                    onPrp[k].dispatch(k, val, old);
                onNew.dispatch(k, val, old);
            }
        else
            for (const k of newk)
                if (k in onPrp) {
                    const old = defaultConfig[k];
                    const val = data[k];
                    options[k] = val;
                    onPrp[k].dispatch(k, val, old);
                }
    }
    function self(k, v) {
        if (arguments.length == 0) {
            return Object.assign({}, defaultConfig, options);
        }
        if (arguments.length == 1) {
            if (typeof k == "string")
                return config.get(k);
            setAll(k);
            return;
        }
        set(k, v);
    }
    const config = self;
    config.set = (k, v) => {
        if (arguments.length == 1)
            setAll(k);
        else
            set(k, v);
    };
    config.get = (key) => {
        return key in options
            ? options[key]
            : defaultConfig[key];
    };
    config.on = (event, fn) => {
        if (event in defaultConfig) {
            if (onPrp[event] == undefined)
                onPrp[event] = uEvent.create();
            onPrp[event](fn);
        }
        else
            switch (event) {
                case "@new":
                    if (onNew == undefined)
                        onNew = uEvent.create();
                    onNew(fn);
                    asNew = true;
                    break;
                case "@change":
                    if (onDif == undefined)
                        onDif = uEvent.create();
                    onDif(fn);
                    asDif = true;
                    break;
                case "@delete":
                    if (onDel == undefined)
                        onDel = uEvent.create();
                    onDel(fn);
                    asDel = true;
                    break;
            }
    };
    config.off = (event, fn) => {
        if (event in defaultConfig) {
            const prp = onPrp[event];
            if (prp != undefined) {
                prp.remove(fn);
                if (prp.count() == 0)
                    delete onPrp[event];
            }
        }
        else
            switch (event) {
                case "@new":
                    if (onDel != undefined) {
                        onNew.remove(fn);
                        asNew = onNew.count() > 0;
                    }
                    break;
                case "@change":
                    if (onDel != undefined) {
                        onDif.remove(fn);
                        asDif = onDif.count() > 0;
                    }
                    break;
                case "@delete":
                    if (onDel != undefined) {
                        onDel.remove(fn);
                        asDel = onDel.count() > 0;
                    }
                    break;
            }
    };
    Object.defineProperty(obj, "config", {
        value: config,
        configurable: false,
        writable: false,
        enumerable: true,
    });
    return obj;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vTGliL29iamVjdC9jb25maWd1cmFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxhQUFhLENBQUE7QUF1QnJDLE1BQU0sVUFBVSxZQUFZLENBQVUsR0FBTSxFQUFFLE9BQW9CLEVBQUUsYUFBZ0I7SUFFL0UsSUFBSyxPQUFRLEdBQVcsQ0FBQyxNQUFNLElBQVEsVUFBVTtXQUN6QyxPQUFRLEdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFVBQVU7V0FDNUMsT0FBUSxHQUFXLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSyxVQUFVO1dBQzVDLE9BQVEsR0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksVUFBVTtRQUFHLE9BQU8sR0FBOEIsQ0FBQTtJQUU1RixNQUFNLEtBQUssR0FBRyxFQUFnRSxDQUFBO0lBRTlFLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQThCLENBQUE7SUFDdkQsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBOEIsQ0FBQTtJQUN2RCxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxFQUE4QixDQUFBO0lBRXZELElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQTtJQUNqQixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUE7SUFDakIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFBO0lBRWpCLFNBQVMsR0FBRyxDQUFHLEdBQVksRUFBRSxLQUFtQjtRQUUzQyxJQUFLLEdBQUcsSUFBSSxPQUFPLEVBQ25CO1lBQ0ssTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ3pCLE9BQU8sQ0FBRSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7WUFFckIsSUFBSyxHQUFHLElBQUksS0FBSztnQkFDWixLQUFLLENBQUUsR0FBRyxDQUFDLENBQUMsUUFB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