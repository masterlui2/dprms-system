import {
  industryCategoryOptions,
  lineOfBusinessOptions,
  municipalityOptions,
  organizationTypeOptions,
  setupBusinessTypeOptions,
  setupTargetBeneficiaryOptions,
} from "../../../../data/proposal";
import { InputField, SelectField } from "../../FormFields";
import { FormSection } from "./FormSection";
import type { ProposalInformationSectionProps } from "./types";

export function OrganizationSection({
  data,
  errors,
  isGia,
  onFieldChange,
}: ProposalInformationSectionProps) {
  return (
    <FormSection
      description={
        isGia
          ? "Identify the implementing agency or organization submitting the project."
          : "Tell DOST which business is requesting assistance."
      }
      title={isGia ? "Implementing Agency" : "Business Profile"}
    >
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <InputField
          autoComplete="organization"
          error={errors.organizationName}
          id="organizationName"
          label={isGia ? "Implementing Agency / Organization" : "Business Name"}
          onChange={(event) =>
            onFieldChange("organizationName", event.target.value)
          }
          placeholder={
            isGia
              ? "e.g. Davao Oriental State University"
              : "e.g. Mati Cacao Growers Co-op"
          }
          required
          value={data.organizationName}
        />
        {isGia ? (
          <SelectField
            error={errors.organizationType}
            id="organizationType"
            label="Organization Type"
            onChange={(event) =>
              onFieldChange("organizationType", event.target.value)
            }
            options={organizationTypeOptions}
            placeholder="Select organization type"
            required
            value={data.organizationType}
          />
        ) : (
          <SelectField
            error={errors.businessType}
            id="businessType"
            label="Business Type"
            onChange={(event) =>
              onFieldChange("businessType", event.target.value)
            }
            options={setupBusinessTypeOptions}
            placeholder="Select business type"
            required
            value={data.businessType}
          />
        )}
        <InputField
          autoComplete="street-address"
          error={errors.businessAddress}
          id="businessAddress"
          label={isGia ? "Office Address" : "Business Address"}
          onChange={(event) =>
            onFieldChange("businessAddress", event.target.value)
          }
          placeholder="Street, barangay, municipality"
          required
          value={data.businessAddress}
        />
        <SelectField
          error={errors.municipality}
          id="municipality"
          label="Municipality / City"
          onChange={(event) => onFieldChange("municipality", event.target.value)}
          options={municipalityOptions}
          placeholder="Select municipality or city"
          required
          value={data.municipality}
        />
        {isGia ? null : (
          <>
            <SelectField
              error={errors.lineOfBusiness}
              id="lineOfBusiness"
              label="Line of Business"
              onChange={(event) =>
                onFieldChange("lineOfBusiness", event.target.value)
              }
              options={lineOfBusinessOptions}
              placeholder="Select line of business"
              required
              value={data.lineOfBusiness}
            />
            <SelectField
              error={errors.enterpriseSize}
              id="enterpriseSize"
              label="Enterprise Size"
              onChange={(event) =>
                onFieldChange("enterpriseSize", event.target.value)
              }
              options={setupTargetBeneficiaryOptions}
              placeholder="Select enterprise size"
              required
              value={data.enterpriseSize}
            />
            <SelectField
              error={errors.industryCategory}
              id="industryCategory"
              label="Industry Sector"
              onChange={(event) =>
                onFieldChange("industryCategory", event.target.value)
              }
              options={industryCategoryOptions}
              placeholder="Select industry sector"
              required
              value={data.industryCategory}
            />
            <InputField
              error={errors.yearEstablished}
              id="yearEstablished"
              inputMode="numeric"
              label="Years in Operation"
              min="0"
              onChange={(event) =>
                onFieldChange("yearEstablished", event.target.value)
              }
              placeholder="e.g. 5"
              required
              type="number"
              value={data.yearEstablished}
            />
          </>
        )}
      </div>
    </FormSection>
  );
}
