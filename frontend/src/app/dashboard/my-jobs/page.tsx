"use client";

import { useState } from "react";
import JobsList from "@/components/JobsList";

type TabId = "contract" | "out";

export default function MyJobsPage() {
  const [tab, setTab] = useState<TabId>("contract");

  return (
    <JobsList
      assignedToMe
      showContractTabs
      showOutOfContract={tab === "out"}
      onShowOutOfContractChange={(v) => setTab(v ? "out" : "contract")}
      noCard={true}
    />
  );
}

