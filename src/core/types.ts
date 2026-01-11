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

export interface SiteAdapter {
    match(url: string): boolean;
    init(): void;
}
