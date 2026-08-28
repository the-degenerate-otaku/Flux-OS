let z = 10;
let nasaInterval = null;
let nasaConnected = null;
let dockApps = [];


const systemThemes = {
    nord: {
        '--bg-color': '#2e3440',
        '--window-rgb': '59, 66, 82',
        '--taskbar-rgb': '36, 41, 51',
        '--accent-color': '#88c0d0',
        '--text-color': '#d8dee9'
    },
    cyber: {
        '--bg-color': '#0d0e15',
        '--window-rgb': '26, 28, 40',
        '--taskbar-rgb': '9, 10, 15',
        '--accent-color': '#ff0055',
        '--text-color': '#d8dee9'
    },
    mono: {
        '--bg-color': '#121212',
        '--window-rgb': '30, 30, 30',
        '--taskbar-rgb': '10, 10, 10',
        '--accent-color': '#ffffff',
        '--text-color': '#e0e0e0'
    },
    nova: {
        '--bg-color': '#0a100e',
        '--window-rgb': '255, 255, 255',
        '--taskbar-rgb': '255, 255, 255',
        '--accent-color': '#d99a5c',
        '--text-color': '#f3f1ea'
    }
};

const themeDisplayNames = { nord: 'Frost', cyber: 'Neon', mono: 'Pure', nova: 'Glass' };

function setTheme(themeName, silent = false) {
    if (systemThemes[themeName]) {
        const themeData = systemThemes[themeName];
        for (const [property, value] of Object.entries(themeData)) {
            document.documentElement.style.setProperty(property, value);
        }
        localStorage.setItem('flux_theme', themeName);
    }
}



function handleTerminal(e) {
    if (e.key === "Enter") {
        const input = document.getElementById("term-input");
        const output = document.getElementById("term-output");

        const fullCmd = input.value.trim();
        const args = fullCmd.split(' ');
        const cmd = args[0].toLowerCase();

        output.innerHTML += `<br>admin@Flux:~$ ${fullCmd}`;

        if (cmd === "help") {
            output.innerHTML += "<br>Commands: time, clear, version, reboot,";
        } else if (cmd === "time") {
            output.innerHTML += `<br>${new Date().toLocaleTimeString()}`;
        } else if (cmd === "clear") {
            output.innerHTML = "Terminal Cleared.";
        } else if (cmd === "version") {
            output.innerHTML += "<br>Flux OS 2.0.1-Alpha";
        } else if (cmd === "reboot") {
            location.reload();
        } else {
            output.innerHTML += "<br>Command not found.";
        }

        input.value = "";
        output.scrollTop = output.scrollHeight;
    }
}


function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.remove("hidden");
    focusWindow(id);
    if (window.gsap) {
        gsap.fromTo(win, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out" });
    }
    const app = AppRegistry[id];
    if (app && app.onOpen) app.onOpen();
}

function closeWindow(id) {
    const win = document.getElementById(id);
    const app = AppRegistry[id];
    const finish = () => {
        win.classList.add("hidden");
        if (app && app.onClose) app.onClose();
    };
    if (window.gsap) {
        gsap.to(win, { scale: 0.9, opacity: 0, duration: 0.2, ease: "power2.in", onComplete: finish });
    } else {
        finish();
    }
}


async function fetchSpaceStationData() {
    const container = document.getElementById('nasa-content');
    if (!container) return;

    try {
        const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        if (!response.ok) throw new Error('Uplink failure');
        const data = await response.json();

        container.innerHTML = `
            <div class="telemetry-line">> SATELLITE ID: <span class="telemetry-val">${data.id} (ISS)</span></div>
            <div class="telemetry-line">> LATITUDE    : <span class="telemetry-val">${data.latitude.toFixed(4)}°</span></div>
            <div class="telemetry-line">> LONGITUDE   : <span class="telemetry-val">${data.longitude.toFixed(4)}°</span></div>
            <div class="telemetry-line">> VELOCITY    : <span class="telemetry-val">${Math.round(data.velocity)} km/h</span></div>
            <div class="telemetry-line">> ALTITUDE    : <span class="telemetry-val">${data.altitude.toFixed(2)} km</span></div>
            <div class="telemetry-line" style="color: var(--accent-color); margin-top: 15px; font-size:11px;">● LIVE SIGNAL STABLE</div>
        `;

        if (nasaConnected !== true) {

            nasaConnected = true;
        }
    } catch (error) {
        container.innerHTML = '<p style="color: #f38ba8; font-family: monospace;">[ERROR] Uplink Lost. Retrying synchronization...</p>';
        if (nasaConnected !== false) {

            nasaConnected = false;
        }
    }
}


