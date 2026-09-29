export type RoleShareData = {
	title: string;
	url: string;
};

type ShareBrowser = {
	share?: (data: RoleShareData) => Promise<void>;
	canShare?: (data: RoleShareData) => boolean;
	clipboard?: { writeText: (text: string) => Promise<void> };
};

export type RoleShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function copyRoleLink(url: string, browser: ShareBrowser): Promise<'copied' | 'failed'> {
	try {
		if (!browser.clipboard) return 'failed';
		await browser.clipboard.writeText(url);
		return 'copied';
	} catch {
		return 'failed';
	}
}

export async function shareRole(data: RoleShareData, browser: ShareBrowser): Promise<RoleShareResult> {
	if (typeof browser.share === 'function') {
		try {
			if (!browser.canShare || browser.canShare(data)) {
				await browser.share(data);
				return 'shared';
			}
		} catch (error) {
			if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
		}
	}
	return copyRoleLink(data.url, browser);
}
