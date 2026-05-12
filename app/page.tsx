import { DiagnoseEntry } from "@/components/DiagnoseEntry";

export default function Home() {
  return (
    <main className="from-background via-background to-accent/30 flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-4 py-16 sm:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        <p className="text-tiam-gold font-heading text-xs tracking-[0.35em] uppercase sm:text-sm">
          TIAM Beauty Lab
        </p>
        <h1 className="font-heading text-tiam-primary text-3xl leading-tight tracking-tight sm:text-4xl md:text-5xl">
          TIAM 独自 AI が、
          <br className="sm:hidden" />
          美容バランスの傾向を読み解く
        </h1>
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed sm:text-base">
          写真はブラウザ内で解析します。診断テキストやイメージ生成では外部 AI
          を利用しますが、プライバシーと同意を前提に設計されています。
        </p>
        <DiagnoseEntry />
      </div>
    </main>
  );
}
