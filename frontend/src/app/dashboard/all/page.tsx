"use client";
import { useState } from "react";
import JobsList, { type ContractScopeTab } from "@/components/JobsList";

export default function AllJobsPage() {
  const [tab, setTab] = useState<ContractScopeTab>("contract");

  return (
    <JobsList
      showContractTabs
      enableAllBreakdownFilters
      contractTab={tab}
      onContractTabChange={setTab}
      noCard={true}
    />
  );
}
