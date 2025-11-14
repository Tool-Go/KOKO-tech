#!/usr/bin/env node
/* Brand swapper (no deps). Usage:
   node scripts/brand-swap.js --config brand.ttech.json [--dry-run]
*/
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const getArg = (k, d=null) => {
  const i = args.findIndex(a => a===k || a.startsWith(k+"="));
  if (i === -1) return d;
  const v = args[i].includes("=") ? args[i].split("=")[1] : args[i+1];
  return v ?? d;
};
const dryRun = args.includes("--dry-run");
const cfgPath = getArg("--config", "brand.ttech.json");

if (!fs.existsSync(cfgPath)) {
  console.error(`Config file not found: ${cfgPath}`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath,"utf8"));

const ROOT = process.cwd();
const PUB  = path.join(ROOT, "public");
if (!fs.existsSync(PUB)) {
  console.error("Cannot find ./public directory. Run from repo root.");
  process.exit(1);
}

const exts = new Set([".html",".htm",".xml",".txt",".webmanifest",".json"]);
const files = [];
(function walk(dir){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.has(path.extname(e.name).toLowerCase())) files.push(p);
  }
})(PUB);

// ---- helpers ----
const esc = s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
function replaceAll(str, find, repl){
  return str.replace(new RegExp(find,"g"), repl);
}
function upsertTag(head, pattern, markup){
  if (pattern.test(head)) {
    return head.replace(pattern, markup);
  }
  // insert before </head>
  return head.replace(/<\/head>/i, `${markup}\n</head>`);
}
function swapContent(text){
  let out = text;
  const { from, to, extras } = cfg;

  // 1) Nom de la société (brut)
  out = out.replace(new RegExp(esc(from.name), "g"), to.name);

  // 2) Logo(s)
  if (Array.isArray(from.logoPaths)) {
    from.logoPaths.forEach(p=>{
      out = out.replace(new RegExp(esc(p), "g"), to.logo);
    });
  }

  // 3) Domaine (urls, emails simples)
  if (from.domain && to.domain) {
    out = out.replace(new RegExp(esc(from.domain), "g"), to.domain);
  }

  // 4) <title> (préfixe OG si présent)
  if (from.ogTitlePrefix && to.ogTitlePrefix) {
    out = out.replace(new RegExp(esc(from.ogTitlePrefix), "g"), to.ogTitlePrefix);
  }
  // safe fallback: si titre contient l'ancien nom, il a déjà été remplacé par #1

  // 5) Canonical & OG metas
  if (extras.updateCanonical && to.canonical) {
    out = out.replace(
      /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i,
      `<link rel="canonical" href="${to.canonical}">`
    );
    if (!/<link\s+rel=["']canonical["']/.test(out)) {
      out = out.replace(/<\/head>/i, `  <link rel="canonical" href="${to.canonical}">\n</head>`);
    }
  }
  if (extras.updateOg && to.canonical) {
    out = out.replace(
      /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta property="og:url" content="${to.canonical}">`
    );
    if (/property=["']og:title["']/.test(out) && to.ogTitlePrefix) {
      out = out.replace(
        /(<meta\s+property=["']og:title["']\s+content=["'])([^"']*)(["'][^>]*>)/i,
        (_,a,b,c)=> `${a}${to.ogTitlePrefix} Enterprise-grade IT${c}`
      );
    }
  }

  // 6) JSON-LD LocalBusiness (name/url/image)
  if (extras.updateJsonLd) {
    out = out.replace(/("name"\s*:\s*")[^"]*(")/g, `$1${to.name}$2`);
    if (to.canonical) out = out.replace(/("url"\s*:\s*")[^"]*(")/g, `$1${to.canonical}$2`);
    if (to.logo)     out = out.replace(/("image"\s*:\s*")[^"]*(")/g, `$1${to.logo}$2`);
  }

  // 7) Alt du logo (optionnel)
  if (extras.updateFaviconAlt && to.name) {
    out = out.replace(/(alt\s*=\s*")[^"]*logo([^"]*)(")/gi, `$1${to.name} logo$2$3`);
  }

  return out;
}

// ---- run ----
let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(f,"utf8");
  const dst = swapContent(src);
  if (dst !== src) {
    changed++;
    if (!dryRun) fs.writeFileSync(f, dst, "utf8");
    console.log(`${dryRun ? "[DRY]" : "[OK ]"} ${path.relative(ROOT,f)}`);
  }
}
console.log(`\n${dryRun ? "Would update" : "Updated"} ${changed} file(s).`);
