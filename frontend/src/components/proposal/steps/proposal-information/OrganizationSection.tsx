/**
 * System: DPRMS
 * Purpose: Render organization section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    INDUSTRY_CATEGORY_OPTIONS,
    LINE_OF_BUSINESS_OPTIONS,
    MUNICIPALITY_OPTIONS,
    ORGANIZATION_TYPE_OPTIONS,
    SETUP_BUSINESS_TYPE_OPTIONS,
    SETUP_TARGET_BENEFICIARY_OPTIONS,
} from '../../../../data/proposal';
import { InputField, SelectField } from '../../FormFields';
import { FormSection } from './FormSection';
import type { ProposalInformationSectionProps } from './types';

/** Render organization section and its available actions. */
export function OrganizationSection({
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
                    ? 'Identify the implementing agency or organization submitting the project.'
                    : 'Tell DOST which business is requesting assistance.'
            }
            title={blnIsGia ? 'Implementing Agency' : 'Business Profile'}
        >
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <InputField
                    autoComplete="organization"
                    strError={objErrors.organizationName}
                    id="organizationName"
                    strLabel={blnIsGia ? 'Implementing Agency / Organization' : 'Business Name'}
                    onChange={(objEvent) =>
                        onFieldChange('organizationName', objEvent.target.value)
                    }
                    placeholder={
                        blnIsGia
                            ? 'e.g. Davao Oriental State University'
                            : 'e.g. Mati Cacao Growers Co-op'
                    }
                    required
                    value={objData.organizationName}
                />
                {blnIsGia ? (
                    <SelectField
                        strError={objErrors.organizationType}
                        id="organizationType"
                        strLabel="Organization Type"
                        onChange={(objEvent) =>
                            onFieldChange('organizationType', objEvent.target.value)
                        }
                        arrOptions={ORGANIZATION_TYPE_OPTIONS}
                        placeholder="Select organization type"
                        required
                        value={objData.organizationType}
                    />
                ) : (
                    <SelectField
                        strError={objErrors.businessType}
                        id="businessType"
                        strLabel="Business Type"
                        onChange={(objEvent) =>
                            onFieldChange('businessType', objEvent.target.value)
                        }
                        arrOptions={SETUP_BUSINESS_TYPE_OPTIONS}
                        placeholder="Select business type"
                        required
                        value={objData.businessType}
                    />
                )}
                <InputField
                    autoComplete="street-address"
                    strError={objErrors.businessAddress}
                    id="businessAddress"
                    strLabel={blnIsGia ? 'Office Address' : 'Business Address'}
                    onChange={(objEvent) => onFieldChange('businessAddress', objEvent.target.value)}
                    placeholder="Street, barangay, municipality"
                    required
                    value={objData.businessAddress}
                />
                <SelectField
                    strError={objErrors.municipality}
                    id="municipality"
                    strLabel="Municipality / City"
                    onChange={(objEvent) => onFieldChange('municipality', objEvent.target.value)}
                    arrOptions={MUNICIPALITY_OPTIONS}
                    placeholder="Select municipality or city"
                    required
                    value={objData.municipality}
                />
                {blnIsGia ? null : (
                    <>
                        <SelectField
                            strError={objErrors.lineOfBusiness}
                            id="lineOfBusiness"
                            strLabel="Line of Business"
                            onChange={(objEvent) =>
                                onFieldChange('lineOfBusiness', objEvent.target.value)
                            }
                            arrOptions={LINE_OF_BUSINESS_OPTIONS}
                            placeholder="Select line of business"
                            required
                            value={objData.lineOfBusiness}
                        />
                        <SelectField
                            strError={objErrors.enterpriseSize}
                            id="enterpriseSize"
                            strLabel="Enterprise Size"
                            onChange={(objEvent) =>
                                onFieldChange('enterpriseSize', objEvent.target.value)
                            }
                            arrOptions={SETUP_TARGET_BENEFICIARY_OPTIONS}
                            placeholder="Select enterprise size"
                            required
                            value={objData.enterpriseSize}
                        />
                        <SelectField
                            strError={objErrors.industryCategory}
                            id="industryCategory"
                            strLabel="Industry Sector"
                            onChange={(objEvent) =>
                                onFieldChange('industryCategory', objEvent.target.value)
                            }
                            arrOptions={INDUSTRY_CATEGORY_OPTIONS}
                            placeholder="Select industry sector"
                            required
                            value={objData.industryCategory}
                        />
                        <InputField
                            strError={objErrors.yearEstablished}
                            id="yearEstablished"
                            inputMode="numeric"
                            strLabel="Years in Operation"
                            min="0"
                            onChange={(objEvent) =>
                                onFieldChange('yearEstablished', objEvent.target.value)
                            }
                            placeholder="e.g. 5"
                            required
                            type="number"
                            value={objData.yearEstablished}
                        />
                    </>
                )}
            </div>
        </FormSection>
    ); // end return
} /* end OrganizationSection */
