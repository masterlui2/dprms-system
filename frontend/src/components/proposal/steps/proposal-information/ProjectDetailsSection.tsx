/**
 * System: DPRMS
 * Purpose: Render project details section for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import
{
    GIA_PROJECT_TYPE_OPTIONS,
    GIA_TARGET_BENEFICIARY_OPTIONS,
    PROJECT_CATEGORY_OPTIONS,
    SETUP_PROJECT_TYPE_OPTIONS,
} from '../../../../data/proposal';
import type { ProposalFormData } from '../../../../types/proposal';
import { InputField, SelectField, TextAreaField } from '../../FormFields';
import { FormSection } from './FormSection';
import type { ProposalInformationSectionProps } from './types';

/** Render project details section and its available actions. */
export function ProjectDetailsSection({
    objData,
    objErrors,
    blnIsGia,
    onFieldChange,
}: ProposalInformationSectionProps)
{
    return (
        <FormSection
            txtDescription="Summarize the project clearly enough for DOST to understand the need, location, and expected result."
            title="Project Details"
        >
            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <InputField
                        strError={objErrors.projectTitle}
                        id="projectTitle"
                        strLabel="Project Title"
                        onChange={(objEvent) =>
                            onFieldChange('projectTitle', objEvent.target.value)
                        }
                        placeholder={
                            blnIsGia
                                ? 'e.g. Community Water Quality Monitoring Project'
                                : 'e.g. Cacao Processing Line Modernization'
                        }
                        required
                        value={objData.projectTitle}
                    />
                </div>
                {blnIsGia ? (
                    <>
                        <SelectField
                            strError={objErrors.projectCategory}
                            id="projectCategory"
                            strLabel="Project Category"
                            onChange={(objEvent) =>
                                onFieldChange(
                                    'projectCategory',
                                    objEvent.target.value as ProposalFormData['projectCategory'],
                                )
                            }
                            arrOptions={PROJECT_CATEGORY_OPTIONS}
                            placeholder="Select project category"
                            required
                            value={objData.projectCategory}
                        />
                        <SelectField
                            strError={objErrors.projectType}
                            id="projectType"
                            strLabel="Project Type"
                            onChange={(objEvent) =>
                                onFieldChange(
                                    'projectType',
                                    objEvent.target.value as ProposalFormData['projectType'],
                                )
                            }
                            arrOptions={GIA_PROJECT_TYPE_OPTIONS}
                            placeholder="Select project type"
                            required
                            value={objData.projectType}
                        />
                    </>
                ) : (
                    <SelectField
                        strError={objErrors.scopeOfAssistance}
                        id="scopeOfAssistance"
                        strLabel="Type of Assistance Needed"
                        onChange={(objEvent) =>
                            onFieldChange('scopeOfAssistance', objEvent.target.value)
                        }
                        arrOptions={SETUP_PROJECT_TYPE_OPTIONS}
                        placeholder="Select assistance type"
                        required
                        value={objData.scopeOfAssistance}
                    />
                )}
                <InputField
                    strError={objErrors.siteOfImplementation}
                    id="siteOfImplementation"
                    strLabel="Site of Implementation"
                    onChange={(objEvent) =>
                        onFieldChange('siteOfImplementation', objEvent.target.value)
                    }
                    placeholder="Barangay, municipality, province"
                    required
                    value={objData.siteOfImplementation}
                />

                <div className="sm:col-span-2">
                    <TextAreaField
                        strError={
                            blnIsGia
                                ? objErrors.projectDescription
                                : objErrors.currentOperationalProblem
                        }
                        strHelperText="Keep this brief. The detailed proposal document will be uploaded in the next step."
                        id={blnIsGia ? 'projectDescription' : 'currentOperationalProblem'}
                        strLabel={blnIsGia ? 'Project Summary / Need' : 'Business Problem or Need'}
                        maxLength={1400}
                        onChange={(objEvent) =>
                            onFieldChange(
                                blnIsGia ? 'projectDescription' : 'currentOperationalProblem',
                                objEvent.target.value,
                            )
                        }
                        placeholder={
                            blnIsGia
                                ? 'Describe the problem, opportunity, and communities or sectors that will benefit.'
                                : 'Describe the production, quality, capacity, or market problem to be addressed.'
                        }
                        required
                        rows={4}
                        value={
                            blnIsGia
                                ? objData.projectDescription
                                : objData.currentOperationalProblem
                        }
                    />
                </div>
                <div className="sm:col-span-2">
                    <TextAreaField
                        strError={objErrors.projectObjectives}
                        id="projectObjectives"
                        strLabel="Objectives"
                        maxLength={1200}
                        onChange={(objEvent) =>
                            onFieldChange('projectObjectives', objEvent.target.value)
                        }
                        placeholder="List the main objectives of the project."
                        required
                        rows={4}
                        value={objData.projectObjectives}
                    />
                </div>
                {blnIsGia ? (
                    <SelectField
                        strError={objErrors.targetBeneficiary}
                        id="targetBeneficiary"
                        strLabel="Target Beneficiaries"
                        onChange={(objEvent) =>
                            onFieldChange(
                                'targetBeneficiary',
                                objEvent.target.value as ProposalFormData['targetBeneficiary'],
                            )
                        }
                        arrOptions={GIA_TARGET_BENEFICIARY_OPTIONS}
                        placeholder="Select beneficiaries"
                        required
                        value={objData.targetBeneficiary}
                    />
                ) : (
                    <div className="sm:col-span-2">
                        <TextAreaField
                            strError={objErrors.proposedTechnologyAssistance}
                            id="proposedTechnologyAssistance"
                            strLabel="Technology or Equipment Requested"
                            maxLength={1200}
                            onChange={(objEvent) =>
                                onFieldChange('proposedTechnologyAssistance', objEvent.target.value)
                            }
                            placeholder="Describe the equipment, technology, or process improvement being requested."
                            required
                            rows={4}
                            value={objData.proposedTechnologyAssistance}
                        />
                    </div>
                )}
                <div className="sm:col-span-2">
                    <TextAreaField
                        strError={objErrors.expectedOutputs}
                        id="expectedOutputs"
                        strLabel={blnIsGia ? 'Expected Outputs' : 'Expected Results'}
                        maxLength={1200}
                        onChange={(objEvent) =>
                            onFieldChange('expectedOutputs', objEvent.target.value)
                        }
                        placeholder={
                            blnIsGia
                                ? 'Describe the outputs, deliverables, or public benefit.'
                                : 'Describe expected improvements in productivity, quality, sales, employment, or market access.'
                        }
                        required
                        rows={4}
                        value={objData.expectedOutputs}
                    />
                </div>
            </div>
        </FormSection>
    ); // end return
} /* end ProjectDetailsSection */
