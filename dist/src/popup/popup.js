(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function i(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(e){if(e.ep)return;e.ep=!0;const t=i(e);fetch(e.href,t)}})();const c=["audiokniga-online.ru","audiokniga.one","audioknigi.fun","audioknigi.pro","book-zvuk.ru","bookish.site","izib.uk","knigi-audio.com","knigimp3.com","knigavuhe.org","knizhin.net","lis10book.com","slovushko.com","slushkin.online","uknig.com","vseaudioknigi.com"],u=document.getElementById("bookInput"),l=document.getElementById("searchBtn"),d=document.getElementById("supportedSitesLink");l.addEventListener("click",()=>{const n=u.value.trim();if(!n)return;const o="https://ya.ru/search/?text="+encodeURIComponent(`${n} ${c.map(i=>`site:${i}`).join(" | ")}`);chrome.tabs.create({url:o})});d.addEventListener("click",()=>{const o=`
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Поддерживаемые сайты</title>
      </head>
      <body>
        <h2>Поддерживаемые сайты</h2>
        <ul>${c.map(e=>`<li>${e}</li>`).join("")}</ul>
      </body>
    </html>
  `,i=new Blob([o],{type:"text/html"}),r=URL.createObjectURL(i);chrome.tabs.create({url:r})});
