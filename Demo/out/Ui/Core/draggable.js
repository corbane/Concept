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
export function draggable(options) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZ2dhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vVWkvQ29yZS9kcmFnZ2FibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBcUJBLFNBQVMsYUFBYTtJQUVqQixPQUFPO1FBQ0YsT0FBTyxFQUFTLEVBQUU7UUFDbEIsV0FBVyxFQUFLLENBQUM7UUFDakIsV0FBVyxFQUFLLENBQUM7UUFDakIsV0FBVyxFQUFLLEdBQUcsRUFBRSxHQUFFLENBQUM7UUFDeEIsTUFBTSxFQUFVLEdBQUcsRUFBRSxHQUFFLENBQUM7UUFDeEIsVUFBVSxFQUFNLEdBQUcsRUFBRSxHQUFFLENBQUM7UUFDeEIsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsVUFBVTtZQUN4QyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7S0FDaEUsQ0FBQTtBQUNOLENBQUM7QUFFRCxJQUFJLE9BQU8sR0FBTSxDQUFDLENBQUE7QUFDbEIsSUFBSSxPQUFPLEdBQU0sQ0FBQyxDQUFBO0FBQ2xCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQTtBQUNsQixJQUFJLE9BQU8sR0FBTSxLQUFLLENBQUE7QUFDdEIsSUFBSSxPQUEyQixDQUFBO0FBRS9CLE1BQU0sVUFBVSxTQUFTLENBQUcsT0FBeUI7SUFFaEQsTUFBTSxNQUFNLEdBQUcsYUFBYSxFQUFHLENBQUE7SUFFL0IsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFBO0lBRXJCLFlBQVksQ0FBRyxPQUFPLENBQUUsQ0FBQTtJQUV4QixTQUFTLFlBQVksQ0FBRyxPQUF5QjtRQUU1QyxJQUFLLE9BQU8sRUFDWjtZQUNLLE9BQU07U0FDVjtRQUVELGtCQUFrQixFQUFHLENBQUE7UUFDckIsa0JBQWtCLEVBQUcsQ0FBQTtRQUVyQixNQUFNLENBQUMsTUFBTSxDQUFHLE1BQU0sRUFBRSxPQUFPLENBQUUs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