export function getExtFromURL(url: string, defaultExt: string) {
    return url.split("?")[0].split(".").pop() || defaultExt;
}