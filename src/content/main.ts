// src/content/main.ts

import type { SiteAdapter } from "../core/types";
import { AudioknigaOnlineAdapter } from "../sites/audiokniga-online";
import {KnigavuheAdapter} from "../sites/knigavuhe";
import {AudioknigaOneAdapter} from "../sites/audiokniga-one";
import {AudioknigiFunAdapter} from "../sites/audioknigi-fun";

const adapters: SiteAdapter[] = [
    AudioknigaOnlineAdapter,
    KnigavuheAdapter,
    AudioknigaOneAdapter,
    AudioknigiFunAdapter
];

(function bootstrap() {
    const url = window.location.href;
    const adapter = adapters.find((a) => a.match(url));

    if (!adapter) {
        return;
    }

    adapter.init();
})();
