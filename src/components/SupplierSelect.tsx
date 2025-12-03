'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CountryDropdown } from 'react-country-region-selector';
import styles from './supplier.module.css';

/* ========= Tipos ========= */
export interface Proveedor {
  CodigoSAP?: string;
  IdProveedor: string;
  NombreProveedor: string;
  EmailAddress?: string | null;
  Phone1?: string | null;
  Address?: string | null;
  Country?: string | null;
  GroupCode?: number;
  PriceListNum?: number;
  SalesPersonCode?: number;
  U_SYP_BPTD?: string;
  U_SYP_CONTABILIDAD?: string;
  U_SYP_PARTREL?: string;
  U_SYP_TCONTRIB?: string;
  U_SYP_ORIGEN_INGRESO?: string;
  U_SYP_TIPOPAGO?: string;
  U_SYP_FPAGO?: string;
  U_SYP_PAISPAGO?: string;

  // 🆕 campos SOLO HANA
  TipoFacturacion?: string;
  DiasCredito?: number;
  Comentarios?: string;
}


interface ProveedorPickerProps {
  value?: string;
  onChange?: (nombre: string) => void;
  disabled?: boolean;
}

const API_URL = 'https://back-compras-ec.onrender.com/api/proveedores';

/* ========= Type guards ========= */

function isProveedor(obj: unknown): obj is Proveedor {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.IdProveedor === 'string' &&
    typeof o.NombreProveedor === 'string'
  );
}

function isProveedorArray(obj: unknown): obj is Proveedor[] {
  return Array.isArray(obj) && obj.every(isProveedor);
}

function normalizeProveedorList(raw: unknown): Proveedor[] {
  if (isProveedorArray(raw)) return raw;

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'items' in raw &&
    isProveedorArray((raw as { items: unknown }).items)
  ) {
    return (raw as { items: Proveedor[] }).items;
  }

  return [];
}

/* ========= Portal simple ========= */
function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

