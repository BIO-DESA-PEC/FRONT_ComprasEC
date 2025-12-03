// src/app/preordenes/[id]/page.js
import { auth } from "@/auth";
import { getPreOC } from "@/app/lib/backend";
import PreOCEditor from "./ui/PreOCEditor";
import Link from "next/link";
import styles from "../preorden.module.css";

function fmtFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return String(iso).substring(0, 19).replace("T", " ");
  }
  return d.toLocaleString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function PreOCDetailPage({ params }) {
  await auth();
  const id = params.id;
  const data = await getPreOC(id); // { cabecera, detalle }
  const { cabecera, detalle } = data || {};
  const estado = (cabecera?.Estado || "").toUpperCase();

  const badgeClass =
    estado === "BORRADOR"
      ? styles.badgeDraft
      : estado === "APROBADA"
      ? styles.badgeApproved
      : styles.badgeSeparated;

  return (
  <div className={styles.wrap}>
    {/* HEADER superior dentro de card blanco */}
    <div className={styles.topHeader}>
      <div className={styles.headerCard}>
        <div>
          <h1 className={styles.pageTitle}>
            Pre-Orden #{cabecera?.IdPreOC ?? id}
          </h1>

          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <span className={styles.metaKey}>Solicitud:</span>
              #{cabecera?.IdSolicitud ?? "-"}
            </span>

            <span className={styles.metaDot}>•</span>

            <span className={styles.metaItem}>
              <span className={styles.metaKey}>Fecha:</span>
              {fmtFecha(cabecera?.FechaCreacion)}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={`${styles.badge} ${badgeClass}`}>
            {estado || "—"}
          </span>
          <Link href="/preordenes" className={styles.backLink}>
            ← Volver
          </Link>
        </div>
      </div>
    </div>

    {/* CUERPO */}
    <PreOCEditor preoc={cabecera} detalleInicial={detalle} />
  </div>
);
}