function handleOpacitySlider(val) {
    document.documentElement.style.setProperty('--bg-opacity', val);
    localStorage.setItem('flux_opacity', val);
}

function handleBlurSlider(val) {
    document.documentElement.style.setProperty('--glass-blur', `${val}px`);
    localStorage.setItem('flux_blur', val);
}


function initDock() {
    try {
        const saved = JSON.parse(localStorage.getItem('flux_dock'));
        dockApps = Array.isArray(saved) ? saved : [];
    } catch (e) {
        dockApps = [];
    }

    const systemApps = [
        {
            id: 'sys-terminal',
            name: 'Terminal',
            iconUrl: 'icons/terminal.png',
            isSystem: true,
            action: () => openWindow('window-terminal')
        },
        {
            id: 'sys-nasa',
            name: 'NASA',
            iconUrl: 'icons/nasa.png',
            isSystem: true,
            action: () => openWindow('window-nasa')
        },
        {
            id: 'sys-settings',
            name: 'Settings',
            iconUrl: 'icons/settings.png',
            isSystem: true,
            action: () => openWindow('window-settings')
        },
        {
            id: 'sys-files',
            name: 'Files',
            iconUrl: 'icons/files.png',
            isSystem: true,
            action: () => openFileExplorer()
        },
        {
            id: 'sys-notepad',
            name: 'Notepad',
            iconUrl: 'icons/notepad.png',
            isSystem: true,
            action: () => openNotepad()
        }
    ];

    const customApps = dockApps.filter(a => !a.isSystem);


    dockApps = [...systemApps, ...customApps];
    localStorage.setItem('flux_dock', JSON.stringify(dockApps));

    renderDock();
}

function renderDock() {
    const dock = document.getElementById('dock');
    if (!dock) return;
    dock.innerHTML = '';

    dockApps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'dock-item';
        item.title = app.name + (app.isSystem ? '' : ' (Right-click to remove)');

        item.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (app.id === 'sys-terminal') {
                openWindow('window-terminal');
                return;
            }
            if (app.id === 'sys-nasa') {
                openWindow('window-nasa');
                return;
            }
            if (app.id === 'sys-settings') {
                openWindow('window-settings');
                return;
            }

            if (app.id === 'sys-files') {
                openFileExplorer();
                return;
            }

            if (app.id === 'sys-notepad') {
                openNotepad();
                return;
            }

            if (app.url) {
                window.open(app.url, '_blank', 'noopener,noreferrer');
            }
        };

        item.oncontextmenu = (e) => {
            e.preventDefault();
            if (!app.isSystem) {
                removeApp(app.id, e);
            }
        };

        if (app.iconUrl) {
            const img = new Image();
            img.onload = () => {
                item.style.backgroundImage = `url('${app.iconUrl}')`;
                item.style.backgroundSize = 'cover';
                item.style.backgroundPosition = 'center';
                item.textContent = '';
            };
            img.onerror = () => {
                item.style.backgroundColor = 'rgba(255,255,255,0.08)';
                item.style.color = 'rgba(255,255,255,0.8)';
                item.textContent = app.fallback || app.name.charAt(0);
                item.style.fontSize = '20px';
            };
            img.src = app.iconUrl;
        } else {
            item.style.backgroundColor = 'rgba(255,255,255,0.08)';
            item.textContent = app.fallback || '>_<';
            item.style.fontSize = '20px';
            item.style.fontWeight = '600';
        }
        dock.appendChild(item);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'dock-item';
    addBtn.style.background = 'rgba(255,255,255,0.08)';
    addBtn.style.border = '1px dashed rgba(255,255,255,0.3)';
    addBtn.innerHTML = '<span style="font-size:26px; color:var(--text-color); font-weight:300;">+</span>';
    addBtn.title = "Add Shortcut";
    addBtn.onclick = () => openWindow('window-addapp');
    dock.appendChild(addBtn);
}
function handleAddApp() {
    const nameEl = document.getElementById('app-name');
    const urlEl = document.getElementById('app-url');
    let name = nameEl.value.trim();
    let url = urlEl.value.trim();

    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;


    const domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    if (dockApps.some(a => a.url === url)) {
        alert('App already in dock');
        return;
    }

    dockApps.push({ id: Date.now(), name, url, iconUrl });
    localStorage.setItem('flux_dock', JSON.stringify(dockApps));

    nameEl.value = '';
    urlEl.value = '';
    closeWindow('window-addapp');
    renderDock();
}

