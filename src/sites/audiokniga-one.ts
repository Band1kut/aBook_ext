// src/sites/audiokniga-one.ts
import type { SiteAdapter, DownloadItem, DownloadPackage } from "../core/types";
import { Downloader } from "../core/downloader";
import { createDownloadButton } from "../ui/downloadButton";
import { insertBlockedMessage } from "../ui/blocked-message"; // ← если вынесли
import { buildStandardPackage } from "../core/package-builder";
import {getExtFromURL} from "../core/utils";
import {showErrorModal} from "../ui/errorModal";

export class AudioknigaOneAdapter implements SiteAdapter {
    readonly name = "Audiokniga-One";

    private downloader: Downloader | null = null;
    private buttonInitialized = false;

    match(url: string): boolean {
        try {
            // const pathname = new URL(url).pathname;
            return url.includes("audiokniga.one/");
        } catch {
            return false;
        }
    }

    init(): void {
        if (!this.match(window.location.href)) return;

        this.setupDownloadButton();

        const observer = new MutationObserver(() => this.setupDownloadButton());
        observer.observe(document.body, { childList: true, subtree: true });

        // Опционально: отключить observer позже
        // setTimeout(() => observer.disconnect(), 20000);
    }

    private setupDownloadButton(): void {
        if (this.buttonInitialized) return;

        const coverBlock = document.querySelector("div.fimg.img-wide");
        if (!coverBlock) return;

        // Проверка блокировки
        if (this.isBookBlocked()) {
            insertBlockedMessage(coverBlock, {
                message: "Книга недоступна для скачивания (LitRes)",
            });
            this.buttonInitialized = true;
            return;
        }

        const { element: btn, setState } = createDownloadButton(async () => {
            if (!this.downloader) {
                this.downloader = new Downloader(setState);
            }

            const pkg = this.buildPackage();
            if (!pkg) return;

            this.downloader.start(pkg);
        });

        btn.addEventListener("abort-download", () => {
            this.downloader?.cancel();
            this.downloader?.destroy();
            this.downloader = null;
        });

        coverBlock.insertAdjacentElement("afterend", btn);
        this.buttonInitialized = true;
    }

    private isBookBlocked(): boolean {
        return Boolean(document.querySelector("div.llitres"));
    }

    private getTitle(): string {
        return document.querySelector("h1.b_short-title[itemprop='name']")?.textContent?.trim()||"";
    }

    private getAuthors(): string {
        const block = document.querySelector(".kniga_info_line.icon_author .kniga_info_line_link");
        if (!block) return "";

        return Array.from(block.querySelectorAll("span[itemprop='author']"))
            .map(span => span.textContent?.trim() || "")
            .filter(Boolean)
            .join(", ");
    }

    private getReaders(): string {
        const block = document.querySelector(".kniga_info_line.icon_reader .kniga_info_line_link");
        if (!block) return "";

        return Array.from(block.querySelectorAll("a"))
            .map(a => a.textContent?.trim() || "")
            .filter(Boolean)
            .join(", ");
    }

    private getDescription(): string {
        const block = document.querySelector(".fullstory[itemprop='description']");
        if (!block) return "";

        return Array.from(block.querySelectorAll("p"))
            .map(p => p.textContent?.trim() || "")
            .filter(Boolean)
            .join("\n\n");
    }

    private getCover(): DownloadItem | undefined {
        const container = document.querySelector("div.fimg.img-wide");
        if (!container) return undefined;

        const img = container.querySelector("img.xfieldimage.cover") as HTMLImageElement | null;
        if (!img) return undefined;

        const raw = img.dataset.src || img.src;
        if (!raw) return undefined;

        const url = new URL(raw, location.origin).href;
        const ext = getExtFromURL(url, "jpg");
        return { url, filename: `cover.${ext}` };
    }

    private extractPlaylist(): DownloadItem[] {
        const scripts = Array.from(document.querySelectorAll("script"));

        for (const s of scripts) {
            const text = s.textContent || "";
            if (!text.includes("playerInit")) continue;

            const match = text.match(/playerInit\s*\([\s\S]*?,\s*[\s\S]*?,\s*[\s\S]*?,\s*(\[[\s\S]*?\])\s*,/);
            if (!match) continue;

            try {
                const arr: any[] = JSON.parse(match[1]);

                return arr.map((item, index) => {
                    const url = item.url;
                    if (!url) return null;

                    return { url, filename: item.title };
                }).filter((t): t is DownloadItem => t !== null);
            } catch (e) {
                console.error("[audiokniga-one] Ошибка парсинга плейлиста:", e);
                return [];
            }
        }

        return [];
    }

    private buildPackage(): DownloadPackage | null {
        try {
            const files = this.extractPlaylist();

            if (files.length === 0) {
                showErrorModal(
                    `Не удалось извлечь плейлист.<br>
           Сообщите о проблеме в <a href="https://t.me/your_support_group" target="_blank">поддержку</a>.`
                );
                return null;
            }

            return buildStandardPackage({
                title: this.getTitle(),
                authors: this.getAuthors(),
                readers: this.getReaders(),
                description: this.getDescription(),
                cover: this.getCover(),
                files,
                sourceUrl: location.href,
            });
        } catch (err) {
            console.error("[audiokniga-one] Ошибка сборки пакета:", err);
            showErrorModal("Произошла ошибка при подготовке книги.");
            return null;
        }
    }
}

// Экспорт экземпляра для registry
export const audioknigaOneAdapter = new AudioknigaOneAdapter();