// src/core/ui/blocked-message.ts
/**
 * Вставляет единообразное сообщение о недоступности книги
 * @param container Элемент, после которого вставляем сообщение
 * @param options Настройки (опционально)
 */
export function insertBlockedMessage(
    container: Element,
    options: { message?: string; style?: Partial<CSSStyleDeclaration> } = {}
): void {
    const defaultMessage = "Книга недоступна для скачивания";

    const msg = options.message ?? defaultMessage;

    const div = document.createElement("div");

    // Базовые стили (можно переопределить)
    Object.assign(div.style, {
        marginTop: "12px",
        color: "#c0392b",               // красный
        fontSize: "15px",
        fontWeight: "600",
        padding: "8px 12px",
        backgroundColor: "rgba(192, 57, 43, 0.08)",
        borderRadius: "6px",
        borderLeft: "4px solid #c0392b",
    });

    // Применяем пользовательские стили, если передали
    if (options.style) {
        Object.assign(div.style, options.style);
    }

    div.textContent = msg;

    container.insertAdjacentElement("afterend", div);
}