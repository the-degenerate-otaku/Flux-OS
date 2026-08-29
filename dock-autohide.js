function updateDockVisibility() {
    const dock = document.getElementById('dock');
    if (!dock) return;

    const anyMaximized = document.querySelector('.window.maximized:not(.hidden)');
    if (anyMaximized) {
        dock.classList.add('dock-hidden');
    } else {
        dock.classList.remove('dock-hidden');
    }
}

function initDockAutohide() {
    const dock = document.getElementById('dock');
    const trigger = document.getElementById('dock-trigger');
    if (!dock || !trigger) return;

    trigger.addEventListener('mouseenter', () => {
        if (document.querySelector('.window.maximized:not(.hidden)')) {
            dock.classList.remove('dock-hidden');
        }
    });

    dock.addEventListener('mouseleave', () => {
        if (document.querySelector('.window.maximized:not(.hidden)')) {
            dock.classList.add('dock-hidden');
        }
    });

    const observer = new MutationObserver((mutations) => {
        const relevant = mutations.some(m => m.target.classList?.contains('window'));
        if (relevant) updateDockVisibility();
    });
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true,
    });

    window.addEventListener('resize', updateDockVisibility);
    updateDockVisibility();
}

document.addEventListener('DOMContentLoaded', initDockAutohide);