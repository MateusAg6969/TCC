const https = require('https');

/**
 * Função utilitária para enviar e-mails usando a API do Brevo (HTTP).
 * Isso contorna o bloqueio de portas SMTP do Render.
 */
function sendEmailViaBrevo(toEmail, toName, subject, htmlContent) {
  return new Promise((resolve, reject) => {
    // Se a chave não estiver configurada (ex: rodando localmente sem a chave), 
    // apenas simula o envio no console.
    if (!process.env.BREVO_API_KEY) {
      console.log(`[DEV MODE] E-mail simulado para ${toEmail} | Assunto: ${subject}`);
      return resolve('Simulado');
    }

    const data = JSON.stringify({
      sender: { name: 'IF REDE', email: 'ifrede67@gmail.com' },
      to: [{ email: toEmail, name: toName || 'Usuário' }],
      subject: subject,
      htmlContent: htmlContent
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody);
        } else {
          reject(new Error(`Brevo API Error ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}

/**
 * Envia um e-mail de confirmação para o usuário recém-cadastrado.
 */
async function enviarEmailConfirmacao(email, nome, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const urlConfirmacao = `${frontendUrl}/verify-email?token=${token}`;

  const subject = 'IF REDE - Confirme seu e-mail';
  const htmlContent = `
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
  `;

  try {
    if (process.env.BREVO_API_KEY) {
      await sendEmailViaBrevo(email, nome, subject, htmlContent);
      console.log(`E-mail de confirmação enviado via Brevo API para: ${email}`);
    } else {
      console.log(`[DEV MODE] Link de confirmação gerado: ${urlConfirmacao}`);
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail de confirmação:', error);
    console.log(`[FALLBACK] Link de confirmação gerado: ${urlConfirmacao}`);
  }
}

/**
 * Envia um e-mail de recuperação de senha.
 */
async function enviarEmailRecuperacao(email, nome, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const urlRecuperacao = `${frontendUrl}/reset-password?token=${token}`;

  const subject = 'IF REDE - Recuperação de Senha';
  const htmlContent = `
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
  `;

  try {
    if (process.env.BREVO_API_KEY) {
      await sendEmailViaBrevo(email, nome, subject, htmlContent);
      console.log(`E-mail de recuperação enviado via Brevo API para: ${email}`);
    } else {
      console.log(`[DEV MODE] Link de recuperação gerado: ${urlRecuperacao}`);
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
