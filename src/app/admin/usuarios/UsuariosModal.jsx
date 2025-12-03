"use client";

import { useEffect, useState } from "react";
import styles from "./usuarios.module.css";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function UsuariosModal({ open, onClose, onSaved, usuario }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rolId, setRolId] = useState("");
  const [deptoId, setDeptoId] = useState("");
  const [roles, setRoles] = useState([]);
  const [deptos, setDeptos] = useState([]);

  useEffect(() => {
    loadRoles();
    loadDeptos();

    if (usuario) {
      setNombre(usuario.Nombre);
      setCorreo(usuario.Correo);
      setRolId(usuario.RolId);
      setDeptoId(usuario.DepartamentoId);
    } else {
      setNombre("");
      setCorreo("");
      setRolId("");
      setDeptoId("");
    }
  }, [usuario]);

  const loadRoles = async () => {
    const res = await fetch(`${API_BASE}/api/roles`);
    const data = await res.json();
    setRoles(data);
  };

  const loadDeptos = async () => {
    const res = await fetch(`${API_BASE}/api/departamentos`);
    const data = await res.json();
    setDeptos(data);
  };

  const save = async () => {
    const body = {
      Nombre: nombre,
      Correo: correo,
      RolId: Number(rolId),
      DepartamentoId: Number(deptoId),
    };

    const url = usuario
      ? `${API_BASE}/api/users/${usuario.Id}`
      : `${API_BASE}/api/users`;

    const res = await fetch(url, {
      method: usuario ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onSaved();
    } else {
      alert("Error al guardar usuario");
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>{usuario ? "Editar Usuario" : "Nuevo Usuario"}</h3>

        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <label>Correo</label>
        <input value={correo} onChange={(e) => setCorreo(e.target.value)} />

        <label>Rol</label>
        <select value={rolId} onChange={(e) => setRolId(e.target.value)}>
          <option value="">Seleccione…</option>
          {roles.map((r) => (
            <option key={r.Id} value={r.Id}>
              {r.NombreRol}
            </option>
          ))}
        </select>

        <label>Departamento</label>
        <select value={deptoId} onChange={(e) => setDeptoId(e.target.value)}>
          <option value="">Seleccione…</option>
          {deptos.map((d) => (
            <option key={d.Id} value={d.Id}>
              {d.Nombre}
            </option>
          ))}
        </select>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveBtn} onClick={save}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
