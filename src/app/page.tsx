import { redirect } from "next/navigation";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

export default async function RootPage() {
  const usuarioId = await obterUsuarioIdDaSessao();
  redirect(usuarioId ? "/dashboard" : "/login");
}
