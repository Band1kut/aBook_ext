// src/core/package-builder.ts
import { DownloadPackage, DownloadItem} from "./types";
// import { sanitize } from "./utils";  // вынеси sanitize туда же

export function buildStandardPackage(params: {
    title: string;
    authors: string;
    readers: string;
    description: string;
    cover?: DownloadItem;
    files: DownloadItem[];
    sourceUrl?: string;
}): DownloadPackage {
    const cleanTitle = params.title || "Audiobook";

    return {
        folder: cleanTitle,
        files: params.files,
        cover: params.cover,
        descriptionText: [
            `Название: ${cleanTitle}`,
            `Автор: ${params.authors}`,
            `Читает: ${params.readers}`,
            "",
            `Описание:`,
            params.description.trim() || "Описание отсутствует",
            "",
            `Источник: ${params.sourceUrl || window.location.href}`,
        ].join("\n"),
    };
}