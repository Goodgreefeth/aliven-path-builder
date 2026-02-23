import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs"; // Puppeteer requires Node runtime

type Week = {
  week: number;
  practices: string;
  prompt: string;
};

type Body = {
  html?: string;

  title?: string;
  pathId?: string;
  pathName?: string;
  createdAt?: string;
  weeks?: Week[];

  filename?: string;
};

/* ---------------- helpers ---------------- */

function escapeHtml(input: string = "") {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * ✅ Do NOT store giant base64 strings in this route file.
 * Put the logo at: /public/aliven-logo.png
 */
async function getLogoDataUri(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "aliven-logo.png");
    const buf = await readFile(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/* ---------------- HTML builder ---------------- */

async function buildHtmlFromPayload(body: Body) {
  const title = body.title || "Aliven Personalized Path";
  const pathName = body.pathName || body.pathId || "Selected Path";
  const createdAt = body.createdAt
    ? new Date(body.createdAt).toLocaleString()
    : new Date().toLocaleString();

  const weeks = Array.isArray(body.weeks) ? body.weeks : [];
  const logo = await getLogoDataUri();

  const weeksHtml =
    weeks.length > 0
      ? weeks
          .map(
            (w) => `
<section class="week">
  <div class="week-badge">Week ${w.week}</div>

  <div class="block">
    <div class="label">Practices</div>
    <div class="value">${escapeHtml(w.practices)}</div>
  </div>

  <div class="block">
    <div class="label">Journal prompt</div>
    <div class="prompt">${escapeHtml(w.prompt)}</div>
  </div>
</section>`
          )
          .join("")
      : `<p class="muted">No rhythm data provided.</p>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>

<style>
@page { size: A4; margin: 16mm; }

* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  background: #efe9e1;
  margin: 0;
  color: #111;
}

.page { padding: 28px; }

.card {
  max-width: 760px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 22px;
  padding: 28px;
  border: 1px solid #e2ddd6;
  box-shadow: 0 10px 28px rgba(0,0,0,.06);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.brand {
  font-size: 11px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #4b4b4b;
}

.logo {
  height: 34px;
}

h1 {
  margin: 0 0 6px;
  font-size: 22px;
}

.meta {
  font-size: 12px;
  color: #4b4b4b;
  margin-bottom: 18px;
}

.week {
  margin-top: 14px;
  border: 1px solid #e2ddd6;
  border-radius: 18px;
  padding: 14px;
}

.week-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
  background: #a4756f1a;
  border: 1px solid #a4756f33;
  display: inline-block;
  margin-bottom: 10px;
}

.label {
  font-size: 11px;
  color: #4b4b4b;
  margin-bottom: 4px;
}

.value {
  font-size: 13px;
  font-weight: 700;
}

.prompt {
  font-size: 13px;
  font-style: italic;
  white-space: pre-wrap;
}

.footer {
  margin-top: 20px;
  font-size: 10px;
  color: #777;
  display: flex;
  justify-content: space-between;
}

.footer .mark {
  color: #a4756f;
  font-weight: 700;
  letter-spacing: .08em;
}
</style>
</head>

<body>
<div class="page">
  <div class="card">
    <div class="header">
      <div class="brand">Aliven Method</div>
      ${logo ? `<img src="${logo}" class="logo" alt="Aliven" />` : ""}
    </div>

    <h1>${escapeHtml(title)}</h1>
    <div class="meta">
      Path: <strong>${escapeHtml(pathName)}</strong> ·
      Exported: <strong>${escapeHtml(createdAt)}</strong>
    </div>

    ${weeksHtml}

    <div class="footer">
      <div class="mark">aliven</div>
      <div>Consistency beats intensity</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

/* ---------------- Puppeteer launcher ---------------- */

async function getBrowser() {
  console.log("PDF export env:", {
    VERCEL: process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
  });
  // In production (Vercel) use Sparticuz Chromium.
  if (isProd) {
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  // Local dev: try to use a locally installed Chrome (more reliable on Mac).
  // If this path doesn't exist on your machine, it will fall back to Puppeteer defaults.
  const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  return puppeteer.launch({
    headless: true,
    executablePath: macChrome,
  });
}

/* ---------------- API handler ---------------- */

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const html = body.html ?? (await buildHtmlFromPayload(body));
  const finalHtml = html.replaceAll(
    "Aliven Rhythm Preview",
    "Aliven Personalized Path"
  );

  const filename =
    (body.filename || body.pathName || "aliven-rhythm-preview")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replaceAll(" ", "-")
      .slice(0, 80) + ".pdf";

  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "16mm", bottom: "16mm", left: "16mm" },
    });

    return new NextResponse(pdf as unknown as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    await browser.close();
  }
}