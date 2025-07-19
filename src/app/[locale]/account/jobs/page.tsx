// app/account/jobs/page.tsx
import Link from 'next/link';

async function fetchJobs() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs`, {
    cache: 'no-store', // Ensure fresh data
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export default async function JobsPage() {
  const { jobs } = await fetchJobs();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Job Listings</h1>
      <ul className="space-y-4">
        {jobs.map((job: any) => (
          <li key={job._id} className="border p-4 rounded">
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p className="text-gray-600">{job.company} - {job.location}</p>
            <p className="mt-2">{job.description.substring(0, 200)}...</p>
            <p className="text-sm text-gray-500">Source: {job.source}</p>
            <Link href={`/account/jobs/${job._id}`} className="text-blue-500 hover:underline">
              View Details
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}