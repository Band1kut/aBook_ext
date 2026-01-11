// src/content/registry.ts
import type { SiteAdapter } from "../core/types";

import { AudioknigaOnlineAdapter } from "../sites/audiokniga-online";
import { KnigavuheAdapter } from "../sites/knigavuhe";
import { AudioknigaOneAdapter } from "../sites/audiokniga-one";
import { AudioknigiFunAdapter } from "../sites/audioknigi-fun";
// ────────────────────────────────────────────────────────────────
// Добавляй сюда новые адаптеры по мере необходимости
// ────────────────────────────────────────────────────────────────

const adapters: SiteAdapter[] = [
    AudioknigaOnlineAdapter,
    KnigavuheAdapter,
    AudioknigaOneAdapter,
    AudioknigiFunAdapter,
    // new AnotherSiteAdapter(), // ← просто добавляй строку
];

/**
 * Находит подходящий адаптер для текущей страницы
 */
export function getCurrentAdapter(): SiteAdapter | undefined {
    const url = window.location.href;
    const hostname = new URL(url).hostname.toLowerCase();

    return adapters.find((adapter) => {
        // 1. Проверка по явным доменам (самый быстрый путь)
        if (adapter.domains?.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
            return true;
        }

        // 2. Fallback на кастомную проверку (если нужно)
        return adapter.match?.(url) ?? false;
    });
}