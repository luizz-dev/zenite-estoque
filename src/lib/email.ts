export async function enviarEmailRedefinicao(para: string, link: string, contaGoogle: boolean) {
  const aviso = contaGoogle
    ? `<p>Sua conta foi criada com o Google, então você ainda não tem uma senha. Se quiser, pode definir uma pelo link abaixo e passar a entrar das duas formas. Você também pode continuar usando o botão "Entrar com Google".</p>`
    : `<p>Recebemos um pedido para redefinir a senha da sua conta do Zênite Estoque!</p>`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px">
      <h2>Zênite</h2>
      ${aviso}
      <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#F57C00;color:#fff;border-radius:8px;text-decoration:none">${contaGoogle ? "Definir senha" : "Redefinir senha"}</a></p>
      <p style="color:#666;font-size:12px">O link vale por 1 hora e só pode ser usado uma vez. Se não foi você, ignore este e-mail.</p>
    </div>`;

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV] Sem RESEND_API_KEY, e-mail não enviado. Link:", link);
    } else {
      console.error("RESEND_API_KEY não configurada: e-mail de redefinição não enviado.");
    }
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Zênite <onboarding@resend.dev>",
      to: para,
      subject: contaGoogle ? "Defina sua senha - Zênite" : "Redefinir sua senha - Zênite",
      html,
    }),
  });
  if (!res.ok) console.error("Falha ao enviar e-mail:", res.status, await res.text());
}