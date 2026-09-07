"use client";

import { useState } from "react";
import JobsList, { type ContractScopeTab } from "@/components/JobsList";

export default function MyJobsPage() {
  const [tab, setTab] = useState<ContractScopeTab>("contract");

  return (
    <JobsList
      assignedToMe
      showContractTabs
      contractTab={tab}
      onContractTabChange={setTab}
      noCard={true}
    />
  );
}
