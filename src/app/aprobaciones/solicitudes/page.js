// src/app/aprobaciones/solicitudes/page.jsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserByEmail, getPendingApprovals } from "@/app/lib/backend";
import AprobacionesClient from "../ui/AprobacionesClient";
import styles from "../aprobaciones.module.css";

export const dynamic = "force-dynamic";

export default async function SolicitudesPage() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return <div className={styles.wrap}>Tu correo no está registrado: {session.user.email}</div>;
  }

  const userId = user.IdUsuario;
  const solicitudes = await getPendingApprovals(userId);

  return (
    <div className={styles.wrap}>
      <h1>Solicitudes pendientes</h1>
      <AprobacionesClient initial={solicitudes} userId={userId} />
    </div>
  );
}
