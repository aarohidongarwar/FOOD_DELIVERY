import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index.js';

describe('API Health Check', () => {
  it('should return 200 OK from /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

describe('Auth Endpoints (Mocked)', () => {
  it('should reject login with no credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400); // Because it requires phone and password
  });
});
