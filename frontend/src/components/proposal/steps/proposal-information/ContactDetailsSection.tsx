/**
 * System: DPRMS
 * Purpose: Render contact details section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { InputField } from '../../FormFields';
import { FormSection } from './FormSection';
import type { ProposalInformationSectionProps } from './types';

/** Render contact details section and its available actions. */
export function ContactDetailsSection({
    objData,
    objErrors,
    blnIsGia,
    onFieldChange,
}: ProposalInformationSectionProps)
{
    return (
        <FormSection
            txtDescription={
                blnIsGia
                    ? 'Provide the project leader or authorized contact for this GIA proposal.'
                    : 'Provide the business owner or authorized representative DOST can contact.'
            }
            title="Contact Details"
        >
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <InputField
                    autoComplete="name"
                    strError={objErrors.applicantFullName}
                    id="applicantFullName"
                    strLabel={
                        blnIsGia ? 'Project Leader / Contact Person' : 'Owner / Representative'
                    }
                    onChange={(objEvent) =>
                        onFieldChange('applicantFullName', objEvent.target.value)
                    }
                    placeholder={blnIsGia ? 'e.g. Dr. Juan Dela Cruz' : 'e.g. Juan Dela Cruz'}
                    required
                    value={objData.applicantFullName}
                />
                <InputField
                    strError={objErrors.applicantPosition}
                    id="applicantPosition"
                    strLabel="Position / Designation"
                    onChange={(objEvent) =>
                        onFieldChange('applicantPosition', objEvent.target.value)
                    }
                    placeholder={blnIsGia ? 'e.g. Project Leader' : 'e.g. Owner'}
                    required
                    value={objData.applicantPosition}
                />
                <InputField
                    autoComplete="email"
                    strError={objErrors.emailAddress}
                    strHelperText="DOST will send submission updates to this email."
                    id="emailAddress"
                    strLabel="Email Address"
                    onChange={(objEvent) => onFieldChange('emailAddress', objEvent.target.value)}
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={objData.emailAddress}
                />
                <InputField
                    autoComplete="tel"
                    strError={objErrors.contactNumber}
                    strHelperText="Use a Philippine mobile or landline number."
                    id="contactNumber"
                    inputMode="tel"
                    strLabel="Contact Number"
                    onChange={(objEvent) => onFieldChange('contactNumber', objEvent.target.value)}
                    placeholder="09171234567"
                    required
                    value={objData.contactNumber}
                />
            </div>
        </FormSection>
    ); // end return
} /* end ContactDetailsSection */
