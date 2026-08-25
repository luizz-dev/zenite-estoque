import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Zênite — Gestão Fiscal e Estoque",
  description: "Controle de estoque e emissão de NF-e para o MEI",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
