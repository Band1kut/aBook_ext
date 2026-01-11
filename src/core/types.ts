export interface DownloadItem {
    url: string;
    filename: string;
}

export interface DownloadPackage {
    folder: string;
    cover?: DownloadItem;
    descriptionText?: string;   // ← только текст
    files: DownloadItem[];
}

// export interface SiteAdapter {
//     match(url: string): boolean;
//     init(): void;
// }

export interface SiteAdapter {
    /** Удобное имя для логов и отладки */
    readonly name: string;

    /** Основные домены (без www, protocol) — самый быстрый способ проверки */
    readonly domains?: string[];

    /**
     * Дополнительная проверка (если домен не уникален или нужна проверка пути/элементов)
     * Используется как fallback, если domains не совпали
     */
    match(url: string): boolean;

    /**
     * Главный метод — точка входа адаптера
     * Здесь обычно:
     * 1. Проверка блокировки книги
     * 2. Парсинг метаданных
     * 3. Парсинг плейлиста
     * 4. Вставка кнопки скачивания
     */
    init(): void | Promise<void>;

    // Опциональные методы, которые можно вызывать из init()
    // parsePlaylist?(): Promise<Track[]>;
    // insertButton?(): void;
    // getMetadata?(): Promise<Partial<DownloadPackage>>;
}