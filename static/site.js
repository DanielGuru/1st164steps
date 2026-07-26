// Flip readings with arrow keys.
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const go = sel => { const a = document.querySelector(sel); if (a) location.href = a.href; };
  if (e.key === 'ArrowRight') go('a[rel="next"]');
  if (e.key === 'ArrowLeft') go('a[rel="prev"]');
});

// Filter contents lists by title.
const filter = document.querySelector('.jump-filter');
if (filter) {
  const rows = [...document.querySelectorAll('.toc-row')];
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const row of rows) {
      row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
    }
  });
}
