// src/app/solicitudes/[id]/edit/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/app/lib/backend";
import SolicitudForm from "../../new/SolicitudForm";

async function fetchOne(id) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  const res = await fetch(`${base}/api/solicitudes/${id}`, { cache: "no-store" });
  if (!res.ok) {
    // Si el backend devuelve 404 u otro error, propagamos texto legible
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status} al obtener la solicitud #${id}`);
  }
  return res.json();
}

export default async function EditSolicitudPage({ params }) {
  const session = await auth();
  if (!session) redirect("/");

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect("/");

  let data;
  try {
    data = await fetchOne(params.id);
  } catch (e) {
    // Si no existe, regresa al listado con query de error (opcional)
    redirect(`/solicitudes?err=${encodeURIComponent(String(e.message || e))}`);
  }

  const cab = data?.cabecera || {};
  const editable = cab.Estado === "PENDIENTE";

  return (
    <SolicitudForm
      user={user}
      mode={editable ? "edit" : "view"}
      initial={data}
      lockReason={editable ? null : "Solo editable cuando está PENDIENTE."}
    />
  );
}
