import { useState, useEffect } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────

const TIPOS = [
  { id: "afo",        label: "Regularización / AFO / SAFO",         emoji: "📋" },
  { id: "obra_nueva", label: "Proyecto de obra nueva",               emoji: "🏗️" },
  { id: "reforma",    label: "Reforma / Legalización",               emoji: "🔧" },
  { id: "direccion",  label: "Dirección de obra / Rep. cliente",     emoji: "👷" },
  { id: "urbanismo",  label: "Consultoría urbanística",              emoji: "🗺️" },
  { id: "peritaje",   label: "Peritaje / Informe técnico",           emoji: "🔍" },
];

const FASES_POR_TIPO = {
  afo: [
    { id: "diagnostico",  label: "Diagnóstico y visita de campo",            default: true },
    { id: "informe",      label: "Informe técnico de regularización",         default: true },
    { id: "safo",         label: "Tramitación SAFO ante Ayuntamiento",        default: true },
    { id: "catastro",     label: "Coordinación Catastro-Registro",            default: false },
    { id: "seguimiento",  label: "Seguimiento hasta resolución",              default: false },
  ],
  obra_nueva: [
    { id: "avance",       label: "Estudio previo / Anteproyecto",             default: true },
    { id: "basico",       label: "Proyecto Básico",                           default: true },
    { id: "ejecucion",    label: "Proyecto de Ejecución",                     default: true },
    { id: "actividad",    label: "Proyecto de Actividad / Instalaciones",     default: false },
    { id: "do",           label: "Dirección de Obra",                         default: false },
    { id: "dif",          label: "Dirección de Ejecución (DIF)",              default: false },
    { id: "lpo",          label: "Legalización / Licencia 1ª Ocupación",      default: true },
  ],
  reforma: [
    { id: "diagnostico",  label: "Visita y diagnóstico técnico",              default: true },
    { id: "proyecto",     label: "Proyecto de reforma / legalización",        default: true },
    { id: "licencia",     label: "Tramitación de licencia",                   default: true },
    { id: "do",           label: "Dirección de Obra",                         default: false },
    { id: "cert_final",   label: "Certificado final de obra",                 default: false },
  ],
  direccion: [
    { id: "rep_cliente",  label: "Representación del cliente (contratista)",  default: true },
    { id: "revision_cert",label: "Revisión de certificaciones",               default: true },
    { id: "control",      label: "Control de calidad y visitas",              default: true },
    { id: "informes",     label: "Informes periódicos al cliente",            default: false },
    { id: "recepcion",    label: "Acta de recepción y liquidación final",     default: false },
  ],
  urbanismo: [
    { id: "analisis",     label: "Análisis urbanístico del solar / finca",    default: true },
    { id: "informe",      label: "Informe de viabilidad",                     default: true },
    { id: "consulta",     label: "Consulta previa ante Ayuntamiento",         default: false },
    { id: "modificacion", label: "Tramitación de modificación / excepciones", default: false },
  ],
  peritaje: [
    { id: "visita",       label: "Visita e inspección técnica",               default: true },
    { id: "informe",      label: "Informe pericial",                          default: true },
    { id: "ratificacion", label: "Ratificación en juzgado (si procede)",      default: false },
    { id: "adenda",       label: "Adenda / informe complementario",           default: false },
  ],
};

const IVA = 0.21;
const STORAGE_KEY = "liam_propuestas_historial";
const CONFIG_KEY  = "liam_config";

