/** ブラウザ印刷時の注意（画面のみ表示） */
export function PrintLayoutHint() {
  return (
    <p className="text-muted-foreground print:hidden max-w-xs text-right text-[10px] leading-relaxed">
      PDF 保存時は送信先で「PDF として保存」を選び、倍率 100%・「背景のグラフィック」を ON
      にしてください。
    </p>
  );
}
