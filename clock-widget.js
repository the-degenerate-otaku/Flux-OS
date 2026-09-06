(() => {
    let saved = {};

    try {
        saved =

            JSON.parse(localStorage.getItem('flux_clock_widget')) || {};

    } catch { }

    const store = () =>
        localStorage.setItem('flux_clock_widget', JSON.stringify(saved));

    addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');


        style.textContent = `
     
               #flux-clock-widget{
                position:fixed;left:30px;top:90px;z-index:4;
                color:var(--text-color);text-align:center;
                cursor:grab;user-select:none;
                text-shadow:0 3px 15px #000;
                font-family:var(--display)
            }
            #fc-time{font-size:64px;font-weight:300;line-height:1}
            #fc-day{margin-top:8px;font-size:18px}
            #fc-date{margin-top:3px;font-size:13px;opacity:.7}
        `;

        document.head.appendChild(style);

        const widget = document.createElement('section');
        widget.id = 'flux-clock-widget';

        widget.innerHTML = `
        <div id="fc-time"></div>
        <div id="fc-day"></div>
        <div id="fc-date"></div>
        
        `;

        document.body.appendChild(widget);

        const time = widget.querySelector('#fc-time');
        const day = widget.querySelector('#fc-day');
        const date = widget.querySelector('#fc-date');


        widget.style.left = `${saved.x ?? 650}px`;
        widget.style.top = `${saved.y ?? 357}px`;
        widget.style.fontFamily = 'var(--display)';
        time.style.fontSize = `${saved.size || 64}px`;

        function update() {
            const now = new Date();

            time.textContent = now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            day.textContent = now.toLocaleDateString([], {
                weekday: 'long'
            });

            date.textContent = now.toLocaleDateString([], {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        update();
        setInterval(update, 1000);


        widget.onpointerdown = event => {

            const box = widget.getBoundingClientRect();
            const offsetX = event.clientX - box.left;
            const offsetY = event.clientY - box.top;

            function move(event) {
                const x = Math.max(0, Math.min(
                    innerWidth - widget.offsetWidth,
                    event.clientX - offsetX
                ));

                const y = Math.max(50, Math.min(
                    innerHeight - widget.offsetHeight,
                    event.clientY - offsetY
                ));


                widget.style.left = `${x}px`;
                widget.style.top = `${y}px`;

            };

            function stop() {
                removeEventListener('pointermove', move);
                saved.x = widget.offsetLeft;
                saved.y = widget.offsetTop;
                store();
            }

            addEventListener('pointermove', move);
            addEventListener('pointerup', stop, { once: true });
        };

    });
})();