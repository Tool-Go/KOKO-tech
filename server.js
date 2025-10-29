/* TTECH web — static server for Render/Node
   - Serves /public as root
   - Safe 'compression' require (no crash if missing)
   - SPA-like fallback that doesn't hijack assets
*/
const express = require("express");
const path = require("path");

let compression = null;
try { compression = require("compression"); } catch (_) { /* optional */ }

const app = express();
const PORT = process.env.PORT || 3000;

// Optional gzip
if (compression) app.use(compression());

// 1) Static FIRST (critical)
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],   // /contact -> /contact.html
  etag: true,
  maxAge: "7d",
  setHeaders: (res, filePath) => {
    if (/\.(html)$/i.test(filePath)) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

// 2) Health checks
app.get(["/healthz", "/ping"], (_, res) => res.json({ ok: true }));

// 3) Fallback only for HTML navigations (do not catch assets)
app.get("*", (req, res, next) => {
  const accept = req.headers.accept || "";
  if (
    req.path.startsWith("/assets/") ||
    req.path.startsWith("/api/") ||
    /\.(js|css|png|jpg|jpeg|webp|svg|ico|txt|xml|map)$/i.test(req.path)
  ) {
    return next();
  }
  if (accept.includes("text/html")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  return res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`✅ TTECH site listening on :${PORT}`);
});
