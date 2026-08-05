// src/app/admin/departamentos/page.jsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/app/lib/backend";
import DepartamentosClient from "./DepartamentosClient";

export default async function DepartamentosPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const me = await getUserByEmail(session.user.email);
  const isAdmin = me?.RolNombre === "Administrador" || me?.RolId === 1;

  if (!isAdmin) redirect("/dashboard");

  return <DepartamentosClient />;
}
