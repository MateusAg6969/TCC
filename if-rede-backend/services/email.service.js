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
    <div style="background-color: #190E1A; color: #F2F2F2; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #2A172B; border: 1px solid #412644; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);">
        <!-- Cabeçalho -->
        <div style="padding: 30px; text-align: center; border-bottom: 1px solid #412644;">
          <h1 style="color: #ADCC5A; margin: 0; font-size: 28px; letter-spacing: 2px;">IF REDE</h1>
        </div>
        
        <!-- Corpo -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #F2F2F2; font-size: 20px; margin-top: 0;">Bem-vindo à rede acadêmica, ${nome}!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #A99DB0;">
            Estamos muito felizes em ter você conosco. Para garantir a segurança da sua conta e liberar seu acesso completo à plataforma, precisamos que confirme seu endereço de e-mail.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${urlConfirmacao}" style="display: inline-block; background-color: #ADCC5A; color: #190E1A; padding: 14px 28px; text-decoration: none; border-radius: 20px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
              Confirmar Meu E-mail
            </a>
          </div>
          
          <p style="font-size: 14px; color: #A99DB0; margin-bottom: 5px;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <p style="font-size: 14px; color: #8B5CF6; word-break: break-all; margin-top: 0;">
            <a href="${urlConfirmacao}" style="color: #8B5CF6; text-decoration: underline;">${urlConfirmacao}</a>
          </p>
        </div>
        
        <!-- Rodapé -->
        <div style="background-color: #190E1A; padding: 20px; text-align: center; border-top: 1px solid #412644;">
          <p style="font-size: 12px; color: #A99DB0; margin: 0;">
            IF REDE - Rede Social Acadêmica<br>
            Este é um e-mail automático, por favor, não responda.
          </p>
        </div>
      </div>
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
    <div style="background-color: #190E1A; color: #F2F2F2; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #2A172B; border: 1px solid #412644; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);">
        <!-- Cabeçalho -->
        <div style="padding: 30px; text-align: center; border-bottom: 1px solid #412644;">
          <h1 style="color: #ADCC5A; margin: 0; font-size: 28px; letter-spacing: 2px;">IF REDE</h1>
        </div>
        
        <!-- Corpo -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #F2F2F2; font-size: 20px; margin-top: 0;">Recuperação de Senha</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #A99DB0;">
            Olá, ${nome}! Recebemos uma solicitação para redefinir a senha da sua conta.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #A99DB0;">
            Se foi você que solicitou, basta clicar no botão abaixo para criar uma nova senha com segurança.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${urlRecuperacao}" style="display: inline-block; background-color: #ADCC5A; color: #190E1A; padding: 14px 28px; text-decoration: none; border-radius: 20px; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
              Redefinir Minha Senha
            </a>
          </div>
          
          <p style="font-size: 14px; color: #ef4444; margin-bottom: 20px;">
            ⚠️ Este link é válido por apenas 1 hora.
          </p>
          
          <p style="font-size: 14px; color: #A99DB0;">
            Se você não solicitou a recuperação, pode ignorar este e-mail. Nenhuma alteração será feita na sua conta.
          </p>
        </div>
        
        <!-- Rodapé -->
        <div style="background-color: #190E1A; padding: 20px; text-align: center; border-top: 1px solid #412644;">
          <p style="font-size: 12px; color: #A99DB0; margin: 0;">
            IF REDE - Rede Social Acadêmica<br>
            Este é um e-mail automático, por favor, não responda.
          </p>
        </div>
      </div>
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
