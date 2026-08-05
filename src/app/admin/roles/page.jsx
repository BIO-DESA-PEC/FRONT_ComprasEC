// src/app/admin/roles/page.jsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/app/lib/backend";
import RolesClient from "./RolesClient";

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const me = await getUserByEmail(session.user.email);
  const isAdmin = me?.RolNombre === "Administrador" || me?.RolId === 1;

  if (!isAdmin) redirect("/dashboard");

  return <RolesClient />;
}
