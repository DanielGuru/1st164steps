// One-time export of the curated Step Work section from the live WP site.
// Writes content/stepwork/posts.json (all posts, raw rendered HTML) —
// the build resolves embeds into a tree at build time.
const API = 'https://www.1st164steps.com/wp-json/wp/v2';

async function getAll(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}${path}&per_page=100&page=${page}`);
    if (!res.ok) break;
    const batch = await res.json();
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

const cats = await (await fetch(`${API}/categories?slug=step-work`)).json();
const catId = cats[0].id;
const tags = await getAll('/tags?orderby=count&order=desc');
const tagName = Object.fromEntries(tags.map(t => [t.id, t.name]));

const posts = await getAll(`/posts?categories=${catId}&_fields=id,slug,link,title,content,date,tags`);
const data = posts.map(p => ({
  id: p.id,
  slug: p.slug,
  link: p.link,
  title: p.title.rendered,
  date: p.date,
  tags: p.tags.map(t => tagName[t] ?? t),
  html: p.content.rendered,
}));

await import('node:fs').then(fs =>
  fs.writeFileSync(new URL('../content/stepwork/posts.json', import.meta.url),
    JSON.stringify(data, null, 2)));
console.log(`exported ${data.length} step-work posts`);
console.log([...new Set(data.flatMap(p => p.tags))].join(', '));
