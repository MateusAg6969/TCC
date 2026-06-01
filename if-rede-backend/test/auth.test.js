const { expect } = require('chai');
const request = require('superagent');

const baseUrl = 'http://localhost:3000/auth';

describe('Auth Routes', () => {
  it('POST /register - Should create new user', async () => {
    const payload = {
      nome: 'Test User',
      email: 'test@example.com',
      matricula: '123456',
      senha: 'password123'
    };

    const response = await request.post(baseUrl + '/register').send(payload);

    expect(response.status).to.equal(201);
    expect(response.body.usuario).to.not.be.null;
  });

  it('POST /login - Should return valid token', async () => {
    const payload = {
      email: 'test@example.com',
      senha: 'password123'
    };

    const response = await request.post(baseUrl + '/login').send(payload);

    expect(response.status).to.equal(200);
    expect(response.body.tokens.accessToken).to.not.be.blank;
  });

  it('POST /refresh - Should renew token', async () => {
    // First get access token
    const loginResponse = await request.post(baseUrl + '/login').send({ email: 'test@example.com', senha: 'password123' });
    const refreshToken = loginResponse.body.tokens.refreshToken;

    const response = await request.post(baseUrl + '/refresh').send({ refreshToken });

    expect(response.status).to.equal(200);
    expect(response.body.tokens.accessToken).to.not.equal(loginResponse.body.tokens.accessToken);
  });

  it('POST /logout - Should return success', async () => {
    const response = await request.post(baseUrl + '/logout');

    expect(response.status).to.equal(200);
    expect(response.body).to.be.null;
  });
});