//I couldnt figure this at all

(() => {
    "use strict";
    const FluxOS = (window.FluxOS ||= {});
    const root = document.documentElement;
    const eventName = (name) => name.startsWith("flux:") ?
        name : `flux:${name}`;

    FluxOS.apps ||= {};
    FluxOS.emit ||= (name, detail) =>
        window.dispatchEvent(new CustomEvent(eventName(name), { detail }));
    FluxOS.on ||= (name, handler, options) => {
        const event = eventName(name);
        window.addEventListener(event, handler, options);
        return () => window.removeEventListener(event, handler, options);

    };

    function hextoRgb(hex) {
        const values = hex.replace("#", "");
        const full = values.length === 3
            ? [...values].map((v) => v + v).join("")
            : values;

        if (!/^[\da-f]{6}$/i.test(full)) throw new
            TypeError(`Invalid color: ${hex}`);


        return [0, 2, 4]
            .map((index) => parseInt(full.slice(index, index + 2), 16))
            .join(",");
    }

    FluxOS.accent = {
        get() {
            const styles = getComputedStyle(root);
            return {
                primary: styles.getPropertyValue("--accent-color").trim(),
                secondary: styles.getPropertyValue("--accent2-color").trim()

            };
        },

        sync(source = "system") {
            const detail = { ...this.get(), source };
            FluxOS.emit("accent:change", detail);
            return detail;
        },


        set(primary, secondary = primary) {
            root.style.setProperty("--accent-color", primary);
            root.style.setProperty("--accent-rgb", hextoRgb(primary));
            root.style.setProperty("--accent2-color", secondary);
            root.style.setProperty("--accent2-rgb", hextoRgb(secondary));
            return this.sync("manual");

        }
    };
})();