/* ========= Componente principal ========= */
export default function ProveedorPicker({
  value,
  onChange,
  disabled,
}: ProveedorPickerProps) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // cierra al click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // fetch con debounce
  useEffect(() => {
    let alive = true;

    const t = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const url =
          q.trim().length > 0
            ? `${API_URL}?q=${encodeURIComponent(q.trim())}`
            : API_URL;

        console.log('[ProveedorPicker] GET', url);

        const res = await fetch(url, {
          cache: 'no-store',
        });

        console.log('[ProveedorPicker] status', res.status);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const raw: unknown = await res.json();
        const list = normalizeProveedorList(raw);

        console.log('[ProveedorPicker] proveedores recibidos:', list.length);

        if (alive) {
          setItems(list);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error desconocido';
        console.error('[ProveedorPicker] error al cargar proveedores', msg);
        if (alive) {
          setItems([]);
          setError(msg);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }, 200);

    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [q]);

  const selectedLabel = useMemo(() => value ?? '', [value]);

  const measureAndPlace = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const vh = window.innerHeight;
    const estimated = 360;
    const abreArriba =
      r.bottom + gap + estimated > vh && r.top - gap - estimated > 0;

    const top = abreArriba
      ? Math.max(8, Math.round(r.top - gap - Math.min(estimated, r.top - 8)))
      : Math.round(r.bottom + gap);

    setPanelPos({
      left: Math.round(r.left),
      width: Math.round(r.width),
      top,
    });
  };

  useEffect(() => {
    if (!open) return;
    measureAndPlace();

    const onScroll = () => measureAndPlace();
    const onResize = () => measureAndPlace();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (it: Proveedor) => {
    onChange?.(it.NombreProveedor);
    setOpen(false);
  };

  return (
    <div className={styles.combo} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.input} ${styles.comboToggle}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title="Seleccionar proveedor"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedLabel || 'Seleccionar proveedor'}
        <span className={styles.chev} aria-hidden>
          ▾
        </span>
      </button>

      {open && panelPos && (
        <ModalPortal>
          <div
            ref={panelRef}
            role="listbox"
            className={styles.comboPanel}
            style={{
              position: 'fixed',
              left: panelPos.left,
              top: panelPos.top,
              width: panelPos.width,
              maxHeight: 360,
              zIndex: 9999,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.comboSearchWrap}>
              <input
                autoFocus
                className={styles.comboSearch}
                placeholder="Buscar proveedor (nombre, RUC o código)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Buscar proveedor"
              />
            </div>

            <div className={styles.comboList}>
              {loading && <div className={styles.state}>Cargando…</div>}

              {!loading && error && (
                <div className={styles.state}>
                  Error al cargar proveedores ({error})
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className={styles.state}>Sin resultados</div>
              )}

              {!loading &&
                !error &&
                items.map((it) => (
                  <button
                    type="button"
                    key={`${it.CodigoSAP ?? ''}-${it.IdProveedor}`}
                    className={styles.comboItem}
                    onClick={() => pick(it)}
                  >
                    <div className={styles.comboMain}>
                      <div className={styles.titleLine}>
                        <b className={styles.title}>{it.NombreProveedor}</b>
                      </div>
                      <div className={styles.metaLine}>
                        <span>{it.IdProveedor}</span>
                        <span className={styles.dot}>•</span>
                        <span>{it.CodigoSAP || '—'}</span>
                      </div>
                    </div>
                    <div className={styles.comboSide}>
                      <span className={styles.email}>
                        {it.EmailAddress || '—'}
                      </span>
                    </div>
                  </button>
                ))}
            </div>

            <div className={styles.comboFooter}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => {
                  setOpen(false);
                  setShowCreate(true);
                }}
              >
                + Nuevo proveedor
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {showCreate && (
        <CreateProveedorModal
          onClose={() => setShowCreate(false)}
          onCreated={(nombre) => {
            onChange?.(nombre);
            setShowCreate(false);
            setQ('');
          }}
        />
      )}
    </div>
  );
}

/* ========= Modal de creación ========= */

type CreateForm = Required<
  Pick<
    Proveedor,
    | 'NombreProveedor'
    | 'IdProveedor'
    | 'EmailAddress'
    | 'Phone1'
    | 'Address'
    | 'Country'
    | 'GroupCode'
    | 'PriceListNum'
    | 'SalesPersonCode'
    | 'U_SYP_BPTD'
    | 'U_SYP_CONTABILIDAD'
    | 'U_SYP_PARTREL'
    | 'U_SYP_TCONTRIB'
    | 'U_SYP_ORIGEN_INGRESO'
    | 'U_SYP_TIPOPAGO'
    | 'U_SYP_FPAGO'
    | 'U_SYP_PAISPAGO'
  >
> & {
  // aquí los manejamos como string para el form
  TipoFacturacion: string;
  DiasCredito: string;
  Comentarios: string;
};


interface CreateProveedorModalProps {
  onClose: () => void;
  onCreated?: (nombre: string) => void;
}

function CreateProveedorModal({
  onClose,
  onCreated,
}: CreateProveedorModalProps) {
  const [form, setForm] = useState<CreateForm>({
  NombreProveedor: '',
  IdProveedor: '',
  EmailAddress: '',
  Phone1: '',
  Address: '',
  Country: 'EC',
  GroupCode: 101,
  PriceListNum: 1,
  SalesPersonCode: 5,
  U_SYP_BPTD: 'C',
  U_SYP_CONTABILIDAD: 'SI',
  U_SYP_PARTREL: 'NO',
  U_SYP_TCONTRIB: '10',
  U_SYP_ORIGEN_INGRESO: 'NA',
  U_SYP_TIPOPAGO: '01',
  U_SYP_FPAGO: '20',
  U_SYP_PAISPAGO: 'NA',

  // 🆕
  TipoFacturacion: 'CONTADO',
  DiasCredito: '0',
  Comentarios: '',
});

  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const set = <K extends keyof CreateForm>(k: K, v: CreateForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setErr('');

    if (!form.NombreProveedor.trim() || !form.IdProveedor.trim()) {
      setErr('Nombre y RUC/CI son obligatorios');
      return;
    }

    const payload: Proveedor = {
      ...form,
      GroupCode: form.GroupCode === 102 ? 102 : 101,
      PriceListNum: Number(form.PriceListNum) || 1,
      SalesPersonCode: Number(form.SalesPersonCode) || 5,
      // 🆕 convertir a lo que espera el backend
      TipoFacturacion: form.TipoFacturacion || undefined,
      DiasCredito:
        form.DiasCredito.trim() === '' ? undefined : Number(form.DiasCredito),
      Comentarios: form.Comentarios || undefined,
    };

    setSending(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const raw: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof raw === 'object' &&
          raw !== null &&
          'error' in raw &&
          typeof (raw as { error: unknown }).error === 'string'
            ? (raw as { error: string }).error
            : `Error ${res.status} al crear proveedor`;
        throw new Error(msg);
      }

      const created = isProveedor(raw) ? raw : undefined;
      const nombre = created?.NombreProveedor ?? form.NombreProveedor;
      onCreated?.(nombre);
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : 'Error al crear proveedor';
      setErr(msg);
    } finally {
      setSending(false);
    }
  };

  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const TCONTRIB_OPTIONS = [
    { value: '01', label: '01 - Agente de retención' },
    { value: '02', label: '02 - Artesano' },
    { value: '03', label: '03 - Contribuyente' },
    { value: '04', label: '04 - Contribuyente (Exportador habitual)' },
    { value: '05', label: '05 - Contribuyente especial' },
    { value: '06', label: '06 - Empresa Pública' },
    { value: '07', label: '07 - Extranjero' },
    { value: '08', label: '08 - Fundación sin Fines de Lucro' },
    { value: '09', label: '09 - (Otro)' },
    { value: '99', label: '99 - Ninguno' },
    { value: '10', label: '10 - Local' },
    { value: '11', label: '11 - MicroEmpresa' },
    {
      value: '12',
      label: '12 - Persona Natural (NO obligada a llevar contabilidad)',
    },
    {
      value: '13',
      label: '13 - Persona Natural (Obligada a llevar contabilidad)',
    },
    { value: '14', label: '14 - PN NO obligada (Arriendo Inmuebles)' },
    { value: '15', label: '15 - PN NO obligada (Hon. Profesionales)' },
    { value: '16', label: '16 - PN NO obligada (Liq. Compra o Servicio)' },
    { value: '17', label: '17 - RIMPE (Emprendedores)' },
    { value: '18', label: '18 - RIMPE Negocio Popular' },
    { value: '19', label: '19 - RISE' },
  ];

  const FPAGO_OPTIONS = [
    { value: '01', label: '01 - SIN UTILIZ. DEL SISTEMA FINAN' },
    { value: '02', label: '02 - CHEQUE PROPIO' },
    { value: '03', label: '03 - CHEQUE CERTIFICADO' },
    { value: '04', label: '04 - CHEQUE DE GERENCIA' },
    { value: '05', label: '05 - CHEQUE DEL EXTERIOR' },
    { value: '06', label: '06 - DÉBITO DE CUENTA' },
    { value: '07', label: '07 - TRANSFERENCIA PROPIO BANCO' },
    { value: '08', label: '08 - TRANSF. OTRO BCO NACIONAL' },
    { value: '09', label: '09 - TRANSFERENCIA  BANCO EXTERIOR' },
    { value: '10', label: '10 - TARJETA DE CRÉDITO NACIONAL' },
    { value: '11', label: '11 - TARJETA DE CRÉDITO INTERNAC.' },
    { value: '12', label: '12 - GIRO' },
    { value: '13', label: '13 - DEP EN CTA (CORRIENTE/AHORROS)' },
    { value: '14', label: '14 - ENDOSO DE INVERSIÓN' },
    { value: '15', label: '15 - COMPENSACIÓN DE DEUDAS' },
    { value: '16', label: '16 - TARJETA DE DÉBITO' },
    { value: '17', label: '17 - DINERO ELECTRÓNICO' },
    { value: '18', label: '18 - TARJETA PREPAGO' },
    { value: '19', label: '19 - TARJETA DE CRÉDITO' },
    { value: '20', label: '20 - OTROS CON UTILIZ DE SIST FINAN' },
  ];

  return (
    <ModalPortal>
      <div
        className={styles.modalOverlay}
        onMouseDown={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modal} onMouseDown={stop}>
          <div className={styles.modalHeader}>
            <div className={styles.hTitle}>Nuevo proveedor</div>
            <div className={styles.hSub}>
              Completa los campos marcados con{' '}
              <span className={styles.req}>*</span>
            </div>
          </div>

          <form onSubmit={submit} className={styles.formGrid}>
            {/* Identificación */}
            <div className={styles.sectionTitle}>Identificación</div>

            <label className={styles.field}>
              <span className={styles.label}>
                Nombre<span className={styles.req}>*</span>
              </span>
              <input
                className={styles.input}
                value={form.NombreProveedor}
                onChange={(e) => set('NombreProveedor', e.target.value)}
                required
                placeholder="Razón social / Nombre"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>
                RUC/CI<span className={styles.req}>*</span>
              </span>
              <input
                className={styles.input}
                value={form.IdProveedor}
                onChange={(e) => set('IdProveedor', e.target.value)}
                required
                placeholder="Ej. 1790012345001"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input
                type="email"
                className={styles.input}
                value={form.EmailAddress}
                onChange={(e) => set('EmailAddress', e.target.value)}
                placeholder="contacto@empresa.com"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Teléfono</span>
              <input
                className={styles.input}
                value={form.Phone1}
                onChange={(e) => set('Phone1', e.target.value)}
                placeholder="+593 99 999 9999"
              />
            </label>

            <label className={`${styles.field} ${styles.span2}`}>
              <span className={styles.label}>Dirección</span>
              <input
                className={styles.input}
                value={form.Address}
                onChange={(e) => set('Address', e.target.value)}
                placeholder="Calle / Nro / Referencia"
              />
            </label>

            {/* Ubicación y grupo */}
            <div className={styles.sectionTitle}>Ubicación y grupo</div>

            <label className={styles.field}>
              <span className={styles.label}>País</span>
              <CountryDropdown
                value={form.Country ?? ''}
                onChange={(v) =>
                  set('Country', (v || 'EC').toString().toUpperCase())
                }
                valueType="short"
                className={styles.input}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Grupo</span>
              <select
                className={styles.input}
                value={form.GroupCode === 102 ? '2' : '1'}
                onChange={(e) =>
                  set('GroupCode', e.target.value === '2' ? 102 : 101)
                }
              >
                <option value="1">1. Locales</option>
                <option value="2">2. Exterior</option>
              </select>
            </label>

            {/* Condiciones */}
<div className={styles.sectionTitle}>Condiciones</div>

<label className={styles.field}>
  <span className={styles.label}>Lista de precios</span>
  <input
    type="text"
    className={`${styles.input} ${styles.inputReadonly}`}
    value="L.DEFAULT ORIGINAL"
    readOnly
  />
</label>

<label className={styles.field}>
  <span className={styles.label}>Encargado de Compras</span>
  <input
    type="text"
    className={`${styles.input} ${styles.inputReadonly}`}
    value="BIOCELLS DISCOVERIES INTERNACIONAL"
    readOnly
  />
  <small className={styles.hint}>
    Se enviará el código 5 al backend
  </small>
</label>

{/* 🆕 Crédito y facturación */}
<label className={styles.field}>
  <span className={styles.label}>Tipo de facturación</span>
  <select
    className={styles.input}
    value={form.TipoFacturacion}
    onChange={(e) => set('TipoFacturacion', e.target.value)}
  >
    <option value="CONTADO">Contado</option>
    <option value="CREDITO">Crédito</option>
    <option value="MIXTO">Mixto</option>
  </select>
</label>

<label className={styles.field}>
  <span className={styles.label}>Días de crédito</span>
  <input
    type="number"
    min={0}
    className={styles.input}
    value={form.DiasCredito}
    onChange={(e) => set('DiasCredito', e.target.value)}
    placeholder="Ej. 30"
  />
</label>

<label className={`${styles.field} ${styles.span2}`}>
  <span className={styles.label}>Comentarios (nº cuenta / notas)</span>
  <textarea
    className={styles.textarea}
    rows={3}
    value={form.Comentarios}
    onChange={(e) => set('Comentarios', e.target.value)}
    placeholder="Ej. Cuenta Produbanco 1234567890, contacto, horarios, etc."
  />
</label>


            {/* Tributario */}
            <div className={styles.sectionTitle}>Tributario</div>

            <label className={styles.field}>
              <span className={styles.label}>Tipo de Documento</span>
              <select
                className={styles.input}
                value={form.U_SYP_BPTD ?? ''}
                onChange={(e) =>
                  set('U_SYP_BPTD', e.target.value.toUpperCase())
                }
              >
                <option value="">-</option>
                <option value="C">C - CÉDULA</option>
                <option value="R">R - RUC</option>
                <option value="P">P - PASAPORTE</option>
                <option value="F">F - CONSUMIDOR FINAL</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>¿Maneja Contabilidad?</span>
              <select
                className={styles.input}
                value={form.U_SYP_CONTABILIDAD ?? 'SI'}
                onChange={(e) => set('U_SYP_CONTABILIDAD', e.target.value)}
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Tipo de Contribuyente</span>
              <select
                className={styles.input}
                value={form.U_SYP_TCONTRIB ?? '10'}
                onChange={(e) => set('U_SYP_TCONTRIB', e.target.value)}
                required
              >
                {TCONTRIB_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Forma de Pago</span>
              <select
                className={styles.input}
                value={form.U_SYP_FPAGO ?? '20'}
                onChange={(e) =>
                  set('U_SYP_FPAGO', e.target.value.padStart(2, '0'))
                }
                required
              >
                {FPAGO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {err && (
              <div className={`${styles.alertError} ${styles.span2}`}>
                {err}
              </div>
            )}

            <div className={`${styles.modalActions} ${styles.span2}`}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.btn} disabled={sending}>
                {sending ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
