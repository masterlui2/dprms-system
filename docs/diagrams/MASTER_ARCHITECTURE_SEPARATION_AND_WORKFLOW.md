# DOST DPRMS - Master Three-Tier Architecture & Workflow Specification

**System:** DOST Project and Resource Management System (DPRMS)  
**Target Agency:** Department of Science and Technology (DOST) - Region XI / Provincial Science and Technology Offices (PSTO)  

---

## 1. Executive Summary & Three-Tier System Architecture

The DPRMS architecture establishes a clear operational separation between candidate application intake, master compliance records, and active monitored projects:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DPRMS OPERATIONAL ARCHITECTURE                                 │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────┤
│ TIER 1: APPLICATIONS MODULE   │ TIER 2: DOCUMENT CHECKLIST      │ TIER 3: MONITORED PROJECTS    │
│ (Initial Intake & Assessment) │ (Master Full Lifecycle Archive) │ (Active & Legacy Operations)  │
├───────────────────────────────┼─────────────────────────────────┼───────────────────────────────┤
│ • Lightweight candidate intake│ • Complete compliance archive   │ • Live & legacy active projects│
│ • Focuses ONLY on SET 1       │ • Full view of SET 1, 2, and 3  │ • Direct intake of offline /  │
│   (SETUP) or Stage 01 (GIA)   │ • Full view of Stages 01 to 05  │   previous ongoing projects   │
│ • Initial feasibility vetting │ • Connects proponent uploads to │ • Financial Budgets & LIB     │
│ • Internal assessment notes   │   verified compliance records   │ • Quarterly Metric Reports    │
│ • Pre-TNA qualification gate  │ • Permanent QMS audit archive   │ • Repayment / Refund Ledger   │
└───────────────────────────────┴─────────────────────────────────┴───────────────────────────────┘
```

---

## 2. Detailed Breakdown of the Three Tiers

### Tier 1: Applications Module (Lightweight Intake & Initial Assessment)
* **Scope:** Dedicated purely to initial applicant intake and feasibility screening.
* **Document Scope:**
  * **SETUP:** Focuses strictly on **SET 1** (Prior to TNA — Permits, Initial Financials, 3 Equipment Quotes, LOI).
  * **GIA:** Focuses strictly on **Stage 01** (Proposal Submission & Evaluation — DOST Form 4.A/4.B, Workplan, Initial LIB).
* **Internal Documents:** Officers upload initial screening notes, PSTO intake diagnosis sheets, and feasibility memos.
* **Outcome:** Determines whether a candidate application qualifies for endorsement and approval.

---

### Tier 3: Monitored Projects Module (Active, Legacy & Offline Project Operations)
* **Scope:** Dedicated to all live operational projects being monitored by DOST.
* **Intake Sources:**
  1. **Approved Online Applications:** Promoted automatically upon Provincial Director approval.
  2. **Offline / Walk-In Active Projects:** Added directly by officers from personal, walk-in, or historical records without re-running intake pipelines.
  3. **Legacy Ongoing Projects:** Pre-existing projects already executing or undergoing refund amortizations.
* **Operational Scope:**
  * Project Budgets, Line-Item Budget (LIB), and Grant Tranches.
  * Quarterly Metric Tracking (Production Volume, Gross Revenue, Employment Generated).
  * SETUP Repayment / Refund Amortization Schedules & Payment Receipts.
  * Equipment QR Code Tracking & Periodic Field Inspections.

---

### Tier 2: Document Checklist Module (Master Full-Lifecycle Repository)
* **Scope:** The comprehensive, master compliance archive for monitored and active projects.
* **Full Lifecycle Scope:**
  * **SETUP (Complete SET 1 to SET 3):**
    * **SET 1:** Pre-TNA Eligibility (Permits, Quotes, Financial Statements).
    * **SET 2:** Proposal Dossier (Signatory Bio-Data, IDs, Omnibus Affidavit, TNA Form 4).
    * **SET 3:** Post-Approval Deliverables (Notarized MOA, Release of Funds, Notice of Approval, Risk Register).
  * **GIA (Complete Stage 01 to Stage 05):**
    * **Stage 01:** Proposal Submission & Evaluation.
    * **Stage 02:** Releasing of Project Funds (MOA, CFA, Bonds).
    * **Stage 03:** Project Monitoring Reports (DOST Forms 8, 9, 10, 11, 12, FAR 6, JEV).
    * **Stage 04:** Extension, Realignment & Reprogramming.
    * **Stage 05:** Project Liquidation, Terminal Reports & Property Transfer (PAR/ICS).
* **Role:** Connects all uploaded files (from initial intake, offline submissions, and ongoing deliverables) into one complete, verifiable audit trail.

---

## 3. End-to-End Enterprise Lifecycle Flow

```mermaid
flowchart TD
    %% TIER 1: INTAKE
    subgraph TIER_1["TIER 1: APPLICATIONS (INITIAL ASSESSMENT ONLY)"]
        A[New Applicant Submits Online / Walk-in] --> B[Applications Queue: Status 'In-Process']
        B --> C[Assess SET 1 (SETUP) or Stage 01 (GIA) only]
        C --> D[Officers attach Internal Assessment Notes]
        D --> E{Approved by Director?}
    end

    %% TIER 3: MONITORED PROJECTS SOURCES
    subgraph TIER_3["TIER 3: MONITORED PROJECTS (ACTIVE & LEGACY)"]
        E -- Yes --> F[1. Newly Approved Project]
        G[2. Direct Offline / In-Person Project Intake] --> H[Monitored Projects Hub]
        I[3. Pre-existing Legacy Ongoing Project] --> H
        F --> H
        
        H --> J[Manage Project Budget & Approved LIB]
        H --> K[Track Quarterly Metrics: Products, Costs, Employment]
        H --> L[Manage Repayment & Refund Amortization Ledger]
        H --> M[Equipment QR Codes & Field Audits]
    end

    %% TIER 2: MASTER CHECKLIST
    subgraph TIER_2["TIER 2: MASTER DOCUMENT CHECKLIST (FULL LIFECYCLE)"]
        H --> N[Master Checklist for Monitored Project]
        N --> O[SETUP: Full SET 1, SET 2 & SET 3 (1-38 docs)]
        N --> P[GIA: Full Stage 01, 02, 03, 04 & 05 (1-67 docs)]
        O & P --> Q[Unified QMS & COA Audit Compliance Archive]
    end
```

---

## 4. Why This Architecture Makes Complete Sense

1. **Lightweight Candidate Screening (Tier 1):**
   - Applicants only deal with **SET 1 / Stage 01** during initial evaluation, keeping intake fast and simple.
2. **Flexible Monitored Project Ingestion (Tier 3):**
   - Officers can directly add active projects received offline, in person, or from legacy programs without creating fake intake applications.
3. **Master Compliance Integrity (Tier 2):**
   - Once a project is monitored, the Document Checklist provides the **full 360-degree document view (SET 1–3 or Stage 01–05)**, ensuring complete audit compliance under DOST QMS and COA standards.
