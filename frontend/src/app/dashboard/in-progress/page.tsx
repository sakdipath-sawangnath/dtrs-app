"use client";
import { useState } from "react";
import JobsList from "@/components/JobsList";

export default function InProgressPage() {
  const [tab, setTab] = useState<"contract" | "out">("contract");

  return (
    <JobsList
      statusFilter="IN_PROGRESS"
      showContractTabs
      showOutOfContract={tab === "out"}
      onShowOutOfContractChange={(v) => setTab(v ? "out" : "contract")}
      noCard={true}
    />
  );
}
