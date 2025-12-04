// app/api/webhooks/apify/route.ts
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

let mongoClient: MongoClient | null = null;

function getMongoClient(): MongoClient {
  if (!mongoClient) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not configured');
    }
    mongoClient = new MongoClient(uri);
  }
  return mongoClient;
}

export async function POST(request: Request) {
  try {
    let client;
    try {
      client = getMongoClient();
    } catch (error: any) {
      console.error('MongoDB not configured:', error.message);
      return NextResponse.json({ 
        error: 'Job webhook feature not available' 
      }, { status: 503 });
    }

    const data = await request.json();
    const jobs = data.items.map((item: any) => ({
      title: item.title,
      company: item.company,
      location: item.location,
      description: item.description,
      skills: item.skills || [],
      salary: item.salary || null,
      source: 'LinkedIn',
      created_at: new Date()
    }));

    await client.connect();
    const db = client.db('job_tool');
    await db.collection('jobs').insertMany(jobs);
    await client.close();

    return NextResponse.json({ status: 'Jobs stored' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}