const DEFAULT_PAGOS = [
  { hito: "Firma del encargo / inicio de trabajos", pct: "40" },
  { hito: "Entrega de documentación técnica",       pct: "40" },
  { hito: "Resolución / entrega final",             pct: "20" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const eur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);

const today = () => new Date().toISOString().slice(0, 10);

const shortId = () => Math.random().toString(36).slice(2, 7).toUpperCase();

const loadLS  = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
const saveLS  = (key, val)      => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── Styles (shared) ────────────────────────────────────────────────────────

const inputSx = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1.5px solid #E5E7EB", fontSize: 13, color: "#111827",
  background: "#FAFAFA", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const btnPrimary = {
  border: "none", borderRadius: 10, padding: "12px 0", width: "100%",
  background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
};

const btnSecondary = {
  border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "11px 0",
  background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer",
};

// ─── Spinner ────────────────────────────────────────────────────────────────

function Spinner({ label = "Generando…" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#6B7280", fontSize: 13 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        style={{ animation: "lp-spin 0.9s linear infinite", flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" stroke="#E5E7EB" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ msg, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 60}px)`,
      background: "#111827", color: "#fff", padding: "10px 20px",
      borderRadius: 30, fontSize: 13, fontWeight: 600,
      transition: "transform 0.25s ease", pointerEvents: "none",
      zIndex: 999, whiteSpace: "nowrap",
    }}>{msg}</div>
  );
}

// ─── TabBar ─────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }) {
  const tabs = [
    { id: "nueva",     label: "Nueva propuesta" },
    { id: "historial", label: "Historial" },
    { id: "config",    label: "Configuración" },
  ];
  return (
    <div style={{ display: "flex", borderBottom: "1.5px solid #E5E7EB", marginBottom: 24 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: "10px 18px", fontSize: 13,
          fontWeight: active === t.id ? 700 : 500,
          color: active === t.id ? "#2563EB" : "#6B7280",
          background: "none", border: "none",
          borderBottom: active === t.id ? "2px solid #2563EB" : "2px solid transparent",
          cursor: "pointer", marginBottom: -2,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ─── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ step }) {
  const steps = ["Tipo", "Datos", "Propuesta"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      {steps.map((s, i) => {
        const idx = i + 1, done = step > idx, active = step === idx;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#2563EB" : active ? "#EFF6FF" : "#F3F4F6",
                border: active ? "2px solid #2563EB" : "none",
                color: done ? "#fff" : active ? "#2563EB" : "#9CA3AF",
                fontSize: 11, fontWeight: 700,
              }}>{done ? "✓" : idx}</div>
              <span style={{ fontSize: 10, color: active ? "#2563EB" : "#9CA3AF", marginTop: 3, fontWeight: active ? 600 : 400 }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "#2563EB" : "#E5E7EB", margin: "0 6px", marginBottom: 14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Tipo ───────────────────────────────────────────────────────────

function StepTipo({ value, onChange }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>Selecciona el tipo de encargo</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {TIPOS.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            padding: "13px 14px", borderRadius: 10, textAlign: "left", lineHeight: 1.4,
            border: value === t.id ? "2px solid #2563EB" : "1.5px solid #E5E7EB",
            background: value === t.id ? "#EFF6FF" : "#fff",
            color: value === t.id ? "#1D4ED8" : "#374151",
            fontWeight: value === t.id ? 700 : 400, fontSize: 12.5, cursor: "pointer",
          }}>
            <span style={{ fontSize: 16, display: "block", marginBottom: 4 }}>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Datos ──────────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: hint ? 2 : 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, marginTop: 0 }}>{hint}</p>}
      {children}
    </div>
  );
}

