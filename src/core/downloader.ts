import { DownloadItem, DownloadPackage } from "./types";
import { showErrorModal } from "../ui/errorModal";
import {getExtFromURL} from "./utils";

type ButtonState = "idle" | "downloading" | "done" | "abort";
type SetStateFn = (state: ButtonState, text?: string) => void;

enum State {
    Idle = "idle",
    Downloading = "downloading",
    Cancelled = "cancelled",
    Done = "done",
    Error = "error",
}

export class Downloader {
    private state = State.Idle;
    private queue: DownloadItem[] = [];
    private index = 0;
    private setState: SetStateFn;
    private listenerBound: (msg: any) => void;
    private listenersAttached = false;

    private auxQueue: DownloadItem[] = [];
    private auxIndex = 0;

    constructor(setState: SetStateFn) {
        this.setState = setState;
        this.listenerBound = this.onMessage.bind(this);
        this.attachListeners();
    }

    // ----------------------------------------------------
    // UNIVERSAL SANITIZE
    // ----------------------------------------------------

    private sanitizeName(str: string): string {
        return str
            .replace(/[\/\\:\*\?"<>\|]/g, "") // запрещённые символы
            .replace(/\s+/g, " ")             // схлопываем пробелы
            .replace(/\.+$/, "")              // убираем точки в конце
            .trim();
    }

    private isBrokenTitle(str: string): boolean {
        if (!str) return true;
        const badPatterns = [/Ð./g, /Ñ./g, /�/g];

        return badPatterns.some(re => re.test(str));
    }

    private buildFinalFilename(index: number, rawTitle: string, url: string): string {
        // const ext = url.split("?")[0].split(".").pop() || "mp3";
        const ext = getExtFromURL(url, "mp3");
        const num = String(index + 1).padStart(2, "0");

        // Битое или пустое название → только номер
        if (!rawTitle || this.isBrokenTitle(rawTitle)) {
            return `${num}.${ext}`;
        }

        const clean = this.sanitizeName(rawTitle);

        return clean ? `${num} ${clean}.${ext}` : `${num}.${ext}`;

        // if (!clean) {
        //     return `${num}.${ext}`;
        // }
        //
        // return `${num} ${clean}.${ext}`;
    }

    // ----------------------------------------------------
    // STATE MACHINE
    // ----------------------------------------------------

    private transition(newState: State) {
        this.state = newState;

        switch (newState) {
            case State.Idle:
                this.setState("idle", "Скачать книгу");
                break;

            case State.Downloading:
                this.setState("downloading", "Загрузка...");
                break;

            case State.Done:
                this.setState("done", "Готово");
                break;

            case State.Cancelled:
                this.setState("idle", "Скачать книгу");
                break;

            case State.Error:
                this.setState("abort", "Ошибка");
                break;
        }
    }

    private is(state: State) {
        return this.state === state;
    }

    // ----------------------------------------------------
    // START
    // ----------------------------------------------------

    public start(pkg: DownloadPackage) {
        if (!this.is(State.Idle)) return;

        if (!pkg.files || pkg.files.length === 0) {
            this.transition(State.Error);
            showErrorModal(
                `Не удалось обнаружить аудиофайлы.\nЕсли книга проигрывается на странице, <a href="https://t.me/GetAudioBook_Support" target="_blank">сообщите об ошибке</a>.`
            );
            return;
        }

        this.queue = [];
        this.auxQueue = [];
        this.index = 0;
        this.auxIndex = 0;

        // Нормализуем папку
        const cleanFolder = this.sanitizeName(pkg.folder);

        // description.txt
        if (pkg.descriptionText) {
            const desc = this.createDescriptionFile(pkg.descriptionText, cleanFolder);
            this.auxQueue.push(desc);
        }

        // cover
        if (pkg.cover) {
            this.auxQueue.push({
                url: pkg.cover.url,
                filename: `${cleanFolder}/${pkg.cover.filename}`,
            });
        }

        // AUDIO FILES — нормализация здесь
        pkg.files.forEach((f, index) => {
            const finalName = this.buildFinalFilename(index, f.filename, f.url);

            this.queue.push({
                url: f.url,
                filename: `${cleanFolder}/${finalName}`,
            });
        });

        if (this.queue.length === 0) {
            this.transition(State.Idle);
            return;
        }

        this.transition(State.Downloading);
        this.downloadNext();
    }

    // ----------------------------------------------------
    // CANCEL
    // ----------------------------------------------------

    public cancel() {
        if (!this.is(State.Downloading)) return;
        this.transition(State.Cancelled);
    }

    // ----------------------------------------------------
    // DESTROY
    // ----------------------------------------------------

    public destroy() {
        this.queue = [];
        this.auxQueue = [];
        this.index = 0;
        this.auxIndex = 0;
        this.state = State.Idle;
        this.setState = () => {};

        if (this.listenersAttached) {
            chrome.runtime.onMessage.removeListener(this.listenerBound);
            this.listenersAttached = false;
        }
    }

    // ----------------------------------------------------
    // DESCRIPTION.TXT
    // ----------------------------------------------------

    private createDescriptionFile(text: string, folder: string): DownloadItem {
        const base64 = btoa(unescape(encodeURIComponent(text)));
        return {
            url: `data:text/plain;base64,${base64}`,
            filename: `${folder}/description.txt`,
        };
    }

    // ----------------------------------------------------
    // DOWNLOAD QUEUE (AUDIO)
    // ----------------------------------------------------

    private downloadNext() {
        if (!this.is(State.Downloading)) return;

        if (this.index >= this.queue.length) {
            this.downloadAuxNext();
            return;
        }

        const item = this.queue[this.index];
        const progress = `Загрузка... ${this.index + 1}/${this.queue.length}`;
        this.setState("downloading", progress);

        chrome.runtime.sendMessage({
            action: "download",
            url: item.url,
            filename: item.filename,
            complete: true,
        });
    }

    // ----------------------------------------------------
    // DOWNLOAD AUX FILES
    // ----------------------------------------------------

    private downloadAuxNext() {
        if (!this.is(State.Downloading)) return;

        if (this.auxIndex >= this.auxQueue.length) {
            this.transition(State.Done);
            return;
        }

        const item = this.auxQueue[this.auxIndex];

        chrome.runtime.sendMessage({
            action: "download",
            url: item.url,
            filename: item.filename,
            complete: true,
        });
    }

    // ----------------------------------------------------
    // BACKGROUND LISTENER
    // ----------------------------------------------------

    private onMessage(msg: any) {
        if (!this.is(State.Downloading)) return;

        if (msg.action === "file-complete") {
            if (this.index < this.queue.length) {
                this.index++;
                this.downloadNext();
                return;
            }

            if (this.auxIndex < this.auxQueue.length) {
                this.auxIndex++;
                this.downloadAuxNext();
                return;
            }
        }

        if (msg.action === "file-error") {
            if (!this.is(State.Downloading)) return;
            this.transition(State.Error);
            showErrorModal("Не удалось скачать файл.\nПопробуйте снова.");
        }
    }

    private attachListeners() {
        if (this.listenersAttached) return;
        this.listenersAttached = true;

        chrome.runtime.onMessage.addListener(this.listenerBound);
    }
}
