# DOST DPRMS Master Workflow: Application to Monitoring Handover
**Standard Operating Procedure for Proposal Intake, Review, Executive Approval & Handover**  
*Aligned with DOST Davao Region (QMS / ISO Standards) and DPRMS Application Architecture*

---

## 🏛️ Scope & Core Focus

This specification covers the **complete intake-to-handover lifecycle**:
1. **Application Intake:** Dual-channel submission (Online Proponent Portal & PSTO Assisted Walk-in Encoding).
2. **Collaborative Unit Desk Intake:** SSCP Desk (SETUP) and CEST Desk (GIA) concurrent preparation.
3. **Technical Review & Verification:** Focal Officer technical evaluation, document verification, and endorsement.
4. **Executive Decision:** Provincial Director final executive approval / disapproval.
5. **Monitoring Handover:** Automated active project creation and routing to monitoring ledgers.

```mermaid
flowchart LR
    S1["<b>Phase 1</b><br/>Dual Intake<br/>(Online & Assisted)"] --> S2["<b>Phase 2</b><br/>Collaborative Desk<br/>(SSCP & CEST)"]
    S2 --> S3["<b>Phase 3</b><br/>Technical Review<br/>(Focal Officer)"]
    S3 --> S4["<b>Phase 4</b><br/>Final Approval<br/>(Provincial Director)"]
    S4 --> S5["<b>Phase 5</b><br/>Monitoring Handover<br/>(Active Project)"]
```

---

## 👑 Organizational Hierarchy & Role Responsibilities

```
                  ┌───────────────────────────────────────────────────────────┐
                  │          ⚖️ PROVINCIAL DIRECTOR (Executive Level)         │
                  │  • Final Executive Approver (APPROVED / DISAPPROVED)      │
                  │  • Strictly view-only on files; no encoding tasks         │
                  └─────────────────────────────┬─────────────────────────────┘
                                                │ (Receives Endorsed Dossiers)
                  ┌─────────────────────────────▼─────────────────────────────┐
                  │              👑 FOCAL OFFICER (Review & Endorse)          │
                  │  • Assisted intake & data entry (same as staff)           │
                  │  • Scans & uploads (same as staff)                        │
                  │  • Starts Evaluation & verifies documents                 │
                  │  • Triggers revision requests & endorses to Director      │
                  └─────────────────────────────┬─────────────────────────────┘
                                                │ (Collaborative Desk)
                  ┌─────────────────────────────▼─────────────────────────────┐
                  │          📝 PROJECT STAFF (Intake & Uploads)              │
                  │  • Assisted intake & data entry                           │
                  │  • Scans & uploads applicant requirements & internal docs │
                  │  • Pure uploader (no verification or endorsement buttons) │
                  └───────────────────────────────────────────────────────────┘
```

---

## 🗺️ Master Intake-to-Handover Workflow Diagram

