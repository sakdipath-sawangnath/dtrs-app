"use client";
import { useState } from "react";
import JobsList, { type ContractScopeTab } from "@/components/JobsList";

export default function InProgressPage() {
  const [tab, setTab] = useState<ContractScopeTab>("contract");

  return (
    <JobsList
      statusFilter="IN_PROGRESS"
      showContractTabs
      contractTab={tab}
      onContractTabChange={setTab}
      noCard={true}
    />
  );
}
