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
        if (savedImg) document.body.style.backgroundImage = `url('${savedImg}')`;

    }
}

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        document.body.style.backgroundImage = `url('${dataUrl}')`;
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

function setLiveWallpaper(type) {
    destroyLiveWallpaper();
    localStorage.setItem('flux_live_wallpaper', type);
    if (type === 'globe' && window.VANTA?.GLOBE) {
        vantaEffect = VANTA.GLOBE({
            el: "#wallpaper-shift",
            mouseControls: false,
            touchControls: false,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0xff8820,
            color2: 0xff8820,
            size: 1.0,
            backgroundColor: 0x0e1016,
        })
    }
}

function restoreWallpaperSettings() {
    const mode = localStorage.getItem('flux_wallpaper_mode') || 'static';
    const modeOption = document.querySelector(`input[name="wallpaper-type"][value="${mode}"]`);
    if (modeOption) modeOption.checked = true;
    handleWallpaperTypeChange(mode);
}
document.addEventListener('DOMContentLoaded', restoreWallpaperSettings);