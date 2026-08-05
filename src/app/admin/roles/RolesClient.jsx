// src/app/admin/roles/RolesClient.jsx
"use client";

import { useEffect, useState } from "react";
import styles from "../usuarios/usuarios.module.css";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const PAGE_SIZE = 20;

export default function RolesClient() {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ NombreRol: "", DescripcionRol: "" });

  const [page, setPage] = useState(1);

  const load = async () => {
    const res = await fetch(`${API_BASE}/api/roles`);
    const data = await res.json();
    setRoles(data || []);
    setPage(1);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ NombreRol: "", DescripcionRol: "" });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      NombreRol: r.NombreRol,
      DescripcionRol: r.DescripcionRol,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const url = editing
      ? `${API_BASE}/api/roles/${editing.Id}`
      : `${API_BASE}/api/roles`;

    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) return alert("Error guardando rol");

    setModalOpen(false);
    await load();
  };

  const del = async (r) => {
    if (!confirm(`¿Eliminar rol ${r.NombreRol}?`)) return;

    const res = await fetch(`${API_BASE}/api/roles/${r.Id}`, {
      method: "DELETE",
    });

    if (!res.ok) return alert("Error eliminando rol");

    await load();
  };

  // filtro + paginación
  const filtered = roles.filter(
    (r) =>
      r.NombreRol.toLowerCase().includes(search.toLowerCase()) ||
      (r.DescripcionRol || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

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
          <h1 className={styles.title}>Roles</h1>
          <p className={styles.subtitle}>Administra los roles del sistema</p>
        </div>

        <div className={styles.headerRight}>
          <input
            className={styles.search}
            placeholder="Buscar rol…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <button className={styles.primaryBtn} onClick={openNew}>
            + Nuevo Rol
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre Rol</th>
              <th>Descripción</th>
              <th style={{ width: 120 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r) => (
              <tr key={r.Id}>
                <td>{r.NombreRol}</td>
                <td>{r.DescripcionRol}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => openEdit(r)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.dangerBtn}
                      onClick={() => del(r)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {pageItems.length === 0 && (
              <tr>
                <td colSpan={3} className={styles.empty}>
                  No hay roles
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editing ? "Editar Rol" : "Nuevo Rol"}</h3>

            <label>Nombre del Rol</label>
            <input
              value={form.NombreRol}
              onChange={(e) =>
                setForm({ ...form, NombreRol: e.target.value })
              }
            />

            <label>Descripción</label>
            <input
              value={form.DescripcionRol}
              onChange={(e) =>
                setForm({ ...form, DescripcionRol: e.target.value })
              }
            />

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={save}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
