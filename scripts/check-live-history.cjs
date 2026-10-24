'use strict';

const assert = require('node:assert/strict');
const DAY = 86_400_000;
const BASE = 'https://gold-app-api-u8dl.onrender.com';
const SPOT_SOURCE = 'api.gold-api.com';
const DAILY_SOURCE = 'api.gold-api.com/history';
const MAX_BODY_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 45_000; // Includes a possible Render cold start.
const ny = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
});

// Same ordinary session policy as the User chart. This is NOT a holiday calendar.
function isMarketOpen(at) {
  const parts = ny.formatToParts(new Date(at));
  const day = parts.find(p => p.type === 'weekday')?.value;
  const hour = Number(parts.find(p => p.type === 'hour')?.value);
  if (day === 'Sat') return false;
  if (day === 'Sun') return hour >= 18;
  if (day === 'Fri') return hour < 17;
  return ['Mon', 'Tue', 'Wed', 'Thu'].includes(day) && hour !== 17;
}

function strictDay(value) {
  assert.equal(typeof value, 'string', 'missing historical UTC day');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value), 'invalid historical UTC day');
  const at = Date.parse(value + 'T00:00:00Z');
  assert(Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === value,
    'nonexistent historical UTC day');
  return at;
}

function timestamp(value) {
  // Accept the existing PostgreSQL UTC text and ISO UTC forms, never local time.
  assert(typeof value === 'string' && value.length <= 40 &&
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00(?::00)?)$/.test(value),
  'missing or non-UTC source timestamp');
  strictDay(value.slice(0, 10));
  const at = Date.parse(value.replace(' ', 'T').replace(/\+00$/, '+00:00'));
  assert(Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === value.slice(0, 10),
    'invalid source timestamp');
  return at;
}

function validatePrice(row, currency) {
  assert(row && typeof row === 'object' && !Array.isArray(row), 'invalid price object');
  assert.equal(row.currency, currency, 'wrong price currency');
  assert.equal(row.karat, 24, 'wrong price karat');
  assert((typeof row.buyPrice === 'number' || typeof row.buyPrice === 'string') &&
    /^\d+(?:\.\d+)?$/.test(String(row.buyPrice)) &&
    Number.isFinite(Number(row.buyPrice)) && Number(row.buyPrice) > 0,
  'invalid price');
}

function validateSeries(rows, { currency, now, days, allowDaily }) {
  assert(Array.isArray(rows) && rows.length <= 800, 'invalid or oversized history series');
  const coveredDays = new Set();
  const ids = new Set();
  const observations = new Set();
  const dailyDays = new Set();
  let dailyPoints = 0, spotPoints = 0, closedSessionPoints = 0;
  let newestSpot = -Infinity;
  for (const row of rows) {
    validatePrice(row, currency);
    assert(typeof row.id === 'string' && row.id.length > 0 && row.id.length <= 100,
      'missing history id');
    assert(!ids.has(row.id), 'duplicate history id');
    ids.add(row.id);
    if (row.kind === 'daily-average') {
      assert(allowDaily, 'daily averages leaked into the 24h chart');
      assert.equal(row.source, DAILY_SOURCE, 'wrong daily-average provenance');
      assert(row.timestamp == null, 'daily average has an invented quote timestamp');
      const at = strictDay(row.day);
      assert(row.day >= new Date(now - days * DAY).toISOString().slice(0, 10) &&
        at < Math.floor(now / DAY) * DAY, 'historical day outside completed date window');
      assert(new Date(at).getUTCDay() !== 6, 'Saturday daily average is not a trading day');
      assert(!dailyDays.has(row.day), 'duplicate historical UTC day');
      dailyDays.add(row.day);
      coveredDays.add(row.day);
      dailyPoints++;
    } else {
      assert.equal(row.kind, 'spot', 'unknown history point kind');
      assert.equal(row.source, SPOT_SOURCE, 'wrong spot provenance');
      assert(row.day == null, 'spot must have a source timestamp, not an aggregate day');
      const at = timestamp(row.timestamp);
      assert(at >= now - days * DAY && at <= now + 5 * 60_000,
        'spot timestamp outside requested window');
      assert(!observations.has(at), 'duplicate source observation');
      observations.add(at);
      // Legacy closed-session ticks are already ignored by the User chart. Report
      // them, but do not let them inflate the coverage proof or freshness evidence.
      if (!isMarketOpen(at)) { closedSessionPoints++; continue; }
      coveredDays.add(new Date(at).toISOString().slice(0, 10));
      newestSpot = Math.max(newestSpot, at);
      spotPoints++;
    }
  }
  return { coveredDays, dailyPoints, spotPoints, closedSessionPoints, newestSpot };
}

