// src/sites/knigavuhe.ts
import type { SiteAdapter, DownloadItem, DownloadPackage } from "../core/types";
import { Downloader } from "../core/downloader";
import { createDownloadButton } from "../ui/downloadButton";
import { buildStandardPackage } from "../core/package-builder";
import {insertBlockedMessage} from "../ui/blocked-message";
import {getExtFromURL} from "../core/utils";

export class KnigavuheAdapter implements SiteAdapter {
    readonly name = "Knigavuhe";

    private downloader: Downloader | null = null;
    private buttonInitialized = false;

    match(url: string): boolean {
        try {
            const pathname = new URL(url).pathname;
            return pathname.startsWith("/book/");
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

        const container = document.querySelector("div.book_left_content");
        if (!container) return;

        const coverBlock = container.querySelector("div.book_cover.use_bg");
        if (!coverBlock) return;

        const json = this.extractBookJson();
        if (!json) return;

        if (this.isBookBlocked(json)) {
            insertBlockedMessage(coverBlock)
            this.buttonInitialized = true;
            return;
        }

        const { element: btn, setState } = createDownloadButton(async () => {
            if (!this.downloader) {
                this.downloader = new Downloader(setState);

            }

            const pkg = this.buildPackage(json);
            this.downloader.start(pkg);
        });

        btn.style.marginTop = "12px";

        btn.addEventListener("abort-download", () => {
            this.downloader?.cancel();
            this.downloader?.destroy();
            this.downloader = null;
        });

        coverBlock.insertAdjacentElement("afterend", btn);
        this.buttonInitialized = true;

    }

    private extractBookJson(): any | null {
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

    private isBookBlocked(json: any): boolean {
        const buyWrap = document.querySelector(".book_buy_wrap");
        if (buyWrap) {
            const btn = buyWrap.querySelector("button.blue");
            if (btn && btn.textContent?.trim() === "Слушать полностью") return true;
        }
        return json?.book?.has_litres === true;
    }

    private parsePlaylist(json: any): DownloadItem[] {
        if (!json?.playlist || !Array.isArray(json.playlist)) return [];

        return json.playlist.map((track: any, index: number) => ({
            url: track.url,
            filename: track.title || `Track ${index + 1}`,
        }));
    }

    private getCover(json: any): DownloadItem | undefined {
        const url = json?.book?.cover;
        if (!url) return undefined;

        const ext = getExtFromURL(url, "jpg");
        return { url, filename: `cover.${ext}` };
    }

    private getDescriptionText(): string | undefined {
        return document.querySelector(".book_description")?.textContent?.trim();
    }

    private getAuthors(json: any): string {
        return Object.values(json?.book?.authors || {})
            .map((a: any) => a.name || "")
            .filter(Boolean)
            .join(", ");
    }

    private getReaders(json: any): string {
        return Object.values(json?.book?.readers || {})
            .map((r: any) => r.name || "")
            .filter(Boolean)
            .join(", ");
    }

    private buildPackage(json: any): DownloadPackage {
        return buildStandardPackage({
            title: json?.book?.name || "Audiobook",
            authors: this.getAuthors(json),
            readers: this.getReaders(json),
            description: this.getDescriptionText() || "",
            cover: this.getCover(json),
            files: this.parsePlaylist(json),
        });
    }
}

// Для registry.ts — экспортируем экземпляр
export const knigavuheAdapter = new KnigavuheAdapter();