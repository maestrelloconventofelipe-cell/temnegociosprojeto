const nodemailer = require('nodemailer');

function criarTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function enviarResetSenha(email, nome, token) {
  const link = `${process.env.FRONTEND_URL}/resetar-senha?token=${token}`;

  const transporter = criarTransporter();

  if (!transporter) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   EMAIL DE RESET — modo dev (sem SMTP)       ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Para : ${email}`);
    console.log(`║  Link : ${link}`);
    console.log('╚══════════════════════════════════════════════╝\n');
    return;
  }

  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px;text-align:center;">
              <div style="font-size:22px;font-weight:700;color:#fff;">Tem Negócios</div>
              <div style="color:#93c5fd;font-size:13px;margin-top:4px;">Imobiliários</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 12px;font-size:20px;color:#1e293b;">Redefinição de senha</h1>
              <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
                Olá, <strong>${nome}</strong>.<br>
                Recebemos uma solicitação para redefinir a senha da sua conta.
                Clique no botão abaixo para criar uma nova senha.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${link}"
                   style="background:#1e40af;color:#fff;text-decoration:none;
                          padding:14px 32px;border-radius:10px;font-size:14px;
                          font-weight:600;display:inline-block;">
                  Redefinir minha senha
                </a>
              </div>
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
                Este link é válido por <strong>1 hora</strong>.<br>
                Se não foi você quem solicitou, ignore este e-mail.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;
                       text-align:center;color:#94a3b8;font-size:11px;">
              Tem Negócios Imobiliários · Sistema de Gestão de Franquias
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;

  await transporter.sendMail({
    from:    `"Tem Negócios" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to:      email,
    subject: 'Redefinição de senha — Tem Negócios',
    html,
  });
}

module.exports = { enviarResetSenha };
