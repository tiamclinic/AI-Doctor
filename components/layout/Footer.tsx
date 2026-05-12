import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border/60 mt-auto border-t py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
        <p className="font-heading text-tiam-primary">TIAM Beauty AI</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/terms" className="hover:text-tiam-primary transition-colors">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-tiam-primary transition-colors">
            プライバシーポリシー
          </Link>
        </div>
        <p className="text-xs sm:text-sm">© {year} TIAM. All rights reserved.</p>
      </div>
    </footer>
  );
}
