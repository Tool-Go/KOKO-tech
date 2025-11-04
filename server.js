// server.js — TTECH site (Express + static + vidéo MP4 correcte)
// Minimal, production-ready. Aucun paquet en plus que `express` et `compression`.

const express = require("express");
const path = require("path");
const compression = require("compression");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

// --- Compression (éviter de compresser les vidéos) --------------------------
app.use(
  compression({
    filter: (req, res) => {
      // Ne pas compresser les gros médias
      if (/\.(mp4|webm|ogg)$/i.test(req.url)) return false;
      return compression.filter(req, res);
    },
  })
);

// --- Static: /assets D'ABORD (images/vidéos), puis tout /public -------------
const ASSETS_DIR = path.join(__dirname, "public", "assets");
const PUBLIC_DIR = path.join(__dirname, "public");

// /assets => longue mise en cache + en-têtes vidéo corrects
app.use(
  "/assets",
  express.static(ASSETS_DIR, {
    etag: true,
    maxAge: "30d",
    setHeaders: (res, filePath) => {
      // Types vidéo explicites + lecture par plages pour <video>
      if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      }
    },
  })
);

// /public => HTML/CSS/JS/… (cache plus court)
app.use(
  express.static(PUBLIC_DIR, {
    etag: true,
    maxAge: "7d",
  })
);

// --- Routes de confort -------------------------------------------------------
app.get("/healthz", (_req, res) => res.status(200).send("ok"));
app.get("/ping", (_req, res) => res.json({ ok: true }));

// Racine => index.html
app.get("/", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// --- 404 (à la toute fin) ----------------------------------------------------
app.use((req, res) => {
  const notFound = path.join(PUBLIC_DIR, "404.html");
  if (fs.existsSync(notFound)) {
    res.status(404).sendFile(notFound);
  } else {
    res.status(404).send("404 Not Found");
  }
});

// --- Lancement ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ TTECH site listening on :${PORT}`);
});
