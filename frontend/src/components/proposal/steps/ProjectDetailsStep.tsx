import {
  projectCategoryOptions,
  projectTypeOptions,
  proposalTypeOptions,
  targetBeneficiaryOptions,
} from "../../../data/proposal";
import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from "../../../types/proposal";
import { InputField, SelectField, TextAreaField } from "../FormFields";
import { MsmeClassificationField } from "../MsmeClassificationField";
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
  return (
    <div className="space-y-7">
      <ProposalSectionHeading
        description="Select the program you are applying for and outline the project scope."
        divided={false}
        title="Describe your project"
      />

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <SelectField
            error={errors.proposalType}
            helperText="Choose SETUP for enterprise technology upgrading or GIA for science and technology projects."
            id="proposalType"
            label="Program"
            onChange={(event) =>
              onFieldChange(
                "proposalType",
                event.target.value as ProposalFormData["proposalType"],
              )
            }
            options={proposalTypeOptions}
            placeholder="Select GIA or SETUP"
            required
            value={data.proposalType}
          />
        </div>

        <div className="sm:col-span-2">
          <InputField
            error={errors.projectTitle}
            helperText="Use a clear and specific title that identifies the proposed project."
            id="projectTitle"
            label="Project Title"
            onChange={(event) =>
              onFieldChange("projectTitle", event.target.value)
            }
            placeholder="e.g. Automated Cacao Sorting Line"
            required
            value={data.projectTitle}
          />
        </div>

        <SelectField
          error={errors.projectCategory}
          helperText="Select the sector where your project belongs."
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
          helperText="Select the type of project you are proposing."
          id="projectType"
          label="Project Type"
          onChange={(event) =>
            onFieldChange(
              "projectType",
              event.target.value as ProposalFormData["projectType"],
            )
          }
          options={projectTypeOptions}
          placeholder="Select project type"
          required
          value={data.projectType}
        />

        <div className="sm:col-span-2">
          <InputField
            error={errors.technologyInnovation}
            helperText="Specify the main technology or innovation used in the project."
            id="technologyInnovation"
            label="Technology / Innovation"
            onChange={(event) =>
              onFieldChange("technologyInnovation", event.target.value)
            }
            placeholder="e.g. QR Code Inventory System, Solar Dryer, Mobile Application, AI-Based Monitoring"
            required
            value={data.technologyInnovation}
          />
        </div>

        <div className="sm:col-span-2">
          <SelectField
            error={errors.targetBeneficiary}
            helperText="Select the primary beneficiaries of the project."
            id="targetBeneficiary"
            label="Target Beneficiaries"
            onChange={(event) =>
              onFieldChange(
                "targetBeneficiary",
                event.target.value as ProposalFormData["targetBeneficiary"],
              )
            }
            options={targetBeneficiaryOptions}
            placeholder="Select target beneficiaries"
            required
            value={data.targetBeneficiary}
          />
        </div>

        <div className="sm:col-span-2 border-t border-slate-200 pt-7">
          <h3 className="text-base font-black text-[#073b82]">
            Equipment and Enterprise Profile
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Provide the equipment requirement and basic financial information needed to
            assess the enterprise.
          </p>
        </div>

        <div className="sm:col-span-2">
          <TextAreaField
            error={errors.equipmentNeeds}
            helperText="List only the essential equipment or technology needed and briefly explain how each item will support the project."
            id="equipmentNeeds"
            label="Equipment / Technology Needed"
            maxLength={1200}
            onChange={(event) =>
              onFieldChange("equipmentNeeds", event.target.value)
            }
            placeholder="e.g. One solar dryer for improving product drying consistency and reducing processing time."
            required
            rows={4}
            value={data.equipmentNeeds}
          />
        </div>

        <InputField
          error={errors.totalBusinessAssets}
          helperText="Enter total assets including loan-funded assets, but exclude the land where the business operates."
          id="totalBusinessAssets"
          inputMode="decimal"
          label="Total Business Assets (PHP)"
          min="0.01"
          onChange={(event) =>
            onFieldChange("totalBusinessAssets", event.target.value)
          }
          placeholder="e.g. 2500000"
          required
          step="0.01"
          type="number"
          value={data.totalBusinessAssets}
        />

        <InputField
          error={errors.annualNetProfit}
          helperText="Provide the estimated net profit for the latest completed year. This does not determine the MSME classification."
          id="annualNetProfit"
          inputMode="decimal"
          label="Estimated Annual Net Profit (PHP)"
          min="0"
          onChange={(event) =>
            onFieldChange("annualNetProfit", event.target.value)
          }
          placeholder="e.g. 450000"
          required
          step="0.01"
          type="number"
          value={data.annualNetProfit}
        />

        <div className="sm:col-span-2">
          <MsmeClassificationField
            totalBusinessAssets={data.totalBusinessAssets}
          />
        </div>
      </div>
    </div>
  );
}
