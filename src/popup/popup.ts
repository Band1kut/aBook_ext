const supportedSites = [
    "audiokniga-online.ru",
    "audiokniga.one",
    "audioknigi.fun",
    "audioknigi.pro",
    "book-zvuk.ru",
    "bookish.site",
    "izib.uk",
    "knigi-audio.com",
    "knigimp3.com",
    "knigavuhe.org",
    "knizhin.net",
    "lis10book.com",
    "slovushko.com",
    "slushkin.online",
    "uknig.com",
    "vseaudioknigi.com"
];

const input = document.getElementById("bookInput") as HTMLInputElement;
const btn = document.getElementById("searchBtn") as HTMLButtonElement;
const link = document.getElementById("supportedSitesLink") as HTMLAnchorElement;

btn.addEventListener("click", () => {
    const query = input.value.trim();
    if (!query) return;

    const url =
        "https://ya.ru/search/?text=" +
        encodeURIComponent(`${query} ${supportedSites.map(s => `site:${s}`).join(" | ")}`);

    chrome.tabs.create({ url });
});

link.addEventListener("click", () => {
    const html = supportedSites.map(s => `<li>${s}</li>`).join("");

    const page = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Поддерживаемые сайты</title>
      </head>
      <body>
        <h2>Поддерживаемые сайты</h2>
        <ul>${html}</ul>
      </body>
    </html>
  `;

    const blob = new Blob([page], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    chrome.tabs.create({ url });
});