```mermaid
flowchart TD
    %% Styling
    classDef intake fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef staff fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef focal fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#5b21b6;
    classDef director fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#15803d;
    classDef handover fill:#f1f5f9,stroke:#475569,stroke-width:2px,stroke-dasharray: 5 5,color:#334155;

    subgraph PHASE_1 ["Phase 1: Dual Intake Channels"]
        direction LR
        IN_ONLINE["🌐 Channel A: Online Portal<br/>Proponent applies directly online via:<br/>/programs/setup or /programs/gia"]:::intake
        IN_ASSIST["🏢 Channel B: Office-Assisted Intake<br/>PSTO Staff or Focal encodes application<br/>on behalf of walk-in proponents"]:::intake

        IN_ONLINE --> SAVE_DB["System stores relational records & generates Ref No.<br/>(e.g., SETUP-2026-0001 or GIA-2026-0001)<br/>Initial Status: SUBMITTED / Under review"]:::intake
        IN_ASSIST --> SAVE_DB
    end

    subgraph PHASE_2 ["Phase 2: Collaborative Unit Desk Intake"]
        SAVE_DB --> DESK_QUEUE["Applications Module (/dashboard/applications)<br/>👁️ Visible immediately to both Staff & Focal in their assigned unit"]

        %% SSCP Desk
        subgraph SSCP_DESK ["🏛️ SSCP Unit (SETUP Program)"]
            S_STAFF["Paolo (SSCP Staff):<br/>• Assisted intake & data entry<br/>• Scans & uploads applicant files & permits<br/>• Uploads SET1 internal files (TNA, GAD, Hazard Hunter)"]:::staff
            S_FOCAL["Faith (SSCP Focal):<br/>• Uploads & data entry (same as staff)<br/>• Evaluates MSME viability & 3 supplier quotes"]:::focal
            S_STAFF <-->|Collaborative Desk| S_FOCAL
        end

        %% CEST Desk
        subgraph CEST_DESK ["🌿 CEST Unit (GIA Program)"]
            C_STAFF["Carla (CEST Staff):<br/>• Assisted intake & data entry<br/>• Scans & uploads draft Line-Item Budget<br/>• Uploads researcher credentials & IA endorsement"]:::staff
            C_FOCAL["Felix (CEST Focal):<br/>• Uploads & data entry (same as staff)<br/>• Evaluates S&T methodology & Line-Item Budget"]:::focal
            C_STAFF <-->|Collaborative Desk| C_FOCAL
        end

        DESK_QUEUE -->|SETUP Track| SSCP_DESK
        DESK_QUEUE -->|GIA Track| CEST_DESK
    end

    subgraph PHASE_3 ["Phase 3: Technical Review & Verification (Focal Officer)"]
        F_MOD["Review Module (/dashboard/application-review)<br/>Focal opens dedicated Technical Review workspace"]:::focal
        F_START["Focal clicks 'Start Evaluation (Mark In Process)'<br/>Status: UNDER_VALIDATION"]:::focal
        F_VERIFY["Focal verifies documents individually:<br/>• 'approved' (Mark Verified)<br/>• 'returned_for_revision' (Flag with remarks)"]:::focal
        F_CHECK{"Any files flagged?"}:::focal
        F_RETURN["Focal triggers 'Return for Revision'<br/>Status: RETURNED"]:::focal
        F_RESUBMIT["Staff or Proponent replaces flagged file & resubmits<br/>Status: UNDER_VALIDATION"]:::intake
        F_ENDORSE["All documents verified & technical evaluation complete<br/>Focal clicks 'Recommend Approval'<br/>Status: ENDORSED_TO_DIRECTOR"]:::focal

        SSCP_DESK --> F_MOD
        CEST_DESK --> F_MOD
        F_MOD --> F_START --> F_VERIFY --> F_CHECK
        F_CHECK -->|Yes| F_RETURN --> F_RESUBMIT --> F_VERIFY
        F_CHECK -->|No| F_ENDORSE
    end

    subgraph PHASE_4 ["Phase 4: Executive Decision (Provincial Director)"]
        D_MOD["Final Approval Module (/dashboard/executive-approval)<br/>Pat (Provincial Director) opens dedicated Executive Decision queue"]:::director
        D_DEC{"Director Decision"}:::director
        D_APP["Director clicks 'Approve Application'<br/>Status: APPROVED"]:::director
        D_DIS["Director clicks 'Disapprove Application'<br/>Status: DISAPPROVED (with formal remarks)"]:::director

        F_ENDORSE --> D_MOD --> D_DEC
        D_DEC -->|Approve| D_APP
        D_DEC -->|Disapprove| D_DIS
    end

    subgraph PHASE_5 ["Phase 5: Implementation & Monitoring Handover"]
        H_AUTO["System automatically creates Active Project Record"]:::handover
        H_STAFF["📝 Project Staff Actions:<br/>• Uploads SET3 docs (Signed MOA, Release of Funds, Payee Form)<br/>• Encodes acquired equipment & generates Asset QR Codes (/dashboard/equipment-tracking)"]:::staff
        H_FOCAL["📊 Focal Officer Actions:<br/>• SETUP: Activates Amortization Schedule & Repayment Ledger (/dashboard/repayment-monitoring)<br/>• GIA: Activates Milestones & 6Ps Output Scorecards (/dashboard/project-monitoring)"]:::focal
        H_DIR["📁 Provincial Director & RPMO:<br/>• Portfolio oversight in Projects, Financial Records & Regional Monitoring"]:::director

        D_APP --> H_AUTO --> H_STAFF & H_FOCAL & H_DIR
    end
```

---

## 🏢 Unit & Program Desk Separation (SSCP vs. CEST)

DPRMS strictly isolates incoming applications and active projects by program domain:

