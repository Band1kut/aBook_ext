import { createDownloadButton } from "../ui/downloadButton";
import { Downloader } from "../core/downloader";
import { DownloadPackage, SiteAdapter } from "../core/types";

// -------------------------
// УТИЛИТЫ
// -------------------------

function sanitize(name: string) {
    return name
        .replace(/[\/\\:\*\?"<>\|]/g, "")
        .replace(/\s+/g, " ")
        .replace(/\.+$/, "")
        .trim();
}

function getSafeBookFolderName(): string {
    const h1 = document.querySelector("h1.short-title");
    if (!h1) return "Audiobook";
    return sanitize(h1.textContent || "Audiobook");
}

// -------------------------
// ПРОВЕРКА БЛОКИРОВКИ
// -------------------------

function isBookBlocked() {
    const block = document.querySelector(".ftext.full-text.cleasrfix");
    if (!block) return false;

    const text = block.innerText.toLowerCase();
    return text.includes("по требованию правообладателя");
}

// -------------------------
// ПАРСИНГ ПЛЕЙЛИСТА
// -------------------------

async function parsePlaylist() {
    const scripts = Array.from(document.querySelectorAll("script"));
    const playerScript = scripts.find((s) =>
        s.textContent?.includes("new Playerjs")
    );
    if (!playerScript) return [];

    const text = playerScript.textContent!;

    // 1) Попытка вытащить массив file:[ ... ]
    const rawArray = extractArray(text);

    // 👉 Если массива нет — ищем строковый file:"..."
    if (!rawArray) {
        const m = text.match(/file\s*:\s*["']([^"']+)["']/);
        if (!m) return [];

        const url = m[1];

        // 👉 Если это playlist.txt.php — скачиваем JSON
        if (url.includes("playlist.txt.php")) {
            try {
                const fullUrl = new URL(url, location.origin).href;
                const response = await fetch(fullUrl);
                const playlist = await response.json();
                return normalizePlaylist(playlist);
            } catch (e) {
                console.error("Ошибка загрузки playlist.txt.php:", e);
                return [];
            }
        }

        // 👉 Если это одиночный файл
        return [
            {
                url,
                filename: sanitize(url.split("/").pop() || "track.mp3"),
            },
        ];
    }

    // 2) Если массив найден — пробуем регулярку
    const regexTracks = extractTracksWithRegex(rawArray);
    if (regexTracks.length > 0) {
        return regexTracks;
    }

    // 3) Fallback: выполнить как JS
    try {
        const playlist = Function("return " + rawArray)();
        return normalizePlaylist(playlist);
    } catch (e) {
        console.error("Ошибка парсинга JS-плейлиста:", e, rawArray);
        return [];
    }
}

// -------------------------
// НОРМАЛИЗАЦИЯ ПЛЕЙЛИСТА
// -------------------------

function normalizePlaylist(data: any): { url: string; filename: string }[] {
    const result: { url: string; filename: string }[] = [];

    // 1. Многоуровневый плейлист (CD1, CD2...)
    if (Array.isArray(data) && data[0]?.folder) {
        for (const disc of data) {
            const prefix = sanitize(disc.title || "");
            for (const track of disc.folder) {
                if (!track.file) continue;
                const base = sanitize(
                    track.title || track.file.split("/").pop() || "track"
                );
                const ext = track.file.split("?")[0].split(".").pop() || "mp3";
                result.push({
                    url: track.file,
                    filename: `${prefix}_${base}.${ext}`,
                });
            }
        }
        return result;
    }

    // 2. Обычный массив треков
    if (Array.isArray(data)) {
        for (const item of data) {
            if (!item || !item.file) continue;
            const url = item.file;
            const ext = url.split("?")[0].split(".").pop() || "mp3";
            const title = sanitize(item.title || url.split("/").pop() || "track");
            result.push({
                url,
                filename: `${title}.${ext}`,
            });
        }
        return result;
    }

    return result;
}

function extractArray(text: string): string | null {
    const start = text.indexOf("file:");
    if (start === -1) return null;

    let i = text.indexOf("[", start);
    if (i === -1) return null;

    let depth = 0;
    let j = i;

    while (j < text.length) {
        if (text[j] === "[") depth++;
        else if (text[j] === "]") depth--;

        j++;

        if (depth === 0) break;
    }

    return text.slice(i, j);
}

function extractTracksWithRegex(raw: string) {
    const result: { url: string; filename: string }[] = [];

    const regex =
        /title\s*:\s*["']([^"']*)["'][^}]*?file\s*:\s*["']([^"']+)["']/g;

    let match;
    while ((match = regex.exec(raw)) !== null) {
        const title = match[1].trim();
        const url = match[2].trim();

        if (!url) continue;

        const ext = url.split("?")[0].split(".").pop() || "mp3";
        const safeTitle = sanitize(title || url.split("/").pop() || "track");

        result.push({
            url,
            filename: `${safeTitle}.${ext}`,
        });
    }

    return result;
}

// -------------------------
// ОБЛОЖКА
// -------------------------

function getCoverInfo() {
    const img = document.querySelector(".fimg img") as HTMLImageElement | null;
    if (!img) return undefined;

    const raw = img.dataset.src || img.src;
    if (!raw) return undefined;

    const url = new URL(raw, location.origin).href;
    const ext = sanitize(url.split("?")[0].split(".").pop() || "jpg");

    return {
        url,
        filename: `cover.${ext}`,
    };
}

// -------------------------
// МЕТАДАННЫЕ
// -------------------------

function getAuthors() {
    const li = Array.from(document.querySelectorAll("li"));
    const authorLi = li.find((el) => el.querySelector(".fa-pencil"));
    if (!authorLi) return "";

    const names = Array.from(authorLi.querySelectorAll("a")).map((a) =>
        sanitize(a.textContent || "")
    );

    return names.join(", ");
}

function getNarrators() {
    const li = Array.from(document.querySelectorAll("li"));
    const readLi = li.find((el) => el.querySelector(".fa-microphone"));
    if (!readLi) return "";

    const names = Array.from(readLi.querySelectorAll("a")).map((a) =>
        sanitize(a.textContent || "")
    );

    return names.join(", ");
}

// -------------------------
// ОПИСАНИЕ
// -------------------------

function getDescription() {
    const blocks = document.querySelectorAll(".ftext.full-text");
    if (blocks.length < 2) return "";

    const target = blocks[1];
    let text = "";

    function walk(node: Node) {
        if (
            node.nodeName === "SCRIPT" ||
            node.nodeName === "STYLE" ||
            node.nodeName === "IFRAME" ||
            node.nodeName === "H2"
        ) {
            return;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            const t = node.textContent?.trim();
            if (t) text += t + " ";
        }

        node.childNodes.forEach(walk);
    }

    walk(target);

    text = text
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();

    return text;
}

function buildDescriptionText() {
    const title = getSafeBookFolderName();
    const authors = getAuthors();
    const narrators = getNarrators();
    const description = getDescription();
    const url = location.href;

    return (
        `Название: ${title}\n` +
        `Автор: ${authors}\n` +
        `Читает: ${narrators}\n\n` +
        `Описание:\n${description}\n\n` +
        `URL: ${url}\n`
    );
}

// -------------------------
// ВСТАВКА КНОПКИ
// -------------------------

let downloader: Downloader | null = null;
let buttonInitialized = false;

function setupDownloadButton() {
    if (buttonInitialized) return;

    if (isBookBlocked()) {
        console.log("Книга недоступна — кнопка не показывается");
        buttonInitialized = true;
        return;
    }

    const fleft = document.querySelector("div.fleft");
    if (!fleft) return;

    const { element: btn, setState } = createDownloadButton(async () => {
        if (!downloader) {
            downloader = new Downloader(setState);
        }

        const folder = getSafeBookFolderName();
        const files = await parsePlaylist();

        const cover = getCoverInfo();
        const descriptionText = buildDescriptionText();

        const pkg: DownloadPackage = {
            folder,
            cover,
            descriptionText,
            files, // только аудио, описание/обложка качаются после
        };

        downloader.start(pkg);
    });

    btn.addEventListener("abort-download", () => {
        if (downloader) {
            downloader.cancel();
            downloader.destroy();
            downloader = null;
        }
    });

    fleft.appendChild(btn);
    buttonInitialized = true;
}

// -------------------------
// АДАПТЕР ДЛЯ ЭТОГО САЙТА
// -------------------------

export const AudioknigaOnlineAdapter: SiteAdapter = {
    match(url: string) {
        return (
            url.includes("audiokniga-online.ru")
        );
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
