import React from 'react';
import { notFound } from 'next/navigation';
import VideoCallClient from './VideoCallClient';

interface VideoCallPageProps {
  params: Promise<{ bookingId: string; locale: string }>;
}

async function fetchBookingData(bookingId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/meetings/bookings/${bookingId}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch booking:', response.status);
      return null;
    }
    
    const data = await response.json();
    // API returns { booking: {...} }
    return data.booking || data;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

export default async function VideoCallPage({ params }: VideoCallPageProps) {
  const { bookingId, locale } = await params;
  
  // Fetch booking data
  const booking = await fetchBookingData(bookingId);
  
  if (!booking) {
    notFound();
  }
  
  return <VideoCallClient booking={booking} bookingId={bookingId} />;
}
