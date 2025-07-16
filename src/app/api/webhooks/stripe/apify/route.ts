// app/api/webhooks/apify/route.ts
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

const client = new MongoClient(process.env.MONGODB_URI!);

export async function POST(request: Request) {
  try {
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