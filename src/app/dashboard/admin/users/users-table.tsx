"use client";

import { useState } from "react";

const roleLabels: Record<string, string> = {
  subscriber: "Assinante",
  creator: "Creator",
  affiliate: "Afiliado",
  admin: "Admin",
  editor: "Editor",
  writer: "Editor",
};

function normalizeUserRole(role: string) {
  if (role === "writer" || role === "blog") return "editor";
  return role;
}

type AdminUser = {
  id: string;
  role: string;
  email?: string | null;
  handle?: string | null;
  displayName?: string | null;
  display_name?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};

function getUserDisplay(user: AdminUser) {
  const displayName = user.displayName || user.display_name || user.handle || "Usuario";
  const createdAt = user.createdAt || user.created_at;
  return { displayName, createdAt };
}

export function UsersTable({ initialUsers }: { initialUsers: AdminUser[] }) {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? initialUsers
      : initialUsers.filter((user) => normalizeUserRole(user.role) === filter);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto rounded-full border border-white/8 bg-black/30 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["all", "creator", "subscriber", "affiliate", "editor"].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`min-w-fit rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
              filter === role ? "bg-brand-500 text-black" : "text-brand-text-muted hover:text-white"
            }`}
          >
            {role === "all" ? "Todos" : roleLabels[role] || role}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map((user) => {
          const { displayName, createdAt } = getUserDisplay(user);

          return (
            <article key={user.id} className="rounded-[26px] border border-white/8 bg-black/30 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-lg font-bold text-brand-300">
                  {displayName[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                      <p className="mt-1 truncate text-xs text-brand-text-muted">{user.email || "Email nao informado"}</p>
                    </div>
                    <span className="rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-300">
                      {roleLabels[normalizeUserRole(user.role)] || normalizeUserRole(user.role)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-brand-text-muted">Handle</p>
                      <p className="mt-1 truncate text-xs text-white">@{user.handle || "sem-handle"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-brand-text-muted">Cadastro</p>
                      <p className="mt-1 text-xs text-white">
                        {createdAt ? new Date(createdAt).toLocaleDateString("pt-BR") : "Sem data"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}
