(function () {
    'use strict';

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

    class Database extends DataTree {
        has() {
            if (arguments.length == 0)
                return;
            if (arguments.length == 1) {
                const o = arguments[0];
                return super.near([o.context, o.type, o.id]) !== undefined;
            }
            else {
                return super.near(arguments) !== undefined;
            }
        }
        count() {
            if (arguments.length == 0)
                return;
            if (arguments.length == 1) {
                const o = arguments[0];
                return super.count([o.context, o.type, o.id]);
            }
            else {
                return super.count(arguments);
            }
        }
        set() {
            if (arguments.length == 0)
                return;
            if (arguments.length == 1) {
                const o = arguments[0];
                return super.set([o.context, o.type, o.id], o);
            }
            else {
                return super.set(arguments[0], arguments[1]);
            }
        }
        get() {
            if (arguments.length == 0)
                return;
            const result = {};
            if (arguments.length == 1) {
                const o = arguments[0];
                super.walk([o.context, o.type, o.id], data => {
                    Object.assign(result, data);
                });
                return Object.assign(result, o);
            }
            else {
                super.walk(arguments, data => {
                    Object.assign(result, data);
                });
                return Object.assign(result, {
                    context: arguments[0],
                    type: arguments[1],
                    id: arguments[2],
                });
            }
        }
    }

    class Factory {
        constructor(db) {
            this.db = db;
            this.ctors = new DataTree();
            this.insts = new DataTree();
        }
        getPath() {
            if (arguments.length == 0)
                throw new Error("Null argument");
            const arg = arguments[0];
            if (typeof arg == "string")
                return arguments;
            if (Array.isArray(arg))
                return arg.flat();
            return [arg.context, arg.type, arg.id];
        }
        inStock() {
            return this.insts.has(this.getPath(...arguments));
        }
        _inStock(path) {
            return this.insts.has(path);
        }
        define(ctor, ...rest) {
            var path = this.getPath(...rest);
            if (this.ctors.has(path))
                throw "Bad argument";
            return this.ctors.set(path, ctor);
        }
        _define(ctor, path) {
            if (this.ctors.has(path))
                throw "Bad argument";
            return this.ctors.set(path, ctor);
        }
        pick() {
            var path = this.getPath(...arguments);
            if (this.insts.has(path))
                return this.insts.get(path);
            throw "Bad argument";
        }
        _pick(path) {
            if (this.insts.has(path))
                return this.insts.get(path);
            throw "Bad argument";
        }
        make() {
            var path = this.getPath(...arguments);
            const arg = arguments[0];
            if (typeof arg == "object" && !Array.isArray(arg))
                return this._make(path, arg);
            else
                return this._make(path);
        }
        _make(path, data) {
            if (this.insts.has(path))
                return this.insts.get(path);
            const ctor = this.ctors.near(path);
            if (ctor == undefined)
                throw "Bad argument";
            const tmp = this.db.get(...path);
            data = data == undefined
                ? tmp
                : Object.assign(tmp, data);
            return this.insts.set(path, new ctor(data));
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

    function defaultConfig() {
        return {
            handles: [],
            minVelocity: 0,
            maxVelocity: 1,
            onStartDrag: () => { },
            onDrag: () => { },
            onStopDrag: () => true,
            onEndAnimation: () => { },
            velocityFactor: (window.innerHeight < window.innerWidth
                ? window.innerHeight : window.innerWidth) / 2,
        };
    }
    var is_drag = false;
    var pointer;
    // https://gist.github.com/gre/1650294
    var EasingFunctions = {
        linear: (t) => t,
        easeInQuad: (t) => t * t,
        easeOutQuad: (t) => t * (2 - t),
        easeInOutQuad: (t) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: (t) => t * t * t,
        easeOutCubic: (t) => (--t) * t * t + 1,
        easeInOutCubic: (t) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInQuart: (t) => t * t * t * t,
        easeOutQuart: (t) => 1 - (--t) * t * t * t,
        easeInOutQuart: (t) => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        easeInQuint: (t) => t * t * t * t * t,
        easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
        easeInOutQuint: (t) => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
    };
    function draggable(options) {
        const config = defaultConfig();
        var is_active = false;
        var is_animate = false;
        var current_event;
        var start_time = 0;
        var start_x = 0;
        var start_y = 0;
        var velocity_delay = 500;
        var velocity_x;
        var velocity_y;
        var current_animation = -1;
        updateConfig(options);
        function updateConfig(options) {
            if (is_drag) {
                return;
            }
            if (navigator.maxTouchPoints > 0)
                document.body.style.touchAction = "none";
            disableEvents();
            Object.assign(config, options);
            enableEvents();
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
            enableEvents();
            is_active = true;
        }
        function desactivate() {
            disableEvents();
            is_active = false;
        }
        return {
            updateConfig,
            addHandles,
            isActive: () => is_active,
            activate,
            desactivate,
        };
        function enableEvents() {
            for (const h of config.handles)
                h.addEventListener("pointerdown", onStart, { passive: true });
        }
        function disableEvents() {
            for (const h of config.handles)
                h.removeEventListener("pointerdown", onStart);
        }
        function onStart(event) {
            if (is_drag) {
                console.warn("Tentative de démarrage des événements "
                    + "\"draggable \" déjà en cours.");
                return;
            }
            if (is_animate) {
                stopVelocityFrame();
            }
            pointer = event.touches
                ? event.touches[0]
                : event;
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onEnd);
            disableEvents();
            current_animation = window.requestAnimationFrame(onAnimationStart);
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
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onEnd);
            enableEvents();
            is_drag = false;
        }
        function onAnimationStart(now) {
            start_x = pointer.clientX;
            start_y = pointer.clientY;
            start_time = now;
            current_event = {
                delay: 0,
                x: 0,
                y: 0,
                offsetX: 0,
                offsetY: 0,
                targetX: 0,
                targetY: 0,
            };
            config.onStartDrag();
            current_animation = window.requestAnimationFrame(onAnimationFrame);
        }
        function onAnimationFrame(now) {
            const { velocityFactor } = config;
            const x = pointer.clientX - start_x;
            const y = start_y - pointer.clientY;
            const delay = now - start_time;
            const offsetDelay = delay - current_event.delay;
            const offsetX = x - current_event.x;
            const offsetY = y - current_event.y;
            current_event = {
                delay,
                x,
                y,
                targetX: x,
                targetY: y,
                offsetX,
                offsetY,
            };
            if (is_drag) {
                config.onDrag(current_event);
                current_animation = window.requestAnimationFrame(onAnimationFrame);
            }
            else {
                start_time = now;
                start_x = x;
                start_y = y;
                velocity_x = velocityFactor * norm(offsetX / offsetDelay);
                velocity_y = velocityFactor * norm(offsetY / offsetDelay);
                current_event.targetX += velocity_x;
                current_event.targetY += velocity_y;
                if (config.onStopDrag(current_event) === true) {
                    is_animate = true;
                    current_animation = window.requestAnimationFrame(onVelocityFrame);
                }
            }
            function norm(value) {
                if (value < -1)
                    return -1;
                if (value > 1)
                    return 1;
                return value;
            }
        }
        function onVelocityFrame(now) {
            const delay = now - start_time;
            const t = delay >= velocity_delay
                ? 1
                : delay / velocity_delay;
            const factor = EasingFunctions.easeOutQuart(t);
            const offsetX = velocity_x * factor;
            const offsetY = velocity_y * factor;
            current_event.x = start_x + offsetX;
            current_event.y = start_y + offsetY;
            current_event.offsetX = velocity_x - offsetX;
            current_event.offsetY = velocity_y - offsetY;
            config.onDrag(current_event);
            if (t == 1) {
                is_animate = false;
                config.onEndAnimation(current_event);
                return;
            }
            current_animation = window.requestAnimationFrame(onVelocityFrame);
        }
        function stopVelocityFrame() {
            is_animate = false;
            window.cancelAnimationFrame(current_animation);
            config.onEndAnimation(current_event);
        }
    }

    /*declare global{

         interface Window
         {
              on: Window ["addEventListener"]
              off: Window ["removeEventListener"]
         }

         interface Element
         {
              css ( properties: Partial <ExtendedCSSStyleDeclaration> ): this

              cssInt   ( property: string ): number
              cssFloat ( property: string ): number

              on : HTMLElement ["addEventListener"]
              off: HTMLElement ["removeEventListener"]
              $  : HTMLElement ["querySelector"]
              $$ : HTMLElement ["querySelectorAll"]
         }
    }

    Window.prototype.on  = Window.prototype.addEventListener
    Window.prototype.off = Window.prototype.removeEventListener

    Element.prototype.css = function ( props )
    {
    Object.assign ( this.style, props )
    return this
    }

    Element.prototype.cssInt = function ( property: string )
    {
         var value = parseInt ( this.style [ property ] )

         if ( Number.isNaN ( value ) )
         {
              value = parseInt ( window.getComputedStyle ( this ) [ property ] )

              if ( Number.isNaN ( value ) )
                   value = 0
         }

         return value
    }

    Element.prototype.cssFloat = function ( property: string )
    {
         var value = parseFloat ( this.style [ property ] )

         if ( Number.isNaN ( value ) )
         {
              value = parseFloat ( window.getComputedStyle ( this ) [ property ] )

              if ( Number.isNaN ( value ) )
                   value = 0
         }

         return value
    }

    Element.prototype.on  = Element.prototype.addEventListener

    Element.prototype.off = Element.prototype.removeEventListener

    Element.prototype.$   = Element.prototype.querySelector

    Element.prototype.$$  = Element.prototype.querySelectorAll


    Element.prototype.cssInt = function ( property: string )
    {
         var value = parseInt ( this.style [ property ] )

         if ( Number.isNaN ( value ) )
         {
              const style = window.getComputedStyle ( this )

              value = parseInt ( style [ property ] )

              if ( Number.isNaN ( value ) )
                   value = 0
         }

         return value
    }*/
    function cssFloat(el, property) {
        var value = parseFloat(el.style[property]);
        if (Number.isNaN(value)) {
            value = parseFloat(window.getComputedStyle(el)[property]);
            if (Number.isNaN(value))
                value = 0;
        }
        return value;
    }
    function cssInt(el, property) {
        var value = parseInt(el.style[property]);
        if (Number.isNaN(value)) {
            const style = window.getComputedStyle(el);
            value = parseInt(style[property]);
            if (Number.isNaN(value))
                value = 0;
        }
        return value;
    }

    function defaultConfig$1() {
        return {
            handles: [],
            property: "height",
            open: false,
            near: 40,
            delay: 250,
            minSize: 0,
            maxSize: window.innerHeight,
            unit: "px",
            direction: "tb",
            onBeforeOpen: () => { },
            onAfterOpen: () => { },
            onBeforeClose: () => { },
            onAfterClose: () => { },
        };
    }
    const toSign = {
        lr: 1,
        rl: -1,
        tb: -1,
        bt: 1,
    };
    const toProperty = {
        lr: "width",
        rl: "width",
        tb: "height",
        bt: "height",
    };
    function expandable(element, options = {}) {
        const config = defaultConfig$1();
        var is_open;
        var is_vertical;
        var sign;
        var unit;
        var cb;
        var minSize;
        var maxSize;
        var start_size = 0;
        var open_size = 100;
        const draggable$1 = draggable({
            handles: [],
            onStartDrag: onStartDrag,
            onStopDrag: onStopDrag,
            onEndAnimation: onEndAnimation,
        });
        updateConfig(options);
        function updateConfig(options = {}) {
            if (options.property == undefined && options.direction != undefined)
                options.property = toProperty[options.direction];
            Object.assign(config, options);
            is_open = config.open;
            sign = toSign[config.direction];
            unit = config.unit;
            is_vertical = config.direction == "bt" || config.direction == "tb" ? true : false;
            minSize = config.minSize;
            maxSize = config.maxSize;
            element.classList.remove(is_vertical ? "horizontal" : "vertical");
            element.classList.add(is_vertical ? "vertical" : "horizontal");
            draggable$1.updateConfig({
                handles: config.handles,
                onDrag: is_vertical ? onDragVertical : onDragHorizontal,
            });
        }
        function size() {
            return is_open ? cssInt(element, config.property) : 0;
        }
        function toggle() {
            if (is_open)
                close();
            else
                open();
        }
        function open() {
            config.onBeforeOpen();
            element.classList.add("animate");
            element.classList.replace("close", "open");
            if (cb)
                onTransitionEnd();
            cb = config.onAfterOpen;
            element.addEventListener("transitionend", () => onTransitionEnd);
            element.style[config.property] = open_size + unit;
            is_open = true;
        }
        function close() {
            config.onBeforeClose();
            open_size = size();
            element.classList.add("animate");
            element.classList.replace("open", "close");
            if (cb)
                onTransitionEnd();
            cb = config.onAfterClose;
            element.addEventListener("transitionend", onTransitionEnd);
            element.style[config.property] = "0" + unit;
            is_open = false;
        }
        return {
            updateConfig,
            open,
            close,
            toggle,
            isOpen: () => is_open,
            isClose: () => !is_open,
            isVertical: () => is_vertical,
            isActive: () => draggable$1.isActive(),
            activate: () => draggable$1.activate(),
            desactivate: () => draggable$1.desactivate(),
        };
        function onTransitionEnd() {
            if (cb)
                cb();
            element.removeEventListener("transitionend", () => onTransitionEnd);
            cb = null;
        }
        function onStartDrag() {
            start_size = size();
            element.classList.remove("animate");
        }
        function onDragVertical(event) {
            console.log(minSize, event.y, maxSize);
            console.log(clamp(start_size + sign * event.y) + unit);
            element.style[config.property] = clamp(start_size + sign * event.y) + unit;
        }
        function onDragHorizontal(event) {
            element.style[config.property] = clamp(start_size + sign * event.x) + unit;
        }
        function onStopDrag(event) {
            var is_moved = is_vertical ? sign * event.y > config.near
                : sign * event.x > config.near;
            if ((is_moved == false) && event.delay <= config.delay) {
                toggle();
                return false;
            }
            const target_size = clamp(is_vertical ? start_size + sign * event.targetY
                : start_size + sign * event.targetX);
            if (target_size <= config.near) {
                close();
                return false;
            }
            return true;
        }
        function onEndAnimation() {
            open_size = cssInt(element, config.property);
            open();
        }
        function clamp(v) {
            if (v < minSize)
                return minSize;
            if (v > maxSize)
                return maxSize;
            return v;
        }
    }

    function defaultConfig$2() {
        return {
            handles: [],
            direction: "lr",
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
            handles: [],
            onStartDrag,
            onStopDrag,
        });
        element.classList.add("swipeable");
        updateConfig(options);
        function updateConfig(options) {
            Object.assign(config, options);
            is_vertical = config.direction == "bt" || config.direction == "tb";
            if (options.porperty == undefined)
                config.porperty = is_vertical ? "top" : "left";
            // switch ( config.porperty )
            // {
            // case "top": case "bottom": case "y": is_vertical = true  ; break
            // case "left": case "right": case "x": is_vertical = false ; break
            // default: debugger ; return
            // }
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
            return cssFloat(element, prop);
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
                    h.addEventListener("wheel", onWheel, { passive: true });
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
                ? event.y //+ event.velocityY
                : event.x; //+ event.velocityX
            element.style[prop] = clamp(start_position + offset) + config.units;
            return true;
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

    class Commands {
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
                : this.events[name] = create();
            callbacks(callback);
        }
        remove(key) {
            delete this.db[key];
        }
    }
    const current = new Commands();

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
        makeHtml() {
            throw new Error("Not implemented");
        }
        makeSvg() {
            throw new Error("Not implemented");
        }
        makeFabric() {
            throw new Error("Not implemented");
        }
        onCreateHtml() {
        }
        onCreateSvg() {
        }
        onCreateFabric() {
        }
    }

    /// <reference path="../Data/index.ts" />
    const CONTEXT = "concept-ui";
    const db = new Database();
    const factory = new Factory(db);
    const inStock = function () {
        const arg = arguments.length == 1
            ? normalize(arguments[0])
            : normalize([...arguments]);
        const path = factory.getPath(arg);
        return factory._inStock(path);
    };
    const pick = function (...rest) {
        const arg = arguments.length == 1
            ? normalize(arguments[0])
            : normalize([...arguments]);
        const path = factory.getPath(arg);
        return factory._pick(path);
    };
    const make = function () {
        const arg = arguments.length == 1
            ? normalize(arguments[0])
            : normalize([...arguments]);
        const path = factory.getPath(arg);
        if (isNode(arg))
            var data = arg;
        return factory._make(path, data);
    };
    const set = function () {
        const arg = normalize(arguments[0]);
        if (arguments.length == 1)
            db.set(arg);
        else
            db.set(arg, normalize(arguments[1]));
    };
    const define = function (ctor, ...rest) {
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

    class Phantom extends Component {
        getHtml() {
            if (this.container == undefined) {
                this.container = document.createElement("div");
                this.container.innerHTML = this.data.content;
            }
            return this.container.childNodes;
        }
    }

    class Container extends Component {
        constructor(data) {
            super(data);
            this.children = {};
            data = this.data;
            const children = data.children;
            if (children) {
                for (const child of children) {
                    if (!inStock(child))
                        make(child);
                }
            }
            this.is_vertical = data.direction == "bt" || data.direction == "tb";
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
            if (this.container != undefined)
                return [this.container];
            const elements = super.getHtml();
            const container = this.container;
            const data = this.data;
            const children = this.children;
            if (this.is_vertical)
                container.classList.add("vertical");
            else
                container.classList.remove("vertical");
            if (this.slot == undefined)
                this.slot = container;
            const slot = this.slot;
            if (data.children) {
                const new_children = [];
                for (const child of data.children) {
                    const o = pick(child);
                    slot.append(...o.getHtml());
                    children[o.data.id] = o;
                }
                this.onChildrenAdded(new_children);
            }
            return elements;
        }
        onChildrenAdded(components) {
        }
        append(...elements) {
            if (this.container == undefined)
                this.getHtml();
            const slot = this.slot;
            const children = this.children;
            const new_child = [];
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
                    e = inStock(e)
                        ? pick(e)
                        : make(e);
                }
                children[e.data.id] = e;
                slot.append(...e.getHtml());
                new_child.push(e);
            }
            if (new_child.length > 0)
                this.onChildrenAdded(new_child);
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
            if (this.is_vertical)
                container.classList.add("vertical");
            else
                container.classList.remove("vertical");
            config.direction = value;
            this.is_vertical = value == "bt" || value == "tb";
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
    define(Block, ["block"]);

    class Button extends Component {
        getHtml() {
            if (this.container == undefined) {
                const data = this.data;
                const node = xnode("div", { class: "button" },
                    data.icon ? xnode("span", { class: "icon" }, data.icon) : null,
                    data.text ? xnode("span", { class: "text" }, data.text) : null);
                if (this.data.callback != undefined || this.data.command != undefined)
                    node.addEventListener("click", this.onTouch.bind(this));
                this.container = node;
            }
            return [this.container];
        }
        onTouch() {
            if (this.data.callback && this.data.callback() !== true)
                return;
            if (this.data.command)
                Commands.current.run(this.data.command);
        }
        onHover() {
        }
    }
    define(Button, ["button"]);

    const $default = {
        type: "button",
        id: undefined,
        icon: undefined,
    };
    set(["button"], $default);

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
    define(Slideshow, ["slideshow"]);
    define(Container, ["slide"]);

    class ListView extends Container {
        getHtml() {
            if (this.container != undefined)
                return [this.container];
            const slot = this.slot = xnode("div", { class: "list-view-slide" });
            super.getHtml();
            const container = this.container;
            container.append(slot);
            container.classList.add("list-view");
            this.swipeable = expandable(slot, {
                handles: [container],
                minSize: 0,
                maxSize: 0,
                property: this.is_vertical ? "top" : "left",
                direction: this.data.direction,
                unit: "px",
            });
            this.swipeable.activate();
            window.addEventListener("DOMContentLoaded", () => {
                this.swipeable.updateConfig({
                    minSize: -this.slideSize(),
                });
            });
            return [this.container];
        }
        onChildrenAdded(elements) {
            this.swipeable.updateConfig({
                minSize: -this.slideSize(),
                property: this.is_vertical ? "top" : "left",
                direction: this.data.direction,
            });
        }
        slideSize() {
            const { slot } = this;
            return cssFloat(slot, this.is_vertical ? "height" : "width");
        }
        swipe(offset, unit) {
            // if ( typeof offset == "string" )
            //      this.swipeable.swipe ( offset )
            // else
            //      this.swipeable.swipe ( offset, unit )
        }
    }

    /**
     *   ```pug
     *   .toolbar
     *        .toolbar-backgroung
     *        .toolbar-slide
     *             [...]
     *   ```
     */
    class Toolbar extends ListView {
        defaultConfig() {
            return Object.assign(Object.assign({}, super.defaultData()), { type: "toolbar", title: "Title ...", direction: "lr", 
                //reverse  : false,
                buttons: [] });
        }
        getHtml() {
            if (this.container != undefined)
                return [this.container];
            super.getHtml();
            if (this.data.buttons)
                this.append(...this.data.buttons);
            return [this.container];
        }
    }
    define(Toolbar, ["toolbar"]);

    function scrollableNative(options) {
        desactivate();
        return {
            activate,
            desactivate,
        };
        function activate() {
            const dir = options.direction == "bt" || options.direction == "tb"
                ? "pan-y" : "pan-x";
            for (const h of options.handles)
                h.style.touchAction = dir;
        }
        function desactivate() {
            const dir = options.direction == "bt" || options.direction == "tb"
                ? "pan-y" : "pan-x";
            for (const h of options.handles)
                h.style.touchAction = "none";
        }
    }
    function scollable(options) {
        if ("ontouchstart" in window)
            return scrollableNative(options);
        const drag = draggable({
            handles: options.handles,
            velocityFactor: 100,
            onStartDrag,
            onDrag: options.direction == "bt" || options.direction == "tb"
                ? onDragVertical
                : onDragHorizontal,
            onStopDrag: options.direction == "bt" || options.direction == "tb"
                ? onStopDragVertical
                : onStopDragHorizontal,
        });
        return {
            activate: () => { drag.activate(); }
        };
        function onStartDrag() {
            for (const h of options.handles)
                h.style.scrollBehavior = "unset";
        }
        function onDragVertical(event) {
            for (const h of options.handles)
                h.scrollBy(0, event.offsetY);
        }
        function onDragHorizontal(event) {
            for (const h of options.handles)
                h.scrollBy(event.offsetX, 0);
        }
        function onStopDragVertical(event) {
            for (const h of options.handles) {
                h.scrollBy(0, event.offsetY);
                //h.style.scrollBehavior = "smooth"
                //h.scrollBy ( 0, event.offsetY + event.velocityY )
            }
            return true;
        }
        function onStopDragHorizontal(event) {
            for (const h of options.handles) {
                h.scrollBy(event.offsetX, 0);
                //h.style.scrollBehavior = "smooth"
                //h.scrollBy ( event.offsetX + event.velocityX, 0 )
            }
            return true;
        }
    }

    const toPosition = {
        lr: "left",
        rl: "right",
        tb: "top",
        bt: "bottom",
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
        //protected expandable: ExpendableElement
        defaultData() {
            return Object.assign(Object.assign({}, super.defaultData()), { type: "panel", children: [], direction: "rl" });
        }
        getHtml() {
            if (this.container == undefined) {
                const header = xnode("div", { class: "panel-header" });
                const content = xnode("div", { class: "panel-content" });
                const container = xnode("div", { class: "panel close" },
                    header,
                    content);
                const data = this.data;
                // if ( data.hasMainButton )
                // {
                //      const btn = <span class="panel-main-button">
                //           <span class="icon">⇕</span>
                //      </span>
                //      this.main_button = btn
                //      header.append ( btn )
                // }
                if (data.header) {
                    this.header = inStock(data.header)
                        ? pick(data.header)
                        : make(data.header);
                    header.append(...this.header.getHtml());
                }
                if (data.children) {
                    //super.append ( ... data.children )
                    for (const child of data.children) {
                        this.content = inStock(child)
                            ? pick(child)
                            : make(child);
                        content.append(...this.content.getHtml());
                    }
                }
                this.container = container;
                // this.expandable = expandable ( container, {
                //      direction    : data.direction,
                //      near         : 60,
                //      handles      : Array.of ( this.main_button ),
                //      onAfterOpen  : () => {
                //           //content.style.overflow = ""
                //           content.classList.remove ( "hidden" )
                //      },
                //      onBeforeClose: () => {
                //           //content.style.overflow = "hidden"
                //           content.classList.add ( "hidden" )
                //      }
                // })
                // this.expandable.activate ()
                scollable({
                    handles: [content],
                    direction: "bt"
                })
                    .activate();
                this._header = header;
                this._content = content;
                this.container.classList.add(toPosition[data.direction]);
            }
            return [this.container];
        }
        // private onClickTab ()
        // {
        //      this.open ()
        // }
        //isOpen ()
        //{
        //     return this.expandable.isOpen ()
        //}
        //isClose ()
        //{
        //     return this.expandable.isClose ()
        //}
        setOrientation(value) {
            const { data } = this;
            this.container.classList.remove(toPosition[data.direction]);
            this.container.classList.add(toPosition[value]);
            super.setOrientation(value);
            //expandable.updateConfig ({ direction: value })
            data.direction = value;
        }
    }
    define(Panel, ["panel"]);

    class SideMenu extends Panel {
        getHtml() {
            const elements = super.getHtml();
            const data = this.data;
            const container = this.container;
            const header = this._header;
            const content = this._content;
            container.classList.replace("panel", "side-menu");
            header.classList.replace("panel-header", "side-menu-header");
            content.classList.replace("panel-content", "side-menu-content");
            if (data.hasMainButton) {
                const btn = xnode("span", { class: "side-menu-main-button" },
                    xnode("span", { class: "icon" }, "\u21D5"));
                this.main_button = btn;
                //this.container.insertAdjacentElement ( "afterbegin", btn )
                header.insertAdjacentElement("afterbegin", btn);
            }
            this.expandable = expandable(this.container, {
                direction: data.direction,
                near: 60,
                handles: Array.of(this.main_button),
                onAfterOpen: () => {
                    content.classList.remove("hidden");
                },
                onBeforeClose: () => {
                    content.classList.add("hidden");
                }
            });
            this.expandable.activate();
            return elements;
        }
        isOpen() {
            return this.expandable.isOpen();
        }
        isClose() {
            return this.expandable.isClose();
        }
        open() {
        }
        close() {
            this.expandable.close();
            return this;
        }
    }
    define(SideMenu, ["side-menu"]);

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
            const buttons = style in renderers
                ? renderers[style](def)
                : this.renderSvgCircles(def);
            svg.append(...buttons);
            for (var i = 0; i != buttons.length; i++) {
                const opt = data.buttons[i];
                if (typeof opt.callback == "function")
                    buttons[i].addEventListener("mousedown", () => opt.callback());
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

    class PersonVieweer extends Component {
        display(person) {
            const card = xnode("div", { class: "w3-card-4 person-card" },
                xnode("img", { src: person.avatar, alt: "Avatar" }),
                xnode("div", { class: "w3-container" },
                    xnode("h4", null,
                        xnode("b", null, person.firstName)),
                    xnode("label", null,
                        xnode("b", null, person.isCaptain ? "Expert" : null))));
            this.container.innerHTML = "";
            this.container.append(card);
        }
    }
    define(PersonVieweer, {
        context: "concept-ui",
        type: "person-viewer",
        id: undefined,
    });

    /// <reference path="./types.d.ts" />
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
    function getNode() {
        if (arguments.length == 0)
            return;
        if (arguments.length == 1)
            return Data.get(normalize$1(arguments[0]));
        else
            return Data.get(CONTEXT$1, ...arguments);
    }
    function setNode(node) {
        Data.set(normalize$1(node));
    }

    class SkillViewer extends Component {
        display(skill) {
            const target = xnode("div", { class: "people" });
            for (const name of skill.items) {
                const person = getNode(name);
                const card = xnode("div", { class: "w3-card-4 person-card" },
                    xnode("img", { src: person.avatar, alt: "Avatar" }),
                    xnode("div", { class: "w3-container" },
                        xnode("h4", null,
                            xnode("b", null, person.firstName)),
                        xnode("label", null,
                            xnode("b", null, person.isCaptain ? "Expert" : null))));
                target.append(card);
            }
            this.container.classList.add("container");
            this.container.innerHTML = "";
            this.container.append(xnode("h1", null, skill.id));
            this.container.append(xnode("p", null, skill.description));
            this.container.append(target);
            // https://github.com/LorDOniX/json-viewer/blob/master/src/json-viewer.js
            this.container.append(xnode("pre", null, JSON.stringify(skill, null, 3)));
        }
    }
    define(SkillViewer, {
        context: "concept-ui",
        type: "skill-viewer",
        id: undefined,
    });

    //import * as fabric from "fabric/fabric-impl.js"
    const fabric_base_obtions = {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
    };
    const Factory$1 = {
        group(def, size, opt) {
            return new fabric.Group(undefined, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size, height: size }));
        },
        // To get points of triangle, square, [panta|hexa]gon
        //
        // var a = Math.PI*2/4
        // for ( var i = 0 ; i != 4 ; i++ )
        //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )
        circle(def, size, opt) {
            return new fabric.Circle(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { radius: size / 2 }));
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
            return new fabric.Polygon(points, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { angle: 180 }));
        },
        square(def, size, opt) {
            const scale = 0.9;
            return new fabric.Rect(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size * scale, height: size * scale }));
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
            return new fabric.Polygon(points, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { angle: 180 }));
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
            return new fabric.Polygon(points, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { angle: 90 }));
        },
        text(def, size, opt) {
            return new fabric.Text("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
        },
        textbox(def, size, opt) {
            return new fabric.Textbox("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
        },
        path(def, size, opt) {
            return new fabric.Path(def.path, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { scaleX: size / 100, scaleY: size / 100 }));
        },
    };

    //import * as fabric from "fabric/fabric-impl.js"
    class Geometry$1 {
        constructor(owner) {
            this.owner = owner;
            this.config = owner.config;
            this.updateShape();
        }
        update(options) {
            Object.assign(this.config, options);
            if ("shape" in options) {
                this.updateShape();
            }
            else if ("backgroundImage" in options || "backgroundRepeat" in options) {
                this.updateBackgroundImage();
            }
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
        updateShape(shape) {
            const { config, owner } = this;
            if (arguments.length == 0)
                shape = config.shape;
            else
                config.shape = shape;
            if (owner.group != undefined && this.object != undefined)
                owner.group.remove(this.object);
            const obj = this.object
                = Factory$1[config.shape](config, owner.displaySize(), {
                    left: 0,
                    top: 0,
                    originX: "center",
                    originY: "center",
                    fill: config.backgroundColor,
                    stroke: config.borderColor,
                    strokeWidth: config.borderWidth,
                });
            owner.group.add(obj);
            obj.sendToBack();
            if (config.backgroundImage != undefined)
                this.updateBackgroundImage();
            if (obj.canvas != undefined)
                obj.canvas.requestRenderAll();
        }
        updateBackgroundImage(path) {
            if (arguments.length == 0)
                path = this.config.backgroundImage;
            else
                this.config.backgroundImage = path;
            if (typeof path == "string" && path.length > 0)
                fabric.util.loadImage(path, this.on_pattern.bind(this));
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
                this.object.canvas.renderAll();
        }
    }

    // <reference path="../../typings.d.ts" />
    class Shape {
        constructor(data) {
            this.group = undefined;
            //console.log ( "Updata here Shape.data " + data.data )
            this.background = undefined;
            this.border = undefined;
            this.config = Object.assign(Object.assign({}, this.defaultConfig()), data);
            //      this.init ()
            // }
            // init ()
            // {
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
            //group.add ( this.background.object )
            //this.background.object.sendToBack ()
            // ;(this.border as Geometry) = new Geometry ( this, this.config )
            // group.add ( this.border.object )
            group.setCoords();
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
            this.background.update(options);
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

    /// <reference path="../typings.d.ts" />
    const CONTEXT$2 = "concept-aspect";
    const db$1 = new Database();
    const factory$1 = new Factory(db$1);
    const ASPECT = Symbol.for("ASPECT");
    /**
     * Assigne si besoin le contexte "aspect" au noeud
     */
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
    function getAspect(obj) {
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
        // shape.events = arguments.events
        // Object.assign ( shape, events )
        //shape.init ()
        shape.group[ASPECT] = shape;
        if (shape.config.onCreate)
            shape.config.onCreate(shape.config.data, shape);
        return shape;
    }
    function setAspect(node) {
        db$1.set(normalize$2(node));
    }
    function defineAspect(ctor, type) {
        factory$1._define(ctor, [CONTEXT$2, type]);
    }

    class Badge extends Shape {
        constructor(options) {
            super(options);
            this.owner = undefined;
            this.position = { angle: 0, offset: 0 };
            // }
            // init ()
            // {
            //      super.init ()
            const { group } = this;
            const entity = getNode(this.config.data);
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
        constructor(options) {
            super(options);
            this.display_size = 1;
            this.children = [];
            // }
            // init ()
            // {
            //      super.init ()
            const entity = this.config.data;
            //for ( const child of Object.values ( entity.children ) )
            for (const child of Object.values(entity.items)) {
                const a = getAspect(child);
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

    const addCommand = Commands.current.add.bind(Commands.current);
    const runCommand = Commands.current.run.bind(Commands.current);
    const hasCommand = Commands.current.has.bind(Commands.current);
    const onCommand = Commands.current.on.bind(Commands.current);
    const removeCommand = Commands.current.remove.bind(Commands.current);

    defineAspect(Shape, "person" /* , { onCreate: () => ..., onTouch: () => ... } */);
    defineAspect(Container$1, "skill");
    defineAspect(Badge, "badge");
    setAspect({
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
                shape: person.isCaptain ? "square" : "circle",
            });
        },
        onDelete: undefined,
        onTouch: undefined,
    });
    setAspect({
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
            const data = getNode({
                type: "badge",
                id: skill.icon,
            });
            const badge = getAspect(data);
            //badge.init ()
            badge.attach(aspect);
        },
        onTouch(shape) {
            const skill = getNode({
                type: shape.config.type,
                id: shape.config.id
            });
            runCommand("open-infos-panel", skill);
        },
        onDelete: undefined
    });
    setAspect({
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

    //export const menu = createMenu ()
    //document.body.append ( ... menu.elements () )
    const menu = make({
        context: "concept-ui",
        type: "side-menu",
        id: "menu",
        hasMainButton: true,
        direction: "lr"
    });
    document.body.append(...menu.getHtml());
    //addCommand ( "open-menu", () => { menu.open () })
    //addCommand ( "close-menu", () => { menu.close () })

    var direction = "rl";
    const panel = make({
        context: "concept-ui",
        type: "side-menu",
        id: undefined,
        direction: direction,
        hasMainButton: true,
        header: {
            context: "concept-ui",
            type: "toolbar",
            id: undefined,
            title: "Title ..",
            direction:  "tb" ,
            buttons: [{
                    context: "concept-ui",
                    type: "button",
                    id: "console",
                    icon: "⚠",
                    text: "",
                    handleOn: "*",
                    command: "pack-view"
                }, {
                    context: "concept-ui",
                    type: "button",
                    id: "properties",
                    icon: "",
                    text: "panel properties",
                    handleOn: "*",
                }]
        },
        children: [{
                context: "concept-ui",
                type: "slideshow",
                id: "panel-slideshow",
                children: [{
                        context: "concept-ui",
                        type: "skill-viewer",
                        id: "slide-skill"
                    }, {
                        context: "concept-ui",
                        type: "person-viewer",
                        id: "slide-person"
                    }]
            }]
    });
    document.body.append(...panel.getHtml());
    const slideshow = pick("slideshow", "panel-slideshow");
    const slideInfos = pick("skill-viewer", "slide-skill");
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
                const node = getNode(...arguments);
                const shp = getAspect(node);
                active.children.push(shp);
                fcanvas.add(shp.group);
            }
            else
                for (const s of arguments) {
                    const shp = getAspect(s);
                    // shp.getFabric
                    // shp.getHtml
                    // shp.getSvg
                    // factory
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
            //this.initMoveObject ()
            //this.initDragEvent  ()
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
                console.log("mouse:down");
                const now = Date.now();
                const pos = fevent.pointer;
                const reset = () => {
                    last_click = now;
                    last_pos = pos;
                };
                // Nous vérifions que soit un double-clique.
                if (500 < now - last_click) {
                    if (this.onTouchObject) {
                        const element = getAspect(fevent.target);
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
                if (fevent.target != undefined) {
                    if (this.onDoubleTouchObject) {
                        const element = getAspect(fevent.target);
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
                    const element = getAspect(fevent.target);
                    if (element)
                        this.onOverObject(element);
                }
            });
            page.on("mouse:out", fevent => {
                this.overFObject = undefined;
                if (this.onOutObject) {
                    const element = getAspect(fevent.target);
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
                console.log(target);
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
            // https://www.w3schools.com/html/html5_draganddrop.asp
            // https://github.com/Shopify/draggable/blob/master/src/Draggable/Draggable.js
            const page = this.fcanvas;
            page.on("touch:drag", fevent => {
                //console.log ( fevent )
                console.log("touch:drag");
            });
            page.on("dragenter", fevent => {
                //console.log ( "DROP-ENTER", fevent )
            });
            page.on("dragover", fevent => {
                //console.log ( "DROP-OVER", fevent )
            });
            page.on("drop", fevent => {
                //const e = fevent.e as DragEvent
                //console.log ( "DROP", e.dataTransfer.getData ("text") )
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
            { type: "button", id: "add-note", text: "", icon: "&#xe244;", fontFamily: "Material Icons", command: "pack-view" },
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
    addCommand("pack-view", () => {
        area.pack();
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
    // TEST
    if (navigator.maxTouchPoints > 0) {
        window.addEventListener("pointermove", event => {
            //const target = area.fcanvas.findTarget ( event, true )
            //if ( target )
            //     console.log ( target )
        });
    }
    else {
        window.addEventListener("mousemove", event => {
            //const target = area.fcanvas.findTarget ( event, true )
            //if ( target )
            //     console.log ( target )
        });
    }

    onCommand("open-menu", () => {
        panel.close();
        contextualMenu.hide();
    });
    onCommand("open-panel", () => {
        menu.close();
        contextualMenu.hide();
    });

    /// <reference types="faker" />
    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    const area$1 = area;
    const view = area$1.createView("compétances");
    area$1.use(view);
    // Ici on ajoute des personnes à l’application.
    const personNames = [];
    for (var i = 1; i <= 20; i++) {
        setNode({
            type: "person",
            id: "user" + i,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            avatar: `./avatars/f (${i}).jpg`,
            isCaptain: randomInt(0, 4) == 1 //i % 4 == 0,
        });
        setNode({
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
        setNode(Object.assign({ context: "concept-data", type: "badge" }, badgePresets[name]));
    // Skills
    for (const name in badgePresets) {
        const people = [];
        for (var j = randomInt(0, 6); j > 0; j--) {
            const name = personNames.splice(randomInt(1, personNames.length), 1)[0];
            if (name)
                people.push(getNode("person", name));
        }
        setNode({
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

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9ldmVudC50cyIsIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvRGF0YS9ub2RlLnRzIiwiLi4vLi4vRGF0YS9EYi9kYXRhLXRyZWUudHMiLCIuLi8uLi9EYXRhL0RiL2RiLnRzIiwiLi4vLi4vRGF0YS9EYi9mYWN0b3J5LnRzIiwiLi4vLi4vVWkvQmFzZS94bm9kZS50cyIsIi4uLy4uL1VpL0Jhc2UvZHJhZ2dhYmxlLnRzIiwiLi4vLi4vVWkvQmFzZS9kb20udHMiLCIuLi8uLi9VaS9CYXNlL2V4cGVuZGFibGUudHMiLCIuLi8uLi9VaS9CYXNlL3N3aXBlYWJsZS50cyIsIi4uLy4uL1VpL0Jhc2UvY29tbWFuZC50cyIsIi4uLy4uL1VpL0Jhc2UvQ29tcG9uZW50L2luZGV4LnRzeCIsIi4uLy4uL1VpL2RiLnRzIiwiLi4vLi4vVWkvQ29tcG9uZW50L1BoYW50b20vaW5kZXgudHN4IiwiLi4vLi4vVWkvQmFzZS9Db250YWluZXIvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0Jhci9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvQnV0dG9uL2h0bWwudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0J1dHRvbi9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvU2xpZGVzaG93L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9MaXN0L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9Ub29sYmFyL2luZGV4LnRzeCIsIi4uLy4uL1VpL0Jhc2Uvc2Nyb2xsYWJsZS50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9QYW5lbC9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvU2lkZU1lbnUvaW5kZXgudHN4IiwiLi4vLi4vVWkvQmFzZS9TdmcvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0NpcmN1bGFyLU1lbnUvaW5kZXgudHN4IiwiLi4vLi4vVWkvRW50aXR5L1BlcnNvbi9pbmZvcy50c3giLCIuLi8uLi9BcHBsaWNhdGlvbi9EYXRhL2RiLnRzIiwiLi4vLi4vVWkvRW50aXR5L1NraWxsL2luZm9zLnRzeCIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9HZW9tZXRyeS9mYWN0b3J5LnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0dlb21ldHJ5L2dlb21ldHJ5LnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvc2hhcGUudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvZGIudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvRWxlbWVudC9iYWRnZS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L2dyb3VwLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vY29tbWFuZC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9pbmRleC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL21lbnUudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9wYW5lbC50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9hcmVhLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vaW5kZXgudHMiLCIuLi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcblxuZXhwb3J0IGludGVyZmFjZSBJRXZlbnQgPEYgZXh0ZW5kcyAoIC4uLmFyZ3M6IGFueVtdICkgPT4gdm9pZCA9ICgpID0+IHZvaWQ+XG57XG4gICAgKCBjYWxsYmFjazogRiApOiB2b2lkXG4gICAgZW5hYmxlICgpOiB0aGlzXG4gICAgZGlzYWJsZSAoKTogdGhpc1xuICAgIGRpc3BhdGNoICggLi4uYXJnczogUGFyYW1ldGVycyA8Rj4gKTogdGhpc1xuICAgIHJlbW92ZSAoIGNhbGxiYWNrOiBGICk6IHRoaXNcbiAgICBjb3VudCAoKTogbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUgPEYgZXh0ZW5kcyAoKCAuLi5hcmdzOiBhbnlbXSApID0+IHZvaWQpID0gKCgpID0+IHZvaWQpPiAoKTogSUV2ZW50IDxGPlxue1xuICAgIGNvbnN0IHJlZ2lzdGVyID0gW10gYXMgRltdXG4gICAgdmFyICAgZW5hYmxlZCAgPSB0cnVlXG5cbiAgICBjb25zdCBzZWxmID0gZnVuY3Rpb24gKCBjYWxsYmFjazogRiApXG4gICAge1xuICAgICAgICByZWdpc3Rlci5wdXNoICggY2FsbGJhY2sgKSAtIDFcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYuY291bnQgPSAoKSA9PlxuICAgIHtcbiAgICAgICAgcmV0dXJuIHJlZ2lzdGVyLmxlbmd0aFxuICAgIH1cblxuICAgIHNlbGYuZGlzYWJsZSA9ICgpID0+XG4gICAge1xuICAgICAgICBlbmFibGVkID0gZmFsc2VcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYuZW5hYmxlID0gKCkgPT5cbiAgICB7XG4gICAgICAgIGVuYWJsZWQgPSB0cnVlXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLmFwcGVuZCA9ICggY2FsbGJhY2s6IEYgKSA9PlxuICAgIHtcbiAgICAgICAgc2VsZiAoIGNhbGxiYWNrIClcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYucmVtb3ZlID0gKCBjYWxsYmFjazogRiApID0+XG4gICAge1xuICAgICAgICBjb25zdCBpbmRleCA9IHJlZ2lzdGVyLmluZGV4T2YgKCBjYWxsYmFjayApXG5cbiAgICAgICAgaWYgKCBpbmRleCAhPSAtMSApXG4gICAgICAgICAgICByZWdpc3Rlci5zcGxpY2UgKCBpbmRleCwgMSApXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLnJlbW92ZUFsbCA9ICgpID0+XG4gICAge1xuICAgICAgICByZWdpc3Rlci5zcGxpY2UgKDApXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLmRpc3BhdGNoID0gKCAuLi5hcmdzOiBQYXJhbWV0ZXJzIDxGPiApID0+XG4gICAge1xuICAgICAgICBpZiAoIGVuYWJsZWQgKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IoIHZhciBmbiBvZiByZWdpc3RlciApXG4gICAgICAgICAgICAgICAgZm4gKCAuLi4gYXJncyApXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHJldHVybiBzZWxmXG59XG5cbiIsIlxuXG5leHBvcnQgdHlwZSBSYWRpYWxPcHRpb24gPSB7XG4gICAgciAgICAgICAgOiBudW1iZXIsXG4gICAgY291bnQgICAgOiBudW1iZXIsXG4gICAgcGFkZGluZz8gOiBudW1iZXIsXG4gICAgcm90YXRpb24/OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFJhZGlhbERlZmluaXRpb24gPSBSZXF1aXJlZCA8UmFkaWFsT3B0aW9uPiAmIHtcbiAgICBjeCAgICA6IG51bWJlcixcbiAgICBjeSAgICA6IG51bWJlcixcbiAgICB3aWR0aCA6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBwb2ludHM6IFBhcnQgW10sXG59XG5cbnR5cGUgUGFydCA9IHtcbiAgICB4IDogbnVtYmVyXG4gICAgeSA6IG51bWJlclxuICAgIGEgOiBudW1iZXJcbiAgICBhMTogbnVtYmVyXG4gICAgYTI6IG51bWJlclxuICAgIGNob3JkPzoge1xuICAgICAgICB4MSAgICA6IG51bWJlclxuICAgICAgICB5MSAgICA6IG51bWJlclxuICAgICAgICB4MiAgICA6IG51bWJlclxuICAgICAgICB5MiAgICA6IG51bWJlclxuICAgICAgICBsZW5ndGg6IG51bWJlclxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIG9wdGlvbnM6IFJhZGlhbE9wdGlvbiApXG57XG4gICAgY29uc3QgeyBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgIGNvbnN0IHIgICAgICAgID0gb3B0aW9ucy5yICAgICAgICB8fCAzMFxuICAgIGNvbnN0IGNvdW50ICAgID0gb3B0aW9ucy5jb3VudCAgICB8fCAxMFxuICAgIGNvbnN0IHJvdGF0aW9uID0gb3B0aW9ucy5yb3RhdGlvbiB8fCAwXG5cbiAgICBjb25zdCBwb2ludHMgPSBbXSBhcyBQYXJ0IFtdXG5cbiAgICBjb25zdCBhICAgICA9IDIgKiBQSSAvIGNvdW50XG4gICAgY29uc3QgY2hvcmQgPSAyICogciAqIHNpbiAoIGEgKiAwLjUgKVxuICAgIGNvbnN0IHNpemUgID0gciAqIDQgKyBjaG9yZFxuICAgIGNvbnN0IGMgICAgID0gc2l6ZSAvIDJcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kgKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgID0gYSAqIGkgKyByb3RhdGlvblxuICAgICAgICBjb25zdCBtaWRkbGUgPSBzdGFydCArIGEgKiAwLjVcbiAgICAgICAgY29uc3QgZW5kICAgID0gc3RhcnQgKyBhXG5cbiAgICAgICAgcG9pbnRzLnB1c2ggKHtcbiAgICAgICAgICAgIGExICAgOiBzdGFydCxcbiAgICAgICAgICAgIGEgICAgOiBtaWRkbGUsXG4gICAgICAgICAgICBhMiAgIDogZW5kLFxuICAgICAgICAgICAgeCAgICA6IGNvcyAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgeSAgICA6IHNpbiAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgY2hvcmQ6IHtcbiAgICAgICAgICAgICAgICB4MTogY29zIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5MTogc2luIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB4MjogY29zIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5Mjogc2luIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGNob3JkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBSYWRpYWxEZWZpbml0aW9uID0ge1xuICAgICAgICByLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgcm90YXRpb24sXG4gICAgICAgIHBhZGRpbmc6IG9wdGlvbnMucGFkZGluZyB8fCAwLFxuICAgICAgICBjeCAgICAgOiBjLFxuICAgICAgICBjeSAgICAgOiBjLFxuICAgICAgICB3aWR0aCAgOiBzaXplLFxuICAgICAgICBoZWlnaHQgOiBzaXplLFxuICAgICAgICBwb2ludHNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG4iLCIvLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2QzLXBhY2tlbmNsb3NlP2NvbGxlY3Rpb249QG9ic2VydmFibGVocS9hbGdvcml0aG1zXG4vLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2NpcmNsZS1wYWNraW5nXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL2VuY2xvc2UuanNcblxuXG5leHBvcnQgdHlwZSBDaXJjbGUgPSB7XG4gICAgIHg6IG51bWJlcixcbiAgICAgeTogbnVtYmVyLFxuICAgICByOiBudW1iZXJcbn1cblxuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxuZnVuY3Rpb24gc2h1ZmZsZSA8VD4gKCBhcnJheTogVFtdIClcbntcbiAgICAgdmFyIG0gPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgdCxcbiAgICAgICAgICBpOiBudW1iZXJcblxuICAgICB3aGlsZSAoIG0gKVxuICAgICB7XG4gICAgICAgICAgaSA9IE1hdGgucmFuZG9tICgpICogbS0tIHwgMFxuICAgICAgICAgIHQgPSBhcnJheSBbbV1cbiAgICAgICAgICBhcnJheSBbbV0gPSBhcnJheSBbaV1cbiAgICAgICAgICBhcnJheSBbaV0gPSB0XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJyYXlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGNpcmNsZXMgPSBzaHVmZmxlICggc2xpY2UuY2FsbCggY2lyY2xlcyApIClcblxuICAgICBjb25zdCBuID0gY2lyY2xlcy5sZW5ndGhcblxuICAgICB2YXIgaSA9IDAsXG4gICAgIEIgPSBbXSxcbiAgICAgcDogQ2lyY2xlLFxuICAgICBlOiBDaXJjbGU7XG5cbiAgICAgd2hpbGUgKCBpIDwgbiApXG4gICAgIHtcbiAgICAgICAgICBwID0gY2lyY2xlcyBbaV1cblxuICAgICAgICAgIGlmICggZSAmJiBlbmNsb3Nlc1dlYWsgKCBlLCBwICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgQiA9IGV4dGVuZEJhc2lzICggQiwgcCApXG4gICAgICAgICAgICAgICBlID0gZW5jbG9zZUJhc2lzICggQiApXG4gICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIGV4dGVuZEJhc2lzICggQjogQ2lyY2xlW10sIHA6IENpcmNsZSApXG57XG4gICAgIHZhciBpOiBudW1iZXIsXG4gICAgIGo6IG51bWJlclxuXG4gICAgIGlmICggZW5jbG9zZXNXZWFrQWxsICggcCwgQiApIClcbiAgICAgICAgICByZXR1cm4gW3BdXG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgZWxlbWVudC5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgKCBwLCBCIFtpXSApXG4gICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICksIEIgKVxuICAgICAgICAgICl7XG4gICAgICAgICAgICAgICByZXR1cm4gWyBCW2ldLCBwIF1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBlbGVtZW50cy5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aCAtIDE7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBqID0gaSArIDE7IGogPCBCLmxlbmd0aDsgKytqIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBCIFtqXSAgICApLCBwIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICAgICAgICApLCBCIFtqXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtqXSwgcCAgICAgICAgKSwgQiBbaV0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsKCBlbmNsb3NlQmFzaXMzICggQiBbaV0sIEIgW2pdLCBwICksIEIgKVxuICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgQlsgaSBdLCBCWyBqIF0sIHAgXTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIHNvbWV0aGluZyBpcyB2ZXJ5IHdyb25nLlxuICAgICB0aHJvdyBuZXcgRXJyb3I7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzTm90ICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCBkciA9IGEuciAtIGIuclxuICAgICBjb25zdCBkeCA9IGIueCAtIGEueFxuICAgICBjb25zdCBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA8IDAgfHwgZHIgKiBkciA8IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWsgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciAtIGIuciArIDFlLTYsXG4gICAgIGR4ID0gYi54IC0gYS54LFxuICAgICBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2Vha0FsbCAoIGE6IENpcmNsZSwgQjogQ2lyY2xlW10gKVxue1xuICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggISBlbmNsb3Nlc1dlYWsgKCBhLCBCW2ldICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgIH1cbiAgICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzICggQjogQ2lyY2xlW10gKVxue1xuICAgICBzd2l0Y2ggKCBCLmxlbmd0aCApXG4gICAgIHtcbiAgICAgICAgICBjYXNlIDE6IHJldHVybiBlbmNsb3NlQmFzaXMxKCBCIFswXSApXG4gICAgICAgICAgY2FzZSAyOiByZXR1cm4gZW5jbG9zZUJhc2lzMiggQiBbMF0sIEIgWzFdIClcbiAgICAgICAgICBjYXNlIDM6IHJldHVybiBlbmNsb3NlQmFzaXMzKCBCIFswXSwgQiBbMV0sIEIgWzJdIClcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMxICggYTogQ2lyY2xlIClcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiBhLngsXG4gICAgICAgICAgeTogYS55LFxuICAgICAgICAgIHI6IGEuclxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMyICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG5cbiAgICAgdmFyIHgyMSA9IHgyIC0geDEsXG4gICAgIHkyMSA9IHkyIC0geTEsXG4gICAgIHIyMSA9IHIyIC0gcjEsXG4gICAgIGwgICA9IE1hdGguc3FydCggeDIxICogeDIxICsgeTIxICogeTIxICk7XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiAoIHgxICsgeDIgKyB4MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHk6ICggeTEgKyB5MiArIHkyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgcjogKCBsICsgcjEgKyByMiApIC8gMlxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcbiAgICAgY29uc3QgeyB4OiB4MywgeTogeTMsIHI6IHIzIH0gPSBjXG5cbiAgICAgY29uc3QgYTIgPSB4MSAtIHgyLFxuICAgICAgICAgICAgICAgYTMgPSB4MSAtIHgzLFxuICAgICAgICAgICAgICAgYjIgPSB5MSAtIHkyLFxuICAgICAgICAgICAgICAgYjMgPSB5MSAtIHkzLFxuICAgICAgICAgICAgICAgYzIgPSByMiAtIHIxLFxuICAgICAgICAgICAgICAgYzMgPSByMyAtIHIxLFxuXG4gICAgICAgICAgICAgICBkMSA9IHgxICogeDEgKyB5MSAqIHkxIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIGQyID0gZDEgLSB4MiAqIHgyIC0geTIgKiB5MiArIHIyICogcjIsXG4gICAgICAgICAgICAgICBkMyA9IGQxIC0geDMgKiB4MyAtIHkzICogeTMgKyByMyAqIHIzLFxuXG4gICAgICAgICAgICAgICBhYiA9IGEzICogYjIgLSBhMiAqIGIzLFxuICAgICAgICAgICAgICAgeGEgPSAoIGIyICogZDMgLSBiMyAqIGQyICkgLyAoIGFiICogMiApIC0geDEsXG4gICAgICAgICAgICAgICB4YiA9ICggYjMgKiBjMiAtIGIyICogYzMgKSAvIGFiLFxuICAgICAgICAgICAgICAgeWEgPSAoIGEzICogZDIgLSBhMiAqIGQzICkgLyAoIGFiICogMiApIC0geTEsXG4gICAgICAgICAgICAgICB5YiA9ICggYTIgKiBjMyAtIGEzICogYzIgKSAvIGFiLFxuXG4gICAgICAgICAgICAgICBBICA9IHhiICogeGIgKyB5YiAqIHliIC0gMSxcbiAgICAgICAgICAgICAgIEIgID0gMiAqICggcjEgKyB4YSAqIHhiICsgeWEgKiB5YiApLFxuICAgICAgICAgICAgICAgQyAgPSB4YSAqIHhhICsgeWEgKiB5YSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICByICA9IC0oIEEgPyAoIEIgKyBNYXRoLnNxcnQoIEIgKiBCIC0gNCAqIEEgKiBDICkgKSAvICggMiAqIEEgKSA6IEMgLyBCIClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHgxICsgeGEgKyB4YiAqIHIsXG4gICAgICAgICAgeTogeTEgKyB5YSArIHliICogcixcbiAgICAgICAgICByOiByXG4gICAgIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kMy1lbmNsb3NlLnRzXCIgLz5cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9zaWJsaW5ncy5qc1xuXG5pbXBvcnQgeyBlbmNsb3NlLCBDaXJjbGUgfSBmcm9tIFwiLi9kMy1lbmNsb3NlLmpzXCJcblxuZnVuY3Rpb24gcGxhY2UgKCBiOiBDaXJjbGUsIGE6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgdmFyIGR4ID0gYi54IC0gYS54LFxuICAgICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgICBhMjogbnVtYmVyLFxuICAgICAgICAgIGR5ID0gYi55IC0gYS55LFxuICAgICAgICAgIHkgOiBudW1iZXIsXG4gICAgICAgICAgYjI6IG51bWJlcixcbiAgICAgICAgICBkMiA9IGR4ICogZHggKyBkeSAqIGR5XG5cbiAgICAgaWYgKCBkMiApXG4gICAgIHtcbiAgICAgICAgICBhMiA9IGEuciArIGMuciwgYTIgKj0gYTJcbiAgICAgICAgICBiMiA9IGIuciArIGMuciwgYjIgKj0gYjJcblxuICAgICAgICAgIGlmICggYTIgPiBiMiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBiMiAtIGEyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYjIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYi54IC0geCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBiLnkgLSB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYTIgLSBiMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGEyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGEueCArIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYS55ICsgeCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIGMueCA9IGEueCArIGMuclxuICAgICAgICAgIGMueSA9IGEueVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdHMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciArIGIuciAtIDFlLTYsIGR4ID0gYi54IC0gYS54LCBkeSA9IGIueSAtIGEueTtcbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlICggbm9kZTogTm9kZSApXG57XG4gICAgIHZhciBhID0gbm9kZS5fLFxuICAgICAgICAgIGIgPSBub2RlLm5leHQuXyxcbiAgICAgICAgICBhYiA9IGEuciArIGIucixcbiAgICAgICAgICBkeCA9ICggYS54ICogYi5yICsgYi54ICogYS5yICkgLyBhYixcbiAgICAgICAgICBkeSA9ICggYS55ICogYi5yICsgYi55ICogYS5yICkgLyBhYjtcbiAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5jbGFzcyBOb2RlXG57XG4gICAgIG5leHQgICAgID0gbnVsbCBhcyBOb2RlXG4gICAgIHByZXZpb3VzID0gbnVsbCBhcyBOb2RlXG4gICAgIGNvbnN0cnVjdG9yICggcHVibGljIF86IENpcmNsZSApIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrRW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgaWYgKCAhKCBuID0gY2lyY2xlcy5sZW5ndGggKSApIHJldHVybiAwO1xuXG4gICAgIHZhciBhLCBiLCBjIC8qOiBOb2RlICYgQ2lyY2xlKi8sIG4sIGFhLCBjYSwgaSwgaiwgaywgc2osIHNrO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBmaXJzdCBjaXJjbGUuXG4gICAgIGEgPSBjaXJjbGVzWyAwIF0sIGEueCA9IDAsIGEueSA9IDA7XG4gICAgIGlmICggISggbiA+IDEgKSApIHJldHVybiBhLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHNlY29uZCBjaXJjbGUuXG4gICAgIGIgPSBjaXJjbGVzWyAxIF0sIGEueCA9IC1iLnIsIGIueCA9IGEuciwgYi55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMiApICkgcmV0dXJuIGEuciArIGIucjtcblxuICAgICAvLyBQbGFjZSB0aGUgdGhpcmQgY2lyY2xlLlxuICAgICBwbGFjZSggYiwgYSwgYyA9IGNpcmNsZXNbIDIgXSApO1xuXG4gICAgIC8vIEluaXRpYWxpemUgdGhlIGZyb250LWNoYWluIHVzaW5nIHRoZSBmaXJzdCB0aHJlZSBjaXJjbGVzIGEsIGIgYW5kIGMuXG4gICAgIGEgPSBuZXcgTm9kZSggYSApLCBiID0gbmV3IE5vZGUoIGIgKSwgYyA9IG5ldyBOb2RlKCBjICk7XG4gICAgIGEubmV4dCA9IGMucHJldmlvdXMgPSBiO1xuICAgICBiLm5leHQgPSBhLnByZXZpb3VzID0gYztcbiAgICAgYy5uZXh0ID0gYi5wcmV2aW91cyA9IGE7XG5cbiAgICAgLy8gQXR0ZW1wdCB0byBwbGFjZSBlYWNoIHJlbWFpbmluZyBjaXJjbGXigKZcbiAgICAgcGFjazogZm9yICggaSA9IDM7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgcGxhY2UoIGEuXywgYi5fLCBjID0gY2lyY2xlc1sgaSBdICksIGMgPSBuZXcgTm9kZSggYyApO1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBpbnRlcnNlY3RpbmcgY2lyY2xlIG9uIHRoZSBmcm9udC1jaGFpbiwgaWYgYW55LlxuICAgICAgICAgIC8vIOKAnENsb3NlbmVzc+KAnSBpcyBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZSBhbG9uZyB0aGUgZnJvbnQtY2hhaW4uXG4gICAgICAgICAgLy8g4oCcQWhlYWTigJ0gb3Ig4oCcYmVoaW5k4oCdIGlzIGxpa2V3aXNlIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlLlxuICAgICAgICAgIGogPSBiLm5leHQsIGsgPSBhLnByZXZpb3VzLCBzaiA9IGIuXy5yLCBzayA9IGEuXy5yO1xuICAgICAgICAgIGRvXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBzaiA8PSBzayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggai5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBiID0gaiwgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNqICs9IGouXy5yLCBqID0gai5uZXh0O1xuICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggay5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBhID0gaywgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNrICs9IGsuXy5yLCBrID0gay5wcmV2aW91cztcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlICggaiAhPT0gay5uZXh0ICk7XG5cbiAgICAgICAgICAvLyBTdWNjZXNzISBJbnNlcnQgdGhlIG5ldyBjaXJjbGUgYyBiZXR3ZWVuIGEgYW5kIGIuXG4gICAgICAgICAgYy5wcmV2aW91cyA9IGEsIGMubmV4dCA9IGIsIGEubmV4dCA9IGIucHJldmlvdXMgPSBiID0gYztcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG5ldyBjbG9zZXN0IGNpcmNsZSBwYWlyIHRvIHRoZSBjZW50cm9pZC5cbiAgICAgICAgICBhYSA9IHNjb3JlKCBhICk7XG4gICAgICAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAoIGNhID0gc2NvcmUoIGMgKSApIDwgYWEgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhID0gYyxcbiAgICAgICAgICAgICAgICAgICAgYWEgPSBjYTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYiA9IGEubmV4dDtcbiAgICAgfVxuXG4gICAgIC8vIENvbXB1dGUgdGhlIGVuY2xvc2luZyBjaXJjbGUgb2YgdGhlIGZyb250IGNoYWluLlxuICAgICBhID0gWyBiLl8gXVxuICAgICBjID0gYlxuICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICBhLnB1c2goIGMuXyApO1xuICAgICBjID0gZW5jbG9zZSggYSApXG5cbiAgICAgLy8gVHJhbnNsYXRlIHRoZSBjaXJjbGVzIHRvIHB1dCB0aGUgZW5jbG9zaW5nIGNpcmNsZSBhcm91bmQgdGhlIG9yaWdpbi5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgYSA9IGNpcmNsZXNbIGkgXSxcbiAgICAgICAgICBhLnggLT0gYy54LFxuICAgICAgICAgIGEueSAtPSBjLnlcbiAgICAgfVxuXG4gICAgIHJldHVybiBjLnIgYXMgbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrQ2lyY2xlcyAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgcGFja0VuY2xvc2UoIGNpcmNsZXMgKTtcbiAgICAgcmV0dXJuIGNpcmNsZXMgYXMgQ2lyY2xlW107XG59XG4iLCJcclxuXHJcbmV4cG9ydCB0eXBlIFVuaXRcclxuICAgID0gXCIlXCJcclxuICAgIHwgXCJweFwiIHwgXCJwdFwiIHwgXCJlbVwiIHwgXCJyZW1cIiB8IFwiaW5cIiB8IFwiY21cIiB8IFwibW1cIlxyXG4gICAgfCBcImV4XCIgfCBcImNoXCIgfCBcInBjXCJcclxuICAgIHwgXCJ2d1wiIHwgXCJ2aFwiIHwgXCJ2bWluXCIgfCBcInZtYXhcIlxyXG4gICAgfCBcImRlZ1wiIHwgXCJyYWRcIiB8IFwidHVyblwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdCAoIHZhbHVlOiBhbnkgKTogVW5pdCB8IHVuZGVmaW5lZFxyXG57XHJcbiAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIClcclxuICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG5cclxuICAgIGNvbnN0IHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvXHJcbiAgICAgICAgICAgICAgLmV4ZWMoIHZhbHVlICk7XHJcblxyXG4gICAgaWYgKCBzcGxpdCApXHJcbiAgICAgICAgIHJldHVybiBzcGxpdCBbMV0gYXMgVW5pdFxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0ICggcHJvcE5hbWU6IHN0cmluZyApXHJcbntcclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAndHJhbnNsYXRlJyApIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnIClcclxuICAgICAgICByZXR1cm4gJ3B4J1xyXG5cclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAncm90YXRlJyApIHx8IHByb3BOYW1lLmluY2x1ZGVzICggJ3NrZXcnICkgKVxyXG4gICAgICAgIHJldHVybiAnZGVnJ1xyXG59IiwiXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcmRmanMtYmFzZS9kYXRhLW1vZGVsL3RyZWUvbWFzdGVyL2xpYlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICROb2RlXG4gICAgIHtcbiAgICAgICAgICByZWFkb25seSBjb250ZXh0OiBzdHJpbmdcbiAgICAgICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcbiAgICAgICAgICByZWFkb25seSBpZDogc3RyaW5nXG4gICAgIH1cblxuICAgICBleHBvcnQgaW50ZXJmYWNlICRDbHVzdGVyIDwkQ2hpbGQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiBleHRlbmRzICROb2RlXG4gICAgIHtcbiAgICAgICAgICBjaGlsZHJlbj86ICRDaGlsZCBbXVxuICAgICB9XG59XG5cbnZhciBuZXh0SWQgPSAwXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlIDxEIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCBleHRlbmRzIHN0cmluZyA9IEQgW1widHlwZVwiXT4gKCB0eXBlOiBULCBpZDogc3RyaW5nLCBkYXRhOiBQYXJ0aWFsIDxPbWl0IDxELCBcInR5cGVcIiB8IFwiaWRcIj4+IClcbntcbiAgICAgdHlwZSBOID0geyAtcmVhZG9ubHkgW0sgaW4ga2V5b2YgRF06IERbS10gfVxuXG4gICAgIDsoZGF0YSBhcyBOKS50eXBlID0gdHlwZVxuICAgICA7KGRhdGEgYXMgTikuaWQgICA9IGlkIHx8ICgrK25leHRJZCkudG9TdHJpbmcgKClcbiAgICAgcmV0dXJuIGRhdGEgYXMgRFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VUlkICggbm9kZTogJE5vZGUgKVxue1xuICAgICByZXR1cm4gbm9kZS5jb250ZXh0ICsgJyMnICsgbm9kZS50eXBlICsgJzonICsgbm9kZS5pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxOb2RlcyAoIGE6ICROb2RlLCBiOiAkTm9kZSApXG57XG4gICAgIHJldHVybiAhIWEgJiYgISFiXG4gICAgICAgICAgJiYgYS50eXBlID09PSBiLnR5cGVcbiAgICAgICAgICAmJiBhLmlkICAgPT09IGIuaWRcbn1cblxuLypleHBvcnQgY2xhc3MgTm9kZSA8RCBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgZXh0ZW5kcyBzdHJpbmcgPSBEIFtcInR5cGVcIl0+XG57XG4gICAgIHN0YXRpYyBuZXh0SWQgPSAwXG5cbiAgICAgcmVhZG9ubHkgdHlwZTogc3RyaW5nXG5cbiAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZ1xuXG4gICAgIHJlYWRvbmx5IHVpZDogbnVtYmVyXG5cbiAgICAgcmVhZG9ubHkgZGF0YTogRFxuXG4gICAgIGRlZmF1bHREYXRhICgpOiAkTm9kZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcIm5vZGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6IEQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy50eXBlID0gZGF0YS50eXBlXG4gICAgICAgICAgdGhpcy51aWQgID0gKytOb2RlLm5leHRJZFxuICAgICAgICAgIHRoaXMuaWQgICA9IGRhdGEuaWQgfHwgKGRhdGEuaWQgPSB0aGlzLnVpZC50b1N0cmluZyAoKSlcblxuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKCB0aGlzLmRlZmF1bHREYXRhICgpLCBkYXRhIGFzIEQgKVxuICAgICB9XG5cbiAgICAgZXF1YWxzICggb3RoZXI6IE5vZGUgPGFueT4gKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuICEhb3RoZXJcbiAgICAgICAgICAgICAgICYmIG90aGVyLnR5cGUgPT09IHRoaXMudHlwZVxuICAgICAgICAgICAgICAgJiYgb3RoZXIuaWQgICA9PT0gdGhpcy5pZFxuICAgICB9XG5cbiAgICAgdG9Kc29uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgKCB0aGlzLmRhdGEgKVxuICAgICB9XG59Ki9cbiIsIlxuZXhwb3J0IHR5cGUgUGF0aCA9IHtcbiAgICAgbGVuZ3RoOiBudW1iZXJcbiAgICAgW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhVHJlZSA8VD5cbntcbiAgICAgcmVjb3JkcyA9IHt9IGFzIHtcbiAgICAgICAgICBbY29udGV4dDogc3RyaW5nXTogVCB8IHtcbiAgICAgICAgICAgICAgIFt0eXBlOiBzdHJpbmddOiBUIHwge1xuICAgICAgICAgICAgICAgICAgICBbaWQ6IHN0cmluZ106IFRcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBoYXMgKCBwYXRoOiBQYXRoICkgIDogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICB2YXIgY291bnQgPSAwXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvdW50ICsrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXRoLmxlbmd0aCA9PSBjb3VudFxuICAgICB9XG5cbiAgICAgY291bnQgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIHZhciAgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCBpbiByZWNcbiAgICAgICAgICAgICAgID8gT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICA6IE9iamVjdC5rZXlzICggcmVjICkubGVuZ3RoXG5cbiAgICAgfVxuXG4gICAgIHNldCAoIHBhdGg6IFBhdGgsIGRhdGE6IFQgKTogVFxuICAgICB7XG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdID0ge31cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdID0gZGF0YVxuICAgICB9XG5cbiAgICAgZ2V0ICggcGF0aDogUGF0aCApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgbmVhciAoIHBhdGg6IFBhdGggKTogVFxuICAgICB7XG4gICAgICAgICAgdmFyIHJlYyA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF1cbiAgICAgfVxuXG4gICAgIHdhbGsgKCBwYXRoOiBQYXRoLCBjYjogKCBkYXRhOiBUICkgPT4gdm9pZCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCAgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB1bmQgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCB1bmQgaW4gcmVjIClcbiAgICAgICAgICAgICAgIGNiICggcmVjIFt1bmRdIClcblxuICAgICAgICAgIHJldHVyblxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IE9wdGlvbmFsLCBSZXF1aXJlIH0gZnJvbSBcIi4uLy4uL0xpYi90eXBpbmcuanNcIlxuaW1wb3J0IHsgRGF0YVRyZWUgfSBmcm9tIFwiLi9kYXRhLXRyZWUuanNcIlxuXG5cbnR5cGUgUmVmIDxOIGV4dGVuZHMgJE5vZGU+ID0gUmVxdWlyZSA8UGFydGlhbCA8Tj4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cbnR5cGUgRCA8TiBleHRlbmRzICROb2RlPiA9IE9wdGlvbmFsIDxOLCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPlxuXG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZSA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+IGV4dGVuZHMgRGF0YVRyZWUgPE4+XG57XG4gICAgIGhhcyAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgIDogYm9vbGVhblxuICAgICBoYXMgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IGJvb2xlYW5cbiAgICAgaGFzICgpOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLm5lYXIgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdICkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLm5lYXIgKCBhcmd1bWVudHMgKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY291bnQgKCBub2RlOiBSZWYgPE4+ICkgICAgICA6IG51bWJlclxuICAgICBjb3VudCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogbnVtYmVyXG4gICAgIGNvdW50ICgpOiBudW1iZXJcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuY291bnQgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5jb3VudCAoIGFyZ3VtZW50cyApXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiAkICkgICAgICAgICAgICAgICAgICAgICA6ICRcbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBwYXRoOiBzdHJpbmcgW10sIGRhdGE6IEQgPCQ+ICk6ICRcbiAgICAgc2V0ICgpOiBOXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnNldCAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0sIG8gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnNldCAoIGFyZ3VtZW50cyBbMF0sIGFyZ3VtZW50cyBbMV0gKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggbm9kZTogUmVmIDwkTm9kZT4gKSAgOiAkXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiAkXG4gICAgIGdldCAoKTogTlxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fSBhcyBOXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogJE5vZGUgPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICBzdXBlci53YWxrICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSwgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIGRhdGEgKVxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCBvIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN1cGVyLndhbGsgKCBhcmd1bWVudHMsIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IGFyZ3VtZW50cyBbMF0sXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IGFyZ3VtZW50cyBbMV0sXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICA6IGFyZ3VtZW50cyBbMl0sXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuL2RiLmpzXCJcbmltcG9ydCB7IERhdGFUcmVlLCBQYXRoIH0gZnJvbSBcIi4vZGF0YS10cmVlLmpzXCJcblxuaW1wb3J0IHsgT3B0aW9uYWwgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4LmpzXCJcblxuXG50eXBlIEl0ZW0gPFQgPSBhbnksICQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiA9XG57XG4gICAgIG11bHRpcGxlOiBib29sZWFuXG4gICAgIGluc3RhbmNlczogVCBbXVxuICAgICBjb25zdHJ1Y3RvcjogbmV3ICggZGF0YTogJCApID0+IFRcbn1cblxudHlwZSAkSW4gPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiA9IE9wdGlvbmFsIDxOLCBcImNvbnRleHRcIj5cblxuLy9leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOICkgPT4gVFxuZXhwb3J0IHR5cGUgQ3RvciA8TiBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgPSBhbnk+ID0gbmV3ICggZGF0YTogTiwgY2hpbGRyZW4/OiBhbnkgW10gKSA9PiBUXG5cbnR5cGUgQXJnIDxGPiA9IEYgZXh0ZW5kcyBuZXcgKCBkYXRhOiBpbmZlciBEICkgPT4gYW55ID8gRCA6IGFueVxuXG5cbmV4cG9ydCBjbGFzcyBGYWN0b3J5IDxFID0gYW55LCBOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT5cbntcbiAgICAgY29uc3RydWN0b3IgKCByZWFkb25seSBkYjogRGF0YWJhc2UgPE4+ICkge31cblxuICAgICBwcml2YXRlIGN0b3JzID0gbmV3IERhdGFUcmVlIDxDdG9yIDwkTm9kZSwgRT4+ICgpXG4gICAgIHByaXZhdGUgaW5zdHMgPSAgbmV3IERhdGFUcmVlIDxFPiAoKVxuXG5cbiAgICAgZ2V0UGF0aCAoIG5vZGU6ICROb2RlICkgICAgICAgIDogUGF0aFxuICAgICBnZXRQYXRoICggcGF0aDogUGF0aCApICAgICAgICAgOiBQYXRoXG4gICAgIGdldFBhdGggKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IFBhdGhcblxuICAgICBnZXRQYXRoICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgKCBcIk51bGwgYXJndW1lbnRcIiApXG5cbiAgICAgICAgICBjb25zdCBhcmcgID0gYXJndW1lbnRzIFswXVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cyBhcyBQYXRoXG5cbiAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkgKCBhcmcpIClcbiAgICAgICAgICAgICAgIHJldHVybiBhcmcuZmxhdCAoKSBhcyBQYXRoXG5cbiAgICAgICAgICByZXR1cm4gWyBhcmcuY29udGV4dCwgYXJnLnR5cGUsIGFyZy5pZCBdIGFzIFBhdGhcbiAgICAgfVxuXG4gICAgIGluU3RvY2sgKCBub2RlOiAkTm9kZSApICAgICAgICA6IGJvb2xlYW5cbiAgICAgaW5TdG9jayAoIHBhdGg6IFBhdGggKSAgICAgICAgIDogYm9vbGVhblxuICAgICBpblN0b2NrICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBib29sZWFuXG5cbiAgICAgaW5TdG9jayAoKTogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuaGFzICggdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApIGFzIFBhdGggKVxuICAgICB9XG4gICAgIF9pblN0b2NrICggcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5oYXMgKCBwYXRoIClcbiAgICAgfVxuXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgbm9kZTogQXJnIDxGPiApICAgICAgOiB2b2lkXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgcGF0aDogUGF0aCApICAgICAgICAgOiB2b2lkXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgLi4uIHBhdGg6IHN0cmluZyBbXSApOiB2b2lkXG5cbiAgICAgZGVmaW5lICggY3RvcjogQ3RvciwgLi4uIHJlc3Q6IGFueSBbXSApXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiByZXN0IClcblxuICAgICAgICAgIGlmICggdGhpcy5jdG9ycy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3RvcnMuc2V0ICggcGF0aCwgY3RvciApXG4gICAgIH1cbiAgICAgX2RlZmluZSAoIGN0b3I6IEN0b3IsIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmN0b3JzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jdG9ycy5zZXQgKCBwYXRoLCBjdG9yIClcbiAgICAgfVxuXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFLCAkIGV4dGVuZHMgTiA9IE4+ICggbm9kZTogJE5vZGUgKTogUlxuICAgICBwaWNrIDxSIGV4dGVuZHMgRT4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICkgICAgICAgICA6IFJcbiAgICAgcGljayA8UiBleHRlbmRzIEU+ICggcGF0aDogUGF0aCApICAgICAgICAgICAgICAgICAgOiBSXG5cbiAgICAgcGljayAoKTogRVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzIClcblxuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG4gICAgIH1cbiAgICAgX3BpY2sgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG4gICAgIH1cblxuICAgICBtYWtlIDxSIGV4dGVuZHMgRSwgJCBleHRlbmRzIE4gPSBOPiAoIG5vZGU6ICQgKTogUlxuICAgICBtYWtlIDxSIGV4dGVuZHMgRT4gKCBwYXRoOiBQYXRoICkgICAgICAgICAgICAgIDogUlxuICAgICBtYWtlIDxSIGV4dGVuZHMgRT4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICkgICAgIDogUlxuXG4gICAgIG1ha2UgKCk6IEVcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApXG5cbiAgICAgICAgICBjb25zdCBhcmcgID0gYXJndW1lbnRzIFswXVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09IFwib2JqZWN0XCIgJiYgISBBcnJheS5pc0FycmF5IChhcmcpIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYWtlICggcGF0aCwgYXJnIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFrZSAoIHBhdGggKVxuICAgICB9XG4gICAgIF9tYWtlICggcGF0aDogUGF0aCwgZGF0YT86IFBhcnRpYWwgPE4+IClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICBjb25zdCBjdG9yID0gdGhpcy5jdG9ycy5uZWFyICggcGF0aCApXG5cbiAgICAgICAgICBpZiAoIGN0b3IgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIGNvbnN0IHRtcCA9IHRoaXMuZGIuZ2V0ICggLi4uIHBhdGggKVxuXG4gICAgICAgICAgZGF0YSA9IGRhdGEgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICA/IHRtcFxuICAgICAgICAgICAgICAgOiBPYmplY3QuYXNzaWduICggdG1wLCBkYXRhIClcblxuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLnNldCAoIHBhdGgsIG5ldyBjdG9yICggZGF0YSBhcyBOICkgKVxuICAgICB9XG59XG4iLCJcblxuXG5leHBvcnQgY29uc3QgeG5vZGUgPSAoKCkgPT5cbntcbiAgICAgY29uc3Qgc3ZnX25hbWVzID0gWyBcInN2Z1wiLCBcImdcIiwgXCJsaW5lXCIsIFwiY2lyY2xlXCIsIFwicGF0aFwiLCBcInRleHRcIiBdXG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljSFRNTEVsZW1lbnRzLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljU1ZHRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogU1ZHRWxlbWVudFxuXG4gICAgIGZ1bmN0aW9uIGNyZWF0ZSAoXG4gICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgcHJvcHMgPSBPYmplY3QuYXNzaWduICgge30sIHByb3BzIClcblxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBzdmdfbmFtZXMuaW5kZXhPZiAoIG5hbWUgKSA9PT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggbmFtZSApXG4gICAgICAgICAgICAgICAgICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICggXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lIClcblxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBbXSBhcyBhbnlbXVxuXG4gICAgICAgICAgLy8gQ2hpbGRyZW5cblxuICAgICAgICAgIHdoaWxlICggY2hpbGRyZW4ubGVuZ3RoID4gMCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gY2hpbGRyZW4ucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBjaGlsZCApIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjaGlsZC5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goIGNoaWxkIFtpXSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaCggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHdoaWxlICggY29udGVudC5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjb250ZW50LnBvcCgpXG5cbiAgICAgICAgICAgICAgIGlmICggY2hpbGQgaW5zdGFuY2VvZiBOb2RlIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIGNoaWxkID09IFwiYm9vbGVhblwiIHx8IGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGNoaWxkLnRvU3RyaW5nKCkgKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXR0cmlidXRlc1xuXG4gICAgICAgICAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbiAgICAgICAgICBjb25zdCBjb252OiBSZWNvcmQgPHN0cmluZywgKHY6IGFueSkgPT4gc3RyaW5nPiA9XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2xhc3M6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgICAgICAgc3R5bGU6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0eXBlb2YgdiA9PSBcIm9iamVjdFwiID8gb2JqZWN0VG9TdHlsZSAodilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB2LFxuICAgICAgICAgICAgICAgLy8gc3ZnXG4gICAgICAgICAgICAgICBkOiAoIHYgKSA9PiBpc0FycmF5ICh2KSA/IHYuam9pbiAoXCIgXCIpIDogdixcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrZXkgaW4gcHJvcHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcHNba2V5XVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBrZXksIHZhbHVlIClcblxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSAoIGtleSwgKGNvbnZba2V5XSB8fCAodj0+dikpICh2YWx1ZSkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50XG5cbiAgICAgICAgICBmdW5jdGlvbiBvYmplY3RUb1N0eWxlICggb2JqOiBvYmplY3QgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBvYmogKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0ga2V5ICsgXCI6IFwiICsgb2JqIFtrZXldICsgXCI7IFwiXG5cbiAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBjYW1lbGl6ZSAoIHN0cjogc3RyaW5nIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6IHdvcmQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiB1bmNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIudHJpbSAoKS5yZXBsYWNlIChcbiAgICAgICAgICAgICAgIC8vICAgLyg/PCEtKSg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgLyg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgKCB3b3JkLCBpbmRleCApID0+IGluZGV4ID09IDAgPyB3b3JkLnRvTG93ZXJDYXNlKCkgOiAnLScgKyB3b3JkLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICkucmVwbGFjZSgvKD86XFxzK3xfKS9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGNyZWF0ZVxuXG59KSAoKVxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgbmFtZXNwYWNlIEpTWFxuICAgICB7XG4gICAgICAgICAgZXhwb3J0IHR5cGUgRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgICAgICAgZXhwb3J0IHR5cGUgSW50cmluc2ljRWxlbWVudHMgPSBJbnRyaW5zaWNIVE1MRWxlbWVudHMgJiBJbnRyaW5zaWNTVkdFbGVtZW50c1xuXG4gICAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJbnRyaW5zaWNIVE1MRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBhICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWJiciAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFkZHJlc3MgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcmVhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXJ0aWNsZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFzaWRlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhdWRpbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYiAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJhc2UgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZGkgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmRvICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJpZyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBibG9ja3F1b3RlOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYm9keSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBidXR0b24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FudmFzICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNhcHRpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXRlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29kZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2xncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRhdGFsaXN0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVsICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRldGFpbHMgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZm4gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGlhbG9nICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRpdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkbCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZHQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbWJlZCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmllbGRzZXQgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ2NhcHRpb246IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWd1cmUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9vdGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZvcm0gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgzICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDUgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg2ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGVhZGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhncm91cCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBociAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaHRtbCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGkgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpZnJhbWUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1nICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucHV0ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbnMgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2JkICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGtleWdlbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsYWJlbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGVnZW5kICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5rICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFpbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1lbnVpdGVtICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWV0ZXIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5hdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBub3NjcmlwdCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2JqZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9sICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3B0aW9uICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG91dHB1dCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGFyYW0gICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBpY3R1cmUgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcmUgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcHJvZ3Jlc3MgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBycCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJ1YnkgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2FtcCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNjcmlwdCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWN0aW9uICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2VsZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNsb3QgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzbWFsbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc291cmNlICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNwYW4gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHJvbmcgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3R5bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1YiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdW1tYXJ5ICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3VwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRhYmxlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Ym9keSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRleHRhcmVhICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Zm9vdCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGggICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRoZWFkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aW1lICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGl0bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0cmFjayAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHVsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBcInZhclwiICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB2aWRlbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgd2JyICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY1NWR0VsZW1lbnRzXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3ZnICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYW5pbWF0ZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2lyY2xlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2xpcFBhdGggICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVmcyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVzYyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZWxsaXBzZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVCbGVuZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb2xvck1hdHJpeCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb25lbnRUcmFuc2ZlcjogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb3NpdGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb252b2x2ZU1hdHJpeCAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaWZmdXNlTGlnaHRpbmcgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaXNwbGFjZW1lbnRNYXAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVGbG9vZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVHYXVzc2lhbkJsdXIgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVJbWFnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZU5vZGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNb3JwaG9sb2d5ICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVPZmZzZXQgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVTcGVjdWxhckxpZ2h0aW5nIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUaWxlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUdXJidWxlbmNlICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlsdGVyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9yZWlnbk9iamVjdCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZyAgICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1hZ2UgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZSAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZWFyR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFya2VyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFzayAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0aCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0dGVybiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWdvbiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWxpbmUgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmFkaWFsR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmVjdCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3RvcCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ltYm9sICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHNwYW4gICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdXNlICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgIH1cbiAgICAgfVxuXG5cbiAgICAgaW50ZXJmYWNlIFBhdGhBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIHR5cGUgRXZlbnRIYW5kbGVyIDxFIGV4dGVuZHMgRXZlbnQ+ID0gKCBldmVudDogRSApID0+IHZvaWRcblxuICAgICB0eXBlIENsaXBib2FyZEV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPENsaXBib2FyZEV2ZW50PlxuICAgICB0eXBlIENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyID0gRXZlbnRIYW5kbGVyPENvbXBvc2l0aW9uRXZlbnQ+XG4gICAgIHR5cGUgRHJhZ0V2ZW50SGFuZGxlciAgICAgICAgPSBFdmVudEhhbmRsZXI8RHJhZ0V2ZW50PlxuICAgICB0eXBlIEZvY3VzRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPEZvY3VzRXZlbnQ+XG4gICAgIHR5cGUgS2V5Ym9hcmRFdmVudEhhbmRsZXIgICAgPSBFdmVudEhhbmRsZXI8S2V5Ym9hcmRFdmVudD5cbiAgICAgdHlwZSBNb3VzZUV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxNb3VzZUV2ZW50PlxuICAgICB0eXBlIFRvdWNoRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFRvdWNoRXZlbnQ+XG4gICAgIHR5cGUgVUlFdmVudEhhbmRsZXIgICAgICAgICAgPSBFdmVudEhhbmRsZXI8VUlFdmVudD5cbiAgICAgdHlwZSBXaGVlbEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxXaGVlbEV2ZW50PlxuICAgICB0eXBlIEFuaW1hdGlvbkV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPEFuaW1hdGlvbkV2ZW50PlxuICAgICB0eXBlIFRyYW5zaXRpb25FdmVudEhhbmRsZXIgID0gRXZlbnRIYW5kbGVyPFRyYW5zaXRpb25FdmVudD5cbiAgICAgdHlwZSBHZW5lcmljRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxFdmVudD5cbiAgICAgdHlwZSBQb2ludGVyRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxQb2ludGVyRXZlbnQ+XG5cbiAgICAgaW50ZXJmYWNlIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIFtldmVudDogc3RyaW5nXTogYW55XG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEltYWdlIEV2ZW50c1xuICAgICAgICAgIG9uTG9hZD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3I/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3JDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ2xpcGJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uQ29weT8gICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db3B5Q2FwdHVyZT8gOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkN1dD8gICAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0Q2FwdHVyZT8gIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXN0ZT8gICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlQ2FwdHVyZT86IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ29tcG9zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZD8gICAgICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmRDYXB0dXJlPyAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ/ICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0Q2FwdHVyZT8gOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGU/ICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uVXBkYXRlQ2FwdHVyZT86IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb2N1cyBFdmVudHNcbiAgICAgICAgICBvbkZvY3VzPyAgICAgICA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Gb2N1c0NhcHR1cmU/OiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1cj8gICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkJsdXJDYXB0dXJlPyA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb3JtIEV2ZW50c1xuICAgICAgICAgIG9uQ2hhbmdlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DaGFuZ2VDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbklucHV0PyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXRDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWFyY2g/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VibWl0PyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXRDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkludmFsaWQ/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBLZXlib2FyZCBFdmVudHNcbiAgICAgICAgICBvbktleURvd24/ICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlEb3duQ2FwdHVyZT8gOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3M/ICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVByZXNzQ2FwdHVyZT86IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcD8gICAgICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5VXBDYXB0dXJlPyAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIE1lZGlhIEV2ZW50c1xuICAgICAgICAgIG9uQWJvcnQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQWJvcnRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheT8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheUNhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2g/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2hDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2U/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2VDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkPyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkQ2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGFDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0PyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0Q2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2U/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2VDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheT8gICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheUNhcHR1cmU/ICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3M/ICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3NDYXB0dXJlPyAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkPyAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkQ2FwdHVyZT8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlQ2FwdHVyZT8gIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTW91c2VFdmVudHNcbiAgICAgICAgICBvbkNsaWNrPyAgICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DbGlja0NhcHR1cmU/ICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnU/ICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbnRleHRNZW51Q2FwdHVyZT86IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGljaz8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRGJsQ2xpY2tDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWc/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmQ/ICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmRDYXB0dXJlPyAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlcj8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlckNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0PyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0Q2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZT8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZUNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyPyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyQ2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydD8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydENhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3A/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3BDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZURvd25DYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlcj8gICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRW50ZXJDYXB0dXJlPyA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VMZWF2ZUNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZT8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU1vdmVDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXQ/ICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3V0Q2FwdHVyZT8gICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXI/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdmVyQ2FwdHVyZT8gIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXA/ICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZVVwQ2FwdHVyZT8gICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gU2VsZWN0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uU2VsZWN0PzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VsZWN0Q2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRvdWNoIEV2ZW50c1xuICAgICAgICAgIG9uVG91Y2hDYW5jZWw/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hDYW5jZWxDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hNb3ZlQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaFN0YXJ0PzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFBvaW50ZXIgRXZlbnRzXG4gICAgICAgICAgb25Qb2ludGVyT3Zlcj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck92ZXJDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlcj8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRW50ZXJDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd24/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJEb3duQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZT8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck1vdmVDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcD8gICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyVXBDYXB0dXJlPyAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbD8gICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJDYW5jZWxDYXB0dXJlPyAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0PyAgICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck91dENhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZT8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTGVhdmVDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkdvdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT8gOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9zdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT86IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFVJIEV2ZW50c1xuICAgICAgICAgIG9uU2Nyb2xsPyAgICAgICA6IFVJRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TY3JvbGxDYXB0dXJlPzogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFdoZWVsIEV2ZW50c1xuICAgICAgICAgIG9uV2hlZWw/ICAgICAgIDogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbldoZWVsQ2FwdHVyZT86IFdoZWVsRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBBbmltYXRpb24gRXZlbnRzXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydD8gICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydENhcHR1cmU/ICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmQ/ICAgICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmRDYXB0dXJlPyAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb24/ICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb25DYXB0dXJlPzogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBUcmFuc2l0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZD8gICAgICAgOiBUcmFuc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kQ2FwdHVyZT86IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgSFRNTEF0dHJpYnV0ZXMgZXh0ZW5kcyBET01BdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICAvLyBTdGFuZGFyZCBIVE1MIEF0dHJpYnV0ZXNcbiAgICAgICAgICBhY2NlcHQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjY2VwdENoYXJzZXQ/ICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXNzS2V5PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhY3Rpb24/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFsbG93RnVsbFNjcmVlbj8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsbG93VHJhbnNwYXJlbmN5Pzogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsdD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXN5bmM/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9jb3JyZWN0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b0NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvZm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvRm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvUGxheT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjYXB0dXJlPyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjZWxsUGFkZGluZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNlbGxTcGFjaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2hhclNldD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjaGFsbGVuZ2U/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoZWNrZWQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNsYXNzPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgICAgICBjbGFzc05hbWU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbHM/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY29sU3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb250ZW50PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRFZGl0YWJsZT8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNvbnRleHRNZW51PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udHJvbHM/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udHJvbHNMaXN0PyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb29yZHM/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNyb3NzT3JpZ2luPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGF0YT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRlVGltZT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRlZmF1bHQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRlZmVyPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRpcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGlzYWJsZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZG93bmxvYWQ/ICAgICAgICAgOiBhbnlcbiAgICAgICAgICBkcmFnZ2FibGU/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBlbmNUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm0/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybUFjdGlvbj8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtRW5jVHlwZT8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1NZXRob2Q/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU5vVmFsaWRhdGU/ICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZm9ybVRhcmdldD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmcmFtZUJvcmRlcj8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhlYWRlcnM/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGVpZ2h0PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBoaWRkZW4/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBoaWdoPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhyZWY/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHJlZkxhbmc/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3I/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGh0bWxGb3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHR0cEVxdWl2PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpY29uPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlkPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaW5wdXRNb2RlPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlZ3JpdHk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlzPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2V5UGFyYW1zPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtpbmQ/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGFiZWw/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYW5nPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxpc3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbG9vcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbG93PyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYW5pZmVzdD8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmdpbkhlaWdodD8gICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWFyZ2luV2lkdGg/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXg/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heExlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWVkaWE/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtZWRpYUdyb3VwPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1ldGhvZD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWluPyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtaW5MZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG11bHRpcGxlPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG11dGVkPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbm9WYWxpZGF0ZT8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3Blbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3B0aW11bT8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBwYXR0ZXJuPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBsYWNlaG9sZGVyPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxheXNJbmxpbmU/ICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcG9zdGVyPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwcmVsb2FkPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJhZGlvR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmVhZE9ubHk/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcmVsPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByb2xlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvd3M/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgcm93U3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzYW5kYm94PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNjb3BlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGVkPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc2Nyb2xsaW5nPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzZWFtbGVzcz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzZWxlY3RlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzaGFwZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNpemU/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc2l6ZXM/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzbG90PyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNwYW4/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3BlbGxjaGVjaz8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc3JjPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNzZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY0RvYz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjTGFuZz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNTZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0PyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3RlcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHlsZT8gICAgICAgICAgICA6IHN0cmluZyB8IHsgWyBrZXk6IHN0cmluZyBdOiBzdHJpbmcgfCBudW1iZXIgfVxuICAgICAgICAgIHN1bW1hcnk/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGFiSW5kZXg/ICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICB0YXJnZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRpdGxlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1c2VNYXA/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZhbHVlPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW10gfCBudW1iZXJcbiAgICAgICAgICB3aWR0aD8gICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHdtb2RlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgd3JhcD8gICAgICAgICAgICAgOiBzdHJpbmdcblxuICAgICAgICAgIC8vIFJERmEgQXR0cmlidXRlc1xuICAgICAgICAgIGFib3V0Pzogc3RyaW5nXG4gICAgICAgICAgZGF0YXR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpbmxpc3Q/OiBhbnlcbiAgICAgICAgICBwcmVmaXg/OiBzdHJpbmdcbiAgICAgICAgICBwcm9wZXJ0eT86IHN0cmluZ1xuICAgICAgICAgIHJlc291cmNlPzogc3RyaW5nXG4gICAgICAgICAgdHlwZW9mPzogc3RyaW5nXG4gICAgICAgICAgdm9jYWI/OiBzdHJpbmdcblxuICAgICAgICAgIC8vIE1pY3JvZGF0YSBBdHRyaWJ1dGVzXG4gICAgICAgICAgaXRlbVByb3A/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtU2NvcGU/OiBib29sZWFuXG4gICAgICAgICAgaXRlbVR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtSUQ/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtUmVmPzogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgU1ZHQXR0cmlidXRlcyBleHRlbmRzIEhUTUxBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBhY2NlbnRIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFjY3VtdWxhdGU/ICAgICAgICAgICAgICAgIDogXCJub25lXCIgfCBcInN1bVwiXG4gICAgICAgICAgYWRkaXRpdmU/ICAgICAgICAgICAgICAgICAgOiBcInJlcGxhY2VcIiB8IFwic3VtXCJcbiAgICAgICAgICBhbGlnbm1lbnRCYXNlbGluZT8gICAgICAgICA6IFwiYXV0b1wiIHwgXCJiYXNlbGluZVwiIHwgXCJiZWZvcmUtZWRnZVwiIHwgXCJ0ZXh0LWJlZm9yZS1lZGdlXCIgfCBcIm1pZGRsZVwiIHwgXCJjZW50cmFsXCIgfCBcImFmdGVyLWVkZ2VcIiB8IFwidGV4dC1hZnRlci1lZGdlXCIgfCBcImlkZW9ncmFwaGljXCIgfCBcImFscGhhYmV0aWNcIiB8IFwiaGFuZ2luZ1wiIHwgXCJtYXRoZW1hdGljYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgYWxsb3dSZW9yZGVyPyAgICAgICAgICAgICAgOiBcIm5vXCIgfCBcInllc1wiXG4gICAgICAgICAgYWxwaGFiZXRpYz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhbXBsaXR1ZGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFyYWJpY0Zvcm0/ICAgICAgICAgICAgICAgIDogXCJpbml0aWFsXCIgfCBcIm1lZGlhbFwiIHwgXCJ0ZXJtaW5hbFwiIHwgXCJpc29sYXRlZFwiXG4gICAgICAgICAgYXNjZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZVR5cGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b1JldmVyc2U/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhemltdXRoPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VGcmVxdWVuY3k/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZWxpbmVTaGlmdD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlUHJvZmlsZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJib3g/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmVnaW4/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiaWFzPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2FsY01vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYXBIZWlnaHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXA/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFBhdGg/ICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aFVuaXRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXBSdWxlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JJbnRlcnBvbGF0aW9uPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb25GaWx0ZXJzPyA6IFwiYXV0b1wiIHwgXCJzUkdCXCIgfCBcImxpbmVhclJHQlwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBjb2xvclByb2ZpbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9yUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29udGVudFNjcmlwdFR5cGU/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U3R5bGVUeXBlPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN1cnNvcj8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3g/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGQ/ICAgICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW11cbiAgICAgICAgICBkZWNlbGVyYXRlPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRlc2NlbnQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlmZnVzZUNvbnN0YW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXJlY3Rpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpc3BsYXk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGl2aXNvcj8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkb21pbmFudEJhc2VsaW5lPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR1cj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHg/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVkZ2VNb2RlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWxldmF0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbmFibGVCYWNrZ3JvdW5kPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuZD8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZXhwb25lbnQ/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHRlcm5hbFJlc291cmNlc1JlcXVpcmVkPyA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGw/ICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsbE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWxsUnVsZT8gICAgICAgICAgICAgICAgICA6IFwibm9uemVyb1wiIHwgXCJldmVub2RkXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGZpbHRlcj8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsdGVyUmVzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZsb29kQ29sb3I/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RPcGFjaXR5PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb2N1c2FibGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRGYW1pbHk/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9udFNpemU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZUFkanVzdD8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTdHJldGNoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0eWxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250VmFyaWFudD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRXZWlnaHQ/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9ybWF0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmcm9tPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZ4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnMT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhOYW1lPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE9yaWVudGF0aW9uSG9yaXpvbnRhbD86IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25WZXJ0aWNhbD8gIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhSZWY/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBncmFkaWVudFRyYW5zZm9ybT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VW5pdHM/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGFuZ2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBob3JpekFkdlg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6T3JpZ2luWD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaWRlb2dyYXBoaWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbWFnZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGluMj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4/ICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlcmNlcHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGsxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGs0PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaz8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuZWxNYXRyaXg/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbFVuaXRMZW5ndGg/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmluZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlQb2ludHM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVNwbGluZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5VGltZXM/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsZW5ndGhBZGp1c3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxldHRlclNwYWNpbmc/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGlnaHRpbmdDb2xvcj8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaW1pdGluZ0NvbmVBbmdsZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxvY2FsPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyRW5kPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlck1pZD8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFya2VyU3RhcnQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlcldpZHRoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFzaz8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXNrQ29udGVudFVuaXRzPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hc2tVbml0cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWF0aGVtYXRpY2FsPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtb2RlPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG51bU9jdGF2ZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb2Zmc2V0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcGFjaXR5PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wZXJhdG9yPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JkZXI/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmllbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudGF0aW9uPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZ2luPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVyZmxvdz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJsaW5lUG9zaXRpb24/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVUaGlja25lc3M/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYWludE9yZGVyPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhbm9zZTE/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0aExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuQ29udGVudFVuaXRzPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm0/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblVuaXRzPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludGVyRXZlbnRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50cz8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFk/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0Wj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcHJlc2VydmVBbHBoYT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByaW1pdGl2ZVVuaXRzPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcj8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByYWRpdXM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlZlg/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZW5kZXJpbmdJbnRlbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcGVhdENvdW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0RHVyPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZEV4dGVuc2lvbnM/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRmVhdHVyZXM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVzdGFydD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN1bHQ/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvdGF0ZT8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNjYWxlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2VlZD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzaGFwZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNsb3BlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BhY2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVjdWxhckNvbnN0YW50PyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyRXhwb25lbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlZWQ/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcHJlYWRNZXRob2Q/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0T2Zmc2V0PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RkRGV2aWF0aW9uPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGVtaD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW12PyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RpdGNoVGlsZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdG9wQ29sb3I/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0b3BPcGFjaXR5PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaWtldGhyb3VnaFBvc2l0aW9uPyAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoVGhpY2tuZXNzPyAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmluZz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdHJva2VEYXNoYXJyYXk/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0cm9rZURhc2hvZmZzZXQ/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlTGluZWNhcD8gICAgICAgICAgICAgOiBcImJ1dHRcIiB8IFwicm91bmRcIiB8IFwic3F1YXJlXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZUxpbmVqb2luPyAgICAgICAgICAgIDogXCJtaXRlclwiIHwgXCJyb3VuZFwiIHwgXCJiZXZlbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBzdHJva2VNaXRlcmxpbWl0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZU9wYWNpdHk/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdXJmYWNlU2NhbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN5c3RlbUxhbmd1YWdlPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFibGVWYWx1ZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YXJnZXRYPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dEFuY2hvcj8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0RGVjb3JhdGlvbj8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRleHRMZW5ndGg/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dFJlbmRlcmluZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0bz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRyYW5zZm9ybT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuZGVybGluZVBvc2l0aW9uPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lVGhpY2tuZXNzPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGVCaWRpPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZVJhbmdlPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bml0c1BlckVtPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZBbHBoYWJldGljPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmFsdWVzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZWN0b3JFZmZlY3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnNpb24/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmVydEFkdlk/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2ZXJ0T3JpZ2luWD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5ZPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkhhbmdpbmc/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SWRlb2dyYXBoaWM/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpZXdCb3g/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmlld1RhcmdldD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2aXNpYmlsaXR5PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZNYXRoZW1hdGljYWw/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd2lkdGhzPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3b3JkU3BhY2luZz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdyaXRpbmdNb2RlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeDE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHg/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeENoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4SGVpZ2h0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHhsaW5rQWN0dWF0ZT8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtBcmNyb2xlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0hyZWY/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rUm9sZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtTaG93PyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1RpdGxlPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVHlwZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sQmFzZT8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxMYW5nPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbG5zPyAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnNYbGluaz8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxTcGFjZT8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHkxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeTI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHlDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgej8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB6b29tQW5kUGFuPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICB9XG59XG4iLCJcbmV4cG9ydCBpbnRlcmZhY2UgIERyYWdnYWJsZU9wdGlvbnNcbntcbiAgICAgaGFuZGxlcyAgICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBtaW5WZWxvY2l0eT8gICA6IG51bWJlclxuICAgICBtYXhWZWxvY2l0eT8gICA6IG51bWJlclxuICAgICB2ZWxvY2l0eUZhY3Rvcj86IG51bWJlclxuICAgICBvbkRyYWc/ICAgICAgICA6ICggZXZlbnQ6IERyYWdFdmVudCApID0+IHZvaWRcbiAgICAgb25TdGFydERyYWc/ICAgOiAoKSA9PiB2b2lkXG4gICAgIG9uU3RvcERyYWc/ICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gYm9vbGVhblxuICAgICBvbkVuZEFuaW1hdGlvbj86ICggIGV2ZW50OiBEcmFnRXZlbnQgICkgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBEcmFnZ2FibGVDb25maWcgPSBSZXF1aXJlZCA8RHJhZ2dhYmxlT3B0aW9ucz5cblxuZXhwb3J0IGludGVyZmFjZSBEcmFnRXZlbnRcbntcbiAgICAgeCAgICAgICAgOiBudW1iZXJcbiAgICAgeSAgICAgICAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WCAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WSAgOiBudW1iZXJcbiAgICAgdGFyZ2V0WDogbnVtYmVyXG4gICAgIHRhcmdldFk6IG51bWJlclxuICAgICBkZWxheSAgICA6IG51bWJlclxufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBEcmFnZ2FibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgbWluVmVsb2NpdHkgICA6IDAsXG4gICAgICAgICAgbWF4VmVsb2NpdHkgICA6IDEsXG4gICAgICAgICAgb25TdGFydERyYWcgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uRHJhZyAgICAgICAgOiAoKSA9PiB7fSxcbiAgICAgICAgICBvblN0b3BEcmFnICAgIDogKCkgPT4gdHJ1ZSxcbiAgICAgICAgICBvbkVuZEFuaW1hdGlvbjogKCkgPT4ge30sXG4gICAgICAgICAgdmVsb2NpdHlGYWN0b3I6ICh3aW5kb3cuaW5uZXJIZWlnaHQgPCB3aW5kb3cuaW5uZXJXaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gd2luZG93LmlubmVySGVpZ2h0IDogd2luZG93LmlubmVyV2lkdGgpIC8gMixcbiAgICAgfVxufVxuXG52YXIgaXNfZHJhZyAgICA9IGZhbHNlXG52YXIgcG9pbnRlcjogTW91c2VFdmVudCB8IFRvdWNoXG5cbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2dyZS8xNjUwMjk0XG52YXIgRWFzaW5nRnVuY3Rpb25zID0ge1xuICAgICBsaW5lYXIgICAgICAgIDogKCB0OiBudW1iZXIgKSA9PiB0LFxuICAgICBlYXNlSW5RdWFkICAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQsXG4gICAgIGVhc2VPdXRRdWFkICAgOiAoIHQ6IG51bWJlciApID0+IHQqKDItdCksXG4gICAgIGVhc2VJbk91dFF1YWQgOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyAyKnQqdCA6IC0xKyg0LTIqdCkqdCxcbiAgICAgZWFzZUluQ3ViaWMgICA6ICggdDogbnVtYmVyICkgPT4gdCp0KnQsXG4gICAgIGVhc2VPdXRDdWJpYyAgOiAoIHQ6IG51bWJlciApID0+ICgtLXQpKnQqdCsxLFxuICAgICBlYXNlSW5PdXRDdWJpYzogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gNCp0KnQqdCA6ICh0LTEpKigyKnQtMikqKDIqdC0yKSsxLFxuICAgICBlYXNlSW5RdWFydCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0LFxuICAgICBlYXNlT3V0UXVhcnQgIDogKCB0OiBudW1iZXIgKSA9PiAxLSgtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWFydDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gOCp0KnQqdCp0IDogMS04KigtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5RdWludCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWludCAgOiAoIHQ6IG51bWJlciApID0+IDErKC0tdCkqdCp0KnQqdCxcbiAgICAgZWFzZUluT3V0UXVpbnQ6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDE2KnQqdCp0KnQqdCA6IDErMTYqKC0tdCkqdCp0KnQqdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZHJhZ2dhYmxlICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyAgICAgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX2FjdGl2ZSAgPSBmYWxzZVxuICAgICB2YXIgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgIHZhciBjdXJyZW50X2V2ZW50OiBEcmFnRXZlbnRcblxuICAgICB2YXIgc3RhcnRfdGltZSA9IDBcbiAgICAgdmFyIHN0YXJ0X3ggICAgPSAwXG4gICAgIHZhciBzdGFydF95ICAgID0gMFxuXG4gICAgIHZhciB2ZWxvY2l0eV9kZWxheSA9IDUwMFxuICAgICB2YXIgdmVsb2NpdHlfeDogbnVtYmVyXG4gICAgIHZhciB2ZWxvY2l0eV95OiBudW1iZXJcblxuICAgICB2YXIgY3VycmVudF9hbmltYXRpb24gPSAtMVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IERyYWdnYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDAgKVxuICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3VjaEFjdGlvbiA9IFwibm9uZVwiXG5cbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWRkSGFuZGxlcyAoIC4uLiBoYW5kbGVzOiBKU1guRWxlbWVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggISBjb25maWcuaGFuZGxlcy5pbmNsdWRlcyAoaCkgKVxuICAgICAgICAgICAgICAgICAgICBjb25maWcuaGFuZGxlcy5wdXNoIChoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYWN0aXZlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBkZXNhY3RpdmF0ZSAoKVxuICAgICAgICAgICAgICAgYWN0aXZhdGUgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgICAgICAgaXNfYWN0aXZlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWRkSGFuZGxlcyxcbiAgICAgICAgICBpc0FjdGl2ZTogKCkgPT4gaXNfYWN0aXZlLFxuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcmRvd25cIiwgb25TdGFydCwgeyBwYXNzaXZlOiB0cnVlIH0gKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRpc2FibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiICwgb25TdGFydCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0ICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS53YXJuICggXCJUZW50YXRpdmUgZGUgZMOpbWFycmFnZSBkZXMgw6l2w6luZW1lbnRzIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcImRyYWdnYWJsZSBcXFwiIGTDqWrDoCBlbiBjb3Vycy5cIiApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2FuaW1hdGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9pbnRlciA9IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVybW92ZVwiLCBvbk1vdmUpXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcnVwXCIgICwgb25FbmQpXG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25TdGFydCApXG5cbiAgICAgICAgICBpc19kcmFnID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uTW92ZSAoIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgPT0gZmFsc2UgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICA/IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzIFswXVxuICAgICAgICAgICAgICAgICAgICA6IChldmVudCBhcyBNb3VzZUV2ZW50KVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcblxuICAgICAgICAgIGlzX2RyYWcgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25TdGFydCAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3ggICAgPSBwb2ludGVyLmNsaWVudFhcbiAgICAgICAgICBzdGFydF95ICAgID0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgc3RhcnRfdGltZSA9IG5vd1xuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5ICAgIDogMCxcbiAgICAgICAgICAgICAgIHggICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIHkgICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFggIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFkgIDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFg6IDAsXG4gICAgICAgICAgICAgICB0YXJnZXRZOiAwLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbmZpZy5vblN0YXJ0RHJhZyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25GcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgdmVsb2NpdHlGYWN0b3IgfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgY29uc3QgeCAgICAgICAgICAgPSBwb2ludGVyLmNsaWVudFggLSBzdGFydF94XG4gICAgICAgICAgY29uc3QgeSAgICAgICAgICAgPSBzdGFydF95IC0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgY29uc3QgZGVsYXkgICAgICAgPSBub3cgLSBzdGFydF90aW1lXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0RGVsYXkgPSBkZWxheSAtIGN1cnJlbnRfZXZlbnQuZGVsYXlcbiAgICAgICAgICBjb25zdCBvZmZzZXRYICAgICA9IHggLSBjdXJyZW50X2V2ZW50LnhcbiAgICAgICAgICBjb25zdCBvZmZzZXRZICAgICA9IHkgLSBjdXJyZW50X2V2ZW50LnlcblxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSB7XG4gICAgICAgICAgICAgICBkZWxheSxcbiAgICAgICAgICAgICAgIHgsXG4gICAgICAgICAgICAgICB5LFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogeCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IHksXG4gICAgICAgICAgICAgICBvZmZzZXRYLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcbiAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uRnJhbWUgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RhcnRfdGltZSAgICAgPSBub3dcbiAgICAgICAgICAgICAgIHN0YXJ0X3ggICAgICAgID0geFxuICAgICAgICAgICAgICAgc3RhcnRfeSAgICAgICAgPSB5XG4gICAgICAgICAgICAgICB2ZWxvY2l0eV94ICAgICAgID0gdmVsb2NpdHlGYWN0b3IgKiBub3JtICggb2Zmc2V0WCAvIG9mZnNldERlbGF5IClcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3kgICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRZIC8gb2Zmc2V0RGVsYXkgKVxuXG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFggKz0gdmVsb2NpdHlfeFxuICAgICAgICAgICAgICAgY3VycmVudF9ldmVudC50YXJnZXRZICs9IHZlbG9jaXR5X3lcblxuICAgICAgICAgICAgICAgaWYgKCBjb25maWcub25TdG9wRHJhZyAoIGN1cnJlbnRfZXZlbnQgKSA9PT0gdHJ1ZSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uVmVsb2NpdHlGcmFtZSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gbm9ybSAoIHZhbHVlOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICh2YWx1ZSA8IC0xIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG5cbiAgICAgICAgICAgICAgIGlmICggdmFsdWUgPiAxIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uVmVsb2NpdHlGcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRlbGF5ID0gbm93IC0gc3RhcnRfdGltZVxuXG4gICAgICAgICAgY29uc3QgdCA9IGRlbGF5ID49IHZlbG9jaXR5X2RlbGF5XG4gICAgICAgICAgICAgICAgICA/IDFcbiAgICAgICAgICAgICAgICAgIDogZGVsYXkgLyB2ZWxvY2l0eV9kZWxheVxuXG4gICAgICAgICAgY29uc3QgZmFjdG9yICA9IEVhc2luZ0Z1bmN0aW9ucy5lYXNlT3V0UXVhcnQgKHQpXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IHZlbG9jaXR5X3ggKiBmYWN0b3JcbiAgICAgICAgICBjb25zdCBvZmZzZXRZID0gdmVsb2NpdHlfeSAqIGZhY3RvclxuXG4gICAgICAgICAgY3VycmVudF9ldmVudC54ICAgICAgID0gc3RhcnRfeCArIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnkgICAgICAgPSBzdGFydF95ICsgb2Zmc2V0WVxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQub2Zmc2V0WCA9IHZlbG9jaXR5X3ggLSBvZmZzZXRYXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRZID0gdmVsb2NpdHlfeSAtIG9mZnNldFlcblxuICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcblxuICAgICAgICAgIGlmICggdCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzdG9wVmVsb2NpdHlGcmFtZSAoKVxuICAgICB7XG4gICAgICAgICAgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lICggY3VycmVudF9hbmltYXRpb24gKVxuICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICB9XG59XG4iLCJcbmV4cG9ydCB0eXBlIEV4dGVuZGVkQ1NTU3R5bGVEZWNsYXJhdGlvbiA9IENTU1N0eWxlRGVjbGFyYXRpb24gJlxue1xuICAgIGRpc3BsYXkgICAgICA6IFwiaW5saW5lXCIgfCBcImJsb2NrXCIgfCBcImNvbnRlbnRzXCIgfCBcImZsZXhcIiB8IFwiZ3JpZFwiIHwgXCJpbmxpbmUtYmxvY2tcIiB8IFwiaW5saW5lLWZsZXhcIiB8IFwiaW5saW5lLWdyaWRcIiB8IFwiaW5saW5lLXRhYmxlXCIgfCBcImxpc3QtaXRlbVwiIHwgXCJydW4taW5cIiB8IFwidGFibGVcIiB8IFwidGFibGUtY2FwdGlvblwiIHwgXCJ0YWJsZS1jb2x1bW4tZ3JvdXBcIiB8IFwidGFibGUtaGVhZGVyLWdyb3VwXCIgfCBcInRhYmxlLWZvb3Rlci1ncm91cFwiIHwgXCJ0YWJsZS1yb3ctZ3JvdXBcIiB8IFwidGFibGUtY2VsbFwiIHwgXCJ0YWJsZS1jb2x1bW5cIiB8IFwidGFibGUtcm93XCIgfCBcIm5vbmVcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBmbGV4RGlyZWN0aW9uOiBcInJvd1wiIHwgXCJyb3ctcmV2ZXJzZVwiIHwgXCJjb2x1bW5cIiB8IFwiY29sdW1uLXJldmVyc2VcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvdyAgICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dYICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93WSAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBwb3NpdGlvbiAgICAgOiBcInN0YXRpY1wiIHwgXCJhYnNvbHV0ZVwiIHwgXCJmaXhlZFwiIHwgXCJyZWxhdGl2ZVwiIHwgXCJzdGlja3lcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbn1cblxuLypkZWNsYXJlIGdsb2JhbHtcblxuICAgICBpbnRlcmZhY2UgV2luZG93XG4gICAgIHtcbiAgICAgICAgICBvbjogV2luZG93IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IFdpbmRvdyBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgY3NzICggcHJvcGVydGllczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApOiB0aGlzXG5cbiAgICAgICAgICBjc3NJbnQgICAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG4gICAgICAgICAgY3NzRmxvYXQgKCBwcm9wZXJ0eTogc3RyaW5nICk6IG51bWJlclxuXG4gICAgICAgICAgb24gOiBIVE1MRWxlbWVudCBbXCJhZGRFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgb2ZmOiBIVE1MRWxlbWVudCBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgJCAgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yXCJdXG4gICAgICAgICAgJCQgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yQWxsXCJdXG4gICAgIH1cbn1cblxuV2luZG93LnByb3RvdHlwZS5vbiAgPSBXaW5kb3cucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJcbldpbmRvdy5wcm90b3R5cGUub2ZmID0gV2luZG93LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uICggcHJvcHMgKVxue1xuT2JqZWN0LmFzc2lnbiAoIHRoaXMuc3R5bGUsIHByb3BzIClcbnJldHVybiB0aGlzXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3NGbG9hdCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuRWxlbWVudC5wcm90b3R5cGUub24gID0gRWxlbWVudC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuXG5FbGVtZW50LnByb3RvdHlwZS5vZmYgPSBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLiQgICA9IEVsZW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JcblxuRWxlbWVudC5wcm90b3R5cGUuJCQgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbFxuXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufSovXG5cbmV4cG9ydCBmdW5jdGlvbiBjc3MgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApXG57XG4gICAgIE9iamVjdC5hc3NpZ24gKCBlbC5zdHlsZSwgcHJvcHMgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3NzRmxvYXQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NJbnQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCBlbC5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKVxuXG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUludCAoIHN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuIiwiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgY3NzSW50IH0gZnJvbSBcIi4vZG9tLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcblxuLy9leHBvcnQgdHlwZSBFeHBlbmRhYmxlUHJvcGVydHkgPSBcIndpZHRoXCIgfCBcImhlaWdodFwiXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFwidG9wXCIgfCBcImxlZnRcIiB8IFwiYm90dG9tXCIgfCBcInJpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG5leHBvcnQgdHlwZSBFeHBlbmRhYmxlRWxlbWVudCA9IFJldHVyblR5cGUgPHR5cGVvZiBleHBhbmRhYmxlPlxuXG50eXBlIEV4cGVuZGFibGVPcHRpb25zID0gUGFydGlhbCA8RXhwZW5kYWJsZUNvbmZpZz5cblxuaW50ZXJmYWNlIEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgaGFuZGxlcyAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgcHJvcGVydHk/ICAgIDogc3RyaW5nLFxuICAgICBvcGVuICAgICAgICAgOiBib29sZWFuXG4gICAgIG5lYXIgICAgICAgICA6IG51bWJlclxuICAgICBkZWxheSAgICAgICAgOiBudW1iZXJcbiAgICAgZGlyZWN0aW9uICAgIDogRGlyZWN0aW9uXG4gICAgIG1pblNpemUgICAgICA6IG51bWJlclxuICAgICBtYXhTaXplICAgICAgOiBudW1iZXJcbiAgICAgdW5pdCAgICAgICAgIDogXCJweFwiIHwgXCIlXCIgfCBcIlwiLFxuICAgICBvbkJlZm9yZU9wZW4gOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHZvaWRcbiAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4gdm9pZFxuICAgICBvbkFmdGVyQ2xvc2UgOiAoKSA9PiB2b2lkXG59XG5cbmNvbnN0IHZlcnRpY2FsUHJvcGVydGllcyA9IFsgXCJoZWlnaHRcIiwgXCJ0b3BcIiwgXCJib3R0b21cIiBdXG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgOiBbXSxcbiAgICAgICAgICBwcm9wZXJ0eSAgICAgOiBcImhlaWdodFwiLFxuICAgICAgICAgIG9wZW4gICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgIG5lYXIgICAgICAgICA6IDQwLFxuICAgICAgICAgIGRlbGF5ICAgICAgICA6IDI1MCxcbiAgICAgICAgICBtaW5TaXplICAgICAgOiAwLFxuICAgICAgICAgIG1heFNpemUgICAgICA6IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgICAgICAgICB1bml0ICAgICAgICAgOiBcInB4XCIsXG4gICAgICAgICAgZGlyZWN0aW9uICAgIDogXCJ0YlwiLFxuICAgICAgICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHt9LFxuICAgICB9XG59XG5cbmNvbnN0IHRvU2lnbiA9IHtcbiAgICAgbHIgOiAxLFxuICAgICBybCA6IC0xLFxuICAgICB0YiA6IC0xLFxuICAgICBidCA6IDEsXG59XG5jb25zdCB0b1Byb3BlcnR5IDogUmVjb3JkIDxEaXJlY3Rpb24sIHN0cmluZz4gPSB7XG4gICAgIGxyIDogXCJ3aWR0aFwiLFxuICAgICBybCA6IFwid2lkdGhcIixcbiAgICAgdGIgOiBcImhlaWdodFwiLFxuICAgICBidCA6IFwiaGVpZ2h0XCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IEV4cGVuZGFibGVPcHRpb25zID0ge30gKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX29wZW4gICAgOiBib29sZWFuXG4gICAgIHZhciBpc192ZXJ0aWNhbDogYm9vbGVhblxuICAgICB2YXIgc2lnbiAgICAgICA6IG51bWJlclxuICAgICB2YXIgdW5pdCAgICAgICA6IEV4cGVuZGFibGVDb25maWcgW1widW5pdFwiXVxuICAgICB2YXIgY2IgICAgICAgICA6ICgpID0+IHZvaWRcbiAgICAgdmFyIG1pblNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIG1heFNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIHN0YXJ0X3NpemUgID0gMFxuICAgICB2YXIgb3Blbl9zaXplICAgPSAxMDBcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgb25TdGFydERyYWcgICA6IG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiBvblN0b3BEcmFnLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiBvbkVuZEFuaW1hdGlvbixcbiAgICAgfSlcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zID0ge30gYXMgRXhwZW5kYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBvcHRpb25zLnByb3BlcnR5ID09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmRpcmVjdGlvbiAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3B0aW9ucy5wcm9wZXJ0eSA9IHRvUHJvcGVydHkgW29wdGlvbnMuZGlyZWN0aW9uXVxuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc19vcGVuICAgICA9IGNvbmZpZy5vcGVuXG4gICAgICAgICAgc2lnbiAgICAgICAgPSB0b1NpZ24gW2NvbmZpZy5kaXJlY3Rpb25dXG4gICAgICAgICAgdW5pdCAgICAgICAgPSBjb25maWcudW5pdFxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gY29uZmlnLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgY29uZmlnLmRpcmVjdGlvbiA9PSBcInRiXCIgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgICBtaW5TaXplID0gY29uZmlnLm1pblNpemVcbiAgICAgICAgICBtYXhTaXplID0gY29uZmlnLm1heFNpemVcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIGlzX3ZlcnRpY2FsID8gXCJob3Jpem9udGFsXCIgOiBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAgICAoIGlzX3ZlcnRpY2FsID8gXCJ2ZXJ0aWNhbFwiIDogXCJob3Jpem9udGFsXCIgKVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWcgOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIH0pXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gc2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGlzX29wZW4gPyBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKSA6IDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b2dnbGUgKClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfb3BlbiApXG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvcGVuICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVPcGVuICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwiY2xvc2VcIiwgXCJvcGVuXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJPcGVuXG4gICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBvcGVuX3NpemUgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVDbG9zZSAoKVxuXG4gICAgICAgICAgb3Blbl9zaXplID0gc2l6ZSAoKVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlcGxhY2UgKCBcIm9wZW5cIiwgXCJjbG9zZVwiIClcblxuICAgICAgICAgIGlmICggY2IgKVxuICAgICAgICAgICAgICAgb25UcmFuc2l0aW9uRW5kICgpXG5cbiAgICAgICAgICBjYiA9IGNvbmZpZy5vbkFmdGVyQ2xvc2VcbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IFwiMFwiICsgdW5pdFxuXG4gICAgICAgICAgaXNfb3BlbiA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBvcGVuLFxuICAgICAgICAgIGNsb3NlLFxuICAgICAgICAgIHRvZ2dsZSxcbiAgICAgICAgICBpc09wZW4gICAgIDogKCkgPT4gaXNfb3BlbixcbiAgICAgICAgICBpc0Nsb3NlICAgIDogKCkgPT4gISBpc19vcGVuLFxuICAgICAgICAgIGlzVmVydGljYWwgOiAoKSA9PiBpc192ZXJ0aWNhbCxcbiAgICAgICAgICBpc0FjdGl2ZSAgIDogKCkgPT4gZHJhZ2dhYmxlLmlzQWN0aXZlICgpLFxuICAgICAgICAgIGFjdGl2YXRlICAgOiAoKSA9PiBkcmFnZ2FibGUuYWN0aXZhdGUgKCksXG4gICAgICAgICAgZGVzYWN0aXZhdGU6ICgpID0+IGRyYWdnYWJsZS5kZXNhY3RpdmF0ZSAoKSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBjYiAoKVxuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCAoKSA9PiBvblRyYW5zaXRpb25FbmQgKVxuICAgICAgICAgIGNiID0gbnVsbFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3NpemUgPSBzaXplICgpXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyAoIG1pblNpemUsIGV2ZW50LnksIG1heFNpemUgKVxuICAgICAgICAgIGNvbnNvbGUubG9nICggY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXQgKVxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IGNsYW1wICggc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC55ICkgKyB1bml0XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnggKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgaXNfbW92ZWQgPSBpc192ZXJ0aWNhbCA/IHNpZ24gKiBldmVudC55ID4gY29uZmlnLm5lYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHNpZ24gKiBldmVudC54ID4gY29uZmlnLm5lYXJcblxuICAgICAgICAgIGlmICggKGlzX21vdmVkID09IGZhbHNlKSAmJiBldmVudC5kZWxheSA8PSBjb25maWcuZGVsYXkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRvZ2dsZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdGFyZ2V0X3NpemUgPSBjbGFtcCAoXG4gICAgICAgICAgICAgICBpc192ZXJ0aWNhbCA/IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnRhcmdldFhcbiAgICAgICAgICApXG5cbiAgICAgICAgICBpZiAoIHRhcmdldF9zaXplIDw9IGNvbmZpZy5uZWFyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kQW5pbWF0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBvcGVuX3NpemUgPSBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKVxuICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGNsYW1wICggdjogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGlmICggdiA8IG1pblNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1pblNpemVcblxuICAgICAgICAgIGlmICggdiA+IG1heFNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1heFNpemVcblxuICAgICAgICAgIHJldHVybiB2XG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgQ3NzIH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgeyBjc3NGbG9hdCB9IGZyb20gXCIuL2RvbS5qc1wiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi94bm9kZS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uICAgPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgT3JpZW50YXRpb24gPSBcInZlcnRpY2FsXCIgfCBcImhvcml6b250YWxcIlxudHlwZSBVbml0cyAgICAgICA9IFwicHhcIiB8IFwiJVwiXG50eXBlIFN3aXBlYWJsZVByb3BlcnR5ID0gXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG50eXBlIFN3aXBlYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxTd2lwZWFibGVDb25maWc+XG5cbnR5cGUgU3dpcGVhYmxlQ29uZmlnID0ge1xuICAgICBoYW5kbGVzICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBkaXJlY3Rpb24gOiBEaXJlY3Rpb24sXG4gICAgIHBvcnBlcnR5PyA6IFN3aXBlYWJsZVByb3BlcnR5XG4gICAgIG1pblZhbHVlICA6IG51bWJlcixcbiAgICAgbWF4VmFsdWUgIDogbnVtYmVyLFxuICAgICB1bml0cyAgICAgOiBVbml0cyxcbiAgICAgbW91c2VXaGVlbDogYm9vbGVhblxufVxuXG5leHBvcnQgdHlwZSBTd2lwZWFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIHN3aXBlYWJsZT5cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogU3dpcGVhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uIDogXCJsclwiLFxuICAgICAgICAgIHBvcnBlcnR5ICA6IFwibGVmdFwiLFxuICAgICAgICAgIG1pblZhbHVlICA6IC0xMDAsXG4gICAgICAgICAgbWF4VmFsdWUgIDogMCxcbiAgICAgICAgICB1bml0cyAgICAgOiBcIiVcIixcbiAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICB9XG59XG5cbnZhciBzdGFydF9wb3NpdGlvbiA9IDBcbnZhciBpc192ZXJ0aWNhbCAgICA9IGZhbHNlXG52YXIgcHJvcCA6IFN3aXBlYWJsZVByb3BlcnR5XG5cbmV4cG9ydCBmdW5jdGlvbiBzd2lwZWFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogU3dpcGVhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvblN0b3BEcmFnLFxuICAgICB9KVxuXG4gICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwic3dpcGVhYmxlXCIgKVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IFN3aXBlYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc192ZXJ0aWNhbCA9IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG5cbiAgICAgICAgICBpZiAoIG9wdGlvbnMucG9ycGVydHkgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIGNvbmZpZy5wb3JwZXJ0eSA9IGlzX3ZlcnRpY2FsID8gXCJ0b3BcIiA6IFwibGVmdFwiXG5cbiAgICAgICAgICAvLyBzd2l0Y2ggKCBjb25maWcucG9ycGVydHkgKVxuICAgICAgICAgIC8vIHtcbiAgICAgICAgICAvLyBjYXNlIFwidG9wXCI6IGNhc2UgXCJib3R0b21cIjogY2FzZSBcInlcIjogaXNfdmVydGljYWwgPSB0cnVlICA7IGJyZWFrXG4gICAgICAgICAgLy8gY2FzZSBcImxlZnRcIjogY2FzZSBcInJpZ2h0XCI6IGNhc2UgXCJ4XCI6IGlzX3ZlcnRpY2FsID0gZmFsc2UgOyBicmVha1xuICAgICAgICAgIC8vIGRlZmF1bHQ6IGRlYnVnZ2VyIDsgcmV0dXJuXG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWc6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWwgOiBvbkRyYWdIb3Jpem9udGFsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHByb3AgPSBjb25maWcucG9ycGVydHlcblxuICAgICAgICAgIGlmICggZHJhZ2dhYmxlLmlzQWN0aXZlICgpIClcbiAgICAgICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gcG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBjc3NGbG9hdCAoIGVsZW1lbnQsIHByb3AgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkcmFnZ2FibGUuZGVzYWN0aXZhdGUgKClcbiAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmcgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogbnVtYmVyLCB1bml0czogVW5pdHMgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdT86IFVuaXRzIClcbiAgICAge1xuICAgICAgICAgIGlmICggdHlwZW9mIG9mZnNldCA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB1ID0gQ3NzLmdldFVuaXQgKCBvZmZzZXQgKSBhcyBVbml0c1xuICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCAhIFtcInB4XCIsIFwiJVwiXS5pbmNsdWRlcyAoIHUgKSApXG4gICAgICAgICAgICAgICB1ID0gXCJweFwiXG5cbiAgICAgICAgICBpZiAoIHUgIT0gY29uZmlnLnVuaXRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICh1ID0gY29uZmlnLnVuaXRzKSA9PSBcIiVcIiApXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGVyY2VudHMgKCBvZmZzZXQgKVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0b1BpeGVscyAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIG9mZnNldCApICsgdVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgc3dpcGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGlmICggY29uZmlnLm1vdXNlV2hlZWwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgICAgICBoLmFkZEV2ZW50TGlzdGVuZXIgKCBcIndoZWVsXCIsIG9uV2hlZWwsIHsgcGFzc2l2ZTogdHJ1ZSB9IClcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGgucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwid2hlZWxcIiwgb25XaGVlbCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiB0b1BpeGVscyAoIHBlcmNlbnRhZ2U6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG1pblZhbHVlOiBtaW4sIG1heFZhbHVlOiBtYXggfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgaWYgKCBwZXJjZW50YWdlIDwgMTAwIClcbiAgICAgICAgICAgICAgIHBlcmNlbnRhZ2UgPSAxMDAgKyBwZXJjZW50YWdlXG5cbiAgICAgICAgICByZXR1cm4gbWluICsgKG1heCAtIG1pbikgKiBwZXJjZW50YWdlIC8gMTAwXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gdG9QZXJjZW50cyAoIHBpeGVsczogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG4gICAgICAgICAgcmV0dXJuIE1hdGguYWJzICggKHBpeGVscyAtIG1pbikgLyAobWF4IC0gbWluKSAqIDEwMCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIHN0YXJ0X3Bvc2l0aW9uID0gcG9zaXRpb24gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueCApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZyAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNfdmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50LnkgLy8rIGV2ZW50LnZlbG9jaXR5WVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogZXZlbnQueCAvLysgZXZlbnQudmVsb2NpdHlYXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBvZmZzZXQgKSArIGNvbmZpZy51bml0c1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25XaGVlbCAoIGV2ZW50OiBXaGVlbEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggZXZlbnQuZGVsdGFNb2RlICE9IFdoZWVsRXZlbnQuRE9NX0RFTFRBX1BJWEVMIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBpc192ZXJ0aWNhbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVhcblxuICAgICAgICAgICAgICAgaWYgKCBkZWx0YSA9PSAwIClcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggcG9zaXRpb24gKCkgKyBkZWx0YSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2YWx1ZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB2YWx1ZSA8IGNvbmZpZy5taW5WYWx1ZSA/IGNvbmZpZy5taW5WYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZSA+IGNvbmZpZy5tYXhWYWx1ZSA/IGNvbmZpZy5tYXhWYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZVxuICAgICB9XG59XG4iLCJcblxuaW1wb3J0IHsgdUV2ZW50IH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5cbnR5cGUgUmVjb3JkcyA9IFJlY29yZCA8c3RyaW5nLCAoIC4uLiBhcmdzOiBhbnkgKSA9PiBhbnk+XG5cbmV4cG9ydCBpbnRlcmZhY2UgJENvbW1hbmQgZXh0ZW5kcyAkTm9kZVxue1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXBwbGljYXRpb25cIlxuICAgICB0eXBlOiBcImNvbW1hbmRcIlxuICAgICBuYW1lOiBzdHJpbmdcbiAgICAgc2hvcnRjdXQ6IHN0cmluZ1xufVxuXG5leHBvcnQgY2xhc3MgQ29tbWFuZHMgPFxuICAgICBDbWRzICAgZXh0ZW5kcyBSZWNvcmRzLFxuICAgICBDTmFtZXMgZXh0ZW5kcyBrZXlvZiBDbWRzXG4+XG57XG4gICAgIHN0YXRpYyBnZXQgY3VycmVudCAoKSB7IHJldHVybiBjdXJyZW50IH1cblxuICAgICByZWFkb25seSBkYiA9IHt9IGFzIENtZHNcbiAgICAgcmVhZG9ubHkgZXZlbnRzID0ge30gYXMgUmVjb3JkIDxDTmFtZXMsIHVFdmVudC5JRXZlbnQ+XG5cbiAgICAgY29uc3RydWN0b3IgKCkge31cblxuICAgICBhZGQgPEsgZXh0ZW5kcyBDTmFtZXM+ICggbmFtZTogSywgY2FsbGJhY2s6IENtZHMgW0tdIClcbiAgICAge1xuICAgICAgICAgIGlmICggbmFtZSBpbiB0aGlzLmRiIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICB0aGlzLmRiIFtuYW1lXSA9IGNhbGxiYWNrXG4gICAgIH1cblxuICAgICBoYXMgKCBrZXk6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ga2V5IGluIHRoaXMuZGJcbiAgICAgfVxuXG4gICAgIHJ1biA8SyBleHRlbmRzIENOYW1lcz4gKCBuYW1lOiBLLCAuLi4gYXJnczogUGFyYW1ldGVycyA8Q21kcyBbS10+IClcbiAgICAge1xuICAgICAgICAgIGlmICggbmFtZSBpbiB0aGlzLmRiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmRiIFtuYW1lXSAoIC4uLiBhcmdzIGFzIGFueSApXG5cbiAgICAgICAgICAgICAgIGlmICggbmFtZSBpbiB0aGlzLmV2ZW50cyApXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzIFtuYW1lXS5kaXNwYXRjaCAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIG9uICggbmFtZTogQ05hbWVzLCBjYWxsYmFjazogKCkgPT4gdm9pZCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBuYW1lIGluIHRoaXMuZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuZXZlbnRzIFtuYW1lXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmV2ZW50cyBbbmFtZV0gPSB1RXZlbnQuY3JlYXRlICgpXG5cbiAgICAgICAgICBjYWxsYmFja3MgKCBjYWxsYmFjayApXG4gICAgIH1cblxuICAgICByZW1vdmUgKCBrZXk6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5kYiBba2V5XVxuICAgICB9XG59XG5cbmNvbnN0IGN1cnJlbnQgPSBuZXcgQ29tbWFuZHMgKClcbiIsIlxuaW1wb3J0IHsgY3JlYXRlTm9kZSB9IGZyb20gXCIuLi8uLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQ29tcG9uZW50IDxDIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyAkQ2x1c3RlciA8Qz5cbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IFwiY29uY2VwdC11aVwiXG4gICAgICAgICAgdHlwZTogc3RyaW5nXG4gICAgICAgICAgY2hpbGRyZW4/OiBDIFtdIC8vIFJlY29yZCA8c3RyaW5nLCAkQ2hpbGQ+XG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCA8JCBleHRlbmRzICRDb21wb25lbnQgPSAkQ29tcG9uZW50Plxue1xuICAgICBkYXRhOiAkXG5cbiAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuICAgICBkZWZhdWx0RGF0YSAoKSA6ICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKFxuICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUgKCBkYXRhLnR5cGUsIGRhdGEuaWQsIGRhdGEgKSBhcyBhbnlcbiAgICAgICAgICApXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpOiAoSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50KSBbXVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gPGRpdiBjbGFzcz17IHRoaXMuZGF0YS50eXBlIH0+PC9kaXY+XG4gICAgICAgICAgICAgICB0aGlzLm9uQ3JlYXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG1ha2VIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgKFwiTm90IGltcGxlbWVudGVkXCIpXG4gICAgIH1cblxuICAgICBwcm90ZWN0ZWQgbWFrZVN2ZyAoKVxuICAgICB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIChcIk5vdCBpbXBsZW1lbnRlZFwiKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG1ha2VGYWJyaWMgKClcbiAgICAge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoXCJOb3QgaW1wbGVtZW50ZWRcIilcbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlSHRtbCAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlU3ZnICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgb25DcmVhdGVGYWJyaWMgKClcbiAgICAge1xuXG4gICAgIH1cblxufVxuXG5cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9EYXRhL2luZGV4LnRzXCIgLz5cblxuaW1wb3J0IHsgRmFjdG9yeSwgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtdWlcIlxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSA8JEFueUNvbXBvbmVudHM+ICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPENvbXBvbmVudCwgJEFueUNvbXBvbmVudHM+ICggZGIgKVxuXG5leHBvcnQgY29uc3QgaW5TdG9jazogdHlwZW9mIGZhY3RvcnkuaW5TdG9jayA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5faW5TdG9jayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgcGljazogdHlwZW9mIGZhY3RvcnkucGljayA9IGZ1bmN0aW9uICggLi4uIHJlc3Q6IGFueSBbXSApXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5fcGljayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgbWFrZTogdHlwZW9mIGZhY3RvcnkubWFrZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICBpZiAoIGlzTm9kZSAoIGFyZyApIClcbiAgICAgICAgICB2YXIgZGF0YSA9IGFyZ1xuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9tYWtlICggcGF0aCwgZGF0YSApXG59XG5cbmV4cG9ydCBjb25zdCBzZXQ6IHR5cGVvZiBkYi5zZXQgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcblxuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAgZGIuc2V0ICggYXJnIClcbiAgICAgZWxzZVxuICAgICAgICAgIGRiLnNldCAoIGFyZywgbm9ybWFsaXplICggYXJndW1lbnRzIFsxXSApIClcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmluZTogdHlwZW9mIGZhY3RvcnkuZGVmaW5lID0gZnVuY3Rpb24gKCBjdG9yOiBhbnksIC4uLiByZXN0OiBhbnkgKVxue1xuICAgICBjb25zdCBhcmcgPSByZXN0Lmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIHJlc3QgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiByZXN0XSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgcGF0aCApXG59XG5cblxuZnVuY3Rpb24gaXNOb2RlICggb2JsOiBhbnkgKVxue1xuICAgICByZXR1cm4gdHlwZW9mIG9ibCA9PSBcIm9iamVjdFwiICYmICEgQXJyYXkuaXNBcnJheSAob2JsKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBhcmc6IGFueSApXG57XG4gICAgIGlmICggQXJyYXkuaXNBcnJheSAoYXJnKSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZyBbMF0gIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgYXJnLnVuc2hpZnQgKCBDT05URVhUIClcbiAgICAgfVxuICAgICBlbHNlIGlmICggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiIClcbiAgICAge1xuICAgICAgICAgIGlmICggXCJjb250ZXh0XCIgaW4gYXJnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGFyZy5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAoYXJnIGFzIGFueSkuY29udGV4dCA9IENPTlRFWFRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJnXG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRQaGFudG9tIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJwaGFudG9tXCJcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGhhbnRvbSBleHRlbmRzIENvbXBvbmVudCA8JFBoYW50b20+XG57XG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiZGl2XCIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmNvbnRlbnRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIuY2hpbGROb2RlcyBhcyBhbnkgYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxufVxuXG5cbiIsIlxuaW1wb3J0IHsgcGljaywgaW5TdG9jaywgbWFrZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IFBoYW50b20gfSBmcm9tIFwiLi4vLi4vQ29tcG9uZW50L1BoYW50b20vaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4veG5vZGUuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRDb250YWluZXIgPEMgZXh0ZW5kcyAkQ29tcG9uZW50ID0gJEFueUNvbXBvbmVudHM+IGV4dGVuZHMgJENvbXBvbmVudCAvL0RhdGEuJENsdXN0ZXIgPEM+XG4gICAgIHtcbiAgICAgICAgICBkaXJlY3Rpb24/OiBEaXJlY3Rpb25cbiAgICAgICAgICBjaGlsZHJlbj86IEMgW10gLy8gUmVjb3JkIDxzdHJpbmcsICBDPlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb250YWluZXIgPCQgZXh0ZW5kcyAkQ29udGFpbmVyID0gJENvbnRhaW5lcj4gZXh0ZW5kcyBDb21wb25lbnQgPCQ+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbXBvbmVudD5cbiAgICAgc2xvdDogSlNYLkVsZW1lbnRcblxuICAgICByZWFkb25seSBpc192ZXJ0aWNhbDogYm9vbGVhblxuXG4gICAgIGRlZmF1bHREYXRhICgpIDogJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgOiBcImNvbXBvbmVudFwiLFxuICAgICAgICAgICAgICAgaWQgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6ICQgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBkYXRhIClcblxuICAgICAgICAgIGRhdGEgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW5cblxuICAgICAgICAgIGlmICggY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGluU3RvY2sgKCBjaGlsZCApIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlICggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuaXNfdmVydGljYWwgPSBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgID0gc3VwZXIuZ2V0SHRtbCAoKVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3QgZGF0YSAgICAgID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgaWYgKCB0aGlzLmlzX3ZlcnRpY2FsIClcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSAoIFwidmVydGljYWxcIiApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuc2xvdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy5zbG90ID0gY29udGFpbmVyXG5cbiAgICAgICAgICBjb25zdCBzbG90ID0gdGhpcy5zbG90XG5cbiAgICAgICAgICBpZiAoIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG5ld19jaGlsZHJlbiA9IFtdIGFzIENvbXBvbmVudCBbXVxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbyA9IHBpY2sgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgIHNsb3QuYXBwZW5kICggLi4uIG8uZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuIFtvLmRhdGEuaWRdID0gb1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICB0aGlzLm9uQ2hpbGRyZW5BZGRlZCAoIG5ld19jaGlsZHJlbiApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cblxuICAgICBvbkNoaWxkcmVuQWRkZWQgKCBjb21wb25lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGFwcGVuZCAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQW55Q29tcG9uZW50cykgW10gKVxuICAgICB7XG5cbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IHNsb3QgICAgICA9IHRoaXMuc2xvdFxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuICA9IHRoaXMuY2hpbGRyZW5cbiAgICAgICAgICBjb25zdCBuZXdfY2hpbGQgPSBbXSBhcyBDb21wb25lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBlIG9mIGVsZW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBlID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlID0gbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZSBpZiAoIGUgaW5zdGFuY2VvZiBFbGVtZW50IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgVUlfQ09NUE9ORU5UID0gU3ltYm9sLmZvciAoIFwiVUlfQ09NUE9ORU5UXCIgKVxuXG4gICAgICAgICAgICAgICAgICAgIGUgPSBlIFtVSV9DT01QT05FTlRdICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZSBbVUlfQ09NUE9ORU5UXVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwaGFudG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlLm91dGVySFRNTFxuICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggIShlIGluc3RhbmNlb2YgQ29tcG9uZW50KSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBpblN0b2NrICggZSApXG4gICAgICAgICAgICAgICAgICAgICAgPyBwaWNrICggZSApXG4gICAgICAgICAgICAgICAgICAgICAgOiBtYWtlICggZSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGNoaWxkcmVuIFsoZSBhcyBDb21wb25lbnQpLmRhdGEuaWRdID0gZSBhcyBDb21wb25lbnRcbiAgICAgICAgICAgICAgIHNsb3QuYXBwZW5kICggLi4uIChlIGFzIENvbXBvbmVudCkuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICBuZXdfY2hpbGQucHVzaCAoIGUgYXMgQ29tcG9uZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIG5ld19jaGlsZC5sZW5ndGggPiAwIClcbiAgICAgICAgICAgICAgIHRoaXMub25DaGlsZHJlbkFkZGVkICggbmV3X2NoaWxkIClcbiAgICAgfVxuXG4gICAgIHJlbW92ZSAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQ29tcG9uZW50KSBbXSApXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgY2xlYXIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSB7fVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciApXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgIH1cblxuICAgICBnZXRPcmllbnRhdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5kaXJlY3Rpb25cbiAgICAgfVxuXG4gICAgIHNldE9yaWVudGF0aW9uICggdmFsdWU6IERpcmVjdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmRhdGFcblxuICAgICAgICAgIGlmICggdmFsdWUgPT0gY29uZmlnLmRpcmVjdGlvbiApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBpZiAoIHRoaXMuaXNfdmVydGljYWwgKVxuICAgICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICggXCJ2ZXJ0aWNhbFwiIClcblxuICAgICAgICAgIGNvbmZpZy5kaXJlY3Rpb24gPSB2YWx1ZVxuICAgICAgICAgIDsodGhpcy5pc192ZXJ0aWNhbCBhcyBib29sZWFuKSA9IHZhbHVlID09IFwiYnRcIiB8fCB2YWx1ZSA9PSBcInRiXCJcbiAgICAgfVxufVxuXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRCbG9jayBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwiYmxvY2tcIlxuICAgICAgICAgIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvblxuICAgICAgICAgIGVsZW1lbnRzOiBDb21wb25lbnQgW11cbiAgICAgfVxufVxuXG50eXBlIE9yaWVudGF0aW9uID0gXCJ2ZXJ0aWNhbFwiIHwgXCJob3Jpem9udGFsXCJcblxuZXhwb3J0IGNsYXNzIEJsb2NrIGV4dGVuZHMgQ29tcG9uZW50IDwkQmxvY2s+XG57XG4gICAgIGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJiYXJcIj48L2Rpdj5cblxuICAgICBnZXQgb3JpZW50YXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuY29udGFpbnMgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgICAgICAgPyBcImhvcml6b250YWxcIlxuICAgICAgICAgICAgICAgOiBcInZlcnRpY2FsXCJcbiAgICAgfVxuXG4gICAgIHNldCBvcmllbnRhdGlvbiAoIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3RcblxuICAgICAgICAgIHZhciBuZXdfb3JpZW50YXRpb24gPSBjbGFzc0xpc3QuY29udGFpbnMgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcImhvcml6b250YWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcInZlcnRpY2FsXCJcblxuICAgICAgICAgIGlmICggb3JpZW50YXRpb24gPT0gbmV3X29yaWVudGF0aW9uIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY2xhc3NMaXN0LnJlcGxhY2UgICggb3JpZW50YXRpb24sIG5ld19vcmllbnRhdGlvbiApXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCbG9jaywgW1wiYmxvY2tcIl0gKVxuIiwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICAgZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgQ29tbWFuZHMgfSAgZnJvbSBcIi4uLy4uL0Jhc2UvY29tbWFuZC5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSAgICBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG5leHBvcnQgY2xhc3MgQnV0dG9uIGV4dGVuZHMgQ29tcG9uZW50IDwkQnV0dG9uPlxue1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuXG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gPGRpdiBjbGFzcz1cImJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICB7IGRhdGEuaWNvbiA/IDxzcGFuIGNsYXNzPVwiaWNvblwiPnsgZGF0YS5pY29uIH08L3NwYW4+IDogbnVsbCB9XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS50ZXh0ID8gPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+eyBkYXRhLnRleHQgfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jYWxsYmFjayAhPSB1bmRlZmluZWQgfHwgdGhpcy5kYXRhLmNvbW1hbmQgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyICggXCJjbGlja1wiLCB0aGlzLm9uVG91Y2guYmluZCAodGhpcykgKVxuXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IG5vZGVcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gWyB0aGlzLmNvbnRhaW5lciBdIGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cblxuICAgICBvblRvdWNoICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jYWxsYmFjayAmJiB0aGlzLmRhdGEuY2FsbGJhY2sgKCkgIT09IHRydWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIENvbW1hbmRzLmN1cnJlbnQucnVuICggdGhpcy5kYXRhLmNvbW1hbmQgKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG9uSG92ZXIgKClcbiAgICAge1xuXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCdXR0b24sIFtcImJ1dHRvblwiXSApXG4iLCJcblxuaW1wb3J0IHsgc2V0IH0gICAgICBmcm9tIFwiLi4vLi4vZGIuanNcIlxuaW1wb3J0IHsgQ29tbWFuZHMgfSBmcm9tIFwiLi4vLi4vQmFzZS9jb21tYW5kLmpzXCJcbmltcG9ydCB7IHhub2RlIH0gICAgZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRCdXR0b24gZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgIDogXCJidXR0b25cIlxuICAgICAgICAgIGljb24gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdG9vbHRpcD8gICA6IEpTWC5FbGVtZW50XG4gICAgICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgICAgICBjYWxsYmFjaz8gIDogKCkgPT4gYm9vbGVhbiB8IHZvaWQsXG4gICAgICAgICAgY29tbWFuZD8gICA6IHN0cmluZyxcbiAgICAgICAgICBoYW5kbGVPbj8gIDogXCJ0b2dnbGVcIiB8IFwiZHJhZ1wiIHwgXCIqXCJcbiAgICAgfVxufVxuXG5jb25zdCBfQnV0dG9uID0gKCBkYXRhOiAkQnV0dG9uICkgPT5cbntcbiAgICAgY29uc3Qgb25Ub3VjaCA9ICgpID0+XG4gICAgIHtcbiAgICAgICAgICBpZiAoIGRhdGEuY2FsbGJhY2sgJiYgZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIENvbW1hbmRzLmN1cnJlbnQucnVuICggZGF0YS5jb21tYW5kIClcbiAgICAgfVxuXG4gICAgIGNvbnN0IG5vZGUgPVxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b25cIiBvbkNsaWNrPXsgZGF0YS5jYWxsYmFjayB8fCBkYXRhLmNvbW1hbmQgPyBvblRvdWNoIDogbnVsbCB9PlxuICAgICAgICAgICAgICAgeyBkYXRhLmljb24gPyA8c3BhbiBjbGFzcz1cImljb25cIj57IGRhdGEuaWNvbiB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgeyBkYXRhLnRleHQgPyA8c3BhbiBjbGFzcz1cInRleHRcIj57IGRhdGEudGV4dCB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgIHJldHVybiBub2RlXG59XG5cblxuZXhwb3J0IHsgQnV0dG9uIH0gZnJvbSBcIi4vaHRtbC5qc1wiXG5cbmV4cG9ydCBjb25zdCAkZGVmYXVsdCA9IHtcbiAgICAgdHlwZTogXCJidXR0b25cIiBhcyBcImJ1dHRvblwiLFxuICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgIGljb246IHVuZGVmaW5lZCxcbn1cblxuc2V0IDwkQnV0dG9uPiAoIFsgXCJidXR0b25cIiBdLCAkZGVmYXVsdCApXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29udGFpbmVyL2luZGV4LmpzXCJcbmltcG9ydCB7IHN3aXBlYWJsZSwgU3dpcGVhYmxlRWxlbWVudCB9IGZyb20gXCIuLi8uLi9CYXNlL3N3aXBlYWJsZS5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRTbGlkZXNob3cgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgICA6IFwic2xpZGVzaG93XCJcbiAgICAgICAgICBjaGlsZHJlbiAgICA6ICRBbnlDb21wb25lbnRzIFtdXG4gICAgICAgICAgaXNTd2lwZWFibGU/OiBib29sZWFuXG4gICAgIH1cblxuICAgICBleHBvcnQgaW50ZXJmYWNlICRTbGlkZSBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2xpZGVcIlxuICAgICB9XG59XG5cbi8vICAgYGBgXG4vLyAgIC5zbGlkZXNob3dcbi8vICAgICAgICBbLi4uXVxuLy8gICBgYGBcbmV4cG9ydCBjbGFzcyBTbGlkZXNob3cgZXh0ZW5kcyBDb250YWluZXIgPCRTbGlkZXNob3c+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbnRhaW5lcj5cbiAgICAgY3VycmVudDogQ29tcG9uZW50XG4gICAgIHByaXZhdGUgc3dpcGVhYmxlOiBTd2lwZWFibGVFbGVtZW50XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcblxuICAgICAgICAgIGlmICggZGF0YS5pc1N3aXBlYWJsZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUgPSBzd2lwZWFibGUgKCBjb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcyAgIDogWyBjb250YWluZXIgXSxcbiAgICAgICAgICAgICAgICAgICAgbWluVmFsdWUgIDogLTAsXG4gICAgICAgICAgICAgICAgICAgIG1heFZhbHVlICA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHBvcnBlcnR5ICA6IGRhdGEuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBkYXRhLmRpcmVjdGlvbiA9PSBcInRiXCIgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgICAgIDogXCJweFwiLFxuICAgICAgICAgICAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLmFjdGl2YXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cblxuICAgICBzaG93ICggaWQ6IHN0cmluZywgLi4uIGNvbnRlbnQ6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJEFueUNvbXBvbmVudHMgKSBbXSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IHRoaXMuY2hpbGRyZW4gW2lkXVxuXG4gICAgICAgICAgaWYgKCBjaGlsZCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHRoaXMuY3VycmVudCApXG4gICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBjaGlsZFxuXG4gICAgICAgICAgaWYgKCBjb250ZW50IClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjaGlsZC5jbGVhciAoKVxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBjb250ZW50IClcbiAgICAgICAgICAgICAgIGNoaWxkLmFwcGVuZCAoIC4uLiBjb250ZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjaGlsZC5jb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgICB9XG59XG5cbmRlZmluZSAoIFNsaWRlc2hvdywgW1wic2xpZGVzaG93XCJdIClcbmRlZmluZSAoIENvbnRhaW5lciwgW1wic2xpZGVcIl0gICAgIClcbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBVbml0IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9jc3MvdW5pdC5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuaW1wb3J0IHsgU3dpcGVhYmxlRWxlbWVudCwgc3dpcGVhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc3dpcGVhYmxlLmpzXCJcbmltcG9ydCB7IEV4cGVuZGFibGVFbGVtZW50LCBleHBhbmRhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2UvZXhwZW5kYWJsZS5qc1wiXG5pbXBvcnQgeyBjc3NGbG9hdCB9IGZyb20gXCIuLi8uLi9CYXNlL2RvbS5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJExpc3RWaWV3IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJsaXN0LXZpZXdcIlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMaXN0VmlldyA8JCBleHRlbmRzICRFeHRlbmRzIDwkTGlzdFZpZXc+PiBleHRlbmRzIENvbnRhaW5lciA8JD5cbntcbiAgICAgc3dpcGVhYmxlOiBFeHBlbmRhYmxlRWxlbWVudFxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBjb25zdCBzbG90ID0gdGhpcy5zbG90ID0gPGRpdiBjbGFzcz1cImxpc3Qtdmlldy1zbGlkZVwiPjwvZGl2PlxuXG4gICAgICAgICAgc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcblxuICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQgKCBzbG90IClcbiAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIFwibGlzdC12aWV3XCIgKVxuXG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUgPSBleHBhbmRhYmxlICggc2xvdCwge1xuICAgICAgICAgICAgICAgaGFuZGxlcyAgIDogWyBjb250YWluZXIgXSxcbiAgICAgICAgICAgICAgIG1pblNpemUgIDogMCxcbiAgICAgICAgICAgICAgIG1heFNpemUgIDogMCxcbiAgICAgICAgICAgICAgIHByb3BlcnR5ICA6IHRoaXMuaXNfdmVydGljYWwgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbiA6IHRoaXMuZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICB1bml0ICAgICA6IFwicHhcIixcbiAgICAgICAgICAgICAgIC8vbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLmFjdGl2YXRlICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgICAgICBtaW5TaXplOiAtdGhpcy5zbGlkZVNpemUgKCksXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuICAgICB9XG5cbiAgICAgb25DaGlsZHJlbkFkZGVkICggZWxlbWVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgIG1pblNpemUgIDogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAgICAgICAgICAgcHJvcGVydHkgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgc2xpZGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHNsb3QgfSA9IHRoaXNcblxuICAgICAgICAgIHJldHVybiBjc3NGbG9hdCAoIHNsb3QsIHRoaXMuaXNfdmVydGljYWwgPyBcImhlaWdodFwiIDogXCJ3aWR0aFwiIClcbiAgICAgfVxuXG4gICAgIHN3aXBlICggb2Zmc2V0OiBzdHJpbmd8bnVtYmVyLCB1bml0PzogXCJweFwiIHwgXCIlXCIgKVxuICAgICB7XG4gICAgICAgICAvLyBpZiAoIHR5cGVvZiBvZmZzZXQgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0IClcbiAgICAgICAgIC8vIGVsc2VcbiAgICAgICAgIC8vICAgICAgdGhpcy5zd2lwZWFibGUuc3dpcGUgKCBvZmZzZXQsIHVuaXQgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSBcIi4uL0xpc3QvaW5kZXguanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxudHlwZSBVbml0cyA9IFwicHhcIiB8IFwiJVwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJFRvb2xiYXIgZXh0ZW5kcyAkRXh0ZW5kcyA8JExpc3RWaWV3PiAvLyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiXG4gICAgICAgICAgdGl0bGUgICAgOiBzdHJpbmdcbiAgICAgICAgICBidXR0b25zICA6ICRCdXR0b24gW11cbiAgICAgfVxufVxuXG5jb25zdCB0b0ZsZXhEaXJlY3Rpb24gPSB7XG4gICAgIGxyOiBcInJvd1wiICAgICAgICAgICAgYXMgXCJyb3dcIixcbiAgICAgcmw6IFwicm93LXJldmVyc2VcIiAgICBhcyBcInJvdy1yZXZlcnNlXCIsXG4gICAgIHRiOiBcImNvbHVtblwiICAgICAgICAgYXMgXCJjb2x1bW5cIixcbiAgICAgYnQ6IFwiY29sdW1uLXJldmVyc2VcIiBhcyBcImNvbHVtbi1yZXZlcnNlXCIsXG59XG5cbmNvbnN0IHRvUmV2ZXJzZSA9IHtcbiAgICAgbHI6IFwicmxcIiBhcyBcInJsXCIsXG4gICAgIHJsOiBcImxyXCIgYXMgXCJsclwiLFxuICAgICB0YjogXCJidFwiIGFzIFwiYnRcIixcbiAgICAgYnQ6IFwidGJcIiBhcyBcInRiXCIsXG59XG5cbi8qKlxuICogICBgYGBwdWdcbiAqICAgLnRvb2xiYXJcbiAqICAgICAgICAudG9vbGJhci1iYWNrZ3JvdW5nXG4gKiAgICAgICAgLnRvb2xiYXItc2xpZGVcbiAqICAgICAgICAgICAgIFsuLi5dXG4gKiAgIGBgYFxuICovXG5leHBvcnQgY2xhc3MgVG9vbGJhciBleHRlbmRzIExpc3RWaWV3IDwkVG9vbGJhcj5cbntcbiAgICAgdGFicyAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgYmFja2dyb3VuZDogSlNYLkVsZW1lbnRcblxuICAgICBkZWZhdWx0Q29uZmlnICgpOiAkVG9vbGJhclxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIC4uLiBzdXBlci5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCIsXG4gICAgICAgICAgICAgICB0aXRsZSAgICA6IFwiVGl0bGUgLi4uXCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICAgICAgIC8vcmV2ZXJzZSAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtdXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgICAgICAgdGhpcy5hcHBlbmQgKCAuLi4gdGhpcy5kYXRhLmJ1dHRvbnMgKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxufVxuXG5kZWZpbmUgKCBUb29sYmFyLCBbXCJ0b29sYmFyXCJdIClcbiIsIlxuaW1wb3J0IHsgZHJhZ2dhYmxlLCBEcmFnRXZlbnQgfSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxudHlwZSBET01FbGVtZW50ID0gSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NvbGxhYmxlQ29uZmlnXG57XG4gICAgIGhhbmRsZXM6IERPTUVsZW1lbnQgW11cbiAgICAgZGlyZWN0aW9uOiBEaXJlY3Rpb25cbn1cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogU2NvbGxhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgOiBbXSxcbiAgICAgICAgICBkaXJlY3Rpb246IFwidGJcIlxuICAgICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbGFibGVOYXRpdmUgKCBvcHRpb25zOiBTY29sbGFibGVDb25maWcgKVxue1xuICAgICBkZXNhY3RpdmF0ZSAoKVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGlyID0gb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IFwicGFuLXlcIiA6IFwicGFuLXhcIlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS50b3VjaEFjdGlvbiA9IGRpclxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRpciA9IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcInBhbi15XCIgOiBcInBhbi14XCJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUudG91Y2hBY3Rpb24gPSBcIm5vbmVcIlxuICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY29sbGFibGUgKCBvcHRpb25zOiBTY29sbGFibGVDb25maWcgKVxue1xuICAgICBpZiAoIFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93IClcbiAgICAgICAgICByZXR1cm4gc2Nyb2xsYWJsZU5hdGl2ZSAoIG9wdGlvbnMgKVxuXG4gICAgIGNvbnN0IGRyYWcgPSBkcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogb3B0aW9ucy5oYW5kbGVzLFxuICAgICAgICAgIHZlbG9jaXR5RmFjdG9yOiAxMDAsXG4gICAgICAgICAgb25TdGFydERyYWcsXG4gICAgICAgICAgb25EcmFnICAgICA6IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgID8gb25EcmFnVmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgIDogb25EcmFnSG9yaXpvbnRhbCxcbiAgICAgICAgICBvblN0b3BEcmFnOiBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gb25TdG9wRHJhZ1ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgIDogb25TdG9wRHJhZ0hvcml6b250YWwsXG4gICAgIH0pXG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhY3RpdmF0ZTogKCkgPT4geyBkcmFnLmFjdGl2YXRlICgpIH1cbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnREcmFnICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJ1bnNldFwiXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCwgMCApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKVxuICAgICAgICAgICAgICAgLy9oLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJzbW9vdGhcIlxuICAgICAgICAgICAgICAgLy9oLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSArIGV2ZW50LnZlbG9jaXR5WSApXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZ0hvcml6b250YWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCwgMCApXG4gICAgICAgICAgICAgICAvL2guc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInNtb290aFwiXG4gICAgICAgICAgICAgICAvL2guc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYICsgZXZlbnQudmVsb2NpdHlYLCAwIClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuLy9pbXBvcnQgeyBleHBhbmRhYmxlLCBFeHBlbmRhYmxlRWxlbWVudCB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgc2NvbGxhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc2Nyb2xsYWJsZS5qc1wiXG5pbXBvcnQgeyBwaWNrLCBkZWZpbmUsIGluU3RvY2ssIG1ha2UgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFBhbmVsIGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICAgIDogXCJwYW5lbFwiLFxuICAgICAgICAgIC8vaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgICAgICBoZWFkZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgICAgICBjaGlsZHJlbj8gICAgOiAkQW55Q29tcG9uZW50cyBbXSxcbiAgICAgICAgICBmb290ZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgfVxufVxuXG5jb25zdCB0b1Bvc2l0aW9uID0ge1xuICAgICBsciA6IFwibGVmdFwiLFxuICAgICBybCA6IFwicmlnaHRcIixcbiAgICAgdGIgOiBcInRvcFwiLFxuICAgICBidCA6IFwiYm90dG9tXCIsXG59XG5cbi8qKlxuICogICBgYGBcbiAqICAgLnBhbmVsXG4gKiAgICAgICAgLnBhbmVsLWhlYWRlclxuICogICAgICAgICAgICAgLnBhbmVsLW1haW4tYnV0dHRvblxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgICAgICAucGFuZWwtY29udGVudFxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgICAgICAucGFuZWwtZm9vdGVyXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFBhbmVsIDwkIGV4dGVuZHMgJEV4dGVuZHMgPCRQYW5lbD4+IGV4dGVuZHMgQ29udGFpbmVyIDwkPlxue1xuICAgICAvL21haW5fYnV0dG9uOiBKU1guRWxlbWVudFxuICAgICBjb250ZW50ICAgIDogQ29tcG9uZW50XG4gICAgIGhlYWRlciAgICAgOiBDb21wb25lbnRcbiAgICAgX2hlYWRlcjogSlNYLkVsZW1lbnRcbiAgICAgX2NvbnRlbnQ6IEpTWC5FbGVtZW50XG5cbiAgICAgLy9wcm90ZWN0ZWQgZXhwYW5kYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICBkZWZhdWx0RGF0YSAoKTogJFBhbmVsXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgLi4uIHN1cGVyLmRlZmF1bHREYXRhICgpLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogXCJwYW5lbFwiLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gICAgIDogW10sXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcInJsXCIsXG4gICAgICAgICAgICAgICAvL2hhc01haW5CdXR0b246IHRydWUsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGhlYWRlciAgICA9IDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkZXJcIiAvPlxuICAgICAgICAgICAgICAgY29uc3QgY29udGVudCAgID0gPGRpdiBjbGFzcz1cInBhbmVsLWNvbnRlbnRcIiAvPlxuICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gPGRpdiBjbGFzcz1cInBhbmVsIGNsb3NlXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgaGVhZGVyIH1cbiAgICAgICAgICAgICAgICAgICAgeyBjb250ZW50IH1cbiAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICAgICAgIC8vIGlmICggZGF0YS5oYXNNYWluQnV0dG9uIClcbiAgICAgICAgICAgICAgIC8vIHtcbiAgICAgICAgICAgICAgIC8vICAgICAgY29uc3QgYnRuID0gPHNwYW4gY2xhc3M9XCJwYW5lbC1tYWluLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgLy8gICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvblwiPuKHlTwvc3Bhbj5cbiAgICAgICAgICAgICAgIC8vICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICAvLyAgICAgIHRoaXMubWFpbl9idXR0b24gPSBidG5cbiAgICAgICAgICAgICAgIC8vICAgICAgaGVhZGVyLmFwcGVuZCAoIGJ0biApXG4gICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgIGlmICggZGF0YS5oZWFkZXIgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlciA9IGluU3RvY2sgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcGljayAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBtYWtlICggZGF0YS5oZWFkZXIgKVxuXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5hcHBlbmQgKCAuLi4gdGhpcy5oZWFkZXIuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vc3VwZXIuYXBwZW5kICggLi4uIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGluU3RvY2sgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcGljayAoIGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBtYWtlICggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5hcHBlbmQgKCAuLi4gdGhpcy5jb250ZW50LmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IGNvbnRhaW5lclxuXG4gICAgICAgICAgICAgICAvLyB0aGlzLmV4cGFuZGFibGUgPSBleHBhbmRhYmxlICggY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAvLyAgICAgIGRpcmVjdGlvbiAgICA6IGRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgLy8gICAgICBuZWFyICAgICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgIC8vICAgICAgaGFuZGxlcyAgICAgIDogQXJyYXkub2YgKCB0aGlzLm1haW5fYnV0dG9uICksXG4gICAgICAgICAgICAgICAvLyAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHtcbiAgICAgICAgICAgICAgIC8vICAgICAgICAgICAvL2NvbnRlbnQuc3R5bGUub3ZlcmZsb3cgPSBcIlwiXG4gICAgICAgICAgICAgICAvLyAgICAgICAgICAgY29udGVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgICAgICAvLyAgICAgIH0sXG4gICAgICAgICAgICAgICAvLyAgICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgIC8vICAgICAgICAgICAvL2NvbnRlbnQuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiXG4gICAgICAgICAgICAgICAvLyAgICAgICAgICAgY29udGVudC5jbGFzc0xpc3QuYWRkICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgICAgICAvLyAgICAgIH1cbiAgICAgICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICAgICAgIC8vIHRoaXMuZXhwYW5kYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgICAgICBzY29sbGFibGUgKHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlczogW2NvbnRlbnRdLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwiYnRcIlxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIC5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgICAgICB0aGlzLl9oZWFkZXIgPSBoZWFkZXJcbiAgICAgICAgICAgICAgIHRoaXMuX2NvbnRlbnQgPSBjb250ZW50XG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCB0b1Bvc2l0aW9uIFtkYXRhLmRpcmVjdGlvbl0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIC8vIHByaXZhdGUgb25DbGlja1RhYiAoKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgdGhpcy5vcGVuICgpXG4gICAgIC8vIH1cblxuICAgICAvL2lzT3BlbiAoKVxuICAgICAvL3tcbiAgICAgLy8gICAgIHJldHVybiB0aGlzLmV4cGFuZGFibGUuaXNPcGVuICgpXG4gICAgIC8vfVxuXG4gICAgIC8vaXNDbG9zZSAoKVxuICAgICAvL3tcbiAgICAgLy8gICAgIHJldHVybiB0aGlzLmV4cGFuZGFibGUuaXNDbG9zZSAoKVxuICAgICAvL31cblxuICAgICBzZXRPcmllbnRhdGlvbiAoIHZhbHVlOiBEaXJlY3Rpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICggdG9Qb3NpdGlvbiBbZGF0YS5kaXJlY3Rpb25dIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggdG9Qb3NpdGlvbiBbdmFsdWVdIClcblxuICAgICAgICAgIHN1cGVyLnNldE9yaWVudGF0aW9uICggdmFsdWUgKVxuXG4gICAgICAgICAgLy9leHBhbmRhYmxlLnVwZGF0ZUNvbmZpZyAoeyBkaXJlY3Rpb246IHZhbHVlIH0pXG5cbiAgICAgICAgICBkYXRhLmRpcmVjdGlvbiA9IHZhbHVlXG4gICAgIH1cblxuICAgICAvLyBvcGVuICggaWQ/OiBzdHJpbmcsIC4uLiBjb250ZW50OiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRDb21wb25lbnQpIFtdIClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIC8vaWYgKCBhcmd1bWVudHMubGVuZ3RoID4gMSApXG4gICAgIC8vICAgICAgLy8gICAgIHRoaXMuc2xpZGVzaG93LnNob3cgKCBpZCwgLi4uIGNvbnRlbnQgKVxuXG4gICAgIC8vICAgICAgLy90aGlzLmV4cGFuZGFibGUub3BlbiAoKVxuXG4gICAgIC8vICAgICAgLy90aGlzLmNvbnRlbnQgKCAuLi4gYXJncyApXG5cbiAgICAgLy8gICAgICByZXR1cm4gdGhpc1xuICAgICAvLyB9XG5cbiAgICAgLy8gY2xvc2UgKClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIHRoaXMuZXhwYW5kYWJsZS5jbG9zZSAoKVxuXG4gICAgIC8vICAgICAgcmV0dXJuIHRoaXNcbiAgICAgLy8gfVxuXG4gICAgIC8vc2l6ZSA9IDBcblxuICAgICAvLyByZXNpemUgKCBzaXplOiBudW1iZXIgKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgY29uc3QgeyBleHBhbmRhYmxlLCBjb250YWluZXIgfSA9IHRoaXNcblxuICAgICAvLyAgICAgIGlmICggZXhwYW5kYWJsZS5pc1ZlcnRpY2FsICgpIClcbiAgICAgLy8gICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBzaXplICsgXCJweFwiXG4gICAgIC8vICAgICAgZWxzZVxuICAgICAvLyAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gc2l6ZSArIFwicHhcIlxuXG4gICAgIC8vICAgICAgdGhpcy5zaXplID0gc2l6ZVxuICAgICAvLyB9XG5cbiAgICAgLy8gZXhwYW5kICggb2Zmc2V0OiBudW1iZXIgKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgY29uc3QgeyBleHBhbmRhYmxlLCBjb250YWluZXIgfSA9IHRoaXNcblxuICAgICAvLyAgICAgIGNvbnN0IHNpemUgPSB0aGlzLnNpemUgKyBvZmZzZXRcblxuICAgICAvLyAgICAgIGlmICggZXhwYW5kYWJsZS5pc1ZlcnRpY2FsICgpIClcbiAgICAgLy8gICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBzaXplICsgXCJweFwiXG4gICAgIC8vICAgICAgZWxzZVxuICAgICAvLyAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gc2l6ZSArIFwicHhcIlxuXG4gICAgIC8vICAgICAgdGhpcy5zaXplID0gc2l6ZVxuICAgICAvLyB9XG59XG5cbmRlZmluZSAoIFBhbmVsLCBbXCJwYW5lbFwiXSApXG5cbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBQYW5lbCB9IGZyb20gXCIuLi9QYW5lbC9pbmRleC5qc1wiXG5pbXBvcnQgeyBleHBhbmRhYmxlLCBFeHBlbmRhYmxlRWxlbWVudCB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRTaWRlTWVudSBleHRlbmRzIE9taXQgPCRQYW5lbCwgXCJ0eXBlXCI+XG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNpZGUtbWVudVwiXG4gICAgICAgICAgaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgfVxufVxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5leHBvcnQgY2xhc3MgU2lkZU1lbnUgZXh0ZW5kcyBQYW5lbCA8JFNpZGVNZW51Plxue1xuICAgICBtYWluX2J1dHRvbjogSlNYLkVsZW1lbnRcbiAgICAgZXhwYW5kYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGRhdGEgICAgICA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3QgaGVhZGVyICAgID0gdGhpcy5faGVhZGVyXG4gICAgICAgICAgY29uc3QgY29udGVudCAgID0gdGhpcy5fY29udGVudFxuXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZXBsYWNlICggXCJwYW5lbFwiICAgICAgICAsIFwic2lkZS1tZW51XCIgKVxuICAgICAgICAgIGhlYWRlciAgIC5jbGFzc0xpc3QucmVwbGFjZSAoIFwicGFuZWwtaGVhZGVyXCIgLCBcInNpZGUtbWVudS1oZWFkZXJcIiApXG4gICAgICAgICAgY29udGVudCAgLmNsYXNzTGlzdC5yZXBsYWNlICggXCJwYW5lbC1jb250ZW50XCIsIFwic2lkZS1tZW51LWNvbnRlbnRcIiApXG5cbiAgICAgICAgICBpZiAoIGRhdGEuaGFzTWFpbkJ1dHRvbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gPHNwYW4gY2xhc3M9XCJzaWRlLW1lbnUtbWFpbi1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uXCI+4oeVPC9zcGFuPlxuICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICB0aGlzLm1haW5fYnV0dG9uID0gYnRuXG4gICAgICAgICAgICAgICAvL3RoaXMuY29udGFpbmVyLmluc2VydEFkamFjZW50RWxlbWVudCAoIFwiYWZ0ZXJiZWdpblwiLCBidG4gKVxuICAgICAgICAgICAgICAgaGVhZGVyLmluc2VydEFkamFjZW50RWxlbWVudCAoIFwiYWZ0ZXJiZWdpblwiLCBidG4gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZSA9IGV4cGFuZGFibGUgKCB0aGlzLmNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgZGlyZWN0aW9uICAgIDogZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICBuZWFyICAgICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICAgICA6IEFycmF5Lm9mICggdGhpcy5tYWluX2J1dHRvbiApLFxuICAgICAgICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImhpZGRlblwiIClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LmFkZCAoIFwiaGlkZGVuXCIgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG5cbiAgICAgaXNPcGVuICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5leHBhbmRhYmxlLmlzT3BlbiAoKVxuICAgICB9XG5cbiAgICAgaXNDbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kYWJsZS5pc0Nsb3NlICgpXG4gICAgIH1cblxuICAgICBvcGVuICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZS5jbG9zZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgfVxuXG4gICAgIC8vIHNldE9yaWVudGF0aW9uICggdmFsdWU6IERpcmVjdGlvbiApXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5zZXRPcmllbnRhdGlvbiAoIHZhbHVlIClcblxuICAgICAvLyAgICAgIGNvbnN0IHsgZXhwYW5kYWJsZSB9ID0gdGhpc1xuXG4gICAgIC8vICAgICAgZXhwYW5kYWJsZS51cGRhdGVDb25maWcgKHsgZGlyZWN0aW9uOiB2YWx1ZSB9KVxuXG4gICAgIC8vIH1cbn1cblxuZGVmaW5lICggU2lkZU1lbnUsIFtcInNpZGUtbWVudVwiXSApXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZXhwb3J0IHR5cGUgU2hhcGVOYW1lcyA9IGtleW9mIFNoYXBlRGVmaW5pdGlvbnNcblxuZXhwb3J0IGludGVyZmFjZSBTaGFwZURlZmluaXRpb25zXG57XG4gICAgIGNpcmNsZSAgIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdHJpYW5nbGUgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBzcXVhcmUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHBhbnRhZ29uIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgaGV4YWdvbiAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICB0ZXh0ICAgICA6IFRleHREZWZpbml0aW9uLFxuICAgICB0ZXh0Ym94ICA6IFRleHREZWZpbml0aW9uLFxuICAgICBwYXRoICAgICA6IFBhdGhEZWZpbml0aW9uLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgc2l6ZTogbnVtYmVyLFxuICAgICB4PyAgOiBudW1iZXIsXG4gICAgIHk/ICA6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZWZpbml0aW9uIGV4dGVuZHMgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoRGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgcGF0aDogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSA8VCBleHRlbmRzIFNoYXBlTmFtZXM+IChcbiAgICAgdHlwZTogVCxcbiAgICAgZGVmIDogU2hhcGVEZWZpbml0aW9ucyBbVF0sXG4pOiBSZXR1cm5UeXBlIDx0eXBlb2YgU3ZnRmFjdG9yeSBbVF0+XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSAoIHR5cGU6IFNoYXBlTmFtZXMsIGRlZjogYW55IClcbntcbiAgICAgc3dpdGNoICggdHlwZSApXG4gICAgIHtcbiAgICAgY2FzZSBcImNpcmNsZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LmNpcmNsZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRyaWFuZ2xlXCI6IHJldHVybiBTdmdGYWN0b3J5LnRyaWFuZ2xlICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInBhbnRhZ29uXCI6IHJldHVybiBTdmdGYWN0b3J5LnBhbnRhZ29uICggZGVmIClcbiAgICAgY2FzZSBcImhleGFnb25cIiA6IHJldHVybiBTdmdGYWN0b3J5LmhleGFnb24gICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnRleHQgICAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRib3hcIiA6IHJldHVybiBTdmdGYWN0b3J5LnRleHRib3ggICggZGVmIClcbiAgICAgY2FzZSBcInBhdGhcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnBhdGggICAgICggZGVmIClcbiAgICAgfVxufVxuXG5jbGFzcyBTdmdGYWN0b3J5XG57XG4gICAgIC8vIFRvIGdldCB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb24gcG9pbnRzXG4gICAgIC8vXG4gICAgIC8vIHZhciBhID0gTWF0aC5QSSoyLzRcbiAgICAgLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbiAgICAgLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG4gICAgIHN0YXRpYyBjaXJjbGUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IDxjaXJjbGVcbiAgICAgICAgICAgICAgIGN4ID0geyBkZWYueCB8fCAwIH1cbiAgICAgICAgICAgICAgIGN5ID0geyBkZWYueSB8fCAwIH1cbiAgICAgICAgICAgICAgIHIgID0geyBkZWYuc2l6ZSAvIDIgfVxuICAgICAgICAgIC8+XG5cbiAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICB9XG5cbiAgICAgc3RhdGljIHRyaWFuZ2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgc3F1YXJlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIHBhbnRhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIGhleGFnb24gKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyB0ZXh0ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0ZXh0Ym94ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHBhdGggKCBkZWY6IFBhdGhEZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG59XG4iLCJpbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCAqIGFzIFN2ZyBmcm9tIFwiLi4vLi4vQmFzZS9TdmcvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5cbmNvbnN0IEcgPSBHZW9tZXRyeVxuXG50eXBlIFJlbmRlcmVyID0gKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uICkgPT4gU1ZHRWxlbWVudCBbXVxudHlwZSBSYWRpYWxEZWZpbml0aW9uID0gR2VvbWV0cnkuUmFkaWFsRGVmaW5pdGlvblxudHlwZSBSYWRpYWxPcHRpb24gICAgID0gR2VvbWV0cnkuUmFkaWFsT3B0aW9uXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkUmFkaWFsTWVudSBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgICAgICBidXR0b25zOiBQYXJ0aWFsIDwkQnV0dG9uPiBbXSxcbiAgICAgICAgICByb3RhdGlvbjogbnVtYmVyXG4gICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgUmFkaWFsTWVudSBleHRlbmRzIENvbXBvbmVudCA8JFJhZGlhbE1lbnU+XG57XG4gICAgIGNvbnRhaW5lcjogU1ZHU1ZHRWxlbWVudFxuICAgICBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uXG5cbiAgICAgcmVhZG9ubHkgcmVuZGVyZXJzOiBSZWNvcmQgPHN0cmluZywgUmVuZGVyZXI+ID0ge1xuICAgICAgICAgIFwiY2lyY2xlXCI6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcy5iaW5kICh0aGlzKVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXIgYXMgYW55XVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIGJ1dHRvbnM6ICRCdXR0b24gW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5kYXRhLmJ1dHRvbnMucHVzaCAoIC4uLiBidXR0b25zIGFzIGFueSApXG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGRlZjogUmFkaWFsT3B0aW9uID0ge1xuICAgICAgICAgICAgICAgY291bnQgIDogZGF0YS5idXR0b25zLmxlbmd0aCxcbiAgICAgICAgICAgICAgIHIgICAgICA6IDc1LFxuICAgICAgICAgICAgICAgcGFkZGluZzogNixcbiAgICAgICAgICAgICAgIHJvdGF0aW9uOiBkYXRhLnJvdGF0aW9uIHx8IDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRlZmluaXRpb24gPSBHLmdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIGRlZiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgID0gdGhpcy50b1N2ZyAoIFwiY2lyY2xlXCIgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgeyBvcHRpb25zIH0gPSB0aGlzXG4gICAgICAgICAgLy9mb3IgKCBjb25zdCBidG4gb2Ygb3B0aW9ucy5idXR0b25zIClcbiAgICAgICAgICAvLyAgICAgYnRuLlxuICAgICB9XG5cbiAgICAgc2hvdyAoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHZvaWRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLmNvbnRhaW5lclxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZGVmaW5pdGlvbi53aWR0aCAvIDJcblxuICAgICAgICAgIG4uc3R5bGUubGVmdCA9ICh4IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uc3R5bGUudG9wICA9ICh5IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uY2xhc3NMaXN0LnJlbW92ZSAoIFwiY2xvc2VcIiApXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUuYmluZCAodGhpcyksIHRydWUgKVxuICAgICB9XG5cbiAgICAgaGlkZSAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCAoXCJjbG9zZVwiKVxuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUgKVxuICAgICB9XG5cbiAgICAgdG9TdmcgKCBzdHlsZTogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGVmaW5pdGlvbjogZGVmLCByZW5kZXJlcnMsIGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHN2ZyA9XG4gICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzICAgPVwicmFkaWFsLW1lbnUgY2xvc2VcIlxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgID17IGRlZi53aWR0aCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgPXsgZGVmLmhlaWdodCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIHZpZXdCb3ggPXsgYDAgMCAkeyBkZWYud2lkdGggfSAkeyBkZWYuaGVpZ2h0IH1gIH1cbiAgICAgICAgICAgICAgIC8+IGFzIFNWR1NWR0VsZW1lbnRcblxuICAgICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBzdHlsZSBpbiByZW5kZXJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHJlbmRlcmVycyBbc3R5bGVdICggZGVmIClcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZiApXG5cbiAgICAgICAgICBzdmcuYXBwZW5kICggLi4uIGJ1dHRvbnMgYXMgTm9kZSBbXSApXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGJ1dHRvbnMubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvcHQgPSBkYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9wdC5jYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBidXR0b25zIFtpXS5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgKCkgPT4gb3B0LmNhbGxiYWNrICgpIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc3ZnXG4gICAgIH1cblxuICAgICByZW5kZXJTdmdDaXJjbGVzICggZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwb2ludHMgID0gZGVmaW5pdGlvbi5wb2ludHNcbiAgICAgICAgICBjb25zdCBwYWRkaW5nID0gZGVmaW5pdGlvbi5wYWRkaW5nXG4gICAgICAgICAgY29uc3QgYnV0dHVucyA9IFtdIGFzIFNWR0VsZW1lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7ICsraSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZGVmID0gcG9pbnRzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5kYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gPGcgY2xhc3M9XCJidXR0b25cIiAvPlxuXG4gICAgICAgICAgICAgICBjb25zdCBjaXJjbGUgPSBTdmcuY3JlYXRlU3ZnU2hhcGUgKCBcImNpcmNsZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGRlZi5jaG9yZC5sZW5ndGggLSBwYWRkaW5nICogMixcbiAgICAgICAgICAgICAgICAgICAgeDogZGVmLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGRlZi55XG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gPHRleHRcbiAgICAgICAgICAgICAgICAgICAgeCA9IHsgZGVmLnggfVxuICAgICAgICAgICAgICAgICAgICB5ID0geyBkZWYueSB9XG4gICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZT1cIjMwXCJcbiAgICAgICAgICAgICAgICAgICAgZmlsbD1cImJsYWNrXCJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJ1c2VyLXNlbGVjdDogbm9uZTsgY3Vyc29yOiBwb2ludGVyOyBkb21pbmFudC1iYXNlbGluZTogY2VudHJhbDsgdGV4dC1hbmNob3I6IG1pZGRsZTtcIlxuICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgaWYgKCBidG4uZm9udEZhbWlseSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0LnNldEF0dHJpYnV0ZSAoIFwiZm9udC1mYW1pbHlcIiwgYnRuLmZvbnRGYW1pbHkgKVxuXG4gICAgICAgICAgICAgICB0ZXh0LmlubmVySFRNTCA9IGJ0bi5pY29uXG5cbiAgICAgICAgICAgICAgIGdyb3VwLmFwcGVuZCAoIGNpcmNsZSApXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCB0ZXh0IClcblxuICAgICAgICAgICAgICAgYnV0dHVucy5wdXNoICggZ3JvdXAgYXMgU1ZHRWxlbWVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGJ1dHR1bnNcbiAgICAgfVxufVxuXG4iLCJcbmltcG9ydCB7IHhub2RlLCBDb21wb25lbnQsIGRlZmluZSB9IGZyb20gXCIuLi8uLi9pbmRleC5qc1wiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vRGF0YS9kYi5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG5cbiAgICAgZXhwb3J0IGludGVyZmFjZSAkUGVyc29uVmlld2VyIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJwZXJzb24tdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGVyc29uVmlld2VlciBleHRlbmRzIENvbXBvbmVudCA8JFBlcnNvblZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHBlcnNvbjogJFBlcnNvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCBjYXJkIClcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBQZXJzb25WaWV3ZWVyLCB7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgOiBcInBlcnNvbi12aWV3ZXJcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxufSlcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3R5cGVzLmQudHNcIiAvPlxuXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5jb25zdCBDT05URVhUID0gXCJjb25jZXB0LWRhdGFcIlxuY29uc3QgRGF0YSA9IG5ldyBEYXRhYmFzZSAoKVxuXG50eXBlICRJbiA8JCBleHRlbmRzICRUaGluZyA9ICRUaGluZz4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoIG5vZGU6ICRJbiApXG57XG4gICAgIGlmICggXCJjb250ZXh0XCIgaW4gbm9kZSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5vZGUuY29udGV4dCAhPT0gQ09OVEVYVCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBjb250ZXh0IHZhbHVlXCJcbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgICAobm9kZSBhcyBXcml0YWJsZSA8JE5vZGU+KS5jb250ZXh0ID0gQ09OVEVYVFxuICAgICB9XG5cbiAgICAgcmV0dXJuIG5vZGUgYXMgJE5vZGVcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlIDwkIGV4dGVuZHMgJFRoaW5nPiAoIG5vZGU6ICRJbiApOiAkXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSA8JCBleHRlbmRzICRUaGluZz4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6ICRcbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlICgpXG57XG4gICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICByZXR1cm5cblxuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAgcmV0dXJuIERhdGEuZ2V0ICggbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApIClcbiAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBEYXRhLmdldCAoIENPTlRFWFQsIC4uLiBhcmd1bWVudHMgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Tm9kZSA8JCBleHRlbmRzICRUaGluZz4gKCBub2RlOiAkSW4gPCQ+IClcbntcbiAgICAgRGF0YS5zZXQgKCBub3JtYWxpemUgKCBub2RlICkgKVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjb3VudERhdGEgKCB0eXBlOiBzdHJpbmcgKVxue1xuICAgICByZXR1cm4gRGF0YS5jb3VudCAoIFwiY29uY2VwdC1kYXRhXCIsIHR5cGUgKVxufVxuIiwiXG5pbXBvcnQgeyB4bm9kZSwgQ29tcG9uZW50LCBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vaW5kZXguanNcIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0RhdGEvZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRTa2lsbFZpZXdlciBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2tpbGwtdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2tpbGxWaWV3ZXIgZXh0ZW5kcyBDb21wb25lbnQgPCRTa2lsbFZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHNraWxsOiAkU2tpbGwgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gPGRpdiBjbGFzcz1cInBlb3BsZVwiPjwvZGl2PlxuXG4gICAgICAgICAgZm9yICggY29uc3QgbmFtZSBvZiBza2lsbC5pdGVtcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgcGVyc29uID0gZGIuZ2V0Tm9kZSA8JFBlcnNvbj4gKCBuYW1lIClcblxuICAgICAgICAgICAgICAgY29uc3QgY2FyZCA9IDxkaXYgY2xhc3M9XCJ3My1jYXJkLTQgcGVyc29uLWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGg0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIHRhcmdldC5hcHBlbmQgKCBjYXJkIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJjb250YWluZXJcIiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxoMT57IHNraWxsLmlkIH08L2gxPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPHA+eyBza2lsbC5kZXNjcmlwdGlvbiB9PC9wPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggdGFyZ2V0IClcblxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Mb3JET25pWC9qc29uLXZpZXdlci9ibG9iL21hc3Rlci9zcmMvanNvbi12aWV3ZXIuanNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cHJlPnsgSlNPTi5zdHJpbmdpZnkgKCBza2lsbCwgbnVsbCwgMyApIH08L3ByZT4gKVxuICAgICB9XG59XG5cbmRlZmluZSAoIFNraWxsVmlld2VyLCB7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG59KVxuIiwiXG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsLmpzXCJcblxuaW1wb3J0IHsgJEdlb21ldHJ5IH0gZnJvbSBcIi4vZ2VvbWV0cnkuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG57XG4gICAgIHRleHQ6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG57XG4gICAgIHBhdGg6IHN0cmluZ1xufVxuXG5jb25zdCBmYWJyaWNfYmFzZV9vYnRpb25zOiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgPSB7XG4gICAgIGxlZnQgICA6IDAsXG4gICAgIHRvcCAgICA6IDAsXG4gICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4gICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG59XG5cbmV4cG9ydCBjb25zdCBGYWN0b3J5ID1cbntcbiAgICAgZ3JvdXAgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JQ2lyY2xlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5Hcm91cCAoIHVuZGVmaW5lZCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICB3aWR0aDogc2l6ZSxcbiAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIC8vIFRvIGdldCBwb2ludHMgb2YgdHJpYW5nbGUsIHNxdWFyZSwgW3BhbnRhfGhleGFdZ29uXG4gICAgIC8vXG4gICAgIC8vIHZhciBhID0gTWF0aC5QSSoyLzRcbiAgICAgLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbiAgICAgLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG4gICAgIGNpcmNsZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklDaXJjbGVPcHRpb25zIClcbiAgICAge1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuQ2lyY2xlIChcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICByYWRpdXM6IHNpemUgLyAyLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cbiAgICAgdHJpYW5nbGUgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JVHJpYW5nbGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSAxLjJcbiAgICAgICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgICAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXVxuICAgICAgICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgYW5nbGU6IDE4MCxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG5cbiAgICAgc3F1YXJlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSVJlY3RPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHNjYWxlID0gMC45XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUmVjdCAoXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgd2lkdGggOiBzaXplICogc2NhbGUsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHNpemUgKiBzY2FsZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIHBhbnRhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzID0gW11cbiAgICAgICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICAgICAgIGNvbnN0IHIgPSBzaXplIC8gMiAqIHNjYWxlXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBwIG9mIFtcbiAgICAgICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgICAgICAgWyAwLjk1MTA1NjUxNjI5NTE1MzUsIDAuMzA5MDE2OTk0Mzc0OTQ3NDUgXSxcbiAgICAgICAgICAgICAgIFsgMC41ODc3ODUyNTIyOTI0NzMyLCAtMC44MDkwMTY5OTQzNzQ5NDczIF0sXG4gICAgICAgICAgICAgICBbIC0wLjU4Nzc4NTI1MjI5MjQ3MywgLTAuODA5MDE2OTk0Mzc0OTQ3NSBdLFxuICAgICAgICAgICAgICAgWyAtMC45NTEwNTY1MTYyOTUxNTM2LCAwLjMwOTAxNjk5NDM3NDk0NzIzIF1cbiAgICAgICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuICAgICBoZXhhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzID0gW11cbiAgICAgICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICAgICAgIGNvbnN0IHIgPSBzaXplIC8gMiAqIHNjYWxlXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBwIG9mIFtcbiAgICAgICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgICAgICAgWyAwLjg2NjAyNTQwMzc4NDQzODYsIDAuNTAwMDAwMDAwMDAwMDAwMSBdLFxuICAgICAgICAgICAgICAgWyAwLjg2NjAyNTQwMzc4NDQzODcsIC0wLjQ5OTk5OTk5OTk5OTk5OTggXSxcbiAgICAgICAgICAgICAgIFsgMS4yMjQ2NDY3OTkxNDczNTMyZS0xNiwgLTEgXSxcbiAgICAgICAgICAgICAgIFsgLTAuODY2MDI1NDAzNzg0NDM4NSwgLTAuNTAwMDAwMDAwMDAwMDAwNCBdLFxuICAgICAgICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0MzksIDAuNDk5OTk5OTk5OTk5OTk5MzMgXSxcbiAgICAgICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGFuZ2xlOiA5MCxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG5cbiAgICAgdGV4dCAoIGRlZjogVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuVGV4dCAoIFwiLi4uXCIsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGZvbnRTaXplOiBzaXplLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cbiAgICAgdGV4dGJveCAoIGRlZjogVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuVGV4dGJveCAoIFwiLi4uXCIsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGZvbnRTaXplOiBzaXplLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cblxuICAgICBwYXRoICggZGVmOiBQYXRoRGVmaW5pdGlvbiwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JT2JqZWN0T3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5QYXRoICggZGVmLnBhdGgsXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgc2NhbGVYOiBzaXplIC8gMTAwLCAvLyBFbiBzdXBwb3NhbnQgcXVlIGxlIHZpZXdCb3hcbiAgICAgICAgICAgICAgIHNjYWxlWTogc2l6ZSAvIDEwMCwgLy8gZXN0IFwiMCAwIDEwMCAxMDBcIlxuICAgICAgICAgIH0pXG4gICAgIH0sXG59XG5cblxuIiwiXG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsLmpzXCJcblxuaW1wb3J0IHsgJFNoYXBlLCBTaGFwZSB9IGZyb20gXCIuLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IEZhY3RvcnkgfSBmcm9tIFwiLi9mYWN0b3J5LmpzXCJcblxuZXhwb3J0IHR5cGUgR2VvbWV0cnlOYW1lcyA9IGtleW9mIHR5cGVvZiBGYWN0b3J5XG5cbmV4cG9ydCBpbnRlcmZhY2UgJEdlb21ldHJ5XG57XG4gICAgIHNoYXBlOiBHZW9tZXRyeU5hbWVzXG4gICAgIHggICAgICAgICA6IG51bWJlclxuICAgICB5ICAgICAgICAgOiBudW1iZXJcblxuICAgICBib3JkZXJXaWR0aCAgICA6IG51bWJlclxuICAgICBib3JkZXJDb2xvciAgICA6IHN0cmluZ1xuXG4gICAgIGJhY2tncm91bmRDb2xvciA6IHN0cmluZ1xuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiBzdHJpbmdcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogYm9vbGVhblxufVxuXG5leHBvcnQgY2xhc3MgR2VvbWV0cnkgPFQgZXh0ZW5kcyBHZW9tZXRyeU5hbWVzID0gR2VvbWV0cnlOYW1lcz5cbntcbiAgICAgY29uZmlnOiAkR2VvbWV0cnlcbiAgICAgb2JqZWN0OiBSZXR1cm5UeXBlIDx0eXBlb2YgRmFjdG9yeSBbVF0+XG5cbiAgICAgY29uc3RydWN0b3IgKCByZWFkb25seSBvd25lcjogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jb25maWcgPSBvd25lci5jb25maWdcbiAgICAgICAgICB0aGlzLnVwZGF0ZVNoYXBlICgpXG4gICAgIH1cblxuICAgICB1cGRhdGUgKCBvcHRpb25zOiBQYXJ0aWFsIDwkR2VvbWV0cnk+IClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCB0aGlzLmNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpZiAoIFwic2hhcGVcIiBpbiBvcHRpb25zIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVNoYXBlICgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKCBcImJhY2tncm91bmRJbWFnZVwiIGluIG9wdGlvbnMgfHwgXCJiYWNrZ3JvdW5kUmVwZWF0XCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1cGRhdGVQb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG9iamVjdCB9ID0gdGhpc1xuXG4gICAgICAgICAgOyhvYmplY3QgYXMgZmFicmljLk9iamVjdCkuc2V0ICh7XG4gICAgICAgICAgICAgICBsZWZ0OiBjb25maWcueCxcbiAgICAgICAgICAgICAgIHRvcCA6IGNvbmZpZy55LFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBvd25lciwgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHNpemUgPSBvd25lci5kaXNwbGF5U2l6ZSAoKVxuXG4gICAgICAgICAgaWYgKCBjb25maWcuc2hhcGUgPT0gXCJjaXJjbGVcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgKG9iamVjdCBhcyBmYWJyaWMuQ2lyY2xlKS5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiBzaXplIC8gMlxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLk9iamVjdCkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvYmplY3Quc2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVTaGFwZSAoIHNoYXBlPzogR2VvbWV0cnlOYW1lcyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGNvbmZpZywgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHNoYXBlID0gY29uZmlnLnNoYXBlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY29uZmlnLnNoYXBlID0gc2hhcGVcblxuICAgICAgICAgIGlmICggb3duZXIuZ3JvdXAgIT0gdW5kZWZpbmVkICYmIHRoaXMub2JqZWN0ICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvd25lci5ncm91cC5yZW1vdmUgKCB0aGlzLm9iamVjdCApXG5cbiAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICA9IEZhY3RvcnkgW2NvbmZpZy5zaGFwZSBhcyBhbnldICggY29uZmlnLCBvd25lci5kaXNwbGF5U2l6ZSAoKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgICAgICAgOiAwLCAvL2NvbmZpZy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCAgICAgICAgOiAwLCAvL2NvbmZpZy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblggICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblkgICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGwgICAgICAgOiBjb25maWcuYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZSAgICAgOiBjb25maWcuYm9yZGVyQ29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IGNvbmZpZy5ib3JkZXJXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgIG93bmVyLmdyb3VwLmFkZCAoIG9iaiApXG4gICAgICAgICAgb2JqLnNlbmRUb0JhY2sgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLmJhY2tncm91bmRJbWFnZSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKClcblxuICAgICAgICAgIGlmICggb2JqLmNhbnZhcyAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb2JqLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG5cbiAgICAgfVxuXG4gICAgIHVwZGF0ZUJhY2tncm91bmRJbWFnZSAoIHBhdGg/OiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcGF0aCA9IHRoaXMuY29uZmlnLmJhY2tncm91bmRJbWFnZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmJhY2tncm91bmRJbWFnZSA9IHBhdGhcblxuICAgICAgICAgIGlmICggdHlwZW9mIHBhdGggPT0gXCJzdHJpbmdcIiAmJiBwYXRoLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgICAgZmFicmljLnV0aWwubG9hZEltYWdlICggcGF0aCwgdGhpcy5vbl9wYXR0ZXJuLmJpbmQgKHRoaXMpIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgb25fcGF0dGVybiAoIGRpbWc6IEhUTUxJbWFnZUVsZW1lbnQgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZmFjdG9yID0gZGltZy53aWR0aCA8IGRpbWcuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IG93bmVyLmRpc3BsYXlTaXplICgpIC8gZGltZy5oZWlnaHRcblxuICAgICAgICAgIDsodGhpcy5vYmplY3QgYXMgYW55KS5zZXQgKHtcbiAgICAgICAgICAgICAgIGZpbGw6IG5ldyBmYWJyaWMuUGF0dGVybiAoe1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGRpbWcsXG4gICAgICAgICAgICAgICAgICAgIHJlcGVhdDogXCJuby1yZXBlYXRcIixcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVyblRyYW5zZm9ybTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgIGZhY3RvciwgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMub2JqZWN0LmNhbnZhcyApXG4gICAgICAgICAgICAgICB0aGlzLm9iamVjdC5jYW52YXMucmVuZGVyQWxsICgpXG4gICAgIH1cbn1cbiIsIi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL3R5cGluZ3MuZC50c1wiIC8+XG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsLmpzXCJcblxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vR2VvbWV0cnkvZ2VvbWV0cnkuanNcIlxuXG5pbXBvcnQgeyBDdG9yIGFzIERhdGFDdG9yIH0gZnJvbSBcIi4uLy4uLy4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgJEdlb21ldHJ5IH0gZnJvbSBcIi4uL0dlb21ldHJ5L2dlb21ldHJ5LmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSAkU2hhcGVFdmVudHMgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbntcbiAgICAgb25DcmVhdGU6ICggZW50aXR5OiBELCBhc3BlY3Q6IFNoYXBlICkgPT4gdm9pZCxcbiAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICBvblRvdWNoOiAoIGFzcGVjdDogU2hhcGUgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgJFNoYXBlIDxEIGV4dGVuZHMgJFRoaW5nID0gJFRoaW5nPiBleHRlbmRzICROb2RlLCAkR2VvbWV0cnksICRTaGFwZUV2ZW50c1xue1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICBkYXRhOiBEXG5cbiAgICAgbWluU2l6ZSAgIDogbnVtYmVyXG4gICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICBzaXplRmFjdG9yOiBudW1iZXJcbn1cblxuZXhwb3J0IHR5cGUgQ3RvciA8RGF0YSBleHRlbmRzICRTaGFwZSA9ICRTaGFwZSwgVCBleHRlbmRzIFNoYXBlID0gU2hhcGU+XG4gICAgICAgICAgICAgICA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRTaGFwZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIlVwZGF0YSBoZXJlIFNoYXBlLmRhdGEgXCIgKyBkYXRhLmRhdGEgKVxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG5cbiAgICAgLy8gICAgICB0aGlzLmluaXQgKClcbiAgICAgLy8gfVxuXG4gICAgIC8vIGluaXQgKClcbiAgICAgLy8ge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBncm91cCA9IHRoaXMuZ3JvdXAgPSBuZXcgZmFicmljLkdyb3VwICggW10sXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgd2lkdGggICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQgICAgIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIGxlZnQgICAgICAgOiBjb25maWcueCxcbiAgICAgICAgICAgICAgIHRvcCAgICAgICAgOiBjb25maWcueSxcbiAgICAgICAgICAgICAgIGhhc0JvcmRlcnMgOiB0cnVlLCAgICAgICAgICAgICAgICAgIC8vIGZhbHNlLFxuICAgICAgICAgICAgICAgaGFzQ29udHJvbHM6IHRydWUsICAgICAgICAgICAgICAgICAgLy8gZmFsc2UsXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIG9yaWdpblkgICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICA7KHRoaXMuYmFja2dyb3VuZCBhcyBHZW9tZXRyeSkgPSBuZXcgR2VvbWV0cnkgKCB0aGlzIClcbiAgICAgICAgICAvL2dyb3VwLmFkZCAoIHRoaXMuYmFja2dyb3VuZC5vYmplY3QgKVxuICAgICAgICAgIC8vdGhpcy5iYWNrZ3JvdW5kLm9iamVjdC5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICAvLyA7KHRoaXMuYm9yZGVyIGFzIEdlb21ldHJ5KSA9IG5ldyBHZW9tZXRyeSAoIHRoaXMsIHRoaXMuY29uZmlnIClcbiAgICAgICAgICAvLyBncm91cC5hZGQgKCB0aGlzLmJvcmRlci5vYmplY3QgKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdcblxuICAgICAgICAgIHZhciBzaXplID0gKDEgKyBjb25maWcuc2l6ZU9mZnNldCkgKiBjb25maWcuc2l6ZUZhY3RvclxuXG4gICAgICAgICAgaWYgKCBzaXplIDwgY29uZmlnLm1pblNpemUgKVxuICAgICAgICAgICAgICAgc2l6ZSA9IGNvbmZpZy5taW5TaXplXG5cbiAgICAgICAgICByZXR1cm4gc2l6ZSB8fCAxXG4gICAgIH1cblxuICAgICB1cGRhdGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdGhpcy5iYWNrZ3JvdW5kIClcbiAgICAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGVTaXplICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYm9yZGVyIClcbiAgICAgICAgICAgICAgIHRoaXMuYm9yZGVyLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGdyb3VwLnNldCAoe1xuICAgICAgICAgICAgICAgd2lkdGggOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBpZiAoIGdyb3VwLmNhbnZhcyApXG4gICAgICAgICAgICAgICBncm91cC5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgY29vcmRzICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ncm91cC5nZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHNldEJhY2tncm91bmQgKCBvcHRpb25zOiBQYXJ0aWFsIDwkR2VvbWV0cnk+IClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCB0aGlzLmNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICB0aGlzLmJhY2tncm91bmQudXBkYXRlICggb3B0aW9ucyApXG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVNpemUgKClcbiAgICAgfVxuXG4gICAgIHNldFBvc2l0aW9uICggeDogbnVtYmVyLCB5OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25maWcueCA9IHhcbiAgICAgICAgICBjb25maWcueSA9IHlcblxuICAgICAgICAgIGdyb3VwLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogeCxcbiAgICAgICAgICAgICAgIHRvcCA6IHlcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy5kLnRzXCIgLz5cbi8vaW1wb3J0ICogYXMgZmFicmljIGZyb20gXCJmYWJyaWMvZmFicmljLWltcGxcIlxuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRmFjdG9yeSB9IGZyb20gXCIuLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IFNoYXBlLCAkU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtYXNwZWN0XCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgKClcbmNvbnN0IGZhY3RvcnkgPSBuZXcgRmFjdG9yeSA8U2hhcGU+ICggZGIgKVxuY29uc3QgQVNQRUNUICA9IFN5bWJvbC5mb3IgKCBcIkFTUEVDVFwiIClcblxuLy8gc3ZnRmFjdG9yeVxuLy8gaHRtbEZhY3Rvcnlcbi8vIGZhYnJpY0ZhY3RvcnlcblxuLy8gdWkuZmFjdG9yeS5zZXQgKCBbXCJjb25jZXB0LXVpXCIsIFwiYnV0dG9uXCIsIFwiaHRtbFwiICAsIFwiYnRuMVwiXSwgY3RvciApXG4vLyB1aS5mYWN0b3J5LnNldCAoIFtcImNvbmNlcHQtdWlcIiwgXCJidXR0b25cIiwgXCJzdmdcIiAgICwgXCJidG4xXCJdLCBjdG9yIClcbi8vIHVpLmZhY3Rvcnkuc2V0ICggW1wiY29uY2VwdC11aVwiLCBcImJ1dHRvblwiLCBcImZhYnJpY1wiLCBcImJ0bjFcIl0sIGN0b3IgKVxuXG50eXBlICRJbiA8JCBleHRlbmRzICRTaGFwZSA9ICRTaGFwZT4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cbi8qKlxuICogQXNzaWduZSBzaSBiZXNvaW4gbGUgY29udGV4dGUgXCJhc3BlY3RcIiBhdSBub2V1ZFxuICovXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPCRTaGFwZT4pLmNvbnRleHQgPSBDT05URVhUXG4gICAgIH1cblxuICAgICByZXR1cm4gbm9kZSBhcyAkU2hhcGVcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXNwZWN0IDxUIGV4dGVuZHMgU2hhcGU+ICggb2JqOiAkTm9kZSB8IFNoYXBlIHwgZmFicmljLk9iamVjdCApOiBUIHwgdW5kZWZpbmVkXG57XG4gICAgIGlmICggb2JqID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgU2hhcGUgKVxuICAgICAgICAgIHJldHVybiBvYmogYXMgVFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgZmFicmljLk9iamVjdCApXG4gICAgICAgICAgcmV0dXJuIG9iaiBbQVNQRUNUXVxuXG4gICAgIGlmICggZmFjdG9yeS5pblN0b2NrICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApIClcbiAgICAgICAgICByZXR1cm4gZmFjdG9yeS5tYWtlICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApXG5cbiAgICAgY29uc3Qgb3B0aW9ucyAgPSBvYmouY29udGV4dCA9PSBDT05URVhUXG4gICAgICAgICAgICAgICAgICAgID8gb2JqIGFzICRTaGFwZVxuICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBDT05URVhULFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IG9iai50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICAgICA6IG9iai5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhICAgOiBvYmosXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgJFNoYXBlXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLngpIClcbiAgICAgICAgICBvcHRpb25zLnggPSAwXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLnkpIClcbiAgICAgICAgICBvcHRpb25zLnkgPSAwXG5cbiAgICAgY29uc3Qgc2hhcGUgPSBmYWN0b3J5Lm1ha2UgKCBvcHRpb25zIClcblxuICAgICAvLyBzaGFwZS5ldmVudHMgPSBhcmd1bWVudHMuZXZlbnRzXG4gICAgIC8vIE9iamVjdC5hc3NpZ24gKCBzaGFwZSwgZXZlbnRzIClcblxuICAgICAvL3NoYXBlLmluaXQgKClcbiAgICAgc2hhcGUuZ3JvdXAgW0FTUEVDVF0gPSBzaGFwZVxuXG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uQ3JlYXRlIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25DcmVhdGUgKCBzaGFwZS5jb25maWcuZGF0YSwgc2hhcGUgKVxuXG4gICAgIHJldHVybiBzaGFwZSBhcyBUXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEFzcGVjdCA8JCBleHRlbmRzICRTaGFwZT4gKCBub2RlOiAkSW4gPCQ+IClcbntcbiAgICAgZGIuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lQXNwZWN0ICggY3RvcjogbmV3ICggZGF0YTogJFNoYXBlICkgPT4gU2hhcGUsIHR5cGU6IHN0cmluZyApXG57XG4gICAgIGZhY3RvcnkuX2RlZmluZSAoIGN0b3IsIFtDT05URVhULCB0eXBlXSApXG59XG4iLCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi9EYXRhL2RiLmpzXCJcblxuaW1wb3J0IHsgU2hhcGUsICRTaGFwZSB9IGZyb20gXCIuL3NoYXBlLmpzXCJcblxuZXhwb3J0IHR5cGUgQmFkZ2VQb3NpdGlvbiA9IHsgYW5nbGU6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIgfVxuXG5leHBvcnQgY2xhc3MgQmFkZ2UgZXh0ZW5kcyBTaGFwZVxue1xuICAgICByZWFkb25seSBvd25lciA9IHVuZGVmaW5lZCBhcyBTaGFwZVxuXG4gICAgIHJlYWRvbmx5IHBvc2l0aW9uID0geyBhbmdsZTogMCwgb2Zmc2V0OiAwIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIG9wdGlvbnM6ICRTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBzdXBlciAoIG9wdGlvbnMgKVxuICAgICAvLyB9XG4gICAgIC8vIGluaXQgKClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIHN1cGVyLmluaXQgKClcblxuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGVudGl0eSA9IGRiLmdldE5vZGUgPCRCYWRnZT4gKCB0aGlzLmNvbmZpZy5kYXRhIClcblxuICAgICAgICAgIGNvbnN0IHRleHQgPSBuZXcgZmFicmljLlRleHRib3ggKCBlbnRpdHkuZW1vamkgfHwgXCJYXCIsIHtcbiAgICAgICAgICAgICAgIGZvbnRTaXplOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgb3JpZ2luWCA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIGxlZnQgICAgOiBncm91cC5sZWZ0LFxuICAgICAgICAgICAgICAgdG9wICAgICA6IGdyb3VwLnRvcCxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgZ3JvdXAuYWRkV2l0aFVwZGF0ZSAoIHRleHQgKVxuICAgICB9XG5cbiAgICAgZGlzcGxheVNpemUgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiAyMFxuICAgICB9XG5cbiAgICAgYXR0YWNoICggdGFyZ2V0OiBTaGFwZSwgcG9zID0ge30gYXMgQmFkZ2VQb3NpdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHJhbmRvbSwgUEkgfSA9IE1hdGhcblxuICAgICAgICAgIGlmICggISBpc0Zpbml0ZSAoIHBvcy5hbmdsZSApIClcbiAgICAgICAgICAgICAgIHBvcy5hbmdsZSA9IHJhbmRvbSAoKSAqIFBJICogMlxuXG4gICAgICAgICAgaWYgKCAhIGlzRmluaXRlICggcG9zLm9mZnNldCApIClcbiAgICAgICAgICAgICAgIHBvcy5vZmZzZXQgPSAwLjFcblxuICAgICAgICAgIDsodGhpcy5wb3NpdGlvbiBhcyBCYWRnZVBvc2l0aW9uKSA9IHsgLi4uIHBvcyB9XG5cbiAgICAgICAgICBpZiAoIHRoaXMub3duZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRhcmdldC5ncm91cC5yZW1vdmUgKCB0aGlzLmdyb3VwIClcblxuICAgICAgICAgIHRhcmdldC5ncm91cC5hZGQgKCB0aGlzLmdyb3VwIClcblxuICAgICAgICAgIDsodGhpcy5vd25lciBhcyBTaGFwZSkgPSB0YXJnZXRcblxuICAgICAgICAgIHRoaXMudXBkYXRlUG9zaXRpb24gKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHBvc2l0aW9uOiBwb3MsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG93bmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IHsgcmFuZG9tLCBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgICAgICAgIGNvbnN0IHJhZCAgICA9IHBvcy5hbmdsZSB8fCByYW5kb20gKCkgKiBQSSAqIDJcbiAgICAgICAgICBjb25zdCB4ICAgICAgPSBzaW4gKHJhZClcbiAgICAgICAgICBjb25zdCB5ICAgICAgPSBjb3MgKHJhZClcbiAgICAgICAgICBjb25zdCBzICAgICAgPSBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIDJcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0eXBlb2YgcG9zLm9mZnNldCA9PSBcIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmRpc3BsYXlTaXplICgpICogcG9zLm9mZnNldFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSAqIDAuMVxuXG4gICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbiAoIHggKiAocyArIG9mZnNldCksIHkgKiAocyArIG9mZnNldCkgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9pbmRleC5qc1wiXG5cbmltcG9ydCB7IGdldEFzcGVjdCB9IGZyb20gXCIuLi9kYi5qc1wiXG5cbmltcG9ydCB7IFNoYXBlLCAkU2hhcGUgfSBmcm9tIFwiLi9zaGFwZS5qc1wiXG5cbmV4cG9ydCBjbGFzcyBDb250YWluZXIgPCQgZXh0ZW5kcyAkU2hhcGUgPCRHcm91cD4gPSAkU2hhcGUgPCRHcm91cD4+IGV4dGVuZHMgU2hhcGUgPCQ+XG57XG4gICAgIHJlYWRvbmx5IGNoaWxkcmVuOiBTaGFwZSBbXVxuXG4gICAgIGRpc3BsYXlfc2l6ZSA9IDFcblxuICAgICBjb25zdHJ1Y3RvciAoIG9wdGlvbnM6ICQgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBvcHRpb25zIClcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuID0gW11cbiAgICAgLy8gfVxuXG4gICAgIC8vIGluaXQgKClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIHN1cGVyLmluaXQgKClcblxuICAgICAgICAgIGNvbnN0IGVudGl0eSA9IHRoaXMuY29uZmlnLmRhdGFcblxuICAgICAgICAgIC8vZm9yICggY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyAoIGVudGl0eS5jaGlsZHJlbiApIClcbiAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBPYmplY3QudmFsdWVzICggZW50aXR5Lml0ZW1zICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGEgPSBnZXRBc3BlY3QgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAvL2EuaW5pdCAoKVxuICAgICAgICAgICAgICAgdGhpcy5hZGQgKCBhIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLnBhY2sgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAodGhpcy5kaXNwbGF5X3NpemUgKyBjb25maWcuc2l6ZU9mZnNldCkgKiBjb25maWcuc2l6ZUZhY3RvclxuXG4gICAgICAgICAgaWYgKCBzaXplIDwgY29uZmlnLm1pblNpemUgKVxuICAgICAgICAgICAgICAgc2l6ZSA9IGNvbmZpZy5taW5TaXplXG5cbiAgICAgICAgICByZXR1cm4gc2l6ZSB8fCAxXG4gICAgIH1cblxuICAgICBhZGQgKCBjaGlsZDogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCB9ID0gdGhpc1xuXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoICggY2hpbGQgKVxuXG4gICAgICAgICAgaWYgKCBncm91cCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZ3JvdXAuYWRkICggY2hpbGQuZ3JvdXAgKVxuICAgICAgICAgICAgICAgZ3JvdXAuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcGFjayAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY2hpbGRyZW4sIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW10gYXMgR2VvbWV0cnkuQ2lyY2xlIFtdXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBjIG9mIGNoaWxkcmVuIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gYy5ncm91cFxuICAgICAgICAgICAgICAgY29uc3QgciA9IChnLndpZHRoID4gZy5oZWlnaHQgPyBnLndpZHRoIDogZy5oZWlnaHQpIC8gMlxuICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKCB7IHg6IGcubGVmdCwgeTogZy50b3AsIHI6IHIgKyA2IH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHNpemUgPSAgR2VvbWV0cnkucGFja0VuY2xvc2UgKCBwb3NpdGlvbnMgKSAqIDJcblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBjaGlsZHJlbi5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBjaGlsZHJlbiBbaV0uZ3JvdXBcbiAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwb3NpdGlvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGcubGVmdCA9IHAueFxuICAgICAgICAgICAgICAgZy50b3AgID0gcC55XG5cbiAgICAgICAgICAgICAgIGdyb3VwLmFkZCAoIGcgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZGlzcGxheV9zaXplID0gc2l6ZSArIGNvbmZpZy5zaXplT2Zmc2V0XG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVNpemUgKClcbiAgICAgfVxuXG59XG5cbiIsIlxuaW1wb3J0IHsgUGFuZWxDb21tYW5kcyB9IGZyb20gXCIuL3BhbmVsLmpzXCJcbmltcG9ydCB7IE1lbnVDb21tYW5kcyB9IGZyb20gXCIuL21lbnUuanNcIlxuaW1wb3J0IHsgQXJlYUNvbW1hbmRzIH0gZnJvbSBcIi4vYXJlYS5qc1wiXG5pbXBvcnQgeyBDb21tYW5kcyBhcyBjbWQgfSBmcm9tIFwiLi4vVWkvQmFzZS9jb21tYW5kLmpzXCJcblxuZXhwb3J0IHR5cGUgQ29tbWFuZE5hbWVzID0ga2V5b2YgQ29tbWFuZHNcblxudHlwZSBDb21tYW5kcyA9IFBhbmVsQ29tbWFuZHNcbiAgICAgICAgICAgICAgICYgTWVudUNvbW1hbmRzXG4gICAgICAgICAgICAgICAmIEFyZWFDb21tYW5kc1xuXG5leHBvcnQgY29uc3QgYWRkQ29tbWFuZCA9IGNtZC5jdXJyZW50LmFkZC5iaW5kIChjbWQuY3VycmVudCkgYXNcbntcbiAgICAgPEsgZXh0ZW5kcyBDb21tYW5kTmFtZXM+ICggbmFtZTogSywgY2FsbGJhY2s6IENvbW1hbmRzIFtLXSApOiB2b2lkXG4gICAgICggbmFtZTogc3RyaW5nLCBjYWxsYmFjazogKCAuLi5hcmdzOiBhbnkgKSA9PiBhbnkgKTogdm9pZFxufVxuXG5leHBvcnQgY29uc3QgcnVuQ29tbWFuZCA9IGNtZC5jdXJyZW50LnJ1bi5iaW5kIChjbWQuY3VycmVudCkgYXNcbntcbiAgICAgPEsgZXh0ZW5kcyBDb21tYW5kTmFtZXM+ICggbmFtZTogSywgLi4uIGFyZ3M6IFBhcmFtZXRlcnMgPENvbW1hbmRzIFtLXT4gKTogdm9pZFxuICAgICAoIG5hbWU6IHN0cmluZywgLi4uIGFyZ3M6IGFueSApOiB2b2lkXG59XG5cbmV4cG9ydCBjb25zdCBoYXNDb21tYW5kID0gY21kLmN1cnJlbnQuaGFzLmJpbmQgKGNtZC5jdXJyZW50KSBhc1xue1xuICAgICAoIGtleTogQ29tbWFuZE5hbWVzICk6IGJvb2xlYW5cbiAgICAgKCBrZXk6IHN0cmluZyApOiBib29sZWFuXG59XG5cbmV4cG9ydCBjb25zdCBvbkNvbW1hbmQgPSBjbWQuY3VycmVudC5vbi5iaW5kIChjbWQuY3VycmVudCkgYXNcbntcbiAgICAgKCBuYW1lOiBDb21tYW5kTmFtZXMsIGNhbGxiYWNrOiAoKSA9PiB2b2lkICk6IHZvaWRcbiAgICAgKCBuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAoKSA9PiB2b2lkICk6IHZvaWRcbn1cblxuZXhwb3J0IGNvbnN0IHJlbW92ZUNvbW1hbmQgPSBjbWQuY3VycmVudC5yZW1vdmUuYmluZCAoY21kLmN1cnJlbnQpIGFzXG57XG4gICAgICggbmFtZTogQ29tbWFuZE5hbWVzICk6IHZvaWRcbiAgICAgKCBuYW1lOiBzdHJpbmcgKTogdm9pZFxufVxuIiwiXG5cbmV4cG9ydCB7IGRlZmluZUFzcGVjdCwgZ2V0QXNwZWN0LCBzZXRBc3BlY3QgfSBmcm9tIFwiLi9kYi5qc1wiXG5cbmV4cG9ydCB7IEdlb21ldHJ5LCAkR2VvbWV0cnkgfSBmcm9tIFwiLi9HZW9tZXRyeS9nZW9tZXRyeS5qc1wiXG5leHBvcnQgeyBTaGFwZSwgJFNoYXBlLCAkU2hhcGVFdmVudHMgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmV4cG9ydCB7IE5vdGUgfSAgICAgIGZyb20gXCIuL0VsZW1lbnQvbm90ZS5qc1wiXG5leHBvcnQgeyBCYWRnZSB9ICAgICBmcm9tIFwiLi9FbGVtZW50L2JhZGdlLmpzXCJcbmV4cG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuL0VsZW1lbnQvZ3JvdXAuanNcIlxuXG5cbmltcG9ydCB7IGdldE5vZGV9IGZyb20gXCIuLi9EYXRhL2RiLmpzXCJcbmltcG9ydCB7IGdldEFzcGVjdCwgZGVmaW5lQXNwZWN0LCBzZXRBc3BlY3QgfSBmcm9tIFwiLi9kYi5qc1wiXG5pbXBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0IHsgJFNoYXBlIH0gZnJvbSBcIi4vRWxlbWVudC9zaGFwZS5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi9FbGVtZW50L2dyb3VwLmpzXCJcbmltcG9ydCB7IEJhZGdlIH0gICAgIGZyb20gXCIuL0VsZW1lbnQvYmFkZ2UuanNcIlxuXG5pbXBvcnQgeyBydW5Db21tYW5kIH0gZnJvbSBcIi4uL2NvbW1hbmQuanNcIlxuXG5kZWZpbmVBc3BlY3QgKCBTaGFwZSAgICAsIFwicGVyc29uXCIgLyogLCB7IG9uQ3JlYXRlOiAoKSA9PiAuLi4sIG9uVG91Y2g6ICgpID0+IC4uLiB9ICovIClcbmRlZmluZUFzcGVjdCAoIENvbnRhaW5lciwgXCJza2lsbFwiIClcbmRlZmluZUFzcGVjdCAoIEJhZGdlICAgICwgXCJiYWRnZVwiIClcblxuc2V0QXNwZWN0IDwkU2hhcGU+ICh7XG4gICAgIHR5cGUgICA6IFwicGVyc29uXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhICAgOiB1bmRlZmluZWQsXG5cbiAgICAgc2hhcGUgIDogXCJjaXJjbGVcIixcblxuICAgICB4OiAwLFxuICAgICB5OiAwLFxuXG4gICAgIG1pblNpemUgICAgOiAzMCxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBib3JkZXJDb2xvciAgICAgOiBcIiMwMGMwYWFcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogNCxcbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuXG4gICAgIG9uQ3JlYXRlICAgOiAoIHBlcnNvbjogJFBlcnNvbiwgYXNwZWN0ICkgPT5cbiAgICAge1xuICAgICAgICAgIGFzcGVjdC5zZXRCYWNrZ3JvdW5kICh7XG4gICAgICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHBlcnNvbi5hdmF0YXIsXG4gICAgICAgICAgICAgICBzaGFwZTogcGVyc29uLmlzQ2FwdGFpbiA/IFwic3F1YXJlXCIgOiBcImNpcmNsZVwiLFxuICAgICAgICAgIH0gYXMgYW55KVxuICAgICB9LFxuICAgICBvbkRlbGV0ZTogdW5kZWZpbmVkLFxuICAgICBvblRvdWNoOiB1bmRlZmluZWQsXG59KVxuXG5zZXRBc3BlY3QgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJza2lsbFwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgZGF0YTogdW5kZWZpbmVkLFxuXG4gICAgIHNoYXBlOiBcImNpcmNsZVwiLFxuICAgICB4OiAwLFxuICAgICB5OiAwLFxuXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiI2YxYmMzMVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiA4LFxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcIiNGRkZGRkZcIixcbiAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBmYWxzZSxcbiAgICAgbWluU2l6ZSAgICAgICAgIDogNTAsXG4gICAgIHNpemVPZmZzZXQgICAgICA6IDEwLFxuICAgICBzaXplRmFjdG9yICAgICAgOiAxLFxuXG4gICAgIG9uQ3JlYXRlICggc2tpbGw6ICRTa2lsbCwgYXNwZWN0IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSBnZXROb2RlICh7XG4gICAgICAgICAgICAgICB0eXBlOiBcImJhZGdlXCIsXG4gICAgICAgICAgICAgICBpZCAgOiBza2lsbC5pY29uLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBjb25zdCBiYWRnZSA9IGdldEFzcGVjdCA8QmFkZ2U+ICggZGF0YSApXG5cbiAgICAgICAgICAvL2JhZGdlLmluaXQgKClcbiAgICAgICAgICBiYWRnZS5hdHRhY2ggKCBhc3BlY3QgKVxuICAgICB9LFxuXG4gICAgIG9uVG91Y2ggKCBzaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBza2lsbCA9IGdldE5vZGUgPCRTa2lsbD4gKHtcbiAgICAgICAgICAgICAgIHR5cGU6IHNoYXBlLmNvbmZpZy50eXBlLFxuICAgICAgICAgICAgICAgaWQgIDogc2hhcGUuY29uZmlnLmlkXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHJ1bkNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiwgc2tpbGwgKVxuICAgICB9LFxuXG4gICAgIG9uRGVsZXRlOiB1bmRlZmluZWRcbn0pXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcImJhZGdlXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcblxuICAgICBkYXRhOiB1bmRlZmluZWQsXG5cbiAgICAgeCAgICAgICAgIDogMCxcbiAgICAgeSAgICAgICAgIDogMCxcbiAgICAgbWluU2l6ZSAgIDogMSxcbiAgICAgc2l6ZUZhY3RvcjogMSxcbiAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICBzaGFwZSAgICAgICAgICAgOiBcImNpcmNsZVwiLFxuICAgICBib3JkZXJDb2xvciAgICAgOiBcImdyYXlcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogMCxcblxuICAgICBiYWNrZ3JvdW5kQ29sb3IgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgb25DcmVhdGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvbkRlbGV0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCJcblxuaW1wb3J0ICogYXMgdWkgZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcbmltcG9ydCB7IFNpZGVNZW51IH0gZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcbmltcG9ydCB7IGFkZENvbW1hbmQgfSBmcm9tIFwiLi9jb21tYW5kLmpzXCJcblxuXG4vL2V4cG9ydCBjb25zdCBtZW51ID0gY3JlYXRlTWVudSAoKVxuXG4vL2RvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIG1lbnUuZWxlbWVudHMgKCkgKVxuXG5leHBvcnQgY29uc3QgbWVudSA9IHVpLm1ha2UgPFNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgICAgICAgOiBcInNpZGUtbWVudVwiLFxuICAgICBpZCAgICAgICAgICAgOiBcIm1lbnVcIixcbiAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcbiAgICAgZGlyZWN0aW9uICAgIDogXCJsclwiXG59KVxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gbWVudS5nZXRIdG1sICgpIClcblxuZXhwb3J0IHR5cGUgTWVudUNvbW1hbmRzID0ge1xuICAgICBcIm9wZW4tbWVudVwiOiAoKSA9PiB2b2lkLFxuICAgICBcImNsb3NlLW1lbnVcIjogKCkgPT4gdm9pZCxcbn1cblxuLy9hZGRDb21tYW5kICggXCJvcGVuLW1lbnVcIiwgKCkgPT4geyBtZW51Lm9wZW4gKCkgfSlcbi8vYWRkQ29tbWFuZCAoIFwiY2xvc2UtbWVudVwiLCAoKSA9PiB7IG1lbnUuY2xvc2UgKCkgfSlcbiIsIlxuaW1wb3J0IFwiLi4vVWkvZGIuanNcIlxuaW1wb3J0IFwiLi4vVWkvQ29tcG9uZW50L1NsaWRlc2hvdy9pbmRleC5qc1wiXG4vL2ltcG9ydCBcIi4vQ29tcG9uZW50L2luZm9zLmpzXCJcbmltcG9ydCBcIi4uL1VpL0VudGl0eS9Ta2lsbC9pbmZvcy5qc1wiXG5cbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTbGlkZXNob3csIFNpZGVNZW51IH0gZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcbmltcG9ydCB7IFNraWxsVmlld2VyIH0gZnJvbSBcIi4uL1VpL0VudGl0eS9Ta2lsbC9pbmZvcy5qc1wiXG5pbXBvcnQgeyBhZGRDb21tYW5kIH0gZnJvbSBcIi4vY29tbWFuZC5qc1wiXG5cbmV4cG9ydCB0eXBlIFBhbmVsQ29tbWFuZHMgPSB7XG4gICAgIFwib3Blbi1wYW5lbFwiOiAoIG5hbWU6IHN0cmluZywgLi4uIGNvbnRlbnQ6IGFueSBbXSApID0+IHZvaWQsXG4gICAgIFwib3Blbi1pbmZvcy1wYW5lbFwiOiAoIGRhdGE6ICROb2RlICkgPT4gdm9pZCxcbiAgICAgXCJjbG9zZS1wYW5lbFwiOiAoKSA9PiB2b2lkLFxufTtcblxudmFyIGRpcmVjdGlvbiA9IFwicmxcIiBhcyBcInJsXCIgfCBcImxyXCIgfCBcInRiXCIgfCBcImJ0XCJcblxuZXhwb3J0IGNvbnN0IHBhbmVsID0gdWkubWFrZSA8U2lkZU1lbnUsICRTaWRlTWVudT4gKHtcbiAgICAgY29udGV4dCAgICAgIDogXCJjb25jZXB0LXVpXCIsXG4gICAgIHR5cGUgICAgICAgICA6IFwic2lkZS1tZW51XCIsXG4gICAgIGlkICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgZGlyZWN0aW9uICAgIDogZGlyZWN0aW9uLFxuICAgICBoYXNNYWluQnV0dG9uOiB0cnVlLFxuXG4gICAgIGhlYWRlcjoge1xuICAgICAgICAgIGNvbnRleHQgIDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgdHlwZSAgICAgOiBcInRvb2xiYXJcIixcbiAgICAgICAgICBpZCAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB0aXRsZSAgICA6IFwiVGl0bGUgLi5cIixcbiAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbiA9PSBcImxyXCIgfHwgZGlyZWN0aW9uID09IFwicmxcIiA/IFwidGJcIiA6IFwibHJcIixcblxuICAgICAgICAgIGJ1dHRvbnM6IFt7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwiY29uc29sZVwiLFxuICAgICAgICAgICAgICAgaWNvbiAgICA6IFwi4pqgXCIsXG4gICAgICAgICAgICAgICB0ZXh0ICAgIDogXCJcIixcbiAgICAgICAgICAgICAgIGhhbmRsZU9uOiBcIipcIixcbiAgICAgICAgICAgICAgIGNvbW1hbmQ6IFwicGFjay12aWV3XCJcbiAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJwcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICBpY29uICAgIDogXCJcIixcbiAgICAgICAgICAgICAgIHRleHQgICAgOiBcInBhbmVsIHByb3BlcnRpZXNcIixcbiAgICAgICAgICAgICAgIGhhbmRsZU9uOiBcIipcIixcbiAgICAgICAgICB9XVxuICAgICB9LFxuXG4gICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgIGNvbnRleHQgIDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgdHlwZSAgICAgOiBcInNsaWRlc2hvd1wiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJwYW5lbC1zbGlkZXNob3dcIixcblxuICAgICAgICAgIGNoaWxkcmVuOiBbe1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogXCJzbGlkZS1za2lsbFwiXG4gICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwicGVyc29uLXZpZXdlclwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogXCJzbGlkZS1wZXJzb25cIlxuICAgICAgICAgIH1dXG4gICAgIH1dXG59KVxuXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBwYW5lbC5nZXRIdG1sICgpIClcblxuY29uc3Qgc2xpZGVzaG93ICA9IHVpLnBpY2sgPFNsaWRlc2hvdz4gICAoIFwic2xpZGVzaG93XCIsIFwicGFuZWwtc2xpZGVzaG93XCIgKVxuY29uc3Qgc2xpZGVJbmZvcyA9IHVpLnBpY2sgPFNraWxsVmlld2VyPiAoIFwic2tpbGwtdmlld2VyXCIsIFwic2xpZGUtc2tpbGxcIiApXG5cbmFkZENvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCBuYW1lLCAuLi4gY29udGVudCApID0+XG57XG4gICAgIGlmICggbmFtZSApXG4gICAgICAgICAgc2xpZGVzaG93LnNob3cgKCBuYW1lLCAuLi4gY29udGVudCApXG4gICAgIGVsc2VcbiAgICAgICAgICBwYW5lbC5vcGVuICgpXG59KVxuXG5hZGRDb21tYW5kICggXCJvcGVuLWluZm9zLXBhbmVsXCIsICggZGF0YSApID0+XG57XG4gICAgIGlmICggZGF0YSApXG4gICAgIHtcbiAgICAgICAgICBzbGlkZUluZm9zLmRpc3BsYXkgKCBkYXRhIGFzIGFueSApXG4gICAgICAgICAgcGFuZWwub3BlbiAoKVxuICAgICB9XG59KVxuXG5hZGRDb21tYW5kICggXCJjbG9zZS1wYW5lbFwiICwgKCkgPT5cbntcbiAgICAgcGFuZWwuY2xvc2UgKClcbn0pXG5cbiIsIlxuLypcbmV4YW1wbGU6XG5odHRwczovL3ByZXppLmNvbS9wLzlqcWUyd2tmaGhreS9sYS1idWxsb3RlcmllLXRwY21uL1xuaHR0cHM6Ly9tb3ZpbGFiLm9yZy9pbmRleC5waHA/dGl0bGU9VXRpbGlzYXRldXI6QXVyJUMzJUE5bGllbk1hcnR5XG4qL1xuXG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsLmpzXCJcblxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vLi4vLi4vTGliL2luZGV4LmpzXCJcblxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0ICogYXMgYXNwZWN0IGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvZGIuanNcIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0RhdGEvZGIuanNcIlxuXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5wYWRkaW5nICAgICAgICAgICAgPSAwXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5vYmplY3RDYWNoaW5nICAgICAgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuaGFzQ29udHJvbHMgICAgICAgID0gdHJ1ZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuaGFzQm9yZGVycyAgICAgICAgID0gdHJ1ZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuaGFzUm90YXRpbmdQb2ludCAgID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnRyYW5zcGFyZW50Q29ybmVycyA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5jZW50ZXJlZFNjYWxpbmcgICAgPSB0cnVlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5jb3JuZXJTdHlsZSAgICAgICAgPSBcImNpcmNsZVwiXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibWxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm10XCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtclwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibWJcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcInRsXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJibFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwiYnJcIiwgZmFsc2UgKVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpZXdcbntcbiAgICAgbmFtZTogc3RyaW5nXG4gICAgIGFjdGl2ZTogYm9vbGVhblxuICAgICBjaGlsZHJlbiA6IFNoYXBlIFtdXG4gICAgIHRodW1ibmFpbDogc3RyaW5nXG4gICAgIHBhY2tpbmcgIDogXCJlbmNsb3NlXCJcbn1cblxuZXhwb3J0IGNsYXNzIEFyZWFcbntcbiAgICAgcmVhZG9ubHkgZmNhbnZhczogZmFicmljLkNhbnZhc1xuICAgICBwcml2YXRlIGFjdGl2ZTogVmlld1xuICAgICBwcml2YXRlIHZpZXdzID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIFZpZXc+XG5cbiAgICAgY29uc3RydWN0b3IgKCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50IClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZmNhbnZhcyA9IG5ldyBmYWJyaWMuQ2FudmFzICggY2FudmFzIClcbiAgICAgICAgICB0aGlzLmVuYWJsZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZ2V0IHZpZXcgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2ZVxuICAgICB9XG5cbiAgICAgb3ZlckZPYmplY3Q6IGZhYnJpYy5PYmplY3QgPSB1bmRlZmluZWRcblxuICAgICBvbk92ZXJPYmplY3QgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uT3V0T2JqZWN0ICAgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Ub3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbkRvdWJsZVRvdWNoT2JqZWN0ID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hBcmVhICAgPSBudWxsIGFzICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkXG5cbiAgICAgY3JlYXRlVmlldyAoIG5hbWU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG5hbWUgaW4gdmlld3MgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJUaGUgdmlldyBhbHJlYWR5IGV4aXN0c1wiXG5cbiAgICAgICAgICByZXR1cm4gdmlld3MgW25hbWVdID0ge1xuICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgIGFjdGl2ZSAgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdLFxuICAgICAgICAgICAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIixcbiAgICAgICAgICAgICAgIHRodW1ibmFpbDogbnVsbCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgKTogVmlld1xuICAgICB1c2UgKCB2aWV3OiBWaWV3ICkgIDogVmlld1xuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgfCBWaWV3ICk6IFZpZXdcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcywgdmlld3MgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIG5hbWUgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICBuYW1lID0gbmFtZS5uYW1lXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlLm5hbWUgPT0gbmFtZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggISAobmFtZSBpbiB2aWV3cykgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBhY3RpdmUgPSB0aGlzLmFjdGl2ZSA9IHZpZXdzIFtuYW1lXVxuXG4gICAgICAgICAgZmNhbnZhcy5jbGVhciAoKVxuXG4gICAgICAgICAgZm9yICggY29uc3Qgc2hhcGUgb2YgYWN0aXZlLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hhcGUuZ3JvdXAgKVxuXG4gICAgICAgICAgcmV0dXJuIGFjdGl2ZVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIHNoYXBlczogKFNoYXBlIHwgJE5vZGUpIFtdIClcbiAgICAgYWRkICggLi4uIHBhdGg6IHN0cmluZyBbXSApXG4gICAgIGFkZCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmUsIGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJndW1lbnRzIFswXSA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gZGIuZ2V0Tm9kZSAoIC4uLiBhcmd1bWVudHMgYXMgYW55IGFzIHN0cmluZyBbXSApXG4gICAgICAgICAgICAgICBjb25zdCBzaHAgPSBhc3BlY3QuZ2V0QXNwZWN0ICggbm9kZSApXG4gICAgICAgICAgICAgICBhY3RpdmUuY2hpbGRyZW4ucHVzaCAoIHNocCApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNocC5ncm91cCApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgZm9yICggY29uc3QgcyBvZiBhcmd1bWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBzIGFzICROb2RlIHwgU2hhcGUgKVxuXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0RmFicmljXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0SHRtbFxuICAgICAgICAgICAgICAgLy8gc2hwLmdldFN2Z1xuXG4gICAgICAgICAgICAgICAvLyBmYWN0b3J5XG5cbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMuY2xlYXIgKClcbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgZyBvZiBvYmplY3RzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDIwIH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgb2JqZWN0cy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBvYmplY3RzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcbiAgICAgICAgICAgICAgIGcuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICB6b29tICggZmFjdG9yPzogbnVtYmVyIHwgU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yID09IFwib2JqZWN0XCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG8gPSBmYWN0b3IuZ3JvdXBcblxuICAgICAgICAgICAgICAgdmFyIGxlZnQgICA9IG8ubGVmdCAtIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciByaWdodCAgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICB2YXIgdG9wICAgID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBvLnRvcCAgKyBvLmhlaWdodFxuXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gMFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IDBcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgYm90dG9tID0gMFxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIG9iamVjdHMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gby5sZWZ0ICsgby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBsIDwgbGVmdCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHIgPiByaWdodCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSByXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0IDwgdG9wIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSB0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBiID4gYm90dG9tIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBiXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdyAgPSByaWdodCAtIGxlZnRcbiAgICAgICAgICBjb25zdCBoICA9IGJvdHRvbSAtIHRvcFxuICAgICAgICAgIGNvbnN0IHZ3ID0gZmNhbnZhcy5nZXRXaWR0aCAgKClcbiAgICAgICAgICBjb25zdCB2aCA9IGZjYW52YXMuZ2V0SGVpZ2h0ICgpXG5cbiAgICAgICAgICBjb25zdCBmID0gdyA+IGhcbiAgICAgICAgICAgICAgICAgICAgPyAodncgPCB2aCA/IHZ3IDogdmgpIC8gd1xuICAgICAgICAgICAgICAgICAgICA6ICh2dyA8IHZoID8gdncgOiB2aCkgLyBoXG5cbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFswXSA9IGZcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFszXSA9IGZcblxuICAgICAgICAgIGNvbnN0IGN4ID0gbGVmdCArIHcgLyAyXG4gICAgICAgICAgY29uc3QgY3kgPSB0b3AgICsgaCAvIDJcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzRdID0gLShjeCAqIGYpICsgdncgLyAyXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNV0gPSAtKGN5ICogZikgKyB2aCAvIDJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICBvLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBpc29sYXRlICggc2hhcGU6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgdGhpcy5mY2FudmFzLmdldE9iamVjdHMgKCkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG8udmlzaWJsZSA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2hhcGUuZ3JvdXAudmlzaWJsZSA9IHRydWVcbiAgICAgfVxuXG4gICAgIGdldFRodW1ibmFpbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmU6IGN2aWV3IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCB0aHVtYm5haWwgPSBjdmlldy50aHVtYm5haWxcblxuICAgICAgICAgIGlmICggdGh1bWJuYWlsIHx8IGN2aWV3LmFjdGl2ZSA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICB0aHVtYm5haWxcblxuICAgICAgICAgIHJldHVybiBjdmlldy50aHVtYm5haWwgPSB0aGlzLmZjYW52YXMudG9EYXRhVVJMICh7IGZvcm1hdDogXCJqcGVnXCIgfSlcbiAgICAgfVxuXG4gICAgIC8vIFVJIEVWRU5UU1xuXG4gICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5pbml0Q2xpY2tFdmVudCAoKVxuICAgICAgICAgIHRoaXMuaW5pdE92ZXJFdmVudCAgKClcbiAgICAgICAgICB0aGlzLmluaXRQYW5FdmVudCAgICgpXG4gICAgICAgICAgdGhpcy5pbml0Wm9vbUV2ZW50ICAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0TW92ZU9iamVjdCAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0RHJhZ0V2ZW50ICAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInJlc2l6ZVwiLCB0aGlzLnJlc3BvbnNpdmUuYmluZCAodGhpcykgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSByZXNwb25zaXZlICgpXG4gICAgIHtcbiAgICAgICAgICB2YXIgd2lkdGggICA9ICh3aW5kb3cuaW5uZXJXaWR0aCAgPiAwKSA/IHdpbmRvdy5pbm5lcldpZHRoICA6IHNjcmVlbi53aWR0aFxuICAgICAgICAgIHZhciBoZWlnaHQgID0gKHdpbmRvdy5pbm5lckhlaWdodCA+IDApID8gd2luZG93LmlubmVySGVpZ2h0IDogc2NyZWVuLmhlaWdodFxuXG4gICAgICAgICAgdGhpcy5mY2FudmFzLnNldERpbWVuc2lvbnMoe1xuICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Q2xpY2tFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICBjb25zdCBtYXhfY2xpY2hfYXJlYSA9IDI1ICogMjVcbiAgICAgICAgICB2YXIgICBsYXN0X2NsaWNrICAgICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdF9wb3MgICAgICAgPSB7IHg6IC05OTk5LCB5OiAtOTk5OSB9XG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJtb3VzZTpkb3duXCIgKVxuICAgICAgICAgICAgICAgY29uc3Qgbm93ICAgPSBEYXRlLm5vdyAoKVxuICAgICAgICAgICAgICAgY29uc3QgcG9zICAgPSBmZXZlbnQucG9pbnRlclxuICAgICAgICAgICAgICAgY29uc3QgcmVzZXQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgPSBub3dcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9wb3MgICA9IHBvc1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIHNvaXQgdW4gZG91YmxlLWNsaXF1ZS5cbiAgICAgICAgICAgICAgIGlmICggNTAwIDwgbm93IC0gbGFzdF9jbGljayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5vblRvdWNoT2JqZWN0IClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblRvdWNoT2JqZWN0ICggZWxlbWVudCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIC8vIE5vdXMgdsOpcmlmaW9ucyBxdWUgbGVzIGRldXggY2xpcXVlcyBzZSB0cm91dmUgZGFucyB1bmUgcsOpZ2lvbiBwcm9jaGUuXG4gICAgICAgICAgICAgICBjb25zdCB6b25lID0gKHBvcy54IC0gbGFzdF9wb3MueCkgKiAocG9zLnkgLSBsYXN0X3Bvcy55KVxuICAgICAgICAgICAgICAgaWYgKCB6b25lIDwgLW1heF9jbGljaF9hcmVhIHx8IG1heF9jbGljaF9hcmVhIDwgem9uZSApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNldCAoKVxuXG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSBmb3JtZS5cbiAgICAgICAgICAgICAgIGlmICggZmV2ZW50LnRhcmdldCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Eb3VibGVUb3VjaE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jbGljayAgID0gLTFcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIC8vIFNpIGxlIHBvaW50ZXIgZXN0IGF1LWRlc3N1cyBk4oCZdW5lIHpvbmUgdmlkZS5cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hBcmVhIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hBcmVhICggcG9zLngsIHBvcy55IClcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgZmV2ZW50LmUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICgpXG5cbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRPdmVyRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm92ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5vdmVyRk9iamVjdCA9IGZldmVudC50YXJnZXRcblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uT3Zlck9iamVjdCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3Zlck9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpvdXRcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5vdmVyRk9iamVjdCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub25PdXRPYmplY3QgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk91dE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRQYW5FdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIHZhciAgIGlzRHJhZ2dpbmcgPSBmYWxzZVxuICAgICAgICAgIHZhciAgIGxhc3RQb3NYICAgPSAtMVxuICAgICAgICAgIHZhciAgIGxhc3RQb3NZICAgPSAtMVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6ZG93blwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub3ZlckZPYmplY3QgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5zZWxlY3Rpb24gPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBwYWdlLmRpc2NhcmRBY3RpdmVPYmplY3QgKClcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5mb3JFYWNoT2JqZWN0ICggbyA9PiB7IG8uc2VsZWN0YWJsZSA9IGZhbHNlIH0gKVxuXG4gICAgICAgICAgICAgICAgICAgIGlzRHJhZ2dpbmcgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NYICAgPSBmZXZlbnQucG9pbnRlci54XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NZICAgPSBmZXZlbnQucG9pbnRlci55XG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm1vdmVcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBpc0RyYWdnaW5nIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9pbnRlciAgPSBmZXZlbnQucG9pbnRlclxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uudmlld3BvcnRUcmFuc2Zvcm0gWzRdICs9IHBvaW50ZXIueCAtIGxhc3RQb3NYXG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uudmlld3BvcnRUcmFuc2Zvcm0gWzVdICs9IHBvaW50ZXIueSAtIGxhc3RQb3NZXG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsKClcblxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWCA9IHBvaW50ZXIueFxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWSA9IHBvaW50ZXIueVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTp1cFwiLCAoKSA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHBhZ2Uuc2VsZWN0aW9uID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICBwYWdlLmZvckVhY2hPYmplY3QgKCBvID0+XG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG8uc2VsZWN0YWJsZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgby5zZXRDb29yZHMoKVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgaXNEcmFnZ2luZyA9IGZhbHNlXG5cbiAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRab29tRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOndoZWVsXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ICAgPSBmZXZlbnQuZSBhcyBXaGVlbEV2ZW50XG4gICAgICAgICAgICAgICB2YXIgICBkZWx0YSAgID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgICAgICB2YXIgICB6b29tICAgID0gcGFnZS5nZXRab29tKClcbiAgICAgICAgICAgICAgICAgICAgem9vbSAgICA9IHpvb20gLSBkZWx0YSAqIDAuMDA1XG5cbiAgICAgICAgICAgICAgIGlmICh6b29tID4gOSlcbiAgICAgICAgICAgICAgICAgICAgem9vbSA9IDlcblxuICAgICAgICAgICAgICAgaWYgKHpvb20gPCAwLjUpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gPSAwLjVcblxuICAgICAgICAgICAgICAgcGFnZS56b29tVG9Qb2ludCggbmV3IGZhYnJpYy5Qb2ludCAoIGV2ZW50Lm9mZnNldFgsIGV2ZW50Lm9mZnNldFkgKSwgem9vbSApXG5cbiAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXRNb3ZlT2JqZWN0ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICB2YXIgICBjbHVzdGVyICAgPSB1bmRlZmluZWQgYXMgZmFicmljLk9iamVjdCBbXVxuICAgICAgICAgIHZhciAgIHBvc2l0aW9ucyA9IHVuZGVmaW5lZCBhcyBudW1iZXIgW11bXVxuICAgICAgICAgIHZhciAgIG9yaWdpblggICA9IDBcbiAgICAgICAgICB2YXIgICBvcmlnaW5ZICAgPSAwXG5cbiAgICAgICAgICBmdW5jdGlvbiBvbl9zZWxlY3Rpb24gKGZldmVudDogZmFicmljLklFdmVudClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBmZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoIHRhcmdldCApXG4gICAgICAgICAgICAgICBjbHVzdGVyID0gdGFyZ2V0IFtcImNsdXN0ZXJcIl0gYXMgZmFicmljLk9iamVjdCBbXVxuXG4gICAgICAgICAgICAgICBpZiAoIGNsdXN0ZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgIG9yaWdpblggICA9IHRhcmdldC5sZWZ0XG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgPSB0YXJnZXQudG9wXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMgPSBbXVxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIGNsdXN0ZXIgKVxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoWyBvLmxlZnQsIG8udG9wIF0pXG5cbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIChcImNyZWF0ZWRcIilcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246Y3JlYXRlZFwiLCBvbl9zZWxlY3Rpb24gKVxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjp1cGRhdGVkXCIsIG9uX3NlbGVjdGlvbiApXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJvYmplY3Q6bW92aW5nXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggY2x1c3RlciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ICAgPSBmZXZlbnQudGFyZ2V0XG4gICAgICAgICAgICAgICBjb25zdCBvZmZzZXRYICA9IHRhcmdldC5sZWZ0IC0gb3JpZ2luWFxuICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0WSAgPSB0YXJnZXQudG9wICAtIG9yaWdpbllcblxuICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IGNsdXN0ZXIubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqID0gY2x1c3RlciBbaV1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcG9zID0gcG9zaXRpb25zIFtpXVxuICAgICAgICAgICAgICAgICAgICBvYmouc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogcG9zIFswXSArIG9mZnNldFgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdG9wIDogcG9zIFsxXSArIG9mZnNldFlcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOmNsZWFyZWRcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2x1c3RlciA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJjbGVhcmVkXCIpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdERyYWdFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgLy8gaHR0cHM6Ly93d3cudzNzY2hvb2xzLmNvbS9odG1sL2h0bWw1X2RyYWdhbmRkcm9wLmFzcFxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9TaG9waWZ5L2RyYWdnYWJsZS9ibG9iL21hc3Rlci9zcmMvRHJhZ2dhYmxlL0RyYWdnYWJsZS5qc1xuXG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJ0b3VjaDpkcmFnXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBmZXZlbnQgKVxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBcInRvdWNoOmRyYWdcIiApXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcImRyYWdlbnRlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QLUVOVEVSXCIsIGZldmVudCApXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcImRyYWdvdmVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1AtT1ZFUlwiLCBmZXZlbnQgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcm9wXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vY29uc3QgZSA9IGZldmVudC5lIGFzIERyYWdFdmVudFxuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUFwiLCBlLmRhdGFUcmFuc2Zlci5nZXREYXRhIChcInRleHRcIikgKVxuICAgICAgICAgIH0pXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgUmFkaWFsTWVudSB9IGZyb20gXCIuLi9VaS9Db21wb25lbnQvQ2lyY3VsYXItTWVudS9pbmRleC5qc1wiXG5pbXBvcnQgeyBBcmVhIH0gZnJvbSBcIi4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEuanNcIlxuaW1wb3J0ICogYXMgQXNwZWN0IGZyb20gXCIuL0FzcGVjdC9pbmRleC5qc1wiXG5cbmltcG9ydCB7IGFkZENvbW1hbmQsIHJ1bkNvbW1hbmQsIENvbW1hbmROYW1lcyB9IGZyb20gXCIuL2NvbW1hbmQuanNcIlxuXG5leHBvcnQgY29uc3QgYXJlYSA9ICAoKCkgPT5cbntcbiAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiY2FudmFzXCIgKVxuXG4gICAgIGNhbnZhcy53aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXG4gICAgIGNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodFxuXG4gICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kICggY2FudmFzIClcblxuICAgICByZXR1cm4gbmV3IEFyZWEgKCBjYW52YXMgKVxufSkgKClcblxuZXhwb3J0IGNvbnN0IGNvbnRleHR1YWxNZW51ID0gbmV3IFJhZGlhbE1lbnUgKHtcbiAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgaWQ6IFwiYXJlYS1tZW51XCIsXG4gICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10aGluZ1wiICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlM2M4O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIsIGNhbGxiYWNrOiAoKSA9PiB7IHJ1bkNvbW1hbmQgKCBcInpvb20tZXh0ZW5kc1wiICkgfSB9LCAvLyBkZXRhaWxzXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtYnViYmxlXCIsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTZkZDtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtbm90ZVwiICAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTI0NDtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiLCBjb21tYW5kOiBcInBhY2stdmlld1wiIH0sIC8vIGZvcm1hdF9xdW90ZVxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXBlb3BsZVwiLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU4N2M7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBmYWNlXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtdGFnXCIgICAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTg2NztcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiIH0sIC8vIGJvb2ttYXJrX2JvcmRlclxuICAgICBdIGFzIGFueSxcbiAgICAgcm90YXRpb246IE1hdGguUEkvMixcbn0pXG5cbmRvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIGNvbnRleHR1YWxNZW51LmdldEh0bWwgKCkgKVxuXG4vLyBDT01NQU5EU1xuXG5leHBvcnQgdHlwZSBBcmVhQ29tbWFuZHMgPVxue1xuICAgICBcImFkZC1za2lsbFwiICAgICAgICAgICA6ICggdGl0bGU6IHN0cmluZyApID0+IHZvaWQsXG4gICAgIFwiYWRkLXBlcnNvblwiICAgICAgICAgIDogKCBuYW1lOiBzdHJpbmcgKSA9PiB2b2lkLFxuICAgICBcInpvb20tZXh0ZW5kc1wiICAgICAgICA6ICgpID0+IHZvaWQsXG4gICAgIFwiem9vbS10b1wiICAgICAgICAgICAgIDogKCBzaGFwZTogQXNwZWN0LlNoYXBlICkgPT4gdm9pZCxcbiAgICAgXCJwYWNrLXZpZXdcIiAgICAgICAgICAgOiAoKSA9PiB2b2lkLFxuICAgICBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiA6ICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkLFxuICAgICBcImNsb3NlLWNvbnRleHRhbC1tZW51XCI6ICgpID0+IHZvaWQsXG59XG5cbmFkZENvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiwgKCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+XG57XG4gICAgIGNvbnRleHR1YWxNZW51LnNob3cgKCB4LCB5IClcbn0pXG5cbmFkZENvbW1hbmQgKCBcImNsb3NlLWNvbnRleHRhbC1tZW51XCIsICgpID0+XG57XG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5cbmFkZENvbW1hbmQgKCBcImFkZC1za2lsbFwiLCAoIHRpdGxlICkgPT5cbntcbiAgICAgY29uc29sZS5sb2cgKCBcIkFkZCBza2lsbFwiIClcbn0pXG5cbmFkZENvbW1hbmQgKCBcImFkZC1wZXJzb25cIiwgKCBuYW1lICkgPT5cbntcblxufSlcblxuYWRkQ29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIsICgpID0+XG57XG4gICAgIGFyZWEuem9vbSAoKVxufSlcblxuYWRkQ29tbWFuZCAoIFwiem9vbS10b1wiLCAoIHNoYXBlICkgPT5cbntcbiAgICAgYXJlYS56b29tICggc2hhcGUgKVxuICAgICBhcmVhLmlzb2xhdGUgKCBzaGFwZSApXG59KVxuXG5hZGRDb21tYW5kICggXCJwYWNrLXZpZXdcIiwgKCkgPT5cbntcbiAgICAgYXJlYS5wYWNrICgpXG59KVxuXG4vLyBDTElDSyBFVkVOVFNcblxuLy8gYXJlYS5vblRvdWNoT2JqZWN0ID0gKCBzaGFwZSApID0+XG4vLyB7XG4vLyAgICAgIHJ1bkNvbW1hbmQgKCBcInpvb20tdG9cIiwgc2hhcGUgKVxuLy8gfVxuXG5hcmVhLm9uRG91YmxlVG91Y2hPYmplY3QgPSAoIHNoYXBlICkgPT5cbntcbiAgICAgaWYgKCBzaGFwZS5jb25maWcub25Ub3VjaCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgIHNoYXBlLmNvbmZpZy5vblRvdWNoICggc2hhcGUgKVxufVxuXG5hcmVhLm9uVG91Y2hBcmVhID0gKCB4LCB5ICkgPT5cbntcbiAgICAgcnVuQ29tbWFuZCAoIFwib3Blbi1jb250ZXh0YWwtbWVudVwiLCB4LCB5IClcbn1cblxuLy8gSE9WRVIgRVZFTlRTXG5cbmFyZWEub25PdmVyT2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIHNoYXBlLmhvdmVyICggdHJ1ZSApXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbmFyZWEub25PdXRPYmplY3QgPSAoIHNoYXBlICkgPT5cbntcbiAgICAgc2hhcGUuaG92ZXIgKCBmYWxzZSApXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbi8vIFRFU1RcblxuaWYgKCBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgPiAwIClcbntcblxuICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcm1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cbmVsc2VcbntcbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlbW92ZVwiLCBldmVudCA9PlxuICAgICB7XG4gICAgICAgICAgLy9jb25zdCB0YXJnZXQgPSBhcmVhLmZjYW52YXMuZmluZFRhcmdldCAoIGV2ZW50LCB0cnVlIClcbiAgICAgICAgICAvL2lmICggdGFyZ2V0IClcbiAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICB9KVxufVxuIiwiXG5pbXBvcnQgXCIuLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgXCIuLi9VaS9pbmRleC5qc1wiXG5cbmltcG9ydCBcIi4vQXNwZWN0L2luZGV4LmpzXCJcblxuZXhwb3J0ICogZnJvbSBcIi4vRGF0YS9pbmRleC5qc1wiXG5cblxuLy9pbXBvcnQgXCIuL2NvbnRleHQtbWVudS5qc1wiXG5pbXBvcnQgXCIuL21lbnUuanNcIlxuaW1wb3J0IFwiLi9wYW5lbC5qc1wiXG5pbXBvcnQgXCIuL2FyZWEuanNcIlxuXG5leHBvcnQgKiBmcm9tIFwiLi9jb21tYW5kLmpzXCJcbmV4cG9ydCAqIGZyb20gXCIuL2FyZWEuanNcIlxuXG5cbmltcG9ydCB7IGFyZWEsIGNvbnRleHR1YWxNZW51IH0gZnJvbSBcIi4vYXJlYS5qc1wiXG5pbXBvcnQgeyBwYW5lbCB9IGZyb20gXCIuL3BhbmVsLmpzXCJcbmltcG9ydCB7IG1lbnUgfSBmcm9tIFwiLi9tZW51LmpzXCJcbmltcG9ydCB7IG9uQ29tbWFuZCB9IGZyb20gXCIuL2NvbW1hbmQuanNcIlxuXG5leHBvcnQgZnVuY3Rpb24gd2lkdGggKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRXaWR0aCAoKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGVpZ2h0ICgpXG57XG4gICAgIHJldHVybiBhcmVhLmZjYW52YXMuZ2V0SGVpZ2h0ICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoICgpXG57XG4gICAgIC8vJGFyZWEuc2V0Wm9vbSAoMC4xKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG5vbkNvbW1hbmQgKCBcIm9wZW4tbWVudVwiLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxub25Db21tYW5kICggXCJvcGVuLXBhbmVsXCIsICgpID0+XG57XG4gICAgIG1lbnUuY2xvc2UgKClcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiZmFrZXJcIiAvPlxuZGVjbGFyZSBjb25zdCBmYWtlcjogRmFrZXIuRmFrZXJTdGF0aWNcblxuaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9BcHBsaWNhdGlvbi9pbmRleC5qc1wiXG5cbmNvbnN0IHJhbmRvbUludCA9IChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpID0+XG57XG4gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG5jb25zdCBhcmVhID0gYXBwLmFyZWFcbmNvbnN0IHZpZXcgPSBhcmVhLmNyZWF0ZVZpZXcgKCBcImNvbXDDqXRhbmNlc1wiIClcbmFyZWEudXNlICggdmlldyApXG5cbi8vIEljaSBvbiBham91dGUgZGVzIHBlcnNvbm5lcyDDoCBs4oCZYXBwbGljYXRpb24uXG5cbmNvbnN0IHBlcnNvbk5hbWVzID0gW11cbmZvciAoIHZhciBpID0gMSA7IGkgPD0gMjAgOyBpKysgKVxue1xuICAgICBhcHAuc2V0Tm9kZSA8JFBlcnNvbj4gKHtcbiAgICAgICAgICB0eXBlICAgICA6IFwicGVyc29uXCIsXG4gICAgICAgICAgaWQgICAgICAgOiBcInVzZXJcIiArIGksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2YgKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvL2kgJSA0ID09IDAsXG4gICAgIH0pXG5cbiAgICAgYXBwLnNldE5vZGUgPCRQZXJzb24+ICh7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInBlcnNvblwiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJ1c2VyXCIgKyAoMjAgKyBpKSxcbiAgICAgICAgICBmaXJzdE5hbWU6IGZha2VyLm5hbWUuZmlyc3ROYW1lICgpLFxuICAgICAgICAgIGxhc3ROYW1lIDogZmFrZXIubmFtZS5sYXN0TmFtZSAoKSxcbiAgICAgICAgICBhdmF0YXIgICA6IGAuL2F2YXRhcnMvaCAoJHtpfSkuanBnYCxcbiAgICAgICAgICBpc0NhcHRhaW46IHJhbmRvbUludCAoMCw0KSA9PSAxIC8vICgyMCArIGkpICUgNCA9PSAwLFxuICAgICB9KVxuXG4gICAgIHBlcnNvbk5hbWVzLnB1c2ggKCBcInVzZXJcIiArIGksIFwidXNlclwiICsgKDIwICsgaSkgKVxuXG4gICAgIC8vIGFyZWEuYWRkICggXCJwZXJzb25cIiwgXCJ1c2VyXCIgKyBpIClcbiAgICAgLy8gYXJlYS5hZGQgKCBcInBlcnNvblwiLCBcInVzZXJcIiArIChpICsgMjApIClcbn1cblxuLy8gQmFkZ2VzXG5cbi8vIGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9kcml2ZS9mb2xkZXJzLzFLd1dsOUdfQTh2OTFOTFhBcGpaR0hDZm54X21uZk1FNFxuLy8gaHR0cHM6Ly9yZWNvbm5haXRyZS5vcGVucmVjb2duaXRpb24ub3JnL3Jlc3NvdXJjZXMvXG4vLyBodHRwczovL3d3dy5sZXR1ZGlhbnQuZnIvZWR1Y3Byb3MvYWN0dWFsaXRlL2xlcy1vcGVuLWJhZGdlcy11bi1jb21wbGVtZW50LWF1eC1kaXBsb21lcy11bml2ZXJzaXRhaXJlcy5odG1sXG5cbi8vIGh0dHBzOi8vd3d3LmVjaG9zY2llbmNlcy1ub3JtYW5kaWUuZnIvY29tbXVuYXV0ZXMvbGUtZG9tZS9hcnRpY2xlcy9iYWRnZS1kb21lXG5cbmNvbnN0IGJhZGdlUHJlc2V0cyA9IHsgLy8gUGFydGlhbCA8JEJhZGdlPlxuICAgICBkZWZhdWx0ICAgICAgIDogeyBpZDogXCJkZWZhdWx0XCIgICAgICAsIGVtb2ppOiBcIvCfpoFcIiB9LFxuICAgICBoYXQgICAgICAgICAgIDogeyBpZDogXCJoYXRcIiAgICAgICAgICAsIGVtb2ppOiBcIvCfjqlcIiB9LFxuICAgICBzdGFyICAgICAgICAgIDogeyBpZDogXCJzdGFyXCIgICAgICAgICAsIGVtb2ppOiBcIuKtkFwiIH0sXG4gICAgIGNsb3RoZXMgICAgICAgOiB7IGlkOiBcImNsb3RoZXNcIiAgICAgICwgZW1vamk6IFwi8J+RlVwiIH0sXG4gICAgIGVjb2xvZ3kgICAgICAgOiB7IGlkOiBcImVjb2xvZ3lcIiAgICAgICwgZW1vamk6IFwi8J+Sp1wiIH0sXG4gICAgIHByb2dyYW1taW5nICAgOiB7IGlkOiBcInByb2dyYW1taW5nXCIgICwgZW1vamk6IFwi8J+SvlwiIH0sXG4gICAgIGNvbW11bmljYXRpb24gOiB7IGlkOiBcImNvbW11bmljYXRpb25cIiwgZW1vamk6IFwi8J+TolwiIH0sXG4gICAgIGNvbnN0cnVjdGlvbiAgOiB7IGlkOiBcImNvbnN0cnVjdGlvblwiICwgZW1vamk6IFwi8J+UqFwiIH0sXG4gICAgIGJpb2xvZ3kgICAgICAgOiB7IGlkOiBcImJpb2xvZ3lcIiAgICAgICwgZW1vamk6IFwi8J+UrFwiIH0sXG4gICAgIHJvYm90aWMgICAgICAgOiB7IGlkOiBcInJvYm90aWNcIiAgICAgICwgZW1vamk6IFwi8J+kllwiIH0sXG4gICAgIGdhbWUgICAgICAgICAgOiB7IGlkOiBcImdhbWVcIiAgICAgICAgICwgZW1vamk6IFwi8J+koVwiIH0sXG4gICAgIG11c2ljICAgICAgICAgOiB7IGlkOiBcIm11c2ljXCIgICAgICAgICwgZW1vamk6IFwi8J+lgVwiIH0sXG4gICAgIGxpb24gICAgICAgICAgOiB7IGlkOiBcImxpb25cIiAgICAgICAgICwgZW1vamk6IFwi8J+mgVwiIH0sXG4gICAgIHZvbHRhZ2UgICAgICAgOiB7IGlkOiBcInZvbHRhZ2VcIiAgICAgICwgZW1vamk6IFwi4pqhXCIgfSxcbn1cblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxuICAgICBhcHAuc2V0Tm9kZSAoeyBjb250ZXh0OiBcImNvbmNlcHQtZGF0YVwiLCB0eXBlOiBcImJhZGdlXCIsIC4uLiBiYWRnZVByZXNldHMgW25hbWVdIH0pXG5cbi8vIFNraWxsc1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG57XG4gICAgIGNvbnN0IHBlb3BsZSA9IFtdIGFzICRQZXJzb24gW11cblxuICAgICBmb3IgKCB2YXIgaiA9IHJhbmRvbUludCAoIDAsIDYgKSA7IGogPiAwIDsgai0tIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBwZXJzb25OYW1lcy5zcGxpY2UgKCByYW5kb21JbnQgKCAxLCBwZXJzb25OYW1lcy5sZW5ndGggKSwgMSApIFswXVxuXG4gICAgICAgICAgaWYgKCBuYW1lIClcbiAgICAgICAgICAgICAgIHBlb3BsZS5wdXNoICggYXBwLmdldE5vZGUgPCRQZXJzb24+ICggXCJwZXJzb25cIiwgbmFtZSApIClcbiAgICAgfVxuXG4gICAgIGFwcC5zZXROb2RlIDwkU2tpbGw+ICh7XG4gICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LWRhdGFcIixcbiAgICAgICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgICAgICAgaWQgICAgIDogbmFtZSxcbiAgICAgICAgICBpY29uICAgOiBuYW1lLFxuICAgICAgICAgIGl0ZW1zICA6IHBlb3BsZVxuICAgICB9KVxuXG59XG5cbi8vXG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbiAgICAgYXJlYS5hZGQgKCBcInNraWxsXCIsIG5hbWUgKVxuXG4vLyBOb3Rlc1xuXG4vLyBjb25zdCBub3RlID0gIG5ldyBCLk5vdGUgKHtcbi8vICAgICAgdGV4dDogXCJBIG5vdGUgLi4uXCIsXG4vLyB9KVxuLy8gYXJlYS5hZGQgKCBBc3BlY3QuY3JlYXRlICggbm90ZSApIClcblxuXG5hcmVhLnBhY2sgKClcbmFyZWEuem9vbSAoKVxuXG5cbi8vIENsdXN0ZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBjb25zdCB0MSA9IG5ldyBmYWJyaWMuVGV4dGJveCAoIFwiRWRpdGFibGUgP1wiLCB7XG4vLyAgICAgIHRvcDogNTAsXG4vLyAgICAgIGxlZnQ6IDMwMCxcbi8vICAgICAgZm9udFNpemU6IDMwLFxuLy8gICAgICBzZWxlY3RhYmxlOiB0cnVlLFxuLy8gICAgICBlZGl0YWJsZTogdHJ1ZSxcbi8vICAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbi8vICAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbi8vIH0pXG4vLyBjb25zdCByMSA9IG5ldyBmYWJyaWMuUmVjdCAoe1xuLy8gICAgICB0b3AgICA6IDAsXG4vLyAgICAgIGxlZnQgIDogMzAwLFxuLy8gICAgICB3aWR0aCA6IDUwLFxuLy8gICAgICBoZWlnaHQ6IDUwLFxuLy8gICAgICBmaWxsICA6IFwiYmx1ZVwiLFxuLy8gICAgICBzZWxlY3RhYmxlOiB0cnVlLFxuLy8gICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuLy8gICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxuLy8gfSlcbi8vICRhcHAuX2xheW91dC5hcmVhLmFkZCAodDEpXG4vLyAkYXBwLl9sYXlvdXQuYXJlYS5hZGQgKHIxKVxuLy8gdDFbXCJjbHVzdGVyXCJdID0gWyByMSBdXG4vLyByMVtcImNsdXN0ZXJcIl0gPSBbIHQxIF1cblxuIl0sIm5hbWVzIjpbIk5vZGUiLCJkZWZhdWx0Q29uZmlnIiwiZHJhZ2dhYmxlIiwiVWkuZHJhZ2dhYmxlIiwiQ3NzLmdldFVuaXQiLCJ1RXZlbnQuY3JlYXRlIiwiU3ZnLmNyZWF0ZVN2Z1NoYXBlIiwiQ09OVEVYVCIsIm5vcm1hbGl6ZSIsImRiLmdldE5vZGUiLCJGYWN0b3J5IiwiR2VvbWV0cnkiLCJkYiIsImZhY3RvcnkiLCJDb250YWluZXIiLCJHZW9tZXRyeS5wYWNrRW5jbG9zZSIsImNtZCIsInVpLm1ha2UiLCJ1aS5waWNrIiwiYXNwZWN0LmdldEFzcGVjdCIsImFyZWEiLCJhcHAuYXJlYSIsImFwcC5zZXROb2RlIiwiYXBwLmdldE5vZGUiXSwibWFwcGluZ3MiOiI7OzthQVlnQixNQUFNO1FBRWxCLE1BQU0sUUFBUSxHQUFHLEVBQVMsQ0FBQTtRQUMxQixJQUFNLE9BQU8sR0FBSSxJQUFJLENBQUE7UUFFckIsTUFBTSxJQUFJLEdBQUcsVUFBVyxRQUFXO1lBRS9CLFFBQVEsQ0FBQyxJQUFJLENBQUcsUUFBUSxDQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRTlCLE9BQU8sSUFBSSxDQUFBO1NBQ2QsQ0FBQTtRQUVELElBQUksQ0FBQyxLQUFLLEdBQUc7WUFFVCxPQUFPLFFBQVEsQ0FBQyxNQUFNLENBQUE7U0FDekIsQ0FBQTtRQUVELElBQUksQ0FBQyxPQUFPLEdBQUc7WUFFWCxPQUFPLEdBQUcsS0FBSyxDQUFBO1lBRWYsT0FBTyxJQUFJLENBQUE7U0FDZCxDQUFBO1FBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUVWLE9BQU8sR0FBRyxJQUFJLENBQUE7WUFFZCxPQUFPLElBQUksQ0FBQTtTQUNkLENBQUE7UUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUUsUUFBVztZQUV2QixJQUFJLENBQUcsUUFBUSxDQUFFLENBQUE7WUFFakIsT0FBTyxJQUFJLENBQUE7U0FDZCxDQUFBO1FBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFFLFFBQVc7WUFFdkIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE9B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QUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNaLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNaLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUVaLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDaEMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDckMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFFckMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDdEIsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFPLEVBQUUsR0FBRyxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQzVDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLEVBQy9CLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFFLEdBQUcsRUFBRSxFQUM1QyxFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUssRUFBRSxFQUUvQixDQUFDLEdBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFDMUIsQ0FBQyxHQUFJLENBQUMsSUFBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFFLEVBQ25DLENBQUMsR0FBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDaEMsQ0FBQyxHQUFJLEVBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRSxLQUFPLENBQUMsR0FBRyxDQUFDLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUE7UUFFbEYsT0FBTztZQUNGLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO1lBQ25CLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO1lBQ25CLENBQUMsRUFBRSxDQUFDO1NBQ1IsQ0FBQztJQUNQLENBQUM7O0lDbE1EO0FBRUEsSUFJQSxTQUFTLEtBQUssQ0FBRyxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVM7UUFFM0MsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUNiLENBQVMsRUFDVCxFQUFVLEVBQ1YsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFDZCxDQUFVLEVBQ1YsRUFBVSxFQUNWLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUE7UUFFM0IsSUFBSyxFQUFFLEVBQ1A7WUFDSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUE7WUFDeEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFBO1lBRXhCLElBQUssRUFBRSxHQUFHLEVBQUUsRUFDWjtnQkFDSyxDQUFDLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFFLENBQUE7Z0JBQ2pDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBRSxDQUFFLENBQUE7Z0JBQy9DLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBQzNCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7YUFDL0I7aUJBRUQ7Z0JBQ0ssQ0FBQyxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBRSxDQUFBO2dCQUNqQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUUsQ0FBRSxDQUFBO2dCQUMvQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO2dCQUMzQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO2FBQy9CO1NBQ0w7YUFFRDtZQUNLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2YsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ2I7SUFDTixDQUFDO0lBRUQsU0FBUyxVQUFVLENBQUcsQ0FBUyxFQUFFLENBQVM7UUFFckMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ2xELENBQUM7SUFFRCxTQUFTLEtBQUssQ0FBRyxJQUFVO1FBRXRCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQ1QsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUNmLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQ2QsRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSyxFQUFFLEVBQ25DLEVBQUUsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUssRUFBRSxDQUFDO1FBQ3pDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFFRCxNQUFNQSxNQUFJO1FBSUwsWUFBcUIsQ0FBUztZQUFULE1BQUMsR0FBRCxDQUFDLENBQVE7WUFGOUIsU0FBSSxHQUFPLElBQVksQ0FBQTtZQUN2QixhQUFRLEdBQUcsSUFBWSxDQUFBO1NBQ1k7S0FDdkM7QUFFRCxhQUFnQixXQUFXLENBQUcsT0FBaUI7UUFFMUMsSUFBSyxFQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFFO1lBQUcsT0FBTyxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsc0JBQXNCLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7O1FBRzVELENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkMsSUFBSyxFQUFHLENBQUMsR0FBRyxDQUFDLENBQUU7WUFBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7O1FBRzdCLENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELElBQUssRUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFFO1lBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O1FBR25DLEtBQUssQ0FBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQzs7UUFHaEMsQ0FBQyxHQUFHLElBQUlBLE1BQUksQ0FBRSxDQUFDLENBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSUEsTUFBSSxDQUFFLENBQUMsQ0FBRSxFQUFFLENBQUMsR0FBRyxJQUFJQSxNQUFJLENBQUUsQ0FBQyxDQUFFLENBQUM7UUFDeEQsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7O1FBR3hCLElBQUksRUFBRSxLQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDN0I7WUFDSyxLQUFLLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUUsQ0FBQyxDQUFFLENBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSUEsTUFBSSxDQUFFLENBQUMsQ0FBRSxDQUFDOzs7O1lBS3ZELENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkQsR0FDQTtnQkFDSyxJQUFLLEVBQUUsSUFBSSxFQUFFLEVBQ2I7b0JBQ0ssSUFBSyxVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLEVBQzNCO3dCQUNLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ3ZDLFNBQVMsSUFBSSxDQUFDO3FCQUNsQjtvQkFDRCxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7aUJBQzVCO3FCQUNEO29CQUNLLElBQUssVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRSxFQUMzQjt3QkFDSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUN2QyxTQUFTLElBQUksQ0FBQztxQkFDbEI7b0JBQ0QsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO2lCQUNoQzthQUNMLFFBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUc7O1lBR3pCLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztZQUd4RCxFQUFFLEdBQUcsS0FBSyxDQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ2hCLE9BQVEsQ0FBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksTUFBTyxDQUFDLEVBQzVCO2dCQUNLLElBQUssQ0FBRSxFQUFFLEdBQUcsS0FBSyxDQUFFLENBQUMsQ0FBRSxJQUFLLEVBQUUsRUFDN0I7b0JBQ0ssQ0FBQyxHQUFHLENBQUM7d0JBQ0wsRUFBRSxHQUFHLEVBQUUsQ0FBQztpQkFDWjthQUNMO1lBQ0QsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDZjs7UUFHRCxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUE7UUFDWCxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ0wsT0FBUSxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFPLENBQUM7WUFDdkIsQ0FBQyxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUM7UUFDbkIsQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUUsQ0FBQTs7UUFHaEIsS0FBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQ3ZCO1lBQ0ssQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUU7Z0JBQ2hCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ1YsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ2Q7UUFFRCxPQUFPLENBQUMsQ0FBQyxDQUFXLENBQUE7SUFDekIsQ0FBQztBQUVELGFBQWdCLFdBQVcsQ0FBRyxPQUFpQjtRQUUxQyxXQUFXLENBQUUsT0FBTyxDQUFFLENBQUM7UUFDdkIsT0FBTyxPQUFtQixDQUFDO0lBQ2hDLENBQUM7Ozs7Ozs7Ozs7OzthQ3BKZSxPQUFPLENBQUcsS0FBVTtRQUVoQyxJQUFLLE9BQU8sS0FBSyxJQUFJLFFBQVE7WUFDeEIsT0FBTyxTQUFTLENBQUE7UUFFckIsTUFBTSxLQUFLLEdBQUcsNEdBQTRHO2FBQy9HLElBQUksQ0FBRSxLQUFLLENBQUUsQ0FBQztRQUV6QixJQUFLLEtBQUs7WUFDTCxPQUFPLEtBQUssQ0FBRSxDQUFDLENBQVMsQ0FBQTtRQUU3QixPQUFPLFNBQVMsQ0FBQTtJQUNwQixDQUFDOztJQ3BCRDtJQWlCQSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUE7QUFFZCxhQUFnQixVQUFVLENBQTRELElBQU8sRUFBRSxFQUFVLEVBQUUsSUFBdUM7UUFJM0ksSUFBVSxDQUFDLElBQUksR0FBRyxJQUFJLENBQ3ZCO1FBQUMsSUFBVSxDQUFDLEVBQUUsR0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUcsQ0FBQTtRQUNoRCxPQUFPLElBQVMsQ0FBQTtJQUNyQixDQUFDO0FBRUQsSUFZQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F5Q0c7O1VDNUVVLFFBQVE7UUFBckI7WUFFSyxZQUFPLEdBQUcsRUFNVCxDQUFBO1NBa0lMO1FBaElJLEdBQUcsQ0FBRyxJQUFVO1lBRVgsSUFBTSxHQUFHLEdBQUksSUFBSSxDQUFDLE9BQWMsQ0FBQTtZQUNoQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUE7WUFFYixLQUFNLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFDckI7Z0JBQ0ssS0FBSyxFQUFHLENBQUE7Z0JBRVIsSUFBSyxDQUFDLElBQUksR0FBRyxFQUNiO29CQUNLLElBQUssQ0FBQyxLQUFLLFNBQVM7d0JBQ2YsTUFBSztvQkFFVixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFBO2lCQUNqQjtxQkFFRDtvQkFDSyxPQUFPLEtBQUssQ0FBQTtpQkFDaEI7YUFDTDtZQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUE7U0FDL0I7UUFFRCxLQUFLLENBQUcsSUFBVTtZQUViLElBQUssR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFjLENBQUE7WUFFOUIsS0FBTSxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQ3JCO2dCQUNLLElBQUssQ0FBQyxLQUFLLFNBQVM7b0JBQ2YsTUFBSztnQkFFVixJQUFLLENBQUMsSUFBSSxHQUFHO29CQUNSLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUE7O29CQUViLE9BQU8sQ0FBQyxDQUFBO2FBQ2pCOztZQUdELE9BQU8sU0FBUyxJQUFJLEdBQUc7a0JBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUcsR0FBRyxDQUFFLENBQUMsTUFBTSxHQUFHLENBQUM7a0JBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUcsR0FBRyxDQUFFLENBQUMsTUFBTSxDQUFBO1NBRXJDO1FBRUQsR0FBRyxDQUFHLElBQVUsRUFBRSxJQUFPO1lBRXBCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQTtZQUNyQixJQUFNLEdBQUcsR0FBSSxJQUFJLENBQUMsT0FBYyxDQUFBO1lBRWhDLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxFQUNyQjtnQkFDSyxJQUFLLENBQUMsS0FBSyxTQUFTO29CQUNmLE1BQUs7Z0JBRVYsSUFBSyxDQUFDLElBQUksR0FBRztvQkFDUixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxDQUFBOztvQkFFYixHQUFHLEdBQUcsR0FBRyxDQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTthQUMzQjtZQUVELE9BQU8sR0FBRyxDQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtTQUMzQjtRQUVELEdBQUcsQ0FBRyxJQUFVO1lBRVgsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFBO1lBQ3JCLElBQU0sR0FBRyxHQUFJLElBQUksQ0FBQyxPQUFjLENBQUE7WUFFaEMsS0FBTSxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQ3JCO2dCQUNLLElBQUssQ0FBQyxLQUFLLFNBQVM7b0JBQ2YsTUFBSztnQkFFVixJQUFLLENBQUMsSUFBSSxHQUFHO29CQUNSLEdBQUcsR0FBRyxHQUFHLENBQUUsQ0FBQyxDQUFDLENBQUE7O29CQUViLE1BQUs7YUFDZDtZQUVELE9BQU8sR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFBO1NBQ3BCO1FBRUQsSUFBSSxDQUFHLElBQVU7WUFFWixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBYyxDQUFBO1lBQzdCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQTtZQUVyQixLQUFNLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFDckI7Z0JBQ0ssSUFBSyxDQUFDLEtBQUssU0FBUztvQkFDZixNQUFLO2dCQUVWLElBQUssQ0FBQyxJQUFJLEdBQUc7b0JBQ1IsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQTs7b0JBRWIsTUFBSzthQUNkO1lBRUQsT0FBTyxHQUFHLENBQUUsR0FBRyxDQUFDLENBQUE7U0FDcEI7UUFFRCxJQUFJLENBQUcsSUFBVSxFQUFFLEVBQXVCO1lBRXJDLElBQU0sR0FBRyxHQUFJLElBQUksQ0FBQyxPQUFjLENBQUE7WUFDaEMsTUFBTSxHQUFHLEdBQUksU0FBUyxDQUFBO1lBRXRCLEtBQU0sTUFBTSxDQUFDLElBQUksSUFBSSxFQUNyQjtnQkFDSyxJQUFLLEdBQUcsSUFBSSxHQUFHO29CQUNWLEVBQUUsQ0FBRyxHQUFHLENBQUUsR0FBRyxDQUFDLENBQUUsQ0FBQTtnQkFFckIsSUFBSyxDQUFDLEtBQUssU0FBUztvQkFDZixNQUFLO2dCQUVWLElBQUssQ0FBQyxJQUFJLEdBQUc7b0JBQ1IsR0FBRyxHQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsQ0FBQTs7b0JBRWIsTUFBSzthQUNkO1lBRUQsSUFBSyxHQUFHLElBQUksR0FBRztnQkFDVixFQUFFLENBQUcsR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFFLENBQUE7WUFFckIsT0FBTTtTQUNWO0tBQ0w7O1VDdElZLFFBQW1DLFNBQVEsUUFBWTtRQUkvRCxHQUFHO1lBRUUsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLE9BQU07WUFFWCxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUMxQjtnQkFDSyxNQUFNLENBQUMsR0FBTSxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQzFCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsS0FBSyxTQUFTLENBQUE7YUFDakU7aUJBRUQ7Z0JBQ0ssT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFHLFNBQVMsQ0FBRSxLQUFLLFNBQVMsQ0FBQTthQUNqRDtTQUNMO1FBSUQsS0FBSztZQUVBLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO2dCQUNyQixPQUFNO1lBRVgsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsRUFDMUI7Z0JBQ0ssTUFBTSxDQUFDLEdBQU0sU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUMxQixPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7YUFDcEQ7aUJBRUQ7Z0JBQ0ssT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFHLFNBQVMsQ0FBRSxDQUFBO2FBQ3BDO1NBQ0w7UUFJRCxHQUFHO1lBRUUsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLE9BQU07WUFFWCxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUMxQjtnQkFDSyxNQUFNLENBQUMsR0FBTSxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQzFCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7YUFDckQ7aUJBRUQ7Z0JBQ0ssT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQTthQUNyRDtTQUNMO1FBSUQsR0FBRztZQUVFLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO2dCQUNyQixPQUFNO1lBRVgsTUFBTSxNQUFNLEdBQUcsRUFBTyxDQUFBO1lBRXRCLElBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQzFCO2dCQUNLLE1BQU0sQ0FBQyxHQUFVLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFDOUIsS0FBSyxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSTtvQkFDdkMsTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLEVBQUUsSUFBSSxDQUFFLENBQUE7aUJBQ2xDLENBQUMsQ0FBQTtnQkFDRixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUcsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFBO2FBQ3RDO2lCQUVEO2dCQUNLLEtBQUssQ0FBQyxJQUFJLENBQUcsU0FBUyxFQUFFLElBQUk7b0JBQ3ZCLE1BQU0sQ0FBQyxNQUFNLENBQUcsTUFBTSxFQUFFLElBQUksQ0FBRSxDQUFBO2lCQUNsQyxDQUFDLENBQUE7Z0JBRUYsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFHLE1BQU0sRUFBRTtvQkFDMUIsT0FBTyxFQUFFLFNBQVMsQ0FBRSxDQUFDLENBQUM7b0JBQ3RCLElBQUksRUFBSyxTQUFTLENBQUUsQ0FBQyxDQUFDO29CQUN0QixFQUFFLEVBQU8sU0FBUyxDQUFFLENBQUMsQ0FBQztpQkFDMUIsQ0FBQyxDQUFBO2FBQ047U0FDTDtLQUNMOztVQzFFWSxPQUFPO1FBRWYsWUFBdUIsRUFBZ0I7WUFBaEIsT0FBRSxHQUFGLEVBQUUsQ0FBYztZQUUvQixVQUFLLEdBQUcsSUFBSSxRQUFRLEVBQXFCLENBQUE7WUFDekMsVUFBSyxHQUFJLElBQUksUUFBUSxFQUFPLENBQUE7U0FIUTtRQVU1QyxPQUFPO1lBRUYsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUcsZUFBZSxDQUFFLENBQUE7WUFFeEMsTUFBTSxHQUFHLEdBQUksU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO1lBRTFCLElBQUssT0FBTyxHQUFHLElBQUksUUFBUTtnQkFDdEIsT0FBTyxTQUFpQixDQUFBO1lBRTdCLElBQUssS0FBSyxDQUFDLE9BQU8sQ0FBRyxHQUFHLENBQUM7Z0JBQ3BCLE9BQU8sR0FBRyxDQUFDLElBQUksRUFBVyxDQUFBO1lBRS9CLE9BQU8sQ0FBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBVSxDQUFBO1NBQ3BEO1FBTUQsT0FBTztZQUVGLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRyxHQUFJLFNBQVMsQ0FBVSxDQUFFLENBQUE7U0FDcEU7UUFDRCxRQUFRLENBQUcsSUFBVTtZQUVoQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksQ0FBRSxDQUFBO1NBQ2xDO1FBTUQsTUFBTSxDQUFHLElBQVUsRUFBRSxHQUFJLElBQVk7WUFFaEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRyxHQUFJLElBQUksQ0FBRSxDQUFBO1lBRXBDLElBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFO2dCQUN2QixNQUFNLGNBQWMsQ0FBQTtZQUV6QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksRUFBRSxJQUFJLENBQUUsQ0FBQTtTQUN4QztRQUNELE9BQU8sQ0FBRyxJQUFVLEVBQUUsSUFBVTtZQUUzQixJQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksQ0FBRTtnQkFDdkIsTUFBTSxjQUFjLENBQUE7WUFFekIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFFLENBQUE7U0FDeEM7UUFNRCxJQUFJO1lBRUMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBRyxHQUFJLFNBQVMsQ0FBRSxDQUFBO1lBRXpDLElBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFO2dCQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksQ0FBRSxDQUFBO1lBRW5DLE1BQU0sY0FBYyxDQUFBO1NBQ3hCO1FBQ0QsS0FBSyxDQUFHLElBQVU7WUFFYixJQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksQ0FBRTtnQkFDdkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUUsQ0FBQTtZQUVuQyxNQUFNLGNBQWMsQ0FBQTtTQUN4QjtRQU1ELElBQUk7WUFFQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFHLEdBQUksU0FBUyxDQUFFLENBQUE7WUFFekMsTUFBTSxHQUFHLEdBQUksU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO1lBRTFCLElBQUssT0FBTyxHQUFHLElBQUksUUFBUSxJQUFJLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUM7Z0JBQy9DLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBRyxJQUFJLEVBQUUsR0FBRyxDQUFFLENBQUE7O2dCQUUvQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUcsSUFBSSxDQUFFLENBQUE7U0FDbkM7UUFDRCxLQUFLLENBQUcsSUFBVSxFQUFFLElBQWtCO1lBRWpDLElBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFFO2dCQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksQ0FBRSxDQUFBO1lBRW5DLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFHLElBQUksQ0FBRSxDQUFBO1lBRXJDLElBQUssSUFBSSxJQUFJLFNBQVM7Z0JBQ2pCLE1BQU0sY0FBYyxDQUFBO1lBRXpCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFHLEdBQUksSUFBSSxDQUFFLENBQUE7WUFFcEMsSUFBSSxHQUFHLElBQUksSUFBSSxTQUFTO2tCQUNqQixHQUFHO2tCQUNILE1BQU0sQ0FBQyxNQUFNLENBQUcsR0FBRyxFQUFFLElBQUksQ0FBRSxDQUFBO1lBRWxDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUcsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFHLElBQVMsQ0FBRSxDQUFFLENBQUE7U0FDMUQ7S0FDTDs7SUN2SU0sTUFBTSxLQUFLLEdBQUcsQ0FBQztRQUVqQixNQUFNLFNBQVMsR0FBRyxDQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFFLENBQUE7UUFjbEUsU0FBUyxNQUFNLENBQ1YsSUFBWSxFQUNaLEtBQVUsRUFDVixHQUFHLFFBQTBDO1lBRzdDLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFHLEVBQUUsRUFBRSxLQUFLLENBQUUsQ0FBQTtZQUVuQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFHLElBQUksQ0FBRSxLQUFLLENBQUMsQ0FBQztrQkFDckMsUUFBUSxDQUFDLGFBQWEsQ0FBRyxJQUFJLENBQUU7a0JBQy9CLFFBQVEsQ0FBQyxlQUFlLENBQUcsNEJBQTRCLEVBQUUsSUFBSSxDQUFFLENBQUE7WUFFM0UsTUFBTSxPQUFPLEdBQUcsRUFBVyxDQUFBOztZQUkzQixPQUFRLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUMzQjtnQkFDSyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBRTFCLElBQUssS0FBSyxDQUFDLE9BQU8sQ0FBRSxLQUFLLENBQUUsRUFDM0I7b0JBQ0ssS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUcsQ0FBQyxFQUFFO3dCQUNwQyxRQUFRLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFDLENBQUMsQ0FBRSxDQUFBO2lCQUNuQztxQkFFRDtvQkFDSyxPQUFPLENBQUMsSUFBSSxDQUFFLEtBQUssQ0FBRSxDQUFBO2lCQUN6QjthQUNMO1lBRUQsT0FBUSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDMUI7Z0JBQ0ssSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFBO2dCQUV6QixJQUFLLEtBQUssWUFBWSxJQUFJO29CQUNyQixPQUFPLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBRSxDQUFBO3FCQUU1QixJQUFLLE9BQU8sS0FBSyxJQUFJLFNBQVMsSUFBSSxLQUFLO29CQUN2QyxPQUFPLENBQUMsV0FBVyxDQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUUsQ0FBQTthQUMzRTs7WUFJRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFBO1lBQzdCLE1BQU0sSUFBSSxHQUNWO2dCQUNLLEtBQUssRUFBRSxDQUFFLENBQUMsS0FBTSxPQUFPLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUM5QyxLQUFLLEVBQUUsQ0FBRSxDQUFDLEtBQU0sT0FBTyxDQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUUsR0FBRyxDQUFDO3NCQUMxQixPQUFPLENBQUMsSUFBSSxRQUFRLEdBQUcsYUFBYSxDQUFFLENBQUMsQ0FBQzswQkFDeEMsQ0FBQzs7Z0JBRWpCLENBQUMsRUFBRSxDQUFFLENBQUMsS0FBTSxPQUFPLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBRSxHQUFHLENBQUMsR0FBRyxDQUFDO2FBQzlDLENBQUE7WUFFRCxLQUFNLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFDeEI7Z0JBQ0ssTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dCQUV4QixJQUFLLE9BQU8sS0FBSyxJQUFJLFVBQVU7b0JBQzFCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBRyxHQUFHLEVBQUUsS0FBSyxDQUFFLENBQUE7O29CQUd2QyxPQUFPLENBQUMsWUFBWSxDQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUUsQ0FBQyxDQUFDLEVBQUcsS0FBSyxDQUFDLENBQUUsQ0FBQTthQUNwRTtZQUVELE9BQU8sT0FBTyxDQUFBO1lBRWQsU0FBUyxhQUFhLENBQUcsR0FBVztnQkFFL0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFBO2dCQUVmLEtBQU0sTUFBTSxHQUFHLElBQUksR0FBRztvQkFDakIsTUFBTSxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtnQkFFNUMsT0FBTyxNQUFNLENBQUE7YUFDakI7U0FrQkw7UUFFRCxPQUFPLE1BQU0sQ0FBQTtJQUVsQixDQUFDLEdBQUksQ0FBQTs7SUMzRkwsU0FBUyxhQUFhO1FBRWpCLE9BQU87WUFDRixPQUFPLEVBQVMsRUFBRTtZQUNsQixXQUFXLEVBQUssQ0FBQztZQUNqQixXQUFXLEVBQUssQ0FBQztZQUNqQixXQUFXLEVBQUssU0FBUTtZQUN4QixNQUFNLEVBQVUsU0FBUTtZQUN4QixVQUFVLEVBQU0sTUFBTSxJQUFJO1lBQzFCLGNBQWMsRUFBRSxTQUFRO1lBQ3hCLGNBQWMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVU7a0JBQ3RDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsSUFBSSxDQUFDO1NBQ2hFLENBQUE7SUFDTixDQUFDO0lBRUQsSUFBSSxPQUFPLEdBQU0sS0FBSyxDQUFBO0lBQ3RCLElBQUksT0FBMkIsQ0FBQTtJQUUvQjtJQUNBLElBQUksZUFBZSxHQUFHO1FBQ2pCLE1BQU0sRUFBVSxDQUFFLENBQVMsS0FBTSxDQUFDO1FBQ2xDLFVBQVUsRUFBTSxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsQ0FBQztRQUNwQyxXQUFXLEVBQUssQ0FBRSxDQUFTLEtBQU0sQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLENBQUM7UUFDeEMsYUFBYSxFQUFHLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsSUFBRSxDQUFDO1FBQzVELFdBQVcsRUFBSyxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7UUFDdEMsWUFBWSxFQUFJLENBQUUsQ0FBUyxLQUFNLENBQUMsRUFBRSxDQUFDLElBQUUsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO1FBQzVDLGNBQWMsRUFBRSxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsRUFBRSxHQUFHLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBQyxDQUFDLEtBQUcsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUM7UUFDekUsV0FBVyxFQUFLLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7UUFDeEMsWUFBWSxFQUFJLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFFLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQztRQUM5QyxjQUFjLEVBQUUsQ0FBRSxDQUFTLEtBQU0sQ0FBQyxHQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLElBQUUsRUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7UUFDbkUsV0FBVyxFQUFLLENBQUUsQ0FBUyxLQUFNLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO1FBQzFDLFlBQVksRUFBSSxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsSUFBRSxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO1FBQ2hELGNBQWMsRUFBRSxDQUFFLENBQVMsS0FBTSxDQUFDLEdBQUMsRUFBRSxHQUFHLEVBQUUsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFHLENBQUMsR0FBQyxFQUFFLElBQUUsRUFBRSxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDO0tBQzdFLENBQUE7QUFFRCxhQUFnQixTQUFTLENBQUcsT0FBeUI7UUFFaEQsTUFBTSxNQUFNLEdBQU8sYUFBYSxFQUFHLENBQUE7UUFFbkMsSUFBSSxTQUFTLEdBQUksS0FBSyxDQUFBO1FBQ3RCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQTtRQUN0QixJQUFJLGFBQXdCLENBQUE7UUFFNUIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFBO1FBQ2xCLElBQUksT0FBTyxHQUFNLENBQUMsQ0FBQTtRQUNsQixJQUFJLE9BQU8sR0FBTSxDQUFDLENBQUE7UUFFbEIsSUFBSSxjQUFjLEdBQUcsR0FBRyxDQUFBO1FBQ3hCLElBQUksVUFBa0IsQ0FBQTtRQUN0QixJQUFJLFVBQWtCLENBQUE7UUFFdEIsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUUxQixZQUFZLENBQUcsT0FBTyxDQUFFLENBQUE7UUFFeEIsU0FBUyxZQUFZLENBQUcsT0FBeUI7WUFFNUMsSUFBSyxPQUFPLEVBQ1o7Z0JBQ0ssT0FBTTthQUNWO1lBRUQsSUFBSyxTQUFTLENBQUMsY0FBYyxHQUFHLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUE7WUFFN0MsYUFBYSxFQUFHLENBQUE7WUFFaEIsTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLEVBQUUsT0FBTyxDQUFFLENBQUE7WUFFakMsWUFBWSxFQUFHLENBQUE7U0FDbkI7UUFFRCxTQUFTLFVBQVUsQ0FBRyxHQUFJLE9BQXVCO1lBRTVDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxFQUN4QjtnQkFDSyxJQUFLLENBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUUsQ0FBQyxDQUFDO29CQUM3QixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUMsQ0FBQTthQUNoQztZQUVELElBQUssU0FBUyxFQUNkO2dCQUNLLFdBQVcsRUFBRyxDQUFBO2dCQUNkLFFBQVEsRUFBRyxDQUFBO2FBQ2Y7U0FDTDtRQUVELFNBQVMsUUFBUTtZQUVaLFlBQVksRUFBRyxDQUFBO1lBQ2YsU0FBUyxHQUFHLElBQUksQ0FBQTtTQUNwQjtRQUVELFNBQVMsV0FBVztZQUVmLGFBQWEsRUFBRyxDQUFBO1lBQ2hCLFNBQVMsR0FBRyxLQUFLLENBQUE7U0FDckI7UUFFRCxPQUFPO1lBQ0YsWUFBWTtZQUNaLFVBQVU7WUFDVixRQUFRLEVBQUUsTUFBTSxTQUFTO1lBQ3pCLFFBQVE7WUFDUixXQUFXO1NBQ2YsQ0FBQTtRQUVELFNBQVMsWUFBWTtZQUVoQixLQUFNLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPO2dCQUMxQixDQUFDLENBQUMsZ0JBQWdCLENBQUcsYUFBYSxFQUFFLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBRSxDQUFBO1NBQ3pFO1FBQ0QsU0FBUyxhQUFhO1lBRWpCLEtBQU0sTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU87Z0JBQzFCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBRyxhQUFhLEVBQUcsT0FBTyxDQUFFLENBQUE7U0FDMUQ7UUFFRCxTQUFTLE9BQU8sQ0FBRyxLQUE4QjtZQUU1QyxJQUFLLE9BQU8sRUFDWjtnQkFDSyxPQUFPLENBQUMsSUFBSSxDQUFHLHdDQUF3QztzQkFDdEMsK0JBQStCLENBQUUsQ0FBQTtnQkFDbEQsT0FBTTthQUNWO1lBRUQsSUFBSyxVQUFVLEVBQ2Y7Z0JBQ0ssaUJBQWlCLEVBQUcsQ0FBQTthQUN4QjtZQUVELE9BQU8sR0FBSSxLQUFvQixDQUFDLE9BQU87a0JBQzFCLEtBQW9CLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQztrQkFDaEMsS0FBb0IsQ0FBQTtZQUVqQyxNQUFNLENBQUMsZ0JBQWdCLENBQUUsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQy9DLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRSxXQUFXLEVBQUksS0FBSyxDQUFDLENBQUE7WUFDOUMsYUFBYSxFQUFHLENBQUE7WUFFaEIsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFHLGdCQUFnQixDQUFFLENBQUE7WUFFckUsT0FBTyxHQUFHLElBQUksQ0FBQTtTQUNsQjtRQUNELFNBQVMsTUFBTSxDQUFHLEtBQThCO1lBRTNDLElBQUssT0FBTyxJQUFJLEtBQUs7Z0JBQ2hCLE9BQU07WUFFWCxPQUFPLEdBQUksS0FBb0IsQ0FBQyxPQUFPLEtBQUssU0FBUztrQkFDeEMsS0FBb0IsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDO2tCQUNoQyxLQUFvQixDQUFBO1NBQ3JDO1FBQ0QsU0FBUyxLQUFLLENBQUcsS0FBOEI7WUFFMUMsTUFBTSxDQUFDLG1CQUFtQixDQUFFLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUNsRCxNQUFNLENBQUMsbUJBQW1CLENBQUUsV0FBVyxFQUFJLEtBQUssQ0FBQyxDQUFBO1lBQ2pELFlBQVksRUFBRyxDQUFBO1lBRWYsT0FBTyxHQUFHLEtBQUssQ0FBQTtTQUNuQjtRQUVELFNBQVMsZ0JBQWdCLENBQUcsR0FBVztZQUVsQyxPQUFPLEdBQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQTtZQUM1QixPQUFPLEdBQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQTtZQUM1QixVQUFVLEdBQUcsR0FBRyxDQUFBO1lBRWhCLGFBQWEsR0FBRztnQkFDWCxLQUFLLEVBQU0sQ0FBQztnQkFDWixDQUFDLEVBQVUsQ0FBQztnQkFDWixDQUFDLEVBQVUsQ0FBQztnQkFDWixPQUFPLEVBQUksQ0FBQztnQkFDWixPQUFPLEVBQUksQ0FBQztnQkFDWixPQUFPLEVBQUUsQ0FBQztnQkFDVixPQUFPLEVBQUUsQ0FBQzthQUNkLENBQUE7WUFFRCxNQUFNLENBQUMsV0FBVyxFQUFHLENBQUE7WUFFckIsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFHLGdCQUFnQixDQUFFLENBQUE7U0FDekU7UUFDRCxTQUFTLGdCQUFnQixDQUFHLEdBQVc7WUFFbEMsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLE1BQU0sQ0FBQTtZQUVqQyxNQUFNLENBQUMsR0FBYSxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtZQUM3QyxNQUFNLENBQUMsR0FBYSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQTtZQUM3QyxNQUFNLEtBQUssR0FBUyxHQUFHLEdBQUcsVUFBVSxDQUFBO1lBQ3BDLE1BQU0sV0FBVyxHQUFHLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFBO1lBQy9DLE1BQU0sT0FBTyxHQUFPLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFBO1lBQ3ZDLE1BQU0sT0FBTyxHQUFPLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFBO1lBRXZDLGFBQWEsR0FBRztnQkFDWCxLQUFLO2dCQUNMLENBQUM7Z0JBQ0QsQ0FBQztnQkFDRCxPQUFPLEVBQUUsQ0FBQztnQkFDVixPQUFPLEVBQUUsQ0FBQztnQkFDVixPQUFPO2dCQUNQLE9BQU87YUFDWCxDQUFBO1lBRUQsSUFBSyxPQUFPLEVBQ1o7Z0JBQ0ssTUFBTSxDQUFDLE1BQU0sQ0FBRyxhQUFhLENBQUUsQ0FBQTtnQkFDL0IsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFHLGdCQUFnQixDQUFFLENBQUE7YUFDekU7aUJBRUQ7Z0JBQ0ssVUFBVSxHQUFPLEdBQUcsQ0FBQTtnQkFDcEIsT0FBTyxHQUFVLENBQUMsQ0FBQTtnQkFDbEIsT0FBTyxHQUFVLENBQUMsQ0FBQTtnQkFDbEIsVUFBVSxHQUFTLGNBQWMsR0FBRyxJQUFJLENBQUcsT0FBTyxHQUFHLFdBQVcsQ0FBRSxDQUFBO2dCQUNsRSxVQUFVLEdBQVMsY0FBYyxHQUFHLElBQUksQ0FBRyxPQUFPLEdBQUcsV0FBVyxDQUFFLENBQUE7Z0JBRWxFLGFBQWEsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFBO2dCQUNuQyxhQUFhLENBQUMsT0FBTyxJQUFJLFVBQVUsQ0FBQTtnQkFFbkMsSUFBSyxNQUFNLENBQUMsVUFBVSxDQUFHLGFBQWEsQ0FBRSxLQUFLLElBQUksRUFDakQ7b0JBQ0ssVUFBVSxHQUFHLElBQUksQ0FBQTtvQkFDakIsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFHLGVBQWUsQ0FBRSxDQUFBO2lCQUN4RTthQUNMO1lBRUQsU0FBUyxJQUFJLENBQUcsS0FBYTtnQkFFeEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO29CQUNULE9BQU8sQ0FBQyxDQUFDLENBQUE7Z0JBRWQsSUFBSyxLQUFLLEdBQUcsQ0FBQztvQkFDVCxPQUFPLENBQUMsQ0FBQTtnQkFFYixPQUFPLEtBQUssQ0FBQTthQUNoQjtTQUNMO1FBQ0QsU0FBUyxlQUFlLENBQUcsR0FBVztZQUVqQyxNQUFNLEtBQUssR0FBRyxHQUFHLEdBQUcsVUFBVSxDQUFBO1lBRTlCLE1BQU0sQ0FBQyxHQUFHLEtBQUssSUFBSSxjQUFjO2tCQUN2QixDQUFDO2tCQUNELEtBQUssR0FBRyxjQUFjLENBQUE7WUFFaEMsTUFBTSxNQUFNLEdBQUksZUFBZSxDQUFDLFlBQVksQ0FBRSxDQUFDLENBQUMsQ0FBQTtZQUNoRCxNQUFNLE9BQU8sR0FBRyxVQUFVLEdBQUcsTUFBTSxDQUFBO1lBQ25DLE1BQU0sT0FBTyxHQUFHLFVBQVUsR0FBRyxNQUFNLENBQUE7WUFFbkMsYUFBYSxDQUFDLENBQUMsR0FBUyxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBQ3pDLGFBQWEsQ0FBQyxDQUFDLEdBQVMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtZQUN6QyxhQUFhLENBQUMsT0FBTyxHQUFHLFVBQVUsR0FBRyxPQUFPLENBQUE7WUFDNUMsYUFBYSxDQUFDLE9BQU8sR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFBO1lBRTVDLE1BQU0sQ0FBQyxNQUFNLENBQUcsYUFBYSxDQUFFLENBQUE7WUFFL0IsSUFBSyxDQUFDLElBQUksQ0FBQyxFQUNYO2dCQUNLLFVBQVUsR0FBRyxLQUFLLENBQUE7Z0JBQ2xCLE1BQU0sQ0FBQyxjQUFjLENBQUcsYUFBYSxDQUFFLENBQUE7Z0JBQ3ZDLE9BQU07YUFDVjtZQUVELGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRyxlQUFlLENBQUUsQ0FBQTtTQUN4RTtRQUNELFNBQVMsaUJBQWlCO1lBRXJCLFVBQVUsR0FBRyxLQUFLLENBQUE7WUFDbEIsTUFBTSxDQUFDLG9CQUFvQixDQUFHLGlCQUFpQixDQUFFLENBQUE7WUFDakQsTUFBTSxDQUFDLGNBQWMsQ0FBRyxhQUFhLENBQUUsQ0FBQTtTQUMzQztJQUNOLENBQUM7O0lDOVJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVGQSxhQUtnQixRQUFRLENBQUcsRUFBNEIsRUFBRSxRQUFnQjtRQUVwRSxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUcsRUFBRSxDQUFDLEtBQUssQ0FBRyxRQUFRLENBQUUsQ0FBRSxDQUFBO1FBRWhELElBQUssTUFBTSxDQUFDLEtBQUssQ0FBRyxLQUFLLENBQUUsRUFDM0I7WUFDSyxLQUFLLEdBQUcsVUFBVSxDQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBRyxFQUFFLENBQUUsQ0FBRyxRQUFRLENBQUUsQ0FBRSxDQUFBO1lBRWxFLElBQUssTUFBTSxDQUFDLEtBQUssQ0FBRyxLQUFLLENBQUU7Z0JBQ3RCLEtBQUssR0FBRyxDQUFDLENBQUE7U0FDbEI7UUFFRCxPQUFPLEtBQUssQ0FBQTtJQUNqQixDQUFDO0FBRUQsYUFBZ0IsTUFBTSxDQUFHLEVBQTRCLEVBQUUsUUFBZ0I7UUFFbEUsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUcsUUFBUSxDQUFFLENBQUUsQ0FBQTtRQUU5QyxJQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUcsS0FBSyxDQUFFLEVBQzNCO1lBQ0ssTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFHLEVBQUUsQ0FBRSxDQUFBO1lBRTVDLEtBQUssR0FBRyxRQUFRLENBQUcsS0FBSyxDQUFHLFFBQVEsQ0FBRSxDQUFFLENBQUE7WUFFdkMsSUFBSyxNQUFNLENBQUMsS0FBSyxDQUFHLEtBQUssQ0FBRTtnQkFDdEIsS0FBSyxHQUFHLENBQUMsQ0FBQTtTQUNsQjtRQUVELE9BQU8sS0FBSyxDQUFBO0lBQ2pCLENBQUM7O0lDcEdELFNBQVNDLGVBQWE7UUFFakIsT0FBTztZQUNGLE9BQU8sRUFBUSxFQUFFO1lBQ2pCLFFBQVEsRUFBTyxRQUFRO1lBQ3ZCLElBQUksRUFBVyxLQUFLO1lBQ3BCLElBQUksRUFBVyxFQUFFO1lBQ2pCLEtBQUssRUFBVSxHQUFHO1lBQ2xCLE9BQU8sRUFBUSxDQUFDO1lBQ2hCLE9BQU8sRUFBUSxNQUFNLENBQUMsV0FBVztZQUNqQyxJQUFJLEVBQVcsSUFBSTtZQUNuQixTQUFTLEVBQU0sSUFBSTtZQUNuQixZQUFZLEVBQUcsU0FBUTtZQUN2QixXQUFXLEVBQUksU0FBUTtZQUN2QixhQUFhLEVBQUUsU0FBUTtZQUN2QixZQUFZLEVBQUcsU0FBUTtTQUMzQixDQUFBO0lBQ04sQ0FBQztJQUVELE1BQU0sTUFBTSxHQUFHO1FBQ1YsRUFBRSxFQUFHLENBQUM7UUFDTixFQUFFLEVBQUcsQ0FBQyxDQUFDO1FBQ1AsRUFBRSxFQUFHLENBQUMsQ0FBQztRQUNQLEVBQUUsRUFBRyxDQUFDO0tBQ1YsQ0FBQTtJQUNELE1BQU0sVUFBVSxHQUFnQztRQUMzQyxFQUFFLEVBQUcsT0FBTztRQUNaLEVBQUUsRUFBRyxPQUFPO1FBQ1osRUFBRSxFQUFHLFFBQVE7UUFDYixFQUFFLEVBQUcsUUFBUTtLQUNqQixDQUFBO0FBRUQsYUFBZ0IsVUFBVSxDQUFHLE9BQW9CLEVBQUUsVUFBNkIsRUFBRTtRQUU3RSxNQUFNLE1BQU0sR0FBR0EsZUFBYSxFQUFHLENBQUE7UUFFL0IsSUFBSSxPQUFvQixDQUFBO1FBQ3hCLElBQUksV0FBb0IsQ0FBQTtRQUN4QixJQUFJLElBQW1CLENBQUE7UUFDdkIsSUFBSSxJQUFzQyxDQUFBO1FBQzFDLElBQUksRUFBdUIsQ0FBQTtRQUMzQixJQUFJLE9BQW1CLENBQUE7UUFDdkIsSUFBSSxPQUFtQixDQUFBO1FBQ3ZCLElBQUksVUFBVSxHQUFJLENBQUMsQ0FBQTtRQUNuQixJQUFJLFNBQVMsR0FBSyxHQUFHLENBQUE7UUFFckIsTUFBTUMsV0FBUyxHQUFHQyxTQUFZLENBQUU7WUFDM0IsT0FBTyxFQUFTLEVBQUU7WUFDbEIsV0FBVyxFQUFLLFdBQVc7WUFDM0IsVUFBVSxFQUFNLFVBQVU7WUFDMUIsY0FBYyxFQUFFLGNBQWM7U0FDbEMsQ0FBQyxDQUFBO1FBRUYsWUFBWSxDQUFHLE9BQU8sQ0FBRSxDQUFBO1FBRXhCLFNBQVMsWUFBWSxDQUFHLFVBQVUsRUFBdUI7WUFFcEQsSUFBSyxPQUFPLENBQUMsUUFBUSxJQUFJLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLFNBQVM7Z0JBQy9ELE9BQU8sQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUV0RCxNQUFNLENBQUMsTUFBTSxDQUFHLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQTtZQUVqQyxPQUFPLEdBQU8sTUFBTSxDQUFDLElBQUksQ0FBQTtZQUN6QixJQUFJLEdBQVUsTUFBTSxDQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUN2QyxJQUFJLEdBQVUsTUFBTSxDQUFDLElBQUksQ0FBQTtZQUN6QixXQUFXLEdBQUcsTUFBTSxDQUFDLFNBQVMsSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLFNBQVMsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQTtZQUNqRixPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQTtZQUN4QixPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQTtZQUV4QixPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxXQUFXLEdBQUcsWUFBWSxHQUFHLFVBQVUsQ0FBRSxDQUFBO1lBQ3BFLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsWUFBWSxDQUFFLENBQUE7WUFFcEVELFdBQVMsQ0FBQyxZQUFZLENBQUU7Z0JBQ25CLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztnQkFDdkIsTUFBTSxFQUFHLFdBQVcsR0FBRyxjQUFjLEdBQUUsZ0JBQWdCO2FBQzNELENBQUMsQ0FBQTtTQUNOO1FBQ0QsU0FBUyxJQUFJO1lBRVIsT0FBTyxPQUFPLEdBQUcsTUFBTSxDQUFHLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFFLEdBQUcsQ0FBQyxDQUFBO1NBQzVEO1FBQ0QsU0FBUyxNQUFNO1lBRVYsSUFBSyxPQUFPO2dCQUNQLEtBQUssRUFBRyxDQUFBOztnQkFFUixJQUFJLEVBQUcsQ0FBQTtTQUNoQjtRQUNELFNBQVMsSUFBSTtZQUVSLE1BQU0sQ0FBQyxZQUFZLEVBQUcsQ0FBQTtZQUV0QixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxTQUFTLENBQUUsQ0FBQTtZQUNuQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBRyxPQUFPLEVBQUUsTUFBTSxDQUFFLENBQUE7WUFFN0MsSUFBSyxFQUFFO2dCQUNGLGVBQWUsRUFBRyxDQUFBO1lBRXZCLEVBQUUsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFBO1lBQ3ZCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBRyxlQUFlLEVBQUUsTUFBTSxlQUFlLENBQUUsQ0FBQTtZQUVuRSxPQUFPLENBQUMsS0FBSyxDQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUUsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFBO1lBRXBELE9BQU8sR0FBRyxJQUFJLENBQUE7U0FDbEI7UUFDRCxTQUFTLEtBQUs7WUFFVCxNQUFNLENBQUMsYUFBYSxFQUFHLENBQUE7WUFFdkIsU0FBUyxHQUFHLElBQUksRUFBRyxDQUFBO1lBRW5CLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFNBQVMsQ0FBRSxDQUFBO1lBQ25DLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFHLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQTtZQUU3QyxJQUFLLEVBQUU7Z0JBQ0YsZUFBZSxFQUFHLENBQUE7WUFFdkIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUE7WUFDeEIsT0FBTyxDQUFDLGdCQUFnQixDQUFHLGVBQWUsRUFBRSxlQUFlLENBQUUsQ0FBQTtZQUU3RCxPQUFPLENBQUMsS0FBSyxDQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUUsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFBO1lBRTlDLE9BQU8sR0FBRyxLQUFLLENBQUE7U0FDbkI7UUFFRCxPQUFPO1lBQ0YsWUFBWTtZQUNaLElBQUk7WUFDSixLQUFLO1lBQ0wsTUFBTTtZQUNOLE1BQU0sRUFBTyxNQUFNLE9BQU87WUFDMUIsT0FBTyxFQUFNLE1BQU0sQ0FBRSxPQUFPO1lBQzVCLFVBQVUsRUFBRyxNQUFNLFdBQVc7WUFDOUIsUUFBUSxFQUFLLE1BQU1BLFdBQVMsQ0FBQyxRQUFRLEVBQUc7WUFDeEMsUUFBUSxFQUFLLE1BQU1BLFdBQVMsQ0FBQyxRQUFRLEVBQUc7WUFDeEMsV0FBVyxFQUFFLE1BQU1BLFdBQVMsQ0FBQyxXQUFXLEVBQUc7U0FDL0MsQ0FBQTtRQUVELFNBQVMsZUFBZTtZQUVuQixJQUFLLEVBQUU7Z0JBQ0YsRUFBRSxFQUFHLENBQUE7WUFDVixPQUFPLENBQUMsbUJBQW1CLENBQUcsZUFBZSxFQUFFLE1BQU0sZUFBZSxDQUFFLENBQUE7WUFDdEUsRUFBRSxHQUFHLElBQUksQ0FBQTtTQUNiO1FBRUQsU0FBUyxXQUFXO1lBRWYsVUFBVSxHQUFHLElBQUksRUFBRyxDQUFBO1lBQ3BCLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLFNBQVMsQ0FBRSxDQUFBO1NBQzFDO1FBQ0QsU0FBUyxjQUFjLENBQUcsS0FBbUI7WUFFeEMsT0FBTyxDQUFDLEdBQUcsQ0FBRyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUUsQ0FBQTtZQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFHLEtBQUssQ0FBRyxVQUFVLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUUsR0FBRyxJQUFJLENBQUUsQ0FBQTtZQUM1RCxPQUFPLENBQUMsS0FBSyxDQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUUsR0FBRyxLQUFLLENBQUcsVUFBVSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFBO1NBQ3BGO1FBQ0QsU0FBUyxnQkFBZ0IsQ0FBRyxLQUFtQjtZQUUxQyxPQUFPLENBQUMsS0FBSyxDQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUUsR0FBRyxLQUFLLENBQUcsVUFBVSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFFLEdBQUcsSUFBSSxDQUFBO1NBQ3BGO1FBQ0QsU0FBUyxVQUFVLENBQUcsS0FBbUI7WUFFcEMsSUFBSSxRQUFRLEdBQUcsV0FBVyxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJO2tCQUM1QixJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFBO1lBRXpELElBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxLQUFLLEtBQUssQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDLEtBQUssRUFDdkQ7Z0JBQ0ssTUFBTSxFQUFHLENBQUE7Z0JBQ1QsT0FBTyxLQUFLLENBQUE7YUFDaEI7WUFFRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQ3BCLFdBQVcsR0FBRyxVQUFVLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPO2tCQUNqQyxVQUFVLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQ25ELENBQUE7WUFFRCxJQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUMvQjtnQkFDSyxLQUFLLEVBQUcsQ0FBQTtnQkFDUixPQUFPLEtBQUssQ0FBQTthQUNoQjtZQUVELE9BQU8sSUFBSSxDQUFBO1NBRWY7UUFDRCxTQUFTLGNBQWM7WUFFbEIsU0FBUyxHQUFHLE1BQU0sQ0FBRyxPQUFPLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBRSxDQUFBO1lBQy9DLElBQUksRUFBRyxDQUFBO1NBQ1g7UUFFRCxTQUFTLEtBQUssQ0FBRyxDQUFTO1lBRXJCLElBQUssQ0FBQyxHQUFHLE9BQU87Z0JBQ1gsT0FBTyxPQUFPLENBQUE7WUFFbkIsSUFBSyxDQUFDLEdBQUcsT0FBTztnQkFDWCxPQUFPLE9BQU8sQ0FBQTtZQUVuQixPQUFPLENBQUMsQ0FBQTtTQUNaO0lBQ04sQ0FBQzs7SUNqTkQsU0FBU0QsZUFBYTtRQUVqQixPQUFPO1lBQ0YsT0FBTyxFQUFLLEVBQUU7WUFDZCxTQUFTLEVBQUcsSUFBSTtZQUNoQixRQUFRLEVBQUksTUFBTTtZQUNsQixRQUFRLEVBQUksQ0FBQyxHQUFHO1lBQ2hCLFFBQVEsRUFBSSxDQUFDO1lBQ2IsS0FBSyxFQUFPLEdBQUc7WUFDZixVQUFVLEVBQUUsSUFBSTtTQUNwQixDQUFBO0lBQ04sQ0FBQztJQUVELElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQTtJQUN0QixJQUFJLFdBQVcsR0FBTSxLQUFLLENBQUE7SUFDMUIsSUFBSSxJQUF3QixDQUFBO0FBRTVCLGFBQWdCLFNBQVMsQ0FBRyxPQUFvQixFQUFFLE9BQXlCO1FBRXRFLE1BQU0sTUFBTSxHQUFHQSxlQUFhLEVBQUcsQ0FBQTtRQUUvQixNQUFNQyxXQUFTLEdBQUdDLFNBQVksQ0FBRTtZQUMzQixPQUFPLEVBQUUsRUFBRTtZQUNYLFdBQVc7WUFDWCxVQUFVO1NBQ2QsQ0FBQyxDQUFBO1FBRUYsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUcsV0FBVyxDQUFFLENBQUE7UUFFckMsWUFBWSxDQUFHLE9BQU8sQ0FBRSxDQUFBO1FBRXhCLFNBQVMsWUFBWSxDQUFHLE9BQXlCO1lBRTVDLE1BQU0sQ0FBQyxNQUFNLENBQUcsTUFBTSxFQUFFLE9BQU8sQ0FBRSxDQUFBO1lBRWpDLFdBQVcsR0FBRyxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQTtZQUVsRSxJQUFLLE9BQU8sQ0FBQyxRQUFRLElBQUksU0FBUztnQkFDN0IsTUFBTSxDQUFDLFFBQVEsR0FBRyxXQUFXLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQTs7Ozs7OztZQVNuREQsV0FBUyxDQUFDLFlBQVksQ0FBRTtnQkFDbkIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO2dCQUN2QixNQUFNLEVBQUUsV0FBVyxHQUFHLGNBQWMsR0FBRyxnQkFBZ0I7YUFDM0QsQ0FBQyxDQUFBO1lBRUYsSUFBSSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUE7WUFFdEIsSUFBS0EsV0FBUyxDQUFDLFFBQVEsRUFBRztnQkFDckIsWUFBWSxFQUFHLENBQUE7O2dCQUVmLGVBQWUsRUFBRyxDQUFBO1NBQzNCO1FBRUQsU0FBUyxRQUFRO1lBRVosT0FBTyxRQUFRLENBQUcsT0FBTyxFQUFFLElBQUksQ0FBRSxDQUFBO1NBQ3JDO1FBRUQsU0FBUyxRQUFRO1lBRVpBLFdBQVMsQ0FBQyxRQUFRLEVBQUcsQ0FBQTtZQUNyQixZQUFZLEVBQUcsQ0FBQTtTQUNuQjtRQUNELFNBQVMsV0FBVztZQUVmQSxXQUFTLENBQUMsV0FBVyxFQUFHLENBQUE7WUFDeEIsZUFBZSxFQUFHLENBQUE7U0FDdEI7UUFJRCxTQUFTLEtBQUssQ0FBRyxNQUFxQixFQUFFLENBQVM7WUFFNUMsSUFBSyxPQUFPLE1BQU0sSUFBSSxRQUFRLEVBQzlCO2dCQUNLLENBQUMsR0FBR0UsT0FBVyxDQUFHLE1BQU0sQ0FBVyxDQUFBO2dCQUNuQyxNQUFNLEdBQUcsVUFBVSxDQUFHLE1BQU0sQ0FBRSxDQUFBO2FBQ2xDO1lBRUQsSUFBSyxDQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBRyxDQUFDLENBQUU7Z0JBQzVCLENBQUMsR0FBRyxJQUFJLENBQUE7WUFFYixJQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUN0QjtnQkFDSyxJQUFLLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEtBQUssR0FBRztvQkFDekIsTUFBTSxHQUFHLFVBQVUsQ0FBRyxNQUFNLENBQUUsQ0FBQTs7b0JBRTlCLE1BQU0sR0FBRyxRQUFRLENBQUcsTUFBTSxDQUFFLENBQUE7YUFDckM7WUFFRCxPQUFPLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBRyxNQUFNLENBQUUsR0FBRyxDQUFDLENBQUE7U0FDL0M7UUFFRCxPQUFPO1lBQ0YsWUFBWTtZQUNaLFFBQVE7WUFDUixXQUFXO1lBQ1gsUUFBUTtZQUNSLEtBQUs7U0FDVCxDQUFBO1FBRUQsU0FBUyxZQUFZO1lBRWhCLElBQUssTUFBTSxDQUFDLFVBQVUsRUFDdEI7Z0JBQ0ssS0FBTSxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTztvQkFDMUIsQ0FBQyxDQUFDLGdCQUFnQixDQUFHLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUUsQ0FBQTthQUNuRTtTQUNMO1FBQ0QsU0FBUyxlQUFlO1lBRW5CLEtBQU0sTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU87Z0JBQzFCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBRyxPQUFPLEVBQUUsT0FBTyxDQUFFLENBQUE7U0FDbkQ7UUFFRCxTQUFTLFFBQVEsQ0FBRyxVQUFrQjtZQUVqQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFBO1lBRS9DLElBQUssVUFBVSxHQUFHLEdBQUc7Z0JBQ2hCLFVBQVUsR0FBRyxHQUFHLEdBQUcsVUFBVSxDQUFBO1lBRWxDLE9BQU8sR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxVQUFVLEdBQUcsR0FBRyxDQUFBO1NBQy9DO1FBQ0QsU0FBUyxVQUFVLENBQUcsTUFBYztZQUUvQixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFBO1lBQy9DLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBRSxDQUFBO1NBQzFEO1FBRUQsU0FBUyxXQUFXO1lBRWYsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsU0FBUyxDQUFFLENBQUE7WUFDdEMsY0FBYyxHQUFHLFFBQVEsRUFBRyxDQUFBO1NBQ2hDO1FBQ0QsU0FBUyxjQUFjLENBQUcsS0FBbUI7WUFFeEMsT0FBTyxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUcsY0FBYyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFBO1NBQzVFO1FBQ0QsU0FBUyxnQkFBZ0IsQ0FBRyxLQUFtQjtZQUUxQyxPQUFPLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBRyxjQUFjLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7U0FDNUU7UUFDRCxTQUFTLFVBQVUsQ0FBRyxLQUFtQjtZQUVwQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxTQUFTLENBQUUsQ0FBQTtZQUVuQyxNQUFNLE1BQU0sR0FBRyxXQUFXO2tCQUNULEtBQUssQ0FBQyxDQUFDO2tCQUNQLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFFeEIsT0FBTyxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUcsY0FBYyxHQUFHLE1BQU0sQ0FBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUE7WUFDdkUsT0FBTyxJQUFJLENBQUE7U0FDZjtRQUNELFNBQVMsT0FBTyxDQUFHLEtBQWlCO1lBRS9CLElBQUssS0FBSyxDQUFDLFNBQVMsSUFBSSxVQUFVLENBQUMsZUFBZTtnQkFDN0MsT0FBTTtZQUVYLElBQUssV0FBVyxFQUNoQjtnQkFDSyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFBO2FBQzVCO2lCQUVEO2dCQUNLLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7Z0JBRXhCLElBQUssS0FBSyxJQUFJLENBQUM7b0JBQ1YsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7YUFDN0I7WUFFRCxPQUFPLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBRyxRQUFRLEVBQUcsR0FBRyxLQUFLLENBQUUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFBO1NBQ3ZFO1FBQ0QsU0FBUyxLQUFLLENBQUcsS0FBYTtZQUV6QixPQUFPLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRO2tCQUN6QyxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUTtzQkFDekMsS0FBSyxDQUFBO1NBQ2hCO0lBQ04sQ0FBQzs7VUN0TVksUUFBUTtRQVVoQjtZQUhTLE9BQUUsR0FBRyxFQUFVLENBQUE7WUFDZixXQUFNLEdBQUcsRUFBb0MsQ0FBQTtTQUVyQztRQUxqQixXQUFXLE9BQU8sS0FBTSxPQUFPLE9BQU8sQ0FBQSxFQUFFO1FBT3hDLEdBQUcsQ0FBc0IsSUFBTyxFQUFFLFFBQWtCO1lBRS9DLElBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFO2dCQUNmLE9BQU07WUFFTixJQUFJLENBQUMsRUFBRSxDQUFFLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQTtTQUNsQztRQUVELEdBQUcsQ0FBRyxHQUFXO1lBRVosT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQTtTQUN6QjtRQUVELEdBQUcsQ0FBc0IsSUFBTyxFQUFFLEdBQUksSUFBMkI7WUFFNUQsSUFBSyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsRUFDcEI7Z0JBQ0ssSUFBSSxDQUFDLEVBQUUsQ0FBRSxJQUFJLENBQUMsQ0FBRyxHQUFJLElBQVcsQ0FBRSxDQUFBO2dCQUVsQyxJQUFLLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTTtvQkFDbkIsSUFBSSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUcsQ0FBQTthQUN2QztTQUNMO1FBRUQsRUFBRSxDQUFHLElBQVksRUFBRSxRQUFvQjtZQUVsQyxNQUFNLFNBQVMsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU07a0JBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUM7a0JBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLEdBQUdDLE1BQWEsRUFBRyxDQUFBO1lBRTNELFNBQVMsQ0FBRyxRQUFRLENBQUUsQ0FBQTtTQUMxQjtRQUVELE1BQU0sQ0FBRyxHQUFXO1lBRWYsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFFLEdBQUcsQ0FBQyxDQUFBO1NBQ3hCO0tBQ0w7SUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLFFBQVEsRUFBRyxDQUFBOztVQ25EbEIsU0FBUztRQWVqQixZQUFjLElBQU87WUFFaEIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUNwQixJQUFJLENBQUMsV0FBVyxFQUFHLEVBQ25CLFVBQVUsQ0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFTLENBQ2xELENBQUE7U0FDTDtRQWZELFdBQVc7WUFFTixPQUFPO2dCQUNGLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixJQUFJLEVBQUssV0FBVztnQkFDcEIsRUFBRSxFQUFPLFNBQVM7YUFDdEIsQ0FBQTtTQUNMO1FBVUQsT0FBTztZQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLEVBQ2hDO2dCQUNLLElBQUksQ0FBQyxTQUFTLEdBQUcsZUFBSyxLQUFLLEVBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQVMsQ0FBQTtnQkFDckQsSUFBSSxDQUFDLFFBQVEsRUFBRyxDQUFBO2FBQ3BCO1lBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtTQUMzQjtRQUVELFFBQVE7U0FHUDtRQUVTLFFBQVE7WUFFYixNQUFNLElBQUksS0FBSyxDQUFFLGlCQUFpQixDQUFDLENBQUE7U0FDdkM7UUFFUyxPQUFPO1lBRVosTUFBTSxJQUFJLEtBQUssQ0FBRSxpQkFBaUIsQ0FBQyxDQUFBO1NBQ3ZDO1FBRVMsVUFBVTtZQUVmLE1BQU0sSUFBSSxLQUFLLENBQUUsaUJBQWlCLENBQUMsQ0FBQTtTQUN2QztRQUVELFlBQVk7U0FHWDtRQUVELFdBQVc7U0FHVjtRQUVELGNBQWM7U0FHYjtLQUVMOztJQ25GRDtBQUVBLElBR0EsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFBO0lBQzVCLE1BQU0sRUFBRSxHQUFRLElBQUksUUFBUSxFQUFvQixDQUFBO0lBQ2hELE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUErQixFQUFFLENBQUUsQ0FBQTtBQUU5RCxJQUFPLE1BQU0sT0FBTyxHQUEyQjtRQUUxQyxNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Y0FDckIsU0FBUyxDQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBRTtjQUMzQixTQUFTLENBQUcsQ0FBQyxHQUFJLFNBQVMsQ0FBQyxDQUFFLENBQUE7UUFFekMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBRyxHQUFHLENBQUUsQ0FBQTtRQUVwQyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUcsSUFBSSxDQUFFLENBQUE7SUFDckMsQ0FBQyxDQUFBO0FBRUQsSUFBTyxNQUFNLElBQUksR0FBd0IsVUFBVyxHQUFJLElBQVk7UUFFL0QsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO2NBQ3JCLFNBQVMsQ0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUU7Y0FDM0IsU0FBUyxDQUFHLENBQUMsR0FBSSxTQUFTLENBQUMsQ0FBRSxDQUFBO1FBRXpDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUcsR0FBRyxDQUFFLENBQUE7UUFFcEMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFHLElBQUksQ0FBRSxDQUFBO0lBQ2xDLENBQUMsQ0FBQTtBQUVELElBQU8sTUFBTSxJQUFJLEdBQXdCO1FBRXBDLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztjQUNyQixTQUFTLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFFO2NBQzNCLFNBQVMsQ0FBRyxDQUFDLEdBQUksU0FBUyxDQUFDLENBQUUsQ0FBQTtRQUV6QyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFHLEdBQUcsQ0FBRSxDQUFBO1FBRXBDLElBQUssTUFBTSxDQUFHLEdBQUcsQ0FBRTtZQUNkLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQTtRQUVuQixPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUcsSUFBSSxFQUFFLElBQUksQ0FBRSxDQUFBO0lBQ3hDLENBQUMsQ0FBQTtBQUVELElBQU8sTUFBTSxHQUFHLEdBQWtCO1FBRTdCLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBQTtRQUV2QyxJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztZQUNyQixFQUFFLENBQUMsR0FBRyxDQUFHLEdBQUcsQ0FBRSxDQUFBOztZQUVkLEVBQUUsQ0FBQyxHQUFHLENBQUcsR0FBRyxFQUFFLFNBQVMsQ0FBRyxTQUFTLENBQUUsQ0FBQyxDQUFDLENBQUUsQ0FBRSxDQUFBO0lBQ3JELENBQUMsQ0FBQTtBQUVELElBQU8sTUFBTSxNQUFNLEdBQTBCLFVBQVcsSUFBUyxFQUFFLEdBQUksSUFBUztRQUUzRSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUM7Y0FDaEIsU0FBUyxDQUFHLElBQUksQ0FBRSxDQUFDLENBQUMsQ0FBRTtjQUN0QixTQUFTLENBQUcsQ0FBQyxHQUFJLElBQUksQ0FBQyxDQUFFLENBQUE7UUFFcEMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBRyxHQUFHLENBQUUsQ0FBQTtRQUVwQyxPQUFPLENBQUMsT0FBTyxDQUFHLElBQUksRUFBRSxJQUFJLENBQUUsQ0FBQTtJQUNuQyxDQUFDLENBQUE7SUFHRCxTQUFTLE1BQU0sQ0FBRyxHQUFRO1FBRXJCLE9BQU8sT0FBTyxHQUFHLElBQUksUUFBUSxJQUFJLENBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxHQUFHLENBQUMsQ0FBQTtJQUMzRCxDQUFDO0lBRUQsU0FBUyxTQUFTLENBQUcsR0FBUTtRQUV4QixJQUFLLEtBQUssQ0FBQyxPQUFPLENBQUUsR0FBRyxDQUFDLEVBQ3hCO1lBQ0ssSUFBSyxHQUFHLENBQUUsQ0FBQyxDQUFDLEtBQUssT0FBTztnQkFDbkIsR0FBRyxDQUFDLE9BQU8sQ0FBRyxPQUFPLENBQUUsQ0FBQTtTQUNoQzthQUNJLElBQUssT0FBTyxHQUFHLElBQUksUUFBUSxFQUNoQztZQUNLLElBQUssU0FBUyxJQUFJLEdBQUcsRUFDckI7Z0JBQ0ssSUFBSyxHQUFHLENBQUMsT0FBTyxLQUFLLE9BQU87b0JBQ3ZCLE1BQU0sbUJBQW1CLENBQUE7YUFDbEM7aUJBRUQ7Z0JBQ00sR0FBVyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7YUFDbEM7U0FDTDtRQUVELE9BQU8sR0FBRyxDQUFBO0lBQ2YsQ0FBQzs7VUNsRlksT0FBUSxTQUFRLFNBQW9CO1FBSTVDLE9BQU87WUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUyxFQUNoQztnQkFDSyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUcsS0FBSyxDQUFFLENBQUE7Z0JBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFBO2FBQ2hEO1lBRUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQW1DLENBQUE7U0FDN0Q7S0FDTDs7VUNSWSxTQUE4QyxTQUFRLFNBQWE7UUFpQjNFLFlBQWMsSUFBTztZQUVoQixLQUFLLENBQUcsSUFBSSxDQUFFLENBQUE7WUFqQm5CLGFBQVEsR0FBRyxFQUFnQyxDQUFBO1lBbUJ0QyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtZQUNoQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFBO1lBRTlCLElBQUssUUFBUSxFQUNiO2dCQUNLLEtBQU0sTUFBTSxLQUFLLElBQUksUUFBUSxFQUM3QjtvQkFDSyxJQUFLLENBQUUsT0FBTyxDQUFHLEtBQUssQ0FBRTt3QkFDbkIsSUFBSSxDQUFHLEtBQUssQ0FBRSxDQUFBO2lCQUN2QjthQUNMO1lBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQTtTQUN2RTtRQTNCRCxXQUFXO1lBRU4sT0FBTztnQkFDRixPQUFPLEVBQUUsWUFBWTtnQkFDckIsSUFBSSxFQUFPLFdBQVc7Z0JBQ3RCLEVBQUUsRUFBUyxTQUFTO2dCQUNwQixTQUFTLEVBQUUsSUFBSTthQUNuQixDQUFBO1NBQ0w7UUFxQkQsT0FBTztZQUVGLElBQUssSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTO2dCQUMzQixPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBRTVCLE1BQU0sUUFBUSxHQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUcsQ0FBQTtZQUNsQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO1lBQ2hDLE1BQU0sSUFBSSxHQUFRLElBQUksQ0FBQyxJQUFJLENBQUE7WUFDM0IsTUFBTSxRQUFRLEdBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQTtZQUcvQixJQUFLLElBQUksQ0FBQyxXQUFXO2dCQUNoQixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxVQUFVLENBQUUsQ0FBQTs7Z0JBRXRDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLFVBQVUsQ0FBRSxDQUFBO1lBRTlDLElBQUssSUFBSSxDQUFDLElBQUksSUFBSSxTQUFTO2dCQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQTtZQUUxQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1lBRXRCLElBQUssSUFBSSxDQUFDLFFBQVEsRUFDbEI7Z0JBQ0ssTUFBTSxZQUFZLEdBQUcsRUFBa0IsQ0FBQTtnQkFFdkMsS0FBTSxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxFQUNsQztvQkFDSyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUcsS0FBSyxDQUFFLENBQUE7b0JBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUcsR0FBSSxDQUFDLENBQUMsT0FBTyxFQUFHLENBQUUsQ0FBQTtvQkFDaEMsUUFBUSxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2lCQUM1QjtnQkFFRCxJQUFJLENBQUMsZUFBZSxDQUFHLFlBQVksQ0FBRSxDQUFBO2FBQ3pDO1lBRUQsT0FBTyxRQUFRLENBQUE7U0FDbkI7UUFFRCxlQUFlLENBQUcsVUFBd0I7U0FHekM7UUFFRCxNQUFNLENBQUcsR0FBSSxRQUE0RDtZQUdwRSxJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUztnQkFDM0IsSUFBSSxDQUFDLE9BQU8sRUFBRyxDQUFBO1lBRXBCLE1BQU0sSUFBSSxHQUFRLElBQUksQ0FBQyxJQUFJLENBQUE7WUFDM0IsTUFBTSxRQUFRLEdBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQTtZQUMvQixNQUFNLFNBQVMsR0FBRyxFQUFrQixDQUFBO1lBRXBDLEtBQU0sSUFBSSxDQUFDLElBQUksUUFBUSxFQUN2QjtnQkFDSyxJQUFLLE9BQU8sQ0FBQyxJQUFJLFFBQVEsRUFDekI7b0JBQ0ssQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFFO3dCQUNaLE9BQU8sRUFBRSxZQUFZO3dCQUNyQixJQUFJLEVBQUssU0FBUzt3QkFDbEIsRUFBRSxFQUFJLFNBQVM7d0JBQ2YsT0FBTyxFQUFFLENBQUM7cUJBQ2QsQ0FBQyxDQUFBO2lCQUNOO3FCQUNJLElBQUssQ0FBQyxZQUFZLE9BQU8sRUFDOUI7b0JBQ0ssTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBRyxjQUFjLENBQUUsQ0FBQTtvQkFFbEQsQ0FBQyxHQUFHLENBQUMsQ0FBRSxZQUFZLENBQUMsSUFBSSxTQUFTOzBCQUMxQixDQUFDLENBQUUsWUFBWSxDQUFDOzBCQUNoQixJQUFJLE9BQU8sQ0FBRTs0QkFDVixPQUFPLEVBQUUsWUFBWTs0QkFDckIsSUFBSSxFQUFLLFNBQVM7NEJBQ2xCLEVBQUUsRUFBSSxTQUFTOzRCQUNmLE9BQU8sRUFBRSxDQUFDLENBQUMsU0FBUzt5QkFDeEIsQ0FBQyxDQUFBO2lCQUNYO3FCQUNJLElBQUssRUFBRSxDQUFDLFlBQVksU0FBUyxDQUFDLEVBQ25DO29CQUNLLENBQUMsR0FBRyxPQUFPLENBQUcsQ0FBQyxDQUFFOzBCQUNiLElBQUksQ0FBRyxDQUFDLENBQUU7MEJBQ1YsSUFBSSxDQUFHLENBQUMsQ0FBRSxDQUFBO2lCQUNsQjtnQkFFRCxRQUFRLENBQUcsQ0FBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFjLENBQUE7Z0JBQ3BELElBQUksQ0FBQyxNQUFNLENBQUcsR0FBSyxDQUFlLENBQUMsT0FBTyxFQUFHLENBQUUsQ0FBQTtnQkFDL0MsU0FBUyxDQUFDLElBQUksQ0FBRyxDQUFjLENBQUUsQ0FBQTthQUNyQztZQUVELElBQUssU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUNwQixJQUFJLENBQUMsZUFBZSxDQUFHLFNBQVMsQ0FBRSxDQUFBO1NBQzNDO1FBRUQsTUFBTSxDQUFHLEdBQUksUUFBd0Q7U0FHcEU7UUFFRCxLQUFLO1lBRUEsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUE7WUFFbEIsSUFBSyxJQUFJLENBQUMsU0FBUztnQkFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7U0FDdEM7UUFFRCxjQUFjO1lBRVQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQTtTQUM5QjtRQUVELGNBQWMsQ0FBRyxLQUFnQjtZQUU1QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1lBRXhCLElBQUssS0FBSyxJQUFJLE1BQU0sQ0FBQyxTQUFTO2dCQUN6QixPQUFNO1lBRVgsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtZQUVoQyxJQUFLLElBQUksQ0FBQyxXQUFXO2dCQUNoQixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxVQUFVLENBQUUsQ0FBQTs7Z0JBRXRDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFHLFVBQVUsQ0FBRSxDQUFBO1lBRTlDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUN2QjtZQUFDLElBQUksQ0FBQyxXQUF1QixHQUFHLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQTtTQUNuRTtLQUNMOztVQ3JLWSxLQUFNLFNBQVEsU0FBa0I7UUFBN0M7O1lBRUssY0FBUyxHQUFHLGVBQUssS0FBSyxFQUFDLEtBQUssR0FBTyxDQUFBO1NBc0J2QztRQXBCSSxJQUFJLFdBQVc7WUFFVixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBRyxVQUFVLENBQUU7a0JBQ2hELFlBQVk7a0JBQ1osVUFBVSxDQUFBO1NBQ3JCO1FBRUQsSUFBSSxXQUFXLENBQUcsV0FBd0I7WUFFckMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUE7WUFFMUMsSUFBSSxlQUFlLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBRyxVQUFVLENBQUU7a0JBQ2pDLFlBQVk7a0JBQ1osVUFBVSxDQUFBO1lBRWhDLElBQUssV0FBVyxJQUFJLGVBQWU7Z0JBQzlCLE9BQU07WUFFWCxTQUFTLENBQUMsT0FBTyxDQUFJLFdBQVcsRUFBRSxlQUFlLENBQUUsQ0FBQTtTQUN2RDtLQUNMO0lBR0QsTUFBTSxDQUFHLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFFLENBQUE7O1VDckNkLE1BQU8sU0FBUSxTQUFtQjtRQUUxQyxPQUFPO1lBRUYsSUFBSyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsRUFDaEM7Z0JBQ0ssTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtnQkFFdEIsTUFBTSxJQUFJLEdBQUcsZUFBSyxLQUFLLEVBQUMsUUFBUTtvQkFDekIsSUFBSSxDQUFDLElBQUksR0FBRyxnQkFBTSxLQUFLLEVBQUMsTUFBTSxJQUFHLElBQUksQ0FBQyxJQUFJLENBQVMsR0FBRyxJQUFJO29CQUMxRCxJQUFJLENBQUMsSUFBSSxHQUFHLGdCQUFNLEtBQUssRUFBQyxNQUFNLElBQUcsSUFBSSxDQUFDLElBQUksQ0FBUyxHQUFHLElBQUksQ0FDM0QsQ0FBQTtnQkFFTixJQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxTQUFTO29CQUNqRSxJQUFJLENBQUMsZ0JBQWdCLENBQUcsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxDQUFFLENBQUE7Z0JBRWhFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO2FBQ3pCO1lBRUQsT0FBTyxDQUFFLElBQUksQ0FBQyxTQUFTLENBQW9CLENBQUE7U0FDL0M7UUFFRCxPQUFPO1lBRUYsSUFBSyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRyxLQUFLLElBQUk7Z0JBQ3BELE9BQU07WUFFWCxJQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTztnQkFDakIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQTtTQUNuRDtRQUVTLE9BQU87U0FHaEI7S0FDTDtJQUdELE1BQU0sQ0FBRyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBRSxDQUFBOztJQ0F0QixNQUFNLFFBQVEsR0FBRztRQUNuQixJQUFJLEVBQUUsUUFBb0I7UUFDMUIsRUFBRSxFQUFJLFNBQVM7UUFDZixJQUFJLEVBQUUsU0FBUztLQUNuQixDQUFBO0lBRUQsR0FBRyxDQUFhLENBQUUsUUFBUSxDQUFFLEVBQUUsUUFBUSxDQUFFLENBQUE7O0lDOUJ4QztJQUNBO0lBQ0E7SUFDQTtBQUNBLFVBQWEsU0FBVSxTQUFRLFNBQXNCO1FBQXJEOztZQUVLLGFBQVEsR0FBRyxFQUFnQyxDQUFBO1NBOEMvQztRQTFDSSxPQUFPO1lBRUYsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFBO1lBRWpDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUE7WUFDdEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQTtZQUVoQyxJQUFLLElBQUksQ0FBQyxXQUFXLEVBQ3JCO2dCQUNLLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFHLFNBQVMsRUFBRTtvQkFDbkMsT0FBTyxFQUFLLENBQUUsU0FBUyxDQUFFO29CQUN6QixRQUFRLEVBQUksQ0FBQyxDQUFDO29CQUNkLFFBQVEsRUFBSSxDQUFDO29CQUNiLFFBQVEsRUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksR0FBRyxLQUFLLEdBQUUsTUFBTTtvQkFDNUUsS0FBSyxFQUFPLElBQUk7b0JBQ2hCLFVBQVUsRUFBRSxJQUFJO2lCQUNwQixDQUFDLENBQUE7Z0JBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUcsQ0FBQTthQUM5QjtZQUVELE9BQU8sUUFBUSxDQUFBO1NBQ25CO1FBRUQsSUFBSSxDQUFHLEVBQVUsRUFBRSxHQUFJLE9BQTREO1lBRTlFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUUsRUFBRSxDQUFDLENBQUE7WUFFaEMsSUFBSyxLQUFLLElBQUksU0FBUztnQkFDbEIsT0FBTTtZQUVYLElBQUssSUFBSSxDQUFDLE9BQU87Z0JBQ1osSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7WUFFekIsSUFBSyxPQUFPLEVBQ1o7Z0JBQ0ssS0FBSyxDQUFDLEtBQUssRUFBRyxDQUFBO2dCQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUcsT0FBTyxDQUFFLENBQUE7Z0JBQ3ZCLEtBQUssQ0FBQyxNQUFNLENBQUcsR0FBSSxPQUFPLENBQUUsQ0FBQTthQUNoQztZQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7U0FDM0M7S0FDTDtJQUVELE1BQU0sQ0FBRyxTQUFTLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBRSxDQUFBO0lBQ25DLE1BQU0sQ0FBRyxTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBTSxDQUFBOztVQzFEdEIsUUFBMEMsU0FBUSxTQUFhO1FBSXZFLE9BQU87WUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUztnQkFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUU1QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLGVBQUssS0FBSyxFQUFDLGlCQUFpQixHQUFPLENBQUE7WUFFNUQsS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFBO1lBRWhCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7WUFFaEMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxJQUFJLENBQUUsQ0FBQTtZQUN6QixTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxXQUFXLENBQUUsQ0FBQTtZQUV2QyxJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBRyxJQUFJLEVBQUU7Z0JBQy9CLE9BQU8sRUFBSyxDQUFFLFNBQVMsQ0FBRTtnQkFDekIsT0FBTyxFQUFJLENBQUM7Z0JBQ1osT0FBTyxFQUFJLENBQUM7Z0JBQ1osUUFBUSxFQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxHQUFFLE1BQU07Z0JBQzVDLFNBQVMsRUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVM7Z0JBQy9CLElBQUksRUFBTyxJQUFJO2FBRW5CLENBQUMsQ0FBQTtZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFHLENBQUE7WUFFMUIsTUFBTSxDQUFDLGdCQUFnQixDQUFHLGtCQUFrQixFQUFFO2dCQUV6QyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBRTtvQkFDeEIsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRztpQkFDL0IsQ0FBQyxDQUFBO2FBQ04sQ0FBQyxDQUFBO1lBRUYsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtTQUMzQjtRQUVELGVBQWUsQ0FBRyxRQUFzQjtZQUVuQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBRTtnQkFDeEIsT0FBTyxFQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRztnQkFDN0IsUUFBUSxFQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxHQUFFLE1BQU07Z0JBQzNDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVM7YUFDbEMsQ0FBQyxDQUFBO1NBQ047UUFFTyxTQUFTO1lBRVosTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQTtZQUVyQixPQUFPLFFBQVEsQ0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLEdBQUcsT0FBTyxDQUFFLENBQUE7U0FDbkU7UUFFRCxLQUFLLENBQUcsTUFBcUIsRUFBRSxJQUFpQjs7Ozs7U0FNL0M7S0FDTDs7SUMvQ0Q7Ozs7Ozs7O0FBUUEsVUFBYSxPQUFRLFNBQVEsUUFBbUI7UUFLM0MsYUFBYTtZQUVSLHVDQUNTLEtBQUssQ0FBQyxXQUFXLEVBQUcsS0FDeEIsSUFBSSxFQUFPLFNBQVMsRUFDcEIsS0FBSyxFQUFNLFdBQVcsRUFDdEIsU0FBUyxFQUFFLElBQUk7O2dCQUVmLE9BQU8sRUFBRSxFQUFFLElBQ2Y7U0FDTDtRQUVELE9BQU87WUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUztnQkFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtZQUU1QixLQUFLLENBQUMsT0FBTyxFQUFHLENBQUE7WUFFaEIsSUFBSyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU87Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUcsR0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFBO1lBRTFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7U0FDM0I7S0FDTDtJQUVELE1BQU0sQ0FBRyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBRSxDQUFBOztJQ25EL0IsU0FBUyxnQkFBZ0IsQ0FBRyxPQUF3QjtRQUUvQyxXQUFXLEVBQUcsQ0FBQTtRQUVkLE9BQU87WUFDRixRQUFRO1lBQ1IsV0FBVztTQUNmLENBQUE7UUFFRCxTQUFTLFFBQVE7WUFFWixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUk7a0JBQ3RELE9BQU8sR0FBRyxPQUFPLENBQUE7WUFFN0IsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTztnQkFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsR0FBRyxDQUFBO1NBQ2xDO1FBRUQsU0FBUyxXQUFXO1lBRWYsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJO2tCQUN0RCxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBRTdCLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87Z0JBQzNCLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQTtTQUNyQztJQUNOLENBQUM7QUFFRCxhQUFnQixTQUFTLENBQUcsT0FBd0I7UUFFL0MsSUFBSyxjQUFjLElBQUksTUFBTTtZQUN4QixPQUFPLGdCQUFnQixDQUFHLE9BQU8sQ0FBRSxDQUFBO1FBRXhDLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBRTtZQUNuQixPQUFPLEVBQVMsT0FBTyxDQUFDLE9BQU87WUFDL0IsY0FBYyxFQUFFLEdBQUc7WUFDbkIsV0FBVztZQUNYLE1BQU0sRUFBTyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUk7a0JBQ3RELGNBQWM7a0JBQ2QsZ0JBQWdCO1lBQzdCLFVBQVUsRUFBRSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUk7a0JBQ3RELGtCQUFrQjtrQkFDbEIsb0JBQW9CO1NBQ3BDLENBQUMsQ0FBQTtRQUVGLE9BQU87WUFDRixRQUFRLEVBQUUsUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFHLENBQUEsRUFBRTtTQUN4QyxDQUFBO1FBRUQsU0FBUyxXQUFXO1lBRWYsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTztnQkFDM0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFBO1NBQ3pDO1FBQ0QsU0FBUyxjQUFjLENBQUcsS0FBZ0I7WUFFckMsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsT0FBTztnQkFDM0IsQ0FBQyxDQUFDLFFBQVEsQ0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFBO1NBQ3hDO1FBQ0QsU0FBUyxnQkFBZ0IsQ0FBRyxLQUFnQjtZQUV2QyxLQUFNLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPO2dCQUMzQixDQUFDLENBQUMsUUFBUSxDQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFFLENBQUE7U0FDeEM7UUFDRCxTQUFTLGtCQUFrQixDQUFHLEtBQWdCO1lBRXpDLEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sRUFDaEM7Z0JBQ0ssQ0FBQyxDQUFDLFFBQVEsQ0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFBOzs7YUFHbkM7WUFDRCxPQUFPLElBQUksQ0FBQTtTQUNmO1FBQ0QsU0FBUyxvQkFBb0IsQ0FBRyxLQUFnQjtZQUUzQyxLQUFNLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQ2hDO2dCQUNLLENBQUMsQ0FBQyxRQUFRLENBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUUsQ0FBQTs7O2FBR25DO1lBQ0QsT0FBTyxJQUFJLENBQUE7U0FDZjtJQUNOLENBQUM7O0lDbEZELE1BQU0sVUFBVSxHQUFHO1FBQ2QsRUFBRSxFQUFHLE1BQU07UUFDWCxFQUFFLEVBQUcsT0FBTztRQUNaLEVBQUUsRUFBRyxLQUFLO1FBQ1YsRUFBRSxFQUFHLFFBQVE7S0FDakIsQ0FBQTtJQUVEOzs7Ozs7Ozs7Ozs7QUFZQSxVQUFhLEtBQW9DLFNBQVEsU0FBYTs7UUFVakUsV0FBVztZQUVOLHVDQUNTLEtBQUssQ0FBQyxXQUFXLEVBQUcsS0FDeEIsSUFBSSxFQUFXLE9BQU8sRUFDdEIsUUFBUSxFQUFPLEVBQUUsRUFDakIsU0FBUyxFQUFNLElBQUksSUFFdkI7U0FDTDtRQUVELE9BQU87WUFFRixJQUFLLElBQUksQ0FBQyxTQUFTLElBQUksU0FBUyxFQUNoQztnQkFDSyxNQUFNLE1BQU0sR0FBTSxlQUFLLEtBQUssRUFBQyxjQUFjLEdBQUcsQ0FBQTtnQkFDOUMsTUFBTSxPQUFPLEdBQUssZUFBSyxLQUFLLEVBQUMsZUFBZSxHQUFHLENBQUE7Z0JBQy9DLE1BQU0sU0FBUyxHQUFHLGVBQUssS0FBSyxFQUFDLGFBQWE7b0JBQ25DLE1BQU07b0JBQ04sT0FBTyxDQUNSLENBQUE7Z0JBRU4sTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTs7Ozs7Ozs7O2dCQVl0QixJQUFLLElBQUksQ0FBQyxNQUFNLEVBQ2hCO29CQUNLLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFHLElBQUksQ0FBQyxNQUFNLENBQUU7MEJBQ3ZCLElBQUksQ0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFOzBCQUNwQixJQUFJLENBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFBO29CQUVsQyxNQUFNLENBQUMsTUFBTSxDQUFHLEdBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUcsQ0FBRSxDQUFBO2lCQUNoRDtnQkFFRCxJQUFLLElBQUksQ0FBQyxRQUFRLEVBQ2xCOztvQkFFSyxLQUFNLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQ2xDO3dCQUNLLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFHLEtBQUssQ0FBRTs4QkFDakIsSUFBSSxDQUFHLEtBQUssQ0FBRTs4QkFDZCxJQUFJLENBQUcsS0FBSyxDQUFFLENBQUE7d0JBRTdCLE9BQU8sQ0FBQyxNQUFNLENBQUcsR0FBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRyxDQUFFLENBQUE7cUJBQ2xEO2lCQUNMO2dCQUVELElBQUksQ0FBQyxTQUFTLEdBQUksU0FBUyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Z0JBa0IzQixTQUFTLENBQUU7b0JBQ04sT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDO29CQUNsQixTQUFTLEVBQUUsSUFBSTtpQkFDbkIsQ0FBQztxQkFDRCxRQUFRLEVBQUcsQ0FBQTtnQkFFWixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtnQkFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7Z0JBRXZCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxVQUFVLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFFLENBQUE7YUFDaEU7WUFFRCxPQUFPLENBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBb0IsQ0FBQTtTQUMvQzs7Ozs7Ozs7Ozs7OztRQWlCRCxjQUFjLENBQUcsS0FBZ0I7WUFFNUIsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQTtZQUVyQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsVUFBVSxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBRSxDQUFBO1lBQy9ELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxVQUFVLENBQUUsS0FBSyxDQUFDLENBQUUsQ0FBQTtZQUVuRCxLQUFLLENBQUMsY0FBYyxDQUFHLEtBQUssQ0FBRSxDQUFBOztZQUk5QixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQTtTQUMxQjtLQWdETDtJQUVELE1BQU0sQ0FBRyxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBRSxDQUFBOztVQ3hNZCxRQUFTLFNBQVEsS0FBaUI7UUFLMUMsT0FBTztZQUVGLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUcsQ0FBQTtZQUVqQyxNQUFNLElBQUksR0FBUSxJQUFJLENBQUMsSUFBSSxDQUFBO1lBQzNCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7WUFDaEMsTUFBTSxNQUFNLEdBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQTtZQUM5QixNQUFNLE9BQU8sR0FBSyxJQUFJLENBQUMsUUFBUSxDQUFBO1lBRS9CLFNBQVMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFHLE9BQU8sRUFBVSxXQUFXLENBQUUsQ0FBQTtZQUM1RCxNQUFNLENBQUksU0FBUyxDQUFDLE9BQU8sQ0FBRyxjQUFjLEVBQUcsa0JBQWtCLENBQUUsQ0FBQTtZQUNuRSxPQUFPLENBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBRyxlQUFlLEVBQUUsbUJBQW1CLENBQUUsQ0FBQTtZQUVwRSxJQUFLLElBQUksQ0FBQyxhQUFhLEVBQ3ZCO2dCQUNLLE1BQU0sR0FBRyxHQUFHLGdCQUFNLEtBQUssRUFBQyx1QkFBdUI7b0JBQzFDLGdCQUFNLEtBQUssRUFBQyxNQUFNLGFBQVMsQ0FDekIsQ0FBQTtnQkFFUCxJQUFJLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQTs7Z0JBRXRCLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBRyxZQUFZLEVBQUUsR0FBRyxDQUFFLENBQUE7YUFDdEQ7WUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUMxQyxTQUFTLEVBQU0sSUFBSSxDQUFDLFNBQVM7Z0JBQzdCLElBQUksRUFBVyxFQUFFO2dCQUNqQixPQUFPLEVBQVEsS0FBSyxDQUFDLEVBQUUsQ0FBRyxJQUFJLENBQUMsV0FBVyxDQUFFO2dCQUM1QyxXQUFXLEVBQUk7b0JBQ1YsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsUUFBUSxDQUFFLENBQUE7aUJBQ3pDO2dCQUNELGFBQWEsRUFBRTtvQkFDVixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRyxRQUFRLENBQUUsQ0FBQTtpQkFDdEM7YUFDTCxDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRyxDQUFBO1lBRTNCLE9BQU8sUUFBUSxDQUFBO1NBQ25CO1FBRUQsTUFBTTtZQUVELE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUcsQ0FBQTtTQUNwQztRQUVELE9BQU87WUFFRixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFHLENBQUE7U0FDckM7UUFFRCxJQUFJO1NBR0g7UUFFRCxLQUFLO1lBRUEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUcsQ0FBQTtZQUV4QixPQUFPLElBQUksQ0FBQTtTQUNmO0tBV0w7SUFFRCxNQUFNLENBQUcsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUUsQ0FBQTs7YUN6RGxCLGNBQWMsQ0FBRyxJQUFnQixFQUFFLEdBQVE7UUFFdEQsUUFBUyxJQUFJO1lBRWIsS0FBSyxRQUFVLEVBQUUsT0FBTyxVQUFVLENBQUMsTUFBTSxDQUFLLEdBQUcsQ0FBRSxDQUFBO1lBQ25ELEtBQUssVUFBVSxFQUFFLE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBRyxHQUFHLENBQUUsQ0FBQTtZQUNuRCxLQUFLLFFBQVUsRUFBRSxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUssR0FBRyxDQUFFLENBQUE7WUFDbkQsS0FBSyxVQUFVLEVBQUUsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFHLEdBQUcsQ0FBRSxDQUFBO1lBQ25ELEtBQUssU0FBVSxFQUFFLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBSSxHQUFHLENBQUUsQ0FBQTtZQUNuRCxLQUFLLFFBQVUsRUFBRSxPQUFPLFVBQVUsQ0FBQyxNQUFNLENBQUssR0FBRyxDQUFFLENBQUE7WUFDbkQsS0FBSyxNQUFVLEVBQUUsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFPLEdBQUcsQ0FBRSxDQUFBO1lBQ25ELEtBQUssU0FBVSxFQUFFLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBSSxHQUFHLENBQUUsQ0FBQTtZQUNuRCxLQUFLLE1BQVUsRUFBRSxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQU8sR0FBRyxDQUFFLENBQUE7U0FDbEQ7SUFDTixDQUFDO0lBRUQsTUFBTSxVQUFVOzs7Ozs7UUFRWCxPQUFPLE1BQU0sQ0FBRyxHQUFxQjtZQUVoQyxNQUFNLElBQUksR0FBRyxrQkFDUixFQUFFLEVBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQ2pCLEVBQUUsRUFBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFDakIsQ0FBQyxFQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUN0QixDQUFBO1lBRUYsT0FBTyxJQUFJLENBQUE7U0FDZjtRQUVELE9BQU8sUUFBUSxDQUFHLEdBQXFCO1NBRXRDO1FBR0QsT0FBTyxNQUFNLENBQUcsR0FBcUI7U0FFcEM7UUFFRCxPQUFPLFFBQVEsQ0FBRyxHQUFxQjtTQUV0QztRQUVELE9BQU8sT0FBTyxDQUFHLEdBQXFCO1NBRXJDO1FBR0QsT0FBTyxJQUFJLENBQUcsR0FBbUI7U0FFaEM7UUFFRCxPQUFPLE9BQU8sQ0FBRyxHQUFtQjtTQUVuQztRQUdELE9BQU8sSUFBSSxDQUFHLEdBQW1CO1NBRWhDO0tBQ0w7O0lDbkdELE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQTtBQWlCbEIsVUFBYSxVQUFXLFNBQVEsU0FBdUI7UUFBdkQ7O1lBS2MsY0FBUyxHQUE4QjtnQkFDM0MsUUFBUSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDO2FBQy9DLENBQUE7U0E0SEw7UUExSEksT0FBTztZQUVGLElBQUksQ0FBQyxNQUFNLEVBQUcsQ0FBQTtZQUVkLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBZ0IsQ0FBQyxDQUFBO1NBQ2xDO1FBRUQsR0FBRyxDQUFHLEdBQUksT0FBbUI7WUFFeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFHLEdBQUksT0FBYyxDQUFFLENBQUE7WUFFN0MsSUFBSSxDQUFDLE1BQU0sRUFBRyxDQUFBO1NBQ2xCO1FBRUQsTUFBTTtZQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFckIsTUFBTSxHQUFHLEdBQWlCO2dCQUNyQixLQUFLLEVBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO2dCQUM1QixDQUFDLEVBQVEsRUFBRTtnQkFDWCxPQUFPLEVBQUUsQ0FBQztnQkFDVixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDO2FBQ2hDLENBQUE7WUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxxQkFBcUIsQ0FBRyxHQUFHLENBQUUsQ0FBQTtZQUNqRCxJQUFJLENBQUMsU0FBUyxHQUFJLElBQUksQ0FBQyxLQUFLLENBQUcsUUFBUSxDQUFFLENBQUE7U0FDN0M7UUFFTyxZQUFZOzs7O1NBS25CO1FBRUQsSUFBSSxDQUFHLENBQVMsRUFBRSxDQUFTO1lBRXRCLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7WUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBO1lBRXhDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUE7WUFDbEMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxJQUFJLElBQUksQ0FBQTtZQUNsQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxPQUFPLENBQUUsQ0FBQTtZQUM5QixNQUFNLENBQUMsZ0JBQWdCLENBQUcsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBRSxDQUFBO1NBQ3hFO1FBRUQsSUFBSTtZQUVDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUMsQ0FBQTtZQUN0QyxRQUFRLENBQUMsbUJBQW1CLENBQUcsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQTtTQUMzRDtRQUVELEtBQUssQ0FBRyxLQUFhO1lBRWhCLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFakQsTUFBTSxHQUFHLEdBQ0osZUFDSyxLQUFLLEVBQUksbUJBQW1CLEVBQzVCLEtBQUssRUFBTSxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksRUFDM0IsTUFBTSxFQUFLLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUM1QixPQUFPLEVBQUksT0FBUSxHQUFHLENBQUMsS0FBTSxJQUFLLEdBQUcsQ0FBQyxNQUFPLEVBQUUsR0FDakMsQ0FBQTtZQUV4QixNQUFNLE9BQU8sR0FBRyxLQUFLLElBQUksU0FBUztrQkFDakIsU0FBUyxDQUFFLEtBQUssQ0FBQyxDQUFHLEdBQUcsQ0FBRTtrQkFDekIsSUFBSSxDQUFDLGdCQUFnQixDQUFHLEdBQUcsQ0FBRSxDQUFBO1lBRTlDLEdBQUcsQ0FBQyxNQUFNLENBQUcsR0FBSSxPQUFrQixDQUFFLENBQUE7WUFFckMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUcsQ0FBQyxFQUFFLEVBQzNDO2dCQUNLLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBRTVCLElBQUssT0FBTyxHQUFHLENBQUMsUUFBUSxJQUFJLFVBQVU7b0JBQ2pDLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBRyxXQUFXLEVBQUUsTUFBTSxHQUFHLENBQUMsUUFBUSxFQUFHLENBQUUsQ0FBQTthQUM1RTtZQUVELE9BQU8sR0FBRyxDQUFBO1NBQ2Q7UUFFRCxnQkFBZ0IsQ0FBRyxVQUE0QjtZQUUxQyxNQUFNLE1BQU0sR0FBSSxVQUFVLENBQUMsTUFBTSxDQUFBO1lBQ2pDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUE7WUFDbEMsTUFBTSxPQUFPLEdBQUcsRUFBbUIsQ0FBQTtZQUVuQyxLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFDdkM7Z0JBQ0ssTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUN0QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFFakMsTUFBTSxLQUFLLEdBQUcsYUFBRyxLQUFLLEVBQUMsUUFBUSxHQUFHLENBQUE7Z0JBRWxDLE1BQU0sTUFBTSxHQUFHQyxjQUFrQixDQUFHLFFBQVEsRUFBRTtvQkFDekMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sR0FBRyxDQUFDO29CQUNwQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ1IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUNaLENBQUMsQ0FBQTtnQkFFRixNQUFNLElBQUksR0FBRyxnQkFDUixDQUFDLEVBQUssR0FBRyxDQUFDLENBQUMsRUFDWCxDQUFDLEVBQUssR0FBRyxDQUFDLENBQUMsZUFDRCxJQUFJLEVBQ2QsSUFBSSxFQUFDLE9BQU8sRUFDWixLQUFLLEVBQUMsc0ZBQXNGLEdBQy9GLENBQUE7Z0JBRUYsSUFBSyxHQUFHLENBQUMsVUFBVSxJQUFJLFNBQVM7b0JBQzNCLElBQUksQ0FBQyxZQUFZLENBQUcsYUFBYSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUUsQ0FBQTtnQkFFeEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFBO2dCQUV6QixLQUFLLENBQUMsTUFBTSxDQUFHLE1BQU0sQ0FBRSxDQUFBO2dCQUN2QixLQUFLLENBQUMsTUFBTSxDQUFHLElBQUksQ0FBRSxDQUFBO2dCQUVyQixPQUFPLENBQUMsSUFBSSxDQUFHLEtBQW1CLENBQUUsQ0FBQTthQUN4QztZQUVELE9BQU8sT0FBTyxDQUFBO1NBQ2xCO0tBQ0w7O1VDNUlZLGFBQWMsU0FBUSxTQUF5QjtRQUV2RCxPQUFPLENBQUcsTUFBZTtZQUVwQixNQUFNLElBQUksR0FBRyxlQUFLLEtBQUssRUFBQyx1QkFBdUI7Z0JBQzFDLGVBQUssR0FBRyxFQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUcsR0FBRyxFQUFDLFFBQVEsR0FBRTtnQkFDekMsZUFBSyxLQUFLLEVBQUMsY0FBYztvQkFDcEI7d0JBQ0ssaUJBQUssTUFBTSxDQUFDLFNBQVMsQ0FBTSxDQUMzQjtvQkFDTDt3QkFDSyxpQkFBSyxNQUFNLENBQUMsU0FBUyxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQU0sQ0FDMUMsQ0FDUCxDQUNMLENBQUE7WUFHTixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7WUFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFFLENBQUE7U0FDbEM7S0FDTDtJQUVELE1BQU0sQ0FBRyxhQUFhLEVBQUU7UUFDbkIsT0FBTyxFQUFFLFlBQVk7UUFDckIsSUFBSSxFQUFLLGVBQWU7UUFDeEIsRUFBRSxFQUFPLFNBQVM7S0FDdEIsQ0FBQyxDQUFBOztJQ3ZDRjtBQUVBLElBR0EsTUFBTUMsU0FBTyxHQUFHLGNBQWMsQ0FBQTtJQUM5QixNQUFNLElBQUksR0FBRyxJQUFJLFFBQVEsRUFBRyxDQUFBO0lBSTVCLFNBQVNDLFdBQVMsQ0FBRyxJQUFTO1FBRXpCLElBQUssU0FBUyxJQUFJLElBQUksRUFDdEI7WUFDSyxJQUFLLElBQUksQ0FBQyxPQUFPLEtBQUtELFNBQU87Z0JBQ3hCLE1BQU0sbUJBQW1CLENBQUE7U0FDbEM7YUFFRDtZQUNNLElBQXlCLENBQUMsT0FBTyxHQUFHQSxTQUFPLENBQUE7U0FDaEQ7UUFFRCxPQUFPLElBQWEsQ0FBQTtJQUN6QixDQUFDO0FBTUQsYUFBZ0IsT0FBTztRQUVsQixJQUFLLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztZQUNyQixPQUFNO1FBRVgsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7WUFDckIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFHQyxXQUFTLENBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFFLENBQUUsQ0FBQTs7WUFFL0MsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFHRCxTQUFPLEVBQUUsR0FBSSxTQUFTLENBQUUsQ0FBQTtJQUNwRCxDQUFDO0FBRUQsYUFBZ0IsT0FBTyxDQUFzQixJQUFhO1FBRXJELElBQUksQ0FBQyxHQUFHLENBQUdDLFdBQVMsQ0FBRyxJQUFJLENBQUUsQ0FBRSxDQUFBO0lBQ3BDLENBQUM7O1VDL0JZLFdBQVksU0FBUSxTQUF3QjtRQUVwRCxPQUFPLENBQUcsS0FBYTtZQUVsQixNQUFNLE1BQU0sR0FBRyxlQUFLLEtBQUssRUFBQyxRQUFRLEdBQU8sQ0FBQTtZQUV6QyxLQUFNLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQy9CO2dCQUNLLE1BQU0sTUFBTSxHQUFHQyxPQUFVLENBQWEsSUFBSSxDQUFFLENBQUE7Z0JBRTVDLE1BQU0sSUFBSSxHQUFHLGVBQUssS0FBSyxFQUFDLHVCQUF1QjtvQkFDMUMsZUFBSyxHQUFHLEVBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRyxHQUFHLEVBQUMsUUFBUSxHQUFFO29CQUN6QyxlQUFLLEtBQUssRUFBQyxjQUFjO3dCQUNwQjs0QkFDSyxpQkFBSyxNQUFNLENBQUMsU0FBUyxDQUFNLENBQzNCO3dCQUNMOzRCQUNLLGlCQUFLLE1BQU0sQ0FBQyxTQUFTLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBTSxDQUMxQyxDQUNQLENBQ0wsQ0FBQTtnQkFFTixNQUFNLENBQUMsTUFBTSxDQUFHLElBQUksQ0FBRSxDQUFBO2FBQzFCO1lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFHLFdBQVcsQ0FBRSxDQUFBO1lBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQTtZQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxrQkFBTSxLQUFLLENBQUMsRUFBRSxDQUFPLENBQUUsQ0FBQTtZQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxpQkFBSyxLQUFLLENBQUMsV0FBVyxDQUFNLENBQUUsQ0FBQTtZQUN0RCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBRyxNQUFNLENBQUUsQ0FBQTs7WUFHaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUcsbUJBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBRyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBRSxDQUFRLENBQUUsQ0FBQTtTQUM5RTtLQUNMO0lBRUQsTUFBTSxDQUFHLFdBQVcsRUFBRTtRQUNqQixPQUFPLEVBQUUsWUFBWTtRQUNyQixJQUFJLEVBQUssY0FBYztRQUN2QixFQUFFLEVBQU8sU0FBUztLQUN0QixDQUFDLENBQUE7O0lDbkRGO0lBY0EsTUFBTSxtQkFBbUIsR0FBMEI7UUFDOUMsSUFBSSxFQUFLLENBQUM7UUFDVixHQUFHLEVBQU0sQ0FBQztRQUNWLE9BQU8sRUFBRSxRQUFRO1FBQ2pCLE9BQU8sRUFBRSxRQUFRO0tBQ3JCLENBQUE7QUFFRCxJQUFPLE1BQU1DLFNBQU8sR0FDcEI7UUFDSyxLQUFLLENBQUcsR0FBYyxFQUFFLElBQVksRUFBRSxHQUEwQjtZQUUzRCxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBRyxTQUFTLGdEQUUxQixtQkFBbUIsR0FDbkIsR0FBRyxLQUNQLEtBQUssRUFBRSxJQUFJLEVBQ1gsTUFBTSxFQUFFLElBQUksSUFDZixDQUFBO1NBQ047Ozs7OztRQVFELE1BQU0sQ0FBRyxHQUFjLEVBQUUsSUFBWSxFQUFFLEdBQTBCO1lBRzVELE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSwrQ0FFZixtQkFBbUIsR0FDbkIsR0FBRyxLQUNQLE1BQU0sRUFBRSxJQUFJLEdBQUcsQ0FBQyxJQUNuQixDQUFBO1NBQ047UUFFRCxRQUFRLENBQUcsR0FBYyxFQUFFLElBQVksRUFBRSxHQUE0QjtZQUVoRSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUE7WUFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFBO1lBQ2pCLE1BQU0sQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFBO1lBRTFCLEtBQU0sTUFBTSxDQUFDLElBQUk7Z0JBQ1osQ0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFO2dCQUNSLENBQUUsa0JBQWtCLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBRTtnQkFDM0MsQ0FBRSxDQUFDLGtCQUFrQixFQUFFLENBQUMsa0JBQWtCLENBQUU7YUFDaEQ7Z0JBQUUsTUFBTSxDQUFDLElBQUksQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUU3QyxPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBRyxNQUFNLGdEQUN6QixtQkFBbUIsR0FDbkIsR0FBRyxLQUNQLEtBQUssRUFBRSxHQUFHLElBQ2IsQ0FBQTtTQUNOO1FBR0QsTUFBTSxDQUFHLEdBQWMsRUFBRSxJQUFZLEVBQUUsR0FBd0I7WUFFMUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFBO1lBQ2pCLE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSwrQ0FFYixtQkFBbUIsR0FDbkIsR0FBRyxLQUNQLEtBQUssRUFBRyxJQUFJLEdBQUcsS0FBSyxFQUNwQixNQUFNLEVBQUUsSUFBSSxHQUFHLEtBQUssSUFDdkIsQ0FBQTtTQUNOO1FBRUQsUUFBUSxDQUFHLEdBQWMsRUFBRSxJQUFZLEVBQUUsR0FBMEI7WUFFOUQsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFBO1lBQ2pCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQTtZQUNqQixNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtZQUUxQixLQUFNLE1BQU0sQ0FBQyxJQUFJO2dCQUNaLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRTtnQkFDUixDQUFFLGtCQUFrQixFQUFFLG1CQUFtQixDQUFFO2dCQUMzQyxDQUFFLGtCQUFrQixFQUFFLENBQUMsa0JBQWtCLENBQUU7Z0JBQzNDLENBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLGtCQUFrQixDQUFFO2dCQUMzQyxDQUFFLENBQUMsa0JBQWtCLEVBQUUsbUJBQW1CLENBQUU7YUFDaEQ7Z0JBQUUsTUFBTSxDQUFDLElBQUksQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUU3QyxPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBRyxNQUFNLGdEQUN6QixtQkFBbUIsR0FDbkIsR0FBRyxLQUNQLEtBQUssRUFBRSxHQUFHLElBQ2IsQ0FBQTtTQUNOO1FBRUQsT0FBTyxDQUFHLEdBQWMsRUFBRSxJQUFZLEVBQUUsR0FBMEI7WUFFN0QsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFBO1lBQ2pCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQTtZQUNqQixNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtZQUUxQixLQUFNLE1BQU0sQ0FBQyxJQUFJO2dCQUNaLENBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBRTtnQkFDUixDQUFFLGtCQUFrQixFQUFFLGtCQUFrQixDQUFFO2dCQUMxQyxDQUFFLGtCQUFrQixFQUFFLENBQUMsa0JBQWtCLENBQUU7Z0JBQzNDLENBQUUsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUU7Z0JBQzlCLENBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLGtCQUFrQixDQUFFO2dCQUM1QyxDQUFFLENBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUU7YUFDL0M7Z0JBQUUsTUFBTSxDQUFDLElBQUksQ0FBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUU3QyxPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBRyxNQUFNLGdEQUN6QixtQkFBbUIsR0FDbkIsR0FBRyxLQUNQLEtBQUssRUFBRSxFQUFFLElBQ1osQ0FBQTtTQUNOO1FBR0QsSUFBSSxDQUFHLEdBQW1CLEVBQUUsSUFBWSxFQUFFLEdBQXVCO1lBRTVELE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFHLEtBQUssZ0RBQ3JCLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsUUFBUSxFQUFFLElBQUksSUFDakIsQ0FBQTtTQUNOO1FBRUQsT0FBTyxDQUFHLEdBQW1CLEVBQUUsSUFBWSxFQUFFLEdBQXVCO1lBRS9ELE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFHLEtBQUssZ0RBQ3hCLG1CQUFtQixHQUNuQixHQUFHLEtBQ1AsUUFBUSxFQUFFLElBQUksSUFDakIsQ0FBQTtTQUNOO1FBR0QsSUFBSSxDQUFHLEdBQW1CLEVBQUUsSUFBWSxFQUFFLEdBQTBCO1lBRS9ELE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFHLEdBQUcsQ0FBQyxJQUFJLGdEQUV4QixtQkFBbUIsR0FDbkIsR0FBRyxLQUNQLE1BQU0sRUFBRSxJQUFJLEdBQUcsR0FBRyxFQUNsQixNQUFNLEVBQUUsSUFBSSxHQUFHLEdBQUcsSUFDckIsQ0FBQTtTQUNOO0tBQ0wsQ0FBQTs7SUM1SkQ7QUFHQSxVQWtCYUMsVUFBUTtRQUtoQixZQUF1QixLQUFZO1lBQVosVUFBSyxHQUFMLEtBQUssQ0FBTztZQUU5QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7WUFDMUIsSUFBSSxDQUFDLFdBQVcsRUFBRyxDQUFBO1NBQ3ZCO1FBRUQsTUFBTSxDQUFHLE9BQTRCO1lBRWhDLE1BQU0sQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQTtZQUV0QyxJQUFLLE9BQU8sSUFBSSxPQUFPLEVBQ3ZCO2dCQUNLLElBQUksQ0FBQyxXQUFXLEVBQUcsQ0FBQTthQUN2QjtpQkFDSSxJQUFLLGlCQUFpQixJQUFJLE9BQU8sSUFBSSxrQkFBa0IsSUFBSSxPQUFPLEVBQ3ZFO2dCQUNLLElBQUksQ0FBQyxxQkFBcUIsRUFBRyxDQUFBO2FBQ2pDO1NBQ0w7UUFFRCxjQUFjO1lBRVQsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBRTlCO1lBQUMsTUFBd0IsQ0FBQyxHQUFHLENBQUU7Z0JBQzNCLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDZCxHQUFHLEVBQUcsTUFBTSxDQUFDLENBQUM7YUFDbEIsQ0FBQztpQkFDRCxTQUFTLEVBQUcsQ0FBQTtTQUNqQjtRQUVELFVBQVU7WUFFTCxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFdEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRyxDQUFBO1lBRWpDLElBQUssTUFBTSxDQUFDLEtBQUssSUFBSSxRQUFRLEVBQzdCO2dCQUNNLE1BQXdCLENBQUMsR0FBRyxDQUFFO29CQUMxQixNQUFNLEVBQUUsSUFBSSxHQUFHLENBQUM7aUJBQ3BCLENBQUMsQ0FBQTthQUNOO2lCQUVEO2dCQUNNLE1BQXdCLENBQUMsR0FBRyxDQUFFO29CQUMxQixLQUFLLEVBQUcsSUFBSTtvQkFDWixNQUFNLEVBQUUsSUFBSTtpQkFDaEIsQ0FBQyxDQUFBO2FBQ047WUFFRCxNQUFNLENBQUMsU0FBUyxFQUFHLENBQUE7U0FDdkI7UUFFRCxXQUFXLENBQUcsS0FBcUI7WUFFOUIsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFOUIsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFBOztnQkFFcEIsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7WUFFekIsSUFBSyxLQUFLLENBQUMsS0FBSyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLFNBQVM7Z0JBQ3BELEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQTtZQUV2QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTTtrQkFDWEQsU0FBTyxDQUFFLE1BQU0sQ0FBQyxLQUFZLENBQUMsQ0FBRyxNQUFNLEVBQUUsS0FBSyxDQUFDLFdBQVcsRUFBRyxFQUFFO29CQUMzRCxJQUFJLEVBQVMsQ0FBQztvQkFDZCxHQUFHLEVBQVUsQ0FBQztvQkFDZCxPQUFPLEVBQU0sUUFBUTtvQkFDckIsT0FBTyxFQUFNLFFBQVE7b0JBQ3JCLElBQUksRUFBUyxNQUFNLENBQUMsZUFBZTtvQkFDbkMsTUFBTSxFQUFPLE1BQU0sQ0FBQyxXQUFXO29CQUMvQixXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7aUJBQ25DLENBQUMsQ0FBQTtZQUVaLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLEdBQUcsQ0FBRSxDQUFBO1lBQ3ZCLEdBQUcsQ0FBQyxVQUFVLEVBQUcsQ0FBQTtZQUVqQixJQUFLLE1BQU0sQ0FBQyxlQUFlLElBQUksU0FBUztnQkFDbkMsSUFBSSxDQUFDLHFCQUFxQixFQUFHLENBQUE7WUFFbEMsSUFBSyxHQUFHLENBQUMsTUFBTSxJQUFJLFNBQVM7Z0JBQ3ZCLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtTQUV2QztRQUVELHFCQUFxQixDQUFHLElBQWE7WUFFaEMsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQTs7Z0JBRWxDLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtZQUV2QyxJQUFLLE9BQU8sSUFBSSxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFHLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBRSxJQUFJLENBQUMsQ0FBRSxDQUFBO1NBQ3BFO1FBRU8sVUFBVSxDQUFHLElBQXNCO1lBRXRDLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFdEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTTtrQkFDdEIsS0FBSyxDQUFDLFdBQVcsRUFBRyxHQUFHLElBQUksQ0FBQyxLQUFLO2tCQUNqQyxLQUFLLENBQUMsV0FBVyxFQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FFbEQ7WUFBQyxJQUFJLENBQUMsTUFBYyxDQUFDLEdBQUcsQ0FBRTtnQkFDdEIsSUFBSSxFQUFFLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBRTtvQkFDckIsTUFBTSxFQUFFLElBQUk7b0JBQ1osTUFBTSxFQUFFLFdBQVc7b0JBQ25CLGdCQUFnQixFQUFFO3dCQUNiLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDWixNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7cUJBQ2hCO2lCQUNMLENBQUM7YUFDTixDQUFDO2lCQUNELFNBQVMsRUFBRyxDQUFBO1lBRWIsSUFBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07Z0JBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRyxDQUFBO1NBQ3hDO0tBQ0w7O0lDckpEO0FBQ0EsVUE0QmEsS0FBSztRQXFDYixZQUFjLElBQU87WUFMckIsVUFBSyxHQUFHLFNBQXlCLENBQUE7O1lBUTVCLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFBO1lBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFBO1lBQ3ZCLElBQUksQ0FBQyxNQUFNLG1DQUNGLElBQUksQ0FBQyxhQUFhLEVBQUcsR0FDckIsSUFBSSxDQUNaLENBQUE7Ozs7O1lBT0QsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQTtZQUV2QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBRyxFQUFFLEVBQ2hEO2dCQUNLLEtBQUssRUFBUSxJQUFJLENBQUMsV0FBVyxFQUFHO2dCQUNoQyxNQUFNLEVBQU8sSUFBSSxDQUFDLFdBQVcsRUFBRztnQkFDaEMsSUFBSSxFQUFTLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQixHQUFHLEVBQVUsTUFBTSxDQUFDLENBQUM7Z0JBQ3JCLFVBQVUsRUFBRyxJQUFJO2dCQUNqQixXQUFXLEVBQUUsSUFBSTtnQkFDakIsT0FBTyxFQUFNLFFBQVE7Z0JBQ3JCLE9BQU8sRUFBTSxRQUFRO2FBQ3pCLENBQUMsQ0FFRDtZQUFDLElBQUksQ0FBQyxVQUF1QixHQUFHLElBQUlDLFVBQVEsQ0FBRyxJQUFJLENBQUUsQ0FBQTs7Ozs7WUFPdEQsS0FBSyxDQUFDLFNBQVMsRUFBRyxDQUFBO1NBQ3RCO1FBeEVELGFBQWE7WUFFUixPQUFPO2dCQUNGLE9BQU8sRUFBRSxnQkFBZ0I7Z0JBQ3pCLElBQUksRUFBSyxPQUFPO2dCQUNoQixFQUFFLEVBQU8sU0FBUztnQkFDbEIsSUFBSSxFQUFLLFNBQVM7Z0JBQ2xCLENBQUMsRUFBUSxDQUFDO2dCQUNWLENBQUMsRUFBUSxDQUFDOztnQkFFVixPQUFPLEVBQUssQ0FBQztnQkFDYixVQUFVLEVBQUUsQ0FBQztnQkFDYixVQUFVLEVBQUUsQ0FBQztnQkFFYixLQUFLLEVBQWEsUUFBUTtnQkFDMUIsV0FBVyxFQUFPLE1BQU07Z0JBQ3hCLFdBQVcsRUFBTyxDQUFDO2dCQUVuQixlQUFlLEVBQUcsYUFBYTtnQkFDL0IsZUFBZSxFQUFHLFNBQVM7Z0JBQzNCLGdCQUFnQixFQUFFLEtBQUs7Z0JBRXZCLFFBQVEsRUFBVSxTQUFTO2dCQUMzQixRQUFRLEVBQVUsU0FBUztnQkFDM0IsT0FBTyxFQUFXLFNBQVM7YUFDL0IsQ0FBQTtTQUNMO1FBZ0RELFdBQVc7WUFFTixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO1lBRTFCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxVQUFVLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQTtZQUV0RCxJQUFLLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTztnQkFDckIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUE7WUFFMUIsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFBO1NBQ3BCO1FBRUQsVUFBVTtZQUVMLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRTlCLElBQUssSUFBSSxDQUFDLFVBQVU7Z0JBQ2YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUcsQ0FBQTtZQUVsQyxJQUFLLElBQUksQ0FBQyxNQUFNO2dCQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFHLENBQUE7WUFFOUIsS0FBSyxDQUFDLEdBQUcsQ0FBRTtnQkFDTixLQUFLLEVBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRztnQkFDM0IsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUc7YUFDL0IsQ0FBQyxDQUFBO1lBRUYsSUFBSyxLQUFLLENBQUMsTUFBTTtnQkFDWixLQUFLLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFHLENBQUE7U0FDekM7UUFFRCxNQUFNO1lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRyxDQUFBO1NBQ2xDO1FBRUQsYUFBYSxDQUFHLE9BQTRCO1lBRXZDLE1BQU0sQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUUsQ0FBQTtZQUV0QyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBRyxPQUFPLENBQUUsQ0FBQTtZQUVsQyxJQUFJLENBQUMsVUFBVSxFQUFHLENBQUE7U0FDdEI7UUFFRCxXQUFXLENBQUcsQ0FBUyxFQUFFLENBQVM7WUFFN0IsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFOUIsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDWixNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUVaLEtBQUssQ0FBQyxHQUFHLENBQUU7Z0JBQ04sSUFBSSxFQUFFLENBQUM7Z0JBQ1AsR0FBRyxFQUFHLENBQUM7YUFDWCxDQUFDO2lCQUNELFNBQVMsRUFBRyxDQUFBO1lBRWIsSUFBSyxLQUFLLENBQUMsTUFBTTtnQkFDWixLQUFLLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFHLENBQUE7U0FDekM7UUFHRCxLQUFLLENBQUcsRUFBVztZQUVkLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLElBQUksU0FBUztrQkFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO2tCQUN0QixJQUFJLENBQUMsS0FBSyxDQUFBO1lBRTNCLE1BQU0sQ0FBQyxTQUFTLENBQUUsaUJBQWlCLENBQUUsQ0FBQTtZQUVyQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDZixVQUFVLEVBQUUsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUN0QixRQUFRLEVBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO2dCQUN0QixNQUFNLEVBQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWTtnQkFDekMsT0FBTyxFQUFLLFNBQVM7Z0JBQ3JCLFFBQVEsRUFBSSxHQUFHO2dCQUNmLFFBQVEsRUFBSSxDQUFFLEtBQWE7b0JBRXRCLE1BQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7b0JBRXhCLE1BQU0sQ0FBQyxTQUFTLENBQUUsR0FBSSxNQUFPLE1BQU8sTUFBTyxNQUFPLEVBQUUsR0FBRyxLQUFNLG9CQUFvQixDQUFFLENBQUE7b0JBQ25GLE1BQU0sQ0FBQyxLQUFLLENBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUUsQ0FBQTtvQkFDL0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRyxDQUFBO2lCQUNyQzthQUNMLENBQUMsQ0FBQTtTQUNOO1FBRUQsTUFBTTtZQUVELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBRyxJQUFJLENBQUMsTUFBTSxDQUFFLENBQUE7U0FDekM7S0FDTDs7SUNyTUQ7QUFDQSxJQU9BLE1BQU1KLFNBQU8sR0FBRyxnQkFBZ0IsQ0FBQTtJQUNoQyxNQUFNSyxJQUFFLEdBQVEsSUFBSSxRQUFRLEVBQUcsQ0FBQTtJQUMvQixNQUFNQyxTQUFPLEdBQUcsSUFBSSxPQUFPLENBQVdELElBQUUsQ0FBRSxDQUFBO0lBQzFDLE1BQU0sTUFBTSxHQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUcsUUFBUSxDQUFFLENBQUE7SUFZdkM7OztJQUdBLFNBQVNKLFdBQVMsQ0FBRyxJQUFTO1FBRXpCLElBQUssU0FBUyxJQUFJLElBQUksRUFDdEI7WUFDSyxJQUFLLElBQUksQ0FBQyxPQUFPLEtBQUtELFNBQU87Z0JBQ3hCLE1BQU0sbUJBQW1CLENBQUE7U0FDbEM7YUFFRDtZQUNNLElBQTBCLENBQUMsT0FBTyxHQUFHQSxTQUFPLENBQUE7U0FDakQ7UUFFRCxPQUFPLElBQWMsQ0FBQTtJQUMxQixDQUFDO0FBR0QsYUFBZ0IsU0FBUyxDQUFxQixHQUFrQztRQUUzRSxJQUFLLEdBQUcsSUFBSSxTQUFTO1lBQ2hCLE9BQU8sU0FBUyxDQUFBO1FBRXJCLElBQUssR0FBRyxZQUFZLEtBQUs7WUFDcEIsT0FBTyxHQUFRLENBQUE7UUFFcEIsSUFBSyxHQUFHLFlBQVksTUFBTSxDQUFDLE1BQU07WUFDNUIsT0FBTyxHQUFHLENBQUUsTUFBTSxDQUFDLENBQUE7UUFFeEIsSUFBS00sU0FBTyxDQUFDLE9BQU8sQ0FBR04sU0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBRTtZQUM3QyxPQUFPTSxTQUFPLENBQUMsSUFBSSxDQUFHTixTQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFFLENBQUE7UUFFdEQsTUFBTSxPQUFPLEdBQUksR0FBRyxDQUFDLE9BQU8sSUFBSUEsU0FBTztjQUN0QixHQUFhO2NBQ2I7Z0JBQ0csT0FBTyxFQUFFQSxTQUFPO2dCQUNoQixJQUFJLEVBQUssR0FBRyxDQUFDLElBQUk7Z0JBQ2pCLEVBQUUsRUFBTyxHQUFHLENBQUMsRUFBRTtnQkFDZixJQUFJLEVBQUssR0FBRzthQUNOLENBQUE7UUFFMUIsSUFBSyxDQUFFLFFBQVEsQ0FBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRWxCLElBQUssQ0FBRSxRQUFRLENBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN0QixPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUVsQixNQUFNLEtBQUssR0FBR00sU0FBTyxDQUFDLElBQUksQ0FBRyxPQUFPLENBQUUsQ0FBQTs7OztRQU10QyxLQUFLLENBQUMsS0FBSyxDQUFFLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQTtRQUU1QixJQUFLLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUTtZQUNyQixLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQTtRQUV2RCxPQUFPLEtBQVUsQ0FBQTtJQUN0QixDQUFDO0FBR0QsYUFBZ0IsU0FBUyxDQUFzQixJQUFhO1FBRXZERCxJQUFFLENBQUMsR0FBRyxDQUFHSixXQUFTLENBQUcsSUFBSSxDQUFFLENBQUUsQ0FBQTtJQUNsQyxDQUFDO0FBR0QsYUFBZ0IsWUFBWSxDQUFHLElBQW1DLEVBQUUsSUFBWTtRQUUzRUssU0FBTyxDQUFDLE9BQU8sQ0FBRyxJQUFJLEVBQUUsQ0FBQ04sU0FBTyxFQUFFLElBQUksQ0FBQyxDQUFFLENBQUE7SUFDOUMsQ0FBQzs7VUN4RlksS0FBTSxTQUFRLEtBQUs7UUFNM0IsWUFBYyxPQUFlO1lBRXhCLEtBQUssQ0FBRyxPQUFPLENBQUUsQ0FBQTtZQU5iLFVBQUssR0FBRyxTQUFrQixDQUFBO1lBRTFCLGFBQVEsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFBOzs7OztZQVV0QyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXRCLE1BQU0sTUFBTSxHQUFHRSxPQUFVLENBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUUsQ0FBQTtZQUV2RCxNQUFNLElBQUksR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUcsTUFBTSxDQUFDLEtBQUssSUFBSSxHQUFHLEVBQUU7Z0JBQ2xELFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFHO2dCQUM3QixPQUFPLEVBQUcsUUFBUTtnQkFDbEIsT0FBTyxFQUFHLFFBQVE7Z0JBQ2xCLElBQUksRUFBTSxLQUFLLENBQUMsSUFBSTtnQkFDcEIsR0FBRyxFQUFPLEtBQUssQ0FBQyxHQUFHO2FBQ3ZCLENBQUMsQ0FBQTtZQUVGLEtBQUssQ0FBQyxhQUFhLENBQUcsSUFBSSxDQUFFLENBQUE7U0FDaEM7UUFFRCxXQUFXO1lBRU4sT0FBTyxFQUFFLENBQUE7U0FDYjtRQUVELE1BQU0sQ0FBRyxNQUFhLEVBQUUsTUFBTSxFQUFtQjtZQUU1QyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQTtZQUUzQixJQUFLLENBQUUsUUFBUSxDQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUU7Z0JBQ3hCLEdBQUcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUVuQyxJQUFLLENBQUUsUUFBUSxDQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUU7Z0JBQ3pCLEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUVwQjtZQUFDLElBQUksQ0FBQyxRQUEwQixxQkFBUyxHQUFHLENBQUUsQ0FBQTtZQUUvQyxJQUFLLElBQUksQ0FBQyxLQUFLLElBQUksU0FBUztnQkFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUcsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFBO1lBRXZDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FFOUI7WUFBQyxJQUFJLENBQUMsS0FBZSxHQUFHLE1BQU0sQ0FBQTtZQUUvQixJQUFJLENBQUMsY0FBYyxFQUFHLENBQUE7U0FDMUI7UUFFRCxjQUFjO1lBRVQsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXJDLElBQUssS0FBSyxJQUFJLFNBQVM7Z0JBQ2xCLE9BQU07WUFFWCxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXJDLE1BQU0sR0FBRyxHQUFNLEdBQUcsQ0FBQyxLQUFLLElBQUksTUFBTSxFQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtZQUM5QyxNQUFNLENBQUMsR0FBUSxHQUFHLENBQUUsR0FBRyxDQUFDLENBQUE7WUFDeEIsTUFBTSxDQUFDLEdBQVEsR0FBRyxDQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ3hCLE1BQU0sQ0FBQyxHQUFRLEtBQUssQ0FBQyxXQUFXLEVBQUcsR0FBRyxDQUFDLENBQUE7WUFDdkMsTUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLENBQUMsTUFBTSxJQUFJLFFBQVE7a0JBQzNCLElBQUksQ0FBQyxXQUFXLEVBQUcsR0FBRyxHQUFHLENBQUMsTUFBTTtrQkFDaEMsSUFBSSxDQUFDLFdBQVcsRUFBRyxHQUFHLEdBQUcsQ0FBQTtZQUUxQyxJQUFJLENBQUMsV0FBVyxDQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBRSxDQUFBO1NBQzNEO0tBQ0w7O1VDM0VZSyxXQUF3RCxTQUFRLEtBQVM7UUFNakYsWUFBYyxPQUFVO1lBRW5CLEtBQUssQ0FBRyxPQUFPLENBQUUsQ0FBQTtZQUp0QixpQkFBWSxHQUFHLENBQUMsQ0FBQTtZQUtYLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFBOzs7OztZQU9sQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQTs7WUFHL0IsS0FBTSxNQUFNLEtBQUssSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUUsRUFDbkQ7Z0JBQ0ssTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFHLEtBQUssQ0FBRSxDQUFBOztnQkFFN0IsSUFBSSxDQUFDLEdBQUcsQ0FBRyxDQUFDLENBQUUsQ0FBQTthQUNsQjtZQUVELElBQUksQ0FBQyxJQUFJLEVBQUcsQ0FBQTtTQUNoQjtRQUVELFdBQVc7WUFFTixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO1lBRTFCLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUE7WUFFdEUsSUFBSyxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU87Z0JBQ3JCLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFBO1lBRTFCLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQTtTQUNwQjtRQUVELEdBQUcsQ0FBRyxLQUFZO1lBRWIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUV0QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBRyxLQUFLLENBQUUsQ0FBQTtZQUU1QixJQUFLLEtBQUssRUFDVjtnQkFDSyxLQUFLLENBQUMsR0FBRyxDQUFHLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQTtnQkFDekIsS0FBSyxDQUFDLFNBQVMsRUFBRyxDQUFBO2FBQ3RCO1NBQ0w7UUFFRCxJQUFJO1lBRUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXhDLE1BQU0sU0FBUyxHQUFHLEVBQXdCLENBQUE7WUFFMUMsS0FBTSxNQUFNLENBQUMsSUFBSSxRQUFRLEVBQ3pCO2dCQUNLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUE7Z0JBQ2pCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUE7Z0JBQ3ZELFNBQVMsQ0FBQyxJQUFJLENBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFFLENBQUE7YUFDeEQ7WUFFRCxNQUFNLElBQUksR0FBSUMsV0FBb0IsQ0FBRyxTQUFTLENBQUUsR0FBRyxDQUFDLENBQUE7WUFFcEQsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUcsQ0FBQyxFQUFFLEVBQzNDO2dCQUNLLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7Z0JBQzVCLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFFdkIsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNaLENBQUMsQ0FBQyxHQUFHLEdBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFFWixLQUFLLENBQUMsR0FBRyxDQUFHLENBQUMsQ0FBRSxDQUFBO2FBQ25CO1lBRUQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQTtZQUU1QyxJQUFJLENBQUMsVUFBVSxFQUFHLENBQUE7U0FDdEI7S0FFTDs7SUNoRk0sTUFBTSxVQUFVLEdBQUdDLFFBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRUEsUUFBRyxDQUFDLE9BQU8sQ0FJMUQsQ0FBQTtBQUVELElBQU8sTUFBTSxVQUFVLEdBQUdBLFFBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRUEsUUFBRyxDQUFDLE9BQU8sQ0FJMUQsQ0FBQTtBQUVELElBQU8sTUFBTSxVQUFVLEdBQUdBLFFBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRUEsUUFBRyxDQUFDLE9BQU8sQ0FJMUQsQ0FBQTtBQUVELElBQU8sTUFBTSxTQUFTLEdBQUdBLFFBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBRUEsUUFBRyxDQUFDLE9BQU8sQ0FJeEQsQ0FBQTtBQUVELElBQU8sTUFBTSxhQUFhLEdBQUdBLFFBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRUEsUUFBRyxDQUFDLE9BQU8sQ0FJaEUsQ0FBQTs7SUNwQkQsWUFBWSxDQUFHLEtBQUssRUFBTSxRQUFRLHFEQUFzRCxDQUFBO0lBQ3hGLFlBQVksQ0FBR0YsV0FBUyxFQUFFLE9BQU8sQ0FBRSxDQUFBO0lBQ25DLFlBQVksQ0FBRyxLQUFLLEVBQU0sT0FBTyxDQUFFLENBQUE7SUFFbkMsU0FBUyxDQUFXO1FBQ2YsSUFBSSxFQUFLLFFBQVE7UUFDakIsRUFBRSxFQUFPLFNBQVM7UUFFbEIsSUFBSSxFQUFLLFNBQVM7UUFFbEIsS0FBSyxFQUFJLFFBQVE7UUFFakIsQ0FBQyxFQUFFLENBQUM7UUFDSixDQUFDLEVBQUUsQ0FBQztRQUVKLE9BQU8sRUFBTSxFQUFFO1FBQ2YsVUFBVSxFQUFFLENBQUM7UUFDYixVQUFVLEVBQUUsQ0FBQztRQUViLFdBQVcsRUFBTyxTQUFTO1FBQzNCLFdBQVcsRUFBTyxDQUFDO1FBQ25CLGVBQWUsRUFBRyxhQUFhO1FBQy9CLGVBQWUsRUFBRyxTQUFTO1FBQzNCLGdCQUFnQixFQUFFLEtBQUs7UUFFdkIsUUFBUSxFQUFLLENBQUUsTUFBZSxFQUFFLE1BQU07WUFFakMsTUFBTSxDQUFDLGFBQWEsQ0FBRTtnQkFDakIsZUFBZSxFQUFFLE1BQU0sQ0FBQyxNQUFNO2dCQUM5QixLQUFLLEVBQUUsTUFBTSxDQUFDLFNBQVMsR0FBRyxRQUFRLEdBQUcsUUFBUTthQUMxQyxDQUFDLENBQUE7U0FDYjtRQUNELFFBQVEsRUFBRSxTQUFTO1FBQ25CLE9BQU8sRUFBRSxTQUFTO0tBQ3RCLENBQUMsQ0FBQTtJQUVGLFNBQVMsQ0FBVztRQUNmLElBQUksRUFBSyxPQUFPO1FBQ2hCLEVBQUUsRUFBTyxTQUFTO1FBRWxCLElBQUksRUFBRSxTQUFTO1FBRWYsS0FBSyxFQUFFLFFBQVE7UUFDZixDQUFDLEVBQUUsQ0FBQztRQUNKLENBQUMsRUFBRSxDQUFDO1FBRUosV0FBVyxFQUFPLFNBQVM7UUFDM0IsV0FBVyxFQUFPLENBQUM7UUFDbkIsZUFBZSxFQUFHLFNBQVM7UUFDM0IsZUFBZSxFQUFHLFNBQVM7UUFDM0IsZ0JBQWdCLEVBQUUsS0FBSztRQUN2QixPQUFPLEVBQVcsRUFBRTtRQUNwQixVQUFVLEVBQVEsRUFBRTtRQUNwQixVQUFVLEVBQVEsQ0FBQztRQUVuQixRQUFRLENBQUcsS0FBYSxFQUFFLE1BQU07WUFFM0IsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFFO2dCQUNqQixJQUFJLEVBQUUsT0FBTztnQkFDYixFQUFFLEVBQUksS0FBSyxDQUFDLElBQUk7YUFDcEIsQ0FBQyxDQUFBO1lBRUYsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFXLElBQUksQ0FBRSxDQUFBOztZQUd4QyxLQUFLLENBQUMsTUFBTSxDQUFHLE1BQU0sQ0FBRSxDQUFBO1NBQzNCO1FBRUQsT0FBTyxDQUFHLEtBQUs7WUFFVixNQUFNLEtBQUssR0FBRyxPQUFPLENBQVc7Z0JBQzNCLElBQUksRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUk7Z0JBQ3ZCLEVBQUUsRUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7YUFDekIsQ0FBQyxDQUFBO1lBRUYsVUFBVSxDQUFHLGtCQUFrQixFQUFFLEtBQUssQ0FBRSxDQUFBO1NBQzVDO1FBRUQsUUFBUSxFQUFFLFNBQVM7S0FDdkIsQ0FBQyxDQUFBO0lBRUYsU0FBUyxDQUFXO1FBQ2YsSUFBSSxFQUFLLE9BQU87UUFDaEIsRUFBRSxFQUFPLFNBQVM7UUFFbEIsSUFBSSxFQUFFLFNBQVM7UUFFZixDQUFDLEVBQVcsQ0FBQztRQUNiLENBQUMsRUFBVyxDQUFDO1FBQ2IsT0FBTyxFQUFLLENBQUM7UUFDYixVQUFVLEVBQUUsQ0FBQztRQUNiLFVBQVUsRUFBRSxDQUFDO1FBRWIsS0FBSyxFQUFhLFFBQVE7UUFDMUIsV0FBVyxFQUFPLE1BQU07UUFDeEIsV0FBVyxFQUFPLENBQUM7UUFFbkIsZUFBZSxFQUFHLGFBQWE7UUFDL0IsZUFBZSxFQUFHLFNBQVM7UUFDM0IsZ0JBQWdCLEVBQUUsS0FBSztRQUV2QixRQUFRLEVBQVUsU0FBUztRQUMzQixRQUFRLEVBQVUsU0FBUztRQUMzQixPQUFPLEVBQVcsU0FBUztLQUMvQixDQUFDLENBQUE7O0lDckhGO0lBRUE7QUFFQSxJQUFPLE1BQU0sSUFBSSxHQUFHRyxJQUFPLENBQXdCO1FBQzlDLE9BQU8sRUFBUSxZQUFZO1FBQzNCLElBQUksRUFBVyxXQUFXO1FBQzFCLEVBQUUsRUFBYSxNQUFNO1FBQ3JCLGFBQWEsRUFBRSxJQUFJO1FBQ25CLFNBQVMsRUFBTSxJQUFJO0tBQ3ZCLENBQUMsQ0FBQTtJQUNGLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFHLEdBQUksSUFBSSxDQUFDLE9BQU8sRUFBRyxDQUFFLENBQUE7SUFPNUM7SUFDQSxxREFBcUQ7O0lDVHJELElBQUksU0FBUyxHQUFHLElBQWlDLENBQUE7QUFFakQsSUFBTyxNQUFNLEtBQUssR0FBR0EsSUFBTyxDQUF3QjtRQUMvQyxPQUFPLEVBQVEsWUFBWTtRQUMzQixJQUFJLEVBQVcsV0FBVztRQUMxQixFQUFFLEVBQWEsU0FBUztRQUN4QixTQUFTLEVBQU0sU0FBUztRQUN4QixhQUFhLEVBQUUsSUFBSTtRQUVuQixNQUFNLEVBQUU7WUFDSCxPQUFPLEVBQUksWUFBWTtZQUN2QixJQUFJLEVBQU8sU0FBUztZQUNwQixFQUFFLEVBQVMsU0FBUztZQUNwQixLQUFLLEVBQU0sVUFBVTtZQUNyQixTQUFTLEVBQUUsQUFBd0MsQ0FBQyxJQUFJLENBQUMsQUFBTTtZQUUvRCxPQUFPLEVBQUUsQ0FBQztvQkFDTCxPQUFPLEVBQUUsWUFBWTtvQkFDckIsSUFBSSxFQUFNLFFBQVE7b0JBQ2xCLEVBQUUsRUFBUSxTQUFTO29CQUNuQixJQUFJLEVBQU0sR0FBRztvQkFDYixJQUFJLEVBQU0sRUFBRTtvQkFDWixRQUFRLEVBQUUsR0FBRztvQkFDYixPQUFPLEVBQUUsV0FBVztpQkFDeEIsRUFBQztvQkFDRyxPQUFPLEVBQUUsWUFBWTtvQkFDckIsSUFBSSxFQUFNLFFBQVE7b0JBQ2xCLEVBQUUsRUFBUSxZQUFZO29CQUN0QixJQUFJLEVBQU0sRUFBRTtvQkFDWixJQUFJLEVBQU0sa0JBQWtCO29CQUM1QixRQUFRLEVBQUUsR0FBRztpQkFDakIsQ0FBQztTQUNOO1FBRUQsUUFBUSxFQUFFLENBQUM7Z0JBQ04sT0FBTyxFQUFJLFlBQVk7Z0JBQ3ZCLElBQUksRUFBTyxXQUFXO2dCQUN0QixFQUFFLEVBQVMsaUJBQWlCO2dCQUU1QixRQUFRLEVBQUUsQ0FBQzt3QkFDTixPQUFPLEVBQUUsWUFBWTt3QkFDckIsSUFBSSxFQUFLLGNBQWM7d0JBQ3ZCLEVBQUUsRUFBTyxhQUFhO3FCQUMxQixFQUFDO3dCQUNHLE9BQU8sRUFBRSxZQUFZO3dCQUNyQixJQUFJLEVBQUssZUFBZTt3QkFDeEIsRUFBRSxFQUFPLGNBQWM7cUJBQzNCLENBQUM7YUFDTixDQUFDO0tBQ04sQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUcsR0FBSSxLQUFLLENBQUMsT0FBTyxFQUFHLENBQUUsQ0FBQTtJQUU3QyxNQUFNLFNBQVMsR0FBSUMsSUFBTyxDQUFpQixXQUFXLEVBQUUsaUJBQWlCLENBQUUsQ0FBQTtJQUMzRSxNQUFNLFVBQVUsR0FBR0EsSUFBTyxDQUFpQixjQUFjLEVBQUUsYUFBYSxDQUFFLENBQUE7SUFFMUUsVUFBVSxDQUFHLFlBQVksRUFBRSxDQUFFLElBQUksRUFBRSxHQUFJLE9BQU87UUFFekMsSUFBSyxJQUFJO1lBQ0osU0FBUyxDQUFDLElBQUksQ0FBRyxJQUFJLEVBQUUsR0FBSSxPQUFPLENBQUUsQ0FBQTs7WUFFcEMsS0FBSyxDQUFDLElBQUksRUFBRyxDQUFBO0lBQ3ZCLENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFHLGtCQUFrQixFQUFFLENBQUUsSUFBSTtRQUVsQyxJQUFLLElBQUksRUFDVDtZQUNLLFVBQVUsQ0FBQyxPQUFPLENBQUcsSUFBVyxDQUFFLENBQUE7WUFDbEMsS0FBSyxDQUFDLElBQUksRUFBRyxDQUFBO1NBQ2pCO0lBQ04sQ0FBQyxDQUFDLENBQUE7SUFFRixVQUFVLENBQUcsYUFBYSxFQUFHO1FBRXhCLEtBQUssQ0FBQyxLQUFLLEVBQUcsQ0FBQTtJQUNuQixDQUFDLENBQUMsQ0FBQTs7SUM1RkY7Ozs7O0FBTUEsSUFRQSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQWMsQ0FBQyxDQUFBO0lBQzlDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBUSxLQUFLLENBQUE7SUFDbEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFVLElBQUksQ0FBQTtJQUNqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQVcsSUFBSSxDQUFBO0lBQ2pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGdCQUFnQixHQUFLLEtBQUssQ0FBQTtJQUNsRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUE7SUFDbEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsZUFBZSxHQUFNLElBQUksQ0FBQTtJQUNqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQVUsUUFBUSxDQUFBO0lBQ3JELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFHLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQTtJQUN6RCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7SUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUcsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFBO0lBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFHLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQTtJQUN6RCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7SUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUcsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFBO0lBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFHLElBQUksRUFBRSxLQUFLLENBQUUsQ0FBQTtBQVd6RCxVQUFhLElBQUk7UUFNWixZQUFjLE1BQXlCO1lBRi9CLFVBQUssR0FBRyxFQUEyQixDQUFBO1lBYTNDLGdCQUFXLEdBQWtCLFNBQVMsQ0FBQTtZQUV0QyxpQkFBWSxHQUFJLElBQThCLENBQUE7WUFDOUMsZ0JBQVcsR0FBSyxJQUE4QixDQUFBO1lBQzlDLGtCQUFhLEdBQUcsSUFBOEIsQ0FBQTtZQUM5Qyx3QkFBbUIsR0FBRyxJQUE4QixDQUFBO1lBQ3BELGdCQUFXLEdBQUssSUFBd0MsQ0FBQTtZQWZuRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBRyxNQUFNLENBQUUsQ0FBQTtZQUMzQyxJQUFJLENBQUMsWUFBWSxFQUFHLENBQUE7U0FDeEI7UUFFRCxJQUFJLElBQUk7WUFFSCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUE7U0FDdEI7UUFVRCxVQUFVLENBQUcsSUFBWTtZQUVwQixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFBO1lBRXRCLElBQUssSUFBSSxJQUFJLEtBQUs7Z0JBQ2IsTUFBTSx5QkFBeUIsQ0FBQTtZQUVwQyxPQUFPLEtBQUssQ0FBRSxJQUFJLENBQUMsR0FBRztnQkFDakIsSUFBSTtnQkFDSixNQUFNLEVBQUssS0FBSztnQkFDaEIsUUFBUSxFQUFHLEVBQUU7Z0JBQ2IsT0FBTyxFQUFJLFNBQVM7Z0JBQ3BCLFNBQVMsRUFBRSxJQUFJO2FBQ25CLENBQUE7U0FDTDtRQUlELEdBQUcsQ0FBRyxJQUFtQjtZQUVwQixNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUUvQixJQUFLLE9BQU8sSUFBSSxJQUFJLFFBQVE7Z0JBQ3ZCLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1lBRXJCLElBQUssSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJO2dCQUN2QyxPQUFNO1lBRVgsSUFBSyxFQUFHLElBQUksSUFBSSxLQUFLLENBQUM7Z0JBQ2pCLE9BQU07WUFFWCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBRSxJQUFJLENBQUMsQ0FBQTtZQUV6QyxPQUFPLENBQUMsS0FBSyxFQUFHLENBQUE7WUFFaEIsS0FBTSxNQUFNLEtBQUssSUFBSSxNQUFNLENBQUMsUUFBUTtnQkFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBRyxLQUFLLENBQUMsS0FBSyxDQUFFLENBQUE7WUFFaEMsT0FBTyxNQUFNLENBQUE7U0FDakI7UUFJRCxHQUFHO1lBRUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFaEMsSUFBSyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUM7Z0JBQ3JCLE9BQU07WUFFWCxJQUFLLE9BQU8sU0FBUyxDQUFFLENBQUMsQ0FBQyxJQUFJLFFBQVEsRUFDckM7Z0JBQ0ssTUFBTSxJQUFJLEdBQUdULE9BQVUsQ0FBRyxHQUFJLFNBQTZCLENBQUUsQ0FBQTtnQkFDN0QsTUFBTSxHQUFHLEdBQUdVLFNBQWdCLENBQUcsSUFBSSxDQUFFLENBQUE7Z0JBQ3JDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFHLEdBQUcsQ0FBRSxDQUFBO2dCQUM1QixPQUFPLENBQUMsR0FBRyxDQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUUsQ0FBQTthQUM3Qjs7Z0JBQ0ksS0FBTSxNQUFNLENBQUMsSUFBSSxTQUFTLEVBQy9CO29CQUNLLE1BQU0sR0FBRyxHQUFHQSxTQUFnQixDQUFHLENBQWtCLENBQUUsQ0FBQTs7Ozs7b0JBUW5ELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFHLEdBQUcsQ0FBRSxDQUFBO29CQUM1QixPQUFPLENBQUMsR0FBRyxDQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUUsQ0FBQTtpQkFDN0I7WUFFRCxPQUFPLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtTQUMvQjtRQUVELEtBQUs7WUFFQSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRyxDQUFBO1NBQ3pCO1FBRUQsSUFBSTtZQUVDLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFeEIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRyxDQUFBO1lBQ3JDLE1BQU0sU0FBUyxHQUFHLEVBQXdCLENBQUE7WUFFMUMsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQ3hCO2dCQUNLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUE7Z0JBQ3ZELFNBQVMsQ0FBQyxJQUFJLENBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFFLENBQUE7YUFDekQ7WUFFREosV0FBb0IsQ0FBRyxTQUFTLENBQUUsR0FBRyxDQUFDLENBQUE7WUFFdEMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUcsQ0FBQyxFQUFFLEVBQzFDO2dCQUNLLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQTtnQkFDckIsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUV2QixDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ1osQ0FBQyxDQUFDLEdBQUcsR0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNaLENBQUMsQ0FBQyxTQUFTLEVBQUcsQ0FBQTthQUNsQjtZQUVELE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRyxDQUFBO1NBQy9CO1FBRUQsSUFBSSxDQUFHLE1BQXVCO1lBRXpCLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUE7WUFFeEIsSUFBSyxPQUFPLE1BQU0sSUFBSSxRQUFRLEVBQzlCO2dCQUNLLE9BQU07YUFDVjtZQUVELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUcsQ0FBQTtZQUVyQyxJQUFLLE9BQU8sTUFBTSxJQUFJLFFBQVEsRUFDOUI7Z0JBQ0ssTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQTtnQkFFdEIsSUFBSSxJQUFJLEdBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO2dCQUM3QixJQUFJLEtBQUssR0FBSSxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUE7Z0JBQzdCLElBQUksR0FBRyxHQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQTtnQkFDOUIsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBSSxDQUFDLENBQUMsTUFBTSxDQUFBO2FBRWxDO2lCQUVEO2dCQUNLLElBQUksSUFBSSxHQUFLLENBQUMsQ0FBQTtnQkFDZCxJQUFJLEtBQUssR0FBSSxDQUFDLENBQUE7Z0JBQ2QsSUFBSSxHQUFHLEdBQU0sQ0FBQyxDQUFBO2dCQUNkLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQTtnQkFFZCxLQUFNLE1BQU0sQ0FBQyxJQUFJLE9BQU8sRUFDeEI7b0JBQ0ssTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO29CQUMxQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUE7b0JBQzFCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQTtvQkFDM0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBSSxDQUFDLENBQUMsTUFBTSxDQUFBO29CQUUzQixJQUFLLENBQUMsR0FBRyxJQUFJO3dCQUNSLElBQUksR0FBRyxDQUFDLENBQUE7b0JBRWIsSUFBSyxDQUFDLEdBQUcsS0FBSzt3QkFDVCxLQUFLLEdBQUcsQ0FBQyxDQUFBO29CQUVkLElBQUssQ0FBQyxHQUFHLEdBQUc7d0JBQ1AsR0FBRyxHQUFHLENBQUMsQ0FBQTtvQkFFWixJQUFLLENBQUMsR0FBRyxNQUFNO3dCQUNWLE1BQU0sR0FBRyxDQUFDLENBQUE7aUJBQ25CO2FBQ0w7WUFFRCxNQUFNLENBQUMsR0FBSSxLQUFLLEdBQUcsSUFBSSxDQUFBO1lBQ3ZCLE1BQU0sQ0FBQyxHQUFJLE1BQU0sR0FBRyxHQUFHLENBQUE7WUFDdkIsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBSSxDQUFBO1lBQy9CLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUcsQ0FBQTtZQUUvQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztrQkFDSCxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDO2tCQUN2QixDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFFbkMsT0FBTyxDQUFDLGlCQUFpQixDQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNqQyxPQUFPLENBQUMsaUJBQWlCLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRWpDLE1BQU0sRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3ZCLE1BQU0sRUFBRSxHQUFHLEdBQUcsR0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRXZCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ2xELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBRWxELEtBQU0sTUFBTSxDQUFDLElBQUksT0FBTztnQkFDbkIsQ0FBQyxDQUFDLFNBQVMsRUFBRyxDQUFBO1lBRW5CLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRyxDQUFBO1NBQy9CO1FBRUQsT0FBTyxDQUFHLEtBQVk7WUFFakIsS0FBTSxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRyxFQUMzQztnQkFDSyxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTthQUNyQjtZQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTtTQUM5QjtRQUVELFlBQVk7WUFFUCxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQTtZQUU5QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFBO1lBRWpDLElBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSztnQkFDbEMsQ0FBUztZQUVkLE9BQU8sS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO1NBQ3hFOztRQUlELFlBQVk7WUFFUCxJQUFJLENBQUMsY0FBYyxFQUFHLENBQUE7WUFDdEIsSUFBSSxDQUFDLGFBQWEsRUFBSSxDQUFBO1lBQ3RCLElBQUksQ0FBQyxZQUFZLEVBQUssQ0FBQTtZQUN0QixJQUFJLENBQUMsYUFBYSxFQUFJLENBQUE7OztZQUl0QixNQUFNLENBQUMsZ0JBQWdCLENBQUcsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxDQUFFLENBQUE7U0FDckU7UUFFTyxVQUFVO1lBRWIsSUFBSSxLQUFLLEdBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsVUFBVSxHQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUE7WUFDMUUsSUFBSSxNQUFNLEdBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxNQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUE7WUFFM0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7Z0JBQ3RCLEtBQUssRUFBRSxLQUFLO2dCQUNaLE1BQU0sRUFBRSxNQUFNO2FBQ2xCLENBQUMsQ0FBQTtTQUNOO1FBRU8sY0FBYztZQUVqQixNQUFNLElBQUksR0FBYSxJQUFJLENBQUMsT0FBTyxDQUFBO1lBQ25DLE1BQU0sY0FBYyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUE7WUFDOUIsSUFBTSxVQUFVLEdBQU8sQ0FBQyxDQUFDLENBQUE7WUFDekIsSUFBTSxRQUFRLEdBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUE7WUFFN0MsSUFBSSxDQUFDLEVBQUUsQ0FBRyxZQUFZLEVBQUUsTUFBTTtnQkFFekIsT0FBTyxDQUFDLEdBQUcsQ0FBRyxZQUFZLENBQUUsQ0FBQTtnQkFDNUIsTUFBTSxHQUFHLEdBQUssSUFBSSxDQUFDLEdBQUcsRUFBRyxDQUFBO2dCQUN6QixNQUFNLEdBQUcsR0FBSyxNQUFNLENBQUMsT0FBTyxDQUFBO2dCQUM1QixNQUFNLEtBQUssR0FBRztvQkFDVCxVQUFVLEdBQUcsR0FBRyxDQUFBO29CQUNoQixRQUFRLEdBQUssR0FBRyxDQUFBO2lCQUNwQixDQUFBOztnQkFHRCxJQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsVUFBVSxFQUMzQjtvQkFDSyxJQUFLLElBQUksQ0FBQyxhQUFhLEVBQ3ZCO3dCQUNLLE1BQU0sT0FBTyxHQUFHSSxTQUFnQixDQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsQ0FBQTt3QkFFbEQsSUFBSyxPQUFPOzRCQUNQLElBQUksQ0FBQyxhQUFhLENBQUcsT0FBTyxDQUFFLENBQUE7d0JBRW5DLE1BQU0sQ0FBQyxDQUFDLENBQUMsd0JBQXdCLEVBQUcsQ0FBQTt3QkFFcEMsT0FBTTtxQkFDVjt5QkFFRDt3QkFDSyxPQUFPLEtBQUssRUFBRyxDQUFBO3FCQUNuQjtpQkFDTDs7Z0JBR0QsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ3hELElBQUssSUFBSSxHQUFHLENBQUMsY0FBYyxJQUFJLGNBQWMsR0FBRyxJQUFJO29CQUMvQyxPQUFPLEtBQUssRUFBRyxDQUFBOztnQkFHcEIsSUFBSyxNQUFNLENBQUMsTUFBTSxJQUFJLFNBQVMsRUFDL0I7b0JBQ0ssSUFBSyxJQUFJLENBQUMsbUJBQW1CLEVBQzdCO3dCQUNLLE1BQU0sT0FBTyxHQUFHQSxTQUFnQixDQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsQ0FBQTt3QkFFbEQsSUFBSyxPQUFPOzRCQUNQLElBQUksQ0FBQyxtQkFBbUIsQ0FBRyxPQUFPLENBQUUsQ0FBQTtxQkFDN0M7b0JBRUQsVUFBVSxHQUFLLENBQUMsQ0FBQyxDQUFBO2lCQUNyQjs7cUJBR0Q7b0JBQ0ssSUFBSyxJQUFJLENBQUMsV0FBVzt3QkFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUUsQ0FBQTtpQkFDMUM7Z0JBRUQsTUFBTSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsRUFBRyxDQUFBO2dCQUVwQyxPQUFNO2FBQ1YsQ0FBQyxDQUFBO1NBQ047UUFFTyxhQUFhO1lBRWhCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUE7WUFFekIsSUFBSSxDQUFDLEVBQUUsQ0FBRyxZQUFZLEVBQUUsTUFBTTtnQkFFekIsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFBO2dCQUVoQyxJQUFLLElBQUksQ0FBQyxZQUFZLEVBQ3RCO29CQUNLLE1BQU0sT0FBTyxHQUFHQSxTQUFnQixDQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsQ0FBQTtvQkFFbEQsSUFBSyxPQUFPO3dCQUNQLElBQUksQ0FBQyxZQUFZLENBQUcsT0FBTyxDQUFFLENBQUE7aUJBQ3RDO2FBQ0wsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBRyxXQUFXLEVBQUUsTUFBTTtnQkFFeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUE7Z0JBRTVCLElBQUssSUFBSSxDQUFDLFdBQVcsRUFDckI7b0JBQ0ssTUFBTSxPQUFPLEdBQUdBLFNBQWdCLENBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBRSxDQUFBO29CQUVsRCxJQUFLLE9BQU87d0JBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBRyxPQUFPLENBQUUsQ0FBQTtpQkFDckM7YUFDTCxDQUFDLENBQUE7U0FDTjtRQUVPLFlBQVk7WUFFZixNQUFNLElBQUksR0FBUyxJQUFJLENBQUMsT0FBTyxDQUFBO1lBQy9CLElBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQTtZQUN4QixJQUFNLFFBQVEsR0FBSyxDQUFDLENBQUMsQ0FBQTtZQUNyQixJQUFNLFFBQVEsR0FBSyxDQUFDLENBQUMsQ0FBQTtZQUVyQixJQUFJLENBQUMsRUFBRSxDQUFHLFlBQVksRUFBRSxNQUFNO2dCQUV6QixJQUFLLElBQUksQ0FBQyxXQUFXLElBQUksU0FBUyxFQUNsQztvQkFDSyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQTtvQkFDdEIsSUFBSSxDQUFDLG1CQUFtQixFQUFHLENBQUE7b0JBQzNCLElBQUksQ0FBQyxhQUFhLENBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFBLEVBQUUsQ0FBRSxDQUFBO29CQUVwRCxVQUFVLEdBQUcsSUFBSSxDQUFBO29CQUNqQixRQUFRLEdBQUssTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7b0JBQzdCLFFBQVEsR0FBSyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtvQkFFN0IsSUFBSSxDQUFDLGdCQUFnQixFQUFHLENBQUE7aUJBQzVCO2FBQ0wsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBRyxZQUFZLEVBQUUsTUFBTTtnQkFFekIsSUFBSyxVQUFVLEVBQ2Y7b0JBQ0ssTUFBTSxPQUFPLEdBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQTtvQkFFL0IsSUFBSSxDQUFDLGlCQUFpQixDQUFFLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFBO29CQUNsRCxJQUFJLENBQUMsaUJBQWlCLENBQUUsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUE7b0JBRWxELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO29CQUV2QixRQUFRLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQTtvQkFDcEIsUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUE7aUJBQ3hCO2FBQ0wsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLEVBQUUsQ0FBRyxVQUFVLEVBQUU7Z0JBRWpCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO2dCQUVyQixJQUFJLENBQUMsYUFBYSxDQUFHLENBQUM7b0JBRWpCLENBQUMsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO29CQUNuQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUE7aUJBQ2pCLENBQUMsQ0FBQTtnQkFFRixVQUFVLEdBQUcsS0FBSyxDQUFBO2dCQUVsQixJQUFJLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTthQUM1QixDQUFDLENBQUE7U0FDTjtRQUVPLGFBQWE7WUFFaEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQTtZQUV6QixJQUFJLENBQUMsRUFBRSxDQUFHLGFBQWEsRUFBRSxNQUFNO2dCQUUxQixNQUFNLEtBQUssR0FBSyxNQUFNLENBQUMsQ0FBZSxDQUFBO2dCQUN0QyxJQUFNLEtBQUssR0FBSyxLQUFLLENBQUMsTUFBTSxDQUFBO2dCQUM1QixJQUFNLElBQUksR0FBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7Z0JBQ3pCLElBQUksR0FBTSxJQUFJLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQTtnQkFFbkMsSUFBSSxJQUFJLEdBQUcsQ0FBQztvQkFDUCxJQUFJLEdBQUcsQ0FBQyxDQUFBO2dCQUViLElBQUksSUFBSSxHQUFHLEdBQUc7b0JBQ1QsSUFBSSxHQUFHLEdBQUcsQ0FBQTtnQkFFZixJQUFJLENBQUMsV0FBVyxDQUFFLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUUsRUFBRSxJQUFJLENBQUUsQ0FBQTtnQkFFM0UsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFBO2dCQUN0QixLQUFLLENBQUMsZUFBZSxFQUFFLENBQUE7Z0JBRXZCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRyxDQUFBO2FBQzVCLENBQUMsQ0FBQTtTQUNOO1FBRU8sY0FBYztZQUVqQixNQUFNLElBQUksR0FBUSxJQUFJLENBQUMsT0FBTyxDQUFBO1lBQzlCLElBQU0sT0FBTyxHQUFLLFNBQTZCLENBQUE7WUFDL0MsSUFBTSxTQUFTLEdBQUcsU0FBd0IsQ0FBQTtZQUMxQyxJQUFNLE9BQU8sR0FBSyxDQUFDLENBQUE7WUFDbkIsSUFBTSxPQUFPLEdBQUssQ0FBQyxDQUFBO1lBRW5CLFNBQVMsWUFBWSxDQUFFLE1BQXFCO2dCQUV2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFBO2dCQUM1QixPQUFPLENBQUMsR0FBRyxDQUFHLE1BQU0sQ0FBRSxDQUFBO2dCQUN0QixPQUFPLEdBQUcsTUFBTSxDQUFFLFNBQVMsQ0FBcUIsQ0FBQTtnQkFFaEQsSUFBSyxPQUFPLElBQUksU0FBUztvQkFDcEIsT0FBTTtnQkFFWCxPQUFPLEdBQUssTUFBTSxDQUFDLElBQUksQ0FBQTtnQkFDdkIsT0FBTyxHQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUE7Z0JBQ3RCLFNBQVMsR0FBRyxFQUFFLENBQUE7Z0JBRWQsS0FBTSxNQUFNLENBQUMsSUFBSSxPQUFPO29CQUNuQixTQUFTLENBQUMsSUFBSSxDQUFFLENBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBQTtnQkFFdkMsT0FBTyxDQUFDLEdBQUcsQ0FBRSxTQUFTLENBQUMsQ0FBQTthQUMzQjtZQUVELElBQUksQ0FBQyxFQUFFLENBQUcsbUJBQW1CLEVBQUUsWUFBWSxDQUFFLENBQUE7WUFDN0MsSUFBSSxDQUFDLEVBQUUsQ0FBRyxtQkFBbUIsRUFBRSxZQUFZLENBQUUsQ0FBQTtZQUU3QyxJQUFJLENBQUMsRUFBRSxDQUFHLGVBQWUsRUFBRSxNQUFNO2dCQUU1QixJQUFLLE9BQU8sSUFBSSxTQUFTO29CQUNwQixPQUFNO2dCQUVYLE1BQU0sTUFBTSxHQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUE7Z0JBQzlCLE1BQU0sT0FBTyxHQUFJLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFBO2dCQUN0QyxNQUFNLE9BQU8sR0FBSSxNQUFNLENBQUMsR0FBRyxHQUFJLE9BQU8sQ0FBQTtnQkFFdEMsS0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUcsQ0FBQyxFQUFFLEVBQzFDO29CQUNLLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBRSxDQUFDLENBQUMsQ0FBQTtvQkFDdkIsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFFLENBQUMsQ0FBQyxDQUFBO29CQUN6QixHQUFHLENBQUMsR0FBRyxDQUFFO3dCQUNKLElBQUksRUFBRSxHQUFHLENBQUUsQ0FBQyxDQUFDLEdBQUcsT0FBTzt3QkFDdkIsR0FBRyxFQUFHLEdBQUcsQ0FBRSxDQUFDLENBQUMsR0FBRyxPQUFPO3FCQUMzQixDQUFDLENBQUE7aUJBQ047YUFDTCxDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsRUFBRSxDQUFHLG1CQUFtQixFQUFFLE1BQU07Z0JBRWhDLE9BQU8sR0FBRyxTQUFTLENBQUE7Z0JBRW5CLE9BQU8sQ0FBQyxHQUFHLENBQUUsU0FBUyxDQUFDLENBQUE7YUFDM0IsQ0FBQyxDQUFBO1NBQ047UUFFTyxhQUFhOzs7WUFLaEIsTUFBTSxJQUFJLEdBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQTtZQUU5QixJQUFJLENBQUMsRUFBRSxDQUFHLFlBQVksRUFBRSxNQUFNOztnQkFHekIsT0FBTyxDQUFDLEdBQUcsQ0FBRyxZQUFZLENBQUUsQ0FBQTthQUNoQyxDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsRUFBRSxDQUFHLFdBQVcsRUFBRSxNQUFNOzthQUc1QixDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsRUFBRSxDQUFHLFVBQVUsRUFBRSxNQUFNOzthQUczQixDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsRUFBRSxDQUFHLE1BQU0sRUFBRSxNQUFNOzs7YUFJdkIsQ0FBQyxDQUFBO1NBQ047S0FDTDs7SUN4aUJNLE1BQU0sSUFBSSxHQUFJLENBQUM7UUFFakIsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBRyxRQUFRLENBQUUsQ0FBQTtRQUVsRCxNQUFNLENBQUMsS0FBSyxHQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFBO1FBQ3pDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUE7UUFFMUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUcsTUFBTSxDQUFFLENBQUE7UUFFL0IsT0FBTyxJQUFJLElBQUksQ0FBRyxNQUFNLENBQUUsQ0FBQTtJQUMvQixDQUFDLEdBQUksQ0FBQTtBQUVMLElBQU8sTUFBTSxjQUFjLEdBQUcsSUFBSSxVQUFVLENBQUU7UUFDekMsT0FBTyxFQUFFLFlBQVk7UUFDckIsSUFBSSxFQUFFLGFBQWE7UUFDbkIsRUFBRSxFQUFFLFdBQVc7UUFDZixPQUFPLEVBQUU7WUFDSixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxRQUFRLFVBQVUsQ0FBRyxjQUFjLENBQUUsQ0FBQSxFQUFFLEVBQUU7WUFDakosRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRTtZQUM5RixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUU7WUFDcEgsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRTtZQUM5RixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBSyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixFQUFFO1NBQzNGO1FBQ1IsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFLEdBQUMsQ0FBQztLQUN2QixDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBRyxHQUFJLGNBQWMsQ0FBQyxPQUFPLEVBQUcsQ0FBRSxDQUFBO0lBZXRELFVBQVUsQ0FBRyxxQkFBcUIsRUFBRSxDQUFFLENBQVMsRUFBRSxDQUFTO1FBRXJELGNBQWMsQ0FBQyxJQUFJLENBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBO0lBQ2pDLENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFHLHNCQUFzQixFQUFFO1FBRWhDLGNBQWMsQ0FBQyxJQUFJLEVBQUcsQ0FBQTtJQUMzQixDQUFDLENBQUMsQ0FBQTtJQUVGLFVBQVUsQ0FBRyxXQUFXLEVBQUUsQ0FBRSxLQUFLO1FBRTVCLE9BQU8sQ0FBQyxHQUFHLENBQUcsV0FBVyxDQUFFLENBQUE7SUFDaEMsQ0FBQyxDQUFDLENBQUE7SUFFRixVQUFVLENBQUcsWUFBWSxFQUFFLENBQUUsSUFBSTtJQUdqQyxDQUFDLENBQUMsQ0FBQTtJQUVGLFVBQVUsQ0FBRyxjQUFjLEVBQUU7UUFFeEIsSUFBSSxDQUFDLElBQUksRUFBRyxDQUFBO0lBQ2pCLENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFHLFNBQVMsRUFBRSxDQUFFLEtBQUs7UUFFMUIsSUFBSSxDQUFDLElBQUksQ0FBRyxLQUFLLENBQUUsQ0FBQTtRQUNuQixJQUFJLENBQUMsT0FBTyxDQUFHLEtBQUssQ0FBRSxDQUFBO0lBQzNCLENBQUMsQ0FBQyxDQUFBO0lBRUYsVUFBVSxDQUFHLFdBQVcsRUFBRTtRQUVyQixJQUFJLENBQUMsSUFBSSxFQUFHLENBQUE7SUFDakIsQ0FBQyxDQUFDLENBQUE7SUFFRjtJQUVBO0lBQ0E7SUFDQTtJQUNBO0lBRUEsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUUsS0FBSztRQUU3QixJQUFLLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLFNBQVM7WUFDakMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUcsS0FBSyxDQUFFLENBQUE7SUFDeEMsQ0FBQyxDQUFBO0lBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFFLENBQUMsRUFBRSxDQUFDO1FBRXBCLFVBQVUsQ0FBRyxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7SUFDL0MsQ0FBQyxDQUFBO0lBRUQ7SUFFQSxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUUsS0FBSztRQUV0QixLQUFLLENBQUMsS0FBSyxDQUFHLElBQUksQ0FBRSxDQUFBO1FBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtJQUNyQyxDQUFDLENBQUE7SUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUUsS0FBSztRQUVyQixLQUFLLENBQUMsS0FBSyxDQUFHLEtBQUssQ0FBRSxDQUFBO1FBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUcsQ0FBQTtJQUNyQyxDQUFDLENBQUE7SUFFRDtJQUVBLElBQUssU0FBUyxDQUFDLGNBQWMsR0FBRyxDQUFDLEVBQ2pDO1FBRUssTUFBTSxDQUFDLGdCQUFnQixDQUFHLGFBQWEsRUFBRSxLQUFLOzs7O1NBSzdDLENBQUMsQ0FBQTtLQUNOO1NBRUQ7UUFDSyxNQUFNLENBQUMsZ0JBQWdCLENBQUcsV0FBVyxFQUFFLEtBQUs7Ozs7U0FLM0MsQ0FBQyxDQUFBO0tBQ047O0lDaEdELFNBQVMsQ0FBRyxXQUFXLEVBQUU7UUFFcEIsS0FBSyxDQUFDLEtBQUssRUFBRyxDQUFBO1FBQ2QsY0FBYyxDQUFDLElBQUksRUFBRyxDQUFBO0lBQzNCLENBQUMsQ0FBQyxDQUFBO0lBQ0YsU0FBUyxDQUFHLFlBQVksRUFBRTtRQUVyQixJQUFJLENBQUMsS0FBSyxFQUFHLENBQUE7UUFDYixjQUFjLENBQUMsSUFBSSxFQUFHLENBQUE7SUFDM0IsQ0FBQyxDQUFDLENBQUE7O0lDakRGO0FBR0EsSUFFQSxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXO1FBRXRDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUM5RCxDQUFDLENBQUE7SUFFRCxNQUFNQyxNQUFJLEdBQUdDLElBQVEsQ0FBQTtJQUNyQixNQUFNLElBQUksR0FBR0QsTUFBSSxDQUFDLFVBQVUsQ0FBRyxhQUFhLENBQUUsQ0FBQTtBQUM5Q0EsVUFBSSxDQUFDLEdBQUcsQ0FBRyxJQUFJLENBQUUsQ0FBQTtJQUVqQjtJQUVBLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQTtJQUN0QixLQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRyxDQUFDLElBQUksRUFBRSxFQUFHLENBQUMsRUFBRSxFQUMvQjtRQUNLRSxPQUFXLENBQVk7WUFDbEIsSUFBSSxFQUFPLFFBQVE7WUFDbkIsRUFBRSxFQUFTLE1BQU0sR0FBRyxDQUFDO1lBQ3JCLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRztZQUNsQyxRQUFRLEVBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUc7WUFDakMsTUFBTSxFQUFLLGdCQUFnQixDQUFDLE9BQU87WUFDbkMsU0FBUyxFQUFFLFNBQVMsQ0FBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztTQUNuQyxDQUFDLENBQUE7UUFFRkEsT0FBVyxDQUFZO1lBQ2xCLElBQUksRUFBTyxRQUFRO1lBQ25CLEVBQUUsRUFBUyxNQUFNLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1QixTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUc7WUFDbEMsUUFBUSxFQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFHO1lBQ2pDLE1BQU0sRUFBSyxnQkFBZ0IsQ0FBQyxPQUFPO1lBQ25DLFNBQVMsRUFBRSxTQUFTLENBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDbkMsQ0FBQyxDQUFBO1FBRUYsV0FBVyxDQUFDLElBQUksQ0FBRyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUUsQ0FBQTs7O0tBSXREO0lBRUQ7SUFFQTtJQUNBO0lBQ0E7SUFFQTtJQUVBLE1BQU0sWUFBWSxHQUFHO1FBQ2hCLE9BQU8sRUFBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQVEsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxHQUFHLEVBQWEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFZLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsSUFBSSxFQUFZLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBVyxLQUFLLEVBQUUsR0FBRyxFQUFFO1FBQ25ELE9BQU8sRUFBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQVEsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxPQUFPLEVBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFRLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsV0FBVyxFQUFLLEVBQUUsRUFBRSxFQUFFLGFBQWEsRUFBSSxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BELGFBQWEsRUFBRyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxZQUFZLEVBQUksRUFBRSxFQUFFLEVBQUUsY0FBYyxFQUFHLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsT0FBTyxFQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBUSxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BELE9BQU8sRUFBUyxFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQVEsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxJQUFJLEVBQVksRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFXLEtBQUssRUFBRSxJQUFJLEVBQUU7UUFDcEQsS0FBSyxFQUFXLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBVSxLQUFLLEVBQUUsSUFBSSxFQUFFO1FBQ3BELElBQUksRUFBWSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQVcsS0FBSyxFQUFFLElBQUksRUFBRTtRQUNwRCxPQUFPLEVBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFRLEtBQUssRUFBRSxHQUFHLEVBQUU7S0FDdkQsQ0FBQTtJQUVELEtBQU0sTUFBTSxJQUFJLElBQUksWUFBWTtRQUMzQkEsT0FBVyxpQkFBSSxPQUFPLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxPQUFPLElBQU0sWUFBWSxDQUFFLElBQUksQ0FBQyxFQUFHLENBQUE7SUFFdEY7SUFFQSxLQUFNLE1BQU0sSUFBSSxJQUFJLFlBQVksRUFDaEM7UUFDSyxNQUFNLE1BQU0sR0FBRyxFQUFnQixDQUFBO1FBRS9CLEtBQU0sSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsRUFBRyxDQUFDLEdBQUcsQ0FBQyxFQUFHLENBQUMsRUFBRSxFQUM5QztZQUNLLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUcsU0FBUyxDQUFHLENBQUMsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFFLEVBQUUsQ0FBQyxDQUFFLENBQUUsQ0FBQyxDQUFDLENBQUE7WUFFOUUsSUFBSyxJQUFJO2dCQUNKLE1BQU0sQ0FBQyxJQUFJLENBQUdDLE9BQVcsQ0FBYSxRQUFRLEVBQUUsSUFBSSxDQUFFLENBQUUsQ0FBQTtTQUNqRTtRQUVERCxPQUFXLENBQVc7WUFDakIsT0FBTyxFQUFFLGNBQWM7WUFDdkIsSUFBSSxFQUFLLE9BQU87WUFDaEIsRUFBRSxFQUFPLElBQUk7WUFDYixJQUFJLEVBQUssSUFBSTtZQUNiLEtBQUssRUFBSSxNQUFNO1NBQ25CLENBQUMsQ0FBQTtLQUVOO0lBRUQ7SUFFQSxLQUFNLE1BQU0sSUFBSSxJQUFJLFlBQVk7UUFDM0JGLE1BQUksQ0FBQyxHQUFHLENBQUcsT0FBTyxFQUFFLElBQUksQ0FBRSxDQUFBO0lBRS9CO0lBRUE7SUFDQTtJQUNBO0lBQ0E7QUFHQUEsVUFBSSxDQUFDLElBQUksRUFBRyxDQUFBO0FBQ1pBLFVBQUksQ0FBQyxJQUFJLEVBQUcsQ0FBQTtJQUdaO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLHlCQUF5Qjs7OzsifQ==
