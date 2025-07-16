// app/api/tailor-cv/route.ts
import { MongoClient, ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import nlp from 'compromise';

// Types for better type safety
interface JobDocument {
  _id: ObjectId | string;
  title?: string;
  description: string;
  required_skills?: string[];
  company?: string;
  created_at?: Date;
}

interface UserDocument {
  _id: ObjectId | string;
  user_id: string;
  cv: {
    skills?: string[];
    suggested_skills?: string[];
    experience?: string;
    education?: string;
    summary?: string;
    last_tailored?: Date;
    last_tailored_job_id?: string;
  };
  profile?: {
    name?: string;
    email?: string;
  };
}

interface TailorCVRequest {
  userId: string;
  jobId: string;
}

interface TailorCVResponse {
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: {
    skillsToAdd: string[];
    skillsToEmphasize: string[];
    suggestedImprovements: string[];
  };
  matchPercentage: number;
}

// MongoDB connection with connection pooling
let client: MongoClient | null = null;

const getMongoClient = async (): Promise<MongoClient> => {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
  }
  return client;
};

// Utility functions for skill extraction and matching
const validateObjectId = (id: string): boolean => {
  return ObjectId.isValid(id);
};

const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

const extractSkillsFromText = (text: string): string[] => {
  if (!text) return [];
  
  // Use NLP to extract skills and normalize them
  const doc = nlp(text);
  const topics = doc.topics().out('array');
  const nouns = doc.nouns().out('array');
  
  // Combine and clean skills
  const skills = [...new Set([...topics, ...nouns])]
    .filter(skill => skill.length > 2) // Filter out very short words
    .map(skill => skill.toLowerCase().trim())
    .filter(Boolean);
    
  return skills;
};

const calculateSkillMatch = (userSkills: string[], jobSkills: string[]): {
  matched: string[];
  missing: string[];
  percentage: number;
} => {
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());
  
  const matched = normalizedJobSkills.filter(jobSkill =>
    normalizedUserSkills.some(userSkill => 
      userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
    )
  );
  
  const missing = normalizedJobSkills.filter(jobSkill =>
    !normalizedUserSkills.some(userSkill => 
      userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
    )
  );
  
  const percentage = normalizedJobSkills.length > 0 
    ? Math.round((matched.length / normalizedJobSkills.length) * 100)
    : 0;
  
  return { matched, missing, percentage };
};

const generateRecommendations = (
  userSkills: string[],
  jobSkills: string[],
  missingSkills: string[]
): {
  skillsToAdd: string[];
  skillsToEmphasize: string[];
  suggestedImprovements: string[];
} => {
  const skillsToAdd = missingSkills.slice(0, 5); // Top 5 missing skills
  const skillsToEmphasize = userSkills.filter(skill =>
    jobSkills.some(jobSkill => 
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  ).slice(0, 3);
  
  const improvements = [];
  if (missingSkills.length > 0) {
    improvements.push(`Consider adding ${missingSkills.length} missing skills to your CV`);
  }
  if (skillsToEmphasize.length > 0) {
    improvements.push(`Emphasize your experience with ${skillsToEmphasize.join(', ')}`);
  }
  if (userSkills.length < 5) {
    improvements.push('Consider adding more relevant skills to strengthen your profile');
  }
  
  return {
    skillsToAdd,
    skillsToEmphasize,
    suggestedImprovements: improvements
  };
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  let mongoClient: MongoClient | null = null;
  
  try {
    // Validate request body
    const body = await request.json() as TailorCVRequest;
    const { userId, jobId } = body;

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and jobId' },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const sanitizedUserId = sanitizeString(userId);
    const sanitizedJobId = sanitizeString(jobId);

    if (!validateObjectId(sanitizedJobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    mongoClient = await getMongoClient();
    const db = mongoClient.db('job_tool');

    // Fetch job and user data in parallel for better performance
    const [job, user] = await Promise.all([
      db.collection<JobDocument>('jobs').findOne({ 
        _id: new ObjectId(sanitizedJobId)
      }),
      db.collection<UserDocument>('users').findOne({ user_id: sanitizedUserId })
    ]);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract skills from job description and user CV
    const jobSkillsFromDescription = extractSkillsFromText(job.description);
    const jobRequiredSkills = job.required_skills || [];
    const allJobSkills = [...new Set([...jobSkillsFromDescription, ...jobRequiredSkills])];
    
    const userSkills = user.cv?.skills || [];
    const userExperienceSkills = extractSkillsFromText(user.cv?.experience || '');
    const allUserSkills = [...new Set([...userSkills, ...userExperienceSkills])];

    // Calculate skill matching
    const { matched, missing, percentage } = calculateSkillMatch(allUserSkills, allJobSkills);
    
    // Generate recommendations
    const recommendations = generateRecommendations(allUserSkills, allJobSkills, missing);

    // Update user CV with suggestions (only if there are new suggestions)
    if (missing.length > 0) {
      await db.collection('users').updateOne(
        { user_id: sanitizedUserId },
        { 
          $set: { 
            'cv.suggested_skills': missing,
            'cv.last_tailored': new Date(),
            'cv.last_tailored_job_id': sanitizedJobId
          }
        }
      );
    }

    const response: TailorCVResponse = {
      matchedSkills: matched,
      missingSkills: missing,
      recommendations,
      matchPercentage: percentage
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache', // Don't cache personalized data
      }
    });

  } catch (error) {
    console.error('Tailor CV error:', error);
    
    // Return appropriate error based on error type
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to tailor CV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    // Note: Don't close the client as we're using connection pooling
    // The client will be reused for subsequent requests
  }
}

// GET endpoint to retrieve tailored CV suggestions
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const mongoClient = await getMongoClient();
    const db = mongoClient.db('job_tool');

    // Fetch user data
    const user = await db.collection<UserDocument>('users').findOne({ user_id: userId });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If jobId is provided, get specific job tailoring info
    if (jobId) {
      const job = await db.collection<JobDocument>('jobs').findOne({ 
        _id: typeof jobId === 'string' ? new ObjectId(jobId) : jobId 
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      // Return current tailoring status for this job
      const isCurrentlyTailored = user.cv?.last_tailored_job_id === jobId;
      
      return NextResponse.json({
        userId,
        jobId,
        suggestedSkills: user.cv?.suggested_skills || [],
        lastTailored: user.cv?.last_tailored || null,
        isCurrentlyTailored,
        jobTitle: job.title || 'Unknown Position'
      });
    }

    // Return general CV suggestions
    return NextResponse.json({
      userId,
      suggestedSkills: user.cv?.suggested_skills || [],
      lastTailored: user.cv?.last_tailored || null,
      lastTailoredJobId: user.cv?.last_tailored_job_id || null
    });

  } catch (error) {
    console.error('Get tailored CV error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve CV data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Export runtime configuration for better performance
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';