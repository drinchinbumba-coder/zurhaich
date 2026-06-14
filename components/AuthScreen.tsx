"use client";

import React, { useState, ChangeEvent } from "react";
import { C } from "@/lib/colors";

interface ProfileData {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: "male" | "female";
}

interface Props {
  onComplete: (provider: string, profile: ProfileData) => void;
}

type Step = "landing" | "profile";

const MONTHS = [
  "1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар",
  "7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар",
];

export default function AuthScreen({ onComplete }: Props) {
  const [step, setStep] = useState<Step>("landing");
  const [provider, setProvider] = useState("");
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    gender: "male",
  });
  const [error, setError] = useState("");

  const handleProvider = (prov: string) => {
    setProvider(prov);
    setStep("profile");
  };

  const handleSubmit = () => {
    if (!profile.name.trim()) {
      setError("Нэрээ оруулна уу.");
      return;
    }
    if (profile.birthYear < 1924 || profile.birthYear > 2024) {
      setError("Төрсөн оноо 1924–2024 хооронд байх ёстой.");
      return;
    }
    if (profile.birthDay < 1 || profile.birthDay > 31) {
      setError("Төрсөн өдөр 1–31 хооронд байх ёстой.");
      return;
    }
    setError("");
    onComplete(provider, profile);
  };

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

  const providerIcon: Record<string, string> = {
    Google: "G",
    Facebook: "f",
    Apple: "",
  };
  const providerColor: Record<string, string> = {
    Google: "#fff",
    Facebook: "#1877F2",
    Apple: "#000",
  };
  const providerText: Record<string, string> = {
    Google: "#222",
    Facebook: "#fff",
    Apple: "#fff",
  };

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
      {step === "landing" ? (
        /* ── Нэвтрэх дэлгэц ── */
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            textAlign: "center",
          }}
        >
          {/* Лого */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: `linear-gradient(135deg, #7B5EA7, ${C.gold})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 20px",
              boxShadow: `0 0 32px ${C.gold}55`,
            }}
          >
            🔮
          </div>

          <h1
            style={{
              background: `linear-gradient(90deg, ${C.goldSoft}, #C9A0DC)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 900,
              fontSize: 30,
              margin: "0 0 6px",
              letterSpacing: 0.5,
            }}
          >
            Зурхайч
          </h1>
          <p
            style={{
              color: C.dim,
              fontSize: 14,
              marginBottom: 36,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Өөрийгөө таних ухаан
          </p>

          {/* Нэвтрэх товчнууд */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(["Google", "Facebook", "Apple"] as const).map((prov) => (
              <button
                key={prov}
                onClick={() => handleProvider(prov)}
                style={{
                  background: providerColor[prov],
                  color: providerText[prov],
                  border: prov === "Google" ? "1px solid #ddd" : "none",
                  borderRadius: 12,
                  padding: "14px 20px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  transition: "transform 0.12s, box-shadow 0.12s",
                  boxShadow:
                    prov === "Google"
                      ? "0 2px 12px rgba(0,0,0,0.15)"
                      : prov === "Facebook"
                      ? "0 2px 12px rgba(24,119,242,0.35)"
                      : "0 2px 12px rgba(0,0,0,0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.25)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    prov === "Google"
                      ? "0 2px 12px rgba(0,0,0,0.15)"
                      : prov === "Facebook"
                      ? "0 2px 12px rgba(24,119,242,0.35)"
                      : "0 2px 12px rgba(0,0,0,0.4)";
                }}
              >
                {/* Icon */}
                {prov === "Google" && (
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.4 30.3 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6.1C12.7 13.2 17.9 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37.9 46.5 31.7 46.5 24.5z"/>
                    <path fill="#FBBC05" d="M10.8 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L2.5 13.3A23.7 23.7 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-6z"/>
                    <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.4-5.6l-7.5-5.8c-2.1 1.4-4.8 2.2-7.9 2.2-6.1 0-11.3-3.7-13.2-9l-7.8 6C6.9 42.6 14.8 48 24 48z"/>
                  </svg>
                )}
                {prov === "Facebook" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/>
                  </svg>
                )}
                {prov === "Apple" && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                )}
                <span>{prov}-ээр нэвтрэх</span>
              </button>
            ))}
          </div>

          <p
            style={{
              color: C.dim,
              fontSize: 11,
              marginTop: 24,
              lineHeight: 1.6,
            }}
          >
            Нэвтэрснээр таны мэдээлэл зөвхөн энэ төхөөрөмжид хадгалагдана.
          </p>
        </div>
      ) : (
        /* ── Профайл бөглөх дэлгэц ── */
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(16,23,53,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid rgba(227,180,88,0.2)`,
            borderRadius: 24,
            padding: "32px 28px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Толгой */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `linear-gradient(135deg, #7B5EA7, ${C.gold})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                margin: "0 auto 14px",
                boxShadow: `0 0 20px ${C.gold}44`,
              }}
            >
              {provider === "Google" ? "G" : provider === "Facebook" ? "f" : ""}
            </div>
            <div
              style={{
                color: C.goldSoft,
                fontWeight: 700,
                fontSize: 18,
                marginBottom: 4,
              }}
            >
              Тавтай морил! 🌟
            </div>
            <div style={{ color: C.dim, fontSize: 13 }}>
              {provider}-ээр нэвтэрлээ. Зурхайгаа тохируулъя.
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
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setProfile((p) => ({ ...p, name: e.target.value }))
                }
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
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setProfile((p) => ({ ...p, birthYear: Number(e.target.value) }))
                }
                min={1924}
                max={2024}
                style={inp}
                onFocus={(e) => (e.target.style.borderColor = C.gold)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(227,180,88,0.25)")}
              />
            </div>

            {/* Төрсөн сар, өдөр */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Сар
                </label>
                <select
                  value={profile.birthMonth}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setProfile((p) => ({ ...p, birthMonth: Number(e.target.value) }))
                  }
                  style={{ ...inp, cursor: "pointer" }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1} style={{ background: C.panel }}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Өдөр
                </label>
                <input
                  type="number"
                  value={profile.birthDay}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setProfile((p) => ({ ...p, birthDay: Number(e.target.value) }))
                  }
                  min={1}
                  max={31}
                  style={inp}
                  onFocus={(e) => (e.target.style.borderColor = C.gold)}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(227,180,88,0.25)")}
                />
              </div>
            </div>

            {/* Хүйс */}
            <div>
              <label style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Хүйс
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["male", "female"] as const).map((g) => {
                  const active = profile.gender === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setProfile((p) => ({ ...p, gender: g }))}
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${C.gold}33, ${C.gold}18)`
                          : "rgba(255,255,255,0.05)",
                        border: active
                          ? `1.5px solid ${C.gold}88`
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        color: active ? C.goldSoft : C.dim,
                        padding: "11px 8px",
                        cursor: "pointer",
                        fontWeight: active ? 700 : 500,
                        fontSize: 14,
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
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
              <div
                style={{
                  background: `${C.red}22`,
                  border: `1px solid ${C.red}55`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: C.red,
                  fontSize: 13,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Орох товч */}
            <button
              onClick={handleSubmit}
              style={{
                background: `linear-gradient(135deg, ${C.gold}, #b8892e)`,
                border: "none",
                borderRadius: 12,
                padding: "14px",
                color: "#1a1000",
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                marginTop: 4,
                boxShadow: `0 4px 20px ${C.gold}44`,
                letterSpacing: 0.3,
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 8px 28px ${C.gold}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 20px ${C.gold}44`;
              }}
            >
              🌟 Зурхай руу орох
            </button>

            {/* Буцах */}
            <button
              onClick={() => setStep("landing")}
              style={{
                background: "transparent",
                border: "none",
                color: C.dim,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "center",
                padding: "4px",
              }}
            >
              ← Буцах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
