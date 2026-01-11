// src/content/main.ts
import { getCurrentAdapter } from "./registry";

(function initialize() {
    try {
        const adapter = getCurrentAdapter();

        if (!adapter) {
            // Можно оставить тихий режим или логировать для разработки
            // console.debug("[aBook] Нет подходящего адаптера для", location.hostname);
            return;
        }

        console.log("[aBook] Адаптер найден:", adapter.name || "unnamed");

        // Запускаем инициализацию (может быть синхронной или асинхронной)
        const result = adapter.init();

        // Если init возвращает Promise — дожидаемся
        if (result instanceof Promise) {
            result.catch((err) => {
                console.error(`[${adapter.name || "adapter"}] Ошибка инициализации:`, err);
            });
        }
    } catch (error) {
        console.error("[aBook Content] Критическая ошибка при запуске:", error);
    }
})();