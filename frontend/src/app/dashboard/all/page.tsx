"use client";
import { useState } from "react";
import JobsList from "@/components/JobsList";

export default function AllJobsPage() {
  const [tab, setTab] = useState<"contract" | "out">("contract");

  return (
    <JobsList
      showContractTabs
      showOutOfContract={tab === "out"}
      onShowOutOfContractChange={(v) => setTab(v ? "out" : "contract")}
      noCard={true}
    />
  );
}
