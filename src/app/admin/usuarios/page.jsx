// src/app/admin/usuarios/page.jsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import UsuariosTable from "./UsuariosTable";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

async function getComplianceUser(email) {
  const res = await fetch(`${API_BASE}/api/users/by-email?email=${email}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function UsuariosAdminPage() {
  const session = await auth();
  if (!session || !session.user?.email) redirect("/");

  const user = await getComplianceUser(session.user.email);

  if (!user || user.RolNombre !== "Administrador") {
    redirect("/dashboard");
  }

  return (
    <div style={{ padding: "20px" }}>
      <UsuariosTable />
    </div>
  );
}
