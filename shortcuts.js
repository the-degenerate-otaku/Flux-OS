(() => {
    let desktopWindows = [];

    function showSwitcher(win) {
        let box = document.getElementById('shortcut-switcher');

        if (!box) {
            box = document.createElement('div');
            box.id = 'shortcut-switcher';
            box.style.cssText = `
            position:fixed;inset:50% auto auto 50%;
            transform:translate(-50%, -50%);z-index:9999999;
            padding:18px 28px;border-radius:12px;
            background:#111d;color:white;
            border:1px solid var(--accent-color);
            backdrop-filter:blur(15px)`;

            document.body.appendChild(box);
        }

        box.textContent = win.querySelector('.window-header span')?.textContent || win.id;

        box.hidden = false;
        clearTimeout(box.timer);
        box.timer = setTimeout(() => box.hidden = true, 600);
    }

    function toggleDesktop() {
        if (!desktopWindows.length) {
            desktopWindows = [...document.querySelectorAll('.window:not(.hidden)')];
            desktopWindows.forEach(win => win.classList.add('hidden'));
        } else {
            desktopWindows.forEach(win => win.classList.remove('hidden'));
            desktopWindows = [];
        }
    }

    addEventListener('keydown', event => {
        if (!event.ctrlKey || !event.altKey) return;

        const key = event.key.toLowerCase();
        event.preventDefault();

        if (key === 't') {
            openWindow('window-terminal');
        } else if (key === 'l') {
            toggleLaunchPad();
        } else if (key === 'd') {
            toggleDesktop();
        } else if (key === 'a') {


            const windows = [...document.querySelectorAll('.window:not(.hidden)')];

            if (!windows.length) return;

            const current = windows.findIndex(win => win.classList.contains('focused'));

            const next = windows[(current + 1) % windows.length];
            focusWindow(next.id);
            showSwitcher(next);
        }
    });
})();