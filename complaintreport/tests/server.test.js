const request = require('supertest');
const { app, getDepartmentForCategory, now } = require('../server');

describe('Complaint report backend', () => {
  test('GET /api/health returns OK and timestamp', async () => {
    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('ok', true);
    expect(response.body).toHaveProperty('now');
  });
});

describe('getDepartmentForCategory helper', () => {
  test('maps Garbage to Waste Management', () => {
    expect(getDepartmentForCategory('Garbage')).toBe('Waste Management');
  });

  test('maps Streetlight to Public Lighting', () => {
    expect(getDepartmentForCategory('Streetlight')).toBe('Public Lighting');
  });

  test('returns Other Services for unknown category', () => {
    expect(getDepartmentForCategory('Unmapped Category')).toBe('Other Services');
  });
});

describe('now helper', () => {
  test('returns a Date object', () => {
    expect(now()).toBeInstanceOf(Date);
  });
});
