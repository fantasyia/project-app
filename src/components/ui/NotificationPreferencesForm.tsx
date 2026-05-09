"use client";

import { useTransition } from "react";
import { updateNotificationPreferences } from "@/lib/actions/notifications";

type Preference = {
  channel: "in_app" | "email";
  type: "messages" | "likes" | "comments" | "moderation" | "financial" | "system";
  enabled: boolean;
};

const labels: Record<string, string> = {
  in_app: "Sininho",
  email: "Email",
  messages: "Mensagens",
  likes: "Likes",
  comments: "Comentarios",
  moderation: "Moderacao",
  financial: "Financeiro",
  system: "Sistema",
};

export function NotificationPreferencesForm({ preferences }: { preferences: Preference[] }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateNotificationPreferences(formData);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-300">
        Preferencias
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {preferences.map((preference) => (
          <label
            key={`${preference.channel}:${preference.type}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/25 px-3 py-2 text-xs text-white"
          >
            <span>
              {labels[preference.type]} · {labels[preference.channel]}
            </span>
            <input
              name={`${preference.channel}:${preference.type}`}
              type="checkbox"
              defaultChecked={preference.enabled}
              className="h-4 w-4 accent-brand-500"
            />
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-2xl bg-brand-500 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar preferencias"}
      </button>
    </form>
  );
}
