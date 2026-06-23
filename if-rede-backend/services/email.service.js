const nodemailer = require('nodemailer');

// Configuração do transporter
// Em produção, deve-se usar as variáveis de ambiente SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'fake_user@ethereal.email',
    pass: process.env.SMTP_PASS || 'fake_password',
  },
});

/**
 * Envia um e-mail de confirmação para o usuário recém-cadastrado.
 * @param {string} email - O endereço de e-mail do usuário.
 * @param {string} nome - O nome do usuário.
 * @param {string} token - O token único gerado para confirmação.
 */
async function enviarEmailConfirmacao(email, nome, token) {
  // A URL base do frontend. Deve vir de variável de ambiente (ex: Vercel)
  // Como estamos testando, deixamos um fallback para localhost ou a URL da Vercel
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const urlConfirmacao = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"IF REDE" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'IF REDE - Confirme seu e-mail',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #1E40AF; text-align: center;">Bem-vindo ao IF REDE, ${nome}!</h2>
        <p style="font-size: 16px; color: #333;">Estamos muito felizes em ter você na nossa rede acadêmica.</p>
        <p style="font-size: 16px; color: #333;">Para começar a usar sua conta, por favor, confirme seu e-mail clicando no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${urlConfirmacao}" style="background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Confirmar Meu E-mail</a>
        </div>
        <p style="font-size: 14px; color: #666;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p style="font-size: 14px; color: #1E40AF; word-break: break-all;">${urlConfirmacao}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Este é um e-mail automático, por favor, não responda.</p>
      </div>
    `,
  };

  try {
    // Se o SMTP não estiver configurado corretamente (ex: Ethereal falso padrão),
    // apenas loga o link no console para permitir testes locais sem erro.
    if (process.env.SMTP_HOST) {
      await transporter.sendMail(mailOptions);
      console.log(`E-mail de confirmação enviado para: ${email}`);
    } else {
      console.log(`[DEV MODE] E-mail NÃO enviado (SMTP não configurado). Link de confirmação gerado: ${urlConfirmacao}`);
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail de confirmação:', error);
    // Em modo dev, se falhar, apenas loga o link para o desenvolvedor conseguir continuar
    console.log(`[FALLBACK] Link de confirmação gerado: ${urlConfirmacao}`);
  }
}

async function enviarEmailRecuperacao(email, nome, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const urlRecuperacao = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"IF REDE" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'IF REDE - Recuperação de Senha',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #1E40AF; text-align: center;">Recuperação de Senha</h2>
        <p style="font-size: 16px; color: #333;">Olá, ${nome}!</p>
        <p style="font-size: 16px; color: #333;">Recebemos uma solicitação para redefinir a senha da sua conta no IF REDE.</p>
        <p style="font-size: 16px; color: #333;">Se foi você, clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${urlRecuperacao}" style="background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Redefinir Senha</a>
        </div>
        <p style="font-size: 14px; color: #666;">Este link expira em 1 hora.</p>
        <p style="font-size: 14px; color: #666;">Se você não solicitou a recuperação, pode ignorar este e-mail em segurança.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">Este é um e-mail automático, por favor, não responda.</p>
      </div>
    `,
  };

  try {
    if (process.env.SMTP_HOST) {
      await transporter.sendMail(mailOptions);
      console.log(`E-mail de recuperação enviado para: ${email}`);
    } else {
      console.log(`[DEV MODE] E-mail de recuperação NÃO enviado. Link: ${urlRecuperacao}`);
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail de recuperação:', error);
    console.log(`[FALLBACK] Link de recuperação gerado: ${urlRecuperacao}`);
  }
}

module.exports = {
  enviarEmailConfirmacao,
  enviarEmailRecuperacao,
};
