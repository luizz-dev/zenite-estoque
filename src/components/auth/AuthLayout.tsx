"use client";

import React from "react";
import Image from "next/image";
import { C } from "@/lib/constants";
import logoBranco from "@/img/logo_principal_branco_zenite.png";

// 1. Fundo da tela (Sem a malha de pontos)
export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: C.bg, // Mantém a cor escura de fundo padrão
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* O texto de fundo 'ZÊNITE' e a malha de pontos foram removidos daqui */}
      {children}
    </div>
  );
}

// 2. Card dividido (Lado laranja com a imagem + Formulário)
export function AuthSplitCard({
  children,
  orangeSide = "left",
}: {
  children: React.ReactNode;
  orangeSide?: "left" | "right";
}) {
  const isLeft = orangeSide === "left";

  const OrangeSideContent = (
    <div
      style={{
        flex: 1,
        backgroundColor: C.orange,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        minHeight: 240,
      }}
    >
      {/* Subtituição da estrela pela sua imagem (Coloque o arquivo da imagem na pasta 'public/') */}
      <Image
        src={logoBranco}
        alt="Logo"
        width={250}
        height={250}
        style={{ objectFit: "contain" }}
      />
    </div>
  );

  const FormSideContent = (
    <div
      style={{
        flex: 1.2,
        backgroundColor: "#0F172A",
        padding: 42,
        paddingLeft:60,
        paddingRight:60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );

  return (
    <div
      style={{
        width: "60vw",
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: isLeft ? "row" : "row-reverse",
      }}
    >
      {OrangeSideContent}
      {FormSideContent}
    </div>
  );
}

// 3. Indicador de passos (Stepper)
export function OnboardingStepper({
  atual,
  total,
}: {
  atual: number;
  total: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const passo = i + 1;
        const ativo = passo === atual;
        return (
          <React.Fragment key={passo}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: ativo ? C.orange : "rgba(255,255,255,0.1)",
                color: ativo ? C.white : C.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {passo}
            </div>
            {passo < total && (
              <div
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// 4. Campos de Input reutilizáveis do formulário
export function AuthField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  onKeyDown,
}: {
  label: string;
  icon?: React.ReactNode;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 16,
          color: C.textMuted,
          marginBottom: 6,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && (
          <span
            style={{
              position: "absolute",
              left: 12,
              color: C.textMuted,
              display: "flex",
            }}
          >
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{
            width: "100%",
            backgroundColor: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: "10px 12px",
            paddingLeft: icon ? 36 : 12,
            color: C.white,
            fontSize: 16,
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}