| Dimension | SSCP Unit (SETUP Program) | CEST Unit (GIA Program) |
| :--- | :--- | :--- |
| **Flagship Focus** | MSME Technological Upgrading & Innovation | Research & Development (R&D), Community S&T (CEST), Grants |
| **Assigned Project Staff** | **Paolo SETUP Staff** (`setup.staff@dost.gov.ph`) | **Carla GIA Staff** (`gia.staff@dost.gov.ph`) |
| **Assigned Focal Officer** | **Faith SETUP Focal** (`setup.focal@dost.gov.ph`) | **Felix GIA Focal** (`gia.focal@dost.gov.ph`) |
| **Target Proponents** | MSMEs, Cooperatives, Food Processors, Manufacturing | State Universities (SUCs), HEIs, LGUs, Community POs, NGOs |
| **Reference Number Format** | `SETUP-YYYY-XXXX` (e.g., `SETUP-2026-0001`) | `GIA-YYYY-XXXX` (e.g., `GIA-2026-0001`) |
| **Project Staff Focus** | Assisted intake & data entry, scans & uploads | Assisted intake & data entry, scans & uploads |
| **Focal Officer Focus** | Upload & data entry, review & evaluate 3 quotes, endorse to PD | Upload & data entry, review & evaluate LIB, endorse to PD |
| **Handover Destination** | Amortization Repayment Ledger & Equipment QR Tagging | Milestone Gantt Chart & **6Ps Output Scorecard** |

---

## 🔒 Master Role-Based Access Control (RBAC) Matrix

