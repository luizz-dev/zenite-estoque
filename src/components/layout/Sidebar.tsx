"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image"; // Opcional se for usar a otimização do Next.js
import {
  LayoutDashboard, Boxes, History, HelpCircle, User, ChevronDown, Bell, ShieldCheck, Wallet,
} from "lucide-react";
import { C } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import logoImg from "@/img/logo_principal_branco_zenite.png";  

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", margin:10, gap: 10, padding: "0 4px" }}>
      <div style={{
        width: 65, height: 65, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        overflow: "hidden"
      }}>
        {/* Usando a tag HTML <img> padrão */}
        <img 
          src={logoImg.src} 
          alt="Logo Zênite" 
          style={{ width: "200%", height: "100%", objectFit: "contain", }} 
        />
      </div>
      <div>
        <p style={{ color: C.white, fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "0.08em" }}>ZÊNITE</p>
        <p style={{ color: C.textMuted, fontSize: 13, margin: 0, letterSpacing: "0.11em" }}>GESTÃO FISCAL</p>
      </div>
    </div>
  );
}

function NavItem({ href, label, icon, active, badge }: { href: string; label: string; icon: React.ReactNode; active: boolean; badge?: number }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px",
        borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500,
        color: active ? C.white : hov ? "#C7D2E8" : "#8C9CC1",
        background: active ? "linear-gradient(90deg,rgba(72,55,232,0.28),rgba(72,55,232,0.05))" : hov ? "rgba(255,255,255,0.03)" : "transparent",
        transition: "all 0.15s",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: active ? "#9D8DF1" : hov ? "#8B9DB8" : "#6B7CA0", display: "flex" }}>{icon}</span>
        {label}
      </span>
      {!!badge && badge > 0 && (
        <span style={{
          background: active ? "rgba(255,255,255,0.22)" : C.orange, color: C.white, fontSize: 14.5, fontWeight: 700,
          borderRadius: 999, padding: "1px 7px", minWidth: 18, textAlign: "center",
        }}>{badge}</span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { naoLidas } = useApp();
  const estoqueAtivo = pathname.startsWith("/estoque");
  const [estoqueAberto, setEstoqueAberto] = useState(estoqueAtivo);

  const sair = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside style={{
      width: 280, flexShrink: 0, background: C.sidebar, padding: "20px 14px", display: "flex",
      flexDirection: "column", borderRight: `1px solid ${C.border}`, height: "100vh", overflowY: "auto",
    }}>
      <Logo />
      <div style={{ height: 1, background: "#F5F5F570", margin: "18px 0 12px 0" }} />
      <div style={{ width: "70%", height: 1, background: "#F5F5F570", margin: "0px auto 30px auto" }} />

      <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        <NavItem href="/dashboard" label="Dashboard" icon={<LayoutDashboard size={18} />} active={pathname === "/dashboard"} />

        <div
          onClick={() => setEstoqueAberto((v) => !v)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px",
            borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500,
            color: estoqueAtivo ? C.white : "#8C9CC1",
            background: estoqueAtivo ? "linear-gradient(90deg,rgba(72,55,232,0.28),rgba(72,55,232,0.05))" : "transparent",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: estoqueAtivo ? "#9D8DF1" : "#6B7CA0", display: "flex" }}><Boxes size={18} /></span>
            Estoque
          </span>
          <span style={{ color: "#6B7CA0", display: "flex", transform: estoqueAberto ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <ChevronDown size={14} strokeWidth={2.5} />
          </span>
        </div>
        {estoqueAberto && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 34, marginTop: 2 }}>
            {[["/estoque", "Visualização do Estoque"], ["/estoque/cadastro", "Cadastrar Itens"]].map(([href, label]) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                  textDecoration: "none", fontSize: 14.5, color: active ? C.cyan : C.textMuted,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: active ? C.cyan : "#3D4D70", flexShrink: 0 }} />
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        <NavItem href="/alertas" label="Alertas" icon={<Bell size={18} />} active={pathname === "/alertas"} badge={naoLidas} />
        <NavItem href="/contas" label="Contas Fixas" icon={<Wallet size={18} />} active={pathname === "/contas"} />
        <NavItem href="/historico" label="Histórico de Movimentações" icon={<History size={18} />} active={pathname === "/historico"} />
        <NavItem href="/ajuda" label="Como Utilizar o Site" icon={<HelpCircle size={18} />} active={pathname === "/ajuda"} />
        <NavItem href="/perfil" label="Perfil & Configurações" icon={<User size={18} />} active={pathname.startsWith("/perfil")} />
      </nav>

      <div style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, padding: 14, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ color: C.cyan, display: "flex" }}><ShieldCheck size={18} /></span>
          <p style={{ color: C.white, fontSize: 14.5, fontWeight: 600, margin: 0 }}>SEFAZ Online</p>
        </div>
        <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>Homologação conectada e operante.</p>
        <button onClick={sair} style={{
          width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8,
          padding: "7px", fontSize: 12.5, color: C.textSec, cursor: "pointer",
        }}>Sair da conta</button>
      </div>
    </aside>
  );
}
