// TTECH site server — Express + security headers + form handler (patched)
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
      "style-src": ["'self'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://www.google-analytics.com"],
      "frame-ancestors": ["'none'"]
    }
  },
  referrerPolicy: { policy: "no-referrer-when-downgrade" },
  crossOriginEmbedderPolicy: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (/\.(css|js|png|jpg|jpeg|webp|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

const limiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
app.use('/forms/', limiter);

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.post('/forms/quote', async (req, res) => {
  try {
    const { name, email, phone, company, size, service, message } = req.body;
    const ts = new Date().toISOString();
    const dataDir = path.join(__dirname, 'data'); if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    const csvPath = path.join(dataDir, 'leads.csv');
    const header = "timestamp,name,email,phone,company,size,service,message\n";
    if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, header);
    const row = [ts, name, email, phone, company, size, service, (message || '').replace(/\n|\r/g,' ')].map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',') + "\n";
    fs.appendFileSync(csvPath, row);

    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_TO) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: String(SMTP_SECURE || 'false') === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });
      await transporter.sendMail({
        from: MAIL_FROM || SMTP_USER,
        to: MAIL_TO,
        subject: `New quote request from ${name || 'unknown'}`,
        text: `New lead:\n${JSON.stringify({ ts, name, email, phone, company, size, service, message }, null, 2)}`
      });
    }

    return res.redirect('/thanks.html');
  } catch (err) {
    console.error('Form error:', err);
    return res.status(500).send('Something went wrong.');
  }
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

app.listen(PORT, () => console.log(`✅ TTECH site (patched) running on :${PORT}`));