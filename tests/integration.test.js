const test = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../server');
const { db } = require('../config/db');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await db.promise().end();
});

test('health and readiness endpoints expose operational status', async () => {
  const health = await fetch(`${baseUrl}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual((await health.json()).data, { status: 'ok' });

  const ready = await fetch(`${baseUrl}/readyz`);
  assert.equal(ready.status, 200);
  assert.deepEqual((await ready.json()).data, { status: 'ok' });

  const stage = await fetch(`${baseUrl}/api/spin/current`);
  assert.equal(stage.status, 200);
});

test('protected CRUD and spin routes reject unauthenticated requests', async () => {
  const paths = [
    '/api/admin/peserta',
    '/api/admin/hadiah',
    '/api/spin/start',
    '/api/spin/respin',
    '/api/admin/resetevent',
  ];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`, { method: 'POST' });
    assert.equal(response.status, 401, path);
  }
});

test('login validation rejects malformed credentials before database access', async () => {
  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: '' }),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'Validation failed');
});

const databaseTestsEnabled = process.env.RUN_DB_TESTS === '1';
test(
  'database CRUD, spin, respin, reset, and auth integration contract',
  { skip: !databaseTestsEnabled },
  async () => {
    assert.ok(process.env.TEST_ADMIN_USERNAME, 'TEST_ADMIN_USERNAME is required');
    assert.ok(process.env.TEST_ADMIN_PASSWORD, 'TEST_ADMIN_PASSWORD is required');
    assert.ok(process.env.TEST_GROUP_ID, 'TEST_GROUP_ID is required');

    const request = async (path, options = {}) => {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      });
      const body = await response.json();
      return { response, body };
    };

    const login = await request('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: process.env.TEST_ADMIN_USERNAME,
        password: process.env.TEST_ADMIN_PASSWORD,
      }),
    });
    assert.equal(login.response.status, 200);
    const authHeaders = { Authorization: `Bearer ${login.body.token}` };

    const divisions = await request('/api/admin/divisi', { headers: authHeaders });
    assert.equal(divisions.response.status, 200);
    const divisionId = divisions.body.data[0]?.id_divisi;
    assert.ok(divisionId, 'test database needs one division');

    const suffix = Date.now();
    const participantPayload = {
      nip: `IT${String(suffix).slice(-10)}`,
      nama_lengkap: 'Integration Participant',
      tgl_lahir: '1990-01-01',
      id_divisi: divisionId,
    };
    const createdParticipant = await request('/api/admin/peserta', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(participantPayload),
    });
    assert.equal(createdParticipant.response.status, 201);
    const participants = await request('/api/admin/peserta', { headers: authHeaders });
    const participant = participants.body.data.find((item) => item.nip === participantPayload.nip);
    assert.ok(participant, 'created participant must be listed');
    assert.equal(
      (
        await request(`/api/admin/peserta/${participant.id_user}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            ...participantPayload,
            nama_lengkap: 'Updated Integration Participant',
          }),
        })
      ).response.status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/peserta/${participant.id_user}`, {
          method: 'DELETE',
          headers: authHeaders,
        })
      ).response.status,
      200,
    );

    const groupId = Number(process.env.TEST_GROUP_ID);
    const prizeName = `Integration Prize ${suffix}`;
    assert.equal(
      (
        await request('/api/admin/hadiah', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            id_kelompok: groupId,
            nama_hadiah: prizeName,
            tipe: 'reguler',
            stok_total: 1,
          }),
        })
      ).response.status,
      201,
    );
    const prizes = await request('/api/admin/hadiah', { headers: authHeaders });
    const prize = prizes.body.data.find((item) => item.nama_hadiah === prizeName);
    assert.ok(prize, 'created prize must be listed');
    assert.equal(
      (
        await request(`/api/admin/hadiah/${prize.id_hadiah}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            id_kelompok: groupId,
            nama_hadiah: `${prizeName} Updated`,
            tipe: 'reguler',
            stok_total: 1,
          }),
        })
      ).response.status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/hadiah/${prize.id_hadiah}`, {
          method: 'DELETE',
          headers: authHeaders,
        })
      ).response.status,
      200,
    );

    const spinPayload = {
      id_kelompok: groupId,
      nama_kelompok: 'Integration Session',
      jumlah_slot: 1,
      mode: 'reguler',
    };
    assert.equal(
      (
        await request('/api/spin/start', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(spinPayload),
        })
      ).response.status,
      200,
    );
    assert.ok(
      [200, 400].includes(
        (
          await request('/api/spin/stop', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ id_kelompok: groupId }),
          })
        ).response.status,
      ),
    );
    assert.ok(
      [200, 400].includes(
        (
          await request('/api/spin/respin', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(spinPayload),
          })
        ).response.status,
      ),
    );
    assert.equal(
      (
        await request('/api/spin/clear', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({}),
        })
      ).response.status,
      200,
    );
    assert.equal(
      (
        await request('/api/admin/resetevent', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({}),
        })
      ).response.status,
      200,
    );
  },
);