function StepDatos({ tipo, datos, onChange, fases, onToggleFase, pagos, idioma, onIdioma }) {
  const tipoObj = TIPOS.find(t => t.id === tipo);
  const fasesActivas = (FASES_POR_TIPO[tipo] || []).filter(f => fases[f.id] ?? f.default);
  const totalNeto = fasesActivas.reduce((a, f) => a + (parseFloat(datos[`hon_${f.id}`]) || 0), 0);
  const pctTotal  = pagos.reduce((a, p) => a + (parseFloat(p.pct) || 0), 0);

  return (
    <div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", color: "#1D4ED8", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginBottom: 18 }}>
        {tipoObj?.emoji} {tipoObj?.label}
      </div>

      {/* Idioma */}
      <Field label="Idioma de la propuesta">
        <div style={{ display: "flex", gap: 8 }}>
          {[["es","🇪🇸 Español"],["en","🇬🇧 English"],["both","🇪🇸+🇬🇧 Bilingüe"]].map(([v,l]) => (
            <button key={v} onClick={() => onIdioma(v)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12,
              fontWeight: idioma === v ? 700 : 400,
              border: idioma === v ? "2px solid #2563EB" : "1.5px solid #E5E7EB",
              background: idioma === v ? "#EFF6FF" : "#fff",
              color: idioma === v ? "#1D4ED8" : "#374151", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
      </Field>

      <Field label="Referencia / nombre del proyecto">
        <input style={inputSx} value={datos.nombre || ""} onChange={e => onChange("nombre", e.target.value)} placeholder="ej. Vafaey – Calle Las Palmeras 23" />
      </Field>
      <Field label="Cliente">
        <input style={inputSx} value={datos.cliente || ""} onChange={e => onChange("cliente", e.target.value)} placeholder="Nombre completo o empresa" />
      </Field>
      <Field label="Dirección del inmueble">
        <input style={inputSx} value={datos.direccion || ""} onChange={e => onChange("direccion", e.target.value)} placeholder="Calle, número, municipio" />
      </Field>

      {["obra_nueva","reforma"].includes(tipo) && (
        <Field label="Superficie aproximada (m²)">
          <input style={inputSx} type="number" value={datos.superficie || ""} onChange={e => onChange("superficie", e.target.value)} placeholder="ej. 185" />
        </Field>
      )}
      {["obra_nueva","reforma","direccion"].includes(tipo) && (
        <Field label="PEM estimado (€)" hint="Presupuesto de ejecución material">
          <input style={inputSx} type="number" value={datos.pem || ""} onChange={e => onChange("pem", e.target.value)} placeholder="ej. 280000" />
        </Field>
      )}

      <Field label="Fecha de emisión">
        <input style={inputSx} type="date" value={datos.fecha || today()} onChange={e => onChange("fecha", e.target.value)} />
      </Field>

      {/* Fases */}
      <Field label="Fases incluidas">
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {(FASES_POR_TIPO[tipo] || []).map(f => (
            <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#374151" }}>
              <input type="checkbox" checked={fases[f.id] ?? f.default} onChange={() => onToggleFase(f.id)}
                style={{ accentColor: "#2563EB", width: 15, height: 15, flexShrink: 0 }} />
              {f.label}
            </label>
          ))}
        </div>
      </Field>

      {/* Honorarios por fase */}
      <Field label="Honorarios por fase (€ sin IVA)">
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {fasesActivas.map(f => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 12, color: "#6B7280" }}>{f.label}</span>
              <input type="number" value={datos[`hon_${f.id}`] || ""} onChange={e => onChange(`hon_${f.id}`, e.target.value)}
                placeholder="0" style={{ width: 90, padding: "7px 10px", borderRadius: 7, border: "1.5px solid #E5E7EB", fontSize: 13, textAlign: "right", background: "#FAFAFA", outline: "none" }} />
            </div>
          ))}
        </div>
        {totalNeto > 0 && (
          <div style={{ marginTop: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 3 }}><span>Base imponible</span><span>{eur(totalNeto)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 3 }}><span>IVA 21%</span><span>{eur(totalNeto * IVA)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#15803D" }}><span>Total</span><span>{eur(totalNeto * (1 + IVA))}</span></div>
          </div>
        )}
      </Field>

      {/* Condiciones de pago */}
      <Field label="Condiciones de pago">
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {pagos.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input value={p.hito} onChange={e => { const n=[...pagos]; n[i]={...p,hito:e.target.value}; onChange("__pagos",n); }}
                placeholder="Hito de pago" style={{ ...inputSx, flex: 2, marginBottom: 0 }} />
              <input type="number" value={p.pct} onChange={e => { const n=[...pagos]; n[i]={...p,pct:e.target.value}; onChange("__pagos",n); }}
                placeholder="%" style={{ width: 60, padding: "9px 10px", borderRadius: 8, border: "1.5px solid #E5E7EB", fontSize: 13, textAlign: "right", background: "#FAFAFA", outline: "none" }} />
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>%</span>
              <button onClick={() => onChange("__pagos", pagos.filter((_,j)=>j!==i))}
                style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:18, lineHeight:1, padding:0 }}>×</button>
            </div>
          ))}
          <button onClick={() => onChange("__pagos",[...pagos,{hito:"",pct:""}])}
            style={{ fontSize:12, color:"#2563EB", background:"none", border:"1.5px dashed #BFDBFE", borderRadius:8, padding:"7px 0", cursor:"pointer", fontWeight:600 }}>
            + Añadir hito de pago
          </button>
          <p style={{ fontSize:11, color: pctTotal===100 ? "#15803D" : "#EF4444", margin:0, fontWeight:600 }}>
            Suma: {pctTotal}% {pctTotal===100 ? "✓" : "(debe sumar 100%)"}
          </p>
        </div>
      </Field>

      <Field label="Notas para la IA" hint="Instrucciones específicas, cláusulas, contexto del cliente…">
        <textarea value={datos.notas || ""} onChange={e => onChange("notas", e.target.value)} rows={3}
          placeholder="ej. cliente anglófono, añadir cláusula de revisión si el alcance cambia…"
          style={{ ...inputSx, resize:"vertical" }} />
      </Field>
    </div>
  );
}

