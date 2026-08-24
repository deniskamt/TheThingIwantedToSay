const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// Значения по умолчанию — переопределяются в Railway → Variables.
const DEFAULTS = {
  QUESTION: "Варя, признай: я самый лучший?",
  ANSWER: "я так рад что ты это признала",
  YES_LABEL: "Да",
  NO_LABEL: "Нет",
  PAGE_TITLE: "Один вопрос",
};

const TEMPLATE = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");

function env(key) {
  const v = process.env[key];
  return v === undefined || v === "" ? DEFAULTS[key] : v;
}

// Безопасная вставка в HTML-текст (заголовок вкладки).
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Безопасная вставка JSON внутрь <script>.
function jsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function render() {
  const config = {
    question: env("QUESTION"),
    answer: env("ANSWER"),
    yesLabel: env("YES_LABEL"),
    noLabel: env("NO_LABEL"),
  };
  return TEMPLATE
    .replace("/*__APP_CONFIG__*/{}", jsonForScript(config))
    .replace("/*__PAGE_TITLE__*/", escapeHtml(env("PAGE_TITLE")));
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];

  if (url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("ok");
  }

  if (url === "/" || url === "/index.html") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      // страница собирается из env на каждый запрос — не кэшируем
      "Cache-Control": "no-store",
    });
    return res.end(render());
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`listening on ${PORT}`);
});
