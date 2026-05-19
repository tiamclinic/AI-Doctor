import Link from "next/link";

export function Header() {
  return (
    <header className="site-chrome-header border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-tiam-primary text-lg tracking-tight sm:text-xl"
        >
          TIAM
        </Link>
        <nav className="text-muted-foreground flex items-center gap-4 text-sm sm:gap-6">
          <Link
            href="/terms"
            className="hover:text-tiam-primary transition-colors"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="hover:text-tiam-primary transition-colors"
          >
            プライバシー
          </Link>
        </nav>
      </div>
    </header>
  );
}
