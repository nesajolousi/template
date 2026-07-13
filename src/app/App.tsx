import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import refineryBg from "@/imports/file_00000000848c7246aed26918f5b73af0.png";
import {
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Bell, User, ChevronDown, Search, Thermometer, MapPin,
  Clock, Zap, Layers, LayoutGrid, Map, History,
  Briefcase, HelpCircle, AlertTriangle, Settings, X, Menu,
  BrainCircuit, Activity, LayoutDashboard,
  CheckCircle2, AlertCircle, Circle,
} from "lucide-react";

/* ──────────────────────────────────────────────────
   Types & constants
────────────────────────────────────────────────── */

type NavId = "dashboard" | "monitoring" | "ai" | "alerts" | "settings";

const NAV_ITEMS: { id: NavId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",  label: "داشبورد",      icon: LayoutDashboard },
  { id: "monitoring", label: "پایش لحظه‌ای", icon: Activity },
  { id: "ai",         label: "هوش مصنوعی",   icon: BrainCircuit },
  { id: "alerts",     label: "هشدارها",       icon: AlertTriangle },
  { id: "settings",   label: "تنظیمات",       icon: Settings },
];

const TOOL_ICONS = [Zap, Layers, LayoutGrid, Map, History, Briefcase, HelpCircle];

/* ── Mock data ── */
const ALERTS_DATA = [
  { type: "critical", title: "فشار بالا",  detail: "خط لوله L7 — ۲۴۵ bar", ago: "۲ دقیقه پیش"  },
  { type: "warning",  title: "دمای بالا",  detail: "توربین T2 — ۳۹۳°C",    ago: "۱۵ دقیقه پیش" },
  { type: "warning",  title: "نشت جزئی",   detail: "اتصال F11 — ناحیه B",  ago: "۲۲ دقیقه پیش" },
];

const LIVE_METRICS = [
  { label: "انتقال",      value: "۱۸.۷",  color: "#60a5fa" },
  { label: "تولید روزانه",value: "۲۴.۱۳", color: "#34d399" },
  { label: "آمادگی",      value: "۹۴٪",   color: "#34d399" },
  { label: "ذخیره‌سازی", value: "۷۸٪",   color: "#fbbf24" },
];

const EQUIPMENT = [
  { name: "پمپ A1",       status: "ok",       value: "" },
  { name: "کمپرسور C3",   status: "ok",       value: "" },
  { name: "توربین T2",    status: "warning",  value: "۸۷٪" },
  { name: "خط لوله L7",  status: "info",     value: "۱۷۵.۱۲" },
  { name: "شیر V12",      status: "critical", value: "" },
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

const SETTINGS_GROUPS = [
  {
    title: "اعلان‌ها",
    items: [
      { key: "pressure", label: "هشدار فشار",      desc: "اعلان هنگام تجاوز از حد مجاز",  on: true  },
      { key: "temp",     label: "هشدار دما",        desc: "نظارت بر دمای توربین‌ها",         on: true  },
      { key: "report",   label: "گزارش روزانه",     desc: "ارسال خلاصه عملکرد به ایمیل",    on: false },
    ],
  },
  {
    title: "نمایش",
    items: [
      { key: "refresh",  label: "تازه‌سازی خودکار", desc: "به‌روزرسانی هر ۳۰ ثانیه",        on: true  },
      { key: "dark",     label: "حالت تاریک",       desc: "پوسته تاریک رابط کاربری",        on: true  },
      { key: "charts",   label: "نمودارهای زنده",   desc: "فعال‌سازی نمودارهای لحظه‌ای",    on: true  },
    ],
  },
];

/* ──────────────────────────────────────────────────
   Shared style tokens
────────────────────────────────────────────────── */

// White glassmorphism — used for ALL cards (hero panels + chart cards)
const GLASS: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.10)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderRadius: 12,
};

const TOOLTIP_STYLE = {
  background: "#0d1117",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e6edf3",
};

/* ──────────────────────────────────────────────────
   Small components
────────────────────────────────────────────────── */

function LiveBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: "#34d399",
      background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.3)",
      borderRadius: 4, padding: "1px 7px",
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

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11, flexShrink: 0,
      background: on ? "#f0a500" : "rgba(255,255,255,0.15)",
      position: "relative", cursor: "pointer", transition: "background .2s",
    }}>
      <div style={{
        position: "absolute", top: 3, width: 16, height: 16,
        borderRadius: "50%", background: "#fff", transition: "all .2s",
        ...(on ? { right: 3 } : { left: 3 }),
      }} />
    </div>
  );
}

function ChartHeader({ title, sub, legend }: {
  title: string;
  sub?: string;
  legend?: { color: string; label: string }[];
}) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <span style={{ fontSize: 12, fontWeight: 600, color: "#e6edf3" }}>{title}</span>
      {sub && <span style={{ fontSize: 10, color: "rgba(230,237,243,.55)" }}>{sub}</span>}
      {legend && (
        <div className="d-flex gap-2">
          {legend.map(({ color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(230,237,243,.55)" }}>
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
   Settings page
────────────────────────────────────────────────── */

function SettingsPage() {
  const [vals, setVals] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.on])))
  );
  const toggle = (key: string) => setVals((v) => ({ ...v, [key]: !v[key] }));

  return (
    <div className="p-3 p-md-4">
      <h6 className="d-flex align-items-center gap-2 mb-4" style={{ color: "#e6edf3", fontWeight: 700 }}>
        <Settings size={16} color="#f0a500" /> تنظیمات سامانه
      </h6>
      <div className="row g-3">
        {SETTINGS_GROUPS.map((group) => (
          <div key={group.title} className="col-12 col-md-6">
            <div style={{ ...GLASS, padding: "16px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#f0a500", letterSpacing: "0.06em", marginBottom: 14 }}>
                {group.title}
              </p>
              <div className="d-flex flex-column gap-2">
                {group.items.map((item) => (
                  <div key={item.key} className="d-flex align-items-center justify-content-between"
                    style={{ background: "rgba(255,255,255,.06)", borderRadius: 8, padding: "10px 12px" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#e6edf3", marginBottom: 2 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: "rgba(230,237,243,.5)", marginBottom: 0 }}>{item.desc}</p>
                    </div>
                    <Toggle on={vals[item.key]} onToggle={() => toggle(item.key)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   Right Sidebar
────────────────────────────────────────────────── */

function Sidebar({
  activeNav, setActiveNav, collapsed, onClose,
}: {
  activeNav: NavId;
  setActiveNav: (id: NavId) => void;
  collapsed: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {!collapsed && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
            zIndex: 200, display: "block",
          }}
          className="d-lg-none"
        />
      )}

      {/* Sidebar panel — always right edge */}
      <aside style={{
        position: "fixed",
        top: 52,
        right: collapsed ? -64 : 0,          // slide in/out from right
        width: 56,
        height: "calc(100vh - 52px)",
        background: "rgba(8,12,22,.97)",
        borderLeft: "1px solid rgba(255,255,255,.07)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 10, gap: 4,
        zIndex: 201,
        transition: "right .25s ease",
        overflowY: "auto",
      }}>
        {/* Nav items */}
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            title={label}
            onClick={() => { setActiveNav(id); onClose(); }}
            style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: activeNav === id ? "rgba(240,165,0,.18)" : "transparent",
              color: activeNav === id ? "#f0a500" : "#8b949e",
              outline: activeNav === id ? "1px solid rgba(240,165,0,.4)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all .15s",
            }}
          >
            <Icon size={17} />
          </button>
        ))}

        <div style={{ width: 28, height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />

        {/* Tool icons */}
        {TOOL_ICONS.map((Icon, i) => (
          <button key={i} style={{
            width: 40, height: 40, borderRadius: 10, border: "none",
            background: "transparent", color: "#8b949e",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <Icon size={16} />
          </button>
        ))}
      </aside>
    </>
  );
}

/* ──────────────────────────────────────────────────
   Main App
────────────────────────────────────────────────── */

export default function App() {
  const [activeNav, setActiveNav]   = useState<NavId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on large screens (always visible there)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 992px)");
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // On desktop (≥992px) sidebar is always shown; on smaller it's toggled
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 992;

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Vazirmatn', sans-serif",
        minHeight: "100vh",
        background: "#080c16",
        color: "#e6edf3",
        display: "flex", flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
        button { outline: none !important; }
      `}</style>

      {/* ═══════════════════════════════════════════
          TOP HEADER
      ═══════════════════════════════════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 300,
        background: "rgba(8,12,22,.97)",
        borderBottom: "1px solid rgba(255,255,255,.07)",
        height: 52,
      }}>
        <div className="container-fluid px-3 h-100 d-flex align-items-center justify-content-between" style={{ gap: 12 }}>

          {/* Brand */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "#f0a500", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={15} color="#080c16" fill="#080c16" />
            </div>
            <div className="d-none d-sm-block">
              <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 0, lineHeight: 1.3 }}>شرکت ملی پالایش و پخش فرآورده‌های نفتی ایران</p>
              <p style={{ fontSize: 10, color: "#8b949e", marginBottom: 0 }}>مرکز پایش و تحلیل داده</p>
            </div>
          </div>

          {/* Meta chips — desktop only */}
          <div className="d-none d-xl-flex align-items-center gap-2 flex-wrap">
            {[
              { Icon: MapPin,      text: "۲۶.۸°N — لاوان" },
              { Icon: Thermometer, text: "۳۳°C آفتابی" },
              { Icon: Search,      text: "جستجو..." },
              { Icon: Clock,       text: "۲۳:۰۴:۳۹ — دوشنبه ۲۲ تیر" },
            ].map(({ Icon, text }) => (
              <div key={text} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.09)",
                borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#c9d1d9", whiteSpace: "nowrap",
              }}>
                <Icon size={11} /> {text}
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {/* Bell */}
            <button style={{
              position: "relative", width: 34, height: 34, borderRadius: 8,
              background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
              color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Bell size={15} />
              <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#f87171", border: "2px solid #080c16" }} />
            </button>

            {/* User */}
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#e6edf3",
              fontFamily: "inherit", cursor: "pointer",
            }}>
              <User size={13} />
              <span className="d-none d-sm-inline">کاربر</span>
              <ChevronDown size={11} />
            </button>

            {/* Hamburger — visible on < lg */}
            <button
              className="d-lg-none"
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: sidebarOpen ? "rgba(240,165,0,.18)" : "rgba(255,255,255,.06)",
                border: `1px solid ${sidebarOpen ? "rgba(240,165,0,.4)" : "rgba(255,255,255,.1)"}`,
                color: sidebarOpen ? "#f0a500" : "#e6edf3",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          SIDEBAR (right edge, fixed)
      ═══════════════════════════════════════════ */}

      {/* Desktop: always visible */}
      <div className="d-none d-lg-block">
        <aside style={{
          position: "fixed", top: 52, right: 0, width: 56,
          height: "calc(100vh - 52px)",
          background: "rgba(8,12,22,.97)",
          borderLeft: "1px solid rgba(255,255,255,.07)",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 10, gap: 4, zIndex: 100, overflowY: "auto",
        }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} title={label} onClick={() => setActiveNav(id)} style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: activeNav === id ? "rgba(240,165,0,.18)" : "transparent",
              color: activeNav === id ? "#f0a500" : "#8b949e",
              outline: activeNav === id ? "1px solid rgba(240,165,0,.4)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all .15s",
            }}>
              <Icon size={17} />
            </button>
          ))}
          <div style={{ width: 28, height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />
          {TOOL_ICONS.map((Icon, i) => (
            <button key={i} style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: "transparent", color: "#8b949e",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Icon size={16} />
            </button>
          ))}
        </aside>
      </div>

      {/* Mobile/Tablet: slide-in from right */}
      <div className="d-lg-none">
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 200 }} />
        )}
        <aside style={{
          position: "fixed", top: 52, right: sidebarOpen ? 0 : -64,
          width: 56, height: "calc(100vh - 52px)",
          background: "rgba(8,12,22,.99)",
          borderLeft: "1px solid rgba(255,255,255,.1)",
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: 10, gap: 4, zIndex: 201,
          transition: "right .25s ease", overflowY: "auto",
        }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} title={label} onClick={() => { setActiveNav(id); setSidebarOpen(false); }} style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: activeNav === id ? "rgba(240,165,0,.18)" : "transparent",
              color: activeNav === id ? "#f0a500" : "#8b949e",
              outline: activeNav === id ? "1px solid rgba(240,165,0,.4)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all .15s",
            }}>
              <Icon size={17} />
            </button>
          ))}
          <div style={{ width: 28, height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />
          {TOOL_ICONS.map((Icon, i) => (
            <button key={i} style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: "transparent", color: "#8b949e",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Icon size={16} />
            </button>
          ))}
        </aside>
      </div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
          Margin-right on desktop to clear sidebar
      ═══════════════════════════════════════════ */}
      <main style={{ marginRight: 0, flex: 1 }} className="main-content">
        <style>{`.main-content { margin-right: 0 !important; } @media (min-width: 992px) { .main-content { margin-right: 56px !important; } }`}</style>

        {/* ── Settings ── */}
        {activeNav === "settings" && <SettingsPage />}

        {/* ── Dashboard ── */}
        {activeNav !== "settings" && (
          <>
            {/* ══ 1. HERO IMAGE — first element ══ */}
            <div style={{ position: "relative", width: "100%", height: "clamp(240px, 42vw, 480px)", overflow: "hidden" }}>

              {/* Photo */}
              <ImageWithFallback
                src={refineryBg}
                alt="پالایشگاه نفت لاوان — نمای هوایی غروب"
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: "center 55%",
                  filter: "brightness(.6)",
                }}
              />

              {/* Gradient */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(8,12,22,.35) 0%, rgba(8,12,22,.05) 40%, rgba(8,12,22,.85) 100%)",
              }} />

              {/* Overlay content */}
              <div className="container-fluid h-100 position-relative px-3" style={{ paddingTop: 14 }}>
                <div className="row h-100 g-2 align-items-start">

                  {/* Left panel — دستیار هوشمند */}
                  <div className="col-5 col-md-4 col-lg-3">
                    <div style={{ ...GLASS, padding: "12px 14px" }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: 12, fontWeight: 700 }}>دستیار هوشمند</span>
                        <LiveBadge label="فعال" />
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {ALERTS_DATA.map((a, i) => (
                          <div key={i} style={{
                            background: a.type === "critical" ? "rgba(248,113,113,.1)" : "rgba(251,191,36,.08)",
                            border: `1px solid ${a.type === "critical" ? "rgba(248,113,113,.3)" : "rgba(251,191,36,.3)"}`,
                            borderRadius: 8, padding: "8px 10px",
                          }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: a.type === "critical" ? "#f87171" : "#fbbf24", marginBottom: 2 }}>
                              {a.title}
                            </p>
                            <p style={{ fontSize: 10, color: "#c9d1d9", marginBottom: 2 }}>{a.detail}</p>
                            <p style={{ fontSize: 10, color: "rgba(230,237,243,.45)", marginBottom: 0 }}>{a.ago}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center — title (hidden on xs, visible md+) */}
                  <div className="col-md-4 col-lg-6 d-none d-md-flex flex-column justify-content-end h-100 pb-4">
                    <p style={{ fontSize: 11, color: "rgba(230,237,243,.6)", marginBottom: 8 }}>
                      <span style={{ color: "#f0a500" }}>پالایشگاه لاوان</span> / ایران / خلیج فارس
                    </p>
                    <h1 style={{
                      fontSize: "clamp(1.2rem, 3.5vw, 2.1rem)", fontWeight: 700,
                      color: "#fff", lineHeight: 1.35, textShadow: "0 2px 16px rgba(0,0,0,.7)", marginBottom: 6,
                    }}>
                      مرکز پایش و تحلیل داده
                    </h1>
                    <p style={{ fontSize: 12, color: "rgba(230,237,243,.65)", marginBottom: 0 }}>
                      شرکت ملی پالایش و پخش فرآورده‌های نفتی ایران
                    </p>
                  </div>

                  {/* Right panel — وضعیت زنده */}
                  <div className="col-7 col-md-4 col-lg-3">
                    <div style={{ ...GLASS, padding: "12px 14px" }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span style={{ fontSize: 12, fontWeight: 700 }}>وضعیت زنده</span>
                        <LiveBadge label="زنده" />
                      </div>

                      {/* 4 metrics */}
                      <div className="row g-1 mb-2">
                        {LIVE_METRICS.map((m) => (
                          <div key={m.label} className="col-6">
                            <div style={{
                              background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                              borderRadius: 8, padding: "6px 8px", textAlign: "center",
                            }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 2, lineHeight: 1 }}>
                                {m.value}
                              </p>
                              <p style={{ fontSize: 10, color: "rgba(230,237,243,.55)", marginBottom: 0 }}>{m.label}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Equipment */}
                      <div className="d-flex flex-column gap-1">
                        {EQUIPMENT.map((eq) => (
                          <div key={eq.name} className="d-flex align-items-center justify-content-between" style={{ fontSize: 11 }}>
                            <div className="d-flex align-items-center gap-2">
                              <StatusDot status={eq.status} />
                              <span style={{ color: "#c9d1d9" }}>{eq.name}</span>
                            </div>
                            {eq.value && (
                              <span style={{ color: "#8b949e", fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>
                                {eq.value}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Mobile title — shown below panels */}
                <div className="d-md-none mt-2 pb-3">
                  <p style={{ fontSize: 11, color: "rgba(230,237,243,.6)", marginBottom: 4 }}>
                    <span style={{ color: "#f0a500" }}>پالایشگاه لاوان</span> / ایران
                  </p>
                  <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginBottom: 0, textShadow: "0 2px 12px rgba(0,0,0,.8)" }}>
                    مرکز پایش و تحلیل داده
                  </h1>
                </div>
              </div>
            </div>

            {/* ══ 2. CHART CARDS — below image, same glass style ══ */}
            <div className="container-fluid px-3 py-3">
              <div className="row g-3">

                {/* Chart A — توزیع ظرفیت */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div style={{ ...GLASS, padding: "16px" }}>
                    <ChartHeader title="توزیع ظرفیت" sub="٪ بار" />
                    <ResponsiveContainer width="100%" height={150}>
                      <ScatterChart>
                        <CartesianGrid stroke="rgba(255,255,255,.05)" />
                        <XAxis dataKey="x" tick={{ fontSize: 9, fill: "#8b949e" }} />
                        <YAxis dataKey="y" tick={{ fontSize: 9, fill: "#8b949e" }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Scatter data={SCATTER_DATA} fill="#60a5fa" opacity={0.8} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart B — تولید / انتقال */}
                <div className="col-12 col-md-6 col-lg-4">
                  <div style={{ ...GLASS, padding: "16px" }}>
                    <ChartHeader
                      title="تولید / انتقال"
                      legend={[{ color: "#34d399", label: "تولید" }, { color: "#60a5fa", label: "انتقال" }]}
                    />
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={LINE_DATA}>
                        <CartesianGrid stroke="rgba(255,255,255,.05)" />
                        <XAxis dataKey="m" tick={{ fontSize: 8, fill: "#8b949e" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Line type="monotone" dataKey="production" name="تولید" stroke="#34d399" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="transfer"   name="انتقال" stroke="#60a5fa" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart C — روند تولید سالانه */}
                <div className="col-12 col-md-12 col-lg-4">
                  <div style={{ ...GLASS, padding: "16px" }}>
                    <ChartHeader title="روند تولید سالانه" sub="Mtoe" />
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={AREA_DATA}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#34d399" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,.05)" />
                        <XAxis dataKey="m" tick={{ fontSize: 8, fill: "#8b949e" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Area type="monotone" dataKey="total" name="کل تولید" stroke="#34d399" fill="url(#areaGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
