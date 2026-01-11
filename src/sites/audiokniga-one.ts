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
// ПРОВЕРКА ДОСТУПНОСТИ КНИГИ
// --------------------------------------------------

function isBookBlocked(): boolean {
    // На audiokniga.one книга недоступна, если есть div.llitres
    return Boolean(document.querySelector("div.llitres"));
}

// --------------------------------------------------
// НАЗВАНИЕ
// --------------------------------------------------

function getTitle(): string {
    const h1 = document.querySelector("h1.b_short-title[itemprop='name']");
    if (!h1) return "Audiobook";
    return sanitize(h1.textContent || "Audiobook");
}

// --------------------------------------------------
// АВТОРЫ
// --------------------------------------------------

function getAuthors(): string {
    const block = document.querySelector(".kniga_info_line.icon_author .kniga_info_line_link");
    if (!block) return "";

    const authors = Array.from(block.querySelectorAll("span[itemprop='author']"))
        .map(span => span.textContent?.trim() || "")
        .filter(Boolean);

    return authors.join(", ");
}

// --------------------------------------------------
// ЧТЕЦЫ
// --------------------------------------------------

function getReaders(): string {
    const block = document.querySelector(".kniga_info_line.icon_reader .kniga_info_line_link");
    if (!block) return "";

    const readers = Array.from(block.querySelectorAll("a"))
        .map(a => a.textContent?.trim() || "")
        .filter(Boolean);

    return readers.join(", ");
}

// --------------------------------------------------
// ОПИСАНИЕ
// --------------------------------------------------

function getDescription(): string {
    const block = document.querySelector(".fullstory[itemprop='description']");
    if (!block) return "";

    const paragraphs = Array.from(block.querySelectorAll("p"))
        .map(p => p.textContent?.trim() || "")
        .filter(Boolean);

    return paragraphs.join("\n\n");
}

// --------------------------------------------------
// ОБЛОЖКА
// --------------------------------------------------

function getCoverInfo() {
    const container = document.querySelector("div.fimg.img-wide");
    if (!container) return undefined;

    const img = container.querySelector("img.xfieldimage.cover") as HTMLImageElement | null;
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
// ПЛЕЙЛИСТ ИЗ playerInit(...)
// --------------------------------------------------

function extractPlaylist(): { url: string; filename: string }[] {
    const scripts = Array.from(document.querySelectorAll("script"));

    for (const s of scripts) {
        const text = s.textContent || "";
        if (!text.includes("playerInit")) continue;

        // Ищем playerInit(..., ..., ..., <ARRAY>, ...)
        const match = text.match(/playerInit\s*\([\s\S]*?,\s*[\s\S]*?,\s*[\s\S]*?,\s*(\[[\s\S]*?\])\s*,/);
        if (!match) continue;

        try {
            const arr = JSON.parse(match[1]);

            return arr.map((item: any, index: number) => {
                const url = item.url;
                const title = sanitize(item.title || item.single_name || `Track ${index + 1}`);
                const ext = url.split("?")[0].split(".").pop() || "mp3";

                return {
                    url,
                    filename: `${title}.${ext}`,
                };
            });
        } catch (e) {
            console.error("[audiokniga.one] Ошибка парсинга плейлиста:", e);
            return [];
        }
    }

    return [];
}

// --------------------------------------------------
// СБОРКА DownloadPackage
// --------------------------------------------------

function buildPackage(): DownloadPackage | null {
    const title = getTitle();
    const authors = getAuthors();
    const readers = getReaders();
    const description = getDescription();
    const cover = getCoverInfo();
    const files = extractPlaylist();

    if (files.length === 0) {
        showErrorModal(`
            Не удалось извлечь плейлист.<br>
            Сообщите о проблеме в 
            <a href="https://t.me/your_support_group" target="_blank">поддержку</a>.
        `);
        return null;
    }

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

    const coverBlock = document.querySelector("div.fimg.img-wide");
    if (!coverBlock) return;

    // Проверка доступности
    if (isBookBlocked()) {
        coverBlock.insertAdjacentHTML(
            "afterend",
            `<div style="margin-top: 12px; color: #c0392b; font-size: 15px; font-weight: 600;">
                Книга недоступна для скачивания
            </div>`
        );
        buttonInitialized = true;
        return;
    }

    // Создаём кнопку
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

    coverBlock.insertAdjacentElement("afterend", btn);

    buttonInitialized = true;
}

// --------------------------------------------------
// АДАПТЕР
// --------------------------------------------------

export const AudioknigaOneAdapter: SiteAdapter = {
    match(url: string) {
        return url.includes("audiokniga.one");
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
