import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileText,
  HelpCircle,
  ImageIcon,
  Lightbulb,
  LogIn,
  LogOut,
  MessageSquareText,
  MonitorCheck,
  PenLine,
  Settings2,
  ShieldCheck,
  Share2,
  Sparkles,
  TimerReset,
  Stethoscope,
  UserCheck,
  Wand2,
} from "lucide-react";

import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "運用フロー説明書（How to Use） | TIAM Beauty AI",
  description:
    "TIAM Beauty AI を院内で運用するスタッフ向けの操作・運用ガイド。",
  robots: { index: false, follow: false },
};

const tableOfContents: Array<{ id: string; label: string }> = [
  { id: "overview", label: "0. はじめに" },
  { id: "flow", label: "1. 全体フロー（要約）" },
  { id: "prepare", label: "2. 事前準備" },
  { id: "login", label: "3. スタッフログイン" },
  { id: "consent", label: "4. 来院者への同意取得" },
  { id: "diagnose", label: "5. 新規診断を開始する" },
  { id: "photo", label: "6. 写真撮影のコツ" },
  { id: "analysis", label: "7. 顔解析〜スコア算出" },
  { id: "ai-text", label: "8. AI 診断レポートの生成" },
  { id: "result", label: "9. 結果画面の見方" },
  { id: "doctor-note", label: "10. ドクター所見を追記する" },
  { id: "doctor-content", label: "11. 診断一覧・個別所見の編集" },
  { id: "share", label: "12. 来院者への共有" },
  { id: "ideal", label: "13. AI 理想顔ジェネレーター（任意）" },
  { id: "logout", label: "14. ログアウト・セッション管理" },
  { id: "troubleshoot", label: "15. トラブルシューティング" },
  { id: "compliance", label: "16. 法令・コンプライアンスの注意" },
  { id: "faq", label: "17. よくある質問" },
];

const roleGuides = [
  {
    role: "受付・カウンセラー",
    sections: "§3〜§9・§12・§14・§15",
    note: "ログイン、撮影、結果共有、トラブル時の案内を中心に確認します。",
    icon: MonitorCheck,
  },
  {
    role: "ドクター",
    sections: "§9〜§10",
    note: "結果画面の見方と、個別所見の追記・公開手順を確認します。",
    icon: Stethoscope,
  },
  {
    role: "院長・管理者",
    sections: "§11・§16",
    note: "診断一覧、所見編集、コンプライアンス表現を確認します。",
    icon: ShieldCheck,
  },
] as const;

const visualFlow = [
  { label: "同意取得", icon: UserCheck },
  { label: "ログイン", icon: LogIn },
  { label: "撮影", icon: Camera },
  { label: "解析", icon: Sparkles },
  { label: "AI 文生成", icon: MessageSquareText },
  { label: "所見追記", icon: Stethoscope },
  { label: "共有", icon: Share2 },
] as const;

const screenshotShowcase = [
  {
    src: "/images/howto/03-how-to-use-top.png",
    alt: "運用フロー説明書のトップ部分",
    title: "このページ",
    caption: "困った時に戻る、スタッフ向けマニュアルの入口。",
  },
  {
    src: "/images/howto/02-staff-login.png",
    alt: "スタッフログイン画面",
    title: "ログイン",
    caption: "院内端末でスタッフ権限のあるアカウントを使います。",
  },
  {
    src: "/images/howto/01-top.png",
    alt: "来院者向けトップ画面",
    title: "新規診断",
    caption: "来院者向け画面に切り替えて撮影フローへ進みます。",
  },
  {
    src: "/images/howto/04-how-to-use-flow.png",
    alt: "運用フローの説明セクション",
    title: "全体フロー",
    caption: "同意取得から共有まで、院内で進める順番を確認します。",
  },
  {
    src: "/images/howto/05-how-to-use-photo.png",
    alt: "写真撮影のコツの説明画面",
    title: "撮影条件",
    caption: "推奨・NG 条件を見比べて、再撮影判断に使います。",
  },
] as const;

type CalloutTone = "info" | "warn" | "danger" | "ok";

function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone;
  title: string;
  children: React.ReactNode;
}) {
  const toneClass: Record<CalloutTone, string> = {
    info: "border-tiam-gold/30 bg-tiam-gold/8 text-tiam-primary",
    warn: "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
    danger:
      "border-destructive/40 bg-destructive/10 text-destructive",
    ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  };
  const Icon =
    tone === "warn"
      ? AlertTriangle
      : tone === "danger"
        ? CircleAlert
        : tone === "ok"
          ? CheckCircle2
          : BookOpenCheck;
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-xs leading-relaxed",
        toneClass[tone],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold tracking-wide uppercase">
          {title}
        </p>
        <div className="text-foreground/90 [&_strong]:font-semibold">
          {children}
        </div>
      </div>
    </aside>
  );
}

