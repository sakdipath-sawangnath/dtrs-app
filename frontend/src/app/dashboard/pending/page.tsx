"use client";
import JobsList from '@/components/JobsList';

export default function PendingPage() {
  return (
    <JobsList
      statusFilter="PENDING"
      noCard={true}
      enableMoveOutOfContract={false}
    />
  );
}
