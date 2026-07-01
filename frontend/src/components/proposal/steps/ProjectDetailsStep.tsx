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
import { cn } from "../../../utils/cn";

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
    sectionTitle: "GIA project information",
    projectTypeLabel: "GIA Project Type",
    projectTypeOptions: giaProjectTypeOptions,
    beneficiaryOptions: giaTargetBeneficiaryOptions,
    technologyLabel: "Technology / Intervention",
    technologyPlaceholder:
      "e.g. food processing technology, training program, livelihood equipment, research support",
    technologyHelper:
      "Describe the main science and technology intervention the project will provide.",
    outputPlaceholder:
      "Describe the expected outputs such as training completion, improved process, adopted technology, or community benefit.",
  },
  SETUP: {
    sectionTitle: "SETUP project information",
    projectTypeLabel: "SETUP Project Type",
    projectTypeOptions: setupProjectTypeOptions,
    beneficiaryOptions: setupTargetBeneficiaryOptions,
    technologyLabel: "Technology / Equipment Needed",
    technologyPlaceholder:
      "e.g. vacuum packaging machine, solar dryer, food processing equipment, production machine",
    technologyHelper:
      "Name the main equipment, technology, or production improvement being requested.",
    outputPlaceholder:
      "Describe the expected outputs such as improved production, better product quality, increased sales, reduced processing time, or expanded market.",
  },
} as const;

const programOptions = [
  {
    value: "SETUP",
    label: "SETUP",
    description: "Small Enterprise Technology Upgrading Program",
  },
  {
    value: "GIA",
    label: "GIA",
    description: "Grants-in-Aid for community-based S&T projects",
  },
] as const;

export function ProjectDetailsStep({
  data,
  errors,
  onFieldChange,
}: ProjectDetailsStepProps) {
  const selectedProgram = data.proposalType
    ? programCopy[data.proposalType]
    : null;

  return (
    <div className="space-y-8">
      <ProposalSectionHeading
        description="Provide the main project information. Program-specific fields appear after you select GIA or SETUP."
        divided={false}
        title="Project details"
      />

      <section className="space-y-5">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-bold text-slate-800">
              Program
              <span aria-hidden="true" className="ml-1 text-red-600">
                *
              </span>
              <span className="sr-only"> required</span>
            </legend>

            <div className="grid gap-3 sm:grid-cols-2">
              {programOptions.map((program) => {
                const selected = data.proposalType === program.value;

                return (
                  <label
                    className={cn(
                      "flex min-h-24 cursor-pointer flex-col justify-center rounded-2xl border-2 px-5 py-4 transition focus-within:ring-4 focus-within:ring-blue-100",
                      selected
                        ? "border-[#0f53b7] bg-blue-50/60"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                    key={program.value}
                  >
                    <input
                      checked={selected}
                      className="sr-only"
                      name="proposalType"
                      onChange={() =>
                        onFieldChange("proposalType", program.value)
                      }
                      type="radio"
                      value={program.value}
                    />
                    <span className="text-lg font-black text-slate-950">
                      {program.label}
                    </span>
                    <span className="mt-1 text-sm leading-5 text-slate-600">
                      {program.description}
                    </span>
                  </label>
                );
              })}
            </div>

            {errors.proposalType ? (
              <p className="text-xs font-semibold text-red-600" role="alert">
                {errors.proposalType}
              </p>
            ) : (
              <p className="text-xs leading-5 text-slate-500">
                Select the DOST program that best matches your proposal.
              </p>
            )}
          </fieldset>

          <div className="sm:col-span-2">
            <InputField
              error={errors.projectTitle}
              helperText="Use a clear title that describes the proposed project."
              id="projectTitle"
              label="Project Title"
              onChange={(event) =>
                onFieldChange("projectTitle", event.target.value)
              }
              placeholder="Enter the proposed project title"
              required
              value={data.projectTitle}
            />
          </div>

          <SelectField
            error={errors.projectCategory}
            helperText="Select the sector where the project belongs."
            id="projectCategory"
            label="Project Category"
            onChange={(event) =>
              onFieldChange(
                "projectCategory",
                event.target.value as ProposalFormData["projectCategory"],
              )
            }
            options={projectCategoryOptions}
            placeholder="Select project category"
            required
            value={data.projectCategory}
          />

          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.projectDescription}
              helperText="Briefly explain the project need and proposed solution."
              id="projectDescription"
              label="Project Description"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("projectDescription", event.target.value)
              }
              placeholder="Provide a brief summary of the proposed project."
              required
              rows={4}
              value={data.projectDescription}
            />
          </div>

          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.projectObjectives}
              helperText="State the specific goals the project should accomplish."
              id="projectObjectives"
              label="Project Objectives"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("projectObjectives", event.target.value)
              }
              placeholder="List the main objectives of the project."
              required
              rows={4}
              value={data.projectObjectives}
            />
          </div>
        </div>
      </section>

      {selectedProgram ? (
        <section className="space-y-5 border-t border-slate-200 pt-7">
          <div>
            <h3 className="text-base font-black text-[#073b82]">
              {selectedProgram.sectionTitle}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Complete only the fields relevant to your selected program.
            </p>
          </div>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
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
              placeholder="Select project type"
              required
              value={data.projectType}
            />

            <SelectField
              error={errors.targetBeneficiary}
              helperText="Select the primary beneficiary of the project."
              id="targetBeneficiary"
              label="Target Beneficiaries"
              onChange={(event) =>
                onFieldChange(
                  "targetBeneficiary",
                  event.target.value as ProposalFormData["targetBeneficiary"],
                )
              }
              options={[...selectedProgram.beneficiaryOptions]}
              placeholder="Select target beneficiaries"
              required
              value={data.targetBeneficiary}
            />

            <div className="sm:col-span-2">
              <InputField
                error={errors.technologyInnovation}
                helperText={selectedProgram.technologyHelper}
                id="technologyInnovation"
                label={selectedProgram.technologyLabel}
                onChange={(event) =>
                  onFieldChange("technologyInnovation", event.target.value)
                }
                placeholder={selectedProgram.technologyPlaceholder}
                required
                value={data.technologyInnovation}
              />
            </div>

            <div className="sm:col-span-2">
              <TextAreaField
                error={errors.expectedOutputs}
                helperText="Focus on clear and practical results the project can achieve."
                id="expectedOutputs"
                label="Expected Outputs"
                maxLength={1600}
                onChange={(event) =>
                  onFieldChange("expectedOutputs", event.target.value)
                }
                placeholder={selectedProgram.outputPlaceholder}
                required
                rows={4}
                value={data.expectedOutputs}
              />
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
          <p className="text-sm font-bold text-slate-700">
            Select a program to view its project fields.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            GIA and SETUP use different project types, beneficiaries, and
            technology requirements.
          </p>
        </div>
      )}
    </div>
  );
}
