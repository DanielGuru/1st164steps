// Section definitions: which Blogger labels feed each section, plus the
// step texts used as epigraphs on the contents page and step pages.

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

export const STEP_TEXTS = [
  'The admission that precedes the Steps: am I done?',
  'We admitted we were powerless over alcohol—that our lives had become unmanageable.',
  'Came to believe that a Power greater than ourselves could restore us to sanity.',
  'Made a decision to turn our will and our lives over to the care of God as we understood Him.',
  'Made a searching and fearless moral inventory of ourselves.',
  'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.',
  'Were entirely ready to have God remove all these defects of character.',
  'Humbly asked Him to remove our shortcomings.',
  'Made a list of all persons we had harmed, and became willing to make amends to them all.',
  'Made direct amends to such people wherever possible, except when to do so would injure them or others.',
  'Continued to take personal inventory and when we were wrong promptly admitted it.',
  'Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.',
  'Having had a spiritual awakening as the result of these steps, we tried to carry this message to alcoholics, and to practice these principles in all our affairs.',
];

// A label belongs to step N when it is exactly "Step <Word>" or extends it
// with a qualifier — "Step Eleven (morning)", "Step Four: Resentment
// Inventory". Matching by prefix keeps new sub-labels flowing in
// automatically. Step One (Al-Anon) is carved out into its own section.
function labelsForStep(n, allLabels) {
  const prefix = `Step ${WORDS[n]}`;
  return allLabels.filter(l => {
    if (l === 'Step One (Al-Anon)') return false;
    if (l === prefix) return true;
    // qualifiers: "Step Eleven (morning)", "Step Four: …", "Step Two Proposition"
    return l.startsWith(`${prefix} `) || l.startsWith(`${prefix}:`);
  }).concat(n === 12 ? allLabels.filter(l => l === 'Step XII') : []);
}

export function buildSections(allLabels) {
  const steps = [];
  for (let n = 0; n <= 12; n++) {
    steps.push({
      slug: n === 0 ? 'step-zero' : `step-${n}`,
      title: n === 0 ? 'Step Zero' : `Step ${WORDS[n]}`,
      short: n === 0 ? 'Step 0' : `Step ${n}`,
      number: n,
      epigraph: STEP_TEXTS[n],
      labels: labelsForStep(n, allLabels),
    });
  }
  const extras = [
    {
      slug: 'step-1-al-anon',
      title: 'Step One (Al-Anon)',
      short: 'Step 1 Al-Anon',
      epigraph: 'We admitted we were powerless over alcohol—that our lives had become unmanageable.',
      labels: allLabels.filter(l => l === 'Step One (Al-Anon)'),
    },
    {
      slug: 'sponsorship',
      title: 'Sponsorship',
      short: 'Sponsorship',
      epigraph: 'Carrying the message one alcoholic to another: choosing, using, and being a sponsor.',
      labels: allLabels.filter(l => l === 'Sponsorship'),
    },
  ];
  return { steps, extras, all: [...steps, ...extras] };
}
