import { Profile } from '../types';

// Flatten profile for CSV/Excel export (importable fields only)
export const flattenProfileForExport = (profile: Profile) => {
  return {
    // Importable fields only
    email: profile.email || '',
    full_name: profile.full_name || '',
    // Team JSONB
    team: profile.team ? JSON.stringify(profile.team) : '',
    // Customer JSONB
    customer: profile.customer ? JSON.stringify(profile.customer) : '',
  };
};

// Convert flattened data back to Profile structure for import
export const unflattenProfileForImport = (row: any) => {
  const profile: any = {
    email: row.email || null,
    full_name: row.full_name || null,
  };

  // Parse team JSONB if provided
  if (row.team) {
    try {
      profile.team = typeof row.team === 'string' ? JSON.parse(row.team) : row.team;
    } catch (e) {
      console.error('Invalid team JSON:', row.team);
    }
  }

  // Parse customer JSONB if provided
  if (row.customer) {
    try {
      profile.customer = typeof row.customer === 'string' ? JSON.parse(row.customer) : row.customer;
    } catch (e) {
      console.error('Invalid customer JSON:', row.customer);
    }
  }

  return profile;
};

// Helper to parse boolean values from strings
const parseBool = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return false;
};

// Convert profiles to CSV
export const profilesToCSV = (profiles: Profile[]): string => {
  if (profiles.length === 0) return '';
  
  const flattened = profiles.map(flattenProfileForExport);
  const headers = Object.keys(flattened[0]);
  
  const csvRows = [
    headers.join(','),
    ...flattened.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escape commas and quotes
        const stringValue = String(value === null || value === undefined ? '' : value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
};

// Parse CSV to profiles
export const csvToProfiles = (csvText: string): any[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const profiles = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    profiles.push(unflattenProfileForImport(row));
  }
  
  return profiles;
};

// Parse CSV line handling quoted values
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Convert profiles to JSON
export const profilesToJSON = (profiles: Profile[]): string => {
  return JSON.stringify(profiles.map(flattenProfileForExport), null, 2);
};

// Parse JSON to profiles
export const jsonToProfiles = (jsonText: string): any[] => {
  try {
    const data = JSON.parse(jsonText);
    const array = Array.isArray(data) ? data : [data];
    return array.map(unflattenProfileForImport);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
};

// Generate example template data
export const generateTemplateData = () => {
  return {
    email: '',
    full_name: '',
    team: JSON.stringify({
      bio: '',
      image: '',
      skills: [],
      education: '',
      job_title: '',
      pseudonym: null,
      department: '',
      github_url: null,
      description: '',
      is_featured: false,
      twitter_url: null,
      achievements: [],
      linkedin_url: null,
      display_order: 0,
      portfolio_url: null,
      certifications: [],
      is_team_member: false,
      experience_years: null,
      assigned_sections: [],
      years_of_experience: null,
    }),
    customer: JSON.stringify({
      image: null,
      rating: 5,
      company: '',
      job_title: '',
      pseudonym: null,
      description: '',
      is_customer: false,
      is_featured: false,
      company_logo: null,
      linkedin_url: null,
      project_type: '',
      display_order: 0,
      testimonial_date: null,
      testimonial_text: '',
      assigned_sections: [],
    }),
  };
};

// Generate field explanations for template
export const fieldExplanations = `
IMPORT TEMPLATE GUIDE (JSONB Format - CSV & JSON)
=================================================

ALLOWED FIELDS:
- email: Email address (required) - Used to match existing accounts
- full_name: Full name of the person (optional)
- team: JSONB object for team member data (optional)
- customer: JSONB object for customer/testimonial data (optional)

TEAM JSONB FIELDS:
- bio: Biography text
- image: URL to profile image
- skills: Array of skills ["skill1", "skill2"]
- education: Education background
- job_title: Job title
- pseudonym: Display name (null if not used)
- department: Department name
- github_url: GitHub profile URL (null if not used)
- description: Short description
- is_featured: true/false - Show on featured sections
- twitter_url: Twitter profile URL (null if not used)
- achievements: Array of achievements ["achievement1", "achievement2"]
- linkedin_url: LinkedIn profile URL (null if not used)
- display_order: Numeric sort order (0 = first)
- portfolio_url: Portfolio website URL (null if not used)
- certifications: Array of certifications ["cert1", "cert2"]
- is_team_member: true/false - Enable team member features
- experience_years: Number of years experience (null if not specified)
- assigned_sections: Array of section names ["section1", "section2"]
- years_of_experience: Alternative years field (null if not used)

CUSTOMER JSONB FIELDS:
- image: URL to customer image (null if not used)
- rating: Numeric rating 1-5 (default: 5)
- company: Company name
- job_title: Job title at company
- pseudonym: Display name (null if not used)
- description: Description text
- is_customer: true/false - Enable customer/testimonial features
- is_featured: true/false - Show on featured sections
- company_logo: URL to company logo (null if not used)
- linkedin_url: LinkedIn profile URL (null if not used)
- project_type: Type of project
- display_order: Numeric sort order (0 = first)
- testimonial_date: Date in YYYY-MM-DD format (null if not used)
- testimonial_text: Testimonial content
- assigned_sections: Array of section names ["section1", "section2"]

NOTES:
- New accounts will be created with auth user + profile
- Existing accounts (matched by email) will be updated
- JSONB fields must be valid JSON strings
- For CSV: Escape quotes in JSON with double quotes ("")
- Arrays: Use ["item1", "item2"] format
- Booleans: true or false (lowercase, no quotes)
- Numbers: No quotes (e.g., "rating": 5, "experience_years": 10)
- null values: Use null (lowercase, no quotes) for empty URLs or optional fields
- Empty strings: Use "" for text fields that should be blank
`;
