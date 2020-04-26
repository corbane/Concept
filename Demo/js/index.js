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
        // To get triangle, square, [panta|hexa]gon points
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9ldmVudC50cyIsIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvRGF0YS9ub2RlLnRzIiwiLi4vLi4vRGF0YS9EYi9kYXRhLXRyZWUudHMiLCIuLi8uLi9EYXRhL0RiL2RiLnRzIiwiLi4vLi4vRGF0YS9EYi9mYWN0b3J5LnRzIiwiLi4vLi4vVWkvQmFzZS94bm9kZS50cyIsIi4uLy4uL1VpL0Jhc2UvZHJhZ2dhYmxlLnRzIiwiLi4vLi4vVWkvQmFzZS9kb20udHMiLCIuLi8uLi9VaS9CYXNlL2V4cGVuZGFibGUudHMiLCIuLi8uLi9VaS9CYXNlL3N3aXBlYWJsZS50cyIsIi4uLy4uL1VpL0Jhc2UvY29tbWFuZC50cyIsIi4uLy4uL1VpL0Jhc2UvQ29tcG9uZW50L2luZGV4LnRzeCIsIi4uLy4uL1VpL2RiLnRzIiwiLi4vLi4vVWkvQ29tcG9uZW50L1BoYW50b20vaW5kZXgudHN4IiwiLi4vLi4vVWkvQmFzZS9Db250YWluZXIvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0Jhci9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvQnV0dG9uL2h0bWwudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0J1dHRvbi9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvU2xpZGVzaG93L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9MaXN0L2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9Ub29sYmFyL2luZGV4LnRzeCIsIi4uLy4uL1VpL0Jhc2Uvc2Nyb2xsYWJsZS50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9QYW5lbC9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvU2lkZU1lbnUvaW5kZXgudHN4IiwiLi4vLi4vVWkvQmFzZS9TdmcvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0NpcmN1bGFyLU1lbnUvaW5kZXgudHN4IiwiLi4vLi4vVWkvRW50aXR5L1BlcnNvbi9pbmZvcy50c3giLCIuLi8uLi9BcHBsaWNhdGlvbi9EYXRhL2RiLnRzIiwiLi4vLi4vVWkvRW50aXR5L1NraWxsL2luZm9zLnRzeCIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9HZW9tZXRyeS9mYWN0b3J5LnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0dlb21ldHJ5L2dlb21ldHJ5LnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L0VsZW1lbnQvc2hhcGUudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvZGIudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvRWxlbWVudC9iYWRnZS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L2dyb3VwLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vY29tbWFuZC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9pbmRleC50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL21lbnUudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9wYW5lbC50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9hcmVhLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vaW5kZXgudHMiLCIuLi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcblxuZXhwb3J0IGludGVyZmFjZSBJRXZlbnQgPEYgZXh0ZW5kcyAoIC4uLmFyZ3M6IGFueVtdICkgPT4gdm9pZCA9ICgpID0+IHZvaWQ+XG57XG4gICAgKCBjYWxsYmFjazogRiApOiB2b2lkXG4gICAgZW5hYmxlICgpOiB0aGlzXG4gICAgZGlzYWJsZSAoKTogdGhpc1xuICAgIGRpc3BhdGNoICggLi4uYXJnczogUGFyYW1ldGVycyA8Rj4gKTogdGhpc1xuICAgIHJlbW92ZSAoIGNhbGxiYWNrOiBGICk6IHRoaXNcbiAgICBjb3VudCAoKTogbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUgPEYgZXh0ZW5kcyAoKCAuLi5hcmdzOiBhbnlbXSApID0+IHZvaWQpID0gKCgpID0+IHZvaWQpPiAoKTogSUV2ZW50IDxGPlxue1xuICAgIGNvbnN0IHJlZ2lzdGVyID0gW10gYXMgRltdXG4gICAgdmFyICAgZW5hYmxlZCAgPSB0cnVlXG5cbiAgICBjb25zdCBzZWxmID0gZnVuY3Rpb24gKCBjYWxsYmFjazogRiApXG4gICAge1xuICAgICAgICByZWdpc3Rlci5wdXNoICggY2FsbGJhY2sgKSAtIDFcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYuY291bnQgPSAoKSA9PlxuICAgIHtcbiAgICAgICAgcmV0dXJuIHJlZ2lzdGVyLmxlbmd0aFxuICAgIH1cblxuICAgIHNlbGYuZGlzYWJsZSA9ICgpID0+XG4gICAge1xuICAgICAgICBlbmFibGVkID0gZmFsc2VcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYuZW5hYmxlID0gKCkgPT5cbiAgICB7XG4gICAgICAgIGVuYWJsZWQgPSB0cnVlXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLmFwcGVuZCA9ICggY2FsbGJhY2s6IEYgKSA9PlxuICAgIHtcbiAgICAgICAgc2VsZiAoIGNhbGxiYWNrIClcblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHNlbGYucmVtb3ZlID0gKCBjYWxsYmFjazogRiApID0+XG4gICAge1xuICAgICAgICBjb25zdCBpbmRleCA9IHJlZ2lzdGVyLmluZGV4T2YgKCBjYWxsYmFjayApXG5cbiAgICAgICAgaWYgKCBpbmRleCAhPSAtMSApXG4gICAgICAgICAgICByZWdpc3Rlci5zcGxpY2UgKCBpbmRleCwgMSApXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLnJlbW92ZUFsbCA9ICgpID0+XG4gICAge1xuICAgICAgICByZWdpc3Rlci5zcGxpY2UgKDApXG5cbiAgICAgICAgcmV0dXJuIHNlbGZcbiAgICB9XG5cbiAgICBzZWxmLmRpc3BhdGNoID0gKCAuLi5hcmdzOiBQYXJhbWV0ZXJzIDxGPiApID0+XG4gICAge1xuICAgICAgICBpZiAoIGVuYWJsZWQgKVxuICAgICAgICB7XG4gICAgICAgICAgICBmb3IoIHZhciBmbiBvZiByZWdpc3RlciApXG4gICAgICAgICAgICAgICAgZm4gKCAuLi4gYXJncyApXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2VsZlxuICAgIH1cblxuICAgIHJldHVybiBzZWxmXG59XG5cbiIsIlxuXG5leHBvcnQgdHlwZSBSYWRpYWxPcHRpb24gPSB7XG4gICAgciAgICAgICAgOiBudW1iZXIsXG4gICAgY291bnQgICAgOiBudW1iZXIsXG4gICAgcGFkZGluZz8gOiBudW1iZXIsXG4gICAgcm90YXRpb24/OiBudW1iZXIsXG59XG5cbmV4cG9ydCB0eXBlIFJhZGlhbERlZmluaXRpb24gPSBSZXF1aXJlZCA8UmFkaWFsT3B0aW9uPiAmIHtcbiAgICBjeCAgICA6IG51bWJlcixcbiAgICBjeSAgICA6IG51bWJlcixcbiAgICB3aWR0aCA6IG51bWJlcixcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICBwb2ludHM6IFBhcnQgW10sXG59XG5cbnR5cGUgUGFydCA9IHtcbiAgICB4IDogbnVtYmVyXG4gICAgeSA6IG51bWJlclxuICAgIGEgOiBudW1iZXJcbiAgICBhMTogbnVtYmVyXG4gICAgYTI6IG51bWJlclxuICAgIGNob3JkPzoge1xuICAgICAgICB4MSAgICA6IG51bWJlclxuICAgICAgICB5MSAgICA6IG51bWJlclxuICAgICAgICB4MiAgICA6IG51bWJlclxuICAgICAgICB5MiAgICA6IG51bWJlclxuICAgICAgICBsZW5ndGg6IG51bWJlclxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIG9wdGlvbnM6IFJhZGlhbE9wdGlvbiApXG57XG4gICAgY29uc3QgeyBQSSwgY29zLCBzaW4gfSA9IE1hdGhcblxuICAgIGNvbnN0IHIgICAgICAgID0gb3B0aW9ucy5yICAgICAgICB8fCAzMFxuICAgIGNvbnN0IGNvdW50ICAgID0gb3B0aW9ucy5jb3VudCAgICB8fCAxMFxuICAgIGNvbnN0IHJvdGF0aW9uID0gb3B0aW9ucy5yb3RhdGlvbiB8fCAwXG5cbiAgICBjb25zdCBwb2ludHMgPSBbXSBhcyBQYXJ0IFtdXG5cbiAgICBjb25zdCBhICAgICA9IDIgKiBQSSAvIGNvdW50XG4gICAgY29uc3QgY2hvcmQgPSAyICogciAqIHNpbiAoIGEgKiAwLjUgKVxuICAgIGNvbnN0IHNpemUgID0gciAqIDQgKyBjaG9yZFxuICAgIGNvbnN0IGMgICAgID0gc2l6ZSAvIDJcblxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kgKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgID0gYSAqIGkgKyByb3RhdGlvblxuICAgICAgICBjb25zdCBtaWRkbGUgPSBzdGFydCArIGEgKiAwLjVcbiAgICAgICAgY29uc3QgZW5kICAgID0gc3RhcnQgKyBhXG5cbiAgICAgICAgcG9pbnRzLnB1c2ggKHtcbiAgICAgICAgICAgIGExICAgOiBzdGFydCxcbiAgICAgICAgICAgIGEgICAgOiBtaWRkbGUsXG4gICAgICAgICAgICBhMiAgIDogZW5kLFxuICAgICAgICAgICAgeCAgICA6IGNvcyAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgeSAgICA6IHNpbiAobWlkZGxlKSAqIHIgKyBjLFxuICAgICAgICAgICAgY2hvcmQ6IHtcbiAgICAgICAgICAgICAgICB4MTogY29zIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5MTogc2luIChzdGFydCkgKiByICsgYyxcbiAgICAgICAgICAgICAgICB4MjogY29zIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICB5Mjogc2luIChlbmQpICAgKiByICsgYyxcbiAgICAgICAgICAgICAgICBsZW5ndGg6IGNob3JkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0OiBSYWRpYWxEZWZpbml0aW9uID0ge1xuICAgICAgICByLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgcm90YXRpb24sXG4gICAgICAgIHBhZGRpbmc6IG9wdGlvbnMucGFkZGluZyB8fCAwLFxuICAgICAgICBjeCAgICAgOiBjLFxuICAgICAgICBjeSAgICAgOiBjLFxuICAgICAgICB3aWR0aCAgOiBzaXplLFxuICAgICAgICBoZWlnaHQgOiBzaXplLFxuICAgICAgICBwb2ludHNcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0XG59XG4iLCIvLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2QzLXBhY2tlbmNsb3NlP2NvbGxlY3Rpb249QG9ic2VydmFibGVocS9hbGdvcml0aG1zXG4vLyBodHRwczovL29ic2VydmFibGVocS5jb20vQGQzL2NpcmNsZS1wYWNraW5nXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL2VuY2xvc2UuanNcblxuXG5leHBvcnQgdHlwZSBDaXJjbGUgPSB7XG4gICAgIHg6IG51bWJlcixcbiAgICAgeTogbnVtYmVyLFxuICAgICByOiBudW1iZXJcbn1cblxuY29uc3Qgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxuZnVuY3Rpb24gc2h1ZmZsZSA8VD4gKCBhcnJheTogVFtdIClcbntcbiAgICAgdmFyIG0gPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgdCxcbiAgICAgICAgICBpOiBudW1iZXJcblxuICAgICB3aGlsZSAoIG0gKVxuICAgICB7XG4gICAgICAgICAgaSA9IE1hdGgucmFuZG9tICgpICogbS0tIHwgMFxuICAgICAgICAgIHQgPSBhcnJheSBbbV1cbiAgICAgICAgICBhcnJheSBbbV0gPSBhcnJheSBbaV1cbiAgICAgICAgICBhcnJheSBbaV0gPSB0XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJyYXlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuY2xvc2UgKCBjaXJjbGVzOiBDaXJjbGVbXSApXG57XG4gICAgIGNpcmNsZXMgPSBzaHVmZmxlICggc2xpY2UuY2FsbCggY2lyY2xlcyApIClcblxuICAgICBjb25zdCBuID0gY2lyY2xlcy5sZW5ndGhcblxuICAgICB2YXIgaSA9IDAsXG4gICAgIEIgPSBbXSxcbiAgICAgcDogQ2lyY2xlLFxuICAgICBlOiBDaXJjbGU7XG5cbiAgICAgd2hpbGUgKCBpIDwgbiApXG4gICAgIHtcbiAgICAgICAgICBwID0gY2lyY2xlcyBbaV1cblxuICAgICAgICAgIGlmICggZSAmJiBlbmNsb3Nlc1dlYWsgKCBlLCBwICkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgQiA9IGV4dGVuZEJhc2lzICggQiwgcCApXG4gICAgICAgICAgICAgICBlID0gZW5jbG9zZUJhc2lzICggQiApXG4gICAgICAgICAgICAgICBpID0gMFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHJldHVybiBlXG59XG5cbmZ1bmN0aW9uIGV4dGVuZEJhc2lzICggQjogQ2lyY2xlW10sIHA6IENpcmNsZSApXG57XG4gICAgIHZhciBpOiBudW1iZXIsXG4gICAgIGo6IG51bWJlclxuXG4gICAgIGlmICggZW5jbG9zZXNXZWFrQWxsICggcCwgQiApIClcbiAgICAgICAgICByZXR1cm4gW3BdXG5cbiAgICAgLy8gSWYgd2UgZ2V0IGhlcmUgdGhlbiBCIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgZWxlbWVudC5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgKCBwLCBCIFtpXSApXG4gICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICksIEIgKVxuICAgICAgICAgICl7XG4gICAgICAgICAgICAgICByZXR1cm4gWyBCW2ldLCBwIF1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBlbGVtZW50cy5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBCLmxlbmd0aCAtIDE7ICsraSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBqID0gaSArIDE7IGogPCBCLmxlbmd0aDsgKytqIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBCIFtqXSAgICApLCBwIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2ldLCBwICAgICAgICApLCBCIFtqXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc05vdCAgICAoIGVuY2xvc2VCYXNpczIgKCBCIFtqXSwgcCAgICAgICAgKSwgQiBbaV0gKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNXZWFrQWxsKCBlbmNsb3NlQmFzaXMzICggQiBbaV0sIEIgW2pdLCBwICksIEIgKVxuICAgICAgICAgICAgICAgKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgQlsgaSBdLCBCWyBqIF0sIHAgXTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIHNvbWV0aGluZyBpcyB2ZXJ5IHdyb25nLlxuICAgICB0aHJvdyBuZXcgRXJyb3I7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzTm90ICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCBkciA9IGEuciAtIGIuclxuICAgICBjb25zdCBkeCA9IGIueCAtIGEueFxuICAgICBjb25zdCBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA8IDAgfHwgZHIgKiBkciA8IGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5mdW5jdGlvbiBlbmNsb3Nlc1dlYWsgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciAtIGIuciArIDFlLTYsXG4gICAgIGR4ID0gYi54IC0gYS54LFxuICAgICBkeSA9IGIueSAtIGEueVxuXG4gICAgIHJldHVybiBkciA+IDAgJiYgZHIgKiBkciA+IGR4ICogZHggKyBkeSAqIGR5XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2Vha0FsbCAoIGE6IENpcmNsZSwgQjogQ2lyY2xlW10gKVxue1xuICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBCLmxlbmd0aDsgKytpIClcbiAgICAge1xuICAgICAgICAgIGlmICggISBlbmNsb3Nlc1dlYWsgKCBhLCBCW2ldICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgIH1cbiAgICAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gZW5jbG9zZUJhc2lzICggQjogQ2lyY2xlW10gKVxue1xuICAgICBzd2l0Y2ggKCBCLmxlbmd0aCApXG4gICAgIHtcbiAgICAgICAgICBjYXNlIDE6IHJldHVybiBlbmNsb3NlQmFzaXMxKCBCIFswXSApXG4gICAgICAgICAgY2FzZSAyOiByZXR1cm4gZW5jbG9zZUJhc2lzMiggQiBbMF0sIEIgWzFdIClcbiAgICAgICAgICBjYXNlIDM6IHJldHVybiBlbmNsb3NlQmFzaXMzKCBCIFswXSwgQiBbMV0sIEIgWzJdIClcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMxICggYTogQ2lyY2xlIClcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiBhLngsXG4gICAgICAgICAgeTogYS55LFxuICAgICAgICAgIHI6IGEuclxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMyICggYTogQ2lyY2xlLCBiOiBDaXJjbGUgKVxue1xuICAgICBjb25zdCB7IHg6IHgxLCB5OiB5MSwgcjogcjEgfSA9IGFcbiAgICAgY29uc3QgeyB4OiB4MiwgeTogeTIsIHI6IHIyIH0gPSBiXG5cbiAgICAgdmFyIHgyMSA9IHgyIC0geDEsXG4gICAgIHkyMSA9IHkyIC0geTEsXG4gICAgIHIyMSA9IHIyIC0gcjEsXG4gICAgIGwgICA9IE1hdGguc3FydCggeDIxICogeDIxICsgeTIxICogeTIxICk7XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4OiAoIHgxICsgeDIgKyB4MjEgLyBsICogcjIxICkgLyAyLFxuICAgICAgICAgIHk6ICggeTEgKyB5MiArIHkyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgcjogKCBsICsgcjEgKyByMiApIC8gMlxuICAgICB9O1xufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMzICggYTogQ2lyY2xlLCBiOiBDaXJjbGUsIGM6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcbiAgICAgY29uc3QgeyB4OiB4MywgeTogeTMsIHI6IHIzIH0gPSBjXG5cbiAgICAgY29uc3QgYTIgPSB4MSAtIHgyLFxuICAgICAgICAgICAgICAgYTMgPSB4MSAtIHgzLFxuICAgICAgICAgICAgICAgYjIgPSB5MSAtIHkyLFxuICAgICAgICAgICAgICAgYjMgPSB5MSAtIHkzLFxuICAgICAgICAgICAgICAgYzIgPSByMiAtIHIxLFxuICAgICAgICAgICAgICAgYzMgPSByMyAtIHIxLFxuXG4gICAgICAgICAgICAgICBkMSA9IHgxICogeDEgKyB5MSAqIHkxIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIGQyID0gZDEgLSB4MiAqIHgyIC0geTIgKiB5MiArIHIyICogcjIsXG4gICAgICAgICAgICAgICBkMyA9IGQxIC0geDMgKiB4MyAtIHkzICogeTMgKyByMyAqIHIzLFxuXG4gICAgICAgICAgICAgICBhYiA9IGEzICogYjIgLSBhMiAqIGIzLFxuICAgICAgICAgICAgICAgeGEgPSAoIGIyICogZDMgLSBiMyAqIGQyICkgLyAoIGFiICogMiApIC0geDEsXG4gICAgICAgICAgICAgICB4YiA9ICggYjMgKiBjMiAtIGIyICogYzMgKSAvIGFiLFxuICAgICAgICAgICAgICAgeWEgPSAoIGEzICogZDIgLSBhMiAqIGQzICkgLyAoIGFiICogMiApIC0geTEsXG4gICAgICAgICAgICAgICB5YiA9ICggYTIgKiBjMyAtIGEzICogYzIgKSAvIGFiLFxuXG4gICAgICAgICAgICAgICBBICA9IHhiICogeGIgKyB5YiAqIHliIC0gMSxcbiAgICAgICAgICAgICAgIEIgID0gMiAqICggcjEgKyB4YSAqIHhiICsgeWEgKiB5YiApLFxuICAgICAgICAgICAgICAgQyAgPSB4YSAqIHhhICsgeWEgKiB5YSAtIHIxICogcjEsXG4gICAgICAgICAgICAgICByICA9IC0oIEEgPyAoIEIgKyBNYXRoLnNxcnQoIEIgKiBCIC0gNCAqIEEgKiBDICkgKSAvICggMiAqIEEgKSA6IEMgLyBCIClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IHgxICsgeGEgKyB4YiAqIHIsXG4gICAgICAgICAgeTogeTEgKyB5YSArIHliICogcixcbiAgICAgICAgICByOiByXG4gICAgIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kMy1lbmNsb3NlLnRzXCIgLz5cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWhpZXJhcmNoeS9ibG9iL21hc3Rlci9zcmMvcGFjay9zaWJsaW5ncy5qc1xuXG5pbXBvcnQgeyBlbmNsb3NlLCBDaXJjbGUgfSBmcm9tIFwiLi9kMy1lbmNsb3NlLmpzXCJcblxuZnVuY3Rpb24gcGxhY2UgKCBiOiBDaXJjbGUsIGE6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgdmFyIGR4ID0gYi54IC0gYS54LFxuICAgICAgICAgIHg6IG51bWJlcixcbiAgICAgICAgICBhMjogbnVtYmVyLFxuICAgICAgICAgIGR5ID0gYi55IC0gYS55LFxuICAgICAgICAgIHkgOiBudW1iZXIsXG4gICAgICAgICAgYjI6IG51bWJlcixcbiAgICAgICAgICBkMiA9IGR4ICogZHggKyBkeSAqIGR5XG5cbiAgICAgaWYgKCBkMiApXG4gICAgIHtcbiAgICAgICAgICBhMiA9IGEuciArIGMuciwgYTIgKj0gYTJcbiAgICAgICAgICBiMiA9IGIuciArIGMuciwgYjIgKj0gYjJcblxuICAgICAgICAgIGlmICggYTIgPiBiMiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBiMiAtIGEyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYjIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYi54IC0geCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBiLnkgLSB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHggPSAoIGQyICsgYTIgLSBiMiApIC8gKCAyICogZDIgKVxuICAgICAgICAgICAgICAgeSA9IE1hdGguc3FydCggTWF0aC5tYXgoIDAsIGEyIC8gZDIgLSB4ICogeCApIClcbiAgICAgICAgICAgICAgIGMueCA9IGEueCArIHggKiBkeCAtIHkgKiBkeVxuICAgICAgICAgICAgICAgYy55ID0gYS55ICsgeCAqIGR5ICsgeSAqIGR4XG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIGMueCA9IGEueCArIGMuclxuICAgICAgICAgIGMueSA9IGEueVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGludGVyc2VjdHMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIHZhciBkciA9IGEuciArIGIuciAtIDFlLTYsIGR4ID0gYi54IC0gYS54LCBkeSA9IGIueSAtIGEueTtcbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIHNjb3JlICggbm9kZTogTm9kZSApXG57XG4gICAgIHZhciBhID0gbm9kZS5fLFxuICAgICAgICAgIGIgPSBub2RlLm5leHQuXyxcbiAgICAgICAgICBhYiA9IGEuciArIGIucixcbiAgICAgICAgICBkeCA9ICggYS54ICogYi5yICsgYi54ICogYS5yICkgLyBhYixcbiAgICAgICAgICBkeSA9ICggYS55ICogYi5yICsgYi55ICogYS5yICkgLyBhYjtcbiAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xufVxuXG5jbGFzcyBOb2RlXG57XG4gICAgIG5leHQgICAgID0gbnVsbCBhcyBOb2RlXG4gICAgIHByZXZpb3VzID0gbnVsbCBhcyBOb2RlXG4gICAgIGNvbnN0cnVjdG9yICggcHVibGljIF86IENpcmNsZSApIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrRW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgaWYgKCAhKCBuID0gY2lyY2xlcy5sZW5ndGggKSApIHJldHVybiAwO1xuXG4gICAgIHZhciBhLCBiLCBjIC8qOiBOb2RlICYgQ2lyY2xlKi8sIG4sIGFhLCBjYSwgaSwgaiwgaywgc2osIHNrO1xuXG4gICAgIC8vIFBsYWNlIHRoZSBmaXJzdCBjaXJjbGUuXG4gICAgIGEgPSBjaXJjbGVzWyAwIF0sIGEueCA9IDAsIGEueSA9IDA7XG4gICAgIGlmICggISggbiA+IDEgKSApIHJldHVybiBhLnI7XG5cbiAgICAgLy8gUGxhY2UgdGhlIHNlY29uZCBjaXJjbGUuXG4gICAgIGIgPSBjaXJjbGVzWyAxIF0sIGEueCA9IC1iLnIsIGIueCA9IGEuciwgYi55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMiApICkgcmV0dXJuIGEuciArIGIucjtcblxuICAgICAvLyBQbGFjZSB0aGUgdGhpcmQgY2lyY2xlLlxuICAgICBwbGFjZSggYiwgYSwgYyA9IGNpcmNsZXNbIDIgXSApO1xuXG4gICAgIC8vIEluaXRpYWxpemUgdGhlIGZyb250LWNoYWluIHVzaW5nIHRoZSBmaXJzdCB0aHJlZSBjaXJjbGVzIGEsIGIgYW5kIGMuXG4gICAgIGEgPSBuZXcgTm9kZSggYSApLCBiID0gbmV3IE5vZGUoIGIgKSwgYyA9IG5ldyBOb2RlKCBjICk7XG4gICAgIGEubmV4dCA9IGMucHJldmlvdXMgPSBiO1xuICAgICBiLm5leHQgPSBhLnByZXZpb3VzID0gYztcbiAgICAgYy5uZXh0ID0gYi5wcmV2aW91cyA9IGE7XG5cbiAgICAgLy8gQXR0ZW1wdCB0byBwbGFjZSBlYWNoIHJlbWFpbmluZyBjaXJjbGXigKZcbiAgICAgcGFjazogZm9yICggaSA9IDM7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgcGxhY2UoIGEuXywgYi5fLCBjID0gY2lyY2xlc1sgaSBdICksIGMgPSBuZXcgTm9kZSggYyApO1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgY2xvc2VzdCBpbnRlcnNlY3RpbmcgY2lyY2xlIG9uIHRoZSBmcm9udC1jaGFpbiwgaWYgYW55LlxuICAgICAgICAgIC8vIOKAnENsb3NlbmVzc+KAnSBpcyBkZXRlcm1pbmVkIGJ5IGxpbmVhciBkaXN0YW5jZSBhbG9uZyB0aGUgZnJvbnQtY2hhaW4uXG4gICAgICAgICAgLy8g4oCcQWhlYWTigJ0gb3Ig4oCcYmVoaW5k4oCdIGlzIGxpa2V3aXNlIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlLlxuICAgICAgICAgIGogPSBiLm5leHQsIGsgPSBhLnByZXZpb3VzLCBzaiA9IGIuXy5yLCBzayA9IGEuXy5yO1xuICAgICAgICAgIGRvXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBzaiA8PSBzayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggai5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBiID0gaiwgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNqICs9IGouXy5yLCBqID0gai5uZXh0O1xuICAgICAgICAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW50ZXJzZWN0cyggay5fLCBjLl8gKSApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBhID0gaywgYS5uZXh0ID0gYiwgYi5wcmV2aW91cyA9IGEsIC0taTtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBwYWNrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNrICs9IGsuXy5yLCBrID0gay5wcmV2aW91cztcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9IHdoaWxlICggaiAhPT0gay5uZXh0ICk7XG5cbiAgICAgICAgICAvLyBTdWNjZXNzISBJbnNlcnQgdGhlIG5ldyBjaXJjbGUgYyBiZXR3ZWVuIGEgYW5kIGIuXG4gICAgICAgICAgYy5wcmV2aW91cyA9IGEsIGMubmV4dCA9IGIsIGEubmV4dCA9IGIucHJldmlvdXMgPSBiID0gYztcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG5ldyBjbG9zZXN0IGNpcmNsZSBwYWlyIHRvIHRoZSBjZW50cm9pZC5cbiAgICAgICAgICBhYSA9IHNjb3JlKCBhICk7XG4gICAgICAgICAgd2hpbGUgKCAoIGMgPSBjLm5leHQgKSAhPT0gYiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAoIGNhID0gc2NvcmUoIGMgKSApIDwgYWEgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhID0gYyxcbiAgICAgICAgICAgICAgICAgICAgYWEgPSBjYTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYiA9IGEubmV4dDtcbiAgICAgfVxuXG4gICAgIC8vIENvbXB1dGUgdGhlIGVuY2xvc2luZyBjaXJjbGUgb2YgdGhlIGZyb250IGNoYWluLlxuICAgICBhID0gWyBiLl8gXVxuICAgICBjID0gYlxuICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICBhLnB1c2goIGMuXyApO1xuICAgICBjID0gZW5jbG9zZSggYSApXG5cbiAgICAgLy8gVHJhbnNsYXRlIHRoZSBjaXJjbGVzIHRvIHB1dCB0aGUgZW5jbG9zaW5nIGNpcmNsZSBhcm91bmQgdGhlIG9yaWdpbi5cbiAgICAgZm9yICggaSA9IDA7IGkgPCBuOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgYSA9IGNpcmNsZXNbIGkgXSxcbiAgICAgICAgICBhLnggLT0gYy54LFxuICAgICAgICAgIGEueSAtPSBjLnlcbiAgICAgfVxuXG4gICAgIHJldHVybiBjLnIgYXMgbnVtYmVyXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYWNrQ2lyY2xlcyAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgcGFja0VuY2xvc2UoIGNpcmNsZXMgKTtcbiAgICAgcmV0dXJuIGNpcmNsZXMgYXMgQ2lyY2xlW107XG59XG4iLCJcclxuXHJcbmV4cG9ydCB0eXBlIFVuaXRcclxuICAgID0gXCIlXCJcclxuICAgIHwgXCJweFwiIHwgXCJwdFwiIHwgXCJlbVwiIHwgXCJyZW1cIiB8IFwiaW5cIiB8IFwiY21cIiB8IFwibW1cIlxyXG4gICAgfCBcImV4XCIgfCBcImNoXCIgfCBcInBjXCJcclxuICAgIHwgXCJ2d1wiIHwgXCJ2aFwiIHwgXCJ2bWluXCIgfCBcInZtYXhcIlxyXG4gICAgfCBcImRlZ1wiIHwgXCJyYWRcIiB8IFwidHVyblwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pdCAoIHZhbHVlOiBhbnkgKTogVW5pdCB8IHVuZGVmaW5lZFxyXG57XHJcbiAgICBpZiAoIHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIClcclxuICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxyXG5cclxuICAgIGNvbnN0IHNwbGl0ID0gL1srLV0/XFxkKlxcLj9cXGQrKD86XFwuXFxkKyk/KD86W2VFXVsrLV0/XFxkKyk/KCV8cHh8cHR8ZW18cmVtfGlufGNtfG1tfGV4fGNofHBjfHZ3fHZofHZtaW58dm1heHxkZWd8cmFkfHR1cm4pPyQvXHJcbiAgICAgICAgICAgICAgLmV4ZWMoIHZhbHVlICk7XHJcblxyXG4gICAgaWYgKCBzcGxpdCApXHJcbiAgICAgICAgIHJldHVybiBzcGxpdCBbMV0gYXMgVW5pdFxyXG5cclxuICAgIHJldHVybiB1bmRlZmluZWRcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1Vbml0ICggcHJvcE5hbWU6IHN0cmluZyApXHJcbntcclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAndHJhbnNsYXRlJyApIHx8IHByb3BOYW1lID09PSAncGVyc3BlY3RpdmUnIClcclxuICAgICAgICByZXR1cm4gJ3B4J1xyXG5cclxuICAgIGlmICggcHJvcE5hbWUuaW5jbHVkZXMgKCAncm90YXRlJyApIHx8IHByb3BOYW1lLmluY2x1ZGVzICggJ3NrZXcnICkgKVxyXG4gICAgICAgIHJldHVybiAnZGVnJ1xyXG59IiwiXG4vLyBodHRwczovL2dpdGh1Yi5jb20vcmRmanMtYmFzZS9kYXRhLW1vZGVsL3RyZWUvbWFzdGVyL2xpYlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICROb2RlXG4gICAgIHtcbiAgICAgICAgICByZWFkb25seSBjb250ZXh0OiBzdHJpbmdcbiAgICAgICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcbiAgICAgICAgICByZWFkb25seSBpZDogc3RyaW5nXG4gICAgIH1cblxuICAgICBleHBvcnQgaW50ZXJmYWNlICRDbHVzdGVyIDwkQ2hpbGQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiBleHRlbmRzICROb2RlXG4gICAgIHtcbiAgICAgICAgICBjaGlsZHJlbj86ICRDaGlsZCBbXVxuICAgICB9XG59XG5cbnZhciBuZXh0SWQgPSAwXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlIDxEIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCBleHRlbmRzIHN0cmluZyA9IEQgW1widHlwZVwiXT4gKCB0eXBlOiBULCBpZDogc3RyaW5nLCBkYXRhOiBQYXJ0aWFsIDxPbWl0IDxELCBcInR5cGVcIiB8IFwiaWRcIj4+IClcbntcbiAgICAgdHlwZSBOID0geyAtcmVhZG9ubHkgW0sgaW4ga2V5b2YgRF06IERbS10gfVxuXG4gICAgIDsoZGF0YSBhcyBOKS50eXBlID0gdHlwZVxuICAgICA7KGRhdGEgYXMgTikuaWQgICA9IGlkIHx8ICgrK25leHRJZCkudG9TdHJpbmcgKClcbiAgICAgcmV0dXJuIGRhdGEgYXMgRFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VUlkICggbm9kZTogJE5vZGUgKVxue1xuICAgICByZXR1cm4gbm9kZS5jb250ZXh0ICsgJyMnICsgbm9kZS50eXBlICsgJzonICsgbm9kZS5pZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxOb2RlcyAoIGE6ICROb2RlLCBiOiAkTm9kZSApXG57XG4gICAgIHJldHVybiAhIWEgJiYgISFiXG4gICAgICAgICAgJiYgYS50eXBlID09PSBiLnR5cGVcbiAgICAgICAgICAmJiBhLmlkICAgPT09IGIuaWRcbn1cblxuLypleHBvcnQgY2xhc3MgTm9kZSA8RCBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgZXh0ZW5kcyBzdHJpbmcgPSBEIFtcInR5cGVcIl0+XG57XG4gICAgIHN0YXRpYyBuZXh0SWQgPSAwXG5cbiAgICAgcmVhZG9ubHkgdHlwZTogc3RyaW5nXG5cbiAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZ1xuXG4gICAgIHJlYWRvbmx5IHVpZDogbnVtYmVyXG5cbiAgICAgcmVhZG9ubHkgZGF0YTogRFxuXG4gICAgIGRlZmF1bHREYXRhICgpOiAkTm9kZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcIm5vZGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6IEQgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy50eXBlID0gZGF0YS50eXBlXG4gICAgICAgICAgdGhpcy51aWQgID0gKytOb2RlLm5leHRJZFxuICAgICAgICAgIHRoaXMuaWQgICA9IGRhdGEuaWQgfHwgKGRhdGEuaWQgPSB0aGlzLnVpZC50b1N0cmluZyAoKSlcblxuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKCB0aGlzLmRlZmF1bHREYXRhICgpLCBkYXRhIGFzIEQgKVxuICAgICB9XG5cbiAgICAgZXF1YWxzICggb3RoZXI6IE5vZGUgPGFueT4gKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuICEhb3RoZXJcbiAgICAgICAgICAgICAgICYmIG90aGVyLnR5cGUgPT09IHRoaXMudHlwZVxuICAgICAgICAgICAgICAgJiYgb3RoZXIuaWQgICA9PT0gdGhpcy5pZFxuICAgICB9XG5cbiAgICAgdG9Kc29uICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkgKCB0aGlzLmRhdGEgKVxuICAgICB9XG59Ki9cbiIsIlxuZXhwb3J0IHR5cGUgUGF0aCA9IHtcbiAgICAgbGVuZ3RoOiBudW1iZXJcbiAgICAgW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhVHJlZSA8VD5cbntcbiAgICAgcmVjb3JkcyA9IHt9IGFzIHtcbiAgICAgICAgICBbY29udGV4dDogc3RyaW5nXTogVCB8IHtcbiAgICAgICAgICAgICAgIFt0eXBlOiBzdHJpbmddOiBUIHwge1xuICAgICAgICAgICAgICAgICAgICBbaWQ6IHN0cmluZ106IFRcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBoYXMgKCBwYXRoOiBQYXRoICkgIDogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICB2YXIgY291bnQgPSAwXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvdW50ICsrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBwYXRoLmxlbmd0aCA9PSBjb3VudFxuICAgICB9XG5cbiAgICAgY291bnQgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIHZhciAgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZCBpbiByZWNcbiAgICAgICAgICAgICAgID8gT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGggLSAxXG4gICAgICAgICAgICAgICA6IE9iamVjdC5rZXlzICggcmVjICkubGVuZ3RoXG5cbiAgICAgfVxuXG4gICAgIHNldCAoIHBhdGg6IFBhdGgsIGRhdGE6IFQgKTogVFxuICAgICB7XG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG4gICAgICAgICAgdmFyICAgcmVjICA9IHRoaXMucmVjb3JkcyBhcyBhbnlcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdID0ge31cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdID0gZGF0YVxuICAgICB9XG5cbiAgICAgZ2V0ICggcGF0aDogUGF0aCApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgbmVhciAoIHBhdGg6IFBhdGggKTogVFxuICAgICB7XG4gICAgICAgICAgdmFyIHJlYyA9IHRoaXMucmVjb3JkcyBhcyBhbnlcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBrID09PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICBpZiAoIGsgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgcmVjID0gcmVjIFtrXVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF1cbiAgICAgfVxuXG4gICAgIHdhbGsgKCBwYXRoOiBQYXRoLCBjYjogKCBkYXRhOiBUICkgPT4gdm9pZCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCAgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB1bmQgaW4gcmVjIClcbiAgICAgICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCB1bmQgaW4gcmVjIClcbiAgICAgICAgICAgICAgIGNiICggcmVjIFt1bmRdIClcblxuICAgICAgICAgIHJldHVyblxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IE9wdGlvbmFsLCBSZXF1aXJlIH0gZnJvbSBcIi4uLy4uL0xpYi90eXBpbmcuanNcIlxuaW1wb3J0IHsgRGF0YVRyZWUgfSBmcm9tIFwiLi9kYXRhLXRyZWUuanNcIlxuXG5cbnR5cGUgUmVmIDxOIGV4dGVuZHMgJE5vZGU+ID0gUmVxdWlyZSA8UGFydGlhbCA8Tj4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cbnR5cGUgRCA8TiBleHRlbmRzICROb2RlPiA9IE9wdGlvbmFsIDxOLCBcImNvbnRleHRcIiB8IFwidHlwZVwiIHwgXCJpZFwiPlxuXG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZSA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+IGV4dGVuZHMgRGF0YVRyZWUgPE4+XG57XG4gICAgIGhhcyAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgIDogYm9vbGVhblxuICAgICBoYXMgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IGJvb2xlYW5cbiAgICAgaGFzICgpOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLm5lYXIgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdICkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLm5lYXIgKCBhcmd1bWVudHMgKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY291bnQgKCBub2RlOiBSZWYgPE4+ICkgICAgICA6IG51bWJlclxuICAgICBjb3VudCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogbnVtYmVyXG4gICAgIGNvdW50ICgpOiBudW1iZXJcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuY291bnQgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5jb3VudCAoIGFyZ3VtZW50cyApXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiAkICkgICAgICAgICAgICAgICAgICAgICA6ICRcbiAgICAgc2V0IDwkIGV4dGVuZHMgTj4gKCBwYXRoOiBzdHJpbmcgW10sIGRhdGE6IEQgPCQ+ICk6ICRcbiAgICAgc2V0ICgpOiBOXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiBOID0gYXJndW1lbnRzIFswXVxuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnNldCAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0sIG8gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLnNldCAoIGFyZ3VtZW50cyBbMF0sIGFyZ3VtZW50cyBbMV0gKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggbm9kZTogUmVmIDwkTm9kZT4gKSAgOiAkXG4gICAgIGdldCA8JCBleHRlbmRzIE4+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiAkXG4gICAgIGdldCAoKTogTlxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fSBhcyBOXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogJE5vZGUgPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICBzdXBlci53YWxrICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSwgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIGRhdGEgKVxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCBvIClcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN1cGVyLndhbGsgKCBhcmd1bWVudHMsIGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduICggcmVzdWx0LCBkYXRhIClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduICggcmVzdWx0LCB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IGFyZ3VtZW50cyBbMF0sXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IGFyZ3VtZW50cyBbMV0sXG4gICAgICAgICAgICAgICAgICAgIGlkICAgICA6IGFyZ3VtZW50cyBbMl0sXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuL2RiLmpzXCJcbmltcG9ydCB7IERhdGFUcmVlLCBQYXRoIH0gZnJvbSBcIi4vZGF0YS10cmVlLmpzXCJcblxuaW1wb3J0IHsgT3B0aW9uYWwgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4LmpzXCJcblxuXG50eXBlIEl0ZW0gPFQgPSBhbnksICQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiA9XG57XG4gICAgIG11bHRpcGxlOiBib29sZWFuXG4gICAgIGluc3RhbmNlczogVCBbXVxuICAgICBjb25zdHJ1Y3RvcjogbmV3ICggZGF0YTogJCApID0+IFRcbn1cblxudHlwZSAkSW4gPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPiA9IE9wdGlvbmFsIDxOLCBcImNvbnRleHRcIj5cblxuLy9leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOICkgPT4gVFxuZXhwb3J0IHR5cGUgQ3RvciA8TiBleHRlbmRzICROb2RlID0gJE5vZGUsIFQgPSBhbnk+ID0gbmV3ICggZGF0YTogTiwgY2hpbGRyZW4/OiBhbnkgW10gKSA9PiBUXG5cbnR5cGUgQXJnIDxGPiA9IEYgZXh0ZW5kcyBuZXcgKCBkYXRhOiBpbmZlciBEICkgPT4gYW55ID8gRCA6IGFueVxuXG5cbmV4cG9ydCBjbGFzcyBGYWN0b3J5IDxFID0gYW55LCBOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT5cbntcbiAgICAgY29uc3RydWN0b3IgKCByZWFkb25seSBkYjogRGF0YWJhc2UgPE4+ICkge31cblxuICAgICBwcml2YXRlIGN0b3JzID0gbmV3IERhdGFUcmVlIDxDdG9yIDwkTm9kZSwgRT4+ICgpXG4gICAgIHByaXZhdGUgaW5zdHMgPSAgbmV3IERhdGFUcmVlIDxFPiAoKVxuXG5cbiAgICAgZ2V0UGF0aCAoIG5vZGU6ICROb2RlICkgICAgICAgIDogUGF0aFxuICAgICBnZXRQYXRoICggcGF0aDogUGF0aCApICAgICAgICAgOiBQYXRoXG4gICAgIGdldFBhdGggKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IFBhdGhcblxuICAgICBnZXRQYXRoICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgKCBcIk51bGwgYXJndW1lbnRcIiApXG5cbiAgICAgICAgICBjb25zdCBhcmcgID0gYXJndW1lbnRzIFswXVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cyBhcyBQYXRoXG5cbiAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkgKCBhcmcpIClcbiAgICAgICAgICAgICAgIHJldHVybiBhcmcuZmxhdCAoKSBhcyBQYXRoXG5cbiAgICAgICAgICByZXR1cm4gWyBhcmcuY29udGV4dCwgYXJnLnR5cGUsIGFyZy5pZCBdIGFzIFBhdGhcbiAgICAgfVxuXG4gICAgIGluU3RvY2sgKCBub2RlOiAkTm9kZSApICAgICAgICA6IGJvb2xlYW5cbiAgICAgaW5TdG9jayAoIHBhdGg6IFBhdGggKSAgICAgICAgIDogYm9vbGVhblxuICAgICBpblN0b2NrICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBib29sZWFuXG5cbiAgICAgaW5TdG9jayAoKTogYm9vbGVhblxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuaGFzICggdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApIGFzIFBhdGggKVxuICAgICB9XG4gICAgIF9pblN0b2NrICggcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5oYXMgKCBwYXRoIClcbiAgICAgfVxuXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgbm9kZTogQXJnIDxGPiApICAgICAgOiB2b2lkXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgcGF0aDogUGF0aCApICAgICAgICAgOiB2b2lkXG4gICAgIGRlZmluZSA8RiBleHRlbmRzIEN0b3I+ICggY3RvcjogRiwgLi4uIHBhdGg6IHN0cmluZyBbXSApOiB2b2lkXG5cbiAgICAgZGVmaW5lICggY3RvcjogQ3RvciwgLi4uIHJlc3Q6IGFueSBbXSApXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiByZXN0IClcblxuICAgICAgICAgIGlmICggdGhpcy5jdG9ycy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3RvcnMuc2V0ICggcGF0aCwgY3RvciApXG4gICAgIH1cbiAgICAgX2RlZmluZSAoIGN0b3I6IEN0b3IsIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmN0b3JzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jdG9ycy5zZXQgKCBwYXRoLCBjdG9yIClcbiAgICAgfVxuXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFLCAkIGV4dGVuZHMgTiA9IE4+ICggbm9kZTogJE5vZGUgKTogUlxuICAgICBwaWNrIDxSIGV4dGVuZHMgRT4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICkgICAgICAgICA6IFJcbiAgICAgcGljayA8UiBleHRlbmRzIEU+ICggcGF0aDogUGF0aCApICAgICAgICAgICAgICAgICAgOiBSXG5cbiAgICAgcGljayAoKTogRVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzIClcblxuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG4gICAgIH1cbiAgICAgX3BpY2sgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG4gICAgIH1cblxuICAgICBtYWtlIDxSIGV4dGVuZHMgRSwgJCBleHRlbmRzIE4gPSBOPiAoIG5vZGU6ICQgKTogUlxuICAgICBtYWtlIDxSIGV4dGVuZHMgRT4gKCBwYXRoOiBQYXRoICkgICAgICAgICAgICAgIDogUlxuICAgICBtYWtlIDxSIGV4dGVuZHMgRT4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICkgICAgIDogUlxuXG4gICAgIG1ha2UgKCk6IEVcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIGFyZ3VtZW50cyApXG5cbiAgICAgICAgICBjb25zdCBhcmcgID0gYXJndW1lbnRzIFswXVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09IFwib2JqZWN0XCIgJiYgISBBcnJheS5pc0FycmF5IChhcmcpIClcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYWtlICggcGF0aCwgYXJnIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fbWFrZSAoIHBhdGggKVxuICAgICB9XG4gICAgIF9tYWtlICggcGF0aDogUGF0aCwgZGF0YT86IFBhcnRpYWwgPE4+IClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5pbnN0cy5oYXMgKCBwYXRoICkgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuZ2V0ICggcGF0aCApXG5cbiAgICAgICAgICBjb25zdCBjdG9yID0gdGhpcy5jdG9ycy5uZWFyICggcGF0aCApXG5cbiAgICAgICAgICBpZiAoIGN0b3IgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIGNvbnN0IHRtcCA9IHRoaXMuZGIuZ2V0ICggLi4uIHBhdGggKVxuXG4gICAgICAgICAgZGF0YSA9IGRhdGEgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICA/IHRtcFxuICAgICAgICAgICAgICAgOiBPYmplY3QuYXNzaWduICggdG1wLCBkYXRhIClcblxuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLnNldCAoIHBhdGgsIG5ldyBjdG9yICggZGF0YSBhcyBOICkgKVxuICAgICB9XG59XG4iLCJcblxuXG5leHBvcnQgY29uc3QgeG5vZGUgPSAoKCkgPT5cbntcbiAgICAgY29uc3Qgc3ZnX25hbWVzID0gWyBcInN2Z1wiLCBcImdcIiwgXCJsaW5lXCIsIFwiY2lyY2xlXCIsIFwicGF0aFwiLCBcInRleHRcIiBdXG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljSFRNTEVsZW1lbnRzLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBrZXlvZiBKU1guSW50cmluc2ljU1ZHRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogU1ZHRWxlbWVudFxuXG4gICAgIGZ1bmN0aW9uIGNyZWF0ZSAoXG4gICAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICAgIHByb3BzOiBhbnksXG4gICAgICAgICAgLi4uY2hpbGRyZW46IFsgSFRNTEVsZW1lbnQgfCBzdHJpbmcgfCBhbnlbXSBdXG4gICAgICk6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgcHJvcHMgPSBPYmplY3QuYXNzaWduICgge30sIHByb3BzIClcblxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBzdmdfbmFtZXMuaW5kZXhPZiAoIG5hbWUgKSA9PT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICggbmFtZSApXG4gICAgICAgICAgICAgICAgICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TICggXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBuYW1lIClcblxuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBbXSBhcyBhbnlbXVxuXG4gICAgICAgICAgLy8gQ2hpbGRyZW5cblxuICAgICAgICAgIHdoaWxlICggY2hpbGRyZW4ubGVuZ3RoID4gMCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gY2hpbGRyZW4ucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCBjaGlsZCApIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSAhPSBjaGlsZC5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuLnB1c2goIGNoaWxkIFtpXSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaCggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHdoaWxlICggY29udGVudC5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjb250ZW50LnBvcCgpXG5cbiAgICAgICAgICAgICAgIGlmICggY2hpbGQgaW5zdGFuY2VvZiBOb2RlIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICBlbHNlIGlmICggdHlwZW9mIGNoaWxkID09IFwiYm9vbGVhblwiIHx8IGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCggZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoIGNoaWxkLnRvU3RyaW5nKCkgKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQXR0cmlidXRlc1xuXG4gICAgICAgICAgY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXlcbiAgICAgICAgICBjb25zdCBjb252OiBSZWNvcmQgPHN0cmluZywgKHY6IGFueSkgPT4gc3RyaW5nPiA9XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2xhc3M6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgICAgICAgc3R5bGU6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0eXBlb2YgdiA9PSBcIm9iamVjdFwiID8gb2JqZWN0VG9TdHlsZSAodilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB2LFxuICAgICAgICAgICAgICAgLy8gc3ZnXG4gICAgICAgICAgICAgICBkOiAoIHYgKSA9PiBpc0FycmF5ICh2KSA/IHYuam9pbiAoXCIgXCIpIDogdixcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrZXkgaW4gcHJvcHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcHNba2V5XVxuXG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiB2YWx1ZSA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBrZXksIHZhbHVlIClcblxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSAoIGtleSwgKGNvbnZba2V5XSB8fCAodj0+dikpICh2YWx1ZSkgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50XG5cbiAgICAgICAgICBmdW5jdGlvbiBvYmplY3RUb1N0eWxlICggb2JqOiBvYmplY3QgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBcIlwiXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBvYmogKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0ga2V5ICsgXCI6IFwiICsgb2JqIFtrZXldICsgXCI7IFwiXG5cbiAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBjYW1lbGl6ZSAoIHN0cjogc3RyaW5nIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6IHdvcmQudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiB1bmNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIudHJpbSAoKS5yZXBsYWNlIChcbiAgICAgICAgICAgICAgIC8vICAgLyg/PCEtKSg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgLyg/OltBLVpdfFxcYlxcdykvZyxcbiAgICAgICAgICAgICAgICAgICAgKCB3b3JkLCBpbmRleCApID0+IGluZGV4ID09IDAgPyB3b3JkLnRvTG93ZXJDYXNlKCkgOiAnLScgKyB3b3JkLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICkucmVwbGFjZSgvKD86XFxzK3xfKS9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGNyZWF0ZVxuXG59KSAoKVxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgbmFtZXNwYWNlIEpTWFxuICAgICB7XG4gICAgICAgICAgZXhwb3J0IHR5cGUgRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG4gICAgICAgICAgZXhwb3J0IHR5cGUgSW50cmluc2ljRWxlbWVudHMgPSBJbnRyaW5zaWNIVE1MRWxlbWVudHMgJiBJbnRyaW5zaWNTVkdFbGVtZW50c1xuXG4gICAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJbnRyaW5zaWNIVE1MRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBhICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWJiciAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFkZHJlc3MgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcmVhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXJ0aWNsZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFzaWRlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhdWRpbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYiAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJhc2UgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZGkgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmRvICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJpZyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBibG9ja3F1b3RlOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYm9keSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBidXR0b24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FudmFzICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNhcHRpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXRlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29kZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2xncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRhdGFsaXN0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVsICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRldGFpbHMgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZm4gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGlhbG9nICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRpdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkbCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZHQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbWJlZCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmllbGRzZXQgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ2NhcHRpb246IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWd1cmUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9vdGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZvcm0gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgzICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDUgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg2ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGVhZGVyICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhncm91cCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBociAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaHRtbCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGkgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpZnJhbWUgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1nICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucHV0ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbnMgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2JkICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGtleWdlbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsYWJlbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGVnZW5kICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5rICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFpbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcCAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1lbnVpdGVtICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWV0ZXIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5hdiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBub3NjcmlwdCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2JqZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9sICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRncm91cCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3B0aW9uICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG91dHB1dCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGFyYW0gICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHBpY3R1cmUgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcmUgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcHJvZ3Jlc3MgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBycCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJ1YnkgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2FtcCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNjcmlwdCAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWN0aW9uICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2VsZWN0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNsb3QgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzbWFsbCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc291cmNlICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNwYW4gICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHJvbmcgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3R5bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1YiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdW1tYXJ5ICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3VwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRhYmxlICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Ym9keSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGQgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRleHRhcmVhICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0Zm9vdCAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGggICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRoZWFkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aW1lICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGl0bGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0cmFjayAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHVsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBcInZhclwiICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB2aWRlbyAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgd2JyICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY1NWR0VsZW1lbnRzXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3ZnICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYW5pbWF0ZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2lyY2xlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2xpcFBhdGggICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVmcyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGVzYyAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZWxsaXBzZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVCbGVuZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb2xvck1hdHJpeCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb25lbnRUcmFuc2ZlcjogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb21wb3NpdGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVDb252b2x2ZU1hdHJpeCAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaWZmdXNlTGlnaHRpbmcgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVEaXNwbGFjZW1lbnRNYXAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVGbG9vZCAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVHYXVzc2lhbkJsdXIgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVJbWFnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZSAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNZXJnZU5vZGUgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVNb3JwaG9sb2d5ICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVPZmZzZXQgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVTcGVjdWxhckxpZ2h0aW5nIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUaWxlICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmVUdXJidWxlbmNlICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlsdGVyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9yZWlnbk9iamVjdCAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZyAgICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW1hZ2UgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZSAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGluZWFyR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFya2VyICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFzayAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0aCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGF0dGVybiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWdvbiAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcG9seWxpbmUgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmFkaWFsR3JhZGllbnQgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcmVjdCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3RvcCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ltYm9sICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dCAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHNwYW4gICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdXNlICAgICAgICAgICAgICAgIDogU1ZHQXR0cmlidXRlc1xuICAgICAgICAgIH1cbiAgICAgfVxuXG5cbiAgICAgaW50ZXJmYWNlIFBhdGhBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIHR5cGUgRXZlbnRIYW5kbGVyIDxFIGV4dGVuZHMgRXZlbnQ+ID0gKCBldmVudDogRSApID0+IHZvaWRcblxuICAgICB0eXBlIENsaXBib2FyZEV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPENsaXBib2FyZEV2ZW50PlxuICAgICB0eXBlIENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyID0gRXZlbnRIYW5kbGVyPENvbXBvc2l0aW9uRXZlbnQ+XG4gICAgIHR5cGUgRHJhZ0V2ZW50SGFuZGxlciAgICAgICAgPSBFdmVudEhhbmRsZXI8RHJhZ0V2ZW50PlxuICAgICB0eXBlIEZvY3VzRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPEZvY3VzRXZlbnQ+XG4gICAgIHR5cGUgS2V5Ym9hcmRFdmVudEhhbmRsZXIgICAgPSBFdmVudEhhbmRsZXI8S2V5Ym9hcmRFdmVudD5cbiAgICAgdHlwZSBNb3VzZUV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxNb3VzZUV2ZW50PlxuICAgICB0eXBlIFRvdWNoRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFRvdWNoRXZlbnQ+XG4gICAgIHR5cGUgVUlFdmVudEhhbmRsZXIgICAgICAgICAgPSBFdmVudEhhbmRsZXI8VUlFdmVudD5cbiAgICAgdHlwZSBXaGVlbEV2ZW50SGFuZGxlciAgICAgICA9IEV2ZW50SGFuZGxlcjxXaGVlbEV2ZW50PlxuICAgICB0eXBlIEFuaW1hdGlvbkV2ZW50SGFuZGxlciAgID0gRXZlbnRIYW5kbGVyPEFuaW1hdGlvbkV2ZW50PlxuICAgICB0eXBlIFRyYW5zaXRpb25FdmVudEhhbmRsZXIgID0gRXZlbnRIYW5kbGVyPFRyYW5zaXRpb25FdmVudD5cbiAgICAgdHlwZSBHZW5lcmljRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxFdmVudD5cbiAgICAgdHlwZSBQb2ludGVyRXZlbnRIYW5kbGVyICAgICA9IEV2ZW50SGFuZGxlcjxQb2ludGVyRXZlbnQ+XG5cbiAgICAgaW50ZXJmYWNlIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIFtldmVudDogc3RyaW5nXTogYW55XG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEltYWdlIEV2ZW50c1xuICAgICAgICAgIG9uTG9hZD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3I/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRXJyb3JDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ2xpcGJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uQ29weT8gICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db3B5Q2FwdHVyZT8gOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkN1dD8gICAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0Q2FwdHVyZT8gIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXN0ZT8gICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlQ2FwdHVyZT86IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gQ29tcG9zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZD8gICAgICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25FbmRDYXB0dXJlPyAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnQ/ICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblN0YXJ0Q2FwdHVyZT8gOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGU/ICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uVXBkYXRlQ2FwdHVyZT86IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb2N1cyBFdmVudHNcbiAgICAgICAgICBvbkZvY3VzPyAgICAgICA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Gb2N1c0NhcHR1cmU/OiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1cj8gICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkJsdXJDYXB0dXJlPyA6IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBGb3JtIEV2ZW50c1xuICAgICAgICAgIG9uQ2hhbmdlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DaGFuZ2VDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbklucHV0PyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXRDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWFyY2g/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VibWl0PyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXRDYXB0dXJlPyA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkludmFsaWQ/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBLZXlib2FyZCBFdmVudHNcbiAgICAgICAgICBvbktleURvd24/ICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlEb3duQ2FwdHVyZT8gOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3M/ICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVByZXNzQ2FwdHVyZT86IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcD8gICAgICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5VXBDYXB0dXJlPyAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIE1lZGlhIEV2ZW50c1xuICAgICAgICAgIG9uQWJvcnQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQWJvcnRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheT8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheUNhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2g/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ2FuUGxheVRocm91Z2hDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2U/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHVyYXRpb25DaGFuZ2VDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW1wdGllZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkPyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5jcnlwdGVkQ2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWQ/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRW5kZWRDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkRGF0YUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGE/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZGVkTWV0YWRhdGFDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0PyAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9hZFN0YXJ0Q2FwdHVyZT8gICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2U/ICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGF1c2VDYXB0dXJlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheT8gICAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheUNhcHR1cmU/ICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGxheWluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3M/ICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUHJvZ3Jlc3NDYXB0dXJlPyAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUmF0ZUNoYW5nZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkPyAgICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2VkQ2FwdHVyZT8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2Vla2luZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3RhbGxlZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZD8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU3VzcGVuZENhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZT8gICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVGltZVVwZGF0ZUNhcHR1cmU/ICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlPyAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVm9sdW1lQ2hhbmdlQ2FwdHVyZT8gIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZz8gICAgICAgICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2FpdGluZ0NhcHR1cmU/ICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTW91c2VFdmVudHNcbiAgICAgICAgICBvbkNsaWNrPyAgICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DbGlja0NhcHR1cmU/ICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnU/ICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbnRleHRNZW51Q2FwdHVyZT86IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGljaz8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRGJsQ2xpY2tDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWc/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmQ/ICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbmRDYXB0dXJlPyAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlcj8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFbnRlckNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0PyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdFeGl0Q2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZT8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdMZWF2ZUNhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyPyAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdPdmVyQ2FwdHVyZT8gICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydD8gICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyYWdTdGFydENhcHR1cmU/ICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3A/ICAgICAgICAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRyb3BDYXB0dXJlPyAgICAgICA6IERyYWdFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZURvd25DYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlcj8gICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRW50ZXJDYXB0dXJlPyA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VMZWF2ZUNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZT8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU1vdmVDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXQ/ICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3V0Q2FwdHVyZT8gICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXI/ICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdmVyQ2FwdHVyZT8gIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXA/ICAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZVVwQ2FwdHVyZT8gICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gU2VsZWN0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uU2VsZWN0PzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VsZWN0Q2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRvdWNoIEV2ZW50c1xuICAgICAgICAgIG9uVG91Y2hDYW5jZWw/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hDYW5jZWxDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoRW5kQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hNb3ZlQ2FwdHVyZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaFN0YXJ0PzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFBvaW50ZXIgRXZlbnRzXG4gICAgICAgICAgb25Qb2ludGVyT3Zlcj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck92ZXJDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlcj8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRW50ZXJDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd24/ICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJEb3duQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZT8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck1vdmVDYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcD8gICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyVXBDYXB0dXJlPyAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbD8gICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJDYW5jZWxDYXB0dXJlPyAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0PyAgICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlck91dENhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZT8gICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTGVhdmVDYXB0dXJlPyAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmU/ICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkdvdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT8gOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTG9zdFBvaW50ZXJDYXB0dXJlQ2FwdHVyZT86IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFVJIEV2ZW50c1xuICAgICAgICAgIG9uU2Nyb2xsPyAgICAgICA6IFVJRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TY3JvbGxDYXB0dXJlPzogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFdoZWVsIEV2ZW50c1xuICAgICAgICAgIG9uV2hlZWw/ICAgICAgIDogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbldoZWVsQ2FwdHVyZT86IFdoZWVsRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBBbmltYXRpb24gRXZlbnRzXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydD8gICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25TdGFydENhcHR1cmU/ICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmQ/ICAgICAgICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25FbmRDYXB0dXJlPyAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb24/ICAgICAgIDogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BbmltYXRpb25JdGVyYXRpb25DYXB0dXJlPzogQW5pbWF0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBUcmFuc2l0aW9uIEV2ZW50c1xuICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZD8gICAgICAgOiBUcmFuc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kQ2FwdHVyZT86IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgSFRNTEF0dHJpYnV0ZXMgZXh0ZW5kcyBET01BdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICAvLyBTdGFuZGFyZCBIVE1MIEF0dHJpYnV0ZXNcbiAgICAgICAgICBhY2NlcHQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjY2VwdENoYXJzZXQ/ICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXNzS2V5PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhY3Rpb24/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFsbG93RnVsbFNjcmVlbj8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsbG93VHJhbnNwYXJlbmN5Pzogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGFsdD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXN5bmM/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYXV0b2NvbXBsZXRlPyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9jb3JyZWN0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b0NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvZm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvRm9jdXM/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvUGxheT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjYXB0dXJlPyAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjZWxsUGFkZGluZz8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNlbGxTcGFjaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2hhclNldD8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjaGFsbGVuZ2U/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoZWNrZWQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNsYXNzPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW11cbiAgICAgICAgICBjbGFzc05hbWU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbHM/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY29sU3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb250ZW50PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRFZGl0YWJsZT8gIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNvbnRleHRNZW51PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udHJvbHM/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udHJvbHNMaXN0PyAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb29yZHM/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNyb3NzT3JpZ2luPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGF0YT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRlVGltZT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRlZmF1bHQ/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRlZmVyPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGRpcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGlzYWJsZWQ/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZG93bmxvYWQ/ICAgICAgICAgOiBhbnlcbiAgICAgICAgICBkcmFnZ2FibGU/ICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBlbmNUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm0/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybUFjdGlvbj8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtRW5jVHlwZT8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1NZXRob2Q/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU5vVmFsaWRhdGU/ICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZm9ybVRhcmdldD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmcmFtZUJvcmRlcj8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhlYWRlcnM/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGVpZ2h0PyAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBoaWRkZW4/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBoaWdoPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhyZWY/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHJlZkxhbmc/ICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3I/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGh0bWxGb3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHR0cEVxdWl2PyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpY29uPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlkPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaW5wdXRNb2RlPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlZ3JpdHk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGlzPyAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2V5UGFyYW1zPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlUeXBlPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtpbmQ/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGFiZWw/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYW5nPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxpc3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbG9vcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbG93PyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYW5pZmVzdD8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmdpbkhlaWdodD8gICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWFyZ2luV2lkdGg/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXg/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heExlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWVkaWE/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtZWRpYUdyb3VwPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1ldGhvZD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWluPyAgICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtaW5MZW5ndGg/ICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG11bHRpcGxlPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG11dGVkPyAgICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIG5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbm9WYWxpZGF0ZT8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3Blbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgb3B0aW11bT8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBwYXR0ZXJuPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBsYWNlaG9sZGVyPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxheXNJbmxpbmU/ICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcG9zdGVyPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwcmVsb2FkPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJhZGlvR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmVhZE9ubHk/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgcmVsPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByb2xlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvd3M/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgcm93U3Bhbj8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzYW5kYm94PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNjb3BlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGVkPyAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc2Nyb2xsaW5nPyAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzZWFtbGVzcz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzZWxlY3RlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzaGFwZT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNpemU/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc2l6ZXM/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzbG90PyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNwYW4/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3BlbGxjaGVjaz8gICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgc3JjPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNzZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY0RvYz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjTGFuZz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNTZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0PyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3RlcD8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHlsZT8gICAgICAgICAgICA6IHN0cmluZyB8IHsgWyBrZXk6IHN0cmluZyBdOiBzdHJpbmcgfCBudW1iZXIgfVxuICAgICAgICAgIHN1bW1hcnk/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGFiSW5kZXg/ICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICB0YXJnZXQ/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRpdGxlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1c2VNYXA/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZhbHVlPyAgICAgICAgICAgIDogc3RyaW5nIHwgc3RyaW5nW10gfCBudW1iZXJcbiAgICAgICAgICB3aWR0aD8gICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHdtb2RlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgd3JhcD8gICAgICAgICAgICAgOiBzdHJpbmdcblxuICAgICAgICAgIC8vIFJERmEgQXR0cmlidXRlc1xuICAgICAgICAgIGFib3V0Pzogc3RyaW5nXG4gICAgICAgICAgZGF0YXR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpbmxpc3Q/OiBhbnlcbiAgICAgICAgICBwcmVmaXg/OiBzdHJpbmdcbiAgICAgICAgICBwcm9wZXJ0eT86IHN0cmluZ1xuICAgICAgICAgIHJlc291cmNlPzogc3RyaW5nXG4gICAgICAgICAgdHlwZW9mPzogc3RyaW5nXG4gICAgICAgICAgdm9jYWI/OiBzdHJpbmdcblxuICAgICAgICAgIC8vIE1pY3JvZGF0YSBBdHRyaWJ1dGVzXG4gICAgICAgICAgaXRlbVByb3A/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtU2NvcGU/OiBib29sZWFuXG4gICAgICAgICAgaXRlbVR5cGU/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtSUQ/OiBzdHJpbmdcbiAgICAgICAgICBpdGVtUmVmPzogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgU1ZHQXR0cmlidXRlcyBleHRlbmRzIEhUTUxBdHRyaWJ1dGVzXG4gICAgIHtcbiAgICAgICAgICBhY2NlbnRIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFjY3VtdWxhdGU/ICAgICAgICAgICAgICAgIDogXCJub25lXCIgfCBcInN1bVwiXG4gICAgICAgICAgYWRkaXRpdmU/ICAgICAgICAgICAgICAgICAgOiBcInJlcGxhY2VcIiB8IFwic3VtXCJcbiAgICAgICAgICBhbGlnbm1lbnRCYXNlbGluZT8gICAgICAgICA6IFwiYXV0b1wiIHwgXCJiYXNlbGluZVwiIHwgXCJiZWZvcmUtZWRnZVwiIHwgXCJ0ZXh0LWJlZm9yZS1lZGdlXCIgfCBcIm1pZGRsZVwiIHwgXCJjZW50cmFsXCIgfCBcImFmdGVyLWVkZ2VcIiB8IFwidGV4dC1hZnRlci1lZGdlXCIgfCBcImlkZW9ncmFwaGljXCIgfCBcImFscGhhYmV0aWNcIiB8IFwiaGFuZ2luZ1wiIHwgXCJtYXRoZW1hdGljYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgYWxsb3dSZW9yZGVyPyAgICAgICAgICAgICAgOiBcIm5vXCIgfCBcInllc1wiXG4gICAgICAgICAgYWxwaGFiZXRpYz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhbXBsaXR1ZGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFyYWJpY0Zvcm0/ICAgICAgICAgICAgICAgIDogXCJpbml0aWFsXCIgfCBcIm1lZGlhbFwiIHwgXCJ0ZXJtaW5hbFwiIHwgXCJpc29sYXRlZFwiXG4gICAgICAgICAgYXNjZW50PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhdHRyaWJ1dGVOYW1lPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZVR5cGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b1JldmVyc2U/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBhemltdXRoPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VGcmVxdWVuY3k/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZWxpbmVTaGlmdD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlUHJvZmlsZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJib3g/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmVnaW4/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiaWFzPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2FsY01vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYXBIZWlnaHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXA/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFBhdGg/ICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aFVuaXRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNsaXBSdWxlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JJbnRlcnBvbGF0aW9uPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb25GaWx0ZXJzPyA6IFwiYXV0b1wiIHwgXCJzUkdCXCIgfCBcImxpbmVhclJHQlwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBjb2xvclByb2ZpbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9yUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29udGVudFNjcmlwdFR5cGU/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U3R5bGVUeXBlPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN1cnNvcj8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3g/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGQ/ICAgICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nIHwgKG51bWJlciB8IHN0cmluZykgW11cbiAgICAgICAgICBkZWNlbGVyYXRlPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRlc2NlbnQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlmZnVzZUNvbnN0YW50PyAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXJlY3Rpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpc3BsYXk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGl2aXNvcj8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkb21pbmFudEJhc2VsaW5lPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR1cj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHg/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVkZ2VNb2RlPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWxldmF0aW9uPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbmFibGVCYWNrZ3JvdW5kPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuZD8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZXhwb25lbnQ/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHRlcm5hbFJlc291cmNlc1JlcXVpcmVkPyA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGw/ICAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsbE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWxsUnVsZT8gICAgICAgICAgICAgICAgICA6IFwibm9uemVyb1wiIHwgXCJldmVub2RkXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGZpbHRlcj8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZmlsdGVyUmVzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZsb29kQ29sb3I/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RPcGFjaXR5PyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb2N1c2FibGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRGYW1pbHk/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9udFNpemU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZUFkanVzdD8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTdHJldGNoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0eWxlPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250VmFyaWFudD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRXZWlnaHQ/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9ybWF0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmcm9tPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZ4PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnMT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhOYW1lPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE9yaWVudGF0aW9uSG9yaXpvbnRhbD86IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25WZXJ0aWNhbD8gIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhSZWY/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBncmFkaWVudFRyYW5zZm9ybT8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VW5pdHM/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaGFuZ2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBob3JpekFkdlg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6T3JpZ2luWD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaWRlb2dyYXBoaWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbWFnZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGluMj8gICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4/ICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnRlcmNlcHQ/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGsxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGs0PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaz8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuZWxNYXRyaXg/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbFVuaXRMZW5ndGg/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmluZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlQb2ludHM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVNwbGluZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5VGltZXM/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsZW5ndGhBZGp1c3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxldHRlclNwYWNpbmc/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGlnaHRpbmdDb2xvcj8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaW1pdGluZ0NvbmVBbmdsZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxvY2FsPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyRW5kPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJIZWlnaHQ/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlck1pZD8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFya2VyU3RhcnQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJVbml0cz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hcmtlcldpZHRoPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFzaz8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXNrQ29udGVudFVuaXRzPyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1hc2tVbml0cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWF0aGVtYXRpY2FsPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtb2RlPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG51bU9jdGF2ZXM/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb2Zmc2V0PyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcGFjaXR5PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wZXJhdG9yPyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JkZXI/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmllbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudGF0aW9uPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZ2luPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVyZmxvdz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJsaW5lUG9zaXRpb24/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVUaGlja25lc3M/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYWludE9yZGVyPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhbm9zZTE/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0aExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuQ29udGVudFVuaXRzPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm0/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblVuaXRzPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludGVyRXZlbnRzPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50cz8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRYPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFk/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0Wj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcHJlc2VydmVBbHBoYT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByaW1pdGl2ZVVuaXRzPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcj8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByYWRpdXM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlZlg/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWT8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZW5kZXJpbmdJbnRlbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcGVhdENvdW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0RHVyPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXF1aXJlZEV4dGVuc2lvbnM/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRmVhdHVyZXM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVzdGFydD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN1bHQ/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJvdGF0ZT8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNjYWxlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2VlZD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzaGFwZVJlbmRlcmluZz8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNsb3BlPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BhY2luZz8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVjdWxhckNvbnN0YW50PyAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyRXhwb25lbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlZWQ/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcHJlYWRNZXRob2Q/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0YXJ0T2Zmc2V0PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RkRGV2aWF0aW9uPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGVtaD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW12PyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RpdGNoVGlsZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdG9wQ29sb3I/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0b3BPcGFjaXR5PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaWtldGhyb3VnaFBvc2l0aW9uPyAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoVGhpY2tuZXNzPyAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmluZz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzdHJva2VEYXNoYXJyYXk/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0cm9rZURhc2hvZmZzZXQ/ICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlTGluZWNhcD8gICAgICAgICAgICAgOiBcImJ1dHRcIiB8IFwicm91bmRcIiB8IFwic3F1YXJlXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZUxpbmVqb2luPyAgICAgICAgICAgIDogXCJtaXRlclwiIHwgXCJyb3VuZFwiIHwgXCJiZXZlbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBzdHJva2VNaXRlcmxpbWl0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZU9wYWNpdHk/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdXJmYWNlU2NhbGU/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN5c3RlbUxhbmd1YWdlPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFibGVWYWx1ZXM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YXJnZXRYPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dEFuY2hvcj8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0RGVjb3JhdGlvbj8gICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRleHRMZW5ndGg/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dFJlbmRlcmluZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0bz8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRyYW5zZm9ybT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuZGVybGluZVBvc2l0aW9uPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lVGhpY2tuZXNzPyAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGVCaWRpPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZVJhbmdlPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bml0c1BlckVtPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZBbHBoYWJldGljPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmFsdWVzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZWN0b3JFZmZlY3Q/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnNpb24/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmVydEFkdlk/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2ZXJ0T3JpZ2luWD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5ZPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkhhbmdpbmc/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SWRlb2dyYXBoaWM/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpZXdCb3g/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmlld1RhcmdldD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2aXNpYmlsaXR5PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZNYXRoZW1hdGljYWw/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd2lkdGhzPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3b3JkU3BhY2luZz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdyaXRpbmdNb2RlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeDE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHg/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeENoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4SGVpZ2h0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHhsaW5rQWN0dWF0ZT8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtBcmNyb2xlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0hyZWY/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rUm9sZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtTaG93PyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1RpdGxlPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVHlwZT8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sQmFzZT8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxMYW5nPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbG5zPyAgICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnNYbGluaz8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxTcGFjZT8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHkxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeTI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHlDaGFubmVsU2VsZWN0b3I/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgej8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB6b29tQW5kUGFuPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICB9XG59XG4iLCJcbmV4cG9ydCBpbnRlcmZhY2UgIERyYWdnYWJsZU9wdGlvbnNcbntcbiAgICAgaGFuZGxlcyAgICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBtaW5WZWxvY2l0eT8gICA6IG51bWJlclxuICAgICBtYXhWZWxvY2l0eT8gICA6IG51bWJlclxuICAgICB2ZWxvY2l0eUZhY3Rvcj86IG51bWJlclxuICAgICBvbkRyYWc/ICAgICAgICA6ICggZXZlbnQ6IERyYWdFdmVudCApID0+IHZvaWRcbiAgICAgb25TdGFydERyYWc/ICAgOiAoKSA9PiB2b2lkXG4gICAgIG9uU3RvcERyYWc/ICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gYm9vbGVhblxuICAgICBvbkVuZEFuaW1hdGlvbj86ICggIGV2ZW50OiBEcmFnRXZlbnQgICkgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBEcmFnZ2FibGVDb25maWcgPSBSZXF1aXJlZCA8RHJhZ2dhYmxlT3B0aW9ucz5cblxuZXhwb3J0IGludGVyZmFjZSBEcmFnRXZlbnRcbntcbiAgICAgeCAgICAgICAgOiBudW1iZXJcbiAgICAgeSAgICAgICAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WCAgOiBudW1iZXJcbiAgICAgb2Zmc2V0WSAgOiBudW1iZXJcbiAgICAgdGFyZ2V0WDogbnVtYmVyXG4gICAgIHRhcmdldFk6IG51bWJlclxuICAgICBkZWxheSAgICA6IG51bWJlclxufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBEcmFnZ2FibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgbWluVmVsb2NpdHkgICA6IDAsXG4gICAgICAgICAgbWF4VmVsb2NpdHkgICA6IDEsXG4gICAgICAgICAgb25TdGFydERyYWcgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uRHJhZyAgICAgICAgOiAoKSA9PiB7fSxcbiAgICAgICAgICBvblN0b3BEcmFnICAgIDogKCkgPT4gdHJ1ZSxcbiAgICAgICAgICBvbkVuZEFuaW1hdGlvbjogKCkgPT4ge30sXG4gICAgICAgICAgdmVsb2NpdHlGYWN0b3I6ICh3aW5kb3cuaW5uZXJIZWlnaHQgPCB3aW5kb3cuaW5uZXJXaWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gd2luZG93LmlubmVySGVpZ2h0IDogd2luZG93LmlubmVyV2lkdGgpIC8gMixcbiAgICAgfVxufVxuXG52YXIgaXNfZHJhZyAgICA9IGZhbHNlXG52YXIgcG9pbnRlcjogTW91c2VFdmVudCB8IFRvdWNoXG5cbi8vIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2dyZS8xNjUwMjk0XG52YXIgRWFzaW5nRnVuY3Rpb25zID0ge1xuICAgICBsaW5lYXIgICAgICAgIDogKCB0OiBudW1iZXIgKSA9PiB0LFxuICAgICBlYXNlSW5RdWFkICAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQsXG4gICAgIGVhc2VPdXRRdWFkICAgOiAoIHQ6IG51bWJlciApID0+IHQqKDItdCksXG4gICAgIGVhc2VJbk91dFF1YWQgOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyAyKnQqdCA6IC0xKyg0LTIqdCkqdCxcbiAgICAgZWFzZUluQ3ViaWMgICA6ICggdDogbnVtYmVyICkgPT4gdCp0KnQsXG4gICAgIGVhc2VPdXRDdWJpYyAgOiAoIHQ6IG51bWJlciApID0+ICgtLXQpKnQqdCsxLFxuICAgICBlYXNlSW5PdXRDdWJpYzogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gNCp0KnQqdCA6ICh0LTEpKigyKnQtMikqKDIqdC0yKSsxLFxuICAgICBlYXNlSW5RdWFydCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0LFxuICAgICBlYXNlT3V0UXVhcnQgIDogKCB0OiBudW1iZXIgKSA9PiAxLSgtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWFydDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gOCp0KnQqdCp0IDogMS04KigtLXQpKnQqdCp0LFxuICAgICBlYXNlSW5RdWludCAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWludCAgOiAoIHQ6IG51bWJlciApID0+IDErKC0tdCkqdCp0KnQqdCxcbiAgICAgZWFzZUluT3V0UXVpbnQ6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDE2KnQqdCp0KnQqdCA6IDErMTYqKC0tdCkqdCp0KnQqdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZHJhZ2dhYmxlICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyAgICAgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX2FjdGl2ZSAgPSBmYWxzZVxuICAgICB2YXIgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgIHZhciBjdXJyZW50X2V2ZW50OiBEcmFnRXZlbnRcblxuICAgICB2YXIgc3RhcnRfdGltZSA9IDBcbiAgICAgdmFyIHN0YXJ0X3ggICAgPSAwXG4gICAgIHZhciBzdGFydF95ICAgID0gMFxuXG4gICAgIHZhciB2ZWxvY2l0eV9kZWxheSA9IDUwMFxuICAgICB2YXIgdmVsb2NpdHlfeDogbnVtYmVyXG4gICAgIHZhciB2ZWxvY2l0eV95OiBudW1iZXJcblxuICAgICB2YXIgY3VycmVudF9hbmltYXRpb24gPSAtMVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IERyYWdnYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDAgKVxuICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3VjaEFjdGlvbiA9IFwibm9uZVwiXG5cbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWRkSGFuZGxlcyAoIC4uLiBoYW5kbGVzOiBKU1guRWxlbWVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggISBjb25maWcuaGFuZGxlcy5pbmNsdWRlcyAoaCkgKVxuICAgICAgICAgICAgICAgICAgICBjb25maWcuaGFuZGxlcy5wdXNoIChoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYWN0aXZlIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBkZXNhY3RpdmF0ZSAoKVxuICAgICAgICAgICAgICAgYWN0aXZhdGUgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgICAgICAgaXNfYWN0aXZlID0gdHJ1ZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWRkSGFuZGxlcyxcbiAgICAgICAgICBpc0FjdGl2ZTogKCkgPT4gaXNfYWN0aXZlLFxuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZW5hYmxlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcmRvd25cIiwgb25TdGFydCwgeyBwYXNzaXZlOiB0cnVlIH0gKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRpc2FibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiICwgb25TdGFydCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0ICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc29sZS53YXJuICggXCJUZW50YXRpdmUgZGUgZMOpbWFycmFnZSBkZXMgw6l2w6luZW1lbnRzIFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcImRyYWdnYWJsZSBcXFwiIGTDqWrDoCBlbiBjb3Vycy5cIiApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2FuaW1hdGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9pbnRlciA9IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVybW92ZVwiLCBvbk1vdmUpXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcnVwXCIgICwgb25FbmQpXG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25TdGFydCApXG5cbiAgICAgICAgICBpc19kcmFnID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uTW92ZSAoIGV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgPT0gZmFsc2UgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICA/IChldmVudCBhcyBUb3VjaEV2ZW50KS50b3VjaGVzIFswXVxuICAgICAgICAgICAgICAgICAgICA6IChldmVudCBhcyBNb3VzZUV2ZW50KVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcblxuICAgICAgICAgIGlzX2RyYWcgPSBmYWxzZVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25TdGFydCAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3ggICAgPSBwb2ludGVyLmNsaWVudFhcbiAgICAgICAgICBzdGFydF95ICAgID0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgc3RhcnRfdGltZSA9IG5vd1xuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5ICAgIDogMCxcbiAgICAgICAgICAgICAgIHggICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIHkgICAgICAgIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFggIDogMCxcbiAgICAgICAgICAgICAgIG9mZnNldFkgIDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFg6IDAsXG4gICAgICAgICAgICAgICB0YXJnZXRZOiAwLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbmZpZy5vblN0YXJ0RHJhZyAoKVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25BbmltYXRpb25GcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgdmVsb2NpdHlGYWN0b3IgfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgY29uc3QgeCAgICAgICAgICAgPSBwb2ludGVyLmNsaWVudFggLSBzdGFydF94XG4gICAgICAgICAgY29uc3QgeSAgICAgICAgICAgPSBzdGFydF95IC0gcG9pbnRlci5jbGllbnRZXG4gICAgICAgICAgY29uc3QgZGVsYXkgICAgICAgPSBub3cgLSBzdGFydF90aW1lXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0RGVsYXkgPSBkZWxheSAtIGN1cnJlbnRfZXZlbnQuZGVsYXlcbiAgICAgICAgICBjb25zdCBvZmZzZXRYICAgICA9IHggLSBjdXJyZW50X2V2ZW50LnhcbiAgICAgICAgICBjb25zdCBvZmZzZXRZICAgICA9IHkgLSBjdXJyZW50X2V2ZW50LnlcblxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSB7XG4gICAgICAgICAgICAgICBkZWxheSxcbiAgICAgICAgICAgICAgIHgsXG4gICAgICAgICAgICAgICB5LFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogeCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IHksXG4gICAgICAgICAgICAgICBvZmZzZXRYLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcbiAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uQW5pbWF0aW9uRnJhbWUgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RhcnRfdGltZSAgICAgPSBub3dcbiAgICAgICAgICAgICAgIHN0YXJ0X3ggICAgICAgID0geFxuICAgICAgICAgICAgICAgc3RhcnRfeSAgICAgICAgPSB5XG4gICAgICAgICAgICAgICB2ZWxvY2l0eV94ICAgICAgID0gdmVsb2NpdHlGYWN0b3IgKiBub3JtICggb2Zmc2V0WCAvIG9mZnNldERlbGF5IClcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3kgICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRZIC8gb2Zmc2V0RGVsYXkgKVxuXG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFggKz0gdmVsb2NpdHlfeFxuICAgICAgICAgICAgICAgY3VycmVudF9ldmVudC50YXJnZXRZICs9IHZlbG9jaXR5X3lcblxuICAgICAgICAgICAgICAgaWYgKCBjb25maWcub25TdG9wRHJhZyAoIGN1cnJlbnRfZXZlbnQgKSA9PT0gdHJ1ZSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRfYW5pbWF0aW9uID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSAoIG9uVmVsb2NpdHlGcmFtZSApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZnVuY3Rpb24gbm9ybSAoIHZhbHVlOiBudW1iZXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICh2YWx1ZSA8IC0xIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xXG5cbiAgICAgICAgICAgICAgIGlmICggdmFsdWUgPiAxIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDFcblxuICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgfVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uVmVsb2NpdHlGcmFtZSAoIG5vdzogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRlbGF5ID0gbm93IC0gc3RhcnRfdGltZVxuXG4gICAgICAgICAgY29uc3QgdCA9IGRlbGF5ID49IHZlbG9jaXR5X2RlbGF5XG4gICAgICAgICAgICAgICAgICA/IDFcbiAgICAgICAgICAgICAgICAgIDogZGVsYXkgLyB2ZWxvY2l0eV9kZWxheVxuXG4gICAgICAgICAgY29uc3QgZmFjdG9yICA9IEVhc2luZ0Z1bmN0aW9ucy5lYXNlT3V0UXVhcnQgKHQpXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IHZlbG9jaXR5X3ggKiBmYWN0b3JcbiAgICAgICAgICBjb25zdCBvZmZzZXRZID0gdmVsb2NpdHlfeSAqIGZhY3RvclxuXG4gICAgICAgICAgY3VycmVudF9ldmVudC54ICAgICAgID0gc3RhcnRfeCArIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnkgICAgICAgPSBzdGFydF95ICsgb2Zmc2V0WVxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQub2Zmc2V0WCA9IHZlbG9jaXR5X3ggLSBvZmZzZXRYXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRZID0gdmVsb2NpdHlfeSAtIG9mZnNldFlcblxuICAgICAgICAgIGNvbmZpZy5vbkRyYWcgKCBjdXJyZW50X2V2ZW50IClcblxuICAgICAgICAgIGlmICggdCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzdG9wVmVsb2NpdHlGcmFtZSAoKVxuICAgICB7XG4gICAgICAgICAgaXNfYW5pbWF0ZSA9IGZhbHNlXG4gICAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lICggY3VycmVudF9hbmltYXRpb24gKVxuICAgICAgICAgIGNvbmZpZy5vbkVuZEFuaW1hdGlvbiAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICB9XG59XG4iLCJcbmV4cG9ydCB0eXBlIEV4dGVuZGVkQ1NTU3R5bGVEZWNsYXJhdGlvbiA9IENTU1N0eWxlRGVjbGFyYXRpb24gJlxue1xuICAgIGRpc3BsYXkgICAgICA6IFwiaW5saW5lXCIgfCBcImJsb2NrXCIgfCBcImNvbnRlbnRzXCIgfCBcImZsZXhcIiB8IFwiZ3JpZFwiIHwgXCJpbmxpbmUtYmxvY2tcIiB8IFwiaW5saW5lLWZsZXhcIiB8IFwiaW5saW5lLWdyaWRcIiB8IFwiaW5saW5lLXRhYmxlXCIgfCBcImxpc3QtaXRlbVwiIHwgXCJydW4taW5cIiB8IFwidGFibGVcIiB8IFwidGFibGUtY2FwdGlvblwiIHwgXCJ0YWJsZS1jb2x1bW4tZ3JvdXBcIiB8IFwidGFibGUtaGVhZGVyLWdyb3VwXCIgfCBcInRhYmxlLWZvb3Rlci1ncm91cFwiIHwgXCJ0YWJsZS1yb3ctZ3JvdXBcIiB8IFwidGFibGUtY2VsbFwiIHwgXCJ0YWJsZS1jb2x1bW5cIiB8IFwidGFibGUtcm93XCIgfCBcIm5vbmVcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBmbGV4RGlyZWN0aW9uOiBcInJvd1wiIHwgXCJyb3ctcmV2ZXJzZVwiIHwgXCJjb2x1bW5cIiB8IFwiY29sdW1uLXJldmVyc2VcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvdyAgICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dYICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93WSAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBwb3NpdGlvbiAgICAgOiBcInN0YXRpY1wiIHwgXCJhYnNvbHV0ZVwiIHwgXCJmaXhlZFwiIHwgXCJyZWxhdGl2ZVwiIHwgXCJzdGlja3lcIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbn1cblxuLypkZWNsYXJlIGdsb2JhbHtcblxuICAgICBpbnRlcmZhY2UgV2luZG93XG4gICAgIHtcbiAgICAgICAgICBvbjogV2luZG93IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IFdpbmRvdyBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgRWxlbWVudFxuICAgICB7XG4gICAgICAgICAgY3NzICggcHJvcGVydGllczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApOiB0aGlzXG5cbiAgICAgICAgICBjc3NJbnQgICAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG4gICAgICAgICAgY3NzRmxvYXQgKCBwcm9wZXJ0eTogc3RyaW5nICk6IG51bWJlclxuXG4gICAgICAgICAgb24gOiBIVE1MRWxlbWVudCBbXCJhZGRFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgb2ZmOiBIVE1MRWxlbWVudCBbXCJyZW1vdmVFdmVudExpc3RlbmVyXCJdXG4gICAgICAgICAgJCAgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yXCJdXG4gICAgICAgICAgJCQgOiBIVE1MRWxlbWVudCBbXCJxdWVyeVNlbGVjdG9yQWxsXCJdXG4gICAgIH1cbn1cblxuV2luZG93LnByb3RvdHlwZS5vbiAgPSBXaW5kb3cucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJcbldpbmRvdy5wcm90b3R5cGUub2ZmID0gV2luZG93LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzcyA9IGZ1bmN0aW9uICggcHJvcHMgKVxue1xuT2JqZWN0LmFzc2lnbiAoIHRoaXMuc3R5bGUsIHByb3BzIClcbnJldHVybiB0aGlzXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5jc3NGbG9hdCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlRmxvYXQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuRWxlbWVudC5wcm90b3R5cGUub24gID0gRWxlbWVudC5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuXG5FbGVtZW50LnByb3RvdHlwZS5vZmYgPSBFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLiQgICA9IEVsZW1lbnQucHJvdG90eXBlLnF1ZXJ5U2VsZWN0b3JcblxuRWxlbWVudC5wcm90b3R5cGUuJCQgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvckFsbFxuXG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0ludCA9IGZ1bmN0aW9uICggcHJvcGVydHk6IHN0cmluZyApXG57XG4gICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50ICggdGhpcy5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggdGhpcyApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufSovXG5cbmV4cG9ydCBmdW5jdGlvbiBjc3MgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wczogUGFydGlhbCA8RXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uPiApXG57XG4gICAgIE9iamVjdC5hc3NpZ24gKCBlbC5zdHlsZSwgcHJvcHMgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3NzRmxvYXQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCAoIHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NJbnQgKCBlbDogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50LCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCBlbC5zdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlICggZWwgKVxuXG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUludCAoIHN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuIiwiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgY3NzSW50IH0gZnJvbSBcIi4vZG9tLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcblxuLy9leHBvcnQgdHlwZSBFeHBlbmRhYmxlUHJvcGVydHkgPSBcIndpZHRoXCIgfCBcImhlaWdodFwiXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IFwidG9wXCIgfCBcImxlZnRcIiB8IFwiYm90dG9tXCIgfCBcInJpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG5leHBvcnQgdHlwZSBFeHBlbmRhYmxlRWxlbWVudCA9IFJldHVyblR5cGUgPHR5cGVvZiBleHBhbmRhYmxlPlxuXG50eXBlIEV4cGVuZGFibGVPcHRpb25zID0gUGFydGlhbCA8RXhwZW5kYWJsZUNvbmZpZz5cblxuaW50ZXJmYWNlIEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgaGFuZGxlcyAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgcHJvcGVydHk/ICAgIDogc3RyaW5nLFxuICAgICBvcGVuICAgICAgICAgOiBib29sZWFuXG4gICAgIG5lYXIgICAgICAgICA6IG51bWJlclxuICAgICBkZWxheSAgICAgICAgOiBudW1iZXJcbiAgICAgZGlyZWN0aW9uICAgIDogRGlyZWN0aW9uXG4gICAgIG1pblNpemUgICAgICA6IG51bWJlclxuICAgICBtYXhTaXplICAgICAgOiBudW1iZXJcbiAgICAgdW5pdCAgICAgICAgIDogXCJweFwiIHwgXCIlXCIgfCBcIlwiLFxuICAgICBvbkJlZm9yZU9wZW4gOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHZvaWRcbiAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4gdm9pZFxuICAgICBvbkFmdGVyQ2xvc2UgOiAoKSA9PiB2b2lkXG59XG5cbmNvbnN0IHZlcnRpY2FsUHJvcGVydGllcyA9IFsgXCJoZWlnaHRcIiwgXCJ0b3BcIiwgXCJib3R0b21cIiBdXG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IEV4cGVuZGFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgOiBbXSxcbiAgICAgICAgICBwcm9wZXJ0eSAgICAgOiBcImhlaWdodFwiLFxuICAgICAgICAgIG9wZW4gICAgICAgICA6IGZhbHNlLFxuICAgICAgICAgIG5lYXIgICAgICAgICA6IDQwLFxuICAgICAgICAgIGRlbGF5ICAgICAgICA6IDI1MCxcbiAgICAgICAgICBtaW5TaXplICAgICAgOiAwLFxuICAgICAgICAgIG1heFNpemUgICAgICA6IHdpbmRvdy5pbm5lckhlaWdodCxcbiAgICAgICAgICB1bml0ICAgICAgICAgOiBcInB4XCIsXG4gICAgICAgICAgZGlyZWN0aW9uICAgIDogXCJ0YlwiLFxuICAgICAgICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IHt9LFxuICAgICAgICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHt9LFxuICAgICB9XG59XG5cbmNvbnN0IHRvU2lnbiA9IHtcbiAgICAgbHIgOiAxLFxuICAgICBybCA6IC0xLFxuICAgICB0YiA6IC0xLFxuICAgICBidCA6IDEsXG59XG5jb25zdCB0b1Byb3BlcnR5IDogUmVjb3JkIDxEaXJlY3Rpb24sIHN0cmluZz4gPSB7XG4gICAgIGxyIDogXCJ3aWR0aFwiLFxuICAgICBybCA6IFwid2lkdGhcIixcbiAgICAgdGIgOiBcImhlaWdodFwiLFxuICAgICBidCA6IFwiaGVpZ2h0XCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRhYmxlICggZWxlbWVudDogSlNYLkVsZW1lbnQsIG9wdGlvbnM6IEV4cGVuZGFibGVPcHRpb25zID0ge30gKVxue1xuICAgICBjb25zdCBjb25maWcgPSBkZWZhdWx0Q29uZmlnICgpXG5cbiAgICAgdmFyIGlzX29wZW4gICAgOiBib29sZWFuXG4gICAgIHZhciBpc192ZXJ0aWNhbDogYm9vbGVhblxuICAgICB2YXIgc2lnbiAgICAgICA6IG51bWJlclxuICAgICB2YXIgdW5pdCAgICAgICA6IEV4cGVuZGFibGVDb25maWcgW1widW5pdFwiXVxuICAgICB2YXIgY2IgICAgICAgICA6ICgpID0+IHZvaWRcbiAgICAgdmFyIG1pblNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIG1heFNpemUgICAgOiBudW1iZXJcbiAgICAgdmFyIHN0YXJ0X3NpemUgID0gMFxuICAgICB2YXIgb3Blbl9zaXplICAgPSAxMDBcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogW10sXG4gICAgICAgICAgb25TdGFydERyYWcgICA6IG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiBvblN0b3BEcmFnLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiBvbkVuZEFuaW1hdGlvbixcbiAgICAgfSlcblxuICAgICB1cGRhdGVDb25maWcgKCBvcHRpb25zIClcblxuICAgICBmdW5jdGlvbiB1cGRhdGVDb25maWcgKCBvcHRpb25zID0ge30gYXMgRXhwZW5kYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBvcHRpb25zLnByb3BlcnR5ID09IHVuZGVmaW5lZCAmJiBvcHRpb25zLmRpcmVjdGlvbiAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3B0aW9ucy5wcm9wZXJ0eSA9IHRvUHJvcGVydHkgW29wdGlvbnMuZGlyZWN0aW9uXVxuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc19vcGVuICAgICA9IGNvbmZpZy5vcGVuXG4gICAgICAgICAgc2lnbiAgICAgICAgPSB0b1NpZ24gW2NvbmZpZy5kaXJlY3Rpb25dXG4gICAgICAgICAgdW5pdCAgICAgICAgPSBjb25maWcudW5pdFxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gY29uZmlnLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgY29uZmlnLmRpcmVjdGlvbiA9PSBcInRiXCIgPyB0cnVlIDogZmFsc2VcbiAgICAgICAgICBtaW5TaXplID0gY29uZmlnLm1pblNpemVcbiAgICAgICAgICBtYXhTaXplID0gY29uZmlnLm1heFNpemVcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSAoIGlzX3ZlcnRpY2FsID8gXCJob3Jpem9udGFsXCIgOiBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAgICAoIGlzX3ZlcnRpY2FsID8gXCJ2ZXJ0aWNhbFwiIDogXCJob3Jpem9udGFsXCIgKVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWcgOiBpc192ZXJ0aWNhbCA/IG9uRHJhZ1ZlcnRpY2FsOiBvbkRyYWdIb3Jpem9udGFsLFxuICAgICAgICAgIH0pXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gc2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGlzX29wZW4gPyBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKSA6IDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b2dnbGUgKClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfb3BlbiApXG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvcGVuICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVPcGVuICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwiY2xvc2VcIiwgXCJvcGVuXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJPcGVuXG4gICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBvcGVuX3NpemUgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25maWcub25CZWZvcmVDbG9zZSAoKVxuXG4gICAgICAgICAgb3Blbl9zaXplID0gc2l6ZSAoKVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlcGxhY2UgKCBcIm9wZW5cIiwgXCJjbG9zZVwiIClcblxuICAgICAgICAgIGlmICggY2IgKVxuICAgICAgICAgICAgICAgb25UcmFuc2l0aW9uRW5kICgpXG5cbiAgICAgICAgICBjYiA9IGNvbmZpZy5vbkFmdGVyQ2xvc2VcbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IFwiMFwiICsgdW5pdFxuXG4gICAgICAgICAgaXNfb3BlbiA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBvcGVuLFxuICAgICAgICAgIGNsb3NlLFxuICAgICAgICAgIHRvZ2dsZSxcbiAgICAgICAgICBpc09wZW4gICAgIDogKCkgPT4gaXNfb3BlbixcbiAgICAgICAgICBpc0Nsb3NlICAgIDogKCkgPT4gISBpc19vcGVuLFxuICAgICAgICAgIGlzVmVydGljYWwgOiAoKSA9PiBpc192ZXJ0aWNhbCxcbiAgICAgICAgICBpc0FjdGl2ZSAgIDogKCkgPT4gZHJhZ2dhYmxlLmlzQWN0aXZlICgpLFxuICAgICAgICAgIGFjdGl2YXRlICAgOiAoKSA9PiBkcmFnZ2FibGUuYWN0aXZhdGUgKCksXG4gICAgICAgICAgZGVzYWN0aXZhdGU6ICgpID0+IGRyYWdnYWJsZS5kZXNhY3RpdmF0ZSAoKSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uVHJhbnNpdGlvbkVuZCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBjYiAoKVxuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCAoKSA9PiBvblRyYW5zaXRpb25FbmQgKVxuICAgICAgICAgIGNiID0gbnVsbFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25TdGFydERyYWcgKClcbiAgICAge1xuICAgICAgICAgIHN0YXJ0X3NpemUgPSBzaXplICgpXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyAoIG1pblNpemUsIGV2ZW50LnksIG1heFNpemUgKVxuICAgICAgICAgIGNvbnNvbGUubG9nICggY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXQgKVxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IGNsYW1wICggc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC55ICkgKyB1bml0XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnggKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICB2YXIgaXNfbW92ZWQgPSBpc192ZXJ0aWNhbCA/IHNpZ24gKiBldmVudC55ID4gY29uZmlnLm5lYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHNpZ24gKiBldmVudC54ID4gY29uZmlnLm5lYXJcblxuICAgICAgICAgIGlmICggKGlzX21vdmVkID09IGZhbHNlKSAmJiBldmVudC5kZWxheSA8PSBjb25maWcuZGVsYXkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRvZ2dsZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdGFyZ2V0X3NpemUgPSBjbGFtcCAoXG4gICAgICAgICAgICAgICBpc192ZXJ0aWNhbCA/IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnRhcmdldFhcbiAgICAgICAgICApXG5cbiAgICAgICAgICBpZiAoIHRhcmdldF9zaXplIDw9IGNvbmZpZy5uZWFyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbG9zZSAoKVxuICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRW5kQW5pbWF0aW9uICgpXG4gICAgIHtcbiAgICAgICAgICBvcGVuX3NpemUgPSBjc3NJbnQgKCBlbGVtZW50LCBjb25maWcucHJvcGVydHkgKVxuICAgICAgICAgIG9wZW4gKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGNsYW1wICggdjogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGlmICggdiA8IG1pblNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1pblNpemVcblxuICAgICAgICAgIGlmICggdiA+IG1heFNpemUgKVxuICAgICAgICAgICAgICAgcmV0dXJuIG1heFNpemVcblxuICAgICAgICAgIHJldHVybiB2XG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgQ3NzIH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5pbXBvcnQgeyBjc3NGbG9hdCB9IGZyb20gXCIuL2RvbS5qc1wiXG5pbXBvcnQgKiBhcyBVaSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi94bm9kZS5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uICAgPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgT3JpZW50YXRpb24gPSBcInZlcnRpY2FsXCIgfCBcImhvcml6b250YWxcIlxudHlwZSBVbml0cyAgICAgICA9IFwicHhcIiB8IFwiJVwiXG50eXBlIFN3aXBlYWJsZVByb3BlcnR5ID0gXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ4XCIgfCBcInlcIlxuXG50eXBlIFN3aXBlYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxTd2lwZWFibGVDb25maWc+XG5cbnR5cGUgU3dpcGVhYmxlQ29uZmlnID0ge1xuICAgICBoYW5kbGVzICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBkaXJlY3Rpb24gOiBEaXJlY3Rpb24sXG4gICAgIHBvcnBlcnR5PyA6IFN3aXBlYWJsZVByb3BlcnR5XG4gICAgIG1pblZhbHVlICA6IG51bWJlcixcbiAgICAgbWF4VmFsdWUgIDogbnVtYmVyLFxuICAgICB1bml0cyAgICAgOiBVbml0cyxcbiAgICAgbW91c2VXaGVlbDogYm9vbGVhblxufVxuXG5leHBvcnQgdHlwZSBTd2lwZWFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIHN3aXBlYWJsZT5cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogU3dpcGVhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uIDogXCJsclwiLFxuICAgICAgICAgIHBvcnBlcnR5ICA6IFwibGVmdFwiLFxuICAgICAgICAgIG1pblZhbHVlICA6IC0xMDAsXG4gICAgICAgICAgbWF4VmFsdWUgIDogMCxcbiAgICAgICAgICB1bml0cyAgICAgOiBcIiVcIixcbiAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICB9XG59XG5cbnZhciBzdGFydF9wb3NpdGlvbiA9IDBcbnZhciBpc192ZXJ0aWNhbCAgICA9IGZhbHNlXG52YXIgcHJvcCA6IFN3aXBlYWJsZVByb3BlcnR5XG5cbmV4cG9ydCBmdW5jdGlvbiBzd2lwZWFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogU3dpcGVhYmxlT3B0aW9ucyApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICBjb25zdCBkcmFnZ2FibGUgPSBVaS5kcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyxcbiAgICAgICAgICBvblN0b3BEcmFnLFxuICAgICB9KVxuXG4gICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwic3dpcGVhYmxlXCIgKVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnM6IFN3aXBlYWJsZU9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIGNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpc192ZXJ0aWNhbCA9IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IGNvbmZpZy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG5cbiAgICAgICAgICBpZiAoIG9wdGlvbnMucG9ycGVydHkgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIGNvbmZpZy5wb3JwZXJ0eSA9IGlzX3ZlcnRpY2FsID8gXCJ0b3BcIiA6IFwibGVmdFwiXG5cbiAgICAgICAgICAvLyBzd2l0Y2ggKCBjb25maWcucG9ycGVydHkgKVxuICAgICAgICAgIC8vIHtcbiAgICAgICAgICAvLyBjYXNlIFwidG9wXCI6IGNhc2UgXCJib3R0b21cIjogY2FzZSBcInlcIjogaXNfdmVydGljYWwgPSB0cnVlICA7IGJyZWFrXG4gICAgICAgICAgLy8gY2FzZSBcImxlZnRcIjogY2FzZSBcInJpZ2h0XCI6IGNhc2UgXCJ4XCI6IGlzX3ZlcnRpY2FsID0gZmFsc2UgOyBicmVha1xuICAgICAgICAgIC8vIGRlZmF1bHQ6IGRlYnVnZ2VyIDsgcmV0dXJuXG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgZHJhZ2dhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgaGFuZGxlczogY29uZmlnLmhhbmRsZXMsXG4gICAgICAgICAgICAgICBvbkRyYWc6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWwgOiBvbkRyYWdIb3Jpem9udGFsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHByb3AgPSBjb25maWcucG9ycGVydHlcblxuICAgICAgICAgIGlmICggZHJhZ2dhYmxlLmlzQWN0aXZlICgpIClcbiAgICAgICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gcG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBjc3NGbG9hdCAoIGVsZW1lbnQsIHByb3AgKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBkcmFnZ2FibGUuZGVzYWN0aXZhdGUgKClcbiAgICAgICAgICBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmcgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogbnVtYmVyLCB1bml0czogVW5pdHMgKTogdm9pZFxuICAgICBmdW5jdGlvbiBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdT86IFVuaXRzIClcbiAgICAge1xuICAgICAgICAgIGlmICggdHlwZW9mIG9mZnNldCA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB1ID0gQ3NzLmdldFVuaXQgKCBvZmZzZXQgKSBhcyBVbml0c1xuICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCAhIFtcInB4XCIsIFwiJVwiXS5pbmNsdWRlcyAoIHUgKSApXG4gICAgICAgICAgICAgICB1ID0gXCJweFwiXG5cbiAgICAgICAgICBpZiAoIHUgIT0gY29uZmlnLnVuaXRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICh1ID0gY29uZmlnLnVuaXRzKSA9PSBcIiVcIiApXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGVyY2VudHMgKCBvZmZzZXQgKVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB0b1BpeGVscyAoIG9mZnNldCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIG9mZnNldCApICsgdVxuICAgICB9XG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1cGRhdGVDb25maWcsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgc3dpcGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGlmICggY29uZmlnLm1vdXNlV2hlZWwgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgICAgICBoLmFkZEV2ZW50TGlzdGVuZXIgKCBcIndoZWVsXCIsIG9uV2hlZWwsIHsgcGFzc2l2ZTogdHJ1ZSB9IClcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIGNvbmZpZy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGgucmVtb3ZlRXZlbnRMaXN0ZW5lciAoIFwid2hlZWxcIiwgb25XaGVlbCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiB0b1BpeGVscyAoIHBlcmNlbnRhZ2U6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IG1pblZhbHVlOiBtaW4sIG1heFZhbHVlOiBtYXggfSA9IGNvbmZpZ1xuXG4gICAgICAgICAgaWYgKCBwZXJjZW50YWdlIDwgMTAwIClcbiAgICAgICAgICAgICAgIHBlcmNlbnRhZ2UgPSAxMDAgKyBwZXJjZW50YWdlXG5cbiAgICAgICAgICByZXR1cm4gbWluICsgKG1heCAtIG1pbikgKiBwZXJjZW50YWdlIC8gMTAwXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gdG9QZXJjZW50cyAoIHBpeGVsczogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG4gICAgICAgICAgcmV0dXJuIE1hdGguYWJzICggKHBpeGVscyAtIG1pbikgLyAobWF4IC0gbWluKSAqIDEwMCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJhbmltYXRlXCIgKVxuICAgICAgICAgIHN0YXJ0X3Bvc2l0aW9uID0gcG9zaXRpb24gKClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdWZXJ0aWNhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbcHJvcF0gPSBjbGFtcCAoIHN0YXJ0X3Bvc2l0aW9uICsgZXZlbnQueCApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZyAoIGV2ZW50OiBVaS5EcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJhbmltYXRlXCIgKVxuXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gaXNfdmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IGV2ZW50LnkgLy8rIGV2ZW50LnZlbG9jaXR5WVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogZXZlbnQueCAvLysgZXZlbnQudmVsb2NpdHlYXG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBvZmZzZXQgKSArIGNvbmZpZy51bml0c1xuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25XaGVlbCAoIGV2ZW50OiBXaGVlbEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggZXZlbnQuZGVsdGFNb2RlICE9IFdoZWVsRXZlbnQuRE9NX0RFTFRBX1BJWEVMIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBpc192ZXJ0aWNhbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIGRlbHRhID0gZXZlbnQuZGVsdGFZXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVhcblxuICAgICAgICAgICAgICAgaWYgKCBkZWx0YSA9PSAwIClcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggcG9zaXRpb24gKCkgKyBkZWx0YSApICsgY29uZmlnLnVuaXRzXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2YWx1ZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB2YWx1ZSA8IGNvbmZpZy5taW5WYWx1ZSA/IGNvbmZpZy5taW5WYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZSA+IGNvbmZpZy5tYXhWYWx1ZSA/IGNvbmZpZy5tYXhWYWx1ZVxuICAgICAgICAgICAgICAgOiB2YWx1ZVxuICAgICB9XG59XG4iLCJcblxuaW1wb3J0IHsgdUV2ZW50IH0gZnJvbSBcIi4uLy4uL0xpYi9pbmRleC5qc1wiXG5cbnR5cGUgUmVjb3JkcyA9IFJlY29yZCA8c3RyaW5nLCAoIC4uLiBhcmdzOiBhbnkgKSA9PiBhbnk+XG5cbmV4cG9ydCBpbnRlcmZhY2UgJENvbW1hbmQgZXh0ZW5kcyAkTm9kZVxue1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXBwbGljYXRpb25cIlxuICAgICB0eXBlOiBcImNvbW1hbmRcIlxuICAgICBuYW1lOiBzdHJpbmdcbiAgICAgc2hvcnRjdXQ6IHN0cmluZ1xufVxuXG5leHBvcnQgY2xhc3MgQ29tbWFuZHMgPFxuICAgICBDbWRzICAgZXh0ZW5kcyBSZWNvcmRzLFxuICAgICBDTmFtZXMgZXh0ZW5kcyBrZXlvZiBDbWRzXG4+XG57XG4gICAgIHN0YXRpYyBnZXQgY3VycmVudCAoKSB7IHJldHVybiBjdXJyZW50IH1cblxuICAgICByZWFkb25seSBkYiA9IHt9IGFzIENtZHNcbiAgICAgcmVhZG9ubHkgZXZlbnRzID0ge30gYXMgUmVjb3JkIDxDTmFtZXMsIHVFdmVudC5JRXZlbnQ+XG5cbiAgICAgY29uc3RydWN0b3IgKCkge31cblxuICAgICBhZGQgPEsgZXh0ZW5kcyBDTmFtZXM+ICggbmFtZTogSywgY2FsbGJhY2s6IENtZHMgW0tdIClcbiAgICAge1xuICAgICAgICAgIGlmICggbmFtZSBpbiB0aGlzLmRiIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICB0aGlzLmRiIFtuYW1lXSA9IGNhbGxiYWNrXG4gICAgIH1cblxuICAgICBoYXMgKCBrZXk6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ga2V5IGluIHRoaXMuZGJcbiAgICAgfVxuXG4gICAgIHJ1biA8SyBleHRlbmRzIENOYW1lcz4gKCBuYW1lOiBLLCAuLi4gYXJnczogUGFyYW1ldGVycyA8Q21kcyBbS10+IClcbiAgICAge1xuICAgICAgICAgIGlmICggbmFtZSBpbiB0aGlzLmRiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmRiIFtuYW1lXSAoIC4uLiBhcmdzIGFzIGFueSApXG5cbiAgICAgICAgICAgICAgIGlmICggbmFtZSBpbiB0aGlzLmV2ZW50cyApXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzIFtuYW1lXS5kaXNwYXRjaCAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIG9uICggbmFtZTogQ05hbWVzLCBjYWxsYmFjazogKCkgPT4gdm9pZCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjYWxsYmFja3MgPSBuYW1lIGluIHRoaXMuZXZlbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRoaXMuZXZlbnRzIFtuYW1lXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmV2ZW50cyBbbmFtZV0gPSB1RXZlbnQuY3JlYXRlICgpXG5cbiAgICAgICAgICBjYWxsYmFja3MgKCBjYWxsYmFjayApXG4gICAgIH1cblxuICAgICByZW1vdmUgKCBrZXk6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5kYiBba2V5XVxuICAgICB9XG59XG5cbmNvbnN0IGN1cnJlbnQgPSBuZXcgQ29tbWFuZHMgKClcbiIsIlxuaW1wb3J0IHsgY3JlYXRlTm9kZSB9IGZyb20gXCIuLi8uLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQ29tcG9uZW50IDxDIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyAkQ2x1c3RlciA8Qz5cbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IFwiY29uY2VwdC11aVwiXG4gICAgICAgICAgdHlwZTogc3RyaW5nXG4gICAgICAgICAgY2hpbGRyZW4/OiBDIFtdIC8vIFJlY29yZCA8c3RyaW5nLCAkQ2hpbGQ+XG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCA8JCBleHRlbmRzICRDb21wb25lbnQgPSAkQ29tcG9uZW50Plxue1xuICAgICBkYXRhOiAkXG5cbiAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuICAgICBkZWZhdWx0RGF0YSAoKSA6ICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKFxuICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUgKCBkYXRhLnR5cGUsIGRhdGEuaWQsIGRhdGEgKSBhcyBhbnlcbiAgICAgICAgICApXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpOiAoSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50KSBbXVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gPGRpdiBjbGFzcz17IHRoaXMuZGF0YS50eXBlIH0+PC9kaXY+XG4gICAgICAgICAgICAgICB0aGlzLm9uQ3JlYXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG1ha2VIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgKFwiTm90IGltcGxlbWVudGVkXCIpXG4gICAgIH1cblxuICAgICBwcm90ZWN0ZWQgbWFrZVN2ZyAoKVxuICAgICB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIChcIk5vdCBpbXBsZW1lbnRlZFwiKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG1ha2VGYWJyaWMgKClcbiAgICAge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoXCJOb3QgaW1wbGVtZW50ZWRcIilcbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlSHRtbCAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlU3ZnICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgb25DcmVhdGVGYWJyaWMgKClcbiAgICAge1xuXG4gICAgIH1cblxufVxuXG5cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9EYXRhL2luZGV4LnRzXCIgLz5cblxuaW1wb3J0IHsgRmFjdG9yeSwgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtdWlcIlxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSA8JEFueUNvbXBvbmVudHM+ICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPENvbXBvbmVudCwgJEFueUNvbXBvbmVudHM+ICggZGIgKVxuXG5leHBvcnQgY29uc3QgaW5TdG9jazogdHlwZW9mIGZhY3RvcnkuaW5TdG9jayA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5faW5TdG9jayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgcGljazogdHlwZW9mIGZhY3RvcnkucGljayA9IGZ1bmN0aW9uICggLi4uIHJlc3Q6IGFueSBbXSApXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5fcGljayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgbWFrZTogdHlwZW9mIGZhY3RvcnkubWFrZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICBpZiAoIGlzTm9kZSAoIGFyZyApIClcbiAgICAgICAgICB2YXIgZGF0YSA9IGFyZ1xuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9tYWtlICggcGF0aCwgZGF0YSApXG59XG5cbmV4cG9ydCBjb25zdCBzZXQ6IHR5cGVvZiBkYi5zZXQgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcblxuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAgZGIuc2V0ICggYXJnIClcbiAgICAgZWxzZVxuICAgICAgICAgIGRiLnNldCAoIGFyZywgbm9ybWFsaXplICggYXJndW1lbnRzIFsxXSApIClcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmluZTogdHlwZW9mIGZhY3RvcnkuZGVmaW5lID0gZnVuY3Rpb24gKCBjdG9yOiBhbnksIC4uLiByZXN0OiBhbnkgKVxue1xuICAgICBjb25zdCBhcmcgPSByZXN0Lmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIHJlc3QgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiByZXN0XSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgcGF0aCApXG59XG5cblxuZnVuY3Rpb24gaXNOb2RlICggb2JsOiBhbnkgKVxue1xuICAgICByZXR1cm4gdHlwZW9mIG9ibCA9PSBcIm9iamVjdFwiICYmICEgQXJyYXkuaXNBcnJheSAob2JsKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBhcmc6IGFueSApXG57XG4gICAgIGlmICggQXJyYXkuaXNBcnJheSAoYXJnKSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZyBbMF0gIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgYXJnLnVuc2hpZnQgKCBDT05URVhUIClcbiAgICAgfVxuICAgICBlbHNlIGlmICggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiIClcbiAgICAge1xuICAgICAgICAgIGlmICggXCJjb250ZXh0XCIgaW4gYXJnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGFyZy5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAoYXJnIGFzIGFueSkuY29udGV4dCA9IENPTlRFWFRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJnXG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRQaGFudG9tIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJwaGFudG9tXCJcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGhhbnRvbSBleHRlbmRzIENvbXBvbmVudCA8JFBoYW50b20+XG57XG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiZGl2XCIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmNvbnRlbnRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIuY2hpbGROb2RlcyBhcyBhbnkgYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxufVxuXG5cbiIsIlxuaW1wb3J0IHsgcGljaywgaW5TdG9jaywgbWFrZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IFBoYW50b20gfSBmcm9tIFwiLi4vLi4vQ29tcG9uZW50L1BoYW50b20vaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4veG5vZGUuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRDb250YWluZXIgPEMgZXh0ZW5kcyAkQ29tcG9uZW50ID0gJEFueUNvbXBvbmVudHM+IGV4dGVuZHMgJENvbXBvbmVudCAvL0RhdGEuJENsdXN0ZXIgPEM+XG4gICAgIHtcbiAgICAgICAgICBkaXJlY3Rpb24/OiBEaXJlY3Rpb25cbiAgICAgICAgICBjaGlsZHJlbj86IEMgW10gLy8gUmVjb3JkIDxzdHJpbmcsICBDPlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb250YWluZXIgPCQgZXh0ZW5kcyAkQ29udGFpbmVyID0gJENvbnRhaW5lcj4gZXh0ZW5kcyBDb21wb25lbnQgPCQ+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbXBvbmVudD5cbiAgICAgc2xvdDogSlNYLkVsZW1lbnRcblxuICAgICByZWFkb25seSBpc192ZXJ0aWNhbDogYm9vbGVhblxuXG4gICAgIGRlZmF1bHREYXRhICgpIDogJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgOiBcImNvbXBvbmVudFwiLFxuICAgICAgICAgICAgICAgaWQgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb25zdHJ1Y3RvciAoIGRhdGE6ICQgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBkYXRhIClcblxuICAgICAgICAgIGRhdGEgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IGRhdGEuY2hpbGRyZW5cblxuICAgICAgICAgIGlmICggY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGluU3RvY2sgKCBjaGlsZCApIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlICggY2hpbGQgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuaXNfdmVydGljYWwgPSBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgID0gc3VwZXIuZ2V0SHRtbCAoKVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3QgZGF0YSAgICAgID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgaWYgKCB0aGlzLmlzX3ZlcnRpY2FsIClcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJ2ZXJ0aWNhbFwiIClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSAoIFwidmVydGljYWxcIiApXG5cbiAgICAgICAgICBpZiAoIHRoaXMuc2xvdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy5zbG90ID0gY29udGFpbmVyXG5cbiAgICAgICAgICBjb25zdCBzbG90ID0gdGhpcy5zbG90XG5cbiAgICAgICAgICBpZiAoIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG5ld19jaGlsZHJlbiA9IFtdIGFzIENvbXBvbmVudCBbXVxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbyA9IHBpY2sgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgIHNsb3QuYXBwZW5kICggLi4uIG8uZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuIFtvLmRhdGEuaWRdID0gb1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICB0aGlzLm9uQ2hpbGRyZW5BZGRlZCAoIG5ld19jaGlsZHJlbiApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cblxuICAgICBvbkNoaWxkcmVuQWRkZWQgKCBjb21wb25lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGFwcGVuZCAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQW55Q29tcG9uZW50cykgW10gKVxuICAgICB7XG5cbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IHNsb3QgICAgICA9IHRoaXMuc2xvdFxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuICA9IHRoaXMuY2hpbGRyZW5cbiAgICAgICAgICBjb25zdCBuZXdfY2hpbGQgPSBbXSBhcyBDb21wb25lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBlIG9mIGVsZW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBlID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlID0gbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogZVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZSBpZiAoIGUgaW5zdGFuY2VvZiBFbGVtZW50IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgVUlfQ09NUE9ORU5UID0gU3ltYm9sLmZvciAoIFwiVUlfQ09NUE9ORU5UXCIgKVxuXG4gICAgICAgICAgICAgICAgICAgIGUgPSBlIFtVSV9DT01QT05FTlRdICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZSBbVUlfQ09NUE9ORU5UXVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IFBoYW50b20gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogXCJwaGFudG9tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlLm91dGVySFRNTFxuICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggIShlIGluc3RhbmNlb2YgQ29tcG9uZW50KSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBpblN0b2NrICggZSApXG4gICAgICAgICAgICAgICAgICAgICAgPyBwaWNrICggZSApXG4gICAgICAgICAgICAgICAgICAgICAgOiBtYWtlICggZSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGNoaWxkcmVuIFsoZSBhcyBDb21wb25lbnQpLmRhdGEuaWRdID0gZSBhcyBDb21wb25lbnRcbiAgICAgICAgICAgICAgIHNsb3QuYXBwZW5kICggLi4uIChlIGFzIENvbXBvbmVudCkuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICBuZXdfY2hpbGQucHVzaCAoIGUgYXMgQ29tcG9uZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIG5ld19jaGlsZC5sZW5ndGggPiAwIClcbiAgICAgICAgICAgICAgIHRoaXMub25DaGlsZHJlbkFkZGVkICggbmV3X2NoaWxkIClcbiAgICAgfVxuXG4gICAgIHJlbW92ZSAoIC4uLiBlbGVtZW50czogKHN0cmluZyB8IEVsZW1lbnQgfCBDb21wb25lbnQgfCAkQ29tcG9uZW50KSBbXSApXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgY2xlYXIgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPSB7fVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciApXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgIH1cblxuICAgICBnZXRPcmllbnRhdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZGF0YS5kaXJlY3Rpb25cbiAgICAgfVxuXG4gICAgIHNldE9yaWVudGF0aW9uICggdmFsdWU6IERpcmVjdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmRhdGFcblxuICAgICAgICAgIGlmICggdmFsdWUgPT0gY29uZmlnLmRpcmVjdGlvbiApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBpZiAoIHRoaXMuaXNfdmVydGljYWwgKVxuICAgICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICggXCJ2ZXJ0aWNhbFwiIClcblxuICAgICAgICAgIGNvbmZpZy5kaXJlY3Rpb24gPSB2YWx1ZVxuICAgICAgICAgIDsodGhpcy5pc192ZXJ0aWNhbCBhcyBib29sZWFuKSA9IHZhbHVlID09IFwiYnRcIiB8fCB2YWx1ZSA9PSBcInRiXCJcbiAgICAgfVxufVxuXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRCbG9jayBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwiYmxvY2tcIlxuICAgICAgICAgIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvblxuICAgICAgICAgIGVsZW1lbnRzOiBDb21wb25lbnQgW11cbiAgICAgfVxufVxuXG50eXBlIE9yaWVudGF0aW9uID0gXCJ2ZXJ0aWNhbFwiIHwgXCJob3Jpem9udGFsXCJcblxuZXhwb3J0IGNsYXNzIEJsb2NrIGV4dGVuZHMgQ29tcG9uZW50IDwkQmxvY2s+XG57XG4gICAgIGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJiYXJcIj48L2Rpdj5cblxuICAgICBnZXQgb3JpZW50YXRpb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuY29udGFpbnMgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgICAgICAgPyBcImhvcml6b250YWxcIlxuICAgICAgICAgICAgICAgOiBcInZlcnRpY2FsXCJcbiAgICAgfVxuXG4gICAgIHNldCBvcmllbnRhdGlvbiAoIG9yaWVudGF0aW9uOiBPcmllbnRhdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3RcblxuICAgICAgICAgIHZhciBuZXdfb3JpZW50YXRpb24gPSBjbGFzc0xpc3QuY29udGFpbnMgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBcImhvcml6b250YWxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcInZlcnRpY2FsXCJcblxuICAgICAgICAgIGlmICggb3JpZW50YXRpb24gPT0gbmV3X29yaWVudGF0aW9uIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY2xhc3NMaXN0LnJlcGxhY2UgICggb3JpZW50YXRpb24sIG5ld19vcmllbnRhdGlvbiApXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCbG9jaywgW1wiYmxvY2tcIl0gKVxuIiwiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICAgZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgQ29tbWFuZHMgfSAgZnJvbSBcIi4uLy4uL0Jhc2UvY29tbWFuZC5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSAgICBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG5leHBvcnQgY2xhc3MgQnV0dG9uIGV4dGVuZHMgQ29tcG9uZW50IDwkQnV0dG9uPlxue1xuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuXG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gPGRpdiBjbGFzcz1cImJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICB7IGRhdGEuaWNvbiA/IDxzcGFuIGNsYXNzPVwiaWNvblwiPnsgZGF0YS5pY29uIH08L3NwYW4+IDogbnVsbCB9XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS50ZXh0ID8gPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+eyBkYXRhLnRleHQgfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jYWxsYmFjayAhPSB1bmRlZmluZWQgfHwgdGhpcy5kYXRhLmNvbW1hbmQgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyICggXCJjbGlja1wiLCB0aGlzLm9uVG91Y2guYmluZCAodGhpcykgKVxuXG4gICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IG5vZGVcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gWyB0aGlzLmNvbnRhaW5lciBdIGFzIEhUTUxFbGVtZW50IFtdXG4gICAgIH1cblxuICAgICBvblRvdWNoICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jYWxsYmFjayAmJiB0aGlzLmRhdGEuY2FsbGJhY2sgKCkgIT09IHRydWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIENvbW1hbmRzLmN1cnJlbnQucnVuICggdGhpcy5kYXRhLmNvbW1hbmQgKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG9uSG92ZXIgKClcbiAgICAge1xuXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCdXR0b24sIFtcImJ1dHRvblwiXSApXG4iLCJcblxuaW1wb3J0IHsgc2V0IH0gICAgICBmcm9tIFwiLi4vLi4vZGIuanNcIlxuaW1wb3J0IHsgQ29tbWFuZHMgfSBmcm9tIFwiLi4vLi4vQmFzZS9jb21tYW5kLmpzXCJcbmltcG9ydCB7IHhub2RlIH0gICAgZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRCdXR0b24gZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgIDogXCJidXR0b25cIlxuICAgICAgICAgIGljb24gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdG9vbHRpcD8gICA6IEpTWC5FbGVtZW50XG4gICAgICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgICAgICBjYWxsYmFjaz8gIDogKCkgPT4gYm9vbGVhbiB8IHZvaWQsXG4gICAgICAgICAgY29tbWFuZD8gICA6IHN0cmluZyxcbiAgICAgICAgICBoYW5kbGVPbj8gIDogXCJ0b2dnbGVcIiB8IFwiZHJhZ1wiIHwgXCIqXCJcbiAgICAgfVxufVxuXG5jb25zdCBfQnV0dG9uID0gKCBkYXRhOiAkQnV0dG9uICkgPT5cbntcbiAgICAgY29uc3Qgb25Ub3VjaCA9ICgpID0+XG4gICAgIHtcbiAgICAgICAgICBpZiAoIGRhdGEuY2FsbGJhY2sgJiYgZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIENvbW1hbmRzLmN1cnJlbnQucnVuICggZGF0YS5jb21tYW5kIClcbiAgICAgfVxuXG4gICAgIGNvbnN0IG5vZGUgPVxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJidXR0b25cIiBvbkNsaWNrPXsgZGF0YS5jYWxsYmFjayB8fCBkYXRhLmNvbW1hbmQgPyBvblRvdWNoIDogbnVsbCB9PlxuICAgICAgICAgICAgICAgeyBkYXRhLmljb24gPyA8c3BhbiBjbGFzcz1cImljb25cIj57IGRhdGEuaWNvbiB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgeyBkYXRhLnRleHQgPyA8c3BhbiBjbGFzcz1cInRleHRcIj57IGRhdGEudGV4dCB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgIHJldHVybiBub2RlXG59XG5cblxuZXhwb3J0IHsgQnV0dG9uIH0gZnJvbSBcIi4vaHRtbC5qc1wiXG5cbmV4cG9ydCBjb25zdCAkZGVmYXVsdCA9IHtcbiAgICAgdHlwZTogXCJidXR0b25cIiBhcyBcImJ1dHRvblwiLFxuICAgICBpZCAgOiB1bmRlZmluZWQsXG4gICAgIGljb246IHVuZGVmaW5lZCxcbn1cblxuc2V0IDwkQnV0dG9uPiAoIFsgXCJidXR0b25cIiBdLCAkZGVmYXVsdCApXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29udGFpbmVyL2luZGV4LmpzXCJcbmltcG9ydCB7IHN3aXBlYWJsZSwgU3dpcGVhYmxlRWxlbWVudCB9IGZyb20gXCIuLi8uLi9CYXNlL3N3aXBlYWJsZS5qc1wiXG5pbXBvcnQgeyBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRTbGlkZXNob3cgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgICA6IFwic2xpZGVzaG93XCJcbiAgICAgICAgICBjaGlsZHJlbiAgICA6ICRBbnlDb21wb25lbnRzIFtdXG4gICAgICAgICAgaXNTd2lwZWFibGU/OiBib29sZWFuXG4gICAgIH1cblxuICAgICBleHBvcnQgaW50ZXJmYWNlICRTbGlkZSBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2xpZGVcIlxuICAgICB9XG59XG5cbi8vICAgYGBgXG4vLyAgIC5zbGlkZXNob3dcbi8vICAgICAgICBbLi4uXVxuLy8gICBgYGBcbmV4cG9ydCBjbGFzcyBTbGlkZXNob3cgZXh0ZW5kcyBDb250YWluZXIgPCRTbGlkZXNob3c+XG57XG4gICAgIGNoaWxkcmVuID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbnRhaW5lcj5cbiAgICAgY3VycmVudDogQ29tcG9uZW50XG4gICAgIHByaXZhdGUgc3dpcGVhYmxlOiBTd2lwZWFibGVFbGVtZW50XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcblxuICAgICAgICAgIGlmICggZGF0YS5pc1N3aXBlYWJsZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy5zd2lwZWFibGUgPSBzd2lwZWFibGUgKCBjb250YWluZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcyAgIDogWyBjb250YWluZXIgXSxcbiAgICAgICAgICAgICAgICAgICAgbWluVmFsdWUgIDogLTAsXG4gICAgICAgICAgICAgICAgICAgIG1heFZhbHVlICA6IDAsXG4gICAgICAgICAgICAgICAgICAgIHBvcnBlcnR5ICA6IGRhdGEuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBkYXRhLmRpcmVjdGlvbiA9PSBcInRiXCIgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgICAgIDogXCJweFwiLFxuICAgICAgICAgICAgICAgICAgICBtb3VzZVdoZWVsOiB0cnVlLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLmFjdGl2YXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRzXG4gICAgIH1cblxuICAgICBzaG93ICggaWQ6IHN0cmluZywgLi4uIGNvbnRlbnQ6IChzdHJpbmcgfCBFbGVtZW50IHwgQ29tcG9uZW50IHwgJEFueUNvbXBvbmVudHMgKSBbXSApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjaGlsZCA9IHRoaXMuY2hpbGRyZW4gW2lkXVxuXG4gICAgICAgICAgaWYgKCBjaGlsZCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIHRoaXMuY3VycmVudCApXG4gICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBjaGlsZFxuXG4gICAgICAgICAgaWYgKCBjb250ZW50IClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjaGlsZC5jbGVhciAoKVxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCBjb250ZW50IClcbiAgICAgICAgICAgICAgIGNoaWxkLmFwcGVuZCAoIC4uLiBjb250ZW50IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjaGlsZC5jb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgICB9XG59XG5cbmRlZmluZSAoIFNsaWRlc2hvdywgW1wic2xpZGVzaG93XCJdIClcbmRlZmluZSAoIENvbnRhaW5lciwgW1wic2xpZGVcIl0gICAgIClcbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBVbml0IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9jc3MvdW5pdC5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuaW1wb3J0IHsgU3dpcGVhYmxlRWxlbWVudCwgc3dpcGVhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc3dpcGVhYmxlLmpzXCJcbmltcG9ydCB7IEV4cGVuZGFibGVFbGVtZW50LCBleHBhbmRhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2UvZXhwZW5kYWJsZS5qc1wiXG5pbXBvcnQgeyBjc3NGbG9hdCB9IGZyb20gXCIuLi8uLi9CYXNlL2RvbS5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJExpc3RWaWV3IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJsaXN0LXZpZXdcIlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMaXN0VmlldyA8JCBleHRlbmRzICRFeHRlbmRzIDwkTGlzdFZpZXc+PiBleHRlbmRzIENvbnRhaW5lciA8JD5cbntcbiAgICAgc3dpcGVhYmxlOiBFeHBlbmRhYmxlRWxlbWVudFxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBjb25zdCBzbG90ID0gdGhpcy5zbG90ID0gPGRpdiBjbGFzcz1cImxpc3Qtdmlldy1zbGlkZVwiPjwvZGl2PlxuXG4gICAgICAgICAgc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcblxuICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQgKCBzbG90IClcbiAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIFwibGlzdC12aWV3XCIgKVxuXG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUgPSBleHBhbmRhYmxlICggc2xvdCwge1xuICAgICAgICAgICAgICAgaGFuZGxlcyAgIDogWyBjb250YWluZXIgXSxcbiAgICAgICAgICAgICAgIG1pblNpemUgIDogMCxcbiAgICAgICAgICAgICAgIG1heFNpemUgIDogMCxcbiAgICAgICAgICAgICAgIHByb3BlcnR5ICA6IHRoaXMuaXNfdmVydGljYWwgPyBcInRvcFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbiA6IHRoaXMuZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICB1bml0ICAgICA6IFwicHhcIixcbiAgICAgICAgICAgICAgIC8vbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLmFjdGl2YXRlICgpXG5cbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlLnVwZGF0ZUNvbmZpZyAoe1xuICAgICAgICAgICAgICAgICAgICBtaW5TaXplOiAtdGhpcy5zbGlkZVNpemUgKCksXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuICAgICB9XG5cbiAgICAgb25DaGlsZHJlbkFkZGVkICggZWxlbWVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgIG1pblNpemUgIDogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAgICAgICAgICAgcHJvcGVydHkgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgc2xpZGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHNsb3QgfSA9IHRoaXNcblxuICAgICAgICAgIHJldHVybiBjc3NGbG9hdCAoIHNsb3QsIHRoaXMuaXNfdmVydGljYWwgPyBcImhlaWdodFwiIDogXCJ3aWR0aFwiIClcbiAgICAgfVxuXG4gICAgIHN3aXBlICggb2Zmc2V0OiBzdHJpbmd8bnVtYmVyLCB1bml0PzogXCJweFwiIHwgXCIlXCIgKVxuICAgICB7XG4gICAgICAgICAvLyBpZiAoIHR5cGVvZiBvZmZzZXQgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0IClcbiAgICAgICAgIC8vIGVsc2VcbiAgICAgICAgIC8vICAgICAgdGhpcy5zd2lwZWFibGUuc3dpcGUgKCBvZmZzZXQsIHVuaXQgKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IExpc3RWaWV3IH0gZnJvbSBcIi4uL0xpc3QvaW5kZXguanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcInRiXCIgfCBcImJ0XCJcblxudHlwZSBVbml0cyA9IFwicHhcIiB8IFwiJVwiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJFRvb2xiYXIgZXh0ZW5kcyAkRXh0ZW5kcyA8JExpc3RWaWV3PiAvLyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiXG4gICAgICAgICAgdGl0bGUgICAgOiBzdHJpbmdcbiAgICAgICAgICBidXR0b25zICA6ICRCdXR0b24gW11cbiAgICAgfVxufVxuXG5jb25zdCB0b0ZsZXhEaXJlY3Rpb24gPSB7XG4gICAgIGxyOiBcInJvd1wiICAgICAgICAgICAgYXMgXCJyb3dcIixcbiAgICAgcmw6IFwicm93LXJldmVyc2VcIiAgICBhcyBcInJvdy1yZXZlcnNlXCIsXG4gICAgIHRiOiBcImNvbHVtblwiICAgICAgICAgYXMgXCJjb2x1bW5cIixcbiAgICAgYnQ6IFwiY29sdW1uLXJldmVyc2VcIiBhcyBcImNvbHVtbi1yZXZlcnNlXCIsXG59XG5cbmNvbnN0IHRvUmV2ZXJzZSA9IHtcbiAgICAgbHI6IFwicmxcIiBhcyBcInJsXCIsXG4gICAgIHJsOiBcImxyXCIgYXMgXCJsclwiLFxuICAgICB0YjogXCJidFwiIGFzIFwiYnRcIixcbiAgICAgYnQ6IFwidGJcIiBhcyBcInRiXCIsXG59XG5cbi8qKlxuICogICBgYGBwdWdcbiAqICAgLnRvb2xiYXJcbiAqICAgICAgICAudG9vbGJhci1iYWNrZ3JvdW5nXG4gKiAgICAgICAgLnRvb2xiYXItc2xpZGVcbiAqICAgICAgICAgICAgIFsuLi5dXG4gKiAgIGBgYFxuICovXG5leHBvcnQgY2xhc3MgVG9vbGJhciBleHRlbmRzIExpc3RWaWV3IDwkVG9vbGJhcj5cbntcbiAgICAgdGFicyAgICAgIDogSlNYLkVsZW1lbnQgW11cbiAgICAgYmFja2dyb3VuZDogSlNYLkVsZW1lbnRcblxuICAgICBkZWZhdWx0Q29uZmlnICgpOiAkVG9vbGJhclxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIC4uLiBzdXBlci5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCIsXG4gICAgICAgICAgICAgICB0aXRsZSAgICA6IFwiVGl0bGUgLi4uXCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb246IFwibHJcIixcbiAgICAgICAgICAgICAgIC8vcmV2ZXJzZSAgOiBmYWxzZSxcbiAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtdXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmJ1dHRvbnMgKVxuICAgICAgICAgICAgICAgdGhpcy5hcHBlbmQgKCAuLi4gdGhpcy5kYXRhLmJ1dHRvbnMgKVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxufVxuXG5kZWZpbmUgKCBUb29sYmFyLCBbXCJ0b29sYmFyXCJdIClcbiIsIlxuaW1wb3J0IHsgZHJhZ2dhYmxlLCBEcmFnRXZlbnQgfSBmcm9tIFwiLi9kcmFnZ2FibGUuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxudHlwZSBET01FbGVtZW50ID0gSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NvbGxhYmxlQ29uZmlnXG57XG4gICAgIGhhbmRsZXM6IERPTUVsZW1lbnQgW11cbiAgICAgZGlyZWN0aW9uOiBEaXJlY3Rpb25cbn1cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogU2NvbGxhYmxlQ29uZmlnXG57XG4gICAgIHJldHVybiB7XG4gICAgICAgICAgaGFuZGxlcyAgOiBbXSxcbiAgICAgICAgICBkaXJlY3Rpb246IFwidGJcIlxuICAgICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbGFibGVOYXRpdmUgKCBvcHRpb25zOiBTY29sbGFibGVDb25maWcgKVxue1xuICAgICBkZXNhY3RpdmF0ZSAoKVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGlyID0gb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IFwicGFuLXlcIiA6IFwicGFuLXhcIlxuXG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS50b3VjaEFjdGlvbiA9IGRpclxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRpciA9IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcInBhbi15XCIgOiBcInBhbi14XCJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUudG91Y2hBY3Rpb24gPSBcIm5vbmVcIlxuICAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzY29sbGFibGUgKCBvcHRpb25zOiBTY29sbGFibGVDb25maWcgKVxue1xuICAgICBpZiAoIFwib250b3VjaHN0YXJ0XCIgaW4gd2luZG93IClcbiAgICAgICAgICByZXR1cm4gc2Nyb2xsYWJsZU5hdGl2ZSAoIG9wdGlvbnMgKVxuXG4gICAgIGNvbnN0IGRyYWcgPSBkcmFnZ2FibGUgKHtcbiAgICAgICAgICBoYW5kbGVzICAgICAgIDogb3B0aW9ucy5oYW5kbGVzLFxuICAgICAgICAgIHZlbG9jaXR5RmFjdG9yOiAxMDAsXG4gICAgICAgICAgb25TdGFydERyYWcsXG4gICAgICAgICAgb25EcmFnICAgICA6IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgID8gb25EcmFnVmVydGljYWxcbiAgICAgICAgICAgICAgICAgICAgIDogb25EcmFnSG9yaXpvbnRhbCxcbiAgICAgICAgICBvblN0b3BEcmFnOiBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gb25TdG9wRHJhZ1ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgIDogb25TdG9wRHJhZ0hvcml6b250YWwsXG4gICAgIH0pXG5cbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBhY3RpdmF0ZTogKCkgPT4geyBkcmFnLmFjdGl2YXRlICgpIH1cbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnREcmFnICgpXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJ1bnNldFwiXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCwgMCApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKVxuICAgICAgICAgICAgICAgLy9oLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJzbW9vdGhcIlxuICAgICAgICAgICAgICAgLy9oLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSArIGV2ZW50LnZlbG9jaXR5WSApXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25TdG9wRHJhZ0hvcml6b250YWwgKCBldmVudDogRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCwgMCApXG4gICAgICAgICAgICAgICAvL2guc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBcInNtb290aFwiXG4gICAgICAgICAgICAgICAvL2guc2Nyb2xsQnkgKCBldmVudC5vZmZzZXRYICsgZXZlbnQudmVsb2NpdHlYLCAwIClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuLy9pbXBvcnQgeyBleHBhbmRhYmxlLCBFeHBlbmRhYmxlRWxlbWVudCB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgc2NvbGxhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc2Nyb2xsYWJsZS5qc1wiXG5pbXBvcnQgeyBwaWNrLCBkZWZpbmUsIGluU3RvY2ssIG1ha2UgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFBhbmVsIGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICAgIDogXCJwYW5lbFwiLFxuICAgICAgICAgIC8vaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgICAgICBoZWFkZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgICAgICBjaGlsZHJlbj8gICAgOiAkQW55Q29tcG9uZW50cyBbXSxcbiAgICAgICAgICBmb290ZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgfVxufVxuXG5jb25zdCB0b1Bvc2l0aW9uID0ge1xuICAgICBsciA6IFwibGVmdFwiLFxuICAgICBybCA6IFwicmlnaHRcIixcbiAgICAgdGIgOiBcInRvcFwiLFxuICAgICBidCA6IFwiYm90dG9tXCIsXG59XG5cbi8qKlxuICogICBgYGBcbiAqICAgLnBhbmVsXG4gKiAgICAgICAgLnBhbmVsLWhlYWRlclxuICogICAgICAgICAgICAgLnBhbmVsLW1haW4tYnV0dHRvblxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgICAgICAucGFuZWwtY29udGVudFxuICogICAgICAgICAgICAgWy4uLl1cbiAqICAgICAgICAucGFuZWwtZm9vdGVyXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFBhbmVsIDwkIGV4dGVuZHMgJEV4dGVuZHMgPCRQYW5lbD4+IGV4dGVuZHMgQ29udGFpbmVyIDwkPlxue1xuICAgICAvL21haW5fYnV0dG9uOiBKU1guRWxlbWVudFxuICAgICBjb250ZW50ICAgIDogQ29tcG9uZW50XG4gICAgIGhlYWRlciAgICAgOiBDb21wb25lbnRcbiAgICAgX2hlYWRlcjogSlNYLkVsZW1lbnRcbiAgICAgX2NvbnRlbnQ6IEpTWC5FbGVtZW50XG5cbiAgICAgLy9wcm90ZWN0ZWQgZXhwYW5kYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICBkZWZhdWx0RGF0YSAoKTogJFBhbmVsXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgLi4uIHN1cGVyLmRlZmF1bHREYXRhICgpLFxuICAgICAgICAgICAgICAgdHlwZSAgICAgICAgIDogXCJwYW5lbFwiLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gICAgIDogW10sXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcInJsXCIsXG4gICAgICAgICAgICAgICAvL2hhc01haW5CdXR0b246IHRydWUsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGhlYWRlciAgICA9IDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkZXJcIiAvPlxuICAgICAgICAgICAgICAgY29uc3QgY29udGVudCAgID0gPGRpdiBjbGFzcz1cInBhbmVsLWNvbnRlbnRcIiAvPlxuICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gPGRpdiBjbGFzcz1cInBhbmVsIGNsb3NlXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgaGVhZGVyIH1cbiAgICAgICAgICAgICAgICAgICAgeyBjb250ZW50IH1cbiAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICAgICAgIC8vIGlmICggZGF0YS5oYXNNYWluQnV0dG9uIClcbiAgICAgICAgICAgICAgIC8vIHtcbiAgICAgICAgICAgICAgIC8vICAgICAgY29uc3QgYnRuID0gPHNwYW4gY2xhc3M9XCJwYW5lbC1tYWluLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgLy8gICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvblwiPuKHlTwvc3Bhbj5cbiAgICAgICAgICAgICAgIC8vICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICAvLyAgICAgIHRoaXMubWFpbl9idXR0b24gPSBidG5cbiAgICAgICAgICAgICAgIC8vICAgICAgaGVhZGVyLmFwcGVuZCAoIGJ0biApXG4gICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgIGlmICggZGF0YS5oZWFkZXIgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYWRlciA9IGluU3RvY2sgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcGljayAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBtYWtlICggZGF0YS5oZWFkZXIgKVxuXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlci5hcHBlbmQgKCAuLi4gdGhpcy5oZWFkZXIuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vc3VwZXIuYXBwZW5kICggLi4uIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBjb25zdCBjaGlsZCBvZiBkYXRhLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGluU3RvY2sgKCBjaGlsZCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gcGljayAoIGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBtYWtlICggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5hcHBlbmQgKCAuLi4gdGhpcy5jb250ZW50LmdldEh0bWwgKCkgKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IGNvbnRhaW5lclxuXG4gICAgICAgICAgICAgICAvLyB0aGlzLmV4cGFuZGFibGUgPSBleHBhbmRhYmxlICggY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAvLyAgICAgIGRpcmVjdGlvbiAgICA6IGRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgLy8gICAgICBuZWFyICAgICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgIC8vICAgICAgaGFuZGxlcyAgICAgIDogQXJyYXkub2YgKCB0aGlzLm1haW5fYnV0dG9uICksXG4gICAgICAgICAgICAgICAvLyAgICAgIG9uQWZ0ZXJPcGVuICA6ICgpID0+IHtcbiAgICAgICAgICAgICAgIC8vICAgICAgICAgICAvL2NvbnRlbnQuc3R5bGUub3ZlcmZsb3cgPSBcIlwiXG4gICAgICAgICAgICAgICAvLyAgICAgICAgICAgY29udGVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgICAgICAvLyAgICAgIH0sXG4gICAgICAgICAgICAgICAvLyAgICAgIG9uQmVmb3JlQ2xvc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgIC8vICAgICAgICAgICAvL2NvbnRlbnQuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiXG4gICAgICAgICAgICAgICAvLyAgICAgICAgICAgY29udGVudC5jbGFzc0xpc3QuYWRkICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgICAgICAvLyAgICAgIH1cbiAgICAgICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICAgICAgIC8vIHRoaXMuZXhwYW5kYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgICAgICBzY29sbGFibGUgKHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlczogW2NvbnRlbnRdLFxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwiYnRcIlxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIC5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgICAgICB0aGlzLl9oZWFkZXIgPSBoZWFkZXJcbiAgICAgICAgICAgICAgIHRoaXMuX2NvbnRlbnQgPSBjb250ZW50XG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCB0b1Bvc2l0aW9uIFtkYXRhLmRpcmVjdGlvbl0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIC8vIHByaXZhdGUgb25DbGlja1RhYiAoKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgdGhpcy5vcGVuICgpXG4gICAgIC8vIH1cblxuICAgICAvL2lzT3BlbiAoKVxuICAgICAvL3tcbiAgICAgLy8gICAgIHJldHVybiB0aGlzLmV4cGFuZGFibGUuaXNPcGVuICgpXG4gICAgIC8vfVxuXG4gICAgIC8vaXNDbG9zZSAoKVxuICAgICAvL3tcbiAgICAgLy8gICAgIHJldHVybiB0aGlzLmV4cGFuZGFibGUuaXNDbG9zZSAoKVxuICAgICAvL31cblxuICAgICBzZXRPcmllbnRhdGlvbiAoIHZhbHVlOiBEaXJlY3Rpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzXG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICggdG9Qb3NpdGlvbiBbZGF0YS5kaXJlY3Rpb25dIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggdG9Qb3NpdGlvbiBbdmFsdWVdIClcblxuICAgICAgICAgIHN1cGVyLnNldE9yaWVudGF0aW9uICggdmFsdWUgKVxuXG4gICAgICAgICAgLy9leHBhbmRhYmxlLnVwZGF0ZUNvbmZpZyAoeyBkaXJlY3Rpb246IHZhbHVlIH0pXG5cbiAgICAgICAgICBkYXRhLmRpcmVjdGlvbiA9IHZhbHVlXG4gICAgIH1cblxuICAgICAvLyBvcGVuICggaWQ/OiBzdHJpbmcsIC4uLiBjb250ZW50OiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRDb21wb25lbnQpIFtdIClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIC8vaWYgKCBhcmd1bWVudHMubGVuZ3RoID4gMSApXG4gICAgIC8vICAgICAgLy8gICAgIHRoaXMuc2xpZGVzaG93LnNob3cgKCBpZCwgLi4uIGNvbnRlbnQgKVxuXG4gICAgIC8vICAgICAgLy90aGlzLmV4cGFuZGFibGUub3BlbiAoKVxuXG4gICAgIC8vICAgICAgLy90aGlzLmNvbnRlbnQgKCAuLi4gYXJncyApXG5cbiAgICAgLy8gICAgICByZXR1cm4gdGhpc1xuICAgICAvLyB9XG5cbiAgICAgLy8gY2xvc2UgKClcbiAgICAgLy8ge1xuICAgICAvLyAgICAgIHRoaXMuZXhwYW5kYWJsZS5jbG9zZSAoKVxuXG4gICAgIC8vICAgICAgcmV0dXJuIHRoaXNcbiAgICAgLy8gfVxuXG4gICAgIC8vc2l6ZSA9IDBcblxuICAgICAvLyByZXNpemUgKCBzaXplOiBudW1iZXIgKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgY29uc3QgeyBleHBhbmRhYmxlLCBjb250YWluZXIgfSA9IHRoaXNcblxuICAgICAvLyAgICAgIGlmICggZXhwYW5kYWJsZS5pc1ZlcnRpY2FsICgpIClcbiAgICAgLy8gICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBzaXplICsgXCJweFwiXG4gICAgIC8vICAgICAgZWxzZVxuICAgICAvLyAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gc2l6ZSArIFwicHhcIlxuXG4gICAgIC8vICAgICAgdGhpcy5zaXplID0gc2l6ZVxuICAgICAvLyB9XG5cbiAgICAgLy8gZXhwYW5kICggb2Zmc2V0OiBudW1iZXIgKVxuICAgICAvLyB7XG4gICAgIC8vICAgICAgY29uc3QgeyBleHBhbmRhYmxlLCBjb250YWluZXIgfSA9IHRoaXNcblxuICAgICAvLyAgICAgIGNvbnN0IHNpemUgPSB0aGlzLnNpemUgKyBvZmZzZXRcblxuICAgICAvLyAgICAgIGlmICggZXhwYW5kYWJsZS5pc1ZlcnRpY2FsICgpIClcbiAgICAgLy8gICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBzaXplICsgXCJweFwiXG4gICAgIC8vICAgICAgZWxzZVxuICAgICAvLyAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLndpZHRoID0gc2l6ZSArIFwicHhcIlxuXG4gICAgIC8vICAgICAgdGhpcy5zaXplID0gc2l6ZVxuICAgICAvLyB9XG59XG5cbmRlZmluZSAoIFBhbmVsLCBbXCJwYW5lbFwiXSApXG5cbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBQYW5lbCB9IGZyb20gXCIuLi9QYW5lbC9pbmRleC5qc1wiXG5pbXBvcnQgeyBleHBhbmRhYmxlLCBFeHBlbmRhYmxlRWxlbWVudCB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRTaWRlTWVudSBleHRlbmRzIE9taXQgPCRQYW5lbCwgXCJ0eXBlXCI+XG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNpZGUtbWVudVwiXG4gICAgICAgICAgaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgfVxufVxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5leHBvcnQgY2xhc3MgU2lkZU1lbnUgZXh0ZW5kcyBQYW5lbCA8JFNpZGVNZW51Plxue1xuICAgICBtYWluX2J1dHRvbjogSlNYLkVsZW1lbnRcbiAgICAgZXhwYW5kYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGRhdGEgICAgICA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG4gICAgICAgICAgY29uc3QgaGVhZGVyICAgID0gdGhpcy5faGVhZGVyXG4gICAgICAgICAgY29uc3QgY29udGVudCAgID0gdGhpcy5fY29udGVudFxuXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZXBsYWNlICggXCJwYW5lbFwiICAgICAgICAsIFwic2lkZS1tZW51XCIgKVxuICAgICAgICAgIGhlYWRlciAgIC5jbGFzc0xpc3QucmVwbGFjZSAoIFwicGFuZWwtaGVhZGVyXCIgLCBcInNpZGUtbWVudS1oZWFkZXJcIiApXG4gICAgICAgICAgY29udGVudCAgLmNsYXNzTGlzdC5yZXBsYWNlICggXCJwYW5lbC1jb250ZW50XCIsIFwic2lkZS1tZW51LWNvbnRlbnRcIiApXG5cbiAgICAgICAgICBpZiAoIGRhdGEuaGFzTWFpbkJ1dHRvbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gPHNwYW4gY2xhc3M9XCJzaWRlLW1lbnUtbWFpbi1idXR0b25cIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uXCI+4oeVPC9zcGFuPlxuICAgICAgICAgICAgICAgPC9zcGFuPlxuXG4gICAgICAgICAgICAgICB0aGlzLm1haW5fYnV0dG9uID0gYnRuXG4gICAgICAgICAgICAgICAvL3RoaXMuY29udGFpbmVyLmluc2VydEFkamFjZW50RWxlbWVudCAoIFwiYWZ0ZXJiZWdpblwiLCBidG4gKVxuICAgICAgICAgICAgICAgaGVhZGVyLmluc2VydEFkamFjZW50RWxlbWVudCAoIFwiYWZ0ZXJiZWdpblwiLCBidG4gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZSA9IGV4cGFuZGFibGUgKCB0aGlzLmNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgZGlyZWN0aW9uICAgIDogZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICBuZWFyICAgICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICAgICA6IEFycmF5Lm9mICggdGhpcy5tYWluX2J1dHRvbiApLFxuICAgICAgICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImhpZGRlblwiIClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuY2xhc3NMaXN0LmFkZCAoIFwiaGlkZGVuXCIgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG5cbiAgICAgaXNPcGVuICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5leHBhbmRhYmxlLmlzT3BlbiAoKVxuICAgICB9XG5cbiAgICAgaXNDbG9zZSAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kYWJsZS5pc0Nsb3NlICgpXG4gICAgIH1cblxuICAgICBvcGVuICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZS5jbG9zZSAoKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXNcbiAgICAgfVxuXG4gICAgIC8vIHNldE9yaWVudGF0aW9uICggdmFsdWU6IERpcmVjdGlvbiApXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5zZXRPcmllbnRhdGlvbiAoIHZhbHVlIClcblxuICAgICAvLyAgICAgIGNvbnN0IHsgZXhwYW5kYWJsZSB9ID0gdGhpc1xuXG4gICAgIC8vICAgICAgZXhwYW5kYWJsZS51cGRhdGVDb25maWcgKHsgZGlyZWN0aW9uOiB2YWx1ZSB9KVxuXG4gICAgIC8vIH1cbn1cblxuZGVmaW5lICggU2lkZU1lbnUsIFtcInNpZGUtbWVudVwiXSApXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZXhwb3J0IHR5cGUgU2hhcGVOYW1lcyA9IGtleW9mIFNoYXBlRGVmaW5pdGlvbnNcblxuZXhwb3J0IGludGVyZmFjZSBTaGFwZURlZmluaXRpb25zXG57XG4gICAgIGNpcmNsZSAgIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdHJpYW5nbGUgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBzcXVhcmUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHBhbnRhZ29uIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgaGV4YWdvbiAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICB0ZXh0ICAgICA6IFRleHREZWZpbml0aW9uLFxuICAgICB0ZXh0Ym94ICA6IFRleHREZWZpbml0aW9uLFxuICAgICBwYXRoICAgICA6IFBhdGhEZWZpbml0aW9uLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgc2l6ZTogbnVtYmVyLFxuICAgICB4PyAgOiBudW1iZXIsXG4gICAgIHk/ICA6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZWZpbml0aW9uIGV4dGVuZHMgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoRGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgcGF0aDogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSA8VCBleHRlbmRzIFNoYXBlTmFtZXM+IChcbiAgICAgdHlwZTogVCxcbiAgICAgZGVmIDogU2hhcGVEZWZpbml0aW9ucyBbVF0sXG4pOiBSZXR1cm5UeXBlIDx0eXBlb2YgU3ZnRmFjdG9yeSBbVF0+XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSAoIHR5cGU6IFNoYXBlTmFtZXMsIGRlZjogYW55IClcbntcbiAgICAgc3dpdGNoICggdHlwZSApXG4gICAgIHtcbiAgICAgY2FzZSBcImNpcmNsZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LmNpcmNsZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRyaWFuZ2xlXCI6IHJldHVybiBTdmdGYWN0b3J5LnRyaWFuZ2xlICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInBhbnRhZ29uXCI6IHJldHVybiBTdmdGYWN0b3J5LnBhbnRhZ29uICggZGVmIClcbiAgICAgY2FzZSBcImhleGFnb25cIiA6IHJldHVybiBTdmdGYWN0b3J5LmhleGFnb24gICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnRleHQgICAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRib3hcIiA6IHJldHVybiBTdmdGYWN0b3J5LnRleHRib3ggICggZGVmIClcbiAgICAgY2FzZSBcInBhdGhcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnBhdGggICAgICggZGVmIClcbiAgICAgfVxufVxuXG5jbGFzcyBTdmdGYWN0b3J5XG57XG4gICAgIC8vIFRvIGdldCB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb24gcG9pbnRzXG4gICAgIC8vXG4gICAgIC8vIHZhciBhID0gTWF0aC5QSSoyLzRcbiAgICAgLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbiAgICAgLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG4gICAgIHN0YXRpYyBjaXJjbGUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IDxjaXJjbGVcbiAgICAgICAgICAgICAgIGN4ID0geyBkZWYueCB8fCAwIH1cbiAgICAgICAgICAgICAgIGN5ID0geyBkZWYueSB8fCAwIH1cbiAgICAgICAgICAgICAgIHIgID0geyBkZWYuc2l6ZSAvIDIgfVxuICAgICAgICAgIC8+XG5cbiAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICB9XG5cbiAgICAgc3RhdGljIHRyaWFuZ2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgc3F1YXJlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIHBhbnRhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIGhleGFnb24gKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyB0ZXh0ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0ZXh0Ym94ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHBhdGggKCBkZWY6IFBhdGhEZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG59XG4iLCJpbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCAqIGFzIFN2ZyBmcm9tIFwiLi4vLi4vQmFzZS9TdmcvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5cbmNvbnN0IEcgPSBHZW9tZXRyeVxuXG50eXBlIFJlbmRlcmVyID0gKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uICkgPT4gU1ZHRWxlbWVudCBbXVxudHlwZSBSYWRpYWxEZWZpbml0aW9uID0gR2VvbWV0cnkuUmFkaWFsRGVmaW5pdGlvblxudHlwZSBSYWRpYWxPcHRpb24gICAgID0gR2VvbWV0cnkuUmFkaWFsT3B0aW9uXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkUmFkaWFsTWVudSBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgICAgICBidXR0b25zOiBQYXJ0aWFsIDwkQnV0dG9uPiBbXSxcbiAgICAgICAgICByb3RhdGlvbjogbnVtYmVyXG4gICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgUmFkaWFsTWVudSBleHRlbmRzIENvbXBvbmVudCA8JFJhZGlhbE1lbnU+XG57XG4gICAgIGNvbnRhaW5lcjogU1ZHU1ZHRWxlbWVudFxuICAgICBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uXG5cbiAgICAgcmVhZG9ubHkgcmVuZGVyZXJzOiBSZWNvcmQgPHN0cmluZywgUmVuZGVyZXI+ID0ge1xuICAgICAgICAgIFwiY2lyY2xlXCI6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcy5iaW5kICh0aGlzKVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXIgYXMgYW55XVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIGJ1dHRvbnM6ICRCdXR0b24gW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5kYXRhLmJ1dHRvbnMucHVzaCAoIC4uLiBidXR0b25zIGFzIGFueSApXG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGRlZjogUmFkaWFsT3B0aW9uID0ge1xuICAgICAgICAgICAgICAgY291bnQgIDogZGF0YS5idXR0b25zLmxlbmd0aCxcbiAgICAgICAgICAgICAgIHIgICAgICA6IDc1LFxuICAgICAgICAgICAgICAgcGFkZGluZzogNixcbiAgICAgICAgICAgICAgIHJvdGF0aW9uOiBkYXRhLnJvdGF0aW9uIHx8IDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRlZmluaXRpb24gPSBHLmdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIGRlZiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgID0gdGhpcy50b1N2ZyAoIFwiY2lyY2xlXCIgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgeyBvcHRpb25zIH0gPSB0aGlzXG4gICAgICAgICAgLy9mb3IgKCBjb25zdCBidG4gb2Ygb3B0aW9ucy5idXR0b25zIClcbiAgICAgICAgICAvLyAgICAgYnRuLlxuICAgICB9XG5cbiAgICAgc2hvdyAoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHZvaWRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLmNvbnRhaW5lclxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZGVmaW5pdGlvbi53aWR0aCAvIDJcblxuICAgICAgICAgIG4uc3R5bGUubGVmdCA9ICh4IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uc3R5bGUudG9wICA9ICh5IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uY2xhc3NMaXN0LnJlbW92ZSAoIFwiY2xvc2VcIiApXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUuYmluZCAodGhpcyksIHRydWUgKVxuICAgICB9XG5cbiAgICAgaGlkZSAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCAoXCJjbG9zZVwiKVxuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUgKVxuICAgICB9XG5cbiAgICAgdG9TdmcgKCBzdHlsZTogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGVmaW5pdGlvbjogZGVmLCByZW5kZXJlcnMsIGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHN2ZyA9XG4gICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzICAgPVwicmFkaWFsLW1lbnUgY2xvc2VcIlxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgID17IGRlZi53aWR0aCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgPXsgZGVmLmhlaWdodCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIHZpZXdCb3ggPXsgYDAgMCAkeyBkZWYud2lkdGggfSAkeyBkZWYuaGVpZ2h0IH1gIH1cbiAgICAgICAgICAgICAgIC8+IGFzIFNWR1NWR0VsZW1lbnRcblxuICAgICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBzdHlsZSBpbiByZW5kZXJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHJlbmRlcmVycyBbc3R5bGVdICggZGVmIClcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZiApXG5cbiAgICAgICAgICBzdmcuYXBwZW5kICggLi4uIGJ1dHRvbnMgYXMgTm9kZSBbXSApXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGJ1dHRvbnMubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvcHQgPSBkYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9wdC5jYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBidXR0b25zIFtpXS5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgKCkgPT4gb3B0LmNhbGxiYWNrICgpIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc3ZnXG4gICAgIH1cblxuICAgICByZW5kZXJTdmdDaXJjbGVzICggZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwb2ludHMgID0gZGVmaW5pdGlvbi5wb2ludHNcbiAgICAgICAgICBjb25zdCBwYWRkaW5nID0gZGVmaW5pdGlvbi5wYWRkaW5nXG4gICAgICAgICAgY29uc3QgYnV0dHVucyA9IFtdIGFzIFNWR0VsZW1lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7ICsraSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZGVmID0gcG9pbnRzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5kYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gPGcgY2xhc3M9XCJidXR0b25cIiAvPlxuXG4gICAgICAgICAgICAgICBjb25zdCBjaXJjbGUgPSBTdmcuY3JlYXRlU3ZnU2hhcGUgKCBcImNpcmNsZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGRlZi5jaG9yZC5sZW5ndGggLSBwYWRkaW5nICogMixcbiAgICAgICAgICAgICAgICAgICAgeDogZGVmLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGRlZi55XG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gPHRleHRcbiAgICAgICAgICAgICAgICAgICAgeCA9IHsgZGVmLnggfVxuICAgICAgICAgICAgICAgICAgICB5ID0geyBkZWYueSB9XG4gICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZT1cIjMwXCJcbiAgICAgICAgICAgICAgICAgICAgZmlsbD1cImJsYWNrXCJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJ1c2VyLXNlbGVjdDogbm9uZTsgY3Vyc29yOiBwb2ludGVyOyBkb21pbmFudC1iYXNlbGluZTogY2VudHJhbDsgdGV4dC1hbmNob3I6IG1pZGRsZTtcIlxuICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgaWYgKCBidG4uZm9udEZhbWlseSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0LnNldEF0dHJpYnV0ZSAoIFwiZm9udC1mYW1pbHlcIiwgYnRuLmZvbnRGYW1pbHkgKVxuXG4gICAgICAgICAgICAgICB0ZXh0LmlubmVySFRNTCA9IGJ0bi5pY29uXG5cbiAgICAgICAgICAgICAgIGdyb3VwLmFwcGVuZCAoIGNpcmNsZSApXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCB0ZXh0IClcblxuICAgICAgICAgICAgICAgYnV0dHVucy5wdXNoICggZ3JvdXAgYXMgU1ZHRWxlbWVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGJ1dHR1bnNcbiAgICAgfVxufVxuXG4iLCJcbmltcG9ydCB7IHhub2RlLCBDb21wb25lbnQsIGRlZmluZSB9IGZyb20gXCIuLi8uLi9pbmRleC5qc1wiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vRGF0YS9kYi5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG5cbiAgICAgZXhwb3J0IGludGVyZmFjZSAkUGVyc29uVmlld2VyIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJwZXJzb24tdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGVyc29uVmlld2VlciBleHRlbmRzIENvbXBvbmVudCA8JFBlcnNvblZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHBlcnNvbjogJFBlcnNvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCBjYXJkIClcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBQZXJzb25WaWV3ZWVyLCB7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgOiBcInBlcnNvbi12aWV3ZXJcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxufSlcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3R5cGVzLmQudHNcIiAvPlxuXG5pbXBvcnQgeyBEYXRhYmFzZSB9IGZyb20gXCIuLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5jb25zdCBDT05URVhUID0gXCJjb25jZXB0LWRhdGFcIlxuY29uc3QgRGF0YSA9IG5ldyBEYXRhYmFzZSAoKVxuXG50eXBlICRJbiA8JCBleHRlbmRzICRUaGluZyA9ICRUaGluZz4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSAoIG5vZGU6ICRJbiApXG57XG4gICAgIGlmICggXCJjb250ZXh0XCIgaW4gbm9kZSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5vZGUuY29udGV4dCAhPT0gQ09OVEVYVCApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBjb250ZXh0IHZhbHVlXCJcbiAgICAgfVxuICAgICBlbHNlXG4gICAgIHtcbiAgICAgICAgICAobm9kZSBhcyBXcml0YWJsZSA8JE5vZGU+KS5jb250ZXh0ID0gQ09OVEVYVFxuICAgICB9XG5cbiAgICAgcmV0dXJuIG5vZGUgYXMgJE5vZGVcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlIDwkIGV4dGVuZHMgJFRoaW5nPiAoIG5vZGU6ICRJbiApOiAkXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSA8JCBleHRlbmRzICRUaGluZz4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6ICRcbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlICgpXG57XG4gICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICByZXR1cm5cblxuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAgcmV0dXJuIERhdGEuZ2V0ICggbm9ybWFsaXplICggYXJndW1lbnRzIFswXSApIClcbiAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBEYXRhLmdldCAoIENPTlRFWFQsIC4uLiBhcmd1bWVudHMgKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Tm9kZSA8JCBleHRlbmRzICRUaGluZz4gKCBub2RlOiAkSW4gPCQ+IClcbntcbiAgICAgRGF0YS5zZXQgKCBub3JtYWxpemUgKCBub2RlICkgKVxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjb3VudERhdGEgKCB0eXBlOiBzdHJpbmcgKVxue1xuICAgICByZXR1cm4gRGF0YS5jb3VudCAoIFwiY29uY2VwdC1kYXRhXCIsIHR5cGUgKVxufVxuIiwiXG5pbXBvcnQgeyB4bm9kZSwgQ29tcG9uZW50LCBkZWZpbmUgfSBmcm9tIFwiLi4vLi4vaW5kZXguanNcIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0RhdGEvZGIuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRTa2lsbFZpZXdlciBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwic2tpbGwtdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2tpbGxWaWV3ZXIgZXh0ZW5kcyBDb21wb25lbnQgPCRTa2lsbFZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHNraWxsOiAkU2tpbGwgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gPGRpdiBjbGFzcz1cInBlb3BsZVwiPjwvZGl2PlxuXG4gICAgICAgICAgZm9yICggY29uc3QgbmFtZSBvZiBza2lsbC5pdGVtcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgcGVyc29uID0gZGIuZ2V0Tm9kZSA8JFBlcnNvbj4gKCBuYW1lIClcblxuICAgICAgICAgICAgICAgY29uc3QgY2FyZCA9IDxkaXYgY2xhc3M9XCJ3My1jYXJkLTQgcGVyc29uLWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGg0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIHRhcmdldC5hcHBlbmQgKCBjYXJkIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5jbGFzc0xpc3QuYWRkICggXCJjb250YWluZXJcIiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxoMT57IHNraWxsLmlkIH08L2gxPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPHA+eyBza2lsbC5kZXNjcmlwdGlvbiB9PC9wPiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggdGFyZ2V0IClcblxuICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9Mb3JET25pWC9qc29uLXZpZXdlci9ibG9iL21hc3Rlci9zcmMvanNvbi12aWV3ZXIuanNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cHJlPnsgSlNPTi5zdHJpbmdpZnkgKCBza2lsbCwgbnVsbCwgMyApIH08L3ByZT4gKVxuICAgICB9XG59XG5cbmRlZmluZSAoIFNraWxsVmlld2VyLCB7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgOiBcInNraWxsLXZpZXdlclwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG59KVxuIiwiXG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsLmpzXCJcblxuaW1wb3J0IHsgJEdlb21ldHJ5IH0gZnJvbSBcIi4vZ2VvbWV0cnkuanNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG57XG4gICAgIHRleHQ6IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG57XG4gICAgIHBhdGg6IHN0cmluZ1xufVxuXG5jb25zdCBmYWJyaWNfYmFzZV9vYnRpb25zOiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgPSB7XG4gICAgIGxlZnQgICA6IDAsXG4gICAgIHRvcCAgICA6IDAsXG4gICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4gICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG59XG5cbmV4cG9ydCBjb25zdCBGYWN0b3J5ID1cbntcbiAgICAgZ3JvdXAgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JQ2lyY2xlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5Hcm91cCAoIHVuZGVmaW5lZCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICB3aWR0aDogc2l6ZSxcbiAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIC8vIFRvIGdldCB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb24gcG9pbnRzXG4gICAgIC8vXG4gICAgIC8vIHZhciBhID0gTWF0aC5QSSoyLzRcbiAgICAgLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbiAgICAgLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG4gICAgIGNpcmNsZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklDaXJjbGVPcHRpb25zIClcbiAgICAge1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuQ2lyY2xlIChcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgICAgICByYWRpdXM6IHNpemUgLyAyLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cbiAgICAgdHJpYW5nbGUgKCBkZWY6ICRHZW9tZXRyeSwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JVHJpYW5nbGVPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyA9IFtdXG4gICAgICAgICAgY29uc3Qgc2NhbGUgPSAxLjJcbiAgICAgICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgICAgICAgZm9yICggY29uc3QgcCBvZiBbXG4gICAgICAgICAgICAgICBbIDAsIDEgXSxcbiAgICAgICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXVxuICAgICAgICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgYW5nbGU6IDE4MCxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG5cbiAgICAgc3F1YXJlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSVJlY3RPcHRpb25zIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHNjYWxlID0gMC45XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUmVjdCAoXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgd2lkdGggOiBzaXplICogc2NhbGUsXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHNpemUgKiBzY2FsZSxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG4gICAgIHBhbnRhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzID0gW11cbiAgICAgICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICAgICAgIGNvbnN0IHIgPSBzaXplIC8gMiAqIHNjYWxlXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBwIG9mIFtcbiAgICAgICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgICAgICAgWyAwLjk1MTA1NjUxNjI5NTE1MzUsIDAuMzA5MDE2OTk0Mzc0OTQ3NDUgXSxcbiAgICAgICAgICAgICAgIFsgMC41ODc3ODUyNTIyOTI0NzMyLCAtMC44MDkwMTY5OTQzNzQ5NDczIF0sXG4gICAgICAgICAgICAgICBbIC0wLjU4Nzc4NTI1MjI5MjQ3MywgLTAuODA5MDE2OTk0Mzc0OTQ3NSBdLFxuICAgICAgICAgICAgICAgWyAtMC45NTEwNTY1MTYyOTUxNTM2LCAwLjMwOTAxNjk5NDM3NDk0NzIzIF1cbiAgICAgICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgICAgICAgfSlcbiAgICAgfSxcblxuICAgICBoZXhhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcG9pbnRzID0gW11cbiAgICAgICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICAgICAgIGNvbnN0IHIgPSBzaXplIC8gMiAqIHNjYWxlXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBwIG9mIFtcbiAgICAgICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgICAgICAgWyAwLjg2NjAyNTQwMzc4NDQzODYsIDAuNTAwMDAwMDAwMDAwMDAwMSBdLFxuICAgICAgICAgICAgICAgWyAwLjg2NjAyNTQwMzc4NDQzODcsIC0wLjQ5OTk5OTk5OTk5OTk5OTggXSxcbiAgICAgICAgICAgICAgIFsgMS4yMjQ2NDY3OTkxNDczNTMyZS0xNiwgLTEgXSxcbiAgICAgICAgICAgICAgIFsgLTAuODY2MDI1NDAzNzg0NDM4NSwgLTAuNTAwMDAwMDAwMDAwMDAwNCBdLFxuICAgICAgICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0MzksIDAuNDk5OTk5OTk5OTk5OTk5MzMgXSxcbiAgICAgICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICAgICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGFuZ2xlOiA5MCxcbiAgICAgICAgICB9KVxuICAgICB9LFxuXG5cbiAgICAgdGV4dCAoIGRlZjogVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuVGV4dCAoIFwiLi4uXCIsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGZvbnRTaXplOiBzaXplLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cbiAgICAgdGV4dGJveCAoIGRlZjogVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBmYWJyaWMuVGV4dGJveCAoIFwiLi4uXCIsIHtcbiAgICAgICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICAgICAgIGZvbnRTaXplOiBzaXplLFxuICAgICAgICAgIH0pXG4gICAgIH0sXG5cblxuICAgICBwYXRoICggZGVmOiBQYXRoRGVmaW5pdGlvbiwgc2l6ZTogbnVtYmVyLCBvcHQ6IGZhYnJpYy5JT2JqZWN0T3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gbmV3IGZhYnJpYy5QYXRoICggZGVmLnBhdGgsXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgICAgICAgc2NhbGVYOiBzaXplIC8gMTAwLCAvLyBFbiBzdXBwb3NhbnQgcXVlIGxlIHZpZXdCb3hcbiAgICAgICAgICAgICAgIHNjYWxlWTogc2l6ZSAvIDEwMCwgLy8gZXN0IFwiMCAwIDEwMCAxMDBcIlxuICAgICAgICAgIH0pXG4gICAgIH0sXG59XG5cblxuIiwiXG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsLmpzXCJcblxuaW1wb3J0IHsgJFNoYXBlLCBTaGFwZSB9IGZyb20gXCIuLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IEZhY3RvcnkgfSBmcm9tIFwiLi9mYWN0b3J5LmpzXCJcblxuZXhwb3J0IHR5cGUgR2VvbWV0cnlOYW1lcyA9IGtleW9mIHR5cGVvZiBGYWN0b3J5XG5cbmV4cG9ydCBpbnRlcmZhY2UgJEdlb21ldHJ5XG57XG4gICAgIHNoYXBlOiBHZW9tZXRyeU5hbWVzXG4gICAgIHggICAgICAgICA6IG51bWJlclxuICAgICB5ICAgICAgICAgOiBudW1iZXJcblxuICAgICBib3JkZXJXaWR0aCAgICA6IG51bWJlclxuICAgICBib3JkZXJDb2xvciAgICA6IHN0cmluZ1xuXG4gICAgIGJhY2tncm91bmRDb2xvciA6IHN0cmluZ1xuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiBzdHJpbmdcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogYm9vbGVhblxufVxuXG5leHBvcnQgY2xhc3MgR2VvbWV0cnkgPFQgZXh0ZW5kcyBHZW9tZXRyeU5hbWVzID0gR2VvbWV0cnlOYW1lcz5cbntcbiAgICAgY29uZmlnOiAkR2VvbWV0cnlcbiAgICAgb2JqZWN0OiBSZXR1cm5UeXBlIDx0eXBlb2YgRmFjdG9yeSBbVF0+XG5cbiAgICAgY29uc3RydWN0b3IgKCByZWFkb25seSBvd25lcjogU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jb25maWcgPSBvd25lci5jb25maWdcbiAgICAgICAgICB0aGlzLnVwZGF0ZVNoYXBlICgpXG4gICAgIH1cblxuICAgICB1cGRhdGUgKCBvcHRpb25zOiBQYXJ0aWFsIDwkR2VvbWV0cnk+IClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCB0aGlzLmNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICBpZiAoIFwic2hhcGVcIiBpbiBvcHRpb25zIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVNoYXBlICgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKCBcImJhY2tncm91bmRJbWFnZVwiIGluIG9wdGlvbnMgfHwgXCJiYWNrZ3JvdW5kUmVwZWF0XCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1cGRhdGVQb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG9iamVjdCB9ID0gdGhpc1xuXG4gICAgICAgICAgOyhvYmplY3QgYXMgZmFicmljLk9iamVjdCkuc2V0ICh7XG4gICAgICAgICAgICAgICBsZWZ0OiBjb25maWcueCxcbiAgICAgICAgICAgICAgIHRvcCA6IGNvbmZpZy55LFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBvd25lciwgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHNpemUgPSBvd25lci5kaXNwbGF5U2l6ZSAoKVxuXG4gICAgICAgICAgaWYgKCBjb25maWcuc2hhcGUgPT0gXCJjaXJjbGVcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgKG9iamVjdCBhcyBmYWJyaWMuQ2lyY2xlKS5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiBzaXplIC8gMlxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLk9iamVjdCkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoIDogc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBzaXplLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvYmplY3Quc2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVTaGFwZSAoIHNoYXBlPzogR2VvbWV0cnlOYW1lcyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGNvbmZpZywgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHNoYXBlID0gY29uZmlnLnNoYXBlXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgY29uZmlnLnNoYXBlID0gc2hhcGVcblxuICAgICAgICAgIGlmICggb3duZXIuZ3JvdXAgIT0gdW5kZWZpbmVkICYmIHRoaXMub2JqZWN0ICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvd25lci5ncm91cC5yZW1vdmUgKCB0aGlzLm9iamVjdCApXG5cbiAgICAgICAgICBjb25zdCBvYmogPSB0aGlzLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICA9IEZhY3RvcnkgW2NvbmZpZy5zaGFwZSBhcyBhbnldICggY29uZmlnLCBvd25lci5kaXNwbGF5U2l6ZSAoKSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgICAgICAgOiAwLCAvL2NvbmZpZy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCAgICAgICAgOiAwLCAvL2NvbmZpZy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblggICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpblkgICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGwgICAgICAgOiBjb25maWcuYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZSAgICAgOiBjb25maWcuYm9yZGVyQ29sb3IsXG4gICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IGNvbmZpZy5ib3JkZXJXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgIG93bmVyLmdyb3VwLmFkZCAoIG9iaiApXG4gICAgICAgICAgb2JqLnNlbmRUb0JhY2sgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLmJhY2tncm91bmRJbWFnZSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKClcblxuICAgICAgICAgIGlmICggb2JqLmNhbnZhcyAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb2JqLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG5cbiAgICAgfVxuXG4gICAgIHVwZGF0ZUJhY2tncm91bmRJbWFnZSAoIHBhdGg/OiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcGF0aCA9IHRoaXMuY29uZmlnLmJhY2tncm91bmRJbWFnZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmJhY2tncm91bmRJbWFnZSA9IHBhdGhcblxuICAgICAgICAgIGlmICggdHlwZW9mIHBhdGggPT0gXCJzdHJpbmdcIiAmJiBwYXRoLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgICAgZmFicmljLnV0aWwubG9hZEltYWdlICggcGF0aCwgdGhpcy5vbl9wYXR0ZXJuLmJpbmQgKHRoaXMpIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgb25fcGF0dGVybiAoIGRpbWc6IEhUTUxJbWFnZUVsZW1lbnQgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZmFjdG9yID0gZGltZy53aWR0aCA8IGRpbWcuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IG93bmVyLmRpc3BsYXlTaXplICgpIC8gZGltZy5oZWlnaHRcblxuICAgICAgICAgIDsodGhpcy5vYmplY3QgYXMgYW55KS5zZXQgKHtcbiAgICAgICAgICAgICAgIGZpbGw6IG5ldyBmYWJyaWMuUGF0dGVybiAoe1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGRpbWcsXG4gICAgICAgICAgICAgICAgICAgIHJlcGVhdDogXCJuby1yZXBlYXRcIixcbiAgICAgICAgICAgICAgICAgICAgcGF0dGVyblRyYW5zZm9ybTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgIGZhY3RvciwgMCwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuc2V0Q29vcmRzICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMub2JqZWN0LmNhbnZhcyApXG4gICAgICAgICAgICAgICB0aGlzLm9iamVjdC5jYW52YXMucmVuZGVyQWxsICgpXG4gICAgIH1cbn1cbiIsIi8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL3R5cGluZ3MuZC50c1wiIC8+XG4vL2ltcG9ydCAqIGFzIGZhYnJpYyBmcm9tIFwiZmFicmljL2ZhYnJpYy1pbXBsLmpzXCJcblxuaW1wb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi4vR2VvbWV0cnkvZ2VvbWV0cnkuanNcIlxuXG5pbXBvcnQgeyBDdG9yIGFzIERhdGFDdG9yIH0gZnJvbSBcIi4uLy4uLy4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgJEdlb21ldHJ5IH0gZnJvbSBcIi4uL0dlb21ldHJ5L2dlb21ldHJ5LmpzXCJcblxuZXhwb3J0IGludGVyZmFjZSAkU2hhcGVFdmVudHMgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbntcbiAgICAgb25DcmVhdGU6ICggZW50aXR5OiBELCBhc3BlY3Q6IFNoYXBlICkgPT4gdm9pZCxcbiAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICBvblRvdWNoOiAoIGFzcGVjdDogU2hhcGUgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgJFNoYXBlIDxEIGV4dGVuZHMgJFRoaW5nID0gJFRoaW5nPiBleHRlbmRzICROb2RlLCAkR2VvbWV0cnksICRTaGFwZUV2ZW50c1xue1xuICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICBkYXRhOiBEXG5cbiAgICAgbWluU2l6ZSAgIDogbnVtYmVyXG4gICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICBzaXplRmFjdG9yOiBudW1iZXJcbn1cblxuZXhwb3J0IHR5cGUgQ3RvciA8RGF0YSBleHRlbmRzICRTaGFwZSA9ICRTaGFwZSwgVCBleHRlbmRzIFNoYXBlID0gU2hhcGU+XG4gICAgICAgICAgICAgICA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRTaGFwZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIlVwZGF0YSBoZXJlIFNoYXBlLmRhdGEgXCIgKyBkYXRhLmRhdGEgKVxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG5cbiAgICAgLy8gICAgICB0aGlzLmluaXQgKClcbiAgICAgLy8gfVxuXG4gICAgIC8vIGluaXQgKClcbiAgICAgLy8ge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBncm91cCA9IHRoaXMuZ3JvdXAgPSBuZXcgZmFicmljLkdyb3VwICggW10sXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgd2lkdGggICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQgICAgIDogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIGxlZnQgICAgICAgOiBjb25maWcueCxcbiAgICAgICAgICAgICAgIHRvcCAgICAgICAgOiBjb25maWcueSxcbiAgICAgICAgICAgICAgIGhhc0JvcmRlcnMgOiB0cnVlLCAgICAgICAgICAgICAgICAgIC8vIGZhbHNlLFxuICAgICAgICAgICAgICAgaGFzQ29udHJvbHM6IHRydWUsICAgICAgICAgICAgICAgICAgLy8gZmFsc2UsXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgIG9yaWdpblkgICAgOiBcImNlbnRlclwiLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICA7KHRoaXMuYmFja2dyb3VuZCBhcyBHZW9tZXRyeSkgPSBuZXcgR2VvbWV0cnkgKCB0aGlzIClcbiAgICAgICAgICAvL2dyb3VwLmFkZCAoIHRoaXMuYmFja2dyb3VuZC5vYmplY3QgKVxuICAgICAgICAgIC8vdGhpcy5iYWNrZ3JvdW5kLm9iamVjdC5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICAvLyA7KHRoaXMuYm9yZGVyIGFzIEdlb21ldHJ5KSA9IG5ldyBHZW9tZXRyeSAoIHRoaXMsIHRoaXMuY29uZmlnIClcbiAgICAgICAgICAvLyBncm91cC5hZGQgKCB0aGlzLmJvcmRlci5vYmplY3QgKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0Q29vcmRzICgpXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdcblxuICAgICAgICAgIHZhciBzaXplID0gKDEgKyBjb25maWcuc2l6ZU9mZnNldCkgKiBjb25maWcuc2l6ZUZhY3RvclxuXG4gICAgICAgICAgaWYgKCBzaXplIDwgY29uZmlnLm1pblNpemUgKVxuICAgICAgICAgICAgICAgc2l6ZSA9IGNvbmZpZy5taW5TaXplXG5cbiAgICAgICAgICByZXR1cm4gc2l6ZSB8fCAxXG4gICAgIH1cblxuICAgICB1cGRhdGVTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdGhpcy5iYWNrZ3JvdW5kIClcbiAgICAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGVTaXplICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYm9yZGVyIClcbiAgICAgICAgICAgICAgIHRoaXMuYm9yZGVyLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGdyb3VwLnNldCAoe1xuICAgICAgICAgICAgICAgd2lkdGggOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBpZiAoIGdyb3VwLmNhbnZhcyApXG4gICAgICAgICAgICAgICBncm91cC5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgY29vcmRzICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5ncm91cC5nZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHNldEJhY2tncm91bmQgKCBvcHRpb25zOiBQYXJ0aWFsIDwkR2VvbWV0cnk+IClcbiAgICAge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCB0aGlzLmNvbmZpZywgb3B0aW9ucyApXG5cbiAgICAgICAgICB0aGlzLmJhY2tncm91bmQudXBkYXRlICggb3B0aW9ucyApXG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVNpemUgKClcbiAgICAgfVxuXG4gICAgIHNldFBvc2l0aW9uICggeDogbnVtYmVyLCB5OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBncm91cCwgY29uZmlnIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25maWcueCA9IHhcbiAgICAgICAgICBjb25maWcueSA9IHlcblxuICAgICAgICAgIGdyb3VwLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogeCxcbiAgICAgICAgICAgICAgIHRvcCA6IHlcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy5kLnRzXCIgLz5cbi8vaW1wb3J0ICogYXMgZmFicmljIGZyb20gXCJmYWJyaWMvZmFicmljLWltcGxcIlxuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRmFjdG9yeSB9IGZyb20gXCIuLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IFNoYXBlLCAkU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtYXNwZWN0XCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgKClcbmNvbnN0IGZhY3RvcnkgPSBuZXcgRmFjdG9yeSA8U2hhcGU+ICggZGIgKVxuY29uc3QgQVNQRUNUICA9IFN5bWJvbC5mb3IgKCBcIkFTUEVDVFwiIClcblxuLy8gc3ZnRmFjdG9yeVxuLy8gaHRtbEZhY3Rvcnlcbi8vIGZhYnJpY0ZhY3RvcnlcblxuLy8gdWkuZmFjdG9yeS5zZXQgKCBbXCJjb25jZXB0LXVpXCIsIFwiYnV0dG9uXCIsIFwiaHRtbFwiICAsIFwiYnRuMVwiXSwgY3RvciApXG4vLyB1aS5mYWN0b3J5LnNldCAoIFtcImNvbmNlcHQtdWlcIiwgXCJidXR0b25cIiwgXCJzdmdcIiAgICwgXCJidG4xXCJdLCBjdG9yIClcbi8vIHVpLmZhY3Rvcnkuc2V0ICggW1wiY29uY2VwdC11aVwiLCBcImJ1dHRvblwiLCBcImZhYnJpY1wiLCBcImJ0bjFcIl0sIGN0b3IgKVxuXG50eXBlICRJbiA8JCBleHRlbmRzICRTaGFwZSA9ICRTaGFwZT4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cblxuZnVuY3Rpb24gbm9ybWFsaXplICggbm9kZTogJEluIClcbntcbiAgICAgaWYgKCBcImNvbnRleHRcIiBpbiBub2RlIClcbiAgICAge1xuICAgICAgICAgIGlmICggbm9kZS5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGNvbnRleHQgdmFsdWVcIlxuICAgICB9XG4gICAgIGVsc2VcbiAgICAge1xuICAgICAgICAgIChub2RlIGFzIFdyaXRhYmxlIDwkU2hhcGU+KS5jb250ZXh0ID0gQ09OVEVYVFxuICAgICB9XG5cbiAgICAgcmV0dXJuIG5vZGUgYXMgJFNoYXBlXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFzcGVjdCA8VCBleHRlbmRzIFNoYXBlPiAoIG9iajogJE5vZGUgfCBTaGFwZSB8IGZhYnJpYy5PYmplY3QgKTogVCB8IHVuZGVmaW5lZFxue1xuICAgICBpZiAoIG9iaiA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgICBpZiAoIG9iaiBpbnN0YW5jZW9mIFNoYXBlIClcbiAgICAgICAgICByZXR1cm4gb2JqIGFzIFRcblxuICAgICBpZiAoIG9iaiBpbnN0YW5jZW9mIGZhYnJpYy5PYmplY3QgKVxuICAgICAgICAgIHJldHVybiBvYmogW0FTUEVDVF1cblxuICAgICBpZiAoIGZhY3RvcnkuaW5TdG9jayAoIENPTlRFWFQsIG9iai50eXBlLCBvYmouaWQgKSApXG4gICAgICAgICAgcmV0dXJuIGZhY3RvcnkubWFrZSAoIENPTlRFWFQsIG9iai50eXBlLCBvYmouaWQgKVxuXG4gICAgIGNvbnN0IG9wdGlvbnMgID0gb2JqLmNvbnRleHQgPT0gQ09OVEVYVFxuICAgICAgICAgICAgICAgICAgICA/IG9iaiBhcyAkU2hhcGVcbiAgICAgICAgICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogQ09OVEVYVCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBvYmoudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZCAgICAgOiBvYmouaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSAgIDogb2JqLFxuICAgICAgICAgICAgICAgICAgICB9IGFzICRTaGFwZVxuXG4gICAgIGlmICggISBpc0Zpbml0ZSAob3B0aW9ucy54KSApXG4gICAgICAgICAgb3B0aW9ucy54ID0gMFxuXG4gICAgIGlmICggISBpc0Zpbml0ZSAob3B0aW9ucy55KSApXG4gICAgICAgICAgb3B0aW9ucy55ID0gMFxuXG4gICAgIGNvbnN0IHNoYXBlID0gZmFjdG9yeS5tYWtlICggb3B0aW9ucyApXG5cbiAgICAgLy8gc2hhcGUuZXZlbnRzID0gYXJndW1lbnRzLmV2ZW50c1xuICAgICAvLyBPYmplY3QuYXNzaWduICggc2hhcGUsIGV2ZW50cyApXG5cbiAgICAgLy9zaGFwZS5pbml0ICgpXG4gICAgIHNoYXBlLmdyb3VwIFtBU1BFQ1RdID0gc2hhcGVcblxuICAgICBpZiAoIHNoYXBlLmNvbmZpZy5vbkNyZWF0ZSApXG4gICAgICAgICAgc2hhcGUuY29uZmlnLm9uQ3JlYXRlICggc2hhcGUuY29uZmlnLmRhdGEsIHNoYXBlIClcblxuICAgICByZXR1cm4gc2hhcGUgYXMgVFxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRBc3BlY3QgPCQgZXh0ZW5kcyAkU2hhcGU+ICggbm9kZTogJEluIDwkPiApXG57XG4gICAgIGRiLnNldCAoIG5vcm1hbGl6ZSAoIG5vZGUgKSApXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUFzcGVjdCAoIGN0b3I6IG5ldyAoIGRhdGE6ICRTaGFwZSApID0+IFNoYXBlLCB0eXBlOiBzdHJpbmcgKVxue1xuICAgICBmYWN0b3J5Ll9kZWZpbmUgKCBjdG9yLCBbQ09OVEVYVCwgdHlwZV0gKVxufVxuIiwiXG5pbXBvcnQgKiBhcyBkYiBmcm9tIFwiLi4vLi4vRGF0YS9kYi5qc1wiXG5cbmltcG9ydCB7IFNoYXBlLCAkU2hhcGUgfSBmcm9tIFwiLi9zaGFwZS5qc1wiXG5cbmV4cG9ydCB0eXBlIEJhZGdlUG9zaXRpb24gPSB7IGFuZ2xlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cblxuZXhwb3J0IGNsYXNzIEJhZGdlIGV4dGVuZHMgU2hhcGVcbntcbiAgICAgcmVhZG9ubHkgb3duZXIgPSB1bmRlZmluZWQgYXMgU2hhcGVcblxuICAgICByZWFkb25seSBwb3NpdGlvbiA9IHsgYW5nbGU6IDAsIG9mZnNldDogMCB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBvcHRpb25zIClcbiAgICAgLy8gfVxuICAgICAvLyBpbml0ICgpXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5pbml0ICgpXG5cbiAgICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSBkYi5nZXROb2RlIDwkQmFkZ2U+ICggdGhpcy5jb25maWcuZGF0YSApXG5cbiAgICAgICAgICBjb25zdCB0ZXh0ID0gbmV3IGZhYnJpYy5UZXh0Ym94ICggZW50aXR5LmVtb2ppIHx8IFwiWFwiLCB7XG4gICAgICAgICAgICAgICBmb250U2l6ZTogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIG9yaWdpblggOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgb3JpZ2luWSA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBsZWZ0ICAgIDogZ3JvdXAubGVmdCxcbiAgICAgICAgICAgICAgIHRvcCAgICAgOiBncm91cC50b3AsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGdyb3VwLmFkZFdpdGhVcGRhdGUgKCB0ZXh0IClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gMjBcbiAgICAgfVxuXG4gICAgIGF0dGFjaCAoIHRhcmdldDogU2hhcGUsIHBvcyA9IHt9IGFzIEJhZGdlUG9zaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyByYW5kb20sIFBJIH0gPSBNYXRoXG5cbiAgICAgICAgICBpZiAoICEgaXNGaW5pdGUgKCBwb3MuYW5nbGUgKSApXG4gICAgICAgICAgICAgICBwb3MuYW5nbGUgPSByYW5kb20gKCkgKiBQSSAqIDJcblxuICAgICAgICAgIGlmICggISBpc0Zpbml0ZSAoIHBvcy5vZmZzZXQgKSApXG4gICAgICAgICAgICAgICBwb3Mub2Zmc2V0ID0gMC4xXG5cbiAgICAgICAgICA7KHRoaXMucG9zaXRpb24gYXMgQmFkZ2VQb3NpdGlvbikgPSB7IC4uLiBwb3MgfVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm93bmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0YXJnZXQuZ3JvdXAucmVtb3ZlICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICB0YXJnZXQuZ3JvdXAuYWRkICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICA7KHRoaXMub3duZXIgYXMgU2hhcGUpID0gdGFyZ2V0XG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVQb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBwb3NpdGlvbjogcG9zLCBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBvd25lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCB7IHJhbmRvbSwgUEksIGNvcywgc2luIH0gPSBNYXRoXG5cbiAgICAgICAgICBjb25zdCByYWQgICAgPSBwb3MuYW5nbGUgfHwgcmFuZG9tICgpICogUEkgKiAyXG4gICAgICAgICAgY29uc3QgeCAgICAgID0gc2luIChyYWQpXG4gICAgICAgICAgY29uc3QgeSAgICAgID0gY29zIChyYWQpXG4gICAgICAgICAgY29uc3QgcyAgICAgID0gb3duZXIuZGlzcGxheVNpemUgKCkgLyAyXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdHlwZW9mIHBvcy5vZmZzZXQgPT0gXCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5kaXNwbGF5U2l6ZSAoKSAqIHBvcy5vZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCkgKiAwLjFcblxuICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb24gKCB4ICogKHMgKyBvZmZzZXQpLCB5ICogKHMgKyBvZmZzZXQpIClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuXG5pbXBvcnQgeyBnZXRBc3BlY3QgfSBmcm9tIFwiLi4vZGIuanNcIlxuXG5pbXBvcnQgeyBTaGFwZSwgJFNoYXBlIH0gZnJvbSBcIi4vc2hhcGUuanNcIlxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgJFNoYXBlIDwkR3JvdXA+ID0gJFNoYXBlIDwkR3JvdXA+PiBleHRlbmRzIFNoYXBlIDwkPlxue1xuICAgICByZWFkb25seSBjaGlsZHJlbjogU2hhcGUgW11cblxuICAgICBkaXNwbGF5X3NpemUgPSAxXG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdXG4gICAgIC8vIH1cblxuICAgICAvLyBpbml0ICgpXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5pbml0ICgpXG5cbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmNvbmZpZy5kYXRhXG5cbiAgICAgICAgICAvL2ZvciAoIGNvbnN0IGNoaWxkIG9mIE9iamVjdC52YWx1ZXMgKCBlbnRpdHkuY2hpbGRyZW4gKSApXG4gICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyAoIGVudGl0eS5pdGVtcyApIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBhID0gZ2V0QXNwZWN0ICggY2hpbGQgKVxuICAgICAgICAgICAgICAgLy9hLmluaXQgKClcbiAgICAgICAgICAgICAgIHRoaXMuYWRkICggYSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5wYWNrICgpXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdcblxuICAgICAgICAgIHZhciBzaXplID0gKHRoaXMuZGlzcGxheV9zaXplICsgY29uZmlnLnNpemVPZmZzZXQpICogY29uZmlnLnNpemVGYWN0b3JcblxuICAgICAgICAgIGlmICggc2l6ZSA8IGNvbmZpZy5taW5TaXplIClcbiAgICAgICAgICAgICAgIHNpemUgPSBjb25maWcubWluU2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHNpemUgfHwgMVxuICAgICB9XG5cbiAgICAgYWRkICggY2hpbGQ6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAgfSA9IHRoaXNcblxuICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaCAoIGNoaWxkIClcblxuICAgICAgICAgIGlmICggZ3JvdXAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGdyb3VwLmFkZCAoIGNoaWxkLmdyb3VwIClcbiAgICAgICAgICAgICAgIGdyb3VwLnNldENvb3JkcyAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNoaWxkcmVuLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgYyBvZiBjaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IGMuZ3JvdXBcbiAgICAgICAgICAgICAgIGNvbnN0IHIgPSAoZy53aWR0aCA+IGcuaGVpZ2h0ID8gZy53aWR0aCA6IGcuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoICggeyB4OiBnLmxlZnQsIHk6IGcudG9wLCByOiByICsgNiB9IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzaXplID0gIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2hpbGRyZW4ubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gY2hpbGRyZW4gW2ldLmdyb3VwXG4gICAgICAgICAgICAgICBjb25zdCBwID0gcG9zaXRpb25zIFtpXVxuXG4gICAgICAgICAgICAgICBnLmxlZnQgPSBwLnhcbiAgICAgICAgICAgICAgIGcudG9wICA9IHAueVxuXG4gICAgICAgICAgICAgICBncm91cC5hZGQgKCBnIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRpc3BsYXlfc2l6ZSA9IHNpemUgKyBjb25maWcuc2l6ZU9mZnNldFxuXG4gICAgICAgICAgdGhpcy51cGRhdGVTaXplICgpXG4gICAgIH1cblxufVxuXG4iLCJcbmltcG9ydCB7IFBhbmVsQ29tbWFuZHMgfSBmcm9tIFwiLi9wYW5lbC5qc1wiXG5pbXBvcnQgeyBNZW51Q29tbWFuZHMgfSBmcm9tIFwiLi9tZW51LmpzXCJcbmltcG9ydCB7IEFyZWFDb21tYW5kcyB9IGZyb20gXCIuL2FyZWEuanNcIlxuaW1wb3J0IHsgQ29tbWFuZHMgYXMgY21kIH0gZnJvbSBcIi4uL1VpL0Jhc2UvY29tbWFuZC5qc1wiXG5cbmV4cG9ydCB0eXBlIENvbW1hbmROYW1lcyA9IGtleW9mIENvbW1hbmRzXG5cbnR5cGUgQ29tbWFuZHMgPSBQYW5lbENvbW1hbmRzXG4gICAgICAgICAgICAgICAmIE1lbnVDb21tYW5kc1xuICAgICAgICAgICAgICAgJiBBcmVhQ29tbWFuZHNcblxuZXhwb3J0IGNvbnN0IGFkZENvbW1hbmQgPSBjbWQuY3VycmVudC5hZGQuYmluZCAoY21kLmN1cnJlbnQpIGFzXG57XG4gICAgIDxLIGV4dGVuZHMgQ29tbWFuZE5hbWVzPiAoIG5hbWU6IEssIGNhbGxiYWNrOiBDb21tYW5kcyBbS10gKTogdm9pZFxuICAgICAoIG5hbWU6IHN0cmluZywgY2FsbGJhY2s6ICggLi4uYXJnczogYW55ICkgPT4gYW55ICk6IHZvaWRcbn1cblxuZXhwb3J0IGNvbnN0IHJ1bkNvbW1hbmQgPSBjbWQuY3VycmVudC5ydW4uYmluZCAoY21kLmN1cnJlbnQpIGFzXG57XG4gICAgIDxLIGV4dGVuZHMgQ29tbWFuZE5hbWVzPiAoIG5hbWU6IEssIC4uLiBhcmdzOiBQYXJhbWV0ZXJzIDxDb21tYW5kcyBbS10+ICk6IHZvaWRcbiAgICAgKCBuYW1lOiBzdHJpbmcsIC4uLiBhcmdzOiBhbnkgKTogdm9pZFxufVxuXG5leHBvcnQgY29uc3QgaGFzQ29tbWFuZCA9IGNtZC5jdXJyZW50Lmhhcy5iaW5kIChjbWQuY3VycmVudCkgYXNcbntcbiAgICAgKCBrZXk6IENvbW1hbmROYW1lcyApOiBib29sZWFuXG4gICAgICgga2V5OiBzdHJpbmcgKTogYm9vbGVhblxufVxuXG5leHBvcnQgY29uc3Qgb25Db21tYW5kID0gY21kLmN1cnJlbnQub24uYmluZCAoY21kLmN1cnJlbnQpIGFzXG57XG4gICAgICggbmFtZTogQ29tbWFuZE5hbWVzLCBjYWxsYmFjazogKCkgPT4gdm9pZCApOiB2b2lkXG4gICAgICggbmFtZTogc3RyaW5nLCBjYWxsYmFjazogKCkgPT4gdm9pZCApOiB2b2lkXG59XG5cbmV4cG9ydCBjb25zdCByZW1vdmVDb21tYW5kID0gY21kLmN1cnJlbnQucmVtb3ZlLmJpbmQgKGNtZC5jdXJyZW50KSBhc1xue1xuICAgICAoIG5hbWU6IENvbW1hbmROYW1lcyApOiB2b2lkXG4gICAgICggbmFtZTogc3RyaW5nICk6IHZvaWRcbn1cbiIsIlxuXG5leHBvcnQgeyBkZWZpbmVBc3BlY3QsIGdldEFzcGVjdCwgc2V0QXNwZWN0IH0gZnJvbSBcIi4vZGIuanNcIlxuXG5leHBvcnQgeyBHZW9tZXRyeSwgJEdlb21ldHJ5IH0gZnJvbSBcIi4vR2VvbWV0cnkvZ2VvbWV0cnkuanNcIlxuZXhwb3J0IHsgU2hhcGUsICRTaGFwZSwgJFNoYXBlRXZlbnRzIH0gZnJvbSBcIi4vRWxlbWVudC9zaGFwZS5qc1wiXG5leHBvcnQgeyBOb3RlIH0gICAgICBmcm9tIFwiLi9FbGVtZW50L25vdGUuanNcIlxuZXhwb3J0IHsgQmFkZ2UgfSAgICAgZnJvbSBcIi4vRWxlbWVudC9iYWRnZS5qc1wiXG5leHBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi9FbGVtZW50L2dyb3VwLmpzXCJcblxuXG5pbXBvcnQgeyBnZXROb2RlfSBmcm9tIFwiLi4vRGF0YS9kYi5qc1wiXG5pbXBvcnQgeyBnZXRBc3BlY3QsIGRlZmluZUFzcGVjdCwgc2V0QXNwZWN0IH0gZnJvbSBcIi4vZGIuanNcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7ICRTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5pbXBvcnQgeyBCYWRnZSB9ICAgICBmcm9tIFwiLi9FbGVtZW50L2JhZGdlLmpzXCJcblxuaW1wb3J0IHsgcnVuQ29tbWFuZCB9IGZyb20gXCIuLi9jb21tYW5kLmpzXCJcblxuZGVmaW5lQXNwZWN0ICggU2hhcGUgICAgLCBcInBlcnNvblwiIC8qICwgeyBvbkNyZWF0ZTogKCkgPT4gLi4uLCBvblRvdWNoOiAoKSA9PiAuLi4gfSAqLyApXG5kZWZpbmVBc3BlY3QgKCBDb250YWluZXIsIFwic2tpbGxcIiApXG5kZWZpbmVBc3BlY3QgKCBCYWRnZSAgICAsIFwiYmFkZ2VcIiApXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcInBlcnNvblwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgZGF0YSAgIDogdW5kZWZpbmVkLFxuXG4gICAgIHNoYXBlICA6IFwiY2lyY2xlXCIsXG5cbiAgICAgeDogMCxcbiAgICAgeTogMCxcblxuICAgICBtaW5TaXplICAgIDogMzAsXG4gICAgIHNpemVGYWN0b3I6IDEsXG4gICAgIHNpemVPZmZzZXQ6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjMDBjMGFhXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDQsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBmYWxzZSxcblxuICAgICBvbkNyZWF0ZSAgIDogKCBwZXJzb246ICRQZXJzb24sIGFzcGVjdCApID0+XG4gICAgIHtcbiAgICAgICAgICBhc3BlY3Quc2V0QmFja2dyb3VuZCAoe1xuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOiBwZXJzb24uYXZhdGFyLFxuICAgICAgICAgICAgICAgc2hhcGU6IHBlcnNvbi5pc0NhcHRhaW4gPyBcInNxdWFyZVwiIDogXCJjaXJjbGVcIixcbiAgICAgICAgICB9IGFzIGFueSlcbiAgICAgfSxcbiAgICAgb25EZWxldGU6IHVuZGVmaW5lZCxcbiAgICAgb25Ub3VjaDogdW5kZWZpbmVkLFxufSlcblxuc2V0QXNwZWN0IDwkU2hhcGU+ICh7XG4gICAgIHR5cGUgICA6IFwic2tpbGxcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGE6IHVuZGVmaW5lZCxcblxuICAgICBzaGFwZTogXCJjaXJjbGVcIixcbiAgICAgeDogMCxcbiAgICAgeTogMCxcblxuICAgICBib3JkZXJDb2xvciAgICAgOiBcIiNmMWJjMzFcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogOCxcbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCIjRkZGRkZGXCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG4gICAgIG1pblNpemUgICAgICAgICA6IDUwLFxuICAgICBzaXplT2Zmc2V0ICAgICAgOiAxMCxcbiAgICAgc2l6ZUZhY3RvciAgICAgIDogMSxcblxuICAgICBvbkNyZWF0ZSAoIHNraWxsOiAkU2tpbGwsIGFzcGVjdCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gZ2V0Tm9kZSAoe1xuICAgICAgICAgICAgICAgdHlwZTogXCJiYWRnZVwiLFxuICAgICAgICAgICAgICAgaWQgIDogc2tpbGwuaWNvbixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgY29uc3QgYmFkZ2UgPSBnZXRBc3BlY3QgPEJhZGdlPiAoIGRhdGEgKVxuXG4gICAgICAgICAgLy9iYWRnZS5pbml0ICgpXG4gICAgICAgICAgYmFkZ2UuYXR0YWNoICggYXNwZWN0IClcbiAgICAgfSxcblxuICAgICBvblRvdWNoICggc2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgc2tpbGwgPSBnZXROb2RlIDwkU2tpbGw+ICh7XG4gICAgICAgICAgICAgICB0eXBlOiBzaGFwZS5jb25maWcudHlwZSxcbiAgICAgICAgICAgICAgIGlkICA6IHNoYXBlLmNvbmZpZy5pZFxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBydW5Db21tYW5kICggXCJvcGVuLWluZm9zLXBhbmVsXCIsIHNraWxsIClcbiAgICAgfSxcblxuICAgICBvbkRlbGV0ZTogdW5kZWZpbmVkXG59KVxuXG5zZXRBc3BlY3QgPCRTaGFwZT4gKHtcbiAgICAgdHlwZSAgIDogXCJiYWRnZVwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgZGF0YTogdW5kZWZpbmVkLFxuXG4gICAgIHggICAgICAgICA6IDAsXG4gICAgIHkgICAgICAgICA6IDAsXG4gICAgIG1pblNpemUgICA6IDEsXG4gICAgIHNpemVGYWN0b3I6IDEsXG4gICAgIHNpemVPZmZzZXQ6IDAsXG5cbiAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCJncmF5XCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDAsXG5cbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICBiYWNrZ3JvdW5kSW1hZ2UgOiB1bmRlZmluZWQsXG4gICAgIGJhY2tncm91bmRSZXBlYXQ6IGZhbHNlLFxuXG4gICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgb25EZWxldGUgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICBvblRvdWNoICAgICAgICAgOiB1bmRlZmluZWQsXG59KVxuIiwiXG5cbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTaWRlTWVudSB9IGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5pbXBvcnQgeyBhZGRDb21tYW5kIH0gZnJvbSBcIi4vY29tbWFuZC5qc1wiXG5cblxuLy9leHBvcnQgY29uc3QgbWVudSA9IGNyZWF0ZU1lbnUgKClcblxuLy9kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBtZW51LmVsZW1lbnRzICgpIClcblxuZXhwb3J0IGNvbnN0IG1lbnUgPSB1aS5tYWtlIDxTaWRlTWVudSwgJFNpZGVNZW51PiAoe1xuICAgICBjb250ZXh0ICAgICAgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgdHlwZSAgICAgICAgIDogXCJzaWRlLW1lbnVcIixcbiAgICAgaWQgICAgICAgICAgIDogXCJtZW51XCIsXG4gICAgIGhhc01haW5CdXR0b246IHRydWUsXG4gICAgIGRpcmVjdGlvbiAgICA6IFwibHJcIlxufSlcbmRvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIG1lbnUuZ2V0SHRtbCAoKSApXG5cbmV4cG9ydCB0eXBlIE1lbnVDb21tYW5kcyA9IHtcbiAgICAgXCJvcGVuLW1lbnVcIjogKCkgPT4gdm9pZCxcbiAgICAgXCJjbG9zZS1tZW51XCI6ICgpID0+IHZvaWQsXG59XG5cbi8vYWRkQ29tbWFuZCAoIFwib3Blbi1tZW51XCIsICgpID0+IHsgbWVudS5vcGVuICgpIH0pXG4vL2FkZENvbW1hbmQgKCBcImNsb3NlLW1lbnVcIiwgKCkgPT4geyBtZW51LmNsb3NlICgpIH0pXG4iLCJcbmltcG9ydCBcIi4uL1VpL2RiLmpzXCJcbmltcG9ydCBcIi4uL1VpL0NvbXBvbmVudC9TbGlkZXNob3cvaW5kZXguanNcIlxuLy9pbXBvcnQgXCIuL0NvbXBvbmVudC9pbmZvcy5qc1wiXG5pbXBvcnQgXCIuLi9VaS9FbnRpdHkvU2tpbGwvaW5mb3MuanNcIlxuXG5pbXBvcnQgKiBhcyB1aSBmcm9tIFwiLi4vVWkvaW5kZXguanNcIlxuaW1wb3J0IHsgU2xpZGVzaG93LCBTaWRlTWVudSB9IGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTa2lsbFZpZXdlciB9IGZyb20gXCIuLi9VaS9FbnRpdHkvU2tpbGwvaW5mb3MuanNcIlxuaW1wb3J0IHsgYWRkQ29tbWFuZCB9IGZyb20gXCIuL2NvbW1hbmQuanNcIlxuXG5leHBvcnQgdHlwZSBQYW5lbENvbW1hbmRzID0ge1xuICAgICBcIm9wZW4tcGFuZWxcIjogKCBuYW1lOiBzdHJpbmcsIC4uLiBjb250ZW50OiBhbnkgW10gKSA9PiB2b2lkLFxuICAgICBcIm9wZW4taW5mb3MtcGFuZWxcIjogKCBkYXRhOiAkTm9kZSApID0+IHZvaWQsXG4gICAgIFwiY2xvc2UtcGFuZWxcIjogKCkgPT4gdm9pZCxcbn07XG5cbnZhciBkaXJlY3Rpb24gPSBcInJsXCIgYXMgXCJybFwiIHwgXCJsclwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbmV4cG9ydCBjb25zdCBwYW5lbCA9IHVpLm1ha2UgPFNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgICAgICAgOiBcInNpZGUtbWVudVwiLFxuICAgICBpZCAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIGRpcmVjdGlvbiAgICA6IGRpcmVjdGlvbixcbiAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcblxuICAgICBoZWFkZXI6IHtcbiAgICAgICAgICBjb250ZXh0ICA6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCIsXG4gICAgICAgICAgaWQgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uXCIsXG4gICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24gPT0gXCJsclwiIHx8IGRpcmVjdGlvbiA9PSBcInJsXCIgPyBcInRiXCIgOiBcImxyXCIsXG5cbiAgICAgICAgICBidXR0b25zOiBbe1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgIDogXCJidXR0b25cIixcbiAgICAgICAgICAgICAgIGlkICAgICAgOiBcImNvbnNvbGVcIixcbiAgICAgICAgICAgICAgIGljb24gICAgOiBcIuKaoFwiLFxuICAgICAgICAgICAgICAgdGV4dCAgICA6IFwiXCIsXG4gICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgICAgICBjb21tYW5kOiBcInBhY2stdmlld1wiXG4gICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwicHJvcGVydGllc1wiLFxuICAgICAgICAgICAgICAgaWNvbiAgICA6IFwiXCIsXG4gICAgICAgICAgICAgICB0ZXh0ICAgIDogXCJwYW5lbCBwcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgfV1cbiAgICAgfSxcblxuICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICBjb250ZXh0ICA6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgIHR5cGUgICAgIDogXCJzbGlkZXNob3dcIixcbiAgICAgICAgICBpZCAgICAgICA6IFwicGFuZWwtc2xpZGVzaG93XCIsXG5cbiAgICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJza2lsbC12aWV3ZXJcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IFwic2xpZGUtc2tpbGxcIlxuICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcInBlcnNvbi12aWV3ZXJcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IFwic2xpZGUtcGVyc29uXCJcbiAgICAgICAgICB9XVxuICAgICB9XVxufSlcblxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gcGFuZWwuZ2V0SHRtbCAoKSApXG5cbmNvbnN0IHNsaWRlc2hvdyAgPSB1aS5waWNrIDxTbGlkZXNob3c+ICAgKCBcInNsaWRlc2hvd1wiLCBcInBhbmVsLXNsaWRlc2hvd1wiIClcbmNvbnN0IHNsaWRlSW5mb3MgPSB1aS5waWNrIDxTa2lsbFZpZXdlcj4gKCBcInNraWxsLXZpZXdlclwiLCBcInNsaWRlLXNraWxsXCIgKVxuXG5hZGRDb21tYW5kICggXCJvcGVuLXBhbmVsXCIsICggbmFtZSwgLi4uIGNvbnRlbnQgKSA9Plxue1xuICAgICBpZiAoIG5hbWUgKVxuICAgICAgICAgIHNsaWRlc2hvdy5zaG93ICggbmFtZSwgLi4uIGNvbnRlbnQgKVxuICAgICBlbHNlXG4gICAgICAgICAgcGFuZWwub3BlbiAoKVxufSlcblxuYWRkQ29tbWFuZCAoIFwib3Blbi1pbmZvcy1wYW5lbFwiLCAoIGRhdGEgKSA9Plxue1xuICAgICBpZiAoIGRhdGEgKVxuICAgICB7XG4gICAgICAgICAgc2xpZGVJbmZvcy5kaXNwbGF5ICggZGF0YSBhcyBhbnkgKVxuICAgICAgICAgIHBhbmVsLm9wZW4gKClcbiAgICAgfVxufSlcblxuYWRkQ29tbWFuZCAoIFwiY2xvc2UtcGFuZWxcIiAsICgpID0+XG57XG4gICAgIHBhbmVsLmNsb3NlICgpXG59KVxuXG4iLCJcbi8qXG5leGFtcGxlOlxuaHR0cHM6Ly9wcmV6aS5jb20vcC85anFlMndrZmhoa3kvbGEtYnVsbG90ZXJpZS10cGNtbi9cbmh0dHBzOi8vbW92aWxhYi5vcmcvaW5kZXgucGhwP3RpdGxlPVV0aWxpc2F0ZXVyOkF1ciVDMyVBOWxpZW5NYXJ0eVxuKi9cblxuLy9pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbC5qc1wiXG5cbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9pbmRleC5qc1wiXG5cbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCAqIGFzIGFzcGVjdCBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9EYXRhL2RiLmpzXCJcblxuZmFicmljLk9iamVjdC5wcm90b3R5cGUucGFkZGluZyAgICAgICAgICAgID0gMFxuZmFicmljLk9iamVjdC5wcm90b3R5cGUub2JqZWN0Q2FjaGluZyAgICAgID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0NvbnRyb2xzICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0JvcmRlcnMgICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc1JvdGF0aW5nUG9pbnQgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS50cmFuc3BhcmVudENvcm5lcnMgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY2VudGVyZWRTY2FsaW5nICAgID0gdHJ1ZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY29ybmVyU3R5bGUgICAgICAgID0gXCJjaXJjbGVcIlxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1sXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtdFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXJcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1iXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJ0bFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwiYmxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJyXCIsIGZhbHNlIClcblxuZXhwb3J0IGludGVyZmFjZSBWaWV3XG57XG4gICAgIG5hbWU6IHN0cmluZ1xuICAgICBhY3RpdmU6IGJvb2xlYW5cbiAgICAgY2hpbGRyZW4gOiBTaGFwZSBbXVxuICAgICB0aHVtYm5haWw6IHN0cmluZ1xuICAgICBwYWNraW5nICA6IFwiZW5jbG9zZVwiXG59XG5cbmV4cG9ydCBjbGFzcyBBcmVhXG57XG4gICAgIHJlYWRvbmx5IGZjYW52YXM6IGZhYnJpYy5DYW52YXNcbiAgICAgcHJpdmF0ZSBhY3RpdmU6IFZpZXdcbiAgICAgcHJpdmF0ZSB2aWV3cyA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBWaWV3PlxuXG4gICAgIGNvbnN0cnVjdG9yICggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyAoIGNhbnZhcyApXG4gICAgICAgICAgdGhpcy5lbmFibGVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGdldCB2aWV3ICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmVcbiAgICAgfVxuXG4gICAgIG92ZXJGT2JqZWN0OiBmYWJyaWMuT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgb25PdmVyT2JqZWN0ICA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbk91dE9iamVjdCAgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hPYmplY3QgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Eb3VibGVUb3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvblRvdWNoQXJlYSAgID0gbnVsbCBhcyAoIHg6IG51bWJlciwgeTogbnVtYmVyICkgPT4gdm9pZFxuXG4gICAgIGNyZWF0ZVZpZXcgKCBuYW1lOiBzdHJpbmcgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyB2aWV3cyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBuYW1lIGluIHZpZXdzIClcbiAgICAgICAgICAgICAgIHRocm93IFwiVGhlIHZpZXcgYWxyZWFkeSBleGlzdHNcIlxuXG4gICAgICAgICAgcmV0dXJuIHZpZXdzIFtuYW1lXSA9IHtcbiAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICBhY3RpdmUgICA6IGZhbHNlLFxuICAgICAgICAgICAgICAgY2hpbGRyZW4gOiBbXSxcbiAgICAgICAgICAgICAgIHBhY2tpbmcgIDogXCJlbmNsb3NlXCIsXG4gICAgICAgICAgICAgICB0aHVtYm5haWw6IG51bGwsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXNlICggbmFtZTogc3RyaW5nICk6IFZpZXdcbiAgICAgdXNlICggdmlldzogVmlldyApICA6IFZpZXdcbiAgICAgdXNlICggbmFtZTogc3RyaW5nIHwgVmlldyApOiBWaWV3XG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGZjYW52YXMsIHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBuYW1lICE9IFwic3RyaW5nXCIgKVxuICAgICAgICAgICAgICAgbmFtZSA9IG5hbWUubmFtZVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmFjdGl2ZSAmJiB0aGlzLmFjdGl2ZS5uYW1lID09IG5hbWUgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoICEgKG5hbWUgaW4gdmlld3MpIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgY29uc3QgYWN0aXZlID0gdGhpcy5hY3RpdmUgPSB2aWV3cyBbbmFtZV1cblxuICAgICAgICAgIGZjYW52YXMuY2xlYXIgKClcblxuICAgICAgICAgIGZvciAoIGNvbnN0IHNoYXBlIG9mIGFjdGl2ZS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNoYXBlLmdyb3VwIClcblxuICAgICAgICAgIHJldHVybiBhY3RpdmVcbiAgICAgfVxuXG4gICAgIGFkZCAoIC4uLiBzaGFwZXM6IChTaGFwZSB8ICROb2RlKSBbXSApXG4gICAgIGFkZCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKVxuICAgICBhZGQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgYWN0aXZlLCBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdHlwZW9mIGFyZ3VtZW50cyBbMF0gPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3Qgbm9kZSA9IGRiLmdldE5vZGUgKCAuLi4gYXJndW1lbnRzIGFzIGFueSBhcyBzdHJpbmcgW10gKVxuICAgICAgICAgICAgICAgY29uc3Qgc2hwID0gYXNwZWN0LmdldEFzcGVjdCAoIG5vZGUgKVxuICAgICAgICAgICAgICAgYWN0aXZlLmNoaWxkcmVuLnB1c2ggKCBzaHAgKVxuICAgICAgICAgICAgICAgZmNhbnZhcy5hZGQgKCBzaHAuZ3JvdXAgKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGZvciAoIGNvbnN0IHMgb2YgYXJndW1lbnRzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBzaHAgPSBhc3BlY3QuZ2V0QXNwZWN0ICggcyBhcyAkTm9kZSB8IFNoYXBlIClcblxuICAgICAgICAgICAgICAgLy8gc2hwLmdldEZhYnJpY1xuICAgICAgICAgICAgICAgLy8gc2hwLmdldEh0bWxcbiAgICAgICAgICAgICAgIC8vIHNocC5nZXRTdmdcblxuICAgICAgICAgICAgICAgLy8gZmFjdG9yeVxuXG4gICAgICAgICAgICAgICBhY3RpdmUuY2hpbGRyZW4ucHVzaCAoIHNocCApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNocC5ncm91cCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBjbGVhciAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5mY2FudmFzLmNsZWFyICgpXG4gICAgIH1cblxuICAgICBwYWNrICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IG9iamVjdHMgPSBmY2FudmFzLmdldE9iamVjdHMgKClcbiAgICAgICAgICBjb25zdCBwb3NpdGlvbnMgPSBbXSBhcyBHZW9tZXRyeS5DaXJjbGUgW11cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGcgb2Ygb2JqZWN0cyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgciA9IChnLndpZHRoID4gZy5oZWlnaHQgPyBnLndpZHRoIDogZy5oZWlnaHQpIC8gMlxuICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKCB7IHg6IGcubGVmdCwgeTogZy50b3AsIHI6IHIgKyAyMCB9IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBHZW9tZXRyeS5wYWNrRW5jbG9zZSAoIHBvc2l0aW9ucyApICogMlxuXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwIDsgaSA8IG9iamVjdHMubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gb2JqZWN0cyBbaV1cbiAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwb3NpdGlvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGcubGVmdCA9IHAueFxuICAgICAgICAgICAgICAgZy50b3AgID0gcC55XG4gICAgICAgICAgICAgICBnLnNldENvb3JkcyAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgem9vbSAoIGZhY3Rvcj86IG51bWJlciB8IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yID09IFwibnVtYmVyXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IG9iamVjdHMgPSBmY2FudmFzLmdldE9iamVjdHMgKClcblxuICAgICAgICAgIGlmICggdHlwZW9mIGZhY3RvciA9PSBcIm9iamVjdFwiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvID0gZmFjdG9yLmdyb3VwXG5cbiAgICAgICAgICAgICAgIHZhciBsZWZ0ICAgPSBvLmxlZnQgLSBvLndpZHRoXG4gICAgICAgICAgICAgICB2YXIgcmlnaHQgID0gby5sZWZ0ICsgby53aWR0aFxuICAgICAgICAgICAgICAgdmFyIHRvcCAgICA9IG8udG9wICAtIG8uaGVpZ2h0XG4gICAgICAgICAgICAgICB2YXIgYm90dG9tID0gby50b3AgICsgby5oZWlnaHRcblxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIGxlZnQgICA9IDBcbiAgICAgICAgICAgICAgIHZhciByaWdodCAgPSAwXG4gICAgICAgICAgICAgICB2YXIgdG9wICAgID0gMFxuICAgICAgICAgICAgICAgdmFyIGJvdHRvbSA9IDBcblxuICAgICAgICAgICAgICAgZm9yICggY29uc3QgbyBvZiBvYmplY3RzIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbCA9IG8ubGVmdCAtIG8ud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgciA9IG8ubGVmdCArIG8ud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdCA9IG8udG9wICAtIG8uaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBvLnRvcCAgKyBvLmhlaWdodFxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggbCA8IGxlZnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQgPSBsXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCByID4gcmlnaHQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0ID0gclxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggdCA8IHRvcCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdG9wID0gdFxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggYiA+IGJvdHRvbSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgYm90dG9tID0gYlxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHcgID0gcmlnaHQgLSBsZWZ0XG4gICAgICAgICAgY29uc3QgaCAgPSBib3R0b20gLSB0b3BcbiAgICAgICAgICBjb25zdCB2dyA9IGZjYW52YXMuZ2V0V2lkdGggICgpXG4gICAgICAgICAgY29uc3QgdmggPSBmY2FudmFzLmdldEhlaWdodCAoKVxuXG4gICAgICAgICAgY29uc3QgZiA9IHcgPiBoXG4gICAgICAgICAgICAgICAgICAgID8gKHZ3IDwgdmggPyB2dyA6IHZoKSAvIHdcbiAgICAgICAgICAgICAgICAgICAgOiAodncgPCB2aCA/IHZ3IDogdmgpIC8gaFxuXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbMF0gPSBmXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbM10gPSBmXG5cbiAgICAgICAgICBjb25zdCBjeCA9IGxlZnQgKyB3IC8gMlxuICAgICAgICAgIGNvbnN0IGN5ID0gdG9wICArIGggLyAyXG5cbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFs0XSA9IC0oY3ggKiBmKSArIHZ3IC8gMlxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzVdID0gLShjeSAqIGYpICsgdmggLyAyXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIG9iamVjdHMgKVxuICAgICAgICAgICAgICAgby5zZXRDb29yZHMgKClcblxuICAgICAgICAgIGZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICB9XG5cbiAgICAgaXNvbGF0ZSAoIHNoYXBlOiBTaGFwZSApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIHRoaXMuZmNhbnZhcy5nZXRPYmplY3RzICgpIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBvLnZpc2libGUgPSBmYWxzZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHNoYXBlLmdyb3VwLnZpc2libGUgPSB0cnVlXG4gICAgIH1cblxuICAgICBnZXRUaHVtYm5haWwgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgYWN0aXZlOiBjdmlldyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgdGh1bWJuYWlsID0gY3ZpZXcudGh1bWJuYWlsXG5cbiAgICAgICAgICBpZiAoIHRodW1ibmFpbCB8fCBjdmlldy5hY3RpdmUgPT0gZmFsc2UgKVxuICAgICAgICAgICAgICAgdGh1bWJuYWlsXG5cbiAgICAgICAgICByZXR1cm4gY3ZpZXcudGh1bWJuYWlsID0gdGhpcy5mY2FudmFzLnRvRGF0YVVSTCAoeyBmb3JtYXQ6IFwianBlZ1wiIH0pXG4gICAgIH1cblxuICAgICAvLyBVSSBFVkVOVFNcblxuICAgICBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIHRoaXMuaW5pdENsaWNrRXZlbnQgKClcbiAgICAgICAgICB0aGlzLmluaXRPdmVyRXZlbnQgICgpXG4gICAgICAgICAgdGhpcy5pbml0UGFuRXZlbnQgICAoKVxuICAgICAgICAgIHRoaXMuaW5pdFpvb21FdmVudCAgKClcbiAgICAgICAgICAvL3RoaXMuaW5pdE1vdmVPYmplY3QgKClcbiAgICAgICAgICAvL3RoaXMuaW5pdERyYWdFdmVudCAgKClcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJyZXNpemVcIiwgdGhpcy5yZXNwb25zaXZlLmJpbmQgKHRoaXMpIClcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgcmVzcG9uc2l2ZSAoKVxuICAgICB7XG4gICAgICAgICAgdmFyIHdpZHRoICAgPSAod2luZG93LmlubmVyV2lkdGggID4gMCkgPyB3aW5kb3cuaW5uZXJXaWR0aCAgOiBzY3JlZW4ud2lkdGhcbiAgICAgICAgICB2YXIgaGVpZ2h0ICA9ICh3aW5kb3cuaW5uZXJIZWlnaHQgPiAwKSA/IHdpbmRvdy5pbm5lckhlaWdodCA6IHNjcmVlbi5oZWlnaHRcblxuICAgICAgICAgIHRoaXMuZmNhbnZhcy5zZXREaW1lbnNpb25zKHtcbiAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdENsaWNrRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgY29uc3QgbWF4X2NsaWNoX2FyZWEgPSAyNSAqIDI1XG4gICAgICAgICAgdmFyICAgbGFzdF9jbGljayAgICAgPSAtMVxuICAgICAgICAgIHZhciAgIGxhc3RfcG9zICAgICAgID0geyB4OiAtOTk5OSwgeTogLTk5OTkgfVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6ZG93blwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoIFwibW91c2U6ZG93blwiIClcbiAgICAgICAgICAgICAgIGNvbnN0IG5vdyAgID0gRGF0ZS5ub3cgKClcbiAgICAgICAgICAgICAgIGNvbnN0IHBvcyAgID0gZmV2ZW50LnBvaW50ZXJcbiAgICAgICAgICAgICAgIGNvbnN0IHJlc2V0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsYXN0X2NsaWNrID0gbm93XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfcG9zICAgPSBwb3NcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgLy8gTm91cyB2w6lyaWZpb25zIHF1ZSBzb2l0IHVuIGRvdWJsZS1jbGlxdWUuXG4gICAgICAgICAgICAgICBpZiAoIDUwMCA8IG5vdyAtIGxhc3RfY2xpY2sgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMub25Ub3VjaE9iamVjdCApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25Ub3VjaE9iamVjdCAoIGVsZW1lbnQgKVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmV2ZW50LmUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICgpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIGxlcyBkZXV4IGNsaXF1ZXMgc2UgdHJvdXZlIGRhbnMgdW5lIHLDqWdpb24gcHJvY2hlLlxuICAgICAgICAgICAgICAgY29uc3Qgem9uZSA9IChwb3MueCAtIGxhc3RfcG9zLngpICogKHBvcy55IC0gbGFzdF9wb3MueSlcbiAgICAgICAgICAgICAgIGlmICggem9uZSA8IC1tYXhfY2xpY2hfYXJlYSB8fCBtYXhfY2xpY2hfYXJlYSA8IHpvbmUgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcblxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgZm9ybWUuXG4gICAgICAgICAgICAgICBpZiAoIGZldmVudC50YXJnZXQgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgICA9IC0xXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAvLyBTaSBsZSBwb2ludGVyIGVzdCBhdS1kZXNzdXMgZOKAmXVuZSB6b25lIHZpZGUuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5vblRvdWNoQXJlYSApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblRvdWNoQXJlYSAoIHBvcy54LCBwb3MueSApXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIGZldmVudC5lLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoKVxuXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0T3ZlckV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpvdmVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSBmZXZlbnQudGFyZ2V0XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk92ZXJPYmplY3QgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gYXNwZWN0LmdldEFzcGVjdCAoIGZldmVudC50YXJnZXQgKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk92ZXJPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3V0XCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMub3ZlckZPYmplY3QgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uT3V0T2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25PdXRPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0UGFuRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICB2YXIgICBpc0RyYWdnaW5nID0gZmFsc2VcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWCAgID0gLTFcbiAgICAgICAgICB2YXIgICBsYXN0UG9zWSAgID0gLTFcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOmRvd25cIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCB0aGlzLm92ZXJGT2JqZWN0ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHBhZ2Uuc2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgcGFnZS5kaXNjYXJkQWN0aXZlT2JqZWN0ICgpXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT4geyBvLnNlbGVjdGFibGUgPSBmYWxzZSB9IClcblxuICAgICAgICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWCAgID0gZmV2ZW50LnBvaW50ZXIueFxuICAgICAgICAgICAgICAgICAgICBsYXN0UG9zWSAgID0gZmV2ZW50LnBvaW50ZXIueVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCAoKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTptb3ZlXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggaXNEcmFnZ2luZyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvaW50ZXIgID0gZmV2ZW50LnBvaW50ZXJcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs0XSArPSBwb2ludGVyLnggLSBsYXN0UG9zWFxuICAgICAgICAgICAgICAgICAgICBwYWdlLnZpZXdwb3J0VHJhbnNmb3JtIFs1XSArPSBwb2ludGVyLnkgLSBsYXN0UG9zWVxuXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UucmVxdWVzdFJlbmRlckFsbCgpXG5cbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggPSBwb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgPSBwb2ludGVyLnlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6dXBcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IHRydWVcblxuICAgICAgICAgICAgICAgcGFnZS5mb3JFYWNoT2JqZWN0ICggbyA9PlxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBvLnNlbGVjdGFibGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIG8uc2V0Q29vcmRzKClcbiAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgIGlzRHJhZ2dpbmcgPSBmYWxzZVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Wm9vbUV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlID0gdGhpcy5mY2FudmFzXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTp3aGVlbFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBldmVudCAgID0gZmV2ZW50LmUgYXMgV2hlZWxFdmVudFxuICAgICAgICAgICAgICAgdmFyICAgZGVsdGEgICA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgICAgICAgdmFyICAgem9vbSAgICA9IHBhZ2UuZ2V0Wm9vbSgpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gICAgPSB6b29tIC0gZGVsdGEgKiAwLjAwNVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA+IDkpXG4gICAgICAgICAgICAgICAgICAgIHpvb20gPSA5XG5cbiAgICAgICAgICAgICAgIGlmICh6b29tIDwgMC41KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gMC41XG5cbiAgICAgICAgICAgICAgIHBhZ2Uuem9vbVRvUG9pbnQoIG5ldyBmYWJyaWMuUG9pbnQgKCBldmVudC5vZmZzZXRYLCBldmVudC5vZmZzZXRZICksIHpvb20gKVxuXG4gICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0TW92ZU9iamVjdCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgY2x1c3RlciAgID0gdW5kZWZpbmVkIGFzIGZhYnJpYy5PYmplY3QgW11cbiAgICAgICAgICB2YXIgICBwb3NpdGlvbnMgPSB1bmRlZmluZWQgYXMgbnVtYmVyIFtdW11cbiAgICAgICAgICB2YXIgICBvcmlnaW5YICAgPSAwXG4gICAgICAgICAgdmFyICAgb3JpZ2luWSAgID0gMFxuXG4gICAgICAgICAgZnVuY3Rpb24gb25fc2VsZWN0aW9uIChmZXZlbnQ6IGZhYnJpYy5JRXZlbnQpXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICAgICAgICAgICAgY2x1c3RlciA9IHRhcmdldCBbXCJjbHVzdGVyXCJdIGFzIGZhYnJpYy5PYmplY3QgW11cblxuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBvcmlnaW5YICAgPSB0YXJnZXQubGVmdFxuICAgICAgICAgICAgICAgb3JpZ2luWSAgID0gdGFyZ2V0LnRvcFxuICAgICAgICAgICAgICAgcG9zaXRpb25zID0gW11cblxuICAgICAgICAgICAgICAgZm9yICggY29uc3QgbyBvZiBjbHVzdGVyIClcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2ggKFsgby5sZWZ0LCBvLnRvcCBdKVxuXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoXCJjcmVhdGVkXCIpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOmNyZWF0ZWRcIiwgb25fc2VsZWN0aW9uIClcbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246dXBkYXRlZFwiLCBvbl9zZWxlY3Rpb24gKVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwib2JqZWN0Om1vdmluZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGNsdXN0ZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCAgID0gZmV2ZW50LnRhcmdldFxuICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0WCAgPSB0YXJnZXQubGVmdCAtIG9yaWdpblhcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFkgID0gdGFyZ2V0LnRvcCAgLSBvcmlnaW5ZXG5cbiAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCA7IGkgPCBjbHVzdGVyLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9iaiA9IGNsdXN0ZXIgW2ldXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBvcyA9IHBvc2l0aW9ucyBbaV1cbiAgICAgICAgICAgICAgICAgICAgb2JqLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6IHBvcyBbMF0gKyBvZmZzZXRYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA6IHBvcyBbMV0gKyBvZmZzZXRZXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjbGVhcmVkXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY2xlYXJlZFwiKVxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIGluaXREcmFnRXZlbnQgKClcbiAgICAge1xuICAgICAgICAgIC8vIGh0dHBzOi8vd3d3Lnczc2Nob29scy5jb20vaHRtbC9odG1sNV9kcmFnYW5kZHJvcC5hc3BcbiAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vU2hvcGlmeS9kcmFnZ2FibGUvYmxvYi9tYXN0ZXIvc3JjL0RyYWdnYWJsZS9EcmFnZ2FibGUuanNcblxuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwidG91Y2g6ZHJhZ1wiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggZmV2ZW50IClcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJ0b3VjaDpkcmFnXCIgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnZW50ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1FTlRFUlwiLCBmZXZlbnQgKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJkcmFnb3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QLU9WRVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJvcFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAvL2NvbnN0IGUgPSBmZXZlbnQuZSBhcyBEcmFnRXZlbnRcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1BcIiwgZS5kYXRhVHJhbnNmZXIuZ2V0RGF0YSAoXCJ0ZXh0XCIpIClcbiAgICAgICAgICB9KVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IFJhZGlhbE1lbnUgfSBmcm9tIFwiLi4vVWkvQ29tcG9uZW50L0NpcmN1bGFyLU1lbnUvaW5kZXguanNcIlxuaW1wb3J0IHsgQXJlYSB9IGZyb20gXCIuLi9VaS9Db21wb25lbnQvQXJlYS9hcmVhLmpzXCJcbmltcG9ydCAqIGFzIEFzcGVjdCBmcm9tIFwiLi9Bc3BlY3QvaW5kZXguanNcIlxuXG5pbXBvcnQgeyBhZGRDb21tYW5kLCBydW5Db21tYW5kLCBDb21tYW5kTmFtZXMgfSBmcm9tIFwiLi9jb21tYW5kLmpzXCJcblxuZXhwb3J0IGNvbnN0IGFyZWEgPSAgKCgpID0+XG57XG4gICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBcImNhbnZhc1wiIClcblxuICAgICBjYW52YXMud2lkdGggID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICAgICBjYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHRcblxuICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZCAoIGNhbnZhcyApXG5cbiAgICAgcmV0dXJuIG5ldyBBcmVhICggY2FudmFzIClcbn0pICgpXG5cbmV4cG9ydCBjb25zdCBjb250ZXh0dWFsTWVudSA9IG5ldyBSYWRpYWxNZW51ICh7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlOiBcInJhZGlhbC1tZW51XCIsXG4gICAgIGlkOiBcImFyZWEtbWVudVwiLFxuICAgICBidXR0b25zOiBbXG4gICAgICAgICAgeyB0eXBlOiBcImJ1dHRvblwiLCBpZDogXCJhZGQtdGhpbmdcIiAsIHRleHQ6IFwiXCIsIGljb246IFwiJiN4ZTNjODtcIiwgZm9udEZhbWlseTogXCJNYXRlcmlhbCBJY29uc1wiLCBjYWxsYmFjazogKCkgPT4geyBydW5Db21tYW5kICggXCJ6b29tLWV4dGVuZHNcIiApIH0gfSwgLy8gZGV0YWlsc1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLWJ1YmJsZVwiLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU2ZGQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LFxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLW5vdGVcIiAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUyNDQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY29tbWFuZDogXCJwYWNrLXZpZXdcIiB9LCAvLyBmb3JtYXRfcXVvdGVcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1wZW9wbGVcIiwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlODdjO1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZmFjZVxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRhZ1wiICAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU4Njc7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBib29rbWFya19ib3JkZXJcbiAgICAgXSBhcyBhbnksXG4gICAgIHJvdGF0aW9uOiBNYXRoLlBJLzIsXG59KVxuXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBjb250ZXh0dWFsTWVudS5nZXRIdG1sICgpIClcblxuLy8gQ09NTUFORFNcblxuZXhwb3J0IHR5cGUgQXJlYUNvbW1hbmRzID1cbntcbiAgICAgXCJhZGQtc2tpbGxcIiAgICAgICAgICAgOiAoIHRpdGxlOiBzdHJpbmcgKSA9PiB2b2lkLFxuICAgICBcImFkZC1wZXJzb25cIiAgICAgICAgICA6ICggbmFtZTogc3RyaW5nICkgPT4gdm9pZCxcbiAgICAgXCJ6b29tLWV4dGVuZHNcIiAgICAgICAgOiAoKSA9PiB2b2lkLFxuICAgICBcInpvb20tdG9cIiAgICAgICAgICAgICA6ICggc2hhcGU6IEFzcGVjdC5TaGFwZSApID0+IHZvaWQsXG4gICAgIFwicGFjay12aWV3XCIgICAgICAgICAgIDogKCkgPT4gdm9pZCxcbiAgICAgXCJvcGVuLWNvbnRleHRhbC1tZW51XCIgOiAoIHg6IG51bWJlciwgeTogbnVtYmVyICkgPT4gdm9pZCxcbiAgICAgXCJjbG9zZS1jb250ZXh0YWwtbWVudVwiOiAoKSA9PiB2b2lkLFxufVxuXG5hZGRDb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9Plxue1xuICAgICBjb250ZXh0dWFsTWVudS5zaG93ICggeCwgeSApXG59KVxuXG5hZGRDb21tYW5kICggXCJjbG9zZS1jb250ZXh0YWwtbWVudVwiLCAoKSA9Plxue1xuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuXG5hZGRDb21tYW5kICggXCJhZGQtc2tpbGxcIiwgKCB0aXRsZSApID0+XG57XG4gICAgIGNvbnNvbGUubG9nICggXCJBZGQgc2tpbGxcIiApXG59KVxuXG5hZGRDb21tYW5kICggXCJhZGQtcGVyc29uXCIsICggbmFtZSApID0+XG57XG5cbn0pXG5cbmFkZENvbW1hbmQgKCBcInpvb20tZXh0ZW5kc1wiLCAoKSA9Plxue1xuICAgICBhcmVhLnpvb20gKClcbn0pXG5cbmFkZENvbW1hbmQgKCBcInpvb20tdG9cIiwgKCBzaGFwZSApID0+XG57XG4gICAgIGFyZWEuem9vbSAoIHNoYXBlIClcbiAgICAgYXJlYS5pc29sYXRlICggc2hhcGUgKVxufSlcblxuYWRkQ29tbWFuZCAoIFwicGFjay12aWV3XCIsICgpID0+XG57XG4gICAgIGFyZWEucGFjayAoKVxufSlcblxuLy8gQ0xJQ0sgRVZFTlRTXG5cbi8vIGFyZWEub25Ub3VjaE9iamVjdCA9ICggc2hhcGUgKSA9PlxuLy8ge1xuLy8gICAgICBydW5Db21tYW5kICggXCJ6b29tLXRvXCIsIHNoYXBlIClcbi8vIH1cblxuYXJlYS5vbkRvdWJsZVRvdWNoT2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uVG91Y2ggIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25Ub3VjaCAoIHNoYXBlIClcbn1cblxuYXJlYS5vblRvdWNoQXJlYSA9ICggeCwgeSApID0+XG57XG4gICAgIHJ1bkNvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiwgeCwgeSApXG59XG5cbi8vIEhPVkVSIEVWRU5UU1xuXG5hcmVhLm9uT3Zlck9iamVjdCA9ICggc2hhcGUgKSA9Plxue1xuICAgICBzaGFwZS5ob3ZlciAoIHRydWUgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG5hcmVhLm9uT3V0T2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIHNoYXBlLmhvdmVyICggZmFsc2UgKVxuICAgICBhcmVhLmZjYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxufVxuXG4vLyBURVNUXG5cbmlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG57XG5cbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJtb3ZlXCIsIGV2ZW50ID0+XG4gICAgIHtcbiAgICAgICAgICAvL2NvbnN0IHRhcmdldCA9IGFyZWEuZmNhbnZhcy5maW5kVGFyZ2V0ICggZXZlbnQsIHRydWUgKVxuICAgICAgICAgIC8vaWYgKCB0YXJnZXQgKVxuICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyAoIHRhcmdldCApXG4gICAgIH0pXG59XG5lbHNlXG57XG4gICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZW1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cbiIsIlxuaW1wb3J0IFwiLi4vTGliL2luZGV4LmpzXCJcbmltcG9ydCBcIi4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IFwiLi4vVWkvaW5kZXguanNcIlxuXG5pbXBvcnQgXCIuL0FzcGVjdC9pbmRleC5qc1wiXG5cbmV4cG9ydCAqIGZyb20gXCIuL0RhdGEvaW5kZXguanNcIlxuXG5cbmltcG9ydCBcIi4vY29udGV4dC1tZW51LmpzXCJcbmltcG9ydCBcIi4vbWVudS5qc1wiXG5pbXBvcnQgXCIuL3BhbmVsLmpzXCJcbmltcG9ydCBcIi4vYXJlYS5qc1wiXG5cbmV4cG9ydCAqIGZyb20gXCIuL2NvbW1hbmQuanNcIlxuZXhwb3J0ICogZnJvbSBcIi4vYXJlYS5qc1wiXG5cblxuaW1wb3J0IHsgYXJlYSwgY29udGV4dHVhbE1lbnUgfSBmcm9tIFwiLi9hcmVhLmpzXCJcbmltcG9ydCB7IHBhbmVsIH0gZnJvbSBcIi4vcGFuZWwuanNcIlxuaW1wb3J0IHsgbWVudSB9IGZyb20gXCIuL21lbnUuanNcIlxuaW1wb3J0IHsgb25Db21tYW5kIH0gZnJvbSBcIi4vY29tbWFuZC5qc1wiXG5cbmV4cG9ydCBmdW5jdGlvbiB3aWR0aCAoKVxue1xuICAgICByZXR1cm4gYXJlYS5mY2FudmFzLmdldFdpZHRoICgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZWlnaHQgKClcbntcbiAgICAgcmV0dXJuIGFyZWEuZmNhbnZhcy5nZXRIZWlnaHQgKClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2ggKClcbntcbiAgICAgLy8kYXJlYS5zZXRab29tICgwLjEpXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbm9uQ29tbWFuZCAoIFwib3Blbi1tZW51XCIsICgpID0+XG57XG4gICAgIHBhbmVsLmNsb3NlICgpXG4gICAgIGNvbnRleHR1YWxNZW51LmhpZGUgKClcbn0pXG5vbkNvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCkgPT5cbntcbiAgICAgbWVudS5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuIiwiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJmYWtlclwiIC8+XG5kZWNsYXJlIGNvbnN0IGZha2VyOiBGYWtlci5GYWtlclN0YXRpY1xuXG5pbXBvcnQgKiBhcyBhcHAgZnJvbSBcIi4uL0FwcGxpY2F0aW9uL2luZGV4LmpzXCJcblxuY29uc3QgcmFuZG9tSW50ID0gKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikgPT5cbntcbiAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG59XG5cbmNvbnN0IGFyZWEgPSBhcHAuYXJlYVxuY29uc3QgdmlldyA9IGFyZWEuY3JlYXRlVmlldyAoIFwiY29tcMOpdGFuY2VzXCIgKVxuYXJlYS51c2UgKCB2aWV3IClcblxuLy8gSWNpIG9uIGFqb3V0ZSBkZXMgcGVyc29ubmVzIMOgIGzigJlhcHBsaWNhdGlvbi5cblxuY29uc3QgcGVyc29uTmFtZXMgPSBbXVxuZm9yICggdmFyIGkgPSAxIDsgaSA8PSAyMCA7IGkrKyApXG57XG4gICAgIGFwcC5zZXROb2RlIDwkUGVyc29uPiAoe1xuICAgICAgICAgIHR5cGUgICAgIDogXCJwZXJzb25cIixcbiAgICAgICAgICBpZCAgICAgICA6IFwidXNlclwiICsgaSxcbiAgICAgICAgICBmaXJzdE5hbWU6IGZha2VyLm5hbWUuZmlyc3ROYW1lICgpLFxuICAgICAgICAgIGxhc3ROYW1lIDogZmFrZXIubmFtZS5sYXN0TmFtZSAoKSxcbiAgICAgICAgICBhdmF0YXIgICA6IGAuL2F2YXRhcnMvZiAoJHtpfSkuanBnYCxcbiAgICAgICAgICBpc0NhcHRhaW46IHJhbmRvbUludCAoMCw0KSA9PSAxIC8vaSAlIDQgPT0gMCxcbiAgICAgfSlcblxuICAgICBhcHAuc2V0Tm9kZSA8JFBlcnNvbj4gKHtcbiAgICAgICAgICB0eXBlICAgICA6IFwicGVyc29uXCIsXG4gICAgICAgICAgaWQgICAgICAgOiBcInVzZXJcIiArICgyMCArIGkpLFxuICAgICAgICAgIGZpcnN0TmFtZTogZmFrZXIubmFtZS5maXJzdE5hbWUgKCksXG4gICAgICAgICAgbGFzdE5hbWUgOiBmYWtlci5uYW1lLmxhc3ROYW1lICgpLFxuICAgICAgICAgIGF2YXRhciAgIDogYC4vYXZhdGFycy9oICgke2l9KS5qcGdgLFxuICAgICAgICAgIGlzQ2FwdGFpbjogcmFuZG9tSW50ICgwLDQpID09IDEgLy8gKDIwICsgaSkgJSA0ID09IDAsXG4gICAgIH0pXG5cbiAgICAgcGVyc29uTmFtZXMucHVzaCAoIFwidXNlclwiICsgaSwgXCJ1c2VyXCIgKyAoMjAgKyBpKSApXG5cbiAgICAgLy8gYXJlYS5hZGQgKCBcInBlcnNvblwiLCBcInVzZXJcIiArIGkgKVxuICAgICAvLyBhcmVhLmFkZCAoIFwicGVyc29uXCIsIFwidXNlclwiICsgKGkgKyAyMCkgKVxufVxuXG4vLyBCYWRnZXNcblxuLy8gaHR0cHM6Ly9kcml2ZS5nb29nbGUuY29tL2RyaXZlL2ZvbGRlcnMvMUt3V2w5R19BOHY5MU5MWEFwalpHSENmbnhfbW5mTUU0XG4vLyBodHRwczovL3JlY29ubmFpdHJlLm9wZW5yZWNvZ25pdGlvbi5vcmcvcmVzc291cmNlcy9cbi8vIGh0dHBzOi8vd3d3LmxldHVkaWFudC5mci9lZHVjcHJvcy9hY3R1YWxpdGUvbGVzLW9wZW4tYmFkZ2VzLXVuLWNvbXBsZW1lbnQtYXV4LWRpcGxvbWVzLXVuaXZlcnNpdGFpcmVzLmh0bWxcblxuLy8gaHR0cHM6Ly93d3cuZWNob3NjaWVuY2VzLW5vcm1hbmRpZS5mci9jb21tdW5hdXRlcy9sZS1kb21lL2FydGljbGVzL2JhZGdlLWRvbWVcblxuY29uc3QgYmFkZ2VQcmVzZXRzID0geyAvLyBQYXJ0aWFsIDwkQmFkZ2U+XG4gICAgIGRlZmF1bHQgICAgICAgOiB7IGlkOiBcImRlZmF1bHRcIiAgICAgICwgZW1vamk6IFwi8J+mgVwiIH0sXG4gICAgIGhhdCAgICAgICAgICAgOiB7IGlkOiBcImhhdFwiICAgICAgICAgICwgZW1vamk6IFwi8J+OqVwiIH0sXG4gICAgIHN0YXIgICAgICAgICAgOiB7IGlkOiBcInN0YXJcIiAgICAgICAgICwgZW1vamk6IFwi4q2QXCIgfSxcbiAgICAgY2xvdGhlcyAgICAgICA6IHsgaWQ6IFwiY2xvdGhlc1wiICAgICAgLCBlbW9qaTogXCLwn5GVXCIgfSxcbiAgICAgZWNvbG9neSAgICAgICA6IHsgaWQ6IFwiZWNvbG9neVwiICAgICAgLCBlbW9qaTogXCLwn5KnXCIgfSxcbiAgICAgcHJvZ3JhbW1pbmcgICA6IHsgaWQ6IFwicHJvZ3JhbW1pbmdcIiAgLCBlbW9qaTogXCLwn5K+XCIgfSxcbiAgICAgY29tbXVuaWNhdGlvbiA6IHsgaWQ6IFwiY29tbXVuaWNhdGlvblwiLCBlbW9qaTogXCLwn5OiXCIgfSxcbiAgICAgY29uc3RydWN0aW9uICA6IHsgaWQ6IFwiY29uc3RydWN0aW9uXCIgLCBlbW9qaTogXCLwn5SoXCIgfSxcbiAgICAgYmlvbG9neSAgICAgICA6IHsgaWQ6IFwiYmlvbG9neVwiICAgICAgLCBlbW9qaTogXCLwn5SsXCIgfSxcbiAgICAgcm9ib3RpYyAgICAgICA6IHsgaWQ6IFwicm9ib3RpY1wiICAgICAgLCBlbW9qaTogXCLwn6SWXCIgfSxcbiAgICAgZ2FtZSAgICAgICAgICA6IHsgaWQ6IFwiZ2FtZVwiICAgICAgICAgLCBlbW9qaTogXCLwn6ShXCIgfSxcbiAgICAgbXVzaWMgICAgICAgICA6IHsgaWQ6IFwibXVzaWNcIiAgICAgICAgLCBlbW9qaTogXCLwn6WBXCIgfSxcbiAgICAgbGlvbiAgICAgICAgICA6IHsgaWQ6IFwibGlvblwiICAgICAgICAgLCBlbW9qaTogXCLwn6aBXCIgfSxcbiAgICAgdm9sdGFnZSAgICAgICA6IHsgaWQ6IFwidm9sdGFnZVwiICAgICAgLCBlbW9qaTogXCLimqFcIiB9LFxufVxuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG4gICAgIGFwcC5zZXROb2RlICh7IGNvbnRleHQ6IFwiY29uY2VwdC1kYXRhXCIsIHR5cGU6IFwiYmFkZ2VcIiwgLi4uIGJhZGdlUHJlc2V0cyBbbmFtZV0gfSlcblxuLy8gU2tpbGxzXG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbntcbiAgICAgY29uc3QgcGVvcGxlID0gW10gYXMgJFBlcnNvbiBbXVxuXG4gICAgIGZvciAoIHZhciBqID0gcmFuZG9tSW50ICggMCwgNiApIDsgaiA+IDAgOyBqLS0gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IHBlcnNvbk5hbWVzLnNwbGljZSAoIHJhbmRvbUludCAoIDEsIHBlcnNvbk5hbWVzLmxlbmd0aCApLCAxICkgWzBdXG5cbiAgICAgICAgICBpZiAoIG5hbWUgKVxuICAgICAgICAgICAgICAgcGVvcGxlLnB1c2ggKCBhcHAuZ2V0Tm9kZSA8JFBlcnNvbj4gKCBcInBlcnNvblwiLCBuYW1lICkgKVxuICAgICB9XG5cbiAgICAgYXBwLnNldE5vZGUgPCRTa2lsbD4gKHtcbiAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtZGF0YVwiLFxuICAgICAgICAgIHR5cGUgICA6IFwic2tpbGxcIixcbiAgICAgICAgICBpZCAgICAgOiBuYW1lLFxuICAgICAgICAgIGljb24gICA6IG5hbWUsXG4gICAgICAgICAgaXRlbXMgIDogcGVvcGxlXG4gICAgIH0pXG5cbn1cblxuLy9cblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxuICAgICBhcmVhLmFkZCAoIFwic2tpbGxcIiwgbmFtZSApXG5cbi8vIE5vdGVzXG5cbi8vIGNvbnN0IG5vdGUgPSAgbmV3IEIuTm90ZSAoe1xuLy8gICAgICB0ZXh0OiBcIkEgbm90ZSAuLi5cIixcbi8vIH0pXG4vLyBhcmVhLmFkZCAoIEFzcGVjdC5jcmVhdGUgKCBub3RlICkgKVxuXG5cbmFyZWEucGFjayAoKVxuYXJlYS56b29tICgpXG5cblxuLy8gQ2x1c3RlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy9cbi8vIGNvbnN0IHQxID0gbmV3IGZhYnJpYy5UZXh0Ym94ICggXCJFZGl0YWJsZSA/XCIsIHtcbi8vICAgICAgdG9wOiA1MCxcbi8vICAgICAgbGVmdDogMzAwLFxuLy8gICAgICBmb250U2l6ZTogMzAsXG4vLyAgICAgIHNlbGVjdGFibGU6IHRydWUsXG4vLyAgICAgIGVkaXRhYmxlOiB0cnVlLFxuLy8gICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuLy8gICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxuLy8gfSlcbi8vIGNvbnN0IHIxID0gbmV3IGZhYnJpYy5SZWN0ICh7XG4vLyAgICAgIHRvcCAgIDogMCxcbi8vICAgICAgbGVmdCAgOiAzMDAsXG4vLyAgICAgIHdpZHRoIDogNTAsXG4vLyAgICAgIGhlaWdodDogNTAsXG4vLyAgICAgIGZpbGwgIDogXCJibHVlXCIsXG4vLyAgICAgIHNlbGVjdGFibGU6IHRydWUsXG4vLyAgICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4vLyAgICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG4vLyB9KVxuLy8gJGFwcC5fbGF5b3V0LmFyZWEuYWRkICh0MSlcbi8vICRhcHAuX2xheW91dC5hcmVhLmFkZCAocjEpXG4vLyB0MVtcImNsdXN0ZXJcIl0gPSBbIHIxIF1cbi8vIHIxW1wiY2x1c3RlclwiXSA9IFsgdDEgXVxuXG4iXSwibmFtZXMiOlsiTm9kZSIsImRlZmF1bHRDb25maWciLCJkcmFnZ2FibGUiLCJVaS5kcmFnZ2FibGUiLCJDc3MuZ2V0VW5pdCIsInVFdmVudC5jcmVhdGUiLCJTdmcuY3JlYXRlU3ZnU2hhcGUiLCJDT05URVhUIiwibm9ybWFsaXplIiwiZGIuZ2V0Tm9kZSIsIkZhY3RvcnkiLCJHZW9tZXRyeSIsImRiIiwiZmFjdG9yeSIsIkNvbnRhaW5lciIsIkdlb21ldHJ5LnBhY2tFbmNsb3NlIiwiY21kIiwidWkubWFrZSIsInVpLnBpY2siLCJhc3BlY3QuZ2V0QXNwZWN0IiwiYXJlYSIsImFwcC5hcmVhIiwiYXBwLnNldE5vZGUiLCJhcHAuZ2V0Tm9kZSJdLCJtYXBwaW5ncyI6Ijs7O2FBWWdCLE1BQU07UUFFbEIsTUFBTSxRQUFRLEdBQUcsRUFBUyxDQUFBO1FBQzFCLElBQU0sT0FBTyxHQUFJLElBQUksQ0FBQTtRQUVyQixNQUFNLElBQUksR0FBRyxVQUFXLFFBQVc7WUFFL0IsUUFBUSxDQUFDLElBQUksQ0FBRyxRQUFRLENBQUUsR0FBRyxDQUFDLENBQUE7WUFFOUIsT0FBTyxJQUFJLENBQUE7U0FDZCxDQUFBO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRztZQUVULE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQTtTQUN6QixDQUFBO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRztZQUVYLE9BQU8sR0FBRyxLQUFLLENBQUE7WUFFZixPQUFPLElBQUksQ0FBQTtTQUNkLENBQUE7UUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHO1lBRVYsT0FBTyxHQUFHLElBQUksQ0FBQTtZQUVkLE9BQU8sSUFBSSxDQUFBO1NBQ2QsQ0FBQTtRQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBRSxRQUFXO1lBRXZCLElBQUksQ0FBRyxRQUFRLENBQUUsQ0FBQTtZQUVqQixPQUFPLElBQUksQ0FBQTtTQUNkLENBQUE7UUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUUsUUFBVztZQUV2QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFHLFFBQVEsQ0FBRSxDQUFBO1lBRTNDLElBQUssS0FBSyxJQUFJLENBQUMsQ0FBQztnQkFDWixRQUFRLENB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LEVBQUUsR0FBRyxFQUFFLEVBRVosRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUVyQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUN0QixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFDL0IsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFPLEVBQUUsR0FBRyxDQUFDLENBQUUsR0FBRyxFQUFFLEVBQzVDLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSyxFQUFFLEVBRS9CLENBQUMsR0FBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUMxQixDQUFDLEdBQUksQ0FBQyxJQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUUsRUFDbkMsQ0FBQyxHQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNoQyxDQUFDLEdBQUksRUFBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDLEdBQUcsQ0FB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
