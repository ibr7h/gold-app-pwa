'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { verifyHistory, requestJson, isMarketOpen, MAX_BODY_BYTES } = require('./check-live-history.cjs');
const NOW = Date.parse('2026-10-24T23:00:00Z');
const DAY = 86_400_000;

function fixture(currency = 'SAR', importedDays = 11) {
  const dates = Array.from({ length: 29 }, (_, i) => new Date(Date.UTC(2026, 8, 25 + i)))
    .filter(d => d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
    .map(d => d.toISOString().slice(0, 10));
  const month = dates.map((day, index) => index < importedDays ? {
    id: 'daily-' + day, kind: 'daily-average', day,
    currency, karat: 24, buyPrice: '490.1234', source: 'api.gold-api.com/history',
  } : {
    id: 'spot-' + day, kind: 'spot', timestamp: day + 'T15:00:00Z',
    currency, karat: 24, buyPrice: '495.1234', source: 'api.gold-api.com',
  });
  const latest = { ...month.at(-1) };
  delete latest.kind;
  return { month, day: [], latest };
}

function check(data, options = {}) { return verifyHistory(data, { now: NOW, ...options }); }
function change(mutator) { const data = fixture(); mutator(data); return data; }

test('regression: 11 averages plus real observations prove 21 distinct days', () => {
  const report = check(fixture());
  assert.equal(report.distinctCoveredDays, 21);
  assert.equal(report.dailyAveragePoints, 11);
  assert.equal(report.openSessionSpotPoints, 10);
  assert.equal(report.firstDay, '2026-09-25');
  assert.equal(report.lastDay, '2026-10-23');
});
test('a rolling month can become all real observations without forcing artificial backfill', () => {
  const report = check(fixture('SAR', 0));
  assert.equal(report.distinctCoveredDays, 21);
  assert.equal(report.dailyAveragePoints, 0);
});
test('validates USD independently, not SAR relabeled as USD', () => {
  assert.equal(check(fixture('USD'), { currency: 'USD' }).distinctCoveredDays, 21);
  assert.throws(() => check(fixture('SAR'), { currency: 'USD' }), /currency/);
});
test('fails genuine missing history (20 distinct days)', () => {
  assert.throws(() => check(change(d => d.month.shift())), /insufficient historical coverage: 20/);
});
test('many observations in one day cannot substitute for monthly coverage', () => {
  const data = fixture('SAR', 0);
  data.month = Array.from({ length: 100 }, (_, i) => ({ ...data.month.at(-1),
    id: 'quote-' + i, timestamp: new Date(Date.parse('2026-10-23T12:00:00Z') + i * 60_000).toISOString(),
  }));
  assert.throws(() => check(data), /coverage: 1 distinct/);
});
test('overlapping daily and spot dates count only once', () => {
  const data = fixture();
  data.month.push({ ...fixture('SAR', 0).month[0], id: 'extra-spot' });
  assert.equal(check(data).distinctCoveredDays, 21);
});
test('duplicate ids and duplicate days cannot inflate coverage', () => {
  assert.throws(() => check(change(d => d.month.push({ ...d.month[0] }))), /duplicate history id/);
  assert.throws(() => check(change(d => d.month.push({ ...d.month[0], id: 'different-id' }))), /duplicate historical UTC day/);
});
test('duplicate observation timestamps cannot inflate coverage', () => {
  assert.throws(() => check(change(d => d.month.push({ ...d.month.at(-1), id: 'duplicate-observation' }))),
    /duplicate source observation/);
});
test('keeps averages separate from source timestamps and latest quotes', () => {
  assert.throws(() => check(change(d => d.month[0].timestamp = d.latest.timestamp)), /invented quote timestamp/);
  assert.throws(() => check(change(d => d.latest.source = 'api.gold-api.com/history')), /daily average leaked/);
  assert.throws(() => check(change(d => d.latest.kind = 'daily-average')), /daily average leaked/);
});
test('requires real market observations; an archive alone is insufficient', () => {
  const data = fixture('SAR', 21);
  assert.throws(() => check(data), /real open-session spot data is absent/);
});
test('never accepts daily averages in the 24h chart', () => {
  assert.throws(() => check(change(d => d.day = [d.month[0]])), /daily averages leaked into the 24h chart/);
});
test('accepts an empty weekend 24h chart, without calling the quote live', () => {
  const report = check(fixture());
  assert.equal(report.daySpotPoints, 0);
  assert.equal(report.latestAgeSeconds, 32 * 3600);
  assert.match(report.note, /freshness must be assessed separately/);
});
test('requires 24h data when the latest observation is actually recent', () => {
  const data = fixture();
  const now = Date.parse('2026-10-23T15:10:00Z');
  assert.throws(() => check(data, { now }), /24h chart is empty/);
  data.day = [{ ...data.month.at(-1) }];
  assert.equal(check(data, { now }).daySpotPoints, 1);
});
test('the latest endpoint cannot lag behind observed chart data', () => {
  assert.throws(() => check(change(d => d.latest.timestamp = '2026-10-22T15:00:00Z')), /behind/);
});
test('rejects future, old and timezone-less observations', () => {
  assert.throws(() => check(change(d => d.latest.timestamp = '2026-10-25T23:00:00Z')), /future-dated/);
  assert.throws(() => check(change(d => d.latest.timestamp = '2026-10-19T15:00:00Z')), /older than four days/);
  assert.throws(() => check(change(d => d.month.at(-1).timestamp = '2026-10-23T15:00:00')), /non-UTC/);
  assert.throws(() => check(change(d => d.month.at(-1).timestamp = '2026-11-23T15:00:00Z')), /outside requested window/);
  assert.throws(() => check(change(d => d.month.at(-1).timestamp = '2026-09-01T15:00:00Z')), /outside requested window/);
});
test('accepts existing PostgreSQL UTC timestamp serialization', () => {
  const data = fixture();
  data.month.at(-1).timestamp = '2026-10-23 15:00:00+00';
  data.latest.timestamp = '2026-10-23 15:00:00+00';
  assert.equal(check(data).latestSourceTimestamp, '2026-10-23T15:00:00.000Z');
});
test('rejects malformed calendar dates, incomplete days and wrong aggregation', () => {
  assert.throws(() => check(change(d => d.month[0].day = '2026-02-30')), /nonexistent/);
  assert.throws(() => check(change(d => d.month[0].day = '2026-10-24')), /completed date window/);
  assert.throws(() => check(change(d => d.month[0].kind = 'daily-max')), /unknown history point kind/);
  assert.throws(() => check(change(d => d.month[0].source = 'unknown')), /provenance/);
});
test('rejects wrong currency, karat and non-finite/non-numeric prices', () => {
  for (const price of [0, -1, NaN, Infinity, null, true, '', 'Infinity', '0x10', {}, []]) {
    assert.throws(() => check(change(d => d.month[0].buyPrice = price)), /invalid price/);
  }
  assert.throws(() => check(change(d => d.month[0].karat = 18)), /karat/);
  assert.throws(() => check(change(d => d.month[0].currency = 'EUR')), /currency/);
});
test('reports legacy closed-session ticks without counting them as coverage', () => {
  const data = fixture();
  data.month.push({ ...data.month.at(-1), id: 'legacy-weekend', timestamp: '2026-10-10T04:34:46Z' });
  assert.equal(check(data).ignoredClosedSessionPoints, 1);
  assert.equal(check(data).distinctCoveredDays, 21);
  data.month.shift();
  assert.throws(() => check(data), /coverage: 20 distinct/);
});
test('rejects closed-session latest observations and Saturday daily averages', () => {
  assert.throws(() => check(change(d => d.latest.timestamp = '2026-10-24T15:00:00Z')), /closed-session/);
  assert.throws(() => check(change(d => d.month[0].day = '2026-10-10')), /Saturday/);
});
test('session policy matches winter/summer New York boundaries', () => {
  for (const [iso, expected] of [
    ['2026-10-23T20:59:00Z', true], ['2026-10-23T21:00:00Z', false],
    ['2026-10-25T21:59:00Z', false], ['2026-10-25T22:00:00Z', true],
    ['2026-11-01T22:59:00Z', false], ['2026-11-01T23:00:00Z', true],
    ['2026-11-02T22:30:00Z', false], ['2026-11-02T23:00:00Z', true],
  ]) assert.equal(isMarketOpen(Date.parse(iso)), expected, iso);
});
test('empty, non-array and oversized datasets fail closed', () => {
  for (const month of [[], null, {}, Array(801).fill({})]) {
    assert.throws(() => check({ ...fixture(), month }));
  }
});
test('public request uses the approved origin with no account credentials or redirects', async () => {
  let seen;
  const result = await requestJson('/prices/latest?currency=SAR&karat=24', {
    fetchImpl: async (url, options) => { seen = { url, options }; return Response.json({ ok: true }); },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(new URL(seen.url).origin, 'https://gold-app-api-u8dl.onrender.com');
  assert.equal(seen.options.credentials, 'omit');
  assert.equal(seen.options.redirect, 'error');
  assert.equal(seen.options.referrerPolicy, 'no-referrer');
  assert.deepEqual(seen.options.headers, { Accept: 'application/json' });
});
test('HTTP failures, HTML and malformed JSON never become successful empty data', async () => {
  for (const response of [
    new Response('down', { status: 503 }),
    new Response('<html>loading</html>', { headers: { 'content-type': 'text/html' } }),
    new Response('{', { headers: { 'content-type': 'application/json' } }),
  ]) await assert.rejects(requestJson('/prices/latest', { fetchImpl: async () => response }));
});
test('caps declared and streamed body sizes', async () => {
  await assert.rejects(requestJson('/prices/latest', { fetchImpl: async () => new Response('{}', {
    headers: { 'content-type': 'application/json', 'content-length': String(MAX_BODY_BYTES + 1) },
  }) }), /too large/);
  await assert.rejects(requestJson('/prices/latest', { fetchImpl: async () => new Response(' '.repeat(MAX_BODY_BYTES + 1), {
    headers: { 'content-type': 'application/json' },
  }) }), /too large/);
});
test('absolute deadline covers stalled headers even when a test transport ignores abort', async () => {
  await assert.rejects(requestJson('/prices/latest', {
    timeoutMs: 20, fetchImpl: () => new Promise(() => {}),
  }), /absolute timeout/);
});
test('absolute deadline covers a stalled response body', async () => {
  await assert.rejects(requestJson('/prices/latest', {
    timeoutMs: 20, fetchImpl: async () => new Response(new ReadableStream({ start() {} }), {
      headers: { 'content-type': 'application/json' },
    }),
  }), /absolute timeout/);
});
