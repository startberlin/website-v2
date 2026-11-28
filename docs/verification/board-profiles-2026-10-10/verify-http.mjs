import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { boardMembers, boardProfileIsIndexable } from '../../../src/lib/board-members.ts';

const results = [];
const origin = 'https://www.start-berlin.com';
for (const [policy, port] of [['preview', 4352], ['production-policy', 4353]]) {
  const base = `http://127.0.0.1:${port}`;
  const titles = new Set();
  for (const member of boardMembers) {
    const path = `/members/${member.slug}`;
    for (const suffix of ['', '?utm_source=board-check&season=26-27']) {
      const response = await fetch(base + path + suffix);
      assert.equal(response.status, 200);
      const html = await response.text();
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)[1];
      const robots = html.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/)[1];
      assert.equal(canonical, origin + path);
      assert.equal(robots.startsWith('noindex'), policy === 'preview' || !boardProfileIsIndexable(member));
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.equal((html.match(/<main\b/g) ?? []).length, 1);
      assert.ok(html.includes(member.email));
      assert.ok(html.includes(`href="/members#26-27-board"`));
      assert.equal((html.match(/<blockquote\b/g) ?? []).length, member.content.quote ? 1 : 0);
      const graph = JSON.parse(html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
      const page = graph['@graph'].find((entry) => entry['@type'] === 'AboutPage');
      assert.equal(page.url, canonical);
      const breadcrumbs = graph['@graph'].find((entry) => entry['@type'] === 'BreadcrumbList');
      assert.equal(breadcrumbs.itemListElement[2].name, member.name);
      assert.equal(breadcrumbs.itemListElement[2].item, canonical);
      const title = html.match(/<title>([^<]+)<\/title>/)[1];
      if (!suffix) {
        assert.ok(!titles.has(title));
        titles.add(title);
        const photo = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]).find((tag) => tag.includes(`alt="Portrait of ${member.name}"`));
        assert.ok(photo);
        const src = photo.match(/\bsrc="([^"]+)"/)[1];
        const imageResponse = await fetch(base + src);
        assert.equal(imageResponse.status, 200);
        assert.match(imageResponse.headers.get('content-type'), /image\/webp/);
        results.push({ policy, path: src, type: 'portrait', status: imageResponse.status });
      }
      results.push({ policy, path: path + suffix, status: response.status, canonical, robots, robotsHeader: response.headers.get('x-robots-tag'), schema: 'AboutPage + BreadcrumbList' });
    }
  }
  for (const path of ['/robots.txt', '/sitemap.xml', '/sitemap-pages.xml']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    const text = await response.text();
    if (policy === 'preview') {
      assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
      if (path === '/robots.txt') assert.equal(text, 'User-agent: *\nDisallow: /\n');
      else assert.doesNotMatch(text, /<loc>/);
    } else if (path === '/robots.txt') assert.match(text, /User-agent: \*\nAllow: \//);
    else if (path === '/sitemap-pages.xml') {
      assert.equal((text.match(/<url>/g) ?? []).length, 7);
      for (const member of boardMembers) assert.equal(text.includes(`${origin}/members/${member.slug}`), boardProfileIsIndexable(member));
      assert.doesNotMatch(text, /lastmod|priority|changefreq/);
    }
    results.push({ policy, path, status: response.status, type: 'discovery' });
  }
  for (const path of ['/members/alvaro-torres', '/members/not-a-board-member', '/board-design-comparison/split']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404);
    const html = await response.text();
    assert.doesNotMatch(html, /rel="canonical"|application\/ld\+json/);
    assert.match(html, /noindex/);
    results.push({ policy, path, status: response.status, type: 'excluded or missing page' });
  }
}
await writeFile(new URL('./http-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log(`Passed ${results.length} HTTP, metadata, image and discovery checks in both policies.`);
