// Fetch step-related posts from the Blogger JSON feed.
const FEED = 'https://first164.blogspot.com/feeds/posts';
const PAGE = 150;

async function getJSON(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise(r => setTimeout(r, 1500 * i));
    }
  }
}

export async function fetchAllLabels() {
  const meta = await getJSON(`${FEED}/summary?alt=json&max-results=0`);
  return (meta.feed.category ?? []).map(c => c.term);
}

function toPost(entry) {
  const id = entry.id.$t.match(/post-(\d+)$/)?.[1] ?? entry.id.$t;
  return {
    id,
    title: entry.title.$t.trim(),
    published: entry.published.$t,
    url: entry.link.find(l => l.rel === 'alternate')?.href ?? '',
    labels: (entry.category ?? []).map(c => c.term),
    html: entry.content?.$t ?? '',
  };
}

// Returns Map<id, post> for every post carrying any of the given labels.
export async function fetchPostsByLabels(labels) {
  const posts = new Map();
  for (const label of labels) {
    const enc = encodeURIComponent(label);
    for (let start = 1; ; start += PAGE) {
      const data = await getJSON(
        `${FEED}/default/-/${enc}?alt=json&start-index=${start}&max-results=${PAGE}`);
      const entries = data.feed.entry ?? [];
      for (const e of entries) {
        const p = toPost(e);
        if (!posts.has(p.id)) posts.set(p.id, p);
      }
      if (entries.length < PAGE) break;
    }
  }
  return posts;
}
