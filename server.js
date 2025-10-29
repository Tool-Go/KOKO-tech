/* TTECH web — static server for Render/Node
   - Serves /public as root
   - Lets assets through (no SPA catch-all on /assets)
   - Friendly caching: HTML no-cache, assets 7d
*/
const express = require("express");
const path = require("path");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression());

// 1) Static first (very important)
app.use(
  express.static(path.join(__dirname, "public"), {
    extensions: ["html"],         // /contact -> /contact.html
    etag: true,
    maxAge: "7d",
    setHeaders: (res, filePath) => {
      if (/\.(html)$/.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// 2) Health checks
app.get(["/healthz", "/ping"], (req, res) => res.json({ ok: true }));

// 3) Optional: SPA fallback ONLY for HTML navigations, NOT for assets
app.get("*", (req, res, next) => {
  const accept = req.headers.accept || "";
  // if request looks like an asset or API, do not hijack it
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
  return res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.listen(PORT, () => {
  console.log(`✅ TTECH site listening on :${PORT}`);
});
