import {
  giaProjectTypeOptions,
  giaTargetBeneficiaryOptions,
  projectCategoryOptions,
  setupProjectTypeOptions,
} from "../../../../data/proposal";
import type { ProposalFormData } from "../../../../types/proposal";
import { InputField, SelectField, TextAreaField } from "../../FormFields";
import { FormSection } from "./FormSection";
import type { ProposalInformationSectionProps } from "./types";

export function ProjectDetailsSection({
  data,
  errors,
  isGia,
  onFieldChange,
}: ProposalInformationSectionProps) {
  return (
    <FormSection
      description="Summarize the project clearly enough for DOST to understand the need, location, and expected result."
      title="Project Details"
    >
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <InputField
            error={errors.projectTitle}
            id="projectTitle"
            label="Project Title"
            onChange={(event) =>
              onFieldChange("projectTitle", event.target.value)
            }
            placeholder={
              isGia
                ? "e.g. Community Water Quality Monitoring Project"
                : "e.g. Cacao Processing Line Modernization"
            }
            required
            value={data.projectTitle}
          />
        </div>
        {isGia ? (
          <>
            <SelectField
              error={errors.projectCategory}
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
            <SelectField
              error={errors.projectType}
              id="projectType"
              label="Project Type"
              onChange={(event) =>
                onFieldChange(
                  "projectType",
                  event.target.value as ProposalFormData["projectType"],
                )
              }
              options={giaProjectTypeOptions}
              placeholder="Select project type"
              required
              value={data.projectType}
            />
          </>
        ) : (
          <SelectField
            error={errors.scopeOfAssistance}
            id="scopeOfAssistance"
            label="Type of Assistance Needed"
            onChange={(event) =>
              onFieldChange("scopeOfAssistance", event.target.value)
            }
            options={setupProjectTypeOptions}
            placeholder="Select assistance type"
            required
            value={data.scopeOfAssistance}
          />
        )}
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

        <div className="sm:col-span-2">
          <TextAreaField
            error={
              isGia ? errors.projectDescription : errors.currentOperationalProblem
            }
            helperText="Keep this brief. The detailed proposal document will be uploaded in the next step."
            id={isGia ? "projectDescription" : "currentOperationalProblem"}
            label={isGia ? "Project Summary / Need" : "Business Problem or Need"}
            maxLength={1400}
            onChange={(event) =>
              onFieldChange(
                isGia ? "projectDescription" : "currentOperationalProblem",
                event.target.value,
              )
            }
            placeholder={
              isGia
                ? "Describe the problem, opportunity, and communities or sectors that will benefit."
                : "Describe the production, quality, capacity, or market problem to be addressed."
            }
            required
            rows={4}
            value={isGia ? data.projectDescription : data.currentOperationalProblem}
          />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField
            error={errors.projectObjectives}
            id="projectObjectives"
            label="Objectives"
            maxLength={1200}
            onChange={(event) =>
              onFieldChange("projectObjectives", event.target.value)
            }
            placeholder="List the main objectives of the project."
            required
            rows={4}
            value={data.projectObjectives}
          />
        </div>
        {isGia ? (
          <SelectField
            error={errors.targetBeneficiary}
            id="targetBeneficiary"
            label="Target Beneficiaries"
            onChange={(event) =>
              onFieldChange(
                "targetBeneficiary",
                event.target.value as ProposalFormData["targetBeneficiary"],
              )
            }
            options={giaTargetBeneficiaryOptions}
            placeholder="Select beneficiaries"
            required
            value={data.targetBeneficiary}
          />
        ) : (
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.proposedTechnologyAssistance}
              id="proposedTechnologyAssistance"
              label="Technology or Equipment Requested"
              maxLength={1200}
              onChange={(event) =>
                onFieldChange("proposedTechnologyAssistance", event.target.value)
              }
              placeholder="Describe the equipment, technology, or process improvement being requested."
              required
              rows={4}
              value={data.proposedTechnologyAssistance}
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <TextAreaField
            error={errors.expectedOutputs}
            id="expectedOutputs"
            label={isGia ? "Expected Outputs" : "Expected Results"}
            maxLength={1200}
            onChange={(event) =>
              onFieldChange("expectedOutputs", event.target.value)
            }
            placeholder={
              isGia
                ? "Describe the outputs, deliverables, or public benefit."
                : "Describe expected improvements in productivity, quality, sales, employment, or market access."
            }
            required
            rows={4}
            value={data.expectedOutputs}
          />
        </div>
      </div>
    </FormSection>
  );
}
