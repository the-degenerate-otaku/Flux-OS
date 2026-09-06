import { parseBlob } from 'https://cdn.jsdelivr.net/npm/music-metadata-browser@2.5.11/+esm';



window.openMusicPlayer = function openMusicPlayer() {
    if (document.getElementById('window-music')) {
        openWindow('window-music');
        return;
    }

    let audio, frame, audioContext, analyzer, audioURL, coverURL;

    createApp({
        id: 'window-music',
        title: 'Music Player',
        icon: 'icons/music.png',
        width: 380,
        content: el => {
            el.style.cssText = 'text-align:center;display:grid;gap:12px';
            el.innerHTML = `
    <strong id="music-name">Drop your tunes</strong>

    <img id="music-cover" src="icons/boot.png" alt="Album cover"
        style="width:100%;aspect-ratio:1;object-fit:cover;
        background:#0006;border-radius:12px">

    <canvas id="music-visual" width="340" height="70"
        style="width:100%;background:#0004;border-radius:8px"></canvas>

    <div style="display:flex;align-items:center;gap:12px">
        <button id="music-play" disabled aria-label="Play"
            style="width:46px;height:46px;border-radius:50%;
            border:1px solid #fff8;background:transparent;
            color:white;font-size:18px;cursor:pointer">▶</button>

        <input id="music-progress" type="range"
            min="0" max="100" value="0" style="flex:1">
    </div>

    <input id="music-file" type="file" accept="audio/*">
    <audio id="music-audio" hidden></audio>
`;

            audio = el.querySelector('#music-audio');
            const input = el.querySelector('#music-file');
            const play = el.querySelector('#music-play');
            const progress = el.querySelector('#music-progress');
            const cover = el.querySelector('#music-cover');
            const name = el.querySelector('#music-name');
            const canvas = el.querySelector('#music-visual');
            const ctx = canvas.getContext('2d');

            async function load(file) {
                if (!file?.type.startsWith('audio/')) return;

                if (audioURL) URL.revokeObjectURL(audioURL);
                audioURL = URL.createObjectURL(file);
                audio.src = audioURL;
                name.textContent = file.name;
                play.disabled = false;
                cover.src = 'icons/boot.png';

                audio.play();

                try {
                    const { common } = await parseBlob(file);
                    const picture = common.picture?.[0];

                    if (common.title) {
                        name.textContent = common.artist
                            ? `${common.title} - ${common.artist}`
                            : common.title;
                    }

                    if (picture) {
                        if (coverURL) URL.revokeObjectURL(coverURL);

                        coverURL = URL.createObjectURL(
                            new Blob([picture.data], { type: picture.format })
                        );

                        cover.src = coverURL;
                    }
                } catch { }
            }
            function draw() {
                frame = requestAnimationFrame(draw);
                const data = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(data);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = getComputedStyle(document.documentElement)
                    .getPropertyValue('--accent-color');

                for (let i = 0; i < 34; i++) {
                    const height = data[i * 3] / 3;
                    ctx.fillRect(i * 10, 80 - height, 7, height);
                }
            }

            play.onclick = () => audio.paused ? audio.play() : audio.pause();

            progress.oninput = () => {
                if (audio.duration) {
                    audio.currentTime = audio.duration * progress.value / 100;

                }

            };

            audio.ontimeupdate = () => {
                progress.value = audio.duration
                    ? audio.currentTime / audio.duration * 100
                    : 0;
            };
            audio.onplay = () => {
                play.textContent = 'II';

                if (!analyzer) {
                    const AudioAPI = window.AudioContext || window.webkitAudioContext;
                    audioContext = new AudioAPI();
                    analyzer = audioContext.createAnalyser();
                    const source = audioContext.createMediaElementSource(audio);
                    source.connect(analyzer);
                    analyzer.connect(audioContext.destination);
                }

                audioContext.resume();
                cancelAnimationFrame(frame);
                draw();
            };

            audio.onpause = audio.onended = () => {
                play.textContent = '▶';
                cancelAnimationFrame(frame);
            };


            input.onchange = () => load(input.files[0]);
            el.ondragover = event => event.preventDefault();
            el.ondrop = event => {
                event.preventDefault();
                load(event.dataTransfer.files[0]);

            };

        },
        onClose: () => {
            audio.pause();
            cancelAnimationFrame(frame);
        }
    });

    openWindow('window-music');
};
