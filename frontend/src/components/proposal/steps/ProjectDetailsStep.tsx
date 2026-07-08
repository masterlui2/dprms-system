import {
  giaProjectTypeOptions,
  giaTargetBeneficiaryOptions,
  projectCategoryOptions,
  setupProjectTypeOptions,
  setupTargetBeneficiaryOptions,
} from "../../../data/proposal";
import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from "../../../types/proposal";
import { InputField, SelectField, TextAreaField } from "../FormFields";
import { ProposalSectionHeading } from "../ProposalSectionHeading";

interface ProjectDetailsStepProps {
  data: ProposalFormData;
  errors: ProposalFormErrors;
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void;
}

const programCopy = {
  GIA: {
    description:
      "Complete the project information required for GIA review, including implementation site, duration, methodology, 6Ps outputs, and workplan summary.",
    projectTitleLabel: "Project Title",
    projectTitlePlaceholder: "e.g. Community Water Quality Monitoring Project",
    projectTypeLabel: "GIA Project Type",
    projectTypeOptions: giaProjectTypeOptions,
    beneficiaryOptions: giaTargetBeneficiaryOptions,
    sectionTitle: "GIA project implementation details",
    title: "GIA project details",
  },
  SETUP: {
    description:
      "Complete the business information required for SETUP review, including operational problem, requested technology assistance, and expected business improvement.",
    projectTitleLabel: "Project / Business Improvement Title",
    projectTitlePlaceholder: "e.g. Cacao Processing Line Modernization",
    projectTypeLabel: "SETUP Assistance Type",
    projectTypeOptions: setupProjectTypeOptions,
    beneficiaryOptions: setupTargetBeneficiaryOptions,
    sectionTitle: "SETUP business improvement details",
    title: "SETUP application details",
  },
} as const;

