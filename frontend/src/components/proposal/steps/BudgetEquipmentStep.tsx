import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from '../../../types/proposal'
import { InputField, TextAreaField } from '../FormFields'
import { ProposalSectionHeading } from '../ProposalSectionHeading'

interface BudgetEquipmentStepProps {
  data: ProposalFormData
  errors: ProposalFormErrors
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void
}

export function BudgetEquipmentStep({
  data,
  errors,
  onFieldChange,
}: BudgetEquipmentStepProps) {
  const isGia = data.proposalType === 'GIA'

  return (
    <div className="space-y-7">
      <ProposalSectionHeading
        description={
          isGia
            ? 'Summarize the requested project budget and resources needed for implementation.'
            : 'Summarize the requested equipment, project cost, and current enterprise figures.'
        }
        divided={false}
        title={isGia ? 'Budget summary' : 'Budget and equipment'}
      />

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <InputField
          error={errors.totalBusinessAssets}
          helperText={isGia ? 'Enter the total requested budget.' : 'Enter the estimated project cost or assistance amount.'}
          id="totalBusinessAssets"
          inputMode="numeric"
          label={isGia ? 'Requested Budget' : 'Project Cost / Assistance Amount'}
          onChange={(event) =>
            onFieldChange('totalBusinessAssets', event.target.value)
          }
          placeholder="e.g. 1250000"
          required
          value={data.totalBusinessAssets}
        />

        <InputField
          error={errors.annualNetProfit}
          helperText={isGia ? 'Enter counterpart funding if applicable.' : 'Enter the latest annual net profit if available.'}
          id="annualNetProfit"
          inputMode="numeric"
          label={isGia ? 'Counterpart Funding' : 'Annual Net Profit'}
          onChange={(event) =>
            onFieldChange('annualNetProfit', event.target.value)
          }
          placeholder="e.g. 250000"
          value={data.annualNetProfit}
        />

        <div className="sm:col-span-2">
          <TextAreaField
            error={errors.equipmentNeeds}
            helperText={
              isGia
                ? 'Describe major budget items, supplies, services, or equipment.'
                : 'List requested equipment, specifications, supplier notes, and expected use.'
            }
            id="equipmentNeeds"
            label={isGia ? 'Budget Items / Resource Needs' : 'Equipment Needs'}
            maxLength={1600}
            onChange={(event) =>
              onFieldChange('equipmentNeeds', event.target.value)
            }
            placeholder={
              isGia
                ? 'Summarize the major budget items needed for the project.'
                : 'Describe the equipment or technology assistance needed.'
            }
            required
            rows={5}
            value={data.equipmentNeeds}
          />
        </div>
      </div>
    </div>
  )
}
