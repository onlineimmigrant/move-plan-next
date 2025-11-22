// lib/postUtils.ts
export const SECTION_ROUTES: { [key: string]: string } = {
  'SQE2': '/sqe-2',
  'Course': '/course',
  'Criminal Litigation': '/sqe-2/topic',
  'Business organisations, rules and procedures': '/sqe-2/topic',
  'Wills and Intestacy, Probate Administration and Practice': '/sqe-2/topic',
  'Property Practice': '/sqe-2/topic',
  'Dispute Resolution': '/sqe-2/topic',
  'Practice Area': '/sqe-2/practice-area',
  'Legal Skills Assessments': '/sqe-2/legal-skills-assessments',
};

// Allow numeric section IDs mapping if needed
const NUMERIC_SECTION_MAP: { [key: number]: string } = {
  // Example: 39: '/sqe-2/practice-area'
};

function normalizeSectionId(sectionId: unknown): string | null {
  if (sectionId === null || sectionId === undefined) return null;
  if (typeof sectionId === 'number') {
    return NUMERIC_SECTION_MAP[sectionId] || null;
  }
  if (typeof sectionId === 'string') {
    return SECTION_ROUTES[sectionId] || null;
  }
  return null;
}

export const getPostUrl = (post: { section_id?: string | number | null; slug: string }): string => {
  const { section_id, slug } = post;
  const mapped = normalizeSectionId(section_id);
  if (mapped) return `${mapped}/${slug}`;
  if (process.env.NODE_ENV === 'development' && section_id) {
    // Lightweight warning for unmatched section IDs
    console.warn('[getPostUrl] Unmapped section_id:', section_id, 'slug:', slug);
  }
  return `/${slug}`;
};