| Feature / Operation | Proponent | Project Staff (`PROJECT_STAFF`) | Focal Officer (`FOCAL`) | Provincial Director (`PROVINCIAL_DIRECTOR`) | RPMO Officer (`RPMO`) | System Admin (`SYSTEM_ADMIN`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Online Proposal Submission** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Assisted Walk-in Encoding** | ❌ | ✅ (Primary) | ✅ (Can do) | ❌ | ❌ | ❌ |
| **View Applications Roster** | 👁️ (Self) | ✅ (Unit Desk) | ✅ (Unit Desk) | 👁️ (All Programs) | 👁️ (All Programs) | 👁️ (All) |
| **Start Evaluation (Mark In Process)**| ❌ | ❌ | ✅ **(Exclusive)** | ❌ | ❌ | ❌ |
| **Upload SET1 Internal Docs** | ❌ | ✅ (Primary) | ✅ (Can do) | ❌ | ❌ | ❌ |
| **Verify Applicant & Internal PDFs** | ❌ | ❌ | ✅ **(Exclusive)** | ❌ | ❌ | ❌ |
| **Flag Documents for Revision** | ❌ | ❌ | ✅ **(Exclusive)** | ❌ | ❌ | ❌ |
| **Replace Flagged Revision Files** | ✅ (Online) | ✅ (Assisted) | ❌ | ❌ | ❌ | ❌ |
| **Recommend Approval (Endorse)** | ❌ | ❌ | ✅ **(Exclusive)** | ❌ | ❌ | ❌ |
| **Executive Final Decision** | ❌ | ❌ | ❌ | ✅ **(Exclusive)** | ❌ | ❌ |
| **Upload Post-Approval MOA & Fund Docs**| ❌ | ✅ (Primary) | ✅ (Can do) | ❌ | ❌ | ❌ |
| **Asset QR Tagging & Registry** | ❌ | ✅ | ✅ | 👁️ (View) | 👁️ (View) | ❌ |
| **Track Physical Milestones & 6Ps** | 👁️ (Self) | ✅ | ✅ **(Lead)** | 👁️ (View) | 👁️ (View) | ❌ |
| **Manage Financial Records / Ledgers**| 👁️ (Self) | ❌ | ✅ **(Lead)** | 👁️ (View) | 👁️ (View) | ❌ |

---

## 🧭 Sidebar Module Layout & Click-Through by Role

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│   📝 PROJECT STAFF      │  │    👑 FOCAL OFFICER     │  │ ⚖️ PROVINCIAL DIRECTOR  │  │        👁️ RPMO          │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ • Dashboard             │  │ • Dashboard             │  │ • Dashboard             │  │ • Dashboard             │
│ • Applications          │  │ • Applications          │  │ • Applications          │  │ • Applications          │
│ • Equipment & QR        │  │ • Review                │  │ • Final Approval        │  │ • Regional Monitoring   │
│ • Project Monitoring    │  │ • Project Monitoring    │  │ • Financial Records     │  │ • Reports               │
│ • Reports               │  │ • Financial Records     │  │ • Project Monitoring    │  │                         │
│                         │  │ • Reports               │  │ • Reports               │  │                         │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

## 🖱️ Step-by-Step Click-Through Journey

### 1️⃣ Initial Intake Stage (`SUBMITTED` / `Under review`)
* **Project Staff clicks $\rightarrow$ 📂 `Applications` (`/dashboard/applications`):**
  * Opens unit queue (SSCP for SETUP / CEST for GIA).
  * Scans & encodes documents for walk-in proponents.
  * Uploads internal SET1 files (TNA Form 1, GAD Checklist, Hazard Hunter).
* **Focal Officer clicks $\rightarrow$ 📂 `Applications` (`/dashboard/applications`):**
  * Sees the incoming application concurrently with Staff.
  * Can assist with uploading/editing files directly.

---

### 2️⃣ Technical Evaluation Stage (`UNDER_VALIDATION` / `In Process`)
* **Focal Officer clicks $\rightarrow$ 🔍 `Review` (`/dashboard/application-review`):**
  * **Dedicated Focal Evaluation Workspace.**
  * Clicks *"Start Evaluation (Mark In Process)"*.
  * Evaluates 3 supplier bids (SETUP) or Line-Item Budget (GIA).
  * Performs document verification (`Mark Verified` / `Needs Revision`).
  * If files need correction: triggers *"Return for Revision"*.
  * Once complete: clicks **"Recommend Approval"** (Endorses to Director).

---

### 3️⃣ Executive Decision Stage (`ENDORSED_TO_DIRECTOR` / `Executive Approval`)
* **Provincial Director clicks $\rightarrow$ ⚖️ `Final Approval` (`/dashboard/executive-approval`):**
  * **Dedicated Executive Queue** (only lists proposals endorsed by Focal).
  * Inspects complete dossier & prints official proposal form.
  * Issues decision: **"Approve Application"** (`APPROVED`) or **"Disapprove"** (`DISAPPROVED`).

---

### 4️⃣ Active Project Handover (`APPROVED` $\rightarrow$ `ACTIVE_PROJECT`)
* **Project Staff clicks $\rightarrow$ 🏷️ `Equipment & QR` & 📈 `Project Monitoring`:**
  * Uploads SET3 files (Signed & Notarized MOA, Release of Funds, Payee Form).
  * Registers equipment serial numbers & generates DOST Asset QR Codes.
* **Focal Officer clicks $\rightarrow$ 📈 `Project Monitoring` & 💰 `Financial Records`:**
  * Tracks milestone progress and scores **6Ps Deliverables** (*Publications, Patents, Products, People, Places, Policies*).
  * Monitors the **Amortization Repayment Ledger** (SETUP) or grant tranches (GIA).
* **Provincial Director clicks $\rightarrow$ 📈 `Project Monitoring` & 💰 `Financial Records`:**
  * High-level portfolio tracking and provincial repayment health.
* **RPMO clicks $\rightarrow$ 🌐 `Regional Monitoring`:**
  * Multi-province analytics and regional budget utilization.

---

## 🔄 State Machine Transition Lifecycle

| Step | State Code | Public Display Badge | Trigger Action | Authorized Persona | Next Stage |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `SUBMITTED` | `Under review` | Proponent submits online OR Staff encodes walk-in proposal | Proponent / Staff | Desk Intake |
| **2** | `UNDER_VALIDATION` | `In Process` | Focal clicks *"Start Evaluation (Mark In Process)"* | Focal Officer | Technical Evaluation |
| **3** | `RETURNED` | `Returned for Revision` | Focal flags defective document with specific remarks | Focal Officer | Revision Loop |
| **4** | `UNDER_VALIDATION` | `In Process` | Proponent or Staff replaces flagged file & resubmits | Proponent / Staff | Re-evaluation |
| **5** | `ENDORSED_TO_DIRECTOR` | `Executive Approval` | Focal verifies all documents & clicks *"Recommend Approval"* | Focal Officer | Executive Gate |
| **6** | `APPROVED` | `Approved` | Provincial Director clicks *"Approve Application"* | Provincial Director | Monitoring Handover |
| **7** | `DISAPPROVED` | `Disapproved` | Provincial Director clicks *"Disapprove"* with formal reason | Provincial Director | Closed |
| **8** | `ACTIVE_PROJECT` | `Active Project` | Staff uploads MOA & Focal activates ledgers / 6Ps scorecards | Staff & Focal | Active Monitoring |
