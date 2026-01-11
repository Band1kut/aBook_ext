import { SiteAdapter, DownloadPackage } from "../core/types";
import { Downloader } from "../core/downloader";
import { createDownloadButton } from "../ui/downloadButton";
import { showErrorModal } from "../ui/errorModal";

// --------------------------------------------------
// ИЗВЛЕЧЕНИЕ JSON ИЗ BookController.enter()
// --------------------------------------------------

function extractBookJson(): any | null {
    const scripts = Array.from(document.querySelectorAll("script"));

    for (const s of scripts) {
        const text = s.textContent || "";
        if (!text.includes("BookController.enter")) continue;

        const match = text.match(/BookController\.enter\((\{[\s\S]*?\})\)/);
        if (!match) continue;

        try {
            return JSON.parse(match[1]);
        } catch (e) {
            console.error("[knigavuhe] Ошибка парсинга JSON:", e);
            return null;
        }
    }

    return null;
}

// --------------------------------------------------
// ПРОВЕРКА ДОСТУПНОСТИ КНИГИ
// --------------------------------------------------

function isBookBlocked(json: any): boolean {
    const buyWrap = document.querySelector(".book_buy_wrap");
    if (buyWrap) {
        const btn = buyWrap.querySelector("button.blue");
        if (btn && btn.textContent?.trim() === "Слушать полностью") {
            return true;
        }
    }

    return json?.book?.has_litres === true;
}

// --------------------------------------------------
// ПАРСИНГ ПЛЕЙЛИСТА (БЕЗ sanitize)
// --------------------------------------------------

function parsePlaylist(json: any): { url: string; filename: string }[] {
    if (!json?.playlist || !Array.isArray(json.playlist)) return [];

    return json.playlist.map((track: any, index: number) => {
        const url = track.url;
        const rawTitle = track.title || `Track ${index + 1}`;

        return {
            url,
            filename: rawTitle, // без расширения!
        };
    });
}


// --------------------------------------------------
// ОБЛОЖКА
// --------------------------------------------------

function getCover(json: any) {
    const url = json?.book?.cover;
    if (!url) return undefined;

    const ext = url.split("?")[0].split(".").pop() || "jpg";

    return {
        url,
        filename: `cover.${ext}`,
    };
}

// --------------------------------------------------
// ОПИСАНИЕ
// --------------------------------------------------

function getDescriptionText(): string | undefined {
    const el = document.querySelector(".book_description");
    if (!el) return undefined;

    return el.textContent?.trim() || undefined;
}

// --------------------------------------------------
// АВТОРЫ И ЧТЕЦЫ (БЕЗ sanitize)
// --------------------------------------------------

function getAuthors(json: any): string {
    const authors = json?.book?.authors;
    if (!authors) return "";

    return Object.values(authors)
        .map((a: any) => a.name || "")
        .join(", ");
}

function getReaders(json: any): string {
    const readers = json?.book?.readers;
    if (!readers) return "";

    return Object.values(readers)
        .map((r: any) => r.name || "")
        .join(", ");
}

// --------------------------------------------------
// СБОРКА DownloadPackage (БЕЗ sanitize, БЕЗ проверки плейлиста)
// --------------------------------------------------

function buildPackage(json: any): DownloadPackage {
    const title = json?.book?.name || "Audiobook";
    const folder = title; // downloader сам почистит

    const files = parsePlaylist(json); // может быть []

    const cover = getCover(json);

    const descriptionText =
        `Название: ${title}\n` +
        `Автор: ${getAuthors(json)}\n` +
        `Читает: ${getReaders(json)}\n\n` +
        `Описание:\n${getDescriptionText() || ""}\n\n` +
        `URL: ${location.href}\n`;

    return {
        folder,
        files,
        cover,
        descriptionText,
    };
}

// --------------------------------------------------
// ВСТАВКА КНОПКИ
// --------------------------------------------------

let downloader: Downloader | null = null;
let buttonInitialized = false;

function setupDownloadButton() {
    if (buttonInitialized) return;

    const container = document.querySelector("div.book_left_content");
    if (!container) return;

    const coverBlock = container.querySelector("div.book_cover.use_bg");
    if (!coverBlock) return;

    const json = extractBookJson();
    if (!json) return;

    if (isBookBlocked(json)) {
        coverBlock.insertAdjacentHTML(
            "afterend",
            `<div style="margin-top: 12px; color: #c0392b; font-size: 15px; font-weight: 600;">
                Книга недоступна для скачивания
            </div>`
        );
        buttonInitialized = true;
        return;
    }

    const { element: btn, setState } = createDownloadButton(async () => {
        if (!downloader) {
            downloader = new Downloader(setState);
        }

        const pkg = buildPackage(json);

        downloader.start(pkg); // downloader сам проверит пустой плейлист
    });

    btn.style.marginTop = "12px";

    btn.addEventListener("abort-download", () => {
        if (downloader) {
            downloader.cancel();
            downloader.destroy();
            downloader = null;
        }
    });

    coverBlock.insertAdjacentElement("afterend", btn);

    buttonInitialized = true;
}

// --------------------------------------------------
// АДАПТЕР
// --------------------------------------------------

export const KnigavuheAdapter: SiteAdapter = {
    match(url: string) {
        return url.includes("knigavuhe.org");
    },

    init() {
        setupDownloadButton();

        new MutationObserver(() => setupDownloadButton()).observe(
            document.body,
            {
                childList: true,
                subtree: true,
            }
        );
    },
};
