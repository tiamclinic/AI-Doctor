type ResultSectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function ResultSectionHeader({ title, subtitle }: ResultSectionHeaderProps) {
  return (
    <div className="border-tiam-gold/50 mb-4 border-b pb-2">
      <h2 className="font-heading text-tiam-primary text-sm tracking-tight sm:text-base">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed sm:text-xs">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
