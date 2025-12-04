// app/api/jobs/route.ts
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

let mongoClient: MongoClient | null = null;

function getMongoClient(): MongoClient {
  if (!mongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined');
    }
    mongoClient = new MongoClient(uri);
  }
  return mongoClient;
}

export async function GET() {
  try {
    let client;
    try {
      client = getMongoClient();
    } catch (error: any) {
      console.error('MongoDB not configured:', error.message);
      return NextResponse.json({ 
        error: 'Job scraping feature not available',
        details: 'MongoDB not configured for this organization'
      }, { status: 503 });
    }
    
    await client.connect();
    const db = client.db('job_tool');
    const jobs = await db
      .collection('jobs')
      .find({})
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
    await client.close();
    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Fetch jobs error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error.message },
      { status: 500 }
    );
  }
}