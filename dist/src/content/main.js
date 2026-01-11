(function(){"use strict";function p(e){const t=document.createElement("button");t.id="abook-download-btn",t.dataset.state="idle",t.textContent="Скачать книгу";let r="Загрузка...",n=!1;return t.addEventListener("mouseenter",()=>{n=!0,t.dataset.state==="downloading"&&(t.textContent="Прервать")}),t.addEventListener("mouseleave",()=>{n=!1,t.dataset.state==="downloading"&&(t.textContent=r)}),t.addEventListener("click",()=>{if(!t.disabled){if(t.dataset.state==="downloading"){t.dispatchEvent(new CustomEvent("abort-download"));return}e()}}),{element:t,setState(o,i){if(t.dataset.state=o,o==="idle"){t.disabled=!1,t.textContent="Скачать книгу";return}if(o==="downloading"){t.disabled=!1,r=i||"Загрузка...",n||(t.textContent=r);return}if(o==="done"){t.disabled=!0,t.textContent="Готово";return}if(o==="abort"){t.disabled=!1,t.textContent=i||"Ошибка";return}}}}function m(e){const t=document.getElementById("abook-error-modal");if(t&&t.remove(),!document.getElementById("abook-error-modal-style")){const c=document.createElement("style");c.id="abook-error-modal-style",c.textContent=`
            #abook-error-modal {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #abook-error-box {
                background: #fff;
                padding: 22px 28px;
                border-radius: 8px;
                max-width: 380px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                font-family: sans-serif;
                text-align: center;
                animation: fadeIn 0.15s ease-out;
            }

            #abook-error-title {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 12px;
            }

            #abook-error-text {
                font-size: 15px;
                margin-bottom: 20px;
                white-space: pre-line;
            }

            #abook-error-text a {
                color: #3498db;
                text-decoration: none;
                font-weight: 600;
            }

            #abook-error-text a:hover {
                text-decoration: underline;
            }

            #abook-error-btn {
                font-size: 15px;
                border: none;
                border-radius: 6px;
                background: #e74c3c;
                color: #fff;
                cursor: pointer;
                min-width: 120px;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
            }
        `,document.head.appendChild(c)}const r=document.createElement("div");r.id="abook-error-modal";const n=document.createElement("div");n.id="abook-error-box";const o=document.createElement("div");o.id="abook-error-title",o.textContent="Ошибка";const i=document.createElement("div");i.id="abook-error-text",i.innerHTML=e;const s=document.createElement("button");s.id="abook-error-btn",s.textContent="Закрыть",s.onclick=()=>r.remove(),n.appendChild(o),n.appendChild(i),n.appendChild(s),r.appendChild(n),document.body.appendChild(r)}class h{constructor(t){this.state="idle",this.queue=[],this.index=0,this.listenersAttached=!1,this.auxQueue=[],this.auxIndex=0,this.setState=t,this.listenerBound=this.onMessage.bind(this),this.attachListeners()}sanitizeName(t){return t.replace(/[\/\\:\*\?"<>\|]/g,"").replace(/\s+/g," ").replace(/\.+$/,"").trim()}isBrokenTitle(t){return t?[/Ð./g,/Ñ./g,/�/g].some(n=>n.test(t)):!0}buildFinalFilename(t,r,n){const o=n.split("?")[0].split(".").pop()||"mp3",i=String(t+1).padStart(2,"0");if(!r||this.isBrokenTitle(r))return`${i}.${o}`;const s=this.sanitizeName(r);return s?`${i} ${s}.${o}`:`${i}.${o}`}transition(t){switch(this.state=t,t){case"idle":this.setState("idle","Скачать книгу");break;case"downloading":this.setState("downloading","Загрузка...");break;case"done":this.setState("done","Готово");break;case"cancelled":this.setState("idle","Скачать книгу");break;case"error":this.setState("abort","Ошибка");break}}is(t){return this.state===t}start(t){if(!this.is("idle"))return;if(!t.files||t.files.length===0){this.transition("error"),m(`Не удалось обнаружить аудиофайлы.
Если книга проигрывается на странице, <a href="https://t.me/GetAudioBook_Support" target="_blank">сообщите об ошибке</a>.`);return}this.queue=[],this.auxQueue=[],this.index=0,this.auxIndex=0;const r=this.sanitizeName(t.folder);if(t.descriptionText){const n=this.createDescriptionFile(t.descriptionText,r);this.auxQueue.push(n)}if(t.cover&&this.auxQueue.push({url:t.cover.url,filename:`${r}/${t.cover.filename}`}),t.files.forEach((n,o)=>{const i=this.buildFinalFilename(o,n.filename,n.url);this.queue.push({url:n.url,filename:`${r}/${i}`})}),this.queue.length===0){this.transition("idle");return}this.transition("downloading"),this.downloadNext()}cancel(){this.is("downloading")&&this.transition("cancelled")}destroy(){this.queue=[],this.auxQueue=[],this.index=0,this.auxIndex=0,this.state="idle",this.setState=()=>{},this.listenersAttached&&(chrome.runtime.onMessage.removeListener(this.listenerBound),this.listenersAttached=!1)}createDescriptionFile(t,r){return{url:`data:text/plain;base64,${btoa(unescape(encodeURIComponent(t)))}`,filename:`${r}/description.txt`}}downloadNext(){if(!this.is("downloading"))return;if(this.index>=this.queue.length){this.downloadAuxNext();return}const t=this.queue[this.index],r=`Загрузка... ${this.index+1}/${this.queue.length}`;this.setState("downloading",r),chrome.runtime.sendMessage({action:"download",url:t.url,filename:t.filename,complete:!0})}downloadAuxNext(){if(!this.is("downloading"))return;if(this.auxIndex>=this.auxQueue.length){this.transition("done");return}const t=this.auxQueue[this.auxIndex];chrome.runtime.sendMessage({action:"download",url:t.url,filename:t.filename,complete:!0})}onMessage(t){if(this.is("downloading")){if(t.action==="file-complete"){if(this.index<this.queue.length){this.index++,this.downloadNext();return}if(this.auxIndex<this.auxQueue.length){this.auxIndex++,this.downloadAuxNext();return}}if(t.action==="file-error"){if(!this.is("downloading"))return;this.transition("error"),m(`Не удалось скачать файл.
Попробуйте снова.`)}}}attachListeners(){this.listenersAttached||(this.listenersAttached=!0,chrome.runtime.onMessage.addListener(this.listenerBound))}}function l(e){return e.replace(/[\/\\:\*\?"<>\|]/g,"").replace(/\s+/g," ").replace(/\.+$/,"").trim()}function v(){const e=document.querySelector("h1.short-title");return e?l(e.textContent||"Audiobook"):"Audiobook"}function T(){const e=document.querySelector(".ftext.full-text.cleasrfix");return e?e.innerText.toLowerCase().includes("по требованию правообладателя"):!1}async function E(){const t=Array.from(document.querySelectorAll("script")).find(i=>{var s;return(s=i.textContent)==null?void 0:s.includes("new Playerjs")});if(!t)return[];const r=t.textContent,n=N(r);if(!n){const i=r.match(/file\s*:\s*["']([^"']+)["']/);if(!i)return[];const s=i[1];if(s.includes("playlist.txt.php"))try{const c=new URL(s,location.origin).href,k=await(await fetch(c)).json();return $(k)}catch(c){return console.error("Ошибка загрузки playlist.txt.php:",c),[]}return[{url:s,filename:l(s.split("/").pop()||"track.mp3")}]}const o=I(n);if(o.length>0)return o;try{const i=Function("return "+n)();return $(i)}catch(i){return console.error("Ошибка парсинга JS-плейлиста:",i,n),[]}}function $(e){var r;const t=[];if(Array.isArray(e)&&((r=e[0])!=null&&r.folder)){for(const n of e){const o=l(n.title||"");for(const i of n.folder){if(!i.file)continue;const s=l(i.title||i.file.split("/").pop()||"track"),c=i.file.split("?")[0].split(".").pop()||"mp3";t.push({url:i.file,filename:`${o}_${s}.${c}`})}}return t}if(Array.isArray(e)){for(const n of e){if(!n||!n.file)continue;const o=n.file,i=o.split("?")[0].split(".").pop()||"mp3",s=l(n.title||o.split("/").pop()||"track");t.push({url:o,filename:`${s}.${i}`})}return t}return t}function N(e){const t=e.indexOf("file:");if(t===-1)return null;let r=e.indexOf("[",t);if(r===-1)return null;let n=0,o=r;for(;o<e.length&&(e[o]==="["?n++:e[o]==="]"&&n--,o++,n!==0););return e.slice(r,o)}function I(e){const t=[],r=/title\s*:\s*["']([^"']*)["'][^}]*?file\s*:\s*["']([^"']+)["']/g;let n;for(;(n=r.exec(e))!==null;){const o=n[1].trim(),i=n[2].trim();if(!i)continue;const s=i.split("?")[0].split(".").pop()||"mp3",c=l(o||i.split("/").pop()||"track");t.push({url:i,filename:`${c}.${s}`})}return t}function z(){const e=document.querySelector(".fimg img");if(!e)return;const t=e.dataset.src||e.src;if(!t)return;const r=new URL(t,location.origin).href,n=l(r.split("?")[0].split(".").pop()||"jpg");return{url:r,filename:`cover.${n}`}}function M(){const t=Array.from(document.querySelectorAll("li")).find(n=>n.querySelector(".fa-pencil"));return t?Array.from(t.querySelectorAll("a")).map(n=>l(n.textContent||"")).join(", "):""}function O(){const t=Array.from(document.querySelectorAll("li")).find(n=>n.querySelector(".fa-microphone"));return t?Array.from(t.querySelectorAll("a")).map(n=>l(n.textContent||"")).join(", "):""}function D(){const e=document.querySelectorAll(".ftext.full-text");if(e.length<2)return"";const t=e[1];let r="";function n(o){var i;if(!(o.nodeName==="SCRIPT"||o.nodeName==="STYLE"||o.nodeName==="IFRAME"||o.nodeName==="H2")){if(o.nodeType===Node.TEXT_NODE){const s=(i=o.textContent)==null?void 0:i.trim();s&&(r+=s+" ")}o.childNodes.forEach(n)}}return n(t),r=r.replace(/&quot;/g,'"').replace(/\s+/g," ").trim(),r}function P(){const e=v(),t=M(),r=O(),n=D(),o=location.href;return`Название: ${e}
Автор: ${t}
Читает: ${r}

Описание:
${n}

URL: ${o}
`}let a=null,x=!1;function w(){if(x)return;if(T()){console.log("Книга недоступна — кнопка не показывается"),x=!0;return}const e=document.querySelector("div.fleft");if(!e)return;const{element:t,setState:r}=p(async()=>{a||(a=new h(r));const n=v(),o=await E(),i=z(),s=P(),c={folder:n,cover:i,descriptionText:s,files:o};a.start(c)});t.addEventListener("abort-download",()=>{a&&(a.cancel(),a.destroy(),a=null)}),e.appendChild(t),x=!0}const R={match(e){return e.includes("audiokniga-online.ru")},init(){w(),new MutationObserver(()=>w()).observe(document.body,{childList:!0,subtree:!0})}};function F(){const e=Array.from(document.querySelectorAll("script"));for(const t of e){const r=t.textContent||"";if(!r.includes("BookController.enter"))continue;const n=r.match(/BookController\.enter\((\{[\s\S]*?\})\)/);if(n)try{return JSON.parse(n[1])}catch(o){return console.error("[knigavuhe] Ошибка парсинга JSON:",o),null}}return null}function U(e){var r,n;const t=document.querySelector(".book_buy_wrap");if(t){const o=t.querySelector("button.blue");if(o&&((r=o.textContent)==null?void 0:r.trim())==="Слушать полностью")return!0}return((n=e==null?void 0:e.book)==null?void 0:n.has_litres)===!0}function Q(e){return!(e!=null&&e.playlist)||!Array.isArray(e.playlist)?[]:e.playlist.map((t,r)=>{const n=t.url,o=t.title||`Track ${r+1}`;return{url:n,filename:o}})}function J(e){var n;const t=(n=e==null?void 0:e.book)==null?void 0:n.cover;if(!t)return;const r=t.split("?")[0].split(".").pop()||"jpg";return{url:t,filename:`cover.${r}`}}function H(){var t;const e=document.querySelector(".book_description");if(e)return((t=e.textContent)==null?void 0:t.trim())||void 0}function W(e){var r;const t=(r=e==null?void 0:e.book)==null?void 0:r.authors;return t?Object.values(t).map(n=>n.name||"").join(", "):""}function G(e){var r;const t=(r=e==null?void 0:e.book)==null?void 0:r.readers;return t?Object.values(t).map(n=>n.name||"").join(", "):""}function K(e){var s;const t=((s=e==null?void 0:e.book)==null?void 0:s.name)||"Audiobook",r=t,n=Q(e),o=J(e),i=`Название: ${t}
Автор: ${W(e)}
Читает: ${G(e)}

Описание:
${H()||""}

URL: ${location.href}
`;return{folder:r,files:n,cover:o,descriptionText:i}}let u=null,g=!1;function S(){if(g)return;const e=document.querySelector("div.book_left_content");if(!e)return;const t=e.querySelector("div.book_cover.use_bg");if(!t)return;const r=F();if(!r)return;if(U(r)){t.insertAdjacentHTML("afterend",`<div style="margin-top: 12px; color: #c0392b; font-size: 15px; font-weight: 600;">
                Книга недоступна для скачивания
            </div>`),g=!0;return}const{element:n,setState:o}=p(async()=>{u||(u=new h(o));const i=K(r);u.start(i)});n.style.marginTop="12px",n.addEventListener("abort-download",()=>{u&&(u.cancel(),u.destroy(),u=null)}),t.insertAdjacentElement("afterend",n),g=!0}const X={match(e){return e.includes("knigavuhe.org")},init(){S(),new MutationObserver(()=>S()).observe(document.body,{childList:!0,subtree:!0})}};function A(e){return e.replace(/[\/\\:\*\?"<>\|]/g,"").replace(/\s+/g," ").replace(/\.+$/,"").trim()}function Y(){return!!document.querySelector("div.llitres")}function V(){const e=document.querySelector("h1.b_short-title[itemprop='name']");return e?A(e.textContent||"Audiobook"):"Audiobook"}function Z(){const e=document.querySelector(".kniga_info_line.icon_author .kniga_info_line_link");return e?Array.from(e.querySelectorAll("span[itemprop='author']")).map(r=>{var n;return((n=r.textContent)==null?void 0:n.trim())||""}).filter(Boolean).join(", "):""}function j(){const e=document.querySelector(".kniga_info_line.icon_reader .kniga_info_line_link");return e?Array.from(e.querySelectorAll("a")).map(r=>{var n;return((n=r.textContent)==null?void 0:n.trim())||""}).filter(Boolean).join(", "):""}function tt(){const e=document.querySelector(".fullstory[itemprop='description']");return e?Array.from(e.querySelectorAll("p")).map(r=>{var n;return((n=r.textContent)==null?void 0:n.trim())||""}).filter(Boolean).join(`

`):""}function et(){const e=document.querySelector("div.fimg.img-wide");if(!e)return;const t=e.querySelector("img.xfieldimage.cover");if(!t)return;const r=t.dataset.src||t.src;if(!r)return;const n=new URL(r,location.origin).href,o=n.split("?")[0].split(".").pop()||"jpg";return{url:n,filename:`cover.${o}`}}function nt(){const e=Array.from(document.querySelectorAll("script"));for(const t of e){const r=t.textContent||"";if(!r.includes("playerInit"))continue;const n=r.match(/playerInit\s*\([\s\S]*?,\s*[\s\S]*?,\s*[\s\S]*?,\s*(\[[\s\S]*?\])\s*,/);if(n)try{return JSON.parse(n[1]).map((i,s)=>{const c=i.url,L=A(i.title||i.single_name||`Track ${s+1}`),k=c.split("?")[0].split(".").pop()||"mp3";return{url:c,filename:`${L}.${k}`}})}catch(o){return console.error("[audiokniga.one] Ошибка парсинга плейлиста:",o),[]}}return[]}function rt(){const e=V(),t=Z(),r=j(),n=tt(),o=et(),i=nt();if(i.length===0)return m(`
            Не удалось извлечь плейлист.<br>
            Сообщите о проблеме в 
            <a href="https://t.me/your_support_group" target="_blank">поддержку</a>.
        `),null;const s=`Название: ${e}
Автор: ${t}
Читает: ${r}

Описание:
${n}

URL: ${location.href}
`;return{folder:e,files:i,cover:o,descriptionText:s}}let d=null,b=!1;function q(){if(b)return;const e=document.querySelector("div.fimg.img-wide");if(!e)return;if(Y()){e.insertAdjacentHTML("afterend",`<div style="margin-top: 12px; color: #c0392b; font-size: 15px; font-weight: 600;">
                Книга недоступна для скачивания
            </div>`),b=!0;return}const{element:t,setState:r}=p(async()=>{d||(d=new h(r));const n=rt();n&&d.start(n)});t.style.marginTop="12px",t.addEventListener("abort-download",()=>{d&&(d.cancel(),d.destroy(),d=null)}),e.insertAdjacentElement("afterend",t),b=!0}const ot={match(e){return e.includes("audiokniga.one")},init(){q(),new MutationObserver(()=>q()).observe(document.body,{childList:!0,subtree:!0})}};function C(e){return e.replace(/[\/\\:\*\?"<>\|]/g,"").replace(/\s+/g," ").replace(/\.+$/,"").trim()}function it(){const e=document.querySelector("header.page__header h1");return e?C(e.textContent||"Audiobook"):"Audiobook"}function st(){const e=document.querySelector("ul.pmovie__header-list.flex-grow-1");if(!e)return"";const t=e.querySelector("li");return t?Array.from(t.querySelectorAll("a")).map(o=>{var i;return((i=o.textContent)==null?void 0:i.trim())||""}).filter(Boolean).join(", "):""}function ct(){const e=document.querySelector("ul.page__subcol-side2.pmovie__header-list");if(!e)return"";const r=Array.from(e.querySelectorAll("li")).find(i=>{var s;return(s=i.textContent)==null?void 0:s.toLowerCase().includes("исполнители")});return r?Array.from(r.querySelectorAll("a")).map(i=>{var s;return((s=i.textContent)==null?void 0:s.trim())||""}).filter(Boolean).join(", "):""}function lt(){const e=document.querySelector("div.page__text.full-text.clearfix");if(!e)return"";const t=e.cloneNode(!0),r=t.querySelector("h2");return r&&r.remove(),(t.textContent||"").replace(/\s+/g," ").trim()}function at(){const e=document.querySelector(".pmovie__poster.img-fit-cover");if(!e)return;const t=e.querySelector("img");if(!t)return;const r=t.dataset.src||t.src;if(!r)return;const n=new URL(r,location.origin).href,o=n.split("?")[0].split(".").pop()||"jpg";return{url:n,filename:`cover.${o}`}}function _(){const e=Array.from(document.querySelectorAll("script"));for(const t of e){const r=t.textContent||"";if(!r.includes("Playerjs")||!r.includes("strDecode"))continue;const n=r.match(/file\s*:\s*strDecode\(["']([^"']+)["']\)/);if(n)return n[1]}return""}function ut(e){const t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",r="PUhncLHApBrM7GvdqT4tNWRjemgak9oVzwZ8K1XDfY5bQOSlsF26yi0JCIuxE3+/=",n={};for(let i=0;i<t.length;i++)n[r[i]]=t[i];let o="";for(const i of e)o+=n[i]??"";try{return atob(o)}catch(i){return console.error("[audioknigi.fun] Ошибка Base64 декодирования:",i),""}}function dt(){const e=_();if(!e)return[];const t=ut(e);if(!t)return[];let r=[];try{r=JSON.parse(t)}catch(n){return console.error("[audioknigi.fun] Ошибка JSON плейлиста:",n),[]}return r.map((n,o)=>{const i=n.file,s=C(n.title||n.single_name||`Track ${o+1}`),c=i.split("?")[0].split(".").pop()||"mp3";return{url:i,filename:`${s}.${c}`}})}function ft(){return _()===""}function pt(){const e=dt();if(e.length===0)return m("Не удалось извлечь плейлист."),null;const t=it(),r=st(),n=ct(),o=lt(),i=at(),s=`Название: ${t}
Автор: ${r}
Читает: ${n}

Описание:
${o}

URL: ${location.href}
`;return{folder:t,files:e,cover:i,descriptionText:s}}let f=null,y=!1;function B(){if(y)return;const e=document.querySelector(".pmovie__poster.img-fit-cover");if(!e)return;if(ft()){e.insertAdjacentHTML("afterend",`<div style="margin-top: 12px; color: #c0392b; font-size: 15px; font-weight: 600;">
                Книга недоступна для скачивания
            </div>`),y=!0;return}const{element:t,setState:r}=p(async()=>{f||(f=new h(r));const n=pt();n&&f.start(n)});t.style.marginTop="12px",t.addEventListener("abort-download",()=>{f&&(f.cancel(),f.destroy(),f=null)}),e.insertAdjacentElement("afterend",t),y=!0}const mt=[R,X,ot,{match(e){return e.includes("audioknigi.fun")},init(){B(),new MutationObserver(()=>B()).observe(document.body,{childList:!0,subtree:!0})}}];(function(){const t=window.location.href,r=mt.find(n=>n.match(t));r&&r.init()})()})();
