// lib/postUtils.ts
export const SECTION_ROUTES: { [key: string]: string } = {
  'SQE2': '/sqe-2',
'Course':'/course',
  'Criminal Litigation': '/sqe-2/topic',
  'Business organisations, rules and procedures': '/sqe-2/topic',
  'Wills and Intestacy, Probate Administration and Practice': '/sqe-2/topic',
  'Property Practice': '/sqe-2/topic',
  'Dispute Resolution': '/sqe-2/topic',
  'Practice Area': '/sqe-2/practice-area', // Changed from '39'
  'Legal Skills Assessments': '/sqe-2/legal-skills-assessments',
  // '41': '/partner-hub',
  // Add more as needed
};

export const getPostUrl = (post: { section_id?: string | null; slug: string }): string => {
  const { section_id, slug } = post;
  if (section_id !== undefined && section_id !== null && SECTION_ROUTES[section_id]) {
    return `${SECTION_ROUTES[section_id]}/${slug}`;
  }
  return `/${slug}`;
};