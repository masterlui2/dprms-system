import {
  giaTargetBeneficiaryOptions,
  giaProjectTypeOptions,
  tnaStatusOptions,
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

export function ProjectDetailsStep({
  data,
  errors,
  onFieldChange,
}: ProjectDetailsStepProps) {
  const isGia = data.proposalType === "GIA";

  return (
    <div className="space-y-8">
      <ProposalSectionHeading
        description={
          isGia
            ? "Saves the main project details and generates a project summary for review."
            : "Saves TNA information and shows TNA status in both applicant and DPRMS review pages."
        }
        divided={false}
        title={isGia ? "Project Profile Form" : "Technology Needs Assessment Form"}
      />

      {isGia ? (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <InputField
              error={errors.projectTitle}
              id="projectTitle"
              label="Project Title"
              onChange={(event) =>
                onFieldChange("projectTitle", event.target.value)
              }
              placeholder="e.g. Community Water Quality Monitoring Project"
              required
              value={data.projectTitle}
            />
          </div>
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
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.projectObjectives}
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
              error={errors.rationale}
              id="rationale"
              label="Rationale / Justification"
              maxLength={1800}
              onChange={(event) =>
                onFieldChange("rationale", event.target.value)
              }
              placeholder="Explain the problem, opportunity, or public need the project addresses."
              required
              rows={4}
              value={data.rationale}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.methodology}
              id="methodology"
              label="Methodology"
              maxLength={1800}
              onChange={(event) =>
                onFieldChange("methodology", event.target.value)
              }
              placeholder="Describe the project methodology and implementation approach."
              required
              rows={5}
              value={data.methodology}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.expectedOutputs}
              id="expectedOutputs"
              label="Expected Outputs"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("expectedOutputs", event.target.value)
              }
              placeholder="Describe expected outputs, outcomes, and deliverables."
              required
              rows={4}
              value={data.expectedOutputs}
            />
          </div>
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
            placeholder="Select target beneficiaries"
            required
            value={data.targetBeneficiary}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.sustainabilityPlan}
              id="sustainabilityPlan"
              label="Sustainability Plan"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("sustainabilityPlan", event.target.value)
              }
              placeholder="Describe how outputs and benefits will continue after project completion."
              required
              rows={4}
              value={data.sustainabilityPlan}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <SelectField
            error={errors.tnaStatus}
            id="tnaStatus"
            label="TNA Status"
            onChange={(event) =>
              onFieldChange(
                "tnaStatus",
                event.target.value as ProposalFormData["tnaStatus"],
              )
            }
            options={tnaStatusOptions}
            placeholder="Select TNA status"
            required
            value={data.tnaStatus}
          />
          <InputField
            disabled
            helperText="Upload this in the documentary requirements step if available."
            id="tnaFormUploadNote"
            label="TNA Form 01 Upload, if available"
            value="Upload in Step 4"
          />
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.currentOperationalProblem}
              id="currentOperationalProblem"
              label="Current Production Problem"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("currentOperationalProblem", event.target.value)
              }
              placeholder="Describe the production problem to be addressed."
              required
              rows={4}
              value={data.currentOperationalProblem}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.existingEquipmentUsed}
              id="existingEquipmentUsed"
              label="Existing Equipment Used"
              maxLength={1200}
              onChange={(event) =>
                onFieldChange("existingEquipmentUsed", event.target.value)
              }
              placeholder="List existing equipment and current production tools."
              required
              rows={3}
              value={data.existingEquipmentUsed}
            />
          </div>
          <TextAreaField
            error={errors.processBottlenecks}
            id="processBottlenecks"
            label="Process Bottlenecks"
            maxLength={1000}
            onChange={(event) =>
              onFieldChange("processBottlenecks", event.target.value)
            }
            placeholder="Describe workflow or production bottlenecks."
            required
            rows={4}
            value={data.processBottlenecks}
          />
          <TextAreaField
            error={errors.productQualityConcerns}
            id="productQualityConcerns"
            label="Product Quality Concerns"
            maxLength={1000}
            onChange={(event) =>
              onFieldChange("productQualityConcerns", event.target.value)
            }
            placeholder="Describe quality issues or standards gaps."
            required
            rows={4}
            value={data.productQualityConcerns}
          />
          <TextAreaField
            error={errors.productivityConcerns}
            id="productivityConcerns"
            label="Productivity Concerns"
            maxLength={1000}
            onChange={(event) =>
              onFieldChange("productivityConcerns", event.target.value)
            }
            placeholder="Describe productivity, capacity, or efficiency concerns."
            required
            rows={4}
            value={data.productivityConcerns}
          />
          <TextAreaField
            error={errors.targetImprovement}
            id="targetImprovement"
            label="Target Improvement"
            maxLength={1000}
            onChange={(event) =>
              onFieldChange("targetImprovement", event.target.value)
            }
            placeholder="Describe the target improvement after assistance."
            required
            rows={4}
            value={data.targetImprovement}
          />
        </div>
      )}
    </div>
  );
}
