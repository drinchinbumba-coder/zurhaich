"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
} from "react";
import { C } from "@/lib/colors";
import {
  ELEMENTS,
  NUMEROLOGY,
  PALM_QUESTIONS,
  COMPAT_SCORE_DESCS,
  ANIMAL_COMPAT_DESCS,
  REMEDY_ELEMENT,
  REMEDY_POOL,
  NUM_ADVICE,
} from "@/lib/data";
import {
  mongolZurkhai,
  westernSign,
  lifePathSteps,
  dailyHoroscope,
  calculateCompatibility,
  getMoneyHoroscope,
  todayISO,
  type CompatResult,
  type MoneyResult,
} from "@/lib/calculations";
import { store } from "@/lib/store";
import AuthScreen from "@/components/AuthScreen";

/* ═══════════════════════════════════════════════════════
   ДОТООД ЗАГВАРЧЛАЛ — UI ТУСЛАМЖ КОМПОНЕНТҮҮД
═══════════════════════════════════════════════════════ */

/* Glassmorphism мистик карт */
function Card({
  children,
  className = "",
  style = {},
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: boolean;
}) {
  return (
    <div
      className={`mystical-card${glow ? " glow-card" : ""} ${className}`}
      style={{
        padding: "22px 24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* Алтан pill */
function Pill({ label, color, bg }: { label: string; color?: string; bg?: string }) {
  return (
    <span
      style={{
        background: bg ?? "rgba(227,180,88,0.12)",
        color: color ?? C.goldSoft,
        borderRadius: 24,
        padding: "4px 14px",
        fontSize: 12,
        fontWeight: 700,
        display: "inline-block",
        border: `1px solid rgba(227,180,88,0.3)`,
        letterSpacing: 0.3,
      }}
    >
      {label}
    </span>
  );
}

/* Алтан товч */
function GoldButton({
  children, onClick, disabled, small, secondary,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  secondary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: secondary
          ? "rgba(227,180,88,0.08)"
          : disabled
          ? "rgba(255,255,255,0.08)"
          : `linear-gradient(135deg, ${C.gold} 0%, #d4a032 50%, #b8892e 100%)`,
        color: secondary ? C.goldSoft : disabled ? C.dim : "#16100a",
        border: secondary ? `1.5px solid rgba(227,180,88,0.45)` : "none",
        borderRadius: 14,
        padding: small ? "9px 22px" : "14px 36px",
        fontWeight: 800,
        fontSize: small ? 13 : 15,
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: 0.4,
        transition: "all 0.18s ease",
        boxShadow: disabled || secondary ? "none" : `0 4px 18px rgba(227,180,88,0.35)`,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          const el = e.currentTarget;
          el.style.transform = "translateY(-1px)";
          el.style.boxShadow = secondary
            ? `0 0 0 1px rgba(227,180,88,0.6)`
            : `0 6px 24px rgba(227,180,88,0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = disabled || secondary ? "none" : `0 4px 18px rgba(227,180,88,0.35)`;
      }}
    >
      {children}
    </button>
  );
}

/* Мистик Modal */
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(4,6,20,0.78)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(12,18,48,0.96)",
          border: "1px solid rgba(227,180,88,0.25)",
          borderRadius: 24,
          padding: "28px 28px 32px",
          width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(227,180,88,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span
            style={{
              background: `linear-gradient(90deg, ${C.goldSoft}, #C9A0DC)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 800, fontSize: 18,
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%", width: 32, height: 32,
              color: C.dim, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* Field label */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        color: "rgba(201,160,220,0.8)", fontSize: 11,
        marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* Input */
function InputStyle({ value, onChange, type = "text", placeholder, min, max }: {
  value: string | number; onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; min?: number; max?: number;
}) {
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} min={min} max={max}
      className="zk-input"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(227,180,88,0.2)",
        borderRadius: 10, color: C.cream,
        padding: "10px 14px", width: "100%", fontSize: 14,
        outline: "none", boxSizing: "border-box",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    />
  );
}

/* Select */
function SelectStyle({ value, onChange, children }: {
  value: string | number; onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value} onChange={onChange}
      style={{
        background: "rgba(16,22,54,0.9)",
        border: "1px solid rgba(227,180,88,0.2)",
        borderRadius: 10, color: C.cream,
        padding: "10px 14px", width: "100%", fontSize: 14,
        outline: "none", boxSizing: "border-box", cursor: "pointer",
      }}
    >
      {children}
    </select>
  );
}

/* Premium Lock */
function PremiumLock({ onUnlock }: { onUnlock: () => void }) {
  return (
    <Card glow style={{ textAlign: "center", padding: "44px 28px" }}>
      <div style={{ fontSize: 48, marginBottom: 16, filter: "drop-shadow(0 0 12px rgba(227,180,88,0.5))" }}>
        🔮
      </div>
      <div className="shimmer-text" style={{ fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
        Премиум хэсэг
      </div>
      <div style={{ color: C.dim, fontSize: 14, marginBottom: 28, lineHeight: 1.75, maxWidth: 320, margin: "0 auto 28px" }}>
        Хосын харилцаа, мөнгөний зурхай болон AI нэгдсэн
        дүн шинжилгээг нэвтрүүлэхийн тулд дансаа сайжруулна уу.
      </div>
      <GoldButton onClick={onUnlock}>✦ Туршилтаар нэвтрэх</GoldButton>
    </Card>
  );
}

/* Score meter */
function ScoreMeter({ score }: { score: number }) {
  const clamp = Math.min(100, Math.max(0, score));
  const color = clamp >= 82 ? C.gold : clamp >= 70 ? C.green : clamp >= 58 ? C.blue : clamp >= 45 ? C.dim : C.red;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: C.dim, fontSize: 12, letterSpacing: 0.5 }}>НИЙЦЭЛИЙН ОНОО</span>
        <span style={{ color, fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>{clamp}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, height: 10, overflow: "hidden", position: "relative" }}>
        <div style={{
          width: `${clamp}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 10, transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 10px ${color}88`,
        }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   АППЫН ТӨЛӨВИЙН ТӨРЛҮҮД
═══════════════════════════════════════════════════════ */

interface Profile {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: "male" | "female";
}

interface PartnerProfile {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}

const DEFAULT_PROFILE: Profile = {
  name: "",
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  gender: "male",
};

const DEFAULT_PARTNER: PartnerProfile = {
  name: "",
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
};

const TABS = [
  { id: "daily", label: "☀️ Өдрийн" },
  { id: "mongol", label: "🐉 Монгол" },
  { id: "western", label: "⭐ Өрнийн" },
  { id: "numerology", label: "🔢 Тооны" },
  { id: "palm", label: "🖐 Алганы" },
  { id: "compat", label: "💑 Хосын" },
  { id: "money", label: "💰 Мөнгөний" },
  { id: "unified", label: "✨ Нэгдсэн дүгнэлт" },
];

/* ═══════════════════════════════════════════════════════
   ҮНДСЭН КОМПОНЕНТ
═══════════════════════════════════════════════════════ */

export default function ZurkhaApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("daily");
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [partner, setPartner] = useState<PartnerProfile>(DEFAULT_PARTNER);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Palm state
  const [palmAnswers, setPalmAnswers] = useState<Record<string, string>>({});
  const [palmImageB64, setPalmImageB64] = useState<string | null>(null);
  const [palmMediaType, setPalmMediaType] = useState<string>("image/jpeg");
  const [palmResult, setPalmResult] = useState<Record<string, string> | null>(null);
  const [palmLoading, setPalmLoading] = useState(false);
  const palmInputRef = useRef<HTMLInputElement>(null);

  // Unified AI analysis
  const [unifiedResult, setUnifiedResult] = useState<{
    summary: string;
    remedies: string[];
  } | null>(null);
  const [unifiedLoading, setUnifiedLoading] = useState(false);

  // Compatibility
  const [compatResult, setCompatResult] = useState<CompatResult | null>(null);
  const [partnerSaved, setPartnerSaved] = useState(false);

  // Money
  const [moneyResult, setMoneyResult] = useState<MoneyResult | null>(null);

  /* ── Дансны мэдээлэл ачаалах ── */
  useEffect(() => {
    (async () => {
      const auth = await store.get<boolean>("isAuthenticated");
      if (auth) setIsAuthenticated(true);
      const saved = await store.get<Profile>("profile");
      if (saved) {
        setProfile(saved);
        setProfileSaved(true);
      }
      const prem = await store.get<boolean>("isPremium");
      if (prem) setIsPremium(true);
      const partnerSavedData = await store.get<PartnerProfile>("partner");
      if (partnerSavedData) {
        setPartner(partnerSavedData);
        setPartnerSaved(true);
      }
    })();
  }, []);

  /* ── AuthScreen дуусмагц дуудагдана ── */
  const handleAuthComplete = useCallback(
    async (_provider: string, prof: Profile) => {
      await store.set("isAuthenticated", true);
      await store.set("profile", prof);
      setProfile(prof);
      setProfileSaved(true);
      setIsAuthenticated(true);
    },
    []
  );

  /* ── Профайл хадгалах ── */
  const saveProfile = useCallback(async () => {
    await store.set("profile", profile);
    setProfileSaved(true);
    setShowProfileModal(false);
  }, [profile]);

  /* ── Хамтрагчийн профайл хадгалах ── */
  const savePartner = useCallback(async () => {
    await store.set("partner", partner);
    setPartnerSaved(true);
  }, [partner]);

  /* ── Туршилт Premium ── */
  const unlockPremium = useCallback(async () => {
    await store.set("isPremium", true);
    setIsPremium(true);
    setShowPremiumModal(false);
  }, []);

  /* ── Гарах ── */
  const handleLogout = useCallback(async () => {
    await store.del("isAuthenticated");
    await store.del("profile");
    await store.del("isPremium");
    setIsAuthenticated(false);
    setProfileSaved(false);
    setProfile(DEFAULT_PROFILE);
    setIsPremium(false);
    setShowProfileMenu(false);
  }, []);

  /* ── Мөнгөний зурхай тооцоо ── */
  useEffect(() => {
    if (!profileSaved) return;
    const mz = mongolZurkhai(profile.birthYear, profile.birthMonth, profile.birthDay);
    const month = new Date().getMonth() + 1;
    setMoneyResult(getMoneyHoroscope(mz.animal.name, mz.element, month));
  }, [profileSaved, profile.birthYear]);

  /* ── Хосын нийцэл тооцоо ── */
  useEffect(() => {
    if (!profileSaved || !partnerSaved) return;
    const mz1 = mongolZurkhai(profile.birthYear, profile.birthMonth, profile.birthDay);
    const ws1 = westernSign(profile.birthMonth, profile.birthDay);
    const lp1 = lifePathSteps(profile.birthYear, profile.birthMonth, profile.birthDay).value;

    const mz2 = mongolZurkhai(partner.birthYear, partner.birthMonth, partner.birthDay);
    const ws2 = westernSign(partner.birthMonth, partner.birthDay);
    const lp2 = lifePathSteps(partner.birthYear, partner.birthMonth, partner.birthDay).value;

    const result = calculateCompatibility(
      mz1.animalIdx,
      mz1.element,
      ws1.el,
      lp1,
      mz2.animalIdx,
      mz2.element,
      ws2.el,
      lp2
    );
    setCompatResult(result);
  }, [profileSaved, partnerSaved, profile, partner]);

  /* ── Алганы зураг боловсруулах ── */
  const handlePalmImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      setPalmMediaType(file.type || "image/jpeg");
      setPalmImageB64(raw.split(",")[1] ?? raw);
    };
    reader.readAsDataURL(file);
  };

  const analyzePalmImage = async () => {
    if (!palmImageB64) return;
    setPalmLoading(true);
    try {
      const res = await fetch("/api/analyze-palm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: palmImageB64, mediaType: palmMediaType }),
      });
      const data = await res.json();
      setPalmResult(data);
    } catch {
      setPalmResult({ error: "Серверт холбогдоход алдаа гарлаа." });
    } finally {
      setPalmLoading(false);
    }
  };

  /* ── Нэгдсэн AI дүн шинжилгээ ── */
  const runUnifiedAnalysis = async () => {
    if (!profileSaved) return;
    const mz = mongolZurkhai(profile.birthYear, profile.birthMonth, profile.birthDay);
    const ws = westernSign(profile.birthMonth, profile.birthDay);
    const lp = lifePathSteps(profile.birthYear, profile.birthMonth, profile.birthDay);
    const palmSummary = palmResult?.summary ?? "Алганы шинжилгээ хийгдээгүй";

    const profileText = `Монгол зурхай: ${mz.animal.name} (${mz.element} махбод). Өрнийн зурхай: ${ws.name} (${ws.el} элемент). Амьдралын зам: ${lp.value}. Алганы дүн: ${palmSummary}.`;

    setUnifiedLoading(true);
    try {
      const res = await fetch("/api/unified-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profileText }),
      });
      const data = await res.json();
      setUnifiedResult(data);
    } catch {
      setUnifiedResult({ summary: "Серверт холбогдоход алдаа гарлаа.", remedies: [] });
    } finally {
      setUnifiedLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────── */
  /* Профайл шаардлагатай газарт харуулах боломжтой      */
  /* ──────────────────────────────────────────────────── */

  const mz = profileSaved ? mongolZurkhai(profile.birthYear, profile.birthMonth, profile.birthDay) : null;
  const ws = profileSaved
    ? westernSign(profile.birthMonth, profile.birthDay)
    : null;
  const lp = profileSaved
    ? lifePathSteps(profile.birthYear, profile.birthMonth, profile.birthDay)
    : null;
  const daily =
    profileSaved && mz && ws
      ? dailyHoroscope(mz.animal.name, ws.name, todayISO())
      : null;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */

  return (
    <div
      style={{
        minHeight: "100vh",
        color: C.cream,
        fontFamily:
          "'Segoe UI', 'Helvetica Neue', Arial, 'Mongolian Baiti', sans-serif",
        position: "relative",
      }}
    >
      {/* Арын зураг */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/bg-zodiac.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          filter: "blur(3px)",
          transform: "scale(1.05)",
          opacity: 0.65,
        }}
      />
      {/* Хөх сүүдрийн overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(160deg, rgba(11,16,60,0.55) 0%, rgba(10,20,80,0.45) 50%, rgba(5,10,40,0.55) 100%)",
          zIndex: 1,
        }}
      />
      {/* Бүх контент overlay-н дээр */}
      <div style={{ position: "relative", zIndex: 2 }}>
      {/* Нэвтрээгүй бол AuthScreen харуулна */}
      {!isAuthenticated && (
        <AuthScreen onComplete={handleAuthComplete} />
      )}
      {isAuthenticated && (<>
      {/* ══ HEADER ══ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(8,12,32,0.82)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid rgba(227,180,88,0.18)`,
          boxShadow: "0 2px 24px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            height: 64,
          }}
        >
          {/* Лого */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="hdr-logo-icon"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}, #7B5EA7)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: `0 0 14px ${C.gold}55`,
                flexShrink: 0,
              }}
            >
              🔮
            </div>
            <div>
              <div
                className="hdr-logo-title"
                style={{
                  background: `linear-gradient(90deg, ${C.goldSoft}, #C9A0DC)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: 0.4,
                  lineHeight: 1.2,
                }}
              >
                Зурхайч
              </div>
              <div className="hdr-logo-sub" style={{ color: C.dim, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Өөрийгөө таних ухаан
              </div>
            </div>
          </div>

          {/* Баруун тал — профайл */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isPremium && (
              <div className="hdr-premium" style={{
                background: `linear-gradient(135deg, ${C.gold}33, ${C.gold}11)`,
                border: `1px solid ${C.gold}55`,
                borderRadius: 20, padding: "3px 10px",
                fontSize: 11, fontWeight: 700, color: C.gold,
                letterSpacing: 0.5, whiteSpace: "nowrap",
              }}>
                ⭐ Premium
              </div>
            )}

            {profileSaved ? (
              /* Профайл — avatar + нэр + dropdown */
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowProfileMenu((v) => !v)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "4px 8px 4px 4px", borderRadius: 28,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(227,180,88,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Avatar — алтан */}
                  <div className="hdr-avatar" style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.gold}, #c4862a)`,
                    border: `2px solid ${C.goldSoft}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "#16100a",
                    flexShrink: 0, boxShadow: `0 0 12px ${C.gold}55`,
                    userSelect: "none",
                  }}>
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  {/* Нэр */}
                  <div className="hdr-profile-name" style={{ textAlign: "left" }}>
                    <div style={{ color: C.cream, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                      {profile.name || "Хэрэглэгч"}
                    </div>
                    <div style={{ color: C.dim, fontSize: 10, letterSpacing: 0.5 }}>
                      ▾ тохируулах
                    </div>
                  </div>
                </button>

                {/* Dropdown menu */}
                {showProfileMenu && (
                  <>
                    {/* Хаах overlay */}
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 199 }}
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div style={{
                      position: "absolute", top: "calc(100% + 10px)", right: 0,
                      background: "rgba(10,14,36,0.97)",
                      border: "1px solid rgba(227,180,88,0.25)",
                      borderRadius: 14, overflow: "hidden", zIndex: 200,
                      minWidth: 170,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(227,180,88,0.08)",
                    }}>
                      <button
                        onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", background: "transparent", border: "none",
                          borderBottom: "1px solid rgba(227,180,88,0.1)",
                          color: C.cream, padding: "13px 18px",
                          cursor: "pointer", fontSize: 14, fontWeight: 600,
                          textAlign: "left",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(227,180,88,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: 16 }}>👤</span>
                        Мэдээлэл
                      </button>
                      <a
                        href="https://github.com/drinchinbumba-coder/zurhaich/releases/download/1.0.1/app-debug.apk"
                        download
                        onClick={() => setShowProfileMenu(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", background: "transparent",
                          borderBottom: "1px solid rgba(227,180,88,0.1)",
                          color: C.cream, padding: "13px 18px",
                          cursor: "pointer", fontSize: 14, fontWeight: 600,
                          textDecoration: "none",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(227,180,88,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: 16 }}>📱</span>
                        Апп татах
                      </a>
                      <button
                        onClick={handleLogout}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", background: "transparent", border: "none",
                          color: "#e07070", padding: "13px 18px",
                          cursor: "pointer", fontSize: 14, fontWeight: 600,
                          textAlign: "left",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,80,60,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: 16 }}>🚪</span>
                        Гарах
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Профайл байхгүй — эхлэх товч */
              <button
                onClick={() => setShowProfileModal(true)}
                style={{
                  background: `linear-gradient(135deg, ${C.gold}, #b8892e)`,
                  border: "none", borderRadius: 22, padding: "9px 20px",
                  color: "#1a1000", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 6, boxShadow: `0 4px 14px ${C.gold}44`,
                }}
              >
                <span>✦</span> Эхлэх
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══ TAB МӨР — sticky, scroll хийхэд хөлддөг ══ */}
      <div
        style={{
          position: "sticky",
          top: 64,
          zIndex: 99,
          background: "rgba(8,12,32,0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid rgba(227,180,88,0.12)`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="tabs-row"
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "10px 16px",
            gap: 4,
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${C.gold}33, ${C.gold}18)`
                    : "transparent",
                  border: active
                    ? `1px solid ${C.gold}66`
                    : "1px solid transparent",
                  borderRadius: 24,
                  color: active ? C.goldSoft : C.dim,
                  padding: "7px 14px",
                  cursor: "pointer",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.18s ease",
                  boxShadow: active ? `0 0 12px ${C.gold}22` : "none",
                  letterSpacing: 0.2,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* АГУУЛГА */}
      <main
        className="tab-content"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "28px 16px 72px",
        }}
      >
        {/* Профайл байхгүй бол сануулга */}
        {!profileSaved && (
          <Card
            style={{
              textAlign: "center",
              padding: "32px 20px",
              marginBottom: 24,
              border: `1px solid ${C.gold}55`,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌟</div>
            <div
              style={{
                color: C.goldSoft,
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 8,
              }}
            >
              Өөрийгөө таних зурхай
            </div>
            <div
              style={{
                color: C.dim,
                fontSize: 14,
                marginBottom: 22,
                lineHeight: 1.7,
              }}
            >
              Монгол зурхай, өрнийн астрологи, тооны болон алганы зурхайг нэгтгэсэн
              гүнзгий таниулгын систем. Эхлэхийн тулд профайлаа нэмнэ үү.
            </div>
            <GoldButton onClick={() => setShowProfileModal(true)}>
              Профайл нэмэх
            </GoldButton>
          </Card>
        )}

        {/* ════════════ ТАБ КОНТЕНТ ════════════ */}

        {/* ─── 1. ӨДРИЙН ЗУРХАЙ ─── */}
        {activeTab === "daily" && (
          <TabDaily
            profileSaved={profileSaved}
            profile={profile}
            daily={daily}
            mz={mz}
            ws={ws}
            onAddProfile={() => setShowProfileModal(true)}
          />
        )}

        {/* ─── 2. МОНГОЛ ЗУРХАЙ ─── */}
        {activeTab === "mongol" && (
          <TabMongol
            profileSaved={profileSaved}
            mz={mz}
            onAddProfile={() => setShowProfileModal(true)}
          />
        )}

        {/* ─── 3. ӨРНИЙН ЗУРХАЙ ─── */}
        {activeTab === "western" && (
          <TabWestern
            profileSaved={profileSaved}
            ws={ws}
            onAddProfile={() => setShowProfileModal(true)}
          />
        )}

        {/* ─── 4. ТООНЫ ЗУРХАЙ ─── */}
        {activeTab === "numerology" && (
          <TabNumerology
            profileSaved={profileSaved}
            lp={lp}
            onAddProfile={() => setShowProfileModal(true)}
          />
        )}

        {/* ─── 5. АЛГАНЫ ЗУРХАЙ ─── */}
        {activeTab === "palm" && (
          <TabPalm
            isPremium={isPremium}
            onUnlock={() => setShowPremiumModal(true)}
            palmAnswers={palmAnswers}
            setPalmAnswers={setPalmAnswers}
            palmImageB64={palmImageB64}
            palmResult={palmResult}
            palmLoading={palmLoading}
            onImageChange={handlePalmImage}
            onAnalyzeImage={analyzePalmImage}
            palmInputRef={palmInputRef}
          />
        )}

        {/* ─── 6. ХОСЫН ХАРИЛЦАА ─── */}
        {activeTab === "compat" && (
          <TabCompat
            profileSaved={profileSaved}
            profile={profile}
            partner={partner}
            setPartner={setPartner}
            partnerSaved={partnerSaved}
            onSavePartner={savePartner}
            compatResult={compatResult}
            mz={mz}
            isPremium={isPremium}
            onUnlock={() => setShowPremiumModal(true)}
            onAddProfile={() => setShowProfileModal(true)}
          />
        )}

        {/* ─── 7. МӨНГӨНИЙ ЗУРХАЙ ─── */}
        {activeTab === "money" && (
          <TabMoney
            profileSaved={profileSaved}
            mz={mz}
            moneyResult={moneyResult}
            isPremium={isPremium}
            onUnlock={() => setShowPremiumModal(true)}
            onAddProfile={() => setShowProfileModal(true)}
          />
        )}

        {/* ─── 8. НЭГДСЭН ШИНЖИЛГЭЭ ─── */}
        {activeTab === "unified" && (
          <TabUnified
            profileSaved={profileSaved}
            mz={mz}
            ws={ws}
            lp={lp}
            isPremium={isPremium}
            unifiedResult={unifiedResult}
            unifiedLoading={unifiedLoading}
            onRunAnalysis={runUnifiedAnalysis}
            onUnlock={() => setShowPremiumModal(true)}
            onAddProfile={() => setShowProfileModal(true)}
          />
        )}
      </main>

      {/* ═══ ПРОФАЙЛ МОДАЛ ═══ */}
      <Modal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Профайл тохируулах"
      >
        <Field label="Нэр">
          <InputStyle
            value={profile.name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Таны нэр"
          />
        </Field>
        <Field label="Төрсөн он">
          <InputStyle
            type="number"
            value={profile.birthYear}
            onChange={(e) =>
              setProfile((p) => ({ ...p, birthYear: Number(e.target.value) }))
            }
            min={1924}
            max={2024}
          />
        </Field>
        <Field label="Төрсөн сар">
          <SelectStyle
            value={profile.birthMonth}
            onChange={(e) =>
              setProfile((p) => ({ ...p, birthMonth: Number(e.target.value) }))
            }
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}-р сар
              </option>
            ))}
          </SelectStyle>
        </Field>
        <Field label="Төрсөн өдөр">
          <InputStyle
            type="number"
            value={profile.birthDay}
            onChange={(e) =>
              setProfile((p) => ({ ...p, birthDay: Number(e.target.value) }))
            }
            min={1}
            max={31}
          />
        </Field>
        <Field label="Хүйс">
          <SelectStyle
            value={profile.gender}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                gender: e.target.value as "male" | "female",
              }))
            }
          >
            <option value="male">Эрэгтэй</option>
            <option value="female">Эмэгтэй</option>
          </SelectStyle>
        </Field>
        <div style={{ marginTop: 20 }}>
          <GoldButton onClick={saveProfile}>Хадгалах</GoldButton>
        </div>
      </Modal>

      {/* ═══ PREMIUM МОДАЛ ═══ */}
      <Modal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="⭐ Premium Эрхийг Идэвхжүүлэх"
      >
        <div
          style={{
            textAlign: "center",
            color: C.dim,
            fontSize: 14,
            lineHeight: 1.8,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <p>Premium хэрэглэгч болсноор:</p>
          <ul
            style={{
              textAlign: "left",
              listStyle: "none",
              padding: 0,
              margin: "12px 0",
            }}
          >
            {[
              "💑 Хосын харилцааны гүнзгий шинжилгээ",
              "💰 Сарын мөнгөний зурхай",
              "✨ AI нэгдсэн дүн шинжилгээ",
              "🖐 Алганы зургийн AI тайлбар",
              "📊 Хосын нийцлийн 4 хэмжүүрийн дэлгэрэнгүй",
            ].map((item, i) => (
              <li
                key={i}
                style={{
                  padding: "6px 0",
                  color: C.cream,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <GoldButton onClick={unlockPremium}>
          Туршилтаар идэвхжүүлэх (Үнэгүй)
        </GoldButton>
      </Modal>
    </>)}
    </div>
  </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ТАБ КОМПОНЕНТҮҮД
═══════════════════════════════════════════════════════ */

/* ─── Өдрийн зурхай ─── */
function TabDaily({
  profileSaved,
  profile,
  daily,
  mz,
  ws,
  onAddProfile,
}: {
  profileSaved: boolean;
  profile: Profile;
  daily: ReturnType<typeof dailyHoroscope> | null;
  mz: ReturnType<typeof mongolZurkhai> | null;
  ws: ReturnType<typeof westernSign> | null;
  onAddProfile: () => void;
}) {
  if (!profileSaved || !daily || !mz || !ws) {
    return (
      <NeedProfile onAddProfile={onAddProfile} />
    );
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()} оны ${today.getMonth() + 1}-р сарын ${today.getDate()}`;

  const sections = [
    { icon: "🌟", label: "Ерөнхий", text: daily.general },
    { icon: "💕", label: "Хайр дурлал", text: daily.love },
    { icon: "💼", label: "Ажил карьер", text: daily.career },
    { icon: "🌿", label: "Эрүүл мэнд", text: daily.health },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              color: C.goldSoft,
              fontWeight: 700,
              fontSize: 18,
              margin: 0,
            }}
          >
            {profile.name ? `${profile.name}-ийн өдрийн зурхай` : "Өдрийн зурхай"}
          </h2>
          <div style={{ color: C.dim, fontSize: 13, marginTop: 4 }}>
            {dateStr}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Pill label={mz.animal.emoji + " " + mz.animal.name} />
          <Pill label={ws.emoji + " " + ws.name} />
        </div>
      </div>

      {/* Азын тоо ба өнгө */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <Card
          style={{
            flex: 1,
            minWidth: 120,
            textAlign: "center",
            padding: "16px 12px",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>🎲</div>
          <div style={{ color: C.dim, fontSize: 11, marginBottom: 2 }}>
            АЗ БОЛСОН ТОО
          </div>
          <div style={{ color: C.gold, fontWeight: 800, fontSize: 28 }}>
            {daily.luckyNum}
          </div>
        </Card>
        <Card
          style={{
            flex: 2,
            minWidth: 160,
            padding: "16px 18px",
          }}
        >
          <div style={{ color: C.dim, fontSize: 11, marginBottom: 6 }}>
            ӨНӨӨДРИЙН ӨНГ
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: colorToHex(daily.color),
                border: `2px solid ${C.line}`,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{daily.color}</div>
              <div style={{ color: C.dim, fontSize: 12 }}>
                Өнөөдрийн азын өнгө
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Зурхайн хэсгүүд */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map((s) => (
          <Card key={s.label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span
                style={{ color: C.goldSoft, fontWeight: 600, fontSize: 14 }}
              >
                {s.label}
              </span>
            </div>
            <p
              style={{
                color: C.cream,
                fontSize: 14,
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              {s.text}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Монгол зурхай ─── */
function TabMongol({
  profileSaved,
  mz,
  onAddProfile,
}: {
  profileSaved: boolean;
  mz: ReturnType<typeof mongolZurkhai> | null;
  onAddProfile: () => void;
}) {
  if (!profileSaved || !mz) return <NeedProfile onAddProfile={onAddProfile} />;

  const elem = ELEMENTS.find((e) => e.name === mz.element);

  return (
    <div>
      <SectionTitle icon="🐉" title="Монгол зурхай" />
      <Card
        style={{
          textAlign: "center",
          padding: "30px 20px",
          marginBottom: 16,
          background: `linear-gradient(135deg, ${C.panel}, ${C.panelSoft})`,
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 8 }}>{mz.animal.emoji}</div>
        <div style={{ color: C.goldSoft, fontWeight: 800, fontSize: 24 }}>
          {mz.animal.name} жилийн хүн
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          <Pill
            label={mz.element + " махбод"}
            color="#fff"
            bg={`${mz.elementHex}55`}
          />
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <ParaTitle>Зан чанар</ParaTitle>
        <p style={paraStyle}>{mz.animal.trait}</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card>
          <ParaTitle>💪 Давуу тал</ParaTitle>
          <p style={{ ...paraStyle, margin: 0 }}>{mz.animal.strength}</p>
        </Card>
        <Card>
          <ParaTitle>⚠️ Дутагдал</ParaTitle>
          <p style={{ ...paraStyle, margin: 0 }}>{mz.animal.weakness}</p>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <ParaTitle>💚 Нийцдэг жил</ParaTitle>
        <p style={paraStyle}>{mz.animal.match}</p>
      </Card>

      {elem && (
        <Card
          style={{
            borderLeft: `3px solid ${elem.hex}`,
            marginBottom: 16,
          }}
        >
          <ParaTitle>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: elem.hex,
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            {elem.name} махбод · {elem.color} өнгө
          </ParaTitle>
          <p style={paraStyle}>{elem.desc}</p>
        </Card>
      )}

      <Card>
        <ParaTitle>💰 Мөнгөтэй харьцах хэв маяг</ParaTitle>
        <p style={paraStyle}>{mz.animal.moneyStyle}</p>
      </Card>

      {REMEDY_ELEMENT[mz.element] && (
        <Card style={{ marginTop: 12, borderTop: `2px solid ${C.gold}44` }}>
          <ParaTitle>Махбодын арга зарал</ParaTitle>
          <p style={paraStyle}>{REMEDY_ELEMENT[mz.element]}</p>
        </Card>
      )}
    </div>
  );
}

/* ─── Өрнийн зурхай ─── */
function TabWestern({
  profileSaved,
  ws,
  onAddProfile,
}: {
  profileSaved: boolean;
  ws: ReturnType<typeof westernSign> | null;
  onAddProfile: () => void;
}) {
  if (!profileSaved || !ws) return <NeedProfile onAddProfile={onAddProfile} />;

  return (
    <div>
      <SectionTitle icon="⭐" title="Өрнийн зурхай" />
      <Card
        style={{
          textAlign: "center",
          padding: "28px 20px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 64 }}>{ws.emoji}</div>
        <div style={{ color: C.goldSoft, fontWeight: 800, fontSize: 22, marginTop: 8 }}>
          {ws.name}
        </div>
        <div style={{ color: C.dim, fontSize: 13, marginTop: 6 }}>
          {ws.from[0]}/{ws.from[1]} – {ws.to[0]}/{ws.to[1]} · {ws.planet} гариг · {ws.el} элемент
        </div>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <ParaTitle>Зан чанар</ParaTitle>
        <p style={paraStyle}>{ws.desc}</p>
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <ParaTitle>💕 Хайр дурлал</ParaTitle>
        <p style={paraStyle}>{ws.love}</p>
      </Card>
      <Card>
        <ParaTitle>💼 Карьер</ParaTitle>
        <p style={paraStyle}>{ws.career}</p>
      </Card>
    </div>
  );
}

/* ─── Тооны зурхай ─── */
function TabNumerology({
  profileSaved,
  lp,
  onAddProfile,
}: {
  profileSaved: boolean;
  lp: { value: number; steps: string } | null;
  onAddProfile: () => void;
}) {
  if (!profileSaved || !lp) return <NeedProfile onAddProfile={onAddProfile} />;

  const num = NUMEROLOGY[lp.value];

  return (
    <div>
      <SectionTitle icon="🔢" title="Тооны зурхай" />
      <Card
        style={{
          textAlign: "center",
          padding: "28px 20px",
          marginBottom: 16,
          background: `linear-gradient(135deg, ${C.panel}, ${C.panelSoft})`,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: C.gold,
            lineHeight: 1,
          }}
        >
          {lp.value}
        </div>
        <div style={{ color: C.goldSoft, fontWeight: 700, fontSize: 18, marginTop: 8 }}>
          {num?.title ?? "Тусгай тоо"}
        </div>
        <div
          style={{
            color: C.dim,
            fontSize: 12,
            marginTop: 10,
            fontFamily: "monospace",
          }}
        >
          {lp.steps}
        </div>
      </Card>

      {num && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <ParaTitle>Тайлбар</ParaTitle>
            <p style={paraStyle}>{num.desc}</p>
          </Card>
          <Card style={{ marginBottom: 12 }}>
            <ParaTitle>💼 Карьерийн зам</ParaTitle>
            <p style={paraStyle}>{num.career}</p>
          </Card>
          <Card>
            <ParaTitle>Арга зарал</ParaTitle>
            <p style={paraStyle}>{NUM_ADVICE[lp.value] ?? REMEDY_POOL[0]}</p>
          </Card>
        </>
      )}
    </div>
  );
}

/* ─── Алганы зурхай ─── */
function TabPalm({
  isPremium,
  onUnlock,
  palmAnswers,
  setPalmAnswers,
  palmImageB64,
  palmResult,
  palmLoading,
  onImageChange,
  onAnalyzeImage,
  palmInputRef,
}: {
  isPremium: boolean;
  onUnlock: () => void;
  palmAnswers: Record<string, string>;
  setPalmAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  palmImageB64: string | null;
  palmResult: Record<string, string> | null;
  palmLoading: boolean;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeImage: () => void;
  palmInputRef: React.RefObject<HTMLInputElement>;
}) {
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  if (!isPremium) return <PremiumLock onUnlock={onUnlock} />;

  return (
    <div>
      <SectionTitle icon="🖐" title="Алганы зурхай" />

      {/* Горим сонгох */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setMode("manual")}
          style={{
            ...toggleBtn,
            background: mode === "manual" ? C.gold : C.panelSoft,
            color: mode === "manual" ? "#1a1000" : C.dim,
          }}
        >
          ✍️ Гараар бөглөх
        </button>
        <button
          onClick={() => setMode("ai")}
          style={{
            ...toggleBtn,
            background: mode === "ai" ? C.gold : C.panelSoft,
            color: mode === "ai" ? "#1a1000" : C.dim,
          }}
        >
          📷 AI зургаар
        </button>
      </div>

      {mode === "manual" ? (
        <div>
          {PALM_QUESTIONS.map((q) => (
            <Card key={q.key} style={{ marginBottom: 14 }}>
              <div
                style={{
                  color: C.goldSoft,
                  fontWeight: 600,
                  marginBottom: 4,
                  fontSize: 15,
                }}
              >
                {q.title}
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginBottom: 10 }}>
                {q.hint}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map((opt, i) => {
                  const sel = palmAnswers[q.key] === opt.label;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        setPalmAnswers((prev) => ({ ...prev, [q.key]: opt.label }))
                      }
                      style={{
                        background: sel ? `${C.gold}22` : C.bg2,
                        border: sel ? `1.5px solid ${C.gold}` : `1px solid ${C.line}`,
                        borderRadius: 10,
                        padding: "10px 14px",
                        textAlign: "left",
                        cursor: "pointer",
                        color: C.cream,
                        fontSize: 13,
                      }}
                    >
                      <strong style={{ color: sel ? C.goldSoft : C.dim }}>
                        {opt.label}
                      </strong>
                      {sel && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            color: C.cream,
                            lineHeight: 1.6,
                          }}
                        >
                          {opt.text}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}

          {Object.keys(palmAnswers).length === PALM_QUESTIONS.length && (
            <Card
              style={{
                marginTop: 8,
                background: `linear-gradient(135deg,${C.panel},${C.panelSoft})`,
                border: `1px solid ${C.gold}55`,
              }}
            >
              <ParaTitle>✨ Нийт дүгнэлт</ParaTitle>
              <p style={{ ...paraStyle, lineHeight: 1.8 }}>
                Таны алганы шугамууд нийлж харахад, амьдрал нь тань тогтвортой шугамтай — хүч чинэр, мэдрэмжийн тэнцвэр сайтай болон хувийн замдаа итгэлтэйгээр явж байна гэж харагдана. Дотоод сэтгэлийн дагуух замыг нь алдаа гэлгүй суралцал гэж харна уу.
              </p>
            </Card>
          )}
        </div>
      ) : (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <ParaTitle>📷 Алганы зургаа оруулах</ParaTitle>
            <p style={{ ...paraStyle, marginBottom: 14 }}>
              Зүүн гарынхаа алгыг дэлгэрэн, гэрэлтэй газар зурагладаад оруулна уу.
              AI тань зургаас шугамуудыг тайлбарлана.
            </p>
            <input
              ref={palmInputRef}
              type="file"
              accept="image/*"
              onChange={onImageChange}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <GoldButton
                small
                secondary
                onClick={() => palmInputRef.current?.click()}
              >
                📁 Зураг сонгох
              </GoldButton>
              {palmImageB64 && (
                <GoldButton small onClick={onAnalyzeImage} disabled={palmLoading}>
                  {palmLoading ? "Шинжилж байна..." : "🔍 Шинжлэх"}
                </GoldButton>
              )}
            </div>

            {palmImageB64 && (
              <img
                src={`data:image/jpeg;base64,${palmImageB64}`}
                alt="Palm preview"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "contain",
                  marginTop: 14,
                  borderRadius: 10,
                  border: `1px solid ${C.line}`,
                }}
              />
            )}
          </Card>

          {palmResult && (
            palmResult.error ? (
              <Card style={{ borderColor: C.red }}>
                <p style={{ color: C.red, margin: 0 }}>{palmResult.error}</p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["life", "head", "heart", "fate", "summary"].map((k) => {
                  const labels: Record<string, string> = {
                    life: "🌿 Амьдралын шугам",
                    head: "🧠 Оюуны шугам",
                    heart: "❤️ Зүрхний шугам",
                    fate: "🌟 Хувь заяаны шугам",
                    summary: "✨ Нийт дүгнэлт",
                  };
                  return palmResult[k] ? (
                    <Card key={k}>
                      <ParaTitle>{labels[k]}</ParaTitle>
                      <p style={paraStyle}>{palmResult[k]}</p>
                    </Card>
                  ) : null;
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Хосын харилцаа ─── */
function TabCompat({
  profileSaved,
  profile,
  partner,
  setPartner,
  partnerSaved,
  onSavePartner,
  compatResult,
  mz,
  isPremium,
  onUnlock,
  onAddProfile,
}: {
  profileSaved: boolean;
  profile: Profile;
  partner: PartnerProfile;
  setPartner: React.Dispatch<React.SetStateAction<PartnerProfile>>;
  partnerSaved: boolean;
  onSavePartner: () => void;
  compatResult: CompatResult | null;
  mz: ReturnType<typeof mongolZurkhai> | null;
  isPremium: boolean;
  onUnlock: () => void;
  onAddProfile: () => void;
}) {
  if (!profileSaved) return <NeedProfile onAddProfile={onAddProfile} />;
  if (!isPremium) return <PremiumLock onUnlock={onUnlock} />;

  const mz2 = mongolZurkhai(partner.birthYear, partner.birthMonth, partner.birthDay);
  const ws2 = westernSign(partner.birthMonth, partner.birthDay);
  const lp2 = lifePathSteps(partner.birthYear, partner.birthMonth, partner.birthDay);

  const levelInfo = compatResult ? COMPAT_SCORE_DESCS[compatResult.level] : null;
  const animalDescKey = compatResult?.animalDesc ?? "neutral";
  const animalDescText = ANIMAL_COMPAT_DESCS[animalDescKey] ?? "";

  return (
    <div>
      <SectionTitle icon="💑" title="Хосын харилцаа" />

      {/* Хамтрагчийн мэдээлэл */}
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            color: C.goldSoft,
            fontWeight: 600,
            marginBottom: 16,
            fontSize: 15,
          }}
        >
          Хамтрагчийн мэдээлэл
        </div>
        <Field label="Нэр">
          <InputStyle
            value={partner.name}
            onChange={(e) =>
              setPartner((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="Хамтрагчийн нэр"
          />
        </Field>
        <Field label="Төрсөн он">
          <InputStyle
            type="number"
            value={partner.birthYear}
            onChange={(e) =>
              setPartner((p) => ({ ...p, birthYear: Number(e.target.value) }))
            }
            min={1924}
            max={2024}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Сар">
            <SelectStyle
              value={partner.birthMonth}
              onChange={(e) =>
                setPartner((p) => ({ ...p, birthMonth: Number(e.target.value) }))
              }
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}-р сар
                </option>
              ))}
            </SelectStyle>
          </Field>
          <Field label="Өдөр">
            <InputStyle
              type="number"
              value={partner.birthDay}
              onChange={(e) =>
                setPartner((p) => ({ ...p, birthDay: Number(e.target.value) }))
              }
              min={1}
              max={31}
            />
          </Field>
        </div>
        <div style={{ marginTop: 8 }}>
          <GoldButton small onClick={onSavePartner}>
            Тооцоолох
          </GoldButton>
        </div>
      </Card>

      {/* Хоёр хосын харьцуулалт */}
      {partnerSaved && mz && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: 12,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <Card style={{ textAlign: "center", padding: "20px 14px" }}>
              <div style={{ fontSize: 36 }}>{mz.animal.emoji}</div>
              <div style={{ color: C.goldSoft, fontWeight: 700, fontSize: 14, marginTop: 6 }}>
                {profile.name || "Та"}
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>
                {mz.animal.name} · {mz.element}
              </div>
            </Card>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>💑</div>
              {compatResult && (
                <div
                  style={{
                    color: levelInfo?.color ?? C.gold,
                    fontWeight: 800,
                    fontSize: 20,
                    marginTop: 4,
                  }}
                >
                  {compatResult.totalScore}%
                </div>
              )}
            </div>

            <Card style={{ textAlign: "center", padding: "20px 14px" }}>
              <div style={{ fontSize: 36 }}>{mz2.animal.emoji}</div>
              <div style={{ color: C.goldSoft, fontWeight: 700, fontSize: 14, marginTop: 6 }}>
                {partner.name || "Хамтрагч"}
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 4 }}>
                {mz2.animal.name} · {mz2.element}
              </div>
            </Card>
          </div>

          {compatResult && levelInfo && (
            <>
              {/* Нийт оноо */}
              <Card
                style={{
                  marginBottom: 16,
                  borderColor: `${levelInfo.color}66`,
                  borderWidth: 2,
                }}
              >
                <div
                  style={{
                    color: levelInfo.color,
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 10,
                  }}
                >
                  {levelInfo.title}
                </div>
                <ScoreMeter score={compatResult.totalScore} />
                <p style={{ ...paraStyle, margin: 0 }}>{levelInfo.desc}</p>
              </Card>

              {/* Тайлбар */}
              <Card style={{ marginBottom: 14 }}>
                <ParaTitle>📋 Дэлгэрэнгүй тайлбар</ParaTitle>
                <p style={paraStyle}>{compatResult.summary}</p>
              </Card>

              {/* Дэлгэрэнгүй оноонууд */}
              <Card style={{ marginBottom: 14 }}>
                <ParaTitle>📊 Нийцлийн хэмжүүр</ParaTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    {
                      label: "🐉 Монгол амьтан (40%)",
                      val: Math.round(compatResult.animalScore / 0.4),
                      weighted: compatResult.animalScore,
                    },
                    {
                      label: "🌿 Монгол махбод (30%)",
                      val: Math.round(compatResult.mongolElemScore / 0.3),
                      weighted: compatResult.mongolElemScore,
                    },
                    {
                      label: "⭐ Өрнийн элемент (20%)",
                      val: Math.round(compatResult.westernElemScore / 0.2),
                      weighted: compatResult.westernElemScore,
                    },
                    {
                      label: "🔢 Амьдралын зам (10%)",
                      val: Math.round(compatResult.lpScore / 0.1),
                      weighted: compatResult.lpScore,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: C.dim }}>{item.label}</span>
                        <span style={{ color: C.cream, fontWeight: 600 }}>
                          {item.val}%
                        </span>
                      </div>
                      <div
                        style={{
                          background: C.panelSoft,
                          borderRadius: 6,
                          height: 6,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${item.val}%`,
                            height: "100%",
                            background: `linear-gradient(90deg,${C.gold}88,${C.gold})`,
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Амьтны нийцлийн тайлбар */}
              <Card style={{ marginBottom: 14 }}>
                <ParaTitle>
                  {mz.animal.emoji} {mz.animal.name} + {mz2.animal.emoji}{" "}
                  {mz2.animal.name}
                </ParaTitle>
                <p style={paraStyle}>{animalDescText}</p>
              </Card>

              {/* Хосын нийцлийн зөвлөмж */}
              <Card>
                <ParaTitle>💡 Зөвлөмж</ParaTitle>
                <ul style={{ margin: 0, padding: "0 0 0 18px" }}>
                  {compatResult.tips.map((tip, i) => (
                    <li
                      key={i}
                      style={{
                        color: C.cream,
                        fontSize: 14,
                        lineHeight: 1.7,
                        marginBottom: 6,
                      }}
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Хамтрагчийн мэдээлэл */}
              <Card style={{ marginTop: 14 }}>
                <ParaTitle>
                  {partner.name || "Хамтрагч"}-ийн зурхай
                </ParaTitle>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill label={`${mz2.animal.emoji} ${mz2.animal.name}`} />
                  <Pill label={`${mz2.element} махбод`} />
                  <Pill label={`${ws2.emoji} ${ws2.name}`} />
                  <Pill label={`Амьдралын зам: ${lp2.value}`} />
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Мөнгөний зурхай ─── */
function TabMoney({
  profileSaved,
  mz,
  moneyResult,
  isPremium,
  onUnlock,
  onAddProfile,
}: {
  profileSaved: boolean;
  mz: ReturnType<typeof mongolZurkhai> | null;
  moneyResult: MoneyResult | null;
  isPremium: boolean;
  onUnlock: () => void;
  onAddProfile: () => void;
}) {
  if (!profileSaved || !mz) return <NeedProfile onAddProfile={onAddProfile} />;
  if (!isPremium) return <PremiumLock onUnlock={onUnlock} />;
  if (!moneyResult) return null;

  const today = new Date();
  const monthName = `${today.getFullYear()} оны ${today.getMonth() + 1}-р сарын`;

  return (
    <div>
      <SectionTitle icon="💰" title="Мөнгөний зурхай" />
      <div style={{ color: C.dim, fontSize: 13, marginBottom: 16 }}>
        {monthName} мөнгөний зурхай · {mz.animal.emoji} {mz.animal.name}
      </div>

      {/* Ерөнхий тойм */}
      <Card
        style={{
          marginBottom: 14,
          background: `linear-gradient(135deg,${C.panel},${C.panelSoft})`,
          border: `1px solid ${C.gold}44`,
        }}
      >
        <ParaTitle>📊 Ерөнхий тойм</ParaTitle>
        <p style={paraStyle}>{moneyResult.overview}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: C.dim, fontSize: 11 }}>АЗ БОЛСОН ТОО</div>
            <div style={{ color: C.gold, fontWeight: 800, fontSize: 24 }}>
              {moneyResult.luckyNum}
            </div>
          </div>
          <div
            style={{
              width: 1,
              background: C.line,
            }}
          />
          <div>
            <div style={{ color: C.dim, fontSize: 11 }}>АЗ БОЛСОН ӨНГ</div>
            <div style={{ color: C.goldSoft, fontWeight: 700, fontSize: 16, marginTop: 2 }}>
              {moneyResult.luckyColor}
            </div>
          </div>
        </div>
      </Card>

      {/* Амьтны мөнгөний хэв маяг */}
      <Card style={{ marginBottom: 14, borderLeft: `3px solid ${C.gold}` }}>
        <ParaTitle>{mz.animal.emoji} {mz.animal.name}-ийн санхүүгийн зурхай</ParaTitle>
        <p style={{ ...paraStyle, color: C.goldSoft, fontStyle: "italic" }}>
          {moneyResult.animalMoney.energyDesc}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 12,
          }}
        >
          <div>
            <div style={{ color: C.dim, fontSize: 11, marginBottom: 4 }}>
              ХӨРӨНГӨ ОРУУЛАЛТ
            </div>
            <div style={{ color: C.cream, fontSize: 13 }}>
              {moneyResult.animalMoney.invest}
            </div>
          </div>
          <div>
            <div style={{ color: C.dim, fontSize: 11, marginBottom: 4 }}>
              ХУРИМТЛАЛ
            </div>
            <div style={{ color: C.cream, fontSize: 13 }}>
              {moneyResult.animalMoney.save}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ color: C.dim, fontSize: 11, marginBottom: 4 }}>
            БИЗНЕСИЙН ЧИГ
          </div>
          <div style={{ color: C.cream, fontSize: 13 }}>
            {moneyResult.animalMoney.business}
          </div>
        </div>
      </Card>

      {/* Зарлага */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Card>
          <ParaTitle>📈 Хөрөнгө оруулалт</ParaTitle>
          <p style={{ ...paraStyle, margin: 0, fontSize: 13 }}>{moneyResult.invest}</p>
        </Card>
        <Card>
          <ParaTitle>🏦 Хуримтлал</ParaTitle>
          <p style={{ ...paraStyle, margin: 0, fontSize: 13 }}>{moneyResult.save}</p>
        </Card>
      </div>

      {/* Анхааруулга */}
      <Card style={{ borderColor: `${C.red}55`, borderWidth: 1 }}>
        <ParaTitle style={{ color: C.red }}>⚠️ Анхааруулга</ParaTitle>
        <p style={{ ...paraStyle, margin: 0 }}>{moneyResult.warning}</p>
      </Card>
    </div>
  );
}

/* ─── Нэгдсэн шинжилгээ ─── */
function TabUnified({
  profileSaved,
  mz,
  ws,
  lp,
  isPremium,
  unifiedResult,
  unifiedLoading,
  onRunAnalysis,
  onUnlock,
  onAddProfile,
}: {
  profileSaved: boolean;
  mz: ReturnType<typeof mongolZurkhai> | null;
  ws: ReturnType<typeof westernSign> | null;
  lp: { value: number; steps: string } | null;
  isPremium: boolean;
  unifiedResult: { summary: string; remedies: string[] } | null;
  unifiedLoading: boolean;
  onRunAnalysis: () => void;
  onUnlock: () => void;
  onAddProfile: () => void;
}) {
  if (!profileSaved || !mz || !ws || !lp) return <NeedProfile onAddProfile={onAddProfile} />;
  if (!isPremium) return <PremiumLock onUnlock={onUnlock} />;

  return (
    <div>
      <SectionTitle icon="✨" title="Нэгдсэн шинжилгээ" />

      {/* Товч мэдэгдэл */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <Pill label={`${mz.animal.emoji} ${mz.animal.name}`} />
        <Pill label={`${mz.element} махбод`} />
        <Pill label={`${ws.emoji} ${ws.name}`} />
        <Pill label={`Амьдралын зам ${lp.value}`} />
      </div>

      {/* AI шинжилгээ */}
      {!unifiedResult && !unifiedLoading && (
        <Card
          style={{
            textAlign: "center",
            padding: "32px 20px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
          <div style={{ color: C.goldSoft, fontWeight: 600, marginBottom: 8 }}>
            AI нэгдсэн шинжилгээ
          </div>
          <div style={{ color: C.dim, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            Таны монгол зурхай, өрнийн астрологи болон тооны зурхайг нэгтгэн
            Claude AI гүнзгий тайлбар болон арга зарал бичнэ.
          </div>
          <GoldButton onClick={onRunAnalysis}>✨ Шинжилгээ эхлэх</GoldButton>
        </Card>
      )}

      {unifiedLoading && (
        <Card style={{ textAlign: "center", padding: "32px 20px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ color: C.dim }}>AI шинжилж байна...</div>
        </Card>
      )}

      {unifiedResult && !unifiedLoading && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <ParaTitle>🌟 Нэгдсэн тайлбар</ParaTitle>
            <p style={{ ...paraStyle, lineHeight: 1.9 }}>{unifiedResult.summary}</p>
          </Card>

          {unifiedResult.remedies?.length > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <ParaTitle>✨ Арга зарал</ParaTitle>
              <ul style={{ margin: 0, padding: "0 0 0 18px" }}>
                {unifiedResult.remedies.map((r, i) => (
                  <li
                    key={i}
                    style={{
                      color: C.cream,
                      fontSize: 14,
                      lineHeight: 1.7,
                      marginBottom: 8,
                    }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div style={{ textAlign: "center" }}>
            <GoldButton small secondary onClick={onRunAnalysis}>
              🔄 Дахин шинжлэх
            </GoldButton>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ТУСЛАХ КОМПОНЕНТҮҮД
═══════════════════════════════════════════════════════ */

function NeedProfile({ onAddProfile }: { onAddProfile: () => void }) {
  return (
    <Card glow style={{ textAlign: "center", padding: "44px 28px" }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>🌌</div>
      <div className="shimmer-text" style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
        Зурхайгаа нэвтрүүлэх
      </div>
      <div style={{ color: C.dim, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
        Профайлаа нэмснээр таны хувийн зурхай нэгдэн харагдана.
      </div>
      <GoldButton onClick={onAddProfile}>✦ Профайл нэмэх</GoldButton>
    </Card>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(227,180,88,0.12)",
          border: "1px solid rgba(227,180,88,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
          boxShadow: "0 0 16px rgba(227,180,88,0.2)",
        }}>
          {icon}
        </div>
        <h2
          style={{
            background: "linear-gradient(90deg, #F0CE8C, #C9A0DC)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800, fontSize: 20, margin: 0, letterSpacing: 0.3,
          }}
        >
          {title}
        </h2>
      </div>
      {/* Одны хуваагч */}
      <div className="star-divider">
        <span style={{ color: "rgba(227,180,88,0.5)", fontSize: 11 }}>✦</span>
        <span style={{ color: "rgba(201,160,220,0.4)", fontSize: 9 }}>✦</span>
        <span style={{ color: "rgba(227,180,88,0.3)", fontSize: 8 }}>✦</span>
      </div>
    </div>
  );
}

function ParaTitle({
  children,
  style: s = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        color: "rgba(201,160,220,0.9)",
        fontWeight: 700,
        fontSize: 11,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        display: "flex",
        alignItems: "center",
        gap: 6,
        ...s,
      }}
    >
      <span style={{ display: "inline-block", width: 3, height: 12, borderRadius: 2, background: "linear-gradient(180deg,#E3B458,#C9A0DC)", flexShrink: 0 }} />
      {children}
    </div>
  );
}

const paraStyle: React.CSSProperties = {
  color: "rgba(242,236,220,0.88)",
  fontSize: 14,
  lineHeight: 1.85,
  margin: "0 0 8px",
};

const toggleBtn: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.15s",
};

/* Өнгийн нэрийг HEX болгох */
function colorToHex(name: string): string {
  const map: Record<string, string> = {
    Ногоон: "#4CAF50",
    "Алтан шар": "#E3B458",
    Цагаан: "#E8ECF0",
    Цэнхэр: "#5B8DE0",
    Улаан: "#E05050",
    Ягаан: "#E080B0",
    Хүрэн: "#8B6347",
    Цэнхэрлэг: "#5BA0B0",
  };
  return map[name] ?? "#888";
}
