"use client";
import JobsList from '@/components/JobsList';

export default function OutOfContractPage() {
  // ให้โครงสร้างเหมือน pending (สถานะ PENDING เท่านั้น)
  return <JobsList showOutOfContract={true} statusFilter="PENDING" noCard={true} />;
}
