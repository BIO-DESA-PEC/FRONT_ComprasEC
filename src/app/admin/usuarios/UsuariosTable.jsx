// src/app/admin/usuarios/UsuariosTable.jsx
"use client";

import { useEffect, useState } from "react";
import UsuariosModal from "./UsuariosModal";
import styles from "./usuarios.module.css";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const PAGE_SIZE = 20;

export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // paginación (solo front)
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const url = `${API_BASE}/api/users?q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();
    setUsuarios(data || []);
    setPage(1); // siempre vuelves a la primera página al buscar
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setModalOpen(true);
  };

  // === Filtro + paginación en memoria ===
  const filtered = usuarios; // ya viene filtrado desde el backend por q

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const pageItems = filtered.slice(startIndex, endIndex);

  const showingFrom = totalCount === 0 ? 0 : startIndex + 1;
  const showingTo = totalCount === 0 ? 0 : Math.min(endIndex, totalCount);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Administración de Usuarios</h1>
          <p className={styles.subtitle}>
            Gestiona los usuarios y sus accesos
          </p>
        </div>

        <div className={styles.headerRight}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar usuario, correo…"
            className={styles.search}
          />
          <button onClick={load} className={styles.btn}>
            {loading ? "Buscando…" : "Buscar"}
          </button>

          <button onClick={openNew} className={styles.primaryBtn}>
            + Nuevo Usuario
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Departamento</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((u) => (
              <tr key={u.Id}>
                <td>{u.Id}</td>
                <td>{u.Nombre}</td>
                <td>{u.Correo}</td>
                <td>{u.RolNombre}</td>
                <td>{u.DeptoNombre}</td>
                <td>
                  <button
                    className={styles.editBtn}
                    onClick={() => openEdit(u)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}

            {pageItems.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Barra de paginación estilo "Mostrando 1–20 de 50  « 1 2 3 »" */}
        <div className={styles.pagination}>
          <span className={styles.paginationSummary}>
            Mostrando {showingFrom}–{showingTo} de {totalCount}
          </span>
          <div className={styles.paginationButtons}>
            <button
              className={styles.pageArrow}
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              «
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  className={
                    p === currentPage
                      ? styles.pageNumberActive
                      : styles.pageNumber
                  }
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              );
            })}

            <button
              className={styles.pageArrow}
              disabled={currentPage === totalPages || totalCount === 0}
              onClick={() => goToPage(currentPage + 1)}
            >
              »
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UsuariosModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
          usuario={editing}
        />
      )}
    </div>
  );
}
