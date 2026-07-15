import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import refineryBg from "@/imports/file_00000000848c7246aed26918f5b73af0.png";
import {
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Bell, User, ChevronDown, Zap, Layers, LayoutGrid, Map,
  History, Briefcase, HelpCircle, AlertTriangle, Menu, X,
  BrainCircuit, Activity, LayoutDashboard,
  CheckCircle2, AlertCircle, Circle, Settings,
} from "lucide-react";

/* ──────────────────────────────────────────────────
   Types & data
────────────────────────────────────────────────── */

type NavId =
  | "dashboard"
  | "monitoring"
  | "ai"
  | "alerts"
  | "settings";

const NAV_ITEMS: { id: NavId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",  label: "داشبورد",      icon: LayoutDashboard },
  { id: "monitoring", label: "پایش لحظه‌ای", icon: Activity },
  { id: "ai",         label: "هوش مصنوعی",   icon: BrainCircuit },
  { id: "alerts",     label: "هشدارها",       icon: AlertTriangle },
  { id: "settings", label: "تنظیمات", icon: Settings },
];

// Tool icons — shown on desktop sidebar only; commented for mobile
// ابزارهای جانبی فعلاً غیرفعال هستند
// بعداً می‌توان دوباره فعالشان کرد

const TOOL_ICONS = [
  // Zap,
  // Layers,
  // LayoutGrid,
  // Map,
  // History,
  // Briefcase,
  // HelpCircle,
];

const ALERTS_DATA = [
  { type: "critical", title: "فشار بالا",  detail: "خط لوله L7 — ۲۴۵ bar", ago: "۲ دقیقه پیش"  },
  { type: "warning",  title: "دمای بالا",  detail: "توربین T2 — ۳۹۳°C",    ago: "۱۵ دقیقه پیش" },
  { type: "warning",  title: "نشت جزئی",   detail: "اتصال F11 — ناحیه B",  ago: "۲۲ دقیقه پیش" },
];

const LIVE_METRICS = [
  { label: "انتقال",       value: "۱۸.۷",  color: "#60a5fa" },
  { label: "تولید روزانه", value: "۲۴.۱۳", color: "#34d399" },
  { label: "آمادگی",       value: "۹۴٪",   color: "#34d399" },
  { label: "ذخیره‌سازی",  value: "۷۸٪",   color: "#fbbf24" },
];

const EQUIPMENT = [
  { name: "پمپ A1",      status: "ok",       value: ""        },
  { name: "کمپرسور C3",  status: "ok",       value: ""        },
  { name: "توربین T2",   status: "warning",  value: "۸۷٪"    },
  { name: "خط لوله L7", status: "info",     value: "۱۷۵.۱۲" },
  { name: "شیر V12",     status: "critical", value: ""        },
];

const MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور",
                "مهر","آبان","آذر","دی","بهمن","اسفند"];

const LINE_DATA = MONTHS.map((m, i) => ({
  m,
  production: 21 + Math.round(Math.sin(i * 0.5) * 3 + i * 0.3),
  transfer:   24 + Math.round(Math.cos(i * 0.4) * 2 + i * 0.2),
}));

const AREA_DATA = LINE_DATA.map((d) => ({ ...d, total: d.production + d.transfer }));

const SCATTER_DATA = Array.from({ length: 16 }, (_, i) => ({
  x: i * 5 + 5,
  y: Math.round(30 + Math.sin(i * 0.8) * 28 + (i % 4) * 5),
}));

/* ──────────────────────────────────────────────────
   Style tokens
────────────────────────────────────────────────── */

// Shared glass card style
const GLASS = {
  background: "linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.2))",
  backdropFilter: "blur(10px)",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
};
const TOOLTIP_STYLE = {
  background: "rgba(6,10,22,0.88)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e6edf3",
};

/* ──────────────────────────────────────────────────
   Reusable pieces
────────────────────────────────────────────────── */

function LiveBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: "#34d399",
      background: "rgba(52,211,153,.15)", border: "1px solid rgba(52,211,153,.35)",
      borderRadius: 4, padding: "1px 8px",
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 1.5s infinite" }} />
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  if (status === "ok")       return <CheckCircle2 size={13} color="#34d399" />;
  if (status === "warning")  return <AlertCircle  size={13} color="#fbbf24" />;
  if (status === "critical") return <AlertCircle  size={13} color="#f87171" />;
  return <Circle size={13} color="#60a5fa" />;
}

function ChartLabel({ title, sub, legend }: {
  title: string; sub?: string;
  legend?: { color: string; label: string }[];
}) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <span style={{ fontSize: 13, fontWeight: 600, color: "#e6edf3" }}>{title}</span>
      {sub && <span style={{ fontSize: 10, color: "rgba(230,237,243,.5)" }}>{sub}</span>}
      {legend && (
        <div className="d-flex gap-3">
          {legend.map(({ color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(230,237,243,.6)" }}>
              <span style={{ width: 14, height: 2, background: color, display: "inline-block", borderRadius: 1 }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   Panel components (reused on desktop hero + mobile cards)
────────────────────────────────────────────────── */

function AssistantPanel() {
  return (
    <div style={{ ...GLASS, padding: "14px 16px" }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3" }}>دستیار هوشمند</span>
        <LiveBadge label="فعال" />
      </div>
      <div className="d-flex flex-column gap-2">
        {ALERTS_DATA.map((a, i) => (
          <div key={i} style={{
            background: a.type === "critical" ? "rgba(248,113,113,.1)" : "rgba(251,191,36,.08)",
            border: `1px solid ${a.type === "critical" ? "rgba(248,113,113,.3)" : "rgba(251,191,36,.3)"}`,
            borderRadius: 8, padding: "9px 12px",
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: a.type === "critical" ? "#f87171" : "#fbbf24", marginBottom: 3 }}>
              {a.title}
            </p>
            <p style={{ fontSize: 11, color: "#c9d1d9", marginBottom: 3 }}>{a.detail}</p>
            <p style={{ fontSize: 10, color: "rgba(230,237,243,.45)", margin: 0 }}>{a.ago}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveStatusPanel() {
  return (
    <div style={{ ...GLASS, padding: "14px 16px" }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e6edf3" }}>وضعیت زنده</span>
        <LiveBadge label="زنده" />
      </div>

      <div className="row g-2 mb-3">
        {LIVE_METRICS.map((m) => (
          <div key={m.label} className="col-6">
            <div style={{
              background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 8, padding: "8px", textAlign: "center",
            }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1, marginBottom: 4 }}>
                {m.value}
              </p>
              <p style={{ fontSize: 10, color: "rgba(230,237,243,.55)", margin: 0 }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex flex-column gap-2">
        {EQUIPMENT.map((eq) => (
          <div key={eq.name} className="d-flex align-items-center justify-content-between"
            style={{ background: "rgba(255,255,255,.05)", borderRadius: 6, padding: "6px 10px" }}>
            <div className="d-flex align-items-center gap-2">
              <StatusDot status={eq.status} />
              <span style={{ fontSize: 12, color: "#c9d1d9" }}>{eq.name}</span>
            </div>
            {eq.value && (
              <span style={{ fontSize: 11, color: "#8b949e", fontFamily: "'JetBrains Mono',monospace" }}>
                {eq.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   Sidebar
────────────────────────────────────────────────── */

function SidebarContent({
  activeNav, setActiveNav, mobile, onClose,
}: {
  activeNav: NavId;
  setActiveNav: (id: NavId) => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Nav items */}
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button key={id} title={label}
          onClick={() => { setActiveNav(id); onClose?.(); }}
          style={{
            width: 40, height: 40, borderRadius: 10, cursor: "pointer", border: "none",
            background: activeNav === id ? "rgba(240,165,0,.22)" : "transparent",
            color: activeNav === id ? "#f0a500" : "#8b949e",
            outline: activeNav === id ? "1px solid rgba(240,165,0,.45)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .15s",
          }}
        >
          <Icon size={17} />
        </button>
      ))}

      {/* Tool icons — desktop only; commented for mobile */}
      {!mobile && (
        <>
          <div style={{ width: 28, height: 1, background: "rgba(255,255,255,.1)", margin: "6px 0" }} />
          {TOOL_ICONS.map((Icon, i) => (
            <button key={i} style={{
              width: 40, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent", color: "#8b949e",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={16} />
            </button>
          ))}
        </>
      )}
      {/* mobile: tool icons are commented out — not rendered */}
    </>
  );
}

/* ──────────────────────────────────────────────────
   Main App
────────────────────────────────────────────────── */

export default function App() {
  const [activeNav, setActiveNav]     = useState<NavId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div dir="rtl" style={{ fontFamily: "'Vazirmatn', sans-serif", minHeight: "100vh", color: "#e6edf3" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
        p { margin: 0; }
        button { outline: none !important; border: none; background: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.2); border-radius: 4px; }
        @media (min-width: 992px) { .page-wrap { margin-right: 56px; } }
      `}</style>

      {/* ══ BACKGROUND IMAGE — fixed, full viewport, NO overlay ══ */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <ImageWithFallback
          src={refineryBg}
          alt="پالایشگاه نفت لاوان"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%" }}
        />
      </div>

      {/* ══ DESKTOP SIDEBAR — always visible, right edge ══ */}
      <aside className="d-none d-lg-flex flex-column align-items-center" style={{
        position: "fixed", top: 0, right: 0, width: 56, height: "100vh", zIndex: 200,
        background: "rgba(6,10,22,0.72)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderLeft: "1px solid rgba(255,255,255,.1)",
        paddingTop: 68, gap: 4,
      }}>
        <SidebarContent activeNav={activeNav} setActiveNav={setActiveNav} />
      </aside>

     {/* ══ MOBILE SIDEBAR — slide in from right ══ */}
<div className="d-lg-none">

  {/* Dark overlay */}
  <div
    onClick={() => setSidebarOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.55)",
      zIndex: 300,

      opacity: sidebarOpen ? 1 : 0,
      visibility: sidebarOpen ? "visible" : "hidden",
      pointerEvents: sidebarOpen ? "auto" : "none",

      transition: "opacity .25s ease, visibility .25s ease",
    }}
  />

  {/* Mobile menu */}
  <aside
    style={{
      position: "fixed",
      top: 0,
      right: 0,

      width: 64,
      height: "100vh",

      zIndex: 301,

      transform: sidebarOpen
        ? "translateX(0)"
        : "translateX(100%)",

      background: "rgba(6,10,22,.96)",

      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",

      borderLeft:
        "1px solid rgba(255,255,255,.12)",

      display: "flex",
      flexDirection: "column",
      alignItems: "center",

      paddingTop: 68,
      gap: 4,

      transition:
        "transform .28s cubic-bezier(.4,0,.2,1)",

      boxShadow:
        sidebarOpen
          ? "-10px 0 30px rgba(0,0,0,.35)"
          : "none",
    }}
  >

    <SidebarContent
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      mobile
      onClose={() => setSidebarOpen(false)}
    />

  </aside>

</div>

      {/* ══ PAGE WRAP — content above background ══ */}
      <div className="page-wrap" style={{ position: "relative", zIndex: 10, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── HEADER ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(6,10,22,0.60)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}>
          <div className="container-fluid px-3 d-flex align-items-center justify-content-between" style={{ height: 54, gap: 12 }}>

           {/* Brand */}
<div className="d-flex align-items-center gap-2 flex-shrink-0">

  {/* Icon */}
  <div style={{
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#f0a500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  }}>
    <Zap size={16} color="#060a16" fill="#060a16" />
  </div>

  {/* Text (Desktop) */}
  <div className="d-none d-md-block">
    <p style={{
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.3,
      color: "#e6edf3"
    }}>
      شرکت ملی پالایش و پخش فرآورده‌های نفتی ایران
    </p>

    <p style={{
      fontSize: 10,
      color: "#8b949e"
    }}>
      مرکز پایش و تحلیل داده
    </p>
  </div>

  {/* Text (Mobile) */}
  <p
    className="d-md-none"
    style={{
      fontSize: 12,
      fontWeight: 700,
      color: "#e6edf3"
    }}
  >
    پالایش صنعت
  </p>

</div>

            {/* Actions */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <button style={{
                position: "relative", width: 36, height: 36, borderRadius: 8, cursor: "pointer",
                background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bell size={15} />
                <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#f87171", border: "2px solid #060a16" }} />
              </button>

              <button style={{
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#e6edf3", fontFamily: "inherit",
              }}>
                <User size={13} />
                <span className="d-none d-sm-inline">کاربر</span>
                <ChevronDown size={11} />
              </button>

              {/* Hamburger — tablet & mobile */}
              <button className="d-lg-none" onClick={() => setSidebarOpen(!sidebarOpen)} style={{
                width: 36, height: 36, borderRadius: 8, cursor: "pointer",
                background: sidebarOpen ? "rgba(240,165,0,.18)" : "rgba(255,255,255,.08)",
                border: `1px solid ${sidebarOpen ? "rgba(240,165,0,.4)" : "rgba(255,255,255,.12)"}`,
                color: sidebarOpen ? "#f0a500" : "#e6edf3",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN: hero + charts, fills remaining viewport height ── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ── DESKTOP LAYOUT: hero row + chart row, no scroll ── */}
          <div className="d-none d-lg-flex flex-column h-100 px-3 py-3" style={{ gap: 12 }}>

            {/* Row 1: [دستیار هوشمند] | [عنوان وسط] | [وضعیت زنده] */}
            <div className="d-flex align-items-end" style={{ gap: 12, flex: "0 0 auto" }}>
              <div style={{ width: "27%" }}>
                <AssistantPanel />
              </div>

             {/* Center title */}
{/* Center title */}
<div
  style={{
    flex: 1,
    textAlign: "center",
    paddingBottom: 8,
  }}
>

  <p
    style={{
      fontSize: 14,
      fontWeight: 700,
      color: "#ffffff",
      letterSpacing: ".3px",
      marginBottom: 12,

      textShadow:
        "0 2px 10px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,.9)",
    }}
  >
    <span
      style={{
        color: "#ffc247",
        fontWeight: 900,
      }}
    >
      پالایشگاه لاوان
    </span>

    {"  /  "}
    ایران
    {"  /  "}
    خلیج فارس
  </p>


  <h1
    style={{
      fontSize: "clamp(1.8rem,3vw,2.5rem)",
      fontWeight: 900,
      lineHeight: 1.4,

      color: "#ffffff",

      marginBottom: 10,

      textShadow:
        "0 3px 18px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,.9)",
    }}
  >
    مرکز پایش و تحلیل داده
  </h1>


  <p
    style={{
      fontSize: 15,
      fontWeight: 700,

      color: "rgba(255,255,255,.95)",

      textShadow:
        "0 2px 12px rgba(0,0,0,1), 0 0 5px rgba(0,0,0,.8)",

      letterSpacing: ".2px",
    }}
  >
    شرکت ملی پالایش و پخش فرآورده‌های نفتی ایران
  </p>

</div>

              <div style={{ width: "27%" }}>
                <LiveStatusPanel />
              </div>
            </div>

            {/* Row 2: 3 chart cards — fill remaining height */}
            <div className="d-flex" style={{ gap: 12, flex: 1, minHeight: 0 }}>

              <div style={{ flex: 1, ...GLASS, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <ChartLabel title="توزیع ظرفیت" sub="٪ بار" />
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid stroke="rgba(255,255,255,.15)" />
                      <XAxis dataKey="x" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }}/>
                      <YAxis dataKey="y" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Scatter data={SCATTER_DATA} fill="#60a5fa" opacity={0.85} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: 1, ...GLASS, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <ChartLabel
                  title="تولید / انتقال"
                  legend={[{ color: "#34d399", label: "تولید" }, { color: "#60a5fa", label: "انتقال" }]}
                />
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={LINE_DATA}>
                      <CartesianGrid stroke="rgba(255,255,255,.07)" />
                      <XAxis dataKey="m" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                      <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="production" name="تولید"  stroke="#34d399" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="transfer"   name="انتقال" stroke="#60a5fa" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: 1, ...GLASS, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
                <ChartLabel title="روند تولید سالانه" sub="Mtoe" />
                <div style={{ flex: 1, minHeight: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={AREA_DATA}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#34d399" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,.07)" />
                      <XAxis dataKey="m" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                      <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="total" name="کل تولید" stroke="#34d399" fill="url(#areaGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

          {/* ── MOBILE / TABLET LAYOUT: scrollable, stacked ── */}
          <div className="d-lg-none" style={{ overflowY: "auto" }}>
            <div className="container-fluid px-3 py-3">

              {/* Title on image */}
              <div style={{ textAlign: "center", marginBottom: 20, paddingTop: 16 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginBottom: 6, textShadow: "0 1px 6px rgba(0,0,0,.9)" }}>
                  <span style={{ color: "#f0a500" }}>پالایشگاه لاوان</span> / ایران / خلیج فارس
                </p>
                <h1 style={{
                  fontSize: "clamp(1.3rem, 5vw, 1.8rem)", fontWeight: 700,
                  color: "#fff", lineHeight: 1.3, marginBottom: 4,
                  textShadow: "0 2px 20px rgba(0,0,0,.95)",
                }}>
                  مرکز پایش و تحلیل داده
                </h1>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", textShadow: "0 1px 8px rgba(0,0,0,.9)" }}>
                  شرکت ملی پالایش و پخش فرآورده‌های نفتی ایران
                </p>
              </div>

              {/* Stacked cards */}
              <div className="row g-3">
                <div className="col-12 col-md-6"><AssistantPanel /></div>
                <div className="col-12 col-md-6"><LiveStatusPanel /></div>

                <div className="col-12 col-md-6">
                  <div style={{ ...GLASS, padding: "14px 16px" }}>
                    <ChartLabel title="توزیع ظرفیت" sub="٪ بار" />
                    <ResponsiveContainer width="100%" height={180}>
                      <ScatterChart>
                        <CartesianGrid stroke="rgba(255,255,255,.07)" />
                        <XAxis dataKey="x" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                        <YAxis dataKey="y" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Scatter data={SCATTER_DATA} fill="#60a5fa" opacity={0.85} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div style={{ ...GLASS, padding: "14px 16px" }}>
                    <ChartLabel title="تولید / انتقال" legend={[{ color: "#34d399", label: "تولید" }, { color: "#60a5fa", label: "انتقال" }]} />
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={LINE_DATA}>
                        <CartesianGrid stroke="rgba(255,255,255,.07)" />
                        <XAxis dataKey="m" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                        <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Line type="monotone" dataKey="production" name="تولید"  stroke="#34d399" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="transfer"   name="انتقال" stroke="#60a5fa" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-12">
                  <div style={{ ...GLASS, padding: "14px 16px" }}>
                    <ChartLabel title="روند تولید سالانه" sub="Mtoe" />
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={AREA_DATA}>
                        <defs>
                          <linearGradient id="areaGradMob" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#34d399" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,.07)" />
                        <XAxis dataKey="m" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                        <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Area type="monotone" dataKey="total" name="کل تولید" stroke="#34d399" fill="url(#areaGradMob)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </main>

      </div>
    </div>
  );
}
