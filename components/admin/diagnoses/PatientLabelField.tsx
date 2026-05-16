"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type PatientLabelFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
};

export function PatientLabelField({
  value,
  onChange,
  onSave,
  saving,
  saveError,
}: PatientLabelFieldProps) {
  return (
    <div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="patient-label">カルテ識別子（任意）</Label>
        <p className="text-muted-foreground text-[10px] leading-relaxed">
          院内管理用ラベルです。来院者の結果画面には表示されません。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="patient-label"
            type="text"
            maxLength={120}
            className="border-input bg-background h-9 flex-1 rounded-lg border px-3 text-sm"
            placeholder="例: K-1024"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onSave}>
            {saving ? "保存中…" : "ラベルを保存"}
          </Button>
        </div>
        {saveError ? (
          <p className="text-destructive text-xs" role="alert">
            {saveError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
