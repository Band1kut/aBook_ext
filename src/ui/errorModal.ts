export function showErrorModal(message: string) {
    const existing = document.getElementById("abook-error-modal");
    if (existing) existing.remove();

    // Добавляем CSS один раз
    if (!document.getElementById("abook-error-modal-style")) {
        const style = document.createElement("style");
        style.id = "abook-error-modal-style";
        style.textContent = `
            #abook-error-modal {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #abook-error-box {
                background: #fff;
                padding: 22px 28px;
                border-radius: 8px;
                max-width: 380px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                font-family: sans-serif;
                text-align: center;
                animation: fadeIn 0.15s ease-out;
            }

            #abook-error-title {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 12px;
            }

            #abook-error-text {
                font-size: 15px;
                margin-bottom: 20px;
                white-space: pre-line;
            }

            #abook-error-text a {
                color: #3498db;
                text-decoration: none;
                font-weight: 600;
            }

            #abook-error-text a:hover {
                text-decoration: underline;
            }

            #abook-error-btn {
                font-size: 15px;
                border: none;
                border-radius: 6px;
                background: #e74c3c;
                color: #fff;
                cursor: pointer;
                min-width: 120px;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement("div");
    overlay.id = "abook-error-modal";

    const box = document.createElement("div");
    box.id = "abook-error-box";

    const title = document.createElement("div");
    title.id = "abook-error-title";
    title.textContent = "Ошибка";

    const text = document.createElement("div");
    text.id = "abook-error-text";
    text.innerHTML = message; // ★ поддержка HTML

    const btn = document.createElement("button");
    btn.id = "abook-error-btn";
    btn.textContent = "Закрыть";
    btn.onclick = () => overlay.remove();

    box.appendChild(title);
    box.appendChild(text);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}
