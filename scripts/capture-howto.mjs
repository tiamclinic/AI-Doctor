/**
 * How to Use ページ用スクリーンショット取得スクリプト
 * 実行: node scripts/capture-howto.mjs
 */
import { chromium } from "/Users/gotoushuuhei/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(__dirname, "../public/images/howto");

/** iPad Air (10.9") 横置きを想定した院内端末サイズ */
const VIEWPORT = { width: 1180, height: 820 };

const CAPTURES = [
  {
    name: "01-top",
    url: "/",
    label: "トップ画面",
    description: "来院者向けランディング。「診断をはじめる」から診断フローへ進む。",
    selector: null,
    scrollY: 0,
  },
  {
    name: "02-staff-login",
    url: "/staff",
    label: "スタッフログイン画面",
    description: "/staff にアクセスするとログインフォームが表示される。",
    selector: null,
    scrollY: 0,
  },
  {
    name: "03-how-to-use-top",
    url: "/staff/how-to-use",
    label: "運用フロー説明書（上部）",
    description: "ページ冒頭。目次と概要が一覧できる。",
    selector: null,
    scrollY: 0,
    waitMs: 800,
  },
  {
    name: "04-how-to-use-flow",
    url: "/staff/how-to-use#flow",
    label: "全体フロー",
    description: "§1 全体フロー。10 ステップをロール別タグで表示。",
    selector: "#flow",
    scrollY: null,
    waitMs: 800,
  },
  {
    name: "05-how-to-use-photo",
    url: "/staff/how-to-use#photo",
    label: "写真撮影のコツ",
    description: "§6 推奨／NG 条件を 2 カラムで比較。",
    selector: "#photo",
    scrollY: null,
    waitMs: 500,
  },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
    locale: "ja-JP",
  });

  const results = [];

  for (const cap of CAPTURES) {
    const page = await context.newPage();
    console.log(`→ Capturing: ${cap.name} (${BASE_URL}${cap.url})`);

    await page.goto(`${BASE_URL}${cap.url}`, { waitUntil: "load" });

    if (cap.waitMs) {
      await page.waitForTimeout(cap.waitMs);
    }

    const outPath = path.join(OUT_DIR, `${cap.name}.png`);

    if (cap.selector) {
      // セクション要素までスクロールしてビューポート全体を撮影
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
      }, cap.selector);
      await page.waitForTimeout(300);
      await page.screenshot({ path: outPath, fullPage: false });
    } else if (cap.scrollY != null && cap.scrollY > 0) {
      await page.evaluate((y) => window.scrollTo(0, y), cap.scrollY);
      await page.waitForTimeout(200);
      await page.screenshot({ path: outPath, fullPage: false });
    } else {
      await page.screenshot({ path: outPath, fullPage: false });
    }

    results.push({ ...cap, file: `/images/howto/${cap.name}.png` });
    console.log(`   ✓ Saved: ${outPath}`);
    await page.close();
  }

  await browser.close();

  console.log("\n=== 完了 ===");
  console.log("保存されたファイル:");
  results.forEach((r) => console.log(`  ${r.file}  (${r.label})`));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
