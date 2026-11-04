import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { boardMembers } from '../../../../src/lib/board-members.ts';

const origin = 'https://www.start-berlin.com';
const results = [];

for (const [policy, port] of [['preview', 4352], ['production-policy', 4353]]) {
  const base = `http://127.0.0.1:${port}`;
  for (const member of boardMembers) {
    const path = `/members/${member.slug}`;
    for (const suffix of ['', '?utm_source=scroll-check']) {
      const response = await fetch(base + path + suffix);
      assert.equal(response.status, 200);
      const html = await response.text();
      const profile = html.match(/<article\b[\s\S]*?<\/article>/)[0];
      const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)[1];
      assert.equal(canonical, origin + path);
      const robots = html.match(/<meta\b[^>]*name="robots"[^>]*content="([^"]+)"/)[1];
      assert.equal(robots.startsWith('noindex'), policy === 'preview');
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
      assert.equal((html.match(/<main\b/g) ?? []).length, 1);
      assert.doesNotMatch(profile, /<nav\b|profile__breadcrumbs|Back to the board|Projects (&amp;|and) interests|In their words|profile__statement|profile__entry-description|Draft quote|A personal quote/);
      assert.equal(profile.split('Back to the Members').length - 1, 1);
      assert.ok(profile.includes('href="/members"'));
      assert.equal((profile.match(/<blockquote\b/g) ?? []).length, 0);
      if (member.name === 'Jannik Schaefer') {
        assert.doesNotMatch(profile, /KI Weekly model ranking|www\.kiweekly\.de\/ranking/i);
        assert.ok(profile.includes('href="https://www.kiweekly.de/"'));
        assert.ok(profile.includes('Feb 2023 - present'));
        assert.doesNotMatch(profile, /Business applications of AI|DAAD merit scholarship/);
      }
      assert.ok(profile.includes(member.email));
      for (const project of member.content.projects) {
        if (project.url) assert.equal(profile.split(`href="${project.url}"`).length - 1, 1);
        else assert.ok(profile.includes(project.title));
      }
      const graph = JSON.parse(html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
      assert.equal(graph['@graph'].find((entry) => entry['@type'] === 'AboutPage').url, canonical);
      assert.ok(!graph['@graph'].some((entry) => entry['@type'] === 'BreadcrumbList'));
      if (!suffix) {
        const portrait = [...profile.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]).find((tag) => tag.includes(`alt="Portrait of ${member.name}"`));
        const src = portrait.match(/\bsrc="([^"]+)"/)[1];
        const imageResponse = await fetch(base + src);
        assert.equal(imageResponse.status, 200);
        assert.match(imageResponse.headers.get('content-type'), /image\/webp/);
        results.push({ policy, path: src, type: 'portrait', status: imageResponse.status });
      }
      results.push({ policy, path: path + suffix, status: response.status, canonical, robots, schema: 'AboutPage without breadcrumbs', localNavigation: false, returnLabel: 'Back to the Members' });
    }
  }

  for (const path of ['/members', '/robots.txt', '/sitemap.xml', '/sitemap-pages.xml']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    const body = await response.text();
    if (path === '/members') {
      for (const member of boardMembers) assert.ok(body.includes(`href="/members/${member.slug}"`));
    } else if (path === '/robots.txt') {
      if (policy === 'preview') assert.equal(body, 'User-agent: *\nDisallow: /\n');
      else assert.match(body, /User-agent: \*\nAllow: \//);
    } else if (policy === 'preview') assert.doesNotMatch(body, /<loc>/);
    else if (path === '/sitemap-pages.xml') {
      assert.equal((body.match(/<url>/g) ?? []).length, 14);
      for (const member of boardMembers) assert.ok(body.includes(`${origin}/members/${member.slug}`));
    }
    results.push({ policy, path, status: response.status });
  }
  for (const path of ['/members/alvaro-torres', '/members/not-a-board-member']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404);
    assert.doesNotMatch(await response.text(), /rel="canonical"|application\/ld\+json/);
    results.push({ policy, path, status: response.status });
  }
}

await writeFile(new URL('./http-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log(`Passed ${results.length} profile, contact, project, metadata, image and discovery checks.`);
