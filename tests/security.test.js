const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const verifyAdminToken = require('../middlewares/AuthMiddleware.js');
const errorHandler = require('../middlewares/errorHandler.js');
const verifyUserToken = require('../middlewares/verifyUserToken.js');

test('admin auth middleware rejects missing bearer token', () => {
  const req = { headers: {} };
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

  const next = () => {
    throw new Error('next should not be called');
  };

  assert.equal(typeof verifyAdminToken, 'function');
  const result = verifyAdminToken(req, res, next);
  assert.equal(result, res);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, {
    success: false,
    data: null,
    message: 'Admin token is missing',
  });
});

test('error handler is defined and returns a function', () => {
  assert.equal(typeof errorHandler, 'function');
});

test('user auth middleware is defined', () => {
  assert.equal(typeof verifyUserToken, 'function');
});

test('participant auth accepts participant token and rejects other token types', () => {
  process.env.JWT_SECRET = 'test-secret';

  const createResponse = () => ({
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  });

  const participantToken = jwt.sign(
    { id_user: 42, type: 'participant' },
    process.env.JWT_SECRET,
  );
  const validRequest = { headers: { authorization: `Bearer ${participantToken}` } };
  const validResponse = createResponse();
  let nextCalled = false;

  verifyUserToken(validRequest, validResponse, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(validRequest.user.id_user, 42);

  const adminToken = jwt.sign({ id_admin: 1, type: 'admin' }, process.env.JWT_SECRET);
  const invalidResponse = createResponse();
  verifyUserToken(
    { headers: { authorization: `Bearer ${adminToken}` } },
    invalidResponse,
    () => assert.fail('admin token must not pass participant middleware'),
  );

  assert.equal(invalidResponse.statusCode, 401);
});
