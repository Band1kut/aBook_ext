(function(){"use strict";function m(t){const e=document.createElement("button");e.id="abook-download-btn",e.dataset.state="idle",e.textContent="Скачать книгу";let o="Загрузка...",n=!1;return e.addEventListener("mouseenter",()=>{n=!0,e.dataset.state==="downloading"&&(e.textContent="Прервать")}),e.addEventListener("mouseleave",()=>{n=!1,e.dataset.state==="downloading"&&(e.textContent=o)}),e.addEventListener("click",()=>{if(!e.disabled){if(e.dataset.state==="downloading"){e.dispatchEvent(new CustomEvent("abort-download"));return}t()}}),{element:e,setState(i,r){if(e.dataset.state=i,i==="idle"){e.disabled=!1,e.textContent="Скачать книгу";return}if(i==="downloading"){e.disabled=!1,o=r||"Загрузка...",n||(e.textContent=o);return}if(i==="done"){e.disabled=!0,e.textContent="Готово";return}if(i==="abort"){e.disabled=!1,e.textContent=r||"Ошибка";return}}}}function u(t){const e=document.getElementById("abook-error-modal");if(e&&e.remove(),!document.getElementById("abook-error-modal-style")){const a=document.createElement("style");a.id="abook-error-modal-style",a.textContent=`
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
        `,document.head.appendChild(a)}const o=document.createElement("div");o.id="abook-error-modal";const n=document.createElement("div");n.id="abook-error-box";const i=document.createElement("div");i.id="abook-error-title",i.textContent="Ошибка";const r=document.createElement("div");r.id="abook-error-text",r.innerHTML=t;const s=document.createElement("button");s.id="abook-error-btn",s.textContent="Закрыть",s.onclick=()=>o.remove(),n.appendChild(i),n.appendChild(r),n.appendChild(s),o.appendChild(n),document.body.appendChild(o)}class b{constructor(e){this.state="idle",this.queue=[],this.index=0,this.listenersAttached=!1,this.auxQueue=[],this.auxIndex=0,this.setState=e,this.listenerBound=this.onMessage.bind(this),this.attachListeners()}transition(e){switch(this.state=e,e){case"idle":this.setState("idle","Скачать книгу");break;case"downloading":this.setState("downloading","Загрузка...");break;case"done":this.setState("done","Готово");break;case"cancelled":this.setState("idle","Скачать книгу");break;case"error":this.setState("abort","Ошибка");break}}is(e){return this.state===e}start(e){if(this.is("idle")){if(!e.files||e.files.length===0){this.transition("error"),u(`Не удалось обнаружить аудиофайлы.
Если книга проигрывается на странице, <a href="https://t.me/GetAudioBook_Support" target="_blank">сообщите об ошибке</a>.`);return}if(this.queue=[],this.auxQueue=[],this.index=0,this.auxIndex=0,e.descriptionText){const o=this.createDescriptionFile(e.descriptionText,e.folder);this.auxQueue.push(o)}e.cover&&this.auxQueue.push({url:e.cover.url,filename:`${e.folder}/${e.cover.filename}`});for(const o of e.files)this.queue.push({url:o.url,filename:`${e.folder}/${o.filename}`});if(this.queue.length===0){this.transition("idle");return}this.transition("downloading"),this.downloadNext()}}cancel(){this.is("downloading")&&this.transition("cancelled")}destroy(){this.queue=[],this.auxQueue=[],this.index=0,this.auxIndex=0,this.state="idle",this.setState=()=>{},this.listenersAttached&&(chrome.runtime.onMessage.removeListener(this.listenerBound),this.listenersAttached=!1)}createDescriptionFile(e,o){return{url:`data:text/plain;base64,${btoa(unescape(encodeURIComponent(e)))}`,filename:`${o}/description.txt`}}downloadNext(){if(!this.is("downloading"))return;if(this.index>=this.queue.length){this.downloadAuxNext();return}const e=this.queue[this.index],o=`Загрузка... ${this.index+1}/${this.queue.length}`;this.setState("downloading",o),chrome.runtime.sendMessage({action:"download",url:e.url,filename:e.filename,complete:!0})}downloadAuxNext(){if(!this.is("downloading"))return;if(this.auxIndex>=this.auxQueue.length){this.transition("done");return}const e=this.auxQueue[this.auxIndex];chrome.runtime.sendMessage({action:"download",url:e.url,filename:e.filename,complete:!0})}onMessage(e){if(this.is("downloading")){if(e.action==="file-complete"){if(this.index<this.queue.length){this.index++,this.downloadNext();return}if(this.auxIndex<this.auxQueue.length){this.auxIndex++,this.downloadAuxNext();return}}if(e.action==="file-error"){if(!this.is("downloading"))return;this.transition("error"),u(`Не удалось скачать файл.
Попробуйте снова.`)}}}attachListeners(){this.listenersAttached||(this.listenersAttached=!0,chrome.runtime.onMessage.addListener(this.listenerBound))}}const c=t=>t.replace(/[\/\\:\*\?"<>\|]/g,"").replace(/\s+/g," ").replace(/\.+$/,"").trim(),f=()=>{const t=document.querySelector("h1.short-title");return t?c(t.textContent||"Audiobook"):"Audiobook"},g=()=>{const t=document.querySelector(".ftext.full-text.cleasrfix");return!!(t!=null&&t.innerText.toLowerCase().includes("по требованию правообладателя"))};async function w(){const e=Array.from(document.querySelectorAll("script")).find(a=>{var d;return(d=a.textContent)==null?void 0:d.includes("new Playerjs")});if(!e)return[];const o=e.textContent,n=y(o);if(n)try{const a=JSON.parse(n.replace(/([{,]\s*)(\w+):/g,'$1"$2":'));return h(a)}catch{return k(n)}const i=o.match(/file\s*:\s*["']([^"']+)["']/);if(!i)return[];const r=i[1];if(r.includes("playlist.txt.php"))try{const a=new URL(r,location.origin).href,d=await fetch(a);if(!d.ok)throw new Error("Failed to fetch playlist");const E=await d.json();return h(E)}catch(a){return console.error("Ошибка загрузки playlist.txt.php:",a),[]}const s=c(r.split("/").pop()||"track.mp3");return[{url:r,filename:s}]}function y(t){const e=t.indexOf("file:");if(e===-1)return null;const o=t.indexOf("[",e);if(o===-1)return null;let n=0,i=o;for(;i<t.length&&(t[i]==="["?n++:t[i]==="]"&&n--,i++,n!==0););return t.slice(o,i)}function k(t){const e=[],o=/title\s*:\s*["']([^"']*)["'][^}]*?file\s*:\s*["']([^"']+)["']/g;let n;for(;(n=o.exec(t))!==null;){const i=n[1].trim(),r=n[2].trim();if(!r)continue;const s=r.split("?")[0].split(".").pop()||"mp3",a=c(i||r.split("/").pop()||"track");e.push({url:r,filename:`${a}.${s}`})}return e}function h(t){var o;const e=[];if(Array.isArray(t)&&((o=t[0])!=null&&o.folder)){for(const n of t){const i=c(n.title||"");for(const r of n.folder||[]){if(!r.file)continue;const s=c(r.title||r.file.split("/").pop()||"track"),a=r.file.split("?")[0].split(".").pop()||"mp3";e.push({url:r.file,filename:`${i}_${s}.${a}`})}}return e}if(Array.isArray(t)){for(const n of t){if(!(n!=null&&n.file))continue;const i=n.file,r=i.split("?")[0].split(".").pop()||"mp3",s=c(n.title||i.split("/").pop()||"track");e.push({url:i,filename:`${s}.${r}`})}return e}return e}const C=()=>{const t=document.querySelector(".fimg img");if(!t)return;const e=t.dataset.src||t.src;if(!e)return;const o=new URL(e,location.origin).href,n=c(o.split("?")[0].split(".").pop()||"jpg");return{url:o,filename:`cover.${n}`}},v=()=>{const t=document.querySelector("li:has(.fa-pencil)");return t?Array.from(t.querySelectorAll("a")).map(e=>c(e.textContent||"")).join(", "):""},A=()=>{const t=document.querySelector("li:has(.fa-microphone)");return t?Array.from(t.querySelectorAll("a")).map(e=>c(e.textContent||"")).join(", "):""},S=()=>{const t=document.querySelectorAll(".ftext.full-text");if(t.length<2)return"";const e=t[1];let o="";const n=i=>{var r;if(!["SCRIPT","STYLE","IFRAME","H2"].includes(i.nodeName)){if(i.nodeType===Node.TEXT_NODE){const s=(r=i.textContent)==null?void 0:r.trim();s&&(o+=s+" ")}i.childNodes.forEach(n)}};return n(e),o.replace(/&quot;/g,'"').replace(/\s+/g," ").trim()},$=()=>{const t=f(),e=v(),o=A(),n=S();return`Название: ${t}
Автор: ${e}
Читает: ${o}

Описание:
${n}

URL: ${location.href}
`};let l=null,p=!1;function x(){if(p)return;if(p=!0,g()){console.log("Книга заблокирована правообладателем — кнопка не добавляется");return}const t=document.querySelector("div.fleft");if(!t)return;const{element:e,setState:o}=m(async()=>{l||(l=new b(o));const n=f(),i=await w(),r=C(),s=$(),a={folder:n,cover:r,descriptionText:s,files:i};l.start(a)});e.addEventListener("abort-download",()=>{l==null||l.cancel(),l==null||l.destroy(),l=null}),t.appendChild(e)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",x):x()})();
