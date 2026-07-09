import { setupProjectTypeOptions } from "../../../data/proposal";
import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from "../../../types/proposal";
import { InputField, SelectField, TextAreaField } from "../FormFields";
import { ProposalSectionHeading } from "../ProposalSectionHeading";

interface BudgetEquipmentStepProps {
  data: ProposalFormData;
  errors: ProposalFormErrors;
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void;
}

export function BudgetEquipmentStep({
  data,
  errors,
  onFieldChange,
}: BudgetEquipmentStepProps) {
  const isGia = data.proposalType === "GIA";

  return (
    <div className="space-y-7">
      <ProposalSectionHeading
        description={
          isGia
            ? "Saves workplan details, budget summary, and budget-related documents."
            : "Saves SETUP project request details and equipment request summary."
        }
        divided={false}
        title={
          isGia
            ? "Workplan and Budget Form"
            : "Project Proposal and Equipment Form"
        }
      />

      {isGia ? (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <InputField
            error={errors.totalProjectCost}
            id="totalProjectCost"
            inputMode="numeric"
            label="Total Project Cost"
            onChange={(event) =>
              onFieldChange("totalProjectCost", event.target.value)
            }
            placeholder="e.g. 1250000"
            required
            value={data.totalProjectCost}
          />
          <InputField
            error={errors.requestedAmount}
            id="requestedAmount"
            inputMode="numeric"
            label="Requested Amount / Proposed Budget"
            onChange={(event) =>
              onFieldChange("requestedAmount", event.target.value)
            }
            placeholder="e.g. 1000000"
            required
            value={data.requestedAmount}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.budgetSummary}
              id="budgetSummary"
              label="Budget Summary"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("budgetSummary", event.target.value)
              }
              placeholder="Summarize major budget categories and counterpart funds."
              required
              rows={4}
              value={data.budgetSummary}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.workplanSummary}
              id="workplanSummary"
              label="Workplan Summary"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("workplanSummary", event.target.value)
              }
              placeholder="Summarize major activities, milestones, and timeline."
              required
              rows={4}
              value={data.workplanSummary}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.equipmentNeeds}
              id="equipmentNeeds"
              label="Equipment Requirements, if applicable"
              maxLength={1400}
              onChange={(event) =>
                onFieldChange("equipmentNeeds", event.target.value)
              }
              placeholder="Describe equipment requirements or write N/A."
              required
              rows={4}
              value={data.equipmentNeeds}
            />
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-[#073b82] sm:col-span-2">
            Line-item budget upload is included in Step 4 under the documentary
            requirements checklist.
          </div>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <InputField
              error={errors.projectTitle}
              id="projectTitle"
              label="Proposed Project Title"
              onChange={(event) =>
                onFieldChange("projectTitle", event.target.value)
              }
              placeholder="e.g. Cacao Processing Line Modernization"
              required
              value={data.projectTitle}
            />
          </div>
          <SelectField
            error={errors.scopeOfAssistance}
            id="scopeOfAssistance"
            label="Scope of Assistance"
            onChange={(event) =>
              onFieldChange("scopeOfAssistance", event.target.value)
            }
            options={setupProjectTypeOptions}
            placeholder="Select scope of assistance"
            required
            value={data.scopeOfAssistance}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.projectObjectives}
              id="projectObjectives"
              label="Objectives"
              maxLength={1400}
              onChange={(event) =>
                onFieldChange("projectObjectives", event.target.value)
              }
              placeholder="List project objectives."
              required
              rows={4}
              value={data.projectObjectives}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.expectedOutputs}
              id="expectedOutputs"
              label="Expected Outcomes"
              maxLength={1400}
              onChange={(event) =>
                onFieldChange("expectedOutputs", event.target.value)
              }
              placeholder="Describe expected outcomes after assistance."
              required
              rows={4}
              value={data.expectedOutputs}
            />
          </div>
          <TextAreaField
            error={errors.proposedTechnologyAssistance}
            id="proposedTechnologyAssistance"
            label="Equipment / Technology Requested"
            maxLength={1200}
            onChange={(event) =>
              onFieldChange("proposedTechnologyAssistance", event.target.value)
            }
            placeholder="List requested equipment or technology."
            required
            rows={4}
            value={data.proposedTechnologyAssistance}
          />
          <TextAreaField
            error={errors.equipmentPurpose}
            id="equipmentPurpose"
            label="Equipment Purpose"
            maxLength={1200}
            onChange={(event) =>
              onFieldChange("equipmentPurpose", event.target.value)
            }
            placeholder="Explain how the equipment will be used."
            required
            rows={4}
            value={data.equipmentPurpose}
          />
          <InputField
            error={errors.supplierFabricator}
            id="supplierFabricator"
            label="Supplier / Fabricator"
            onChange={(event) =>
              onFieldChange("supplierFabricator", event.target.value)
            }
            placeholder="Supplier or fabricator name"
            required
            value={data.supplierFabricator}
          />
          <InputField
            error={errors.equipmentQuotationAmount}
            id="equipmentQuotationAmount"
            inputMode="numeric"
            label="Equipment Quotation Amount"
            onChange={(event) =>
              onFieldChange("equipmentQuotationAmount", event.target.value)
            }
            placeholder="e.g. 450000"
            required
            value={data.equipmentQuotationAmount}
          />
          <InputField
            error={errors.quotationCount}
            id="quotationCount"
            inputMode="numeric"
            label="Number of Quotations Uploaded"
            min="0"
            onChange={(event) =>
              onFieldChange("quotationCount", event.target.value)
            }
            placeholder="e.g. 3"
            required
            type="number"
            value={data.quotationCount}
          />
          <div className="sm:col-span-2">
            <TextAreaField
              error={errors.expectedBusinessImprovement}
              id="expectedBusinessImprovement"
              label="Expected Business Improvement"
              maxLength={1600}
              onChange={(event) =>
                onFieldChange("expectedBusinessImprovement", event.target.value)
              }
              placeholder="Describe expected productivity, quality, sales, employment, or market improvements."
              required
              rows={4}
              value={data.expectedBusinessImprovement}
            />
          </div>
        </div>
      )}
    </div>
  );
}
