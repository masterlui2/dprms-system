import {
  industryCategoryOptions,
  municipalityOptions,
  organizationTypeOptions,
} from '../../../data/proposal'
import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from '../../../types/proposal'
import { InputField, SelectField } from '../FormFields'
import { ProposalSectionHeading } from '../ProposalSectionHeading'

interface ApplicantOrganizationStepProps {
  data: ProposalFormData
  errors: ProposalFormErrors
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void
}

export function ApplicantOrganizationStep({
  data,
  errors,
  onFieldChange,
}: ApplicantOrganizationStepProps) {
  const isGia = data.proposalType === 'GIA'

  return (
    <div className="space-y-7">
      <ProposalSectionHeading
        description={
          isGia
            ? 'Provide the project proponent, implementing agency, and contact details. All fields marked * are required.'
            : 'Provide your registered enterprise details. All fields marked * are required.'
        }
        divided={false}
        title={isGia ? 'Project proponent profile' : 'Tell us about your business'}
      />

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <InputField
          autoComplete="organization"
          error={errors.organizationName}
          id="organizationName"
          label={isGia ? 'Implementing Agency / Organization' : 'Business Name'}
          onChange={(event) => onFieldChange('organizationName', event.target.value)}
          placeholder={isGia ? 'e.g. Davao Oriental State University' : 'e.g. Mati Cacao Growers Co-op'}
          required
          value={data.organizationName}
        />
        <SelectField
          error={errors.organizationType}
          id="organizationType"
          label={isGia ? 'Type of Agency / Organization' : 'Type of Enterprise'}
          onChange={(event) => onFieldChange('organizationType', event.target.value)}
          options={organizationTypeOptions}
          placeholder={isGia ? 'Select organization type' : 'Select enterprise type'}
          required
          value={data.organizationType}
        />
        <InputField
          error={errors.yearEstablished}
          id="yearEstablished"
          inputMode="numeric"
          label={isGia ? 'Year Organized / Established' : 'Year Established'}
          max={new Date().getFullYear()}
          min="1900"
          onChange={(event) => onFieldChange('yearEstablished', event.target.value)}
          placeholder="e.g. 2018"
          required
          type="number"
          value={data.yearEstablished}
        />
        <InputField
          error={errors.employeeCount}
          id="employeeCount"
          inputMode="numeric"
          label={isGia ? 'Personnel / Members Count' : 'Number of Employees'}
          min="1"
          onChange={(event) => onFieldChange('employeeCount', event.target.value)}
          placeholder="e.g. 12"
          required
          type="number"
          value={data.employeeCount}
        />
        <SelectField
          error={errors.industryCategory}
          id="industryCategory"
          label={isGia ? 'Project Sector' : 'Sector / Industry'}
          onChange={(event) => onFieldChange('industryCategory', event.target.value)}
          options={industryCategoryOptions}
          placeholder="Select sector or industry"
          required
          value={data.industryCategory}
        />
        <SelectField
          error={errors.municipality}
          id="municipality"
          label="Municipality"
          onChange={(event) => onFieldChange('municipality', event.target.value)}
          options={municipalityOptions}
          placeholder="Select municipality"
          required
          value={data.municipality}
        />
        <InputField
          autoComplete="name"
          error={errors.applicantFullName}
          id="applicantFullName"
          label={isGia ? 'Project Leader' : 'Owner / Authorized Representative'}
          onChange={(event) => onFieldChange('applicantFullName', event.target.value)}
          placeholder={isGia ? 'e.g. Dr. Juan Dela Cruz' : 'e.g. Juan Dela Cruz'}
          required
          value={data.applicantFullName}
        />
        <InputField
          autoComplete="organization-title"
          error={errors.applicantPosition}
          id="applicantPosition"
          label={isGia ? 'Project Role / Position' : 'Position'}
          onChange={(event) => onFieldChange('applicantPosition', event.target.value)}
          placeholder={isGia ? 'e.g. Project Leader' : 'e.g. General Manager'}
          required
          value={data.applicantPosition}
        />
        <InputField
          autoComplete="tel"
          error={errors.contactNumber}
          id="contactNumber"
          inputMode="tel"
          label="Contact Number"
          onChange={(event) => onFieldChange('contactNumber', event.target.value)}
          placeholder="+63 9XX XXX XXXX"
          required
          value={data.contactNumber}
        />
        <InputField
          autoComplete="email"
          error={errors.emailAddress}
          id="emailAddress"
          label="Email Address"
          onChange={(event) => onFieldChange('emailAddress', event.target.value)}
          placeholder="contact@company.ph"
          required
          type="email"
          value={data.emailAddress}
        />
        <div className="sm:col-span-2">
          <InputField
            autoComplete="street-address"
            error={errors.businessAddress}
            id="businessAddress"
            label={isGia ? 'Agency / Office Address' : 'Business Address'}
            onChange={(event) => onFieldChange('businessAddress', event.target.value)}
            placeholder={isGia ? 'Office, campus, or agency address' : 'Purok, Barangay, Municipality'}
            required
            value={data.businessAddress}
          />
        </div>
      </div>
    </div>
  )
}
