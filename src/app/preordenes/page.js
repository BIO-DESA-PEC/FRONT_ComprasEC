import { auth } from "@/auth";
import { getUserByEmail } from "@/app/lib/backend";
import Link from "next/link";
import RowActions from "./RowActions";
import styles from "./preordenes.module.css";

const PAGE_SIZE_DEFAULT = 15;

async function fetchList({ userId, page, pageSize, q }) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "https://back-compras-ec.onrender.com";
  const qp = new URLSearchParams();
  qp.set("page", String(page || 1));
  qp.set("pageSize", String(pageSize || PAGE_SIZE_DEFAULT));
  if (userId) qp.set("userId", String(userId));
  if (q) qp.set("q", q);
  const res = await fetch(`${base}/api/preoc?${qp.toString()}`, { cache: "no-store" });
  if (!res.ok) return { page, pageSize, totalRows: 0, items: [] };
  return res.json();
}

function estadoBadge(estado, styles) {
  const e = String(estado || "").toUpperCase();
  if (e === "SEPARADA") return `${styles.badge} ${styles.badgeSplit}`;
  if (e === "APROBADA") return `${styles.badge} ${styles.badgeApproved}`;
  return `${styles.badge} ${styles.badgeDraft}`;
}

/** Ventana compacta de páginas: [1] … [p-1, p, p+1] … [last] */
function pageWindow(page, totalPages, span = 1) {
  const out = new Set([1, totalPages, page]);
  for (let i = 1; i <= span; i++) {
    out.add(page - i);
    out.add(page + i);
  }
  return [...out]
    .filter(p => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
}

/** Calcula totalPages y un generador de href conservando q/pageSize */
function pager({ page, totalRows, pageSize, q }) {
  const totalPages = Math.max(1, Math.ceil((totalRows || 0) / pageSize));
  const makeHref = (p) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    u.set("page", String(p));
    u.set("pageSize", String(pageSize));
    return `/preordenes?${u.toString()}`;
  };
  return { totalPages, makeHref };
}

export default async function PreOCListPage({ searchParams }) {
  const session = await auth();
  const user = session ? await getUserByEmail(session.user.email) : null;

  // Backend devuelve IdUsuario
  const userIdRaw =
    user?.IdUsuario ?? user?.Id ?? user?.id ?? user?.ID ?? session?.user?.id ?? null;
  const userId = userIdRaw != null ? Number(userIdRaw) : null;
  const userEmail = session?.user?.email ?? null;

  const page     = Number(searchParams?.page || 1);
  const pageSize = Number(searchParams?.pageSize || PAGE_SIZE_DEFAULT);
  const q        = (searchParams?.q || "").trim();

  const data  = await fetchList({ userId, page, pageSize, q });
  const items = data?.items ?? [];

  const { totalPages, makeHref } = pager({
    page,
    totalRows: data?.totalRows || 0,
    pageSize,
    q,
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.headerCard}>
        <h1>Pre-Órdenes de compra</h1>
      </div>

      {/* Buscador */}
      <form className={styles.searchBar} method="get">
        <input
          name="q"
          className={styles.searchInput}
          placeholder="Buscar por #PreOC o #Solicitud…"
          defaultValue={q}
        />
        <input type="hidden" name="pageSize" value={pageSize} />
        <button className={styles.primary} type="submit">Buscar</button>
        {q && (
          <Link className={styles.secondary} href="/preordenes">Limpiar</Link>
        )}
      </form>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay pre-órdenes listadas {q ? "para tu búsqueda." : "aún."}</p>
        </div>
      ) : (
        <>
          <div className={styles.table}>
            <div className={`${styles.row} ${styles.header}`}>
              <div>#PreOC</div>
              <div className={styles.colSolicitud}>#Solicitud</div>
              <div>Fecha</div>
              <div className={`${styles.num} ${styles.colRenglones}`}>Renglones</div>
              <div className={styles.num}>Total</div>
              <div>Estado</div>
              <div className={styles.colAcciones}>Acciones</div>
            </div>

            {items.map((it) => {
              const idPreoc = Number(it.IdPreOC);
              return (
                <div key={idPreoc} className={`${styles.row} ${styles.rowClickable}`}>
                  <Link
                    href={`/preordenes/${idPreoc}`}
                    className={styles.rowMain}
                    aria-label={`Abrir #${idPreoc}`}
                  >
                    <div>#{idPreoc}</div>
                    <div className={styles.colSolicitud}>#{it.IdSolicitud}</div>
                    <div className={styles.dateText}>
                      {String(it.FechaCreacion).replace("T", " ").slice(0, 19)}
                    </div>
                    <div className={`${styles.num} ${styles.colRenglones}`}>{it.Renglones}</div>
                    <div className={styles.num}>{Number(it.Total || 0).toFixed(2)}</div>
                    <div>
                      <span className={estadoBadge(it.Estado, styles)}>{it.Estado || "—"}</span>
                    </div>
                  </Link>

                  {/* Acciones compactas (estrella, duplicar, editar) */}
                  <RowActions
                    idPreoc={idPreoc}
                    isFav={!!it.IsFavorita}
                    userId={userId}
                    userEmail={userEmail}
                  />
                </div>
              );
            })}
          </div>

          {/* ===== FOOTER: conteo + paginado tipo píldoras ===== */}
          <div className={styles.footerBar}>
            {/* Conteo izquierda */}
            <div className={styles.rowsInfo}>
              {(() => {
                const start = (page - 1) * pageSize + 1;
                const end   = Math.min(data?.totalRows || 0, page * pageSize);
                const total = data?.totalRows || 0;
                return total > 0
                  ? <>Mostrando {start}–{end} de {total}</>
                  : <>Sin resultados</>;
              })()}
            </div>

            {/* Paginación derecha */}
            <nav className={styles.pagination} aria-label="Paginación">
              <Link
                href={makeHref(1)}
                className={`${styles.pillIcon} ${page <= 1 ? styles.pillDisabled : ""}`}
                aria-label="Primera página"
              >
                «
              </Link>
              <Link
                href={makeHref(Math.max(1, page - 1))}
                className={`${styles.pillIcon} ${page <= 1 ? styles.pillDisabled : ""}`}
                aria-label="Anterior"
              >
                ‹
              </Link>

              {pageWindow(page, totalPages, 1).map(p => (
                <Link
                  key={p}
                  href={makeHref(p)}
                  className={`${styles.pill} ${p === page ? styles.pillActive : ""}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Link>
              ))}

              <Link
                href={makeHref(Math.min(totalPages, page + 1))}
                className={`${styles.pillIcon} ${page >= totalPages ? styles.pillDisabled : ""}`}
                aria-label="Siguiente"
              >
                ›
              </Link>
              <Link
                href={makeHref(totalPages)}
                className={`${styles.pillIcon} ${page >= totalPages ? styles.pillDisabled : ""}`}
                aria-label="Última página"
              >
                »
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
