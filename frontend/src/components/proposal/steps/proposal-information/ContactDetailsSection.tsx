import { InputField } from "../../FormFields";
import { FormSection } from "./FormSection";
import type { ProposalInformationSectionProps } from "./types";

export function ContactDetailsSection({
  data,
  errors,
  isGia,
  onFieldChange,
}: ProposalInformationSectionProps) {
  return (
    <FormSection
      description={
        isGia
          ? "Provide the project leader or authorized contact for this GIA proposal."
          : "Provide the business owner or authorized representative DOST can contact."
      }
      title="Contact Details"
    >
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <InputField
          autoComplete="name"
          error={errors.applicantFullName}
          id="applicantFullName"
          label={
            isGia ? "Project Leader / Contact Person" : "Owner / Representative"
          }
          onChange={(event) =>
            onFieldChange("applicantFullName", event.target.value)
          }
          placeholder={isGia ? "e.g. Dr. Juan Dela Cruz" : "e.g. Juan Dela Cruz"}
          required
          value={data.applicantFullName}
        />
        <InputField
          error={errors.applicantPosition}
          id="applicantPosition"
          label="Position / Designation"
          onChange={(event) =>
            onFieldChange("applicantPosition", event.target.value)
          }
          placeholder={isGia ? "e.g. Project Leader" : "e.g. Owner"}
          required
          value={data.applicantPosition}
        />
        <InputField
          autoComplete="email"
          error={errors.emailAddress}
          helperText="DOST will send submission updates to this email."
          id="emailAddress"
          label="Email Address"
          onChange={(event) =>
            onFieldChange("emailAddress", event.target.value)
          }
          placeholder="name@example.com"
          required
          type="email"
          value={data.emailAddress}
        />
        <InputField
          autoComplete="tel"
          error={errors.contactNumber}
          helperText="Use a Philippine mobile or landline number."
          id="contactNumber"
          inputMode="tel"
          label="Contact Number"
          onChange={(event) =>
            onFieldChange("contactNumber", event.target.value)
          }
          placeholder="09171234567"
          required
          value={data.contactNumber}
        />
      </div>
    </FormSection>
  );
}
