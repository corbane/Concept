(function () {
    'use strict';

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

    const fabric_base_obtions = {
        left: 0,
        top: 0,
        originX: "center",
        originY: "center",
    };
    function group(def, size, opt) {
        return new fabric.Group(undefined, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size, height: size }));
    }
    // To get points of triangle, square, [panta|hexa]gon
    //
    // var a = Math.PI*2/4
    // for ( var i = 0 ; i != 4 ; i++ )
    //     console.log ( `[ ${ Math.sin(a*i) }, ${ Math.cos(a*i) } ]` )
    function circle(def, size, opt) {
        return new fabric.Circle(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { radius: size / 2 }));
    }
    function triangle(def, size, opt) {
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
    }
    function square(def, size, opt) {
        const scale = 0.9;
        return new fabric.Rect(Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { width: size * scale, height: size * scale }));
    }
    function pantagon(def, size, opt) {
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
    }
    function hexagon(def, size, opt) {
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
    }
    function text(def, size, opt) {
        return new fabric.Text("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
    }
    function textbox(def, size, opt) {
        return new fabric.Textbox("...", Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { fontSize: size }));
    }
    function path(def, size, opt) {
        return new fabric.Path(def.path, Object.assign(Object.assign(Object.assign({}, fabric_base_obtions), opt), { scaleX: size / 100, scaleY: size / 100 }));
    }
    const Factory$1 = {
        group,
        circle,
        triangle,
        square,
        pantagon,
        hexagon,
        text,
        textbox,
        path,
    };
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

    class Shape {
        constructor(data) {
            this.group = undefined;
            this.background = undefined;
            this.border = undefined;
            this.config = Object.assign(Object.assign({}, this.defaultConfig()), data);
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
            group.set({ left: x, top: y }).setCoords();
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

    // <reference path="../typings.d.ts" />
    const CONTEXT = "concept-aspect";
    const db = new Database();
    const factory = new Factory(db);
    const ASPECT = Symbol.for("ASPECT");
    /**
     * Assigne si besoin le contexte "aspect" au noeud
     */
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
    function getAspect(obj) {
        if (obj == undefined)
            return undefined;
        if (obj instanceof Shape)
            return obj;
        if (obj instanceof fabric.Object)
            return obj[ASPECT];
        if (factory.inStock(CONTEXT, obj.type, obj.id))
            return factory.make(CONTEXT, obj.type, obj.id);
        const options = obj.context == CONTEXT
            ? obj
            : {
                context: CONTEXT,
                type: obj.type,
                id: obj.id,
                data: obj,
            };
        if (!isFinite(options.x))
            options.x = 0;
        if (!isFinite(options.y))
            options.y = 0;
        const shape = factory.make(options);
        // shape.events = arguments.events
        // Object.assign ( shape, events )
        //shape.init ()
        shape.group[ASPECT] = shape;
        if (shape.config.onCreate)
            shape.config.onCreate(shape.config.data, shape);
        return shape;
    }
    function setAspect(node) {
        db.set(normalize(node));
    }
    function defineAspect(ctor, type) {
        factory._define(ctor, [CONTEXT, type]);
    }

    /// <reference path="./nodes.d.ts" />
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
                        Area.currentEvent = fevent;
                        if (element)
                            this.onTouchObject(element);
                        Area.currentEvent = null;
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
                        Area.currentEvent = fevent;
                        if (element)
                            this.onDoubleTouchObject(element);
                        Area.currentEvent = null;
                    }
                    last_click = -1;
                }
                // Si le pointer est au-dessus d’une zone vide.
                else {
                    Area.currentEvent = fevent;
                    if (this.onTouchArea)
                        this.onTouchArea(pos.x, pos.y);
                    Area.currentEvent = null;
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
                    Area.currentEvent = fevent;
                    if (element)
                        this.onOverObject(element);
                    Area.currentEvent = null;
                }
            });
            page.on("mouse:out", fevent => {
                this.overFObject = undefined;
                if (this.onOutObject) {
                    const element = getAspect(fevent.target);
                    Area.currentEvent = fevent;
                    if (element)
                        this.onOutObject(element);
                    Area.currentEvent = null;
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

    const cmds = {};
    class Command {
        constructor(callback) {
            this.callback = callback;
        }
        run() {
            try {
                this.callback(Area.currentEvent);
            }
            catch (error) {
            }
        }
    }
    function command(name, callback) {
        if (typeof callback == "function") {
            if (name in cmds)
                return;
            cmds[name] = new Command(callback);
        }
        return cmds[name];
    }

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
    const CONTEXT$2 = "concept-ui";
    const db$1 = new Database();
    const factory$1 = new Factory(db$1);
    const inStock = function () {
        const arg = arguments.length == 1
            ? normalize$2(arguments[0])
            : normalize$2([...arguments]);
        const path = factory$1.getPath(arg);
        return factory$1._inStock(path);
    };
    const pick = function (...rest) {
        const arg = arguments.length == 1
            ? normalize$2(arguments[0])
            : normalize$2([...arguments]);
        const path = factory$1.getPath(arg);
        return factory$1._pick(path);
    };
    const make = function () {
        const arg = arguments.length == 1
            ? normalize$2(arguments[0])
            : normalize$2([...arguments]);
        const path = factory$1.getPath(arg);
        if (isNode(arg))
            var data = arg;
        return factory$1._make(path, data);
    };
    const set = function () {
        const arg = normalize$2(arguments[0]);
        if (arguments.length == 1)
            db$1.set(arg);
        else
            db$1.set(arg, normalize$2(arguments[1]));
    };
    const define = function (ctor, ...rest) {
        const arg = rest.length == 1
            ? normalize$2(rest[0])
            : normalize$2([...rest]);
        const path = factory$1.getPath(arg);
        factory$1._define(ctor, path);
    };
    function isNode(obl) {
        return typeof obl == "object" && !Array.isArray(obl);
    }
    function normalize$2(arg) {
        if (Array.isArray(arg)) {
            if (arg[0] !== CONTEXT$2)
                arg.unshift(CONTEXT$2);
        }
        else if (typeof arg == "object") {
            if ("context" in arg) {
                if (arg.context !== CONTEXT$2)
                    throw "Bad context value";
            }
            else {
                arg.context = CONTEXT$2;
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
                    e = inStock(e) ? pick(e) : make(e);
                }
                else {
                    throw `Unable to add a child of type ${typeof e}`;
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
                //Commands.current.run ( this.data.command )
                command(this.data.command).run();
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
    class SideMenu extends Container {
        getHtml() {
            const data = this.data;
            const header = xnode("div", { class: "side-menu-header" });
            const content = xnode("div", { class: "side-menu-content" });
            const container = xnode("div", { class: "side-menu close" },
                header,
                content);
            if (data.header) {
                this.header = inStock(data.header)
                    ? pick(data.header)
                    : make(data.header);
                header.append(...this.header.getHtml());
            }
            if (data.hasMainButton) {
                const btn = xnode("span", { class: "side-menu-main-button" },
                    xnode("span", { class: "icon" }, "\u21D5"));
                this.main_button = btn;
                header.insertAdjacentElement("afterbegin", btn);
            }
            if (data.children) {
                for (const child of data.children) {
                    this.content = inStock(child) ? pick(child) : make(child);
                    content.append(...this.content.getHtml());
                }
            }
            container.classList.add(toPosition[data.direction]);
            scollable({ handles: [content], direction: "bt" }).activate();
            this.container = container;
            this.expandable = expandable(this.container, {
                direction: data.direction,
                near: 60,
                handles: Array.of(this.main_button),
                onAfterOpen: () => content.classList.remove("hidden"),
                onBeforeClose: () => content.classList.add("hidden")
            });
            this.expandable.activate();
            return [this.container];
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
    //export type MenuCommands = {
    //     "open-menu": () => void,
    //     "close-menu": () => void,
    //}
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

    //import * as Aspect from "./Aspect/index.js"
    //import { addCommand, runCommand } from "./command.js"
    //import { command } from "./command.js"
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
            //{ type: "button", id: "add-thing" , text: "", icon: "&#xe3c8;", fontFamily: "Material Icons", callback: () => { runCommand ( "zoom-extends" ) } }, // details
            { type: "button", id: "add-thing", text: "", icon: "&#xe3c8;", fontFamily: "Material Icons" },
            { type: "button", id: "add-bubble", text: "", icon: "&#xe6dd;", fontFamily: "Material Icons" },
            { type: "button", id: "add-note", text: "", icon: "&#xe244;", fontFamily: "Material Icons", command: "pack-view" },
            { type: "button", id: "add-people", text: "", icon: "&#xe87c;", fontFamily: "Material Icons" },
            { type: "button", id: "add-tag", text: "", icon: "&#xe867;", fontFamily: "Material Icons" },
        ],
        rotation: Math.PI / 2,
    });
    document.body.append(...contextualMenu.getHtml());
    // CLICK EVENTS
    // area.onTouchObject = ( shape ) =>
    // {
    //      run Command ( "zoom-to", shape )
    // }
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

    command("open-menu", () => {
        panel.close();
        contextualMenu.hide();
    });
    command("open-panel", () => {
        menu.close();
        contextualMenu.hide();
    });
    const slideshow = pick("slideshow", "panel-slideshow");
    const slideInfos = pick("skill-viewer", "slide-skill");
    command("open-panel", (name, ...content) => {
        // if ( name )
        //      slideshow.show ( name, ... content )
        // else
        //      panel.open ()
    });
    command("open-infos-panel", (e) => {
        const aspect = getAspect(Area.currentEvent.target);
        if (aspect) {
            const skill = getNode({
                type: aspect.config.type,
                id: aspect.config.id
            });
            if (skill) {
                slideInfos.display(skill);
                panel.open();
            }
        }
    });
    command("close-panel", () => {
        panel.close();
    });
    // AREA EVENTS
    area.onDoubleTouchObject = (shape) => {
        if (shape.config.onTouch != undefined)
            shape.config.onTouch(shape);
    };
    area.onTouchArea = (x, y) => {
        command("open-contextal-menu").run();
        //run Command ( "open-contextal-menu", x, y )
    };
    // AREA COMMANDS
    //export type AreaCommands =
    //{
    //     "add-skill"           : ( title: string ) => void,
    //     "add-person"          : ( name: string ) => void,
    //     "zoom-extends"        : () => void,
    //     "zoom-to"             : ( shape: Aspect.Shape ) => void,
    //     "pack-view"           : () => void,
    //     "open-contextal-menu" : ( x: number, y: number ) => void,
    //     "close-contextal-menu": () => void,
    //}
    command("open-contextal-menu", (e) => {
        contextualMenu.show(e.pointer.x, e.pointer.y);
    });
    command("close-contextal-menu", () => {
        contextualMenu.hide();
    });
    command("add-skill", (title) => {
        console.log("Add skill");
    });
    command("add-person", (name) => {
    });
    command("zoom-extends", () => {
        area.zoom();
    });
    command("zoom-to", (shape) => {
        // area.zoom ( shape )
        // area.isolate ( shape )
    });
    command("pack-view", () => {
        area.pack();
    });

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
            // const skill = getNode <$Skill> ({
            //      type: shape.config.type,
            //      id  : shape.config.id
            // })
            // command ( "open-infos-panel", skill ).run ()
            command("open-infos-panel").run();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL0xpYi9nZW9tZXRyeS9kaXN0cmlidXRlLnRzIiwiLi4vLi4vTGliL2dlb21ldHJ5L2QzLWVuY2xvc2UudHMiLCIuLi8uLi9MaWIvZ2VvbWV0cnkvZDMtcGFjay50cyIsIi4uLy4uL0xpYi9jc3MvdW5pdC50cyIsIi4uLy4uL0RhdGEvRGF0YS9ub2RlLnRzIiwiLi4vLi4vRGF0YS9EYi9kYXRhLXRyZWUudHMiLCIuLi8uLi9EYXRhL0RiL2RiLnRzIiwiLi4vLi4vRGF0YS9EYi9mYWN0b3J5LnRzIiwiLi4vLi4vVWkvQmFzZS94bm9kZS50cyIsIi4uLy4uL1VpL0Jhc2UvZHJhZ2dhYmxlLnRzIiwiLi4vLi4vVWkvQmFzZS9kb20udHMiLCIuLi8uLi9VaS9CYXNlL2V4cGVuZGFibGUudHMiLCIuLi8uLi9VaS9CYXNlL3N3aXBlYWJsZS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9nZW9tZXRyeS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vZGF0YS50cyIsIi4uLy4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEudHMiLCIuLi8uLi9VaS9jb21tYW5kLnRzIiwiLi4vLi4vVWkvQmFzZS9Db21wb25lbnQvaW5kZXgudHN4IiwiLi4vLi4vVWkvZGIudHMiLCIuLi8uLi9VaS9Db21wb25lbnQvUGhhbnRvbS9pbmRleC50c3giLCIuLi8uLi9VaS9CYXNlL0NvbnRhaW5lci9pbmRleC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvQmFyL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9CdXR0b24vaHRtbC50c3giLCIuLi8uLi9VaS9Db21wb25lbnQvQnV0dG9uL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9TbGlkZVNob3cvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L0xpc3QvaW5kZXgudHN4IiwiLi4vLi4vVWkvQ29tcG9uZW50L1Rvb2xiYXIvaW5kZXgudHN4IiwiLi4vLi4vVWkvQmFzZS9zY3JvbGxhYmxlLnRzIiwiLi4vLi4vVWkvQ29tcG9uZW50L1NpZGVNZW51L2luZGV4LnRzeCIsIi4uLy4uL1VpL0Jhc2UvU3ZnL2luZGV4LnRzeCIsIi4uLy4uL1VpL0NvbXBvbmVudC9DaXJjdWxhck1lbnUvaW5kZXgudHN4IiwiLi4vLi4vVWkvRW50aXR5L1BlcnNvbi9pbmRleC50c3giLCIuLi8uLi9VaS9FbnRpdHkvU2tpbGwvaW5kZXgudHN4IiwiLi4vLi4vQXBwbGljYXRpb24vbWVudS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL3BhbmVsLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vYXJlYS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL2NvbW1hbmQudHMiLCIuLi8uLi9BcHBsaWNhdGlvbi9Bc3BlY3QvRWxlbWVudC9iYWRnZS50cyIsIi4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L2dyb3VwLnRzIiwiLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2luZGV4LnRzIiwiLi4vaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5cbmV4cG9ydCB0eXBlIFJhZGlhbE9wdGlvbiA9IHtcbiAgICByICAgICAgICA6IG51bWJlcixcbiAgICBjb3VudCAgICA6IG51bWJlcixcbiAgICBwYWRkaW5nPyA6IG51bWJlcixcbiAgICByb3RhdGlvbj86IG51bWJlcixcbn1cblxuZXhwb3J0IHR5cGUgUmFkaWFsRGVmaW5pdGlvbiA9IFJlcXVpcmVkIDxSYWRpYWxPcHRpb24+ICYge1xuICAgIGN4ICAgIDogbnVtYmVyLFxuICAgIGN5ICAgIDogbnVtYmVyLFxuICAgIHdpZHRoIDogbnVtYmVyLFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIHBvaW50czogUGFydCBbXSxcbn1cblxudHlwZSBQYXJ0ID0ge1xuICAgIHggOiBudW1iZXJcbiAgICB5IDogbnVtYmVyXG4gICAgYSA6IG51bWJlclxuICAgIGExOiBudW1iZXJcbiAgICBhMjogbnVtYmVyXG4gICAgY2hvcmQ/OiB7XG4gICAgICAgIHgxICAgIDogbnVtYmVyXG4gICAgICAgIHkxICAgIDogbnVtYmVyXG4gICAgICAgIHgyICAgIDogbnVtYmVyXG4gICAgICAgIHkyICAgIDogbnVtYmVyXG4gICAgICAgIGxlbmd0aDogbnVtYmVyXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFkaWFsRGlzdHJpYnV0aW9uICggb3B0aW9uczogUmFkaWFsT3B0aW9uIClcbntcbiAgICBjb25zdCB7IFBJLCBjb3MsIHNpbiB9ID0gTWF0aFxuXG4gICAgY29uc3QgciAgICAgICAgPSBvcHRpb25zLnIgICAgICAgIHx8IDMwXG4gICAgY29uc3QgY291bnQgICAgPSBvcHRpb25zLmNvdW50ICAgIHx8IDEwXG4gICAgY29uc3Qgcm90YXRpb24gPSBvcHRpb25zLnJvdGF0aW9uIHx8IDBcblxuICAgIGNvbnN0IHBvaW50cyA9IFtdIGFzIFBhcnQgW11cblxuICAgIGNvbnN0IGEgICAgID0gMiAqIFBJIC8gY291bnRcbiAgICBjb25zdCBjaG9yZCA9IDIgKiByICogc2luICggYSAqIDAuNSApXG4gICAgY29uc3Qgc2l6ZSAgPSByICogNCArIGNob3JkXG4gICAgY29uc3QgYyAgICAgPSBzaXplIC8gMlxuXG4gICAgZm9yICggdmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSApXG4gICAge1xuICAgICAgICBjb25zdCBzdGFydCAgPSBhICogaSArIHJvdGF0aW9uXG4gICAgICAgIGNvbnN0IG1pZGRsZSA9IHN0YXJ0ICsgYSAqIDAuNVxuICAgICAgICBjb25zdCBlbmQgICAgPSBzdGFydCArIGFcblxuICAgICAgICBwb2ludHMucHVzaCAoe1xuICAgICAgICAgICAgYTEgICA6IHN0YXJ0LFxuICAgICAgICAgICAgYSAgICA6IG1pZGRsZSxcbiAgICAgICAgICAgIGEyICAgOiBlbmQsXG4gICAgICAgICAgICB4ICAgIDogY29zIChtaWRkbGUpICogciArIGMsXG4gICAgICAgICAgICB5ICAgIDogc2luIChtaWRkbGUpICogciArIGMsXG4gICAgICAgICAgICBjaG9yZDoge1xuICAgICAgICAgICAgICAgIHgxOiBjb3MgKHN0YXJ0KSAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIHkxOiBzaW4gKHN0YXJ0KSAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIHgyOiBjb3MgKGVuZCkgICAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIHkyOiBzaW4gKGVuZCkgICAqIHIgKyBjLFxuICAgICAgICAgICAgICAgIGxlbmd0aDogY2hvcmRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQ6IFJhZGlhbERlZmluaXRpb24gPSB7XG4gICAgICAgIHIsXG4gICAgICAgIGNvdW50LFxuICAgICAgICByb3RhdGlvbixcbiAgICAgICAgcGFkZGluZzogb3B0aW9ucy5wYWRkaW5nIHx8IDAsXG4gICAgICAgIGN4ICAgICA6IGMsXG4gICAgICAgIGN5ICAgICA6IGMsXG4gICAgICAgIHdpZHRoICA6IHNpemUsXG4gICAgICAgIGhlaWdodCA6IHNpemUsXG4gICAgICAgIHBvaW50c1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRcbn1cbiIsIi8vIGh0dHBzOi8vb2JzZXJ2YWJsZWhxLmNvbS9AZDMvZDMtcGFja2VuY2xvc2U/Y29sbGVjdGlvbj1Ab2JzZXJ2YWJsZWhxL2FsZ29yaXRobXNcbi8vIGh0dHBzOi8vb2JzZXJ2YWJsZWhxLmNvbS9AZDMvY2lyY2xlLXBhY2tpbmdcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1oaWVyYXJjaHkvYmxvYi9tYXN0ZXIvc3JjL3BhY2svZW5jbG9zZS5qc1xuXG5cbmV4cG9ydCB0eXBlIENpcmNsZSA9IHtcbiAgICAgeDogbnVtYmVyLFxuICAgICB5OiBudW1iZXIsXG4gICAgIHI6IG51bWJlclxufVxuXG5jb25zdCBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZVxuXG5mdW5jdGlvbiBzaHVmZmxlIDxUPiAoIGFycmF5OiBUW10gKVxue1xuICAgICB2YXIgbSA9IGFycmF5Lmxlbmd0aCxcbiAgICAgICAgICB0LFxuICAgICAgICAgIGk6IG51bWJlclxuXG4gICAgIHdoaWxlICggbSApXG4gICAgIHtcbiAgICAgICAgICBpID0gTWF0aC5yYW5kb20gKCkgKiBtLS0gfCAwXG4gICAgICAgICAgdCA9IGFycmF5IFttXVxuICAgICAgICAgIGFycmF5IFttXSA9IGFycmF5IFtpXVxuICAgICAgICAgIGFycmF5IFtpXSA9IHRcbiAgICAgfVxuXG4gICAgIHJldHVybiBhcnJheVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5jbG9zZSAoIGNpcmNsZXM6IENpcmNsZVtdIClcbntcbiAgICAgY2lyY2xlcyA9IHNodWZmbGUgKCBzbGljZS5jYWxsKCBjaXJjbGVzICkgKVxuXG4gICAgIGNvbnN0IG4gPSBjaXJjbGVzLmxlbmd0aFxuXG4gICAgIHZhciBpID0gMCxcbiAgICAgQiA9IFtdLFxuICAgICBwOiBDaXJjbGUsXG4gICAgIGU6IENpcmNsZTtcblxuICAgICB3aGlsZSAoIGkgPCBuIClcbiAgICAge1xuICAgICAgICAgIHAgPSBjaXJjbGVzIFtpXVxuXG4gICAgICAgICAgaWYgKCBlICYmIGVuY2xvc2VzV2VhayAoIGUsIHAgKSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBCID0gZXh0ZW5kQmFzaXMgKCBCLCBwIClcbiAgICAgICAgICAgICAgIGUgPSBlbmNsb3NlQmFzaXMgKCBCIClcbiAgICAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGVcbn1cblxuZnVuY3Rpb24gZXh0ZW5kQmFzaXMgKCBCOiBDaXJjbGVbXSwgcDogQ2lyY2xlIClcbntcbiAgICAgdmFyIGk6IG51bWJlcixcbiAgICAgajogbnVtYmVyXG5cbiAgICAgaWYgKCBlbmNsb3Nlc1dlYWtBbGwgKCBwLCBCICkgKVxuICAgICAgICAgIHJldHVybiBbcF1cblxuICAgICAvLyBJZiB3ZSBnZXQgaGVyZSB0aGVuIEIgbXVzdCBoYXZlIGF0IGxlYXN0IG9uZSBlbGVtZW50LlxuICAgICBmb3IgKCBpID0gMDsgaSA8IEIubGVuZ3RoOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBlbmNsb3Nlc05vdCAoIHAsIEIgW2ldIClcbiAgICAgICAgICAmJiBlbmNsb3Nlc1dlYWtBbGwgKCBlbmNsb3NlQmFzaXMyICggQiBbaV0sIHAgKSwgQiApXG4gICAgICAgICAgKXtcbiAgICAgICAgICAgICAgIHJldHVybiBbIEJbaV0sIHAgXVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8vIElmIHdlIGdldCBoZXJlIHRoZW4gQiBtdXN0IGhhdmUgYXQgbGVhc3QgdHdvIGVsZW1lbnRzLlxuICAgICBmb3IgKCBpID0gMDsgaSA8IEIubGVuZ3RoIC0gMTsgKytpIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGogPSBpICsgMTsgaiA8IEIubGVuZ3RoOyArK2ogKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggZW5jbG9zZXNOb3QgICAgKCBlbmNsb3NlQmFzaXMyICggQiBbaV0sIEIgW2pdICAgICksIHAgKVxuICAgICAgICAgICAgICAgJiYgZW5jbG9zZXNOb3QgICAgKCBlbmNsb3NlQmFzaXMyICggQiBbaV0sIHAgICAgICAgICksIEIgW2pdIClcbiAgICAgICAgICAgICAgICYmIGVuY2xvc2VzTm90ICAgICggZW5jbG9zZUJhc2lzMiAoIEIgW2pdLCBwICAgICAgICApLCBCIFtpXSApXG4gICAgICAgICAgICAgICAmJiBlbmNsb3Nlc1dlYWtBbGwoIGVuY2xvc2VCYXNpczMgKCBCIFtpXSwgQiBbal0sIHAgKSwgQiApXG4gICAgICAgICAgICAgICApe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBCWyBpIF0sIEJbIGogXSwgcCBdO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIC8vIElmIHdlIGdldCBoZXJlIHRoZW4gc29tZXRoaW5nIGlzIHZlcnkgd3JvbmcuXG4gICAgIHRocm93IG5ldyBFcnJvcjtcbn1cblxuZnVuY3Rpb24gZW5jbG9zZXNOb3QgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IGRyID0gYS5yIC0gYi5yXG4gICAgIGNvbnN0IGR4ID0gYi54IC0gYS54XG4gICAgIGNvbnN0IGR5ID0gYi55IC0gYS55XG5cbiAgICAgcmV0dXJuIGRyIDwgMCB8fCBkciAqIGRyIDwgZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VzV2VhayAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgdmFyIGRyID0gYS5yIC0gYi5yICsgMWUtNixcbiAgICAgZHggPSBiLnggLSBhLngsXG4gICAgIGR5ID0gYi55IC0gYS55XG5cbiAgICAgcmV0dXJuIGRyID4gMCAmJiBkciAqIGRyID4gZHggKiBkeCArIGR5ICogZHlcbn1cblxuZnVuY3Rpb24gZW5jbG9zZXNXZWFrQWxsICggYTogQ2lyY2xlLCBCOiBDaXJjbGVbXSApXG57XG4gICAgIGZvciAoIHZhciBpID0gMDsgaSA8IEIubGVuZ3RoOyArK2kgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCAhIGVuY2xvc2VzV2VhayAoIGEsIEJbaV0gKSApXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgfVxuICAgICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiBlbmNsb3NlQmFzaXMgKCBCOiBDaXJjbGVbXSApXG57XG4gICAgIHN3aXRjaCAoIEIubGVuZ3RoIClcbiAgICAge1xuICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGVuY2xvc2VCYXNpczEoIEIgWzBdIClcbiAgICAgICAgICBjYXNlIDI6IHJldHVybiBlbmNsb3NlQmFzaXMyKCBCIFswXSwgQiBbMV0gKVxuICAgICAgICAgIGNhc2UgMzogcmV0dXJuIGVuY2xvc2VCYXNpczMoIEIgWzBdLCBCIFsxXSwgQiBbMl0gKVxuICAgICB9XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpczEgKCBhOiBDaXJjbGUgKVxue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IGEueCxcbiAgICAgICAgICB5OiBhLnksXG4gICAgICAgICAgcjogYS5yXG4gICAgIH07XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpczIgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSApXG57XG4gICAgIGNvbnN0IHsgeDogeDEsIHk6IHkxLCByOiByMSB9ID0gYVxuICAgICBjb25zdCB7IHg6IHgyLCB5OiB5MiwgcjogcjIgfSA9IGJcblxuICAgICB2YXIgeDIxID0geDIgLSB4MSxcbiAgICAgeTIxID0geTIgLSB5MSxcbiAgICAgcjIxID0gcjIgLSByMSxcbiAgICAgbCAgID0gTWF0aC5zcXJ0KCB4MjEgKiB4MjEgKyB5MjEgKiB5MjEgKTtcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6ICggeDEgKyB4MiArIHgyMSAvIGwgKiByMjEgKSAvIDIsXG4gICAgICAgICAgeTogKCB5MSArIHkyICsgeTIxIC8gbCAqIHIyMSApIC8gMixcbiAgICAgICAgICByOiAoIGwgKyByMSArIHIyICkgLyAyXG4gICAgIH07XG59XG5cbmZ1bmN0aW9uIGVuY2xvc2VCYXNpczMgKCBhOiBDaXJjbGUsIGI6IENpcmNsZSwgYzogQ2lyY2xlIClcbntcbiAgICAgY29uc3QgeyB4OiB4MSwgeTogeTEsIHI6IHIxIH0gPSBhXG4gICAgIGNvbnN0IHsgeDogeDIsIHk6IHkyLCByOiByMiB9ID0gYlxuICAgICBjb25zdCB7IHg6IHgzLCB5OiB5MywgcjogcjMgfSA9IGNcblxuICAgICBjb25zdCBhMiA9IHgxIC0geDIsXG4gICAgICAgICAgICAgICBhMyA9IHgxIC0geDMsXG4gICAgICAgICAgICAgICBiMiA9IHkxIC0geTIsXG4gICAgICAgICAgICAgICBiMyA9IHkxIC0geTMsXG4gICAgICAgICAgICAgICBjMiA9IHIyIC0gcjEsXG4gICAgICAgICAgICAgICBjMyA9IHIzIC0gcjEsXG5cbiAgICAgICAgICAgICAgIGQxID0geDEgKiB4MSArIHkxICogeTEgLSByMSAqIHIxLFxuICAgICAgICAgICAgICAgZDIgPSBkMSAtIHgyICogeDIgLSB5MiAqIHkyICsgcjIgKiByMixcbiAgICAgICAgICAgICAgIGQzID0gZDEgLSB4MyAqIHgzIC0geTMgKiB5MyArIHIzICogcjMsXG5cbiAgICAgICAgICAgICAgIGFiID0gYTMgKiBiMiAtIGEyICogYjMsXG4gICAgICAgICAgICAgICB4YSA9ICggYjIgKiBkMyAtIGIzICogZDIgKSAvICggYWIgKiAyICkgLSB4MSxcbiAgICAgICAgICAgICAgIHhiID0gKCBiMyAqIGMyIC0gYjIgKiBjMyApIC8gYWIsXG4gICAgICAgICAgICAgICB5YSA9ICggYTMgKiBkMiAtIGEyICogZDMgKSAvICggYWIgKiAyICkgLSB5MSxcbiAgICAgICAgICAgICAgIHliID0gKCBhMiAqIGMzIC0gYTMgKiBjMiApIC8gYWIsXG5cbiAgICAgICAgICAgICAgIEEgID0geGIgKiB4YiArIHliICogeWIgLSAxLFxuICAgICAgICAgICAgICAgQiAgPSAyICogKCByMSArIHhhICogeGIgKyB5YSAqIHliICksXG4gICAgICAgICAgICAgICBDICA9IHhhICogeGEgKyB5YSAqIHlhIC0gcjEgKiByMSxcbiAgICAgICAgICAgICAgIHIgID0gLSggQSA/ICggQiArIE1hdGguc3FydCggQiAqIEIgLSA0ICogQSAqIEMgKSApIC8gKCAyICogQSApIDogQyAvIEIgKVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgeDogeDEgKyB4YSArIHhiICogcixcbiAgICAgICAgICB5OiB5MSArIHlhICsgeWIgKiByLFxuICAgICAgICAgIHI6IHJcbiAgICAgfTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2QzLWVuY2xvc2UudHNcIiAvPlxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtaGllcmFyY2h5L2Jsb2IvbWFzdGVyL3NyYy9wYWNrL3NpYmxpbmdzLmpzXG5cbmltcG9ydCB7IGVuY2xvc2UsIENpcmNsZSB9IGZyb20gXCIuL2QzLWVuY2xvc2UuanNcIlxuXG5mdW5jdGlvbiBwbGFjZSAoIGI6IENpcmNsZSwgYTogQ2lyY2xlLCBjOiBDaXJjbGUgKVxue1xuICAgICB2YXIgZHggPSBiLnggLSBhLngsXG4gICAgICAgICAgeDogbnVtYmVyLFxuICAgICAgICAgIGEyOiBudW1iZXIsXG4gICAgICAgICAgZHkgPSBiLnkgLSBhLnksXG4gICAgICAgICAgeSA6IG51bWJlcixcbiAgICAgICAgICBiMjogbnVtYmVyLFxuICAgICAgICAgIGQyID0gZHggKiBkeCArIGR5ICogZHlcblxuICAgICBpZiAoIGQyIClcbiAgICAge1xuICAgICAgICAgIGEyID0gYS5yICsgYy5yLCBhMiAqPSBhMlxuICAgICAgICAgIGIyID0gYi5yICsgYy5yLCBiMiAqPSBiMlxuXG4gICAgICAgICAgaWYgKCBhMiA+IGIyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB4ID0gKCBkMiArIGIyIC0gYTIgKSAvICggMiAqIGQyIClcbiAgICAgICAgICAgICAgIHkgPSBNYXRoLnNxcnQoIE1hdGgubWF4KCAwLCBiMiAvIGQyIC0geCAqIHggKSApXG4gICAgICAgICAgICAgICBjLnggPSBiLnggLSB4ICogZHggLSB5ICogZHlcbiAgICAgICAgICAgICAgIGMueSA9IGIueSAtIHggKiBkeSArIHkgKiBkeFxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgeCA9ICggZDIgKyBhMiAtIGIyICkgLyAoIDIgKiBkMiApXG4gICAgICAgICAgICAgICB5ID0gTWF0aC5zcXJ0KCBNYXRoLm1heCggMCwgYTIgLyBkMiAtIHggKiB4ICkgKVxuICAgICAgICAgICAgICAgYy54ID0gYS54ICsgeCAqIGR4IC0geSAqIGR5XG4gICAgICAgICAgICAgICBjLnkgPSBhLnkgKyB4ICogZHkgKyB5ICogZHhcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgYy54ID0gYS54ICsgYy5yXG4gICAgICAgICAgYy55ID0gYS55XG4gICAgIH1cbn1cblxuZnVuY3Rpb24gaW50ZXJzZWN0cyAoIGE6IENpcmNsZSwgYjogQ2lyY2xlIClcbntcbiAgICAgdmFyIGRyID0gYS5yICsgYi5yIC0gMWUtNiwgZHggPSBiLnggLSBhLngsIGR5ID0gYi55IC0gYS55O1xuICAgICByZXR1cm4gZHIgPiAwICYmIGRyICogZHIgPiBkeCAqIGR4ICsgZHkgKiBkeTtcbn1cblxuZnVuY3Rpb24gc2NvcmUgKCBub2RlOiBOb2RlIClcbntcbiAgICAgdmFyIGEgPSBub2RlLl8sXG4gICAgICAgICAgYiA9IG5vZGUubmV4dC5fLFxuICAgICAgICAgIGFiID0gYS5yICsgYi5yLFxuICAgICAgICAgIGR4ID0gKCBhLnggKiBiLnIgKyBiLnggKiBhLnIgKSAvIGFiLFxuICAgICAgICAgIGR5ID0gKCBhLnkgKiBiLnIgKyBiLnkgKiBhLnIgKSAvIGFiO1xuICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG59XG5cbmNsYXNzIE5vZGVcbntcbiAgICAgbmV4dCAgICAgPSBudWxsIGFzIE5vZGVcbiAgICAgcHJldmlvdXMgPSBudWxsIGFzIE5vZGVcbiAgICAgY29uc3RydWN0b3IgKCBwdWJsaWMgXzogQ2lyY2xlICkge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhY2tFbmNsb3NlICggY2lyY2xlczogQ2lyY2xlW10gKVxue1xuICAgICBpZiAoICEoIG4gPSBjaXJjbGVzLmxlbmd0aCApICkgcmV0dXJuIDA7XG5cbiAgICAgdmFyIGEsIGIsIGMgLyo6IE5vZGUgJiBDaXJjbGUqLywgbiwgYWEsIGNhLCBpLCBqLCBrLCBzaiwgc2s7XG5cbiAgICAgLy8gUGxhY2UgdGhlIGZpcnN0IGNpcmNsZS5cbiAgICAgYSA9IGNpcmNsZXNbIDAgXSwgYS54ID0gMCwgYS55ID0gMDtcbiAgICAgaWYgKCAhKCBuID4gMSApICkgcmV0dXJuIGEucjtcblxuICAgICAvLyBQbGFjZSB0aGUgc2Vjb25kIGNpcmNsZS5cbiAgICAgYiA9IGNpcmNsZXNbIDEgXSwgYS54ID0gLWIuciwgYi54ID0gYS5yLCBiLnkgPSAwO1xuICAgICBpZiAoICEoIG4gPiAyICkgKSByZXR1cm4gYS5yICsgYi5yO1xuXG4gICAgIC8vIFBsYWNlIHRoZSB0aGlyZCBjaXJjbGUuXG4gICAgIHBsYWNlKCBiLCBhLCBjID0gY2lyY2xlc1sgMiBdICk7XG5cbiAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgZnJvbnQtY2hhaW4gdXNpbmcgdGhlIGZpcnN0IHRocmVlIGNpcmNsZXMgYSwgYiBhbmQgYy5cbiAgICAgYSA9IG5ldyBOb2RlKCBhICksIGIgPSBuZXcgTm9kZSggYiApLCBjID0gbmV3IE5vZGUoIGMgKTtcbiAgICAgYS5uZXh0ID0gYy5wcmV2aW91cyA9IGI7XG4gICAgIGIubmV4dCA9IGEucHJldmlvdXMgPSBjO1xuICAgICBjLm5leHQgPSBiLnByZXZpb3VzID0gYTtcblxuICAgICAvLyBBdHRlbXB0IHRvIHBsYWNlIGVhY2ggcmVtYWluaW5nIGNpcmNsZeKAplxuICAgICBwYWNrOiBmb3IgKCBpID0gMzsgaSA8IG47ICsraSApXG4gICAgIHtcbiAgICAgICAgICBwbGFjZSggYS5fLCBiLl8sIGMgPSBjaXJjbGVzWyBpIF0gKSwgYyA9IG5ldyBOb2RlKCBjICk7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBjbG9zZXN0IGludGVyc2VjdGluZyBjaXJjbGUgb24gdGhlIGZyb250LWNoYWluLCBpZiBhbnkuXG4gICAgICAgICAgLy8g4oCcQ2xvc2VuZXNz4oCdIGlzIGRldGVybWluZWQgYnkgbGluZWFyIGRpc3RhbmNlIGFsb25nIHRoZSBmcm9udC1jaGFpbi5cbiAgICAgICAgICAvLyDigJxBaGVhZOKAnSBvciDigJxiZWhpbmTigJ0gaXMgbGlrZXdpc2UgZGV0ZXJtaW5lZCBieSBsaW5lYXIgZGlzdGFuY2UuXG4gICAgICAgICAgaiA9IGIubmV4dCwgayA9IGEucHJldmlvdXMsIHNqID0gYi5fLnIsIHNrID0gYS5fLnI7XG4gICAgICAgICAgZG9cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHNqIDw9IHNrIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbnRlcnNlY3RzKCBqLl8sIGMuXyApIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGIgPSBqLCBhLm5leHQgPSBiLCBiLnByZXZpb3VzID0gYSwgLS1pO1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHBhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2ogKz0gai5fLnIsIGogPSBqLm5leHQ7XG4gICAgICAgICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbnRlcnNlY3RzKCBrLl8sIGMuXyApIClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGEgPSBrLCBhLm5leHQgPSBiLCBiLnByZXZpb3VzID0gYSwgLS1pO1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIHBhY2s7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2sgKz0gay5fLnIsIGsgPSBrLnByZXZpb3VzO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0gd2hpbGUgKCBqICE9PSBrLm5leHQgKTtcblxuICAgICAgICAgIC8vIFN1Y2Nlc3MhIEluc2VydCB0aGUgbmV3IGNpcmNsZSBjIGJldHdlZW4gYSBhbmQgYi5cbiAgICAgICAgICBjLnByZXZpb3VzID0gYSwgYy5uZXh0ID0gYiwgYS5uZXh0ID0gYi5wcmV2aW91cyA9IGIgPSBjO1xuXG4gICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgbmV3IGNsb3Nlc3QgY2lyY2xlIHBhaXIgdG8gdGhlIGNlbnRyb2lkLlxuICAgICAgICAgIGFhID0gc2NvcmUoIGEgKTtcbiAgICAgICAgICB3aGlsZSAoICggYyA9IGMubmV4dCApICE9PSBiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoICggY2EgPSBzY29yZSggYyApICkgPCBhYSApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSBjLFxuICAgICAgICAgICAgICAgICAgICBhYSA9IGNhO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBiID0gYS5uZXh0O1xuICAgICB9XG5cbiAgICAgLy8gQ29tcHV0ZSB0aGUgZW5jbG9zaW5nIGNpcmNsZSBvZiB0aGUgZnJvbnQgY2hhaW4uXG4gICAgIGEgPSBbIGIuXyBdXG4gICAgIGMgPSBiXG4gICAgIHdoaWxlICggKCBjID0gYy5uZXh0ICkgIT09IGIgKVxuICAgICAgICAgIGEucHVzaCggYy5fICk7XG4gICAgIGMgPSBlbmNsb3NlKCBhIClcblxuICAgICAvLyBUcmFuc2xhdGUgdGhlIGNpcmNsZXMgdG8gcHV0IHRoZSBlbmNsb3NpbmcgY2lyY2xlIGFyb3VuZCB0aGUgb3JpZ2luLlxuICAgICBmb3IgKCBpID0gMDsgaSA8IG47ICsraSApXG4gICAgIHtcbiAgICAgICAgICBhID0gY2lyY2xlc1sgaSBdLFxuICAgICAgICAgIGEueCAtPSBjLngsXG4gICAgICAgICAgYS55IC09IGMueVxuICAgICB9XG5cbiAgICAgcmV0dXJuIGMuciBhcyBudW1iZXJcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhY2tDaXJjbGVzICggY2lyY2xlczogQ2lyY2xlW10gKVxue1xuICAgICBwYWNrRW5jbG9zZSggY2lyY2xlcyApO1xuICAgICByZXR1cm4gY2lyY2xlcyBhcyBDaXJjbGVbXTtcbn1cbiIsIlxyXG5cclxuZXhwb3J0IHR5cGUgVW5pdFxyXG4gICAgPSBcIiVcIlxyXG4gICAgfCBcInB4XCIgfCBcInB0XCIgfCBcImVtXCIgfCBcInJlbVwiIHwgXCJpblwiIHwgXCJjbVwiIHwgXCJtbVwiXHJcbiAgICB8IFwiZXhcIiB8IFwiY2hcIiB8IFwicGNcIlxyXG4gICAgfCBcInZ3XCIgfCBcInZoXCIgfCBcInZtaW5cIiB8IFwidm1heFwiXHJcbiAgICB8IFwiZGVnXCIgfCBcInJhZFwiIHwgXCJ0dXJuXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbml0ICggdmFsdWU6IGFueSApOiBVbml0IHwgdW5kZWZpbmVkXHJcbntcclxuICAgIGlmICggdHlwZW9mIHZhbHVlICE9IFwic3RyaW5nXCIgKVxyXG4gICAgICAgICByZXR1cm4gdW5kZWZpbmVkXHJcblxyXG4gICAgY29uc3Qgc3BsaXQgPSAvWystXT9cXGQqXFwuP1xcZCsoPzpcXC5cXGQrKT8oPzpbZUVdWystXT9cXGQrKT8oJXxweHxwdHxlbXxyZW18aW58Y218bW18ZXh8Y2h8cGN8dnd8dmh8dm1pbnx2bWF4fGRlZ3xyYWR8dHVybik/JC9cclxuICAgICAgICAgICAgICAuZXhlYyggdmFsdWUgKTtcclxuXHJcbiAgICBpZiAoIHNwbGl0IClcclxuICAgICAgICAgcmV0dXJuIHNwbGl0IFsxXSBhcyBVbml0XHJcblxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zZm9ybVVuaXQgKCBwcm9wTmFtZTogc3RyaW5nIClcclxue1xyXG4gICAgaWYgKCBwcm9wTmFtZS5pbmNsdWRlcyAoICd0cmFuc2xhdGUnICkgfHwgcHJvcE5hbWUgPT09ICdwZXJzcGVjdGl2ZScgKVxyXG4gICAgICAgIHJldHVybiAncHgnXHJcblxyXG4gICAgaWYgKCBwcm9wTmFtZS5pbmNsdWRlcyAoICdyb3RhdGUnICkgfHwgcHJvcE5hbWUuaW5jbHVkZXMgKCAnc2tldycgKSApXHJcbiAgICAgICAgcmV0dXJuICdkZWcnXHJcbn0iLCJcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yZGZqcy1iYXNlL2RhdGEtbW9kZWwvdHJlZS9tYXN0ZXIvbGliXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJE5vZGVcbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IHR5cGU6IHN0cmluZ1xuICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJENsdXN0ZXIgPCRDaGlsZCBleHRlbmRzICROb2RlID0gJE5vZGU+IGV4dGVuZHMgJE5vZGVcbiAgICAge1xuICAgICAgICAgIGNoaWxkcmVuPzogJENoaWxkIFtdXG4gICAgIH1cbn1cblxudmFyIG5leHRJZCA9IDBcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGUgPEQgZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUIGV4dGVuZHMgc3RyaW5nID0gRCBbXCJ0eXBlXCJdPiAoIHR5cGU6IFQsIGlkOiBzdHJpbmcsIGRhdGE6IFBhcnRpYWwgPE9taXQgPEQsIFwidHlwZVwiIHwgXCJpZFwiPj4gKVxue1xuICAgICB0eXBlIE4gPSB7IC1yZWFkb25seSBbSyBpbiBrZXlvZiBEXTogRFtLXSB9XG5cbiAgICAgOyhkYXRhIGFzIE4pLnR5cGUgPSB0eXBlXG4gICAgIDsoZGF0YSBhcyBOKS5pZCAgID0gaWQgfHwgKCsrbmV4dElkKS50b1N0cmluZyAoKVxuICAgICByZXR1cm4gZGF0YSBhcyBEXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRVSWQgKCBub2RlOiAkTm9kZSApXG57XG4gICAgIHJldHVybiBub2RlLmNvbnRleHQgKyAnIycgKyBub2RlLnR5cGUgKyAnOicgKyBub2RlLmlkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbE5vZGVzICggYTogJE5vZGUsIGI6ICROb2RlIClcbntcbiAgICAgcmV0dXJuICEhYSAmJiAhIWJcbiAgICAgICAgICAmJiBhLnR5cGUgPT09IGIudHlwZVxuICAgICAgICAgICYmIGEuaWQgICA9PT0gYi5pZFxufVxuXG4vKmV4cG9ydCBjbGFzcyBOb2RlIDxEIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCBleHRlbmRzIHN0cmluZyA9IEQgW1widHlwZVwiXT5cbntcbiAgICAgc3RhdGljIG5leHRJZCA9IDBcblxuICAgICByZWFkb25seSB0eXBlOiBzdHJpbmdcblxuICAgICByZWFkb25seSBpZDogc3RyaW5nXG5cbiAgICAgcmVhZG9ubHkgdWlkOiBudW1iZXJcblxuICAgICByZWFkb25seSBkYXRhOiBEXG5cbiAgICAgZGVmYXVsdERhdGEgKCk6ICROb2RlXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwibm9kZVwiLFxuICAgICAgICAgICAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogRCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLnR5cGUgPSBkYXRhLnR5cGVcbiAgICAgICAgICB0aGlzLnVpZCAgPSArK05vZGUubmV4dElkXG4gICAgICAgICAgdGhpcy5pZCAgID0gZGF0YS5pZCB8fCAoZGF0YS5pZCA9IHRoaXMudWlkLnRvU3RyaW5nICgpKVxuXG4gICAgICAgICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbiAoIHRoaXMuZGVmYXVsdERhdGEgKCksIGRhdGEgYXMgRCApXG4gICAgIH1cblxuICAgICBlcXVhbHMgKCBvdGhlcjogTm9kZSA8YW55PiApXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gISFvdGhlclxuICAgICAgICAgICAgICAgJiYgb3RoZXIudHlwZSA9PT0gdGhpcy50eXBlXG4gICAgICAgICAgICAgICAmJiBvdGhlci5pZCAgID09PSB0aGlzLmlkXG4gICAgIH1cblxuICAgICB0b0pzb24gKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSAoIHRoaXMuZGF0YSApXG4gICAgIH1cbn0qL1xuIiwiXG5leHBvcnQgdHlwZSBQYXRoID0ge1xuICAgICBsZW5ndGg6IG51bWJlclxuICAgICBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz5cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFUcmVlIDxUPlxue1xuICAgICByZWNvcmRzID0ge30gYXMge1xuICAgICAgICAgIFtjb250ZXh0OiBzdHJpbmddOiBUIHwge1xuICAgICAgICAgICAgICAgW3R5cGU6IHN0cmluZ106IFQgfCB7XG4gICAgICAgICAgICAgICAgICAgIFtpZDogc3RyaW5nXTogVFxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGhhcyAoIHBhdGg6IFBhdGggKSAgOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIHZhciBjb3VudCA9IDBcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGsgb2YgcGF0aCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY291bnQgKytcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHBhdGgubGVuZ3RoID09IGNvdW50XG4gICAgIH1cblxuICAgICBjb3VudCAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgdmFyICByZWMgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvL0B0cy1pZ25vcmVcbiAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkIGluIHJlY1xuICAgICAgICAgICAgICAgPyBPYmplY3Qua2V5cyAoIHJlYyApLmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgIDogT2JqZWN0LmtleXMgKCByZWMgKS5sZW5ndGhcblxuICAgICB9XG5cbiAgICAgc2V0ICggcGF0aDogUGF0aCwgZGF0YTogVCApOiBUXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB1bmQgPSB1bmRlZmluZWRcbiAgICAgICAgICB2YXIgICByZWMgID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba10gPSB7fVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiByZWMgW3VuZF0gPSBkYXRhXG4gICAgIH1cblxuICAgICBnZXQgKCBwYXRoOiBQYXRoICk6IFRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBrIG9mIHBhdGggKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gcmVjIFt1bmRdXG4gICAgIH1cblxuICAgICBuZWFyICggcGF0aDogUGF0aCApOiBUXG4gICAgIHtcbiAgICAgICAgICB2YXIgcmVjID0gdGhpcy5yZWNvcmRzIGFzIGFueVxuICAgICAgICAgIGNvbnN0IHVuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGsgPT09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgICAgIGlmICggayBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICByZWMgPSByZWMgW2tdXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHJlYyBbdW5kXVxuICAgICB9XG5cbiAgICAgd2FsayAoIHBhdGg6IFBhdGgsIGNiOiAoIGRhdGE6IFQgKSA9PiB2b2lkIClcbiAgICAge1xuICAgICAgICAgIHZhciAgIHJlYyAgPSB0aGlzLnJlY29yZHMgYXMgYW55XG4gICAgICAgICAgY29uc3QgdW5kICA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZm9yICggY29uc3QgayBvZiBwYXRoIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgICAgICBjYiAoIHJlYyBbdW5kXSApXG5cbiAgICAgICAgICAgICAgIGlmICggayA9PT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgICAgaWYgKCBrIGluIHJlYyApXG4gICAgICAgICAgICAgICAgICAgIHJlYyA9IHJlYyBba11cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIHVuZCBpbiByZWMgKVxuICAgICAgICAgICAgICAgY2IgKCByZWMgW3VuZF0gKVxuXG4gICAgICAgICAgcmV0dXJuXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgT3B0aW9uYWwsIFJlcXVpcmUgfSBmcm9tIFwiLi4vLi4vTGliL3R5cGluZy5qc1wiXG5pbXBvcnQgeyBEYXRhVHJlZSB9IGZyb20gXCIuL2RhdGEtdHJlZS5qc1wiXG5cblxudHlwZSBSZWYgPE4gZXh0ZW5kcyAkTm9kZT4gPSBSZXF1aXJlIDxQYXJ0aWFsIDxOPiwgXCJjb250ZXh0XCIgfCBcInR5cGVcIiB8IFwiaWRcIj5cblxudHlwZSBEIDxOIGV4dGVuZHMgJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiIHwgXCJ0eXBlXCIgfCBcImlkXCI+XG5cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyBEYXRhVHJlZSA8Tj5cbntcbiAgICAgaGFzICggbm9kZTogUmVmIDxOPiApICAgICAgOiBib29sZWFuXG4gICAgIGhhcyAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogYm9vbGVhblxuICAgICBoYXMgKCk6IGJvb2xlYW5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIubmVhciAoIGFyZ3VtZW50cyApICE9PSB1bmRlZmluZWRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBjb3VudCAoIG5vZGU6IFJlZiA8Tj4gKSAgICAgIDogbnVtYmVyXG4gICAgIGNvdW50ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiBudW1iZXJcbiAgICAgY291bnQgKCk6IG51bWJlclxuICAgICB7XG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDAgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbzogTiA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHJldHVybiBzdXBlci5jb3VudCAoIFtvLmNvbnRleHQsIG8udHlwZSwgby5pZF0gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmNvdW50ICggYXJndW1lbnRzIClcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIG5vZGU6ICQgKSAgICAgICAgICAgICAgICAgICAgIDogJFxuICAgICBzZXQgPCQgZXh0ZW5kcyBOPiAoIHBhdGg6IHN0cmluZyBbXSwgZGF0YTogRCA8JD4gKTogJFxuICAgICBzZXQgKCk6IE5cbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG86IE4gPSBhcmd1bWVudHMgWzBdXG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggW28uY29udGV4dCwgby50eXBlLCBvLmlkXSwgbyApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICByZXR1cm4gc3VwZXIuc2V0ICggYXJndW1lbnRzIFswXSwgYXJndW1lbnRzIFsxXSApXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCBub2RlOiBSZWYgPCROb2RlPiApICA6ICRcbiAgICAgZ2V0IDwkIGV4dGVuZHMgTj4gKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6ICRcbiAgICAgZ2V0ICgpOiBOXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9IGFzIE5cblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAxIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvOiAkTm9kZSA9IGFyZ3VtZW50cyBbMF1cbiAgICAgICAgICAgICAgIHN1cGVyLndhbGsgKCBbby5jb250ZXh0LCBvLnR5cGUsIG8uaWRdLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHJlc3VsdCwgZGF0YSApXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIG8gKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3VwZXIud2FsayAoIGFyZ3VtZW50cywgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIGRhdGEgKVxuICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24gKCByZXN1bHQsIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dDogYXJndW1lbnRzIFswXSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZSAgIDogYXJndW1lbnRzIFsxXSxcbiAgICAgICAgICAgICAgICAgICAgaWQgICAgIDogYXJndW1lbnRzIFsyXSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSBcIi4vZGIuanNcIlxuaW1wb3J0IHsgRGF0YVRyZWUsIFBhdGggfSBmcm9tIFwiLi9kYXRhLXRyZWUuanNcIlxuXG5pbXBvcnQgeyBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5cbnR5cGUgSXRlbSA8VCA9IGFueSwgJCBleHRlbmRzICROb2RlID0gJE5vZGU+ID1cbntcbiAgICAgbXVsdGlwbGU6IGJvb2xlYW5cbiAgICAgaW5zdGFuY2VzOiBUIFtdXG4gICAgIGNvbnN0cnVjdG9yOiBuZXcgKCBkYXRhOiAkICkgPT4gVFxufVxuXG50eXBlICRJbiA8TiBleHRlbmRzICROb2RlID0gJE5vZGU+ID0gT3B0aW9uYWwgPE4sIFwiY29udGV4dFwiPlxuXG4vL2V4cG9ydCB0eXBlIEN0b3IgPE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlLCBUID0gYW55PiA9IG5ldyAoIGRhdGE6IE4gKSA9PiBUXG5leHBvcnQgdHlwZSBDdG9yIDxOIGV4dGVuZHMgJE5vZGUgPSAkTm9kZSwgVCA9IGFueT4gPSBuZXcgKCBkYXRhOiBOLCBjaGlsZHJlbj86IGFueSBbXSApID0+IFRcblxudHlwZSBBcmcgPEY+ID0gRiBleHRlbmRzIG5ldyAoIGRhdGE6IGluZmVyIEQgKSA9PiBhbnkgPyBEIDogYW55XG5cblxuZXhwb3J0IGNsYXNzIEZhY3RvcnkgPEUgPSBhbnksIE4gZXh0ZW5kcyAkTm9kZSA9ICROb2RlPlxue1xuICAgICBjb25zdHJ1Y3RvciAoIHJlYWRvbmx5IGRiOiBEYXRhYmFzZSA8Tj4gKSB7fVxuXG4gICAgIHByaXZhdGUgY3RvcnMgPSBuZXcgRGF0YVRyZWUgPEN0b3IgPCROb2RlLCBFPj4gKClcbiAgICAgcHJpdmF0ZSBpbnN0cyA9ICBuZXcgRGF0YVRyZWUgPEU+ICgpXG5cblxuICAgICBnZXRQYXRoICggbm9kZTogJE5vZGUgKSAgICAgICAgOiBQYXRoXG4gICAgIGdldFBhdGggKCBwYXRoOiBQYXRoICkgICAgICAgICA6IFBhdGhcbiAgICAgZ2V0UGF0aCAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKTogUGF0aFxuXG4gICAgIGdldFBhdGggKClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoIFwiTnVsbCBhcmd1bWVudFwiIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzIGFzIFBhdGhcblxuICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSAoIGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIGFyZy5mbGF0ICgpIGFzIFBhdGhcblxuICAgICAgICAgIHJldHVybiBbIGFyZy5jb250ZXh0LCBhcmcudHlwZSwgYXJnLmlkIF0gYXMgUGF0aFxuICAgICB9XG5cbiAgICAgaW5TdG9jayAoIG5vZGU6ICROb2RlICkgICAgICAgIDogYm9vbGVhblxuICAgICBpblN0b2NrICggcGF0aDogUGF0aCApICAgICAgICAgOiBib29sZWFuXG4gICAgIGluU3RvY2sgKCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IGJvb2xlYW5cblxuICAgICBpblN0b2NrICgpOiBib29sZWFuXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5oYXMgKCB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzICkgYXMgUGF0aCApXG4gICAgIH1cbiAgICAgX2luU3RvY2sgKCBwYXRoOiBQYXRoIClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmluc3RzLmhhcyAoIHBhdGggKVxuICAgICB9XG5cbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBub2RlOiBBcmcgPEY+ICkgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCBwYXRoOiBQYXRoICkgICAgICAgICA6IHZvaWRcbiAgICAgZGVmaW5lIDxGIGV4dGVuZHMgQ3Rvcj4gKCBjdG9yOiBGLCAuLi4gcGF0aDogc3RyaW5nIFtdICk6IHZvaWRcblxuICAgICBkZWZpbmUgKCBjdG9yOiBDdG9yLCAuLi4gcmVzdDogYW55IFtdIClcbiAgICAge1xuICAgICAgICAgIHZhciBwYXRoID0gdGhpcy5nZXRQYXRoICggLi4uIHJlc3QgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmN0b3JzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICB0aHJvdyBcIkJhZCBhcmd1bWVudFwiXG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jdG9ycy5zZXQgKCBwYXRoLCBjdG9yIClcbiAgICAgfVxuICAgICBfZGVmaW5lICggY3RvcjogQ3RvciwgcGF0aDogUGF0aCApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY3RvcnMuaGFzICggcGF0aCApIClcbiAgICAgICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcblxuICAgICAgICAgIHJldHVybiB0aGlzLmN0b3JzLnNldCAoIHBhdGgsIGN0b3IgKVxuICAgICB9XG5cbiAgICAgcGljayA8UiBleHRlbmRzIEUsICQgZXh0ZW5kcyBOID0gTj4gKCBub2RlOiAkTm9kZSApOiBSXG4gICAgIHBpY2sgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgICAgIDogUlxuICAgICBwaWNrIDxSIGV4dGVuZHMgRT4gKCBwYXRoOiBQYXRoICkgICAgICAgICAgICAgICAgICA6IFJcblxuICAgICBwaWNrICgpOiBFXG4gICAgIHtcbiAgICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCAoIC4uLiBhcmd1bWVudHMgKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuICAgICBfcGljayAoIHBhdGg6IFBhdGggKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIHRocm93IFwiQmFkIGFyZ3VtZW50XCJcbiAgICAgfVxuXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFLCAkIGV4dGVuZHMgTiA9IE4+ICggbm9kZTogJCApOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIHBhdGg6IFBhdGggKSAgICAgICAgICAgICAgOiBSXG4gICAgIG1ha2UgPFIgZXh0ZW5kcyBFPiAoIC4uLiBwYXRoOiBzdHJpbmcgW10gKSAgICAgOiBSXG5cbiAgICAgbWFrZSAoKTogRVxuICAgICB7XG4gICAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGggKCAuLi4gYXJndW1lbnRzIClcblxuICAgICAgICAgIGNvbnN0IGFyZyAgPSBhcmd1bWVudHMgWzBdXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT0gXCJvYmplY3RcIiAmJiAhIEFycmF5LmlzQXJyYXkgKGFyZykgKVxuICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ha2UgKCBwYXRoLCBhcmcgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9tYWtlICggcGF0aCApXG4gICAgIH1cbiAgICAgX21ha2UgKCBwYXRoOiBQYXRoLCBkYXRhPzogUGFydGlhbCA8Tj4gKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmluc3RzLmhhcyAoIHBhdGggKSApXG4gICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0cy5nZXQgKCBwYXRoIClcblxuICAgICAgICAgIGNvbnN0IGN0b3IgPSB0aGlzLmN0b3JzLm5lYXIgKCBwYXRoIClcblxuICAgICAgICAgIGlmICggY3RvciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgYXJndW1lbnRcIlxuXG4gICAgICAgICAgY29uc3QgdG1wID0gdGhpcy5kYi5nZXQgKCAuLi4gcGF0aCApXG5cbiAgICAgICAgICBkYXRhID0gZGF0YSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgID8gdG1wXG4gICAgICAgICAgICAgICA6IE9iamVjdC5hc3NpZ24gKCB0bXAsIGRhdGEgKVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdHMuc2V0ICggcGF0aCwgbmV3IGN0b3IgKCBkYXRhIGFzIE4gKSApXG4gICAgIH1cbn1cbiIsIlxuXG5cbmV4cG9ydCBjb25zdCB4bm9kZSA9ICgoKSA9Plxue1xuICAgICBjb25zdCBzdmdfbmFtZXMgPSBbIFwic3ZnXCIsIFwiZ1wiLCBcImxpbmVcIiwgXCJjaXJjbGVcIiwgXCJwYXRoXCIsIFwidGV4dFwiIF1cblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNIVE1MRWxlbWVudHMsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnRcblxuICAgICBmdW5jdGlvbiBjcmVhdGUgKFxuICAgICAgICAgIG5hbWU6IGtleW9mIEpTWC5JbnRyaW5zaWNTVkdFbGVtZW50cyxcbiAgICAgICAgICBwcm9wczogYW55LFxuICAgICAgICAgIC4uLmNoaWxkcmVuOiBbIEhUTUxFbGVtZW50IHwgc3RyaW5nIHwgYW55W10gXVxuICAgICApOiBTVkdFbGVtZW50XG5cbiAgICAgZnVuY3Rpb24gY3JlYXRlIChcbiAgICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgICAgcHJvcHM6IGFueSxcbiAgICAgICAgICAuLi5jaGlsZHJlbjogWyBIVE1MRWxlbWVudCB8IHN0cmluZyB8IGFueVtdIF1cbiAgICAgKTogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24gKCB7fSwgcHJvcHMgKVxuXG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IHN2Z19uYW1lcy5pbmRleE9mICggbmFtZSApID09PSAtMVxuICAgICAgICAgICAgICAgICAgICA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgKCBuYW1lIClcbiAgICAgICAgICAgICAgICAgICAgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgKCBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIG5hbWUgKVxuXG4gICAgICAgICAgY29uc3QgY29udGVudCA9IFtdIGFzIGFueVtdXG5cbiAgICAgICAgICAvLyBDaGlsZHJlblxuXG4gICAgICAgICAgd2hpbGUgKCBjaGlsZHJlbi5sZW5ndGggPiAwIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBsZXQgY2hpbGQgPSBjaGlsZHJlbi5wb3AoKVxuXG4gICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGNoaWxkICkgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGNoaWxkLmxlbmd0aCA7IGkrKyApXG4gICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaCggY2hpbGQgW2ldIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKCBjaGlsZCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgd2hpbGUgKCBjb250ZW50Lmxlbmd0aCA+IDAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGxldCBjaGlsZCA9IGNvbnRlbnQucG9wKClcblxuICAgICAgICAgICAgICAgaWYgKCBjaGlsZCBpbnN0YW5jZW9mIE5vZGUgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBjaGlsZCApXG5cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgY2hpbGQgPT0gXCJib29sZWFuXCIgfHwgY2hpbGQgKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSggY2hpbGQudG9TdHJpbmcoKSApIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBdHRyaWJ1dGVzXG5cbiAgICAgICAgICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheVxuICAgICAgICAgIGNvbnN0IGNvbnY6IFJlY29yZCA8c3RyaW5nLCAodjogYW55KSA9PiBzdHJpbmc+ID1cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbGFzczogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKSA6IHYsXG4gICAgICAgICAgICAgICBzdHlsZTogKCB2ICkgPT4gaXNBcnJheSAodikgPyB2LmpvaW4gKFwiIFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHR5cGVvZiB2ID09IFwib2JqZWN0XCIgPyBvYmplY3RUb1N0eWxlICh2KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHYsXG4gICAgICAgICAgICAgICAvLyBzdmdcbiAgICAgICAgICAgICAgIGQ6ICggdiApID0+IGlzQXJyYXkgKHYpID8gdi5qb2luIChcIiBcIikgOiB2LFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZvciAoIGNvbnN0IGtleSBpbiBwcm9wcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9wc1trZXldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIHZhbHVlID09IFwiZnVuY3Rpb25cIiApXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIGtleSwgdmFsdWUgKVxuXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlICgga2V5LCAoY29udltrZXldIHx8ICh2PT52KSkgKHZhbHVlKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGVsZW1lbnRcblxuICAgICAgICAgIGZ1bmN0aW9uIG9iamVjdFRvU3R5bGUgKCBvYmo6IG9iamVjdCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFwiXCJcblxuICAgICAgICAgICAgICAgZm9yICggY29uc3Qga2V5IGluIG9iaiApXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBrZXkgKyBcIjogXCIgKyBvYmogW2tleV0gKyBcIjsgXCJcblxuICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIGNhbWVsaXplICggc3RyOiBzdHJpbmcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZSAoXG4gICAgICAgICAgICAgICAgICAgIC8oPzpbQS1aXXxcXGJcXHcpL2csXG4gICAgICAgICAgICAgICAgICAgICggd29yZCwgaW5kZXggKSA9PiBpbmRleCA9PSAwID8gd29yZC50b0xvd2VyQ2FzZSgpIDogd29yZC50b1VwcGVyQ2FzZSgpXG4gICAgICAgICAgICAgICApLnJlcGxhY2UoL1xccysvZywgJycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZ1bmN0aW9uIHVuY2FtZWxpemUgKCBzdHI6IHN0cmluZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuIHN0ci50cmltICgpLnJlcGxhY2UgKFxuICAgICAgICAgICAgICAgLy8gICAvKD88IS0pKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAvKD86W0EtWl18XFxiXFx3KS9nLFxuICAgICAgICAgICAgICAgICAgICAoIHdvcmQsIGluZGV4ICkgPT4gaW5kZXggPT0gMCA/IHdvcmQudG9Mb3dlckNhc2UoKSA6ICctJyArIHdvcmQudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgKS5yZXBsYWNlKC8oPzpcXHMrfF8pL2csICcnKTtcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gY3JlYXRlXG5cbn0pICgpXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBuYW1lc3BhY2UgSlNYXG4gICAgIHtcbiAgICAgICAgICBleHBvcnQgdHlwZSBFbGVtZW50ID0gSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgICAgICBleHBvcnQgdHlwZSBJbnRyaW5zaWNFbGVtZW50cyA9IEludHJpbnNpY0hUTUxFbGVtZW50cyAmIEludHJpbnNpY1NWR0VsZW1lbnRzXG5cbiAgICAgICAgICBleHBvcnQgaW50ZXJmYWNlIEludHJpbnNpY0hUTUxFbGVtZW50c1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGEgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhYmJyICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYWRkcmVzcyAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGFyZWEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhcnRpY2xlICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYXNpZGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGF1ZGlvICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmFzZSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJkaSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBiZG8gICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYmlnICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJsb2NrcXVvdGU6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBib2R5ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgYnIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGJ1dHRvbiAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjYW52YXMgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY2FwdGlvbiAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNpdGUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjb2RlICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgY29sICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGNvbGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkYXRhICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGF0YWxpc3QgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRkICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZWwgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGV0YWlscyAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRmbiAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkaWFsb2cgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZGl2ICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGRsICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkdCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZW0gICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGVtYmVkICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWVsZHNldCAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZmlnY2FwdGlvbjogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGZpZ3VyZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmb290ZXIgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgZm9ybSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGgxICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoMiAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDMgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGg0ICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoNSAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaDYgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhlYWQgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBoZWFkZXIgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaGdyb3VwICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGhyICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBodG1sICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlmcmFtZSAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbWcgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgaW5wdXQgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGlucyAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBrYmQgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAga2V5Z2VuICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxhYmVsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsZWdlbmQgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbGkgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIGxpbmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYWluICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWFwICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1hcmsgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZW51ICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbWVudWl0ZW0gIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG1ldGEgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtZXRlciAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgbmF2ICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG5vc2NyaXB0ICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvYmplY3QgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb2wgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIG9wdGdyb3VwICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBvcHRpb24gICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgb3V0cHV0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHAgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXJhbSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcGljdHVyZSAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHByZSAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwcm9ncmVzcyAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcSAgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHJwICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBydCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgcnVieSAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHMgICAgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzYW1wICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2NyaXB0ICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNlY3Rpb24gICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzZWxlY3QgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc2xvdCAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHNtYWxsICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzb3VyY2UgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3BhbiAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN0cm9uZyAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdHlsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgc3ViICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHN1bW1hcnkgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdXAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGFibGUgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRib2R5ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ZCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGV4dGFyZWEgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRmb290ICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aCAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdGhlYWQgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRpbWUgICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0aXRsZSAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdHIgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHRyYWNrICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB1ICAgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgICAgICAgdWwgICAgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIFwidmFyXCIgICAgIDogSFRNTEF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgIHZpZGVvICAgICA6IEhUTUxBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB3YnIgICAgICAgOiBIVE1MQXR0cmlidXRlc1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSW50cmluc2ljU1ZHRWxlbWVudHNcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdmcgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBhbmltYXRlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjaXJjbGUgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBjbGlwUGF0aCAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZWZzICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBkZXNjICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBlbGxpcHNlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUJsZW5kICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbG9yTWF0cml4ICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbXBvbmVudFRyYW5zZmVyOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbXBvc2l0ZSAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUNvbnZvbHZlTWF0cml4ICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZURpZmZ1c2VMaWdodGluZyAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZURpc3BsYWNlbWVudE1hcCAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUZsb29kICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUdhdXNzaWFuQmx1ciAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZUltYWdlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1lcmdlICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1lcmdlTm9kZSAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU1vcnBob2xvZ3kgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZU9mZnNldCAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVNwZWN1bGFyTGlnaHRpbmcgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVRpbGUgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmZVR1cmJ1bGVuY2UgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmaWx0ZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBmb3JlaWduT2JqZWN0ICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBnICAgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBpbWFnZSAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5lICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBsaW5lYXJHcmFkaWVudCAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXJrZXIgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBtYXNrICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXRoICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwYXR0ZXJuICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwb2x5Z29uICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBwb2x5bGluZSAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICByYWRpYWxHcmFkaWVudCAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICByZWN0ICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzdG9wICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICBzeW1ib2wgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0ZXh0ICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB0c3BhbiAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgICAgICB1c2UgICAgICAgICAgICAgICAgOiBTVkdBdHRyaWJ1dGVzXG4gICAgICAgICAgfVxuICAgICB9XG5cblxuICAgICBpbnRlcmZhY2UgUGF0aEF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIGQ6IHN0cmluZ1xuICAgICB9XG5cbiAgICAgdHlwZSBFdmVudEhhbmRsZXIgPEUgZXh0ZW5kcyBFdmVudD4gPSAoIGV2ZW50OiBFICkgPT4gdm9pZFxuXG4gICAgIHR5cGUgQ2xpcGJvYXJkRXZlbnRIYW5kbGVyICAgPSBFdmVudEhhbmRsZXI8Q2xpcGJvYXJkRXZlbnQ+XG4gICAgIHR5cGUgQ29tcG9zaXRpb25FdmVudEhhbmRsZXIgPSBFdmVudEhhbmRsZXI8Q29tcG9zaXRpb25FdmVudD5cbiAgICAgdHlwZSBEcmFnRXZlbnRIYW5kbGVyICAgICAgICA9IEV2ZW50SGFuZGxlcjxEcmFnRXZlbnQ+XG4gICAgIHR5cGUgRm9jdXNFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8Rm9jdXNFdmVudD5cbiAgICAgdHlwZSBLZXlib2FyZEV2ZW50SGFuZGxlciAgICA9IEV2ZW50SGFuZGxlcjxLZXlib2FyZEV2ZW50PlxuICAgICB0eXBlIE1vdXNlRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPE1vdXNlRXZlbnQ+XG4gICAgIHR5cGUgVG91Y2hFdmVudEhhbmRsZXIgICAgICAgPSBFdmVudEhhbmRsZXI8VG91Y2hFdmVudD5cbiAgICAgdHlwZSBVSUV2ZW50SGFuZGxlciAgICAgICAgICA9IEV2ZW50SGFuZGxlcjxVSUV2ZW50PlxuICAgICB0eXBlIFdoZWVsRXZlbnRIYW5kbGVyICAgICAgID0gRXZlbnRIYW5kbGVyPFdoZWVsRXZlbnQ+XG4gICAgIHR5cGUgQW5pbWF0aW9uRXZlbnRIYW5kbGVyICAgPSBFdmVudEhhbmRsZXI8QW5pbWF0aW9uRXZlbnQ+XG4gICAgIHR5cGUgVHJhbnNpdGlvbkV2ZW50SGFuZGxlciAgPSBFdmVudEhhbmRsZXI8VHJhbnNpdGlvbkV2ZW50PlxuICAgICB0eXBlIEdlbmVyaWNFdmVudEhhbmRsZXIgICAgID0gRXZlbnRIYW5kbGVyPEV2ZW50PlxuICAgICB0eXBlIFBvaW50ZXJFdmVudEhhbmRsZXIgICAgID0gRXZlbnRIYW5kbGVyPFBvaW50ZXJFdmVudD5cblxuICAgICBpbnRlcmZhY2UgRE9NQXR0cmlidXRlc1xuICAgICB7XG4gICAgICAgICAgW2V2ZW50OiBzdHJpbmddOiBhbnlcblxuICAgICAgICAgIC8vICNyZWdpb24gSW1hZ2UgRXZlbnRzXG4gICAgICAgICAgb25Mb2FkPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkQ2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FcnJvcj8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FcnJvckNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBDbGlwYm9hcmQgRXZlbnRzXG4gICAgICAgICAgb25Db3B5PyAgICAgICAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvcHlDYXB0dXJlPyA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ3V0PyAgICAgICAgIDogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DdXRDYXB0dXJlPyAgOiBDbGlwYm9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBhc3RlPyAgICAgICA6IENsaXBib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUGFzdGVDYXB0dXJlPzogQ2xpcGJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBDb21wb3NpdGlvbiBFdmVudHNcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uRW5kPyAgICAgICAgICA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvbkVuZENhcHR1cmU/ICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25TdGFydD8gICAgICAgIDogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNvbXBvc2l0aW9uU3RhcnRDYXB0dXJlPyA6IENvbXBvc2l0aW9uRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db21wb3NpdGlvblVwZGF0ZT8gICAgICAgOiBDb21wb3NpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29tcG9zaXRpb25VcGRhdGVDYXB0dXJlPzogQ29tcG9zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEZvY3VzIEV2ZW50c1xuICAgICAgICAgIG9uRm9jdXM/ICAgICAgIDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkZvY3VzQ2FwdHVyZT86IEZvY3VzRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25CbHVyPyAgICAgICAgOiBGb2N1c0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQmx1ckNhcHR1cmU/IDogRm9jdXNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEZvcm0gRXZlbnRzXG4gICAgICAgICAgb25DaGFuZ2U/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNoYW5nZUNhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW5wdXQ/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnB1dENhcHR1cmU/ICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNlYXJjaD8gICAgICAgIDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uU2VhcmNoQ2FwdHVyZT8gOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdWJtaXQ/ICAgICAgICA6IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblN1Ym1pdENhcHR1cmU/IDogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uSW52YWxpZD8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25JbnZhbGlkQ2FwdHVyZT86IEdlbmVyaWNFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEtleWJvYXJkIEV2ZW50c1xuICAgICAgICAgIG9uS2V5RG93bj8gICAgICAgIDogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleURvd25DYXB0dXJlPyA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlQcmVzcz8gICAgICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uS2V5UHJlc3NDYXB0dXJlPzogS2V5Ym9hcmRFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbktleVVwPyAgICAgICAgICA6IEtleWJvYXJkRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25LZXlVcENhcHR1cmU/ICAgOiBLZXlib2FyZEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gTWVkaWEgRXZlbnRzXG4gICAgICAgICAgb25BYm9ydD8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25BYm9ydENhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5PyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5Q2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5VGhyb3VnaD8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25DYW5QbGF5VGhyb3VnaENhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EdXJhdGlvbkNoYW5nZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EdXJhdGlvbkNoYW5nZUNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbXB0aWVkPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbXB0aWVkQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmNyeXB0ZWQ/ICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmNyeXB0ZWRDYXB0dXJlPyAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmRlZD8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25FbmRlZENhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWREYXRhPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWREYXRhQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkZWRNZXRhZGF0YUNhcHR1cmU/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkU3RhcnQ/ICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb2FkU3RhcnRDYXB0dXJlPyAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXVzZT8gICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QYXVzZUNhcHR1cmU/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5PyAgICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5Q2FwdHVyZT8gICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5aW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25QbGF5aW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qcm9ncmVzcz8gICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qcm9ncmVzc0NhcHR1cmU/ICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25SYXRlQ2hhbmdlPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25SYXRlQ2hhbmdlQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVrZWQ/ICAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVrZWRDYXB0dXJlPyAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVraW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWVraW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdGFsbGVkPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdGFsbGVkQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdXNwZW5kPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TdXNwZW5kQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UaW1lVXBkYXRlPyAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25UaW1lVXBkYXRlQ2FwdHVyZT8gICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Wb2x1bWVDaGFuZ2U/ICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Wb2x1bWVDaGFuZ2VDYXB0dXJlPyAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25XYWl0aW5nPyAgICAgICAgICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25XYWl0aW5nQ2FwdHVyZT8gICAgICAgOiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBNb3VzZUV2ZW50c1xuICAgICAgICAgIG9uQ2xpY2s/ICAgICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkNsaWNrQ2FwdHVyZT8gICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Db250ZXh0TWVudT8gICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uQ29udGV4dE1lbnVDYXB0dXJlPzogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkRibENsaWNrPyAgICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25EYmxDbGlja0NhcHR1cmU/ICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZz8gICAgICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0NhcHR1cmU/ICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VuZD8gICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VuZENhcHR1cmU/ICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VudGVyPyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0VudGVyQ2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0V4aXQ/ICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0V4aXRDYXB0dXJlPyAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0xlYXZlPyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ0xlYXZlQ2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ092ZXI/ICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ092ZXJDYXB0dXJlPyAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ1N0YXJ0PyAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJhZ1N0YXJ0Q2FwdHVyZT8gIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJvcD8gICAgICAgICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uRHJvcENhcHR1cmU/ICAgICAgIDogRHJhZ0V2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VEb3duPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlRG93bkNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUVudGVyPyAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VFbnRlckNhcHR1cmU/IDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTGVhdmU/ICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZUxlYXZlQ2FwdHVyZT8gOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VNb3ZlPyAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlTW92ZUNhcHR1cmU/ICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU91dD8gICAgICAgICAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VPdXRDYXB0dXJlPyAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlT3Zlcj8gICAgICAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Nb3VzZU92ZXJDYXB0dXJlPyAgOiBNb3VzZUV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uTW91c2VVcD8gICAgICAgICAgIDogTW91c2VFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbk1vdXNlVXBDYXB0dXJlPyAgICA6IE1vdXNlRXZlbnRIYW5kbGVyXG4gICAgICAgICAgLy8gI2VuZHJlZ2lvblxuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBTZWxlY3Rpb24gRXZlbnRzXG4gICAgICAgICAgb25TZWxlY3Q/OiBHZW5lcmljRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25TZWxlY3RDYXB0dXJlPzogR2VuZXJpY0V2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gVG91Y2ggRXZlbnRzXG4gICAgICAgICAgb25Ub3VjaENhbmNlbD86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaENhbmNlbENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hFbmQ/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hFbmRDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoTW92ZT86IFRvdWNoRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Ub3VjaE1vdmVDYXB0dXJlPzogVG91Y2hFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRvdWNoU3RhcnQ/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uVG91Y2hTdGFydENhcHR1cmU/OiBUb3VjaEV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gUG9pbnRlciBFdmVudHNcbiAgICAgICAgICBvblBvaW50ZXJPdmVyPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3ZlckNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckVudGVyPyAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJFbnRlckNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyRG93bj8gICAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckRvd25DYXB0dXJlPyAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJNb3ZlPyAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyTW92ZUNhcHR1cmU/ICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlclVwPyAgICAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJVcENhcHR1cmU/ICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyQ2FuY2VsPyAgICAgICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckNhbmNlbENhcHR1cmU/ICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJPdXQ/ICAgICAgICAgICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Qb2ludGVyT3V0Q2FwdHVyZT8gICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uUG9pbnRlckxlYXZlPyAgICAgICAgICAgICA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblBvaW50ZXJMZWF2ZUNhcHR1cmU/ICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Hb3RQb2ludGVyQ2FwdHVyZT8gICAgICAgIDogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uR290UG9pbnRlckNhcHR1cmVDYXB0dXJlPyA6IFBvaW50ZXJFdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkxvc3RQb2ludGVyQ2FwdHVyZT8gICAgICAgOiBQb2ludGVyRXZlbnRIYW5kbGVyXG4gICAgICAgICAgb25Mb3N0UG9pbnRlckNhcHR1cmVDYXB0dXJlPzogUG9pbnRlckV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gVUkgRXZlbnRzXG4gICAgICAgICAgb25TY3JvbGw/ICAgICAgIDogVUlFdmVudEhhbmRsZXJcbiAgICAgICAgICBvblNjcm9sbENhcHR1cmU/OiBVSUV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cblxuICAgICAgICAgIC8vICNyZWdpb24gV2hlZWwgRXZlbnRzXG4gICAgICAgICAgb25XaGVlbD8gICAgICAgOiBXaGVlbEV2ZW50SGFuZGxlclxuICAgICAgICAgIG9uV2hlZWxDYXB0dXJlPzogV2hlZWxFdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIEFuaW1hdGlvbiBFdmVudHNcbiAgICAgICAgICBvbkFuaW1hdGlvblN0YXJ0PyAgICAgICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvblN0YXJ0Q2FwdHVyZT8gICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkVuZD8gICAgICAgICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkVuZENhcHR1cmU/ICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkl0ZXJhdGlvbj8gICAgICAgOiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvbkFuaW1hdGlvbkl0ZXJhdGlvbkNhcHR1cmU/OiBBbmltYXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uXG5cbiAgICAgICAgICAvLyAjcmVnaW9uIFRyYW5zaXRpb24gRXZlbnRzXG4gICAgICAgICAgb25UcmFuc2l0aW9uRW5kPyAgICAgICA6IFRyYW5zaXRpb25FdmVudEhhbmRsZXJcbiAgICAgICAgICBvblRyYW5zaXRpb25FbmRDYXB0dXJlPzogVHJhbnNpdGlvbkV2ZW50SGFuZGxlclxuICAgICAgICAgIC8vICNlbmRyZWdpb25cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBIVE1MQXR0cmlidXRlcyBleHRlbmRzIERPTUF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIC8vIFN0YW5kYXJkIEhUTUwgQXR0cmlidXRlc1xuICAgICAgICAgIGFjY2VwdD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYWNjZXB0Q2hhcnNldD8gICAgOiBzdHJpbmdcbiAgICAgICAgICBhY2Nlc3NLZXk/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGFjdGlvbj8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYWxsb3dGdWxsU2NyZWVuPyAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYWxsb3dUcmFuc3BhcmVuY3k/OiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgYWx0PyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhc3luYz8gICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBhdXRvY29tcGxldGU/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9Db21wbGV0ZT8gICAgIDogc3RyaW5nXG4gICAgICAgICAgYXV0b2NvcnJlY3Q/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvQ29ycmVjdD8gICAgICA6IHN0cmluZ1xuICAgICAgICAgIGF1dG9mb2N1cz8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGF1dG9Gb2N1cz8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGF1dG9QbGF5PyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNhcHR1cmU/ICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGNlbGxQYWRkaW5nPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgY2VsbFNwYWNpbmc/ICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjaGFyU2V0PyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNoYWxsZW5nZT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY2hlY2tlZD8gICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY2xhc3M/ICAgICAgICAgICAgOiBzdHJpbmcgfCBzdHJpbmdbXVxuICAgICAgICAgIGNsYXNzTmFtZT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29scz8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBjb2xTcGFuPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGNvbnRlbnQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY29udGVudEVkaXRhYmxlPyAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgY29udGV4dE1lbnU/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBjb250cm9scz8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBjb250cm9sc0xpc3Q/ICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNvb3Jkcz8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgY3Jvc3NPcmlnaW4/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkYXRhPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGRhdGVUaW1lPyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZGVmYXVsdD8gICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZGVmZXI/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgZGlyPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBkaXNhYmxlZD8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBkb3dubG9hZD8gICAgICAgICA6IGFueVxuICAgICAgICAgIGRyYWdnYWJsZT8gICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGVuY1R5cGU/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtQWN0aW9uPyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcm1FbmNUeXBlPyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZm9ybU1ldGhvZD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb3JtTm9WYWxpZGF0ZT8gICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBmb3JtVGFyZ2V0PyAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZyYW1lQm9yZGVyPyAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgaGVhZGVycz8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBoZWlnaHQ/ICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIGhpZGRlbj8gICAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIGhpZ2g/ICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgaHJlZj8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBocmVmTGFuZz8gICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGZvcj8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaHRtbEZvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBodHRwRXF1aXY/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGljb24/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaWQ/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBpbnB1dE1vZGU/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGludGVncml0eT8gICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgaXM/ICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBrZXlQYXJhbXM/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGtleVR5cGU/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAga2luZD8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsYWJlbD8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGxhbmc/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbGlzdD8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBsb29wPyAgICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBsb3c/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1hbmlmZXN0PyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWFyZ2luSGVpZ2h0PyAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtYXJnaW5XaWR0aD8gICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1heD8gICAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbWF4TGVuZ3RoPyAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBtZWRpYT8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1lZGlhR3JvdXA/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgbWV0aG9kPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtaW4/ICAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIG1pbkxlbmd0aD8gICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgbXVsdGlwbGU/ICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbXV0ZWQ/ICAgICAgICAgICAgOiBzdHJpbmcgfCBib29sZWFuXG4gICAgICAgICAgbmFtZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBub1ZhbGlkYXRlPyAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBvcGVuPyAgICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBvcHRpbXVtPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHBhdHRlcm4/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGxhY2Vob2xkZXI/ICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwbGF5c0lubGluZT8gICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBwb3N0ZXI/ICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHByZWxvYWQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcmFkaW9Hcm91cD8gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICByZWFkT25seT8gICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICByZWw/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHJvbGU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcm93cz8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICByb3dTcGFuPyAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHNhbmRib3g/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2NvcGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzY29wZWQ/ICAgICAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzY3JvbGxpbmc/ICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNlYW1sZXNzPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNlbGVjdGVkPyAgICAgICAgIDogc3RyaW5nIHwgYm9vbGVhblxuICAgICAgICAgIHNoYXBlPyAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc2l6ZT8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzaXplcz8gICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNsb3Q/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Bhbj8gICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzcGVsbGNoZWNrPyAgICAgICA6IHN0cmluZyB8IGJvb2xlYW5cbiAgICAgICAgICBzcmM/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY3NldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3JjRG9jPyAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBzcmNMYW5nPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHNyY1NldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RhcnQ/ICAgICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdGVwPyAgICAgICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHN0eWxlPyAgICAgICAgICAgIDogc3RyaW5nIHwgeyBbIGtleTogc3RyaW5nIF06IHN0cmluZyB8IG51bWJlciB9XG4gICAgICAgICAgc3VtbWFyeT8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0YWJJbmRleD8gICAgICAgICA6IHN0cmluZyB8IG51bWJlclxuICAgICAgICAgIHRhcmdldD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdGl0bGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0eXBlPyAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHVzZU1hcD8gICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdmFsdWU/ICAgICAgICAgICAgOiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bWJlclxuICAgICAgICAgIHdpZHRoPyAgICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgd21vZGU/ICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB3cmFwPyAgICAgICAgICAgICA6IHN0cmluZ1xuXG4gICAgICAgICAgLy8gUkRGYSBBdHRyaWJ1dGVzXG4gICAgICAgICAgYWJvdXQ/OiBzdHJpbmdcbiAgICAgICAgICBkYXRhdHlwZT86IHN0cmluZ1xuICAgICAgICAgIGlubGlzdD86IGFueVxuICAgICAgICAgIHByZWZpeD86IHN0cmluZ1xuICAgICAgICAgIHByb3BlcnR5Pzogc3RyaW5nXG4gICAgICAgICAgcmVzb3VyY2U/OiBzdHJpbmdcbiAgICAgICAgICB0eXBlb2Y/OiBzdHJpbmdcbiAgICAgICAgICB2b2NhYj86IHN0cmluZ1xuXG4gICAgICAgICAgLy8gTWljcm9kYXRhIEF0dHJpYnV0ZXNcbiAgICAgICAgICBpdGVtUHJvcD86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1TY29wZT86IGJvb2xlYW5cbiAgICAgICAgICBpdGVtVHlwZT86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1JRD86IHN0cmluZ1xuICAgICAgICAgIGl0ZW1SZWY/OiBzdHJpbmdcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBTVkdBdHRyaWJ1dGVzIGV4dGVuZHMgSFRNTEF0dHJpYnV0ZXNcbiAgICAge1xuICAgICAgICAgIGFjY2VudEhlaWdodD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYWNjdW11bGF0ZT8gICAgICAgICAgICAgICAgOiBcIm5vbmVcIiB8IFwic3VtXCJcbiAgICAgICAgICBhZGRpdGl2ZT8gICAgICAgICAgICAgICAgICA6IFwicmVwbGFjZVwiIHwgXCJzdW1cIlxuICAgICAgICAgIGFsaWdubWVudEJhc2VsaW5lPyAgICAgICAgIDogXCJhdXRvXCIgfCBcImJhc2VsaW5lXCIgfCBcImJlZm9yZS1lZGdlXCIgfCBcInRleHQtYmVmb3JlLWVkZ2VcIiB8IFwibWlkZGxlXCIgfCBcImNlbnRyYWxcIiB8IFwiYWZ0ZXItZWRnZVwiIHwgXCJ0ZXh0LWFmdGVyLWVkZ2VcIiB8IFwiaWRlb2dyYXBoaWNcIiB8IFwiYWxwaGFiZXRpY1wiIHwgXCJoYW5naW5nXCIgfCBcIm1hdGhlbWF0aWNhbFwiIHwgXCJpbmhlcml0XCJcbiAgICAgICAgICBhbGxvd1Jlb3JkZXI/ICAgICAgICAgICAgICA6IFwibm9cIiB8IFwieWVzXCJcbiAgICAgICAgICBhbHBoYWJldGljPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGFtcGxpdHVkZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYXJhYmljRm9ybT8gICAgICAgICAgICAgICAgOiBcImluaXRpYWxcIiB8IFwibWVkaWFsXCIgfCBcInRlcm1pbmFsXCIgfCBcImlzb2xhdGVkXCJcbiAgICAgICAgICBhc2NlbnQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGF0dHJpYnV0ZU5hbWU/ICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgYXR0cmlidXRlVHlwZT8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBhdXRvUmV2ZXJzZT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGF6aW11dGg/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmFzZUZyZXF1ZW5jeT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiYXNlbGluZVNoaWZ0PyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJhc2VQcm9maWxlPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYmJveD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBiZWdpbj8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGJpYXM/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgYnk/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjYWxjTW9kZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNhcEhlaWdodD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjbGlwUGF0aD8gICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGNsaXBQYXRoVW5pdHM/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY2xpcFJ1bGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb2xvckludGVycG9sYXRpb24/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbG9ySW50ZXJwb2xhdGlvbkZpbHRlcnM/IDogXCJhdXRvXCIgfCBcInNSR0JcIiB8IFwibGluZWFyUkdCXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIGNvbG9yUHJvZmlsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY29sb3JSZW5kZXJpbmc/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjb250ZW50U2NyaXB0VHlwZT8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGNvbnRlbnRTdHlsZVR5cGU/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgY3Vyc29yPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBjeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGN5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZD8gICAgICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmcgfCAobnVtYmVyIHwgc3RyaW5nKSBbXVxuICAgICAgICAgIGRlY2VsZXJhdGU/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGVzY2VudD8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaWZmdXNlQ29uc3RhbnQ/ICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRpcmVjdGlvbj8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZGlzcGxheT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkaXZpc29yPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGRvbWluYW50QmFzZWxpbmU/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZHVyPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBkeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGR5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZWRnZU1vZGU/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBlbGV2YXRpb24/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGVuYWJsZUJhY2tncm91bmQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZW5kPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBleHBvbmVudD8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGV4dGVybmFsUmVzb3VyY2VzUmVxdWlyZWQ/IDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmlsbD8gICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmaWxsT3BhY2l0eT8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbGxSdWxlPyAgICAgICAgICAgICAgICAgIDogXCJub256ZXJvXCIgfCBcImV2ZW5vZGRcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgZmlsdGVyPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmaWx0ZXJSZXM/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZpbHRlclVuaXRzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZmxvb2RDb2xvcj8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmbG9vZE9wYWNpdHk/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvY3VzYWJsZT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udEZhbWlseT8gICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBmb250U2l6ZT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRTaXplQWRqdXN0PyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFN0cmV0Y2g/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb250U3R5bGU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZvbnRWYXJpYW50PyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZm9udFdlaWdodD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmb3JtYXQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGZyb20/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZng/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBmeT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGcxPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZzI/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaE5hbWU/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdseXBoT3JpZW50YXRpb25Ib3Jpem9udGFsPzogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgZ2x5cGhPcmllbnRhdGlvblZlcnRpY2FsPyAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBnbHlwaFJlZj8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGdyYWRpZW50VHJhbnNmb3JtPyAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgZ3JhZGllbnRVbml0cz8gICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBoYW5naW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGhvcml6QWR2WD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaG9yaXpPcmlnaW5YPyAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpZGVvZ3JhcGhpYz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGltYWdlUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgaW4yPyAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBpbj8gICAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIGludGVyY2VwdD8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrMj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGszPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgazQ/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrPyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtlcm5lbE1hdHJpeD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2VybmVsVW5pdExlbmd0aD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXJuaW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGtleVBvaW50cz8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAga2V5U3BsaW5lcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBrZXlUaW1lcz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxlbmd0aEFkanVzdD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbGV0dGVyU3BhY2luZz8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBsaWdodGluZ0NvbG9yPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIGxpbWl0aW5nQ29uZUFuZ2xlPyAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbG9jYWw/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJFbmQ/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmtlckhlaWdodD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyTWlkPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBtYXJrZXJTdGFydD8gICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hcmtlclVuaXRzPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFya2VyV2lkdGg/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXNrPyAgICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIG1hc2tDb250ZW50VW5pdHM/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbWFza1VuaXRzPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBtYXRoZW1hdGljYWw/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG1vZGU/ICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgbnVtT2N0YXZlcz8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvZmZzZXQ/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9wYWNpdHk/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3BlcmF0b3I/ICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmRlcj8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG9yaWVudD8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3JpZW50YXRpb24/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvcmlnaW4/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIG92ZXJmbG93PyAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgb3ZlcmxpbmVQb3NpdGlvbj8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBvdmVybGluZVRoaWNrbmVzcz8gICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhaW50T3JkZXI/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcGFub3NlMT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXRoTGVuZ3RoPyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBhdHRlcm5Db250ZW50VW5pdHM/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcGF0dGVyblRyYW5zZm9ybT8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwYXR0ZXJuVW5pdHM/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHBvaW50ZXJFdmVudHM/ICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcG9pbnRzPyAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICBwb2ludHNBdFg/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHBvaW50c0F0WT8gICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcG9pbnRzQXRaPyAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBwcmVzZXJ2ZUFscGhhPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHByZXNlcnZlQXNwZWN0UmF0aW8/ICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcHJpbWl0aXZlVW5pdHM/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByPyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJhZGl1cz8gICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVmWD8gICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZWZZPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlbmRlcmluZ0ludGVudD8gICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVwZWF0Q291bnQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXBlYXREdXI/ICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlcXVpcmVkRXh0ZW5zaW9ucz8gICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgcmVxdWlyZWRGZWF0dXJlcz8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByZXN0YXJ0PyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJlc3VsdD8gICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgcm90YXRlPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICByeD8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHJ5PyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2NhbGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzZWVkPyAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNoYXBlUmVuZGVyaW5nPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc2xvcGU/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGFjaW5nPyAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwZWN1bGFyQ29uc3RhbnQ/ICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3BlY3VsYXJFeHBvbmVudD8gICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzcGVlZD8gICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHNwcmVhZE1ldGhvZD8gICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RhcnRPZmZzZXQ/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGREZXZpYXRpb24/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0ZW1oPyAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RlbXY/ICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdGl0Y2hUaWxlcz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0b3BDb2xvcj8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3RvcE9wYWNpdHk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJpa2V0aHJvdWdoUG9zaXRpb24/ICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN0cmlrZXRocm91Z2hUaGlja25lc3M/ICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3RyaW5nPyAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJva2U/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHN0cm9rZURhc2hhcnJheT8gICAgICAgICAgIDogc3RyaW5nIHwgbnVtYmVyXG4gICAgICAgICAgc3Ryb2tlRGFzaG9mZnNldD8gICAgICAgICAgOiBzdHJpbmcgfCBudW1iZXJcbiAgICAgICAgICBzdHJva2VMaW5lY2FwPyAgICAgICAgICAgICA6IFwiYnV0dFwiIHwgXCJyb3VuZFwiIHwgXCJzcXVhcmVcIiB8IFwiaW5oZXJpdFwiXG4gICAgICAgICAgc3Ryb2tlTGluZWpvaW4/ICAgICAgICAgICAgOiBcIm1pdGVyXCIgfCBcInJvdW5kXCIgfCBcImJldmVsXCIgfCBcImluaGVyaXRcIlxuICAgICAgICAgIHN0cm9rZU1pdGVybGltaXQ/ICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgc3Ryb2tlT3BhY2l0eT8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICBzdHJva2VXaWR0aD8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHN1cmZhY2VTY2FsZT8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgc3lzdGVtTGFuZ3VhZ2U/ICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0YWJsZVZhbHVlcz8gICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRhcmdldFg/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGFyZ2V0WT8gICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0ZXh0QW5jaG9yPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHRleHREZWNvcmF0aW9uPyAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdGV4dExlbmd0aD8gICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB0ZXh0UmVuZGVyaW5nPyAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHRvPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdHJhbnNmb3JtPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB1MT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHUyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5kZXJsaW5lUG9zaXRpb24/ICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmRlcmxpbmVUaGlja25lc3M/ICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaWNvZGU/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdW5pY29kZUJpZGk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB1bmljb2RlUmFuZ2U/ICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHVuaXRzUGVyRW0/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdkFscGhhYmV0aWM/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2YWx1ZXM/ICAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHZlY3RvckVmZmVjdD8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmVyc2lvbj8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2ZXJ0QWR2WT8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZlcnRPcmlnaW5YPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmVydE9yaWdpblk/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB2SGFuZ2luZz8gICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZJZGVvZ3JhcGhpYz8gICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdmlld0JveD8gICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB2aWV3VGFyZ2V0PyAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHZpc2liaWxpdHk/ICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgdk1hdGhlbWF0aWNhbD8gICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB3aWR0aHM/ICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHdvcmRTcGFjaW5nPyAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgd3JpdGluZ01vZGU/ICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4MT8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHgyPyAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeD8gICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB4Q2hhbm5lbFNlbGVjdG9yPyAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhIZWlnaHQ/ICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeGxpbmtBY3R1YXRlPyAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua0FyY3JvbGU/ICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rSHJlZj8gICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtSb2xlPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bGlua1Nob3c/ICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhsaW5rVGl0bGU/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeGxpbmtUeXBlPyAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxCYXNlPyAgICAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbExhbmc/ICAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeG1sbnM/ICAgICAgICAgICAgICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB4bWxuc1hsaW5rPyAgICAgICAgICAgICAgICA6IHN0cmluZ1xuICAgICAgICAgIHhtbFNwYWNlPyAgICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgICAgICAgeTE/ICAgICAgICAgICAgICAgICAgICAgICAgOiBudW1iZXIgfCBzdHJpbmdcbiAgICAgICAgICB5Mj8gICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHk/ICAgICAgICAgICAgICAgICAgICAgICAgIDogbnVtYmVyIHwgc3RyaW5nXG4gICAgICAgICAgeUNoYW5uZWxTZWxlY3Rvcj8gICAgICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB6PyAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bWJlciB8IHN0cmluZ1xuICAgICAgICAgIHpvb21BbmRQYW4/ICAgICAgICAgICAgICAgIDogc3RyaW5nXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IGludGVyZmFjZSAgRHJhZ2dhYmxlT3B0aW9uc1xue1xuICAgICBoYW5kbGVzICAgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIG1pblZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIG1heFZlbG9jaXR5PyAgIDogbnVtYmVyXG4gICAgIHZlbG9jaXR5RmFjdG9yPzogbnVtYmVyXG4gICAgIG9uRHJhZz8gICAgICAgIDogKCBldmVudDogRHJhZ0V2ZW50ICkgPT4gdm9pZFxuICAgICBvblN0YXJ0RHJhZz8gICA6ICgpID0+IHZvaWRcbiAgICAgb25TdG9wRHJhZz8gICAgOiAoIGV2ZW50OiBEcmFnRXZlbnQgKSA9PiBib29sZWFuXG4gICAgIG9uRW5kQW5pbWF0aW9uPzogKCAgZXZlbnQ6IERyYWdFdmVudCAgKSA9PiB2b2lkXG59XG5cbmV4cG9ydCB0eXBlIERyYWdnYWJsZUNvbmZpZyA9IFJlcXVpcmVkIDxEcmFnZ2FibGVPcHRpb25zPlxuXG5leHBvcnQgaW50ZXJmYWNlIERyYWdFdmVudFxue1xuICAgICB4ICAgICAgICA6IG51bWJlclxuICAgICB5ICAgICAgICA6IG51bWJlclxuICAgICBvZmZzZXRYICA6IG51bWJlclxuICAgICBvZmZzZXRZICA6IG51bWJlclxuICAgICB0YXJnZXRYOiBudW1iZXJcbiAgICAgdGFyZ2V0WTogbnVtYmVyXG4gICAgIGRlbGF5ICAgIDogbnVtYmVyXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IERyYWdnYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBtaW5WZWxvY2l0eSAgIDogMCxcbiAgICAgICAgICBtYXhWZWxvY2l0eSAgIDogMSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogKCkgPT4ge30sXG4gICAgICAgICAgb25EcmFnICAgICAgICA6ICgpID0+IHt9LFxuICAgICAgICAgIG9uU3RvcERyYWcgICAgOiAoKSA9PiB0cnVlLFxuICAgICAgICAgIG9uRW5kQW5pbWF0aW9uOiAoKSA9PiB7fSxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogKHdpbmRvdy5pbm5lckhlaWdodCA8IHdpbmRvdy5pbm5lcldpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiB3aW5kb3cuaW5uZXJXaWR0aCkgLyAyLFxuICAgICB9XG59XG5cbnZhciBpc19kcmFnICAgID0gZmFsc2VcbnZhciBwb2ludGVyOiBNb3VzZUV2ZW50IHwgVG91Y2hcblxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ3JlLzE2NTAyOTRcbnZhciBFYXNpbmdGdW5jdGlvbnMgPSB7XG4gICAgIGxpbmVhciAgICAgICAgOiAoIHQ6IG51bWJlciApID0+IHQsXG4gICAgIGVhc2VJblF1YWQgICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCxcbiAgICAgZWFzZU91dFF1YWQgICA6ICggdDogbnVtYmVyICkgPT4gdCooMi10KSxcbiAgICAgZWFzZUluT3V0UXVhZCA6ICggdDogbnVtYmVyICkgPT4gdDwuNSA/IDIqdCp0IDogLTErKDQtMip0KSp0LFxuICAgICBlYXNlSW5DdWJpYyAgIDogKCB0OiBudW1iZXIgKSA9PiB0KnQqdCxcbiAgICAgZWFzZU91dEN1YmljICA6ICggdDogbnVtYmVyICkgPT4gKC0tdCkqdCp0KzEsXG4gICAgIGVhc2VJbk91dEN1YmljOiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA0KnQqdCp0IDogKHQtMSkqKDIqdC0yKSooMip0LTIpKzEsXG4gICAgIGVhc2VJblF1YXJ0ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQsXG4gICAgIGVhc2VPdXRRdWFydCAgOiAoIHQ6IG51bWJlciApID0+IDEtKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJbk91dFF1YXJ0OiAoIHQ6IG51bWJlciApID0+IHQ8LjUgPyA4KnQqdCp0KnQgOiAxLTgqKC0tdCkqdCp0KnQsXG4gICAgIGVhc2VJblF1aW50ICAgOiAoIHQ6IG51bWJlciApID0+IHQqdCp0KnQqdCxcbiAgICAgZWFzZU91dFF1aW50ICA6ICggdDogbnVtYmVyICkgPT4gMSsoLS10KSp0KnQqdCp0LFxuICAgICBlYXNlSW5PdXRRdWludDogKCB0OiBudW1iZXIgKSA9PiB0PC41ID8gMTYqdCp0KnQqdCp0IDogMSsxNiooLS10KSp0KnQqdCp0XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkcmFnZ2FibGUgKCBvcHRpb25zOiBEcmFnZ2FibGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgY29uZmlnICAgICA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfYWN0aXZlICA9IGZhbHNlXG4gICAgIHZhciBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgdmFyIGN1cnJlbnRfZXZlbnQ6IERyYWdFdmVudFxuXG4gICAgIHZhciBzdGFydF90aW1lID0gMFxuICAgICB2YXIgc3RhcnRfeCAgICA9IDBcbiAgICAgdmFyIHN0YXJ0X3kgICAgPSAwXG5cbiAgICAgdmFyIHZlbG9jaXR5X2RlbGF5ID0gNTAwXG4gICAgIHZhciB2ZWxvY2l0eV94OiBudW1iZXJcbiAgICAgdmFyIHZlbG9jaXR5X3k6IG51bWJlclxuXG4gICAgIHZhciBjdXJyZW50X2FuaW1hdGlvbiA9IC0xXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogRHJhZ2dhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGlzX2RyYWcgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggbmF2aWdhdG9yLm1heFRvdWNoUG9pbnRzID4gMCApXG4gICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcblxuICAgICAgICAgIGRpc2FibGVFdmVudHMgKClcblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24gKCBjb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgZW5hYmxlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhZGRIYW5kbGVzICggLi4uIGhhbmRsZXM6IEpTWC5FbGVtZW50IFtdIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCAhIGNvbmZpZy5oYW5kbGVzLmluY2x1ZGVzIChoKSApXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5oYW5kbGVzLnB1c2ggKGgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBpc19hY3RpdmUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGRlc2FjdGl2YXRlICgpXG4gICAgICAgICAgICAgICBhY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBlbmFibGVFdmVudHMgKClcbiAgICAgICAgICBpc19hY3RpdmUgPSB0cnVlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZGlzYWJsZUV2ZW50cyAoKVxuICAgICAgICAgIGlzX2FjdGl2ZSA9IGZhbHNlXG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhZGRIYW5kbGVzLFxuICAgICAgICAgIGlzQWN0aXZlOiAoKSA9PiBpc19hY3RpdmUsXG4gICAgICAgICAgYWN0aXZhdGUsXG4gICAgICAgICAgZGVzYWN0aXZhdGUsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5hZGRFdmVudExpc3RlbmVyICggXCJwb2ludGVyZG93blwiLCBvblN0YXJ0LCB7IHBhc3NpdmU6IHRydWUgfSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGlzYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcInBvaW50ZXJkb3duXCIgLCBvblN0YXJ0IClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19kcmFnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zb2xlLndhcm4gKCBcIlRlbnRhdGl2ZSBkZSBkw6ltYXJyYWdlIGRlcyDDqXbDqW5lbWVudHMgXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcXFwiZHJhZ2dhYmxlIFxcXCIgZMOpasOgIGVuIGNvdXJzLlwiIClcbiAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfYW5pbWF0ZSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc3RvcFZlbG9jaXR5RnJhbWUgKClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwb2ludGVyID0gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXNcbiAgICAgICAgICAgICAgICAgICAgPyAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyBbMF1cbiAgICAgICAgICAgICAgICAgICAgOiAoZXZlbnQgYXMgTW91c2VFdmVudClcblxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyIChcInBvaW50ZXJtb3ZlXCIsIG9uTW92ZSlcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoXCJwb2ludGVydXBcIiAgLCBvbkVuZClcbiAgICAgICAgICBkaXNhYmxlRXZlbnRzICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvblN0YXJ0IClcblxuICAgICAgICAgIGlzX2RyYWcgPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25Nb3ZlICggZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50IClcbiAgICAge1xuICAgICAgICAgIGlmICggaXNfZHJhZyA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIHBvaW50ZXIgPSAoZXZlbnQgYXMgVG91Y2hFdmVudCkudG91Y2hlcyAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgID8gKGV2ZW50IGFzIFRvdWNoRXZlbnQpLnRvdWNoZXMgWzBdXG4gICAgICAgICAgICAgICAgICAgIDogKGV2ZW50IGFzIE1vdXNlRXZlbnQpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmQgKCBldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgKFwicG9pbnRlcm1vdmVcIiwgb25Nb3ZlKVxuICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyIChcInBvaW50ZXJ1cFwiICAsIG9uRW5kKVxuICAgICAgICAgIGVuYWJsZUV2ZW50cyAoKVxuXG4gICAgICAgICAgaXNfZHJhZyA9IGZhbHNlXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvblN0YXJ0ICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfeCAgICA9IHBvaW50ZXIuY2xpZW50WFxuICAgICAgICAgIHN0YXJ0X3kgICAgPSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBzdGFydF90aW1lID0gbm93XG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50ID0ge1xuICAgICAgICAgICAgICAgZGVsYXkgICAgOiAwLFxuICAgICAgICAgICAgICAgeCAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgeSAgICAgICAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WCAgOiAwLFxuICAgICAgICAgICAgICAgb2Zmc2V0WSAgOiAwLFxuICAgICAgICAgICAgICAgdGFyZ2V0WDogMCxcbiAgICAgICAgICAgICAgIHRhcmdldFk6IDAsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uZmlnLm9uU3RhcnREcmFnICgpXG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvbkFuaW1hdGlvbkZyYW1lIClcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkFuaW1hdGlvbkZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyB2ZWxvY2l0eUZhY3RvciB9ID0gY29uZmlnXG5cbiAgICAgICAgICBjb25zdCB4ICAgICAgICAgICA9IHBvaW50ZXIuY2xpZW50WCAtIHN0YXJ0X3hcbiAgICAgICAgICBjb25zdCB5ICAgICAgICAgICA9IHN0YXJ0X3kgLSBwb2ludGVyLmNsaWVudFlcbiAgICAgICAgICBjb25zdCBkZWxheSAgICAgICA9IG5vdyAtIHN0YXJ0X3RpbWVcbiAgICAgICAgICBjb25zdCBvZmZzZXREZWxheSA9IGRlbGF5IC0gY3VycmVudF9ldmVudC5kZWxheVxuICAgICAgICAgIGNvbnN0IG9mZnNldFggICAgID0geCAtIGN1cnJlbnRfZXZlbnQueFxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgICAgID0geSAtIGN1cnJlbnRfZXZlbnQueVxuXG4gICAgICAgICAgY3VycmVudF9ldmVudCA9IHtcbiAgICAgICAgICAgICAgIGRlbGF5LFxuICAgICAgICAgICAgICAgeCxcbiAgICAgICAgICAgICAgIHksXG4gICAgICAgICAgICAgICB0YXJnZXRYOiB4LFxuICAgICAgICAgICAgICAgdGFyZ2V0WTogeSxcbiAgICAgICAgICAgICAgIG9mZnNldFgsXG4gICAgICAgICAgICAgICBvZmZzZXRZLFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggaXNfZHJhZyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25BbmltYXRpb25GcmFtZSApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBzdGFydF90aW1lICAgICA9IG5vd1xuICAgICAgICAgICAgICAgc3RhcnRfeCAgICAgICAgPSB4XG4gICAgICAgICAgICAgICBzdGFydF95ICAgICAgICA9IHlcbiAgICAgICAgICAgICAgIHZlbG9jaXR5X3ggICAgICAgPSB2ZWxvY2l0eUZhY3RvciAqIG5vcm0gKCBvZmZzZXRYIC8gb2Zmc2V0RGVsYXkgKVxuICAgICAgICAgICAgICAgdmVsb2NpdHlfeSAgICAgICA9IHZlbG9jaXR5RmFjdG9yICogbm9ybSAoIG9mZnNldFkgLyBvZmZzZXREZWxheSApXG5cbiAgICAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQudGFyZ2V0WCArPSB2ZWxvY2l0eV94XG4gICAgICAgICAgICAgICBjdXJyZW50X2V2ZW50LnRhcmdldFkgKz0gdmVsb2NpdHlfeVxuXG4gICAgICAgICAgICAgICBpZiAoIGNvbmZpZy5vblN0b3BEcmFnICggY3VycmVudF9ldmVudCApID09PSB0cnVlIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaXNfYW5pbWF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudF9hbmltYXRpb24gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICggb25WZWxvY2l0eUZyYW1lIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmdW5jdGlvbiBub3JtICggdmFsdWU6IG51bWJlciApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKHZhbHVlIDwgLTEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTFcblxuICAgICAgICAgICAgICAgaWYgKCB2YWx1ZSA+IDEgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMVxuXG4gICAgICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICB9XG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25WZWxvY2l0eUZyYW1lICggbm93OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGVsYXkgPSBub3cgLSBzdGFydF90aW1lXG5cbiAgICAgICAgICBjb25zdCB0ID0gZGVsYXkgPj0gdmVsb2NpdHlfZGVsYXlcbiAgICAgICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICAgICAgOiBkZWxheSAvIHZlbG9jaXR5X2RlbGF5XG5cbiAgICAgICAgICBjb25zdCBmYWN0b3IgID0gRWFzaW5nRnVuY3Rpb25zLmVhc2VPdXRRdWFydCAodClcbiAgICAgICAgICBjb25zdCBvZmZzZXRYID0gdmVsb2NpdHlfeCAqIGZhY3RvclxuICAgICAgICAgIGNvbnN0IG9mZnNldFkgPSB2ZWxvY2l0eV95ICogZmFjdG9yXG5cbiAgICAgICAgICBjdXJyZW50X2V2ZW50LnggICAgICAgPSBzdGFydF94ICsgb2Zmc2V0WFxuICAgICAgICAgIGN1cnJlbnRfZXZlbnQueSAgICAgICA9IHN0YXJ0X3kgKyBvZmZzZXRZXG4gICAgICAgICAgY3VycmVudF9ldmVudC5vZmZzZXRYID0gdmVsb2NpdHlfeCAtIG9mZnNldFhcbiAgICAgICAgICBjdXJyZW50X2V2ZW50Lm9mZnNldFkgPSB2ZWxvY2l0eV95IC0gb2Zmc2V0WVxuXG4gICAgICAgICAgY29uZmlnLm9uRHJhZyAoIGN1cnJlbnRfZXZlbnQgKVxuXG4gICAgICAgICAgaWYgKCB0ID09IDEgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlzX2FuaW1hdGUgPSBmYWxzZVxuICAgICAgICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdXJyZW50X2FuaW1hdGlvbiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgKCBvblZlbG9jaXR5RnJhbWUgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHN0b3BWZWxvY2l0eUZyYW1lICgpXG4gICAgIHtcbiAgICAgICAgICBpc19hbmltYXRlID0gZmFsc2VcbiAgICAgICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgKCBjdXJyZW50X2FuaW1hdGlvbiApXG4gICAgICAgICAgY29uZmlnLm9uRW5kQW5pbWF0aW9uICggY3VycmVudF9ldmVudCApXG4gICAgIH1cbn1cbiIsIlxuZXhwb3J0IHR5cGUgRXh0ZW5kZWRDU1NTdHlsZURlY2xhcmF0aW9uID0gQ1NTU3R5bGVEZWNsYXJhdGlvbiAmXG57XG4gICAgZGlzcGxheSAgICAgIDogXCJpbmxpbmVcIiB8IFwiYmxvY2tcIiB8IFwiY29udGVudHNcIiB8IFwiZmxleFwiIHwgXCJncmlkXCIgfCBcImlubGluZS1ibG9ja1wiIHwgXCJpbmxpbmUtZmxleFwiIHwgXCJpbmxpbmUtZ3JpZFwiIHwgXCJpbmxpbmUtdGFibGVcIiB8IFwibGlzdC1pdGVtXCIgfCBcInJ1bi1pblwiIHwgXCJ0YWJsZVwiIHwgXCJ0YWJsZS1jYXB0aW9uXCIgfCBcInRhYmxlLWNvbHVtbi1ncm91cFwiIHwgXCJ0YWJsZS1oZWFkZXItZ3JvdXBcIiB8IFwidGFibGUtZm9vdGVyLWdyb3VwXCIgfCBcInRhYmxlLXJvdy1ncm91cFwiIHwgXCJ0YWJsZS1jZWxsXCIgfCBcInRhYmxlLWNvbHVtblwiIHwgXCJ0YWJsZS1yb3dcIiB8IFwibm9uZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIGZsZXhEaXJlY3Rpb246IFwicm93XCIgfCBcInJvdy1yZXZlcnNlXCIgfCBcImNvbHVtblwiIHwgXCJjb2x1bW4tcmV2ZXJzZVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIG92ZXJmbG93ICAgICA6IFwidmlzaWJsZVwiIHwgXCJoaWRkZW5cIiB8IFwic2Nyb2xsXCIgfCBcImF1dG9cIiB8IFwiaW5pdGlhbFwiIHwgXCJpbmhlcml0XCJcbiAgICBvdmVyZmxvd1ggICAgOiBcInZpc2libGVcIiB8IFwiaGlkZGVuXCIgfCBcInNjcm9sbFwiIHwgXCJhdXRvXCIgfCBcImluaXRpYWxcIiB8IFwiaW5oZXJpdFwiXG4gICAgb3ZlcmZsb3dZICAgIDogXCJ2aXNpYmxlXCIgfCBcImhpZGRlblwiIHwgXCJzY3JvbGxcIiB8IFwiYXV0b1wiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxuICAgIHBvc2l0aW9uICAgICA6IFwic3RhdGljXCIgfCBcImFic29sdXRlXCIgfCBcImZpeGVkXCIgfCBcInJlbGF0aXZlXCIgfCBcInN0aWNreVwiIHwgXCJpbml0aWFsXCIgfCBcImluaGVyaXRcIlxufVxuXG4vKmRlY2xhcmUgZ2xvYmFse1xuXG4gICAgIGludGVyZmFjZSBXaW5kb3dcbiAgICAge1xuICAgICAgICAgIG9uOiBXaW5kb3cgW1wiYWRkRXZlbnRMaXN0ZW5lclwiXVxuICAgICAgICAgIG9mZjogV2luZG93IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSBFbGVtZW50XG4gICAgIHtcbiAgICAgICAgICBjc3MgKCBwcm9wZXJ0aWVzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+ICk6IHRoaXNcblxuICAgICAgICAgIGNzc0ludCAgICggcHJvcGVydHk6IHN0cmluZyApOiBudW1iZXJcbiAgICAgICAgICBjc3NGbG9hdCAoIHByb3BlcnR5OiBzdHJpbmcgKTogbnVtYmVyXG5cbiAgICAgICAgICBvbiA6IEhUTUxFbGVtZW50IFtcImFkZEV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICBvZmY6IEhUTUxFbGVtZW50IFtcInJlbW92ZUV2ZW50TGlzdGVuZXJcIl1cbiAgICAgICAgICAkICA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JcIl1cbiAgICAgICAgICAkJCA6IEhUTUxFbGVtZW50IFtcInF1ZXJ5U2VsZWN0b3JBbGxcIl1cbiAgICAgfVxufVxuXG5XaW5kb3cucHJvdG90eXBlLm9uICA9IFdpbmRvdy5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lclxuV2luZG93LnByb3RvdHlwZS5vZmYgPSBXaW5kb3cucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuY3NzID0gZnVuY3Rpb24gKCBwcm9wcyApXG57XG5PYmplY3QuYXNzaWduICggdGhpcy5zdHlsZSwgcHJvcHMgKVxucmV0dXJuIHRoaXNcbn1cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAoIHRoaXMgKSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59XG5cbkVsZW1lbnQucHJvdG90eXBlLmNzc0Zsb2F0ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VGbG9hdCAoIHRoaXMuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzICkgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG5FbGVtZW50LnByb3RvdHlwZS5vbiAgPSBFbGVtZW50LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyXG5cbkVsZW1lbnQucHJvdG90eXBlLm9mZiA9IEVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXJcblxuRWxlbWVudC5wcm90b3R5cGUuJCAgID0gRWxlbWVudC5wcm90b3R5cGUucXVlcnlTZWxlY3RvclxuXG5FbGVtZW50LnByb3RvdHlwZS4kJCAgPSBFbGVtZW50LnByb3RvdHlwZS5xdWVyeVNlbGVjdG9yQWxsXG5cblxuRWxlbWVudC5wcm90b3R5cGUuY3NzSW50ID0gZnVuY3Rpb24gKCBwcm9wZXJ0eTogc3RyaW5nIClcbntcbiAgICAgdmFyIHZhbHVlID0gcGFyc2VJbnQgKCB0aGlzLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCB0aGlzIClcblxuICAgICAgICAgIHZhbHVlID0gcGFyc2VJbnQgKCBzdHlsZSBbIHByb3BlcnR5IF0gKVxuXG4gICAgICAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAgICAgICAgICAgIHZhbHVlID0gMFxuICAgICB9XG5cbiAgICAgcmV0dXJuIHZhbHVlXG59Ki9cblxuZXhwb3J0IGZ1bmN0aW9uIGNzcyAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BzOiBQYXJ0aWFsIDxFeHRlbmRlZENTU1N0eWxlRGVjbGFyYXRpb24+IClcbntcbiAgICAgT2JqZWN0LmFzc2lnbiAoIGVsLnN0eWxlLCBwcm9wcyApXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjc3NGbG9hdCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUZsb2F0ICggZWwuc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICB7XG4gICAgICAgICAgdmFsdWUgPSBwYXJzZUZsb2F0ICggd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApIFsgcHJvcGVydHkgXSApXG5cbiAgICAgICAgICBpZiAoIE51bWJlci5pc05hTiAoIHZhbHVlICkgKVxuICAgICAgICAgICAgICAgdmFsdWUgPSAwXG4gICAgIH1cblxuICAgICByZXR1cm4gdmFsdWVcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNzc0ludCAoIGVsOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnQsIHByb3BlcnR5OiBzdHJpbmcgKVxue1xuICAgICB2YXIgdmFsdWUgPSBwYXJzZUludCAoIGVsLnN0eWxlIFsgcHJvcGVydHkgXSApXG5cbiAgICAgaWYgKCBOdW1iZXIuaXNOYU4gKCB2YWx1ZSApIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgKCBlbCApXG5cbiAgICAgICAgICB2YWx1ZSA9IHBhcnNlSW50ICggc3R5bGUgWyBwcm9wZXJ0eSBdIClcblxuICAgICAgICAgIGlmICggTnVtYmVyLmlzTmFOICggdmFsdWUgKSApXG4gICAgICAgICAgICAgICB2YWx1ZSA9IDBcbiAgICAgfVxuXG4gICAgIHJldHVybiB2YWx1ZVxufVxuXG4iLCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5pbXBvcnQgeyBjc3NJbnQgfSBmcm9tIFwiLi9kb20uanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxuXG4vL2V4cG9ydCB0eXBlIEV4cGVuZGFibGVQcm9wZXJ0eSA9IFwid2lkdGhcIiB8IFwiaGVpZ2h0XCJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgXCJ0b3BcIiB8IFwibGVmdFwiIHwgXCJib3R0b21cIiB8IFwicmlnaHRcIlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBcInhcIiB8IFwieVwiXG5cbmV4cG9ydCB0eXBlIEV4cGVuZGFibGVFbGVtZW50ID0gUmV0dXJuVHlwZSA8dHlwZW9mIGV4cGFuZGFibGU+XG5cbnR5cGUgRXhwZW5kYWJsZU9wdGlvbnMgPSBQYXJ0aWFsIDxFeHBlbmRhYmxlQ29uZmlnPlxuXG5pbnRlcmZhY2UgRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzICAgICAgOiBKU1guRWxlbWVudCBbXVxuICAgICBwcm9wZXJ0eT8gICAgOiBzdHJpbmcsXG4gICAgIG9wZW4gICAgICAgICA6IGJvb2xlYW5cbiAgICAgbmVhciAgICAgICAgIDogbnVtYmVyXG4gICAgIGRlbGF5ICAgICAgICA6IG51bWJlclxuICAgICBkaXJlY3Rpb24gICAgOiBEaXJlY3Rpb25cbiAgICAgbWluU2l6ZSAgICAgIDogbnVtYmVyXG4gICAgIG1heFNpemUgICAgICA6IG51bWJlclxuICAgICB1bml0ICAgICAgICAgOiBcInB4XCIgfCBcIiVcIiB8IFwiXCIsXG4gICAgIG9uQmVmb3JlT3BlbiA6ICgpID0+IHZvaWRcbiAgICAgb25BZnRlck9wZW4gIDogKCkgPT4gdm9pZFxuICAgICBvbkJlZm9yZUNsb3NlOiAoKSA9PiB2b2lkXG4gICAgIG9uQWZ0ZXJDbG9zZSA6ICgpID0+IHZvaWRcbn1cblxuY29uc3QgdmVydGljYWxQcm9wZXJ0aWVzID0gWyBcImhlaWdodFwiLCBcInRvcFwiLCBcImJvdHRvbVwiIF1cblxuZnVuY3Rpb24gZGVmYXVsdENvbmZpZyAoKTogRXhwZW5kYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgICAgICA6IFtdLFxuICAgICAgICAgIHByb3BlcnR5ICAgICA6IFwiaGVpZ2h0XCIsXG4gICAgICAgICAgb3BlbiAgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgbmVhciAgICAgICAgIDogNDAsXG4gICAgICAgICAgZGVsYXkgICAgICAgIDogMjUwLFxuICAgICAgICAgIG1pblNpemUgICAgICA6IDAsXG4gICAgICAgICAgbWF4U2l6ZSAgICAgIDogd2luZG93LmlubmVySGVpZ2h0LFxuICAgICAgICAgIHVuaXQgICAgICAgICA6IFwicHhcIixcbiAgICAgICAgICBkaXJlY3Rpb24gICAgOiBcInRiXCIsXG4gICAgICAgICAgb25CZWZvcmVPcGVuIDogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4ge30sXG4gICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4ge30sXG4gICAgICAgICAgb25BZnRlckNsb3NlIDogKCkgPT4ge30sXG4gICAgIH1cbn1cblxuY29uc3QgdG9TaWduID0ge1xuICAgICBsciA6IDEsXG4gICAgIHJsIDogLTEsXG4gICAgIHRiIDogLTEsXG4gICAgIGJ0IDogMSxcbn1cbmNvbnN0IHRvUHJvcGVydHkgOiBSZWNvcmQgPERpcmVjdGlvbiwgc3RyaW5nPiA9IHtcbiAgICAgbHIgOiBcIndpZHRoXCIsXG4gICAgIHJsIDogXCJ3aWR0aFwiLFxuICAgICB0YiA6IFwiaGVpZ2h0XCIsXG4gICAgIGJ0IDogXCJoZWlnaHRcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZGFibGUgKCBlbGVtZW50OiBKU1guRWxlbWVudCwgb3B0aW9uczogRXhwZW5kYWJsZU9wdGlvbnMgPSB7fSApXG57XG4gICAgIGNvbnN0IGNvbmZpZyA9IGRlZmF1bHRDb25maWcgKClcblxuICAgICB2YXIgaXNfb3BlbiAgICA6IGJvb2xlYW5cbiAgICAgdmFyIGlzX3ZlcnRpY2FsOiBib29sZWFuXG4gICAgIHZhciBzaWduICAgICAgIDogbnVtYmVyXG4gICAgIHZhciB1bml0ICAgICAgIDogRXhwZW5kYWJsZUNvbmZpZyBbXCJ1bml0XCJdXG4gICAgIHZhciBjYiAgICAgICAgIDogKCkgPT4gdm9pZFxuICAgICB2YXIgbWluU2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgbWF4U2l6ZSAgICA6IG51bWJlclxuICAgICB2YXIgc3RhcnRfc2l6ZSAgPSAwXG4gICAgIHZhciBvcGVuX3NpemUgICA9IDEwMFxuXG4gICAgIGNvbnN0IGRyYWdnYWJsZSA9IFVpLmRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXMgICAgICAgOiBbXSxcbiAgICAgICAgICBvblN0YXJ0RHJhZyAgIDogb25TdGFydERyYWcsXG4gICAgICAgICAgb25TdG9wRHJhZyAgICA6IG9uU3RvcERyYWcsXG4gICAgICAgICAgb25FbmRBbmltYXRpb246IG9uRW5kQW5pbWF0aW9uLFxuICAgICB9KVxuXG4gICAgIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgKVxuXG4gICAgIGZ1bmN0aW9uIHVwZGF0ZUNvbmZpZyAoIG9wdGlvbnMgPSB7fSBhcyBFeHBlbmRhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG9wdGlvbnMucHJvcGVydHkgPT0gdW5kZWZpbmVkICYmIG9wdGlvbnMuZGlyZWN0aW9uICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICBvcHRpb25zLnByb3BlcnR5ID0gdG9Qcm9wZXJ0eSBbb3B0aW9ucy5kaXJlY3Rpb25dXG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlzX29wZW4gICAgID0gY29uZmlnLm9wZW5cbiAgICAgICAgICBzaWduICAgICAgICA9IHRvU2lnbiBbY29uZmlnLmRpcmVjdGlvbl1cbiAgICAgICAgICB1bml0ICAgICAgICA9IGNvbmZpZy51bml0XG4gICAgICAgICAgaXNfdmVydGljYWwgPSBjb25maWcuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBjb25maWcuZGlyZWN0aW9uID09IFwidGJcIiA/IHRydWUgOiBmYWxzZVxuICAgICAgICAgIG1pblNpemUgPSBjb25maWcubWluU2l6ZVxuICAgICAgICAgIG1heFNpemUgPSBjb25maWcubWF4U2l6ZVxuXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlICggaXNfdmVydGljYWwgPyBcImhvcml6b250YWxcIiA6IFwidmVydGljYWxcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICAgICggaXNfdmVydGljYWwgPyBcInZlcnRpY2FsXCIgOiBcImhvcml6b250YWxcIiApXG5cbiAgICAgICAgICBkcmFnZ2FibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBoYW5kbGVzOiBjb25maWcuaGFuZGxlcyxcbiAgICAgICAgICAgICAgIG9uRHJhZyA6IGlzX3ZlcnRpY2FsID8gb25EcmFnVmVydGljYWw6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgfSlcbiAgICAgfVxuICAgICBmdW5jdGlvbiBzaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gaXNfb3BlbiA/IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApIDogMFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIHRvZ2dsZSAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBpc19vcGVuIClcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgb3BlbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9wZW4gKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZU9wZW4gKClcblxuICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAoIFwiYW5pbWF0ZVwiIClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZXBsYWNlICggXCJjbG9zZVwiLCBcIm9wZW5cIiApXG5cbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIG9uVHJhbnNpdGlvbkVuZCAoKVxuXG4gICAgICAgICAgY2IgPSBjb25maWcub25BZnRlck9wZW5cbiAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgKCBcInRyYW5zaXRpb25lbmRcIiwgKCkgPT4gb25UcmFuc2l0aW9uRW5kIClcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgWyBjb25maWcucHJvcGVydHkgXSA9IG9wZW5fc2l6ZSArIHVuaXRcblxuICAgICAgICAgIGlzX29wZW4gPSB0cnVlXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gY2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIGNvbmZpZy5vbkJlZm9yZUNsb3NlICgpXG5cbiAgICAgICAgICBvcGVuX3NpemUgPSBzaXplICgpXG5cbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVwbGFjZSAoIFwib3BlblwiLCBcImNsb3NlXCIgKVxuXG4gICAgICAgICAgaWYgKCBjYiApXG4gICAgICAgICAgICAgICBvblRyYW5zaXRpb25FbmQgKClcblxuICAgICAgICAgIGNiID0gY29uZmlnLm9uQWZ0ZXJDbG9zZVxuICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAoIFwidHJhbnNpdGlvbmVuZFwiLCBvblRyYW5zaXRpb25FbmQgKVxuXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gXCIwXCIgKyB1bml0XG5cbiAgICAgICAgICBpc19vcGVuID0gZmFsc2VcbiAgICAgfVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgdXBkYXRlQ29uZmlnLFxuICAgICAgICAgIG9wZW4sXG4gICAgICAgICAgY2xvc2UsXG4gICAgICAgICAgdG9nZ2xlLFxuICAgICAgICAgIGlzT3BlbiAgICAgOiAoKSA9PiBpc19vcGVuLFxuICAgICAgICAgIGlzQ2xvc2UgICAgOiAoKSA9PiAhIGlzX29wZW4sXG4gICAgICAgICAgaXNWZXJ0aWNhbCA6ICgpID0+IGlzX3ZlcnRpY2FsLFxuICAgICAgICAgIGlzQWN0aXZlICAgOiAoKSA9PiBkcmFnZ2FibGUuaXNBY3RpdmUgKCksXG4gICAgICAgICAgYWN0aXZhdGUgICA6ICgpID0+IGRyYWdnYWJsZS5hY3RpdmF0ZSAoKSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZTogKCkgPT4gZHJhZ2dhYmxlLmRlc2FjdGl2YXRlICgpLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gb25UcmFuc2l0aW9uRW5kICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGNiIClcbiAgICAgICAgICAgICAgIGNiICgpXG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ0cmFuc2l0aW9uZW5kXCIsICgpID0+IG9uVHJhbnNpdGlvbkVuZCApXG4gICAgICAgICAgY2IgPSBudWxsXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgc3RhcnRfc2l6ZSA9IHNpemUgKClcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnVmVydGljYWwgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnNvbGUubG9nICggbWluU2l6ZSwgZXZlbnQueSwgbWF4U2l6ZSApXG4gICAgICAgICAgY29uc29sZS5sb2cgKCBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueSApICsgdW5pdCApXG4gICAgICAgICAgZWxlbWVudC5zdHlsZSBbIGNvbmZpZy5wcm9wZXJ0eSBdID0gY2xhbXAgKCBzdGFydF9zaXplICsgc2lnbiAqIGV2ZW50LnkgKSArIHVuaXRcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFsgY29uZmlnLnByb3BlcnR5IF0gPSBjbGFtcCAoIHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQueCApICsgdW5pdFxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWcgKCBldmVudDogVWkuRHJhZ0V2ZW50IClcbiAgICAge1xuICAgICAgICAgIHZhciBpc19tb3ZlZCA9IGlzX3ZlcnRpY2FsID8gc2lnbiAqIGV2ZW50LnkgPiBjb25maWcubmVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogc2lnbiAqIGV2ZW50LnggPiBjb25maWcubmVhclxuXG4gICAgICAgICAgaWYgKCAoaXNfbW92ZWQgPT0gZmFsc2UpICYmIGV2ZW50LmRlbGF5IDw9IGNvbmZpZy5kZWxheSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdG9nZ2xlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB0YXJnZXRfc2l6ZSA9IGNsYW1wIChcbiAgICAgICAgICAgICAgIGlzX3ZlcnRpY2FsID8gc3RhcnRfc2l6ZSArIHNpZ24gKiBldmVudC50YXJnZXRZXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA6IHN0YXJ0X3NpemUgKyBzaWduICogZXZlbnQudGFyZ2V0WFxuICAgICAgICAgIClcblxuICAgICAgICAgIGlmICggdGFyZ2V0X3NpemUgPD0gY29uZmlnLm5lYXIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNsb3NlICgpXG4gICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25FbmRBbmltYXRpb24gKClcbiAgICAge1xuICAgICAgICAgIG9wZW5fc2l6ZSA9IGNzc0ludCAoIGVsZW1lbnQsIGNvbmZpZy5wcm9wZXJ0eSApXG4gICAgICAgICAgb3BlbiAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gY2xhbXAgKCB2OiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB2IDwgbWluU2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWluU2l6ZVxuXG4gICAgICAgICAgaWYgKCB2ID4gbWF4U2l6ZSApXG4gICAgICAgICAgICAgICByZXR1cm4gbWF4U2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHZcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBDc3MgfSBmcm9tIFwiLi4vLi4vTGliL2luZGV4LmpzXCJcbmltcG9ydCB7IGNzc0Zsb2F0IH0gZnJvbSBcIi4vZG9tLmpzXCJcbmltcG9ydCAqIGFzIFVpIGZyb20gXCIuL2RyYWdnYWJsZS5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuL3hub2RlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gICA9IFwibHJcIiB8IFwicmxcIiB8IFwiYnRcIiB8IFwidGJcIlxudHlwZSBPcmllbnRhdGlvbiA9IFwidmVydGljYWxcIiB8IFwiaG9yaXpvbnRhbFwiXG50eXBlIFVuaXRzICAgICAgID0gXCJweFwiIHwgXCIlXCJcbnR5cGUgU3dpcGVhYmxlUHJvcGVydHkgPSBcInRvcFwiIHwgXCJsZWZ0XCIgfCBcImJvdHRvbVwiIHwgXCJyaWdodFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgfCBcInhcIiB8IFwieVwiXG5cbnR5cGUgU3dpcGVhYmxlT3B0aW9ucyA9IFBhcnRpYWwgPFN3aXBlYWJsZUNvbmZpZz5cblxudHlwZSBTd2lwZWFibGVDb25maWcgPSB7XG4gICAgIGhhbmRsZXMgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGRpcmVjdGlvbiA6IERpcmVjdGlvbixcbiAgICAgcG9ycGVydHk/IDogU3dpcGVhYmxlUHJvcGVydHlcbiAgICAgbWluVmFsdWUgIDogbnVtYmVyLFxuICAgICBtYXhWYWx1ZSAgOiBudW1iZXIsXG4gICAgIHVuaXRzICAgICA6IFVuaXRzLFxuICAgICBtb3VzZVdoZWVsOiBib29sZWFuXG59XG5cbmV4cG9ydCB0eXBlIFN3aXBlYWJsZUVsZW1lbnQgPSBSZXR1cm5UeXBlIDx0eXBlb2Ygc3dpcGVhYmxlPlxuXG5mdW5jdGlvbiBkZWZhdWx0Q29uZmlnICgpOiBTd2lwZWFibGVDb25maWdcbntcbiAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoYW5kbGVzICAgOiBbXSxcbiAgICAgICAgICBkaXJlY3Rpb24gOiBcImxyXCIsXG4gICAgICAgICAgcG9ycGVydHkgIDogXCJsZWZ0XCIsXG4gICAgICAgICAgbWluVmFsdWUgIDogLTEwMCxcbiAgICAgICAgICBtYXhWYWx1ZSAgOiAwLFxuICAgICAgICAgIHVuaXRzICAgICA6IFwiJVwiLFxuICAgICAgICAgIG1vdXNlV2hlZWw6IHRydWUsXG4gICAgIH1cbn1cblxudmFyIHN0YXJ0X3Bvc2l0aW9uID0gMFxudmFyIGlzX3ZlcnRpY2FsICAgID0gZmFsc2VcbnZhciBwcm9wIDogU3dpcGVhYmxlUHJvcGVydHlcblxuZXhwb3J0IGZ1bmN0aW9uIHN3aXBlYWJsZSAoIGVsZW1lbnQ6IEpTWC5FbGVtZW50LCBvcHRpb25zOiBTd2lwZWFibGVPcHRpb25zIClcbntcbiAgICAgY29uc3QgY29uZmlnID0gZGVmYXVsdENvbmZpZyAoKVxuXG4gICAgIGNvbnN0IGRyYWdnYWJsZSA9IFVpLmRyYWdnYWJsZSAoe1xuICAgICAgICAgIGhhbmRsZXM6IFtdLFxuICAgICAgICAgIG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uU3RvcERyYWcsXG4gICAgIH0pXG5cbiAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkICggXCJzd2lwZWFibGVcIiApXG5cbiAgICAgdXBkYXRlQ29uZmlnICggb3B0aW9ucyApXG5cbiAgICAgZnVuY3Rpb24gdXBkYXRlQ29uZmlnICggb3B0aW9uczogU3dpcGVhYmxlT3B0aW9ucyApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIGlzX3ZlcnRpY2FsID0gY29uZmlnLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgY29uZmlnLmRpcmVjdGlvbiA9PSBcInRiXCJcblxuICAgICAgICAgIGlmICggb3B0aW9ucy5wb3JwZXJ0eSA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgY29uZmlnLnBvcnBlcnR5ID0gaXNfdmVydGljYWwgPyBcInRvcFwiIDogXCJsZWZ0XCJcblxuICAgICAgICAgIC8vIHN3aXRjaCAoIGNvbmZpZy5wb3JwZXJ0eSApXG4gICAgICAgICAgLy8ge1xuICAgICAgICAgIC8vIGNhc2UgXCJ0b3BcIjogY2FzZSBcImJvdHRvbVwiOiBjYXNlIFwieVwiOiBpc192ZXJ0aWNhbCA9IHRydWUgIDsgYnJlYWtcbiAgICAgICAgICAvLyBjYXNlIFwibGVmdFwiOiBjYXNlIFwicmlnaHRcIjogY2FzZSBcInhcIjogaXNfdmVydGljYWwgPSBmYWxzZSA7IGJyZWFrXG4gICAgICAgICAgLy8gZGVmYXVsdDogZGVidWdnZXIgOyByZXR1cm5cbiAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICBkcmFnZ2FibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBoYW5kbGVzOiBjb25maWcuaGFuZGxlcyxcbiAgICAgICAgICAgICAgIG9uRHJhZzogaXNfdmVydGljYWwgPyBvbkRyYWdWZXJ0aWNhbCA6IG9uRHJhZ0hvcml6b250YWxcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcHJvcCA9IGNvbmZpZy5wb3JwZXJ0eVxuXG4gICAgICAgICAgaWYgKCBkcmFnZ2FibGUuaXNBY3RpdmUgKCkgKVxuICAgICAgICAgICAgICAgYWN0aXZlRXZlbnRzICgpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgZGVzYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBwb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIGNzc0Zsb2F0ICggZWxlbWVudCwgcHJvcCApXG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBhY3RpdmF0ZSAoKVxuICAgICB7XG4gICAgICAgICAgZHJhZ2dhYmxlLmFjdGl2YXRlICgpXG4gICAgICAgICAgYWN0aXZlRXZlbnRzICgpXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gZGVzYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGRyYWdnYWJsZS5kZXNhY3RpdmF0ZSAoKVxuICAgICAgICAgIGRlc2FjdGl2ZUV2ZW50cyAoKVxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gc3dpcGUgKCBvZmZzZXQ6IHN0cmluZyApOiB2b2lkXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBudW1iZXIsIHVuaXRzOiBVbml0cyApOiB2b2lkXG4gICAgIGZ1bmN0aW9uIHN3aXBlICggb2Zmc2V0OiBzdHJpbmd8bnVtYmVyLCB1PzogVW5pdHMgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHUgPSBDc3MuZ2V0VW5pdCAoIG9mZnNldCApIGFzIFVuaXRzXG4gICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0ICggb2Zmc2V0IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoICEgW1wicHhcIiwgXCIlXCJdLmluY2x1ZGVzICggdSApIClcbiAgICAgICAgICAgICAgIHUgPSBcInB4XCJcblxuICAgICAgICAgIGlmICggdSAhPSBjb25maWcudW5pdHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggKHUgPSBjb25maWcudW5pdHMpID09IFwiJVwiIClcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gdG9QZXJjZW50cyAoIG9mZnNldCApXG4gICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IHRvUGl4ZWxzICggb2Zmc2V0IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggb2Zmc2V0ICkgKyB1XG4gICAgIH1cblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIHVwZGF0ZUNvbmZpZyxcbiAgICAgICAgICBhY3RpdmF0ZSxcbiAgICAgICAgICBkZXNhY3RpdmF0ZSxcbiAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICBzd2lwZSxcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGFjdGl2ZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBjb25maWcubW91c2VXaGVlbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgaCBvZiBjb25maWcuaGFuZGxlcyApXG4gICAgICAgICAgICAgICAgICAgIGguYWRkRXZlbnRMaXN0ZW5lciAoIFwid2hlZWxcIiwgb25XaGVlbCwgeyBwYXNzaXZlOiB0cnVlIH0gKVxuICAgICAgICAgIH1cbiAgICAgfVxuICAgICBmdW5jdGlvbiBkZXNhY3RpdmVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2YgY29uZmlnLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5yZW1vdmVFdmVudExpc3RlbmVyICggXCJ3aGVlbFwiLCBvbldoZWVsIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIHRvUGl4ZWxzICggcGVyY2VudGFnZTogbnVtYmVyIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgbWluVmFsdWU6IG1pbiwgbWF4VmFsdWU6IG1heCB9ID0gY29uZmlnXG5cbiAgICAgICAgICBpZiAoIHBlcmNlbnRhZ2UgPCAxMDAgKVxuICAgICAgICAgICAgICAgcGVyY2VudGFnZSA9IDEwMCArIHBlcmNlbnRhZ2VcblxuICAgICAgICAgIHJldHVybiBtaW4gKyAobWF4IC0gbWluKSAqIHBlcmNlbnRhZ2UgLyAxMDBcbiAgICAgfVxuICAgICBmdW5jdGlvbiB0b1BlcmNlbnRzICggcGl4ZWxzOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBtaW5WYWx1ZTogbWluLCBtYXhWYWx1ZTogbWF4IH0gPSBjb25maWdcbiAgICAgICAgICByZXR1cm4gTWF0aC5hYnMgKCAocGl4ZWxzIC0gbWluKSAvIChtYXggLSBtaW4pICogMTAwIClcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIG9uU3RhcnREcmFnICgpXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUgKCBcImFuaW1hdGVcIiApXG4gICAgICAgICAgc3RhcnRfcG9zaXRpb24gPSBwb3NpdGlvbiAoKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC55ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbkRyYWdIb3Jpem9udGFsICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LnN0eWxlIFtwcm9wXSA9IGNsYW1wICggc3RhcnRfcG9zaXRpb24gKyBldmVudC54ICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvblN0b3BEcmFnICggZXZlbnQ6IFVpLkRyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQgKCBcImFuaW1hdGVcIiApXG5cbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSBpc192ZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gZXZlbnQueSAvLysgZXZlbnQudmVsb2NpdHlZXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBldmVudC54IC8vKyBldmVudC52ZWxvY2l0eVhcblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBzdGFydF9wb3NpdGlvbiArIG9mZnNldCApICsgY29uZmlnLnVuaXRzXG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgfVxuICAgICBmdW5jdGlvbiBvbldoZWVsICggZXZlbnQ6IFdoZWVsRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBldmVudC5kZWx0YU1vZGUgIT0gV2hlZWxFdmVudC5ET01fREVMVEFfUElYRUwgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBpZiAoIGlzX3ZlcnRpY2FsIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgZGVsdGEgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHZhciBkZWx0YSA9IGV2ZW50LmRlbHRhWFxuXG4gICAgICAgICAgICAgICBpZiAoIGRlbHRhID09IDAgKVxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IGV2ZW50LmRlbHRhWVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGVsZW1lbnQuc3R5bGUgW3Byb3BdID0gY2xhbXAgKCBwb3NpdGlvbiAoKSArIGRlbHRhICkgKyBjb25maWcudW5pdHNcbiAgICAgfVxuICAgICBmdW5jdGlvbiBjbGFtcCAoIHZhbHVlOiBudW1iZXIgKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlIDwgY29uZmlnLm1pblZhbHVlID8gY29uZmlnLm1pblZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlID4gY29uZmlnLm1heFZhbHVlID8gY29uZmlnLm1heFZhbHVlXG4gICAgICAgICAgICAgICA6IHZhbHVlXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbi8vaW1wb3J0ICogYXMgRmFjdG9yeSBmcm9tIFwiLi9mYWN0b3J5LmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgdHlwZSBHZW9tZXRyeU5hbWVzID0ga2V5b2YgdHlwZW9mIEZhY3RvcnlcblxuICAgICBpbnRlcmZhY2UgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBzaGFwZTogR2VvbWV0cnlOYW1lc1xuICAgICAgICAgIHggICAgICAgICA6IG51bWJlclxuICAgICAgICAgIHkgICAgICAgICA6IG51bWJlclxuXG4gICAgICAgICAgYm9yZGVyV2lkdGggICAgOiBudW1iZXJcbiAgICAgICAgICBib3JkZXJDb2xvciAgICA6IHN0cmluZ1xuXG4gICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogc3RyaW5nXG4gICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogYm9vbGVhblxuICAgICB9XG5cbiAgICAgaW50ZXJmYWNlICRUZXh0RGVmaW5pdGlvbiBleHRlbmRzICRHZW9tZXRyeVxuICAgICB7XG4gICAgICAgICAgdGV4dDogc3RyaW5nXG4gICAgIH1cblxuICAgICBpbnRlcmZhY2UgJFBhdGhEZWZpbml0aW9uIGV4dGVuZHMgJEdlb21ldHJ5XG4gICAgIHtcbiAgICAgICAgICBwYXRoOiBzdHJpbmdcbiAgICAgfVxufVxuXG5jb25zdCBmYWJyaWNfYmFzZV9vYnRpb25zOiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgPSB7XG4gICAgIGxlZnQgICA6IDAsXG4gICAgIHRvcCAgICA6IDAsXG4gICAgIG9yaWdpblg6IFwiY2VudGVyXCIsXG4gICAgIG9yaWdpblk6IFwiY2VudGVyXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBncm91cCAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklDaXJjbGVPcHRpb25zIClcbntcbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuR3JvdXAgKCB1bmRlZmluZWQsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHdpZHRoOiBzaXplLFxuICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgfSlcbn1cblxuLy8gVG8gZ2V0IHBvaW50cyBvZiB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb25cbi8vXG4vLyB2YXIgYSA9IE1hdGguUEkqMi80XG4vLyBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IDQgOyBpKysgKVxuLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG5leHBvcnQgZnVuY3Rpb24gY2lyY2xlICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSUNpcmNsZU9wdGlvbnMgKVxue1xuXG4gICAgIHJldHVybiBuZXcgZmFicmljLkNpcmNsZSAoXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDIsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmlhbmdsZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklUcmlhbmdsZU9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMlxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg3LCAtMC40OTk5OTk5OTk5OTk5OTk4IF0sXG4gICAgICAgICAgWyAtMC44NjYwMjU0MDM3ODQ0Mzg1LCAtMC41MDAwMDAwMDAwMDAwMDA0IF1cbiAgICAgXSkgcG9pbnRzLnB1c2ggKHsgeDogcFswXSAqIHIsIHk6IHBbMV0gKiByIH0pXG5cbiAgICAgcmV0dXJuIG5ldyBmYWJyaWMuUG9seWdvbiAoIHBvaW50cywge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgYW5nbGU6IDE4MCxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNxdWFyZSAoIGRlZjogJEdlb21ldHJ5LCBzaXplOiBudW1iZXIsIG9wdDogZmFicmljLklSZWN0T3B0aW9ucyApXG57XG4gICAgIGNvbnN0IHNjYWxlID0gMC45XG4gICAgIHJldHVybiBuZXcgZmFicmljLlJlY3QgKFxuICAgICB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICB3aWR0aCA6IHNpemUgKiBzY2FsZSxcbiAgICAgICAgICBoZWlnaHQ6IHNpemUgKiBzY2FsZSxcbiAgICAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhbnRhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC45NTEwNTY1MTYyOTUxNTM1LCAwLjMwOTAxNjk5NDM3NDk0NzQ1IF0sXG4gICAgICAgICAgWyAwLjU4Nzc4NTI1MjI5MjQ3MzIsIC0wLjgwOTAxNjk5NDM3NDk0NzMgXSxcbiAgICAgICAgICBbIC0wLjU4Nzc4NTI1MjI5MjQ3MywgLTAuODA5MDE2OTk0Mzc0OTQ3NSBdLFxuICAgICAgICAgIFsgLTAuOTUxMDU2NTE2Mjk1MTUzNiwgMC4zMDkwMTY5OTQzNzQ5NDcyMyBdXG4gICAgIF0pIHBvaW50cy5wdXNoICh7IHg6IHBbMF0gKiByLCB5OiBwWzFdICogciB9KVxuXG4gICAgIHJldHVybiBuZXcgZmFicmljLlBvbHlnb24gKCBwb2ludHMsIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIGFuZ2xlOiAxODAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoZXhhZ29uICggZGVmOiAkR2VvbWV0cnksIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgICBjb25zdCBzY2FsZSA9IDEuMVxuICAgICBjb25zdCByID0gc2l6ZSAvIDIgKiBzY2FsZVxuXG4gICAgIGZvciAoIGNvbnN0IHAgb2YgW1xuICAgICAgICAgIFsgMCwgMSBdLFxuICAgICAgICAgIFsgMC44NjYwMjU0MDM3ODQ0Mzg2LCAwLjUwMDAwMDAwMDAwMDAwMDEgXSxcbiAgICAgICAgICBbIDAuODY2MDI1NDAzNzg0NDM4NywgLTAuNDk5OTk5OTk5OTk5OTk5OCBdLFxuICAgICAgICAgIFsgMS4yMjQ2NDY3OTkxNDczNTMyZS0xNiwgLTEgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzODUsIC0wLjUwMDAwMDAwMDAwMDAwMDQgXSxcbiAgICAgICAgICBbIC0wLjg2NjAyNTQwMzc4NDQzOSwgMC40OTk5OTk5OTk5OTk5OTkzMyBdLFxuICAgICBdKSBwb2ludHMucHVzaCAoeyB4OiBwWzBdICogciwgeTogcFsxXSAqIHIgfSlcblxuICAgICByZXR1cm4gbmV3IGZhYnJpYy5Qb2x5Z29uICggcG9pbnRzLCB7XG4gICAgICAgICAgLi4uIGZhYnJpY19iYXNlX29idGlvbnMsXG4gICAgICAgICAgLi4uIG9wdCxcbiAgICAgICAgICBhbmdsZTogOTAsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0Ym94ICggZGVmOiAkVGV4dERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuVGV4dE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5UZXh0Ym94ICggXCIuLi5cIiwge1xuICAgICAgICAgIC4uLiBmYWJyaWNfYmFzZV9vYnRpb25zLFxuICAgICAgICAgIC4uLiBvcHQsXG4gICAgICAgICAgZm9udFNpemU6IHNpemUsXG4gICAgIH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoICggZGVmOiAkUGF0aERlZmluaXRpb24sIHNpemU6IG51bWJlciwgb3B0OiBmYWJyaWMuSU9iamVjdE9wdGlvbnMgKVxue1xuICAgICByZXR1cm4gbmV3IGZhYnJpYy5QYXRoICggZGVmLnBhdGgsXG4gICAgIHtcbiAgICAgICAgICAuLi4gZmFicmljX2Jhc2Vfb2J0aW9ucyxcbiAgICAgICAgICAuLi4gb3B0LFxuICAgICAgICAgIHNjYWxlWDogc2l6ZSAvIDEwMCwgLy8gRW4gc3VwcG9zYW50IHF1ZSBsZSB2aWV3Qm94XG4gICAgICAgICAgc2NhbGVZOiBzaXplIC8gMTAwLCAvLyBlc3QgXCIwIDAgMTAwIDEwMFwiXG4gICAgIH0pXG59XG5cbmNvbnN0IEZhY3RvcnkgPSB7XG4gICAgIGdyb3VwLFxuICAgICBjaXJjbGUsXG4gICAgIHRyaWFuZ2xlLFxuICAgICBzcXVhcmUsXG4gICAgIHBhbnRhZ29uLFxuICAgICBoZXhhZ29uICxcbiAgICAgdGV4dCxcbiAgICAgdGV4dGJveCAsXG4gICAgIHBhdGgsXG59XG5cblxuZXhwb3J0IGNsYXNzIEdlb21ldHJ5IDxUIGV4dGVuZHMgR2VvbWV0cnlOYW1lcyA9IEdlb21ldHJ5TmFtZXM+XG57XG4gICAgIGNvbmZpZzogJEdlb21ldHJ5XG4gICAgIG9iamVjdDogUmV0dXJuVHlwZSA8dHlwZW9mIEZhY3RvcnkgW1RdPlxuXG4gICAgIGNvbnN0cnVjdG9yICggcmVhZG9ubHkgb3duZXI6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuY29uZmlnID0gb3duZXIuY29uZmlnXG4gICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICggb3B0aW9uczogUGFydGlhbCA8JEdlb21ldHJ5PiApXG4gICAgIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduICggdGhpcy5jb25maWcsIG9wdGlvbnMgKVxuXG4gICAgICAgICAgaWYgKCBcInNoYXBlXCIgaW4gb3B0aW9ucyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTaGFwZSAoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICggXCJiYWNrZ3JvdW5kSW1hZ2VcIiBpbiBvcHRpb25zIHx8IFwiYmFja2dyb3VuZFJlcGVhdFwiIGluIG9wdGlvbnMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgdXBkYXRlUG9zaXRpb24gKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgY29uZmlnLCBvYmplY3QgfSA9IHRoaXNcblxuICAgICAgICAgIDsob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgbGVmdDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgOiBjb25maWcueSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIsIGNvbmZpZywgb2JqZWN0IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBzaXplID0gb3duZXIuZGlzcGxheVNpemUgKClcblxuICAgICAgICAgIGlmICggY29uZmlnLnNoYXBlID09IFwiY2lyY2xlXCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIChvYmplY3QgYXMgZmFicmljLkNpcmNsZSkuc2V0ICh7XG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogc2l6ZSAvIDJcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAob2JqZWN0IGFzIGZhYnJpYy5PYmplY3QpLnNldCAoe1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA6IHNpemUsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JqZWN0LnNldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlU2hhcGUgKCBzaGFwZT86IEdlb21ldHJ5TmFtZXMgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBjb25maWcsIG93bmVyIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgICAgICBzaGFwZSA9IGNvbmZpZy5zaGFwZVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbmZpZy5zaGFwZSA9IHNoYXBlXG5cbiAgICAgICAgICBpZiAoIG93bmVyLmdyb3VwICE9IHVuZGVmaW5lZCAmJiB0aGlzLm9iamVjdCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgb3duZXIuZ3JvdXAucmVtb3ZlICggdGhpcy5vYmplY3QgKVxuXG4gICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy5vYmplY3RcbiAgICAgICAgICAgICAgICAgICAgPSBGYWN0b3J5IFtjb25maWcuc2hhcGUgYXMgYW55XSAoIGNvbmZpZywgb3duZXIuZGlzcGxheVNpemUgKCksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogMCwgLy9jb25maWcueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgICAgICAgIDogMCwgLy9jb25maWcueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5YICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsICAgICAgIDogY29uZmlnLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICBzdHJva2UgICAgIDogY29uZmlnLmJvcmRlckNvbG9yLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZVdpZHRoOiBjb25maWcuYm9yZGVyV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICBvd25lci5ncm91cC5hZGQgKCBvYmogKVxuICAgICAgICAgIG9iai5zZW5kVG9CYWNrICgpXG5cbiAgICAgICAgICBpZiAoIGNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQmFja2dyb3VuZEltYWdlICgpXG5cbiAgICAgICAgICBpZiAoIG9iai5jYW52YXMgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIG9iai5jYW52YXMucmVxdWVzdFJlbmRlckFsbCAoKVxuXG4gICAgIH1cblxuICAgICB1cGRhdGVCYWNrZ3JvdW5kSW1hZ2UgKCBwYXRoPzogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHBhdGggPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kSW1hZ2UgPSBwYXRoXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBwYXRoID09IFwic3RyaW5nXCIgJiYgcGF0aC5sZW5ndGggPiAwIClcbiAgICAgICAgICAgICAgIGZhYnJpYy51dGlsLmxvYWRJbWFnZSAoIHBhdGgsIHRoaXMub25fcGF0dGVybi5iaW5kICh0aGlzKSApXG4gICAgIH1cblxuICAgICBwcml2YXRlIG9uX3BhdHRlcm4gKCBkaW1nOiBIVE1MSW1hZ2VFbGVtZW50IClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgb3duZXIgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGZhY3RvciA9IGRpbWcud2lkdGggPCBkaW1nLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gb3duZXIuZGlzcGxheVNpemUgKCkgLyBkaW1nLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBvd25lci5kaXNwbGF5U2l6ZSAoKSAvIGRpbWcuaGVpZ2h0XG5cbiAgICAgICAgICA7KHRoaXMub2JqZWN0IGFzIGFueSkuc2V0ICh7XG4gICAgICAgICAgICAgICBmaWxsOiBuZXcgZmFicmljLlBhdHRlcm4gKHtcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBkaW1nLFxuICAgICAgICAgICAgICAgICAgICByZXBlYXQ6IFwibm8tcmVwZWF0XCIsXG4gICAgICAgICAgICAgICAgICAgIHBhdHRlcm5UcmFuc2Zvcm06IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICBmYWN0b3IsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmFjdG9yLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm9iamVjdC5jYW52YXMgKVxuICAgICAgICAgICAgICAgdGhpcy5vYmplY3QuY2FudmFzLnJlbmRlckFsbCAoKVxuICAgICB9XG59XG4iLCJcbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uL2dlb21ldHJ5LmpzXCJcbmltcG9ydCB7IEN0b3IgYXMgRGF0YUN0b3IgfSBmcm9tIFwiLi4vLi4vLi4vRGF0YS9pbmRleC5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2hhcGVFdmVudHMgPEQgZXh0ZW5kcyAkTm9kZSA9IGFueT5cbiAgICAge1xuICAgICAgICAgIG9uQ3JlYXRlOiAoIGVudGl0eTogRCwgYXNwZWN0OiBTaGFwZSApID0+IHZvaWQsXG4gICAgICAgICAgb25EZWxldGU6ICggZW50aXR5OiBELCBzaGFwZTogU2hhcGUgKSA9PiB2b2lkLFxuICAgICAgICAgIG9uVG91Y2g6ICggYXNwZWN0OiBTaGFwZSApID0+IHZvaWRcbiAgICAgfVxuXG4gICAgIGludGVyZmFjZSAkU2hhcGUgPEQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+IGV4dGVuZHMgJE5vZGUsICRHZW9tZXRyeSwgJFNoYXBlRXZlbnRzXG4gICAgIHtcbiAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtYXNwZWN0XCJcblxuICAgICAgICAgIGRhdGE6IERcblxuICAgICAgICAgIG1pblNpemUgICA6IG51bWJlclxuICAgICAgICAgIHNpemVPZmZzZXQ6IG51bWJlclxuICAgICAgICAgIHNpemVGYWN0b3I6IG51bWJlclxuICAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEN0b3IgPERhdGEgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGUsIFQgZXh0ZW5kcyBTaGFwZSA9IFNoYXBlPiA9IERhdGFDdG9yIDxEYXRhLCBUPlxuXG5leHBvcnQgY2xhc3MgU2hhcGUgPCQgZXh0ZW5kcyAkU2hhcGUgPSAkU2hhcGU+XG57XG4gICAgIGRlZmF1bHRDb25maWcgKCk6ICRTaGFwZVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC1hc3BlY3RcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwic2hhcGVcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRhdGEgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIHggICAgICA6IDAsXG4gICAgICAgICAgICAgICB5ICAgICAgOiAwLFxuICAgICAgICAgICAgICAgLy9zaXplICAgICAgOiAyMCxcbiAgICAgICAgICAgICAgIG1pblNpemUgICA6IDEsXG4gICAgICAgICAgICAgICBzaXplRmFjdG9yOiAxLFxuICAgICAgICAgICAgICAgc2l6ZU9mZnNldDogMCxcblxuICAgICAgICAgICAgICAgc2hhcGUgICAgICAgICAgIDogXCJjaXJjbGVcIixcbiAgICAgICAgICAgICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICAgICAgICAgICAgYm9yZGVyV2lkdGggICAgIDogNSxcblxuICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG5cbiAgICAgICAgICAgICAgIG9uQ3JlYXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIG9uVG91Y2ggICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZWFkb25seSBjb25maWc6ICRcblxuICAgICBncm91cCA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuR3JvdXBcblxuICAgICByZWFkb25seSBiYWNrZ3JvdW5kOiBHZW9tZXRyeVxuICAgICByZWFkb25seSBib3JkZXI6IEdlb21ldHJ5XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IHVuZGVmaW5lZFxuICAgICAgICAgIHRoaXMuYm9yZGVyID0gdW5kZWZpbmVkXG4gICAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICAgICAuLi4gdGhpcy5kZWZhdWx0Q29uZmlnICgpLFxuICAgICAgICAgICAgICAgLi4uIGRhdGFcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwID0gbmV3IGZhYnJpYy5Hcm91cCAoIFtdLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHdpZHRoICAgICAgOiB0aGlzLmRpc3BsYXlTaXplICgpLFxuICAgICAgICAgICAgICAgaGVpZ2h0ICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBsZWZ0ICAgICAgIDogY29uZmlnLngsXG4gICAgICAgICAgICAgICB0b3AgICAgICAgIDogY29uZmlnLnksXG4gICAgICAgICAgICAgICBoYXNCb3JkZXJzIDogdHJ1ZSxcbiAgICAgICAgICAgICAgIGhhc0NvbnRyb2xzOiB0cnVlLFxuICAgICAgICAgICAgICAgb3JpZ2luWCAgICA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBvcmlnaW5ZICAgIDogXCJjZW50ZXJcIixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgOyh0aGlzLmJhY2tncm91bmQgYXMgR2VvbWV0cnkpID0gbmV3IEdlb21ldHJ5ICggdGhpcyApXG5cbiAgICAgICAgICBncm91cC5zZXRDb29yZHMgKClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ1xuXG4gICAgICAgICAgdmFyIHNpemUgPSAoMSArIGNvbmZpZy5zaXplT2Zmc2V0KSAqIGNvbmZpZy5zaXplRmFjdG9yXG5cbiAgICAgICAgICBpZiAoIHNpemUgPCBjb25maWcubWluU2l6ZSApXG4gICAgICAgICAgICAgICBzaXplID0gY29uZmlnLm1pblNpemVcblxuICAgICAgICAgIHJldHVybiBzaXplIHx8IDFcbiAgICAgfVxuXG4gICAgIHVwZGF0ZVNpemUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNvbmZpZyB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmQgKVxuICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kLnVwZGF0ZVNpemUgKClcblxuICAgICAgICAgIGlmICggdGhpcy5ib3JkZXIgKVxuICAgICAgICAgICAgICAgdGhpcy5ib3JkZXIudXBkYXRlU2l6ZSAoKVxuXG4gICAgICAgICAgZ3JvdXAuc2V0ICh7XG4gICAgICAgICAgICAgICB3aWR0aCA6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuZGlzcGxheVNpemUgKCksXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmICggZ3JvdXAuY2FudmFzIClcbiAgICAgICAgICAgICAgIGdyb3VwLmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBjb29yZHMgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmdyb3VwLmdldENvb3JkcyAoKVxuICAgICB9XG5cbiAgICAgc2V0QmFja2dyb3VuZCAoIG9wdGlvbnM6IFBhcnRpYWwgPCRHZW9tZXRyeT4gKVxuICAgICB7XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbiAoIHRoaXMuY29uZmlnLCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMuYmFja2dyb3VuZC51cGRhdGUgKCBvcHRpb25zIClcblxuICAgICAgICAgIHRoaXMudXBkYXRlU2l6ZSAoKVxuICAgICB9XG5cbiAgICAgc2V0UG9zaXRpb24gKCB4OiBudW1iZXIsIHk6IG51bWJlciApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGdyb3VwLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbmZpZy54ID0geFxuICAgICAgICAgIGNvbmZpZy55ID0geVxuICAgICAgICAgIGdyb3VwLnNldCAoeyBsZWZ0OiB4LCB0b3AgOiB5IH0pLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgaWYgKCBncm91cC5jYW52YXMgKVxuICAgICAgICAgICAgICAgZ3JvdXAuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGhvdmVyICggdXA6IGJvb2xlYW4gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5iYWNrZ3JvdW5kICE9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5iYWNrZ3JvdW5kLm9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5ncm91cFxuXG4gICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggJ3JnYmEoMCwwLDAsMC4zKScgKVxuXG4gICAgICAgICAgZmFicmljLnV0aWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICBzdGFydFZhbHVlOiB1cCA/IDAgOiAxLFxuICAgICAgICAgICAgICAgZW5kVmFsdWUgIDogdXAgPyAxIDogMCxcbiAgICAgICAgICAgICAgIGVhc2luZyAgICA6IGZhYnJpYy51dGlsLmVhc2UuZWFzZU91dEN1YmljLFxuICAgICAgICAgICAgICAgYnlWYWx1ZSAgIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZHVyYXRpb24gIDogMTAwLFxuICAgICAgICAgICAgICAgb25DaGFuZ2UgIDogKCB2YWx1ZTogbnVtYmVyICkgPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gMSAqIHZhbHVlXG5cbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldFNoYWRvdyggYCR7IG9mZnNldCB9cHggJHsgb2Zmc2V0IH1weCAkeyAxMCAqIHZhbHVlIH1weCByZ2JhKDAsMCwwLDAuMylgIClcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNjYWxlKCAxICsgMC4xICogdmFsdWUgKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHRvSnNvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5ICggdGhpcy5jb25maWcgKVxuICAgICB9XG59XG4iLCIvLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzLmQudHNcIiAvPlxuLy9pbXBvcnQgKiBhcyBmYWJyaWMgZnJvbSBcImZhYnJpYy9mYWJyaWMtaW1wbFwiXG5cbmltcG9ydCB7IERhdGFiYXNlLCBGYWN0b3J5IH0gZnJvbSBcIi4uLy4uL0RhdGEvaW5kZXguanNcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCB7IFdyaXRhYmxlLCBPcHRpb25hbCB9IGZyb20gXCIuLi8uLi9MaWIvaW5kZXguanNcIlxuXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtYXNwZWN0XCJcbmNvbnN0IGRiICAgICAgPSBuZXcgRGF0YWJhc2UgKClcbmNvbnN0IGZhY3RvcnkgPSBuZXcgRmFjdG9yeSA8U2hhcGU+ICggZGIgKVxuY29uc3QgQVNQRUNUICA9IFN5bWJvbC5mb3IgKCBcIkFTUEVDVFwiIClcblxuLy8gc3ZnRmFjdG9yeVxuLy8gaHRtbEZhY3Rvcnlcbi8vIGZhYnJpY0ZhY3RvcnlcblxuLy8gdWkuZmFjdG9yeS5zZXQgKCBbXCJjb25jZXB0LXVpXCIsIFwiYnV0dG9uXCIsIFwiaHRtbFwiICAsIFwiYnRuMVwiXSwgY3RvciApXG4vLyB1aS5mYWN0b3J5LnNldCAoIFtcImNvbmNlcHQtdWlcIiwgXCJidXR0b25cIiwgXCJzdmdcIiAgICwgXCJidG4xXCJdLCBjdG9yIClcbi8vIHVpLmZhY3Rvcnkuc2V0ICggW1wiY29uY2VwdC11aVwiLCBcImJ1dHRvblwiLCBcImZhYnJpY1wiLCBcImJ0bjFcIl0sIGN0b3IgKVxuXG50eXBlICRJbiA8JCBleHRlbmRzICRTaGFwZSA9ICRTaGFwZT4gPSBPcHRpb25hbCA8JCwgXCJjb250ZXh0XCI+XG5cbi8qKlxuICogQXNzaWduZSBzaSBiZXNvaW4gbGUgY29udGV4dGUgXCJhc3BlY3RcIiBhdSBub2V1ZFxuICovXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPCRTaGFwZT4pLmNvbnRleHQgPSBDT05URVhUXG4gICAgIH1cblxuICAgICByZXR1cm4gbm9kZSBhcyAkU2hhcGVcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXNwZWN0IDxUIGV4dGVuZHMgU2hhcGU+ICggb2JqOiAkTm9kZSB8IFNoYXBlIHwgZmFicmljLk9iamVjdCApOiBUIHwgdW5kZWZpbmVkXG57XG4gICAgIGlmICggb2JqID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgU2hhcGUgKVxuICAgICAgICAgIHJldHVybiBvYmogYXMgVFxuXG4gICAgIGlmICggb2JqIGluc3RhbmNlb2YgZmFicmljLk9iamVjdCApXG4gICAgICAgICAgcmV0dXJuIG9iaiBbQVNQRUNUXVxuXG4gICAgIGlmICggZmFjdG9yeS5pblN0b2NrICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApIClcbiAgICAgICAgICByZXR1cm4gZmFjdG9yeS5tYWtlICggQ09OVEVYVCwgb2JqLnR5cGUsIG9iai5pZCApXG5cbiAgICAgY29uc3Qgb3B0aW9ucyAgPSBvYmouY29udGV4dCA9PSBDT05URVhUXG4gICAgICAgICAgICAgICAgICAgID8gb2JqIGFzICRTaGFwZVxuICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBDT05URVhULFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IG9iai50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICAgICA6IG9iai5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhICAgOiBvYmosXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgJFNoYXBlXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLngpIClcbiAgICAgICAgICBvcHRpb25zLnggPSAwXG5cbiAgICAgaWYgKCAhIGlzRmluaXRlIChvcHRpb25zLnkpIClcbiAgICAgICAgICBvcHRpb25zLnkgPSAwXG5cbiAgICAgY29uc3Qgc2hhcGUgPSBmYWN0b3J5Lm1ha2UgKCBvcHRpb25zIClcblxuICAgICAvLyBzaGFwZS5ldmVudHMgPSBhcmd1bWVudHMuZXZlbnRzXG4gICAgIC8vIE9iamVjdC5hc3NpZ24gKCBzaGFwZSwgZXZlbnRzIClcblxuICAgICAvL3NoYXBlLmluaXQgKClcbiAgICAgc2hhcGUuZ3JvdXAgW0FTUEVDVF0gPSBzaGFwZVxuXG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uQ3JlYXRlIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25DcmVhdGUgKCBzaGFwZS5jb25maWcuZGF0YSwgc2hhcGUgKVxuXG4gICAgIHJldHVybiBzaGFwZSBhcyBUXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEFzcGVjdCA8JCBleHRlbmRzICRTaGFwZT4gKCBub2RlOiAkSW4gPCQ+IClcbntcbiAgICAgZGIuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lQXNwZWN0ICggY3RvcjogbmV3ICggZGF0YTogJFNoYXBlICkgPT4gU2hhcGUsIHR5cGU6IHN0cmluZyApXG57XG4gICAgIGZhY3RvcnkuX2RlZmluZSAoIGN0b3IsIFtDT05URVhULCB0eXBlXSApXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9ub2Rlcy5kLnRzXCIgLz5cblxuaW1wb3J0IHsgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBXcml0YWJsZSwgT3B0aW9uYWwgfSBmcm9tIFwiLi4vTGliL2luZGV4LmpzXCJcblxuY29uc3QgQ09OVEVYVCA9IFwiY29uY2VwdC1kYXRhXCJcbmNvbnN0IERhdGEgPSBuZXcgRGF0YWJhc2UgKClcblxudHlwZSAkSW4gPCQgZXh0ZW5kcyAkVGhpbmcgPSAkVGhpbmc+ID0gT3B0aW9uYWwgPCQsIFwiY29udGV4dFwiPlxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBub2RlOiAkSW4gKVxue1xuICAgICBpZiAoIFwiY29udGV4dFwiIGluIG5vZGUgKVxuICAgICB7XG4gICAgICAgICAgaWYgKCBub2RlLmNvbnRleHQgIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgIH1cbiAgICAgZWxzZVxuICAgICB7XG4gICAgICAgICAgKG5vZGUgYXMgV3JpdGFibGUgPCROb2RlPikuY29udGV4dCA9IENPTlRFWFRcbiAgICAgfVxuXG4gICAgIHJldHVybiBub2RlIGFzICROb2RlXG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSA8JCBleHRlbmRzICRUaGluZz4gKCBub2RlOiAkSW4gKTogJFxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGUgPCQgZXh0ZW5kcyAkVGhpbmc+ICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiAkXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZSAoKVxue1xuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMCApXG4gICAgICAgICAgcmV0dXJuXG5cbiAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09IDEgKVxuICAgICAgICAgIHJldHVybiBEYXRhLmdldCAoIG5vcm1hbGl6ZSAoIGFyZ3VtZW50cyBbMF0gKSApXG4gICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gRGF0YS5nZXQgKCBDT05URVhULCAuLi4gYXJndW1lbnRzIClcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGUgPCQgZXh0ZW5kcyAkVGhpbmc+ICggbm9kZTogJEluIDwkPiApXG57XG4gICAgIERhdGEuc2V0ICggbm9ybWFsaXplICggbm9kZSApIClcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY291bnREYXRhICggdHlwZTogc3RyaW5nIClcbntcbiAgICAgcmV0dXJuIERhdGEuY291bnQgKCBcImNvbmNlcHQtZGF0YVwiLCB0eXBlIClcbn1cbiIsIlxuLypcbmV4YW1wbGU6XG5odHRwczovL3ByZXppLmNvbS9wLzlqcWUyd2tmaGhreS9sYS1idWxsb3RlcmllLXRwY21uL1xuaHR0cHM6Ly9tb3ZpbGFiLm9yZy9pbmRleC5waHA/dGl0bGU9VXRpbGlzYXRldXI6QXVyJUMzJUE5bGllbk1hcnR5XG4qL1xuXG5cbmltcG9ydCB7IEdlb21ldHJ5IH0gZnJvbSBcIi4uLy4uLy4uL0xpYi9pbmRleC5qc1wiXG5cbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4uLy4uLy4uL0FwcGxpY2F0aW9uL0FzcGVjdC9FbGVtZW50L3NoYXBlLmpzXCJcbmltcG9ydCAqIGFzIGFzcGVjdCBmcm9tIFwiLi4vLi4vLi4vQXBwbGljYXRpb24vQXNwZWN0L2RiLmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9kYXRhLmpzXCJcblxuaW1wb3J0IFwiZmFicmljXCJcblxuZmFicmljLk9iamVjdC5wcm90b3R5cGUucGFkZGluZyAgICAgICAgICAgID0gMFxuZmFicmljLk9iamVjdC5wcm90b3R5cGUub2JqZWN0Q2FjaGluZyAgICAgID0gZmFsc2VcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0NvbnRyb2xzICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc0JvcmRlcnMgICAgICAgICA9IHRydWVcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLmhhc1JvdGF0aW5nUG9pbnQgICA9IGZhbHNlXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS50cmFuc3BhcmVudENvcm5lcnMgPSBmYWxzZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY2VudGVyZWRTY2FsaW5nICAgID0gdHJ1ZVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuY29ybmVyU3R5bGUgICAgICAgID0gXCJjaXJjbGVcIlxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1sXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJtdFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwibXJcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcIm1iXCIsIGZhbHNlIClcbmZhYnJpYy5PYmplY3QucHJvdG90eXBlLnNldENvbnRyb2xWaXNpYmxlICggXCJ0bFwiLCBmYWxzZSApXG5mYWJyaWMuT2JqZWN0LnByb3RvdHlwZS5zZXRDb250cm9sVmlzaWJsZSAoIFwiYmxcIiwgZmFsc2UgKVxuZmFicmljLk9iamVjdC5wcm90b3R5cGUuc2V0Q29udHJvbFZpc2libGUgKCBcImJyXCIsIGZhbHNlIClcblxuZXhwb3J0IGludGVyZmFjZSBWaWV3XG57XG4gICAgIG5hbWU6IHN0cmluZ1xuICAgICBhY3RpdmU6IGJvb2xlYW5cbiAgICAgY2hpbGRyZW4gOiBTaGFwZSBbXVxuICAgICB0aHVtYm5haWw6IHN0cmluZ1xuICAgICBwYWNraW5nICA6IFwiZW5jbG9zZVwiXG59XG5cbmV4cG9ydCBjbGFzcyBBcmVhXG57XG4gICAgIHJlYWRvbmx5IGZjYW52YXM6IGZhYnJpYy5DYW52YXNcbiAgICAgcHJpdmF0ZSBhY3RpdmU6IFZpZXdcbiAgICAgcHJpdmF0ZSB2aWV3cyA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBWaWV3PlxuXG4gICAgIGNvbnN0cnVjdG9yICggY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCApXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMgPSBuZXcgZmFicmljLkNhbnZhcyAoIGNhbnZhcyApXG4gICAgICAgICAgdGhpcy5lbmFibGVFdmVudHMgKClcbiAgICAgfVxuXG4gICAgIGdldCB2aWV3ICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmVcbiAgICAgfVxuXG4gICAgIG92ZXJGT2JqZWN0OiBmYWJyaWMuT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgc3RhdGljIGN1cnJlbnRFdmVudDogZmFicmljLklFdmVudFxuICAgICBvbk92ZXJPYmplY3QgID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uT3V0T2JqZWN0ICAgPSBudWxsIGFzICggb2JqOiBTaGFwZSApID0+IHZvaWRcbiAgICAgb25Ub3VjaE9iamVjdCA9IG51bGwgYXMgKCBvYmo6IFNoYXBlICkgPT4gdm9pZFxuICAgICBvbkRvdWJsZVRvdWNoT2JqZWN0ID0gbnVsbCBhcyAoIG9iajogU2hhcGUgKSA9PiB2b2lkXG4gICAgIG9uVG91Y2hBcmVhICAgPSBudWxsIGFzICggeDogbnVtYmVyLCB5OiBudW1iZXIgKSA9PiB2b2lkXG5cbiAgICAgY3JlYXRlVmlldyAoIG5hbWU6IHN0cmluZyApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IHZpZXdzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIG5hbWUgaW4gdmlld3MgKVxuICAgICAgICAgICAgICAgdGhyb3cgXCJUaGUgdmlldyBhbHJlYWR5IGV4aXN0c1wiXG5cbiAgICAgICAgICByZXR1cm4gdmlld3MgW25hbWVdID0ge1xuICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgIGFjdGl2ZSAgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBjaGlsZHJlbiA6IFtdLFxuICAgICAgICAgICAgICAgcGFja2luZyAgOiBcImVuY2xvc2VcIixcbiAgICAgICAgICAgICAgIHRodW1ibmFpbDogbnVsbCxcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgKTogVmlld1xuICAgICB1c2UgKCB2aWV3OiBWaWV3ICkgIDogVmlld1xuICAgICB1c2UgKCBuYW1lOiBzdHJpbmcgfCBWaWV3ICk6IFZpZXdcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcywgdmlld3MgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggdHlwZW9mIG5hbWUgIT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICBuYW1lID0gbmFtZS5uYW1lXG5cbiAgICAgICAgICBpZiAoIHRoaXMuYWN0aXZlICYmIHRoaXMuYWN0aXZlLm5hbWUgPT0gbmFtZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggISAobmFtZSBpbiB2aWV3cykgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBhY3RpdmUgPSB0aGlzLmFjdGl2ZSA9IHZpZXdzIFtuYW1lXVxuXG4gICAgICAgICAgZmNhbnZhcy5jbGVhciAoKVxuXG4gICAgICAgICAgZm9yICggY29uc3Qgc2hhcGUgb2YgYWN0aXZlLmNoaWxkcmVuIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hhcGUuZ3JvdXAgKVxuXG4gICAgICAgICAgcmV0dXJuIGFjdGl2ZVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIHNoYXBlczogKFNoYXBlIHwgJE5vZGUpIFtdICk6IHZvaWRcbiAgICAgYWRkICggLi4uIHBhdGg6IHN0cmluZyBbXSApOiB2b2lkXG4gICAgIGFkZCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmUsIGZjYW52YXMgfSA9IHRoaXNcblxuICAgICAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PSAwIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgYXJndW1lbnRzIFswXSA9PSBcInN0cmluZ1wiIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBub2RlID0gZGIuZ2V0Tm9kZSAoIC4uLiBhcmd1bWVudHMgYXMgYW55IGFzIHN0cmluZyBbXSApXG4gICAgICAgICAgICAgICBjb25zdCBzaHAgPSBhc3BlY3QuZ2V0QXNwZWN0ICggbm9kZSApXG4gICAgICAgICAgICAgICBhY3RpdmUuY2hpbGRyZW4ucHVzaCAoIHNocCApXG4gICAgICAgICAgICAgICBmY2FudmFzLmFkZCAoIHNocC5ncm91cCApXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgZm9yICggY29uc3QgcyBvZiBhcmd1bWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHNocCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBzIGFzICROb2RlIHwgU2hhcGUgKVxuXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0RmFicmljXG4gICAgICAgICAgICAgICAvLyBzaHAuZ2V0SHRtbFxuICAgICAgICAgICAgICAgLy8gc2hwLmdldFN2Z1xuXG4gICAgICAgICAgICAgICAvLyBmYWN0b3J5XG5cbiAgICAgICAgICAgICAgIGFjdGl2ZS5jaGlsZHJlbi5wdXNoICggc2hwIClcbiAgICAgICAgICAgICAgIGZjYW52YXMuYWRkICggc2hwLmdyb3VwIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmY2FudmFzLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgfVxuXG4gICAgIGNsZWFyICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmZjYW52YXMuY2xlYXIgKClcbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZmNhbnZhcyB9ID0gdGhpc1xuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgZyBvZiBvYmplY3RzIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCByID0gKGcud2lkdGggPiBnLmhlaWdodCA/IGcud2lkdGggOiBnLmhlaWdodCkgLyAyXG4gICAgICAgICAgICAgICBwb3NpdGlvbnMucHVzaCAoIHsgeDogZy5sZWZ0LCB5OiBnLnRvcCwgcjogciArIDIwIH0gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgb2JqZWN0cy5sZW5ndGggOyBpKysgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGcgPSBvYmplY3RzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgcCA9IHBvc2l0aW9ucyBbaV1cblxuICAgICAgICAgICAgICAgZy5sZWZ0ID0gcC54XG4gICAgICAgICAgICAgICBnLnRvcCAgPSBwLnlcbiAgICAgICAgICAgICAgIGcuc2V0Q29vcmRzICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICB6b29tICggZmFjdG9yPzogbnVtYmVyIHwgU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBmY2FudmFzIH0gPSB0aGlzXG5cbiAgICAgICAgICBpZiAoIHR5cGVvZiBmYWN0b3IgPT0gXCJudW1iZXJcIiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3Qgb2JqZWN0cyA9IGZjYW52YXMuZ2V0T2JqZWN0cyAoKVxuXG4gICAgICAgICAgaWYgKCB0eXBlb2YgZmFjdG9yID09IFwib2JqZWN0XCIgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IG8gPSBmYWN0b3IuZ3JvdXBcblxuICAgICAgICAgICAgICAgdmFyIGxlZnQgICA9IG8ubGVmdCAtIG8ud2lkdGhcbiAgICAgICAgICAgICAgIHZhciByaWdodCAgPSBvLmxlZnQgKyBvLndpZHRoXG4gICAgICAgICAgICAgICB2YXIgdG9wICAgID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgIHZhciBib3R0b20gPSBvLnRvcCAgKyBvLmhlaWdodFxuXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB2YXIgbGVmdCAgID0gMFxuICAgICAgICAgICAgICAgdmFyIHJpZ2h0ICA9IDBcbiAgICAgICAgICAgICAgIHZhciB0b3AgICAgPSAwXG4gICAgICAgICAgICAgICB2YXIgYm90dG9tID0gMFxuXG4gICAgICAgICAgICAgICBmb3IgKCBjb25zdCBvIG9mIG9iamVjdHMgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsID0gby5sZWZ0IC0gby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gby5sZWZ0ICsgby53aWR0aFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ID0gby50b3AgIC0gby5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYiA9IG8udG9wICArIG8uaGVpZ2h0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBsIDwgbGVmdCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgbGVmdCA9IGxcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIHIgPiByaWdodCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgPSByXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0IDwgdG9wIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgPSB0XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCBiID4gYm90dG9tIClcbiAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b20gPSBiXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdyAgPSByaWdodCAtIGxlZnRcbiAgICAgICAgICBjb25zdCBoICA9IGJvdHRvbSAtIHRvcFxuICAgICAgICAgIGNvbnN0IHZ3ID0gZmNhbnZhcy5nZXRXaWR0aCAgKClcbiAgICAgICAgICBjb25zdCB2aCA9IGZjYW52YXMuZ2V0SGVpZ2h0ICgpXG5cbiAgICAgICAgICBjb25zdCBmID0gdyA+IGhcbiAgICAgICAgICAgICAgICAgICAgPyAodncgPCB2aCA/IHZ3IDogdmgpIC8gd1xuICAgICAgICAgICAgICAgICAgICA6ICh2dyA8IHZoID8gdncgOiB2aCkgLyBoXG5cbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFswXSA9IGZcbiAgICAgICAgICBmY2FudmFzLnZpZXdwb3J0VHJhbnNmb3JtIFszXSA9IGZcblxuICAgICAgICAgIGNvbnN0IGN4ID0gbGVmdCArIHcgLyAyXG4gICAgICAgICAgY29uc3QgY3kgPSB0b3AgICsgaCAvIDJcblxuICAgICAgICAgIGZjYW52YXMudmlld3BvcnRUcmFuc2Zvcm0gWzRdID0gLShjeCAqIGYpICsgdncgLyAyXG4gICAgICAgICAgZmNhbnZhcy52aWV3cG9ydFRyYW5zZm9ybSBbNV0gPSAtKGN5ICogZikgKyB2aCAvIDJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2Ygb2JqZWN0cyApXG4gICAgICAgICAgICAgICBvLnNldENvb3JkcyAoKVxuXG4gICAgICAgICAgZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgIH1cblxuICAgICBpc29sYXRlICggc2hhcGU6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgdGhpcy5mY2FudmFzLmdldE9iamVjdHMgKCkgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIG8udmlzaWJsZSA9IGZhbHNlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2hhcGUuZ3JvdXAudmlzaWJsZSA9IHRydWVcbiAgICAgfVxuXG4gICAgIGdldFRodW1ibmFpbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBhY3RpdmU6IGN2aWV3IH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCB0aHVtYm5haWwgPSBjdmlldy50aHVtYm5haWxcblxuICAgICAgICAgIGlmICggdGh1bWJuYWlsIHx8IGN2aWV3LmFjdGl2ZSA9PSBmYWxzZSApXG4gICAgICAgICAgICAgICB0aHVtYm5haWxcblxuICAgICAgICAgIHJldHVybiBjdmlldy50aHVtYm5haWwgPSB0aGlzLmZjYW52YXMudG9EYXRhVVJMICh7IGZvcm1hdDogXCJqcGVnXCIgfSlcbiAgICAgfVxuXG4gICAgIC8vIFVJIEVWRU5UU1xuXG4gICAgIGVuYWJsZUV2ZW50cyAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5pbml0Q2xpY2tFdmVudCAoKVxuICAgICAgICAgIHRoaXMuaW5pdE92ZXJFdmVudCAgKClcbiAgICAgICAgICB0aGlzLmluaXRQYW5FdmVudCAgICgpXG4gICAgICAgICAgdGhpcy5pbml0Wm9vbUV2ZW50ICAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0TW92ZU9iamVjdCAoKVxuICAgICAgICAgIC8vdGhpcy5pbml0RHJhZ0V2ZW50ICAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcInJlc2l6ZVwiLCB0aGlzLnJlc3BvbnNpdmUuYmluZCAodGhpcykgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSByZXNwb25zaXZlICgpXG4gICAgIHtcbiAgICAgICAgICB2YXIgd2lkdGggICA9ICh3aW5kb3cuaW5uZXJXaWR0aCAgPiAwKSA/IHdpbmRvdy5pbm5lcldpZHRoICA6IHNjcmVlbi53aWR0aFxuICAgICAgICAgIHZhciBoZWlnaHQgID0gKHdpbmRvdy5pbm5lckhlaWdodCA+IDApID8gd2luZG93LmlubmVySGVpZ2h0IDogc2NyZWVuLmhlaWdodFxuXG4gICAgICAgICAgdGhpcy5mY2FudmFzLnNldERpbWVuc2lvbnMoe1xuICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0Q2xpY2tFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSAgICAgICAgICAgPSB0aGlzLmZjYW52YXNcbiAgICAgICAgICBjb25zdCBtYXhfY2xpY2hfYXJlYSA9IDI1ICogMjVcbiAgICAgICAgICB2YXIgICBsYXN0X2NsaWNrICAgICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdF9wb3MgICAgICAgPSB7IHg6IC05OTk5LCB5OiAtOTk5OSB9XG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggXCJtb3VzZTpkb3duXCIgKVxuICAgICAgICAgICAgICAgY29uc3Qgbm93ICAgPSBEYXRlLm5vdyAoKVxuICAgICAgICAgICAgICAgY29uc3QgcG9zICAgPSBmZXZlbnQucG9pbnRlclxuICAgICAgICAgICAgICAgY29uc3QgcmVzZXQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY2xpY2sgPSBub3dcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9wb3MgICA9IHBvc1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIHNvaXQgdW4gZG91YmxlLWNsaXF1ZS5cbiAgICAgICAgICAgICAgIGlmICggNTAwIDwgbm93IC0gbGFzdF9jbGljayApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5vblRvdWNoT2JqZWN0IClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblRvdWNoT2JqZWN0ICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgZmV2ZW50LmUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAvLyBOb3VzIHbDqXJpZmlvbnMgcXVlIGxlcyBkZXV4IGNsaXF1ZXMgc2UgdHJvdXZlIGRhbnMgdW5lIHLDqWdpb24gcHJvY2hlLlxuICAgICAgICAgICAgICAgY29uc3Qgem9uZSA9IChwb3MueCAtIGxhc3RfcG9zLngpICogKHBvcy55IC0gbGFzdF9wb3MueSlcbiAgICAgICAgICAgICAgIGlmICggem9uZSA8IC1tYXhfY2xpY2hfYXJlYSB8fCBtYXhfY2xpY2hfYXJlYSA8IHpvbmUgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzZXQgKClcblxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgZm9ybWUuXG4gICAgICAgICAgICAgICBpZiAoIGZldmVudC50YXJnZXQgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICAgICAgIEFyZWEuY3VycmVudEV2ZW50ID0gZmV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRG91YmxlVG91Y2hPYmplY3QgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NsaWNrICAgPSAtMVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgLy8gU2kgbGUgcG9pbnRlciBlc3QgYXUtZGVzc3VzIGTigJl1bmUgem9uZSB2aWRlLlxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLm9uVG91Y2hBcmVhIClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uVG91Y2hBcmVhICggcG9zLngsIHBvcy55IClcbiAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBmZXZlbnQuZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKClcblxuICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE92ZXJFdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6b3ZlclwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gZmV2ZW50LnRhcmdldFxuXG4gICAgICAgICAgICAgICBpZiAoIHRoaXMub25PdmVyT2JqZWN0IClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGFzcGVjdC5nZXRBc3BlY3QgKCBmZXZlbnQudGFyZ2V0IClcblxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IGZldmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50IClcbiAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uT3Zlck9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOm91dFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLm92ZXJGT2JqZWN0ID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vbk91dE9iamVjdCApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBhc3BlY3QuZ2V0QXNwZWN0ICggZmV2ZW50LnRhcmdldCApXG5cbiAgICAgICAgICAgICAgICAgICAgQXJlYS5jdXJyZW50RXZlbnQgPSBmZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudCApXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk91dE9iamVjdCAoIGVsZW1lbnQgKVxuICAgICAgICAgICAgICAgICAgICBBcmVhLmN1cnJlbnRFdmVudCA9IG51bGw7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFBhbkV2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgID0gdGhpcy5mY2FudmFzXG4gICAgICAgICAgdmFyICAgaXNEcmFnZ2luZyA9IGZhbHNlXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1ggICA9IC0xXG4gICAgICAgICAgdmFyICAgbGFzdFBvc1kgICA9IC0xXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJtb3VzZTpkb3duXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdGhpcy5vdmVyRk9iamVjdCA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBwYWdlLnNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIHBhZ2UuZGlzY2FyZEFjdGl2ZU9iamVjdCAoKVxuICAgICAgICAgICAgICAgICAgICBwYWdlLmZvckVhY2hPYmplY3QgKCBvID0+IHsgby5zZWxlY3RhYmxlID0gZmFsc2UgfSApXG5cbiAgICAgICAgICAgICAgICAgICAgaXNEcmFnZ2luZyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1ggICA9IGZldmVudC5wb2ludGVyLnhcbiAgICAgICAgICAgICAgICAgICAgbGFzdFBvc1kgICA9IGZldmVudC5wb2ludGVyLnlcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwgKClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6bW92ZVwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGlzRHJhZ2dpbmcgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2ludGVyICA9IGZldmVudC5wb2ludGVyXG5cbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNF0gKz0gcG9pbnRlci54IC0gbGFzdFBvc1hcbiAgICAgICAgICAgICAgICAgICAgcGFnZS52aWV3cG9ydFRyYW5zZm9ybSBbNV0gKz0gcG9pbnRlci55IC0gbGFzdFBvc1lcblxuICAgICAgICAgICAgICAgICAgICBwYWdlLnJlcXVlc3RSZW5kZXJBbGwoKVxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NYID0gcG9pbnRlci54XG4gICAgICAgICAgICAgICAgICAgIGxhc3RQb3NZID0gcG9pbnRlci55XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm1vdXNlOnVwXCIsICgpID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgcGFnZS5zZWxlY3Rpb24gPSB0cnVlXG5cbiAgICAgICAgICAgICAgIHBhZ2UuZm9yRWFjaE9iamVjdCAoIG8gPT5cbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgby5zZWxlY3RhYmxlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBvLnNldENvb3JkcygpXG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gZmFsc2VcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdFpvb21FdmVudCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgcGFnZSA9IHRoaXMuZmNhbnZhc1xuXG4gICAgICAgICAgcGFnZS5vbiAoIFwibW91c2U6d2hlZWxcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgICA9IGZldmVudC5lIGFzIFdoZWVsRXZlbnRcbiAgICAgICAgICAgICAgIHZhciAgIGRlbHRhICAgPSBldmVudC5kZWx0YVlcbiAgICAgICAgICAgICAgIHZhciAgIHpvb20gICAgPSBwYWdlLmdldFpvb20oKVxuICAgICAgICAgICAgICAgICAgICB6b29tICAgID0gem9vbSAtIGRlbHRhICogMC4wMDVcblxuICAgICAgICAgICAgICAgaWYgKHpvb20gPiA5KVxuICAgICAgICAgICAgICAgICAgICB6b29tID0gOVxuXG4gICAgICAgICAgICAgICBpZiAoem9vbSA8IDAuNSlcbiAgICAgICAgICAgICAgICAgICAgem9vbSA9IDAuNVxuXG4gICAgICAgICAgICAgICBwYWdlLnpvb21Ub1BvaW50KCBuZXcgZmFicmljLlBvaW50ICggZXZlbnQub2Zmc2V0WCwgZXZlbnQub2Zmc2V0WSApLCB6b29tIClcblxuICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblxuICAgICAgICAgICAgICAgcGFnZS5yZXF1ZXN0UmVuZGVyQWxsICgpXG4gICAgICAgICAgfSlcbiAgICAgfVxuXG4gICAgIHByaXZhdGUgaW5pdE1vdmVPYmplY3QgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHBhZ2UgICAgICA9IHRoaXMuZmNhbnZhc1xuICAgICAgICAgIHZhciAgIGNsdXN0ZXIgICA9IHVuZGVmaW5lZCBhcyBmYWJyaWMuT2JqZWN0IFtdXG4gICAgICAgICAgdmFyICAgcG9zaXRpb25zID0gdW5kZWZpbmVkIGFzIG51bWJlciBbXVtdXG4gICAgICAgICAgdmFyICAgb3JpZ2luWCAgID0gMFxuICAgICAgICAgIHZhciAgIG9yaWdpblkgICA9IDBcblxuICAgICAgICAgIGZ1bmN0aW9uIG9uX3NlbGVjdGlvbiAoZmV2ZW50OiBmYWJyaWMuSUV2ZW50KVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgICAgICAgICAgIGNsdXN0ZXIgPSB0YXJnZXQgW1wiY2x1c3RlclwiXSBhcyBmYWJyaWMuT2JqZWN0IFtdXG5cbiAgICAgICAgICAgICAgIGlmICggY2x1c3RlciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgICAgb3JpZ2luWCAgID0gdGFyZ2V0LmxlZnRcbiAgICAgICAgICAgICAgIG9yaWdpblkgICA9IHRhcmdldC50b3BcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IG8gb2YgY2x1c3RlciApXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoIChbIG8ubGVmdCwgby50b3AgXSlcblxuICAgICAgICAgICAgICAgY29uc29sZS5sb2cgKFwiY3JlYXRlZFwiKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhZ2Uub24gKCBcInNlbGVjdGlvbjpjcmVhdGVkXCIsIG9uX3NlbGVjdGlvbiApXG4gICAgICAgICAgcGFnZS5vbiAoIFwic2VsZWN0aW9uOnVwZGF0ZWRcIiwgb25fc2VsZWN0aW9uIClcblxuICAgICAgICAgIHBhZ2Uub24gKCBcIm9iamVjdDptb3ZpbmdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaWYgKCBjbHVzdGVyID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICAgICBjb25zdCB0YXJnZXQgICA9IGZldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFggID0gdGFyZ2V0LmxlZnQgLSBvcmlnaW5YXG4gICAgICAgICAgICAgICBjb25zdCBvZmZzZXRZICA9IHRhcmdldC50b3AgIC0gb3JpZ2luWVxuXG4gICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2x1c3Rlci5sZW5ndGggOyBpKysgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmogPSBjbHVzdGVyIFtpXVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3MgPSBwb3NpdGlvbnMgW2ldXG4gICAgICAgICAgICAgICAgICAgIG9iai5zZXQgKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiBwb3MgWzBdICsgb2Zmc2V0WCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0b3AgOiBwb3MgWzFdICsgb2Zmc2V0WVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICBwYWdlLm9uICggXCJzZWxlY3Rpb246Y2xlYXJlZFwiLCBmZXZlbnQgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjbHVzdGVyID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nIChcImNsZWFyZWRcIilcbiAgICAgICAgICB9KVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBpbml0RHJhZ0V2ZW50ICgpXG4gICAgIHtcbiAgICAgICAgICAvLyBodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2h0bWwvaHRtbDVfZHJhZ2FuZGRyb3AuYXNwXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1Nob3BpZnkvZHJhZ2dhYmxlL2Jsb2IvbWFzdGVyL3NyYy9EcmFnZ2FibGUvRHJhZ2dhYmxlLmpzXG5cbiAgICAgICAgICBjb25zdCBwYWdlICAgICAgPSB0aGlzLmZjYW52YXNcblxuICAgICAgICAgIHBhZ2Uub24gKCBcInRvdWNoOmRyYWdcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIGZldmVudCApXG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyAoIFwidG91Y2g6ZHJhZ1wiIClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ2VudGVyXCIsIGZldmVudCA9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cgKCBcIkRST1AtRU5URVJcIiwgZmV2ZW50IClcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcGFnZS5vbiAoIFwiZHJhZ292ZXJcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyAoIFwiRFJPUC1PVkVSXCIsIGZldmVudCApXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHBhZ2Uub24gKCBcImRyb3BcIiwgZmV2ZW50ID0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgLy9jb25zdCBlID0gZmV2ZW50LmUgYXMgRHJhZ0V2ZW50XG4gICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nICggXCJEUk9QXCIsIGUuZGF0YVRyYW5zZmVyLmdldERhdGEgKFwidGV4dFwiKSApXG4gICAgICAgICAgfSlcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBBcmVhIH0gZnJvbSBcIi4vQ29tcG9uZW50L0FyZWEvYXJlYS5qc1wiXG5jb25zdCBjbWRzID0ge30gYXMgUmVjb3JkIDxzdHJpbmcsIENvbW1hbmQ+XG5cbmNsYXNzIENvbW1hbmRcbntcbiAgICAgY29uc3RydWN0b3IgKCBwcml2YXRlIGNhbGxiYWNrOiAoIGV2ZW50OiBmYWJyaWMuSUV2ZW50ICkgPT4gdm9pZCApIHt9XG5cbiAgICAgcnVuICgpXG4gICAgIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFjayAoIEFyZWEuY3VycmVudEV2ZW50ICk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblxuICAgICAgICAgIH1cbiAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZCAoIG5hbWU6IHN0cmluZywgY2FsbGJhY2s/OiAoIGV2ZW50OiBmYWJyaWMuSUV2ZW50ICkgPT4gdm9pZCApXG57XG4gICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09IFwiZnVuY3Rpb25cIiApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIG5hbWUgaW4gY21kcyApIHJldHVyblxuICAgICAgICAgIGNtZHMgW25hbWVdID0gbmV3IENvbW1hbmQgKCBjYWxsYmFjayApXG4gICAgIH1cblxuICAgICByZXR1cm4gY21kcyBbbmFtZV1cbn1cbiIsIlxuaW1wb3J0IHsgY3JlYXRlTm9kZSB9IGZyb20gXCIuLi8uLi8uLi9EYXRhL2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkQ29tcG9uZW50IDxDIGV4dGVuZHMgJE5vZGUgPSAkTm9kZT4gZXh0ZW5kcyAkQ2x1c3RlciA8Qz5cbiAgICAge1xuICAgICAgICAgIHJlYWRvbmx5IGNvbnRleHQ6IFwiY29uY2VwdC11aVwiXG4gICAgICAgICAgdHlwZTogc3RyaW5nXG4gICAgICAgICAgY2hpbGRyZW4/OiBDIFtdIC8vIFJlY29yZCA8c3RyaW5nLCAkQ2hpbGQ+XG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCA8JCBleHRlbmRzICRDb21wb25lbnQgPSAkQ29tcG9uZW50Plxue1xuICAgICBkYXRhOiAkXG5cbiAgICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IFNWR0VsZW1lbnRcblxuICAgICBkZWZhdWx0RGF0YSAoKSA6ICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfVxuICAgICB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBkYXRhOiAkIClcbiAgICAge1xuICAgICAgICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24gKFxuICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0RGF0YSAoKSxcbiAgICAgICAgICAgICAgIGNyZWF0ZU5vZGUgKCBkYXRhLnR5cGUsIGRhdGEuaWQsIGRhdGEgKSBhcyBhbnlcbiAgICAgICAgICApXG4gICAgIH1cblxuICAgICBnZXRIdG1sICgpOiAoSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50KSBbXVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gPGRpdiBjbGFzcz17IHRoaXMuZGF0YS50eXBlIH0+PC9kaXY+XG4gICAgICAgICAgICAgICB0aGlzLm9uQ3JlYXRlICgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG1ha2VIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IgKFwiTm90IGltcGxlbWVudGVkXCIpXG4gICAgIH1cblxuICAgICBwcm90ZWN0ZWQgbWFrZVN2ZyAoKVxuICAgICB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yIChcIk5vdCBpbXBsZW1lbnRlZFwiKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG1ha2VGYWJyaWMgKClcbiAgICAge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvciAoXCJOb3QgaW1wbGVtZW50ZWRcIilcbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlSHRtbCAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIG9uQ3JlYXRlU3ZnICgpXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgb25DcmVhdGVGYWJyaWMgKClcbiAgICAge1xuXG4gICAgIH1cblxufVxuXG5cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9EYXRhL2luZGV4LnRzXCIgLz5cblxuaW1wb3J0IHsgRmFjdG9yeSwgRGF0YWJhc2UgfSBmcm9tIFwiLi4vRGF0YS9pbmRleC5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5cbmNvbnN0IENPTlRFWFQgPSBcImNvbmNlcHQtdWlcIlxuY29uc3QgZGIgICAgICA9IG5ldyBEYXRhYmFzZSA8JEFueUNvbXBvbmVudHM+ICgpXG5jb25zdCBmYWN0b3J5ID0gbmV3IEZhY3RvcnkgPENvbXBvbmVudCwgJEFueUNvbXBvbmVudHM+ICggZGIgKVxuXG5leHBvcnQgY29uc3QgaW5TdG9jazogdHlwZW9mIGZhY3RvcnkuaW5TdG9jayA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5faW5TdG9jayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgcGljazogdHlwZW9mIGZhY3RvcnkucGljayA9IGZ1bmN0aW9uICggLi4uIHJlc3Q6IGFueSBbXSApXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICByZXR1cm4gZmFjdG9yeS5fcGljayAoIHBhdGggKVxufVxuXG5leHBvcnQgY29uc3QgbWFrZTogdHlwZW9mIGZhY3RvcnkubWFrZSA9IGZ1bmN0aW9uICgpXG57XG4gICAgIGNvbnN0IGFyZyA9IGFyZ3VtZW50cy5sZW5ndGggPT0gMVxuICAgICAgICAgICAgICAgPyBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiBhcmd1bWVudHNdIClcblxuICAgICBjb25zdCBwYXRoID0gZmFjdG9yeS5nZXRQYXRoICggYXJnIClcblxuICAgICBpZiAoIGlzTm9kZSAoIGFyZyApIClcbiAgICAgICAgICB2YXIgZGF0YSA9IGFyZ1xuXG4gICAgIHJldHVybiBmYWN0b3J5Ll9tYWtlICggcGF0aCwgZGF0YSApXG59XG5cbmV4cG9ydCBjb25zdCBzZXQ6IHR5cGVvZiBkYi5zZXQgPSBmdW5jdGlvbiAoKVxue1xuICAgICBjb25zdCBhcmcgPSBub3JtYWxpemUgKCBhcmd1bWVudHMgWzBdIClcblxuICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT0gMSApXG4gICAgICAgICAgZGIuc2V0ICggYXJnIClcbiAgICAgZWxzZVxuICAgICAgICAgIGRiLnNldCAoIGFyZywgbm9ybWFsaXplICggYXJndW1lbnRzIFsxXSApIClcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmluZTogdHlwZW9mIGZhY3RvcnkuZGVmaW5lID0gZnVuY3Rpb24gKCBjdG9yOiBhbnksIC4uLiByZXN0OiBhbnkgKVxue1xuICAgICBjb25zdCBhcmcgPSByZXN0Lmxlbmd0aCA9PSAxXG4gICAgICAgICAgICAgICA/IG5vcm1hbGl6ZSAoIHJlc3QgWzBdIClcbiAgICAgICAgICAgICAgIDogbm9ybWFsaXplICggWy4uLiByZXN0XSApXG5cbiAgICAgY29uc3QgcGF0aCA9IGZhY3RvcnkuZ2V0UGF0aCAoIGFyZyApXG5cbiAgICAgZmFjdG9yeS5fZGVmaW5lICggY3RvciwgcGF0aCApXG59XG5cblxuZnVuY3Rpb24gaXNOb2RlICggb2JsOiBhbnkgKVxue1xuICAgICByZXR1cm4gdHlwZW9mIG9ibCA9PSBcIm9iamVjdFwiICYmICEgQXJyYXkuaXNBcnJheSAob2JsKVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemUgKCBhcmc6IGFueSApXG57XG4gICAgIGlmICggQXJyYXkuaXNBcnJheSAoYXJnKSApXG4gICAgIHtcbiAgICAgICAgICBpZiAoIGFyZyBbMF0gIT09IENPTlRFWFQgKVxuICAgICAgICAgICAgICAgYXJnLnVuc2hpZnQgKCBDT05URVhUIClcbiAgICAgfVxuICAgICBlbHNlIGlmICggdHlwZW9mIGFyZyA9PSBcIm9iamVjdFwiIClcbiAgICAge1xuICAgICAgICAgIGlmICggXCJjb250ZXh0XCIgaW4gYXJnIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBpZiAoIGFyZy5jb250ZXh0ICE9PSBDT05URVhUIClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJCYWQgY29udGV4dCB2YWx1ZVwiXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICAoYXJnIGFzIGFueSkuY29udGV4dCA9IENPTlRFWFRcbiAgICAgICAgICB9XG4gICAgIH1cblxuICAgICByZXR1cm4gYXJnXG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db21wb25lbnQvaW5kZXguanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRQaGFudG9tIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJwaGFudG9tXCJcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGhhbnRvbSBleHRlbmRzIENvbXBvbmVudCA8JFBoYW50b20+XG57XG4gICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgaWYgKCB0aGlzLmNvbnRhaW5lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiZGl2XCIgKVxuICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gdGhpcy5kYXRhLmNvbnRlbnRcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIuY2hpbGROb2RlcyBhcyBhbnkgYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxufVxuXG5cbiIsIlxuaW1wb3J0IHsgcGljaywgaW5TdG9jaywgbWFrZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IFBoYW50b20gfSBmcm9tIFwiLi4vLi4vQ29tcG9uZW50L1BoYW50b20vaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4veG5vZGUuanNcIlxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJENvbnRhaW5lciA8QyBleHRlbmRzICRDb21wb25lbnQgPSAkQW55Q29tcG9uZW50cz4gZXh0ZW5kcyAkQ29tcG9uZW50IC8vRGF0YS4kQ2x1c3RlciA8Qz5cbiAgICAge1xuICAgICAgICAgIGRpcmVjdGlvbj86IERpcmVjdGlvblxuICAgICAgICAgIGNoaWxkcmVuPzogQyBbXSAvLyBSZWNvcmQgPHN0cmluZywgIEM+XG4gICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbnRhaW5lciA8JCBleHRlbmRzICRDb250YWluZXIgPSAkQ29udGFpbmVyPiBleHRlbmRzIENvbXBvbmVudCA8JD5cbntcbiAgICAgY2hpbGRyZW4gPSB7fSBhcyBSZWNvcmQgPHN0cmluZywgQ29tcG9uZW50PlxuICAgICBzbG90OiBKU1guRWxlbWVudFxuXG4gICAgIHJlYWRvbmx5IGlzX3ZlcnRpY2FsOiBib29sZWFuXG5cbiAgICAgZGVmYXVsdERhdGEgKCkgOiAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwiY29tcG9uZW50XCIsXG4gICAgICAgICAgICAgICBpZCAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJsclwiLFxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGNvbnN0cnVjdG9yICggZGF0YTogJCApXG4gICAgIHtcbiAgICAgICAgICBzdXBlciAoIGRhdGEgKVxuXG4gICAgICAgICAgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gZGF0YS5jaGlsZHJlblxuXG4gICAgICAgICAgaWYgKCBjaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgaW5TdG9jayAoIGNoaWxkICkgKVxuICAgICAgICAgICAgICAgICAgICAgICAgIG1ha2UgKCBjaGlsZCApXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5pc192ZXJ0aWNhbCA9IGRhdGEuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBkYXRhLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBjb25zdCBlbGVtZW50cyAgPSBzdXBlci5nZXRIdG1sICgpXG4gICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5jb250YWluZXJcbiAgICAgICAgICBjb25zdCBkYXRhICAgICAgPSB0aGlzLmRhdGFcbiAgICAgICAgICBjb25zdCBjaGlsZHJlbiAgPSB0aGlzLmNoaWxkcmVuXG4gICAgICAgICAgY29uc3QgdW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBpZiAoIHRoaXMuaXNfdmVydGljYWwgKVxuICAgICAgICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcInZlcnRpY2FsXCIgKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICggXCJ2ZXJ0aWNhbFwiIClcblxuICAgICAgICAgIGlmICggdGhpcy5zbG90ID09IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0aGlzLnNsb3QgPSBjb250YWluZXJcblxuICAgICAgICAgIGNvbnN0IHNsb3QgPSB0aGlzLnNsb3RcblxuICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgbmV3X2NoaWxkcmVuID0gW10gYXMgQ29tcG9uZW50IFtdXG5cbiAgICAgICAgICAgICAgIGZvciAoIGNvbnN0IGNoaWxkIG9mIGRhdGEuY2hpbGRyZW4gKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvID0gcGljayAoIGNoaWxkIClcbiAgICAgICAgICAgICAgICAgICAgc2xvdC5hcHBlbmQgKCAuLi4gby5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4gW28uZGF0YS5pZF0gPSBvXG4gICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgIHRoaXMub25DaGlsZHJlbkFkZGVkICggbmV3X2NoaWxkcmVuIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZWxlbWVudHNcbiAgICAgfVxuXG4gICAgIG9uQ2hpbGRyZW5BZGRlZCAoIGNvbXBvbmVudHM6IENvbXBvbmVudCBbXSApXG4gICAgIHtcblxuICAgICB9XG5cbiAgICAgYXBwZW5kICggLi4uIGVsZW1lbnRzOiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRBbnlDb21wb25lbnRzKSBbXSApXG4gICAgIHtcblxuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHRoaXMuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCAgICAgID0gdGhpcy5zbG90XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gID0gdGhpcy5jaGlsZHJlblxuICAgICAgICAgIGNvbnN0IG5ld19jaGlsZCA9IFtdIGFzIENvbXBvbmVudCBbXVxuXG4gICAgICAgICAgZm9yICggdmFyIGUgb2YgZWxlbWVudHMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGUgPT0gXCJzdHJpbmdcIiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBuZXcgUGhhbnRvbSAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgICA6IFwicGhhbnRvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBlXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBlbHNlIGlmICggZSBpbnN0YW5jZW9mIEVsZW1lbnQgKVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBVSV9DT01QT05FTlQgPSBTeW1ib2wuZm9yICggXCJVSV9DT01QT05FTlRcIiApXG5cbiAgICAgICAgICAgICAgICAgICAgZSA9IGUgW1VJX0NPTVBPTkVOVF0gIT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgPyBlIFtVSV9DT01QT05FTlRdXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgUGhhbnRvbSAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlICAgOiBcInBoYW50b21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkICA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGUub3V0ZXJIVE1MXG4gICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIGVsc2UgaWYgKCAhKGUgaW5zdGFuY2VvZiBDb21wb25lbnQpIClcbiAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZSA9IGluU3RvY2sgKCBlICkgPyBwaWNrICggZSApIDogbWFrZSAoIGUgKVxuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBgVW5hYmxlIHRvIGFkZCBhIGNoaWxkIG9mIHR5cGUgJHsgdHlwZW9mIGUgfWBcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgY2hpbGRyZW4gWyhlIGFzIENvbXBvbmVudCkuZGF0YS5pZF0gPSBlIGFzIENvbXBvbmVudFxuICAgICAgICAgICAgICAgc2xvdC5hcHBlbmQgKCAuLi4gKGUgYXMgQ29tcG9uZW50KS5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgIG5ld19jaGlsZC5wdXNoICggZSBhcyBDb21wb25lbnQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggbmV3X2NoaWxkLmxlbmd0aCA+IDAgKVxuICAgICAgICAgICAgICAgdGhpcy5vbkNoaWxkcmVuQWRkZWQgKCBuZXdfY2hpbGQgKVxuICAgICB9XG5cbiAgICAgcmVtb3ZlICggLi4uIGVsZW1lbnRzOiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRDb21wb25lbnQpIFtdIClcbiAgICAge1xuXG4gICAgIH1cblxuICAgICBjbGVhciAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IHt9XG5cbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyIClcbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgfVxuXG59XG5cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGV4cG9ydCBpbnRlcmZhY2UgJEJsb2NrIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJibG9ja1wiXG4gICAgICAgICAgb3JpZW50YXRpb246IE9yaWVudGF0aW9uXG4gICAgICAgICAgZWxlbWVudHM6IENvbXBvbmVudCBbXVxuICAgICB9XG59XG5cbnR5cGUgT3JpZW50YXRpb24gPSBcInZlcnRpY2FsXCIgfCBcImhvcml6b250YWxcIlxuXG5leHBvcnQgY2xhc3MgQmxvY2sgZXh0ZW5kcyBDb21wb25lbnQgPCRCbG9jaz5cbntcbiAgICAgY29udGFpbmVyID0gPGRpdiBjbGFzcz1cImJhclwiPjwvZGl2PlxuXG4gICAgIGdldCBvcmllbnRhdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5jb250YWlucyAoIFwidmVydGljYWxcIiApXG4gICAgICAgICAgICAgICA/IFwiaG9yaXpvbnRhbFwiXG4gICAgICAgICAgICAgICA6IFwidmVydGljYWxcIlxuICAgICB9XG5cbiAgICAgc2V0IG9yaWVudGF0aW9uICggb3JpZW50YXRpb246IE9yaWVudGF0aW9uIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdFxuXG4gICAgICAgICAgdmFyIG5ld19vcmllbnRhdGlvbiA9IGNsYXNzTGlzdC5jb250YWlucyAoIFwidmVydGljYWxcIiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFwiaG9yaXpvbnRhbFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFwidmVydGljYWxcIlxuXG4gICAgICAgICAgaWYgKCBvcmllbnRhdGlvbiA9PSBuZXdfb3JpZW50YXRpb24gKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjbGFzc0xpc3QucmVwbGFjZSAgKCBvcmllbnRhdGlvbiwgbmV3X29yaWVudGF0aW9uIClcbiAgICAgfVxufVxuXG5cbmRlZmluZSAoIEJsb2NrLCBbXCJibG9ja1wiXSApXG4iLCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9ICAgICBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG4vL2ltcG9ydCB7IENvbW1hbmRzIH0gIGZyb20gXCIuLi8uLi9CYXNlL2NvbW1hbmQuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gICAgZnJvbSBcIi4uLy4uL2RiLmpzXCJcbmltcG9ydCB7IGNvbW1hbmQgfSBmcm9tIFwiLi4vLi4vY29tbWFuZC5qc1wiXG5cbmV4cG9ydCBjbGFzcyBCdXR0b24gZXh0ZW5kcyBDb21wb25lbnQgPCRCdXR0b24+XG57XG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5kYXRhXG5cbiAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSA8ZGl2IGNsYXNzPVwiYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgICAgICAgeyBkYXRhLnRleHQgPyA8c3BhbiBjbGFzcz1cInRleHRcIj57IGRhdGEudGV4dCB9PC9zcGFuPiA6IG51bGwgfVxuICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICE9IHVuZGVmaW5lZCB8fCB0aGlzLmRhdGEuY29tbWFuZCAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIgKCBcImNsaWNrXCIsIHRoaXMub25Ub3VjaC5iaW5kICh0aGlzKSApXG5cbiAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gbm9kZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIG9uVG91Y2ggKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNhbGxiYWNrICYmIHRoaXMuZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNvbW1hbmQgKVxuICAgICAgICAgICAgICAgLy9Db21tYW5kcy5jdXJyZW50LnJ1biAoIHRoaXMuZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIGNvbW1hbmQgKCB0aGlzLmRhdGEuY29tbWFuZCApLnJ1biAoKVxuICAgICB9XG5cbiAgICAgcHJvdGVjdGVkIG9uSG92ZXIgKClcbiAgICAge1xuXG4gICAgIH1cbn1cblxuXG5kZWZpbmUgKCBCdXR0b24sIFtcImJ1dHRvblwiXSApXG4iLCJcblxuaW1wb3J0IHsgc2V0IH0gICAgICBmcm9tIFwiLi4vLi4vZGIuanNcIlxuLy9pbXBvcnQgeyBDb21tYW5kcyB9IGZyb20gXCIuLi8uLi9CYXNlL2NvbW1hbmQuanNcIlxuaW1wb3J0IHsgeG5vZGUgfSAgICBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBjb21tYW5kIH0gZnJvbSBcIi4uLy4uL2NvbW1hbmQuanNcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRCdXR0b24gZXh0ZW5kcyAkQ29tcG9uZW50XG4gICAgIHtcbiAgICAgICAgICB0eXBlICAgICAgIDogXCJidXR0b25cIlxuICAgICAgICAgIGljb24gICAgICAgOiBzdHJpbmdcbiAgICAgICAgICB0ZXh0PyAgICAgIDogc3RyaW5nXG4gICAgICAgICAgdG9vbHRpcD8gICA6IEpTWC5FbGVtZW50XG4gICAgICAgICAgZm9udEZhbWlseT86IHN0cmluZyxcbiAgICAgICAgICBjYWxsYmFjaz8gIDogKCkgPT4gYm9vbGVhbiB8IHZvaWQsXG4gICAgICAgICAgY29tbWFuZD8gICA6IHN0cmluZyxcbiAgICAgICAgICBoYW5kbGVPbj8gIDogXCJ0b2dnbGVcIiB8IFwiZHJhZ1wiIHwgXCIqXCJcbiAgICAgfVxufVxuXG5jb25zdCBfQnV0dG9uID0gKCBkYXRhOiAkQnV0dG9uICkgPT5cbntcbiAgICAgY29uc3Qgb25Ub3VjaCA9ICgpID0+XG4gICAgIHtcbiAgICAgICAgICBpZiAoIGRhdGEuY2FsbGJhY2sgJiYgZGF0YS5jYWxsYmFjayAoKSAhPT0gdHJ1ZSApXG4gICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgIGlmICggZGF0YS5jb21tYW5kIClcbiAgICAgICAgICAgICAgIC8vQ29tbWFuZHMuY3VycmVudC5ydW4gKCBkYXRhLmNvbW1hbmQgKVxuICAgICAgICAgICAgICAgY29tbWFuZCAoIGRhdGEuY29tbWFuZCApXG4gICAgIH1cblxuICAgICBjb25zdCBub2RlID1cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnV0dG9uXCIgb25DbGljaz17IGRhdGEuY2FsbGJhY2sgfHwgZGF0YS5jb21tYW5kID8gb25Ub3VjaCA6IG51bGwgfT5cbiAgICAgICAgICAgICAgIHsgZGF0YS5pY29uID8gPHNwYW4gY2xhc3M9XCJpY29uXCI+eyBkYXRhLmljb24gfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICAgICAgIHsgZGF0YS50ZXh0ID8gPHNwYW4gY2xhc3M9XCJ0ZXh0XCI+eyBkYXRhLnRleHQgfTwvc3Bhbj4gOiBudWxsIH1cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICByZXR1cm4gbm9kZVxufVxuXG5cbmV4cG9ydCB7IEJ1dHRvbiB9IGZyb20gXCIuL2h0bWwuanNcIlxuXG5leHBvcnQgY29uc3QgJGRlZmF1bHQgPSB7XG4gICAgIHR5cGU6IFwiYnV0dG9uXCIgYXMgXCJidXR0b25cIixcbiAgICAgaWQgIDogdW5kZWZpbmVkLFxuICAgICBpY29uOiB1bmRlZmluZWQsXG59XG5cbnNldCA8JEJ1dHRvbj4gKCBbIFwiYnV0dG9uXCIgXSwgJGRlZmF1bHQgKVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IENvbnRhaW5lciB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbnRhaW5lci9pbmRleC5qc1wiXG5pbXBvcnQgeyBzd2lwZWFibGUsIFN3aXBlYWJsZUVsZW1lbnQgfSBmcm9tIFwiLi4vLi4vQmFzZS9zd2lwZWFibGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgZXhwb3J0IGludGVyZmFjZSAkU2xpZGVzaG93IGV4dGVuZHMgJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgICAgOiBcInNsaWRlc2hvd1wiXG4gICAgICAgICAgY2hpbGRyZW4gICAgOiAkQW55Q29tcG9uZW50cyBbXVxuICAgICAgICAgIGlzU3dpcGVhYmxlPzogYm9vbGVhblxuICAgICB9XG5cbiAgICAgZXhwb3J0IGludGVyZmFjZSAkU2xpZGUgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNsaWRlXCJcbiAgICAgfVxufVxuXG4vLyAgIGBgYFxuLy8gICAuc2xpZGVzaG93XG4vLyAgICAgICAgWy4uLl1cbi8vICAgYGBgXG5leHBvcnQgY2xhc3MgU2xpZGVzaG93IGV4dGVuZHMgQ29udGFpbmVyIDwkU2xpZGVzaG93Plxue1xuICAgICBjaGlsZHJlbiA9IHt9IGFzIFJlY29yZCA8c3RyaW5nLCBDb250YWluZXI+XG4gICAgIGN1cnJlbnQ6IENvbXBvbmVudFxuICAgICBwcml2YXRlIHN3aXBlYWJsZTogU3dpcGVhYmxlRWxlbWVudFxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gc3VwZXIuZ2V0SHRtbCAoKVxuXG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBpZiAoIGRhdGEuaXNTd2lwZWFibGUgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gc3dpcGVhYmxlICggY29udGFpbmVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICAgICAgIG1pblZhbHVlICA6IC0wLFxuICAgICAgICAgICAgICAgICAgICBtYXhWYWx1ZSAgOiAwLFxuICAgICAgICAgICAgICAgICAgICBwb3JwZXJ0eSAgOiBkYXRhLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgZGF0YS5kaXJlY3Rpb24gPT0gXCJ0YlwiID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIHVuaXRzICAgICA6IFwicHhcIixcbiAgICAgICAgICAgICAgICAgICAgbW91c2VXaGVlbDogdHJ1ZSxcbiAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBlbGVtZW50c1xuICAgICB9XG5cbiAgICAgc2hvdyAoIGlkOiBzdHJpbmcsIC4uLiBjb250ZW50OiAoc3RyaW5nIHwgRWxlbWVudCB8IENvbXBvbmVudCB8ICRBbnlDb21wb25lbnRzICkgW10gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuIFtpZF1cblxuICAgICAgICAgIGlmICggY2hpbGQgPT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgaWYgKCB0aGlzLmN1cnJlbnQgKVxuICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gY2hpbGRcblxuICAgICAgICAgIGlmICggY29udGVudCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY2hpbGQuY2xlYXIgKClcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nICggY29udGVudCApXG4gICAgICAgICAgICAgICBjaGlsZC5hcHBlbmQgKCAuLi4gY29udGVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2hpbGQuY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBTbGlkZXNob3csIFtcInNsaWRlc2hvd1wiXSApXG5kZWZpbmUgKCBDb250YWluZXIsIFtcInNsaWRlXCJdICAgICApXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgVW5pdCB9IGZyb20gXCIuLi8uLi8uLi9MaWIvY3NzL3VuaXQuanNcIlxuaW1wb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29udGFpbmVyL2luZGV4LmpzXCJcbmltcG9ydCB7IFN3aXBlYWJsZUVsZW1lbnQsIHN3aXBlYWJsZSB9IGZyb20gXCIuLi8uLi9CYXNlL3N3aXBlYWJsZS5qc1wiXG5pbXBvcnQgeyBFeHBlbmRhYmxlRWxlbWVudCwgZXhwYW5kYWJsZSB9IGZyb20gXCIuLi8uLi9CYXNlL2V4cGVuZGFibGUuanNcIlxuaW1wb3J0IHsgY3NzRmxvYXQgfSBmcm9tIFwiLi4vLi4vQmFzZS9kb20uanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcblxuZGVjbGFyZSBnbG9iYWxcbntcbiAgICAgaW50ZXJmYWNlICRMaXN0VmlldyBleHRlbmRzICRDb250YWluZXJcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwibGlzdC12aWV3XCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTGlzdFZpZXcgPCQgZXh0ZW5kcyAkRXh0ZW5kcyA8JExpc3RWaWV3Pj4gZXh0ZW5kcyBDb250YWluZXIgPCQ+XG57XG4gICAgIHN3aXBlYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcblxuICAgICBnZXRIdG1sICgpXG4gICAgIHtcbiAgICAgICAgICBpZiAoIHRoaXMuY29udGFpbmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuY29udGFpbmVyXVxuXG4gICAgICAgICAgY29uc3Qgc2xvdCA9IHRoaXMuc2xvdCA9IDxkaXYgY2xhc3M9XCJsaXN0LXZpZXctc2xpZGVcIj48L2Rpdj5cblxuICAgICAgICAgIHN1cGVyLmdldEh0bWwgKClcblxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyXG5cbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kICggc2xvdCApXG4gICAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImxpc3Qtdmlld1wiIClcblxuICAgICAgICAgIHRoaXMuc3dpcGVhYmxlID0gZXhwYW5kYWJsZSAoIHNsb3QsIHtcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICA6IFsgY29udGFpbmVyIF0sXG4gICAgICAgICAgICAgICBtaW5TaXplICA6IDAsXG4gICAgICAgICAgICAgICBtYXhTaXplICA6IDAsXG4gICAgICAgICAgICAgICBwcm9wZXJ0eSAgOiB0aGlzLmlzX3ZlcnRpY2FsID8gXCJ0b3BcIjogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgICBkaXJlY3Rpb24gOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgdW5pdCAgICAgOiBcInB4XCIsXG4gICAgICAgICAgICAgICAvL21vdXNlV2hlZWw6IHRydWUsXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLnN3aXBlYWJsZS5hY3RpdmF0ZSAoKVxuXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIkRPTUNvbnRlbnRMb2FkZWRcIiwgKCkgPT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLnN3aXBlYWJsZS51cGRhdGVDb25maWcgKHtcbiAgICAgICAgICAgICAgICAgICAgbWluU2l6ZTogLXRoaXMuc2xpZGVTaXplICgpLFxuICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgcmV0dXJuIFt0aGlzLmNvbnRhaW5lcl1cbiAgICAgfVxuXG4gICAgIG9uQ2hpbGRyZW5BZGRlZCAoIGVsZW1lbnRzOiBDb21wb25lbnQgW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5zd2lwZWFibGUudXBkYXRlQ29uZmlnICh7XG4gICAgICAgICAgICAgICBtaW5TaXplICA6IC10aGlzLnNsaWRlU2l6ZSAoKSxcbiAgICAgICAgICAgICAgIHByb3BlcnR5IDogdGhpcy5pc192ZXJ0aWNhbCA/IFwidG9wXCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLmRhdGEuZGlyZWN0aW9uLFxuICAgICAgICAgIH0pXG4gICAgIH1cblxuICAgICBwcml2YXRlIHNsaWRlU2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBzbG90IH0gPSB0aGlzXG5cbiAgICAgICAgICByZXR1cm4gY3NzRmxvYXQgKCBzbG90LCB0aGlzLmlzX3ZlcnRpY2FsID8gXCJoZWlnaHRcIiA6IFwid2lkdGhcIiApXG4gICAgIH1cblxuICAgICBzd2lwZSAoIG9mZnNldDogc3RyaW5nfG51bWJlciwgdW5pdD86IFwicHhcIiB8IFwiJVwiIClcbiAgICAge1xuICAgICAgICAgLy8gaWYgKCB0eXBlb2Ygb2Zmc2V0ID09IFwic3RyaW5nXCIgKVxuICAgICAgICAgLy8gICAgICB0aGlzLnN3aXBlYWJsZS5zd2lwZSAoIG9mZnNldCApXG4gICAgICAgICAvLyBlbHNlXG4gICAgICAgICAvLyAgICAgIHRoaXMuc3dpcGVhYmxlLnN3aXBlICggb2Zmc2V0LCB1bml0IClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBMaXN0VmlldyB9IGZyb20gXCIuLi9MaXN0L2luZGV4LmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5cbnR5cGUgRGlyZWN0aW9uID0gXCJsclwiIHwgXCJybFwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbnR5cGUgVW5pdHMgPSBcInB4XCIgfCBcIiVcIlxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBleHBvcnQgaW50ZXJmYWNlICRUb29sYmFyIGV4dGVuZHMgJEV4dGVuZHMgPCRMaXN0Vmlldz4gLy8gJENvbnRhaW5lclxuICAgICB7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInRvb2xiYXJcIlxuICAgICAgICAgIHRpdGxlICAgIDogc3RyaW5nXG4gICAgICAgICAgYnV0dG9ucyAgOiAkQnV0dG9uIFtdXG4gICAgIH1cbn1cblxuY29uc3QgdG9GbGV4RGlyZWN0aW9uID0ge1xuICAgICBscjogXCJyb3dcIiAgICAgICAgICAgIGFzIFwicm93XCIsXG4gICAgIHJsOiBcInJvdy1yZXZlcnNlXCIgICAgYXMgXCJyb3ctcmV2ZXJzZVwiLFxuICAgICB0YjogXCJjb2x1bW5cIiAgICAgICAgIGFzIFwiY29sdW1uXCIsXG4gICAgIGJ0OiBcImNvbHVtbi1yZXZlcnNlXCIgYXMgXCJjb2x1bW4tcmV2ZXJzZVwiLFxufVxuXG5jb25zdCB0b1JldmVyc2UgPSB7XG4gICAgIGxyOiBcInJsXCIgYXMgXCJybFwiLFxuICAgICBybDogXCJsclwiIGFzIFwibHJcIixcbiAgICAgdGI6IFwiYnRcIiBhcyBcImJ0XCIsXG4gICAgIGJ0OiBcInRiXCIgYXMgXCJ0YlwiLFxufVxuXG4vKipcbiAqICAgYGBgcHVnXG4gKiAgIC50b29sYmFyXG4gKiAgICAgICAgLnRvb2xiYXItYmFja2dyb3VuZ1xuICogICAgICAgIC50b29sYmFyLXNsaWRlXG4gKiAgICAgICAgICAgICBbLi4uXVxuICogICBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFRvb2xiYXIgZXh0ZW5kcyBMaXN0VmlldyA8JFRvb2xiYXI+XG57XG4gICAgIHRhYnMgICAgICA6IEpTWC5FbGVtZW50IFtdXG4gICAgIGJhY2tncm91bmQ6IEpTWC5FbGVtZW50XG5cbiAgICAgZGVmYXVsdENvbmZpZyAoKTogJFRvb2xiYXJcbiAgICAge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAuLi4gc3VwZXIuZGVmYXVsdERhdGEgKCksXG4gICAgICAgICAgICAgICB0eXBlICAgICA6IFwidG9vbGJhclwiLFxuICAgICAgICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uLlwiLFxuICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImxyXCIsXG4gICAgICAgICAgICAgICAvL3JldmVyc2UgIDogZmFsc2UsXG4gICAgICAgICAgICAgICBidXR0b25zOiBbXVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIGdldEh0bWwgKClcbiAgICAge1xuICAgICAgICAgIGlmICggdGhpcy5jb250YWluZXIgIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG5cbiAgICAgICAgICBzdXBlci5nZXRIdG1sICgpXG5cbiAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5idXR0b25zIClcbiAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kICggLi4uIHRoaXMuZGF0YS5idXR0b25zIClcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXJdXG4gICAgIH1cbn1cblxuZGVmaW5lICggVG9vbGJhciwgW1widG9vbGJhclwiXSApXG4iLCJcbmltcG9ydCB7IGRyYWdnYWJsZSwgRHJhZ0V2ZW50IH0gZnJvbSBcIi4vZHJhZ2dhYmxlLmpzXCJcblxudHlwZSBEaXJlY3Rpb24gPSBcImxyXCIgfCBcInJsXCIgfCBcImJ0XCIgfCBcInRiXCJcbnR5cGUgRE9NRWxlbWVudCA9IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudFxuXG5leHBvcnQgaW50ZXJmYWNlIFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICBoYW5kbGVzOiBET01FbGVtZW50IFtdXG4gICAgIGRpcmVjdGlvbjogRGlyZWN0aW9uXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDb25maWcgKCk6IFNjb2xsYWJsZUNvbmZpZ1xue1xuICAgICByZXR1cm4ge1xuICAgICAgICAgIGhhbmRsZXMgIDogW10sXG4gICAgICAgICAgZGlyZWN0aW9uOiBcInRiXCJcbiAgICAgfVxufVxuXG5mdW5jdGlvbiBzY3JvbGxhYmxlTmF0aXZlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgZGVzYWN0aXZhdGUgKClcblxuICAgICByZXR1cm4ge1xuICAgICAgICAgIGFjdGl2YXRlLFxuICAgICAgICAgIGRlc2FjdGl2YXRlLFxuICAgICB9XG5cbiAgICAgZnVuY3Rpb24gYWN0aXZhdGUgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IGRpciA9IG9wdGlvbnMuZGlyZWN0aW9uID09IFwiYnRcIiB8fCBvcHRpb25zLmRpcmVjdGlvbiA9PSBcInRiXCJcbiAgICAgICAgICAgICAgICAgICAgPyBcInBhbi15XCIgOiBcInBhbi14XCJcblxuICAgICAgICAgIGZvciAoIGNvbnN0IGggb2Ygb3B0aW9ucy5oYW5kbGVzIClcbiAgICAgICAgICAgICAgIGguc3R5bGUudG91Y2hBY3Rpb24gPSBkaXJcbiAgICAgfVxuXG4gICAgIGZ1bmN0aW9uIGRlc2FjdGl2YXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkaXIgPSBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgID8gXCJwYW4teVwiIDogXCJwYW4teFwiXG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnN0eWxlLnRvdWNoQWN0aW9uID0gXCJub25lXCJcbiAgICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2NvbGxhYmxlICggb3B0aW9uczogU2NvbGxhYmxlQ29uZmlnIClcbntcbiAgICAgaWYgKCBcIm9udG91Y2hzdGFydFwiIGluIHdpbmRvdyApXG4gICAgICAgICAgcmV0dXJuIHNjcm9sbGFibGVOYXRpdmUgKCBvcHRpb25zIClcblxuICAgICBjb25zdCBkcmFnID0gZHJhZ2dhYmxlICh7XG4gICAgICAgICAgaGFuZGxlcyAgICAgICA6IG9wdGlvbnMuaGFuZGxlcyxcbiAgICAgICAgICB2ZWxvY2l0eUZhY3RvcjogMTAwLFxuICAgICAgICAgIG9uU3RhcnREcmFnLFxuICAgICAgICAgIG9uRHJhZyAgICAgOiBvcHRpb25zLmRpcmVjdGlvbiA9PSBcImJ0XCIgfHwgb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJ0YlwiXG4gICAgICAgICAgICAgICAgICAgICA/IG9uRHJhZ1ZlcnRpY2FsXG4gICAgICAgICAgICAgICAgICAgICA6IG9uRHJhZ0hvcml6b250YWwsXG4gICAgICAgICAgb25TdG9wRHJhZzogb3B0aW9ucy5kaXJlY3Rpb24gPT0gXCJidFwiIHx8IG9wdGlvbnMuZGlyZWN0aW9uID09IFwidGJcIlxuICAgICAgICAgICAgICAgICAgICA/IG9uU3RvcERyYWdWZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICA6IG9uU3RvcERyYWdIb3Jpem9udGFsLFxuICAgICB9KVxuXG4gICAgIHJldHVybiB7XG4gICAgICAgICAgYWN0aXZhdGU6ICgpID0+IHsgZHJhZy5hY3RpdmF0ZSAoKSB9XG4gICAgIH1cblxuICAgICBmdW5jdGlvbiBvblN0YXJ0RHJhZyAoKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwidW5zZXRcIlxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uRHJhZ1ZlcnRpY2FsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAgICAgICBoLnNjcm9sbEJ5ICggMCwgZXZlbnQub2Zmc2V0WSApXG4gICAgIH1cbiAgICAgZnVuY3Rpb24gb25EcmFnSG9yaXpvbnRhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdWZXJ0aWNhbCAoIGV2ZW50OiBEcmFnRXZlbnQgKVxuICAgICB7XG4gICAgICAgICAgZm9yICggY29uc3QgaCBvZiBvcHRpb25zLmhhbmRsZXMgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGguc2Nyb2xsQnkgKCAwLCBldmVudC5vZmZzZXRZIClcbiAgICAgICAgICAgICAgIC8vaC5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IFwic21vb3RoXCJcbiAgICAgICAgICAgICAgIC8vaC5zY3JvbGxCeSAoIDAsIGV2ZW50Lm9mZnNldFkgKyBldmVudC52ZWxvY2l0eVkgKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICB9XG4gICAgIGZ1bmN0aW9uIG9uU3RvcERyYWdIb3Jpem9udGFsICggZXZlbnQ6IERyYWdFdmVudCApXG4gICAgIHtcbiAgICAgICAgICBmb3IgKCBjb25zdCBoIG9mIG9wdGlvbnMuaGFuZGxlcyApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgaC5zY3JvbGxCeSAoIGV2ZW50Lm9mZnNldFgsIDAgKVxuICAgICAgICAgICAgICAgLy9oLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gXCJzbW9vdGhcIlxuICAgICAgICAgICAgICAgLy9oLnNjcm9sbEJ5ICggZXZlbnQub2Zmc2V0WCArIGV2ZW50LnZlbG9jaXR5WCwgMCApXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgIH1cbn1cbiIsIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi4vLi4vQmFzZS9Db250YWluZXIvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IGV4cGFuZGFibGUsIEV4cGVuZGFibGVFbGVtZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvZXhwZW5kYWJsZS5qc1wiXG5pbXBvcnQgeyBwaWNrLCBkZWZpbmUsIGluU3RvY2ssIG1ha2UgfSBmcm9tIFwiLi4vLi4vZGIuanNcIlxuaW1wb3J0IHsgc2NvbGxhYmxlIH0gZnJvbSBcIi4uLy4uL0Jhc2Uvc2Nyb2xsYWJsZS5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkU2lkZU1lbnUgZXh0ZW5kcyAkQ29udGFpbmVyXG4gICAgIHtcbiAgICAgICAgICB0eXBlOiBcInNpZGUtbWVudVwiXG4gICAgICAgICAgaGFzTWFpbkJ1dHRvbjogYm9vbGVhbixcbiAgICAgICAgICBoZWFkZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgICAgICBjaGlsZHJlbj8gICAgOiAkQW55Q29tcG9uZW50cyBbXSxcbiAgICAgICAgICBmb290ZXI/ICAgICAgOiAkQW55Q29tcG9uZW50cyxcbiAgICAgfVxufVxuXG50eXBlIERpcmVjdGlvbiA9IFwibHJcIiB8IFwicmxcIiB8IFwidGJcIiB8IFwiYnRcIlxuXG5jb25zdCB0b1Bvc2l0aW9uID0ge1xuICAgICBsciA6IFwibGVmdFwiLFxuICAgICBybCA6IFwicmlnaHRcIixcbiAgICAgdGIgOiBcInRvcFwiLFxuICAgICBidCA6IFwiYm90dG9tXCIsXG59XG5cbnZhciBsZWZ0X21lbnUgICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciByaWdodF9tZW51ICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciB0b3BfbWVudSAgICA9IG51bGwgYXMgU2lkZU1lbnVcbnZhciBib3R0b21fbWVudSA9IG51bGwgYXMgU2lkZU1lbnVcblxuZXhwb3J0IGNsYXNzIFNpZGVNZW51IGV4dGVuZHMgQ29udGFpbmVyIDwkU2lkZU1lbnU+XG57XG4gICAgIHN0YXRpYyBhdExlZnQ6IFNpZGVNZW51XG4gICAgIHN0YXRpYyBhdFJpZ2h0OiBTaWRlTWVudVxuICAgICBzdGF0aWMgYXRUb3A6IFNpZGVNZW51XG4gICAgIHN0YXRpYyBhdEJvdHRvbTogU2lkZU1lbnVcblxuICAgICBtYWluX2J1dHRvbjogSlNYLkVsZW1lbnRcbiAgICAgZXhwYW5kYWJsZTogRXhwZW5kYWJsZUVsZW1lbnRcbiAgICAgY29udGVudCAgICA6IENvbXBvbmVudFxuICAgICBoZWFkZXIgICAgIDogQ29tcG9uZW50XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZGF0YVxuICAgICAgICAgIGNvbnN0IGhlYWRlciAgICA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUtaGVhZGVyXCIgLz5cbiAgICAgICAgICBjb25zdCBjb250ZW50ICAgPSA8ZGl2IGNsYXNzPVwic2lkZS1tZW51LWNvbnRlbnRcIiAvPlxuICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IDxkaXYgY2xhc3M9XCJzaWRlLW1lbnUgY2xvc2VcIj5cbiAgICAgICAgICAgICAgIHsgaGVhZGVyIH1cbiAgICAgICAgICAgICAgIHsgY29udGVudCB9XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICBpZiAoIGRhdGEuaGVhZGVyIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICB0aGlzLmhlYWRlciA9IGluU3RvY2sgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA/IHBpY2sgKCBkYXRhLmhlYWRlciApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICA6IG1ha2UgKCBkYXRhLmhlYWRlciApXG5cbiAgICAgICAgICAgICAgIGhlYWRlci5hcHBlbmQgKCAuLi4gdGhpcy5oZWFkZXIuZ2V0SHRtbCAoKSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCBkYXRhLmhhc01haW5CdXR0b24gKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGNvbnN0IGJ0biA9IDxzcGFuIGNsYXNzPVwic2lkZS1tZW51LW1haW4tYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaWNvblwiPuKHlTwvc3Bhbj5cbiAgICAgICAgICAgICAgIDwvc3Bhbj5cblxuICAgICAgICAgICAgICAgdGhpcy5tYWluX2J1dHRvbiA9IGJ0blxuICAgICAgICAgICAgICAgaGVhZGVyLmluc2VydEFkamFjZW50RWxlbWVudCAoIFwiYWZ0ZXJiZWdpblwiLCBidG4gKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICggZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgZGF0YS5jaGlsZHJlbiApXG4gICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGVudCA9IGluU3RvY2sgKCBjaGlsZCApID8gcGljayAoIGNoaWxkICkgOiBtYWtlICggY2hpbGQgKVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYXBwZW5kICggLi4uIHRoaXMuY29udGVudC5nZXRIdG1sICgpIClcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAoIHRvUG9zaXRpb24gW2RhdGEuZGlyZWN0aW9uXSApXG4gICAgICAgICAgc2NvbGxhYmxlICh7IGhhbmRsZXM6IFtjb250ZW50XSwgZGlyZWN0aW9uOiBcImJ0XCIgfSkuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyICA9IGNvbnRhaW5lclxuICAgICAgICAgIHRoaXMuZXhwYW5kYWJsZSA9IGV4cGFuZGFibGUgKCB0aGlzLmNvbnRhaW5lciwge1xuICAgICAgICAgICAgICAgZGlyZWN0aW9uICAgIDogZGF0YS5kaXJlY3Rpb24sXG4gICAgICAgICAgICAgICBuZWFyICAgICAgICAgOiA2MCxcbiAgICAgICAgICAgICAgIGhhbmRsZXMgICAgICA6IEFycmF5Lm9mICggdGhpcy5tYWluX2J1dHRvbiApLFxuICAgICAgICAgICAgICAgb25BZnRlck9wZW4gIDogKCkgPT4gY29udGVudC5jbGFzc0xpc3QucmVtb3ZlICggXCJoaWRkZW5cIiApLFxuICAgICAgICAgICAgICAgb25CZWZvcmVDbG9zZTogKCkgPT4gY29udGVudC5jbGFzc0xpc3QuYWRkICggXCJoaWRkZW5cIiApXG4gICAgICAgICAgfSlcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuYWN0aXZhdGUgKClcblxuICAgICAgICAgIHJldHVybiBbIHRoaXMuY29udGFpbmVyIF0gYXMgSFRNTEVsZW1lbnQgW11cbiAgICAgfVxuXG4gICAgIGlzT3BlbiAoKVxuICAgICB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhwYW5kYWJsZS5pc09wZW4gKClcbiAgICAgfVxuXG4gICAgIGlzQ2xvc2UgKClcbiAgICAge1xuICAgICAgICAgIHJldHVybiB0aGlzLmV4cGFuZGFibGUuaXNDbG9zZSAoKVxuICAgICB9XG5cbiAgICAgb3BlbiAoKVxuICAgICB7XG5cbiAgICAgfVxuXG4gICAgIGNsb3NlICgpXG4gICAgIHtcbiAgICAgICAgICB0aGlzLmV4cGFuZGFibGUuY2xvc2UgKClcblxuICAgICAgICAgIHJldHVybiB0aGlzXG4gICAgIH1cbn1cblxuZGVmaW5lICggU2lkZU1lbnUsIFtcInNpZGUtbWVudVwiXSApXG4iLCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uL3hub2RlLmpzXCJcblxuZXhwb3J0IHR5cGUgU2hhcGVOYW1lcyA9IGtleW9mIFNoYXBlRGVmaW5pdGlvbnNcblxuZXhwb3J0IGludGVyZmFjZSBTaGFwZURlZmluaXRpb25zXG57XG4gICAgIGNpcmNsZSAgIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgdHJpYW5nbGUgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICBzcXVhcmUgICA6IE9iamVjdERlZmluaXRpb24sXG4gICAgIHBhbnRhZ29uIDogT2JqZWN0RGVmaW5pdGlvbixcbiAgICAgaGV4YWdvbiAgOiBPYmplY3REZWZpbml0aW9uLFxuICAgICB0ZXh0ICAgICA6IFRleHREZWZpbml0aW9uLFxuICAgICB0ZXh0Ym94ICA6IFRleHREZWZpbml0aW9uLFxuICAgICBwYXRoICAgICA6IFBhdGhEZWZpbml0aW9uLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgc2l6ZTogbnVtYmVyLFxuICAgICB4PyAgOiBudW1iZXIsXG4gICAgIHk/ICA6IG51bWJlclxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRleHREZWZpbml0aW9uIGV4dGVuZHMgT2JqZWN0RGVmaW5pdGlvblxue1xuICAgICB0ZXh0OiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYXRoRGVmaW5pdGlvbiBleHRlbmRzIE9iamVjdERlZmluaXRpb25cbntcbiAgICAgcGF0aDogc3RyaW5nXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSA8VCBleHRlbmRzIFNoYXBlTmFtZXM+IChcbiAgICAgdHlwZTogVCxcbiAgICAgZGVmIDogU2hhcGVEZWZpbml0aW9ucyBbVF0sXG4pOiBSZXR1cm5UeXBlIDx0eXBlb2YgU3ZnRmFjdG9yeSBbVF0+XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdTaGFwZSAoIHR5cGU6IFNoYXBlTmFtZXMsIGRlZjogYW55IClcbntcbiAgICAgc3dpdGNoICggdHlwZSApXG4gICAgIHtcbiAgICAgY2FzZSBcImNpcmNsZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LmNpcmNsZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRyaWFuZ2xlXCI6IHJldHVybiBTdmdGYWN0b3J5LnRyaWFuZ2xlICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInBhbnRhZ29uXCI6IHJldHVybiBTdmdGYWN0b3J5LnBhbnRhZ29uICggZGVmIClcbiAgICAgY2FzZSBcImhleGFnb25cIiA6IHJldHVybiBTdmdGYWN0b3J5LmhleGFnb24gICggZGVmIClcbiAgICAgY2FzZSBcInNxdWFyZVwiICA6IHJldHVybiBTdmdGYWN0b3J5LnNxdWFyZSAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnRleHQgICAgICggZGVmIClcbiAgICAgY2FzZSBcInRleHRib3hcIiA6IHJldHVybiBTdmdGYWN0b3J5LnRleHRib3ggICggZGVmIClcbiAgICAgY2FzZSBcInBhdGhcIiAgICA6IHJldHVybiBTdmdGYWN0b3J5LnBhdGggICAgICggZGVmIClcbiAgICAgfVxufVxuXG5jbGFzcyBTdmdGYWN0b3J5XG57XG4gICAgIC8vIFRvIGdldCB0cmlhbmdsZSwgc3F1YXJlLCBbcGFudGF8aGV4YV1nb24gcG9pbnRzXG4gICAgIC8vXG4gICAgIC8vIHZhciBhID0gTWF0aC5QSSoyLzRcbiAgICAgLy8gZm9yICggdmFyIGkgPSAwIDsgaSAhPSA0IDsgaSsrIClcbiAgICAgLy8gICAgIGNvbnNvbGUubG9nICggYFsgJHsgTWF0aC5zaW4oYSppKSB9LCAkeyBNYXRoLmNvcyhhKmkpIH0gXWAgKVxuXG4gICAgIHN0YXRpYyBjaXJjbGUgKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3Qgbm9kZSA9IDxjaXJjbGVcbiAgICAgICAgICAgICAgIGN4ID0geyBkZWYueCB8fCAwIH1cbiAgICAgICAgICAgICAgIGN5ID0geyBkZWYueSB8fCAwIH1cbiAgICAgICAgICAgICAgIHIgID0geyBkZWYuc2l6ZSAvIDIgfVxuICAgICAgICAgIC8+XG5cbiAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICB9XG5cbiAgICAgc3RhdGljIHRyaWFuZ2xlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cblxuICAgICBzdGF0aWMgc3F1YXJlICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIHBhbnRhZ29uICggZGVmOiBPYmplY3REZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG5cbiAgICAgc3RhdGljIGhleGFnb24gKCBkZWY6IE9iamVjdERlZmluaXRpb24gKVxuICAgICB7XG4gICAgIH1cblxuXG4gICAgIHN0YXRpYyB0ZXh0ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG4gICAgIHN0YXRpYyB0ZXh0Ym94ICggZGVmOiBUZXh0RGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgfVxuXG5cbiAgICAgc3RhdGljIHBhdGggKCBkZWY6IFBhdGhEZWZpbml0aW9uIClcbiAgICAge1xuICAgICB9XG59XG4iLCJpbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCAqIGFzIFN2ZyBmcm9tIFwiLi4vLi4vQmFzZS9TdmcvaW5kZXguanNcIlxuaW1wb3J0IHsgeG5vZGUgfSBmcm9tIFwiLi4vLi4vQmFzZS94bm9kZS5qc1wiXG5cbmNvbnN0IEcgPSBHZW9tZXRyeVxuXG50eXBlIFJlbmRlcmVyID0gKCBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uICkgPT4gU1ZHRWxlbWVudCBbXVxudHlwZSBSYWRpYWxEZWZpbml0aW9uID0gR2VvbWV0cnkuUmFkaWFsRGVmaW5pdGlvblxudHlwZSBSYWRpYWxPcHRpb24gICAgID0gR2VvbWV0cnkuUmFkaWFsT3B0aW9uXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG4gICAgIGludGVyZmFjZSAkUmFkaWFsTWVudSBleHRlbmRzICRDb21wb25lbnRcbiAgICAge1xuICAgICAgICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgICAgICBidXR0b25zOiBQYXJ0aWFsIDwkQnV0dG9uPiBbXSxcbiAgICAgICAgICByb3RhdGlvbjogbnVtYmVyXG4gICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgUmFkaWFsTWVudSBleHRlbmRzIENvbXBvbmVudCA8JFJhZGlhbE1lbnU+XG57XG4gICAgIGNvbnRhaW5lcjogU1ZHU1ZHRWxlbWVudFxuICAgICBkZWZpbml0aW9uOiBSYWRpYWxEZWZpbml0aW9uXG5cbiAgICAgcmVhZG9ubHkgcmVuZGVyZXJzOiBSZWNvcmQgPHN0cmluZywgUmVuZGVyZXI+ID0ge1xuICAgICAgICAgIFwiY2lyY2xlXCI6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcy5iaW5kICh0aGlzKVxuICAgICB9XG5cbiAgICAgZ2V0SHRtbCAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy51cGRhdGUgKClcblxuICAgICAgICAgIHJldHVybiBbdGhpcy5jb250YWluZXIgYXMgYW55XVxuICAgICB9XG5cbiAgICAgYWRkICggLi4uIGJ1dHRvbnM6ICRCdXR0b24gW10gKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5kYXRhLmJ1dHRvbnMucHVzaCAoIC4uLiBidXR0b25zIGFzIGFueSApXG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZSAoKVxuICAgICB9XG5cbiAgICAgdXBkYXRlICgpXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IGRlZjogUmFkaWFsT3B0aW9uID0ge1xuICAgICAgICAgICAgICAgY291bnQgIDogZGF0YS5idXR0b25zLmxlbmd0aCxcbiAgICAgICAgICAgICAgIHIgICAgICA6IDc1LFxuICAgICAgICAgICAgICAgcGFkZGluZzogNixcbiAgICAgICAgICAgICAgIHJvdGF0aW9uOiBkYXRhLnJvdGF0aW9uIHx8IDBcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRlZmluaXRpb24gPSBHLmdldFJhZGlhbERpc3RyaWJ1dGlvbiAoIGRlZiApXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgID0gdGhpcy50b1N2ZyAoIFwiY2lyY2xlXCIgKVxuICAgICB9XG5cbiAgICAgcHJpdmF0ZSBlbmFibGVFdmVudHMgKClcbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgeyBvcHRpb25zIH0gPSB0aGlzXG4gICAgICAgICAgLy9mb3IgKCBjb25zdCBidG4gb2Ygb3B0aW9ucy5idXR0b25zIClcbiAgICAgICAgICAvLyAgICAgYnRuLlxuICAgICB9XG5cbiAgICAgc2hvdyAoIHg6IG51bWJlciwgeTogbnVtYmVyICk6IHZvaWRcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG4gPSB0aGlzLmNvbnRhaW5lclxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuZGVmaW5pdGlvbi53aWR0aCAvIDJcblxuICAgICAgICAgIG4uc3R5bGUubGVmdCA9ICh4IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uc3R5bGUudG9wICA9ICh5IC0gb2Zmc2V0KSArIFwicHhcIlxuICAgICAgICAgIG4uY2xhc3NMaXN0LnJlbW92ZSAoIFwiY2xvc2VcIiApXG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUuYmluZCAodGhpcyksIHRydWUgKVxuICAgICB9XG5cbiAgICAgaGlkZSAoKVxuICAgICB7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCAoXCJjbG9zZVwiKVxuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlZG93blwiLCB0aGlzLmhpZGUgKVxuICAgICB9XG5cbiAgICAgdG9TdmcgKCBzdHlsZTogc3RyaW5nIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZGVmaW5pdGlvbjogZGVmLCByZW5kZXJlcnMsIGRhdGEgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHN2ZyA9XG4gICAgICAgICAgICAgICA8c3ZnXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzICAgPVwicmFkaWFsLW1lbnUgY2xvc2VcIlxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgID17IGRlZi53aWR0aCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAgPXsgZGVmLmhlaWdodCArIFwicHhcIiB9XG4gICAgICAgICAgICAgICAgICAgIHZpZXdCb3ggPXsgYDAgMCAkeyBkZWYud2lkdGggfSAkeyBkZWYuaGVpZ2h0IH1gIH1cbiAgICAgICAgICAgICAgIC8+IGFzIFNWR1NWR0VsZW1lbnRcblxuICAgICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBzdHlsZSBpbiByZW5kZXJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICA/IHJlbmRlcmVycyBbc3R5bGVdICggZGVmIClcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMucmVuZGVyU3ZnQ2lyY2xlcyAoIGRlZiApXG5cbiAgICAgICAgICBzdmcuYXBwZW5kICggLi4uIGJ1dHRvbnMgYXMgTm9kZSBbXSApXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpICE9IGJ1dHRvbnMubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBvcHQgPSBkYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG9wdC5jYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIgKVxuICAgICAgICAgICAgICAgICAgICBidXR0b25zIFtpXS5hZGRFdmVudExpc3RlbmVyICggXCJtb3VzZWRvd25cIiwgKCkgPT4gb3B0LmNhbGxiYWNrICgpIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gc3ZnXG4gICAgIH1cblxuICAgICByZW5kZXJTdmdDaXJjbGVzICggZGVmaW5pdGlvbjogUmFkaWFsRGVmaW5pdGlvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBwb2ludHMgID0gZGVmaW5pdGlvbi5wb2ludHNcbiAgICAgICAgICBjb25zdCBwYWRkaW5nID0gZGVmaW5pdGlvbi5wYWRkaW5nXG4gICAgICAgICAgY29uc3QgYnV0dHVucyA9IFtdIGFzIFNWR0VsZW1lbnQgW11cblxuICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7ICsraSApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZGVmID0gcG9pbnRzIFtpXVxuICAgICAgICAgICAgICAgY29uc3QgYnRuID0gdGhpcy5kYXRhLmJ1dHRvbnMgW2ldXG5cbiAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwID0gPGcgY2xhc3M9XCJidXR0b25cIiAvPlxuXG4gICAgICAgICAgICAgICBjb25zdCBjaXJjbGUgPSBTdmcuY3JlYXRlU3ZnU2hhcGUgKCBcImNpcmNsZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGRlZi5jaG9yZC5sZW5ndGggLSBwYWRkaW5nICogMixcbiAgICAgICAgICAgICAgICAgICAgeDogZGVmLngsXG4gICAgICAgICAgICAgICAgICAgIHk6IGRlZi55XG4gICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gPHRleHRcbiAgICAgICAgICAgICAgICAgICAgeCA9IHsgZGVmLnggfVxuICAgICAgICAgICAgICAgICAgICB5ID0geyBkZWYueSB9XG4gICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZT1cIjMwXCJcbiAgICAgICAgICAgICAgICAgICAgZmlsbD1cImJsYWNrXCJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9XCJ1c2VyLXNlbGVjdDogbm9uZTsgY3Vyc29yOiBwb2ludGVyOyBkb21pbmFudC1iYXNlbGluZTogY2VudHJhbDsgdGV4dC1hbmNob3I6IG1pZGRsZTtcIlxuICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgaWYgKCBidG4uZm9udEZhbWlseSAhPSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0LnNldEF0dHJpYnV0ZSAoIFwiZm9udC1mYW1pbHlcIiwgYnRuLmZvbnRGYW1pbHkgKVxuXG4gICAgICAgICAgICAgICB0ZXh0LmlubmVySFRNTCA9IGJ0bi5pY29uXG5cbiAgICAgICAgICAgICAgIGdyb3VwLmFwcGVuZCAoIGNpcmNsZSApXG4gICAgICAgICAgICAgICBncm91cC5hcHBlbmQgKCB0ZXh0IClcblxuICAgICAgICAgICAgICAgYnV0dHVucy5wdXNoICggZ3JvdXAgYXMgU1ZHRWxlbWVudCApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGJ1dHR1bnNcbiAgICAgfVxufVxuXG4iLCJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi8uLi9CYXNlL0NvbXBvbmVudC9pbmRleC5qc1wiXG5pbXBvcnQgeyB4bm9kZSB9IGZyb20gXCIuLi8uLi9CYXNlL3hub2RlLmpzXCJcbmltcG9ydCB7IGRlZmluZSB9IGZyb20gXCIuLi8uLi9kYi5qc1wiXG5cbmRlY2xhcmUgZ2xvYmFsXG57XG5cbiAgICAgZXhwb3J0IGludGVyZmFjZSAkUGVyc29uVmlld2VyIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJwZXJzb24tdmlld2VyXCJcbiAgICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUGVyc29uVmlld2VlciBleHRlbmRzIENvbXBvbmVudCA8JFBlcnNvblZpZXdlcj5cbntcbiAgICAgZGlzcGxheSAoIHBlcnNvbjogJFBlcnNvbiApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgPGltZyBzcmM9eyBwZXJzb24uYXZhdGFyIH0gYWx0PVwiQXZhdGFyXCIvPlxuICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPGI+eyBwZXJzb24uZmlyc3ROYW1lIH08L2I+XG4gICAgICAgICAgICAgICAgICAgIDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5pc0NhcHRhaW4gPyBcIkV4cGVydFwiIDogbnVsbCB9PC9iPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCBjYXJkIClcbiAgICAgfVxufVxuXG5kZWZpbmUgKCBQZXJzb25WaWV3ZWVyLCB7XG4gICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgOiBcInBlcnNvbi12aWV3ZXJcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxufSlcbiIsIlxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uLy4uL0Jhc2UvQ29tcG9uZW50L2luZGV4LmpzXCJcbmltcG9ydCB7IHhub2RlIH0gZnJvbSBcIi4uLy4uL0Jhc2UveG5vZGUuanNcIlxuaW1wb3J0IHsgZGVmaW5lIH0gZnJvbSBcIi4uLy4uL2RiLmpzXCJcbmltcG9ydCAqIGFzIGRiIGZyb20gXCIuLi8uLi8uLi9BcHBsaWNhdGlvbi9kYXRhLmpzXCJcblxuXG5kZWNsYXJlIGdsb2JhbFxue1xuICAgICBpbnRlcmZhY2UgJFNraWxsVmlld2VyIGV4dGVuZHMgJENvbXBvbmVudFxuICAgICB7XG4gICAgICAgICAgdHlwZTogXCJza2lsbC12aWV3ZXJcIlxuICAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTa2lsbFZpZXdlciBleHRlbmRzIENvbXBvbmVudCA8JFNraWxsVmlld2VyPlxue1xuICAgICBkaXNwbGF5ICggc2tpbGw6ICRTa2lsbCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCB0YXJnZXQgPSA8ZGl2IGNsYXNzPVwicGVvcGxlXCI+PC9kaXY+XG5cbiAgICAgICAgICBmb3IgKCBjb25zdCBuYW1lIG9mIHNraWxsLml0ZW1zIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBwZXJzb24gPSBkYi5nZXROb2RlIDwkUGVyc29uPiAoIG5hbWUgKVxuXG4gICAgICAgICAgICAgICBjb25zdCBjYXJkID0gPGRpdiBjbGFzcz1cInczLWNhcmQtNCBwZXJzb24tY2FyZFwiPlxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz17IHBlcnNvbi5hdmF0YXIgfSBhbHQ9XCJBdmF0YXJcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj57IHBlcnNvbi5maXJzdE5hbWUgfTwvYj5cbiAgICAgICAgICAgICAgICAgICAgICAgICA8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxiPnsgcGVyc29uLmlzQ2FwdGFpbiA/IFwiRXhwZXJ0XCIgOiBudWxsIH08L2I+XG4gICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZCAoIGNhcmQgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmNsYXNzTGlzdC5hZGQgKCBcImNvbnRhaW5lclwiIClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kICggPGgxPnsgc2tpbGwuaWQgfTwvaDE+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCA8cD57IHNraWxsLmRlc2NyaXB0aW9uIH08L3A+IClcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmQgKCB0YXJnZXQgKVxuXG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0xvckRPbmlYL2pzb24tdmlld2VyL2Jsb2IvbWFzdGVyL3NyYy9qc29uLXZpZXdlci5qc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZCAoIDxwcmU+eyBKU09OLnN0cmluZ2lmeSAoIHNraWxsLCBudWxsLCAzICkgfTwvcHJlPiApXG4gICAgIH1cbn1cblxuZGVmaW5lICggU2tpbGxWaWV3ZXIsIHtcbiAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgIHR5cGUgICA6IFwic2tpbGwtdmlld2VyXCIsXG4gICAgIGlkICAgICA6IHVuZGVmaW5lZCxcbn0pXG4iLCJcblxuaW1wb3J0ICogYXMgdWkgZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcbmltcG9ydCB7IFNpZGVNZW51IH0gZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcblxuXG4vL2V4cG9ydCBjb25zdCBtZW51ID0gY3JlYXRlTWVudSAoKVxuXG4vL2RvY3VtZW50LmJvZHkuYXBwZW5kICggLi4uIG1lbnUuZWxlbWVudHMgKCkgKVxuXG5leHBvcnQgY29uc3QgbWVudSA9IHVpLm1ha2UgPFNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgICAgICAgOiBcInNpZGUtbWVudVwiLFxuICAgICBpZCAgICAgICAgICAgOiBcIm1lbnVcIixcbiAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcbiAgICAgZGlyZWN0aW9uICAgIDogXCJsclwiXG59KVxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gbWVudS5nZXRIdG1sICgpIClcblxuLy9leHBvcnQgdHlwZSBNZW51Q29tbWFuZHMgPSB7XG4vLyAgICAgXCJvcGVuLW1lbnVcIjogKCkgPT4gdm9pZCxcbi8vICAgICBcImNsb3NlLW1lbnVcIjogKCkgPT4gdm9pZCxcbi8vfVxuXG4vL2FkZENvbW1hbmQgKCBcIm9wZW4tbWVudVwiLCAoKSA9PiB7IG1lbnUub3BlbiAoKSB9KVxuLy9hZGRDb21tYW5kICggXCJjbG9zZS1tZW51XCIsICgpID0+IHsgbWVudS5jbG9zZSAoKSB9KVxuIiwiXG5pbXBvcnQgXCIuLi9VaS9kYi5qc1wiXG5pbXBvcnQgXCIuLi9VaS9Db21wb25lbnQvU2xpZGVTaG93L2luZGV4LmpzXCJcbmltcG9ydCBcIi4uL1VpL0VudGl0eS9Ta2lsbC9pbmRleC5qc1wiXG5cbmltcG9ydCAqIGFzIHVpIGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5pbXBvcnQgeyBTaWRlTWVudSB9IGZyb20gXCIuLi9VaS9pbmRleC5qc1wiXG5cbnZhciBkaXJlY3Rpb24gPSBcInJsXCIgYXMgXCJybFwiIHwgXCJsclwiIHwgXCJ0YlwiIHwgXCJidFwiXG5cbmV4cG9ydCBjb25zdCBwYW5lbCA9IHVpLm1ha2UgPFNpZGVNZW51LCAkU2lkZU1lbnU+ICh7XG4gICAgIGNvbnRleHQgICAgICA6IFwiY29uY2VwdC11aVwiLFxuICAgICB0eXBlICAgICAgICAgOiBcInNpZGUtbWVudVwiLFxuICAgICBpZCAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIGRpcmVjdGlvbiAgICA6IGRpcmVjdGlvbixcbiAgICAgaGFzTWFpbkJ1dHRvbjogdHJ1ZSxcblxuICAgICBoZWFkZXI6IHtcbiAgICAgICAgICBjb250ZXh0ICA6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgIHR5cGUgICAgIDogXCJ0b29sYmFyXCIsXG4gICAgICAgICAgaWQgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdGl0bGUgICAgOiBcIlRpdGxlIC4uXCIsXG4gICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24gPT0gXCJsclwiIHx8IGRpcmVjdGlvbiA9PSBcInJsXCIgPyBcInRiXCIgOiBcImxyXCIsXG5cbiAgICAgICAgICBidXR0b25zOiBbe1xuICAgICAgICAgICAgICAgY29udGV4dCA6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgICA6IFwiYnV0dG9uXCIsXG4gICAgICAgICAgICAgICBpZCAgICAgIDogXCJjb25zb2xlXCIsXG4gICAgICAgICAgICAgICBpY29uICAgIDogXCLimqBcIixcbiAgICAgICAgICAgICAgIHRleHQgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAgaGFuZGxlT246IFwiKlwiLFxuICAgICAgICAgICAgICAgY29tbWFuZCA6IFwicGFjay12aWV3XCJcbiAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgIGNvbnRleHQgOiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICAgICAgIHR5cGUgICAgOiBcImJ1dHRvblwiLFxuICAgICAgICAgICAgICAgaWQgICAgICA6IFwicHJvcGVydGllc1wiLFxuICAgICAgICAgICAgICAgaWNvbiAgICA6IFwiXCIsXG4gICAgICAgICAgICAgICB0ZXh0ICAgIDogXCJwYW5lbCBwcm9wZXJ0aWVzXCIsXG4gICAgICAgICAgICAgICBoYW5kbGVPbjogXCIqXCIsXG4gICAgICAgICAgfV1cbiAgICAgfSxcblxuICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICBjb250ZXh0OiBcImNvbmNlcHQtdWlcIixcbiAgICAgICAgICB0eXBlICAgOiBcInNsaWRlc2hvd1wiLFxuICAgICAgICAgIGlkICAgICA6IFwicGFuZWwtc2xpZGVzaG93XCIsXG5cbiAgICAgICAgICBjaGlsZHJlbjogW3tcbiAgICAgICAgICAgICAgIGNvbnRleHQ6IFwiY29uY2VwdC11aVwiLFxuICAgICAgICAgICAgICAgdHlwZSAgIDogXCJza2lsbC12aWV3ZXJcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IFwic2xpZGUtc2tpbGxcIlxuICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgICAgICAgICAgICB0eXBlICAgOiBcInBlcnNvbi12aWV3ZXJcIixcbiAgICAgICAgICAgICAgIGlkICAgICA6IFwic2xpZGUtcGVyc29uXCJcbiAgICAgICAgICB9XVxuICAgICB9XVxufSlcblxuZG9jdW1lbnQuYm9keS5hcHBlbmQgKCAuLi4gcGFuZWwuZ2V0SHRtbCAoKSApXG5cbiIsIlxuaW1wb3J0IHsgUmFkaWFsTWVudSB9IGZyb20gXCIuLi9VaS9Db21wb25lbnQvQ2lyY3VsYXJNZW51L2luZGV4LmpzXCJcbmltcG9ydCB7IEFyZWEgfSBmcm9tIFwiLi4vVWkvQ29tcG9uZW50L0FyZWEvYXJlYS5qc1wiXG4vL2ltcG9ydCAqIGFzIEFzcGVjdCBmcm9tIFwiLi9Bc3BlY3QvaW5kZXguanNcIlxuXG4vL2ltcG9ydCB7IGFkZENvbW1hbmQsIHJ1bkNvbW1hbmQgfSBmcm9tIFwiLi9jb21tYW5kLmpzXCJcbi8vaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gXCIuL2NvbW1hbmQuanNcIlxuXG5leHBvcnQgY29uc3QgYXJlYSA9ICAoKCkgPT5cbntcbiAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAoIFwiY2FudmFzXCIgKVxuXG4gICAgIGNhbnZhcy53aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXG4gICAgIGNhbnZhcy5oZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodFxuXG4gICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kICggY2FudmFzIClcblxuICAgICByZXR1cm4gbmV3IEFyZWEgKCBjYW52YXMgKVxufSkgKClcblxuZXhwb3J0IGNvbnN0IGNvbnRleHR1YWxNZW51ID0gbmV3IFJhZGlhbE1lbnUgKHtcbiAgICAgY29udGV4dDogXCJjb25jZXB0LXVpXCIsXG4gICAgIHR5cGU6IFwicmFkaWFsLW1lbnVcIixcbiAgICAgaWQ6IFwiYXJlYS1tZW51XCIsXG4gICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAvL3sgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRoaW5nXCIgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUzYzg7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY2FsbGJhY2s6ICgpID0+IHsgcnVuQ29tbWFuZCAoIFwiem9vbS1leHRlbmRzXCIgKSB9IH0sIC8vIGRldGFpbHNcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC10aGluZ1wiICwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlM2M4O1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZGV0YWlsc1xuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLWJ1YmJsZVwiLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU2ZGQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LFxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLW5vdGVcIiAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGUyNDQ7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiwgY29tbWFuZDogXCJwYWNrLXZpZXdcIiB9LCAvLyBmb3JtYXRfcXVvdGVcbiAgICAgICAgICB7IHR5cGU6IFwiYnV0dG9uXCIsIGlkOiBcImFkZC1wZW9wbGVcIiwgdGV4dDogXCJcIiwgaWNvbjogXCImI3hlODdjO1wiLCBmb250RmFtaWx5OiBcIk1hdGVyaWFsIEljb25zXCIgfSwgLy8gZmFjZVxuICAgICAgICAgIHsgdHlwZTogXCJidXR0b25cIiwgaWQ6IFwiYWRkLXRhZ1wiICAgLCB0ZXh0OiBcIlwiLCBpY29uOiBcIiYjeGU4Njc7XCIsIGZvbnRGYW1pbHk6IFwiTWF0ZXJpYWwgSWNvbnNcIiB9LCAvLyBib29rbWFya19ib3JkZXJcbiAgICAgXSBhcyBhbnksXG4gICAgIHJvdGF0aW9uOiBNYXRoLlBJLzIsXG59KVxuXG5kb2N1bWVudC5ib2R5LmFwcGVuZCAoIC4uLiBjb250ZXh0dWFsTWVudS5nZXRIdG1sICgpIClcblxuXG4vLyBDTElDSyBFVkVOVFNcblxuLy8gYXJlYS5vblRvdWNoT2JqZWN0ID0gKCBzaGFwZSApID0+XG4vLyB7XG4vLyAgICAgIHJ1biBDb21tYW5kICggXCJ6b29tLXRvXCIsIHNoYXBlIClcbi8vIH1cblxuLy8gSE9WRVIgRVZFTlRTXG5cbmFyZWEub25PdmVyT2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIHNoYXBlLmhvdmVyICggdHJ1ZSApXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbmFyZWEub25PdXRPYmplY3QgPSAoIHNoYXBlICkgPT5cbntcbiAgICAgc2hhcGUuaG92ZXIgKCBmYWxzZSApXG4gICAgIGFyZWEuZmNhbnZhcy5yZXF1ZXN0UmVuZGVyQWxsICgpXG59XG5cbi8vIFRFU1RcblxuaWYgKCBuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgPiAwIClcbntcblxuICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAoIFwicG9pbnRlcm1vdmVcIiwgZXZlbnQgPT5cbiAgICAge1xuICAgICAgICAgIC8vY29uc3QgdGFyZ2V0ID0gYXJlYS5mY2FudmFzLmZpbmRUYXJnZXQgKCBldmVudCwgdHJ1ZSApXG4gICAgICAgICAgLy9pZiAoIHRhcmdldCApXG4gICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nICggdGFyZ2V0IClcbiAgICAgfSlcbn1cbmVsc2VcbntcbiAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgKCBcIm1vdXNlbW92ZVwiLCBldmVudCA9PlxuICAgICB7XG4gICAgICAgICAgLy9jb25zdCB0YXJnZXQgPSBhcmVhLmZjYW52YXMuZmluZFRhcmdldCAoIGV2ZW50LCB0cnVlIClcbiAgICAgICAgICAvL2lmICggdGFyZ2V0IClcbiAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2cgKCB0YXJnZXQgKVxuICAgICB9KVxufVxuIiwiXG5pbXBvcnQgeyBtZW51ICwgfSBmcm9tIFwiLi9tZW51LmpzXCJcbmltcG9ydCB7IHBhbmVsLCB9IGZyb20gXCIuL3BhbmVsLmpzXCJcbmltcG9ydCB7IGFyZWEgLCBjb250ZXh0dWFsTWVudSB9IGZyb20gXCIuL2FyZWEuanNcIlxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gXCIuLi9VaS9jb21tYW5kLmpzXCJcblxuXG5jb21tYW5kICggXCJvcGVuLW1lbnVcIiwgKCkgPT5cbntcbiAgICAgcGFuZWwuY2xvc2UgKClcbiAgICAgY29udGV4dHVhbE1lbnUuaGlkZSAoKVxufSlcbmNvbW1hbmQgKCBcIm9wZW4tcGFuZWxcIiwgKCkgPT5cbntcbiAgICAgbWVudS5jbG9zZSAoKVxuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuXG5cbi8vIFBBTkVMUyBDT01NQU5EU1xuXG5pbXBvcnQgKiBhcyB1aSBmcm9tIFwiLi4vVWkvaW5kZXguanNcIlxuaW1wb3J0IHsgU2xpZGVzaG93IH0gZnJvbSBcIi4uL1VpL2luZGV4LmpzXCJcbmltcG9ydCB7IFNraWxsVmlld2VyIH0gZnJvbSBcIi4uL1VpL0VudGl0eS9Ta2lsbC9pbmRleC5qc1wiXG5pbXBvcnQgeyBnZXROb2RlIH0gZnJvbSBcIi4vZGF0YS5qc1wiO1xuaW1wb3J0IHsgZ2V0QXNwZWN0IH0gZnJvbSBcIi4vQXNwZWN0L2RiLmpzXCI7XG5pbXBvcnQgeyBBcmVhIH0gZnJvbSBcIi4uL1VpL0NvbXBvbmVudC9BcmVhL2FyZWEuanNcIlxuXG5jb25zdCBzbGlkZXNob3cgID0gdWkucGljayA8U2xpZGVzaG93PiAgICggXCJzbGlkZXNob3dcIiwgXCJwYW5lbC1zbGlkZXNob3dcIiApXG5jb25zdCBzbGlkZUluZm9zID0gdWkucGljayA8U2tpbGxWaWV3ZXI+ICggXCJza2lsbC12aWV3ZXJcIiwgXCJzbGlkZS1za2lsbFwiIClcblxuY29tbWFuZCAoIFwib3Blbi1wYW5lbFwiLCAoIG5hbWUsIC4uLiBjb250ZW50ICkgPT5cbntcbiAgICAgLy8gaWYgKCBuYW1lIClcbiAgICAgLy8gICAgICBzbGlkZXNob3cuc2hvdyAoIG5hbWUsIC4uLiBjb250ZW50IClcbiAgICAgLy8gZWxzZVxuICAgICAvLyAgICAgIHBhbmVsLm9wZW4gKClcbn0pXG5cbmNvbW1hbmQgKCBcIm9wZW4taW5mb3MtcGFuZWxcIiwgKCBlICkgPT5cbntcbiAgICAgY29uc3QgYXNwZWN0ID0gZ2V0QXNwZWN0ICggQXJlYS5jdXJyZW50RXZlbnQudGFyZ2V0IClcblxuICAgICBpZiAoIGFzcGVjdCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBza2lsbCA9IGdldE5vZGUgPCRTa2lsbD4gKHtcbiAgICAgICAgICAgICAgIHR5cGU6IGFzcGVjdC5jb25maWcudHlwZSxcbiAgICAgICAgICAgICAgIGlkICA6IGFzcGVjdC5jb25maWcuaWRcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgaWYgKCBza2lsbCApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgc2xpZGVJbmZvcy5kaXNwbGF5ICggc2tpbGwgYXMgYW55IClcbiAgICAgICAgICAgICAgIHBhbmVsLm9wZW4gKClcbiAgICAgICAgICB9XG4gICAgIH1cbn0pXG5cbmNvbW1hbmQgKCBcImNsb3NlLXBhbmVsXCIgLCAoKSA9Plxue1xuICAgICBwYW5lbC5jbG9zZSAoKVxufSlcblxuLy8gQVJFQSBFVkVOVFNcblxuYXJlYS5vbkRvdWJsZVRvdWNoT2JqZWN0ID0gKCBzaGFwZSApID0+XG57XG4gICAgIGlmICggc2hhcGUuY29uZmlnLm9uVG91Y2ggIT0gdW5kZWZpbmVkIClcbiAgICAgICAgICBzaGFwZS5jb25maWcub25Ub3VjaCAoIHNoYXBlIClcbn1cblxuYXJlYS5vblRvdWNoQXJlYSA9ICggeCwgeSApID0+XG57XG4gICAgIGNvbW1hbmQgKCBcIm9wZW4tY29udGV4dGFsLW1lbnVcIiApLnJ1biAoKVxuICAgICAvL3J1biBDb21tYW5kICggXCJvcGVuLWNvbnRleHRhbC1tZW51XCIsIHgsIHkgKVxufVxuXG5cbi8vIEFSRUEgQ09NTUFORFNcblxuLy9leHBvcnQgdHlwZSBBcmVhQ29tbWFuZHMgPVxuLy97XG4vLyAgICAgXCJhZGQtc2tpbGxcIiAgICAgICAgICAgOiAoIHRpdGxlOiBzdHJpbmcgKSA9PiB2b2lkLFxuLy8gICAgIFwiYWRkLXBlcnNvblwiICAgICAgICAgIDogKCBuYW1lOiBzdHJpbmcgKSA9PiB2b2lkLFxuLy8gICAgIFwiem9vbS1leHRlbmRzXCIgICAgICAgIDogKCkgPT4gdm9pZCxcbi8vICAgICBcInpvb20tdG9cIiAgICAgICAgICAgICA6ICggc2hhcGU6IEFzcGVjdC5TaGFwZSApID0+IHZvaWQsXG4vLyAgICAgXCJwYWNrLXZpZXdcIiAgICAgICAgICAgOiAoKSA9PiB2b2lkLFxuLy8gICAgIFwib3Blbi1jb250ZXh0YWwtbWVudVwiIDogKCB4OiBudW1iZXIsIHk6IG51bWJlciApID0+IHZvaWQsXG4vLyAgICAgXCJjbG9zZS1jb250ZXh0YWwtbWVudVwiOiAoKSA9PiB2b2lkLFxuLy99XG5cblxuY29tbWFuZCAoIFwib3Blbi1jb250ZXh0YWwtbWVudVwiLCAoIGU6IGZhYnJpYy5JRXZlbnQgKSA9Plxue1xuICAgICBjb250ZXh0dWFsTWVudS5zaG93ICggZS5wb2ludGVyLngsIGUucG9pbnRlci55IClcbn0gKVxuXG5jb21tYW5kICggXCJjbG9zZS1jb250ZXh0YWwtbWVudVwiLCAoKSA9Plxue1xuICAgICBjb250ZXh0dWFsTWVudS5oaWRlICgpXG59KVxuXG5jb21tYW5kICggXCJhZGQtc2tpbGxcIiwgKCB0aXRsZSApID0+XG57XG4gICAgIGNvbnNvbGUubG9nICggXCJBZGQgc2tpbGxcIiApXG59KVxuXG5jb21tYW5kICggXCJhZGQtcGVyc29uXCIsICggbmFtZSApID0+XG57XG5cbn0pXG5cbmNvbW1hbmQgKCBcInpvb20tZXh0ZW5kc1wiLCAoKSA9Plxue1xuICAgICBhcmVhLnpvb20gKClcbn0pXG5cbmNvbW1hbmQgKCBcInpvb20tdG9cIiwgKCBzaGFwZSApID0+XG57XG4gICAgIC8vIGFyZWEuem9vbSAoIHNoYXBlIClcbiAgICAgLy8gYXJlYS5pc29sYXRlICggc2hhcGUgKVxufSlcblxuY29tbWFuZCAoIFwicGFjay12aWV3XCIsICgpID0+XG57XG4gICAgIGFyZWEucGFjayAoKVxufSlcbiIsIlxuaW1wb3J0ICogYXMgZGIgZnJvbSBcIi4uLy4uL2RhdGEuanNcIlxuaW1wb3J0IHsgU2hhcGUgfSBmcm9tIFwiLi9zaGFwZS5qc1wiXG5cbmV4cG9ydCB0eXBlIEJhZGdlUG9zaXRpb24gPSB7IGFuZ2xlOiBudW1iZXIsIG9mZnNldDogbnVtYmVyIH1cblxuZXhwb3J0IGNsYXNzIEJhZGdlIGV4dGVuZHMgU2hhcGVcbntcbiAgICAgcmVhZG9ubHkgb3duZXIgPSB1bmRlZmluZWQgYXMgU2hhcGVcblxuICAgICByZWFkb25seSBwb3NpdGlvbiA9IHsgYW5nbGU6IDAsIG9mZnNldDogMCB9XG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkU2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgc3VwZXIgKCBvcHRpb25zIClcbiAgICAgLy8gfVxuICAgICAvLyBpbml0ICgpXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5pbml0ICgpXG5cbiAgICAgICAgICBjb25zdCB7IGdyb3VwIH0gPSB0aGlzXG5cbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSBkYi5nZXROb2RlIDwkQmFkZ2U+ICggdGhpcy5jb25maWcuZGF0YSApXG5cbiAgICAgICAgICBjb25zdCB0ZXh0ID0gbmV3IGZhYnJpYy5UZXh0Ym94ICggZW50aXR5LmVtb2ppIHx8IFwiWFwiLCB7XG4gICAgICAgICAgICAgICBmb250U2l6ZTogdGhpcy5kaXNwbGF5U2l6ZSAoKSxcbiAgICAgICAgICAgICAgIG9yaWdpblggOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgb3JpZ2luWSA6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICBsZWZ0ICAgIDogZ3JvdXAubGVmdCxcbiAgICAgICAgICAgICAgIHRvcCAgICAgOiBncm91cC50b3AsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGdyb3VwLmFkZFdpdGhVcGRhdGUgKCB0ZXh0IClcbiAgICAgfVxuXG4gICAgIGRpc3BsYXlTaXplICgpXG4gICAgIHtcbiAgICAgICAgICByZXR1cm4gMjBcbiAgICAgfVxuXG4gICAgIGF0dGFjaCAoIHRhcmdldDogU2hhcGUsIHBvcyA9IHt9IGFzIEJhZGdlUG9zaXRpb24gKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyByYW5kb20sIFBJIH0gPSBNYXRoXG5cbiAgICAgICAgICBpZiAoICEgaXNGaW5pdGUgKCBwb3MuYW5nbGUgKSApXG4gICAgICAgICAgICAgICBwb3MuYW5nbGUgPSByYW5kb20gKCkgKiBQSSAqIDJcblxuICAgICAgICAgIGlmICggISBpc0Zpbml0ZSAoIHBvcy5vZmZzZXQgKSApXG4gICAgICAgICAgICAgICBwb3Mub2Zmc2V0ID0gMC4xXG5cbiAgICAgICAgICA7KHRoaXMucG9zaXRpb24gYXMgQmFkZ2VQb3NpdGlvbikgPSB7IC4uLiBwb3MgfVxuXG4gICAgICAgICAgaWYgKCB0aGlzLm93bmVyICE9IHVuZGVmaW5lZCApXG4gICAgICAgICAgICAgICB0YXJnZXQuZ3JvdXAucmVtb3ZlICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICB0YXJnZXQuZ3JvdXAuYWRkICggdGhpcy5ncm91cCApXG5cbiAgICAgICAgICA7KHRoaXMub3duZXIgYXMgU2hhcGUpID0gdGFyZ2V0XG5cbiAgICAgICAgICB0aGlzLnVwZGF0ZVBvc2l0aW9uICgpXG4gICAgIH1cblxuICAgICB1cGRhdGVQb3NpdGlvbiAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgeyBwb3NpdGlvbjogcG9zLCBvd25lciB9ID0gdGhpc1xuXG4gICAgICAgICAgaWYgKCBvd25lciA9PSB1bmRlZmluZWQgKVxuICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCB7IHJhbmRvbSwgUEksIGNvcywgc2luIH0gPSBNYXRoXG5cbiAgICAgICAgICBjb25zdCByYWQgICAgPSBwb3MuYW5nbGUgfHwgcmFuZG9tICgpICogUEkgKiAyXG4gICAgICAgICAgY29uc3QgeCAgICAgID0gc2luIChyYWQpXG4gICAgICAgICAgY29uc3QgeSAgICAgID0gY29zIChyYWQpXG4gICAgICAgICAgY29uc3QgcyAgICAgID0gb3duZXIuZGlzcGxheVNpemUgKCkgLyAyXG4gICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdHlwZW9mIHBvcy5vZmZzZXQgPT0gXCJudW1iZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgID8gdGhpcy5kaXNwbGF5U2l6ZSAoKSAqIHBvcy5vZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuZGlzcGxheVNpemUgKCkgKiAwLjFcblxuICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb24gKCB4ICogKHMgKyBvZmZzZXQpLCB5ICogKHMgKyBvZmZzZXQpIClcbiAgICAgfVxufVxuIiwiXG5pbXBvcnQgeyBHZW9tZXRyeSB9IGZyb20gXCIuLi8uLi8uLi9MaWIvaW5kZXguanNcIlxuaW1wb3J0IHsgZ2V0QXNwZWN0IH0gZnJvbSBcIi4uL2RiLmpzXCJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4vc2hhcGUuanNcIlxuXG5leHBvcnQgY2xhc3MgQ29udGFpbmVyIDwkIGV4dGVuZHMgJFNoYXBlIDwkR3JvdXA+ID0gJFNoYXBlIDwkR3JvdXA+PiBleHRlbmRzIFNoYXBlIDwkPlxue1xuICAgICByZWFkb25seSBjaGlsZHJlbjogU2hhcGUgW11cblxuICAgICBkaXNwbGF5X3NpemUgPSAxXG5cbiAgICAgY29uc3RydWN0b3IgKCBvcHRpb25zOiAkIClcbiAgICAge1xuICAgICAgICAgIHN1cGVyICggb3B0aW9ucyApXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdXG4gICAgIC8vIH1cblxuICAgICAvLyBpbml0ICgpXG4gICAgIC8vIHtcbiAgICAgLy8gICAgICBzdXBlci5pbml0ICgpXG5cbiAgICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLmNvbmZpZy5kYXRhXG5cbiAgICAgICAgICAvL2ZvciAoIGNvbnN0IGNoaWxkIG9mIE9iamVjdC52YWx1ZXMgKCBlbnRpdHkuY2hpbGRyZW4gKSApXG4gICAgICAgICAgZm9yICggY29uc3QgY2hpbGQgb2YgT2JqZWN0LnZhbHVlcyAoIGVudGl0eS5pdGVtcyApIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBhID0gZ2V0QXNwZWN0ICggY2hpbGQgKVxuICAgICAgICAgICAgICAgLy9hLmluaXQgKClcbiAgICAgICAgICAgICAgIHRoaXMuYWRkICggYSApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5wYWNrICgpXG4gICAgIH1cblxuICAgICBkaXNwbGF5U2l6ZSAoKVxuICAgICB7XG4gICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdcblxuICAgICAgICAgIHZhciBzaXplID0gKHRoaXMuZGlzcGxheV9zaXplICsgY29uZmlnLnNpemVPZmZzZXQpICogY29uZmlnLnNpemVGYWN0b3JcblxuICAgICAgICAgIGlmICggc2l6ZSA8IGNvbmZpZy5taW5TaXplIClcbiAgICAgICAgICAgICAgIHNpemUgPSBjb25maWcubWluU2l6ZVxuXG4gICAgICAgICAgcmV0dXJuIHNpemUgfHwgMVxuICAgICB9XG5cbiAgICAgYWRkICggY2hpbGQ6IFNoYXBlIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAgfSA9IHRoaXNcblxuICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaCAoIGNoaWxkIClcblxuICAgICAgICAgIGlmICggZ3JvdXAgKVxuICAgICAgICAgIHtcbiAgICAgICAgICAgICAgIGdyb3VwLmFkZCAoIGNoaWxkLmdyb3VwIClcbiAgICAgICAgICAgICAgIGdyb3VwLnNldENvb3JkcyAoKVxuICAgICAgICAgIH1cbiAgICAgfVxuXG4gICAgIHBhY2sgKClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IHsgZ3JvdXAsIGNoaWxkcmVuLCBjb25maWcgfSA9IHRoaXNcblxuICAgICAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IFtdIGFzIEdlb21ldHJ5LkNpcmNsZSBbXVxuXG4gICAgICAgICAgZm9yICggY29uc3QgYyBvZiBjaGlsZHJlbiApXG4gICAgICAgICAge1xuICAgICAgICAgICAgICAgY29uc3QgZyA9IGMuZ3JvdXBcbiAgICAgICAgICAgICAgIGNvbnN0IHIgPSAoZy53aWR0aCA+IGcuaGVpZ2h0ID8gZy53aWR0aCA6IGcuaGVpZ2h0KSAvIDJcbiAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoICggeyB4OiBnLmxlZnQsIHk6IGcudG9wLCByOiByICsgNiB9IClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzaXplID0gIEdlb21ldHJ5LnBhY2tFbmNsb3NlICggcG9zaXRpb25zICkgKiAyXG5cbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAgOyBpIDwgY2hpbGRyZW4ubGVuZ3RoIDsgaSsrIClcbiAgICAgICAgICB7XG4gICAgICAgICAgICAgICBjb25zdCBnID0gY2hpbGRyZW4gW2ldLmdyb3VwXG4gICAgICAgICAgICAgICBjb25zdCBwID0gcG9zaXRpb25zIFtpXVxuXG4gICAgICAgICAgICAgICBnLmxlZnQgPSBwLnhcbiAgICAgICAgICAgICAgIGcudG9wICA9IHAueVxuXG4gICAgICAgICAgICAgICBncm91cC5hZGQgKCBnIClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmRpc3BsYXlfc2l6ZSA9IHNpemUgKyBjb25maWcuc2l6ZU9mZnNldFxuXG4gICAgICAgICAgdGhpcy51cGRhdGVTaXplICgpXG4gICAgIH1cblxufVxuXG4iLCJcblxuZXhwb3J0IHsgZGVmaW5lQXNwZWN0LCBnZXRBc3BlY3QsIHNldEFzcGVjdCB9IGZyb20gXCIuL2RiLmpzXCJcblxuZXhwb3J0IHsgR2VvbWV0cnkgfSBmcm9tIFwiLi9nZW9tZXRyeS5qc1wiXG5leHBvcnQgeyBTaGFwZSB9IGZyb20gXCIuL0VsZW1lbnQvc2hhcGUuanNcIlxuZXhwb3J0IHsgTm90ZSB9ICAgICAgZnJvbSBcIi4vRWxlbWVudC9ub3RlLmpzXCJcbmV4cG9ydCB7IEJhZGdlIH0gICAgIGZyb20gXCIuL0VsZW1lbnQvYmFkZ2UuanNcIlxuZXhwb3J0IHsgQ29udGFpbmVyIH0gZnJvbSBcIi4vRWxlbWVudC9ncm91cC5qc1wiXG5cblxuaW1wb3J0IHsgZ2V0Tm9kZX0gZnJvbSBcIi4uL2RhdGEuanNcIlxuaW1wb3J0IHsgZ2V0QXNwZWN0LCBkZWZpbmVBc3BlY3QsIHNldEFzcGVjdCB9IGZyb20gXCIuL2RiLmpzXCJcbmltcG9ydCB7IFNoYXBlIH0gZnJvbSBcIi4vRWxlbWVudC9zaGFwZS5qc1wiXG5pbXBvcnQgeyBDb250YWluZXIgfSBmcm9tIFwiLi9FbGVtZW50L2dyb3VwLmpzXCJcbmltcG9ydCB7IEJhZGdlIH0gICAgIGZyb20gXCIuL0VsZW1lbnQvYmFkZ2UuanNcIlxuaW1wb3J0IHsgY29tbWFuZCB9IGZyb20gXCIuLi8uLi9VaS9pbmRleC5qc1wiXG5cblxuZGVmaW5lQXNwZWN0ICggU2hhcGUgICAgLCBcInBlcnNvblwiIC8qICwgeyBvbkNyZWF0ZTogKCkgPT4gLi4uLCBvblRvdWNoOiAoKSA9PiAuLi4gfSAqLyApXG5kZWZpbmVBc3BlY3QgKCBDb250YWluZXIsIFwic2tpbGxcIiApXG5kZWZpbmVBc3BlY3QgKCBCYWRnZSAgICAsIFwiYmFkZ2VcIiApXG5cbnNldEFzcGVjdCA8JFNoYXBlPiAoe1xuICAgICB0eXBlICAgOiBcInBlcnNvblwiLFxuICAgICBpZCAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgZGF0YSAgIDogdW5kZWZpbmVkLFxuXG4gICAgIHNoYXBlICA6IFwiY2lyY2xlXCIsXG5cbiAgICAgeDogMCxcbiAgICAgeTogMCxcblxuICAgICBtaW5TaXplICAgIDogMzAsXG4gICAgIHNpemVGYWN0b3I6IDEsXG4gICAgIHNpemVPZmZzZXQ6IDAsXG5cbiAgICAgYm9yZGVyQ29sb3IgICAgIDogXCIjMDBjMGFhXCIsXG4gICAgIGJvcmRlcldpZHRoICAgICA6IDQsXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBmYWxzZSxcblxuICAgICBvbkNyZWF0ZSAgIDogKCBwZXJzb246ICRQZXJzb24sIGFzcGVjdCApID0+XG4gICAgIHtcbiAgICAgICAgICBhc3BlY3Quc2V0QmFja2dyb3VuZCAoe1xuICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOiBwZXJzb24uYXZhdGFyLFxuICAgICAgICAgICAgICAgc2hhcGU6IHBlcnNvbi5pc0NhcHRhaW4gPyBcInNxdWFyZVwiIDogXCJjaXJjbGVcIixcbiAgICAgICAgICB9IGFzIGFueSlcbiAgICAgfSxcbiAgICAgb25EZWxldGU6IHVuZGVmaW5lZCxcbiAgICAgb25Ub3VjaDogdW5kZWZpbmVkLFxufSlcblxuc2V0QXNwZWN0IDwkU2hhcGU+ICh7XG4gICAgIHR5cGUgICA6IFwic2tpbGxcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGE6IHVuZGVmaW5lZCxcblxuICAgICBzaGFwZTogXCJjaXJjbGVcIixcbiAgICAgeDogMCxcbiAgICAgeTogMCxcblxuICAgICBib3JkZXJDb2xvciAgICAgOiBcIiNmMWJjMzFcIixcbiAgICAgYm9yZGVyV2lkdGggICAgIDogOCxcbiAgICAgYmFja2dyb3VuZENvbG9yIDogXCIjRkZGRkZGXCIsXG4gICAgIGJhY2tncm91bmRJbWFnZSA6IHVuZGVmaW5lZCxcbiAgICAgYmFja2dyb3VuZFJlcGVhdDogZmFsc2UsXG4gICAgIG1pblNpemUgICAgICAgICA6IDUwLFxuICAgICBzaXplT2Zmc2V0ICAgICAgOiAxMCxcbiAgICAgc2l6ZUZhY3RvciAgICAgIDogMSxcblxuICAgICBvbkNyZWF0ZSAoIHNraWxsOiAkU2tpbGwsIGFzcGVjdCApXG4gICAgIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gZ2V0Tm9kZSAoe1xuICAgICAgICAgICAgICAgdHlwZTogXCJiYWRnZVwiLFxuICAgICAgICAgICAgICAgaWQgIDogc2tpbGwuaWNvbixcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgY29uc3QgYmFkZ2UgPSBnZXRBc3BlY3QgPEJhZGdlPiAoIGRhdGEgKVxuXG4gICAgICAgICAgLy9iYWRnZS5pbml0ICgpXG4gICAgICAgICAgYmFkZ2UuYXR0YWNoICggYXNwZWN0IClcbiAgICAgfSxcblxuICAgICBvblRvdWNoICggc2hhcGUgKVxuICAgICB7XG4gICAgICAgICAgLy8gY29uc3Qgc2tpbGwgPSBnZXROb2RlIDwkU2tpbGw+ICh7XG4gICAgICAgICAgLy8gICAgICB0eXBlOiBzaGFwZS5jb25maWcudHlwZSxcbiAgICAgICAgICAvLyAgICAgIGlkICA6IHNoYXBlLmNvbmZpZy5pZFxuICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgLy8gY29tbWFuZCAoIFwib3Blbi1pbmZvcy1wYW5lbFwiLCBza2lsbCApLnJ1biAoKVxuXG4gICAgICAgICAgY29tbWFuZCAoIFwib3Blbi1pbmZvcy1wYW5lbFwiICkucnVuICgpXG4gICAgIH0sXG5cbiAgICAgb25EZWxldGU6IHVuZGVmaW5lZFxufSlcblxuc2V0QXNwZWN0IDwkU2hhcGU+ICh7XG4gICAgIHR5cGUgICA6IFwiYmFkZ2VcIixcbiAgICAgaWQgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgIGRhdGE6IHVuZGVmaW5lZCxcblxuICAgICB4ICAgICAgICAgOiAwLFxuICAgICB5ICAgICAgICAgOiAwLFxuICAgICBtaW5TaXplICAgOiAxLFxuICAgICBzaXplRmFjdG9yOiAxLFxuICAgICBzaXplT2Zmc2V0OiAwLFxuXG4gICAgIHNoYXBlICAgICAgICAgICA6IFwiY2lyY2xlXCIsXG4gICAgIGJvcmRlckNvbG9yICAgICA6IFwiZ3JheVwiLFxuICAgICBib3JkZXJXaWR0aCAgICAgOiAwLFxuXG4gICAgIGJhY2tncm91bmRDb2xvciA6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgYmFja2dyb3VuZEltYWdlIDogdW5kZWZpbmVkLFxuICAgICBiYWNrZ3JvdW5kUmVwZWF0OiBmYWxzZSxcblxuICAgICBvbkNyZWF0ZSAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgIG9uRGVsZXRlICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgb25Ub3VjaCAgICAgICAgIDogdW5kZWZpbmVkLFxufSlcbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiZmFrZXJcIiAvPlxuZGVjbGFyZSBjb25zdCBmYWtlcjogRmFrZXIuRmFrZXJTdGF0aWNcblxuaW1wb3J0ICogYXMgYXBwIGZyb20gXCIuLi9BcHBsaWNhdGlvbi9pbmRleC5qc1wiXG5cbmNvbnN0IHJhbmRvbUludCA9IChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpID0+XG57XG4gICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG5jb25zdCBhcmVhID0gYXBwLmFyZWFcbmNvbnN0IHZpZXcgPSBhcmVhLmNyZWF0ZVZpZXcgKCBcImNvbXDDqXRhbmNlc1wiIClcbmFyZWEudXNlICggdmlldyApXG5cbi8vIEljaSBvbiBham91dGUgZGVzIHBlcnNvbm5lcyDDoCBs4oCZYXBwbGljYXRpb24uXG5cbmNvbnN0IHBlcnNvbk5hbWVzID0gW11cbmZvciAoIHZhciBpID0gMSA7IGkgPD0gMjAgOyBpKysgKVxue1xuICAgICBhcHAuc2V0Tm9kZSA8JFBlcnNvbj4gKHtcbiAgICAgICAgICB0eXBlICAgICA6IFwicGVyc29uXCIsXG4gICAgICAgICAgaWQgICAgICAgOiBcInVzZXJcIiArIGksXG4gICAgICAgICAgZmlyc3ROYW1lOiBmYWtlci5uYW1lLmZpcnN0TmFtZSAoKSxcbiAgICAgICAgICBsYXN0TmFtZSA6IGZha2VyLm5hbWUubGFzdE5hbWUgKCksXG4gICAgICAgICAgYXZhdGFyICAgOiBgLi9hdmF0YXJzL2YgKCR7aX0pLmpwZ2AsXG4gICAgICAgICAgaXNDYXB0YWluOiByYW5kb21JbnQgKDAsNCkgPT0gMSAvL2kgJSA0ID09IDAsXG4gICAgIH0pXG5cbiAgICAgYXBwLnNldE5vZGUgPCRQZXJzb24+ICh7XG4gICAgICAgICAgdHlwZSAgICAgOiBcInBlcnNvblwiLFxuICAgICAgICAgIGlkICAgICAgIDogXCJ1c2VyXCIgKyAoMjAgKyBpKSxcbiAgICAgICAgICBmaXJzdE5hbWU6IGZha2VyLm5hbWUuZmlyc3ROYW1lICgpLFxuICAgICAgICAgIGxhc3ROYW1lIDogZmFrZXIubmFtZS5sYXN0TmFtZSAoKSxcbiAgICAgICAgICBhdmF0YXIgICA6IGAuL2F2YXRhcnMvaCAoJHtpfSkuanBnYCxcbiAgICAgICAgICBpc0NhcHRhaW46IHJhbmRvbUludCAoMCw0KSA9PSAxIC8vICgyMCArIGkpICUgNCA9PSAwLFxuICAgICB9KVxuXG4gICAgIHBlcnNvbk5hbWVzLnB1c2ggKCBcInVzZXJcIiArIGksIFwidXNlclwiICsgKDIwICsgaSkgKVxuXG4gICAgIC8vIGFyZWEuYWRkICggXCJwZXJzb25cIiwgXCJ1c2VyXCIgKyBpIClcbiAgICAgLy8gYXJlYS5hZGQgKCBcInBlcnNvblwiLCBcInVzZXJcIiArIChpICsgMjApIClcbn1cblxuLy8gQmFkZ2VzXG5cbi8vIGh0dHBzOi8vZHJpdmUuZ29vZ2xlLmNvbS9kcml2ZS9mb2xkZXJzLzFLd1dsOUdfQTh2OTFOTFhBcGpaR0hDZm54X21uZk1FNFxuLy8gaHR0cHM6Ly9yZWNvbm5haXRyZS5vcGVucmVjb2duaXRpb24ub3JnL3Jlc3NvdXJjZXMvXG4vLyBodHRwczovL3d3dy5sZXR1ZGlhbnQuZnIvZWR1Y3Byb3MvYWN0dWFsaXRlL2xlcy1vcGVuLWJhZGdlcy11bi1jb21wbGVtZW50LWF1eC1kaXBsb21lcy11bml2ZXJzaXRhaXJlcy5odG1sXG5cbi8vIGh0dHBzOi8vd3d3LmVjaG9zY2llbmNlcy1ub3JtYW5kaWUuZnIvY29tbXVuYXV0ZXMvbGUtZG9tZS9hcnRpY2xlcy9iYWRnZS1kb21lXG5cbmNvbnN0IGJhZGdlUHJlc2V0cyA9IHsgLy8gUGFydGlhbCA8JEJhZGdlPlxuICAgICBkZWZhdWx0ICAgICAgIDogeyBpZDogXCJkZWZhdWx0XCIgICAgICAsIGVtb2ppOiBcIvCfpoFcIiB9LFxuICAgICBoYXQgICAgICAgICAgIDogeyBpZDogXCJoYXRcIiAgICAgICAgICAsIGVtb2ppOiBcIvCfjqlcIiB9LFxuICAgICBzdGFyICAgICAgICAgIDogeyBpZDogXCJzdGFyXCIgICAgICAgICAsIGVtb2ppOiBcIuKtkFwiIH0sXG4gICAgIGNsb3RoZXMgICAgICAgOiB7IGlkOiBcImNsb3RoZXNcIiAgICAgICwgZW1vamk6IFwi8J+RlVwiIH0sXG4gICAgIGVjb2xvZ3kgICAgICAgOiB7IGlkOiBcImVjb2xvZ3lcIiAgICAgICwgZW1vamk6IFwi8J+Sp1wiIH0sXG4gICAgIHByb2dyYW1taW5nICAgOiB7IGlkOiBcInByb2dyYW1taW5nXCIgICwgZW1vamk6IFwi8J+SvlwiIH0sXG4gICAgIGNvbW11bmljYXRpb24gOiB7IGlkOiBcImNvbW11bmljYXRpb25cIiwgZW1vamk6IFwi8J+TolwiIH0sXG4gICAgIGNvbnN0cnVjdGlvbiAgOiB7IGlkOiBcImNvbnN0cnVjdGlvblwiICwgZW1vamk6IFwi8J+UqFwiIH0sXG4gICAgIGJpb2xvZ3kgICAgICAgOiB7IGlkOiBcImJpb2xvZ3lcIiAgICAgICwgZW1vamk6IFwi8J+UrFwiIH0sXG4gICAgIHJvYm90aWMgICAgICAgOiB7IGlkOiBcInJvYm90aWNcIiAgICAgICwgZW1vamk6IFwi8J+kllwiIH0sXG4gICAgIGdhbWUgICAgICAgICAgOiB7IGlkOiBcImdhbWVcIiAgICAgICAgICwgZW1vamk6IFwi8J+koVwiIH0sXG4gICAgIG11c2ljICAgICAgICAgOiB7IGlkOiBcIm11c2ljXCIgICAgICAgICwgZW1vamk6IFwi8J+lgVwiIH0sXG4gICAgIGxpb24gICAgICAgICAgOiB7IGlkOiBcImxpb25cIiAgICAgICAgICwgZW1vamk6IFwi8J+mgVwiIH0sXG4gICAgIHZvbHRhZ2UgICAgICAgOiB7IGlkOiBcInZvbHRhZ2VcIiAgICAgICwgZW1vamk6IFwi4pqhXCIgfSxcbn1cblxuZm9yICggY29uc3QgbmFtZSBpbiBiYWRnZVByZXNldHMgKVxuICAgICBhcHAuc2V0Tm9kZSAoeyBjb250ZXh0OiBcImNvbmNlcHQtZGF0YVwiLCB0eXBlOiBcImJhZGdlXCIsIC4uLiBiYWRnZVByZXNldHMgW25hbWVdIH0pXG5cbi8vIFNraWxsc1xuXG5mb3IgKCBjb25zdCBuYW1lIGluIGJhZGdlUHJlc2V0cyApXG57XG4gICAgIGNvbnN0IHBlb3BsZSA9IFtdIGFzICRQZXJzb24gW11cblxuICAgICBmb3IgKCB2YXIgaiA9IHJhbmRvbUludCAoIDAsIDYgKSA7IGogPiAwIDsgai0tIClcbiAgICAge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBwZXJzb25OYW1lcy5zcGxpY2UgKCByYW5kb21JbnQgKCAxLCBwZXJzb25OYW1lcy5sZW5ndGggKSwgMSApIFswXVxuXG4gICAgICAgICAgaWYgKCBuYW1lIClcbiAgICAgICAgICAgICAgIHBlb3BsZS5wdXNoICggYXBwLmdldE5vZGUgPCRQZXJzb24+ICggXCJwZXJzb25cIiwgbmFtZSApIClcbiAgICAgfVxuXG4gICAgIGFwcC5zZXROb2RlIDwkU2tpbGw+ICh7XG4gICAgICAgICAgY29udGV4dDogXCJjb25jZXB0LWRhdGFcIixcbiAgICAgICAgICB0eXBlICAgOiBcInNraWxsXCIsXG4gICAgICAgICAgaWQgICAgIDogbmFtZSxcbiAgICAgICAgICBpY29uICAgOiBuYW1lLFxuICAgICAgICAgIGl0ZW1zICA6IHBlb3BsZVxuICAgICB9KVxuXG59XG5cbi8vXG5cbmZvciAoIGNvbnN0IG5hbWUgaW4gYmFkZ2VQcmVzZXRzIClcbiAgICAgYXJlYS5hZGQgKCBcInNraWxsXCIsIG5hbWUgKVxuXG4vLyBOb3Rlc1xuXG4vLyBjb25zdCBub3RlID0gIG5ldyBCLk5vdGUgKHtcbi8vICAgICAgdGV4dDogXCJBIG5vdGUgLi4uXCIsXG4vLyB9KVxuLy8gYXJlYS5hZGQgKCBBc3BlY3QuY3JlYXRlICggbm90ZSApIClcblxuXG5hcmVhLnBhY2sgKClcbmFyZWEuem9vbSAoKVxuXG5cbi8vIENsdXN0ZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBjb25zdCB0MSA9IG5ldyBmYWJyaWMuVGV4dGJveCAoIFwiRWRpdGFibGUgP1wiLCB7XG4vLyAgICAgIHRvcDogNTAsXG4vLyAgICAgIGxlZnQ6IDMwMCxcbi8vICAgICAgZm9udFNpemU6IDMwLFxuLy8gICAgICBzZWxlY3RhYmxlOiB0cnVlLFxuLy8gICAgICBlZGl0YWJsZTogdHJ1ZSxcbi8vICAgICAgb3JpZ2luWDogXCJjZW50ZXJcIixcbi8vICAgICAgb3JpZ2luWTogXCJjZW50ZXJcIixcbi8vIH0pXG4vLyBjb25zdCByMSA9IG5ldyBmYWJyaWMuUmVjdCAoe1xuLy8gICAgICB0b3AgICA6IDAsXG4vLyAgICAgIGxlZnQgIDogMzAwLFxuLy8gICAgICB3aWR0aCA6IDUwLFxuLy8gICAgICBoZWlnaHQ6IDUwLFxuLy8gICAgICBmaWxsICA6IFwiYmx1ZVwiLFxuLy8gICAgICBzZWxlY3RhYmxlOiB0cnVlLFxuLy8gICAgICBvcmlnaW5YOiBcImNlbnRlclwiLFxuLy8gICAgICBvcmlnaW5ZOiBcImNlbnRlclwiLFxuLy8gfSlcbi8vICRhcHAuX2xheW91dC5hcmVhLmFkZCAodDEpXG4vLyAkYXBwLl9sYXlvdXQuYXJlYS5hZGQgKHIxKVxuLy8gdDFbXCJjbHVzdGVyXCJdID0gWyByMSBdXG4vLyByMVtcImNsdXN0ZXJcIl0gPSBbIHQxIF1cblxuIl0sIm5hbWVzIjpbIk5vZGUiLCJkZWZhdWx0Q29uZmlnIiwiZHJhZ2dhYmxlIiwiVWkuZHJhZ2dhYmxlIiwiQ3NzLmdldFVuaXQiLCJGYWN0b3J5IiwiR2VvbWV0cnkiLCJDT05URVhUIiwibm9ybWFsaXplIiwiZGIuZ2V0Tm9kZSIsImFzcGVjdC5nZXRBc3BlY3QiLCJHZW9tZXRyeS5wYWNrRW5jbG9zZSIsImRiIiwiZmFjdG9yeSIsIlN2Zy5jcmVhdGVTdmdTaGFwZSIsInVpLm1ha2UiLCJ1aS5waWNrIiwiQ29udGFpbmVyIiwiYXJlYSIsImFwcC5hcmVhIiwiYXBwLnNldE5vZGUiLCJhcHAuZ2V0Tm9kZSJdLCJtYXBwaW5ncyI6Ijs7O2FBZ0NnQixxQkFBcUIsQ0FBRyxPQUFxQjtRQUV6RCxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUE7UUFFN0IsTUFBTSxDQUFDLEdBQVUsT0FBTyxDQUFDLENBQUMsSUFBVyxFQUFFLENBQUE7UUFDdkMsTUFBTSxLQUFLLEdBQU0sT0FBTyxDQUFDLEtBQUssSUFBTyxFQUFFLENBQUE7UUFDdkMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUE7UUFFdEMsTUFBTSxNQUFNLEdBQUcsRUFBYSxDQUFBO1FBRTVCLE1BQU0sQ0FBQyxHQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsS0FBSyxDQUFBO1FBQzVCLE1BQU0sS0FB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QUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFFakMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDUixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFFWixFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ2hDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ3JDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBRXJDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQ3RCLEVBQUUsR0FBRyxDQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFFLEdBQUcsRUFBRSxFQUM1QyxFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUssRUFBRSxFQUMvQixFQUFFLEdBQUcsQ0FBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQU8sRUFBRSxHQUFHLENBQUMsQ0FBRSxHQUFHLEVBQUUsRUFDNUMsRUFBRSxHQUFHLENBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsRUFFL0IsQ0FBQyxHQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQzFCLENBQUMsR0FBSSxDQUFDLElB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
