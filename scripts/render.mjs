// HTML templates. Design: the site is set like a book — cover, contents
// with dot leaders, epigraphs, asterism separators between readings.

export const esc = s => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

export const slugify = s => String(s).toLowerCase()
  .replace(/&[a-z#0-9]+;/g, ' ')
  .replace(/[^a-z0-9֐-׿]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'reading';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
export function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function layout({ title, description, body, path }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="canonical" href="https://www.1st164steps.com${path}">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<header class="topbar">
<nav class="topbar-inner">
<a class="wordmark" href="/">1st&thinsp;164&thinsp;Steps</a>
<span class="topbar-links"><a href="/#contents">Contents</a><a href="/step-work/">Step Work</a></span>
</nav>
</header>
<main>
${body}
</main>
<footer class="colophon">
<p>Every reading here is by the author of <a href="https://first164.blogspot.com" rel="author">first164.blogspot.com</a>, gathered and arranged by step. This site adds nothing and changes nothing — it only sorts.</p>
</footer>
<script src="/site.js" defer></script>
</body>
</html>`;
}

const leaderRow = (href, label, aside, sub) => `<li class="toc-row">
<a href="${href}"><span class="toc-title">${label}${sub ? `<span class="toc-sub">${sub}</span>` : ''}</span><span class="leader"></span><span class="toc-count">${aside}</span></a>
</li>`;

export function homePage({ steps, extras, stepworkCount, resources, updated }) {
  const stepRows = steps.map(s => leaderRow(`/${s.slug}/`,
    `<span class="toc-num">${s.number}</span> ${esc(s.title)}`,
    s.posts.length, esc(s.epigraph))).join('\n');
  const extraRows = extras.map(s => leaderRow(`/${s.slug}/`,
    `<span class="toc-num">&sect;</span> ${esc(s.title)}`,
    s.posts.length, esc(s.epigraph))).join('\n');
  const body = `
<div class="cover">
<p class="cover-eyebrow">Step work from the first 164 pages of the Big Book</p>
<h1 class="cover-title">1st&thinsp;164&thinsp;Steps</h1>
<div class="cover-rule" aria-hidden="true"></div>
<p class="cover-sub">Readings from <a href="https://first164.blogspot.com">first164.blogspot.com</a>, arranged by step for reading straight through &mdash; one step, all its readings, in one place.</p>
</div>
<section class="contents" id="contents" aria-label="Contents">
<h2 class="contents-heading">Contents</h2>
<ol class="toc">
${stepRows}
</ol>
<h3 class="contents-heading contents-heading-minor">Alongside the Steps</h3>
<ul class="toc">
${extraRows}
${leaderRow('/step-work/', `<span class="toc-num">&sect;</span> Step Work`, stepworkCount,
  'Worksheets, instructions, and packs for taking the steps with a sponsor. A fixed collection.')}
${resources.map(r => leaderRow(`/${r.slug}/`, `<span class="toc-num">&sect;</span> ${r.title}`, 'essay',
  'A standalone resource.')).join('\n')}
</ul>
<p class="updated-note">Updated ${esc(updated)} &middot; refreshed automatically each week.</p>
</section>`;
  return layout({
    title: '1st 164 Steps — step work based on the first 164 pages of the Big Book of AA',
    description: 'Readings from first164.blogspot.com arranged by each of the Twelve Steps, plus sponsorship and step work materials.',
    body, path: '/',
  });
}

// Assigns each post in a section a unique slug (used as page dir + anchor).
export function withSlugs(posts) {
  const used = new Set();
  return posts.map(p => {
    let a = slugify(p.title);
    while (used.has(a)) a += '-2';
    used.add(a);
    return { ...p, anchor: a };
  });
}

const stepPager = (prev, next) => (prev || next) ? `<nav class="pager" aria-label="Steps">
${prev ? `<a class="pager-prev" href="/${prev.slug}/"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
${next ? `<a class="pager-next" href="/${next.slug}/"><span>Next</span>${esc(next.title)}</a>` : '<span></span>'}
</nav>` : '';

// The step's own contents page: one dot-leader row per reading.
export function sectionPage({ section, prev, next }) {
  const rows = section.posts.map(p => leaderRow(`/${section.slug}/${p.anchor}/`,
    esc(p.title), fmtDate(p.published))).join('\n');
  const body = `
<header class="section-head">
<p class="eyebrow">${esc(section.short)}</p>
<h1 class="epigraph">${esc(section.epigraph)}</h1>
<p class="section-meta">${section.posts.length} readings, newest first &middot; <a href="/${section.slug}/all/">read straight through on one page</a></p>
</header>
<section class="contents" aria-label="Readings">
<input class="jump-filter" type="search" placeholder="Filter by title&hellip;" aria-label="Filter readings by title">
<ol class="toc reading-toc">
${rows}
</ol>
</section>
${stepPager(prev, next)}`;
  return layout({
    title: `${section.title} — 1st 164 Steps`,
    description: `All ${section.posts.length} readings on ${section.title} from first164.blogspot.com.`,
    body, path: `/${section.slug}/`,
  });
}

// One reading per page, flipped like a book. Keyboard arrows via site.js.
export function readingPage({ section, post, index }) {
  const prev = section.posts[index - 1];
  const next = section.posts[index + 1];
  const body = `
<header class="section-head reading-single-head">
<p class="eyebrow"><a href="/${section.slug}/">${esc(section.short)}</a> &middot; ${index + 1} of ${section.posts.length}</p>
<h1 class="page-title">${esc(post.title)}</h1>
<p class="reading-meta"><time datetime="${post.published}">${fmtDate(post.published)}</time> &middot; <a href="${esc(post.url)}" rel="external">original</a></p>
</header>
<div class="post-body">
${post.html}
</div>
<div class="asterism" aria-hidden="true">&#8258;</div>
<nav class="pager flip" aria-label="Readings">
${prev ? `<a class="pager-prev" href="/${section.slug}/${prev.anchor}/" rel="prev"><span>Previous</span>${esc(prev.title)}</a>` : '<span></span>'}
${next ? `<a class="pager-next" href="/${section.slug}/${next.anchor}/" rel="next"><span>Next</span>${esc(next.title)}</a>` : '<span></span>'}
</nav>
<p class="back-to-contents"><a href="/${section.slug}/">&uarr; ${esc(section.short)} contents</a></p>`;
  return layout({
    title: `${post.title} — ${section.title} — 1st 164 Steps`,
    description: `${post.title}: a reading on ${section.title} from first164.blogspot.com.`,
    body, path: `/${section.slug}/${post.anchor}/`,
  });
}

// The read-straight-through page: every reading in sequence.
export function sectionAllPage({ section }) {
  const readings = section.posts.map(p => `
<article class="reading" id="${p.anchor}">
<header class="reading-head">
<h2><a class="anchor-link" href="/${section.slug}/${p.anchor}/">${esc(p.title)}</a></h2>
<p class="reading-meta"><time datetime="${p.published}">${fmtDate(p.published)}</time> &middot; <a href="${esc(p.url)}" rel="external">original</a></p>
</header>
<div class="post-body">
${p.html}
</div>
</article>
<div class="asterism" aria-hidden="true">&#8258;</div>`).join('\n');
  const body = `
<header class="section-head">
<p class="eyebrow"><a href="/${section.slug}/">${esc(section.short)}</a> &middot; straight through</p>
<h1 class="epigraph">${esc(section.epigraph)}</h1>
<p class="section-meta">${section.posts.length} readings on one page, newest first &middot; <a href="/${section.slug}/">or flip one at a time</a></p>
</header>
${readings}
<p class="back-to-contents"><a href="/${section.slug}/">&uarr; ${esc(section.short)} contents</a></p>`;
  return layout({
    title: `${section.title}, straight through — 1st 164 Steps`,
    description: `All ${section.posts.length} readings on ${section.title} on a single page.`,
    body, path: `/${section.slug}/all/`,
  });
}

export function stepworkPage({ post, body, isIndex, crumbs, eyebrow = 'Step Work', pagePath }) {
  const crumbHtml = crumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map(c => `<a href="${c.href}">${esc(c.label)}</a>`).join('<span aria-hidden="true"> / </span>')}</nav>` : '';
  const inner = `
<header class="section-head">
${crumbHtml}
<p class="eyebrow">${esc(eyebrow)}</p>
<h1 class="page-title">${post.title}</h1>
</header>
<div class="post-body stepwork-body">
${body}
</div>`;
  const plainTitle = post.title.replace(/<[^>]+>/g, '');
  return layout({
    title: `${plainTitle} — ${eyebrow} — 1st 164 Steps`,
    description: `${eyebrow}: ${plainTitle}.`,
    body: inner,
    path: pagePath ?? (isIndex ? '/step-work/' : `/step-work/${post.slug}/`),
  });
}

export const stepworkLinkRow = (href, title) =>
  `<div class="toc stepwork-toc"><div class="toc-row"><a href="${href}"><span class="toc-title">${title}</span><span class="leader"></span><span class="toc-count">&rarr;</span></a></div></div>`;
