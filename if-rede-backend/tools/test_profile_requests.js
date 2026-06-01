(async () => {
  const base = 'http://localhost:3000';
  const nome = 'Teste Perfil';
  const email = `teste.perfil.${Date.now()}@example.com`;
  const matricula = String(100000 + Math.floor(Math.random() * 900000));
  const senha = 'senhaTeste123';

  try {
    // Registrar
    const reg = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, matricula, senha }),
    });
    const regJson = await reg.json();
    console.log('REGISTER status', reg.status);
    console.log(JSON.stringify(regJson, null, 2));

    if (!reg.ok) return;

    const accessToken = regJson.data.tokens.accessToken;
    const usuarioId = regJson.data.usuario.id;

    // Meu perfil
    const meu = await fetch(`${base}/perfil/meu-perfil`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('\nMEU-PERFIL status', meu.status);
    console.log(JSON.stringify(await meu.json(), null, 2));

    // Perfil público
    const pub = await fetch(`${base}/perfil/${usuarioId}`);
    console.log('\nPERFIL PUBLICO status', pub.status);
    console.log(JSON.stringify(await pub.json(), null, 2));

    // Badges
    const badges = await fetch(`${base}/perfil/${usuarioId}/badges`);
    console.log('\nBADGES status', badges.status);
    console.log(JSON.stringify(await badges.json(), null, 2));

    // Estatisticas
    const stats = await fetch(`${base}/perfil/${usuarioId}/estatisticas`);
    console.log('\nESTATISTICAS status', stats.status);
    console.log(JSON.stringify(await stats.json(), null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
