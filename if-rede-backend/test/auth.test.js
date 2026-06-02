const { expect } = require('chai');
const request = require('superagent');

const baseUrl = 'http://localhost:3000/auth';

describe('Auth Routes', () => {
  const uniqueId = Date.now();
  const email = `test_${uniqueId}@example.com`;
  const matricula = String(100000 + (uniqueId % 900000));
  const senha = 'password123';
  const nome = 'Test User';

  it('POST /register - Should create new user', async () => {
    const payload = {
      nome,
      email,
      matricula,
      senha
    };

    const response = await request.post(baseUrl + '/register').send(payload);

    expect(response.status).to.equal(201);
    expect(response.body.ok).to.be.true;
    expect(response.body.data.usuario).to.exist;
    expect(response.body.data.usuario.email).to.equal(email);
  });

  it('POST /login - Should return valid token', async () => {
    const payload = {
      email,
      senha
    };

    const response = await request.post(baseUrl + '/login').send(payload);

    expect(response.status).to.equal(200);
    expect(response.body.ok).to.be.true;
    expect(response.body.data.tokens.accessToken).to.not.be.empty;
  });

  it('POST /refresh - Should renew token', async () => {
    // First get access token
    const loginResponse = await request.post(baseUrl + '/login').send({ email, senha });
    const refreshToken = loginResponse.body.data.tokens.refreshToken;

    const response = await request.post(baseUrl + '/refresh').send({ refreshToken });

    expect(response.status).to.equal(200);
    expect(response.body.ok).to.be.true;
    expect(response.body.data.tokens.accessToken).to.not.be.empty;
  });

  it('POST /logout - Should return success', async () => {
    const response = await request.post(baseUrl + '/logout');

    expect(response.status).to.equal(200);
    expect(response.body.ok).to.be.true;
    expect(response.body.data).to.be.null;
  });
});