// ─── Step 3: Editor ──────────────────────────────────────────────────────────

function StepPropuesta({ texto, onChange }) {
  return (
    <div>
      <p style={{ fontSize:12, color:"#6B7280", marginBottom:10 }}>Edita el borrador directamente. Luego copia o descarga como PDF.</p>
      <textarea value={texto} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", minHeight:520, padding:16, borderRadius:10, border:"1.5px solid #E5E7EB",
          fontSize:13, lineHeight:1.75, color:"#111827", background:"#FAFAFA", outline:"none",
          resize:"vertical", boxSizing:"border-box", fontFamily:"Georgia, serif" }} />
    </div>
  );
}

// ─── Historial ──────────────────────────────────────────────────────────────

function Historial({ onLoad, onToast }) {
  const [lista, setLista] = useState(() => loadLS(STORAGE_KEY, []));

  const borrar = (id) => {
    const next = lista.filter(p => p.id !== id);
    setLista(next); saveLS(STORAGE_KEY, next); onToast("Propuesta eliminada");
  };

  if (!lista.length) return (
    <div style={{ textAlign:"center", padding:"48px 0", color:"#9CA3AF" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>📂</div>
      <p style={{ fontSize:14 }}>Aún no has guardado ninguna propuesta.</p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {lista.slice().reverse().map(p => (
        <div key={p.id} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:12, padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
            <div>
              <p style={{ margin:0, fontWeight:700, fontSize:14, color:"#111827" }}>{p.nombre}</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"#6B7280" }}>{p.tipo} · {p.fecha} · {p.total}</p>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <button onClick={() => onLoad(p)} style={{ fontSize:11, padding:"5px 10px", borderRadius:7, border:"1.5px solid #2563EB", background:"#EFF6FF", color:"#1D4ED8", cursor:"pointer", fontWeight:600 }}>Cargar</button>
              <button onClick={() => borrar(p.id)} style={{ fontSize:11, padding:"5px 10px", borderRadius:7, border:"1.5px solid #FEE2E2", background:"#FEF2F2", color:"#DC2626", cursor:"pointer" }}>✕</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Configuración ──────────────────────────────────────────────────────────

function Configuracion({ config, onChange }) {
  const field = (label, key, placeholder) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</label>
      <input style={inputSx} value={config[key]||""} onChange={e => onChange(key, e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <div>
      <p style={{ fontSize:13, color:"#6B7280", marginBottom:18 }}>Datos que aparecen en todas las propuestas.</p>

      {field("Nombre profesional",    "nombre",      "Liam Phelan")}
      {field("Estudio / razón social","estudio",     "Liam Arquitectura")}
      {field("Colegiación",           "colegiacion", "COAMÁLAGA nº 1620")}
      {field("Email",                 "email",       "info@liamArquitectura.es")}
      {field("Teléfono",              "telefono",    "+34 600 000 000")}
      {field("NIF / NIE",             "nif",         "XXXXXXXXX")}
      {field("Dirección profesional", "dir_pro",     "Málaga, España")}

      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" }}>Cláusula de pie de propuesta</label>
        <textarea value={config.clausula||""} onChange={e => onChange("clausula", e.target.value)} rows={3}
          placeholder="Los presentes honorarios podrán revisarse si el alcance varía sustancialmente…"
          style={{ ...inputSx, resize:"vertical" }} />
      </div>
      <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#15803D" }}>
        ✓ Los cambios se guardan automáticamente en este navegador.
      </div>
    </div>
  );
}

// ─── PDF export ──────────────────────────────────────────────────────────────

function imprimirPDF(texto, nombre) {
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>${nombre || "Propuesta honorarios"}</title>
    <style>
      body { font-family: Georgia, serif; font-size: 13px; line-height: 1.8; color: #111;
             max-width: 680px; margin: 40px auto; padding: 0 24px; }
      pre  { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
      @media print { @page { margin: 28mm 20mm; } }
    </style></head><body>
    <pre>${texto.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
    <script>window.onload=()=>{ window.print(); }<\/script>
    </body></html>`);
  win.document.close();
}

// ─── AI prompt builder ───────────────────────────────────────────────────────

function buildPrompt(tipo, datos, fases, pagos, idioma, config) {
  const tipoLabel    = TIPOS.find(t => t.id === tipo)?.label || tipo;
  const fasesActivas = (FASES_POR_TIPO[tipo] || []).filter(f => fases[f.id] ?? f.default);
  const totalNeto    = fasesActivas.reduce((a, f) => a + (parseFloat(datos[`hon_${f.id}`]) || 0), 0);
  const totalIVA     = totalNeto * IVA;

  const fasesTexto = fasesActivas.map(f => {
    const h = parseFloat(datos[`hon_${f.id}`]) || 0;
    return `  - ${f.label}: ${h > 0 ? eur(h) + " + IVA" : "(importe pendiente)"}`;
  }).join("\n");

  const pagosTexto = pagos.map(p => `  - ${p.pct}% — ${p.hito}`).join("\n")
    || "  - 40% inicio / 40% hito intermedio / 20% entrega";

  const idiomaInstr = idioma === "en"
    ? "Write the entire proposal in English only."
    : idioma === "both"
    ? "Write the proposal in BOTH Spanish AND English. First the full Spanish version, then a divider (---), then the full English version."
    : "Redacta la propuesta íntegramente en español.";

  return `Eres el asistente de ${config.nombre || "Liam Phelan"}, arquitecto colegiado (${config.colegiacion || "COAMÁLAGA nº 1620"}), que opera bajo el nombre "${config.estudio || "Liam Arquitectura"}".

Genera una propuesta de honorarios profesional, clara y concisa, lista para enviar al cliente.

DATOS DEL ARQUITECTO:
  Nombre: ${config.nombre || "Liam Phelan"}
  Estudio: ${config.estudio || "Liam Arquitectura"}
  Colegiación: ${config.colegiacion || "COAMÁLAGA nº 1620"}
  NIF/NIE: ${config.nif || ""}
  Email: ${config.email || ""}
  Teléfono: ${config.telefono || ""}
  Domicilio profesional: ${config.dir_pro || "Málaga, España"}

DATOS DEL PROYECTO:
  Tipo de encargo: ${tipoLabel}
  Referencia: ${datos.nombre || "(sin nombre)"}
  Cliente: ${datos.cliente || "(sin especificar)"}
  Dirección: ${datos.direccion || "(sin especificar)"}
${datos.superficie ? `  Superficie: ${datos.superficie} m²` : ""}
${datos.pem        ? `  PEM estimado: ${eur(parseFloat(datos.pem))}` : ""}
  Fecha: ${datos.fecha || today()}

FASES Y HONORARIOS:
${fasesTexto}

RESUMEN ECONÓMICO:
  Base imponible: ${eur(totalNeto)}
  IVA (21%):      ${eur(totalIVA)}
  TOTAL:          ${eur(totalNeto + totalIVA)}

CONDICIONES DE PAGO:
${pagosTexto}

NOTAS / INSTRUCCIONES: ${datos.notas || "ninguna"}

CLÁUSULA DE PIE: ${config.clausula || "Los presentes honorarios podrán revisarse si el alcance del encargo varía sustancialmente respecto a lo descrito."}

ESTRUCTURA REQUERIDA:
1. Encabezado: datos del arquitecto, referencia y fecha
2. Saludo profesional dirigido al cliente por su nombre
3. Objeto del encargo (2-3 frases)
4. Fases de trabajo y honorarios
5. Resumen económico (base / IVA / total)
6. Condiciones de pago
7. Exclusiones relevantes (breve)
8. Cláusula de pie
9. Firma: nombre y colegiación

ESTILO: profesional, directo, sin florituras, lenguaje técnico-arquitectónico.
IDIOMA: ${idiomaInstr}`;
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [tab,      setTab]      = useState("nueva");
  const [step,     setStep]     = useState(1);
  const [tipo,     setTipo]     = useState("");
  const [datos,    setDatos]    = useState({ fecha: today() });
  const [fases,    setFases]    = useState({});
  const [pagos,    setPagos]    = useState(DEFAULT_PAGOS);
  const [idioma,   setIdioma]   = useState("es");
  const [propuesta,setPropuesta]= useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [config,   setConfig]   = useState(() => loadLS(CONFIG_KEY, {}));
  const [toast,    setToast]    = useState({ msg: "", visible: false });

  useEffect(() => { saveLS(CONFIG_KEY, config); }, [config]);

  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  };

  const setDato = (key, val) => {
    if (key === "__pagos") { setPagos(val); return; }
    setDatos(d => ({ ...d, [key]: val }));
  };

  const toggleFase = (id) => {
    const def = (FASES_POR_TIPO[tipo] || []).find(f => f.id === id)?.default ?? false;
    setFases(prev => ({ ...prev, [id]: !(prev[id] ?? def) }));
  };

  const setConfigField = (key, val) => setConfig(c => ({ ...c, [key]: val }));

  const generarPropuesta = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          messages: [{ role: "user", content: buildPrompt(tipo, datos, fases, pagos, idioma, config) }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = (data.content || []).map(b => b.text || "").join("").trim();
      if (!text) throw new Error("Respuesta vacía");
      setPropuesta(text);
      setStep(3);
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const guardarEnHistorial = () => {
    const fasesActivas = (FASES_POR_TIPO[tipo]||[]).filter(f => fases[f.id]??f.default);
    const totalNeto = fasesActivas.reduce((a,f)=>a+(parseFloat(datos[`hon_${f.id}`])||0),0);
    const entrada = {
      id: shortId(),
      nombre: datos.nombre || "(sin nombre)",
      tipo: TIPOS.find(t=>t.id===tipo)?.label || tipo,
      fecha: datos.fecha || today(),
      total: eur(totalNeto*(1+IVA)),
      texto: propuesta,
      datos, tipo, fases, pagos, idioma,
    };
    const lista = loadLS(STORAGE_KEY, []);
    lista.push(entrada);
    saveLS(STORAGE_KEY, lista);
    showToast("✓ Guardada en historial");
  };

  const cargarDesdeHistorial = (p) => {
    setTipo(p.tipo); setDatos(p.datos||{nombre:p.nombre,fecha:p.fecha});
    setFases(p.fases||{}); setPagos(p.pagos||DEFAULT_PAGOS);
    setIdioma(p.idioma||"es"); setPropuesta(p.texto||"");
    setStep(p.texto ? 3 : 2); setTab("nueva");
    showToast("Propuesta cargada");
  };

  const reset = () => {
    setStep(1); setTipo(""); setDatos({fecha:today()}); setFases({});
    setPagos(DEFAULT_PAGOS); setIdioma("es"); setPropuesta(""); setError("");
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F3F4F6", fontFamily:"'Inter',system-ui,sans-serif", padding:"20px 14px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea, button, select { font-family: inherit; }
        input:focus, textarea:focus { border-color: #2563EB !important; background: #fff !important; box-shadow: 0 0 0 3px #DBEAFE; }
        button { transition: opacity 0.15s; }
        button:hover { opacity: 0.85; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
        @keyframes lp-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth:580, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <h1 style={{ fontSize:19, fontWeight:700, color:"#111827" }}>{config.estudio || "Liam Arquitectura"}</h1>
              <p style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>Generador de propuestas de honorarios</p>
            </div>
            <span style={{ fontSize:11, color:"#6B7280", background:"#F9FAFB", border:"1px solid #E5E7EB", padding:"4px 10px", borderRadius:20 }}>
              {config.colegiacion || "COAMÁLAGA 1620"}
            </span>
          </div>
        </div>

        <TabBar active={tab} onChange={setTab} />

        <div style={{ background:"#fff", borderRadius:16, border:"1px solid #E5E7EB", padding:22, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>

          {tab === "nueva" && (
            <>
              <Stepper step={step} />

              {step === 1 && (
                <>
                  <StepTipo value={tipo} onChange={v => { setTipo(v); setFases({}); }} />
                  <button onClick={() => setStep(2)} disabled={!tipo}
                    style={{ ...btnPrimary, marginTop:20, opacity: tipo ? 1 : 0.4, cursor: tipo ? "pointer" : "default" }}>
                    Continuar →
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <StepDatos tipo={tipo} datos={datos} onChange={setDato} fases={fases}
                    onToggleFase={toggleFase} pagos={pagos} idioma={idioma} onIdioma={setIdioma} />
                  {error && (
                    <p style={{ color:"#DC2626", fontSize:12, marginBottom:12, padding:"8px 12px", background:"#FEF2F2", borderRadius:8 }}>{error}</p>
                  )}
                  <div style={{ display:"flex", gap:10, marginTop:6 }}>
                    <button onClick={() => setStep(1)} style={{ ...btnSecondary, flex:1 }}>← Atrás</button>
                    <button onClick={generarPropuesta} disabled={loading || !datos.nombre}
                      style={{ ...btnPrimary, flex:2, opacity: loading||!datos.nombre ? 0.5 : 1, cursor: loading||!datos.nombre ? "default":"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {loading ? <Spinner label="Generando propuesta…" /> : "Generar propuesta →"}
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <StepPropuesta texto={propuesta} onChange={setPropuesta} />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginTop:14 }}>
                    <button onClick={reset}            style={{ ...btnSecondary, fontSize:12 }}>Nueva</button>
                    <button onClick={generarPropuesta} disabled={loading}
                      style={{ fontSize:12, padding:"10px 0", borderRadius:9, border:"1.5px solid #BFDBFE", background:"#EFF6FF", color:"#1D4ED8", fontWeight:600, cursor:"pointer" }}>
                      {loading?"…":"Regenerar"}
                    </button>
                    <button onClick={guardarEnHistorial}
                      style={{ fontSize:12, padding:"10px 0", borderRadius:9, border:"1.5px solid #D1FAE5", background:"#ECFDF5", color:"#065F46", fontWeight:600, cursor:"pointer" }}>
                      Guardar
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(propuesta).then(()=>showToast("✓ Copiado")); }}
                      style={{ fontSize:12, padding:"10px 0", borderRadius:9, border:"none", background:"#2563EB", color:"#fff", fontWeight:700, cursor:"pointer" }}>
                      Copiar
                    </button>
                  </div>
                  <button onClick={() => imprimirPDF(propuesta, datos.nombre)}
                    style={{ marginTop:8, width:"100%", padding:"10px 0", borderRadius:9, border:"1.5px solid #E5E7EB", background:"#F9FAFB", color:"#374151", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                    📄 Exportar / Imprimir como PDF
                  </button>
                </>
              )}
            </>
          )}

          {tab === "historial" && <Historial onLoad={cargarDesdeHistorial} onToast={showToast} />}
          {tab === "config"    && <Configuracion config={config} onChange={setConfigField} />}
        </div>

        <p style={{ textAlign:"center", fontSize:11, color:"#D1D5DB", marginTop:18 }}>
          {config.estudio || "Liam Arquitectura"} · Málaga · {new Date().getFullYear()}
        </p>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}
