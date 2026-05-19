import { redirect } from "next/navigation";

/** T-23: 共通テンプレ CMS は廃止。診断一覧へ転送。 */
export default function DeprecatedDoctorContentPage() {
  redirect("/admin/diagnoses");
}
