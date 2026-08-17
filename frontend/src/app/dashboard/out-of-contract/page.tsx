"use client";
import JobsList from '@/components/JobsList';

export default function OutOfContractPage() {
  return (
    <JobsList
      showOutOfContract={true}
      statusAllowlist={['PENDING', 'RESOLVED']}
      noCard={true}
    />
  );
}
