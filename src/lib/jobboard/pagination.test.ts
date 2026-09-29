import assert from 'node:assert/strict';
import test from 'node:test';
import { JOBS_PER_PAGE, clampPage, getPageCount, getPageRange, getPageTokens } from './pagination';

test('25-role boundaries produce complete pages and a bounded last page', () => {
	assert.equal(JOBS_PER_PAGE, 25);
	for (const [total, count] of [[0, 0], [1, 1], [25, 1], [26, 2], [50, 2], [51, 3], [500, 20]]) {
		assert.equal(getPageCount(total), count, `${total} roles`);
	}
	assert.deepEqual(getPageRange(0, 99), { total: 0, page: 1, pageCount: 0, start: 0, end: 0, offset: 0, limit: 25 });
	assert.deepEqual(getPageRange(26, 2), { total: 26, page: 2, pageCount: 2, start: 26, end: 26, offset: 25, limit: 25 });
	assert.deepEqual(getPageRange(50, 2), { total: 50, page: 2, pageCount: 2, start: 26, end: 50, offset: 25, limit: 25 });
	assert.deepEqual(getPageRange(51, 3), { total: 51, page: 3, pageCount: 3, start: 51, end: 51, offset: 50, limit: 25 });
});

test('invalid and out-of-range URL pages always resolve to a valid page', () => {
	assert.equal(clampPage(-10, 5), 1);
	assert.equal(clampPage(0, 5), 1);
	assert.equal(clampPage(999, 5), 5);
	assert.equal(clampPage(3.7, 5), 3);
	assert.equal(clampPage(Number.NaN, 5), 1);
	assert.equal(clampPage(Number.POSITIVE_INFINITY, 5), 1);
	assert.equal(clampPage(9, 0), 1);
	assert.equal(getPageCount(-5), 0);
	assert.equal(getPageCount(Number.NaN), 0);
	assert.equal(getPageRange(76, 999).start, 76);
	assert.equal(getPageRange(76, 999).end, 76);
	assert.equal(getPageRange(76, -2).start, 1);
});

test('page windows show useful neighbors and reserve gaps for skipped pages', () => {
	assert.deepEqual(getPageTokens(1, 0), []);
	assert.deepEqual(getPageTokens(1, 1), [1]);
	assert.deepEqual(getPageTokens(3, 5), [1, 2, 3, 4, 5]);
	assert.deepEqual(getPageTokens(1, 20), [1, 2, 3, 4, 'gap-right', 20]);
	assert.deepEqual(getPageTokens(10, 20), [1, 'gap-left', 9, 10, 11, 'gap-right', 20]);
	assert.deepEqual(getPageTokens(20, 20), [1, 'gap-left', 17, 18, 19, 20]);
	assert.deepEqual(getPageTokens(999, 20), getPageTokens(20, 20));
	assert.deepEqual(getPageTokens(-1, 20), getPageTokens(1, 20));
	assert.deepEqual(getPageTokens(4, 8), [1, 2, 3, 4, 5, 'gap-right', 8]);
});

test('compact windows preserve first, last and current without repeated pages', () => {
	assert.deepEqual(getPageTokens(10, 20, true), [1, 'gap-left', 10, 'gap-right', 20]);
	assert.deepEqual(getPageTokens(1, 20, true), [1, 'gap-right', 20]);
	assert.deepEqual(getPageTokens(20, 20, true), [1, 'gap-left', 20]);
	assert.deepEqual(getPageTokens(2, 4, true), [1, 2, 3, 4]);
	for (const count of [5, 8, 20, 500]) {
		for (const page of [1, 2, 3, Math.ceil(count / 2), count - 1, count]) {
			const tokens = getPageTokens(page, count, true);
			const numbers = tokens.filter((token): token is number => typeof token === 'number');
			assert.equal(numbers.length, new Set(numbers).size);
			assert.ok(numbers.includes(1) && numbers.includes(count) && numbers.includes(page));
			assert.ok(numbers.length <= 3);
			assert.ok(numbers.every((number, index) => index === 0 || number > numbers[index - 1]));
		}
	}
});
