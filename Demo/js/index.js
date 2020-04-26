(function (fabric) {
    'use strict';

    //}
    Window.prototype.on = Window.prototype.addEventListener;
    Window.prototype.off = Window.prototype.removeEventListener;
    Element.prototype.css = function (props) {
        Object.assign(this.style, props);
        return this;
    };
    Element.prototype.cssInt = function (property) {
        var value = parseInt(this.style[property]);
        if (Number.isNaN(value)) {
            value = parseInt(window.getComputedStyle(this)[property]);
            if (Number.isNaN(value))
                value = 0;
        }
        return value;
    };
    Element.prototype.cssFloat = function (property) {
        var value = parseFloat(this.style[property]);
        if (Number.isNaN(value)) {
            value = parseFloat(window.getComputedStyle(this)[property]);
            if (Number.isNaN(value))
                value = 0;
        }
        return value;
    };
    Element.prototype.on = Element.prototype.addEventListener;
    Element.prototype.off = Element.prototype.removeEventListener;
    Element.prototype.$ = Element.prototype.querySelector;
    Element.prototype.$$ = Element.prototype.querySelectorAll;
    Element.prototype.cssInt = function (property) {
        var value = parseInt(this.style[property]);
        if (Number.isNaN(value)) {
            const style = window.getComputedStyle(this);
            value = parseInt(style[property]);
            if (Number.isNaN(value))
                value = 0;
        }
        return value;
    };

    // https://github.com/rdfjs-base/data-model/tree/master/lib
    var nextId = 0;
    function createNode(type, id, data) {
        data.type = type;
        data.id = id || (++nextId).toString();
        return data;
    }
    /*export class Node <D extends $Node = $Node, T extends string = D ["type"]>
    {
         static nextId = 0

         readonly type: string

         readonly id: string

         readonly uid: number

         readonly data: D

         defaultData (): $Node
         {
              return {
                   context: "",
                   type   : "node",
                   id     : undefined,
              }
         }

         constructor ( data: D )
         {
              this.type = data.type
              this.uid  = ++Node.nextId
              this.id   = data.id || (data.id = this.uid.toString ())

              this.data = Object.assign ( this.defaultData (), data as D )
         }

         equals ( other: Node <any> )
         {
              return !!other
                   && other.type === this.type
                   && other.id   === this.id
         }

         toJson ()
         {
              return JSON.stringify ( this.data )
         }
    }*/

    class DataTree {
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

    class Database {
        constructor() {
            this.tree = new DataTree();
        }
        has(c, t, i) {
            return typeof c === "string"
                ? this.tree.near([c, t, i]) !== undefined
                : this.tree.near([c.context, c.type, c.id]) !== undefined;
        }
        count(c, t, i) {
            return typeof c === "string"
                ? this.tree.count([c, t, i])
                : this.tree.count([c.context, c.type, c.id]);
        }
        set(c, t, i, data) {
            if (typeof c === "string") {
                data.context = c;
                data.type = t;
                data.id = i;
                this.tree.set([c, t, i], data);
            }
            else
                this.tree.set([c.context, c.type, c.id], c);
        }
        //get <$ extends N = N> (
        //     a    : string | $Node,
        //     b?   : string | $Data <N>,
        //     c?   : string,
        //     data?: $Data <N>
        //): $
        get() {
            if (arguments.length == 0)
                return;
            const result = {}; //as $
            if (arguments.length == 1) {
                const o = arguments[0];
                this.tree.walk([o.context, o.type, o.id], data => {
                    Object.assign(result, data);
                });
                return Object.assign(result, o);
                // this.tree.walk ( [a.context, a.type, a.id], data => {
                //      Object.assign ( result, data )
                // })
                // return Object.assign ( result, a, b )
            }
            //if ( typeof a === "string" )
            else {
                this.tree.walk(arguments, data => {
                    Object.assign(result, data);
                });
                return Object.assign(result, {
                    context: arguments[0],
                    type: arguments[1],
                    id: arguments[2],
                });
                // this.tree.walk ( [a, b as string, c], data => {
                //      Object.assign ( result, data )
                // })
                // return Object.assign ( result, data, {
                //      context: a,
                //      type   : b,
                //      id     : c,
                // })
            }
        }
    }

    class Factory {
        constructor(db) {
            this.db = db;
            this.ctors = new DataTree();
            this.insts = new DataTree();
        }
        inStock(c, t, i) {
            if (typeof c !== "string") {
                i = c.id;
                t = c.type;
                c = c.context;
            }
            return this.ctors.has([c, t, i]);
        }
        define(ctor, c, t, i) {
            if (typeof c !== "string") {
                i = c.id;
                t = c.type;
                c = c.context;
            }
            if (this.ctors.has([c, t, i]))
                throw "Bad argument";
            this.ctors.set([c, t, i], ctor);
        }
        make(c, t, i, data) {
            if (typeof c !== "string") {
                data = c;
                t = c.type;
                i = c.id;
                c = c.context;
            }
            if (this.insts.has([c, t, i])) {
                //if ( data !== undefined )
                //     console.warn ("Can not assign new data")
                return this.insts.get([c, t, i]);
            }
            const ctor = this.ctors.near([c, t, i]);
            if (ctor == undefined)
                throw "Bad argument";
            const tmp = this.db.get(c, t, i);
            data = data == undefined
                ? tmp
                : Object.assign(tmp, data);
            if (ctor.toString().indexOf("class") == 0)
                //@ts-ignore
                return this.insts.set([c, t, i], new ctor(data));
            else
                //@ts-ignore
                return this.insts.set([c, t, i], ctor(data));
        }
    }

    const xnode = (() => {
        const svg_names = ["svg", "g", "line", "circle", "path", "text"];
        function create(name, props, ...children) {
            props = Object.assign({}, props);
            const element = svg_names.indexOf(name) === -1
                ? document.createElement(name)
                : document.createElementNS("http://www.w3.org/2000/svg", name);
            const content = [];
            // Children
            while (children.length > 0) {
                let child = children.pop();
                if (Array.isArray(child)) {
                    for (var i = 0; i != child.length; i++)
                        children.push(child[i]);
                }
                else {
                    content.push(child);
                }
            }
            while (content.length > 0) {
                let child = content.pop();
                if (child instanceof Node)
                    element.appendChild(child);
                else if (typeof child == "boolean" || child)
                    element.appendChild(document.createTextNode(child.toString()));
            }
            // Attributes
            const isArray = Array.isArray;
            const conv = {
                class: (v) => isArray(v) ? v.join(" ") : v,
                style: (v) => isArray(v) ? v.join(" ")
                    : typeof v == "object" ? objectToStyle(v)
                        : v,
                // svg
                d: (v) => isArray(v) ? v.join(" ") : v,
            };
            for (const key in props) {
                const value = props[key];
                if (typeof value == "function")
                    element.addEventListener(key, value);
                else
                    element.setAttribute(key, (conv[key] || (v => v))(value));
            }
            return element;
            function objectToStyle(obj) {
                var result = "";
                for (const key in obj)
                    result += key + ": " + obj[key] + "; ";
                return result;
            }
        }
        return create;
    })();

    class Component {
        constructor(data) {
            this.data = Object.assign(this.defaultData(), createNode(data.type, data.id, data));
        }
        defaultData() {
            return {
                context: "concept-ui",
                type: "component",
                id: undefined,
            };
        }
        getHtml() {
            if (this.container == undefined) {
                this.container = xnode("div", { class: this.data.type });
                this.onCreate();
            }
            return [this.container];
        }
        onCreate() {
        }
    }

    const CONTEXT = "concept-ui";
    const db = new Database();
    const factory = new Factory(db);
    function normalize(node) {
        if ("context" in node) {
            if (node.context !== CONTEXT)
                throw "Bad context value";
        }
        else {
            node.context = CONTEXT;
        }
        return node;
    }
    function get(node) {
        return factory.make(normalize(node));
    }
    function define(ctor, type, id) {
        factory.define(ctor, CONTEXT, type, id);
    }

    class Phantom extends Component {
        getHtml() {
            if (this.container == undefined) {
                this.container = document.createElement("div");
                this.container.innerHTML = this.data.content;
            }
            return this.container.childNodes;
        }
    }

    const toPosition = {
        lr: "left",
        rl: "right",
        tb: "top",
        bt: "bottom",
    };
    class Container extends Component {
        constructor() {
            super(...arguments);
            this.children = {};
        }
        defaultData() {
            return {
                context: "concept-ui",
                type: "component",
                id: undefined,
                direction: "lr",
            };
        }
        getHtml() {
            if (this.container == undefined) {
                super.getHtml();
                const container = this.container;
                const data = this.data;
                const children = this.children;
                if (data.children) {
                    for (const child of data.children) {
                        const o = get(child);
                        container.append(...o.getHtml());
                        children[o.data.id] = o;
                    }
                }
                container.classList.add(toPosition[this.data.direction]);
                this.onCreate();
            }
            return [this.container];
        }
        onCreate() {
        }
        append(...elements) {
            const def = this.data.children;
            if (this.container == undefined)
                this.getHtml();
            const container = this.container;
            const children = this.children;
            for (var e of elements) {
                if (typeof e == "string") {
                    e = new Phantom({
                        context: "concept-ui",
                        type: "phantom",
                        id: undefined,
                        content: e
                    });
                }
                else if (e instanceof Element) {
                    const UI_COMPONENT = Symbol.for("UI_COMPONENT");
                    e = e[UI_COMPONENT] != undefined
                        ? e[UI_COMPONENT]
                        : new Phantom({
                            context: "concept-ui",
                            type: "phantom",
                            id: undefined,
                            content: e.outerHTML
                        });
                }
                else if (!(e instanceof Component)) {
                    e = get(e);
                }
                children[e.data.id] = e;
                container.append(...e.getHtml());
            }
        }
        remove(...elements) {
        }
        clear() {
            this.children = {};
            if (this.container)
                this.container.innerHTML = "";
        }
        getOrientation() {
            return this.data.direction;
        }
        setOrientation(value) {
            const config = this.data;
            if (value == config.direction)
                return;
            const container = this.container;
            container.classList.remove(toPosition[config.direction]);
            container.classList.add(toPosition[value]);
            config.direction = value;
        }
    }

    function defaultConfig() {
        return {
            handles: [],
            minVelocity: 0,
            maxVelocity: 1,
            onStartDrag: () => { },
            onDrag: () => { },
            onStopDrag: () => { },
            velocityFactor: (window.innerHeight < window.innerWidth
                ? window.innerHeight : window.innerWidth) / 2,
        };
    }
    var start_x = 0;
    var start_y = 0;
    var start_time = 0;
    var is_drag = false;
    var pointer;
    function draggable(options) {
        const config = defaultConfig();
        var is_active = false;
        updateConfig(options);
        function updateConfig(options) {
            if (is_drag) {
                return;
            }
            disableMouseEvents();
            disableTouchEvents();
            Object.assign(config, options);
            enableMouseEvents();
            enableTouchEvents();
        }
        function addHandles(...handles) {
            for (const h of handles) {
                if (!config.handles.includes(h))
                    config.handles.push(h);
            }
            if (is_active) {
                desactivate();
                activate();
            }
        }
        function activate() {
            enableTouchEvents();
            enableMouseEvents();
            is_active = true;
        }
        function desactivate() {
            disableTouchEvents();
            disableMouseEvents();
            is_active = false;
        }
        return {
            updateConfig,
            addHandles,
            isActive: () => is_active,
            activate,
            desactivate,
        };
        function enableTouchEvents() {
            for (const h of config.handles) //if ( h )
                h.addEventListener("touchstart", onStart, { passive: true });
        }
        function disableTouchEvents() {
            for (const h of config.handles) //if ( h )
                h.removeEventListener("touchstart", onStart);
        }
        function enableMouseEvents() {
            for (const h of config.handles) //if ( h )
                h.addEventListener("mousedown", onStart);
        }
        function disableMouseEvents() {
            for (const h of config.handles) //if ( h )
                h.removeEventListener("mousedown", onStart);
        }
        function onStart(event) {
            if (is_drag) {
                console.warn("Tentative de démarrage des événements "
                    + "\"draggable \" déjà en cours.");
                return;
            }
            pointer = event.touches
                ? event.touches[0]
                : event;
            if (event.type == "touchstart") {
                window.addEventListener("touchmove", onMove, { passive: true });
                window.addEventListener("touchend", onEnd);
                disableMouseEvents();
            }
            else {
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onEnd);
                disableTouchEvents();
            }
            window.requestAnimationFrame(onAnimationStart);
            is_drag = true;
        }
        function onMove(event) {
            if (is_drag == false)
                return;
            pointer = event.touches !== undefined
                ? event.touches[0]
                : event;
        }
        function onEnd(event) {
            if (event.type == "touchend") {
                window.removeEventListener("touchmove", onMove);
                window.removeEventListener("touchend", onEnd);
                if (event.cancelable)
                    event.preventDefault();
                enableMouseEvents();
            }
            else {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onEnd);
                enableTouchEvents();
            }
            is_drag = false;
        }
        var current_event;
        var last_event;
        function onAnimationStart(now) {
            start_x = pointer.clientX;
            start_y = pointer.clientY;
            start_time = now;
            current_event = {
                // startTime: now
                delay: 0,
                x: 0,
                y: 0,
                velocityX: 0,
                velocityY: 0,
            };
            config.onStartDrag();
            window.requestAnimationFrame(onAnimationFrame);
        }
        function onAnimationFrame(now) {
            const { minVelocity, maxVelocity, velocityFactor } = config;
            last_event = current_event;
            const x = pointer.clientX - start_x;
            const y = start_y - pointer.clientY;
            const delay = now - start_time;
            const offsetDelay = delay - last_event.delay;
            const offsetX = x - last_event.x;
            const offsetY = y - last_event.y;
            current_event = {
                delay,
                x,
                y,
                velocityX: velocity(offsetX / offsetDelay),
                velocityY: velocity(offsetY / offsetDelay),
            };
            if (is_drag) {
                config.onDrag(current_event);
                window.requestAnimationFrame(onAnimationFrame);
            }
            else {
                config.onStopDrag(current_event);
            }
            function velocity(value) {
                const sign = value < 0 ? -1 : 1;
                value = Math.abs(value);
                if (value < minVelocity)
                    return sign * minVelocity * velocityFactor;
                if (value < -maxVelocity)
                    return sign * -maxVelocity * velocityFactor;
                if (value > maxVelocity)
                    return sign * maxVelocity * velocityFactor;
                return sign * value * velocityFactor;
            }
        }
    }

    const verticalProperties = ["height", "top", "bottom"];
    function defaultConfig$1() {
        return {
            handles: [],
            property: "height",
            open: false,
            near: 40,
            delay: 250,
            minSize: 60,
            maxSize: window.innerHeight - 60,
            onClose: () => { },
        };
    }
    function expandable(element, options = {}) {
        const config = defaultConfig$1();
        var is_open = false;
        var is_vertical = false;
        var start_size = 0;
        var open_size = 0;
        const draggable$1 = draggable({
            onStartDrag: onStartDrag,
            onStopDrag: onStopDrag
        });
        updateConfig(options);
        function updateConfig(options = {}) {
            Object.assign(config, options);
            is_open = config.open;
            is_vertical = verticalProperties.includes(config.property);
            element.classList.remove(is_vertical ? "horizontal" : "vertical");
            element.classList.add(is_vertical ? "vertical" : "horizontal");
            draggable$1.updateConfig({
                handles: config.handles,
                onDrag: is_vertical ? onDragVertical : onDragHorizontal,
            });
        }
        function size() {
            return is_open ? element.cssInt(config.property) : 0;
        }
        function toggle() {
            if (is_open)
                close();
            else
                open();
        }
        function open() {
            element.classList.add("animate");
            element.classList.replace("close", "open");
            element.style[config.property] = open_size + "px";
            is_open = true;
        }
        function close() {
            element.classList.add("animate");
            element.classList.replace("open", "close");
            open_size = size();
            element.style[config.property] = "0px";
            is_open = false;
            config.onClose();
        }
        return {
            updateConfig,
            open,
            close,
            isOpen: () => is_open,
            isClose: () => !is_open,
            isVertical: () => is_vertical,
            isActive: () => draggable$1.isActive(),
            activate: () => draggable$1.activate(),
            desactivate: () => draggable$1.desactivate(),
        };
        function onStartDrag() {
            start_size = size();
            element.classList.remove("animate");
        }
        function onDragVertical(event) {
            element.style[config.property] = (start_size + event.y) + "px";
        }
        function onDragHorizontal(event) {
            element.style[config.property] = (start_size + event.x) + "px";
        }
        function onStopDrag(event) {
            element.classList.add("animate");
            var is_moved = is_vertical ? event.y > config.near
                : event.x > config.near;
            if ((is_moved == false) && event.delay <= config.delay) {
                toggle();
                return;
            }
            var size = clamp(is_vertical ? start_size + event.y + event.velocityY
                : start_size + event.x + event.velocityX);
            const need_close = size <= config.near;
            if (need_close) {
                close();
            }
            else {
                open_size = size;
                open();
            }
            function clamp(value) {
                return value < config.minSize ? config.minSize
                    : value > config.maxSize ? config.maxSize
                        : value;
            }
        }
    }

    function create() {
        const register = [];
        var enabled = true;
        const self = function (callback) {
            register.push(callback) - 1;
            return self;
        };
        self.count = () => {
            return register.length;
        };
        self.disable = () => {
            enabled = false;
            return self;
        };
        self.enable = () => {
            enabled = true;
            return self;
        };
        self.append = (callback) => {
            self(callback);
            return self;
        };
        self.remove = (callback) => {
            const index = register.indexOf(callback);
            if (index != -1)
                register.splice(index, 1);
            return self;
        };
        self.removeAll = () => {
            register.splice(0);
            return self;
        };
        self.dispatch = (...args) => {
            if (enabled) {
                for (var fn of register)
                    fn(...args);
            }
            return self;
        };
        return self;
    }

    var NumberLib;
    (function (NumberLib) {
        function limitedValue(value, min, max) {
            const self = {
                limit,
                set,
                factor,
            };
            return self;
            function limit(minValue, maxValue) {
                return self;
            }
            function set(newValue) {
                return self;
            }
            function factor(num) {
                return self;
            }
        }
        NumberLib.limitedValue = limitedValue;
        function multipleLimitedValues(values, min, max) {
            const ranges = [];
            var iclamp = 0;
            const self = {
                limit,
                set,
                factor
            };
            limit(min, max);
            return self;
            function limit(minValues, maxValues) {
                if (typeof minValues == "number")
                    minValues = [minValues];
                if (typeof maxValues == "number")
                    maxValues = [maxValues];
                const minCount = minValues.length;
                const maxCount = maxValues.length;
                const count = values.length;
                min = [];
                max = [];
                for (var i = 0; i < count; i++) {
                    if (i < minCount && Number.isFinite(minValues[i]))
                        min[i] = minValues[i];
                    else
                        min[i] = 0;
                }
                for (var i = 0; i < count; i++) {
                    if (i < maxCount && Number.isFinite(maxValues[i]))
                        max[i] = maxValues[i];
                    else
                        max[i] = values[i]; // || min [i]
                }
                // clamp
                const clampStart = minCount != 0;
                const clampEnd = maxCount != 0;
                iclamp = clampStart && clampEnd ? 1
                    : clampStart ? 2
                        : clampEnd ? 3
                            : 0;
                // range
                ranges.splice(0);
                if (clampStart && clampEnd) {
                    for (var i = 0; i != count; i++)
                        ranges.push(max[i] - min[i]);
                }
                // update
                set(values);
                return self;
            }
            function set(newValues) {
                if (typeof newValues == "number")
                    newValues = [newValues];
                const count = values.length < newValues.length ? values.length : newValues.length;
                for (var i = 0; i != count; i++)
                    values[i] = newValues[i];
                switch (iclamp) {
                    case 0:
                        for (var i = 0; i != count; i++)
                            values[i] = newValues[i];
                        break;
                    case 1:
                        for (var i = 0; i != count; i++) {
                            const n = newValues[i];
                            values[i] = n < min[i] ? min[i]
                                : n > max[i] ? max[i]
                                    : n;
                        }
                        break;
                    case 2:
                        for (var i = 0; i != count; i++) {
                            const n = newValues[i];
                            values[i] = n < min[i] ? min[i] : n;
                        }
                        break;
                    case 3:
                        for (var i = 0; i != count; i++) {
                            const n = newValues[i];
                            values[i] = n > max[i] ? max[i] : n;
                        }
                        break;
                }
                return self;
            }
            function factor(factors) {
                if (typeof factors == "number") {
                    if (!Number.isFinite(factors))
                        return self;
                    for (var i = 0; i != values.length; i++)
                        values[i] = min[i] + ranges[i] * factors;
                }
                else if (Array.isArray(factors)) {
                    const count = values.length < factors.length ? values.length : factors.length;
                    if (count == 0)
                        return self;
                    for (var i = 0; i != count; i++) {
                        if (isFinite(factors[i]))
                            values[i] = min[i] + ranges[i] * factors[i];
                    }
                }
                return self;
            }
        }
        NumberLib.multipleLimitedValues = multipleLimitedValues;
    })(NumberLib || (NumberLib = {}));

    function getRadialDistribution(options) {
        const { PI, cos, sin } = Math;
        const r = options.r || 30;
        const count = options.count || 10;
        const rotation = options.rotation || 0;
        const points = [];
        const a = 2 * PI / count;
        const chord = 2 * r * sin(a * 0.5);
        const size = r * 4 + chord;
        const c = size / 2;
        for (var i = 0; i < count; ++i) {
            const start = a * i + rotation;
            const middle = start + a * 0.5;
            const end = start + a;
            points.push({
                a1: start,
                a: middle,
                a2: end,
                x: cos(middle) * r + c,
                y: sin(middle) * r + c,
                chord: {
                    x1: cos(start) * r + c,
                    y1: sin(start) * r + c,
                    x2: cos(end) * r + c,
                    y2: sin(end) * r + c,
                    length: chord
                }
            });
        }
        const result = {
            r,
            count,
            rotation,
            padding: options.padding || 0,
            cx: c,
            cy: c,
            width: size,
            height: size,
            points
        };
        return result;
    }

    // https://observablehq.com/@d3/d3-packenclose?collection=@observablehq/algorithms
    // https://observablehq.com/@d3/circle-packing
    // https://github.com/d3/d3-hierarchy/blob/master/src/pack/enclose.js
    const slice = Array.prototype.slice;
    function shuffle(array) {
        var m = array.length, t, i;
        while (m) {
            i = Math.random() * m-- | 0;
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }
    function enclose(circles) {
        circles = shuffle(slice.call(circles));
        const n = circles.length;
        var i = 0, B = [], p, e;
        while (i < n) {
            p = circles[i];
            if (e && enclosesWeak(e, p)) {
                i++;
            }
            else {
                B = extendBasis(B, p);
                e = encloseBasis(B);
                i = 0;
            }
        }
        return e;
    }
    function extendBasis(B, p) {
        var i, j;
        if (enclosesWeakAll(p, B))
            return [p];
        // If we get here then B must have at least one element.
        for (i = 0; i < B.length; ++i) {
            if (enclosesNot(p, B[i])
                && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
                return [B[i], p];
            }
        }
        // If we get here then B must have at least two elements.
        for (i = 0; i < B.length - 1; ++i) {
            for (j = i + 1; j < B.length; ++j) {
                if (enclosesNot(encloseBasis2(B[i], B[j]), p)
                    && enclosesNot(encloseBasis2(B[i], p), B[j])
                    && enclosesNot(encloseBasis2(B[j], p), B[i])
                    && enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)) {
                    return [B[i], B[j], p];
                }
            }
        }
        // If we get here then something is very wrong.
        throw new Error;
    }
    function enclosesNot(a, b) {
        const dr = a.r - b.r;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return dr < 0 || dr * dr < dx * dx + dy * dy;
    }
    function enclosesWeak(a, b) {
        var dr = a.r - b.r + 1e-6, dx = b.x - a.x, dy = b.y - a.y;
        return dr > 0 && dr * dr > dx * dx + dy * dy;
    }
    function enclosesWeakAll(a, B) {
        for (var i = 0; i < B.length; ++i) {
            if (!enclosesWeak(a, B[i]))
                return false;
        }
        return true;
    }
    function encloseBasis(B) {
        switch (B.length) {
            case 1: return encloseBasis1(B[0]);
            case 2: return encloseBasis2(B[0], B[1]);
            case 3: return encloseBasis3(B[0], B[1], B[2]);
        }
    }
    function encloseBasis1(a) {
        return {
            x: a.x,
            y: a.y,
            r: a.r
        };
    }
    function encloseBasis2(a, b) {
        const { x: x1, y: y1, r: r1 } = a;
        const { x: x2, y: y2, r: r2 } = b;
        var x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1, l = Math.sqrt(x21 * x21 + y21 * y21);
        return {
            x: (x1 + x2 + x21 / l * r21) / 2,
            y: (y1 + y2 + y21 / l * r21) / 2,
            r: (l + r1 + r2) / 2
        };
    }
    function encloseBasis3(a, b, c) {
        const { x: x1, y: y1, r: r1 } = a;
        const { x: x2, y: y2, r: r2 } = b;
        const { x: x3, y: y3, r: r3 } = c;
        const a2 = x1 - x2, a3 = x1 - x3, b2 = y1 - y2, b3 = y1 - y3, c2 = r2 - r1, c3 = r3 - r1, d1 = x1 * x1 + y1 * y1 - r1 * r1, d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2, d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3, ab = a3 * b2 - a2 * b3, xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1, xb = (b3 * c2 - b2 * c3) / ab, ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1, yb = (a2 * c3 - a3 * c2) / ab, A = xb * xb + yb * yb - 1, B = 2 * (r1 + xa * xb + ya * yb), C = xa * xa + ya * ya - r1 * r1, r = -(A ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B);
        return {
            x: x1 + xa + xb * r,
            y: y1 + ya + yb * r,
            r: r
        };
    }

    /// <reference path="./d3-enclose.ts" />
    function place(b, a, c) {
        var dx = b.x - a.x, x, a2, dy = b.y - a.y, y, b2, d2 = dx * dx + dy * dy;
        if (d2) {
            a2 = a.r + c.r, a2 *= a2;
            b2 = b.r + c.r, b2 *= b2;
            if (a2 > b2) {
                x = (d2 + b2 - a2) / (2 * d2);
                y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
                c.x = b.x - x * dx - y * dy;
                c.y = b.y - x * dy + y * dx;
            }
            else {
                x = (d2 + a2 - b2) / (2 * d2);
                y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
                c.x = a.x + x * dx - y * dy;
                c.y = a.y + x * dy + y * dx;
            }
        }
        else {
            c.x = a.x + c.r;
            c.y = a.y;
        }
    }
    function intersects(a, b) {
        var dr = a.r + b.r - 1e-6, dx = b.x - a.x, dy = b.y - a.y;
        return dr > 0 && dr * dr > dx * dx + dy * dy;
    }
    function score(node) {
        var a = node._, b = node.next._, ab = a.r + b.r, dx = (a.x * b.r + b.x * a.r) / ab, dy = (a.y * b.r + b.y * a.r) / ab;
        return dx * dx + dy * dy;
    }
    class Node$1 {
        constructor(_) {
            this._ = _;
            this.next = null;
            this.previous = null;
        }
    }
    function packEnclose(circles) {
        if (!(n = circles.length))
            return 0;
        var a, b, c /*: Node & Circle*/, n, aa, ca, i, j, k, sj, sk;
        // Place the first circle.
        a = circles[0], a.x = 0, a.y = 0;
        if (!(n > 1))
            return a.r;
        // Place the second circle.
        b = circles[1], a.x = -b.r, b.x = a.r, b.y = 0;
        if (!(n > 2))
            return a.r + b.r;
        // Place the third circle.
        place(b, a, c = circles[2]);
        // Initialize the front-chain using the first three circles a, b and c.
        a = new Node$1(a), b = new Node$1(b), c = new Node$1(c);
        a.next = c.previous = b;
        b.next = a.previous = c;
        c.next = b.previous = a;
        // Attempt to place each remaining circle…
        pack: for (i = 3; i < n; ++i) {
            place(a._, b._, c = circles[i]), c = new Node$1(c);
            // Find the closest intersecting circle on the front-chain, if any.
            // “Closeness” is determined by linear distance along the front-chain.
            // “Ahead” or “behind” is likewise determined by linear distance.
            j = b.next, k = a.previous, sj = b._.r, sk = a._.r;
            do {
                if (sj <= sk) {
                    if (intersects(j._, c._)) {
                        b = j, a.next = b, b.previous = a, --i;
                        continue pack;
                    }
                    sj += j._.r, j = j.next;
                }
                else {
                    if (intersects(k._, c._)) {
                        a = k, a.next = b, b.previous = a, --i;
                        continue pack;
                    }
                    sk += k._.r, k = k.previous;
                }
            } while (j !== k.next);
            // Success! Insert the new circle c between a and b.
            c.previous = a, c.next = b, a.next = b.previous = b = c;
            // Compute the new closest circle pair to the centroid.
            aa = score(a);
            while ((c = c.next) !== b) {
                if ((ca = score(c)) < aa) {
                    a = c,
                        aa = ca;
                }
            }
            b = a.next;
        }
        // Compute the enclosing circle of the front chain.
        a = [b._];
        c = b;
        while ((c = c.next) !== b)
            a.push(c._);
        c = enclose(a);
        // Translate the circles to put the enclosing circle around the origin.
        for (i = 0; i < n; ++i) {
            a = circles[i],
                a.x -= c.x,
                a.y -= c.y;
        }
        return c.r;
    }
    function packCircles(circles) {
        packEnclose(circles);
        return circles;
    }



    var Geometry = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getRadialDistribution: getRadialDistribution,
        enclose: enclose,
        packEnclose: packEnclose,
        packCircles: packCircles
    });

    function getUnit(value) {
        if (typeof value != "string")
            return undefined;
        const split = /[+-]?\d*\.?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/
            .exec(value);
        if (split)
            return split[1];
        return undefined;
    }

    function defaultConfig$2() {
        return {
            handles: [],
            porperty: "left",
            minValue: -100,
            maxValue: 0,
            units: "%",
            mouseWheel: true,
        };
    }
    var start_position = 0;
    var is_vertical = false;
    var prop;
    function swipeable(element, options) {
        const config = defaultConfig$2();
        const draggable$1 = draggable({
            onStartDrag,
            onStopDrag,
        });
        element.classList.add("swipeable");
        updateConfig(options);
        function updateConfig(options) {
            Object.assign(config, options);
            switch (config.porperty) {
                case "top":
                case "bottom":
                case "y":
                    is_vertical = true;
                    break;
                case "left":
                case "right":
                case "x":
                    is_vertical = false;
                    break;
                default:
                    debugger;
                    return;
            }
            draggable$1.updateConfig({
                handles: config.handles,
                onDrag: is_vertical ? onDragVertical : onDragHorizontal
            });
            prop = config.porperty;
            if (draggable$1.isActive())
                activeEvents();
            else
                desactiveEvents();
        }
        function position() {
            return element.cssFloat(prop);
        }
        function activate() {
            draggable$1.activate();
            activeEvents();
        }
        function desactivate() {
            draggable$1.desactivate();
            desactiveEvents();
        }
        function swipe(offset, u) {
            if (typeof offset == "string") {
                u = getUnit(offset);
                offset = parseFloat(offset);
            }
            if (!["px", "%"].includes(u))
                u = "px";
            if (u != config.units) {
                if ((u = config.units) == "%")
                    offset = toPercents(offset);
                else
                    offset = toPixels(offset);
            }
            element.style[prop] = clamp(offset) + u;
        }
        return {
            updateConfig,
            activate,
            desactivate,
            position,
            swipe,
        };
        function activeEvents() {
            if (config.mouseWheel) {
                for (const h of config.handles)
                    h.addEventListener("wheel", onWheel);
            }
        }
        function desactiveEvents() {
            for (const h of config.handles)
                h.removeEventListener("wheel", onWheel);
        }
        function toPixels(percentage) {
            const { minValue: min, maxValue: max } = config;
            if (percentage < 100)
                percentage = 100 + percentage;
            return min + (max - min) * percentage / 100;
        }
        function toPercents(pixels) {
            const { minValue: min, maxValue: max } = config;
            return Math.abs((pixels - min) / (max - min) * 100);
        }
        function onStartDrag() {
            element.classList.remove("animate");
            start_position = position();
        }
        function onDragVertical(event) {
            element.style[prop] = clamp(start_position + event.y) + config.units;
        }
        function onDragHorizontal(event) {
            element.style[prop] = clamp(start_position + event.x) + config.units;
        }
        function onStopDrag(event) {
            element.classList.add("animate");
            const offset = is_vertical
                ? event.y + event.velocityY
                : event.x + event.velocityX;
            element.style[prop] = clamp(start_position + offset) + config.units;
        }
        function onWheel(event) {
            if (event.deltaMode != WheelEvent.DOM_DELTA_PIXEL)
                return;
            if (is_vertical) {
                var delta = event.deltaY;
            }
            else {
                var delta = event.deltaX;
                if (delta == 0)
                    delta = event.deltaY;
            }
            element.style[prop] = clamp(position() + delta) + config.units;
        }
        function clamp(value) {
            return value < config.minValue ? config.minValue
                : value > config.maxValue ? config.maxValue
                    : value;
        }
    }

    class Block extends Component {
        constructor() {
            super(...arguments);
            this.container = xnode("div", { class: "bar" });
        }
        get orientation() {
            return this.container.classList.contains("vertical")
                ? "horizontal"
                : "vertical";
        }
        set orientation(orientation) {
            const classList = this.container.classList;
            var new_orientation = classList.contains("vertical")
                ? "horizontal"
                : "vertical";
            if (orientation == new_orientation)
                return;
            classList.replace(orientation, new_orientation);
        }
    }

    class Button extends Component {
        getHtml() {
            if (this.container == undefined) {
                const data = this.data;
                const node = xnode("div", { class: "button" },
                    data.icon ? xnode("span", { class: "icon" }, data.icon) : null,
                    data.text ? xnode("span", { class: "text" }, data.text) : null);
                if (this.data.callback != undefined)
                    node.addEventListener("click", this.data.callback);
                this.container = node;
            }
            return [this.container];
        }
        onHover() {
        }
    }

    //   ```
    //   .slideshow
    //        [...]
    //   ```
    class Slideshow extends Container {
        constructor() {
            super(...arguments);
            this.children = {};
        }
        getHtml() {
            const elements = super.getHtml();
            const data = this.data;
            const container = this.container;
            if (data.isSwipeable) {
                this.swipeable = swipeable(container, {
                    handles: [container],
                    minValue: -0,
                    maxValue: 0,
                    porperty: data.direction == "bt" || data.direction == "tb" ? "top" : "left",
                    units: "px",
                    mouseWheel: true,
                });
                this.swipeable.activate();
            }
            return elements;
        }
        show(id, ...content) {
            const child = this.children[id];
            if (child == undefined)
                return;
            if (this.current)
                this.current = child;
            if (content) {
                child.clear();
                console.log(content);
                child.append(...content);
            }
            child.container.style.display = "block";
        }
    }

    const toFlexDirection = {
        lr: "row",
        rl: "row-reverse",
        tb: "column",
        bt: "column-reverse",
    };
    const toReverse = {
        lr: "rl",
        rl: "lr",
        tb: "bt",
        bt: "tb",
    };
    /**
     *   ```pug
     *   .toolbar
     *        .toolbar-backgroung
     *        .toolbar-slide
     *             [...]
     *   ```
     */
    class Toolbar extends Container {
        defaultConfig() {
            return Object.assign({}, super.defaultData(), { type: "toolbar", title: "Title ...", direction: "lr", reverse: false, buttons: [] });
        }
        getHtml() {
            if (this.parent == undefined) {
                const container = xnode("div", { class: "toolbar-slide" });
                const background = xnode("div", { class: "toolbar-background" }, this.data.title);
                const parent = xnode("div", { class: "toolbar" },
                    background,
                    container);
                this.container = container;
                this.parent = parent;
                this.background = background;
                this.tabs = [];
                this.swipeable = swipeable(container, {
                    handles: [parent],
                    minValue: -0,
                    maxValue: 0,
                    porperty: this.is_vertical ? "top" : "left",
                    units: "px",
                    mouseWheel: true,
                });
                this.swipeable.activate();
                this.changeOrientation(this.data.direction);
                window.addEventListener("DOMContentLoaded", () => this.swipeable.updateConfig({
                    minValue: -this.slideSize()
                }));
                if (this.data.buttons) {
                    this.append(...this.data.buttons);
                }
            }
            return [this.parent];
        }
        slideSize() {
            const { parent: node, is_vertical } = this;
            return node.cssFloat(is_vertical ? "height" : "width");
        }
        append(...elements) {
            super.append(...elements);
            this.swipeable.updateConfig({ minValue: -this.slideSize() });
        }
        reverse() {
            const { data } = this;
            data.reverse = !data.reverse;
            const dir = data.reverse
                ? toReverse[data.direction]
                : data.direction;
            this.parent.css({ flexDirection: toFlexDirection[dir] });
        }
        changeOrientation(direction) {
            const { data } = this;
            data.direction = direction;
            this.is_vertical = direction == "bt" || direction == "tb";
            this.parent.css({
                flexDirection: toFlexDirection[direction],
            });
            this.swipeable.updateConfig({ minValue: -this.slideSize() });
        }
        swipe(offset, u) {
            if (typeof offset == "string")
                this.swipeable.swipe(offset);
            else
                this.swipeable.swipe(offset, u);
        }
    }

    const toPosition$1 = {
        lr: "left",
        rl: "right",
        tb: "top",
        bt: "bottom",
    };
    const toProperty = {
        lr: "width",
        rl: "width",
        tb: "height",
        bt: "height",
    };
    /**
     *   ```
     *   .panel
     *        .panel-header
     *             .panel-main-buttton
     *             [...]
     *        .panel-content
     *             [...]
     *        .panel-footer
     *             [...]
     *   ```
     */
    class Panel extends Container {
        constructor() {
            super(...arguments);
            this.size = 0;
        }
        defaultData() {
            return Object.assign({}, super.defaultData(), { type: "panel", children: [], direction: "rl", hasMainButton: true });
        }
        getHtml() {
            if (this.container == undefined) {
                const header = xnode("div", { class: "panel-header" });
                const content = xnode("div", { class: "panel-content" });
                const container = xnode("div", { class: "panel panel-infos close" },
                    header,
                    content);
                const data = this.data;
                if (data.hasMainButton) {
                    const btn = xnode("span", { class: "panel-main-button" },
                        xnode("span", { class: "icon" }, "\u21D5"));
                    this.main_button = btn;
                    header.append(btn);
                }
                if (data.header) {
                    this.header = get(data.header);
                    header.append(...this.header.getHtml());
                }
                if (data.children) {
                    //super.append ( ... data.children )
                    for (const child of data.children) {
                        this.content = get(child);
                        content.append(...this.content.getHtml());
                    }
                }
                this.container = container;
                this.expandable = expandable(container, {
                    //direction  : options.direction,
                    property: toProperty[data.direction],
                    near: 60,
                    handles: Array.of(this.main_button),
                    onClose: this.onClose.bind(this)
                });
                this.expandable.activate();
                this.setOrientation(data.direction);
            }
            return [this.container];
        }
        onClickTab() {
            this.open();
        }
        isOpen() {
            return this.expandable.isOpen();
        }
        isClose() {
            return this.expandable.isClose();
        }
        setOrientation(value) {
            const { data, expandable } = this;
            this.container.classList.add(toPosition$1[data.direction]);
            this.container.classList.add(toPosition$1[value]);
            //const old_vertical = expandable.isVertical ()
            super.setOrientation(value);
            expandable.updateConfig({ property: toProperty[value] });
            //this.header.setOrientation (
            //     value == "lr" || value == "rl" ? "tb" : "lr"
            //)
            //if ( old_vertical != expandable.isVertical () )
            //     headbar.reverse ()
            data.direction = value;
        }
        open(id, ...content) {
            //if ( arguments.length > 1 )
            //     this.slideshow.show ( id, ... content )
            this.expandable.open();
            //this.content ( ... args )
            return this;
        }
        close() {
            this.expandable.close();
            return this;
        }
        resize(size) {
            const { expandable, container } = this;
            if (expandable.isVertical())
                container.style.height = size + "px";
            else
                container.style.width = size + "px";
            this.size = size;
        }
        expand(offset) {
            const { expandable, container } = this;
            const size = this.size + offset;
            if (expandable.isVertical())
                container.style.height = size + "px";
            else
                container.style.width = size + "px";
            this.size = size;
        }
        onClose() {
            //this.toolbar.swipe ( "-100%" )
        }
    }

    function createSvgShape(type, def) {
        switch (type) {
            case "circle": return SvgFactory.circle(def);
            case "triangle": return SvgFactory.triangle(def);
            case "square": return SvgFactory.square(def);
            case "pantagon": return SvgFactory.pantagon(def);
            case "hexagon": return SvgFactory.hexagon(def);
            case "square": return SvgFactory.square(def);
            case "text": return SvgFactory.text(def);
            case "textbox": return SvgFactory.textbox(def);
            case "path": return SvgFactory.path(def);
        }
    }
    class SvgFactory {
        // To get triangle, square, [panta|hexa]gon points
        //
        // var a = Math.PI*2/4
        // for ( var i = 0 ; i != 4 ; i++ )
        //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )
        static circle(def) {
            const node = xnode("circle", { cx: def.x || 0, cy: def.y || 0, r: def.size / 2 });
            return node;
        }
        static triangle(def) {
        }
        static square(def) {
        }
        static pantagon(def) {
        }
        static hexagon(def) {
        }
        static text(def) {
        }
        static textbox(def) {
        }
        static path(def) {
        }
    }

    function createMenu() {
        const self = {};
        const button = xnode("button", { class: "w3-button w3-xxlarge", click: open }, "\u2630");
        const overlay = xnode("div", { class: "w3-overlay w3-animate-opacity", style: "cursor:pointer", click: close });
        const sidebar = xnode("div", { class: "w3-sidebar w3-bar-block" },
            xnode("button", { class: "w3-bar-item w3-button", click: close }, "Close"),
            xnode("button", { class: "w3-bar-item w3-button", click: rotateLayout }, "\u2934 Rotate layout"),
            xnode("button", { class: "w3-bar-item w3-button", click: reverseLayout }, "\u21C5 Switch layout"));
        sidebar.css({
            zIndex: "4",
            transition: "all 0.4s",
            left: "-300px"
        });
        button.style.position = "fixed";
        button.style.zIndex = "2";
        self.elements = () => [button, overlay, sidebar];
        self.open = open;
        self.close = close;
        return self;
        function open() {
            sidebar.style.left = "0px";
            overlay.style.display = "block";
        }
        function close() {
            sidebar.style.left = "-300px";
            overlay.style.display = "none";
        }
        function rotateLayout() {
            // const panel = Application.panel
            // switch ( panel.getOrientation () )
            // {
            // case "bt": panel.setOrientation ( "rl"  ) ; break
            // case "rl": panel.setOrientation ( "bt" ) ; break
            // case "lr": panel.setOrientation ( "tb"    ) ; break
            // default  : panel.setOrientation ( "lr"   ) ; break
            // }
        }
        function reverseLayout() {
            // const panel = Application.panel
            // switch ( panel.getOrientation () )
            // {
            // case "bt": panel.setOrientation ( "tb"    ) ; break
            // case "tb": panel.setOrientation ( "bt" ) ; break
            // case "lr": panel.setOrientation ( "rl"  ) ; break
            // default  : panel.setOrientation ( "lr"   ) ; break
            // }
        }
    }

    define(Button, "button", undefined);
    define(Block, "block", undefined);
    define(Slideshow, "slideshow", undefined);
    define(Container, "slide", undefined);
    define(Toolbar, "toolbar", undefined);

    const db$1 = {};
    const events = {};
    function addCommand(name, callback) {
        if (name in db$1)
            return;
        db$1[name] = callback;
    }
    function runCommand(name, ...args) {
        if (name in db$1) {
            db$1[name](...args);
            if (name in events)
                events[name].dispatch();
        }
    }
    function onCommand(name, callback) {
        const callbacks = name in events
            ? events[name]
            : events[name] = create();
        callbacks(callback);
    }

    const CONTEXT$1 = "concept-data";
    const Data = new Database();
    function normalize$1(node) {
        if ("context" in node) {
            if (node.context !== CONTEXT$1)
                throw "Bad context value";
        }
        else {
            node.context = CONTEXT$1;
        }
        return node;
    }
    function get$1() {
        if (arguments.length == 0)
            return;
        if (arguments.length == 1)
            return Data.get(normalize$1(arguments[0]));
        else
            return Data.get(CONTEXT$1, ...arguments);
    }
    function set(node) {
        Data.set(normalize$1(node));
    }
    function count(type) {
        return Data.count("concept-data", type);
    }

    class SkillInfos extends Component {
        display(skill) {
            const target = xnode("div", { class: "people" });
            for (const name of skill.items) {
                const person = get$1(name);
                const card = xnode("div", { class: "w3-card-4 person-card" },
                    xnode("img", { src: person.avatar, alt: "Avatar" }),
                    xnode("div", { class: "w3-container" },
                        xnode("h4", null,
                            xnode("b", null, person.firstName)),
                        xnode("label", null,
                            xnode("b", null, person.isCaptain ? "Expert" : null))));
                target.append(card);
            }
            this.container.innerHTML = "";
            this.container.append(xnode("h1", null, skill.id));
            this.container.append(xnode("p", null, skill.description));
            this.container.append(target);
            // https://github.com/LorDOniX/json-viewer/blob/master/src/json-viewer.js
            this.container.append(xnode("pre", null, JSON.stringify(skill, null, 3)));
        }
    }
    //factory.define ( SkillInfos, {
    //     context: "concept-aspect",
    //     type   : "skill",
    //     id     : undefined,
    //})

    function createPanel() {
        const slideshow = get({
            type: "slideshow",
            id: "panel-slideshow",
            //@ts-ignore
            direction: "bt",
            children: [{
                    context: "concept-ui",
                    type: "slide",
                    id: "data",
                }]
        });
        define(SkillInfos, "concept-infos", "data");
        define(SkillInfos, "console", "app-console");
        const slideInfos = get({ type: "concept-infos", id: "data" });
        const slideConsole = get({ type: "console", id: "app-console" });
        const panel = new Panel({
            context: "concept-ui",
            type: "panel",
            id: undefined,
            direction: "bt",
            hasMainButton: true,
            header: {
                context: "concept-ui",
                type: "toolbar",
                id: undefined,
                title: "Title ..",
                direction: "lr",
                buttons: [{
                        context: "concept-ui",
                        type: "button",
                        id: "console",
                        icon: "⚠",
                        text: "",
                        handleOn: "*",
                    }, {
                        context: "concept-ui",
                        type: "button",
                        id: "properties",
                        icon: "",
                        text: "panel properties",
                        handleOn: "*",
                    }]
            },
            children: [slideInfos.data, slideConsole.data]
        });
        addCommand("open-panel", (name, ...content) => {
            if (name)
                slideshow.show(name, ...content);
            else
                panel.open();
        });
        addCommand("open-infos-panel", (data) => {
            if (data) {
                slideInfos.display(data);
                panel.open();
            }
        });
        addCommand("close-panel", () => {
            panel.close();
        });
        return panel;
    }
    const panel = createPanel();
    document.body.append(...panel.getHtml());

    const menu = createMenu();
    document.body.append(...menu.elements());
    addCommand("open-menu", () => { menu.open(); });
    addCommand("close-menu", () => { menu.close(); });

    const G = Geometry;
    class RadialMenu extends Component {
        constructor() {
            super(...arguments);
            this.renderers = {
                "circle": this.renderSvgCircles.bind(this)
            };
        }
        getHtml() {
            this.update();
            return [this.container];
        }
        add(...buttons) {
            this.data.buttons.push(...buttons);
            this.update();
        }
        update() {
            const { data } = this;
            const def = {
                count: data.buttons.length,
                r: 75,
                padding: 6,
                rotation: data.rotation || 0
            };
            this.definition = G.getRadialDistribution(def);
            this.container = this.toSvg("circle");
        }
        enableEvents() {
            //const { options } = this
            //for ( const btn of options.buttons )
            //     btn.
        }
        show(x, y) {
            const n = this.container;
            const offset = this.definition.width / 2;
            n.style.left = (x - offset) + "px";
            n.style.top = (y - offset) + "px";
            n.classList.remove("close");
            window.addEventListener("mousedown", this.hide.bind(this), true);
        }
        hide() {
            this.container.classList.add("close");
            document.removeEventListener("mousedown", this.hide);
        }
        toSvg(style) {
            const { definition: def, renderers, data } = this;
            const svg = xnode("svg", { class: "radial-menu close", width: def.width + "px", height: def.height + "px", viewBox: `0 0 ${def.width} ${def.height}` });
            const buttuns = style in renderers
                ? renderers[style](def)
                : this.renderSvgCircles(def);
            svg.append(...buttuns);
            for (var i = 0; i != buttuns.length; i++) {
                const opt = data.buttons[i];
                if (typeof opt.callback == "function")
                    buttuns[i].addEventListener("mousedown", () => opt.callback());
            }
            return svg;
        }
        renderSvgCircles(definition) {
            const points = definition.points;
            const padding = definition.padding;
            const buttuns = [];
            for (var i = 0; i < points.length; ++i) {
                const def = points[i];
                const btn = this.data.buttons[i];
                const group = xnode("g", { class: "button" });
                const circle = createSvgShape("circle", {
                    size: def.chord.length - padding * 2,
                    x: def.x,
                    y: def.y
                });
                const text = xnode("text", { x: def.x, y: def.y, "font-size": "30", fill: "black", style: "user-select: none; cursor: pointer; dominant-baseline: central; text-anchor: middle;" });
                if (btn.fontFamily != undefined)
                    text.setAttribute("font-family", btn.fontFamily);
                text.innerHTML = btn.icon;
                group.append(circle);
                group.append(text);
                buttuns.push(group);
            }
            return buttuns;
        }
    }

    const fabric_base_obtions = {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
    };
    const Factory$1 = {
        group(def, size, opt) {
            return new fabric.Group(undefined, Object.assign({}, fabric_base_obtions, opt, { width: size, height: size }));
        },
        // To get triangle, square, [panta|hexa]gon points
        //
        // var a = Math.PI*2/4
        // for ( var i = 0 ; i != 4 ; i++ )
        //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )
        circle(def, size, opt) {
            return new fabric.Circle(Object.assign({}, fabric_base_obtions, opt, { radius: size / 2 }));
        },
        triangle(def, size, opt) {
            const points = [];
            const scale = 1.2;
            const r = size / 2 * scale;
            for (const p of [
                [0, 1],
                [0.8660254037844387, -0.4999999999999998],
                [-0.8660254037844385, -0.5000000000000004]
            ])
                points.push({ x: p[0] * r, y: p[1] * r });
            return new fabric.Polygon(points, Object.assign({}, fabric_base_obtions, opt, { angle: 180 }));
        },
        square(def, size, opt) {
            const scale = 0.9;
            return new fabric.Rect(Object.assign({}, fabric_base_obtions, opt, { width: size * scale, height: size * scale }));
        },
        pantagon(def, size, opt) {
            const points = [];
            const scale = 1.1;
            const r = size / 2 * scale;
            for (const p of [
                [0, 1],
                [0.9510565162951535, 0.30901699437494745],
                [0.5877852522924732, -0.8090169943749473],
                [-0.587785252292473, -0.8090169943749475],
                [-0.9510565162951536, 0.30901699437494723]
            ])
                points.push({ x: p[0] * r, y: p[1] * r });
            return new fabric.Polygon(points, Object.assign({}, fabric_base_obtions, opt, { angle: 180 }));
        },
        hexagon(def, size, opt) {
            const points = [];
            const scale = 1.1;
            const r = size / 2 * scale;
            for (const p of [
                [0, 1],
                [0.8660254037844386, 0.5000000000000001],
                [0.8660254037844387, -0.4999999999999998],
                [1.2246467991473532e-16, -1],
                [-0.8660254037844385, -0.5000000000000004],
                [-0.866025403784439, 0.49999999999999933],
            ])
                points.push({ x: p[0] * r, y: p[1] * r });
            return new fabric.Polygon(points, Object.assign({}, fabric_base_obtions, opt, { angle: 90 }));
        },
        text(def, size, opt) {
            return new fabric.Text("...", Object.assign({}, fabric_base_obtions, opt, { fontSize: size }));
        },
        textbox(def, size, opt) {
            return new fabric.Textbox("...", Object.assign({}, fabric_base_obtions, opt, { fontSize: size }));
        },
        path(def, size, opt) {
            return new fabric.Path(def.path, Object.assign({}, fabric_base_obtions, opt, { scaleX: size / 100, scaleY: size / 100 }));
        },
    };

    class Geometry$1 {
        constructor(owner) {
            this.owner = owner;
            const config = this.config = owner.config;
            this.object = Factory$1[config.shape](config, owner.displaySize(), {
                left: config.x,
                top: config.y,
                originX: "center",
                originY: "center",
                fill: config.backgroundColor,
                stroke: config.borderColor,
                strokeWidth: config.borderWidth,
            });
            if (config.backgroundImage != undefined)
                fabric.util.loadImage(config.backgroundImage, this.on_pattern.bind(this));
        }
        static create(owner, config) {
            config = Object.assign({ x: 0, y: 0 }, config);
            return Factory$1[config.shape](config, owner.displaySize(), {
                left: config.x,
                top: config.y,
                originX: "center",
                originY: "center",
                fill: config.backgroundColor,
                stroke: config.borderColor,
                strokeWidth: config.borderWidth,
            });
        }
        updatePosition() {
            const { config, object } = this;
            object.set({
                left: config.x,
                top: config.y,
            })
                .setCoords();
        }
        updateSize() {
            const { owner, config, object } = this;
            const size = owner.displaySize();
            if (config.shape == "circle") {
                object.set({
                    radius: size / 2
                });
            }
            else {
                object.set({
                    width: size,
                    height: size,
                });
            }
            object.setCoords();
        }
        on_pattern(dimg) {
            const { owner } = this;
            const factor = dimg.width < dimg.height
                ? owner.displaySize() / dimg.width
                : owner.displaySize() / dimg.height;
            this.object.set({
                fill: new fabric.Pattern({
                    source: dimg,
                    repeat: "no-repeat",
                    patternTransform: [
                        factor, 0, 0,
                        factor, 0, 0,
                    ]
                })
            })
                .setCoords();
            if (this.object.canvas)
                this.object.canvas.requestRenderAll();
        }
    }

    class Shape {
        constructor(data) {
            this.group = undefined;
            //console.log ( "Updata here Shape.data " + data.data )
            this.background = undefined;
            this.border = undefined;
            this.config = Object.assign({}, this.defaultConfig(), data);
        }
        defaultConfig() {
            return {
                context: "concept-aspect",
                type: "shape",
                id: undefined,
                data: undefined,
                x: 0,
                y: 0,
                //size      : 20,
                minSize: 1,
                sizeFactor: 1,
                sizeOffset: 0,
                shape: "circle",
                borderColor: "gray",
                borderWidth: 5,
                backgroundColor: "transparent",
                backgroundImage: undefined,
                backgroundRepeat: false,
                onCreate: undefined,
                onDelete: undefined,
                onTouch: undefined,
            };
        }
        init() {
            const { config } = this;
            const group = this.group = new fabric.Group([], {
                width: this.displaySize(),
                height: this.displaySize(),
                left: config.x,
                top: config.y,
                hasBorders: true,
                hasControls: true,
                originX: "center",
                originY: "center",
            });
            this.background = new Geometry$1(this);
            group.add(this.background.object);
            this.background.object.sendToBack();
            // ;(this.border as Geometry) = new Geometry ( this, this.config )
            // group.add ( this.border.object )
            group.setCoords();
        }
        displaySize() {
            const config = this.config;
            var size = (1 + config.sizeOffset) * config.sizeFactor;
            if (size < config.minSize)
                size = config.minSize;
            return size || 1;
        }
        updateSize() {
            const { group, config } = this;
            if (this.background)
                this.background.updateSize();
            if (this.border)
                this.border.updateSize();
            group.set({
                width: this.displaySize(),
                height: this.displaySize(),
            });
            if (group.canvas)
                group.canvas.requestRenderAll();
        }
        coords() {
            return this.group.getCoords();
        }
        setBackground(options) {
            Object.assign(this.config, options);
            this.updateSize();
        }
        setPosition(x, y) {
            const { group, config } = this;
            config.x = x;
            config.y = y;
            group.set({
                left: x,
                top: y
            })
                .setCoords();
            if (group.canvas)
                group.canvas.requestRenderAll();
        }
        hover(up) {
            const target = this.background != undefined
                ? this.background.object
                : this.group;
            target.setShadow('rgba(0,0,0,0.3)');
            fabric.util.animate({
                startValue: up ? 0 : 1,
                endValue: up ? 1 : 0,
                easing: fabric.util.ease.easeOutCubic,
                byValue: undefined,
                duration: 100,
                onChange: (value) => {
                    const offset = 1 * value;
                    target.setShadow(`${offset}px ${offset}px ${10 * value}px rgba(0,0,0,0.3)`);
                    target.scale(1 + 0.1 * value);
                    target.canvas.requestRenderAll();
                },
            });
        }
        toJson() {
            return JSON.stringify(this.config);
        }
    }

    const CONTEXT$2 = "concept-aspect";
    const db$2 = new Database();
    const factory$1 = new Factory(db$2); //.context <ShapeData> ( "concept-aspect" )
    const ASPECT = Symbol.for("ASPECT");
    function normalize$2(node) {
        if ("context" in node) {
            if (node.context !== CONTEXT$2)
                throw "Bad context value";
        }
        else {
            node.context = CONTEXT$2;
        }
        return node;
    }
    function get$2(obj) {
        if (obj == undefined)
            return undefined;
        if (obj instanceof Shape)
            return obj;
        if (obj instanceof fabric.Object)
            return obj[ASPECT];
        if (factory$1.inStock(CONTEXT$2, obj.type, obj.id))
            return factory$1.make(CONTEXT$2, obj.type, obj.id);
        const options = obj.context == CONTEXT$2
            ? obj
            : {
                context: CONTEXT$2,
                type: obj.type,
                id: obj.id,
                data: obj,
            };
        if (!isFinite(options.x))
            options.x = 0;
        if (!isFinite(options.y))
            options.y = 0;
        const shape = factory$1.make(options);
        shape.init();
        shape.group[ASPECT] = shape;
        if (shape.config.onCreate)
            shape.config.onCreate(shape.config.data, shape);
        return shape;
    }
    function set$1(node) {
        db$2.set(normalize$2(node));
    }
    function define$1(ctor, type) {
        factory$1.define(ctor, CONTEXT$2, type);
    }

    /*
    example:
    https://prezi.com/p/9jqe2wkfhhky/la-bulloterie-tpcmn/
    https://movilab.org/index.php?title=Utilisateur:Aur%C3%A9lienMarty
    */
    fabric.Object.prototype.padding = 0;
    fabric.Object.prototype.objectCaching = false;
    fabric.Object.prototype.hasControls = true;
    fabric.Object.prototype.hasBorders = true;
    fabric.Object.prototype.hasRotatingPoint = false;
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.centeredScaling = true;
    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.setControlVisible("ml", false);
    fabric.Object.prototype.setControlVisible("mt", false);
    fabric.Object.prototype.setControlVisible("mr", false);
    fabric.Object.prototype.setControlVisible("mb", false);
    fabric.Object.prototype.setControlVisible("tl", false);
    fabric.Object.prototype.setControlVisible("bl", false);
    fabric.Object.prototype.setControlVisible("br", false);
    class Area {
        constructor(canvas) {
            this.views = {};
            this.overFObject = undefined;
            this.onOverObject = null;
            this.onOutObject = null;
            this.onTouchObject = null;
            this.onDoubleTouchObject = null;
            this.onTouchArea = null;
            this.fcanvas = new fabric.Canvas(canvas);
            this.enableEvents();
        }
        get view() {
            return this.active;
        }
        createView(name) {
            const { views } = this;
            if (name in views)
                throw "The view already exists";
            return views[name] = {
                name,
                active: false,
                children: [],
                packing: "enclose",
                thumbnail: null,
            };
        }
        use(name) {
            const { fcanvas, views } = this;
            if (typeof name != "string")
                name = name.name;
            if (this.active && this.active.name == name)
                return;
            if (!(name in views))
                return;
            const active = this.active = views[name];
            fcanvas.clear();
            for (const shape of active.children)
                fcanvas.add(shape.group);
            return active;
        }
        add() {
            const { active, fcanvas } = this;
            if (arguments.length == 0)
                return;
            if (typeof arguments[0] == "string") {
                const node = get$1(...arguments);
                const shp = get$2(node);
                active.children.push(shp);
                fcanvas.add(shp.group);
            }
            else
                for (const s of arguments) {
                    const shp = get$2(s);
                    active.children.push(shp);
                    fcanvas.add(shp.group);
                }
            fcanvas.requestRenderAll();
        }
        clear() {
            this.fcanvas.clear();
        }
        pack() {
            const { fcanvas } = this;
            const objects = fcanvas.getObjects();
            const positions = [];
            for (const g of objects) {
                const r = (g.width > g.height ? g.width : g.height) / 2;
                positions.push({ x: g.left, y: g.top, r: r + 20 });
            }
            packEnclose(positions) * 2;
            for (var i = 0; i < objects.length; i++) {
                const g = objects[i];
                const p = positions[i];
                g.left = p.x;
                g.top = p.y;
                g.setCoords();
            }
            fcanvas.requestRenderAll();
        }
        zoom(factor) {
            const { fcanvas } = this;
            if (typeof factor == "number") {
                return;
            }
            const objects = fcanvas.getObjects();
            if (typeof factor == "object") {
                const o = factor.group;
                var left = o.left - o.width;
                var right = o.left + o.width;
                var top = o.top - o.height;
                var bottom = o.top + o.height;
            }
            else {
                var left = 0;
                var right = 0;
                var top = 0;
                var bottom = 0;
                for (const o of objects) {
                    const l = o.left - o.width;
                    const r = o.left + o.width;
                    const t = o.top - o.height;
                    const b = o.top + o.height;
                    if (l < left)
                        left = l;
                    if (r > right)
                        right = r;
                    if (t < top)
                        top = t;
                    if (b > bottom)
                        bottom = b;
                }
            }
            const w = right - left;
            const h = bottom - top;
            const vw = fcanvas.getWidth();
            const vh = fcanvas.getHeight();
            const f = w > h
                ? (vw < vh ? vw : vh) / w
                : (vw < vh ? vw : vh) / h;
            fcanvas.viewportTransform[0] = f;
            fcanvas.viewportTransform[3] = f;
            const cx = left + w / 2;
            const cy = top + h / 2;
            fcanvas.viewportTransform[4] = -(cx * f) + vw / 2;
            fcanvas.viewportTransform[5] = -(cy * f) + vh / 2;
            for (const o of objects)
                o.setCoords();
            fcanvas.requestRenderAll();
        }
        isolate(shape) {
            for (const o of this.fcanvas.getObjects()) {
                o.visible = false;
            }
            shape.group.visible = true;
        }
        getThumbnail() {
            const { active: cview } = this;
            const thumbnail = cview.thumbnail;
            if (thumbnail || cview.active == false)
                ;
            return cview.thumbnail = this.fcanvas.toDataURL({ format: "jpeg" });
        }
        // UI EVENTS
        enableEvents() {
            this.initClickEvent();
            this.initOverEvent();
            this.initPanEvent();
            this.initZoomEvent();
            this.initMoveObject();
            this.initDragEvent();
            window.addEventListener("resize", this.responsive.bind(this));
        }
        responsive() {
            var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
            var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
            this.fcanvas.setDimensions({
                width: width,
                height: height
            });
        }
        initClickEvent() {
            const page = this.fcanvas;
            const max_clich_area = 25 * 25;
            var last_click = -1;
            var last_pos = { x: -9999, y: -9999 };
            page.on("mouse:down", fevent => {
                const now = Date.now();
                const pos = fevent.pointer;
                const reset = () => {
                    last_click = now;
                    last_pos = pos;
                };
                // Nous vérifions que soit un double-clique.
                if (500 < now - last_click) {
                    if (this.onTouchObject) {
                        const element = get$2(fevent.target);
                        if (element)
                            this.onTouchObject(element);
                        fevent.e.stopImmediatePropagation();
                        return;
                    }
                    else {
                        return reset();
                    }
                }
                // Nous vérifions que les deux cliques se trouve dans une région proche.
                const zone = (pos.x - last_pos.x) * (pos.y - last_pos.y);
                if (zone < -max_clich_area || max_clich_area < zone)
                    return reset();
                // Si le pointer est au-dessus d’une forme.
                if (this.overFObject != undefined) {
                    if (this.onDoubleTouchObject) {
                        const element = get$2(fevent.target);
                        if (element)
                            this.onDoubleTouchObject(element);
                    }
                    last_click = -1;
                }
                // Si le pointer est au-dessus d’une zone vide.
                else {
                    if (this.onTouchArea)
                        this.onTouchArea(pos.x, pos.y);
                }
                fevent.e.stopImmediatePropagation();
                return;
            });
        }
        initOverEvent() {
            const page = this.fcanvas;
            page.on("mouse:over", fevent => {
                this.overFObject = fevent.target;
                if (this.onOverObject) {
                    const element = get$2(fevent.target);
                    if (element)
                        this.onOverObject(element);
                }
            });
            page.on("mouse:out", fevent => {
                this.overFObject = undefined;
                if (this.onOutObject) {
                    const element = get$2(fevent.target);
                    if (element)
                        this.onOutObject(element);
                }
            });
        }
        initPanEvent() {
            const page = this.fcanvas;
            var isDragging = false;
            var lastPosX = -1;
            var lastPosY = -1;
            page.on("mouse:down", fevent => {
                if (this.overFObject == undefined) {
                    page.selection = false;
                    page.discardActiveObject();
                    page.forEachObject(o => { o.selectable = false; });
                    isDragging = true;
                    lastPosX = fevent.pointer.x;
                    lastPosY = fevent.pointer.y;
                    page.requestRenderAll();
                }
            });
            page.on("mouse:move", fevent => {
                if (isDragging) {
                    const pointer = fevent.pointer;
                    page.viewportTransform[4] += pointer.x - lastPosX;
                    page.viewportTransform[5] += pointer.y - lastPosY;
                    page.requestRenderAll();
                    lastPosX = pointer.x;
                    lastPosY = pointer.y;
                }
            });
            page.on("mouse:up", () => {
                page.selection = true;
                page.forEachObject(o => {
                    o.selectable = true;
                    o.setCoords();
                });
                isDragging = false;
                page.requestRenderAll();
            });
        }
        initZoomEvent() {
            const page = this.fcanvas;
            page.on("mouse:wheel", fevent => {
                const event = fevent.e;
                var delta = event.deltaY;
                var zoom = page.getZoom();
                zoom = zoom - delta * 0.005;
                if (zoom > 9)
                    zoom = 9;
                if (zoom < 0.5)
                    zoom = 0.5;
                page.zoomToPoint(new fabric.Point(event.offsetX, event.offsetY), zoom);
                event.preventDefault();
                event.stopPropagation();
                page.requestRenderAll();
            });
        }
        initMoveObject() {
            const page = this.fcanvas;
            var cluster = undefined;
            var positions = undefined;
            var originX = 0;
            var originY = 0;
            function on_selection(fevent) {
                const target = fevent.target;
                cluster = target["cluster"];
                if (cluster == undefined)
                    return;
                originX = target.left;
                originY = target.top;
                positions = [];
                for (const o of cluster)
                    positions.push([o.left, o.top]);
                console.log("created");
            }
            page.on("selection:created", on_selection);
            page.on("selection:updated", on_selection);
            page.on("object:moving", fevent => {
                if (cluster == undefined)
                    return;
                const target = fevent.target;
                const offsetX = target.left - originX;
                const offsetY = target.top - originY;
                for (var i = 0; i < cluster.length; i++) {
                    const obj = cluster[i];
                    const pos = positions[i];
                    obj.set({
                        left: pos[0] + offsetX,
                        top: pos[1] + offsetY
                    });
                }
            });
            page.on("selection:cleared", fevent => {
                cluster = undefined;
                console.log("cleared");
            });
        }
        initDragEvent() {
            const page = this.fcanvas;
            page.on("drop", fevent => {
                console.log("DROP", fevent);
            });
            page.on("dragover", fevent => {
                console.log("DROP-OVER", fevent);
            });
        }
    }

    const area = (() => {
        const canvas = document.createElement("canvas");
        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        document.body.append(canvas);
        return new Area(canvas);
    })();
    const contextualMenu = new RadialMenu({
        context: "concept-ui",
        type: "radial-menu",
        id: "area-menu",
        buttons: [
            { type: "button", id: "add-thing", text: "", icon: "&#xe3c8;", fontFamily: "Material Icons", callback: () => { runCommand("zoom-extends"); } },
            { type: "button", id: "add-bubble", text: "", icon: "&#xe6dd;", fontFamily: "Material Icons" },
            { type: "button", id: "add-note", text: "", icon: "&#xe244;", fontFamily: "Material Icons" },
            { type: "button", id: "add-people", text: "", icon: "&#xe87c;", fontFamily: "Material Icons" },
            { type: "button", id: "add-tag", text: "", icon: "&#xe867;", fontFamily: "Material Icons" },
        ],
        rotation: Math.PI / 2,
    });
    document.body.append(...contextualMenu.getHtml());
    addCommand("open-contextal-menu", (x, y) => {
        contextualMenu.show(x, y);
    });
    addCommand("close-contextal-menu", () => {
        contextualMenu.hide();
    });
    addCommand("add-skill", (title) => {
        console.log("Add skill");
    });
    addCommand("add-person", (name) => {
    });
    addCommand("zoom-extends", () => {
        area.zoom();
    });
    addCommand("zoom-to", (shape) => {
        area.zoom(shape);
        area.isolate(shape);
    });
    // CLICK EVENTS
    // area.onTouchObject = ( shape ) =>
    // {
    //      runCommand ( "zoom-to", shape )
    // }
    area.onDoubleTouchObject = (shape) => {
        if (shape.config.onTouch != undefined)
            shape.config.onTouch(shape);
    };
    area.onTouchArea = (x, y) => {
        runCommand("open-contextal-menu", x, y);
    };
    // HOVER EVENTS
    area.onOverObject = (shape) => {
        shape.hover(true);
        area.fcanvas.requestRenderAll();
    };
    area.onOutObject = (shape) => {
        shape.hover(false);
        area.fcanvas.requestRenderAll();
    };

    onCommand("open-menu", () => {
        panel.close();
        contextualMenu.hide();
    });
    onCommand("open-panel", () => {
        menu.close();
        contextualMenu.hide();
    });

    class Badge extends Shape {
        constructor() {
            super(...arguments);
            this.owner = undefined;
            this.position = { angle: 0, offset: 0 };
        }
        init() {
            super.init();
            const { group } = this;
            const entity = get$1(this.config.data);
            const text = new fabric.Textbox(entity.emoji || "X", {
                fontSize: this.displaySize(),
                originX: "center",
                originY: "center",
                left: group.left,
                top: group.top,
            });
            group.addWithUpdate(text);
        }
        displaySize() {
            return 20;
        }
        attach(target, pos = {}) {
            const { random, PI } = Math;
            if (!isFinite(pos.angle))
                pos.angle = random() * PI * 2;
            if (!isFinite(pos.offset))
                pos.offset = 0.1;
            this.position = Object.assign({}, pos);
            if (this.owner != undefined)
                target.group.remove(this.group);
            target.group.add(this.group);
            this.owner = target;
            this.updatePosition();
        }
        updatePosition() {
            const { position: pos, owner } = this;
            if (owner == undefined)
                return;
            const { random, PI, cos, sin } = Math;
            const rad = pos.angle || random() * PI * 2;
            const x = sin(rad);
            const y = cos(rad);
            const s = owner.displaySize() / 2;
            const offset = typeof pos.offset == "number"
                ? this.displaySize() * pos.offset
                : this.displaySize() * 0.1;
            this.setPosition(x * (s + offset), y * (s + offset));
        }
    }

    class Container$1 extends Shape {
        constructor() {
            super(...arguments);
            this.children = [];
            this.display_size = 1;
        }
        init() {
            super.init();
            const entity = this.config.data;
            //for ( const child of Object.values ( entity.children ) )
            for (const child of Object.values(entity.items)) {
                const a = get$2(child);
                //a.init ()
                this.add(a);
            }
            this.pack();
        }
        displaySize() {
            const config = this.config;
            var size = (this.display_size + config.sizeOffset) * config.sizeFactor;
            if (size < config.minSize)
                size = config.minSize;
            return size || 1;
        }
        add(child) {
            const { group } = this;
            this.children.push(child);
            if (group) {
                group.add(child.group);
                group.setCoords();
            }
        }
        pack() {
            const { group, children, config } = this;
            const positions = [];
            for (const c of children) {
                const g = c.group;
                const r = (g.width > g.height ? g.width : g.height) / 2;
                positions.push({ x: g.left, y: g.top, r: r + 6 });
            }
            const size = packEnclose(positions) * 2;
            for (var i = 0; i < children.length; i++) {
                const g = children[i].group;
                const p = positions[i];
                g.left = p.x;
                g.top = p.y;
                group.add(g);
            }
            this.display_size = size + config.sizeOffset;
            this.updateSize();
        }
    }

    define$1(Shape, "person");
    define$1(Container$1, "skill");
    define$1(Badge, "badge");
    set$1({
        type: "person",
        id: undefined,
        data: undefined,
        shape: "circle",
        x: 0,
        y: 0,
        minSize: 30,
        sizeFactor: 1,
        sizeOffset: 0,
        borderColor: "#00c0aa",
        borderWidth: 4,
        backgroundColor: "transparent",
        backgroundImage: undefined,
        backgroundRepeat: false,
        onCreate: (person, aspect) => {
            aspect.setBackground({
                backgroundImage: person.avatar,
                shape: person.isCptain ? "square" : "circle",
            });
        },
        onDelete: undefined,
        onTouch: undefined,
    });
    set$1({
        type: "skill",
        id: undefined,
        data: undefined,
        shape: "circle",
        x: 0,
        y: 0,
        borderColor: "#f1bc31",
        borderWidth: 8,
        backgroundColor: "#FFFFFF",
        backgroundImage: undefined,
        backgroundRepeat: false,
        minSize: 50,
        sizeOffset: 10,
        sizeFactor: 1,
        onCreate(skill, aspect) {
            const data = get$1({
                type: "badge",
                id: skill.icon,
            });
            const badge = get$2(data);
            //badge.init ()
            badge.attach(aspect);
        },
        onTouch(shape) {
            const skill = get$1({
                type: shape.config.type,
                id: shape.config.id
            });
            runCommand("open-infos-panel", skill);
        },
        onDelete: undefined
    });
    set$1({
        type: "badge",
        id: undefined,
        data: undefined,
        x: 0,
        y: 0,
        minSize: 1,
        sizeFactor: 1,
        sizeOffset: 0,
        shape: "circle",
        borderColor: "gray",
        borderWidth: 0,
        backgroundColor: "transparent",
        backgroundImage: undefined,
        backgroundRepeat: false,
        onCreate: undefined,
        onDelete: undefined,
        onTouch: undefined,
    });

    /// <reference types="faker" />
    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const area$1 = area;
    const view = area$1.createView("compétances");
    area$1.use(view);
    // Person
    for (var i = 1; i <= 20; i++) {
        set({
            type: "person",
            id: "user" + i,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/f (${i}).jpg`,
            isCaptain: randomInt(0, 3) == 1,
        });
        set({
            type: "person",
            id: "user" + (20 + i),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/h (${i}).jpg`,
            isCaptain: randomInt(0, 3) == 1,
        });
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
        set(Object.assign({ context: "concept-data", type: "badge" }, badgePresets[name]));
    // Skills
    const person_count = count("person");
    for (const name in badgePresets) {
        const people = [];
        for (var j = randomInt(0, 6); j > 0; j--)
            people.push(get$1({ type: "person", id: "user" + randomInt(1, person_count) }));
        set({
            context: "concept-data",
            type: "skill",
            id: name,
            icon: name,
            items: people
        });
    }
    //
    for (const name in badgePresets)
        area$1.add("skill", name);
    // Notes
    // const note =  new B.Note ({
    //      text: "A note ...",
    // })
    // area.add ( Aspect.create ( note ) )
    area$1.pack();
    area$1.zoom();
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

}(fabric));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL1VpL0NvcmUvZG9tLnRzIiwiLi4vLi4vRGF0YS9EYXRhL25vZGUudHMiLCIuLi8uLi9EYXRhL0RiL2RhdGEtdHJlZS50cyIsIi4uLy4uL0RhdGEvRGIvZGIudHMiLCIuLi8uLi9EYXRhL0RiL2ZhY3RvcnkudHMiLCIuLi8uLi9VaS9Db3JlL3hub2RlLnRzIiwiLi4vLi4vVWkvQ29yZS9Db21wb25lbnQvaW5kZXgudHN4IiwiLi4vLi4vVWkvZGIudHMiLCIuLi8uLi9VaS9Db21wb25lbnQvUGhhbnRvbS9pbmRleC50c3giLCIuLi8uLi9VaS9Db3JlL0NvbnRhaW5lci9pbmRleC50c3giLCIuLi8uLi9VaS9Db3JlL2RyYWdnYWJsZS50cyIsIi4uLy4uL1VpL0NvcmUvZXhwZW5kYWJsZS50cyIsIi4uLy4uL0xpYi9ldmVudC50cyIsIi4uLy4uL0xpYi9udW1iZXIudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZGlzdHJpYnV0ZS50cyIsIi4uLy4uL0xpYi9nZW9tZXRyeS9kMy1lbmNsb3NlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLXBhY2sudHMiLCIuLi8uLi9MaWIvY3NzL3VuaXQudHMiLCIuLi8uLi9VaS9Db3JlL3N3aXBlYWJsZS50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9CYXIvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0J1dHRvbi9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvU2xpZGVzaG93L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9Ub29sYmFyL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9QYW5lbC9pbmRleC50c3giLCIuLi8uLi9VaS9Db3JlL1N2Zy9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvTWVudS9pbmRleC50c3giLCIuLi8uLi9VaS9pbmRleC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2NvbW1hbmQudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9EYXRhL2RiLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQ29tcG9uZW50L2luZm9zLnRzeCIsIi4uLy4uL0FwcGxpY2F0aW9uL3BhbmVsLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vbWVudS50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9DaXJjdWxhci1tZW51L2luZGV4LnRzeCIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9HZW9tZXRyeS9mYWN0b3J5LnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0dlb21ldHJ5L2dlb21ldHJ5LnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvc2hhcGUudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvZGIudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Db21wb25lbnQvYXJlYS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2FyZWEudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9pbmRleC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L2JhZGdlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvZ3JvdXAudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvaW5kZXgudHMiLCIuLi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbnR5cGUgRXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uID0gQ1NTU3R5bGVEZWNsYXJhdGlvbiAmXG57XG4gICAgZGlzcGxheSAgICAgIDogXCJpbmxpbmVcIiB8IFwiYmxvY2tcIiB8IFwiY29udGVudHNcIiB8IFwiZmxleFwiIHwgXCJncmlkXCIgfCBcImlubGluZS1ibG9ja1wiIHwgXCJpbmxpbmUtZmxleFwiIHwgXCJpbmxpbmUtZ3JpZFwiIHwgXCJpbmxpbmUtdGFibGVcIiB8IFwibGlzdC1pdGVtXCIgfCBcInJ1bi1pblwiIHwgXCJ0YWJsZVwiIHwgXCJ0YWJsZS1jYXB0aW9uXCIgfCBcInRhYmxlLWNvbHVtbi1ncm91cFwiIHwgXCJ0YWJsZS1oZWFkZXItZ3JvdXBcIiB8IFwidGFibGUtZm9vdGVyLWdyb3VwXCIgfCBcInRhYmxlLXJvdy1ncm91cFwiIHwgXCJ0YWJsZS1jZWxsXCIgfCBcInRhYmxlLWNvbHVtblwiIHwgXCJ0YWJsZS1yb3dcIiB8IFwibm9uZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIGZsZXhEaXJlY3Rpb246IFwicm93XCIgfCBcInJvdy1yZXZlcnNlXCIgfCBcImNvbHVtblwiIHwgXCJjb2x1bW4tcmV2ZXJzZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93ICAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvd1ggICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dZICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIHBvc2l0aW9uICAgICA6IFwic3RhdGljXCIgfCBcImFic29sdXRlXCIgfCBcImZpeGVkXCIgfCBcInJlbGF0aXZlXCIgfCBcInN0aWNreVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxufVxuXG4vL2RlY2xhcmUgZ2xvYmFsXG4vL3tcbiAgICAgaW50ZXJmYWNlIFdpbmRvd1xuICAgICB7XG4gICAgICAgICAgb246IFdpbmRvdyBbXCJhZGRFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgb2ZmOiBXaW5kb3cgW1wicmVtb3ZlRXZlbnRMaXN0ZW5lclwiXVxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlIEVsZW1lbnRcbiAgICAge1xuICAgICAgICAgIGNzcyAoIHByb3BlcnRpZXM6IFBhcnRpYWwgPEV4dGVuZGVkQ1NTU3R5bGVEZWNsYXJhdGlvbj4gKTogdGhpc1xuXG4gICAgICAgICAgY3NzSW50ICAgKCBwcm9wZXJ0eTogc3RyaW5nICk6IG51bWJlclxuICAgICAgICAgIGNzc0Zsb2F0ICggcHJvcGVydHk6IHN0cmluZyApOiBudW1iZXJcblxuICAgICAgICAgIG9uIDogSFRNTEVsZW1lbnQgW1wiYWRkRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgIG9mZjogSFRNTEVsZW1lbnQgW1wicmVtb3ZlRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgICQgIDogSFRNTEVsZW1lbnQgW1wicXVlcnlTZWxlY3RvclwiXVxuICAgICAgICAgICQkIDogSFRNTEVsZW1lbnQgW1wicXVlcnlTZWxlY3RvckFsbFwiXVxuICAgICB9XG4vL31cblxuV2luZG93LnByb3RvdHlwZS5vbiAgPSBXaW5kb3cucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJcbldpbmRvdy5wcm90b3R5cGUub2ZmID0gV2luZG93LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uICggcHJvcHMgKVxue1xuT2JqZWN0LmFzc2lnbiAoIHRoaXMuc3R5bGUsIHByb3BzIClcbnJldHVybiB0aGlzXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3NGbG9hdCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuRWxlbWVudC5wcm90b3R5cGUub24gID0gRWxlbWVudC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuXG5FbGVtZW50LnByb3RvdHlwZS5vZmYgPSBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLiQgICA9IEVsZW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JcblxuRWxlbWVudC5wcm90b3R5cGUuJCQgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbFxuXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuIiwiXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcmRmanMtYmFzZS9kYXRhLW1vZGVsL3RyZWUvbWFzdGVyL2xpYlxuXG5leHBvcnQgaW50ZXJmYWNlICROb2RlXG57XG4gICAgIHJlYWRvbmx5IGNvbnRleHQ6IHN0cmluZ1xuICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcbiAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZ1xufVxuXG52YXIgbmV4dElkID0gMFxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZSA8RCBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgZXh0ZW5kcyBzdHJpbmcgPSBEIFtcInR5cGVcIl0+ICggdHlwZTogVCwgaWQ6IHN0cmluZywgZGF0YTogUGFydGlhbCA8T21pdCA8RCwgXCJ0eXBlXCIgfCBcImlkXCI+PiApXG57XG4gICAgIHR5cGUgTiA9IHsgLXJlYWRvbmx5IFtLIGluIGtleW9mIERdOiBEW0tdIH1cblxuICAgICA7KGRhdGEgYXMgTikudHlwZSA9IHR5cGVcbiAgICAgOyhkYXRhIGFzIE4pLmlkICAgPSBpZCB8fCAoKytuZXh0SWQpLnRvU3RyaW5nICgpXG4gICAgIHJldHVybiBkYXRhIGFzIERcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVJZCAoIG5vZGU6ICROb2RlIClcbntcbiAgICAgcmV0dXJuIG5vZGUuY29udGV4dCArICcjJyArIG5vZGUudHlwZSArICc6JyArIG5vZGUuaWRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsTm9kZXMgKCBhOiAkTm9kZSwgYjogJE5vZGUgKVxue1xuICAgICByZXR1cm4gISFhICYmICEhYlxuICAgICAgICAgICYmIGEudHlwZSA9PT0gYi50eXBlXG4gICAgICAgICAgJiYgYS5pZCAgID09PSBiLmlkXG59XG5cbi8qZXhwb3J0IGNsYXNzIE5vZGUgPEQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUIGV4dGVuZHMgc3RyaW5nID0gRCBbXCJ0eXBlXCJdPlxue1xuICAgICBzdGF0aWMgbmV4dElkID0gMFxuXG4gICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZ1xuXG4gICAgIHJlYWRvbmx5IGlkOiBzdHJpbmdcblxuICAgICByZWFkb25seSB1aWQ6IG51bWJlclxuXG4gICAgIHJlYWRvbmx5IGRhdGE6IERcblxuICAgICBkZWZhdWx0RGF0YSAoKTogJE5vZGVcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJub2RlXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiBEIClcbiAgICAge1xuICAgICAgICAgIHRoaXMudHlwZSA9IGRhdGEudHlwZVxuICAgICAgICAgIHRoaXMudWlkICA9ICsrTm9kZS5uZXh0SWRcbiAgICAgICAgICB0aGlzLmlkICAgPSBkYXRhLmlkIHx8IChkYXRhLmlkID0gdGhpcy51aWQudG9TdHJpbmcgKCkpXG5cbiAgICAgICAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduICggdGhpcy5kZWZhdWx0RGF0YSAoKSwgZGF0YSBhcyBEIClcbiAgICAgfVxuXG4gICAgIGVxdWFscyAoIG90aGVyOiBOb2RlIDxhbnk+IClcbiAgICAge1xuICAgICAgICAgIHJldHVybiAhIW90aGVyXG4gICAgICAgICAgICAgICAmJiBvdGhlci50eXBlID09PSB0aGlzLnR5cGVcbiAgICAgICAgICAgICAgICYmIG90aGVyLmlkICAgPT09IHRoaXMuaWRcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5kYXRhIClcbiAgICAgfVxufSovXG4iLCJcbnR5cGUgUGF0aCA9IHtcbiAgICAgLyoqIEl0ZXJhdG9yICovXG4gICAgIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPjtcbiB9XG5cbmV4cG9ydCBjbGFzcyBEYXRhVHJlZSA8VD5cbntcbiAgICAgcHJvdGVjdGVkIHJlY29yZHMgPSB7fSBhcyB7XG4gICAgICAgICAgW2NvbnRleHQ6IHN0cmluZ106IFQgfCB7XG4gICAgICAgICAgICAgICBbdHlwZTogc3RyaW5nXTogVCB8IHtcbiAgICAgICAgICAgICAgICAgICAgW2lkOiBzdHJpbmddOiBUXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgaGFzICggcGF0aDogc3RyaW5nIFtdICkgIDogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICB2YXIgY291bnQgPSAwXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvdW50ICsrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXRoLmxlbmd0aCA9PSBjb3VudFxuICAgICB9XG5cbiAgICAgY291bnQgKCBwYXRoOiBzdHJpbmcgW10gKVxuICAgICB7XG4gICAgICAgICAgdmFyICByZWMgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkIGluIHJlY1xuICAgICAgICAgICAgICAgPyBPYmplY3Qua2V5cyAoIHJlYyApLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGhcblxuICAgICB9XG5cbiAgICAgc2V0ICggcGF0aDogc3RyaW5nIFtdLCBkYXRhOiBUICk6IFRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXSA9IHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXSA9IGRhdGFcbiAgICAgfVxuXG4gICAgIGdldCAoIHBhdGg6IHN0cmluZyBbXSApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgbmVhciAoIHBhdGg6IHN0cmluZyBbXSApOiBUXG4gICAgIHtcbiAgICAgICAgICB2YXIgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgd2FsayAoIHBhdGg6IFBhdGgsIGNiOiAoIGRhdGE6IFQgKSA9PiB2b2lkIClcbiAgICAge1xuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgY29uc3QgdW5kICA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICBjYiAoIHJlYyBbdW5kXSApXG5cbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgcmV0dXJuXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgT3B0aW9uYWwsIFJlcXVpcmUgfSBmcm9tIFwiLi4vLi4vTGliL3R5cGluZ1wiXG5pbXBvcnQgeyAkTm9kZSB9IGZyb20gXCIuLi9EYXRhL25vZGVcIlxuaW1wb3J0IHsgRGF0YVRyZWUgfSBmcm9tIFwiLi9kYXRhLXRyZWVcIlxuXG50eXBlICREYXRhIDxOIGV4dGVuZHMgJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cblxudHlwZSBDIDxOIGV4dGVuZHMgJE5vZGU+ID0gTiBbXCJjb250ZXh0XCJdXG50eXBlIFQgPE4gZXh0ZW5kcyAkTm9kZT4gPSBOIFtcInR5cGVcIl1cbnR5cGUgRCA8TiBleHRlbmRzICROb2RlPiA9IE9wdGlvbmFsIDxOLCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPlxuXG50eXBlIFJlZiA8TiBleHRlbmRzICROb2RlPiA9IFJlcXVpcmUgPFBhcnRpYWwgPE4+LCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPlxuXG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZSA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+XG57XG4gICAgIHRyZWUgICAgID0gbmV3IERhdGFUcmVlIDxOPiAoKVxuXG4gICAgIGhhcyAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGJvb2xlYW5cbiAgICAgaGFzICggY29udGV4dDogQyA8Tj4sIHR5cGU6IHN0cmluZywgaWQ6IHN0cmluZyApIDogYm9vbGVhblxuXG4gICAgIGhhcyAoIGM6ICROb2RlIHwgc3RyaW5nLCB0Pzogc3RyaW5nLCBpPzogc3RyaW5nICk6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIHJldHVybiB0eXBlb2YgYyA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgPyB0aGlzLnRyZWUubmVhciAoIFtjLCB0IGFzIHN0cmluZywgaV0gKSAgICAgICAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICA6IHRoaXMudHJlZS5uZWFyICggW2MuY29udGV4dCwgYy50eXBlLCBjLmlkXSApICE9PSB1bmRlZmluZWRcbiAgICAgfVxuXG4gICAgIGNvdW50ICggbm9kZTogUmVmIDxOPiApICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyXG4gICAgIGNvdW50ICggY29udGV4dDogQyA8Tj4sIHR5cGU6IHN0cmluZywgaWQ/OiBzdHJpbmcgKSA6IG51bWJlclxuXG4gICAgIGNvdW50ICggYzogJE5vZGUgfCBzdHJpbmcsIHQ/OiBzdHJpbmcsIGk/OiBzdHJpbmcgKTogbnVtYmVyXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGMgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgID8gdGhpcy50cmVlLmNvdW50ICggW2MsIHQgYXMgc3RyaW5nLCBpXSApXG4gICAgICAgICAgICAgICA6IHRoaXMudHJlZS5jb3VudCAoIFtjLmNvbnRleHQsIGMudHlwZSwgYy5pZF0gKVxuICAgICB9XG5cbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiAkICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHZvaWRcbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBjb250ZXh0OiBDIDwkPiwgdHlwZTogVCA8JD4sIGlkOiBzdHJpbmcsIGRhdGE6IEQgPCQ+ICk6IHZvaWRcblxuICAgICBzZXQgKCBjOiBOIHwgc3RyaW5nLCB0Pzogc3RyaW5nLCBpPzogc3RyaW5nLCBkYXRhPzogJERhdGEgPE4+ICkgICAgICAgICAgIDogdm9pZFxuICAgICB7XG4gICAgICAgICAgaWYgKCB0eXBlb2YgYyA9PT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgOyhkYXRhIGFzIGFueSkuY29udGV4dCA9IGNcbiAgICAgICAgICAgICAgIDsoZGF0YSBhcyBhbnkpLnR5cGUgICAgPSB0XG4gICAgICAgICAgICAgICA7KGRhdGEgYXMgYW55KS5pZCAgICAgID0gaVxuICAgICAgICAgICAgICAgdGhpcy50cmVlLnNldCAoIFtjLCB0IGFzIHN0cmluZywgaV0sIGRhdGEgYXMgTiApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHRoaXMudHJlZS5zZXQgKCBbYy5jb250ZXh0LCBjLnR5cGUsIGMuaWRdLCBjIClcbiAgICAgfVxuXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggbm9kZTogUmVmIDwkTm9kZT4gKSAgICAgICAgICAgICAgICAgICAgICAgOiAkXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggY29udGV4dDogQyA8JD4sIHR5cGU6IHN0cmluZywgaWQ6IHN0cmluZyApOiAkXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiAkXG5cbiAgICAgLy9nZXQgPCQgZXh0ZW5kcyBOID0gTj4gKFxuICAgICAvLyAgICAgYSAgICA6IHN0cmluZyB8ICROb2RlLFxuICAgICAvLyAgICAgYj8gICA6IHN0cmluZyB8ICREYXRhIDxOPixcbiAgICAgLy8gICAgIGM/ICAgOiBzdHJpbmcsXG4gICAgIC8vICAgICBkYXRhPzogJERhdGEgPE4+XG4gICAgIC8vKTogJFxuICAgICBnZXQgKClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0ge30gLy9hcyAkXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86ICROb2RlID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgdGhpcy50cmVlLndhbGsgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgZGF0YSApXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIG8gKVxuXG4gICAgICAgICAgICAgICAvLyB0aGlzLnRyZWUud2FsayAoIFthLmNvbnRleHQsIGEudHlwZSwgYS5pZF0sIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgLy8gICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICAgICAgIC8vIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCBhLCBiIClcbiAgICAgICAgICB9XG4gICAgICAgICAgLy9pZiAoIHR5cGVvZiBhID09PSBcInN0cmluZ1wiIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy50cmVlLndhbGsgKCBhcmd1bWVudHMsIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IGFyZ3VtZW50cyBbMF0sXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IGFyZ3VtZW50cyBbMV0sXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICA6IGFyZ3VtZW50cyBbMl0sXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAvLyB0aGlzLnRyZWUud2FsayAoIFthLCBiIGFzIHN0cmluZywgY10sIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgLy8gICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICAgICAgIC8vIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhLCB7XG4gICAgICAgICAgICAgICAvLyAgICAgIGNvbnRleHQ6IGEsXG4gICAgICAgICAgICAgICAvLyAgICAgIHR5cGUgICA6IGIsXG4gICAgICAgICAgICAgICAvLyAgICAgIGlkICAgICA6IGMsXG4gICAgICAgICAgICAgICAvLyB9KVxuICAgICAgICAgIH1cbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuL2RiXCJcbmltcG9ydCB7IERhdGFUcmVlIH0gZnJvbSBcIi4vZGF0YS10cmVlXCJcblxuaW1wb3J0IHsgJE5vZGUgfSBmcm9tIFwiLi4vRGF0YS9ub2RlXCJcbmltcG9ydCB7IE9wdGlvbmFsLCBSZXF1aXJlIH0gZnJvbSBcIi4uLy4uL0xpYi90eXBpbmdcIlxuXG5cbnR5cGUgUmVmIDxOIGV4dGVuZHMgJE5vZGU+ID0gUmVxdWlyZSA8UGFydGlhbCA8Tj4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cbnR5cGUgQyA8TiBleHRlbmRzICROb2RlPiA9IE4gW1wiY29udGV4dFwiXVxudHlwZSBUIDxOIGV4dGVuZHMgJE5vZGU+ID0gTiBbXCJ0eXBlXCJdXG50eXBlIEQgPE4gZXh0ZW5kcyAkTm9kZT4gPSBPcHRpb25hbCA8TiwgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cblxuXG5leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOICkgPT4gVFxuZXhwb3J0IHR5cGUgRnVuYyA8TiBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgPSBhbnk+ID0gKCBkYXRhOiBOICkgPT4gVFxuXG50eXBlIEFyZyA8Rj4gPSBGIGV4dGVuZHMgbmV3ICggZGF0YTogaW5mZXIgRCApID0+IGFueSA/IERcbiAgICAgICAgICAgICA6IEYgZXh0ZW5kcyAgICAgKCBkYXRhOiBpbmZlciBEICkgPT4gYW55ID8gRFxuICAgICAgICAgICAgIDogYW55XG5cbnR5cGUgRkMgPEYgZXh0ZW5kcyBDdG9yIHwgRnVuYz4gPSBDIDxBcmcgPEY+PlxudHlwZSBGVCA8RiBleHRlbmRzIEN0b3IgfCBGdW5jPiA9IFQgPEFyZyA8Rj4+XG5cblxuZXhwb3J0IGNsYXNzIEZhY3RvcnkgPEUgPSBhbnksIE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPlxue1xuICAgICBjb25zdHJ1Y3RvciAoIHJlYWRvbmx5IGRiOiBEYXRhYmFzZSA8Tj4gKSB7fVxuXG4gICAgIHByaXZhdGUgY3RvcnMgPSBuZXcgRGF0YVRyZWUgPEN0b3IgfCBGdW5jIDwkTm9kZSwgRT4+ICgpXG4gICAgIHByaXZhdGUgaW5zdHMgPSAgbmV3IERhdGFUcmVlIDxFPiAoKVxuXG4gICAgIGluU3RvY2sgKCBub2RlOiBSZWYgPE4+ICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCBjb250ZXh0OiBDIDxOPiwgdHlwZT86IFQgPE4+LCBpZD86IHN0cmluZyApOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCBjOiBSZWYgPE4+IHwgQyA8Tj4sIHQ/OiBUIDxOPiwgaT86IHN0cmluZyApOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHR5cGVvZiBjICE9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpID0gYy5pZFxuICAgICAgICAgICAgICAgdCA9IGMudHlwZVxuICAgICAgICAgICAgICAgYyA9IGMuY29udGV4dFxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0aGlzLmN0b3JzLmhhcyAoIFtjLCB0LCBpXSApXG4gICAgIH1cblxuICAgICBkZWZpbmUgPEYgZXh0ZW5kcyBDdG9yIHwgRnVuYz4gKCBjdG9yOiBGLCBub2RlOiBBcmcgPEY+ICk6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3RvciB8IEZ1bmM+ICggY3RvcjogRiwgY29udGV4dDogRkMgPEY+LCB0eXBlOiBGVCA8Rj4sIGlkPzogc3RyaW5nICk6IHZvaWRcbiAgICAgZGVmaW5lICggY3RvcjogQ3RvciB8IEZ1bmMsIGM6IE4gfCBzdHJpbmcsIHQ/OiBzdHJpbmcsIGk/OiBzdHJpbmcgKTogdm9pZFxuICAgICB7XG4gICAgICAgICAgaWYgKCB0eXBlb2YgYyAhPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaSA9IGMuaWRcbiAgICAgICAgICAgICAgIHQgPSBjLnR5cGVcbiAgICAgICAgICAgICAgIGMgPSBjLmNvbnRleHRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHRoaXMuY3RvcnMuaGFzICggW2MsIHQsIGldICkgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgdGhpcy5jdG9ycy5zZXQgKCBbYywgdCwgaV0sIGN0b3IgKVxuICAgICB9XG5cbiAgICAgbWFrZSA8UiBleHRlbmRzIEU+ICggbm9kZTogTiwgZGF0YT86IEQgPE4+ICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFJcbiAgICAgbWFrZSA8UiBleHRlbmRzIEU+ICggY29udGV4dDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIGlkOiBzdHJpbmcsIGRhdGE/OiBEIDxOPiApOiBSXG4gICAgIG1ha2UgKFxuICAgICAgICAgIGMgICAgOiBzdHJpbmcgfCAkTm9kZSxcbiAgICAgICAgICB0PyAgIDogc3RyaW5nIHwgRCA8JE5vZGU+LFxuICAgICAgICAgIGk/ICAgOiBzdHJpbmcsXG4gICAgICAgICAgZGF0YT86IEQgPCROb2RlPlxuICAgICApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHR5cGVvZiBjICE9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBkYXRhID0gY1xuICAgICAgICAgICAgICAgdCA9IGMudHlwZVxuICAgICAgICAgICAgICAgaSA9IGMuaWRcbiAgICAgICAgICAgICAgIGMgPSBjLmNvbnRleHRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHRoaXMuaW5zdHMuaGFzICggW2MsIHQgYXMgc3RyaW5nLCBpXSApIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2lmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIC8vICAgICBjb25zb2xlLndhcm4gKFwiQ2FuIG5vdCBhc3NpZ24gbmV3IGRhdGFcIilcblxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggW2MsIHQgYXMgc3RyaW5nLCBpXSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgY3RvciA9IHRoaXMuY3RvcnMubmVhciAoIFtjLCB0IGFzIHN0cmluZywgaV0gKVxuXG4gICAgICAgICAgaWYgKCBjdG9yID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICBjb25zdCB0bXAgPSB0aGlzLmRiLmdldCAoIGMsIHQgYXMgc3RyaW5nLCBpIClcblxuICAgICAgICAgIGRhdGEgPSBkYXRhID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgPyB0bXBcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmFzc2lnbiAoIHRtcCwgZGF0YSApXG5cbiAgICAgICAgICBpZiAoIGN0b3IudG9TdHJpbmcgKCkuaW5kZXhPZiAoXCJjbGFzc1wiKSA9PSAwIClcbiAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuc2V0ICggW2MsIHQgYXMgc3RyaW5nLCBpXSwgbmV3IGN0b3IgKCBkYXRhIGFzICROb2RlICkgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuc2V0ICggW2MsIHQgYXMgc3RyaW5nLCBpXSwgY3RvciAoIGRhdGEgYXMgJE5vZGUgKSApXG4gICAgIH1cbn1cbiIsIlxuXG5cbmV4cG9ydCBjb25zdCB4bm9kZSA9ICgoKSA9Plxue1xuICAgICBjb25zdCBzdmdfbmFtZXMgPSBbIFwic3ZnXCIsIFwiZ1wiLCBcImxpbmVcIiwgXCJjaXJjbGVcIiwgXCJwYXRoXCIsIFwidGV4dFwiIF1cblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNIVE1MRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnRcblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNTVkdFbGVtZW50cyxcbiAgICAgICAgICBwcm9wczogYW55LFxuICAgICAgICAgIC4uLmNoaWxkcmVuOiBbIEhUTUxFbGVtZW50IHwgc3RyaW5nIHwgYW55W10gXVxuICAgICApOiBTVkdFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24gKCB7fSwgcHJvcHMgKVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IHN2Z19uYW1lcy5pbmRleE9mICggbmFtZSApID09PSAtMVxuICAgICAgICAgICAgICAgICAgICA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBuYW1lIClcbiAgICAgICAgICAgICAgICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgKCBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIG5hbWUgKVxuXG4gICAgICAgICAgY29uc3QgY29udGVudCA9IFtdIGFzIGFueVtdXG5cbiAgICAgICAgICAvLyBDaGlsZHJlblxuXG4gICAgICAgICAgd2hpbGUgKCBjaGlsZHJlbi5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjaGlsZHJlbi5wb3AoKVxuXG4gICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGNoaWxkICkgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNoaWxkLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaCggY2hpbGQgW2ldIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKCBjaGlsZCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2hpbGUgKCBjb250ZW50Lmxlbmd0aCA+IDAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IGNvbnRlbnQucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBjaGlsZCBpbnN0YW5jZW9mIE5vZGUgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBjaGlsZCApXG5cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY2hpbGQgPT0gXCJib29sZWFuXCIgfHwgY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSggY2hpbGQudG9TdHJpbmcoKSApIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBdHRyaWJ1dGVzXG5cbiAgICAgICAgICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheVxuICAgICAgICAgIGNvbnN0IGNvbnY6IFJlY29yZCA8c3RyaW5nLCAodjogYW55KSA9PiBzdHJpbmc+ID1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbGFzczogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKSA6IHYsXG4gICAgICAgICAgICAgICBzdHlsZTogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHR5cGVvZiB2ID09IFwib2JqZWN0XCIgPyBvYmplY3RUb1N0eWxlICh2KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHYsXG4gICAgICAgICAgICAgICAvLyBzdmdcbiAgICAgICAgICAgICAgIGQ6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBwcm9wcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9wc1trZXldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09IFwiZnVuY3Rpb25cIiApXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIGtleSwgdmFsdWUgKVxuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlICgga2V5LCAoY29udltrZXldIHx8ICh2PT52KSkgKHZhbHVlKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRcblxuICAgICAgICAgIGZ1bmN0aW9uIG9iamVjdFRvU3R5bGUgKCBvYmo6IG9iamVjdCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCJcblxuICAgICAgICAgICAgICAgZm9yICggY29uc3Qga2V5IGluIG9iaiApXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBrZXkgKyBcIjogXCIgKyBvYmogW2tleV0gKyBcIjsgXCJcblxuICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIGNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZSAoXG4gICAgICAgICAgICAgICAgICAgIC8oPzpbQS1aXXxcXGJcXHcpL2csXG4gICAgICAgICAgICAgICAgICAgICggd29yZCwgaW5kZXggKSA9PiBpbmRleCA9PSAwID8gd29yZC50b0xvd2VyQ2FzZSgpIDogd29yZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICApLnJlcGxhY2UoL1xccysvZywgJycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIHVuY2FtZWxpemUgKCBzdHI6IHN0cmluZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN0ci50cmltICgpLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgLy8gICAvKD88IS0pKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6ICctJyArIHdvcmQudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC8oPzpcXHMrfF8pL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gY3JlYXRlXG5cbn0pICgpXG5cbmV4cG9ydCBuYW1lc3BhY2UgSlNYXG57XG4gICAgIGV4cG9ydCB0eXBlIEVsZW1lbnQgPSBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuXHRleHBvcnQgdHlwZSBJbnRyaW5zaWNFbGVtZW50cyA9IEludHJpbnNpY0hUTUxFbGVtZW50cyAmIEludHJpbnNpY1NWR0VsZW1lbnRzXG5cblx0ZXhwb3J0IGludGVyZmFjZSBJbnRyaW5zaWNIVE1MRWxlbWVudHNcblx0e1xuXHRcdGEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0YWJiciAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRhZGRyZXNzICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGFyZWEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0YXJ0aWNsZSAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRhc2lkZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGF1ZGlvICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0YiAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRiYXNlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGJkaSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0YmRvICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRiaWcgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGJsb2NrcXVvdGU6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0Ym9keSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRiciAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGJ1dHRvbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0Y2FudmFzICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRjYXB0aW9uICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGNpdGUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0Y29kZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRjb2wgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGNvbGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0ZGF0YSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRkYXRhbGlzdCAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGRkICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0ZGVsICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRkZXRhaWxzICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGRmbiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0ZGlhbG9nICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRkaXYgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGRsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0ZHQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRlbSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGVtYmVkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0ZmllbGRzZXQgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRmaWdjYXB0aW9uOiBIVE1MQXR0cmlidXRlc1xuXHRcdGZpZ3VyZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0Zm9vdGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRmb3JtICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGgxICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0aDIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRoMyAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGg0ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0aDUgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRoNiAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGhlYWQgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0aGVhZGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRoZ3JvdXAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGhyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0aHRtbCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRpICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGlmcmFtZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0aW1nICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRpbnB1dCAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGlucyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0a2JkICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRrZXlnZW4gICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGxhYmVsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0bGVnZW5kICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRsaSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdGxpbmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0bWFpbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRtYXAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdG1hcmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0bWVudSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRtZW51aXRlbSAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdG1ldGEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0bWV0ZXIgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRuYXYgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdG5vc2NyaXB0ICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0b2JqZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRvbCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdG9wdGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0b3B0aW9uICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRvdXRwdXQgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHAgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0cGFyYW0gICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRwaWN0dXJlICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHByZSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0cHJvZ3Jlc3MgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRxICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHJwICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0cnQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRydWJ5ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHMgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0c2FtcCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRzY3JpcHQgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHNlY3Rpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0c2VsZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRzbG90ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHNtYWxsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0c291cmNlICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRzcGFuICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHN0cm9uZyAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0c3R5bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHRzdWIgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHN1bW1hcnkgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0c3VwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHR0YWJsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHRib2R5ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0dGQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHR0ZXh0YXJlYSAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHRmb290ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0dGggICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHR0aGVhZCAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHRpbWUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0dGl0bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHR0ciAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHRyYWNrICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdFx0dSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHR1bCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdFwidmFyXCIgICAgIDogSFRNTEF0dHJpYnV0ZXNcblx0XHR2aWRlbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuXHRcdHdiciAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY1NWR0VsZW1lbnRzXG5cdHtcblx0XHRzdmcgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0YW5pbWF0ZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGNpcmNsZSAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRjbGlwUGF0aCAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0ZGVmcyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGRlc2MgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRlbGxpcHNlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0ZmVCbGVuZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGZlQ29sb3JNYXRyaXggICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRmZUNvbXBvbmVudFRyYW5zZmVyOiBTVkdBdHRyaWJ1dGVzXG5cdFx0ZmVDb21wb3NpdGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGZlQ29udm9sdmVNYXRyaXggICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRmZURpZmZ1c2VMaWdodGluZyAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0ZmVEaXNwbGFjZW1lbnRNYXAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGZlRmxvb2QgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRmZUdhdXNzaWFuQmx1ciAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0ZmVJbWFnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGZlTWVyZ2UgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRmZU1lcmdlTm9kZSAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0ZmVNb3JwaG9sb2d5ICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGZlT2Zmc2V0ICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRmZVNwZWN1bGFyTGlnaHRpbmcgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0ZmVUaWxlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGZlVHVyYnVsZW5jZSAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRmaWx0ZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0Zm9yZWlnbk9iamVjdCAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGcgICAgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRpbWFnZSAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0bGluZSAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdGxpbmVhckdyYWRpZW50ICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRtYXJrZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0bWFzayAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdHBhdGggICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRwYXR0ZXJuICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0cG9seWdvbiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdHBvbHlsaW5lICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRyYWRpYWxHcmFkaWVudCAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0cmVjdCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdHN0b3AgICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHRzeW1ib2wgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdFx0dGV4dCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuXHRcdHRzcGFuICAgICAgICAgICAgICA6IFNWR0F0dHJpYnV0ZXNcblx0XHR1c2UgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG5cdH1cbn1cblxuXG5pbnRlcmZhY2UgUGF0aEF0dHJpYnV0ZXNcbntcblx0ZDogc3RyaW5nXG59XG5cbnR5cGUgRXZlbnRIYW5kbGVyIDxFIGV4dGVuZHMgRXZlbnQ+ID0gKCBldmVudDogRSApID0+IHZvaWRcblxudHlwZSBDbGlwYm9hcmRFdmVudEhhbmRsZXIgICA9IEV2ZW50SGFuZGxlcjxDbGlwYm9hcmRFdmVudD5cbnR5cGUgQ29tcG9zaXRpb25FdmVudEhhbmRsZXIgPSBFdmVudEhhbmRsZXI8Q29tcG9zaXRpb25FdmVudD5cbnR5cGUgRHJhZ0V2ZW50SGFuZGxlciAgICAgICAgPSBFdmVudEhhbmRsZXI8RHJhZ0V2ZW50PlxudHlwZSBGb2N1c0V2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxGb2N1c0V2ZW50PlxudHlwZSBLZXlib2FyZEV2ZW50SGFuZGxlciAgICA9IEV2ZW50SGFuZGxlcjxLZXlib2FyZEV2ZW50PlxudHlwZSBNb3VzZUV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxNb3VzZUV2ZW50PlxudHlwZSBUb3VjaEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxUb3VjaEV2ZW50PlxudHlwZSBVSUV2ZW50SGFuZGxlciAgICAgICAgICA9IEV2ZW50SGFuZGxlcjxVSUV2ZW50PlxudHlwZSBXaGVlbEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxXaGVlbEV2ZW50PlxudHlwZSBBbmltYXRpb25FdmVudEhhbmRsZXIgICA9IEV2ZW50SGFuZGxlcjxBbmltYXRpb25FdmVudD5cbnR5cGUgVHJhbnNpdGlvbkV2ZW50SGFuZGxlciAgPSBFdmVudEhhbmRsZXI8VHJhbnNpdGlvbkV2ZW50PlxudHlwZSBHZW5lcmljRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxFdmVudD5cbnR5cGUgUG9pbnRlckV2ZW50SGFuZGxlciAgICAgPSBFdmVudEhhbmRsZXI8UG9pbnRlckV2ZW50PlxuXG5pbnRlcmZhY2UgRE9NQXR0cmlidXRlc1xue1xuXHRbZXZlbnQ6IHN0cmluZ106IGFueVxuXG5cdC8vICNyZWdpb24gSW1hZ2UgRXZlbnRzXG5cdG9uTG9hZD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkxvYWRDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25FcnJvcj8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uRXJyb3JDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG5cblx0Ly8gI3JlZ2lvbiBDbGlwYm9hcmQgRXZlbnRzXG5cdG9uQ29weT8gICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG5cdG9uQ29weUNhcHR1cmU/IDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG5cdG9uQ3V0PyAgICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG5cdG9uQ3V0Q2FwdHVyZT8gIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG5cdG9uUGFzdGU/ICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG5cdG9uUGFzdGVDYXB0dXJlPzogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgIC8vICNlbmRyZWdpb25cblxuXHQvLyAjcmVnaW9uIENvbXBvc2l0aW9uIEV2ZW50c1xuXHRvbkNvbXBvc2l0aW9uRW5kPyAgICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG5cdG9uQ29tcG9zaXRpb25FbmRDYXB0dXJlPyAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcblx0b25Db21wb3NpdGlvblN0YXJ0PyAgICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuXHRvbkNvbXBvc2l0aW9uU3RhcnRDYXB0dXJlPyA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG5cdG9uQ29tcG9zaXRpb25VcGRhdGU/ICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcblx0b25Db21wb3NpdGlvblVwZGF0ZUNhcHR1cmU/OiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG5cblx0Ly8gI3JlZ2lvbiBGb2N1cyBFdmVudHNcblx0b25Gb2N1cz8gICAgICAgOiBGb2N1c0V2ZW50SGFuZGxlclxuXHRvbkZvY3VzQ2FwdHVyZT86IEZvY3VzRXZlbnRIYW5kbGVyXG5cdG9uQmx1cj8gICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcblx0b25CbHVyQ2FwdHVyZT8gOiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG5cblx0Ly8gI3JlZ2lvbiBGb3JtIEV2ZW50c1xuXHRvbkNoYW5nZT8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkNoYW5nZUNhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbklucHV0PyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbklucHV0Q2FwdHVyZT8gIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblNlYXJjaD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblNlYXJjaENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblN1Ym1pdD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblN1Ym1pdENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkludmFsaWQ/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkludmFsaWRDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG5cblx0Ly8gI3JlZ2lvbiBLZXlib2FyZCBFdmVudHNcblx0b25LZXlEb3duPyAgICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuXHRvbktleURvd25DYXB0dXJlPyA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG5cdG9uS2V5UHJlc3M/ICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcblx0b25LZXlQcmVzc0NhcHR1cmU/OiBLZXlib2FyZEV2ZW50SGFuZGxlclxuXHRvbktleVVwPyAgICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG5cdG9uS2V5VXBDYXB0dXJlPyAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgLy8gI2VuZHJlZ2lvblxuXG5cdC8vICNyZWdpb24gTWVkaWEgRXZlbnRzXG5cdG9uQWJvcnQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkFib3J0Q2FwdHVyZT8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25DYW5QbGF5PyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uQ2FuUGxheUNhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkNhblBsYXlUaHJvdWdoPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25DYW5QbGF5VGhyb3VnaENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uRHVyYXRpb25DaGFuZ2U/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkR1cmF0aW9uQ2hhbmdlQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25FbXB0aWVkPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uRW1wdGllZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkVuY3J5cHRlZD8gICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25FbmNyeXB0ZWRDYXB0dXJlPyAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uRW5kZWQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkVuZGVkQ2FwdHVyZT8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25Mb2FkZWREYXRhPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uTG9hZGVkRGF0YUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkxvYWRlZE1ldGFkYXRhPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25Mb2FkZWRNZXRhZGF0YUNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uTG9hZFN0YXJ0PyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbkxvYWRTdGFydENhcHR1cmU/ICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25QYXVzZT8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uUGF1c2VDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblBsYXk/ICAgICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25QbGF5Q2FwdHVyZT8gICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uUGxheWluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblBsYXlpbmdDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25Qcm9ncmVzcz8gICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uUHJvZ3Jlc3NDYXB0dXJlPyAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblJhdGVDaGFuZ2U/ICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25SYXRlQ2hhbmdlQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uU2Vla2VkPyAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblNlZWtlZENhcHR1cmU/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25TZWVraW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uU2Vla2luZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblN0YWxsZWQ/ICAgICAgICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25TdGFsbGVkQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uU3VzcGVuZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblN1c3BlbmRDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25UaW1lVXBkYXRlPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uVGltZVVwZGF0ZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblZvbHVtZUNoYW5nZT8gICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcblx0b25Wb2x1bWVDaGFuZ2VDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG5cdG9uV2FpdGluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvbldhaXRpbmdDYXB0dXJlPyAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgLy8gI2VuZHJlZ2lvblxuXG5cdC8vICNyZWdpb24gTW91c2VFdmVudHNcblx0b25DbGljaz8gICAgICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuXHRvbkNsaWNrQ2FwdHVyZT8gICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG5cdG9uQ29udGV4dE1lbnU/ICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcblx0b25Db250ZXh0TWVudUNhcHR1cmU/OiBNb3VzZUV2ZW50SGFuZGxlclxuXHRvbkRibENsaWNrPyAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG5cdG9uRGJsQ2xpY2tDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcblx0b25EcmFnPyAgICAgICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG5cdG9uRHJhZ0NhcHR1cmU/ICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuXHRvbkRyYWdFbmQ/ICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcblx0b25EcmFnRW5kQ2FwdHVyZT8gICAgOiBEcmFnRXZlbnRIYW5kbGVyXG5cdG9uRHJhZ0VudGVyPyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuXHRvbkRyYWdFbnRlckNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcblx0b25EcmFnRXhpdD8gICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG5cdG9uRHJhZ0V4aXRDYXB0dXJlPyAgIDogRHJhZ0V2ZW50SGFuZGxlclxuXHRvbkRyYWdMZWF2ZT8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcblx0b25EcmFnTGVhdmVDYXB0dXJlPyAgOiBEcmFnRXZlbnRIYW5kbGVyXG5cdG9uRHJhZ092ZXI/ICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuXHRvbkRyYWdPdmVyQ2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcblx0b25EcmFnU3RhcnQ/ICAgICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG5cdG9uRHJhZ1N0YXJ0Q2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuXHRvbkRyb3A/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcblx0b25Ecm9wQ2FwdHVyZT8gICAgICAgOiBEcmFnRXZlbnRIYW5kbGVyXG5cdG9uTW91c2VEb3duPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcblx0b25Nb3VzZURvd25DYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuXHRvbk1vdXNlRW50ZXI/ICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG5cdG9uTW91c2VFbnRlckNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcblx0b25Nb3VzZUxlYXZlPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuXHRvbk1vdXNlTGVhdmVDYXB0dXJlPyA6IE1vdXNlRXZlbnRIYW5kbGVyXG5cdG9uTW91c2VNb3ZlPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcblx0b25Nb3VzZU1vdmVDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuXHRvbk1vdXNlT3V0PyAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG5cdG9uTW91c2VPdXRDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcblx0b25Nb3VzZU92ZXI/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuXHRvbk1vdXNlT3ZlckNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG5cdG9uTW91c2VVcD8gICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcblx0b25Nb3VzZVVwQ2FwdHVyZT8gICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG5cblx0Ly8gI3JlZ2lvbiBTZWxlY3Rpb24gRXZlbnRzXG5cdG9uU2VsZWN0PzogR2VuZXJpY0V2ZW50SGFuZGxlclxuXHRvblNlbGVjdENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgIC8vICNlbmRyZWdpb25cblxuXHQvLyAjcmVnaW9uIFRvdWNoIEV2ZW50c1xuXHRvblRvdWNoQ2FuY2VsPzogVG91Y2hFdmVudEhhbmRsZXJcblx0b25Ub3VjaENhbmNlbENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuXHRvblRvdWNoRW5kPzogVG91Y2hFdmVudEhhbmRsZXJcblx0b25Ub3VjaEVuZENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuXHRvblRvdWNoTW92ZT86IFRvdWNoRXZlbnRIYW5kbGVyXG5cdG9uVG91Y2hNb3ZlQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG5cdG9uVG91Y2hTdGFydD86IFRvdWNoRXZlbnRIYW5kbGVyXG5cdG9uVG91Y2hTdGFydENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG5cblx0Ly8gI3JlZ2lvbiBQb2ludGVyIEV2ZW50c1xuXHRvblBvaW50ZXJPdmVyPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG5cdG9uUG9pbnRlck92ZXJDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcblx0b25Qb2ludGVyRW50ZXI/ICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuXHRvblBvaW50ZXJFbnRlckNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG5cdG9uUG9pbnRlckRvd24/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcblx0b25Qb2ludGVyRG93bkNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuXHRvblBvaW50ZXJNb3ZlPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG5cdG9uUG9pbnRlck1vdmVDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcblx0b25Qb2ludGVyVXA/ICAgICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuXHRvblBvaW50ZXJVcENhcHR1cmU/ICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG5cdG9uUG9pbnRlckNhbmNlbD8gICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcblx0b25Qb2ludGVyQ2FuY2VsQ2FwdHVyZT8gICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuXHRvblBvaW50ZXJPdXQ/ICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG5cdG9uUG9pbnRlck91dENhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcblx0b25Qb2ludGVyTGVhdmU/ICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuXHRvblBvaW50ZXJMZWF2ZUNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG5cdG9uR290UG9pbnRlckNhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcblx0b25Hb3RQb2ludGVyQ2FwdHVyZUNhcHR1cmU/IDogUG9pbnRlckV2ZW50SGFuZGxlclxuXHRvbkxvc3RQb2ludGVyQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG5cdG9uTG9zdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT86IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgLy8gI2VuZHJlZ2lvblxuXG5cdC8vICNyZWdpb24gVUkgRXZlbnRzXG5cdG9uU2Nyb2xsPyAgICAgICA6IFVJRXZlbnRIYW5kbGVyXG5cdG9uU2Nyb2xsQ2FwdHVyZT86IFVJRXZlbnRIYW5kbGVyXG4gICAgIC8vICNlbmRyZWdpb25cblxuXHQvLyAjcmVnaW9uIFdoZWVsIEV2ZW50c1xuXHRvbldoZWVsPyAgICAgICA6IFdoZWVsRXZlbnRIYW5kbGVyXG5cdG9uV2hlZWxDYXB0dXJlPzogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgLy8gI2VuZHJlZ2lvblxuXG5cdC8vICNyZWdpb24gQW5pbWF0aW9uIEV2ZW50c1xuXHRvbkFuaW1hdGlvblN0YXJ0PyAgICAgICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcblx0b25BbmltYXRpb25TdGFydENhcHR1cmU/ICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG5cdG9uQW5pbWF0aW9uRW5kPyAgICAgICAgICAgICA6IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuXHRvbkFuaW1hdGlvbkVuZENhcHR1cmU/ICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcblx0b25BbmltYXRpb25JdGVyYXRpb24/ICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG5cdG9uQW5pbWF0aW9uSXRlcmF0aW9uQ2FwdHVyZT86IEFuaW1hdGlvbkV2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG5cblx0Ly8gI3JlZ2lvbiBUcmFuc2l0aW9uIEV2ZW50c1xuXHRvblRyYW5zaXRpb25FbmQ/ICAgICAgIDogVHJhbnNpdGlvbkV2ZW50SGFuZGxlclxuXHRvblRyYW5zaXRpb25FbmRDYXB0dXJlPzogVHJhbnNpdGlvbkV2ZW50SGFuZGxlclxuICAgICAvLyAjZW5kcmVnaW9uXG59XG5cbmludGVyZmFjZSBIVE1MQXR0cmlidXRlcyBleHRlbmRzIERPTUF0dHJpYnV0ZXNcbntcblx0Ly8gU3RhbmRhcmQgSFRNTCBBdHRyaWJ1dGVzXG5cdGFjY2VwdD8gICAgICAgICAgIDogc3RyaW5nXG5cdGFjY2VwdENoYXJzZXQ/ICAgIDogc3RyaW5nXG5cdGFjY2Vzc0tleT8gICAgICAgIDogc3RyaW5nXG5cdGFjdGlvbj8gICAgICAgICAgIDogc3RyaW5nXG5cdGFsbG93RnVsbFNjcmVlbj8gIDogc3RyaW5nIHwgYm9vbGVhblxuXHRhbGxvd1RyYW5zcGFyZW5jeT86IHN0cmluZyB8IGJvb2xlYW5cblx0YWx0PyAgICAgICAgICAgICAgOiBzdHJpbmdcblx0YXN5bmM/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdGF1dG9jb21wbGV0ZT8gICAgIDogc3RyaW5nXG5cdGF1dG9Db21wbGV0ZT8gICAgIDogc3RyaW5nXG5cdGF1dG9jb3JyZWN0PyAgICAgIDogc3RyaW5nXG5cdGF1dG9Db3JyZWN0PyAgICAgIDogc3RyaW5nXG5cdGF1dG9mb2N1cz8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRhdXRvRm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cblx0YXV0b1BsYXk/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdGNhcHR1cmU/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRjZWxsUGFkZGluZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRjZWxsU3BhY2luZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRjaGFyU2V0PyAgICAgICAgICA6IHN0cmluZ1xuXHRjaGFsbGVuZ2U/ICAgICAgICA6IHN0cmluZ1xuXHRjaGVja2VkPyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cblx0Y2xhc3M/ICAgICAgICAgICAgOiBzdHJpbmcgfCBzdHJpbmdbXVxuXHRjbGFzc05hbWU/ICAgICAgICA6IHN0cmluZ1xuXHRjb2xzPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRjb2xTcGFuPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRjb250ZW50PyAgICAgICAgICA6IHN0cmluZ1xuXHRjb250ZW50RWRpdGFibGU/ICA6IHN0cmluZyB8IGJvb2xlYW5cblx0Y29udGV4dE1lbnU/ICAgICAgOiBzdHJpbmdcblx0Y29udHJvbHM/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdGNvbnRyb2xzTGlzdD8gICAgIDogc3RyaW5nXG5cdGNvb3Jkcz8gICAgICAgICAgIDogc3RyaW5nXG5cdGNyb3NzT3JpZ2luPyAgICAgIDogc3RyaW5nXG5cdGRhdGE/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdGRhdGVUaW1lPyAgICAgICAgIDogc3RyaW5nXG5cdGRlZmF1bHQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRkZWZlcj8gICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cblx0ZGlyPyAgICAgICAgICAgICAgOiBzdHJpbmdcblx0ZGlzYWJsZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdGRvd25sb2FkPyAgICAgICAgIDogYW55XG5cdGRyYWdnYWJsZT8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRlbmNUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuXHRmb3JtPyAgICAgICAgICAgICA6IHN0cmluZ1xuXHRmb3JtQWN0aW9uPyAgICAgICA6IHN0cmluZ1xuXHRmb3JtRW5jVHlwZT8gICAgICA6IHN0cmluZ1xuXHRmb3JtTWV0aG9kPyAgICAgICA6IHN0cmluZ1xuXHRmb3JtTm9WYWxpZGF0ZT8gICA6IHN0cmluZyB8IGJvb2xlYW5cblx0Zm9ybVRhcmdldD8gICAgICAgOiBzdHJpbmdcblx0ZnJhbWVCb3JkZXI/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0aGVhZGVycz8gICAgICAgICAgOiBzdHJpbmdcblx0aGVpZ2h0PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0aGlkZGVuPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdGhpZ2g/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG5cdGhyZWY/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdGhyZWZMYW5nPyAgICAgICAgIDogc3RyaW5nXG5cdGZvcj8gICAgICAgICAgICAgIDogc3RyaW5nXG5cdGh0bWxGb3I/ICAgICAgICAgIDogc3RyaW5nXG5cdGh0dHBFcXVpdj8gICAgICAgIDogc3RyaW5nXG5cdGljb24/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdGlkPyAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdGlucHV0TW9kZT8gICAgICAgIDogc3RyaW5nXG5cdGludGVncml0eT8gICAgICAgIDogc3RyaW5nXG5cdGlzPyAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdGtleVBhcmFtcz8gICAgICAgIDogc3RyaW5nXG5cdGtleVR5cGU/ICAgICAgICAgIDogc3RyaW5nXG5cdGtpbmQ/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdGxhYmVsPyAgICAgICAgICAgIDogc3RyaW5nXG5cdGxhbmc/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdGxpc3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdGxvb3A/ICAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRsb3c/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRtYW5pZmVzdD8gICAgICAgICA6IHN0cmluZ1xuXHRtYXJnaW5IZWlnaHQ/ICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRtYXJnaW5XaWR0aD8gICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRtYXg/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRtYXhMZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRtZWRpYT8gICAgICAgICAgICA6IHN0cmluZ1xuXHRtZWRpYUdyb3VwPyAgICAgICA6IHN0cmluZ1xuXHRtZXRob2Q/ICAgICAgICAgICA6IHN0cmluZ1xuXHRtaW4/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRtaW5MZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuXHRtdWx0aXBsZT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cblx0bXV0ZWQ/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdG5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdG5vVmFsaWRhdGU/ICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRvcGVuPyAgICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cblx0b3B0aW11bT8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0cGF0dGVybj8gICAgICAgICAgOiBzdHJpbmdcblx0cGxhY2Vob2xkZXI/ICAgICAgOiBzdHJpbmdcblx0cGxheXNJbmxpbmU/ICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdHBvc3Rlcj8gICAgICAgICAgIDogc3RyaW5nXG5cdHByZWxvYWQ/ICAgICAgICAgIDogc3RyaW5nXG5cdHJhZGlvR3JvdXA/ICAgICAgIDogc3RyaW5nXG5cdHJlYWRPbmx5PyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRyZWw/ICAgICAgICAgICAgICA6IHN0cmluZ1xuXHRyZXF1aXJlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cblx0cm9sZT8gICAgICAgICAgICAgOiBzdHJpbmdcblx0cm93cz8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0cm93U3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0c2FuZGJveD8gICAgICAgICAgOiBzdHJpbmdcblx0c2NvcGU/ICAgICAgICAgICAgOiBzdHJpbmdcblx0c2NvcGVkPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdHNjcm9sbGluZz8gICAgICAgIDogc3RyaW5nXG5cdHNlYW1sZXNzPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuXHRzZWxlY3RlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cblx0c2hhcGU/ICAgICAgICAgICAgOiBzdHJpbmdcblx0c2l6ZT8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0c2l6ZXM/ICAgICAgICAgICAgOiBzdHJpbmdcblx0c2xvdD8gICAgICAgICAgICAgOiBzdHJpbmdcblx0c3Bhbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0c3BlbGxjaGVjaz8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG5cdHNyYz8gICAgICAgICAgICAgIDogc3RyaW5nXG5cdHNyY3NldD8gICAgICAgICAgIDogc3RyaW5nXG5cdHNyY0RvYz8gICAgICAgICAgIDogc3RyaW5nXG5cdHNyY0xhbmc/ICAgICAgICAgIDogc3RyaW5nXG5cdHNyY1NldD8gICAgICAgICAgIDogc3RyaW5nXG5cdHN0YXJ0PyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG5cdHN0ZXA/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG5cdHN0eWxlPyAgICAgICAgICAgIDogc3RyaW5nIHwgeyBbIGtleTogc3RyaW5nIF06IHN0cmluZyB8IG51bWJlciB9XG5cdHN1bW1hcnk/ICAgICAgICAgIDogc3RyaW5nXG5cdHRhYkluZGV4PyAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG5cdHRhcmdldD8gICAgICAgICAgIDogc3RyaW5nXG5cdHRpdGxlPyAgICAgICAgICAgIDogc3RyaW5nXG5cdHR5cGU/ICAgICAgICAgICAgIDogc3RyaW5nXG5cdHVzZU1hcD8gICAgICAgICAgIDogc3RyaW5nXG5cdHZhbHVlPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW10gfCBudW1iZXJcblx0d2lkdGg/ICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0d21vZGU/ICAgICAgICAgICAgOiBzdHJpbmdcblx0d3JhcD8gICAgICAgICAgICAgOiBzdHJpbmdcblxuXHQvLyBSREZhIEF0dHJpYnV0ZXNcblx0YWJvdXQ/OiBzdHJpbmdcblx0ZGF0YXR5cGU/OiBzdHJpbmdcblx0aW5saXN0PzogYW55XG5cdHByZWZpeD86IHN0cmluZ1xuXHRwcm9wZXJ0eT86IHN0cmluZ1xuXHRyZXNvdXJjZT86IHN0cmluZ1xuXHR0eXBlb2Y/OiBzdHJpbmdcblx0dm9jYWI/OiBzdHJpbmdcblxuXHQvLyBNaWNyb2RhdGEgQXR0cmlidXRlc1xuXHRpdGVtUHJvcD86IHN0cmluZ1xuXHRpdGVtU2NvcGU/OiBib29sZWFuXG5cdGl0ZW1UeXBlPzogc3RyaW5nXG5cdGl0ZW1JRD86IHN0cmluZ1xuXHRpdGVtUmVmPzogc3RyaW5nXG59XG5cbmludGVyZmFjZSBTVkdBdHRyaWJ1dGVzIGV4dGVuZHMgSFRNTEF0dHJpYnV0ZXNcbntcblx0YWNjZW50SGVpZ2h0PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YWNjdW11bGF0ZT8gICAgICAgICAgICAgICAgOiBcIm5vbmVcIiB8IFwic3VtXCJcblx0YWRkaXRpdmU/ICAgICAgICAgICAgICAgICAgOiBcInJlcGxhY2VcIiB8IFwic3VtXCJcblx0YWxpZ25tZW50QmFzZWxpbmU/ICAgICAgICAgOiBcImF1dG9cIiB8IFwiYmFzZWxpbmVcIiB8IFwiYmVmb3JlLWVkZ2VcIiB8IFwidGV4dC1iZWZvcmUtZWRnZVwiIHwgXCJtaWRkbGVcIiB8IFwiY2VudHJhbFwiIHwgXCJhZnRlci1lZGdlXCIgfCBcInRleHQtYWZ0ZXItZWRnZVwiIHwgXCJpZGVvZ3JhcGhpY1wiIHwgXCJhbHBoYWJldGljXCIgfCBcImhhbmdpbmdcIiB8IFwibWF0aGVtYXRpY2FsXCIgfCBcImluaGVyaXRcIlxuXHRhbGxvd1Jlb3JkZXI/ICAgICAgICAgICAgICA6IFwibm9cIiB8IFwieWVzXCJcblx0YWxwaGFiZXRpYz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YW1wbGl0dWRlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YXJhYmljRm9ybT8gICAgICAgICAgICAgICAgOiBcImluaXRpYWxcIiB8IFwibWVkaWFsXCIgfCBcInRlcm1pbmFsXCIgfCBcImlzb2xhdGVkXCJcblx0YXNjZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YXR0cmlidXRlTmFtZT8gICAgICAgICAgICAgOiBzdHJpbmdcblx0YXR0cmlidXRlVHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcblx0YXV0b1JldmVyc2U/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YXppbXV0aD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YmFzZUZyZXF1ZW5jeT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YmFzZWxpbmVTaGlmdD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YmFzZVByb2ZpbGU/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YmJveD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0YmVnaW4/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Ymlhcz8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Ynk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Y2FsY01vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Y2FwSGVpZ2h0PyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Y2xpcD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Y2xpcFBhdGg/ICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0Y2xpcFBhdGhVbml0cz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Y2xpcFJ1bGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Y29sb3JJbnRlcnBvbGF0aW9uPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Y29sb3JJbnRlcnBvbGF0aW9uRmlsdGVycz8gOiBcImF1dG9cIiB8IFwic1JHQlwiIHwgXCJsaW5lYXJSR0JcIiB8IFwiaW5oZXJpdFwiXG5cdGNvbG9yUHJvZmlsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdGNvbG9yUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdGNvbnRlbnRTY3JpcHRUeXBlPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdGNvbnRlbnRTdHlsZVR5cGU/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdGN1cnNvcj8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdGN4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdGN5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdGQ/ICAgICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW11cblx0ZGVjZWxlcmF0ZT8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZGVzY2VudD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZGlmZnVzZUNvbnN0YW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZGlyZWN0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZGlzcGxheT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZGl2aXNvcj8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZG9taW5hbnRCYXNlbGluZT8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZHVyPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZHg/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZHk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZWRnZU1vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZWxldmF0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZW5hYmxlQmFja2dyb3VuZD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZW5kPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZXhwb25lbnQ/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZXh0ZXJuYWxSZXNvdXJjZXNSZXF1aXJlZD8gOiBudW1iZXIgfCBzdHJpbmdcblx0ZmlsbD8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0ZmlsbE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZmlsbFJ1bGU/ICAgICAgICAgICAgICAgICAgOiBcIm5vbnplcm9cIiB8IFwiZXZlbm9kZFwiIHwgXCJpbmhlcml0XCJcblx0ZmlsdGVyPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0ZmlsdGVyUmVzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZmlsdGVyVW5pdHM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zmxvb2RDb2xvcj8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zmxvb2RPcGFjaXR5PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9jdXNhYmxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9udEZhbWlseT8gICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0Zm9udFNpemU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9udFNpemVBZGp1c3Q/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9udFN0cmV0Y2g/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9udFN0eWxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9udFZhcmlhbnQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9udFdlaWdodD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zm9ybWF0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZnJvbT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Zng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Znk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZzE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0ZzI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Z2x5cGhOYW1lPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Z2x5cGhPcmllbnRhdGlvbkhvcml6b250YWw/OiBudW1iZXIgfCBzdHJpbmdcblx0Z2x5cGhPcmllbnRhdGlvblZlcnRpY2FsPyAgOiBudW1iZXIgfCBzdHJpbmdcblx0Z2x5cGhSZWY/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0Z3JhZGllbnRUcmFuc2Zvcm0/ICAgICAgICAgOiBzdHJpbmdcblx0Z3JhZGllbnRVbml0cz8gICAgICAgICAgICAgOiBzdHJpbmdcblx0aGFuZ2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0aG9yaXpBZHZYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0aG9yaXpPcmlnaW5YPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0aWRlb2dyYXBoaWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0aW1hZ2VSZW5kZXJpbmc/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0aW4yPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0aW4/ICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0aW50ZXJjZXB0PyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0azE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0azI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0azM/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0azQ/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0az8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0a2VybmVsTWF0cml4PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0a2VybmVsVW5pdExlbmd0aD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0a2VybmluZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0a2V5UG9pbnRzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0a2V5U3BsaW5lcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0a2V5VGltZXM/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bGVuZ3RoQWRqdXN0PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bGV0dGVyU3BhY2luZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bGlnaHRpbmdDb2xvcj8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bGltaXRpbmdDb25lQW5nbGU/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bG9jYWw/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bWFya2VyRW5kPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0bWFya2VySGVpZ2h0PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bWFya2VyTWlkPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0bWFya2VyU3RhcnQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0bWFya2VyVW5pdHM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bWFya2VyV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bWFzaz8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0bWFza0NvbnRlbnRVbml0cz8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bWFza1VuaXRzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bWF0aGVtYXRpY2FsPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bW9kZT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0bnVtT2N0YXZlcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b2Zmc2V0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3BhY2l0eT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3BlcmF0b3I/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3JkZXI/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3JpZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3JpZW50YXRpb24/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3JpZ2luPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3ZlcmZsb3c/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3ZlcmxpbmVQb3NpdGlvbj8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0b3ZlcmxpbmVUaGlja25lc3M/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cGFpbnRPcmRlcj8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cGFub3NlMT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cGF0aExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cGF0dGVybkNvbnRlbnRVbml0cz8gICAgICAgOiBzdHJpbmdcblx0cGF0dGVyblRyYW5zZm9ybT8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cGF0dGVyblVuaXRzPyAgICAgICAgICAgICAgOiBzdHJpbmdcblx0cG9pbnRlckV2ZW50cz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cG9pbnRzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0cG9pbnRzQXRYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cG9pbnRzQXRZPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cG9pbnRzQXRaPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cHJlc2VydmVBbHBoYT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cHJlc2VydmVBc3BlY3RSYXRpbz8gICAgICAgOiBzdHJpbmdcblx0cHJpbWl0aXZlVW5pdHM/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cj8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmFkaXVzPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVmWD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVmWT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVuZGVyaW5nSW50ZW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVwZWF0Q291bnQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVwZWF0RHVyPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVxdWlyZWRFeHRlbnNpb25zPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVxdWlyZWRGZWF0dXJlcz8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVzdGFydD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cmVzdWx0PyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0cm90YXRlPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0cnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c2NhbGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c2VlZD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c2hhcGVSZW5kZXJpbmc/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c2xvcGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3BhY2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3BlY3VsYXJDb25zdGFudD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3BlY3VsYXJFeHBvbmVudD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3BlZWQ/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3ByZWFkTWV0aG9kPyAgICAgICAgICAgICAgOiBzdHJpbmdcblx0c3RhcnRPZmZzZXQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RkRGV2aWF0aW9uPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RlbWg/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RlbXY/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RpdGNoVGlsZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RvcENvbG9yPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0c3RvcE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RyaWtldGhyb3VnaFBvc2l0aW9uPyAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RyaWtldGhyb3VnaFRoaWNrbmVzcz8gICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3RyaW5nPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcblx0c3Ryb2tlPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcblx0c3Ryb2tlRGFzaGFycmF5PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0c3Ryb2tlRGFzaG9mZnNldD8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcblx0c3Ryb2tlTGluZWNhcD8gICAgICAgICAgICAgOiBcImJ1dHRcIiB8IFwicm91bmRcIiB8IFwic3F1YXJlXCIgfCBcImluaGVyaXRcIlxuXHRzdHJva2VMaW5lam9pbj8gICAgICAgICAgICA6IFwibWl0ZXJcIiB8IFwicm91bmRcIiB8IFwiYmV2ZWxcIiB8IFwiaW5oZXJpdFwiXG5cdHN0cm9rZU1pdGVybGltaXQ/ICAgICAgICAgIDogc3RyaW5nXG5cdHN0cm9rZU9wYWNpdHk/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHN0cm9rZVdpZHRoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHN1cmZhY2VTY2FsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHN5c3RlbUxhbmd1YWdlPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRhYmxlVmFsdWVzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRhcmdldFg/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRhcmdldFk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRleHRBbmNob3I/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHRleHREZWNvcmF0aW9uPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRleHRMZW5ndGg/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRleHRSZW5kZXJpbmc/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRvPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHRyYW5zZm9ybT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHUxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHUyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHVuZGVybGluZVBvc2l0aW9uPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHVuZGVybGluZVRoaWNrbmVzcz8gICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHVuaWNvZGU/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHVuaWNvZGVCaWRpPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHVuaWNvZGVSYW5nZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHVuaXRzUGVyRW0/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZBbHBoYWJldGljPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZhbHVlcz8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHZlY3RvckVmZmVjdD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZlcnNpb24/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHZlcnRBZHZZPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZlcnRPcmlnaW5YPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZlcnRPcmlnaW5ZPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZIYW5naW5nPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZJZGVvZ3JhcGhpYz8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZpZXdCb3g/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHZpZXdUYXJnZXQ/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZpc2liaWxpdHk/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHZNYXRoZW1hdGljYWw/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHdpZHRocz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHdvcmRTcGFjaW5nPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHdyaXRpbmdNb2RlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHgxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHgyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHg/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHhDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG5cdHhIZWlnaHQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHhsaW5rQWN0dWF0ZT8gICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhsaW5rQXJjcm9sZT8gICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhsaW5rSHJlZj8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhsaW5rUm9sZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhsaW5rU2hvdz8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhsaW5rVGl0bGU/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhsaW5rVHlwZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhtbEJhc2U/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhtbExhbmc/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhtbG5zPyAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhtbG5zWGxpbms/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHhtbFNwYWNlPyAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG5cdHkxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHkyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHk/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHlDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG5cdHo/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG5cdHpvb21BbmRQYW4/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG59XG4iLCJcbmltcG9ydCB7ICROb2RlLCAkQ2x1c3RlciwgY3JlYXRlTm9kZSB9IGZyb20gXCIuLi8uLi8uLi9EYXRhL2luZGV4XCJcbmltcG9ydCB7IHhub2RlLCBKU1ggfSBmcm9tIFwiLi4veG5vZGVcIlxuXG5leHBvcnQgaW50ZXJmYWNlICRDb21wb25lbnQgPEMgZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiBleHRlbmRzICRDbHVzdGVyIDxDPlxue1xuICAgICByZWFkb25seSBjb250ZXh0OiBcImNvbmNlcHQtdWlcIlxuICAgICB0eXBlOiBzdHJpbmdcbiAgICAgY2hpbGRyZW4/OiBDIFtdIC8vIFJlY29yZCA8c3RyaW5nLCAkQ2hpbGQ+XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQgPCQgZXh0ZW5kcyAkQ29tcG9uZW50ID0gJENvbXBvbmVudD5cbntcbiAgICAgZGF0YTogJFxuXG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgZGVmYXVsdERhdGEgKCkgOiAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcImNvbXBvbmVudFwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogJCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduIChcbiAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICBjcmVhdGVOb2RlICggZGF0YS50eXBlLCBkYXRhLmlkLCBkYXRhICkgYXMgYW55XG4gICAgICAgICAgKVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKTogKEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCkgW11cbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IDxkaXYgY2xhc3M9eyB0aGlzLmRhdGEudHlwZSB9PjwvZGl2PlxuICAgICAgICAgICAgICAgdGhpcy5vbkNyZWF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cblxuICAgICBvbkNyZWF0ZSAoKVxuICAgICB7XG5cbiAgICAgfVxuXG59XG5cblxuIiwiXG5pbXBvcnQgeyBGYWN0b3J5LCAkTm9kZSwgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleFwiXG5pbXBvcnQgeyBDb21wb25lbnQsICRDb21wb25lbnQgfSBmcm9tIFwiLi9Db3JlL0NvbXBvbmVudC9pbmRleFwiXG5pbXBvcnQgeyBXcml0YWJsZSwgT3B0aW9uYWwgfSBmcm9tIFwiLi4vTGliL2luZGV4XCJcblxudHlwZSAkSW4gPCQgZXh0ZW5kcyAkQ29tcG9uZW50ID0gJENvbXBvbmVudD4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cbnR5cGUgQ3RvciA9IG5ldyAoIGRhdGE6ICRDb21wb25lbnQgKSA9PiBDb21wb25lbnRcblxuY29uc3QgQ09OVEVYVCA9IFwiY29uY2VwdC11aVwiXG5jb25zdCBkYiAgICAgID0gbmV3IERhdGFiYXNlICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPENvbXBvbmVudD4gKCBkYiApXG5cblxuZnVuY3Rpb24gbm9ybWFsaXplICggbm9kZTogJEluIClcbntcbiAgICAgaWYgKCBcImNvbnRleHRcIiBpbiBub2RlIClcbiAgICAge1xuICAgICAgICAgIGlmICggbm9kZS5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGNvbnRleHQgdmFsdWVcIlxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIChub2RlIGFzIFdyaXRhYmxlIDwkTm9kZT4pLmNvbnRleHQgPSBDT05URVhUXG4gICAgIH1cblxuICAgICByZXR1cm4gbm9kZSBhcyAkQ29tcG9uZW50XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQgPFQgZXh0ZW5kcyBDb21wb25lbnQ+ICggbm9kZTogJEluICk6IFRcbntcbiAgICAgcmV0dXJuIGZhY3RvcnkubWFrZSAoIG5vcm1hbGl6ZSAoIG5vZGUgKSApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXQgKCBub2RlOiAkSW4gKVxue1xuICAgICBkYi5zZXQgKCBub3JtYWxpemUgKCBub2RlICkgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCB0eXBlOiBzdHJpbmcsIGlkPzogc3RyaW5nIClcbntcbiAgICAgZmFjdG9yeS5kZWZpbmUgKCBjdG9yLCBDT05URVhULCB0eXBlLCBpZCApXG59XG4iLCJpbXBvcnQgeyAkQ29tcG9uZW50LCBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQ29yZS9Db21wb25lbnQvaW5kZXhcIlxuaW1wb3J0IHsgeG5vZGUsIEpTWCB9IGZyb20gXCIuLi8uLi9Db3JlL3hub2RlXCJcblxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgUGhhbnRvbUNvbmZpZyBleHRlbmRzICRDb21wb25lbnRcbntcbiAgICAgdHlwZTogXCJwaGFudG9tXCJcbiAgICAgY29udGVudDogc3RyaW5nXG59XG5cbmV4cG9ydCBjbGFzcyBQaGFudG9tIGV4dGVuZHMgQ29tcG9uZW50IDxQaGFudG9tQ29uZmlnPlxue1xuICAgICBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBcImRpdlwiIClcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IHRoaXMuZGF0YS5jb250ZW50XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLmNoaWxkTm9kZXMgYXMgYW55IGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cbn1cblxuXG4iLCJcbmltcG9ydCB7IGdldCB9IGZyb20gXCIuLi8uLi9kYlwiXG5pbXBvcnQgeyAkQ29tcG9uZW50LCBDb21wb25lbnQgfSBmcm9tIFwiLi4vQ29tcG9uZW50L2luZGV4XCJcbmltcG9ydCB7IFBoYW50b20gfSBmcm9tIFwiLi4vLi4vQ29tcG9uZW50L1BoYW50b20vaW5kZXhcIlxuaW1wb3J0IHsgeG5vZGUsIEpTWCB9IGZyb20gXCIuLi94bm9kZVwiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbmV4cG9ydCBpbnRlcmZhY2UgJENvbnRhaW5lciA8QyBleHRlbmRzICRDb21wb25lbnQgPSAkQ29tcG9uZW50PiBleHRlbmRzICRDb21wb25lbnQgLy9EYXRhLiRDbHVzdGVyIDxDPlxue1xuICAgICBkaXJlY3Rpb24/OiBEaXJlY3Rpb25cbiAgICAgY2hpbGRyZW4/OiBDIFtdIC8vIFJlY29yZCA8c3RyaW5nLCAgQz5cbn1cblxuY29uc3QgdG9Qb3NpdGlvbiA9IHtcbiAgICAgbHIgOiBcImxlZnRcIixcbiAgICAgcmwgOiBcInJpZ2h0XCIsXG4gICAgIHRiIDogXCJ0b3BcIixcbiAgICAgYnQgOiBcImJvdHRvbVwiLFxufVxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgJENvbnRhaW5lciA9ICRDb250YWluZXI+IGV4dGVuZHMgQ29tcG9uZW50IDwkPlxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb21wb25lbnQ+XG5cbiAgICAgZGVmYXVsdERhdGEgKCkgOiAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJsclwiLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKCk6IChIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQpIFtdXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuXG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW5cblxuICAgICAgICAgICAgICAgaWYgKCBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvID0gZ2V0ICggY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQgKCAuLi4gby5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbiBbby5kYXRhLmlkXSA9IG9cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIHRvUG9zaXRpb24gW3RoaXMuZGF0YS5kaXJlY3Rpb25dIClcblxuICAgICAgICAgICAgICAgdGhpcy5vbkNyZWF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cblxuICAgICBvbkNyZWF0ZSAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGFwcGVuZCAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQ29tcG9uZW50KSBbXSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkZWYgICAgICAgPSB0aGlzLmRhdGEuY2hpbGRyZW5cbiAgICAgICAgICBjb25zdCBuZXdfY2hpbGQgPSBbXSBhcyBDb21wb25lbnQgW11cblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW5cblxuICAgICAgICAgIGZvciAoIHZhciBlIG9mIGVsZW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBlID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlID0gbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZSBpZiAoIGUgaW5zdGFuY2VvZiBFbGVtZW50IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgVUlfQ09NUE9ORU5UID0gU3ltYm9sLmZvciAoIFwiVUlfQ09NUE9ORU5UXCIgKVxuXG4gICAgICAgICAgICAgICAgICAgIGUgPSBlIFtVSV9DT01QT05FTlRdICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZSBbVUlfQ09NUE9ORU5UXVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwaGFudG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlLm91dGVySFRNTFxuICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggIShlIGluc3RhbmNlb2YgQ29tcG9uZW50KSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBnZXQgKCBlIGFzIGFueSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGNoaWxkcmVuIFsoZSBhcyBDb21wb25lbnQpLmRhdGEuaWRdID0gZSBhcyBDb21wb25lbnRcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQgKCAuLi4gKGUgYXMgQ29tcG9uZW50KS5nZXRIdG1sICgpIClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZW1vdmUgKCAuLi4gZWxlbWVudHM6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJENvbXBvbmVudCkgW10gKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuID0ge31cblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICB9XG5cbiAgICAgZ2V0T3JpZW50YXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRhdGEuZGlyZWN0aW9uXG4gICAgIH1cblxuICAgICBzZXRPcmllbnRhdGlvbiAoIHZhbHVlOiBEaXJlY3Rpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICBpZiAoIHZhbHVlID09IGNvbmZpZy5kaXJlY3Rpb24gKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lclxuXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUgKCB0b1Bvc2l0aW9uIFtjb25maWcuZGlyZWN0aW9uXSApXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgICAgKCB0b1Bvc2l0aW9uIFt2YWx1ZV0gKVxuXG4gICAgICAgICAgY29uZmlnLmRpcmVjdGlvbiA9IHZhbHVlXG4gICAgIH1cbn1cblxuIiwiXG5pbXBvcnQgeyB4bm9kZSwgSlNYIH0gZnJvbSBcIi4veG5vZGVcIlxuXG5leHBvcnQgdHlwZSBEcmFnZ2FibGVPcHRpb25zID0gUGFydGlhbCA8RHJhZ2dhYmxlQ29uZmlnPlxuXG5leHBvcnQgdHlwZSBEcmFnZ2FibGVDb25maWcgPSB7XG4gICAgIGhhbmRsZXMgICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBtaW5WZWxvY2l0eSAgIDogbnVtYmVyXG4gICAgIG1heFZlbG9jaXR5ICAgOiBudW1iZXJcbiAgICAgdmVsb2NpdHlGYWN0b3I6IG51bWJlclxuICAgICBvbkRyYWcgICAgICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gdm9pZFxuICAgICBvblN0YXJ0RHJhZyAgIDogKCkgPT4gdm9pZFxuICAgICBvblN0b3BEcmFnICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBEcmFnRXZlbnQgPSB7XG4gICAgIHggIDogbnVtYmVyXG4gICAgIHkgIDogbnVtYmVyXG4gICAgIHZlbG9jaXR5WDogbnVtYmVyXG4gICAgIHZlbG9jaXR5WTogbnVtYmVyXG4gICAgIGRlbGF5ICAgIDogbnVtYmVyXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IERyYWdnYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBtaW5WZWxvY2l0eSAgIDogMCxcbiAgICAgICAgICBtYXhWZWxvY2l0eSAgIDogMSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogKCkgPT4ge30sXG4gICAgICAgICAgb25EcmFnICAgICAgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiAoKSA9PiB7fSxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogKHdpbmRvdy5pbm5lckhlaWdodCA8IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiB3aW5kb3cuaW5uZXJXaWR0aCkgLyAyLFxuICAgICB9XG59XG5cbnZhciBzdGFydF94ICAgID0gMFxudmFyIHN0YXJ0X3kgICAgPSAwXG52YXIgc3RhcnRfdGltZSA9IDBcbnZhciBpc19kcmFnICAgID0gZmFsc2VcbnZhciBwb2ludGVyOiBNb3VzZUV2ZW50IHwgVG91Y2hcblxuZXhwb3J0IGZ1bmN0aW9uIGRyYWdnYWJsZSAoIG9wdGlvbnM6IERyYWdnYWJsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX2FjdGl2ZSA9IGZhbHNlXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGRpc2FibGVNb3VzZUV2ZW50cyAoKVxuICAgICAgICAgIGRpc2FibGVUb3VjaEV2ZW50cyAoKVxuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBlbmFibGVNb3VzZUV2ZW50cyAoKVxuICAgICAgICAgIGVuYWJsZVRvdWNoRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhZGRIYW5kbGVzICggLi4uIGhhbmRsZXM6IEpTWC5FbGVtZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAhIGNvbmZpZy5oYW5kbGVzLmluY2x1ZGVzIChoKSApXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5oYW5kbGVzLnB1c2ggKGgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBpc19hY3RpdmUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGRlc2FjdGl2YXRlICgpXG4gICAgICAgICAgICAgICBhY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBlbmFibGVUb3VjaEV2ZW50cyAoKVxuICAgICAgICAgIGVuYWJsZU1vdXNlRXZlbnRzICgpXG4gICAgICAgICAgaXNfYWN0aXZlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRpc2FibGVUb3VjaEV2ZW50cyAoKVxuICAgICAgICAgIGRpc2FibGVNb3VzZUV2ZW50cyAoKVxuICAgICAgICAgIGlzX2FjdGl2ZSA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhZGRIYW5kbGVzLFxuICAgICAgICAgIGlzQWN0aXZlOiAoKSA9PiBpc19hY3RpdmUsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBlbmFibGVUb3VjaEV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApIC8vaWYgKCBoIClcbiAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwidG91Y2hzdGFydFwiLCBvblN0YXJ0LCB7IHBhc3NpdmU6IHRydWUgfSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGlzYWJsZVRvdWNoRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzICkgLy9pZiAoIGggKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ0b3VjaHN0YXJ0XCIsIG9uU3RhcnQgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZW5hYmxlTW91c2VFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKSAvL2lmICggaCApXG4gICAgICAgICAgICAgICBoLmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCBvblN0YXJ0IClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBkaXNhYmxlTW91c2VFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKSAvL2lmICggaCApXG4gICAgICAgICAgICAgICBoLnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiICwgb25TdGFydCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0ICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS53YXJuICggXCJUZW50YXRpdmUgZGUgZMOpbWFycmFnZSBkZXMgw6l2w6luZW1lbnRzIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcImRyYWdnYWJsZSBcXFwiIGTDqWrDoCBlbiBjb3Vycy5cIiApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXNcbiAgICAgICAgICAgICAgICAgICAgPyAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyBbMF1cbiAgICAgICAgICAgICAgICAgICAgOiAoZXZlbnQgYXMgTW91c2VFdmVudClcblxuICAgICAgICAgIGlmICggZXZlbnQudHlwZSA9PSBcInRvdWNoc3RhcnRcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKFwidG91Y2htb3ZlXCIsIG9uTW92ZSwgeyBwYXNzaXZlOiB0cnVlIH0pXG4gICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJ0b3VjaGVuZFwiICwgb25FbmQpXG5cbiAgICAgICAgICAgICAgIGRpc2FibGVNb3VzZUV2ZW50cyAoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKFwibW91c2Vtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyIChcIm1vdXNldXBcIiAgLCBvbkVuZClcblxuICAgICAgICAgICAgICAgZGlzYWJsZVRvdWNoRXZlbnRzICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uU3RhcnQgKVxuXG4gICAgICAgICAgaXNfZHJhZyA9IHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbk1vdmUgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnID09IGZhbHNlIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgcG9pbnRlciA9IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgPyAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyBbMF1cbiAgICAgICAgICAgICAgICAgICAgOiAoZXZlbnQgYXMgTW91c2VFdmVudClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkVuZCAoIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGV2ZW50LnR5cGUgPT0gXCJ0b3VjaGVuZFwiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAoXCJ0b3VjaG1vdmVcIiwgb25Nb3ZlKVxuICAgICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgKFwidG91Y2hlbmRcIiAsIG9uRW5kKVxuXG4gICAgICAgICAgICAgICBpZiAoIGV2ZW50LmNhbmNlbGFibGUgKVxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCAoKVxuXG4gICAgICAgICAgICAgICBlbmFibGVNb3VzZUV2ZW50cyAoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgKFwibW91c2Vtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcIm1vdXNldXBcIiAgLCBvbkVuZClcblxuICAgICAgICAgICAgICAgZW5hYmxlVG91Y2hFdmVudHMgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpc19kcmFnID0gZmFsc2VcbiAgICAgfVxuXG4gICAgIHZhciBjdXJyZW50X2V2ZW50OiBEcmFnRXZlbnRcbiAgICAgdmFyIGxhc3RfZXZlbnQ6RHJhZ0V2ZW50XG5cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25TdGFydCAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3ggICAgPSBwb2ludGVyLmNsaWVudFhcbiAgICAgICAgICBzdGFydF95ICAgID0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgc3RhcnRfdGltZSA9IG5vd1xuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIC8vIHN0YXJ0VGltZTogbm93XG4gICAgICAgICAgICAgICBkZWxheSAgICA6IDAsXG4gICAgICAgICAgICAgICB4ICAgICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgICA6IDAsXG4gICAgICAgICAgICAgICB2ZWxvY2l0eVg6IDAsXG4gICAgICAgICAgICAgICB2ZWxvY2l0eVk6IDAsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uZmlnLm9uU3RhcnREcmFnICgpXG5cbiAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25GcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmVsb2NpdHksIG1heFZlbG9jaXR5LCB2ZWxvY2l0eUZhY3RvciB9ID0gY29uZmlnXG5cbiAgICAgICAgICBsYXN0X2V2ZW50ID0gY3VycmVudF9ldmVudFxuXG4gICAgICAgICAgY29uc3QgeCAgICAgICAgICAgPSBwb2ludGVyLmNsaWVudFggLSBzdGFydF94XG4gICAgICAgICAgY29uc3QgeSAgICAgICAgICAgPSBzdGFydF95IC0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgY29uc3QgZGVsYXkgICAgICAgPSBub3cgLSBzdGFydF90aW1lXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0RGVsYXkgPSBkZWxheSAtIGxhc3RfZXZlbnQuZGVsYXlcbiAgICAgICAgICBjb25zdCBvZmZzZXRYICAgICA9IHggLSBsYXN0X2V2ZW50LnhcbiAgICAgICAgICBjb25zdCBvZmZzZXRZICAgICA9IHkgLSBsYXN0X2V2ZW50LnlcblxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSB7XG4gICAgICAgICAgICAgICBkZWxheSxcbiAgICAgICAgICAgICAgIHgsXG4gICAgICAgICAgICAgICB5LFxuICAgICAgICAgICAgICAgdmVsb2NpdHlYOiB2ZWxvY2l0eSAoIG9mZnNldFggLyBvZmZzZXREZWxheSApLFxuICAgICAgICAgICAgICAgdmVsb2NpdHlZOiB2ZWxvY2l0eSAoIG9mZnNldFkgLyBvZmZzZXREZWxheSApLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uRnJhbWUgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uZmlnLm9uU3RvcERyYWcgKCBjdXJyZW50X2V2ZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiB2ZWxvY2l0eSAoIHZhbHVlOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNpZ24gPSB2YWx1ZSA8IDAgPyAtMSA6IDFcbiAgICAgICAgICAgICAgIHZhbHVlID0gTWF0aC5hYnMgKCB2YWx1ZSApXG5cbiAgICAgICAgICAgICAgIGlmICh2YWx1ZSA8IG1pblZlbG9jaXR5IClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNpZ24gKiBtaW5WZWxvY2l0eSAqIHZlbG9jaXR5RmFjdG9yXG5cbiAgICAgICAgICAgICAgIGlmICggdmFsdWUgPCAtbWF4VmVsb2NpdHkgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2lnbiAqIC1tYXhWZWxvY2l0eSAqIHZlbG9jaXR5RmFjdG9yXG5cbiAgICAgICAgICAgICAgIGlmICggdmFsdWUgPiBtYXhWZWxvY2l0eSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaWduICogbWF4VmVsb2NpdHkgKiB2ZWxvY2l0eUZhY3RvclxuXG4gICAgICAgICAgICAgICByZXR1cm4gc2lnbiAqIHZhbHVlICogdmVsb2NpdHlGYWN0b3JcbiAgICAgICAgICB9XG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0ICogYXMgVWkgZnJvbSBcIi4vZHJhZ2dhYmxlXCJcbmltcG9ydCB7IHhub2RlLCBKU1ggfSBmcm9tIFwiLi94bm9kZVwiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG50eXBlIFVuaXRzICAgICA9IFwicHhcIiB8IFwiJVwiXG5leHBvcnQgdHlwZSBFeHBlbmRhYmxlUHJvcGVydHkgPSBcIndpZHRoXCIgfCBcImhlaWdodFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFwieFwiIHwgXCJ5XCJcblxudHlwZSBFeHBlbmRhYmxlT3B0aW9ucyA9IFBhcnRpYWwgPEV4cGVuZGFibGVDb25maWc+XG5cbnR5cGUgRXhwZW5kYWJsZUNvbmZpZyA9IHtcbiAgICAgaGFuZGxlcyAgOiBKU1guRWxlbWVudCBbXVxuICAgICBwcm9wZXJ0eSA6IEV4cGVuZGFibGVQcm9wZXJ0eSxcbiAgICAgb3BlbiAgICAgOiBib29sZWFuXG4gICAgIG5lYXIgICAgIDogbnVtYmVyXG4gICAgIGRlbGF5ICAgIDogbnVtYmVyXG4gICAgIG1pblNpemUgIDogbnVtYmVyXG4gICAgIG1heFNpemUgIDogbnVtYmVyXG4gICAgIG9uQ2xvc2UgIDogKCkgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBFeHBlbmRhYmxlRWxlbWVudCA9IFJldHVyblR5cGUgPHR5cGVvZiBleHBhbmRhYmxlPlxuXG5jb25zdCB2ZXJ0aWNhbFByb3BlcnRpZXMgPSBbIFwiaGVpZ2h0XCIsIFwidG9wXCIsIFwiYm90dG9tXCIgXVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBFeHBlbmRhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgOiBbXSxcbiAgICAgICAgICBwcm9wZXJ0eSA6IFwiaGVpZ2h0XCIsXG4gICAgICAgICAgb3BlbiAgICAgOiBmYWxzZSxcbiAgICAgICAgICBuZWFyICAgICA6IDQwLFxuICAgICAgICAgIGRlbGF5ICAgIDogMjUwLFxuICAgICAgICAgIG1pblNpemUgIDogNjAsXG4gICAgICAgICAgbWF4U2l6ZSAgOiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA2MCxcbiAgICAgICAgICBvbkNsb3NlICA6ICgpID0+IHt9LFxuICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IEV4cGVuZGFibGVPcHRpb25zID0ge30gKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX29wZW4gICAgID0gZmFsc2VcbiAgICAgdmFyIGlzX3ZlcnRpY2FsID0gZmFsc2VcbiAgICAgdmFyIHN0YXJ0X3NpemUgID0gMFxuICAgICB2YXIgb3Blbl9zaXplICAgPSAwXG5cbiAgICAgY29uc3QgZHJhZ2dhYmxlID0gVWkuZHJhZ2dhYmxlICh7XG4gICAgICAgICAgb25TdGFydERyYWc6IG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcgOiBvblN0b3BEcmFnXG4gICAgIH0pXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9ucyA9IHt9IGFzIEV4cGVuZGFibGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaXNfb3BlbiAgICAgPSBjb25maWcub3BlblxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gdmVydGljYWxQcm9wZXJ0aWVzLmluY2x1ZGVzICggY29uZmlnLnByb3BlcnR5IClcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIGlzX3ZlcnRpY2FsID8gXCJob3Jpem9udGFsXCIgOiBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAgICAoIGlzX3ZlcnRpY2FsID8gXCJ2ZXJ0aWNhbFwiIDogXCJob3Jpem9udGFsXCIgKVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWcgOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIH0pXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gc2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGlzX29wZW4gPyBlbGVtZW50LmNzc0ludCAoIGNvbmZpZy5wcm9wZXJ0eSApIDogMFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHRvZ2dsZSAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19vcGVuIClcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgb3BlbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9wZW4gKClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZXBsYWNlICggXCJjbG9zZVwiLCBcIm9wZW5cIiApXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBvcGVuX3NpemUgKyBcInB4XCJcblxuICAgICAgICAgIGlzX29wZW4gPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZXBsYWNlICggXCJvcGVuXCIsIFwiY2xvc2VcIiApXG5cbiAgICAgICAgICBvcGVuX3NpemUgPSBzaXplICgpXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBcIjBweFwiXG5cbiAgICAgICAgICBpc19vcGVuID0gZmFsc2VcblxuICAgICAgICAgIGNvbmZpZy5vbkNsb3NlICgpXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBvcGVuLFxuICAgICAgICAgIGNsb3NlLFxuICAgICAgICAgIGlzT3BlbiAgICAgOiAoKSA9PiBpc19vcGVuLFxuICAgICAgICAgIGlzQ2xvc2UgICAgOiAoKSA9PiAhIGlzX29wZW4sXG4gICAgICAgICAgaXNWZXJ0aWNhbCA6ICgpID0+IGlzX3ZlcnRpY2FsLFxuICAgICAgICAgIGlzQWN0aXZlICAgOiAoKSA9PiBkcmFnZ2FibGUuaXNBY3RpdmUgKCksXG4gICAgICAgICAgYWN0aXZhdGUgICA6ICgpID0+IGRyYWdnYWJsZS5hY3RpdmF0ZSAoKSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZTogKCkgPT4gZHJhZ2dhYmxlLmRlc2FjdGl2YXRlICgpLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3NpemUgPSBzaXplICgpXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSAoc3RhcnRfc2l6ZSArIGV2ZW50LnkpICsgXCJweFwiXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gKHN0YXJ0X3NpemUgKyBldmVudC54KSArIFwicHhcIlxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWcgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcblxuICAgICAgICAgIHZhciBpc19tb3ZlZCA9IGlzX3ZlcnRpY2FsID8gZXZlbnQueSA+IGNvbmZpZy5uZWFyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBldmVudC54ID4gY29uZmlnLm5lYXJcblxuICAgICAgICAgIGlmICggKGlzX21vdmVkID09IGZhbHNlKSAmJiBldmVudC5kZWxheSA8PSBjb25maWcuZGVsYXkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRvZ2dsZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHNpemUgPSBjbGFtcCAoXG4gICAgICAgICAgICAgICBpc192ZXJ0aWNhbCA/IHN0YXJ0X3NpemUgKyBldmVudC55ICsgZXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHN0YXJ0X3NpemUgKyBldmVudC54ICsgZXZlbnQudmVsb2NpdHlYXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgY29uc3QgbmVlZF9jbG9zZSA9IHNpemUgPD0gY29uZmlnLm5lYXJcblxuICAgICAgICAgIGlmICggbmVlZF9jbG9zZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2xvc2UgKClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG9wZW5fc2l6ZSA9IHNpemVcbiAgICAgICAgICAgICAgIG9wZW4gKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBjbGFtcCAoIHZhbHVlOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSA8IGNvbmZpZy5taW5TaXplID8gY29uZmlnLm1pblNpemVcbiAgICAgICAgICAgICAgICAgICAgOiB2YWx1ZSA+IGNvbmZpZy5tYXhTaXplID8gY29uZmlnLm1heFNpemVcbiAgICAgICAgICAgICAgICAgICAgOiB2YWx1ZVxuICAgICAgICAgIH1cbiAgICAgfVxufVxuIiwiXG5cbmV4cG9ydCBpbnRlcmZhY2UgSUV2ZW50IDxGIGV4dGVuZHMgKCAuLi5hcmdzOiBhbnlbXSApID0+IHZvaWQgPSAoKSA9PiB2b2lkPlxue1xuICAgICggY2FsbGJhY2s6IEYgKTogdm9pZFxuICAgIGVuYWJsZSAoKTogdGhpc1xuICAgIGRpc2FibGUgKCk6IHRoaXNcbiAgICBkaXNwYXRjaCAoIC4uLmFyZ3M6IFBhcmFtZXRlcnMgPEY+ICk6IHRoaXNcbiAgICByZW1vdmUgKCBjYWxsYmFjazogRiApOiB0aGlzXG4gICAgY291bnQgKCk6IG51bWJlclxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlIDxGIGV4dGVuZHMgKCggLi4uYXJnczogYW55W10gKSA9PiB2b2lkKSA9ICgoKSA9PiB2b2lkKT4gKClcbntcbiAgICBjb25zdCByZWdpc3RlciA9IFtdIGFzIEZbXVxuICAgIHZhciAgIGVuYWJsZWQgID0gdHJ1ZVxuXG4gICAgY29uc3Qgc2VsZiA9IGZ1bmN0aW9uICggY2FsbGJhY2s6IEYgKVxuICAgIHtcbiAgICAgICAgcmVnaXN0ZXIucHVzaCAoIGNhbGxiYWNrICkgLSAxXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLmNvdW50ID0gKCkgPT5cbiAgICB7XG4gICAgICAgIHJldHVybiByZWdpc3Rlci5sZW5ndGhcbiAgICB9XG5cbiAgICBzZWxmLmRpc2FibGUgPSAoKSA9PlxuICAgIHtcbiAgICAgICAgZW5hYmxlZCA9IGZhbHNlXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLmVuYWJsZSA9ICgpID0+XG4gICAge1xuICAgICAgICBlbmFibGVkID0gdHJ1ZVxuXG4gICAgICAgIHJldHVybiBzZWxmXG4gICAgfVxuXG4gICAgc2VsZi5hcHBlbmQgPSAoIGNhbGxiYWNrOiBGICkgPT5cbiAgICB7XG4gICAgICAgIHNlbGYgKCBjYWxsYmFjayApXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLnJlbW92ZSA9ICggY2FsbGJhY2s6IEYgKSA9PlxuICAgIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSByZWdpc3Rlci5pbmRleE9mICggY2FsbGJhY2sgKVxuXG4gICAgICAgIGlmICggaW5kZXggIT0gLTEgKVxuICAgICAgICAgICAgcmVnaXN0ZXIuc3BsaWNlICggaW5kZXgsIDEgKVxuXG4gICAgICAgIHJldHVybiBzZWxmXG4gICAgfVxuXG4gICAgc2VsZi5yZW1vdmVBbGwgPSAoKSA9PlxuICAgIHtcbiAgICAgICAgcmVnaXN0ZXIuc3BsaWNlICgwKVxuXG4gICAgICAgIHJldHVybiBzZWxmXG4gICAgfVxuXG4gICAgc2VsZi5kaXNwYXRjaCA9ICggLi4uYXJnczogUGFyYW1ldGVycyA8Rj4gKSA9PlxuICAgIHtcbiAgICAgICAgaWYgKCBlbmFibGVkIClcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yKCB2YXIgZm4gb2YgcmVnaXN0ZXIgKVxuICAgICAgICAgICAgICAgIGZuICggLi4uIGFyZ3MgKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZlxufVxuXG4iLCJcbmNvbnN0IHsgbWluLCBtYXggfSA9IE1hdGhcblxuZXhwb3J0IGZ1bmN0aW9uIGxpbWl0ZWRWYWx1ZXMgKCBtaW46IG51bWJlciBbXSwgbWF4OiBudW1iZXIgW10gKVxue1xuICAgICBpZiAoIG1pbi5sZW5ndGggPCBtYXgubGVuZ3RoIClcbiAgICAgICAgICBtYXggPSBtYXguc2xpY2UgKCAwLCBtaW4ubGVuZ3RoIClcbiAgICAgZWxzZVxuICAgICAgICAgIG1pbiA9IG1pbi5zbGljZSAoIDAsIG1heC5sZW5ndGggIClcblxuICAgICBjb25zdCBjb3VudCA9IG1pbi5sZW5ndGhcbiAgICAgY29uc3QgcmFuZ2VzID0gW10gYXMgbnVtYmVyIFtdXG5cbiAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjb3VudCA7IGkrKyApXG4gICAgICAgICAgcmFuZ2VzLnB1c2ggKCBtYXggW2ldIC0gbWluIFtpXSApXG5cbiAgICAgcmV0dXJuICggbnVtczogbnVtYmVyICkgPT5cbiAgICAge1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdIGFzIG51bWJlciBbXVxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjb3VudCA7IGkrKyApXG4gICAgICAgICAgICAgICByZXN1bHQucHVzaCAoIG1pbiBbaV0gKyByYW5nZXMgW2ldICogbnVtcyApXG5cbiAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wICAoIHZhbHVlOiBudW1iZXIsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyICk6IG51bWJlclxue1xuICAgICByZXR1cm4gbWluICggbWF4KCB2YWx1ZSwgc3RhcnQgKSwgZW5kIClcbn1cblxuXG5kZWNsYXJlIG1vZHVsZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSBOdW1iZXJDb25zdHJ1Y3RvclxuICAgICB7XG4gICAgICAgICAgd3JhcFN0cmluZ1ZhbHVlIChcbiAgICAgICAgICAgICAgIHZhbHVlICAgICA6IG51bWJlciB8IHN0cmluZyB8IChudW1iZXIgfCBzdHJpbmcpIFtdLFxuICAgICAgICAgICAgICAgZGVjb21wb3NlPzogKCB2YWx1ZTogc3RyaW5nICkgPT4geyBudW1iZXJzOiBudW1iZXIgW10sIHJlY29tcG9zZTogKCkgPT4gc3RyaW5nIH0sXG4gICAgICAgICAgICAgICBtaW5WYWx1ZT8gOiBudW1iZXIgfCBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXSB8IG51bGwsXG4gICAgICAgICAgICAgICBtYXhWYWx1ZT8gOiBudW1iZXIgfCBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXSB8IG51bGwsXG4gICAgICAgICAgICAgICBvblVwZGF0ZT8gOiAoKSA9PiB2b2lkXG4gICAgICAgICAgKTogV3JhcHBlZFN0cmluZ051bWJlclxuXG4gICAgICAgICAgZGVjb21wb3NlU3RyaW5nVmFsdWUgKCB2YWx1ZTogc3RyaW5nICk6IHtcbiAgICAgICAgICAgICAgIHN0cmluZ3M6IHN0cmluZyBbXSxcbiAgICAgICAgICAgICAgIG51bWJlcnM6IG51bWJlciBbXSxcbiAgICAgICAgICAgICAgIHJlY29tcG9zZTogKCkgPT4gc3RyaW5nXG4gICAgICAgICAgfVxuICAgICB9XG59XG5cblxuaW50ZXJmYWNlIFdyYXBwZWRTdHJpbmdOdW1iZXIgLy8gZXh0ZW5kcyBNdWx0aXBsZUxpbWl0ZWRWYWx1ZVxue1xuICAgICBudW1iZXJzOiBudW1iZXIgW10sXG4gICAgIHNldCAoIHZhbHVlczogbnVtYmVyIHwgc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW10gKTogdGhpcyxcbiAgICAgbGltaXQgKCBtaW4/OiBudW1iZXIgfCBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXSwgbWF4PzogbnVtYmVyIHwgc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW10gKTogdGhpcyxcbiAgICAgZmFjdG9yICggZmFjdG9yczogbnVtYmVyIHwgbnVtYmVyIFtdICk6IHRoaXMsXG4gICAgIHJlc2V0ICgpOiB0aGlzLFxuICAgICB0b1N0cmluZyAoKTogc3RyaW5nLFxufVxuXG5tb2R1bGUgTnVtYmVyTGliXG57XG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgTGltaXRlZFZhbHVlXG4gICAgIHtcbiAgICAgICAgICBzZXQgKCB2YWx1ZTogbnVtYmVyICk6IHRoaXNcbiAgICAgICAgICBsaW1pdCAoIG1pbj86IG51bWJlciwgbWF4PzogbnVtYmVyICk6IHRoaXNcbiAgICAgICAgICBmYWN0b3IgKCB2YWx1ZTogbnVtYmVyICk6IHRoaXNcbiAgICAgfVxuXG4gICAgIGV4cG9ydCBmdW5jdGlvbiBsaW1pdGVkVmFsdWUgKCB2YWx1ZTogbnVtYmVyLCBtaW4/OiBudW1iZXIsIG1heD86IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICB2YXIgaWNsYW1wID0gMFxuXG4gICAgICAgICAgY29uc3Qgc2VsZjogTGltaXRlZFZhbHVlID0ge1xuICAgICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICAgICBzZXQsXG4gICAgICAgICAgICAgICBmYWN0b3IsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGltaXQgKCBtaW4sIG1heCApXG5cbiAgICAgICAgICByZXR1cm4gc2VsZlxuXG4gICAgICAgICAgZnVuY3Rpb24gbGltaXQgKCBtaW5WYWx1ZT86IG51bWJlciwgbWF4VmFsdWU/OiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG1pbiA9IG1pblZhbHVlXG4gICAgICAgICAgICAgICBtYXggPSBtYXhWYWx1ZVxuXG4gICAgICAgICAgICAgICBjb25zdCBjbGFtcFN0YXJ0ID0gTnVtYmVyLmlzRmluaXRlICggbWluIClcbiAgICAgICAgICAgICAgIGNvbnN0IGNsYW1wRW5kICAgPSBOdW1iZXIuaXNGaW5pdGUgKCBtYXggKVxuXG4gICAgICAgICAgICAgICBpY2xhbXAgPSBjbGFtcFN0YXJ0ICYmIGNsYW1wRW5kID8gMVxuICAgICAgICAgICAgICAgICAgICAgIDogY2xhbXBTdGFydCAgICAgICAgICAgICA/IDJcbiAgICAgICAgICAgICAgICAgICAgICA6IGNsYW1wRW5kICAgICAgICAgICAgICAgPyAzXG4gICAgICAgICAgICAgICAgICAgICAgOiAwXG5cbiAgICAgICAgICAgICAgIHJldHVybiBzZWxmXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gc2V0ICggbmV3VmFsdWU6IG51bWJlciApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFsdWUgPSBuZXdWYWx1ZVxuXG4gICAgICAgICAgICAgICBzd2l0Y2ggKCBpY2xhbXAgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICBpZiAoIHZhbHVlIDwgbWluIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG1pblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggdmFsdWUgPiBtYXggKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbWF4XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIGlmICggdmFsdWUgPCBtaW4gKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbWluXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIGlmICggdmFsdWUgPiBtYXggKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbWF4XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIHJldHVybiBzZWxmXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gZmFjdG9yICggbnVtOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhbHVlID0gbWluICsgKCBtYXggLSBtaW4gKSAqIG51bVxuXG4gICAgICAgICAgICAgICByZXR1cm4gc2VsZlxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgTXVsdGlwbGVMaW1pdGVkVmFsdWVzIGV4dGVuZHMgTGltaXRlZFZhbHVlXG4gICAgIHtcbiAgICAgICAgICBzZXQgKCB2YWx1ZXM6IG51bWJlciB8IG51bWJlciBbXSApOiB0aGlzXG4gICAgICAgICAgbGltaXQgKCBtaW4/OiBudW1iZXIgfCBudW1iZXIgW10sIG1heD86IG51bWJlciB8IG51bWJlciBbXSApOiB0aGlzXG4gICAgICAgICAgZmFjdG9yICggdmFsdWVzOiBudW1iZXIgfCBudW1iZXIgW10gKTogdGhpc1xuICAgICB9XG5cbiAgICAgZXhwb3J0IGZ1bmN0aW9uIG11bHRpcGxlTGltaXRlZFZhbHVlcyAoIHZhbHVlczogbnVtYmVyIFtdLCBtaW4/OiBudW1iZXIgW10sIG1heD86IG51bWJlciBbXSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCByYW5nZXMgPSBbXSBhcyBudW1iZXIgW11cblxuICAgICAgICAgIHZhciBpY2xhbXAgPSAwXG5cbiAgICAgICAgICBjb25zdCBzZWxmOiBNdWx0aXBsZUxpbWl0ZWRWYWx1ZXMgPSB7XG4gICAgICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgICAgIHNldCxcbiAgICAgICAgICAgICAgIGZhY3RvclxuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpbWl0ICggbWluLCBtYXggKVxuXG4gICAgICAgICAgcmV0dXJuIHNlbGZcblxuICAgICAgICAgIGZ1bmN0aW9uIGxpbWl0ICggbWluVmFsdWVzPzogbnVtYmVyIHwgbnVtYmVyIFtdLCBtYXhWYWx1ZXM/OiBudW1iZXIgfCBudW1iZXIgW10gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG1pblZhbHVlcyA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICAgICAgICAgICAgbWluVmFsdWVzID0gW21pblZhbHVlc11cblxuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgbWF4VmFsdWVzID09IFwibnVtYmVyXCIgKVxuICAgICAgICAgICAgICAgICAgICBtYXhWYWx1ZXMgPSBbbWF4VmFsdWVzXVxuXG4gICAgICAgICAgICAgICBjb25zdCBtaW5Db3VudCA9IG1pblZhbHVlcy5sZW5ndGhcbiAgICAgICAgICAgICAgIGNvbnN0IG1heENvdW50ID0gbWF4VmFsdWVzLmxlbmd0aFxuICAgICAgICAgICAgICAgY29uc3QgY291bnQgICAgPSB2YWx1ZXMubGVuZ3RoXG5cbiAgICAgICAgICAgICAgIG1pbiA9IFtdXG4gICAgICAgICAgICAgICBtYXggPSBbXVxuXG4gICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPCBtaW5Db3VudCAmJiBOdW1iZXIuaXNGaW5pdGUgKCBtaW5WYWx1ZXMgW2ldICkgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIG1pbiBbaV0gPSBtaW5WYWx1ZXMgW2ldXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICBtaW4gW2ldID0gMFxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPCBtYXhDb3VudCAmJiBOdW1iZXIuaXNGaW5pdGUgKCBtYXhWYWx1ZXMgW2ldICkgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIG1heCBbaV0gPSBtYXhWYWx1ZXMgW2ldXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICBtYXggW2ldID0gdmFsdWVzIFtpXSAvLyB8fCBtaW4gW2ldXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIGNsYW1wXG5cbiAgICAgICAgICAgICAgIGNvbnN0IGNsYW1wU3RhcnQgPSBtaW5Db3VudCAhPSAwXG4gICAgICAgICAgICAgICBjb25zdCBjbGFtcEVuZCAgID0gbWF4Q291bnQgIT0gMFxuXG4gICAgICAgICAgICAgICBpY2xhbXAgPSBjbGFtcFN0YXJ0ICYmIGNsYW1wRW5kID8gMVxuICAgICAgICAgICAgICAgICAgICAgIDogY2xhbXBTdGFydCAgICAgICAgICAgICA/IDJcbiAgICAgICAgICAgICAgICAgICAgICA6IGNsYW1wRW5kICAgICAgICAgICAgICAgPyAzXG4gICAgICAgICAgICAgICAgICAgICAgOiAwXG5cbiAgICAgICAgICAgICAgIC8vIHJhbmdlXG5cbiAgICAgICAgICAgICAgIHJhbmdlcy5zcGxpY2UgKDApXG5cbiAgICAgICAgICAgICAgIGlmICggY2xhbXBTdGFydCAmJiBjbGFtcEVuZCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlcy5wdXNoICggbWF4IFtpXSAtIG1pbiBbaV0gKVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyB1cGRhdGVcblxuICAgICAgICAgICAgICAgc2V0ICggdmFsdWVzIClcblxuICAgICAgICAgICAgICAgcmV0dXJuIHNlbGZcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBzZXQgKCBuZXdWYWx1ZXM6IG51bWJlciB8IG51bWJlciBbXSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmV3VmFsdWVzID09IFwibnVtYmVyXCIgKVxuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZXMgPSBbbmV3VmFsdWVzXVxuXG4gICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IHZhbHVlcy5sZW5ndGggPCBuZXdWYWx1ZXMubGVuZ3RoID8gdmFsdWVzLmxlbmd0aCA6IG5ld1ZhbHVlcy5sZW5ndGhcblxuICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjb3VudCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyBbaV0gPSBuZXdWYWx1ZXMgW2ldXG5cbiAgICAgICAgICAgICAgIHN3aXRjaCAoIGljbGFtcCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjYXNlIDA6XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjb3VudCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzIFtpXSA9IG5ld1ZhbHVlcyBbaV1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgY2FzZSAxOlxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbiA9IG5ld1ZhbHVlcyBbaV1cbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgW2ldID0gbiA8IG1pbiBbaV0gPyBtaW4gW2ldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG4gPiBtYXggW2ldID8gbWF4IFtpXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgY2FzZSAyOlxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gY291bnQgOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbiA9IG5ld1ZhbHVlcyBbaV1cbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgW2ldID0gbiA8IG1pbiBbaV0gPyBtaW4gW2ldIDogblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGNhc2UgMzpcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNvdW50IDsgaSsrIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBuZXdWYWx1ZXMgW2ldXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzIFtpXSA9IG4gPiBtYXggW2ldID8gbWF4IFtpXSA6IG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICByZXR1cm4gc2VsZlxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIGZhY3RvciAoIGZhY3RvcnM6IG51bWJlciB8IG51bWJlciBbXSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9ycyA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIE51bWJlci5pc0Zpbml0ZSAoIGZhY3RvcnMgKSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGZcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IHZhbHVlcy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcyBbaV0gPSBtaW4gW2ldICsgcmFuZ2VzIFtpXSAqIGZhY3RvcnNcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCBBcnJheS5pc0FycmF5ICggZmFjdG9ycyApIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSB2YWx1ZXMubGVuZ3RoIDwgZmFjdG9ycy5sZW5ndGggPyB2YWx1ZXMubGVuZ3RoIDogZmFjdG9ycy5sZW5ndGhcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNvdW50ID09IDAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmXG5cbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjb3VudCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGlzRmluaXRlICggZmFjdG9ycyBbaV0gKSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgW2ldID0gbWluIFtpXSArIHJhbmdlcyBbaV0gKiBmYWN0b3JzIFtpXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIHJldHVybiBzZWxmXG4gICAgICAgICAgfVxuICAgICB9XG59XG5cbnR5cGUgSW5wdXRWYWx1ZSA9IG51bWJlciB8IHN0cmluZyB8IChudW1iZXIgfCBzdHJpbmcpIFtdO1xuXG5leHBvcnQgZnVuY3Rpb24gd3JhcFN0cmluZ1ZhbHVlIChcbiAgICAgdmFsdWUgICAgIDogbnVtYmVyIHwgc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW10sXG4gICAgIGRlY29tcG9zZT86ICggdmFsdWU6IHN0cmluZyApID0+IHsgbnVtYmVyczogbnVtYmVyIFtdLCByZWNvbXBvc2U6ICgpID0+IHN0cmluZyB9LFxuICAgICBtaW5WYWx1ZT8gOiBudW1iZXIgfCBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXSB8IG51bGwsXG4gICAgIG1heFZhbHVlPyA6IG51bWJlciB8IHN0cmluZyB8IChudW1iZXIgfCBzdHJpbmcpIFtdIHwgbnVsbCxcbiAgICAgb25VcGRhdGU/IDogKCkgPT4gdm9pZFxuKTogV3JhcHBlZFN0cmluZ051bWJlclxue1xuICAgICBpZiAoIHR5cGVvZiBkZWNvbXBvc2UgIT0gXCJmdW5jdGlvblwiIClcbiAgICAgICAgICBkZWNvbXBvc2UgPT0gZGVjb21wb3NlU3RyaW5nVmFsdWVcblxuICAgICB2YXIgcGFydHM6IFJldHVyblR5cGUgPHR5cGVvZiBkZWNvbXBvc2U+XG4gICAgIHZhciBudW1zOiBOdW1iZXJMaWIuTXVsdGlwbGVMaW1pdGVkVmFsdWVzXG5cbiAgICAgY29uc3Qgc2VsZjogV3JhcHBlZFN0cmluZ051bWJlciA9IHtcbiAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICBzZXQsXG4gICAgICAgICAgZmFjdG9yLFxuICAgICAgICAgIHJlc2V0LFxuICAgICAgICAgIHRvU3RyaW5nICgpIHsgcmV0dXJuIHBhcnRzLnJlY29tcG9zZSAoKSB9LFxuICAgICAgICAgIGdldCBudW1iZXJzICgpIHsgcmV0dXJuIHBhcnRzLm51bWJlcnMgfVxuICAgICB9XG5cbiAgICAgO3tcbiAgICAgICAgICBjb25zdCB0bXAgPSBvblVwZGF0ZVxuICAgICAgICAgIG9uVXBkYXRlID0gbnVsbFxuXG4gICAgICAgICAgcmVzZXQgKClcblxuICAgICAgICAgIGlmICggdHlwZW9mIHRtcCA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgb25VcGRhdGUgPSB0bXBcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGxpbWl0ICggbWluPzogSW5wdXRWYWx1ZSwgbWF4PzogSW5wdXRWYWx1ZSApXG4gICAgIHtcbiAgICAgICAgICBtaW5WYWx1ZSA9IG1pblxuICAgICAgICAgIG1heFZhbHVlID0gbWF4XG5cbiAgICAgICAgICBudW1zLmxpbWl0IChcbiAgICAgICAgICAgICAgIGRlY29tcG9zZSAoIG5vcm0gKCBtaW4gKSApLm51bWJlcnMsXG4gICAgICAgICAgICAgICBkZWNvbXBvc2UgKCBub3JtICggbWF4ICkgKS5udW1iZXJzXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgaWYgKCBvblVwZGF0ZSApXG4gICAgICAgICAgICAgICBvblVwZGF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHNlbGZcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHJlc2V0ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBvbGQgPSBwYXJ0cyAhPSB1bmRlZmluZWQgPyBwYXJ0cy5yZWNvbXBvc2UgKCkgOiBcIlwiXG5cbiAgICAgICAgICBwYXJ0cyA9IGRlY29tcG9zZSAoIG5vcm0gKCB2YWx1ZSApIClcblxuICAgICAgICAgIG51bXMgPSBOdW1iZXJMaWIubXVsdGlwbGVMaW1pdGVkVmFsdWVzIChcbiAgICAgICAgICAgICAgIHBhcnRzLm51bWJlcnMsXG4gICAgICAgICAgICAgICBkZWNvbXBvc2UgKCBub3JtICggbWluVmFsdWUgKSApLm51bWJlcnMsXG4gICAgICAgICAgICAgICBkZWNvbXBvc2UgKCBub3JtICggbWF4VmFsdWUgKSApLm51bWJlcnMsXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgaWYgKCBvblVwZGF0ZSAmJiBvbGQgIT0gcGFydHMucmVjb21wb3NlICgpIClcbiAgICAgICAgICAgICAgIG9uVXBkYXRlICgpXG5cbiAgICAgICAgICByZXR1cm4gc2VsZlxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gc2V0ICggdmFsdWVzOiBJbnB1dFZhbHVlIClcbiAgICAge1xuICAgICAgICAgIG51bXMuc2V0IChcbiAgICAgICAgICAgICAgIHR5cGVvZiB2YWx1ZXMgPT0gXCJudW1iZXJcIlxuICAgICAgICAgICAgICAgPyBbdmFsdWVzXVxuICAgICAgICAgICAgICAgOiBkZWNvbXBvc2UgKCBub3JtICggdmFsdWVzICkgKS5udW1iZXJzXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgaWYgKCBvblVwZGF0ZSApXG4gICAgICAgICAgICAgICBvblVwZGF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHNlbGZcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGZhY3RvciAoIGZhY3RvcnM6IG51bWJlciB8IG51bWJlciBbXSApXG4gICAgIHtcbiAgICAgICAgICBudW1zLmZhY3RvciAoIGZhY3RvcnMgKVxuXG4gICAgICAgICAgaWYgKCBvblVwZGF0ZSApXG4gICAgICAgICAgICAgICBvblVwZGF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHNlbGZcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG5vcm0gKCBpbnB1dDogSW5wdXRWYWx1ZSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkgKCBpbnB1dCApIClcbiAgICAgICAgICAgICAgIHJldHVybiBpbnB1dC5qb2luICgnICcpXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBpbnB1dCA9PSBcIm51bWJlclwiIClcbiAgICAgICAgICAgICAgIHJldHVybiBpbnB1dC50b1N0cmluZyAoKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gaW5wdXRcblxuICAgICAgICAgIHJldHVybiBcIlwiXG4gICAgIH1cblxuICAgICByZXR1cm4gc2VsZlxufVxuXG5jb25zdCByZWdleCA9IC8oWystXT9cXGQqXFwuP1xcZCsoPzpcXC5cXGQrKT8oPzpbZUVdWystXT9cXGQrKT8pL2dcblxuXG5mdW5jdGlvbiBkZWNvbXBvc2VTdHJpbmdWYWx1ZSAoIHZhbHVlOiBzdHJpbmcgKToge1xuICAgICBzdHJpbmdzOiBzdHJpbmcgW10sXG4gICAgIG51bWJlcnM6IG51bWJlciBbXSxcbiAgICAgcmVjb21wb3NlOiAoKSA9PiBzdHJpbmdcbn1cbntcbiAgICAgY29uc3Qgc3RyaW5ncyA9IFtdIGFzIHN0cmluZyBbXVxuICAgICBjb25zdCBudW1iZXJzID0gW10gYXMgbnVtYmVyIFtdXG5cbiAgICAgdmFyIHN0YXJ0ID0gMFxuICAgICB2YXIgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheVxuXG4gICAgIHdoaWxlICggKG1hdGNoID0gcmVnZXguZXhlYyAoIHZhbHVlICkpICE9PSBudWxsIClcbiAgICAge1xuICAgICAgICAgIHN0cmluZ3MucHVzaCAoIHZhbHVlLnN1YnN0cmluZyAoIHN0YXJ0LCBtYXRjaC5pbmRleCApIClcbiAgICAgICAgICBudW1iZXJzLnB1c2ggICggcGFyc2VGbG9hdCAoIG1hdGNoIFsxXSApIClcblxuICAgICAgICAgIHN0YXJ0ID0gbWF0Y2guaW5kZXggKyBtYXRjaCBbMF0ubGVuZ3RoXG4gICAgIH1cblxuICAgICBzdHJpbmdzLnB1c2ggKCB2YWx1ZS5zdWJzdHJpbmcgKCBzdGFydCApIClcblxuICAgICBjb25zdCByZWNvbXBvc2UgPSAoKSA9PlxuICAgICB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCJcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgIT0gbnVtYmVycy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAgcmVzdWx0ICs9IHN0cmluZ3MgW2ldICsgbnVtYmVycyBbaV1cblxuICAgICAgICAgIHJldHVybiByZXN1bHQgKyBzdHJpbmdzIFtpXVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdHJpbmdzLFxuICAgICAgICAgIG51bWJlcnMsXG4gICAgICAgICAgcmVjb21wb3NlXG4gICAgIH1cbn1cbiIsIlxuXG5leHBvcnQgdHlwZSBSYWRpYWxPcHRpb24gPSB7XG4gICAgciAgICAgICAgOiBudW1iZXIsXG4gICAgY291bnQgICAgOiBudW1iZXIsXG4gICAgcGFkZGluZz8gOiBudW1iZXIsXG4gICAgcm90YXRpb24/OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFJhZGlhbERlZmluaXRpb24gPSBSZXF1aXJlZCA8UmFkaWFsT3B0aW9uPiAmIHtcbiAgICBjeCAgICA6IG51bWJlcixcbiAgICBjeSAgICA6IG51bWJlcixcbiAgICB3aWR0aCA6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBwb2ludHM6IFBhcnQgW10sXG59XG5cbnR5cGUgUGFydCA9IHtcbiAgICB4IDogbnVtYmVyXG4gICAgeSA6IG51bWJlclxuICAgIGEgOiBudW1iZXJcbiAgICBhMTogbnVtYmVyXG4gICAgYTI6IG51bWJlclxuICAgIGNob3JkPzoge1xuICAgICAgICB4MSAgICA6IG51bWJlclxuICAgICAgICB5MSAgICA6IG51bWJlclxuICAgICAgICB4MiAgICA6IG51bWJlclxuICAgICAgICB5MiAgICA6IG51bWJlclxuICAgICAgICBsZW5ndGg6IG51bWJlclxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIG9wdGlvbnM6IFJhZGlhbE9wdGlvbiApXG57XG4gICAgY29uc3QgeyBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgIGNvbnN0IHIgICAgICAgID0gb3B0aW9ucy5yICAgICAgICB8fCAzMFxuICAgIGNvbnN0IGNvdW50ICAgID0gb3B0aW9ucy5jb3VudCAgICB8fCAxMFxuICAgIGNvbnN0IHJvdGF0aW9uID0gb3B0aW9ucy5yb3RhdGlvbiB8fCAwXG5cbiAgICBjb25zdCBwb2ludHMgPSBbXSBhcyBQYXJ0IFtdXG5cbiAgICBjb25zdCBhICAgICA9IDIgKiBQSSAvIGNvdW50XG4gICAgY29uc3QgY2hvcmQgPSAyICogciAqIHNpbiAoIGEgKiAwLjUgKVxuICAgIGNvbnN0IHNpemUgID0gciAqIDQgKyBjaG9yZFxuICAgIGNvbnN0IGMgICAgID0gc2l6ZSAvIDJcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kgKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgID0gYSAqIGkgKyByb3RhdGlvblxuICAgICAgICBjb25zdCBtaWRkbGUgPSBzdGFydCArIGEgKiAwLjVcbiAgICAgICAgY29uc3QgZW5kICAgID0gc3RhcnQgKyBhXG5cbiAgICAgICAgcG9pbnRzLnB1c2ggKHtcbiAgICAgICAgICAgIGExICAgOiBzdGFydCxcbiAgICAgICAgICAgIGEgICAgOiBtaWRkbGUsXG4gICAgICAgICAgICBhMiAgIDogZW5kLFxuICAgICAgICAgICAgeCAgICA6IGNvcyAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgeSAgICA6IHNpbiAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgY2hvcmQ6IHtcbiAgICAgICAgICAgICAgICB4MTogY29zIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5MTogc2luIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB4MjogY29zIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5Mjogc2luIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGNob3JkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBSYWRpYWxEZWZpbml0aW9uID0ge1xuICAgICAgICByLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgcm90YXRpb24sXG4gICAgICAgIHBhZGRpbmc6IG9wdGlvbnMucGFkZGluZyB8fCAwLFxuICAgICAgICBjeCAgICAgOiBjLFxuICAgICAgICBjeSAgICAgOiBjLFxuICAgICAgICB3aWR0aCAgOiBzaXplLFxuICAgICAgICBoZWlnaHQgOiBzaXplLFxuICAgICAgICBwb2ludHNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG4iLCIvLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2QzLXBhY2tlbmNsb3NlP2NvbGxlY3Rpb249QG9ic2VydmFibGVocS9hbGdvcml0aG1zXG4vLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2NpcmNsZS1wYWNraW5nXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL2VuY2xvc2UuanNcblxuXG5leHBvcnQgdHlwZSBDaXJjbGUgPSB7XG4gICAgIHg6IG51bWJlcixcbiAgICAgeTogbnVtYmVyLFxuICAgICByOiBudW1iZXJcbn1cblxuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxuZnVuY3Rpb24gc2h1ZmZsZSA8VD4gKCBhcnJheTogVFtdIClcbntcbiAgICAgdmFyIG0gPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgdCxcbiAgICAgICAgICBpOiBudW1iZXJcblxuICAgICB3aGlsZSAoIG0gKVxuICAgICB7XG4gICAgICAgICAgaSA9IE1hdGgucmFuZG9tICgpICogbS0tIHwgMFxuICAgICAgICAgIHQgPSBhcnJheSBbbV1cbiAgICAgICAgICBhcnJheSBbbV0gPSBhcnJheSBbaV1cbiAgICAgICAgICBhcnJheSBbaV0gPSB0XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJyYXlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGNpcmNsZXMgPSBzaHVmZmxlICggc2xpY2UuY2FsbCggY2lyY2xlcyApIClcblxuICAgICBjb25zdCBuID0gY2lyY2xlcy5sZW5ndGhcblxuICAgICB2YXIgaSA9IDAsXG4gICAgIEIgPSBbXSxcbiAgICAgcDogQ2lyY2xlLFxuICAgICBlOiBDaXJjbGU7XG5cbiAgICAgd2hpbGUgKCBpIDwgbiApXG4gICAgIHtcbiAgICAgICAgICBwID0gY2lyY2xlcyBbaV1cblxuICAgICAgICAgIGlmICggZSAmJiBlbmNsb3Nlc1dlYWsgKCBlLCBwICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgQiA9IGV4dGVuZEJhc2lzICggQiwgcCApXG4gICAgICAgICAgICAgICBlID0gZW5jbG9zZUJhc2lzICggQiApXG4gICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIGV4dGVuZEJhc2lzICggQjogQ2lyY2xlW10sIHA6IENpcmNsZSApXG57XG4gICAgIHZhciBpOiBudW1iZXIsXG4gICAgIGo6IG51bWJlclxuXG4gICAgIGlmICggZW5jbG9zZXNXZWFrQWxsICggcCwgQiApIClcbiAgICAgICAgICByZXR1cm4gW3BdXG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgZWxlbWVudC5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgKCBwLCBCIFtpXSApXG4gICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICksIEIgKVxuICAgICAgICAgICl7XG4gICAgICAgICAgICAgICByZXR1cm4gWyBCW2ldLCBwIF1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBlbGVtZW50cy5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aCAtIDE7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBqID0gaSArIDE7IGogPCBCLmxlbmd0aDsgKytqIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBCIFtqXSAgICApLCBwIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICAgICAgICApLCBCIFtqXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtqXSwgcCAgICAgICAgKSwgQiBbaV0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsKCBlbmNsb3NlQmFzaXMzICggQiBbaV0sIEIgW2pdLCBwICksIEIgKVxuICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgQlsgaSBdLCBCWyBqIF0sIHAgXTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIHNvbWV0aGluZyBpcyB2ZXJ5IHdyb25nLlxuICAgICB0aHJvdyBuZXcgRXJyb3I7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzTm90ICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCBkciA9IGEuciAtIGIuclxuICAgICBjb25zdCBkeCA9IGIueCAtIGEueFxuICAgICBjb25zdCBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA8IDAgfHwgZHIgKiBkciA8IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWsgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciAtIGIuciArIDFlLTYsXG4gICAgIGR4ID0gYi54IC0gYS54LFxuICAgICBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2Vha0FsbCAoIGE6IENpcmNsZSwgQjogQ2lyY2xlW10gKVxue1xuICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggISBlbmNsb3Nlc1dlYWsgKCBhLCBCW2ldICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgIH1cbiAgICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzICggQjogQ2lyY2xlW10gKVxue1xuICAgICBzd2l0Y2ggKCBCLmxlbmd0aCApXG4gICAgIHtcbiAgICAgICAgICBjYXNlIDE6IHJldHVybiBlbmNsb3NlQmFzaXMxKCBCIFswXSApXG4gICAgICAgICAgY2FzZSAyOiByZXR1cm4gZW5jbG9zZUJhc2lzMiggQiBbMF0sIEIgWzFdIClcbiAgICAgICAgICBjYXNlIDM6IHJldHVybiBlbmNsb3NlQmFzaXMzKCBCIFswXSwgQiBbMV0sIEIgWzJdIClcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMxICggYTogQ2lyY2xlIClcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiBhLngsXG4gICAgICAgICAgeTogYS55LFxuICAgICAgICAgIHI6IGEuclxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMyICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG5cbiAgICAgdmFyIHgyMSA9IHgyIC0geDEsXG4gICAgIHkyMSA9IHkyIC0geTEsXG4gICAgIHIyMSA9IHIyIC0gcjEsXG4gICAgIGwgICA9IE1hdGguc3FydCggeDIxICogeDIxICsgeTIxICogeTIxICk7XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiAoIHgxICsgeDIgKyB4MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHk6ICggeTEgKyB5MiArIHkyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgcjogKCBsICsgcjEgKyByMiApIC8gMlxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcbiAgICAgY29uc3QgeyB4OiB4MywgeTogeTMsIHI6IHIzIH0gPSBjXG5cbiAgICAgY29uc3QgYTIgPSB4MSAtIHgyLFxuICAgICAgICAgICAgICAgYTMgPSB4MSAtIHgzLFxuICAgICAgICAgICAgICAgYjIgPSB5MSAtIHkyLFxuICAgICAgICAgICAgICAgYjMgPSB5MSAtIHkzLFxuICAgICAgICAgICAgICAgYzIgPSByMiAtIHIxLFxuICAgICAgICAgICAgICAgYzMgPSByMyAtIHIxLFxuXG4gICAgICAgICAgICAgICBkMSA9IHgxICogeDEgKyB5MSAqIHkxIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIGQyID0gZDEgLSB4MiAqIHgyIC0geTIgKiB5MiArIHIyICogcjIsXG4gICAgICAgICAgICAgICBkMyA9IGQxIC0geDMgKiB4MyAtIHkzICogeTMgKyByMyAqIHIzLFxuXG4gICAgICAgICAgICAgICBhYiA9IGEzICogYjIgLSBhMiAqIGIzLFxuICAgICAgICAgICAgICAgeGEgPSAoIGIyICogZDMgLSBiMyAqIGQyICkgLyAoIGFiICogMiApIC0geDEsXG4gICAgICAgICAgICAgICB4YiA9ICggYjMgKiBjMiAtIGIyICogYzMgKSAvIGFiLFxuICAgICAgICAgICAgICAgeWEgPSAoIGEzICogZDIgLSBhMiAqIGQzICkgLyAoIGFiICogMiApIC0geTEsXG4gICAgICAgICAgICAgICB5YiA9ICggYTIgKiBjMyAtIGEzICogYzIgKSAvIGFiLFxuXG4gICAgICAgICAgICAgICBBICA9IHhiICogeGIgKyB5YiAqIHliIC0gMSxcbiAgICAgICAgICAgICAgIEIgID0gMiAqICggcjEgKyB4YSAqIHhiICsgeWEgKiB5YiApLFxuICAgICAgICAgICAgICAgQyAgPSB4YSAqIHhhICsgeWEgKiB5YSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICByICA9IC0oIEEgPyAoIEIgKyBNYXRoLnNxcnQoIEIgKiBCIC0gNCAqIEEgKiBDICkgKSAvICggMiAqIEEgKSA6IEMgLyBCIClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHgxICsgeGEgKyB4YiAqIHIsXG4gICAgICAgICAgeTogeTEgKyB5YSArIHliICogcixcbiAgICAgICAgICByOiByXG4gICAgIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kMy1lbmNsb3NlLnRzXCIgLz5cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9zaWJsaW5ncy5qc1xuXG5pbXBvcnQgeyBlbmNsb3NlLCBDaXJjbGUgfSBmcm9tIFwiLi9kMy1lbmNsb3NlXCJcblxuZnVuY3Rpb24gcGxhY2UgKCBiOiBDaXJjbGUsIGE6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgdmFyIGR4ID0gYi54IC0gYS54LFxuICAgICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgICBhMjogbnVtYmVyLFxuICAgICAgICAgIGR5ID0gYi55IC0gYS55LFxuICAgICAgICAgIHkgOiBudW1iZXIsXG4gICAgICAgICAgYjI6IG51bWJlcixcbiAgICAgICAgICBkMiA9IGR4ICogZHggKyBkeSAqIGR5XG5cbiAgICAgaWYgKCBkMiApXG4gICAgIHtcbiAgICAgICAgICBhMiA9IGEuciArIGMuciwgYTIgKj0gYTJcbiAgICAgICAgICBiMiA9IGIuciArIGMuciwgYjIgKj0gYjJcblxuICAgICAgICAgIGlmICggYTIgPiBiMiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBiMiAtIGEyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYjIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYi54IC0geCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBiLnkgLSB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYTIgLSBiMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGEyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGEueCArIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYS55ICsgeCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIGMueCA9IGEueCArIGMuclxuICAgICAgICAgIGMueSA9IGEueVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdHMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciArIGIuciAtIDFlLTYsIGR4ID0gYi54IC0gYS54LCBkeSA9IGIueSAtIGEueTtcbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlICggbm9kZTogTm9kZSApXG57XG4gICAgIHZhciBhID0gbm9kZS5fLFxuICAgICAgICAgIGIgPSBub2RlLm5leHQuXyxcbiAgICAgICAgICBhYiA9IGEuciArIGIucixcbiAgICAgICAgICBkeCA9ICggYS54ICogYi5yICsgYi54ICogYS5yICkgLyBhYixcbiAgICAgICAgICBkeSA9ICggYS55ICogYi5yICsgYi55ICogYS5yICkgLyBhYjtcbiAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5jbGFzcyBOb2RlXG57XG4gICAgIG5leHQgICAgID0gbnVsbCBhcyBOb2RlXG4gICAgIHByZXZpb3VzID0gbnVsbCBhcyBOb2RlXG4gICAgIGNvbnN0cnVjdG9yICggcHVibGljIF86IENpcmNsZSApIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrRW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgaWYgKCAhKCBuID0gY2lyY2xlcy5sZW5ndGggKSApIHJldHVybiAwO1xuXG4gICAgIHZhciBhLCBiLCBjIC8qOiBOb2RlICYgQ2lyY2xlKi8sIG4sIGFhLCBjYSwgaSwgaiwgaywgc2osIHNrO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBmaXJzdCBjaXJjbGUuXG4gICAgIGEgPSBjaXJjbGVzWyAwIF0sIGEueCA9IDAsIGEueSA9IDA7XG4gICAgIGlmICggISggbiA+IDEgKSApIHJldHVybiBhLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHNlY29uZCBjaXJjbGUuXG4gICAgIGIgPSBjaXJjbGVzWyAxIF0sIGEueCA9IC1iLnIsIGIueCA9IGEuciwgYi55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMiApICkgcmV0dXJuIGEuciArIGIucjtcblxuICAgICAvLyBQbGFjZSB0aGUgdGhpcmQgY2lyY2xlLlxuICAgICBwbGFjZSggYiwgYSwgYyA9IGNpcmNsZXNbIDIgXSApO1xuXG4gICAgIC8vIEluaXRpYWxpemUgdGhlIGZyb250LWNoYWluIHVzaW5nIHRoZSBmaXJzdCB0aHJlZSBjaXJjbGVzIGEsIGIgYW5kIGMuXG4gICAgIGEgPSBuZXcgTm9kZSggYSApLCBiID0gbmV3IE5vZGUoIGIgKSwgYyA9IG5ldyBOb2RlKCBjICk7XG4gICAgIGEubmV4dCA9IGMucHJldmlvdXMgPSBiO1xuICAgICBiLm5leHQgPSBhLnByZXZpb3VzID0gYztcbiAgICAgYy5uZXh0ID0gYi5wcmV2aW91cyA9IGE7XG5cbiAgICAgLy8gQXR0ZW1wdCB0byBwbGFjZSBlYWNoIHJlbWFpbmluZyBjaXJjbGXigKZcbiAgICAgcGFjazogZm9yICggaSA9IDM7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgcGxhY2UoIGEuXywgYi5fLCBjID0gY2lyY2xlc1sgaSBdICksIGMgPSBuZXcgTm9kZSggYyApO1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBpbnRlcnNlY3RpbmcgY2lyY2xlIG9uIHRoZSBmcm9udC1jaGFpbiwgaWYgYW55LlxuICAgICAgICAgIC8vIOKAnENsb3NlbmVzc+KAnSBpcyBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZSBhbG9uZyB0aGUgZnJvbnQtY2hhaW4uXG4gICAgICAgICAgLy8g4oCcQWhlYWTigJ0gb3Ig4oCcYmVoaW5k4oCdIGlzIGxpa2V3aXNlIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlLlxuICAgICAgICAgIGogPSBiLm5leHQsIGsgPSBhLnByZXZpb3VzLCBzaiA9IGIuXy5yLCBzayA9IGEuXy5yO1xuICAgICAgICAgIGRvXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBzaiA8PSBzayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggai5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBiID0gaiwgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNqICs9IGouXy5yLCBqID0gai5uZXh0O1xuICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggay5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBhID0gaywgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNrICs9IGsuXy5yLCBrID0gay5wcmV2aW91cztcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlICggaiAhPT0gay5uZXh0ICk7XG5cbiAgICAgICAgICAvLyBTdWNjZXNzISBJbnNlcnQgdGhlIG5ldyBjaXJjbGUgYyBiZXR3ZWVuIGEgYW5kIGIuXG4gICAgICAgICAgYy5wcmV2aW91cyA9IGEsIGMubmV4dCA9IGIsIGEubmV4dCA9IGIucHJldmlvdXMgPSBiID0gYztcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG5ldyBjbG9zZXN0IGNpcmNsZSBwYWlyIHRvIHRoZSBjZW50cm9pZC5cbiAgICAgICAgICBhYSA9IHNjb3JlKCBhICk7XG4gICAgICAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAoIGNhID0gc2NvcmUoIGMgKSApIDwgYWEgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhID0gYyxcbiAgICAgICAgICAgICAgICAgICAgYWEgPSBjYTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYiA9IGEubmV4dDtcbiAgICAgfVxuXG4gICAgIC8vIENvbXB1dGUgdGhlIGVuY2xvc2luZyBjaXJjbGUgb2YgdGhlIGZyb250IGNoYWluLlxuICAgICBhID0gWyBiLl8gXVxuICAgICBjID0gYlxuICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICBhLnB1c2goIGMuXyApO1xuICAgICBjID0gZW5jbG9zZSggYSApXG5cbiAgICAgLy8gVHJhbnNsYXRlIHRoZSBjaXJjbGVzIHRvIHB1dCB0aGUgZW5jbG9zaW5nIGNpcmNsZSBhcm91bmQgdGhlIG9yaWdpbi5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgYSA9IGNpcmNsZXNbIGkgXSxcbiAgICAgICAgICBhLnggLT0gYy54LFxuICAgICAgICAgIGEueSAtPSBjLnlcbiAgICAgfVxuXG4gICAgIHJldHVybiBjLnIgYXMgbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrQ2lyY2xlcyAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgcGFja0VuY2xvc2UoIGNpcmNsZXMgKTtcbiAgICAgcmV0dXJuIGNpcmNsZXMgYXMgQ2lyY2xlW107XG59XG4iLCJcclxuXHJcbmV4cG9ydCB0eXBlIFVuaXRcclxuICAgID0gXCIlXCJcclxuICAgIHwgXCJweFwiIHwgXCJwdFwiIHwgXCJlbVwiIHwgXCJyZW1cIiB8IFwiaW5cIiB8IFwiY21cIiB8IFwibW1cIlxyXG4gICAgfCBcImV4XCIgfCBcImNoXCIgfCBcInBjXCJcclxuICAgIHwgXCJ2d1wiIHwgXCJ2aFwiIHwgXCJ2bWluXCIgfCBcInZtYXhcIlxyXG4gICAgfCBcImRlZ1wiIHwgXCJyYWRcIiB8IFwidHVyblwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdCAoIHZhbHVlOiBhbnkgKTogVW5pdCB8IHVuZGVmaW5lZFxyXG57XHJcbiAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIClcclxuICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG5cclxuICAgIGNvbnN0IHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvXHJcbiAgICAgICAgICAgICAgLmV4ZWMoIHZhbHVlICk7XHJcblxyXG4gICAgaWYgKCBzcGxpdCApXHJcbiAgICAgICAgIHJldHVybiBzcGxpdCBbMV0gYXMgVW5pdFxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0ICggcHJvcE5hbWU6IHN0cmluZyApXHJcbntcclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAndHJhbnNsYXRlJyApIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnIClcclxuICAgICAgICByZXR1cm4gJ3B4J1xyXG5cclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAncm90YXRlJyApIHx8IHByb3BOYW1lLmluY2x1ZGVzICggJ3NrZXcnICkgKVxyXG4gICAgICAgIHJldHVybiAnZGVnJ1xyXG59IiwiXG5pbXBvcnQgeyBDc3MgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4XCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZVwiXG5pbXBvcnQgeyB4bm9kZSwgSlNYIH0gZnJvbSBcIi4veG5vZGVcIlxuXG50eXBlIERpcmVjdGlvbiAgID0gXCJsclwiIHwgXCJybFwiIHwgXCJidFwiIHwgXCJ0YlwiXG50eXBlIE9yaWVudGF0aW9uID0gXCJ2ZXJ0aWNhbFwiIHwgXCJob3Jpem9udGFsXCJcbnR5cGUgVW5pdHMgICAgICAgPSBcInB4XCIgfCBcIiVcIlxudHlwZSBTd2lwZWFibGVQcm9wZXJ0eSA9IFwidG9wXCIgfCBcImxlZnRcIiB8IFwiYm90dG9tXCIgfCBcInJpZ2h0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICB8IFwieFwiIHwgXCJ5XCJcblxudHlwZSBTd2lwZWFibGVPcHRpb25zID0gUGFydGlhbCA8U3dpcGVhYmxlQ29uZmlnPlxuXG50eXBlIFN3aXBlYWJsZUNvbmZpZyA9IHtcbiAgICAgaGFuZGxlcyAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgcG9ycGVydHkgIDogU3dpcGVhYmxlUHJvcGVydHlcbiAgICAgbWluVmFsdWUgIDogbnVtYmVyLFxuICAgICBtYXhWYWx1ZSAgOiBudW1iZXIsXG4gICAgIHVuaXRzICAgICA6IFVuaXRzLFxuICAgICBtb3VzZVdoZWVsOiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIFN3aXBlYWJsZUVsZW1lbnQgPSBSZXR1cm5UeXBlIDx0eXBlb2Ygc3dpcGVhYmxlPlxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBTd2lwZWFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgOiBbXSxcbiAgICAgICAgICBwb3JwZXJ0eSAgOiBcImxlZnRcIixcbiAgICAgICAgICBtaW5WYWx1ZSAgOiAtMTAwLFxuICAgICAgICAgIG1heFZhbHVlICA6IDAsXG4gICAgICAgICAgdW5pdHMgICAgIDogXCIlXCIsXG4gICAgICAgICAgbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgfVxufVxuXG52YXIgc3RhcnRfcG9zaXRpb24gPSAwXG52YXIgaXNfdmVydGljYWwgICAgPSBmYWxzZVxudmFyIHByb3AgOiBTd2lwZWFibGVQcm9wZXJ0eVxuXG5leHBvcnQgZnVuY3Rpb24gc3dpcGVhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IFN3aXBlYWJsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgY29uc3QgZHJhZ2dhYmxlID0gVWkuZHJhZ2dhYmxlICh7XG4gICAgICAgICAgb25TdGFydERyYWcsXG4gICAgICAgICAgb25TdG9wRHJhZyxcbiAgICAgfSlcblxuICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcInN3aXBlYWJsZVwiIClcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zOiBTd2lwZWFibGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgc3dpdGNoICggY29uZmlnLnBvcnBlcnR5IClcbiAgICAgICAgICB7XG4gICAgICAgICAgY2FzZSBcInRvcFwiOiBjYXNlIFwiYm90dG9tXCI6IGNhc2UgXCJ5XCI6IGlzX3ZlcnRpY2FsID0gdHJ1ZSAgOyBicmVha1xuICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6IGNhc2UgXCJyaWdodFwiOiBjYXNlIFwieFwiOiBpc192ZXJ0aWNhbCA9IGZhbHNlIDsgYnJlYWtcbiAgICAgICAgICBkZWZhdWx0OiBkZWJ1Z2dlciA7IHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGRyYWdnYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgIGhhbmRsZXM6IGNvbmZpZy5oYW5kbGVzLFxuICAgICAgICAgICAgICAgb25EcmFnOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsIDogb25EcmFnSG9yaXpvbnRhbFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwcm9wID0gY29uZmlnLnBvcnBlcnR5XG5cbiAgICAgICAgICBpZiAoIGRyYWdnYWJsZS5pc0FjdGl2ZSAoKSApXG4gICAgICAgICAgICAgICBhY3RpdmVFdmVudHMgKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHBvc2l0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gZWxlbWVudC5jc3NGbG9hdCAoIHByb3AgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkcmFnZ2FibGUuZGVzYWN0aXZhdGUgKClcbiAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmcgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogbnVtYmVyLCB1bml0czogVW5pdHMgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdT86IFVuaXRzIClcbiAgICAge1xuICAgICAgICAgIGlmICggdHlwZW9mIG9mZnNldCA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB1ID0gQ3NzLmdldFVuaXQgKCBvZmZzZXQgKSBhcyBVbml0c1xuICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCAhIFtcInB4XCIsIFwiJVwiXS5pbmNsdWRlcyAoIHUgKSApXG4gICAgICAgICAgICAgICB1ID0gXCJweFwiXG5cbiAgICAgICAgICBpZiAoIHUgIT0gY29uZmlnLnVuaXRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICh1ID0gY29uZmlnLnVuaXRzKSA9PSBcIiVcIiApXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGVyY2VudHMgKCBvZmZzZXQgKVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0b1BpeGVscyAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIG9mZnNldCApICsgdVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgc3dpcGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGlmICggY29uZmlnLm1vdXNlV2hlZWwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgICAgICBoLmFkZEV2ZW50TGlzdGVuZXIgKCBcIndoZWVsXCIsIG9uV2hlZWwgKVxuICAgICAgICAgIH1cbiAgICAgfVxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ3aGVlbFwiLCBvbldoZWVsIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHRvUGl4ZWxzICggcGVyY2VudGFnZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG5cbiAgICAgICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAxMDAgKVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZSA9IDEwMCArIHBlcmNlbnRhZ2VcblxuICAgICAgICAgIHJldHVybiBtaW4gKyAobWF4IC0gbWluKSAqIHBlcmNlbnRhZ2UgLyAxMDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b1BlcmNlbnRzICggcGl4ZWxzOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBtaW5WYWx1ZTogbWluLCBtYXhWYWx1ZTogbWF4IH0gPSBjb25maWdcbiAgICAgICAgICByZXR1cm4gTWF0aC5hYnMgKCAocGl4ZWxzIC0gbWluKSAvIChtYXggLSBtaW4pICogMTAwIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnREcmFnICgpXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgc3RhcnRfcG9zaXRpb24gPSBwb3NpdGlvbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC55ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC54ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG5cbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSBpc192ZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZXZlbnQueSArIGV2ZW50LnZlbG9jaXR5WVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogZXZlbnQueCArIGV2ZW50LnZlbG9jaXR5WFxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgb2Zmc2V0ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbldoZWVsICggZXZlbnQ6IFdoZWVsRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBldmVudC5kZWx0YU1vZGUgIT0gV2hlZWxFdmVudC5ET01fREVMVEFfUElYRUwgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGlzX3ZlcnRpY2FsIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGV2ZW50LmRlbHRhWFxuXG4gICAgICAgICAgICAgICBpZiAoIGRlbHRhID09IDAgKVxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBwb3NpdGlvbiAoKSArIGRlbHRhICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBjbGFtcCAoIHZhbHVlOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlIDwgY29uZmlnLm1pblZhbHVlID8gY29uZmlnLm1pblZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlID4gY29uZmlnLm1heFZhbHVlID8gY29uZmlnLm1heFZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlXG4gICAgIH1cbn1cbiIsImltcG9ydCB7ICRDb21wb25lbnQsIENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9Db3JlL0NvbXBvbmVudC9pbmRleFwiXG5pbXBvcnQgeyB4bm9kZSwgSlNYIH0gZnJvbSBcIi4uLy4uL0NvcmUveG5vZGVcIlxuXG5leHBvcnQgaW50ZXJmYWNlIEJsb2NrQ29uZmlnIGV4dGVuZHMgJENvbXBvbmVudFxue1xuICAgICB0eXBlOiBcImJsb2NrXCJcbiAgICAgb3JpZW50YXRpb246IE9yaWVudGF0aW9uXG4gICAgIGVsZW1lbnRzOiBDb21wb25lbnQgW11cbn1cblxudHlwZSBPcmllbnRhdGlvbiA9IFwidmVydGljYWxcIiB8IFwiaG9yaXpvbnRhbFwiXG5cbmV4cG9ydCBjbGFzcyBCbG9jayBleHRlbmRzIENvbXBvbmVudCA8QmxvY2tDb25maWc+XG57XG4gICAgIGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJiYXJcIj48L2Rpdj5cblxuICAgICBnZXQgb3JpZW50YXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuY29udGFpbnMgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgICAgICAgPyBcImhvcml6b250YWxcIlxuICAgICAgICAgICAgICAgOiBcInZlcnRpY2FsXCJcbiAgICAgfVxuXG4gICAgIHNldCBvcmllbnRhdGlvbiAoIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3RcblxuICAgICAgICAgIHZhciBuZXdfb3JpZW50YXRpb24gPSBjbGFzc0xpc3QuY29udGFpbnMgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcImhvcml6b250YWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcInZlcnRpY2FsXCJcblxuICAgICAgICAgIGlmICggb3JpZW50YXRpb24gPT0gbmV3X29yaWVudGF0aW9uIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY2xhc3NMaXN0LnJlcGxhY2UgICggb3JpZW50YXRpb24sIG5ld19vcmllbnRhdGlvbiApXG4gICAgIH1cbn1cbiIsImltcG9ydCB7ICRDb21wb25lbnQsIENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9Db3JlL0NvbXBvbmVudC9pbmRleFwiXG5pbXBvcnQgeyB4bm9kZSwgSlNYIH0gZnJvbSBcIi4uLy4uL0NvcmUveG5vZGVcIlxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgJEJ1dHRvbiBleHRlbmRzICRDb21wb25lbnRcbntcbiAgICAgdHlwZSA6IFwiYnV0dG9uXCJcbiAgICAgaWNvbiA6IHN0cmluZ1xuICAgICB0ZXh0Pzogc3RyaW5nXG4gICAgIHRvb2x0aXA/OiBKU1guRWxlbWVudFxuICAgICBmb250RmFtaWx5Pzogc3RyaW5nLFxuICAgICBjYWxsYmFjaz8gIDogKCkgPT4gdm9pZCxcbiAgICAgaGFuZGxlT24/ICA6IFwidG9nZ2xlXCIgfCBcImRyYWdcIiB8IFwiKlwiXG59XG5cbmV4cG9ydCBjbGFzcyBCdXR0b24gZXh0ZW5kcyBDb21wb25lbnQgPCRCdXR0b24+XG57XG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSA8ZGl2IGNsYXNzPVwiYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgICAgICAgeyBkYXRhLnRleHQgPyA8c3BhbiBjbGFzcz1cInRleHRcIj57IGRhdGEudGV4dCB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lciAoIFwiY2xpY2tcIiwgdGhpcy5kYXRhLmNhbGxiYWNrIClcblxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBub2RlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFsgdGhpcy5jb250YWluZXIgXSBhcyBIVE1MRWxlbWVudCBbXVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG9uSG92ZXIgKClcbiAgICAge1xuXG4gICAgIH1cbn1cblxuIiwiaW1wb3J0IHsgJENvbXBvbmVudCwgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0NvcmUvQ29tcG9uZW50L2luZGV4XCJcbmltcG9ydCB7ICRDb250YWluZXIsIENvbnRhaW5lciB9IGZyb20gXCIuLi8uLi9Db3JlL0NvbnRhaW5lci9pbmRleFwiXG5pbXBvcnQgeyBzd2lwZWFibGUsIFN3aXBlYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vQ29yZS9zd2lwZWFibGVcIlxuaW1wb3J0IHsgeG5vZGUsIEpTWCB9IGZyb20gXCIuLi8uLi9Db3JlL3hub2RlXCJcblxuXG5leHBvcnQgaW50ZXJmYWNlICRTbGlkZXNob3cgZXh0ZW5kcyAkQ29udGFpbmVyXG57XG4gICAgIHR5cGUgICAgICAgIDogXCJzbGlkZXNob3dcIlxuICAgICBjaGlsZHJlbiAgICA6ICRTbGlkZSBbXVxuICAgICBpc1N3aXBlYWJsZT86IGJvb2xlYW5cbn1cblxuZXhwb3J0IGludGVyZmFjZSAkU2xpZGUgZXh0ZW5kcyAkQ29udGFpbmVyXG57XG4gICAgIHR5cGU6IFwic2xpZGVcIlxufVxuXG4vLyAgIGBgYFxuLy8gICAuc2xpZGVzaG93XG4vLyAgICAgICAgWy4uLl1cbi8vICAgYGBgXG5leHBvcnQgY2xhc3MgU2xpZGVzaG93IGV4dGVuZHMgQ29udGFpbmVyIDwkU2xpZGVzaG93Plxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb250YWluZXI+XG4gICAgIGN1cnJlbnQ6IENvbXBvbmVudFxuICAgICBwcml2YXRlIHN3aXBlYWJsZTogU3dpcGVhYmxlRWxlbWVudFxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBpZiAoIGRhdGEuaXNTd2lwZWFibGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gc3dpcGVhYmxlICggY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICAgICAgIG1pblZhbHVlICA6IC0wLFxuICAgICAgICAgICAgICAgICAgICBtYXhWYWx1ZSAgOiAwLFxuICAgICAgICAgICAgICAgICAgICBwb3JwZXJ0eSAgOiBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzICAgICA6IFwicHhcIixcbiAgICAgICAgICAgICAgICAgICAgbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG5cbiAgICAgc2hvdyAoIGlkOiBzdHJpbmcsIC4uLiBjb250ZW50OiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRDb21wb25lbnQgKSBbXSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IHRoaXMuY2hpbGRyZW4gW2lkXVxuXG4gICAgICAgICAgaWYgKCBjaGlsZCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHRoaXMuY3VycmVudCApXG4gICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBjaGlsZFxuXG4gICAgICAgICAgaWYgKCBjb250ZW50IClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjaGlsZC5jbGVhciAoKVxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBjb250ZW50IClcbiAgICAgICAgICAgICAgIGNoaWxkLmFwcGVuZCAoIC4uLiBjb250ZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjaGlsZC5jb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgICB9XG59XG5cbiIsIlxuaW1wb3J0IHsgJENvbXBvbmVudCwgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0NvcmUvQ29tcG9uZW50L2luZGV4XCJcbmltcG9ydCB7ICRDb250YWluZXIsIENvbnRhaW5lciB9IGZyb20gXCIuLi8uLi9Db3JlL0NvbnRhaW5lci9pbmRleFwiXG5pbXBvcnQgeyBTd2lwZWFibGVFbGVtZW50IH0gZnJvbSBcIi4uLy4uL0NvcmUvc3dpcGVhYmxlXCJcbmltcG9ydCB7ICRCdXR0b24gfSBmcm9tIFwiLi4vQnV0dG9uL2luZGV4XCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuLi8uLi9Db3JlL3N3aXBlYWJsZVwiXG5pbXBvcnQgeyB4bm9kZSwgSlNYIH0gZnJvbSBcIi4uLy4uL0NvcmUveG5vZGVcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG50eXBlIFVuaXRzID0gXCJweFwiIHwgXCIlXCJcblxuZXhwb3J0IGludGVyZmFjZSAkVG9vbGJhciBleHRlbmRzICRDb250YWluZXJcbntcbiAgICAgdHlwZSAgICAgOiBcInRvb2xiYXJcIlxuICAgICB0aXRsZSAgICA6IHN0cmluZ1xuICAgICBkaXJlY3Rpb246IERpcmVjdGlvblxuICAgICByZXZlcnNlPyA6IGJvb2xlYW5cbiAgICAgYnV0dG9ucyAgOiAkQnV0dG9uIFtdXG59XG5cbmNvbnN0IHRvRmxleERpcmVjdGlvbiA9IHtcbiAgICAgbHI6IFwicm93XCIgICAgICAgICAgICBhcyBcInJvd1wiLFxuICAgICBybDogXCJyb3ctcmV2ZXJzZVwiICAgIGFzIFwicm93LXJldmVyc2VcIixcbiAgICAgdGI6IFwiY29sdW1uXCIgICAgICAgICBhcyBcImNvbHVtblwiLFxuICAgICBidDogXCJjb2x1bW4tcmV2ZXJzZVwiIGFzIFwiY29sdW1uLXJldmVyc2VcIixcbn1cblxuY29uc3QgdG9SZXZlcnNlID0ge1xuICAgICBscjogXCJybFwiIGFzIFwicmxcIixcbiAgICAgcmw6IFwibHJcIiBhcyBcImxyXCIsXG4gICAgIHRiOiBcImJ0XCIgYXMgXCJidFwiLFxuICAgICBidDogXCJ0YlwiIGFzIFwidGJcIixcbn1cblxuLyoqXG4gKiAgIGBgYHB1Z1xuICogICAudG9vbGJhclxuICogICAgICAgIC50b29sYmFyLWJhY2tncm91bmdcbiAqICAgICAgICAudG9vbGJhci1zbGlkZVxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBUb29sYmFyIGV4dGVuZHMgQ29udGFpbmVyIDwkVG9vbGJhcj5cbntcbiAgICAgcGFyZW50ICAgICA6IEpTWC5FbGVtZW50XG4gICAgIHRhYnMgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGJhY2tncm91bmQ6IEpTWC5FbGVtZW50XG5cbiAgICAgcHJpdmF0ZSBzd2lwZWFibGU6IFN3aXBlYWJsZUVsZW1lbnRcblxuICAgICBwcml2YXRlIGlzX3ZlcnRpY2FsOiBib29sZWFuXG5cbiAgICAgZGVmYXVsdENvbmZpZyAoKTogJFRvb2xiYXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAuLi4gc3VwZXIuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uLlwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICByZXZlcnNlICA6IGZhbHNlLFxuICAgICAgICAgICAgICAgYnV0dG9uczogW11cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMucGFyZW50ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gPGRpdiBjbGFzcz1cInRvb2xiYXItc2xpZGVcIj48L2Rpdj5cblxuICAgICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IDxkaXYgY2xhc3M9XCJ0b29sYmFyLWJhY2tncm91bmRcIj5cbiAgICAgICAgICAgICAgICAgICAgeyB0aGlzLmRhdGEudGl0bGUgfVxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IDxkaXYgY2xhc3M9XCJ0b29sYmFyXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgYmFja2dyb3VuZCB9XG4gICAgICAgICAgICAgICAgICAgIHsgY29udGFpbmVyIH1cbiAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lclxuICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgID0gcGFyZW50XG4gICAgICAgICAgICAgICB0aGlzLmJhY2tncm91bmQgPSBiYWNrZ3JvdW5kXG4gICAgICAgICAgICAgICB0aGlzLnRhYnMgICAgICAgPSBbXVxuXG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZSA9IFVpLnN3aXBlYWJsZSAoIGNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVzICAgOiBbIHBhcmVudCBdLFxuICAgICAgICAgICAgICAgICAgICBtaW5WYWx1ZSAgOiAtMCxcbiAgICAgICAgICAgICAgICAgICAgbWF4VmFsdWUgIDogMCxcbiAgICAgICAgICAgICAgICAgICAgcG9ycGVydHkgIDogdGhpcy5pc192ZXJ0aWNhbCA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgICAgICAgICB1bml0cyAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VPcmllbnRhdGlvbiAoIHRoaXMuZGF0YS5kaXJlY3Rpb24gKVxuXG4gICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXG4gICAgICAgICAgICAgICAgICAgIFwiRE9NQ29udGVudExvYWRlZFwiLFxuICAgICAgICAgICAgICAgICAgICAoKSA9PiB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBtaW5WYWx1ZTogLXRoaXMuc2xpZGVTaXplICgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZCAoIC4uLiB0aGlzLmRhdGEuYnV0dG9ucyApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBbIHRoaXMucGFyZW50IF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIHByaXZhdGUgc2xpZGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHBhcmVudDogbm9kZSwgaXNfdmVydGljYWwgfSA9IHRoaXNcbiAgICAgICAgICByZXR1cm4gbm9kZS5jc3NGbG9hdCAoIGlzX3ZlcnRpY2FsID8gXCJoZWlnaHRcIiA6IFwid2lkdGhcIiApXG4gICAgIH1cblxuICAgICBhcHBlbmQgKCAuLi4gZWxlbWVudHM6IChKU1guRWxlbWVudCB8IENvbXBvbmVudCB8ICRDb21wb25lbnQgKSBbXSApXG4gICAgIHtcbiAgICAgICAgICBzdXBlci5hcHBlbmQgKCAuLi4gZWxlbWVudHMgKVxuXG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUudXBkYXRlQ29uZmlnICh7IG1pblZhbHVlOiAtdGhpcy5zbGlkZVNpemUgKCkgfSlcbiAgICAgfVxuXG4gICAgIHJldmVyc2UgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpc1xuXG4gICAgICAgICAgZGF0YS5yZXZlcnNlID0gISBkYXRhLnJldmVyc2VcblxuICAgICAgICAgIGNvbnN0IGRpciA9IGRhdGEucmV2ZXJzZVxuICAgICAgICAgICAgICAgICAgICA/IHRvUmV2ZXJzZSBbZGF0YS5kaXJlY3Rpb25dXG4gICAgICAgICAgICAgICAgICAgIDogZGF0YS5kaXJlY3Rpb25cblxuICAgICAgICAgIHRoaXMucGFyZW50LmNzcyAoeyBmbGV4RGlyZWN0aW9uOiB0b0ZsZXhEaXJlY3Rpb24gW2Rpcl0gfSlcbiAgICAgfVxuXG4gICAgIGNoYW5nZU9yaWVudGF0aW9uICggZGlyZWN0aW9uOiBEaXJlY3Rpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBkYXRhLmRpcmVjdGlvbiA9IGRpcmVjdGlvblxuICAgICAgICAgIHRoaXMuaXNfdmVydGljYWwgPSBkaXJlY3Rpb24gPT0gXCJidFwiIHx8IGRpcmVjdGlvbiA9PSBcInRiXCJcblxuICAgICAgICAgIHRoaXMucGFyZW50LmNzcyAoe1xuICAgICAgICAgICAgICAgZmxleERpcmVjdGlvbjogdG9GbGV4RGlyZWN0aW9uIFtkaXJlY3Rpb25dLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHsgbWluVmFsdWU6IC10aGlzLnNsaWRlU2l6ZSAoKSB9KVxuICAgICB9XG5cbiAgICAgc3dpcGUgKCBvZmZzZXQ6IHN0cmluZyApOiB2b2lkXG4gICAgIHN3aXBlICggb2Zmc2V0OiBudW1iZXIsIHVuaXRzOiBVbml0cyApOiB2b2lkXG4gICAgIHN3aXBlICggb2Zmc2V0OiBzdHJpbmd8bnVtYmVyLCB1PzogVW5pdHMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUuc3dpcGUgKCBvZmZzZXQgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0LCB1IClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyB4bm9kZSwgSlNYIH0gZnJvbSBcIi4uLy4uL0NvcmUveG5vZGVcIlxuaW1wb3J0IHsgJENvbXBvbmVudCwgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0NvcmUvQ29tcG9uZW50L2luZGV4XCJcbmltcG9ydCB7ICRDb250YWluZXIsIENvbnRhaW5lciB9IGZyb20gXCIuLi8uLi9Db3JlL0NvbnRhaW5lci9pbmRleFwiXG5pbXBvcnQgeyBleHBhbmRhYmxlLCBFeHBlbmRhYmxlRWxlbWVudCwgRXhwZW5kYWJsZVByb3BlcnR5IH0gZnJvbSBcIi4uLy4uL0NvcmUvZXhwZW5kYWJsZVwiXG5cbmltcG9ydCB7ICRBbnkgfSBmcm9tIFwiLi4vdHlwZXNcIlxuaW1wb3J0IHsgZ2V0IH0gZnJvbSBcIi4uLy4uL2RiXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuZXhwb3J0IGludGVyZmFjZSAkUGFuZWwgZXh0ZW5kcyAkQ29udGFpbmVyXG57XG4gICAgIHR5cGUgICAgICAgICA6IFwicGFuZWxcIixcbiAgICAgaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgaGVhZGVyPyAgICAgIDogJEFueSxcbiAgICAgY2hpbGRyZW4/ICAgIDogKCRBbnkgfCAkQ29tcG9uZW50KSBbXSxcbiAgICAgZm9vdGVyPyAgICAgIDogJEFueSxcbn1cblxuY29uc3QgdG9Qb3NpdGlvbiA9IHtcbiAgICAgbHIgOiBcImxlZnRcIixcbiAgICAgcmwgOiBcInJpZ2h0XCIsXG4gICAgIHRiIDogXCJ0b3BcIixcbiAgICAgYnQgOiBcImJvdHRvbVwiLFxufVxuXG5jb25zdCB0b1Byb3BlcnR5IDogUmVjb3JkIDxEaXJlY3Rpb24sIEV4cGVuZGFibGVQcm9wZXJ0eT4gPSB7XG4gICAgIGxyIDogXCJ3aWR0aFwiLFxuICAgICBybCA6IFwid2lkdGhcIixcbiAgICAgdGIgOiBcImhlaWdodFwiLFxuICAgICBidCA6IFwiaGVpZ2h0XCIsXG59XG5cbi8qKlxuICogICBgYGBcbiAqICAgLnBhbmVsXG4gKiAgICAgICAgLnBhbmVsLWhlYWRlclxuICogICAgICAgICAgICAgLnBhbmVsLW1haW4tYnV0dHRvblxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgICAgICAucGFuZWwtY29udGVudFxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgICAgICAucGFuZWwtZm9vdGVyXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFBhbmVsIGV4dGVuZHMgQ29udGFpbmVyIDwkUGFuZWw+XG57XG4gICAgIG1haW5fYnV0dG9uOiBKU1guRWxlbWVudFxuICAgICBjb250ZW50ICAgIDogQ29tcG9uZW50XG4gICAgIGhlYWRlciAgICAgOiBDb21wb25lbnRcblxuICAgICBwcm90ZWN0ZWQgZXhwYW5kYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICBkZWZhdWx0RGF0YSAoKTogJFBhbmVsXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgLi4uIHN1cGVyLmRlZmF1bHREYXRhICgpLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogXCJwYW5lbFwiLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gICAgIDogW10sXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcInJsXCIsXG4gICAgICAgICAgICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBoZWFkZXIgICAgPSA8ZGl2IGNsYXNzPVwicGFuZWwtaGVhZGVyXCIgLz5cbiAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgICA9IDxkaXYgY2xhc3M9XCJwYW5lbC1jb250ZW50XCIgLz5cbiAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJwYW5lbCBwYW5lbC1pbmZvcyBjbG9zZVwiPlxuICAgICAgICAgICAgICAgICAgICB7IGhlYWRlciB9XG4gICAgICAgICAgICAgICAgICAgIHsgY29udGVudCB9XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuXG4gICAgICAgICAgICAgICBpZiAoIGRhdGEuaGFzTWFpbkJ1dHRvbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IDxzcGFuIGNsYXNzPVwicGFuZWwtbWFpbi1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cImljb25cIj7ih5U8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1haW5fYnV0dG9uID0gYnRuXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5hcHBlbmQgKCBidG4gKVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBpZiAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFkZXIgPSBnZXQgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5hcHBlbmQgKCAuLi4gdGhpcy5oZWFkZXIuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vc3VwZXIuYXBwZW5kICggLi4uIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGdldCAoIGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmFwcGVuZCAoIC4uLiB0aGlzLmNvbnRlbnQuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIgID0gY29udGFpbmVyXG5cbiAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZSA9IGV4cGFuZGFibGUgKCBjb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgLy9kaXJlY3Rpb24gIDogb3B0aW9ucy5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnR5OiB0b1Byb3BlcnR5IFtkYXRhLmRpcmVjdGlvbl0sXG4gICAgICAgICAgICAgICAgICAgIG5lYXIgICAgOiA2MCxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcyA6IEFycmF5Lm9mICggdGhpcy5tYWluX2J1dHRvbiApLFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlIDogdGhpcy5vbkNsb3NlLmJpbmQgKHRoaXMpXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgICAgICAgdGhpcy5zZXRPcmllbnRhdGlvbiAoIGRhdGEuZGlyZWN0aW9uIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gWyB0aGlzLmNvbnRhaW5lciBdIGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cblxuICAgICBwcml2YXRlIG9uQ2xpY2tUYWIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMub3BlbiAoKVxuICAgICB9XG5cbiAgICAgaXNPcGVuICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5leHBhbmRhYmxlLmlzT3BlbiAoKVxuICAgICB9XG5cbiAgICAgaXNDbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kYWJsZS5pc0Nsb3NlICgpXG4gICAgIH1cblxuICAgICBzZXRPcmllbnRhdGlvbiAoIHZhbHVlOiBEaXJlY3Rpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhLCBleHBhbmRhYmxlIH0gPSB0aGlzXG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggdG9Qb3NpdGlvbiBbZGF0YS5kaXJlY3Rpb25dIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggdG9Qb3NpdGlvbiBbdmFsdWVdIClcblxuICAgICAgICAgIC8vY29uc3Qgb2xkX3ZlcnRpY2FsID0gZXhwYW5kYWJsZS5pc1ZlcnRpY2FsICgpXG5cbiAgICAgICAgICBzdXBlci5zZXRPcmllbnRhdGlvbiAoIHZhbHVlIClcblxuICAgICAgICAgIGV4cGFuZGFibGUudXBkYXRlQ29uZmlnICh7IHByb3BlcnR5OiB0b1Byb3BlcnR5IFt2YWx1ZV0gfSlcblxuICAgICAgICAgIC8vdGhpcy5oZWFkZXIuc2V0T3JpZW50YXRpb24gKFxuICAgICAgICAgIC8vICAgICB2YWx1ZSA9PSBcImxyXCIgfHwgdmFsdWUgPT0gXCJybFwiID8gXCJ0YlwiIDogXCJsclwiXG4gICAgICAgICAgLy8pXG5cbiAgICAgICAgICAvL2lmICggb2xkX3ZlcnRpY2FsICE9IGV4cGFuZGFibGUuaXNWZXJ0aWNhbCAoKSApXG4gICAgICAgICAgLy8gICAgIGhlYWRiYXIucmV2ZXJzZSAoKVxuXG4gICAgICAgICAgZGF0YS5kaXJlY3Rpb24gPSB2YWx1ZVxuICAgICB9XG5cbiAgICAgb3BlbiAoIGlkPzogc3RyaW5nLCAuLi4gY29udGVudDogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQ29tcG9uZW50KSBbXSApXG4gICAgIHtcbiAgICAgICAgICAvL2lmICggYXJndW1lbnRzLmxlbmd0aCA+IDEgKVxuICAgICAgICAgIC8vICAgICB0aGlzLnNsaWRlc2hvdy5zaG93ICggaWQsIC4uLiBjb250ZW50IClcblxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZS5vcGVuICgpXG5cbiAgICAgICAgICAvL3RoaXMuY29udGVudCAoIC4uLiBhcmdzIClcblxuICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgIH1cblxuICAgICBjbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5leHBhbmRhYmxlLmNsb3NlICgpXG5cbiAgICAgICAgICByZXR1cm4gdGhpc1xuICAgICB9XG5cbiAgICAgc2l6ZSA9IDBcblxuICAgICByZXNpemUgKCBzaXplOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBleHBhbmRhYmxlLCBjb250YWluZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggZXhwYW5kYWJsZS5pc1ZlcnRpY2FsICgpIClcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBzaXplICsgXCJweFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gc2l6ZSArIFwicHhcIlxuXG4gICAgICAgICAgdGhpcy5zaXplID0gc2l6ZVxuICAgICB9XG5cbiAgICAgZXhwYW5kICggb2Zmc2V0OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBleHBhbmRhYmxlLCBjb250YWluZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLnNpemUgKyBvZmZzZXRcblxuICAgICAgICAgIGlmICggZXhwYW5kYWJsZS5pc1ZlcnRpY2FsICgpIClcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBzaXplICsgXCJweFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gc2l6ZSArIFwicHhcIlxuXG4gICAgICAgICAgdGhpcy5zaXplID0gc2l6ZVxuICAgICB9XG5cbiAgICAgb25DbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgLy90aGlzLnRvb2xiYXIuc3dpcGUgKCBcIi0xMDAlXCIgKVxuICAgICB9XG59XG5cbiIsIlxuaW1wb3J0IHsgeG5vZGUsIEpTWCB9IGZyb20gXCIuLi94bm9kZVwiXG5cbmV4cG9ydCB0eXBlIFNoYXBlTmFtZXMgPSBrZXlvZiBTaGFwZURlZmluaXRpb25zXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcGVEZWZpbml0aW9uc1xue1xuICAgICBjaXJjbGUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHRyaWFuZ2xlIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgc3F1YXJlICAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBwYW50YWdvbiA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIGhleGFnb24gIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdGV4dCAgICAgOiBUZXh0RGVmaW5pdGlvbixcbiAgICAgdGV4dGJveCAgOiBUZXh0RGVmaW5pdGlvbixcbiAgICAgcGF0aCAgICAgOiBQYXRoRGVmaW5pdGlvbixcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHNpemU6IG51bWJlcixcbiAgICAgeD8gIDogbnVtYmVyLFxuICAgICB5PyAgOiBudW1iZXJcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0RGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgdGV4dDogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGF0aERlZmluaXRpb24gZXh0ZW5kcyBPYmplY3REZWZpbml0aW9uXG57XG4gICAgIHBhdGg6IHN0cmluZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ZnU2hhcGUgPFQgZXh0ZW5kcyBTaGFwZU5hbWVzPiAoXG4gICAgIHR5cGU6IFQsXG4gICAgIGRlZiA6IFNoYXBlRGVmaW5pdGlvbnMgW1RdLFxuKTogUmV0dXJuVHlwZSA8dHlwZW9mIFN2Z0ZhY3RvcnkgW1RdPlxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ZnU2hhcGUgKCB0eXBlOiBTaGFwZU5hbWVzLCBkZWY6IGFueSApXG57XG4gICAgIHN3aXRjaCAoIHR5cGUgKVxuICAgICB7XG4gICAgIGNhc2UgXCJjaXJjbGVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5jaXJjbGUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0cmlhbmdsZVwiOiByZXR1cm4gU3ZnRmFjdG9yeS50cmlhbmdsZSAoIGRlZiApXG4gICAgIGNhc2UgXCJzcXVhcmVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5zcXVhcmUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJwYW50YWdvblwiOiByZXR1cm4gU3ZnRmFjdG9yeS5wYW50YWdvbiAoIGRlZiApXG4gICAgIGNhc2UgXCJoZXhhZ29uXCIgOiByZXR1cm4gU3ZnRmFjdG9yeS5oZXhhZ29uICAoIGRlZiApXG4gICAgIGNhc2UgXCJzcXVhcmVcIiAgOiByZXR1cm4gU3ZnRmFjdG9yeS5zcXVhcmUgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0ZXh0XCIgICAgOiByZXR1cm4gU3ZnRmFjdG9yeS50ZXh0ICAgICAoIGRlZiApXG4gICAgIGNhc2UgXCJ0ZXh0Ym94XCIgOiByZXR1cm4gU3ZnRmFjdG9yeS50ZXh0Ym94ICAoIGRlZiApXG4gICAgIGNhc2UgXCJwYXRoXCIgICAgOiByZXR1cm4gU3ZnRmFjdG9yeS5wYXRoICAgICAoIGRlZiApXG4gICAgIH1cbn1cblxuY2xhc3MgU3ZnRmFjdG9yeVxue1xuICAgICAvLyBUbyBnZXQgdHJpYW5nbGUsIHNxdWFyZSwgW3BhbnRhfGhleGFdZ29uIHBvaW50c1xuICAgICAvL1xuICAgICAvLyB2YXIgYSA9IE1hdGguUEkqMi80XG4gICAgIC8vIGZvciAoIHZhciBpID0gMCA7IGkgIT0gNCA7IGkrKyApXG4gICAgIC8vICAgICBjb25zb2xlLmxvZyAoIGBbICR7IE1hdGguc2luKGEqaSkgfSwgJHsgTWF0aC5jb3MoYSppKSB9IF1gIClcblxuICAgICBzdGF0aWMgY2lyY2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5vZGUgPSA8Y2lyY2xlXG4gICAgICAgICAgICAgICBjeCA9IHsgZGVmLnggfHwgMCB9XG4gICAgICAgICAgICAgICBjeSA9IHsgZGVmLnkgfHwgMCB9XG4gICAgICAgICAgICAgICByICA9IHsgZGVmLnNpemUgLyAyIH1cbiAgICAgICAgICAvPlxuXG4gICAgICAgICAgcmV0dXJuIG5vZGVcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0cmlhbmdsZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHNxdWFyZSAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyBwYW50YWdvbiAoIGRlZjogT2JqZWN0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyBoZXhhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgdGV4dCAoIGRlZjogVGV4dERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuICAgICBzdGF0aWMgdGV4dGJveCAoIGRlZjogVGV4dERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyBwYXRoICggZGVmOiBQYXRoRGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxufSIsIlxyXG5pbXBvcnQgeyB4bm9kZSwgSlNYIH0gZnJvbSBcIi4uLy4uL0NvcmUveG5vZGVcIlxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTaWRlTWVudVxyXG57XHJcbiAgICBlbGVtZW50cyAoKTogKEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCkgW11cclxuICAgIG9wZW4gKCk6IHZvaWRcclxuICAgIGNsb3NlICgpOiB2b2lkXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNZW51ICgpXHJcbntcclxuICAgIGNvbnN0IHNlbGYgPSB7fSBhcyBTaWRlTWVudVxyXG5cclxuICAgIGNvbnN0IGJ1dHRvbiA9XHJcbiAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My14eGxhcmdlXCIgY2xpY2s9eyBvcGVuIH0+XHJcbiAgICAgICAgICAgICYjOTc3NjtcclxuICAgICAgICA8L2J1dHRvbj5cclxuXHJcbiAgICBjb25zdCBvdmVybGF5ID1cclxuICAgICAgICA8ZGl2IGNsYXNzPVwidzMtb3ZlcmxheSB3My1hbmltYXRlLW9wYWNpdHlcIiBzdHlsZT1cImN1cnNvcjpwb2ludGVyXCJcclxuICAgICAgICAgICAgY2xpY2s9eyBjbG9zZSB9PjwvZGl2PlxyXG5cclxuICAgIGNvbnN0IHNpZGViYXIgPVxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJ3My1zaWRlYmFyIHczLWJhci1ibG9ja1wiPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgY2xpY2s9eyBjbG9zZSB9PlxyXG4gICAgICAgICAgICAgICAgQ2xvc2VcclxuICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBjbGljaz17IHJvdGF0ZUxheW91dCB9PlxyXG4gICAgICAgICAgICAgICAg4qS0IFJvdGF0ZSBsYXlvdXRcclxuICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBjbGljaz17IHJldmVyc2VMYXlvdXQgfT5cclxuICAgICAgICAgICAgICAgIOKHhSBTd2l0Y2ggbGF5b3V0XHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgIHNpZGViYXIuY3NzICh7XHJcbiAgICAgICAgekluZGV4ICAgIDogXCI0XCIsXHJcbiAgICAgICAgdHJhbnNpdGlvbjogXCJhbGwgMC40c1wiLFxyXG4gICAgICAgIGxlZnQgICAgICA6IFwiLTMwMHB4XCJcclxuICAgIH0pXHJcblxyXG4gICAgYnV0dG9uLnN0eWxlLnBvc2l0aW9uID0gXCJmaXhlZFwiXHJcbiAgICBidXR0b24uc3R5bGUuekluZGV4ICAgPSBcIjJcIlxyXG5cclxuICAgIHNlbGYuZWxlbWVudHMgPSAoKSA9PiAgWyBidXR0b24sIG92ZXJsYXksIHNpZGViYXIgXVxyXG4gICAgc2VsZi5vcGVuID0gb3BlblxyXG4gICAgc2VsZi5jbG9zZSA9IGNsb3NlXHJcblxyXG4gICAgcmV0dXJuIHNlbGZcclxuXHJcbiAgICBmdW5jdGlvbiBvcGVuICgpXHJcbiAgICB7XHJcbiAgICAgICAgc2lkZWJhci5zdHlsZS5sZWZ0ICAgID0gXCIwcHhcIlxyXG4gICAgICAgIG92ZXJsYXkuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gY2xvc2UgKClcclxuICAgIHtcclxuICAgICAgICBzaWRlYmFyLnN0eWxlLmxlZnQgICAgPSBcIi0zMDBweFwiXHJcbiAgICAgICAgb3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcm90YXRlTGF5b3V0ICgpXHJcbiAgICB7XHJcbiAgICAgICAgLy8gY29uc3QgcGFuZWwgPSBBcHBsaWNhdGlvbi5wYW5lbFxyXG4gICAgICAgIC8vIHN3aXRjaCAoIHBhbmVsLmdldE9yaWVudGF0aW9uICgpIClcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gY2FzZSBcImJ0XCI6IHBhbmVsLnNldE9yaWVudGF0aW9uICggXCJybFwiICApIDsgYnJlYWtcclxuICAgICAgICAvLyBjYXNlIFwicmxcIjogcGFuZWwuc2V0T3JpZW50YXRpb24gKCBcImJ0XCIgKSA7IGJyZWFrXHJcbiAgICAgICAgLy8gY2FzZSBcImxyXCI6IHBhbmVsLnNldE9yaWVudGF0aW9uICggXCJ0YlwiICAgICkgOyBicmVha1xyXG4gICAgICAgIC8vIGRlZmF1bHQgIDogcGFuZWwuc2V0T3JpZW50YXRpb24gKCBcImxyXCIgICApIDsgYnJlYWtcclxuICAgICAgICAvLyB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiByZXZlcnNlTGF5b3V0ICgpXHJcbiAgICB7XHJcbiAgICAgICAgLy8gY29uc3QgcGFuZWwgPSBBcHBsaWNhdGlvbi5wYW5lbFxyXG4gICAgICAgIC8vIHN3aXRjaCAoIHBhbmVsLmdldE9yaWVudGF0aW9uICgpIClcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gY2FzZSBcImJ0XCI6IHBhbmVsLnNldE9yaWVudGF0aW9uICggXCJ0YlwiICAgICkgOyBicmVha1xyXG4gICAgICAgIC8vIGNhc2UgXCJ0YlwiOiBwYW5lbC5zZXRPcmllbnRhdGlvbiAoIFwiYnRcIiApIDsgYnJlYWtcclxuICAgICAgICAvLyBjYXNlIFwibHJcIjogcGFuZWwuc2V0T3JpZW50YXRpb24gKCBcInJsXCIgICkgOyBicmVha1xyXG4gICAgICAgIC8vIGRlZmF1bHQgIDogcGFuZWwuc2V0T3JpZW50YXRpb24gKCBcImxyXCIgICApIDsgYnJlYWtcclxuICAgICAgICAvLyB9XHJcbiAgICB9XHJcbn1cclxuIiwiXG5pbXBvcnQgXCIuL0NvcmUvZG9tXCJcbmltcG9ydCBcIi4vQ29yZS9Db21wb25lbnQvaW5kZXhcIlxuaW1wb3J0IFwiLi9Db3JlL0NvbnRhaW5lci9pbmRleFwiXG5cbmV4cG9ydCAqIGZyb20gXCIuL0NvcmUveG5vZGVcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29yZS9kcmFnZ2FibGVcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29yZS9leHBlbmRhYmxlXCJcbmV4cG9ydCAqIGZyb20gXCIuL0NvcmUvc3dpcGVhYmxlXCJcbmV4cG9ydCAqIGZyb20gXCIuL0NvcmUvQ29tcG9uZW50L2luZGV4XCJcbmV4cG9ydCAqIGZyb20gXCIuL0NvcmUvQ29udGFpbmVyL2luZGV4XCJcblxuZXhwb3J0ICogZnJvbSBcIi4vQ29tcG9uZW50L3R5cGVzXCJcbmV4cG9ydCAqIGZyb20gXCIuL0NvbXBvbmVudC9QaGFudG9tL2luZGV4XCJcbmV4cG9ydCAqIGZyb20gXCIuL0NvbXBvbmVudC9CYXIvaW5kZXhcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29tcG9uZW50L0J1dHRvbi9pbmRleFwiXG5leHBvcnQgKiBmcm9tIFwiLi9Db21wb25lbnQvQ29tbWFuZC9pbmRleFwiXG5leHBvcnQgKiBmcm9tIFwiLi9Db21wb25lbnQvQnV0dG9uR3JvdXAvaW5kZXhcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29tcG9uZW50L1NsaWRlc2hvdy9pbmRleFwiXG5leHBvcnQgKiBmcm9tIFwiLi9Db21wb25lbnQvVG9vbGJhci9pbmRleFwiXG5leHBvcnQgKiBmcm9tIFwiLi9Db21wb25lbnQvUGFuZWwvaW5kZXhcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29tcG9uZW50L0NpcmN1bGFyLW1lbnUvaW5kZXhcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29tcG9uZW50L092ZXJsYXkvaW5kZXhcIlxuXG5leHBvcnQgKiBmcm9tIFwiLi9Db21wb25lbnQvTWVudS9pbmRleFwiXG5cbmV4cG9ydCAqIGZyb20gXCIuL2RiXCJcblxuaW1wb3J0IHsgZGVmaW5lIH0gICBmcm9tIFwiLi9kYlwiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi9Db3JlL0NvbnRhaW5lci9pbmRleFwiXG5pbXBvcnQgeyBCbG9jayB9ICAgICBmcm9tIFwiLi9Db21wb25lbnQvQmFyL2luZGV4XCJcbmltcG9ydCB7IEJ1dHRvbiB9ICAgIGZyb20gXCIuL0NvbXBvbmVudC9CdXR0b24vaW5kZXhcIlxuaW1wb3J0IHsgU2xpZGVzaG93IH0gZnJvbSBcIi4vQ29tcG9uZW50L1NsaWRlc2hvdy9pbmRleFwiXG5pbXBvcnQgeyBUb29sYmFyIH0gICBmcm9tIFwiLi9Db21wb25lbnQvVG9vbGJhci9pbmRleFwiXG5cbmRlZmluZSAoIEJ1dHRvbiAgICwgXCJidXR0b25cIiwgdW5kZWZpbmVkIClcbmRlZmluZSAoIEJsb2NrICAgICwgXCJibG9ja1wiLCB1bmRlZmluZWQgKVxuZGVmaW5lICggU2xpZGVzaG93LCBcInNsaWRlc2hvd1wiLCB1bmRlZmluZWQgKVxuZGVmaW5lICggQ29udGFpbmVyLCBcInNsaWRlXCIsIHVuZGVmaW5lZCApXG5kZWZpbmUgKCBUb29sYmFyICAsIFwidG9vbGJhclwiLCB1bmRlZmluZWQgKVxuIiwiXG5pbXBvcnQgeyB1RXZlbnQgfSBmcm9tIFwiLi4vTGliL2luZGV4XCJcbmltcG9ydCB7ICROb2RlIH0gZnJvbSBcIi4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0IHsgUGFuZWxDb21tYW5kcyB9IGZyb20gXCIuL3BhbmVsXCJcbmltcG9ydCB7IE1lbnVDb21tYW5kcyB9IGZyb20gXCIuL21lbnVcIlxuaW1wb3J0IHsgQXJlYUNvbW1hbmRzIH0gZnJvbSBcIi4vYXJlYVwiXG5cbmNvbnN0IGRiICAgICA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCAoIC4uLiBhcmdzOiBhbnkgW10gKSA9PiB2b2lkPlxuY29uc3QgZXZlbnRzID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIHVFdmVudC5JRXZlbnQ+XG5cbmludGVyZmFjZSAkQ29tbWFuZCBleHRlbmRzICROb2RlXG57XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hcHBsaWNhdGlvblwiXG4gICAgIG5hbWU6IHN0cmluZ1xuICAgICBzaG9ydGN1dDogc3RyaW5nXG59XG5cbmV4cG9ydCB0eXBlIENvbW1hbmROYW1lcyA9IGtleW9mIENvbW1hbmRzXG5cbnR5cGUgQ29tbWFuZHMgPSBQYW5lbENvbW1hbmRzXG4gICAgICAgICAgICAgICAmIE1lbnVDb21tYW5kc1xuICAgICAgICAgICAgICAgJiBBcmVhQ29tbWFuZHNcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZENvbW1hbmQgPEsgZXh0ZW5kcyBDb21tYW5kTmFtZXM+ICggbmFtZTogSywgY2FsbGJhY2s6IENvbW1hbmRzIFtLXSApXG57XG4gICAgIGlmICggbmFtZSBpbiBkYiApXG4gICAgICAgICAgcmV0dXJuXG5cbiAgICAgZGIgW25hbWVdID0gY2FsbGJhY2tcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NvbW1hbmQgKCBrZXk6IHN0cmluZyApXG57XG4gICAgIHJldHVybiBrZXkgaW4gZGJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJ1bkNvbW1hbmQgPEsgZXh0ZW5kcyBDb21tYW5kTmFtZXM+ICggbmFtZTogSywgLi4uIGFyZ3M6IFBhcmFtZXRlcnMgPENvbW1hbmRzIFtLXT4gKVxue1xuICAgICBpZiAoIG5hbWUgaW4gZGIgKVxuICAgICB7XG4gICAgICAgICAgZGIgW25hbWVdICggLi4uIGFyZ3MgKVxuXG4gICAgICAgICAgaWYgKCBuYW1lIGluIGV2ZW50cyApXG4gICAgICAgICAgICAgICBldmVudHMgW25hbWVdLmRpc3BhdGNoICgpXG4gICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uQ29tbWFuZCAoIG5hbWU6IENvbW1hbmROYW1lcywgY2FsbGJhY2s6ICgpID0+IHZvaWQgKVxue1xuICAgICBjb25zdCBjYWxsYmFja3MgPSBuYW1lIGluIGV2ZW50c1xuICAgICAgICAgICAgICAgICAgICAgICAgID8gZXZlbnRzIFtuYW1lXVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogZXZlbnRzIFtuYW1lXSA9IHVFdmVudC5jcmVhdGUgKClcblxuICAgICBjYWxsYmFja3MgKCBjYWxsYmFjayApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDb21tYW5kICgga2V5OiBzdHJpbmcgKVxue1xuICAgICBkZWxldGUgZGIgW2tleV1cbn1cbiIsIlxuaW1wb3J0IHsgJE5vZGUsIERhdGFiYXNlIH0gZnJvbSBcIi4uLy4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0IHsgJFRoaW5nIH0gZnJvbSBcIi4vdGhpbmdcIlxuaW1wb3J0IHsgV3JpdGFibGUsIE9wdGlvbmFsIH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleFwiXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtZGF0YVwiXG5jb25zdCBEYXRhID0gbmV3IERhdGFiYXNlICgpXG5cbnR5cGUgJEluIDwkIGV4dGVuZHMgJFRoaW5nID0gJFRoaW5nPiA9IE9wdGlvbmFsIDwkLCBcImNvbnRleHRcIj5cblxuZnVuY3Rpb24gbm9ybWFsaXplICggbm9kZTogJEluIClcbntcbiAgICAgaWYgKCBcImNvbnRleHRcIiBpbiBub2RlIClcbiAgICAge1xuICAgICAgICAgIGlmICggbm9kZS5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGNvbnRleHQgdmFsdWVcIlxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIChub2RlIGFzIFdyaXRhYmxlIDwkTm9kZT4pLmNvbnRleHQgPSBDT05URVhUXG4gICAgIH1cblxuICAgICByZXR1cm4gbm9kZSBhcyAkTm9kZVxufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldCA8JCBleHRlbmRzICRUaGluZz4gKCBub2RlOiAkSW4gKTogJFxuZXhwb3J0IGZ1bmN0aW9uIGdldCA8JCBleHRlbmRzICRUaGluZz4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6ICRcbmV4cG9ydCBmdW5jdGlvbiBnZXQgKClcbntcbiAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgIHJldHVyblxuXG4gICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICByZXR1cm4gRGF0YS5nZXQgKCBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdICkgKVxuICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIERhdGEuZ2V0ICggQ09OVEVYVCwgLi4uIGFyZ3VtZW50cyApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXQgPCQgZXh0ZW5kcyAkVGhpbmc+ICggbm9kZTogJEluIDwkPiApXG57XG4gICAgIERhdGEuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY291bnQgKCB0eXBlOiBzdHJpbmcgKVxue1xuICAgICByZXR1cm4gRGF0YS5jb3VudCAoIFwiY29uY2VwdC1kYXRhXCIsIHR5cGUgKVxufVxuIiwiXG5pbXBvcnQgeyB4bm9kZSwgJENvbXBvbmVudCwgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL1VpL2luZGV4XCJcblxuaW1wb3J0IHsgJFNraWxsLCAkUGVyc29uIH0gZnJvbSBcIi4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uL0RhdGEvZGJcIlxuXG5leHBvcnQgaW50ZXJmYWNlICRJbmZvcyBleHRlbmRzICRDb21wb25lbnRcbntcbiAgICAgdHlwZTogXCJjb25jZXB0LWluZm9zXCJcbn1cblxuZXhwb3J0IGNsYXNzIFNraWxsSW5mb3MgZXh0ZW5kcyBDb21wb25lbnQgPCRJbmZvcz5cbntcbiAgICAgZGlzcGxheSAoIHNraWxsOiAkU2tpbGwgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gPGRpdiBjbGFzcz1cInBlb3BsZVwiPjwvZGl2PlxuXG4gICAgICAgICAgZm9yICggY29uc3QgbmFtZSBvZiBza2lsbC5pdGVtcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgcGVyc29uID0gZGIuZ2V0IDwkUGVyc29uPiAoIG5hbWUgKVxuXG4gICAgICAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZCAoIGNhcmQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8aDE+eyBza2lsbC5pZCB9PC9oMT4gKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxwPnsgc2tpbGwuZGVzY3JpcHRpb24gfTwvcD4gKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIHRhcmdldCApXG5cbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vTG9yRE9uaVgvanNvbi12aWV3ZXIvYmxvYi9tYXN0ZXIvc3JjL2pzb24tdmlld2VyLmpzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPHByZT57IEpTT04uc3RyaW5naWZ5ICggc2tpbGwsIG51bGwsIDMgKSB9PC9wcmU+IClcbiAgICAgfVxufVxuXG4vL2ZhY3RvcnkuZGVmaW5lICggU2tpbGxJbmZvcywge1xuLy8gICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbi8vICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4vLyAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuLy99KVxuIiwiXG5pbXBvcnQgKiBhcyB1aSBmcm9tIFwiLi4vVWkvaW5kZXhcIlxuaW1wb3J0IHsgUGFuZWwsIFNsaWRlc2hvdyB9IGZyb20gXCIuLi9VaS9pbmRleFwiXG5pbXBvcnQgeyBTa2lsbEluZm9zIH0gZnJvbSBcIi4vQ29tcG9uZW50L2luZm9zXCJcbmltcG9ydCAqIGFzIEFzcGVjdCBmcm9tIFwiLi9Bc3BlY3QvaW5kZXhcIlxuaW1wb3J0IHsgYWRkQ29tbWFuZCB9IGZyb20gXCIuL2NvbW1hbmRcIlxuXG5pbXBvcnQgeyAkTm9kZSB9IGZyb20gXCIuLi9EYXRhL2luZGV4XCJcblxuZXhwb3J0IHR5cGUgUGFuZWxDb21tYW5kcyA9IHtcbiAgICAgXCJvcGVuLXBhbmVsXCI6ICggbmFtZTogc3RyaW5nLCAuLi4gY29udGVudDogYW55IFtdICkgPT4gdm9pZCxcbiAgICAgXCJvcGVuLWluZm9zLXBhbmVsXCI6ICggZGF0YTogJE5vZGUgKSA9PiB2b2lkLFxuICAgICBcImNsb3NlLXBhbmVsXCI6ICgpID0+IHZvaWQsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGFuZWwgKClcbntcbiAgICAgY29uc3Qgc2xpZGVzaG93ID0gdWkuZ2V0ICh7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInNsaWRlc2hvd1wiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJwYW5lbC1zbGlkZXNob3dcIixcbiAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICBkaXJlY3Rpb246IFwiYnRcIixcblxuICAgICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlOiBcInNsaWRlXCIsXG4gICAgICAgICAgICAgICBpZCAgOiBcImRhdGFcIixcbiAgICAgICAgICB9XVxuICAgICB9KSBhcyBTbGlkZXNob3dcblxuICAgICB1aS5kZWZpbmUgKCBTa2lsbEluZm9zLCBcImNvbmNlcHQtaW5mb3NcIiwgXCJkYXRhXCIgKVxuICAgICB1aS5kZWZpbmUgKCBTa2lsbEluZm9zLCBcImNvbnNvbGVcIiwgXCJhcHAtY29uc29sZVwiIClcblxuICAgICBjb25zdCBzbGlkZUluZm9zICAgPSB1aS5nZXQgPFNraWxsSW5mb3M+ICh7IHR5cGU6IFwiY29uY2VwdC1pbmZvc1wiLCBpZDogXCJkYXRhXCIgfSlcbiAgICAgY29uc3Qgc2xpZGVDb25zb2xlID0gdWkuZ2V0IDxTa2lsbEluZm9zPiAoeyB0eXBlOiBcImNvbnNvbGVcIiwgaWQ6IFwiYXBwLWNvbnNvbGVcIiB9KVxuXG4gICAgIGNvbnN0IHBhbmVsID0gbmV3IFBhbmVsICh7XG4gICAgICAgICAgY29udGV4dCAgICAgIDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgdHlwZSAgICAgICAgIDogXCJwYW5lbFwiLFxuICAgICAgICAgIGlkICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcImJ0XCIsXG4gICAgICAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcblxuICAgICAgICAgIGhlYWRlcjoge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgaWQgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICB0aXRsZSAgICA6IFwiVGl0bGUgLi5cIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJsclwiLFxuXG4gICAgICAgICAgICAgICBidXR0b25zOiBbe1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICAgOiBcImNvbnNvbGVcIixcbiAgICAgICAgICAgICAgICAgICAgaWNvbiAgICA6IFwi4pqgXCIsXG4gICAgICAgICAgICAgICAgICAgIHRleHQgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgICAgICBpZCAgICAgIDogXCJwcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICAgICAgIGljb24gICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0ICAgIDogXCJwYW5lbCBwcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZU9uOiBcIipcIixcbiAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIGNoaWxkcmVuOiBbIHNsaWRlSW5mb3MuZGF0YSwgc2xpZGVDb25zb2xlLmRhdGEgXVxuICAgICB9KVxuXG4gICAgIGFkZENvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCBuYW1lLCAuLi4gY29udGVudCApID0+XG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5hbWUgKVxuICAgICAgICAgICAgICAgc2xpZGVzaG93LnNob3cgKCBuYW1lLCAuLi4gY29udGVudCApXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgcGFuZWwub3BlbiAoKVxuICAgICB9KVxuXG4gICAgIGFkZENvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiwgKCBkYXRhICkgPT5cbiAgICAge1xuICAgICAgICAgIGlmICggZGF0YSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc2xpZGVJbmZvcy5kaXNwbGF5ICggZGF0YSBhcyBhbnkgKVxuICAgICAgICAgICAgICAgcGFuZWwub3BlbiAoKVxuICAgICAgICAgIH1cbiAgICAgfSlcblxuICAgICBhZGRDb21tYW5kICggXCJjbG9zZS1wYW5lbFwiICwgKCkgPT5cbiAgICAge1xuICAgICAgICAgIHBhbmVsLmNsb3NlICgpXG4gICAgIH0pXG5cbiAgICAgcmV0dXJuIHBhbmVsXG59XG5cbmV4cG9ydCBjb25zdCBwYW5lbCA9IGNyZWF0ZVBhbmVsICgpXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBwYW5lbC5nZXRIdG1sICgpIClcbiIsIlxuXG5pbXBvcnQgeyBjcmVhdGVNZW51IH0gZnJvbSBcIi4uL1VpL2luZGV4XCJcbmltcG9ydCB7IGFkZENvbW1hbmQgfSBmcm9tIFwiLi9jb21tYW5kXCJcblxuXG5leHBvcnQgY29uc3QgbWVudSA9IGNyZWF0ZU1lbnUgKClcblxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gbWVudS5lbGVtZW50cyAoKSApXG5cbmV4cG9ydCB0eXBlIE1lbnVDb21tYW5kcyA9IHtcbiAgICAgXCJvcGVuLW1lbnVcIjogKCkgPT4gdm9pZCxcbiAgICAgXCJjbG9zZS1tZW51XCI6ICgpID0+IHZvaWQsXG59XG5cbmFkZENvbW1hbmQgKCBcIm9wZW4tbWVudVwiLCAoKSA9PiB7IG1lbnUub3BlbiAoKSB9KVxuYWRkQ29tbWFuZCAoIFwiY2xvc2UtbWVudVwiLCAoKSA9PiB7IG1lbnUuY2xvc2UgKCkgfSlcblxuIiwiaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vLi4vLi4vTGliL2luZGV4XCJcbmltcG9ydCB7ICRDb21wb25lbnQsIENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9Db3JlL0NvbXBvbmVudC9pbmRleFwiXG5pbXBvcnQgeyAkQnV0dG9uIH0gZnJvbSBcIi4uL0J1dHRvbi9pbmRleFwiXG5pbXBvcnQgKiBhcyBTdmcgZnJvbSBcIi4uLy4uL0NvcmUvU3ZnL2luZGV4XCJcbmltcG9ydCB7IHhub2RlLCBKU1ggfSBmcm9tIFwiLi4vLi4vQ29yZS94bm9kZVwiXG5cbmNvbnN0IEcgPSBHZW9tZXRyeVxuXG50eXBlIFJlbmRlcmVyID0gKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uICkgPT4gU1ZHRWxlbWVudCBbXVxudHlwZSBSYWRpYWxEZWZpbml0aW9uID0gR2VvbWV0cnkuUmFkaWFsRGVmaW5pdGlvblxudHlwZSBSYWRpYWxPcHRpb24gICAgID0gR2VvbWV0cnkuUmFkaWFsT3B0aW9uXG5cbmludGVyZmFjZSAkUmFkaWFsTWVudSBleHRlbmRzICRDb21wb25lbnRcbntcbiAgICAgdHlwZTogXCJyYWRpYWwtbWVudVwiLFxuICAgICBidXR0b25zOiBQYXJ0aWFsIDwkQnV0dG9uPiBbXSxcbiAgICAgcm90YXRpb246IG51bWJlclxufVxuXG5cbmV4cG9ydCBjbGFzcyBSYWRpYWxNZW51IGV4dGVuZHMgQ29tcG9uZW50IDwkUmFkaWFsTWVudT5cbntcbiAgICAgY29udGFpbmVyOiBTVkdTVkdFbGVtZW50XG4gICAgIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb25cblxuICAgICByZWFkb25seSByZW5kZXJlcnM6IFJlY29yZCA8c3RyaW5nLCBSZW5kZXJlcj4gPSB7XG4gICAgICAgICAgXCJjaXJjbGVcIjogdGhpcy5yZW5kZXJTdmdDaXJjbGVzLmJpbmQgKHRoaXMpXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lciBhcyBhbnldXG4gICAgIH1cblxuICAgICBhZGQgKCAuLi4gYnV0dG9uczogJEJ1dHRvbiBbXSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmRhdGEuYnV0dG9ucy5wdXNoICggLi4uIGJ1dHRvbnMgKVxuXG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBkZWY6IFJhZGlhbE9wdGlvbiA9IHtcbiAgICAgICAgICAgICAgIGNvdW50ICA6IGRhdGEuYnV0dG9ucy5sZW5ndGgsXG4gICAgICAgICAgICAgICByICAgICAgOiA3NSxcbiAgICAgICAgICAgICAgIHBhZGRpbmc6IDYsXG4gICAgICAgICAgICAgICByb3RhdGlvbjogZGF0YS5yb3RhdGlvbiB8fCAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gRy5nZXRSYWRpYWxEaXN0cmlidXRpb24gKCBkZWYgKVxuICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IHRoaXMudG9TdmcgKCBcImNpcmNsZVwiIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHsgb3B0aW9ucyB9ID0gdGhpc1xuICAgICAgICAgIC8vZm9yICggY29uc3QgYnRuIG9mIG9wdGlvbnMuYnV0dG9ucyApXG4gICAgICAgICAgLy8gICAgIGJ0bi5cbiAgICAgfVxuXG4gICAgIHNob3cgKCB4OiBudW1iZXIsIHk6IG51bWJlciApOiB2b2lkXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBuID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmRlZmluaXRpb24ud2lkdGggLyAyXG5cbiAgICAgICAgICBuLnN0eWxlLmxlZnQgPSAoeCAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLnN0eWxlLnRvcCAgPSAoeSAtIG9mZnNldCkgKyBcInB4XCJcbiAgICAgICAgICBuLmNsYXNzTGlzdC5yZW1vdmUgKCBcImNsb3NlXCIgKVxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlLmJpbmQgKHRoaXMpLCB0cnVlIClcbiAgICAgfVxuXG4gICAgIGhpZGUgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKFwiY2xvc2VcIilcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgdGhpcy5oaWRlIClcbiAgICAgfVxuXG4gICAgIHRvU3ZnICggc3R5bGU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRlZmluaXRpb246IGRlZiwgcmVuZGVyZXJzLCBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzdmcgPVxuICAgICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgICAgICBjbGFzcyAgID1cInJhZGlhbC1tZW51IGNsb3NlXCJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggICA9eyBkZWYud2lkdGggKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgID17IGRlZi5oZWlnaHQgKyBcInB4XCIgfVxuICAgICAgICAgICAgICAgICAgICB2aWV3Qm94ID17IGAwIDAgJHsgZGVmLndpZHRoIH0gJHsgZGVmLmhlaWdodCB9YCB9XG4gICAgICAgICAgICAgICAvPiBhcyBTVkdTVkdFbGVtZW50XG5cbiAgICAgICAgICBjb25zdCBidXR0dW5zID0gc3R5bGUgaW4gcmVuZGVyZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyByZW5kZXJlcnMgW3N0eWxlXSAoIGRlZiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLnJlbmRlclN2Z0NpcmNsZXMgKCBkZWYgKVxuXG4gICAgICAgICAgc3ZnLmFwcGVuZCAoIC4uLiBidXR0dW5zIGFzIE5vZGUgW10gKVxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBidXR0dW5zLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgb3B0ID0gZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvcHQuY2FsbGJhY2sgPT0gXCJmdW5jdGlvblwiIClcbiAgICAgICAgICAgICAgICAgICAgYnV0dHVucyBbaV0uYWRkRXZlbnRMaXN0ZW5lciAoIFwibW91c2Vkb3duXCIsICgpID0+IG9wdC5jYWxsYmFjayAoKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHN2Z1xuICAgICB9XG5cbiAgICAgcmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZmluaXRpb246IFJhZGlhbERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzICA9IGRlZmluaXRpb24ucG9pbnRzXG4gICAgICAgICAgY29uc3QgcGFkZGluZyA9IGRlZmluaXRpb24ucGFkZGluZ1xuICAgICAgICAgIGNvbnN0IGJ1dHR1bnMgPSBbXSBhcyBTVkdFbGVtZW50IFtdXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyArK2kgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGRlZiA9IHBvaW50cyBbaV1cbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IHRoaXMuZGF0YS5idXR0b25zIFtpXVxuXG4gICAgICAgICAgICAgICBjb25zdCBncm91cCA9IDxnIGNsYXNzPVwiYnV0dG9uXCIgLz5cblxuICAgICAgICAgICAgICAgY29uc3QgY2lyY2xlID0gU3ZnLmNyZWF0ZVN2Z1NoYXBlICggXCJjaXJjbGVcIiwge1xuICAgICAgICAgICAgICAgICAgICBzaXplOiBkZWYuY2hvcmQubGVuZ3RoIC0gcGFkZGluZyAqIDIsXG4gICAgICAgICAgICAgICAgICAgIHg6IGRlZi54LFxuICAgICAgICAgICAgICAgICAgICB5OiBkZWYueVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IDx0ZXh0XG4gICAgICAgICAgICAgICAgICAgIHggPSB7IGRlZi54IH1cbiAgICAgICAgICAgICAgICAgICAgeSA9IHsgZGVmLnkgfVxuICAgICAgICAgICAgICAgICAgICBmb250LXNpemU9XCIzMFwiXG4gICAgICAgICAgICAgICAgICAgIGZpbGw9XCJibGFja1wiXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlPVwidXNlci1zZWxlY3Q6IG5vbmU7IGN1cnNvcjogcG9pbnRlcjsgZG9taW5hbnQtYmFzZWxpbmU6IGNlbnRyYWw7IHRleHQtYW5jaG9yOiBtaWRkbGU7XCJcbiAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgIGlmICggYnRuLmZvbnRGYW1pbHkgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRBdHRyaWJ1dGUgKCBcImZvbnQtZmFtaWx5XCIsIGJ0bi5mb250RmFtaWx5IClcblxuICAgICAgICAgICAgICAgdGV4dC5pbm5lckhUTUwgPSBidG4uaWNvblxuXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCBjaXJjbGUgKVxuICAgICAgICAgICAgICAgZ3JvdXAuYXBwZW5kICggdGV4dCApXG5cbiAgICAgICAgICAgICAgIGJ1dHR1bnMucHVzaCAoIGdyb3VwIGFzIFNWR0VsZW1lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBidXR0dW5zXG4gICAgIH1cbn1cblxuIiwiXG5pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbFwiXG5cbmltcG9ydCB7ICRHZW9tZXRyeSB9IGZyb20gXCIuL2dlb21ldHJ5XCJcblxuZXhwb3J0IGludGVyZmFjZSBUZXh0RGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxue1xuICAgICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoRGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxue1xuICAgICBwYXRoOiBzdHJpbmdcbn1cblxuY29uc3QgZmFicmljX2Jhc2Vfb2J0aW9uczogZmFicmljLklPYmplY3RPcHRpb25zID0ge1xuICAgICBsZWZ0ICAgOiAwLFxuICAgICB0b3AgICAgOiAwLFxuICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxufVxuXG5leHBvcnQgY29uc3QgRmFjdG9yeSA9XG57XG4gICAgIGdyb3VwICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSUNpcmNsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuR3JvdXAgKCB1bmRlZmluZWQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgd2lkdGg6IHNpemUsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHNpemUsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuICAgICAvLyBUbyBnZXQgdHJpYW5nbGUsIHNxdWFyZSwgW3BhbnRhfGhleGFdZ29uIHBvaW50c1xuICAgICAvL1xuICAgICAvLyB2YXIgYSA9IE1hdGguUEkqMi80XG4gICAgIC8vIGZvciAoIHZhciBpID0gMCA7IGkgIT0gNCA7IGkrKyApXG4gICAgIC8vICAgICBjb25zb2xlLmxvZyAoIGBbICR7IE1hdGguc2luKGEqaSkgfSwgJHsgTWF0aC5jb3MoYSppKSB9IF1gIClcblxuICAgICBjaXJjbGUgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JQ2lyY2xlT3B0aW9ucyApXG4gICAgIHtcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLkNpcmNsZSAoXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgcmFkaXVzOiBzaXplIC8gMixcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIHRyaWFuZ2xlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSVRyaWFuZ2xlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICAgICAgIGNvbnN0IHNjYWxlID0gMS4yXG4gICAgICAgICAgY29uc3QgciA9IHNpemUgLyAyICogc2NhbGVcblxuICAgICAgICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgICAgICAgWyAwLCAxIF0sXG4gICAgICAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NywgLTAuNDk5OTk5OTk5OTk5OTk5OCBdLFxuICAgICAgICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0Mzg1LCAtMC41MDAwMDAwMDAwMDAwMDA0IF1cbiAgICAgICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuXG4gICAgIHNxdWFyZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklSZWN0T3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzY2FsZSA9IDAuOVxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlJlY3QgKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIHdpZHRoIDogc2l6ZSAqIHNjYWxlLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplICogc2NhbGUsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuICAgICBwYW50YWdvbiAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklPYmplY3RPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSAxLjFcbiAgICAgICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgICAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICAgICAgIFsgMC45NTEwNTY1MTYyOTUxNTM1LCAwLjMwOTAxNjk5NDM3NDk0NzQ1IF0sXG4gICAgICAgICAgICAgICBbIDAuNTg3Nzg1MjUyMjkyNDczMiwgLTAuODA5MDE2OTk0Mzc0OTQ3MyBdLFxuICAgICAgICAgICAgICAgWyAtMC41ODc3ODUyNTIyOTI0NzMsIC0wLjgwOTAxNjk5NDM3NDk0NzUgXSxcbiAgICAgICAgICAgICAgIFsgLTAuOTUxMDU2NTE2Mjk1MTUzNiwgMC4zMDkwMTY5OTQzNzQ5NDcyMyBdXG4gICAgICAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBhbmdsZTogMTgwLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cbiAgICAgaGV4YWdvbiAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklPYmplY3RPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSAxLjFcbiAgICAgICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgICAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg2LCAwLjUwMDAwMDAwMDAwMDAwMDEgXSxcbiAgICAgICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgICAgICBbIDEuMjI0NjQ2Nzk5MTQ3MzUzMmUtMTYsIC0xIF0sXG4gICAgICAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXSxcbiAgICAgICAgICAgICAgIFsgLTAuODY2MDI1NDAzNzg0NDM5LCAwLjQ5OTk5OTk5OTk5OTk5OTMzIF0sXG4gICAgICAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBhbmdsZTogOTAsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuXG4gICAgIHRleHQgKCBkZWY6IFRleHREZWZpbml0aW9uLCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLlRleHRPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlRleHQgKCBcIi4uLlwiLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBmb250U2l6ZTogc2l6ZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIHRleHRib3ggKCBkZWY6IFRleHREZWZpbml0aW9uLCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLlRleHRPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlRleHRib3ggKCBcIi4uLlwiLCB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICBmb250U2l6ZTogc2l6ZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG5cbiAgICAgcGF0aCAoIGRlZjogUGF0aERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUGF0aCAoIGRlZi5wYXRoLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIHNjYWxlWDogc2l6ZSAvIDEwMCwgLy8gRW4gc3VwcG9zYW50IHF1ZSBsZSB2aWV3Qm94XG4gICAgICAgICAgICAgICBzY2FsZVk6IHNpemUgLyAxMDAsIC8vIGVzdCBcIjAgMCAxMDAgMTAwXCJcbiAgICAgICAgICB9KVxuICAgICB9LFxufVxuXG5cbiIsIlxuaW1wb3J0ICogYXMgZmFicmljIGZyb20gXCJmYWJyaWMvZmFicmljLWltcGxcIlxuaW1wb3J0IHsgU2hhcGVEYXRhLCBTaGFwZSB9IGZyb20gXCIuLi9FbGVtZW50L3NoYXBlXCJcbmltcG9ydCB7IEZhY3RvcnkgfSBmcm9tIFwiLi9mYWN0b3J5XCJcblxuZXhwb3J0IHR5cGUgR2VvbWV0cnlOYW1lcyA9IGtleW9mIHR5cGVvZiBGYWN0b3J5XG5cbmV4cG9ydCBpbnRlcmZhY2UgJEdlb21ldHJ5XG57XG4gICAgIHNoYXBlOiBHZW9tZXRyeU5hbWVzXG4gICAgIHggICAgICAgICA6IG51bWJlclxuICAgICB5ICAgICAgICAgOiBudW1iZXJcblxuICAgICBib3JkZXJXaWR0aCAgICA6IG51bWJlclxuICAgICBib3JkZXJDb2xvciAgICA6IHN0cmluZ1xuXG4gICAgIGJhY2tncm91bmRDb2xvciA6IHN0cmluZ1xuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiBzdHJpbmdcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogYm9vbGVhblxufVxuXG5leHBvcnQgY2xhc3MgR2VvbWV0cnkgPFQgZXh0ZW5kcyBHZW9tZXRyeU5hbWVzID0gR2VvbWV0cnlOYW1lcz5cbntcbiAgICAgY29uZmlnOiAkR2VvbWV0cnlcbiAgICAgb2JqZWN0OiBSZXR1cm5UeXBlIDx0eXBlb2YgRmFjdG9yeSBbVF0+XG5cbiAgICAgc3RhdGljIGNyZWF0ZSAoIG93bmVyOiBTaGFwZSwgY29uZmlnOiBTaGFwZURhdGEgKVxuICAgICB7XG4gICAgICAgICAgY29uZmlnID0ge1xuICAgICAgICAgICAgICAgeCA6IDAsXG4gICAgICAgICAgICAgICB5IDogMCxcbiAgICAgICAgICAgICAgIC4uLiBjb25maWcsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIEZhY3RvcnkgW2NvbmZpZy5zaGFwZSBhcyBhbnldICggY29uZmlnLCBvd25lci5kaXNwbGF5U2l6ZSAoKSwge1xuICAgICAgICAgICAgICAgbGVmdCAgICAgICA6IGNvbmZpZy54LFxuICAgICAgICAgICAgICAgdG9wICAgICAgICA6IGNvbmZpZy55LFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIGZpbGwgICAgICAgOiBjb25maWcuYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgICAgICAgc3Ryb2tlICAgICA6IGNvbmZpZy5ib3JkZXJDb2xvcixcbiAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiBjb25maWcuYm9yZGVyV2lkdGgsXG4gICAgICAgICAgfSkgYXMgZmFicmljLk9iamVjdFxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCByZWFkb25seSBvd25lcjogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcgPSBvd25lci5jb25maWdcblxuICAgICAgICAgIHRoaXMub2JqZWN0ID0gRmFjdG9yeSBbY29uZmlnLnNoYXBlIGFzIGFueV0gKCBjb25maWcsIG93bmVyLmRpc3BsYXlTaXplICgpLCB7XG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIG9yaWdpblkgICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgZmlsbCAgICAgICA6IGNvbmZpZy5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgICAgICBzdHJva2UgICAgIDogY29uZmlnLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IGNvbmZpZy5ib3JkZXJXaWR0aCxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgaWYgKCBjb25maWcuYmFja2dyb3VuZEltYWdlICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBmYWJyaWMudXRpbC5sb2FkSW1hZ2UgKCBjb25maWcuYmFja2dyb3VuZEltYWdlLCB0aGlzLm9uX3BhdHRlcm4uYmluZCAodGhpcykgKVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIDsob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgOiBjb25maWcueSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIsIGNvbmZpZywgb2JqZWN0IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzaXplID0gb3duZXIuZGlzcGxheVNpemUgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLnNoYXBlID09IFwiY2lyY2xlXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLkNpcmNsZSkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDJcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JqZWN0LnNldENvb3JkcyAoKVxuICAgICB9XG5cblxuICAgICBwcml2YXRlIG9uX3BhdHRlcm4gKCBkaW1nOiBIVE1MSW1hZ2VFbGVtZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGZhY3RvciA9IGRpbWcud2lkdGggPCBkaW1nLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gb3duZXIuZGlzcGxheVNpemUgKCkgLyBkaW1nLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcuaGVpZ2h0XG5cbiAgICAgICAgICA7KHRoaXMub2JqZWN0IGFzIGFueSkuc2V0ICh7XG4gICAgICAgICAgICAgICBmaWxsOiBuZXcgZmFicmljLlBhdHRlcm4gKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBkaW1nLFxuICAgICAgICAgICAgICAgICAgICByZXBlYXQ6IFwibm8tcmVwZWF0XCIsXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm06IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm9iamVjdC5jYW52YXMgKVxuICAgICAgICAgICAgICAgdGhpcy5vYmplY3QuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbFwiXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi9HZW9tZXRyeS9nZW9tZXRyeVwiXG5cbmltcG9ydCB7ICROb2RlLCBDdG9yIGFzIERhdGFDdG9yIH0gZnJvbSBcIi4uLy4uLy4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0IHsgJFRoaW5nIH0gZnJvbSBcIi4uLy4uL0RhdGEvaW5kZXhcIlxuaW1wb3J0IHsgJEdlb21ldHJ5IH0gZnJvbSBcIi4uL0dlb21ldHJ5L2dlb21ldHJ5XCJcblxuZXhwb3J0IGludGVyZmFjZSBFdmVudHNDb25maWcgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbntcbiAgICAgb25DcmVhdGU6ICggZW50aXR5OiBELCBhc3BlY3Q6IFNoYXBlICkgPT4gdm9pZCxcbiAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICBvblRvdWNoOiAoIGFzcGVjdDogU2hhcGUgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhcGVEYXRhIDxEIGV4dGVuZHMgJFRoaW5nID0gJFRoaW5nPiBleHRlbmRzICROb2RlLCAkR2VvbWV0cnksIEV2ZW50c0NvbmZpZ1xue1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICBkYXRhOiBEXG5cbiAgICAgbWluU2l6ZSAgIDogbnVtYmVyXG4gICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICBzaXplRmFjdG9yOiBudW1iZXJcbn1cblxuZXhwb3J0IHR5cGUgQ3RvciA8RGF0YSBleHRlbmRzIFNoYXBlRGF0YSA9IFNoYXBlRGF0YSwgVCBleHRlbmRzIFNoYXBlID0gU2hhcGU+XG4gICAgICAgICAgICAgICA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyBTaGFwZURhdGEgPSBTaGFwZURhdGE+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6IFNoYXBlRGF0YVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIlVwZGF0YSBoZXJlIFNoYXBlLmRhdGEgXCIgKyBkYXRhLmRhdGEgKVxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBpbml0ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwID0gbmV3IGZhYnJpYy5Hcm91cCAoIFtdLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHdpZHRoICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0ICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBoYXNCb3JkZXJzIDogdHJ1ZSwgICAgICAgICAgICAgICAgICAvLyBmYWxzZSxcbiAgICAgICAgICAgICAgIGhhc0NvbnRyb2xzOiB0cnVlLCAgICAgICAgICAgICAgICAgIC8vIGZhbHNlLFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgOyh0aGlzLmJhY2tncm91bmQgYXMgR2VvbWV0cnkpID0gbmV3IEdlb21ldHJ5ICggdGhpcyApXG4gICAgICAgICAgZ3JvdXAuYWRkICggdGhpcy5iYWNrZ3JvdW5kLm9iamVjdCApXG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLm9iamVjdC5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICAvLyA7KHRoaXMuYm9yZGVyIGFzIEdlb21ldHJ5KSA9IG5ldyBHZW9tZXRyeSAoIHRoaXMsIHRoaXMuY29uZmlnIClcbiAgICAgICAgICAvLyBncm91cC5hZGQgKCB0aGlzLmJvcmRlci5vYmplY3QgKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdcblxuICAgICAgICAgIHZhciBzaXplID0gKDEgKyBjb25maWcuc2l6ZU9mZnNldCkgKiBjb25maWcuc2l6ZUZhY3RvclxuXG4gICAgICAgICAgaWYgKCBzaXplIDwgY29uZmlnLm1pblNpemUgKVxuICAgICAgICAgICAgICAgc2l6ZSA9IGNvbmZpZy5taW5TaXplXG5cbiAgICAgICAgICByZXR1cm4gc2l6ZSB8fCAxXG4gICAgIH1cblxuICAgICB1cGRhdGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdGhpcy5iYWNrZ3JvdW5kIClcbiAgICAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGVTaXplICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYm9yZGVyIClcbiAgICAgICAgICAgICAgIHRoaXMuYm9yZGVyLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGdyb3VwLnNldCAoe1xuICAgICAgICAgICAgICAgd2lkdGggOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBpZiAoIGdyb3VwLmNhbnZhcyApXG4gICAgICAgICAgICAgICBncm91cC5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgY29vcmRzICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ncm91cC5nZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHNldEJhY2tncm91bmQgKCBvcHRpb25zOiAkR2VvbWV0cnkgKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHRoaXMuY29uZmlnLCBvcHRpb25zIClcbiAgICAgICAgICB0aGlzLnVwZGF0ZVNpemUgKClcbiAgICAgfVxuXG4gICAgIHNldFBvc2l0aW9uICggeDogbnVtYmVyLCB5OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25maWcueCA9IHhcbiAgICAgICAgICBjb25maWcueSA9IHlcblxuICAgICAgICAgIGdyb3VwLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogeCxcbiAgICAgICAgICAgICAgIHRvcCA6IHlcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsXCJcbmltcG9ydCB7ICROb2RlLCBEYXRhYmFzZSwgRmFjdG9yeSB9IGZyb20gXCIuLi8uLi9EYXRhL2luZGV4XCJcbmltcG9ydCB7IFNoYXBlLCBTaGFwZURhdGEgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXhcIlxuXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtYXNwZWN0XCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgKClcbmNvbnN0IGZhY3RvcnkgPSBuZXcgRmFjdG9yeSA8U2hhcGU+ICggZGIgKSAvLy5jb250ZXh0IDxTaGFwZURhdGE+ICggXCJjb25jZXB0LWFzcGVjdFwiIClcbmNvbnN0IEFTUEVDVCAgPSBTeW1ib2wuZm9yICggXCJBU1BFQ1RcIiApXG5cbnR5cGUgJEluIDwkIGV4dGVuZHMgU2hhcGVEYXRhID0gU2hhcGVEYXRhPiA9IE9wdGlvbmFsIDwkLCBcImNvbnRleHRcIj5cblxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPFNoYXBlRGF0YT4pLmNvbnRleHQgPSBDT05URVhUXG4gICAgIH1cblxuICAgICByZXR1cm4gbm9kZSBhcyBTaGFwZURhdGFcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0IDxUIGV4dGVuZHMgU2hhcGU+ICggb2JqOiAkTm9kZSB8IFNoYXBlIHwgZmFicmljLk9iamVjdCApOiBUIHwgdW5kZWZpbmVkXG57XG4gICAgIGlmICggb2JqID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgU2hhcGUgKVxuICAgICAgICAgIHJldHVybiBvYmogYXMgVFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgZmFicmljLk9iamVjdCApXG4gICAgICAgICAgcmV0dXJuIG9iaiBbQVNQRUNUXVxuXG4gICAgIGlmICggZmFjdG9yeS5pblN0b2NrICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApIClcbiAgICAgICAgICByZXR1cm4gZmFjdG9yeS5tYWtlICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApXG5cbiAgICAgY29uc3Qgb3B0aW9ucyAgPSBvYmouY29udGV4dCA9PSBDT05URVhUXG4gICAgICAgICAgICAgICAgICAgID8gb2JqIGFzIFNoYXBlRGF0YVxuICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBDT05URVhULFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IG9iai50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICAgICA6IG9iai5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhICAgOiBvYmosXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgU2hhcGVEYXRhXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLngpIClcbiAgICAgICAgICBvcHRpb25zLnggPSAwXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLnkpIClcbiAgICAgICAgICBvcHRpb25zLnkgPSAwXG5cbiAgICAgY29uc3Qgc2hhcGUgPSBmYWN0b3J5Lm1ha2UgKCBvcHRpb25zIClcblxuICAgICBzaGFwZS5pbml0ICgpXG4gICAgIHNoYXBlLmdyb3VwIFtBU1BFQ1RdID0gc2hhcGVcblxuICAgICBpZiAoIHNoYXBlLmNvbmZpZy5vbkNyZWF0ZSApXG4gICAgICAgICAgc2hhcGUuY29uZmlnLm9uQ3JlYXRlICggc2hhcGUuY29uZmlnLmRhdGEsIHNoYXBlIClcblxuICAgICByZXR1cm4gc2hhcGUgYXMgVFxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXQgPCQgZXh0ZW5kcyBTaGFwZURhdGE+ICggbm9kZTogJEluIDwkPiApXG57XG4gICAgIGRiLnNldCAoIG5vcm1hbGl6ZSAoIG5vZGUgKSApXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZSAoIGN0b3I6IG5ldyAoIGRhdGE6IFNoYXBlRGF0YSApID0+IFNoYXBlLCB0eXBlOiBzdHJpbmcgKVxue1xuICAgICBmYWN0b3J5LmRlZmluZSAoIGN0b3IsIENPTlRFWFQsIHR5cGUgKVxufVxuIiwiXG4vKlxuZXhhbXBsZTpcbmh0dHBzOi8vcHJlemkuY29tL3AvOWpxZTJ3a2ZoaGt5L2xhLWJ1bGxvdGVyaWUtdHBjbW4vXG5odHRwczovL21vdmlsYWIub3JnL2luZGV4LnBocD90aXRsZT1VdGlsaXNhdGV1cjpBdXIlQzMlQTlsaWVuTWFydHlcbiovXG5cbmltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsXCJcblxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4XCJcblxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi4vQXNwZWN0L0VsZW1lbnQvc2hhcGVcIlxuaW1wb3J0ICogYXMgYXNwZWN0IGZyb20gXCIuLi9Bc3BlY3QvZGJcIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uL0RhdGEvZGJcIlxuaW1wb3J0IHsgJE5vZGUgfSBmcm9tIFwiLi4vLi4vRGF0YS9pbmRleFwiXG5cbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnBhZGRpbmcgICAgICAgICAgICA9IDBcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLm9iamVjdENhY2hpbmcgICAgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNDb250cm9scyAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNCb3JkZXJzICAgICAgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5oYXNSb3RhdGluZ1BvaW50ICAgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUudHJhbnNwYXJlbnRDb3JuZXJzID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNlbnRlcmVkU2NhbGluZyAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmNvcm5lclN0eWxlICAgICAgICA9IFwiY2lyY2xlXCJcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtbFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXRcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1yXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtYlwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwidGxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJsXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJiclwiLCBmYWxzZSApXG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld1xue1xuICAgICBuYW1lOiBzdHJpbmdcbiAgICAgYWN0aXZlOiBib29sZWFuXG4gICAgIGNoaWxkcmVuIDogU2hhcGUgW11cbiAgICAgdGh1bWJuYWlsOiBzdHJpbmdcbiAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIlxufVxuXG5leHBvcnQgY2xhc3MgQXJlYVxue1xuICAgICByZWFkb25seSBmY2FudmFzOiBmYWJyaWMuQ2FudmFzXG4gICAgIHByaXZhdGUgYWN0aXZlOiBWaWV3XG4gICAgIHByaXZhdGUgdmlld3MgPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgVmlldz5cblxuICAgICBjb25zdHJ1Y3RvciAoIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5mY2FudmFzID0gbmV3IGZhYnJpYy5DYW52YXMgKCBjYW52YXMgKVxuICAgICAgICAgIHRoaXMuZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBnZXQgdmlldyAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlXG4gICAgIH1cblxuICAgICBvdmVyRk9iamVjdDogZmFicmljLk9iamVjdCA9IHVuZGVmaW5lZFxuXG4gICAgIG9uT3Zlck9iamVjdCAgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25PdXRPYmplY3QgICA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvblRvdWNoT2JqZWN0ID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uRG91YmxlVG91Y2hPYmplY3QgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Ub3VjaEFyZWEgICA9IG51bGwgYXMgKCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+IHZvaWRcblxuICAgICBjcmVhdGVWaWV3ICggbmFtZTogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgdmlld3MgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggbmFtZSBpbiB2aWV3cyApXG4gICAgICAgICAgICAgICB0aHJvdyBcIlRoZSB2aWV3IGFscmVhZHkgZXhpc3RzXCJcblxuICAgICAgICAgIHJldHVybiB2aWV3cyBbbmFtZV0gPSB7XG4gICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgYWN0aXZlICAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgIGNoaWxkcmVuIDogW10sXG4gICAgICAgICAgICAgICBwYWNraW5nICA6IFwiZW5jbG9zZVwiLFxuICAgICAgICAgICAgICAgdGh1bWJuYWlsOiBudWxsLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHVzZSAoIG5hbWU6IHN0cmluZyApOiBWaWV3XG4gICAgIHVzZSAoIHZpZXc6IFZpZXcgKSAgOiBWaWV3XG4gICAgIHVzZSAoIG5hbWU6IHN0cmluZyB8IFZpZXcgKTogVmlld1xuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzLCB2aWV3cyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgbmFtZSAhPSBcInN0cmluZ1wiIClcbiAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lLm5hbWVcblxuICAgICAgICAgIGlmICggdGhpcy5hY3RpdmUgJiYgdGhpcy5hY3RpdmUubmFtZSA9PSBuYW1lIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCAhIChuYW1lIGluIHZpZXdzKSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IGFjdGl2ZSA9IHRoaXMuYWN0aXZlID0gdmlld3MgW25hbWVdXG5cbiAgICAgICAgICBmY2FudmFzLmNsZWFyICgpXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBzaGFwZSBvZiBhY3RpdmUuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAgZmNhbnZhcy5hZGQgKCBzaGFwZS5ncm91cCApXG5cbiAgICAgICAgICByZXR1cm4gYWN0aXZlXG4gICAgIH1cblxuICAgICBhZGQgKCAuLi4gc2hhcGVzOiAoU2hhcGUgfCAkTm9kZSkgW10gKVxuICAgICBhZGQgKCAuLi4gcGF0aDogc3RyaW5nIFtdIClcbiAgICAgYWRkICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGFjdGl2ZSwgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmd1bWVudHMgWzBdID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBkYi5nZXQgKCAuLi4gYXJndW1lbnRzIGFzIGFueSBhcyBzdHJpbmcgW10gKVxuICAgICAgICAgICAgICAgY29uc3Qgc2hwID0gYXNwZWN0LmdldCAoIG5vZGUgKVxuICAgICAgICAgICAgICAgYWN0aXZlLmNoaWxkcmVuLnB1c2ggKCBzaHAgKVxuICAgICAgICAgICAgICAgZmNhbnZhcy5hZGQgKCBzaHAuZ3JvdXAgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGZvciAoIGNvbnN0IHMgb2YgYXJndW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBzaHAgPSBhc3BlY3QuZ2V0ICggcyBhcyAkTm9kZSB8IFNoYXBlIClcbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMuY2xlYXIgKClcbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgZyBvZiBvYmplY3RzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDIwIH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgb2JqZWN0cy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBvYmplY3RzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcbiAgICAgICAgICAgICAgIGcuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICB6b29tICggZmFjdG9yPzogbnVtYmVyIHwgU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yID09IFwib2JqZWN0XCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG8gPSBmYWN0b3IuZ3JvdXBcblxuICAgICAgICAgICAgICAgdmFyIGxlZnQgICA9IG8ubGVmdCAtIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciByaWdodCAgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICB2YXIgdG9wICAgID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBvLnRvcCAgKyBvLmhlaWdodFxuXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gMFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IDBcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgYm90dG9tID0gMFxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIG9iamVjdHMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gby5sZWZ0ICsgby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBsIDwgbGVmdCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHIgPiByaWdodCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSByXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0IDwgdG9wIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSB0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBiID4gYm90dG9tIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBiXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdyAgPSByaWdodCAtIGxlZnRcbiAgICAgICAgICBjb25zdCBoICA9IGJvdHRvbSAtIHRvcFxuICAgICAgICAgIGNvbnN0IHZ3ID0gZmNhbnZhcy5nZXRXaWR0aCAgKClcbiAgICAgICAgICBjb25zdCB2aCA9IGZjYW52YXMuZ2V0SGVpZ2h0ICgpXG5cbiAgICAgICAgICBjb25zdCBmID0gdyA+IGhcbiAgICAgICAgICAgICAgICAgICAgPyAodncgPCB2aCA/IHZ3IDogdmgpIC8gd1xuICAgICAgICAgICAgICAgICAgICA6ICh2dyA8IHZoID8gdncgOiB2aCkgLyBoXG5cbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFswXSA9IGZcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFszXSA9IGZcblxuICAgICAgICAgIGNvbnN0IGN4ID0gbGVmdCArIHcgLyAyXG4gICAgICAgICAgY29uc3QgY3kgPSB0b3AgICsgaCAvIDJcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzRdID0gLShjeCAqIGYpICsgdncgLyAyXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNV0gPSAtKGN5ICogZikgKyB2aCAvIDJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICBvLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBpc29sYXRlICggc2hhcGU6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgdGhpcy5mY2FudmFzLmdldE9iamVjdHMgKCkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG8udmlzaWJsZSA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2hhcGUuZ3JvdXAudmlzaWJsZSA9IHRydWVcbiAgICAgfVxuXG4gICAgIGdldFRodW1ibmFpbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmU6IGN2aWV3IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCB0aHVtYm5haWwgPSBjdmlldy50aHVtYm5haWxcblxuICAgICAgICAgIGlmICggdGh1bWJuYWlsIHx8IGN2aWV3LmFjdGl2ZSA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICB0aHVtYm5haWxcblxuICAgICAgICAgIHJldHVybiBjdmlldy50aHVtYm5haWwgPSB0aGlzLmZjYW52YXMudG9EYXRhVVJMICh7IGZvcm1hdDogXCJqcGVnXCIgfSlcbiAgICAgfVxuXG4gICAgIC8vIFVJIEVWRU5UU1xuXG4gICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5pbml0Q2xpY2tFdmVudCAoKVxuICAgICAgICAgIHRoaXMuaW5pdE92ZXJFdmVudCAgKClcbiAgICAgICAgICB0aGlzLmluaXRQYW5FdmVudCAgICgpXG4gICAgICAgICAgdGhpcy5pbml0Wm9vbUV2ZW50ICAoKVxuICAgICAgICAgIHRoaXMuaW5pdE1vdmVPYmplY3QgKClcbiAgICAgICAgICB0aGlzLmluaXREcmFnRXZlbnQgICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicmVzaXplXCIsIHRoaXMucmVzcG9uc2l2ZS5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIHJlc3BvbnNpdmUgKClcbiAgICAge1xuICAgICAgICAgIHZhciB3aWR0aCAgID0gKHdpbmRvdy5pbm5lcldpZHRoICA+IDApID8gd2luZG93LmlubmVyV2lkdGggIDogc2NyZWVuLndpZHRoXG4gICAgICAgICAgdmFyIGhlaWdodCAgPSAod2luZG93LmlubmVySGVpZ2h0ID4gMCkgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBzY3JlZW4uaGVpZ2h0XG5cbiAgICAgICAgICB0aGlzLmZjYW52YXMuc2V0RGltZW5zaW9ucyh7XG4gICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRDbGlja0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIGNvbnN0IG1heF9jbGljaF9hcmVhID0gMjUgKiAyNVxuICAgICAgICAgIHZhciAgIGxhc3RfY2xpY2sgICAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0X3BvcyAgICAgICA9IHsgeDogLTk5OTksIHk6IC05OTk5IH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgbm93ICAgPSBEYXRlLm5vdyAoKVxuICAgICAgICAgICAgICAgY29uc3QgcG9zICAgPSBmZXZlbnQucG9pbnRlclxuICAgICAgICAgICAgICAgY29uc3QgcmVzZXQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgPSBub3dcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9wb3MgICA9IHBvc1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIHNvaXQgdW4gZG91YmxlLWNsaXF1ZS5cbiAgICAgICAgICAgICAgIGlmICggNTAwIDwgbm93IC0gbGFzdF9jbGljayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5vblRvdWNoT2JqZWN0IClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblRvdWNoT2JqZWN0ICggZWxlbWVudCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgbGVzIGRldXggY2xpcXVlcyBzZSB0cm91dmUgZGFucyB1bmUgcsOpZ2lvbiBwcm9jaGUuXG4gICAgICAgICAgICAgICBjb25zdCB6b25lID0gKHBvcy54IC0gbGFzdF9wb3MueCkgKiAocG9zLnkgLSBsYXN0X3Bvcy55KVxuICAgICAgICAgICAgICAgaWYgKCB6b25lIDwgLW1heF9jbGljaF9hcmVhIHx8IG1heF9jbGljaF9hcmVhIDwgem9uZSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuXG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSBmb3JtZS5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vdmVyRk9iamVjdCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jbGljayAgID0gLTFcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIC8vIFNpIGxlIHBvaW50ZXIgZXN0IGF1LWRlc3N1cyBk4oCZdW5lIHpvbmUgdmlkZS5cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hBcmVhIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hBcmVhICggcG9zLngsIHBvcy55IClcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgZmV2ZW50LmUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICgpXG5cbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRPdmVyRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm92ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5vdmVyRk9iamVjdCA9IGZldmVudC50YXJnZXRcblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uT3Zlck9iamVjdCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3Zlck9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpvdXRcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5vdmVyRk9iamVjdCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub25PdXRPYmplY3QgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk91dE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRQYW5FdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIHZhciAgIGlzRHJhZ2dpbmcgPSBmYWxzZVxuICAgICAgICAgIHZhciAgIGxhc3RQb3NYICAgPSAtMVxuICAgICAgICAgIHZhciAgIGxhc3RQb3NZICAgPSAtMVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6ZG93blwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub3ZlckZPYmplY3QgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5zZWxlY3Rpb24gPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBwYWdlLmRpc2NhcmRBY3RpdmVPYmplY3QgKClcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5mb3JFYWNoT2JqZWN0ICggbyA9PiB7IG8uc2VsZWN0YWJsZSA9IGZhbHNlIH0gKVxuXG4gICAgICAgICAgICAgICAgICAgIGlzRHJhZ2dpbmcgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NYICAgPSBmZXZlbnQucG9pbnRlci54XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NZICAgPSBmZXZlbnQucG9pbnRlci55XG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm1vdmVcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBpc0RyYWdnaW5nIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9pbnRlciAgPSBmZXZlbnQucG9pbnRlclxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uudmlld3BvcnRUcmFuc2Zvcm0gWzRdICs9IHBvaW50ZXIueCAtIGxhc3RQb3NYXG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uudmlld3BvcnRUcmFuc2Zvcm0gWzVdICs9IHBvaW50ZXIueSAtIGxhc3RQb3NZXG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsKClcblxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWCA9IHBvaW50ZXIueFxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWSA9IHBvaW50ZXIueVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTp1cFwiLCAoKSA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHBhZ2Uuc2VsZWN0aW9uID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICBwYWdlLmZvckVhY2hPYmplY3QgKCBvID0+XG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG8uc2VsZWN0YWJsZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgby5zZXRDb29yZHMoKVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgaXNEcmFnZ2luZyA9IGZhbHNlXG5cbiAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRab29tRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOndoZWVsXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ICAgPSBmZXZlbnQuZSBhcyBXaGVlbEV2ZW50XG4gICAgICAgICAgICAgICB2YXIgICBkZWx0YSAgID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgICAgICB2YXIgICB6b29tICAgID0gcGFnZS5nZXRab29tKClcbiAgICAgICAgICAgICAgICAgICAgem9vbSAgICA9IHpvb20gLSBkZWx0YSAqIDAuMDA1XG5cbiAgICAgICAgICAgICAgIGlmICh6b29tID4gOSlcbiAgICAgICAgICAgICAgICAgICAgem9vbSA9IDlcblxuICAgICAgICAgICAgICAgaWYgKHpvb20gPCAwLjUpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gPSAwLjVcblxuICAgICAgICAgICAgICAgcGFnZS56b29tVG9Qb2ludCggbmV3IGZhYnJpYy5Qb2ludCAoIGV2ZW50Lm9mZnNldFgsIGV2ZW50Lm9mZnNldFkgKSwgem9vbSApXG5cbiAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRNb3ZlT2JqZWN0ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICB2YXIgICBjbHVzdGVyICAgPSB1bmRlZmluZWQgYXMgZmFicmljLk9iamVjdCBbXVxuICAgICAgICAgIHZhciAgIHBvc2l0aW9ucyA9IHVuZGVmaW5lZCBhcyBudW1iZXIgW11bXVxuICAgICAgICAgIHZhciAgIG9yaWdpblggICA9IDBcbiAgICAgICAgICB2YXIgICBvcmlnaW5ZICAgPSAwXG5cbiAgICAgICAgICBmdW5jdGlvbiBvbl9zZWxlY3Rpb24gKGZldmVudDogZmFicmljLklFdmVudClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBmZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICAgICBjbHVzdGVyID0gdGFyZ2V0IFtcImNsdXN0ZXJcIl0gYXMgZmFicmljLk9iamVjdCBbXVxuXG4gICAgICAgICAgICAgICBpZiAoIGNsdXN0ZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgIG9yaWdpblggICA9IHRhcmdldC5sZWZ0XG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgPSB0YXJnZXQudG9wXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMgPSBbXVxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIGNsdXN0ZXIgKVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoWyBvLmxlZnQsIG8udG9wIF0pXG5cbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIChcImNyZWF0ZWRcIilcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246Y3JlYXRlZFwiLCBvbl9zZWxlY3Rpb24gKVxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjp1cGRhdGVkXCIsIG9uX3NlbGVjdGlvbiApXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJvYmplY3Q6bW92aW5nXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggY2x1c3RlciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ICAgPSBmZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICAgICBjb25zdCBvZmZzZXRYICA9IHRhcmdldC5sZWZ0IC0gb3JpZ2luWFxuICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0WSAgPSB0YXJnZXQudG9wICAtIG9yaWdpbllcblxuICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGNsdXN0ZXIubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqID0gY2x1c3RlciBbaV1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9zID0gcG9zaXRpb25zIFtpXVxuICAgICAgICAgICAgICAgICAgICBvYmouc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogcG9zIFswXSArIG9mZnNldFgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdG9wIDogcG9zIFsxXSArIG9mZnNldFlcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOmNsZWFyZWRcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2x1c3RlciA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJjbGVhcmVkXCIpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdERyYWdFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcm9wXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJEUk9QXCIsIGZldmVudCApXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcImRyYWdvdmVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJEUk9QLU9WRVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IFJhZGlhbE1lbnUgfSBmcm9tIFwiLi4vVWkvQ29tcG9uZW50L0NpcmN1bGFyLU1lbnUvaW5kZXhcIlxuaW1wb3J0IHsgQXJlYSB9IGZyb20gXCIuL0NvbXBvbmVudC9hcmVhXCJcbmltcG9ydCAqIGFzIEFzcGVjdCBmcm9tIFwiLi9Bc3BlY3QvaW5kZXhcIlxuXG5pbXBvcnQgeyBhZGRDb21tYW5kLCBydW5Db21tYW5kIH0gZnJvbSBcIi4vY29tbWFuZFwiXG5cbmV4cG9ydCBjb25zdCBhcmVhID0gICgoKSA9Plxue1xuICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggXCJjYW52YXNcIiApXG5cbiAgICAgY2FudmFzLndpZHRoICA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgICAgY2FudmFzLmhlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0XG5cbiAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmQgKCBjYW52YXMgKVxuXG4gICAgIHJldHVybiBuZXcgQXJlYSAoIGNhbnZhcyApXG59KSAoKVxuXG5leHBvcnQgY29uc3QgY29udGV4dHVhbE1lbnUgPSBuZXcgUmFkaWFsTWVudSAoe1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZTogXCJyYWRpYWwtbWVudVwiLFxuICAgICBpZDogXCJhcmVhLW1lbnVcIixcbiAgICAgYnV0dG9uczogW1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRoaW5nXCIgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUzYzg7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY2FsbGJhY2s6ICgpID0+IHsgcnVuQ29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIgKSB9IH0sIC8vIGRldGFpbHNcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1idWJibGVcIiwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlNmRkO1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSxcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1ub3RlXCIgICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlMjQ0O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZm9ybWF0X3F1b3RlXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtcGVvcGxlXCIsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTg3YztcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sIC8vIGZhY2VcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10YWdcIiAgICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlODY3O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gYm9va21hcmtfYm9yZGVyXG4gICAgIF0sXG4gICAgIHJvdGF0aW9uOiBNYXRoLlBJLzIsXG59KVxuXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBjb250ZXh0dWFsTWVudS5nZXRIdG1sICgpIClcblxuLy8gQ09NTUFORFNcblxuZXhwb3J0IHR5cGUgQXJlYUNvbW1hbmRzID1cbntcbiAgICAgXCJhZGQtc2tpbGxcIiA6ICggdGl0bGU6IHN0cmluZyApID0+IHZvaWQsXG4gICAgIFwiYWRkLXBlcnNvblwiOiAoIG5hbWU6IHN0cmluZyApID0+IHZvaWQsXG4gICAgIFwiem9vbS1leHRlbmRzXCI6ICgpID0+IHZvaWQsXG4gICAgIFwiem9vbS10b1wiOiAoIHNoYXBlOiBBc3BlY3QuU2hhcGUgKSA9PiB2b2lkLFxuICAgICBcIm9wZW4tY29udGV4dGFsLW1lbnVcIjogKCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+IHZvaWQsXG4gICAgIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIjogKCkgPT4gdm9pZCxcbn1cblxuYWRkQ29tbWFuZCAoIFwib3Blbi1jb250ZXh0YWwtbWVudVwiLCAoIHg6IG51bWJlciwgeTogbnVtYmVyICkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuc2hvdyAoIHgsIHkgKVxufSlcblxuYWRkQ29tbWFuZCAoIFwiY2xvc2UtY29udGV4dGFsLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcblxuYWRkQ29tbWFuZCAoIFwiYWRkLXNraWxsXCIsICggdGl0bGUgKSA9Plxue1xuICAgICBjb25zb2xlLmxvZyAoIFwiQWRkIHNraWxsXCIgKVxufSlcblxuYWRkQ29tbWFuZCAoIFwiYWRkLXBlcnNvblwiLCAoIG5hbWUgKSA9Plxue1xuXG59KVxuXG5hZGRDb21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiwgKCkgPT5cbntcbiAgICAgYXJlYS56b29tICgpXG59KVxuXG5hZGRDb21tYW5kICggXCJ6b29tLXRvXCIsICggc2hhcGUgKSA9Plxue1xuICAgICBhcmVhLnpvb20gKCBzaGFwZSApXG4gICAgIGFyZWEuaXNvbGF0ZSAoIHNoYXBlIClcbn0pXG5cbi8vIENMSUNLIEVWRU5UU1xuXG4vLyBhcmVhLm9uVG91Y2hPYmplY3QgPSAoIHNoYXBlICkgPT5cbi8vIHtcbi8vICAgICAgcnVuQ29tbWFuZCAoIFwiem9vbS10b1wiLCBzaGFwZSApXG4vLyB9XG5cbmFyZWEub25Eb3VibGVUb3VjaE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBpZiAoIHNoYXBlLmNvbmZpZy5vblRvdWNoICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgc2hhcGUuY29uZmlnLm9uVG91Y2ggKCBzaGFwZSApXG59XG5cbmFyZWEub25Ub3VjaEFyZWEgPSAoIHgsIHkgKSA9Plxue1xuICAgICBydW5Db21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsIHgsIHkgKVxufVxuXG4vLyBIT1ZFUiBFVkVOVFNcblxuYXJlYS5vbk92ZXJPYmplY3QgPSAoIHNoYXBlICkgPT5cbntcbiAgICAgc2hhcGUuaG92ZXIgKCB0cnVlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cblxuYXJlYS5vbk91dE9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIGZhbHNlIClcbiAgICAgYXJlYS5mY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbn1cbiIsIlxuZXhwb3J0ICogZnJvbSBcIi4vY29uZmlnXCJcbmV4cG9ydCAqIGZyb20gXCIuL2NvbW1hbmRcIlxuZXhwb3J0ICogZnJvbSBcIi4vYnV0dG9uXCJcbmV4cG9ydCAqIGZyb20gXCIuL3BhbmVsXCJcbmV4cG9ydCAqIGZyb20gXCIuL21lbnVcIlxuZXhwb3J0ICogZnJvbSBcIi4vYXJlYVwiXG5leHBvcnQgKiBmcm9tIFwiLi9EYXRhL2luZGV4XCJcblxuaW1wb3J0IHsgYXJlYSwgY29udGV4dHVhbE1lbnUgfSBmcm9tIFwiLi9hcmVhXCJcbmltcG9ydCB7IHBhbmVsIH0gZnJvbSBcIi4vcGFuZWxcIlxuaW1wb3J0IHsgbWVudSB9IGZyb20gXCIuL21lbnVcIlxuaW1wb3J0IHsgb25Db21tYW5kIH0gZnJvbSBcIi4vY29tbWFuZFwiXG5cbmV4cG9ydCBmdW5jdGlvbiB3aWR0aCAoKVxue1xuICAgICByZXR1cm4gYXJlYS5mY2FudmFzLmdldFdpZHRoICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZWlnaHQgKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRIZWlnaHQgKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2ggKClcbntcbiAgICAgLy8kYXJlYS5zZXRab29tICgwLjEpXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbm9uQ29tbWFuZCAoIFwib3Blbi1tZW51XCIsICgpID0+XG57XG4gICAgIHBhbmVsLmNsb3NlICgpXG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5vbkNvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCkgPT5cbntcbiAgICAgbWVudS5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuIiwiXG5pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbFwiXG5cbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi9EYXRhL2RiXCJcbi8vaW1wb3J0IHsgZGIgYXMgRGF0YSB9IGZyb20gXCIuLi8uLi8uLi9EYXRhXCJcblxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZVwiXG5pbXBvcnQgeyAkQmFkZ2UgfSBmcm9tIFwiLi4vLi4vRGF0YS9pbmRleFwiXG5cbmV4cG9ydCB0eXBlIEJhZGdlUG9zaXRpb24gPSB7IGFuZ2xlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cblxuZXhwb3J0IGNsYXNzIEJhZGdlIGV4dGVuZHMgU2hhcGVcbntcbiAgICAgcmVhZG9ubHkgb3duZXIgPSB1bmRlZmluZWQgYXMgU2hhcGVcblxuICAgICByZWFkb25seSBwb3NpdGlvbiA9IHsgYW5nbGU6IDAsIG9mZnNldDogMCB9XG5cbiAgICAgaW5pdCAoKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIuaW5pdCAoKVxuXG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZW50aXR5ID0gZGIuZ2V0IDwkQmFkZ2U+ICggdGhpcy5jb25maWcuZGF0YSApXG5cbiAgICAgICAgICBjb25zdCB0ZXh0ID0gbmV3IGZhYnJpYy5UZXh0Ym94ICggZW50aXR5LmVtb2ppIHx8IFwiWFwiLCB7XG4gICAgICAgICAgICAgICBmb250U2l6ZTogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIG9yaWdpblggOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgb3JpZ2luWSA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBsZWZ0ICAgIDogZ3JvdXAubGVmdCxcbiAgICAgICAgICAgICAgIHRvcCAgICAgOiBncm91cC50b3AsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGdyb3VwLmFkZFdpdGhVcGRhdGUgKCB0ZXh0IClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gMjBcbiAgICAgfVxuXG4gICAgIGF0dGFjaCAoIHRhcmdldDogU2hhcGUsIHBvcyA9IHt9IGFzIEJhZGdlUG9zaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyByYW5kb20sIFBJIH0gPSBNYXRoXG5cbiAgICAgICAgICBpZiAoICEgaXNGaW5pdGUgKCBwb3MuYW5nbGUgKSApXG4gICAgICAgICAgICAgICBwb3MuYW5nbGUgPSByYW5kb20gKCkgKiBQSSAqIDJcblxuICAgICAgICAgIGlmICggISBpc0Zpbml0ZSAoIHBvcy5vZmZzZXQgKSApXG4gICAgICAgICAgICAgICBwb3Mub2Zmc2V0ID0gMC4xXG5cbiAgICAgICAgICA7KHRoaXMucG9zaXRpb24gYXMgQmFkZ2VQb3NpdGlvbikgPSB7IC4uLiBwb3MgfVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm93bmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0YXJnZXQuZ3JvdXAucmVtb3ZlICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICB0YXJnZXQuZ3JvdXAuYWRkICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICA7KHRoaXMub3duZXIgYXMgU2hhcGUpID0gdGFyZ2V0XG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVQb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBwb3NpdGlvbjogcG9zLCBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBvd25lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCB7IHJhbmRvbSwgUEksIGNvcywgc2luIH0gPSBNYXRoXG5cbiAgICAgICAgICBjb25zdCByYWQgICAgPSBwb3MuYW5nbGUgfHwgcmFuZG9tICgpICogUEkgKiAyXG4gICAgICAgICAgY29uc3QgeCAgICAgID0gc2luIChyYWQpXG4gICAgICAgICAgY29uc3QgeSAgICAgID0gY29zIChyYWQpXG4gICAgICAgICAgY29uc3QgcyAgICAgID0gb3duZXIuZGlzcGxheVNpemUgKCkgLyAyXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdHlwZW9mIHBvcy5vZmZzZXQgPT0gXCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5kaXNwbGF5U2l6ZSAoKSAqIHBvcy5vZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCkgKiAwLjFcblxuICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb24gKCB4ICogKHMgKyBvZmZzZXQpLCB5ICogKHMgKyBvZmZzZXQpIClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXhcIlxuXG5pbXBvcnQgeyBnZXQgfSBmcm9tIFwiLi4vZGJcIlxuXG5pbXBvcnQgeyBTaGFwZSwgU2hhcGVEYXRhIH0gZnJvbSBcIi4vc2hhcGVcIlxuaW1wb3J0IHsgJEdyb3VwIH0gZnJvbSBcIi4uLy4uL0RhdGEvaW5kZXhcIlxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgU2hhcGVEYXRhIDwkR3JvdXA+ID0gU2hhcGVEYXRhIDwkR3JvdXA+PiBleHRlbmRzIFNoYXBlIDwkPlxue1xuICAgICByZWFkb25seSBjaGlsZHJlbiA9IFtdIGFzIFNoYXBlIFtdXG5cbiAgICAgZGlzcGxheV9zaXplID0gMVxuXG4gICAgIGluaXQgKClcbiAgICAge1xuICAgICAgICAgIHN1cGVyLmluaXQgKClcblxuICAgICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuY29uZmlnLmRhdGFcblxuICAgICAgICAgIC8vZm9yICggY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyAoIGVudGl0eS5jaGlsZHJlbiApIClcbiAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBPYmplY3QudmFsdWVzICggZW50aXR5Lml0ZW1zICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGEgPSBnZXQgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAvL2EuaW5pdCAoKVxuICAgICAgICAgICAgICAgdGhpcy5hZGQgKCBhIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnBhY2sgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAodGhpcy5kaXNwbGF5X3NpemUgKyBjb25maWcuc2l6ZU9mZnNldCkgKiBjb25maWcuc2l6ZUZhY3RvclxuXG4gICAgICAgICAgaWYgKCBzaXplIDwgY29uZmlnLm1pblNpemUgKVxuICAgICAgICAgICAgICAgc2l6ZSA9IGNvbmZpZy5taW5TaXplXG5cbiAgICAgICAgICByZXR1cm4gc2l6ZSB8fCAxXG4gICAgIH1cblxuICAgICBhZGQgKCBjaGlsZDogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoICggY2hpbGQgKVxuXG4gICAgICAgICAgaWYgKCBncm91cCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZ3JvdXAuYWRkICggY2hpbGQuZ3JvdXAgKVxuICAgICAgICAgICAgICAgZ3JvdXAuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcGFjayAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY2hpbGRyZW4sIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW10gYXMgR2VvbWV0cnkuQ2lyY2xlIFtdXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBjIG9mIGNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gYy5ncm91cFxuICAgICAgICAgICAgICAgY29uc3QgciA9IChnLndpZHRoID4gZy5oZWlnaHQgPyBnLndpZHRoIDogZy5oZWlnaHQpIC8gMlxuICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKCB7IHg6IGcubGVmdCwgeTogZy50b3AsIHI6IHIgKyA2IH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHNpemUgPSAgR2VvbWV0cnkucGFja0VuY2xvc2UgKCBwb3NpdGlvbnMgKSAqIDJcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBjaGlsZHJlbi5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBjaGlsZHJlbiBbaV0uZ3JvdXBcbiAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwb3NpdGlvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGcubGVmdCA9IHAueFxuICAgICAgICAgICAgICAgZy50b3AgID0gcC55XG5cbiAgICAgICAgICAgICAgIGdyb3VwLmFkZCAoIGcgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZGlzcGxheV9zaXplID0gc2l6ZSArIGNvbmZpZy5zaXplT2Zmc2V0XG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVNpemUgKClcbiAgICAgfVxuXG59XG5cbiIsIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlXCJcblxuXG5leHBvcnQgKiBmcm9tIFwiLi9kYlwiXG5leHBvcnQgKiBmcm9tIFwiLi9HZW9tZXRyeS9nZW9tZXRyeVwiXG5leHBvcnQgKiBmcm9tIFwiLi9HZW9tZXRyeS9mYWN0b3J5XCJcbmV4cG9ydCAqIGZyb20gXCIuL0VsZW1lbnQvc2hhcGVcIlxuZXhwb3J0ICogZnJvbSBcIi4vRWxlbWVudC9ub3RlXCJcbmV4cG9ydCAqIGZyb20gXCIuL0VsZW1lbnQvYmFkZ2VcIlxuZXhwb3J0ICogZnJvbSBcIi4vRWxlbWVudC9ncm91cFwiXG5cbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi9EYXRhL2RiXCJcbmltcG9ydCB7ICBnZXQsIGRlZmluZSwgc2V0IH0gZnJvbSBcIi4vZGJcIlxuXG5pbXBvcnQgeyAkU2tpbGwgfSBmcm9tIFwiLi4vRGF0YS9pbmRleFwiXG5cbmltcG9ydCB7IFNoYXBlRGF0YSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGVcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cFwiXG5pbXBvcnQgeyBCYWRnZSB9ICAgICBmcm9tIFwiLi9FbGVtZW50L2JhZGdlXCJcblxuaW1wb3J0IHsgcnVuQ29tbWFuZCB9IGZyb20gXCIuLi9jb21tYW5kXCJcblxuZGVmaW5lICggU2hhcGUgICAgLCBcInBlcnNvblwiIClcbmRlZmluZSAoIENvbnRhaW5lciwgXCJza2lsbFwiIClcbmRlZmluZSAoIEJhZGdlICAgICwgXCJiYWRnZVwiIClcblxuc2V0IDxTaGFwZURhdGE+ICh7XG4gICAgIHR5cGUgICA6IFwicGVyc29uXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhICAgOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGUgIDogXCJjaXJjbGVcIixcblxuICAgICB4OiAwLFxuICAgICB5OiAwLFxuXG4gICAgIG1pblNpemUgICAgOiAzMCxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBib3JkZXJDb2xvciAgICAgOiBcIiMwMGMwYWFcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogNCxcbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuXG4gICAgIG9uQ3JlYXRlICAgOiAoIHBlcnNvbiwgYXNwZWN0ICkgPT5cbiAgICAge1xuICAgICAgICAgIGFzcGVjdC5zZXRCYWNrZ3JvdW5kICh7XG4gICAgICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHBlcnNvbi5hdmF0YXIsXG4gICAgICAgICAgICAgICBzaGFwZTogcGVyc29uLmlzQ3B0YWluID8gXCJzcXVhcmVcIiA6IFwiY2lyY2xlXCIsXG4gICAgICAgICAgfSBhcyBhbnkpXG4gICAgIH0sXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2g6IHVuZGVmaW5lZCxcbn0pXG5cbnNldCA8U2hhcGVEYXRhPiAoe1xuICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGU6IFwiY2lyY2xlXCIsXG4gICAgIHg6IDAsXG4gICAgIHk6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjZjFiYzMxXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDgsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwiI0ZGRkZGRlwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuICAgICBtaW5TaXplICAgICAgICAgOiA1MCxcbiAgICAgc2l6ZU9mZnNldCAgICAgIDogMTAsXG4gICAgIHNpemVGYWN0b3IgICAgICA6IDEsXG5cbiAgICAgb25DcmVhdGUgKCBza2lsbCwgYXNwZWN0IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSBkYi5nZXQgKHtcbiAgICAgICAgICAgICAgIHR5cGU6IFwiYmFkZ2VcIixcbiAgICAgICAgICAgICAgIGlkICA6IHNraWxsLmljb24sXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGNvbnN0IGJhZGdlID0gZ2V0IDxCYWRnZT4gKCBkYXRhIClcblxuICAgICAgICAgIC8vYmFkZ2UuaW5pdCAoKVxuICAgICAgICAgIGJhZGdlLmF0dGFjaCAoIGFzcGVjdCApXG4gICAgIH0sXG5cbiAgICAgb25Ub3VjaCAoIHNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHNraWxsID0gZGIuZ2V0IDwkU2tpbGw+ICh7XG4gICAgICAgICAgICAgICB0eXBlOiBzaGFwZS5jb25maWcudHlwZSxcbiAgICAgICAgICAgICAgIGlkICA6IHNoYXBlLmNvbmZpZy5pZFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBydW5Db21tYW5kICggXCJvcGVuLWluZm9zLXBhbmVsXCIsIHNraWxsIClcbiAgICAgfSxcblxuICAgICBvbkRlbGV0ZTogdW5kZWZpbmVkXG59KVxuXG5zZXQgPFNoYXBlRGF0YT4gKHtcbiAgICAgdHlwZSAgIDogXCJiYWRnZVwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgZGF0YTogdW5kZWZpbmVkLFxuXG4gICAgIHggICAgICAgICA6IDAsXG4gICAgIHkgICAgICAgICA6IDAsXG4gICAgIG1pblNpemUgICA6IDEsXG4gICAgIHNpemVGYWN0b3I6IDEsXG4gICAgIHNpemVPZmZzZXQ6IDAsXG5cbiAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCJncmF5XCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDAsXG5cbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuXG4gICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgb25EZWxldGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvblRvdWNoICAgICAgICAgOiB1bmRlZmluZWQsXG59KVxuIiwiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJmYWtlclwiIC8+XG5kZWNsYXJlIGNvbnN0IGZha2VyOiBGYWtlci5GYWtlclN0YXRpY1xuXG5pbXBvcnQgXCIuLi9VaVwiXG5pbXBvcnQgXCIuLi9BcHBsaWNhdGlvblwiXG5pbXBvcnQgXCIuLi9BcHBsaWNhdGlvbi9Bc3BlY3RcIlxuXG4vL2ltcG9ydCAqIGFzIGZha2VyIGZyb20gXCJmYWtlclwiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vQXBwbGljYXRpb24vRGF0YS9kYi5qc1wiXG5pbXBvcnQgKiBhcyBBcHBsaWNhdGlvbiBmcm9tIFwiLi4vQXBwbGljYXRpb24vaW5kZXhcIlxuaW1wb3J0IHsgJFBlcnNvbiwgJFNraWxsIH0gZnJvbSBcIi4uL0FwcGxpY2F0aW9uL2luZGV4XCJcblxuY29uc3QgcmFuZG9tSW50ID0gKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikgPT5cbntcbiAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG59XG5cbmNvbnN0IGFyZWEgPSBBcHBsaWNhdGlvbi5hcmVhXG5jb25zdCB2aWV3ID0gYXJlYS5jcmVhdGVWaWV3ICggXCJjb21ww6l0YW5jZXNcIiApXG5hcmVhLnVzZSAoIHZpZXcgKVxuXG4vLyBQZXJzb25cblxuZm9yICggdmFyIGkgPSAxIDsgaSA8PSAyMCA7IGkrKyApXG57XG4gICAgIGRiLnNldCA8JFBlcnNvbj4gKHtcbiAgICAgICAgICB0eXBlICAgICA6IFwicGVyc29uXCIsXG4gICAgICAgICAgaWQgICAgICAgOiBcInVzZXJcIiArIGksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2YgKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsIDMpID09IDEsXG4gICAgIH0pXG5cbiAgICAgZGIuc2V0IDwkUGVyc29uPiAoe1xuICAgICAgICAgIHR5cGUgICAgIDogXCJwZXJzb25cIixcbiAgICAgICAgICBpZCAgICAgICA6IFwidXNlclwiICsgKDIwICsgaSksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2ggKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsIDMpID09IDEsXG4gICAgIH0pXG5cbiAgICAgLy8gYXJlYS5hZGQgKCBcInBlcnNvblwiLCBcInVzZXJcIiArIGkgKVxuICAgICAvLyBhcmVhLmFkZCAoIFwicGVyc29uXCIsIFwidXNlclwiICsgKGkgKyAyMCkgKVxufVxuXG4vLyBCYWRnZXNcblxuLy8gaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2RyaXZlL2ZvbGRlcnMvMUt3V2w5R19BOHY5MU5MWEFwalpHSENmbnhfbW5mTUU0XG4vLyBodHRwczovL3JlY29ubmFpdHJlLm9wZW5yZWNvZ25pdGlvbi5vcmcvcmVzc291cmNlcy9cbi8vIGh0dHBzOi8vd3d3LmxldHVkaWFudC5mci9lZHVjcHJvcy9hY3R1YWxpdGUvbGVzLW9wZW4tYmFkZ2VzLXVuLWNvbXBsZW1lbnQtYXV4LWRpcGxvbWVzLXVuaXZlcnNpdGFpcmVzLmh0bWxcblxuLy8gaHR0cHM6Ly93d3cuZWNob3NjaWVuY2VzLW5vcm1hbmRpZS5mci9jb21tdW5hdXRlcy9sZS1kb21lL2FydGljbGVzL2JhZGdlLWRvbWVcblxuY29uc3QgYmFkZ2VQcmVzZXRzID0geyAvLyBQYXJ0aWFsIDwkQmFkZ2U+XG4gICAgIGRlZmF1bHQgICAgICAgOiB7IGlkOiBcImRlZmF1bHRcIiAgICAgICwgZW1vamk6IFwi8J+mgVwiIH0sXG4gICAgIGhhdCAgICAgICAgICAgOiB7IGlkOiBcImhhdFwiICAgICAgICAgICwgZW1vamk6IFwi8J+OqVwiIH0sXG4gICAgIHN0YXIgICAgICAgICAgOiB7IGlkOiBcInN0YXJcIiAgICAgICAgICwgZW1vamk6IFwi4q2QXCIgfSxcbiAgICAgY2xvdGhlcyAgICAgICA6IHsgaWQ6IFwiY2xvdGhlc1wiICAgICAgLCBlbW9qaTogXCLwn5GVXCIgfSxcbiAgICAgZWNvbG9neSAgICAgICA6IHsgaWQ6IFwiZWNvbG9neVwiICAgICAgLCBlbW9qaTogXCLwn5KnXCIgfSxcbiAgICAgcHJvZ3JhbW1pbmcgICA6IHsgaWQ6IFwicHJvZ3JhbW1pbmdcIiAgLCBlbW9qaTogXCLwn5K+XCIgfSxcbiAgICAgY29tbXVuaWNhdGlvbiA6IHsgaWQ6IFwiY29tbXVuaWNhdGlvblwiLCBlbW9qaTogXCLwn5OiXCIgfSxcbiAgICAgY29uc3RydWN0aW9uICA6IHsgaWQ6IFwiY29uc3RydWN0aW9uXCIgLCBlbW9qaTogXCLwn5SoXCIgfSxcbiAgICAgYmlvbG9neSAgICAgICA6IHsgaWQ6IFwiYmlvbG9neVwiICAgICAgLCBlbW9qaTogXCLwn5SsXCIgfSxcbiAgICAgcm9ib3RpYyAgICAgICA6IHsgaWQ6IFwicm9ib3RpY1wiICAgICAgLCBlbW9qaTogXCLwn6SWXCIgfSxcbiAgICAgZ2FtZSAgICAgICAgICA6IHsgaWQ6IFwiZ2FtZVwiICAgICAgICAgLCBlbW9qaTogXCLwn6ShXCIgfSxcbiAgICAgbXVzaWMgICAgICAgICA6IHsgaWQ6IFwibXVzaWNcIiAgICAgICAgLCBlbW9qaTogXCLwn6WBXCIgfSxcbiAgICAgbGlvbiAgICAgICAgICA6IHsgaWQ6IFwibGlvblwiICAgICAgICAgLCBlbW9qaTogXCLwn6aBXCIgfSxcbiAgICAgdm9sdGFnZSAgICAgICA6IHsgaWQ6IFwidm9sdGFnZVwiICAgICAgLCBlbW9qaTogXCLimqFcIiB9LFxufVxuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG4gICAgIGRiLnNldCAoeyBjb250ZXh0OiBcImNvbmNlcHQtZGF0YVwiLCB0eXBlOiBcImJhZGdlXCIsIC4uLiBiYWRnZVByZXNldHMgW25hbWVdIH0pXG5cbi8vIFNraWxsc1xuXG5jb25zdCBwZXJzb25fY291bnQgPSBkYi5jb3VudCAoIFwicGVyc29uXCIgKVxuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG57XG4gICAgIGNvbnN0IHBlb3BsZSA9IFtdIGFzICRQZXJzb24gW11cblxuICAgICBmb3IgKCB2YXIgaiA9IHJhbmRvbUludCAoIDAsIDYgKSA7IGogPiAwIDsgai0tIClcbiAgICAgICAgICBwZW9wbGUucHVzaCAoIGRiLmdldCA8JFBlcnNvbj4gKHsgdHlwZTogXCJwZXJzb25cIiwgaWQ6IFwidXNlclwiICsgcmFuZG9tSW50ICggMSwgcGVyc29uX2NvdW50ICkgfSkgKVxuXG4gICAgIGRiLnNldCA8JFNraWxsPiAoe1xuICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1kYXRhXCIsXG4gICAgICAgICAgdHlwZSAgIDogXCJza2lsbFwiLFxuICAgICAgICAgIGlkICAgICA6IG5hbWUsXG4gICAgICAgICAgaWNvbiAgIDogbmFtZSxcbiAgICAgICAgICBpdGVtcyAgOiBwZW9wbGVcbiAgICAgfSlcblxufVxuXG4vL1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG4gICAgIGFyZWEuYWRkICggXCJza2lsbFwiLCBuYW1lIClcblxuLy8gTm90ZXNcblxuLy8gY29uc3Qgbm90ZSA9ICBuZXcgQi5Ob3RlICh7XG4vLyAgICAgIHRleHQ6IFwiQSBub3RlIC4uLlwiLFxuLy8gfSlcbi8vIGFyZWEuYWRkICggQXNwZWN0LmNyZWF0ZSAoIG5vdGUgKSApXG5cblxuYXJlYS5wYWNrICgpXG5hcmVhLnpvb20gKClcblxuXG4vLyBDbHVzdGVyIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gY29uc3QgdDEgPSBuZXcgZmFicmljLlRleHRib3ggKCBcIkVkaXRhYmxlID9cIiwge1xuLy8gICAgICB0b3A6IDUwLFxuLy8gICAgICBsZWZ0OiAzMDAsXG4vLyAgICAgIGZvbnRTaXplOiAzMCxcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgZWRpdGFibGU6IHRydWUsXG4vLyAgICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4vLyAgICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG4vLyB9KVxuLy8gY29uc3QgcjEgPSBuZXcgZmFicmljLlJlY3QgKHtcbi8vICAgICAgdG9wICAgOiAwLFxuLy8gICAgICBsZWZ0ICA6IDMwMCxcbi8vICAgICAgd2lkdGggOiA1MCxcbi8vICAgICAgaGVpZ2h0OiA1MCxcbi8vICAgICAgZmlsbCAgOiBcImJsdWVcIixcbi8vICAgICAgc2VsZWN0YWJsZTogdHJ1ZSxcbi8vICAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbi8vICAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbi8vIH0pXG4vLyAkYXBwLl9sYXlvdXQuYXJlYS5hZGQgKHQxKVxuLy8gJGFwcC5fbGF5b3V0LmFyZWEuYWRkIChyMSlcbi8vIHQxW1wiY2x1c3RlclwiXSA9IFsgcjEgXVxuLy8gcjFbXCJjbHVzdGVyXCJdID0gWyB0MSBdXG5cbiJdLCJuYW1lcyI6WyJkZWZhdWx0Q29uZmlnIiwiZHJhZ2dhYmxlIiwiVWkuZHJhZ2dhYmxlIiwiTm9kZSIsIkNzcy5nZXRVbml0IiwiVWkuc3dpcGVhYmxlIiwidG9Qb3NpdGlvbiIsImRiIiwidUV2ZW50LmNyZWF0ZSIsIkNPTlRFWFQiLCJub3JtYWxpemUiLCJnZXQiLCJkYi5nZXQiLCJ1aS5nZXQiLCJ1aS5kZWZpbmUiLCJTdmcuY3JlYXRlU3ZnU2hhcGUiLCJGYWN0b3J5IiwiZmFicmljLkdyb3VwIiwiZmFicmljLkNpcmNsZSIsImZhYnJpYy5Qb2x5Z29uIiwiZmFicmljLlJlY3QiLCJmYWJyaWMuVGV4dCIsImZhYnJpYy5UZXh0Ym94IiwiZmFicmljLlBhdGgiLCJHZW9tZXRyeSIsImZhYnJpYy51dGlsIiwiZmFicmljLlBhdHRlcm4iLCJmYWN0b3J5IiwiZmFicmljLk9iamVjdCIsInNldCIsImRlZmluZSIsImZhYnJpYy5DYW52YXMiLCJhc3BlY3QuZ2V0IiwiR2VvbWV0cnkucGFja0VuY2xvc2UiLCJmYWJyaWMuUG9pbnQiLCJDb250YWluZXIiLCJhcmVhIiwiQXBwbGljYXRpb24uYXJlYSIsImRiLnNldCIsImRiLmNvdW50Il0sIm1hcHBpbmdzIjoiOzs7SUErQkE7SUFFQSxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBSSxNQUFNLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFBO0lBQ3hELE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUE7SUFFM0QsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsVUFBVyxLQUFLO1FBRXhDLE1BQU0sQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUUsQ0FBQTtRQUNuQyxPQUFPLElBQUksQ0FBQTtJQUNYLENBQUMsQ0FBQTtJQUVELE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVcsUUFBZ0I7UUFFakQsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFHLElBQUksQ0FBQyxLQUFLLENBQUcsUUFBUSxDQUFFLENBQUUsQ0FBQTtRQUVoRCxJQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUcsS0FBSyxDQUFFLEVBQzNCO1lBQ0ssS0FBSyxHQUFHLFFBQVEsQ0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUcsSUFBSSxDQUFFLENBQUcsUUFBUSxDQUFFLENBQUUsQ0FBQTtZQUVsRSxJQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUcsS0FBSyxDQUFFO2dCQUN0QixLQUFLLEdBQUcsQ0FBQyxDQUFBO1NBQ2xCO1FBRUQsT0FBTyxL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RSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFFakMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDUixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFFWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ2hDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ3JDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBRXJDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ3RCLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFFLEdBQUcsRUFBRSxFQUM1QyxFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUssRUFBRSxFQUMvQixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFFL0IsQ0FBQyxHQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQzFCLENBQUMsR0FB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
