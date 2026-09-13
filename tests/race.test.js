const test = require('node:test');
const assert = require('node:assert/strict');

const databaseTestsEnabled = process.env.RUN_DB_TESTS === '1';

test(
  'concurrent check-in allows exactly one successful registration',
  { skip: !databaseTestsEnabled },
  async () => {
    assert.ok(process.env.TEST_RACE_NIP, 'TEST_RACE_NIP is required');
    assert.ok(process.env.TEST_RACE_DOB, 'TEST_RACE_DOB is required');

    const { queryAsync, db } = require('../config/db');
    await queryAsync("UPDATE users SET status_terdaftar = 'belum' WHERE nip = ?", [
      process.env.TEST_RACE_NIP,
    ]);
    const baseUrl = `http://127.0.0.1:${process.env.TEST_PORT || 3001}`;
    const payload = JSON.stringify({
      nip: process.env.TEST_RACE_NIP,
      tgl_lahir: process.env.TEST_RACE_DOB,
    });
    const responses = await Promise.all([
      fetch(`${baseUrl}/api/checkin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
      }),
      fetch(`${baseUrl}/api/checkin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
      }),
    ]);

    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
    await queryAsync("UPDATE users SET status_terdaftar = 'belum' WHERE nip = ?", [
      process.env.TEST_RACE_NIP,
    ]);
    await db.promise().end();
  },
);

test(
  'race tests stay opt-in because they mutate database state',
  { skip: databaseTestsEnabled },
  () => {
    assert.equal(databaseTestsEnabled, false);
  },
);