function SectionHeader({
  index,
  title,
  icon: Icon,
  subtitle,
}: {
  index: string;
  title: string;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <CardHeader>
      <div className="flex items-start gap-3">
        <span className="border-tiam-gold/40 bg-tiam-gold/10 text-tiam-gold flex size-9 shrink-0 items-center justify-center rounded-full border">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-[10px] tracking-[0.3em] uppercase">
            STEP {index}
          </p>
          <CardTitle className="text-tiam-primary font-heading text-lg sm:text-xl">
            {title}
          </CardTitle>
          {subtitle ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </CardHeader>
  );
}

function FlowStep({
  no,
  title,
  body,
  role,
}: {
  no: number;
  title: string;
  body: string;
  role: "reception" | "counselor" | "doctor" | "admin";
}) {
  const labelByRole = {
    reception: "受付",
    counselor: "カウンセラー",
    doctor: "ドクター",
    admin: "管理者",
  } as const;
  const colorByRole = {
    reception: "bg-tiam-rose/15 text-tiam-primary border-tiam-rose/40",
    counselor: "bg-tiam-gold/10 text-tiam-primary border-tiam-gold/40",
    doctor:
      "bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 border-emerald-500/40",
    admin: "bg-slate-500/10 text-slate-900 dark:text-slate-100 border-slate-500/40",
  } as const;
  return (
    <li className="flex gap-3 sm:gap-4">
      <span className="border-tiam-gold/40 bg-card text-tiam-primary font-heading flex size-7 shrink-0 items-center justify-center rounded-full border text-xs sm:size-8 sm:text-sm">
        {no}
      </span>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-tiam-primary text-sm sm:text-base">
            {title}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              colorByRole[role],
            )}
          >
            院内端末 / {labelByRole[role]}
          </span>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
          {body}
        </p>
      </div>
    </li>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="text-foreground flex items-start gap-2 text-sm leading-relaxed"
        >
          <CheckCircle2
            className="text-tiam-gold mt-0.5 size-3.5 shrink-0"
            aria-hidden
          />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function NgList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="text-foreground flex items-start gap-2 text-sm leading-relaxed"
        >
          <CircleAlert
            className="text-destructive mt-0.5 size-3.5 shrink-0"
            aria-hidden
          />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border/70 bg-background/85 flex min-h-24 flex-col justify-between rounded-lg border p-4 shadow-sm">
      <div className="text-tiam-gold flex items-center gap-2 text-xs font-medium">
        <Icon className="size-4" aria-hidden />
        {label}
      </div>
      <p className="text-tiam-primary mt-3 font-heading text-xl leading-tight">
        {value}
      </p>
    </div>
  );
}

function RoleGuideCard({
  role,
  sections,
  note,
  icon: Icon,
}: {
  role: string;
  sections: string;
  note: string;
  icon: React.ElementType;
}) {
  return (
    <div className="border-border/70 bg-card flex min-h-40 flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="bg-tiam-gold/10 text-tiam-gold flex size-9 items-center justify-center rounded-full">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="border-tiam-gold/40 text-tiam-primary rounded-full border px-2.5 py-1 text-[11px] font-medium">
          {sections}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-tiam-primary text-base">{role}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{note}</p>
      </div>
    </div>
  );
}

