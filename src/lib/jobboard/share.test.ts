import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { copyRoleLink, shareRole } from './share';

const role = {
	title: 'Product designer at Example Studio',
	url: 'https://www.start-berlin.com/jobs/job-example/product-designer',
};

test('native sharing passes the canonical role data without copying', async () => {
	let copied = false;
	let shared: unknown;
	assert.equal(await shareRole(role, {
		canShare: () => true,
		share: async (data) => { shared = data; },
		clipboard: { writeText: async () => { copied = true; } },
	}), 'shared');
	assert.deepEqual(shared, role);
	assert.equal(copied, false);
});

test('browsers without native sharing copy the canonical link', async () => {
	let copied: string | undefined;
	assert.equal(await shareRole(role, {
		clipboard: { writeText: async (url) => { copied = url; } },
	}), 'copied');
	assert.equal(copied, role.url);
});

test('unsupported role data uses copying without opening native sharing', async () => {
	let shared = false;
	let copied: string | undefined;
	assert.equal(await shareRole(role, {
		canShare: () => false,
		share: async () => { shared = true; },
		clipboard: { writeText: async (url) => { copied = url; } },
	}), 'copied');
	assert.equal(shared, false);
	assert.equal(copied, role.url);
});

test('native sharing still works when canShare is not available', async () => {
	let shared = false;
	assert.equal(await shareRole(role, {
		share: async () => { shared = true; },
	}), 'shared');
	assert.equal(shared, true);
});

test('cancelling native sharing never writes to the clipboard', async () => {
	let copied = false;
	assert.equal(await shareRole(role, {
		share: async () => { throw new DOMException('Cancelled', 'AbortError'); },
		clipboard: { writeText: async () => { copied = true; } },
	}), 'cancelled');
	assert.equal(copied, false);
});

test('share cancellations from another realm never overwrite the clipboard', async () => {
	const cancellation: unknown = runInNewContext("Object.assign(new Error('Cancelled'), { name: 'AbortError' })");
	assert.equal(cancellation instanceof Error, false);
	let copied = false;
	assert.equal(await shareRole(role, {
		share: async () => { throw cancellation; },
		clipboard: { writeText: async () => { copied = true; } },
	}), 'cancelled');
	assert.equal(copied, false);
});

test('native permission failures fall back to the canonical link', async () => {
	let copied: string | undefined;
	assert.equal(await shareRole(role, {
		share: async () => { throw new DOMException('Blocked', 'NotAllowedError'); },
		clipboard: { writeText: async (url) => { copied = url; } },
	}), 'copied');
	assert.equal(copied, role.url);
});

test('unavailable or blocked clipboard returns a recoverable failure', async () => {
	assert.equal(await copyRoleLink(role.url, {}), 'failed');
	assert.equal(await shareRole(role, {
		clipboard: { writeText: async () => { throw new DOMException('Blocked', 'NotAllowedError'); } },
	}), 'failed');
});
