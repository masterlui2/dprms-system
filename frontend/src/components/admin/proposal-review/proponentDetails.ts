import type { ProposalRecord } from "../../../data/admin";

export function getProponentDetails(proposal: ProposalRecord) {
  const slug = proposal.organization
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");

  return {
    contactPerson:
      proposal.program === "GIA" ? "Dr. Elena Marquez" : "Maria Santos",
    designation:
      proposal.program === "GIA"
        ? "Project Leader"
        : "Enterprise Owner / Authorized Representative",
    email: `${slug || "proponent"}@example.com`,
    mobile:
      proposal.program === "GIA" ? "+63 917 204 1188" : "+63 917 520 4412",
    organizationType:
      proposal.program === "GIA"
        ? "Academic / Government Research Institution"
        : "MSME / Cooperative",
    address: "Davao Oriental",
  };
}