function verifyHistory({ month, day, latest }, { currency = 'SAR', now = Date.now() } = {}) {
  assert(['SAR', 'USD'].includes(currency), 'unsupported backend currency');
  assert(Number.isFinite(now), 'invalid verification time');
  const monthly = validateSeries(month, { currency, now, days: 30, allowDaily: true });
  assert(monthly.spotPoints > 0, 'real open-session spot data is absent');
  const covered = [...monthly.coveredDays].sort();
  // The backfill intentionally excludes days with real observations. A healthy
  // rolling month eventually has ZERO imported days, not >=21 imported days.
  assert(covered.length >= 21,
    `insufficient historical coverage: ${covered.length} distinct UTC days; need >=21`);
  assert(strictDay(covered.at(-1)) - strictDay(covered[0]) >= 21 * DAY,
    'historical coverage does not span at least 21 days');
  const daily = validateSeries(day, { currency, now, days: 1, allowDaily: false });
  validatePrice(latest, currency);
  assert.equal(latest.source, SPOT_SOURCE, 'daily average leaked into latest price');
  assert(latest.kind == null || latest.kind === 'spot', 'daily average leaked into latest price');
  assert(latest.day == null, 'aggregate day leaked into latest price');
  const latestAt = timestamp(latest.timestamp);
  assert(latestAt <= now + 5 * 60_000 && latestAt >= now - 4 * DAY,
    'latest observation is future-dated or older than four days');
  assert(isMarketOpen(latestAt), 'latest price is a closed-session observation');
  assert(latestAt >= Math.max(monthly.newestSpot, daily.newestSpot),
    'latest endpoint is behind the observed chart history');
  if (latestAt >= now - DAY) {
    assert(daily.spotPoints > 0, '24h chart is empty despite a recent real observation');
  }
  return {
    currency, distinctCoveredDays: covered.length, firstDay: covered[0], lastDay: covered.at(-1),
    dailyAveragePoints: monthly.dailyPoints, openSessionSpotPoints: monthly.spotPoints,
    ignoredClosedSessionPoints: monthly.closedSessionPoints,
    daySpotPoints: daily.spotPoints, latestSourceTimestamp: new Date(latestAt).toISOString(),
    latestAgeSeconds: Math.max(0, Math.round((now - latestAt) / 1000)),
    note: 'Coverage proof only: sparse intraday gaps and quote freshness must be assessed separately.',
  };
}

async function requestJson(path, { fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  assert(path.startsWith('/prices/') && !path.includes('://'), 'unexpected API path');
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('history API absolute timeout'));
    }, timeoutMs);
  });
  const work = (async () => {
    const response = await fetchImpl(BASE + path, {
      headers: { Accept: 'application/json' }, signal: controller.signal,
      credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer',
    });
    assert.equal(response.status, 200, 'history API HTTP ' + response.status);
    assert(/^application\/json\b/i.test(response.headers.get('content-type') || ''),
      'history API did not return JSON');
    const length = response.headers.get('content-length');
    assert(length == null || (/^\d+$/.test(length) && Number(length) <= MAX_BODY_BYTES),
      'history API response too large');
    assert(response.body, 'history API response is empty');
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        assert(bytes <= MAX_BODY_BYTES, 'history API response too large');
        chunks.push(value);
      }
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
    } catch (error) {
      controller.abort();
      void reader.cancel().catch(() => {});
      throw error;
    } finally {
      reader.releaseLock();
    }
  })();
  try { return await Promise.race([work, deadline]); }
  finally { clearTimeout(timer); controller.abort(); }
}

async function run() {
  const reports = [];
  for (const currency of ['SAR', 'USD']) {
    // Sequential reads ensure latest is sampled after the chart observations.
    const month = await requestJson(`/prices/history/chart?currency=${currency}&karat=24&range=month`);
    const day = await requestJson(`/prices/history/chart?currency=${currency}&karat=24&range=day`);
    const latest = await requestJson(`/prices/latest?currency=${currency}&karat=24`);
    reports.push(verifyHistory({ month, day, latest }, { currency }));
  }
  console.log(JSON.stringify({ status: 'passed', reports }, null, 2));
}

module.exports = { verifyHistory, requestJson, isMarketOpen, MAX_BODY_BYTES };
if (require.main === module) run().catch(error => {
  console.error('FAIL live history: ' + error.message);
  process.exitCode = 1;
});
