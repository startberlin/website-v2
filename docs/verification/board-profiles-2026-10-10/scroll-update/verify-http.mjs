import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { boardMembers } from '../../../../src/lib/board-members.ts';

const base = 'http://127.0.0.1:4352';
const origin = 'https://www.start-berlin.com';
const results = [];

for (const member of boardMembers) {
  const path = `/members/${member.slug}`;
  for (const suffix of ['', '?utm_source=scroll-check']) {
    const response = await fetch(base + path + suffix);
    assert.equal(response.status, 200);
    const html = await response.text();
    const profile = html.match(/<article\b[\s\S]*?<\/article>/)[0];
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)[1];
    assert.equal(canonical, origin + path);
    assert.match(html, /name="robots" content="noindex/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.equal((html.match(/<main\b/g) ?? []).length, 1);
    assert.doesNotMatch(profile, /<nav\b|profile__breadcrumbs|profile__return|Back to the (board|members)|Projects (&amp;|and) interests/);
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
      results.push({ path: src, type: 'portrait', status: imageResponse.status });
    }
    results.push({ path: path + suffix, status: response.status, canonical, schema: 'AboutPage without breadcrumbs', localNavigation: false });
  }
}

for (const path of ['/members', '/robots.txt', '/sitemap.xml', '/sitemap-pages.xml']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200);
  const body = await response.text();
  if (path === '/members') {
    for (const member of boardMembers) assert.ok(body.includes(`href="/members/${member.slug}"`));
  } else if (path === '/robots.txt') assert.equal(body, 'User-agent: *\nDisallow: /\n');
  else assert.doesNotMatch(body, /<loc>/);
  results.push({ path, status: response.status });
}
for (const path of ['/members/alvaro-torres', '/members/not-a-board-member']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 404);
  assert.doesNotMatch(await response.text(), /rel="canonical"|application\/ld\+json/);
  results.push({ path, status: response.status });
}

await writeFile(new URL('./http-results.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log(`Passed ${results.length} profile, contact, project, metadata, image and discovery checks.`);