function VisualFlowMap() {
  return (
    <div className="border-border/70 bg-card rounded-xl border p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="bg-tiam-rose/20 text-tiam-primary flex size-8 items-center justify-center rounded-full">
          <TimerReset className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-tiam-primary font-heading text-base">
            ひと目で見る運用フロー
          </p>
          <p className="text-muted-foreground text-xs">
            実務では左から右へ進めれば完了します。
          </p>
        </div>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {visualFlow.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === visualFlow.length - 1;
          return (
            <li key={step.label} className="relative">
              <div className="border-border/60 bg-background flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-center">
                <span className="text-tiam-gold bg-tiam-gold/10 flex size-9 items-center justify-center rounded-full">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-tiam-primary text-xs font-medium leading-snug">
                  {step.label}
                </span>
              </div>
              {!isLast ? (
                <ArrowRight
                  className="text-tiam-gold absolute top-1/2 -right-2 z-10 hidden size-4 -translate-y-1/2 lg:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ScreenshotShowcase() {
  return (
    <section aria-labelledby="screen-guide" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="bg-tiam-gold/10 text-tiam-gold flex size-8 items-center justify-center rounded-full">
          <ImageIcon className="size-4" aria-hidden />
        </span>
        <div>
          <h2
            id="screen-guide"
            className="font-heading text-tiam-primary text-lg"
          >
            画面で先に把握する
          </h2>
          <p className="text-muted-foreground text-xs">
            文章を読む前に、よく使う画面の位置関係を掴めます。
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {screenshotShowcase.map((shot) => (
          <figure
            key={shot.src}
            className="border-border/70 bg-card overflow-hidden rounded-xl border"
          >
            <div className="bg-muted/30 aspect-[2360/1640] overflow-hidden">
              <Image
                src={shot.src}
                alt={shot.alt}
                width={1180}
                height={820}
                className="h-full w-full object-cover object-top"
                quality={85}
              />
            </div>
            <figcaption className="flex flex-col gap-1 p-3">
              <span className="font-heading text-tiam-primary text-sm">
                {shot.title}
              </span>
              <span className="text-muted-foreground text-xs leading-relaxed">
                {shot.caption}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function ScreenshotFigure({
  src,
  alt,
  caption,
  width = 1180,
  height = 820,
}: {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="border-border/60 bg-muted/30 overflow-hidden rounded-xl border shadow-sm">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full object-top"
          quality={90}
        />
      </div>
      <figcaption className="text-muted-foreground text-center text-xs">
        ▲ {caption}
      </figcaption>
    </figure>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="border-border/70 bg-card group rounded-lg border px-4 py-3">
      <summary className="text-tiam-primary cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="text-tiam-gold mr-2 inline-block transition group-open:rotate-90">
          ▸
        </span>
        {q}
      </summary>
      <div className="text-muted-foreground mt-2 pl-5 text-xs leading-relaxed sm:text-sm">
        {a}
      </div>
    </details>
  );
}

export default function StaffHowToUsePage() {
  return (
    <main className="bg-gradient-to-b from-background via-background to-accent/20 flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:gap-10 sm:py-14">
        <header className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className="flex flex-col gap-4">
            <p className="text-tiam-gold font-heading text-xs tracking-[0.35em] uppercase">
              TIAM Staff Operations
            </p>
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-tiam-primary text-3xl leading-tight tracking-tight sm:text-5xl">
                運用フロー説明書
                <span className="text-tiam-primary/65 block text-lg sm:text-2xl">
                  How to Use
                </span>
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
                院内受付・カウンセラー・施術スタッフ向けに、TIAM Beauty AI
                の流れを「全体像 → 画面 → 詳細手順」の順で追えるようにまとめました。
                必要な箇所だけ拾い読みしても使える業務マニュアルです。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickStat icon={Clock3} label="目安時間" value="5〜8分 / 1名" />
              <QuickStat icon={FileText} label="読む順番" value="流れ → 画面 → 詳細" />
              <QuickStat icon={Lightbulb} label="困った時" value="§15 FAQ を確認" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/staff"
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                <LogIn className="size-3.5" aria-hidden />
                スタッフ業務メニューへ
              </Link>
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5",
                )}
              >
                来院者向けトップ
              </Link>
            </div>
          </div>
          <figure className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="bg-muted/30 aspect-[2360/1640] overflow-hidden">
              <Image
                src="/images/howto/03-how-to-use-top.png"
                alt="スタッフ向け運用フロー説明書トップのスクリーンショット"
                width={1180}
                height={820}
                className="h-full w-full object-cover object-top"
                priority
                quality={90}
              />
            </div>
            <figcaption className="text-muted-foreground px-4 py-3 text-xs leading-relaxed">
              迷った時はこのページに戻り、目次から該当セクションへ移動します。
            </figcaption>
          </figure>
        </header>

        <Callout tone="warn" title="このサービスの位置付け">
          TIAM Beauty AI は<strong>美容バランスの傾向</strong>を可視化する
          <strong>参考情報</strong>サービスです。
          <strong>医療診断ではありません。</strong>
          来院者には必ず「医療効果や治療を約束するものではない」旨をお伝えください。
        </Callout>

        <VisualFlowMap />

        <section className="grid gap-3 md:grid-cols-3" aria-label="役割別の読み方">
          {roleGuides.map((guide) => (
            <RoleGuideCard key={guide.role} {...guide} />
          ))}
        </section>

        <nav
          aria-label="目次"
          className="border-border/70 bg-card rounded-xl border p-5"
        >
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
            目次
          </p>
          <ol className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {tableOfContents.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-tiam-primary hover:text-tiam-gold underline-offset-4 hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <ScreenshotShowcase />

        {/* 0. はじめに */}
        <Card id="overview" className="scroll-mt-24">
          <SectionHeader
            index="0"
            title="はじめに：このページの読み方"
            icon={BookOpenCheck}
            subtitle="役割ごとに必要なセクションを案内します。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <CheckList
              items={[
                "受付・カウンセラー: §3〜§9・§12・§14・§15 を中心に。",
                "ドクター: §9〜§10 でドクター所見の追記方法を確認。",
                "院長・管理者: §11 の院方コンテンツ編集と §16 のコンプライアンスを確認。",
                "新人教育時は §1 → §4 → §5 → §10 を実際の端末で写経すると早いです。",
              ]}
            />
          </CardContent>
        </Card>

        {/* 1. 全体フロー */}
        <Card id="flow" className="scroll-mt-24">
          <SectionHeader
            index="1"
            title="全体フロー（要約）"
            icon={ClipboardList}
            subtitle="所要時間の目安：約 5〜8 分 / 1 名（撮影〜結果共有まで）"
          />
          <CardContent className="flex flex-col gap-6 pb-5">
            <ol className="flex flex-col gap-4">
              <FlowStep
                no={1}
                role="reception"
                title="来院者へサービス概要を説明し、同意を取得"
                body="医療診断ではないこと・写真がブラウザ内で処理されることを口頭で伝える。"
              />
              <FlowStep
                no={2}
                role="reception"
                title="院内端末で /staff にアクセスしログイン"
                body="スタッフ権限または管理者権限のあるアカウントでサインインします。"
              />
              <FlowStep
                no={3}
                role="counselor"
                title="「新規診断をはじめる」をタップ"
                body="来院者向けトップ画面に切り替わるので、スタッフが操作して撮影〜診断まで進めます。"
              />
              <FlowStep
                no={4}
                role="counselor"
                title="同意チェック → 院内カメラ／端末で写真を撮影"
                body="正面・明るい場所・髪で顔を隠さない条件で撮影。撮影は院内端末から行います。"
              />
              <FlowStep
                no={5}
                role="counselor"
                title="ブラウザ内で顔解析（478 点ランドマーク）"
                body="写真は院内端末のブラウザから外部に出ません。失敗時は角度・明るさを変えて再撮影。"
              />
              <FlowStep
                no={6}
                role="counselor"
                title="「スコアを計算」→「AI 診断文を生成」"
                body="OpenAI にはスコア（数値）のみが送信されます。写真は送られません。"
              />
              <FlowStep
                no={7}
                role="counselor"
                title="結果画面でスコアと AI レポートを確認"
                body="総合スコア・パーツ別レーダー・AI 短文・院方コンテンツが表示されます。"
              />
              <FlowStep
                no={8}
                role="doctor"
                title="「ドクター所見を編集」で個別コメントを追記"
                body="総評＋パーツ別に追記し、「反映（公開）」で結果画面に反映されます。"
              />
              <FlowStep
                no={9}
                role="counselor"
                title="結果画面を来院者にお見せして説明 / シェアカード共有"
                body="院内端末の画面上で結果を提示。必要に応じてシェアカード PNG を AirDrop / LINE で渡します。"
              />
              <FlowStep
                no={10}
                role="counselor"
                title="（任意）AI 理想顔の生成 → 業務終了時にログアウト"
                body="理想顔生成は来院者の追加同意のうえ実施。院内共有端末は次の来院者前に必ずログアウト。"
              />
            </ol>
          </CardContent>
        </Card>

        {/* 2. 事前準備 */}
        <Card id="prepare" className="scroll-mt-24">
          <SectionHeader
            index="2"
            title="事前準備"
            icon={Settings2}
            subtitle="毎営業日のオープニング時にチェックしてください。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <CheckList
              items={[
                "推奨ブラウザ: 最新版の Google Chrome または Safari（iPad は Safari）。",
                "院内 Wi-Fi に接続済みであること（外部 AI API への通信が必要）。",
                "端末カメラまたは撮影用一眼の画像転送経路を確認。",
                "iPad 端末は明るさ自動調整を OFF にし、画面ロックは 10 分以上を推奨。",
                "ブラウザのキャッシュ／Cookie はログイン状態を保持するため通常クリア不要。",
              ]}
            />
            <Callout tone="info" title="バックアップ運用">
              メインの院内端末が動かない場合は、予備の院内 iPad ／ PC から{" "}
              <code className="font-mono text-[11px]">/staff</code>{" "}
              にアクセスし同じアカウントでログインできます。診断 ID は Firestore
              に保存されているため、別の院内端末からも結果 URL（
              <code className="font-mono text-[11px]">/result/[id]</code>
              ）を開いて続きの業務を行えます。
            </Callout>
          </CardContent>
        </Card>

        {/* 3. ログイン */}
        <Card id="login" className="scroll-mt-24">
          <SectionHeader
            index="3"
            title="スタッフログイン"
            icon={LogIn}
            subtitle="権限は admin / staff の 2 種類。"
          />
          <CardContent className="flex flex-col gap-4 pb-5">
            <ScreenshotFigure
              src="/images/howto/02-staff-login.png"
              alt="スタッフログイン画面のスクリーンショット"
              caption="/staff にアクセスするとこのログインフォームが表示される"
            />
            <ol className="text-foreground list-decimal pl-5 text-sm leading-relaxed">
              <li>院内端末で <code className="font-mono text-[11px]">/staff</code> を開く。</li>
              <li>付与されているメールアドレスとパスワードでログイン。</li>
              <li>
                ログイン後に「業務メニュー」が表示されればスタッフ権限あり。
                エラー表示が出る場合は管理者に権限付与を依頼してください。
              </li>
            </ol>
            <Callout tone="warn" title="権限が無いと表示されたら">
              「このアカウントにはスタッフ権限がありません」と出る場合、
              Firebase Custom Claims に <code className="font-mono text-[11px]">admin</code> または{" "}
              <code className="font-mono text-[11px]">staff</code>{" "}
              が付与されていません。院長または開発担当者にご連絡ください。
            </Callout>
          </CardContent>
        </Card>

        {/* 4. 同意取得 */}
        <Card id="consent" className="scroll-mt-24">
          <SectionHeader
            index="4"
            title="来院者への同意取得（口頭スクリプト）"
            icon={UserCheck}
            subtitle="必ず以下の 3 点を説明してから写真をお預かりします。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <CheckList
              items={[
                "写真は院内端末のブラウザ内のみで解析され、外部サーバーには送信されません。",
                "AI 診断文の生成にはスコア（数値）だけを送ります。写真は送られません。",
                "「AI 理想顔ジェネレーター」を利用する場合のみ、写真も外部 AI に送信します。任意機能です。",
              ]}
            />
            <Callout tone="info" title="口頭テンプレート例">
              「撮影したお写真は当院の端末の中だけで分析され、外には出ません。AI
              に送られるのは黄金比のスコアだけで、写真は送りません。ご希望の場合のみ、AI
              が描いた整え後イメージも作成できます。よろしいでしょうか？」
            </Callout>
          </CardContent>
        </Card>

        {/* 5. 新規診断 */}
        <Card id="diagnose" className="scroll-mt-24">
          <SectionHeader
            index="5"
            title="新規診断を開始する"
            icon={Sparkles}
          />
          <CardContent className="flex flex-col gap-4 pb-5">
            <ScreenshotFigure
              src="/images/howto/01-top.png"
              alt="来院者向けトップ画面のスクリーンショット"
              caption="「新規診断をはじめる」後に表示されるトップ。「診断をはじめる」から撮影フローへ進む"
            />
            <ol className="text-foreground list-decimal pl-5 text-sm leading-relaxed">
              <li>業務メニューの「新規診断をはじめる」をタップ。</li>
              <li>来院者向けトップに切り替わったら、スタッフが院内端末で操作を継続。</li>
              <li>「無料で診断をはじめる」→ 同意チェック → 院内端末で写真を撮影／選択。</li>
            </ol>
            <Callout tone="info" title="撮影方法のポイント">
              院内端末のカメラから撮影する場合は背面カメラに切り替えると鮮明に撮れます。撮影スポット（撮影用ライト＋背景紙）がある場合は別カメラで撮影 → 院内端末にエアドロップ等で取り込んだうえで「写真ライブラリから選択」してください。
            </Callout>
          </CardContent>
        </Card>

        {/* 6. 撮影のコツ */}
        <Card id="photo" className="scroll-mt-24">
          <SectionHeader
            index="6"
            title="写真撮影のコツ"
            icon={Camera}
            subtitle="解析精度に直結します。可能なら院内の撮影スポットを使用してください。"
          />
          <CardContent className="flex flex-col gap-4 pb-5">
            <ScreenshotFigure
              src="/images/howto/05-how-to-use-photo.png"
              alt="写真撮影のコツと顔解析セクションのスクリーンショット"
              caption="推奨条件（左）と NG 条件（右）の比較。下段は顔解析の説明"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-border/70 bg-card flex flex-col gap-2 rounded-lg border p-4">
                <p className="text-tiam-primary text-xs font-semibold tracking-wider uppercase">
                  ◎ 推奨
                </p>
                <CheckList
                  items={[
                    "正面・無表情・口を閉じる",
                    "髪を耳にかけて輪郭を出す",
                    "メガネ・マスクを外す",
                    "前髪が眉を隠さない",
                    "明るい一様な照明（顔に影が出ない）",
                    "顔がフレーム中央・上下に少し余白",
                  ]}
                />
              </div>
              <div className="border-border/70 bg-card flex flex-col gap-2 rounded-lg border p-4">
                <p className="text-destructive text-xs font-semibold tracking-wider uppercase">
                  × NG
                </p>
                <NgList
                  items={[
                    "斜め向き・顎を引きすぎ／上げすぎ",
                    "笑顔・口を開けた表情",
                    "強い逆光・片側だけ暗い影",
                    "前髪・マスク・手で顔を隠す",
                    "ボケ・ピンボケ・低解像度",
                    "強いフィルタ・美顔アプリ加工後の画像",
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. 解析 */}
        <Card id="analysis" className="scroll-mt-24">
          <SectionHeader
            index="7"
            title="顔解析〜スコア算出"
            icon={Sparkles}
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <p className="text-muted-foreground text-sm leading-relaxed">
              写真をアップロードすると <strong>MediaPipe FaceLandmarker</strong> が
              院内端末のブラウザ内で 478 点のランドマークを検出します。検出に成功すると顔写真にオーバーレイ表示され、「スコアを計算する」ボタンが押せるようになります。
            </p>
            <CheckList
              items={[
                "縦三分割 / 横五分割 / 目間 / 目位置 / 鼻口 / E ライン / 顔輪郭 / 左右対称性 の 8 指標を 0〜100 点で算出。",
                "総合スコア（TIAM バランス指数）は加重平均で計算されます。",
                "数値計算はすべて院内端末内で完結します。サーバー送信はありません。",
              ]}
            />
            <Callout tone="warn" title="顔が検出できない場合">
              ① 写真が暗すぎないか確認 → ② 顔の角度を正面に → ③
              髪・マスクで隠れていないか確認 → ④「もう一度解析」または「別の写真を選ぶ」で再撮影してください。
            </Callout>
          </CardContent>
        </Card>

        {/* 8. AI 診断文 */}
        <Card id="ai-text" className="scroll-mt-24">
          <SectionHeader
            index="8"
            title="AI 診断レポートの生成"
            icon={MessageSquareText}
            subtitle="OpenAI（gpt-4o-mini）にスコアのみ送信し、JSON で受け取ります。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <ol className="text-foreground list-decimal pl-5 text-sm leading-relaxed">
              <li>「スコアを計算する」→ 結果が出たら「AI 診断文を生成する」を押す。</li>
              <li>数秒〜十数秒の処理中表示の後、自動で結果画面（<code className="font-mono text-[11px]">/result/[id]</code>）に遷移。</li>
              <li>結果はサーバー（Firestore）に保存され、URL を共有できます。</li>
            </ol>
            <Callout tone="info" title="生成内容">
              総評コメント（100〜150 字）、強み 3 点、改善点 2 点、推奨ケア 3 点、TIAM
              メッセージ（50 字）の構成です。診断文には「治る」「治療」「素晴らしい」などの語句が含まれないようガードレールが入っています。
            </Callout>
            <Callout tone="warn" title="生成に失敗した場合">
              通信エラー時は「診断文を再生成」ボタンが表示されるので押し直してください。 何度も失敗する場合は院内 Wi-Fi の接続と、
              <code className="font-mono text-[11px]">OPENAI_API_KEY</code>{" "}
              の有効性を開発担当者に確認ください。
            </Callout>
          </CardContent>
        </Card>

        {/* 9. 結果画面 */}
        <Card id="result" className="scroll-mt-24">
          <SectionHeader
            index="9"
            title="結果画面の見方"
            icon={Sparkles}
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <CheckList
              items={[
                "ヒーロー: 写真にランドマークと黄金比ガイドが重なって表示。",
                "総合スコアカード: 0〜100 点。点数の上下で一喜一憂させず傾向として案内。",
                "指標バー: 8 指標を視覚化。理想からの差分が一目でわかる。",
                "パーツごとの詳細分析: 目／鼻／口／フェイスライン／対称性。AI 短文 + 公開済み院方コメント。",
                "総評・詳細レポート: AI 生成文と、公開後はドクター所見が併記。",
                "SNS シェア / シェアカード / AI 理想顔ジェネレーター セクションが順に並ぶ。",
              ]}
            />
            <Callout tone="info" title="結果 URL の保管">
              結果 URL は <code className="font-mono text-[11px]">/result/&lt;id&gt;</code>{" "}
              形式で、Firestore に保存された診断にいつでもアクセスできます。ID は不可逆な乱数のため第三者には推測されません。
            </Callout>
          </CardContent>
        </Card>

        {/* 10. ドクター所見 */}
        <Card id="doctor-note" className="scroll-mt-24">
          <SectionHeader
            index="10"
            title="ドクター所見を追記する"
            icon={Stethoscope}
            subtitle="個別来院者向け。スタッフまたは管理者権限で編集できます。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <ol className="text-foreground list-decimal pl-5 text-sm leading-relaxed">
              <li>
                結果画面右上の「ドクター所見を編集」をタップ →
                <code className="font-mono text-[11px]">/admin/diagnoses/[resultId]</code> に遷移。
              </li>
              <li>
                上部「カルテ識別子」に院内のカルテ番号や来院者の頭文字などフリーテキストで入力し「保存」。
              </li>
              <li>
                タブ「総評 / 目 / 鼻 / 口 / フェイスライン / 対称性」を切り替えて記入。
              </li>
              <li>
                「下書き保存」または「反映（公開）」を選択。<strong>公開</strong>
                すると来院者の結果画面に表示されます。
              </li>
              <li>
                取り消す場合は同画面の「公開取り消し（下書きへ）」で非公開化できます。
              </li>
            </ol>
            <Callout tone="warn" title="禁止用語の自動チェック">
              「治る」「治療」「医療効果」「素晴らしい」「最も」「No.1」などの語句は
              <strong>公開ブロック</strong>されます。エラー表示に従って言い換えてください
              （例：「治療」→「ケア」「メニュー」、「改善されます」→「整いやすくなる傾向」）。
            </Callout>
            <Callout tone="info" title="プレビューのすすめ">
              「プレビュー」ボタンで来院者画面と同じ見た目を確認してから公開してください。タブを切り替えると該当パーツのプレビューに連動します。
            </Callout>
          </CardContent>
        </Card>

        {/* 11. 診断一覧・個別所見 */}
        <Card id="doctor-content" className="scroll-mt-24">
          <SectionHeader
            index="11"
            title="診断一覧・個別所見の編集"
            icon={PenLine}
            subtitle="来院者ごとの結果に紐づくドクター所見を記入・公開します。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <ol className="text-foreground list-decimal pl-5 text-sm leading-relaxed">
              <li>
                <code className="font-mono text-[11px]">/admin/diagnoses</code>{" "}
                で過去の診断を一覧表示（スタッフ・管理者）。
              </li>
              <li>
                対象の診断を開き{" "}
                <code className="font-mono text-[11px]">/admin/diagnoses/[resultId]</code>{" "}
                でパーツ別に記入（§10 と同じ UI）。
              </li>
              <li>「プレビュー」で結果画面の見た目を確認してから「公開」。</li>
            </ol>
            <Callout tone="info" title="共通テンプレは廃止">
              旧 <code className="font-mono text-[11px]">/admin/doctor-content</code>{" "}
              （全来院者共通の院方コメント）は廃止済みです。ブックマークがある場合は診断一覧へ転送されます。
            </Callout>
          </CardContent>
        </Card>

        {/* 12. 共有 */}
        <Card id="share" className="scroll-mt-24">
          <SectionHeader
            index="12"
            title="来院者への共有"
            icon={Share2}
            subtitle="操作はすべて院内端末で行い、結果データを来院者に渡す形です。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <CheckList
              items={[
                "院内端末の画面を来院者に向け、結果ページを直接お見せする（基本動線）。",
                "「リンクをコピー」: URL を院内 LINE 公式 / メール経由で来院者に送信。",
                "「シェアカードを生成」: 1080×1920 PNG を院内端末に保存し、AirDrop / LINE / メールで来院者へ送付。写真は含まれません（スコアとブランドビジュアルのみ）。",
                "「X で共有」「LINE で送る」ボタンは、来院者ご本人がご自身のアカウントで投稿したい場合のみ使用。SNS 投稿はあくまで任意。",
                "Instagram は API 連携できないため、シェアカード PNG を渡したうえでストーリーズへ来院者ご本人の手で投稿いただきます。",
              ]}
            />
            <Callout tone="info" title="印刷／PDF について">
              院内端末のブラウザの「印刷 → PDF として保存」で結果画面を A4 で出力し、紙またはメール添付でお渡しできます。専用の「印刷する」ボタンは現在開発中です。
            </Callout>
          </CardContent>
        </Card>

        {/* 13. 理想顔 */}
        <Card id="ideal" className="scroll-mt-24">
          <SectionHeader
            index="13"
            title="AI 理想顔ジェネレーター（任意）"
            icon={Wand2}
            subtitle="この機能のみ来院者の写真を外部 AI に送信します。"
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <ol className="text-foreground list-decimal pl-5 text-sm leading-relaxed">
              <li>
                院内端末上の結果画面下部「AI 理想顔ジェネレーター」セクションで、スタッフが来院者の同意を再確認。
              </li>
              <li>
                同意チェックを ON にして「生成する」を実行（gpt-image-1 で生成、数十秒）。
              </li>
              <li>
                生成画像は「整え後イメージ」であり医療効果を保証するものではないことを必ず伝える。
              </li>
            </ol>
            <Callout tone="danger" title="必ず追加同意を取得">
              この機能のみ <strong>写真が OpenAI に送信</strong>{" "}
              されます。来院者が断られた場合は使用しないでください。生成画像を提示する際は
              「未来をお約束するものではなく、バランスを整えた場合の参考イメージ」と必ず添えてください。
            </Callout>
          </CardContent>
        </Card>

        {/* 14. ログアウト */}
        <Card id="logout" className="scroll-mt-24">
          <SectionHeader
            index="14"
            title="ログアウト・セッション管理"
            icon={LogOut}
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <CheckList
              items={[
                "業務メニューの最下部「ログアウト」で確実にサインアウト。",
                "iPad など共有端末は閉店時に必ずログアウトすること。",
                "個人のスマホでテスト利用する場合もテスト終了後にログアウト。",
                "「セッションが切れました」と出たら再ログイン後、自動的に元の画面に戻ります。",
              ]}
            />
          </CardContent>
        </Card>

        {/* 15. トラブルシューティング */}
        <Card id="troubleshoot" className="scroll-mt-24">
          <SectionHeader
            index="15"
            title="トラブルシューティング"
            icon={AlertTriangle}
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <Faq
              q="顔が検出されないと表示される"
              a={
                <ul className="list-disc pl-4">
                  <li>角度・明るさ・髪／マスクを確認し再撮影。</li>
                  <li>解像度が極端に低い画像は不可（最低でも 800px 程度を推奨）。</li>
                  <li>「もう一度解析」を 2 回試しても改善しない場合は、院内端末を再起動するか別の院内端末から再撮影。</li>
                </ul>
              }
            />
            <Faq
              q="「AI 診断文の生成に失敗しました」と表示される"
              a={
                <ul className="list-disc pl-4">
                  <li>「診断文を再生成」をタップ。</li>
                  <li>院内 Wi-Fi の接続状況を確認。</li>
                  <li>復旧しない場合は開発担当へ連絡（API キー有効期限、レート制限の可能性）。</li>
                </ul>
              }
            />
            <Faq
              q="ドクター所見の保存時に「禁止用語が含まれています」と出る"
              a={
                <ul className="list-disc pl-4">
                  <li>「治る」「治療」「医療効果」「素晴らしい」「最も」「No.1」などをチェック。</li>
                  <li>「ケア」「メニュー」「整いやすい傾向」など合法表現に言い換え。</li>
                </ul>
              }
            />
            <Faq
              q="シェアカードが真っ白になる"
              a="ブラウザを最新版に更新し、再度「シェアカードを生成」してください。Safari の古い版で表示崩れが報告されています。"
            />
            <Faq
              q="結果 URL を開き直しても写真が表示されない"
              a="写真は撮影直後の院内端末ブラウザのメモリにのみ保持されるため、ブラウザを閉じたあとや別の院内端末から URL を開くと写真は復元されません。スコア・AI 文・ドクター所見はサーバー保存のため表示されます。"
            />
            <Faq
              q="ログインしているのに権限エラーになる"
              a="アカウントに admin / staff の Custom Claims が付与されていません。管理者または開発担当者にご連絡ください。"
            />
          </CardContent>
        </Card>

        {/* 16. コンプライアンス */}
        <Card id="compliance" className="scroll-mt-24">
          <SectionHeader
            index="16"
            title="法令・コンプライアンスの注意"
            icon={ShieldCheck}
            subtitle="運用全体で必ず守るべきポイントです。"
          />
          <CardContent className="flex flex-col gap-4 pb-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-border/70 bg-card flex flex-col gap-2 rounded-lg border p-4">
                <p className="text-tiam-primary text-xs font-semibold tracking-wider uppercase">
                  薬機法（言い換え推奨）
                </p>
                <NgList
                  items={[
                    "「治る」→「整いやすい傾向」",
                    "「治療」→「ケア」「メニュー」",
                    "「医療効果」→「美容バランスの傾向」",
                    "「改善されます」→「整いやすくなる傾向」",
                  ]}
                />
              </div>
              <div className="border-border/70 bg-card flex flex-col gap-2 rounded-lg border p-4">
                <p className="text-tiam-primary text-xs font-semibold tracking-wider uppercase">
                  景表法（強調表現 NG）
                </p>
                <NgList
                  items={[
                    "「最も」「No.1」「業界一」",
                    "「完璧」「100%」「絶対」",
                    "他社・他院との比較を断定する表現",
                    "未承認医療機器を想起させる断定表現",
                  ]}
                />
              </div>
            </div>
            <Callout tone="info" title="個人情報の扱い">
              写真は端末ブラウザのメモリ／キャッシュにのみ保持されます。診断スコア・AI 文・ドクター所見・カルテ識別子は Firestore に保存され、院内管理者の責任で削除依頼に対応してください。
            </Callout>
          </CardContent>
        </Card>

        {/* 17. FAQ */}
        <Card id="faq" className="scroll-mt-24">
          <SectionHeader
            index="17"
            title="よくある質問"
            icon={HelpCircle}
          />
          <CardContent className="flex flex-col gap-3 pb-5">
            <Faq
              q="写真は OpenAI に送られますか？"
              a="通常の診断では送られません（スコアのみ送信）。例外は §13 の AI 理想顔ジェネレーターのみで、これは追加同意の上で写真が送信されます。"
            />
            <Faq
              q="同じ来院者を 2 回目以降に診断する場合は？"
              a="新しい結果 ID で別の診断が作成されます。院内端末で過去結果 URL を保管しておくか、カルテ識別子（§10）で紐付けてください。前回との比較機能は現在開発中です。"
            />
            <Faq
              q="来院者から削除依頼があった場合は？"
              a="結果 ID（URL の末尾）を確認し、管理者または開発担当に依頼してください。Firestore の該当ドキュメントを削除します。"
            />
            <Faq
              q="スコアは医療的な指標として使えますか？"
              a="いいえ。あくまで黄金比をもとにした美容バランスの参考指標です。診断書・所見書としては使用できません。"
            />
            <Faq
              q="LINE 公式アカウントへの自動連携はありますか？"
              a="現状は手動共有のみです。今後 LINE / カウンセリングシステム連携が予定されています。"
            />
          </CardContent>
        </Card>

        <Callout tone="ok" title="運用に困ったら">
          このページを更新したい・記載が誤っている場合は、院長または開発担当（社内 Slack）へお知らせください。
          内容は順次アップデートします。
        </Callout>

        <div className="flex flex-wrap justify-center gap-2 pb-4">
          <Link
            href="/staff"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <LogIn className="size-3.5" aria-hidden />
            業務メニューへ戻る
          </Link>
          <a
            href="#overview"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            ページ先頭へ
          </a>
        </div>
      </div>
    </main>
  );
}
