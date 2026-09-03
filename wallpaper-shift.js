let vantaEffect = null;

function handleWallpaperTypeChange(mode) {
    localStorage.setItem('flux_wallpaper_mode', mode);
    const staticControls = document.getElementById('wallpaper-static-controls');
    const liveControls = document.getElementById('wallpaper-live-controls');
    if (!staticControls || !liveControls) return;
    staticControls.classList.toggle('hidden', mode !== 'static');
    liveControls.classList.toggle('hidden', mode !== 'live');

    if (mode === 'live') {
        document.body.style.backgroundImage = '';
        const saved = localStorage.getItem('flux_live_wallpaper') || 'globe';
        const liveWallpaperOption = document.querySelector(`input[name="live-wallpaper"][value="${saved}"]`);
        if (liveWallpaperOption) liveWallpaperOption.checked = true;
        setLiveWallpaper(saved);

    } else {
        destroyLiveWallpaper();
        const savedImg = localStorage.getItem('flux_wallpaper_data');
        if (savedImg) {
            document.body.style.backgroundImage = `url('${savedImg}')`;
            if (localStorage.getItem('flux_accent_mode') === 'auto') {
                FluxOS.wallpaperPalette.apply(savedImg);
            }
        }
    }
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        document.body.style.backgroundImage = `url('${dataUrl}')`;
        if (localStorage.getItem('flux_accent_mode') === 'auto') {
            FluxOS.wallpaperPalette.apply(dataUrl);
        }
        try {
            localStorage.setItem('flux_wallpaper_data', dataUrl);

        } catch (err) {
            alert('Image too large to save. Try Smaller file size');

        }
    };
    reader.readAsDataURL(file);
}
function destroyLiveWallpaper() {
    if (vantaEffect) {
        vantaEffect.destroy();
        vantaEffect = null;

    }
    const wallpaperContainer = document.getElementById('wallpaper-shift');
    if (wallpaperContainer) wallpaperContainer.innerHTML = '';
}
function hextoVantaNum(hex) {
    return parseInt(hex.replace('#', ''), 16);
}

function getCurrentAccentColors() {
    const styles = getComputedStyle(document.documentElement);
    const accent = styles.getPropertyValue('--accent-color').trim() || '#ffffff';
    const accent2 = styles.getPropertyValue('--accent2-color').trim() || '#ffffff';
    const bg = styles.getPropertyValue('--bg-color').trim() || '#111111';
    return { accent, accent2, bg };
}

function UpdateVantaTheme() {
    if (!vantaEffect) return;
    const { accent, accent2, bg } = getCurrentAccentColors();
    vantaEffect.setOptions({
        color: hextoVantaNum(accent),
        color2: hextoVantaNum(accent2),
        backgroundColor: hextoVantaNum(bg)
    });
}

