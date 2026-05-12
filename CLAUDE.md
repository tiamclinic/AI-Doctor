# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js Version

This project runs **Next.js 16** (not 14/15). APIs, conventions, and file structure may differ from training data. Before writing any Next.js code, check `node_modules/next/dist/docs/` for the relevant guide and heed deprecation notices.

## Commands

```bash
# Development
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm start         # Run production server
npm run lint      # ESLint (flat config)
```

No test framework is configured yet.

## Architecture

### App Router structure (planned)

```
app/
  page.tsx                      Landing page
  diagnose/page.tsx             Photo upload & face analysis screen
  result/[id]/page.tsx          Results display
  api/
    diagnose/route.ts           POST — OpenAI gpt-4o-mini diagnosis text (JSON mode)
    generate-portrait/route.ts  POST — OpenAI gpt-image-1 ideal face generation
    share-card/route.tsx        GET  — Satori PNG share card (1080×1920)
components/
  PhotoUploader.tsx
  FaceLandmarkOverlay.tsx
  ScoreRadar.tsx
  ResultCard.tsx
lib/
  faceAnalysis/
    landmarker.ts               MediaPipe Face Landmarker initialization
    goldenRatio.ts              TIAM 6-metric calculations from 478 landmarks
    scoring.ts                  0–100 normalization & weighted TIAM Balance Index
  prompt/
    diagnosisPrompt.ts          System prompt with few-shot examples
public/
  models/                       MediaPipe WASM model files
```

### Data flow

1. Client uploads photo → MediaPipe WASM runs entirely in-browser → 478 landmark points
2. `lib/faceAnalysis/goldenRatio.ts` computes 6 metrics → `scoring.ts` produces `totalScore` + per-metric scores
3. `POST /api/diagnose` sends scores (NOT the photo) to gpt-4o-mini → structured diagnosis JSON
4. `POST /api/generate-portrait` sends photo (base64) + scores to gpt-image-1 → ideal face PNG
5. `GET /api/share-card` renders result via Satori → 1080×1920 PNG for SNS

**Privacy invariant:** The photo never leaves the browser except for step 4, which requires explicit user consent (checkbox before triggering).

### TIAM 6 Metrics (F-03)

| Metric | Ideal |
|--------|-------|
| 縦三分割バランス | 1:1:1 |
| 横五分割バランス | 1.0 |
| 目間バランス | 1.0 |
| 鼻口比率 | 1:1.618 |
| E ライン整合度 | on-line |
| 顔輪郭比率 | 1:1.46 |

Output type: `{ totalScore: number; scores: Record<string, number> }` — values to 1 decimal place.

### API response schema (F-04)

```ts
{
  overallComment: string   // 100–150 chars
  strengths: string[]      // 3 items
  improvements: string[]   // 2 items
  recommendedCare: string[] // 3 items
  tiamMessage: string      // 50 chars
}
```

System prompt persona: "TIAM ビューティーラボ顧問アナリスト". JSON mode required. Forbidden phrases: 「いかがでしょうか」「〜と言えるでしょう」「素晴らしい」and other GPT-typical softeners. Medical terms (「治療」「改善されます」) must be rewritten as beauty-balance tendency language.

## Tech Stack

- **Next.js 16** + **React 19** (App Router, React Server Components)
- **TypeScript 5** strict mode; path alias `@/*` → project root
- **Tailwind CSS v4** via PostCSS plugin (no `tailwind.config.js` — config lives in CSS)
- **ESLint 9** flat config

Libraries to add as features are built:
- `@mediapipe/tasks-vision` — Face Landmarker (WASM, runs client-side)
- `openai` — API calls (server-side only)
- `satori` + `@vercel/og` — share card image generation
- `shadcn/ui` — UI component primitives

## Environment Variables

| Key | Purpose | Exposed to client |
|-----|---------|-------------------|
| `OPENAI_API_KEY` | OpenAI auth | No — server only |
| `OPENAI_ORG_ID` | OpenAI org | No — server only |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes |

**OpenAI keys must never appear in client bundles.**

## Brand & Design

- **Colors:** Black `#0B0B0B` (primary), Champagne Gold `#C9A96E` (accent), White `#FAFAFA` (bg), Rose Gold `#D9A6A6` (accent2)
- **Fonts:** Noto Serif JP / Cormorant Garamond (headings), Noto Sans JP / Inter (body)
- **Tone:** Premium salon aesthetic — quiet, precise, high-end

## Legal Constraints

- **薬機法:** No 「治る」「治療」「医療効果」expressions
- **景表法:** No unsupported superlatives (「最も」「No.1」)
- All facial analysis marketing must present results as "beauty balance tendency", not medical diagnosis