export function ProjectDetailsStep({
  data,
  errors,
  onFieldChange,
}: ProjectDetailsStepProps) {
  const selectedProgram = data.proposalType
    ? programCopy[data.proposalType]
    : null;

  if (!selectedProgram) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
        <p className="text-sm font-bold text-slate-700">
          Select GIA or SETUP in Step 1 to view the correct project fields.
        </p>
      </div>
    );
  }

  const isGia = data.proposalType === "GIA";

  return (
    <div className="space-y-8">
      <ProposalSectionHeading
        description={selectedProgram.description}
        divided={false}
        title={selectedProgram.title}
      />

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#073b82]">
        Selected track: {data.proposalType === "GIA" ? "GIA Project Portal" : "SETUP Beneficiary Portal"}
      </div>

      <section className="space-y-5">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <InputField
              error={errors.projectTitle}
              helperText="Use a clear title that describes the proposal."
              id="projectTitle"
              label={selectedProgram.projectTitleLabel}
              onChange={(event) =>
                onFieldChange("projectTitle", event.target.value)
              }
              placeholder={selectedProgram.projectTitlePlaceholder}
              required
              value={data.projectTitle}
            />
          </div>

          <SelectField
            error={errors.projectCategory}
            helperText="Select the sector where the proposal belongs."
            id="projectCategory"
            label={isGia ? "Project Sector / Category" : "Industry Sector"}
            onChange={(event) =>
              onFieldChange(
                "projectCategory",
                event.target.value as ProposalFormData["projectCategory"],
              )
            }
            options={projectCategoryOptions}
            placeholder="Select category"
            required
            value={data.projectCategory}
          />

          <SelectField
            error={errors.projectType}
            helperText="Choose the option that best describes the proposed activity."
            id="projectType"
            label={selectedProgram.projectTypeLabel}
            onChange={(event) =>
              onFieldChange(
                "projectType",
                event.target.value as ProposalFormData["projectType"],
              )
            }
            options={[...selectedProgram.projectTypeOptions]}
            placeholder="Select type"
            required
            value={data.projectType}
          />

          <SelectField
            error={errors.targetBeneficiary}
            helperText="Select the primary beneficiary of the proposal."
            id="targetBeneficiary"
            label={isGia ? "Target Beneficiaries" : "Business Size / Entity Type"}
            onChange={(event) =>
              onFieldChange(
                "targetBeneficiary",
                event.target.value as ProposalFormData["targetBeneficiary"],
              )
            }
            options={[...selectedProgram.beneficiaryOptions]}
            placeholder="Select beneficiary"
            required
            value={data.targetBeneficiary}
          />

          {isGia ? (
            <>
              <InputField
                error={errors.cooperatingAgency}
                id="cooperatingAgency"
                label="Cooperating Agency"
                onChange={(event) =>
                  onFieldChange("cooperatingAgency", event.target.value)
                }
                placeholder="e.g. LGU Mati, partner SUC, NGO, or community organization"
                required
                value={data.cooperatingAgency}
              />
              <InputField
                error={errors.siteOfImplementation}
                id="siteOfImplementation"
                label="Site of Implementation"
                onChange={(event) =>
                  onFieldChange("siteOfImplementation", event.target.value)
                }
                placeholder="Barangay, municipality, province"
                required
                value={data.siteOfImplementation}
              />
              <InputField
                error={errors.projectDuration}
                id="projectDuration"
                label="Project Duration"
                onChange={(event) =>
                  onFieldChange("projectDuration", event.target.value)
                }
                placeholder="e.g. 12 months"
                required
                value={data.projectDuration}
              />
            </>
          ) : null}
        </div>
      </section>

      <section className="space-y-5 border-t border-slate-200 pt-7">
        <div>
          <h3 className="text-base font-black text-[#073b82]">
            {selectedProgram.sectionTitle}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {isGia
              ? "These fields align with GIA proposal review requirements."
              : "These fields align with SETUP enterprise assessment requirements."}
          </p>
        </div>

        {isGia ? (
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.projectObjectives}
                helperText="State the specific project objectives."
                id="projectObjectives"
                label="Objectives"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange("projectObjectives", event.target.value)
                }
                placeholder="List the main objectives of the GIA project."
                required
                rows={4}
                value={data.projectObjectives}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.methodology}
                helperText="Describe implementation approach, activities, and technical methods."
                id="methodology"
                label="Methodology"
                maxLength={1800}
                onChange={(event) =>
                  onFieldChange("methodology", event.target.value)
                }
                placeholder="Describe the project methodology."
                required
                rows={5}
                value={data.methodology}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.expectedOutputs}
                helperText="Include expected outputs and 6Ps where applicable."
                id="expectedOutputs"
                label="Expected Outputs / 6Ps"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange("expectedOutputs", event.target.value)
                }
                placeholder="Describe outputs, outcomes, publications/products/people/services, or community benefits."
                required
                rows={4}
                value={data.expectedOutputs}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.workplanSummary}
                helperText="Summarize major activities, milestones, and timeline."
                id="workplanSummary"
                label="Workplan Summary"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange("workplanSummary", event.target.value)
                }
                placeholder="Summarize implementation phases and milestones."
                required
                rows={4}
                value={data.workplanSummary}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.personnelInvolved}
                helperText="List key project personnel and roles."
                id="personnelInvolved"
                label="Personnel Involved"
                maxLength={1200}
                onChange={(event) =>
                  onFieldChange("personnelInvolved", event.target.value)
                }
                placeholder="Project leader, staff, partner personnel, and roles."
                required
                rows={4}
                value={data.personnelInvolved}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.projectDescription}
                helperText="Briefly describe the enterprise and current operation."
                id="projectDescription"
                label="Business Background"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange("projectDescription", event.target.value)
                }
                placeholder="Describe the business, products/services, market, and current production setup."
                required
                rows={4}
                value={data.projectDescription}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.currentOperationalProblem}
                helperText="Explain the production, quality, packaging, or productivity issue to solve."
                id="currentOperationalProblem"
                label="Current Operational Problem"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange("currentOperationalProblem", event.target.value)
                }
                placeholder="Describe bottlenecks, quality gaps, low capacity, manual process, or market limitations."
                required
                rows={4}
                value={data.currentOperationalProblem}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.proposedTechnologyAssistance}
                helperText="Describe the technology intervention, equipment, training, or process improvement requested."
                id="proposedTechnologyAssistance"
                label="Proposed Technology Assistance"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange(
                    "proposedTechnologyAssistance",
                    event.target.value,
                  )
                }
                placeholder="Describe the requested technology assistance."
                required
                rows={4}
                value={data.proposedTechnologyAssistance}
              />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.expectedBusinessImprovement}
                helperText="Describe expected improvements in productivity, sales, quality, employment, or market reach."
                id="expectedBusinessImprovement"
                label="Expected Business Improvement"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange(
                    "expectedBusinessImprovement",
                    event.target.value,
                  )
                }
                placeholder="Describe measurable business improvement expected from SETUP assistance."
                required
                rows={4}
                value={data.expectedBusinessImprovement}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
