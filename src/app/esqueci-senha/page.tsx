"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { C } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!email.trim()) return setErro("Informe seu e-mail.");
    setErro("");
    setEnviando(true);
    const res = await fetch("/api/auth/esqueci-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setErro(data.erro || "Não foi possível enviar. Tente novamente.");
    }
    setEnviado(true);
  };

  return (
    <AuthBackground>
      <AuthSplitCard orangeSide="left">
        <h2 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Recuperar senha</h2>
        <p style={{ color: "#A8B5D1", fontSize: 12.5, margin: "0 0 22px" }}>
          Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
        </p>

        {enviado ? (
          <div style={{ borderRadius: 10, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)", padding: "12px 14px", marginBottom: 18, color: "#34D399", fontSize: 12.5, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira também a caixa de spam.</span>
          </div>
        ) : (
          <>
            <AuthField label="E-mail" icon={<Mail size={14} />} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: exemplo@mail.com" onKeyDown={(e) => e.key === "Enter" && enviar()} />
            {erro && (
              <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} /> {erro}
              </div>
            )}
            <BtnPrimary onClick={enviar} disabled={enviando} style={{ width: "100%", padding: 12 }}>
              {enviando ? "Enviando..." : "Enviar link"}
            </BtnPrimary>
          </>
        )}

        <p style={{ textAlign: "center", color: "#A8B5D1", fontSize: 12.5, margin: "18px 0 0" }}>
          <Link href="/login" style={{ color: C.cyanText, fontWeight: 600, textDecoration: "none" }}>Voltar para o login</Link>
        </p>
      </AuthSplitCard>
    </AuthBackground>
  );
}