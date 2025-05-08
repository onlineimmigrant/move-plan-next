// lib/postUtils.ts
export const SECTION_ROUTES: { [key: number]: string } = {
    3: '/sqe-2',
    38: '/sqe-2/topic',
    39: '/sqe-2/practice-area',
    40: '/sqe-2/legal-skills-assessments',
   // 41: '/partner-hub',
    
    // Add more as needed
  };
  
  export const getPostUrl = (post: { section_id?: number | null; slug: string }): string => {
    const { section_id, slug } = post;
    if (section_id !== undefined && section_id !== null && SECTION_ROUTES[section_id]) {
      return `${SECTION_ROUTES[section_id]}/${slug}`;
    }
    return `/${slug}`;
  };