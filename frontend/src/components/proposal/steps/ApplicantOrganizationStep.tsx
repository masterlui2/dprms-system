import {
  giaCooperatingAgencyOptions,
  industryCategoryOptions,
  lineOfBusinessOptions,
  municipalityOptions,
  setupBusinessTypeOptions,
  setupTargetBeneficiaryOptions,
} from "../../../data/proposal";
import type {
  ProposalFieldName,
  ProposalFormData,
  ProposalFormErrors,
} from "../../../types/proposal";
import { InputField, SelectField } from "../FormFields";
import { ProposalSectionHeading } from "../ProposalSectionHeading";

interface ApplicantOrganizationStepProps {
  data: ProposalFormData;
  errors: ProposalFormErrors;
  onFieldChange: <K extends ProposalFieldName>(
    field: K,
    value: ProposalFormData[K],
  ) => void;
}

export function ApplicantOrganizationStep({
  data,
  errors,
  onFieldChange,
}: ApplicantOrganizationStepProps) {
  const isGia = data.proposalType === "GIA";

  return (
    <div className="space-y-7">
      <ProposalSectionHeading
        description={
          isGia
            ? "Saves the GIA applicant profile and implementing agency information."
            : "Saves the MSME profile and business information for DOST review."
        }
        divided={false}
        title={
          isGia
            ? "Applicant / Implementing Agency Form"
            : "Business Profile Form"
        }
      />

      {isGia ? (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <InputField
            autoComplete="name"
            error={errors.applicantFullName}
            id="applicantFullName"
            label="Project Leader Name"
            onChange={(event) =>
              onFieldChange("applicantFullName", event.target.value)
            }
            placeholder="e.g. Dr. Juan Dela Cruz"
            required
            value={data.applicantFullName}
          />
          <InputField
            autoComplete="email"
            error={errors.emailAddress}
            id="emailAddress"
            label="Email Address"
            onChange={(event) =>
              onFieldChange("emailAddress", event.target.value)
            }
            placeholder="project.leader@example.com"
            required
            type="email"
            value={data.emailAddress}
          />
          <InputField
            autoComplete="tel"
            error={errors.contactNumber}
            id="contactNumber"
            inputMode="tel"
            label="Contact Number"
            onChange={(event) =>
              onFieldChange("contactNumber", event.target.value)
            }
            placeholder="+63 9XX XXX XXXX"
            required
            value={data.contactNumber}
          />
          <InputField
            autoComplete="organization"
            error={errors.organizationName}
            id="organizationName"
            label="Implementing Agency"
            onChange={(event) =>
              onFieldChange("organizationName", event.target.value)
            }
            placeholder="e.g. Davao Oriental State University"
            required
            value={data.organizationName}
          />
          <SelectField
            error={errors.cooperatingAgency}
            id="cooperatingAgency"
            label="Cooperating Agency, if applicable"
            onChange={(event) =>
              onFieldChange("cooperatingAgency", event.target.value)
            }
            options={giaCooperatingAgencyOptions}
            placeholder="Select cooperating agency type"
            value={data.cooperatingAgency}
          />
          <InputField
            autoComplete="street-address"
            error={errors.businessAddress}
            id="businessAddress"
            label="Office Address"
            onChange={(event) =>
              onFieldChange("businessAddress", event.target.value)
            }
            placeholder="Office, campus, or agency address"
            required
            value={data.businessAddress}
          />
          <InputField
            error={errors.headOfAgency}
            id="headOfAgency"
            label="Head of Implementing Agency"
            onChange={(event) =>
              onFieldChange("headOfAgency", event.target.value)
            }
            placeholder="Agency head full name"
            required
            value={data.headOfAgency}
          />
          <InputField
            error={errors.authorizedRepresentative}
            id="authorizedRepresentative"
            label="Authorized Representative"
            onChange={(event) =>
              onFieldChange("authorizedRepresentative", event.target.value)
            }
            placeholder="Authorized representative full name"
            required
            value={data.authorizedRepresentative}
          />
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <InputField
            autoComplete="organization"
            error={errors.organizationName}
            id="organizationName"
            label="Business Name"
            onChange={(event) =>
              onFieldChange("organizationName", event.target.value)
            }
            placeholder="e.g. Mati Cacao Growers Co-op"
            required
            value={data.organizationName}
          />
          <InputField
            autoComplete="name"
            error={errors.applicantFullName}
            id="applicantFullName"
            label="Owner / Representative"
            onChange={(event) =>
              onFieldChange("applicantFullName", event.target.value)
            }
            placeholder="e.g. Juan Dela Cruz"
            required
            value={data.applicantFullName}
          />
          <InputField
            autoComplete="email"
            error={errors.emailAddress}
            id="emailAddress"
            label="Email Address"
            onChange={(event) =>
              onFieldChange("emailAddress", event.target.value)
            }
            placeholder="owner@example.com"
            required
            type="email"
            value={data.emailAddress}
          />
          <InputField
            autoComplete="tel"
            error={errors.contactNumber}
            id="contactNumber"
            inputMode="tel"
            label="Contact Number"
            onChange={(event) =>
              onFieldChange("contactNumber", event.target.value)
            }
            placeholder="+63 9XX XXX XXXX"
            required
            value={data.contactNumber}
          />
          <InputField
            autoComplete="street-address"
            error={errors.businessAddress}
            id="businessAddress"
            label="Business Address"
            onChange={(event) =>
              onFieldChange("businessAddress", event.target.value)
            }
            placeholder="Purok, Barangay, Municipality"
            required
            value={data.businessAddress}
          />
          <SelectField
            error={errors.municipality}
            id="municipality"
            label="Municipality"
            onChange={(event) =>
              onFieldChange("municipality", event.target.value)
            }
            options={municipalityOptions}
            placeholder="Select municipality"
            required
            value={data.municipality}
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
        </div>
      )}
    </div>
  );
}