function setLiveWallpaper(type) {
    destroyLiveWallpaper();
    localStorage.setItem('flux_live_wallpaper', type);
    const { accent, accent2, bg } = getCurrentAccentColors();
    if (type === 'globe' && window.VANTA?.GLOBE) {
        vantaEffect = VANTA.GLOBE({
            el: "#wallpaper-shift",
            mouseControls: true,
            touchControls: true,
            gyroControls: true,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: hextoVantaNum(accent),
            color2: hextoVantaNum(accent2),
            size: 1.0,
            backgroundColor: hextoVantaNum(bg),
        })
    }
}
(() => {
    const SIZE = 48;

    const toHex = (rgb) =>
        `#${rgb.map((value) =>
            Math.round(value).toString(16).padStart(2, '0')
        ).join('')}`;

    const distance = (a, b) =>
        Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

    function polish(rgb) {
        const average = (rgb[0] + rgb[1] + rgb[2]) / 3;
        const color = rgb.map((value) => average + (value - average) * 1.25);
        const light = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
        const scale = light < 95 ? 95 / Math.max(light, 1) : light > 205 ? 205 / light : 1;

        return color.map((value) => Math.min(255, Math.max(0, value * scale))
        );

    }

    async function apply(source) {
        try {
            const image = await new Promise((resolve, reject) => {
                const candidate = new Image();

                candidate.onload = () => resolve(candidate);
                candidate.onerror = () => reject(new Error("Wallpaper image failed to load"));
                candidate.src = source;
            });




            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = SIZE;

            const context = canvas.getContext('2d', { willReadFrequently: true });

            context.drawImage(image, 0, 0, SIZE, SIZE);

            const pixels = context.getImageData(0, 0, SIZE, SIZE).data;
            const buckets = new Map();

            for (let index = 0; index < pixels.length; index += 16) {
                const [red, green, blue, alpha] = pixels.slice(index, index + 4);
                const light = red * 0.2126 + green * 0.7152 + blue * 0.0722;

                if (alpha < 200 || light < 20 || light > 235) continue;

                const key = ((red >> 5) << 6) |
                    ((green >> 5) << 3) |
                    (blue >> 5);

                const bucket = buckets.get(key) || {
                    red: 0, green: 0, blue: 0, count: 0
                };

                bucket.red += red;
                bucket.green += green;
                bucket.blue += blue;
                bucket.count++;
                buckets.set(key, bucket);
            }

            const colors = [...buckets.values()].map((bucket) => {
                const rgb = [
                    bucket.red / bucket.count,
                    bucket.green / bucket.count,
                    bucket.blue / bucket.count
                ];

                const saturation = (Math.max(...rgb) - Math.min(...rgb)) / 255;

                return {
                    rgb,
                    score: bucket.count * (1 + saturation * 2)
                };
            })

                .sort((a, b) => b.score - a.score);

            if (!colors.length) return;

            const primary = polish(colors[0].rgb);
            const secondary = polish(colors.find((color) => distance(color.rgb, colors[0].rgb) > 70)?.rgb || colors[1]?.rgb || colors[0].rgb);

            const palette = {
                primary: toHex(primary),
                secondary: toHex(secondary)

            };

            FluxOS.accent.set(palette.primary, palette.secondary);
            FluxOS.emit('wallpaper:palette', palette);

        } catch (error) {
            console.warn('Wallpaper palette extraction Failed:', error);

        }
    }

    FluxOS.wallpaperPalette = Object.freeze({ apply });
})();

function handleAccentModeChange(mode) {
    localStorage.setItem('flux_accent_mode', mode);


    const option = document.querySelector(`input[name="accent-mode"][value="${mode}"]`
    );

    const presets = document.getElementById('accent-manual-controls');

    if (option) option.checked = true;

    if (presets) {
        presets.classList.toggle(
            'accent-presets-hidden',

            mode === 'auto'
        );
    }

    if (mode === 'auto') {
        const root = document.documentElement;
        const neutralSurface = {
            '--bg-color': '#0b0d12',
            '--window-rgb': '24, 26, 32',
            '--taskbar-rgb': '15, 17, 22',
            '--text-color': '#f4f6fb'
        };

        Object.entries(neutralSurface).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        const wallpaper = localStorage.getItem('flux_wallpaper_data');

        if (wallpaper) {
            FluxOS.wallpaperPalette.apply(wallpaper);
        }
    } else {
        const theme = localStorage.getItem('flux_theme') || 'nova';

        if (typeof setTheme === 'function') {
            setTheme(theme, true);
        }
    }





    FluxOS.emit('accent:mode', { mode });
}

function restoreAccentMode() {
    const mode = localStorage.getItem('flux_accent_mode') || 'manual';

    handleAccentModeChange(mode);

}

window.addEventListener('load', restoreAccentMode, { once: true });

function restoreWallpaperSettings() {
    const mode = localStorage.getItem('flux_wallpaper_mode') || 'static';
    const modeOption = document.querySelector(`input[name="wallpaper-type"][value="${mode}"]`);
    if (modeOption) modeOption.checked = true;
    handleWallpaperTypeChange(mode);
}
document.addEventListener('DOMContentLoaded', restoreWallpaperSettings);