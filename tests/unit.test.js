const test = require('node:test');
const assert = require('node:assert/strict');

const { z } = require('zod');
const validate = require('../middlewares/validate');
const verifyAdminToken = require('../middlewares/AuthMiddleware');
const { pagedPesertaSchema } = require('../schemas/requestSchemas');
const { __test: spinTest } = require('../services/SpinService');

test('pagination schema applies defaults and caps page size', () => {
  const result = pagedPesertaSchema.safeParse({ page: '2', limit: '50' });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, { page: 2, limit: 50, search: '', divisi: '' });
  assert.equal(pagedPesertaSchema.safeParse({ limit: '101' }).success, false);
});

test('validation middleware returns structured errors', () => {
  const schema = z.object({ name: z.string().min(3) });
  const req = { body: { name: 'x' } };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  validate(schema)(req, res, () => assert.fail('next must not be called'));

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Validation failed');
  assert.equal(res.payload.errors[0].field, 'name');
});

test('weighted prize selection respects stock limits', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const result = spinTest.pickPrizesWeighted(
      [
        { id_hadiah: 1, nama_hadiah: 'A', tipe: 'reguler', stok_sisa: 2 },
        { id_hadiah: 2, nama_hadiah: 'B', tipe: 'reguler', stok_sisa: 1 },
      ],
      5,
    );

    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map((item) => item.id_hadiah),
      [1, 1, 2],
    );
  } finally {
    Math.random = originalRandom;
  }
});

test('admin auth rejects malformed authorization headers', () => {
  const req = { headers: { authorization: 'Basic abc' } };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  verifyAdminToken(req, res, () => assert.fail('next must not be called'));
  assert.equal(res.statusCode, 401);
});
