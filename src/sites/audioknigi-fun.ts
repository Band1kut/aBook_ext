import { SiteAdapter, DownloadPackage } from "../core/types";
import { Downloader } from "../core/downloader";
import { createDownloadButton } from "../ui/downloadButton";
import { showErrorModal } from "../ui/errorModal";

// --------------------------------------------------
// УТИЛИТЫ
// --------------------------------------------------

function sanitize(name: string) {
    return name
        .replace(/[\/\\:\*\?"<>\|]/g, "")
        .replace(/\s+/g, " ")
        .replace(/\.+$/, "")
        .trim();
}

// --------------------------------------------------
// НАЗВАНИЕ
// --------------------------------------------------

function getTitle(): string {
    const h1 = document.querySelector("header.page__header h1");
    if (!h1) return "Audiobook";
    return sanitize(h1.textContent || "Audiobook");
}

// --------------------------------------------------
// АВТОРЫ
// --------------------------------------------------

function getAuthors(): string {
    const ul = document.querySelector("ul.pmovie__header-list.flex-grow-1");
    if (!ul) return "";

    const li = ul.querySelector("li");
    if (!li) return "";

    const links = Array.from(li.querySelectorAll("a"));
    const authors = links
        .map((a) => a.textContent?.trim() || "")
        .filter(Boolean);

    return authors.join(", ");
}

// --------------------------------------------------
// ЧТЕЦЫ
// --------------------------------------------------

function getReaders(): string {
    const ul = document.querySelector("ul.page__subcol-side2.pmovie__header-list");
    if (!ul) return "";

    const lis = Array.from(ul.querySelectorAll("li"));
    const performersLi = lis.find((li) =>
        li.textContent?.toLowerCase().includes("исполнители")
    );
    if (!performersLi) return "";

    const links = Array.from(performersLi.querySelectorAll("a"));
    const readers = links
        .map((a) => a.textContent?.trim() || "")
        .filter(Boolean);

    return readers.join(", ");
}

// --------------------------------------------------
// ОПИСАНИЕ
// --------------------------------------------------

function getDescription(): string {
    const block = document.querySelector(
        "div.page__text.full-text.clearfix"
    ) as HTMLElement | null;
    if (!block) return "";

    const clone = block.cloneNode(true) as HTMLElement;
    const h2 = clone.querySelector("h2");
    if (h2) h2.remove();

    const text = clone.textContent || "";
    return text.replace(/\s+/g, " ").trim();
}

// --------------------------------------------------
// ОБЛОЖКА
// --------------------------------------------------

function getCoverInfo() {
    const block = document.querySelector(".pmovie__poster.img-fit-cover");
    if (!block) return undefined;

    const img = block.querySelector("img") as HTMLImageElement | null;
    if (!img) return undefined;

    const raw = img.dataset.src || img.src;
    if (!raw) return undefined;

    const url = new URL(raw, location.origin).href;
    const ext = url.split("?")[0].split(".").pop() || "jpg";

    return {
        url,
        filename: `cover.${ext}`,
    };
}

// --------------------------------------------------
// ИЗВЛЕЧЕНИЕ ЗАШИФРОВАННОЙ СТРОКИ
// --------------------------------------------------

function extractEncodedPlaylist(): string {
    const scripts = Array.from(document.querySelectorAll("script"));

    for (const s of scripts) {
        const text = s.textContent || "";
        if (!text.includes("Playerjs")) continue;
        if (!text.includes("strDecode")) continue;

        const match = text.match(/file\s*:\s*strDecode\(["']([^"']+)["']\)/);
        if (match) return match[1];
    }

    return "";
}

// --------------------------------------------------
// РАСШИФРОВКА ПЛЕЙЛИСТА
// --------------------------------------------------

function decodePlaylistString(encoded: string): string {
    const base64Original =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    const base64Mixed =
        "PUhncLHApBrM7GvdqT4tNWRjemgak9oVzwZ8K1XDfY5bQOSlsF26yi0JCIuxE3+/=";

    const map: Record<string, string> = {};
    for (let i = 0; i < base64Original.length; i++) {
        map[base64Mixed[i]] = base64Original[i];
    }

    let normalized = "";
    for (const ch of encoded) {
        normalized += map[ch] ?? "";
    }

    try {
        return atob(normalized);
    } catch (e) {
        console.error("[audioknigi.fun] Ошибка Base64 декодирования:", e);
        return "";
    }
}

// --------------------------------------------------
// ПАРСИНГ ПЛЕЙЛИСТА
// --------------------------------------------------

function extractPlaylist(): { url: string; filename: string }[] {
    const encoded = extractEncodedPlaylist();
    if (!encoded) return [];

    const decoded = decodePlaylistString(encoded);
    if (!decoded) return [];

    let arr: any[] = [];
    try {
        arr = JSON.parse(decoded);
    } catch (e) {
        console.error("[audioknigi.fun] Ошибка JSON плейлиста:", e);
        return [];
    }

    return arr.map((item, index) => {
        const url = item.file;
        const title = sanitize(item.title || item.single_name || `Track ${index + 1}`);
        const ext = url.split("?")[0].split(".").pop() || "mp3";

        return {
            url,
            filename: `${title}.${ext}`,
        };
    });
}

// --------------------------------------------------
// ПРОВЕРКА ДОСТУПНОСТИ
// --------------------------------------------------

function isBookBlocked(): boolean {
    return extractEncodedPlaylist() === "";
}

// --------------------------------------------------
// СБОРКА DownloadPackage
// --------------------------------------------------

function buildPackage(): DownloadPackage | null {
    const files = extractPlaylist();
    if (files.length === 0) {
        showErrorModal("Не удалось извлечь плейлист.");
        return null;
    }

    const title = getTitle();
    const authors = getAuthors();
    const readers = getReaders();
    const description = getDescription();
    const cover = getCoverInfo();

    const descriptionText =
        `Название: ${title}\n` +
        `Автор: ${authors}\n` +
        `Читает: ${readers}\n\n` +
        `Описание:\n${description}\n\n` +
        `URL: ${location.href}\n`;

    return {
        folder: title,
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

    const poster = document.querySelector(".pmovie__poster.img-fit-cover");
    if (!poster) return;

    if (isBookBlocked()) {
        poster.insertAdjacentHTML(
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

        const pkg = buildPackage();
        if (!pkg) return;

        downloader.start(pkg);
    });

    btn.style.marginTop = "12px";

    btn.addEventListener("abort-download", () => {
        if (downloader) {
            downloader.cancel();
            downloader.destroy();
            downloader = null;
        }
    });

    poster.insertAdjacentElement("afterend", btn);

    buttonInitialized = true;
}

// --------------------------------------------------
// АДАПТЕР
// --------------------------------------------------

export const AudioknigiFunAdapter: SiteAdapter = {
    match(url: string) {
        return url.includes("audioknigi.fun");
    },

    init() {
        setupDownloadButton();

        new MutationObserver(() => setupDownloadButton()).observe(
            document.body,
            { childList: true, subtree: true }
        );
    },
};
