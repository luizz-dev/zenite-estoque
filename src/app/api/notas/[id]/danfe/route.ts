import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obterUsuarioIdDaSessao } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obterUsuarioIdDaSessao();
  if (!usuarioId) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const nota = await prisma.notaFiscal.findFirst({
    where: { id, usuarioId },
    select: { numero: true, xmlAutorizado: true },
  });
  if (!nota) return NextResponse.json({ erro: "Nota não encontrada." }, { status: 404 });
  if (!nota.xmlAutorizado) {
    return NextResponse.json({ erro: "Esta nota não tem XML guardado." }, { status: 409 });
  }

  const serviceUrl = process.env.NFE_SERVICE_URL;
  const serviceToken = process.env.NFE_SERVICE_TOKEN;
  if (!serviceUrl || !serviceToken) {
    return NextResponse.json({ erro: "Serviço NF-e não configurado." }, { status: 500 });
  }

  let res: Response;
  try {
    res = await fetch(`${serviceUrl.replace(/\/$/, "")}/danfe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Service-Token": serviceToken },
      body: JSON.stringify({ xml: nota.xmlAutorizado }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return NextResponse.json({ erro: "O serviço NF-e local não está disponível." }, { status: 503 });
  }
  if (!res.ok) return NextResponse.json({ erro: "Não foi possível gerar o DANFE." }, { status: 502 });

  return new NextResponse(await res.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="danfe-${nota.numero}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}