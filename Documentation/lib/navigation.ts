export type NavItem = {
  title: string;
  slug: string;
};

export type NavSection = {
  title: string;
  slug: string; // used as folder name in content/
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: "Overview",
    slug: "overview",
    items: [
      { title: "Overview", slug: "index" },
      { title: "What is Rolewise", slug: "what-is-rolewise" },
      { title: "What it is not", slug: "what-it-is-not" },
      { title: "How to use Rolewise", slug: "how-to-use-rolewise" },
      { title: "How to use this manual", slug: "how-to-use-this-manual" },
    ],
  },
  {
    title: "Philosophy",
    slug: "philosophy",
    items: [
      { title: "Product philosophy", slug: "product-philosophy" },
      { title: "Trust over optimism", slug: "trust-over-optimism" },
      { title: "Decision support, not prediction", slug: "decision-support-not-prediction" },
    ],
  },
  {
    title: "Constitution",
    slug: "constitution",
    items: [
      { title: "Overview", slug: "overview" },
      { title: "No Scoring Doctrine", slug: "no-scoring-doctrine" },
      { title: "Evidence principles", slug: "evidence-principles" },
      { title: "Ethical boundaries", slug: "ethical-boundaries" },
      { title: "AI boundaries", slug: "ai-boundaries" },
    ],
  },
  {
    title: "Bible",
    slug: "bible",
    items: [
      { title: "Product vision", slug: "product-vision" },
      { title: "Positioning", slug: "positioning" },
      { title: "Audience", slug: "audience" },
      { title: "Long-term direction", slug: "long-term-direction" },
    ],
  },
  {
    title: "Product",
    slug: "product",
    items: [
      { title: "Applicant Mode", slug: "applicant-mode" },
      { title: "Radar", slug: "radar" },
      { title: "Recruiter Intelligence", slug: "recruiter-intelligence" },
      { title: "Inbox", slug: "inbox" },
      { title: "Weekly Review", slug: "weekly-review" },
      { title: "Snapshots", slug: "snapshots" },
      { title: "Role DNA", slug: "role-dna" },
      { title: "Decision Snapshot", slug: "decision-snapshot" },
      { title: "Role Timeline", slug: "role-timeline" },
    ],
  },
  {
    title: "Rules",
    slug: "rules",
    items: [
      { title: "Applicant Mode rules", slug: "applicant-mode-rules" },
      { title: "Applicant Mode addendum", slug: "applicant-mode-addendum" },
      { title: "Radar rules", slug: "radar-rules" },
      { title: "Decision patterns", slug: "decision-patterns" },
      { title: "Location rules", slug: "location-rules" },
      { title: "Coding expectation rule", slug: "coding-expectation-rule" },
      { title: "Outcome interpretation rules", slug: "outcome-interpretation-rules" },
    ],
  },
  {
    title: "Design System",
    slug: "design-system",
    items: [
      { title: "Brand principles", slug: "brand-principles" },
      { title: "Tone of voice", slug: "tone-of-voice" },
      { title: "Layout rules", slug: "layout-rules" },
      { title: "Typography", slug: "typography" },
      { title: "Colour tokens", slug: "colour-tokens" },
      { title: "Spacing and radius", slug: "spacing-and-radius" },
      { title: "Components", slug: "components" },
      { title: "States and badges", slug: "states-and-badges" },
      { title: "Content patterns", slug: "content-patterns" },
    ],
  },
  {
    title: "Data & Logic",
    slug: "data-logic",
    items: [
      { title: "Overview", slug: "overview" },
      { title: "Inputs", slug: "inputs" },
      { title: "Outputs", slug: "outputs" },
      { title: "Role DNA structure", slug: "role-dna-structure" },
      { title: "Outcome signals", slug: "outcome-signals" },
      { title: "Aggregated patterns", slug: "aggregated-patterns" },
      { title: "Evidence limits", slug: "evidence-limits" },
      { title: "Allowed inferences", slug: "allowed-inferences" },
    ],
  },
  {
    title: "Workflows",
    slug: "workflows",
    items: [
      { title: "Overview", slug: "overview" },
      { title: "Paste JD to analysis", slug: "paste-jd-to-analysis" },
      { title: "Analysis to Apply or Skip", slug: "analysis-to-apply-or-skip" },
      { title: "Applied to interview stages", slug: "applied-to-interview-stages" },
      { title: "Rejection logging", slug: "rejection-logging" },
      { title: "Email paste flow", slug: "email-paste-flow" },
      { title: "Weekly review flow", slug: "weekly-review-flow" },
    ],
  },
  {
    title: "Templates",
    slug: "templates",
    items: [
      { title: "Weekly review template", slug: "weekly-review-template" },
      { title: "Snapshot template", slug: "snapshot-template" },
      { title: "Query library", slug: "query-library" },
      { title: "Recruiter notes template", slug: "recruiter-notes-template" },
      { title: "Application log structure", slug: "application-log-structure" },
    ],
  },
  {
    title: "Changelog",
    slug: "changelog",
    items: [
      { title: "Overview", slug: "index" },
      { title: "Documentation updates", slug: "documentation-updates" },
      { title: "Major product decisions", slug: "major-product-decisions" },
    ],
  },
];

// Flat list of all pages for prev/next navigation
export const allPages: { section: string; title: string; href: string }[] = navigation.flatMap(
  (section) =>
    section.items.map((item) => ({
      section: section.title,
      title: item.title,
      href: `/docs/${section.slug}/${item.slug}`,
    }))
);

export function getPrevNext(currentHref: string) {
  const index = allPages.findIndex((p) => p.href === currentHref);
  return {
    prev: index > 0 ? allPages[index - 1] : null,
    next: index < allPages.length - 1 ? allPages[index + 1] : null,
  };
}
