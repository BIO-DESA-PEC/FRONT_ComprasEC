"use client";
import { useState, useMemo, useCallback } from "react";
import styles from "../../preorden.module.css";
import {
  replacePreOCDetail,
  splitPreOC,
  requestOCApproval,
  updatePreOCPago,
} from "@/app/lib/backend";
import ProveedorPicker from "@/components/SupplierSelect";

const IVA_PCT_DEFAULT = 15;

const FP_OPTS = [
  { value: "01", label: "01 - Contado" },
  { value: "20", label: "20 - Crédito" },
  { value: "99", label: "99 - Otra" },
];

function num(v) {
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

function recalcRow(row) {
  const cant = num(row.Cantidad);
  const precio = num(row.Precio);
  const desc = num(row.Descuento);
  const base = Math.max(0, cant * precio - desc);
  const ivaPct =
    row.IvaPct === "" || row.IvaPct == null
      ? IVA_PCT_DEFAULT
      : num(row.IvaPct);
  const iva = +(base * (ivaPct / 100)).toFixed(2);
  const total = +(base + iva).toFixed(2);
  return {
    ...row,
    IvaPct: ivaPct,
    Iva: iva,
    Total: total,
    __base: +base.toFixed(2),
  };
}

const EMPTY_ROW = {
  NumeroArticulo: "",
  Proveedor: "",
  ProveedorId: "",
  EmailAddress: "",
  Phone1: "",
  FechaNecesaria: "",
  Cantidad: 1,
  Precio: 0,
  Descuento: 0,
  IvaPct: IVA_PCT_DEFAULT,
  Iva: 0,
  Total: 0,
  DiasPago: 0,
  FormaPago: "01",
};

export default function PreOCEditor({ preoc, detalleInicial }) {
  const [diasPagoGlobal, setDiasPagoGlobal] = useState(preoc?.DiasPago ?? 0);
  const [formaPagoGlobal, setFormaPagoGlobal] = useState(
    preoc?.FormaPago || "01"
  );
  const [detalle, setDetalle] = useState(
    (detalleInicial || []).map((d) =>
      recalcRow({
        FormaPago: d.FormaPago ?? "01",
        ...d,
      })
    )
  );

  const [estado, setEstado] = useState(preoc?.Estado || "BORRADOR");
  const editable = estado === "BORRADOR";

  const totals = useMemo(() => {
    const sub = detalle.reduce((s, r) => s + num(r.__base), 0);
    const iva = detalle.reduce((s, r) => s + num(r.Iva), 0);
    const tot = detalle.reduce((s, r) => s + num(r.Total), 0);
    return {
      sub: +sub.toFixed(2),
      iva: +iva.toFixed(2),
      tot: +tot.toFixed(2),
    };
  }, [detalle]);

  const onChange = useCallback((i, field, value) => {
    setDetalle((prev) => {
      const rows = [...prev];
      let next = { ...rows[i], [field]: value };
      if (["Cantidad", "Precio", "Descuento", "IvaPct"].includes(field)) {
        next[field] = value === "" ? 0 : num(value);
      }
      rows[i] = recalcRow(next);
      return rows;
    });
  }, []);

  const addRow = useCallback(
    () =>
      setDetalle((d) => [
        ...d,
        recalcRow({
          ...EMPTY_ROW,
          DiasPago: diasPagoGlobal ?? 0,
          FormaPago: formaPagoGlobal || "01",
        }),
      ]),
    [diasPagoGlobal, formaPagoGlobal]
  );

  const removeRow = useCallback(
    (i) => setDetalle((d) => d.filter((_, k) => k !== i)),
    []
  );

  const guardarCabecera = useCallback(async () => {
    await updatePreOCPago(preoc.IdPreOC, {
      DiasPago: Number(diasPagoGlobal || 0),
      FormaPago: formaPagoGlobal || "01",
    });
    alert("Cabecera de Pre-Orden actualizada (días/forma).");
  }, [preoc.IdPreOC, diasPagoGlobal, formaPagoGlobal]);

  const guardarDetalle = useCallback(async () => {
    await replacePreOCDetail(preoc.IdPreOC, detalle);
    alert("Detalle de Pre-Orden guardado.");
  }, [detalle, preoc.IdPreOC]);

  const crearOCs = useCallback(async () => {
    if (!editable) {
      alert(`La Pre-Orden está en estado ${estado}.`);
      return;
    }
    const r = await splitPreOC(preoc.IdPreOC);
    if (!r?.ok || !r?.created?.length) {
      alert(r?.error || "No se pudieron crear OCs.");
      return;
    }
    try {
      for (const oc of r.created) {
        await requestOCApproval(oc.IdOC, { autoApprove: false });
      }
    } catch {}
    setEstado("SEPARADA");
    window.location.href = `/ordenes/${r.created[0].IdOC}`;
  }, [editable, estado, preoc.IdPreOC]);

  return (
    <div className={`${styles.ocTheme} ${styles.preordenRoot}`}>
      {/* === CARD SUPERIOR: TOTAL PRE-ORDEN (similar a TOTAL ORDEN) === */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div>
            <div className={styles.summaryLabel}>Total Pre-Orden</div>
            <div className={styles.summaryAmount}>
              {totals.tot.toLocaleString("es-EC", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className={styles.summaryStatus}>
            <span className={styles.muted}>
              {editable ? "Edición habilitada" : "Edición bloqueada"}
            </span>
          </div>
        </div>

        {/* Fila: días crédito + forma pago + botón (como OC) */}
        <div className={styles.summaryControls}>
          <label className={styles.modeItem}>
            Días de crédito (global):
            <input
              className={`${styles.input} ${styles.inputNum}`}
              type="number"
              min={0}
              value={diasPagoGlobal}
              onChange={(e) =>
                setDiasPagoGlobal(Number(e.target.value || 0))
              }
              disabled={!editable}
            />
          </label>

          <label className={styles.modeItem}>
            Forma de pago (global):
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={formaPagoGlobal}
                onChange={(e) => setFormaPagoGlobal(e.target.value)}
                disabled={!editable}
              >
                {FP_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className={styles.summarySpacer} />

          <button
            className={styles.primary}
            type="button"
            onClick={guardarCabecera}
            disabled={!editable}
          >
            Guardar días de crédito
          </button>
        </div>
      </div>

      {/* === CARD PRINCIPAL: tabla + botones === */}
      <div className={styles.card}>
        {/* Barra de acciones superiores (similar OC, pero para Pre-Orden) */}
        <div className={styles.actions}>
          <div className={styles.leftTools}>
            {/* puedes agregar algo aquí si necesitas */}
          </div>
          <div className={styles.right}>
            {editable ? (
              <>
                <button
                  className={styles.secondary}
                  type="button"
                  onClick={addRow}
                >
                  Agregar línea
                </button>
                <button
                  className={styles.secondary}
                  type="button"
                  onClick={guardarDetalle}
                >
                  Guardar detalle
                </button>
                <button
                  className={styles.primary}
                  type="button"
                  onClick={crearOCs}
                >
                  Crear OCs por proveedor
                </button>
              </>
            ) : (
              <span className={styles.muted}>
                Pre-Orden {estado} (no editable)
              </span>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colArticulo}>Artículo / Servicio</th>
                <th className={styles.colProveedor}>Proveedor</th>
                <th className={styles.colFecha}>Fecha necesaria</th>
                <th className={styles.colCant}>Cant.</th>
                <th className={styles.colPrecio}>Precio</th>
                <th className={styles.colDesc}>Desc.</th>
                <th className={styles.colIvaPct}>IVA %</th>
                <th className={styles.colDias}>Días crédito</th>
                <th className={styles.colForma}>Forma pago</th>
                <th className={styles.colIva}>IVA</th>
                <th className={styles.colTotal}>Total</th>
                <th className={styles.colActions}></th>
              </tr>
            </thead>
            <tbody>
              {detalle.map((r, i) => (
                <tr key={i}>
                  <td className={styles.colArticulo}>
                    <input
                      className={styles.input}
                      disabled={!editable}
                      value={r.NumeroArticulo || ""}
                      onChange={(e) =>
                        onChange(i, "NumeroArticulo", e.target.value)
                      }
                      placeholder="Artículo/Servicio…"
                    />
                  </td>
                  <td className={styles.colProveedor}>
                    <div className={styles.proveedorWrapper}>
                      <ProveedorPicker
                        disabled={!editable}
                        value={r.Proveedor || ""}
                        onChange={(nombre) =>
                          onChange(i, "Proveedor", nombre)
                        }
                      />
                    </div>
                  </td>
                  <td className={styles.colFecha}>
                    <input
                      type="date"
                      className={styles.input}
                      disabled={!editable}
                      value={r.FechaNecesaria || ""}
                      onChange={(e) =>
                        onChange(i, "FechaNecesaria", e.target.value)
                      }
                    />
                  </td>
                  <td className={styles.colCant}>
                    <input
                      className={`${styles.input} ${styles.inputNum}`}
                      disabled={!editable}
                      type="number"
                      value={r.Cantidad ?? 1}
                      onChange={(e) =>
                        onChange(i, "Cantidad", e.target.value)
                      }
                    />
                  </td>
                  <td className={styles.colPrecio}>
                    <input
                      className={`${styles.input} ${styles.inputNum}`}
                      disabled={!editable}
                      type="number"
                      value={r.Precio ?? 0}
                      onChange={(e) =>
                        onChange(i, "Precio", e.target.value)
                      }
                    />
                  </td>
                  <td className={styles.colDesc}>
                    <input
                      className={`${styles.input} ${styles.inputNum}`}
                      disabled={!editable}
                      type="number"
                      value={r.Descuento ?? 0}
                      onChange={(e) =>
                        onChange(i, "Descuento", e.target.value)
                      }
                    />
                  </td>
                  <td className={styles.colIvaPct}>
                    <input
                      className={`${styles.input} ${styles.inputNum}`}
                      disabled={!editable}
                      type="number"
                      value={r.IvaPct ?? 15}
                      onChange={(e) =>
                        onChange(i, "IvaPct", e.target.value)
                      }
                    />
                  </td>
                  <td className={styles.colDias}>
                    <input
                      className={`${styles.input} ${styles.inputNum}`}
                      disabled={!editable}
                      type="number"
                      min={0}
                      value={r.DiasPago ?? 0}
                      onChange={(e) =>
                        onChange(i, "DiasPago", e.target.value)
                      }
                    />
                  </td>
                  <td className={styles.colForma}>
                    <div className={styles.selectWrap}>
                      <select
                        className={styles.select}
                        disabled={!editable}
                        value={r.FormaPago || "01"}
                        onChange={(e) =>
                          onChange(i, "FormaPago", e.target.value)
                        }
                      >
                        {FP_OPTS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className={styles.colIva}>
                    <div className={styles.num}>
                      {Number(r.Iva || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className={styles.colTotal}>
                    <div className={styles.num}>
                      {Number(r.Total || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className={styles.colActions}>
                    <button
                      disabled={!editable}
                      className={styles.linkBtn}
                      type="button"
                      onClick={() => removeRow(i)}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className={styles.totals}>
          <div className={styles.totalBox}>
            <div className={styles.totalLabel}>Subtotal</div>
            <div className={styles.totalValue}>
              {totals.sub.toFixed(2)}
            </div>
          </div>
          <div className={styles.totalBox}>
            <div className={styles.totalLabel}>IVA</div>
            <div className={styles.totalValue}>
              {totals.iva.toFixed(2)}
            </div>
          </div>
          <div
            className={`${styles.totalBox} ${styles.totalBoxEm}`}
          >
            <div className={styles.totalLabel}>Total</div>
            <div className={styles.totalValue}>
              {totals.tot.toFixed(2)}
            </div>
          </div>
        </div>

        <p className={styles.muted} style={{ marginTop: 8 }}>
          * Edición solo disponible en estado BORRADOR.
        </p>
      </div>
    </div>
  );
}
