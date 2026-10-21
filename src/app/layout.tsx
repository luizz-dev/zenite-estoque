import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Zênite — Gestão Fiscal e Estoque",
  description: "Controle de estoque e emissão de NF-e para o MEI",
  icons: {
    icon: [
      {
        url: "/img-icon/logo_principal_preto_zenite.png",
        media: "(prefers-color-scheme: light)",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/img-icon/logo_principal_branco_zenite.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "32x32",
        type: "image/png",
      },
    ],
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