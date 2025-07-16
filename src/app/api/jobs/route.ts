// app/api/jobs/route.ts
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

const client = new MongoClient(process.env.MONGODB_URI!);

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
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