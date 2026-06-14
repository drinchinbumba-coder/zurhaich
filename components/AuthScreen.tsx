"use client";

import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import { C } from "@/lib/colors";
import { store } from "@/lib/store";

/* ── Google GSI type stub ──────────────────────────────────────────────────── */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (r: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          prompt: (
            cb?: (n: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void
          ) => void;
        };
      };
    };
  }
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const BACKEND = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

const MONTHS = [
  "1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар",
  "7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар",
];

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ProfileData {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: "male" | "female";
}

interface OtpData {
  sessionId: string;
  smsUri: string;
  displayInstruction: string;
  expiresAt: string;
}

interface Props {
  onComplete: (provider: string, profile: ProfileData) => void;
}

type Step = "landing" | "otp-pending" | "profile";

/* ── Styles ─────────────────────────────────────────────────────────────────── */

const inp: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: `1px solid rgba(227,180,88,0.25)`,
  borderRadius: 10,
  color: C.cream,
  padding: "11px 14px",
  width: "100%",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function AuthScreen({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("landing");
  const [provider, setProvider] = useState("");
  const [phone, setPhone] = useState("");
  const [otpData, setOtpData] = useState<OtpData | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    gender: "male",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [googleReady, setGoogleReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Google Sign-In ────────────────────────────────────────────────────── */

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });
      const data = (await res.json()) as { token?: string; user?: { name?: string; email?: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Google нэвтрэлт амжилтгүй");

      await store.set("authToken", data.token);
      setProvider("Google");
      if (data.user?.name) setProfile((p) => ({ ...p, name: data.user!.name! }));
      setStep("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, []);

  // Dynamically load GSI script, then initialize
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const init = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => handleGoogleCredential(r.credential),
        ux_mode: "popup",
        auto_select: false,
      });
      setGoogleReady(true);
    };

    if (window.google) { init(); return; }

    // Load script dynamically — works with static export unlike next/script
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (existing) { existing.addEventListener("load", init); return () => existing.removeEventListener("load", init); }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => setGoogleReady(true); // show button anyway; error shown on click
    document.head.appendChild(script);
  }, [handleGoogleCredential]);

  const handleGoogleClick = () => {
    if (!window.google) {
      setError("Google Sign-In ачааллагдаагүй. Хуудсыг шинэчлэнэ үү.");
      return;
    }
    setError("");
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) {
        setError("Google One Tap харагдахгүй байна. Хөтөчдөө Google акаунт нэвтэрсэн эсэхийг шалгана уу.");
      }
    });
  };

  /* ── OTP: start ─────────────────────────────────────────────────────────── */

  const startOtp = async () => {
    const clean = phone.replace(/[\s\-()]/g, "");
    if (!/^\d{8}$/.test(clean)) {
      setError("8 оронтой Монгол утасны дугаар оруулна уу (жишээ: 99001234)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND}/auth/otp/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean }),
      });
      const data = (await res.json()) as OtpData & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "OTP эхлүүлэх амжилтгүй");

      setOtpData(data);
      setProvider("Phone");
      const secs = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(secs);
      setStep("otp-pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP: countdown timer ──────────────────────────────────────────────── */

  useEffect(() => {
    if (step !== "otp-pending") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [step]);

  /* ── OTP: polling every 3s ─────────────────────────────────────────────── */

  useEffect(() => {
    if (step !== "otp-pending" || !otpData) return;

    // Capture expiresAt so the closure doesn't depend on changing state
    const expiresAt = new Date(otpData.expiresAt).getTime();
    const sessionId = otpData.sessionId;

    const poll = async () => {
      // Local expiry check — no need to call backend
      if (Date.now() > expiresAt) {
        clearInterval(pollRef.current!);
        setError("Хугацаа дууслаа. Дахин оролдоно уу.");
        setStep("landing");
        return;
      }

      try {
        const res = await fetch(`${BACKEND}/auth/otp/status/${sessionId}`);
        const data = (await res.json()) as {
          status: "PENDING" | "VERIFIED" | "EXPIRED";
          token?: string;
          user?: { phone?: string };
          error?: string;
        };

        if (data.status === "VERIFIED") {
          clearInterval(pollRef.current!);
          await store.set("authToken", data.token);
          setStep("profile");
        } else if (data.status === "EXPIRED") {
          clearInterval(pollRef.current!);
          setError("Хугацаа дууслаа. Дахин оролдоно уу.");
          setStep("landing");
        }
        // PENDING → keep polling
      } catch {
        /* network hiccup — keep polling */
      }
    };

    // Fire once immediately, then every 3s
    void poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current!);
  }, [step, otpData]); // timeLeft intentionally excluded — it changes every second and would reset the interval

  /* ── Profile submit ─────────────────────────────────────────────────────── */

  const handleProfileSubmit = () => {
    if (!profile.name.trim()) { setError("Нэрээ оруулна уу."); return; }
    if (profile.birthYear < 1924 || profile.birthYear > 2024) { setError("Төрсөн оноо 1924–2024 хооронд байх ёстой."); return; }
    if (profile.birthDay < 1 || profile.birthDay > 31) { setError("Өдөр 1–31 хооронд байх ёстой."); return; }
    setError("");
    onComplete(provider, profile);
  };

  const goBackToLanding = () => {
    clearInterval(pollRef.current!);
    clearInterval(timerRef.current!);
    setOtpData(null);
    setError("");
    setStep("landing");
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* ── LANDING ───────────────────────────────────────────────────────── */}
      {step === "landing" && (
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          {/* Лого */}
          <div
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `linear-gradient(135deg, #7B5EA7, ${C.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, margin: "0 auto 20px",
              boxShadow: `0 0 32px ${C.gold}55`,
            }}
          >🔮</div>

          <h1
            style={{
              background: `linear-gradient(90deg, ${C.goldSoft}, #C9A0DC)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 900, fontSize: 30, margin: "0 0 6px", letterSpacing: 0.5,
            }}
          >Зурхайч</h1>
          <p style={{ color: C.dim, fontSize: 13, marginBottom: 36, letterSpacing: 1, textTransform: "uppercase" }}>
            Өөрийгөө таних ухаан
          </p>

          {/* Google товч */}
          <button
            onClick={handleGoogleClick}
            disabled={loading || !googleReady}
            style={{
              background: "#fff",
              color: "#3c4043",
              border: "1px solid #dadce0",
              borderRadius: 12,
              padding: "13px 20px",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !googleReady ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              transition: "box-shadow 0.15s, transform 0.12s",
              opacity: loading || !googleReady ? 0.65 : 1,
            }}
            onMouseEnter={(e) => { if (googleReady) { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.18)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {googleReady ? (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6.1C12.7 13.2 17.9 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.9 46.5 31.7 46.5 24.5z"/>
                <path fill="#FBBC05" d="M10.8 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.5 13.3A23.7 23.7 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-6z"/>
                <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.2-7.9 2.2-6.1 0-11.3-3.7-13.2-9l-7.8 6C6.9 42.6 14.8 48 24 48z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#dadce0" strokeWidth="2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#4285F4" strokeWidth="2" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                </path>
              </svg>
            )}
            <span>{googleReady ? "Google-ээр нэвтрэх" : "Google ачааллаж байна..."}</span>
          </button>

          {/* Хуваагч */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(227,180,88,0.2)" }} />
            <span style={{ color: C.dim, fontSize: 12, letterSpacing: 1 }}>ЭСВЭЛ</span>
            <div style={{ flex: 1, height: 1, background: "rgba(227,180,88,0.2)" }} />
          </div>

          {/* Утасны дугаар + OTP */}
          <div
            style={{
              background: "rgba(16,23,53,0.75)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(227,180,88,0.18)",
              borderRadius: 16, padding: "20px",
            }}
          >
            <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, textAlign: "left" }}>
              Утасны дугаар
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(227,180,88,0.2)",
                borderRadius: 10, padding: "11px 12px",
                color: C.dim, fontSize: 15, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}>🇲🇳 +976</div>
              <input
                type="tel"
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="99001234"
                onKeyDown={(e) => e.key === "Enter" && startOtp()}
                style={{ ...inp, flex: 1 }}
                onFocus={(e) => (e.target.style.borderColor = C.gold)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(227,180,88,0.25)")}
              />
            </div>
            <button
              onClick={startOtp}
              disabled={loading || phone.length < 8}
              style={{
                width: "100%", marginTop: 12,
                background: phone.length === 8 && !loading
                  ? `linear-gradient(135deg, ${C.gold}, #b8892e)`
                  : "rgba(255,255,255,0.07)",
                border: "none", borderRadius: 10,
                padding: "12px", color: phone.length === 8 && !loading ? "#1a1000" : C.dim,
                fontWeight: 700, fontSize: 14,
                cursor: phone.length === 8 && !loading ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              {loading ? "Хүлээнэ үү..." : "📱 SMS код авах"}
            </button>
          </div>

          {/* Алдаа */}
          {error && (
            <div style={{
              marginTop: 16, background: "rgba(220,80,60,0.12)",
              border: "1px solid rgba(220,80,60,0.35)", borderRadius: 10,
              padding: "10px 14px", color: "#e07070", fontSize: 13,
            }}>⚠️ {error}</div>
          )}

          <p style={{ color: C.dim, fontSize: 11, marginTop: 24, lineHeight: 1.6 }}>
            Нэвтэрснээр таны мэдээлэл зөвхөн энэ төхөөрөмжид хадгалагдана.
          </p>
        </div>
      )}

      {/* ── OTP ХҮЛЭЭЖ БАЙНА ─────────────────────────────────────────────── */}
      {step === "otp-pending" && otpData && (
        <div
          style={{
            width: "100%", maxWidth: 420, textAlign: "center",
            background: "rgba(16,23,53,0.82)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(227,180,88,0.2)",
            borderRadius: 24, padding: "36px 28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Spinner */}
          <div style={{ fontSize: 52, marginBottom: 16, animation: "pulse 2s infinite" }}>📱</div>

          <div
            style={{
              color: C.goldSoft, fontWeight: 800, fontSize: 20, marginBottom: 8,
            }}
          >SMS илгээнэ үү</div>

          {/* displayInstruction хайрцаг */}
          <div
            style={{
              background: "rgba(227,180,88,0.08)",
              border: "1px solid rgba(227,180,88,0.3)",
              borderRadius: 12, padding: "14px 16px",
              marginBottom: 20, textAlign: "left",
            }}
          >
            <div style={{ color: C.dim, fontSize: 11, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>
              Зааварчилгаа
            </div>
            <div style={{ color: C.cream, fontSize: 14, lineHeight: 1.7, wordBreak: "break-word" }}>
              {otpData.displayInstruction}
            </div>
          </div>

          {/* smsUri tap-to-open */}
          <a
            href={otpData.smsUri}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: `linear-gradient(135deg, ${C.gold}, #b8892e)`,
              color: "#1a1000", borderRadius: 12, padding: "13px 20px",
              fontWeight: 800, fontSize: 15, textDecoration: "none",
              boxShadow: `0 4px 16px ${C.gold}44`, marginBottom: 20,
              transition: "transform 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            ✉️ Мессеж илгээх
          </a>

          {/* Хүлээж байна + тоолуур */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <div className="otp-pulse" style={{
              width: 10, height: 10, borderRadius: "50%",
              background: C.gold, boxShadow: `0 0 8px ${C.gold}`,
            }} />
            <span style={{ color: C.dim, fontSize: 14 }}>
              SMS хүлээж байна
              {timeLeft > 0 && (
                <span style={{ color: C.goldSoft, fontWeight: 700, marginLeft: 6 }}>
                  {fmtTime(timeLeft)}
                </span>
              )}
            </span>
          </div>

          {/* Алдаа */}
          {error && (
            <div style={{
              background: "rgba(220,80,60,0.12)",
              border: "1px solid rgba(220,80,60,0.35)", borderRadius: 10,
              padding: "10px 14px", color: "#e07070", fontSize: 13, marginBottom: 16,
            }}>⚠️ {error}</div>
          )}

          <button
            onClick={goBackToLanding}
            style={{
              background: "transparent", border: "none",
              color: C.dim, fontSize: 13, cursor: "pointer", padding: "4px",
            }}
          >← Буцах</button>
        </div>
      )}

      {/* ── ПРОФАЙЛ БӨГЛӨХ ───────────────────────────────────────────────── */}
      {step === "profile" && (
        <div
          style={{
            width: "100%", maxWidth: 420,
            background: "rgba(16,23,53,0.82)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(227,180,88,0.2)",
            borderRadius: 24, padding: "32px 28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Толгой */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: `linear-gradient(135deg, #7B5EA7, ${C.gold})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, margin: "0 auto 14px",
                boxShadow: `0 0 20px ${C.gold}44`,
              }}
            >
              {provider === "Google" ? (
                <svg width="24" height="24" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6.1C12.7 13.2 17.9 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.9 46.5 31.7 46.5 24.5z"/>
                  <path fill="#FBBC05" d="M10.8 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.5 13.3A23.7 23.7 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-6z"/>
                  <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.2-7.9 2.2-6.1 0-11.3-3.7-13.2-9l-7.8 6C6.9 42.6 14.8 48 24 48z"/>
                </svg>
              ) : "📱"}
            </div>
            <div style={{ color: C.goldSoft, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              Тавтай морил! 🌟
            </div>
            <div style={{ color: C.dim, fontSize: 13 }}>
              {provider === "Google" ? "Google-ээр нэвтэрлээ." : `+976 ${phone} дугаар баталгаажлаа.`}
            </div>
            <div style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>
              Зурхайгаа тохируулъя.
            </div>
          </div>

          {/* Маягт */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Нэр */}
            <div>
              <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Нэр
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Таны нэр"
                style={inp}
                onFocus={(e) => (e.target.style.borderColor = C.gold)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(227,180,88,0.25)")}
              />
            </div>

            {/* Төрсөн он */}
            <div>
              <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Төрсөн он
              </label>
              <input
                type="number"
                value={profile.birthYear}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile((p) => ({ ...p, birthYear: Number(e.target.value) }))}
                min={1924} max={2024}
                style={inp}
                onFocus={(e) => (e.target.style.borderColor = C.gold)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(227,180,88,0.25)")}
              />
            </div>

            {/* Сар + өдөр */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Сар</label>
                <select
                  value={profile.birthMonth}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setProfile((p) => ({ ...p, birthMonth: Number(e.target.value) }))}
                  style={{ ...inp, cursor: "pointer" }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1} style={{ background: "#0c1230" }}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Өдөр</label>
                <input
                  type="number"
                  value={profile.birthDay}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setProfile((p) => ({ ...p, birthDay: Number(e.target.value) }))}
                  min={1} max={31}
                  style={inp}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(227,180,88,0.25)")}
                />
              </div>
            </div>

            {/* Хүйс */}
            <div>
              <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Хүйс</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["male", "female"] as const).map((g) => {
                  const active = profile.gender === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setProfile((p) => ({ ...p, gender: g }))}
                      style={{
                        background: active ? `linear-gradient(135deg, ${C.gold}33, ${C.gold}18)` : "rgba(255,255,255,0.05)",
                        border: active ? `1.5px solid ${C.gold}88` : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10, color: active ? C.goldSoft : C.dim,
                        padding: "11px 8px", cursor: "pointer",
                        fontWeight: active ? 700 : 500, fontSize: 14,
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      {g === "male" ? "👨 Эрэгтэй" : "👩 Эмэгтэй"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Алдаа */}
            {error && (
              <div style={{
                background: "rgba(220,80,60,0.12)",
                border: "1px solid rgba(220,80,60,0.35)", borderRadius: 8,
                padding: "8px 12px", color: "#e07070", fontSize: 13,
              }}>⚠️ {error}</div>
            )}

            {/* Орох */}
            <button
              onClick={handleProfileSubmit}
              style={{
                background: `linear-gradient(135deg, ${C.gold}, #b8892e)`,
                border: "none", borderRadius: 12, padding: "14px",
                color: "#1a1000", fontWeight: 800, fontSize: 15,
                cursor: "pointer", marginTop: 4,
                boxShadow: `0 4px 20px ${C.gold}44`, letterSpacing: 0.3,
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${C.gold}55`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${C.gold}44`; }}
            >
              🌟 Зурхай руу орох
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes otpPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .otp-pulse { animation: otpPulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
