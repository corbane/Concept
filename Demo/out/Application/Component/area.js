/*
example:
https://prezi.com/p/9jqe2wkfhhky/la-bulloterie-tpcmn/
https://movilab.org/index.php?title=Utilisateur:Aur%C3%A9lienMarty
*/
//import * as fabric from "fabric/fabric-impl.js"
import { Geometry } from "../../Lib/index.js";
import * as aspect from "../Aspect/db.js";
import * as db from "../Data/db.js";
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
export class Area {
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
            const node = db.getData(...arguments);
            const shp = aspect.getAspect(node);
            active.children.push(shp);
            fcanvas.add(shp.group);
        }
        else
            for (const s of arguments) {
                const shp = aspect.getAspect(s);
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
        Geometry.packEnclose(positions) * 2;
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
            thumbnail;
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
                    const element = aspect.getAspect(fevent.target);
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
                    const element = aspect.getAspect(fevent.target);
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
                const element = aspect.getAspect(fevent.target);
                if (element)
                    this.onOverObject(element);
            }
        });
        page.on("mouse:out", fevent => {
            this.overFObject = undefined;
            if (this.onOutObject) {
                const element = aspect.getAspect(fevent.target);
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
        // https://www.w3schools.com/html/html5_draganddrop.asp
        // https://github.com/Shopify/draggable/blob/master/src/Draggable/Draggable.js
        const page = this.fcanvas;
        page.on("dragenter", fevent => {
            console.log("DROP-ENTER", fevent);
        });
        page.on("dragover", fevent => {
            //console.log ( "DROP-OVER", fevent )
        });
        page.on("drop", fevent => {
            const e = fevent.e;
            console.log("DROP", e.dataTransfer.getData("text"));
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJlYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL0FwcGxpY2F0aW9uL0NvbXBvbmVudC9hcmVhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBOzs7O0VBSUU7QUFFRixpREFBaUQ7QUFFakQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG9CQUFvQixDQUFBO0FBRzdDLE9BQU8sS0FBSyxNQUFNLE1BQU0saUJBQWlCLENBQUE7QUFDekMsT0FBTyxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFFbkMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFjLENBQUMsQ0FBQTtBQUM5QyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEdBQVEsS0FBSyxDQUFBO0FBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBVSxJQUFJLENBQUE7QUFDakQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFXLElBQUksQ0FBQTtBQUNqRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBSyxLQUFLLENBQUE7QUFDbEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsS0FBSyxDQUFBO0FBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBTSxJQUFJLENBQUE7QUFDakQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFVLFFBQVEsQ0FBQTtBQUNyRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUE7QUFDekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUcsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFBO0FBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFD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