// background.ts

// Хранилище активных скачиваний: downloadId → { tabId, resolve, reject }
const activeDownloads = new Map<
    number,
    { tabId: number; resolve: () => void; reject: (reason?: any) => void }
>();

// Один общий слушатель изменений статуса скачивания (добавляется один раз!)
chrome.downloads.onChanged.addListener((delta) => {
    const info = activeDownloads.get(delta.id);
    if (!info) return;

    if (delta.state?.current === "complete") {
        info.resolve();
        activeDownloads.delete(delta.id);
        safeSendMessage(info.tabId, { action: "file-complete", downloadId: delta.id });
    } else if (delta.state?.current === "interrupted") {
        info.reject(delta.error?.current || "Interrupted");
        activeDownloads.delete(delta.id);
        safeSendMessage(info.tabId, {
            action: "file-error",
            downloadId: delta.id,
            reason: delta.error?.current || "Unknown error"
        });
    }
});

// --------------------------------------------------
// Безопасная отправка сообщения в content script
// Не падает, если вкладка закрыта/перезагружена
// --------------------------------------------------
function safeSendMessage(tabId: number, message: any) {
    if (tabId < 0) return;

    chrome.tabs.sendMessage(tabId, message, () => {
        // Проверяем ошибку сразу после отправки
        if (chrome.runtime.lastError) {
            // Тихо игнорируем — это нормально, если вкладка уже закрыта
            // console.debug("Cannot send message: tab unavailable", chrome.runtime.lastError.message);
            return;
        }
    });
}

// --------------------------------------------------
// Обработчик сообщений от content script
// --------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "download") {
        const { url, filename } = msg;
        const tabId = sender.tab?.id;

        if (typeof tabId !== "number") {
            console.warn("No tabId for download status");
            sendResponse({ status: "error", reason: "No tabId" });
            return true;
        }

        downloadWithRetries(url, filename, tabId)
            .then(() => sendResponse({ status: "started" }))
            .catch((err) => sendResponse({ status: "error", reason: err }));

        return true; // Держим канал открытым для асинхронного ответа
    }

    return false;
});

// --------------------------------------------------
// Скачивание с 3 попытками
// --------------------------------------------------
async function downloadWithRetries(
    url: string,
    filename: string,
    tabId: number,
    maxRetries = 3
): Promise<void> {
    let attempt = 1;

    while (attempt <= maxRetries) {
        try {
            await downloadSingle(url, filename, tabId);
            return; // Успех — выходим
        } catch (err) {
            console.warn(`Попытка ${attempt}/${maxRetries} не удалась:`, err);

            if (attempt === maxRetries) {
                safeSendMessage(tabId, {
                    action: "file-error",
                    error: err instanceof Error ? err.message : String(err)
                });
                throw err; // Последняя попытка провалилась
            }

            // Задержка перед следующей попыткой (увеличивается)
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            attempt++;
        }
    }
}

// --------------------------------------------------
// Скачивание одного файла с использованием Promise
// --------------------------------------------------
function downloadSingle(url: string, filename: string, tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.downloads.download(
            {
                url,
                filename,                    // например: "Audiobook/01 - Вступление.mp3"
                conflictAction: "overwrite", // или "uniquify" — по вкусу
                saveAs: false
            },
            (downloadId) => {
                if (chrome.runtime.lastError || typeof downloadId !== "number") {
                    const errorMsg = chrome.runtime.lastError?.message || "Failed to start download";
                    reject(new Error(errorMsg));
                    return;
                }

                // Регистрируем скачивание
                activeDownloads.set(downloadId, {
                    tabId,
                    resolve,
                    reject
                });
            }
        );
    });
}