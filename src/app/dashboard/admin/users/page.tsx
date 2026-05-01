import { getAllUsers } from "@/lib/actions/admin";
import { UsersTable } from "./users-table";

export const metadata = { title: "Usuarios | Admin Fantasyia" };

export default async function UsersPage() {
  const users = await getAllUsers();

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <div className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Base global</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Usuarios <span className="text-brand-500">e papeis</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          {users.length} contas cadastradas para triagem operacional.
        </p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
