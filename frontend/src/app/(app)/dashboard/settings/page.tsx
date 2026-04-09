import { getSettings } from "@/backend/queries";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <SettingsForm
      initialBusinessName={settings?.businessName ?? ""}
      initialEmail={settings?.email ?? ""}
      initialTimezone={settings?.timezone ?? "Australia/Sydney"}
      smsNumbers={settings?.smsNumbers ?? []}
    />
  );
}
