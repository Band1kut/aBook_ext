(function(){"use strict";function p(o){const e=document.createElement("button");e.id="abook-download-btn",e.dataset.state="idle",e.textContent="Скачать книгу";let n="Загрузка...",t=!1;return e.addEventListener("mouseenter",()=>{t=!0,e.dataset.state==="downloading"&&(e.textContent="Прервать")}),e.addEventListener("mouseleave",()=>{t=!1,e.dataset.state==="downloading"&&(e.textContent=n)}),e.addEventListener("click",()=>{if(!e.disabled){if(e.dataset.state==="downloading"){e.dispatchEvent(new CustomEvent("abort-download"));return}o()}}),{element:e,setState(r,i){if(e.dataset.state=r,r==="idle"){e.disabled=!1,e.textContent="Скачать книгу";return}if(r==="downloading"){e.disabled=!1,n=i||"Загрузка...",t||(e.textContent=n);return}if(r==="done"){e.disabled=!0,e.textContent="Готово";return}if(r==="abort"){e.disabled=!1,e.textContent=i||"Ошибка";return}}}}function d(o){const e=document.getElementById("abook-error-modal");if(e&&e.remove(),!document.getElementById("abook-error-modal-style")){const a=document.createElement("style");a.id="abook-error-modal-style",a.textContent=`
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
        `,document.head.appendChild(a)}const n=document.createElement("div");n.id="abook-error-modal";const t=document.createElement("div");t.id="abook-error-box";const r=document.createElement("div");r.id="abook-error-title",r.textContent="Ошибка";const i=document.createElement("div");i.id="abook-error-text",i.innerHTML=o;const s=document.createElement("button");s.id="abook-error-btn",s.textContent="Закрыть",s.onclick=()=>n.remove(),t.appendChild(r),t.appendChild(i),t.appendChild(s),n.appendChild(t),document.body.appendChild(n)}class x{constructor(e){this.state="idle",this.queue=[],this.index=0,this.listenersAttached=!1,this.auxQueue=[],this.auxIndex=0,this.setState=e,this.listenerBound=this.onMessage.bind(this),this.attachListeners()}transition(e){switch(this.state=e,e){case"idle":this.setState("idle","Скачать книгу");break;case"downloading":this.setState("downloading","Загрузка...");break;case"done":this.setState("done","Готово");break;case"cancelled":this.setState("idle","Скачать книгу");break;case"error":this.setState("abort","Ошибка");break}}is(e){return this.state===e}start(e){if(this.is("idle")){if(!e.files||e.files.length===0){this.transition("error"),d(`Не удалось обнаружить аудиофайлы.
Если книга проигрывается на странице, <a href="https://t.me/GetAudioBook_Support" target="_blank">сообщите об ошибке</a>.`);return}if(this.queue=[],this.auxQueue=[],this.index=0,this.auxIndex=0,e.descriptionText){const n=this.createDescriptionFile(e.descriptionText,e.folder);this.auxQueue.push(n)}e.cover&&this.auxQueue.push({url:e.cover.url,filename:`${e.folder}/${e.cover.filename}`});for(const n of e.files)this.queue.push({url:n.url,filename:`${e.folder}/${n.filename}`});if(this.queue.length===0){this.transition("idle");return}this.transition("downloading"),this.downloadNext()}}cancel(){this.is("downloading")&&this.transition("cancelled")}destroy(){this.queue=[],this.auxQueue=[],this.index=0,this.auxIndex=0,this.state="idle",this.setState=()=>{},this.listenersAttached&&(chrome.runtime.onMessage.removeListener(this.listenerBound),this.listenersAttached=!1)}createDescriptionFile(e,n){return{url:`data:text/plain;base64,${btoa(unescape(encodeURIComponent(e)))}`,filename:`${n}/description.txt`}}downloadNext(){if(!this.is("downloading"))return;if(this.index>=this.queue.length){this.downloadAuxNext();return}const e=this.queue[this.index],n=`Загрузка... ${this.index+1}/${this.queue.length}`;this.setState("downloading",n),chrome.runtime.sendMessage({action:"download",url:e.url,filename:e.filename,complete:!0})}downloadAuxNext(){if(!this.is("downloading"))return;if(this.auxIndex>=this.auxQueue.length){this.transition("done");return}const e=this.auxQueue[this.auxIndex];chrome.runtime.sendMessage({action:"download",url:e.url,filename:e.filename,complete:!0})}onMessage(e){if(this.is("downloading")){if(e.action==="file-complete"){if(this.index<this.queue.length){this.index++,this.downloadNext();return}if(this.auxIndex<this.auxQueue.length){this.auxIndex++,this.downloadAuxNext();return}}if(e.action==="file-error"){if(!this.is("downloading"))return;this.transition("error"),d(`Не удалось скачать файл.
Попробуйте снова.`)}}}attachListeners(){this.listenersAttached||(this.listenersAttached=!0,chrome.runtime.onMessage.addListener(this.listenerBound))}}function l(o){return o.replace(/[\/\\:\*\?"<>\|]/g,"").replace(/\s+/g," ").replace(/\.+$/,"").trim()}function f(){const o=document.querySelector("h1.short-title");return o?l(o.textContent||"Audiobook"):"Audiobook"}function b(){const o=document.querySelector(".ftext.full-text.cleasrfix");return o?o.innerText.toLowerCase().includes("по требованию правообладателя"):!1}async function g(){const e=Array.from(document.querySelectorAll("script")).find(i=>{var s;return(s=i.textContent)==null?void 0:s.includes("new Playerjs")});if(!e)return[];const n=e.textContent,t=y(n);if(!t){const i=n.match(/file\s*:\s*["']([^"']+)["']/);if(!i)return[];const s=i[1];if(s.includes("playlist.txt.php"))try{const a=new URL(s,location.origin).href,q=await(await fetch(a)).json();return h(q)}catch(a){return console.error("Ошибка загрузки playlist.txt.php:",a),[]}return[{url:s,filename:l(s.split("/").pop()||"track.mp3")}]}const r=w(t);if(r.length>0)return r;try{const i=Function("return "+t)();return h(i)}catch(i){return console.error("Ошибка парсинга JS-плейлиста:",i,t),[]}}function h(o){var n;const e=[];if(Array.isArray(o)&&((n=o[0])!=null&&n.folder)){for(const t of o){const r=l(t.title||"");for(const i of t.folder){if(!i.file)continue;const s=l(i.title||i.file.split("/").pop()||"track"),a=i.file.split("?")[0].split(".").pop()||"mp3";e.push({url:i.file,filename:`${r}_${s}.${a}`})}}return e}if(Array.isArray(o)){for(const t of o){if(!t||!t.file)continue;const r=t.file,i=r.split("?")[0].split(".").pop()||"mp3",s=l(t.title||r.split("/").pop()||"track");e.push({url:r,filename:`${s}.${i}`})}return e}return e}function y(o){const e=o.indexOf("file:");if(e===-1)return null;let n=o.indexOf("[",e);if(n===-1)return null;let t=0,r=n;for(;r<o.length&&(o[r]==="["?t++:o[r]==="]"&&t--,r++,t!==0););return o.slice(n,r)}function w(o){const e=[],n=/title\s*:\s*["']([^"']*)["'][^}]*?file\s*:\s*["']([^"']+)["']/g;let t;for(;(t=n.exec(o))!==null;){const r=t[1].trim(),i=t[2].trim();if(!i)continue;const s=i.split("?")[0].split(".").pop()||"mp3",a=l(r||i.split("/").pop()||"track");e.push({url:i,filename:`${a}.${s}`})}return e}function k(){const o=document.querySelector(".fimg img");if(!o)return;const e=o.dataset.src||o.src;if(!e)return;const n=new URL(e,location.origin).href,t=l(n.split("?")[0].split(".").pop()||"jpg");return{url:n,filename:`cover.${t}`}}function A(){const e=Array.from(document.querySelectorAll("li")).find(t=>t.querySelector(".fa-pencil"));return e?Array.from(e.querySelectorAll("a")).map(t=>l(t.textContent||"")).join(", "):""}function v(){const e=Array.from(document.querySelectorAll("li")).find(t=>t.querySelector(".fa-microphone"));return e?Array.from(e.querySelectorAll("a")).map(t=>l(t.textContent||"")).join(", "):""}function C(){const o=document.querySelectorAll(".ftext.full-text");if(o.length<2)return"";const e=o[1];let n="";function t(r){var i;if(!(r.nodeName==="SCRIPT"||r.nodeName==="STYLE"||r.nodeName==="IFRAME"||r.nodeName==="H2")){if(r.nodeType===Node.TEXT_NODE){const s=(i=r.textContent)==null?void 0:i.trim();s&&(n+=s+" ")}r.childNodes.forEach(t)}}return t(e),n=n.replace(/&quot;/g,'"').replace(/\s+/g," ").trim(),n}function S(){const o=f(),e=A(),n=v(),t=C(),r=location.href;return`Название: ${o}
Автор: ${e}
Читает: ${n}

Описание:
${t}

URL: ${r}
`}let c=null,u=!1;function m(){if(u)return;if(b()){console.log("Книга недоступна — кнопка не показывается"),u=!0;return}const o=document.querySelector("div.fleft");if(!o)return;const{element:e,setState:n}=p(async()=>{c||(c=new x(n));const t=f(),r=await g(),i=k(),s=S(),a={folder:t,cover:i,descriptionText:s,files:r};c.start(a)});e.addEventListener("abort-download",()=>{c&&(c.cancel(),c.destroy(),c=null)}),o.appendChild(e),u=!0}m(),new MutationObserver(m).observe(document.body,{childList:!0,subtree:!0})})();
