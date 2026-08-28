let calViewDate = new Date();
let wifiOn = true;
let btOn = true;
function toggleWidgetPanel(section) {
    const panel = document.getElementById('widget-panel');
    const sections = ['calendar', 'specs', 'battery'];
    const target = document.getElementById(`wp-${section}`);
    if (!panel || !target) return;
    const alreadyOpen = !panel.classList.contains('hidden') && !target.classList.contains('hidden');

    if (section === 'calendar') calViewDate = new Date();
    if (section !== 'calendar' && !document.getElementById('wp-calendar').classList.contains('hidden')) {
        calViewDate = new Date();
    }

    sections.forEach(s => document.getElementById(`wp-${s}`).classList.add('hidden'));

    if (alreadyOpen) {
        panel.classList.add('hidden');
        return;
    }

    target.classList.remove('hidden');
    panel.classList.remove('hidden');

    if (section === 'calendar') renderCalendar();
    if (section === 'specs') renderSpecs();
    if (section === 'battery') renderBatteryPanel();
}

document.addEventListener('click', (e) => {
    const panel = document.getElementById('widget-panel');
    if (!panel || panel.classList.contains('hidden')) return;
    if (e.target.closest('#widget-panel') || e.target.closest('#taskbar-widgets')) return;
    if (!document.getElementById('wp-calendar').classList.contains('hidden')) calViewDate = new Date();
    panel.classList.add('hidden');
});

function renderCalendar() {
    const year = calViewDate.getFullYear();
    const month = calViewDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('wp-cal-title').textContent = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('wp-cal-grid');
    grid.innerHTML = '';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-daylabel';
        el.textContent = d;
        grid.appendChild(el);
    });


    const firstday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstday; i++) {
        grid.appendChild(document.createElement('div'));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('cal-today');
        }
        grid.appendChild(cell);
    }
}

function calshiftMonth(delta) {
    calViewDate.setDate(1);
    calViewDate.setMonth(calViewDate.getMonth() + delta);
    renderCalendar();
}

function renderSpecs() {
    const specs = {
        cores: navigator.hardwareConcurrency || 'Unknown',
        mem: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unavailable',
        platform: navigator.platform || navigator.userAgentData?.platform || 'Unknown',
        screen: `${screen.width} x ${screen.height}`,
        gpu: getGpuName(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
    };
    Object.entries(specs).forEach(([key, value]) => {
        document.getElementById(`spec-${key}`).textContent = value;
    });
}

function getGpuName() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'Unavailable';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'WebGL available';
}

async function initBattery() {
    if (!navigator.getBattery) return window._flux_battery = null;
    let battery;
    try {
        battery = await navigator.getBattery();
    } catch (error) {
        return window._flux_battery = null;
    }
    const update = () => {
        const pct = Math.round(battery.level * 100);
        document.getElementById('battery-pct').textContent = `${pct}%`;
        document.getElementById('battery-fill').setAttribute('width', Math.max(1, 14 * battery.level));
        document.getElementById('battery-icon')?.classList.toggle('battery-charging', battery.charging);
    };
    update();
    battery.addEventListener('levelchange', update);
    battery.addEventListener('chargingchange', update);
    window._flux_battery = battery;

}

function renderBatteryPanel() {
    const battery = window._flux_battery;
    if (!battery) {
        document.getElementById('wp-battery-pct').textContent = 'Unavailable';
        document.getElementById('wp-battery-charging').textContent = 'Unavailable';
        return;

    }

    document.getElementById('wp-battery-pct').textContent = `${Math.round(battery.level * 100)}%`;
    document.getElementById('wp-battery-charging').textContent = battery.charging ? 'Yes' : 'No';

}

function updateWifiState() {
    updateIndicator('tb-wifi', wifiOn, 'Wi-Fi');
}

function updateIndicator(id, enabled, label) {
    const indicator = document.getElementById(id);
    if (!indicator) return;
    indicator.classList.toggle('status-off', !enabled);
    indicator.title = `${label} ${enabled ? 'on' : 'off'}`;
    indicator.setAttribute('aria-label', indicator.title);
}

async function updateBluetoothState() {
    if (!navigator.bluetooth?.getAvailability) return;
    try {
        btOn = await navigator.bluetooth.getAvailability();
        updateIndicator('tb-bluetooth', btOn, 'Bluetooth');
    } catch (error) {
        return;
    }
}

function restoreWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.remove('minimized');
    win.classList.remove('hidden');
    if (window.gsap) gsap.set(win, { scale: 1, opacity: 1, y: 0 });
    if (typeof focusWindow === 'function') focusWindow(id);
}

function renderMinimizedTaskbar() {
    const bar = document.getElementById('taskbar-minimized');
    if (!bar) return;
    bar.innerHTML = '';
    document.querySelectorAll('.window.minimized').forEach(win => {
        const app = AppRegistry[win.id];
        const chip = document.createElement('div');
        chip.className = 'tb-open-chip';
        chip.title = app?.title || win.id;

        if (app?.icon && app.icon.startsWith('icons/')) {
            const img = document.createElement('img');
            img.src = app.icon;
            img.alt = app.title || win.id;
            chip.appendChild(img);

        }
        else {
            const span = document.createElement('span');
            span.textContent = app?.icon || '❖';
            chip.appendChild(span);
        }

        if (win.classList.contains('focused')) chip.classList.add('tb-open-active');

        chip.onclick = () => {
            if (win.classList.contains('minimized')) {
                restoreWindow(win.id);
            }
            else if (win.classList.contains('hidden')) {
                openWindow(win.id);
            }
            else {
                focusWindow(win.id);
            }
        };
        bar.appendChild(chip);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    wifiOn = navigator.onLine;
    updateWifiState();
    window.addEventListener('online', () => {
        wifiOn = true;
        updateWifiState();
    });
    window.addEventListener('offline', () => {
        wifiOn = false;
        updateWifiState();
    });
    updateBluetoothState();
    navigator.bluetooth?.addEventListener('availabilitychanged', updateBluetoothState);
    initBattery();
    if (document.body) {
        renderMinimizedTaskbar();
        new MutationObserver(renderMinimizedTaskbar).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    }
});