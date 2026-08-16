import { formatDateTime } from "@/lib/utils";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.NOTIFY_EMAIL?.trim() && process.env.RESEND_API_KEY?.trim()
  );
}

export async function sendVisitEmail(input: {
  name: string;
  code: string;
  visitedAt: string;
  locationName: string;
}): Promise<{ sent: boolean; error?: string }> {
  const to = process.env.NOTIFY_EMAIL?.trim();
  const key = process.env.RESEND_API_KEY?.trim();
  if (!(to && key)) {
    return { error: "not_configured", sent: false };
  }

  const from = process.env.NOTIFY_FROM?.trim() || "Acceso <acceso@localhost>";
  const when = formatDateTime(input.visitedAt);
  const text = [
    "Se ha registrado una visita.",
    "",
    `Nombre: ${input.name}`,
    `Ubicación: ${input.locationName}`,
    `Código usado: ${input.code}`,
    `Fecha y hora: ${when}`,
    "",
    "— Acceso",
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from,
        subject: `Visita — ${input.name} · ${input.locationName}`,
        text,
        to: [to],
      }),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    if (!res.ok) {
      return {
        error: `resend_${res.status}`,
        sent: false,
      };
    }
    return { sent: true };
  } catch {
    return {
      error: "send_failed",
      sent: false,
    };
  }
}
