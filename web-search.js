(() => {
    "use strict";

    const prompts = [
        "What are we looking at today?",
        "Keep Hacking",
        "Stardance.HackClub",
        "Browse the Web"
    ];

    const form = document.getElementById("tb-web-search");
    const input = document.getElementById("tb-search-input");
    const prompt = document.getElementById("tb-search-prompt");

    let current = 0;

    function syncPrompt() {
        const hidden =
            document.activeElement === input ||
            input.value.length > 0;

        prompt.classList.toggle("is-hidden", hidden);
    }

    function rotatePrompt() {
        if (
            document.activeElement === input ||
            input.value ||
            prompt.classList.contains("is-leaving")
        ) return;

        prompt.classList.add("is-leaving");

        setTimeout(() => {
            current = (current + 1) % prompts.length;
            prompt.textContent = prompts[current];

            prompt.classList.remove("is-leaving");
            prompt.classList.add("is-entering");

            setTimeout(() => {
                prompt.classList.remove("is-entering");
            }, 240);
        }, 160);
    }

    input.addEventListener("focus", syncPrompt);
    input.addEventListener("blur", syncPrompt);
    input.addEventListener("input", syncPrompt);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const query = input.value.trim();
        if (!query) return;

        const url =
            `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        window.open(url, "_blank", "noopener,noreferrer");
        FluxOS.emit("search:web", { query, url });

        input.value = "";
        input.blur();
        syncPrompt();
    });

    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setInterval(rotatePrompt, 2800);
    }
})();