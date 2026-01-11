export function createDownloadButton(onClick: () => void) {
    const btn = document.createElement("button");
    btn.id = "abook-download-btn";
    btn.dataset.state = "idle";
    btn.textContent = "Скачать книгу";

    let downloadingText = "Загрузка...";
    let isHovering = false;

    btn.addEventListener("mouseenter", () => {
        isHovering = true;
        if (btn.dataset.state === "downloading") {
            btn.textContent = "Прервать";
        }
    });

    btn.addEventListener("mouseleave", () => {
        isHovering = false;
        if (btn.dataset.state === "downloading") {
            btn.textContent = downloadingText;
        }
    });

    btn.addEventListener("click", () => {
        if (btn.disabled) return;

        // 🔥 ВАЖНО: логика отмены
        if (btn.dataset.state === "downloading") {
            btn.dispatchEvent(new CustomEvent("abort-download"));
            return;
        }

        // обычный клик — запуск загрузки
        onClick();
    });

    return {
        element: btn,

        setState(
            state: "idle" | "downloading" | "done" | "abort",
            text?: string
        ) {
            btn.dataset.state = state;

            if (state === "idle") {
                btn.disabled = false;
                btn.textContent = "Скачать книгу";
                return;
            }

            if (state === "downloading") {
                btn.disabled = false;
                downloadingText = text || "Загрузка...";
                if (!isHovering) btn.textContent = downloadingText;
                return;
            }

            if (state === "done") {
                btn.disabled = true;
                btn.textContent = "Готово";
                return;
            }

            if (state === "abort") {
                btn.disabled = false;
                btn.textContent = text || "Ошибка";
                return;
            }
        },
    };
}