function removeApp(id, e) {
    e.preventDefault();
    if (confirm('Remove this app from the dock?')) {
        dockApps = dockApps.filter(a => a.id !== id);
        localStorage.setItem('flux_dock', JSON.stringify(dockApps));
        renderDock();
    }
}

function restoreSettings() {
    try {
        const theme = localStorage.getItem('flux_theme');
        if (theme) setTheme(theme, true);
        else setTheme('nova', true);

        const op = localStorage.getItem('flux_opacity');
        if (op) {
            const opSlider = document.getElementById('opacity-slider');
            if (opSlider) opSlider.value = op;
            handleOpacitySlider(op);
        }

        const blr = localStorage.getItem('flux_blur');
        if (blr) {
            const blurSlider = document.getElementById('blur-slider');
            if (blurSlider) blurSlider.value = blr;
            handleBlurSlider(blr);
        }

    } catch (e) {
        console.error("Error loading saved settings");
    }
    restoreIconPositions();


}

let isDraggingIcon = false;

function handleIconClick(windowId) {
    if (!isDraggingIcon) openWindow(windowId);
}

function dragIcon(e, id) {
    isDraggingIcon = false;
    const icon = document.getElementById(id);
    let startX = e.clientX, startY = e.clientY;

    document.onmousemove = (event) => {
        isDraggingIcon = true;
        let dx = startX - event.clientX;
        let dy = startY - event.clientY;
        startX = event.clientX;
        startY = event.clientY;

        icon.style.top = (icon.offsetTop - dy) + "px";
        icon.style.left = (icon.offsetLeft - dx) + "px";
    };

    document.onmouseup = () => {
        document.onmousemove = null;
        document.onmouseup = null;
        if (isDraggingIcon) {
            saveIconPositions();

            setTimeout(() => isDraggingIcon = false, 50);
        }
    };
}

function saveIconPositions() {
    const icons = document.querySelectorAll('.icon');
    const positions = {};
    icons.forEach(icon => {
        positions[icon.id] = { top: icon.style.top, left: icon.style.left };
    });
    localStorage.setItem('flux_icons', JSON.stringify(positions));
}

function restoreIconPositions() {
    try {
        const positions = JSON.parse(localStorage.getItem('flux_icons'));
        if (positions) {
            for (const [id, pos] of Object.entries(positions)) {
                const icon = document.getElementById(id);
                if (icon) {
                    icon.style.top = pos.top;
                    icon.style.left = pos.left;
                }
            }
        }
    } catch (e) { }
}

function resetIcons() {
    localStorage.removeItem('flux_icons');
    location.reload();
}


document.addEventListener('contextmenu', (e) => {

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    e.preventDefault();

    const menu = document.getElementById('context-menu');
    menu.classList.remove('hidden');
    let x = e.clientX;
    let y = e.clientY;
    if (x + 220 > window.innerWidth) x -= 220;
    if (y + 150 > window.innerHeight) y -= 150;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
});

document.addEventListener('click', (e) => {
    const menu = document.getElementById('context-menu');
    if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
    }
});

setInterval(() => {
    const taskbarClock = document.getElementById('clock');
    const taskbarTime = document.getElementById('clock-time');
    const taskbarDate = document.getElementById('clock-date');
    if (taskbarClock && taskbarTime && taskbarDate) {
        const now = new Date();
        taskbarTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        taskbarDate.textContent = now.toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
}, 1000);