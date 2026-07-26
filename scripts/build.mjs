import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllLabels, fetchPostsByLabels } from './blogger.mjs';
import { buildSections } from './steps-data.mjs';
import { layout, homePage, sectionPage, readingPage, sectionAllPage, stepworkPage, stepworkLinkRow, withSlugs, fmtDate, esc } from './render.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');

function write(rel, html) {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// Light cleanup of Blogger post HTML: https links, lazy images.
function cleanBlogger(html) {
  return html
    .replaceAll('http://first164.blogspot', 'https://first164.blogspot')
    .replace(/<img /g, '<img loading="lazy" ');
}

// ---------------------------------------------------------------- blogger
const allLabels = await fetchAllLabels();
const { steps, extras, all } = buildSections(allLabels);
const wanted = [...new Set(all.flatMap(s => s.labels))];
console.log(`fetching ${wanted.length} labels from Blogger…`);
const posts = await fetchPostsByLabels(wanted);
console.log(`fetched ${posts.size} distinct posts`);

for (const section of all) {
  const labelSet = new Set(section.labels);
  section.posts = withSlugs([...posts.values()]
    .filter(p => p.labels.some(l => labelSet.has(l)))
    .sort((a, b) => b.published.localeCompare(a.published))
    .map(p => ({ ...p, html: cleanBlogger(p.html) })));
  console.log(`  ${section.title}: ${section.posts.length} readings (${section.labels.join(' + ')})`);
}

// --------------------------------------------------------------- stepwork
const stepwork = JSON.parse(fs.readFileSync(path.join(root, 'content/stepwork/posts.json')));
const bySlug = new Map(stepwork.map(p => [p.slug, p]));
const INDEX_SLUG = 'steps';
const hrefFor = slug => slug === INDEX_SLUG ? '/step-work/' : `/step-work/${slug}/`;

const EMBED_RE = /<figure class="wp-block-embed[\s\S]*?<a href="https?:\/\/(?:www\.)?1st164steps\.com\/([^/"]+)\/?"[\s\S]*?<\/figure>/g;

// parent map for breadcrumbs: first indexer wins, top index preferred
const parentOf = new Map();
for (const p of stepwork) {
  for (const [, slug] of p.html.matchAll(EMBED_RE)) {
    if (!parentOf.has(slug) || parentOf.get(slug) === INDEX_SLUG) parentOf.set(slug, p.slug);
  }
}

function transformStepwork(html) {
  let out = html.replace(EMBED_RE, (m, slug) => {
    const target = bySlug.get(slug);
    return target ? stepworkLinkRow(hrefFor(slug), target.title) : '';
  });
  // rewrite remaining internal links (plain anchors, tag archives)
  out = out.replace(/href="https?:\/\/(?:www\.)?1st164steps\.com\/([^"]*)"/g, (m, rest) => {
    const slug = rest.replace(/\/$/, '');
    if (bySlug.has(slug)) return `href="${hrefFor(slug)}"`;
    if (slug.startsWith('tag/')) return `href="/${slug.slice(4).replace('step-1-al-anon', 'step-1-al-anon')}/"`;
    return `href="/"`;
  });
  // strip WP-internal iframes/scripts; leave external embeds (YouTube) alone
  out = out.replace(/<iframe[^>]*(?:1st164steps\.com|wp-embedded-content)[\s\S]*?<\/iframe>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '');
  return out;
}

// ------------------------------------------------------------------ pages
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, 'static'), dist, { recursive: true });

const resources = JSON.parse(fs.readFileSync(path.join(root, 'content/resources/posts.json')));
const updated = fmtDate(new Date().toISOString());
write('index.html', homePage({ steps, extras, stepworkCount: stepwork.length, resources, updated }));

const ordered = [...steps, ...extras];
ordered.forEach((section, i) => {
  write(`${section.slug}/index.html`, sectionPage({
    section, prev: ordered[i - 1], next: ordered[i + 1],
  }));
  write(`${section.slug}/all/index.html`, sectionAllPage({ section }));
  section.posts.forEach((post, index) => {
    write(`${section.slug}/${post.anchor}/index.html`,
      readingPage({ section, post, index }));
  });
});

// Resources: WP-only essays preserved verbatim.
for (const post of resources) {
  write(`${post.slug}/index.html`, stepworkPage({
    post, body: post.html, isIndex: false, crumbs: [],
    eyebrow: 'Resources', pagePath: `/${post.slug}/`,
  }));
}

for (const post of stepwork) {
  const isIndex = post.slug === INDEX_SLUG;
  const crumbs = [];
  if (!isIndex) {
    crumbs.push({ href: '/step-work/', label: 'Step Work' });
    const parent = parentOf.get(post.slug);
    if (parent && parent !== INDEX_SLUG && parent !== post.slug) {
      crumbs.push({ href: hrefFor(parent), label: bySlug.get(parent).title.replace(/<[^>]+>/g, '') });
    }
  }
  write(isIndex ? 'step-work/index.html' : `step-work/${post.slug}/index.html`,
    stepworkPage({ post, body: transformStepwork(post.html), isIndex, crumbs }));
}

write('404.html', layout({
  title: 'Not found — 1st 164 Steps',
  description: 'Page not found.',
  body: `<header class="section-head"><p class="eyebrow">404</p><h1 class="page-title">Not found</h1><p class="section-meta">That page isn&rsquo;t here. Start from the <a href="/">contents</a>.</p></header>`,
  path: '/404',
}));

const urls = ['/',
  ...ordered.flatMap(s => [`/${s.slug}/`, `/${s.slug}/all/`,
    ...s.posts.map(p => `/${s.slug}/${p.anchor}/`)]),
  '/step-work/',
  ...stepwork.filter(p => p.slug !== INDEX_SLUG).map(p => `/step-work/${p.slug}/`),
  ...resources.map(p => `/${p.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>https://www.1st164steps.com${esc(u)}</loc></url>`).join('\n')}
</urlset>`);

console.log(`built ${urls.length + 2} pages into dist/`);
