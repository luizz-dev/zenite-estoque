"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, KeyRound, Phone, AlertTriangle } from "lucide-react";
import { C } from "@/lib/constants";
import { AuthBackground, AuthSplitCard, AuthField, OnboardingStepper } from "@/components/auth/AuthLayout";
import { BtnPrimary } from "@/components/ui/Button";

// Etapa 1 de 2 (Cadastro do usuário). Ao concluir, cria o usuário,
// já autentica a sessão (ver /api/auth/cadastro) e segue para a
// Etapa 2 (Assinatura/Pagamento) em /cadastro/checkout.
export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cadastrar = async () => {
    if (!nome.trim() || !email.trim() || !celular.trim() || !senha.trim()) {
      return setErro("Preencha todos os campos para continuar.");
    }
    if (senha.length < 6) return setErro("A senha deve ter pelo menos 6 caracteres.");
    if (senha !== confirmarSenha) return setErro("As senhas não coincidem.");

    setErro("");
    setEnviando(true);
    const res = await fetch("/api/auth/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, celular }),
    });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json();
      return setErro(data.erro || "Não foi possível concluir o cadastro.");
    }
    router.push("/cadastro/checkout");
  };

  return (
    <AuthBackground>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 720 }}>
        <OnboardingStepper atual={1} total={2} />
        <AuthSplitCard orangeSide="left">
          <h2 style={{ color: C.white, fontSize: 22, fontWeight: 700, margin: "0 0 22px" }}>Criar Conta</h2>

          <AuthField label="Nome completo" icon={<User size={14} />} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ana Souza" />
          <AuthField label="E-mail" icon={<Mail size={14} />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ex: exemplo@mail.com" />
          <AuthField label="Celular" icon={<Phone size={14} />} value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="Ex: (11) 91234-5678" />
          <AuthField label="Senha" icon={<KeyRound size={14} />} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
          <AuthField label="Confirmar senha" icon={<KeyRound size={14} />} type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a senha" onKeyDown={(e) => e.key === "Enter" && cadastrar()} />

          {erro && (
            <div style={{ borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "9px 12px", marginBottom: 16, color: C.red, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} /> {erro}
            </div>
          )}

          <BtnPrimary onClick={cadastrar} disabled={enviando} style={{ width: "100%", padding: 12 }}>
            {enviando ? "Criando conta..." : "Criar conta e continuar →"}
          </BtnPrimary>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ color: C.textMuted, fontSize: 11 }}>ou</span><div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <p style={{ textAlign: "center", color: "#A8B5D1", fontSize: 12.5, margin: 0 }}>
            Já possui conta? <Link href="/login" style={{ color: C.cyanText, fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
          </p>
        </AuthSplitCard>
      </div>
    </AuthBackground>
  );
}