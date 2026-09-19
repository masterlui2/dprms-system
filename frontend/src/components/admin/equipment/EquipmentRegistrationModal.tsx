/**
 * System: DPRMS
 * Purpose: Render equipment registration modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { AlertTriangle, LoaderCircle, PackagePlus, Plus } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { reportError } from '../../../utils/error_reporting';

import type { EquipmentRecord, Program } from '../../../data/admin';
import
{
    equipmentErrorMessage,
    registerEquipment,
    type EquipmentRegistrationOptions,
    type EquipmentRegistrationPayload,
} from '../../../services/equipment_store';
import { ModalShell } from '../ModalShell';
import { ProjectCombobox } from './ProjectCombobox';

interface Props
{
    onClose: () => void;
    onSaved: (objEquipment: EquipmentRecord, blnKeepOpen?: boolean) => void;
    objOptions: EquipmentRegistrationOptions;
    strProgram: Program;
}

type FormState = {
    acquisitionCost: string;
    brand: string;
    categoryId: string;
    condition: EquipmentRegistrationPayload['current_condition'];
    equipmentName: string;
    location: string;
    model: string;
    projectId: string;
    serialNumber: string;
    specifications: string;
    supplierName: string;
};

const FIELD_CLASS =
    'mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100';
const TEXTAREA_CLASS =
    'mt-1.5 min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0f53b7] focus:ring-4 focus:ring-blue-100';

/** Render field and its available actions. */
function Field({
    children: objChildren,
    strLabel,
    required: blnRequired = false,
}: {
    children: ReactNode;
    strLabel: string;
    required?: boolean;
})
{
    return (
        <label className="block text-sm font-bold text-slate-800">
            {strLabel} {blnRequired ? <span className="text-rose-600">*</span> : null}
            {objChildren}
        </label>
    );
}

/** Local date. */
function _localDate(): string
{
    const dtNow = new Date();
    const intOffset = dtNow.getTimezoneOffset() * 60_000;
    return new Date(dtNow.getTime() - intOffset).toISOString().slice(0, 10);
}

/** Render equipment registration modal and its available actions. */
export function EquipmentRegistrationModal({ onClose, onSaved, objOptions, strProgram }: Props)
{
    const arrProjects = useMemo(
        () => objOptions.projects.filter((objProject) => objProject.program_type === strProgram),
        [objOptions.projects, strProgram],
    );
    const [objForm, setObjForm] = useState<FormState>({
        acquisitionCost: '',
        brand: '',
        categoryId: '',
        condition: 'GOOD',
        equipmentName: '',
        location: '',
        model: '',
        projectId: '',
        serialNumber: '',
        specifications: '',
        supplierName: '',
    });
    const [strError, setStrError] = useState<string | null>(null);
    const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);
    const objEquipmentNameRef = useRef<HTMLInputElement>(null);

    /** Update. */
    function _update<K extends keyof FormState>(udtKey: K, objValue: FormState[K])
    {
        setObjForm((objCurrent) => ({ ...objCurrent, [udtKey]: objValue }));
    }

    /** Select project. */
    function _selectProject(strValue: string)
    {
        const objProject = arrProjects.find((objItem) => String(objItem.id) === strValue);
        setStrError(null);
        setObjForm((objCurrent) => ({
            ...objCurrent,
            projectId: strValue,
            location: objProject?.location || '',
        }));
    }

    /** Handle submit. */
    async function _handleSubmit(objEvent: FormEvent<HTMLFormElement>)
    {
        objEvent.preventDefault();
        const arrRequiredFields = [
            [objForm.projectId, 'active project'],
            [objForm.categoryId, 'equipment category'],
            [objForm.equipmentName.trim(), 'equipment name'],
            [objForm.serialNumber.trim(), 'serial number'],
            [objForm.brand.trim(), 'brand'],
            [objForm.model.trim(), 'model'],
            [objForm.acquisitionCost, 'procurement cost'],
            [objForm.supplierName.trim(), 'supplier'],
            [objForm.location.trim(), 'current location'],
        ] as const;
        const arrMissing = arrRequiredFields
            .filter(([strValue]) => !strValue)
            .map(([, strLabel]) => strLabel);
        if (arrMissing.length > 0)
        {
            setStrError(`Complete the required fields: ${arrMissing.join(', ')}.`);
            return;
        }
        if (
            !Number.isFinite(Number(objForm.acquisitionCost)) ||
            Number(objForm.acquisitionCost) < 0
        )
        {
            setStrError('Enter a valid procurement cost of 0 or greater.');
            return;
        }
        const objSubmitter = (objEvent.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
        const blnKeepOpen = objSubmitter?.value === 'add-another';
        setStrError(null);
        setBlnIsSubmitting(true);

        try
        {
            const objSaved = await registerEquipment({
                acquisition_cost: Number(objForm.acquisitionCost),
                acquisition_date: _localDate(),
                brand: objForm.brand.trim(),
                category_id: Number(objForm.categoryId),
                current_condition: objForm.condition,
                equipment_name: objForm.equipmentName.trim(),
                location: objForm.location.trim(),
                model: objForm.model.trim(),
                program_type: strProgram,
                project_id: Number(objForm.projectId),
                serial_number: objForm.serialNumber.trim(),
                specifications: objForm.specifications.trim() || undefined,
                supplier_name: objForm.supplierName.trim(),
                unit: 'unit',
            });
            onSaved(objSaved, blnKeepOpen);

            if (blnKeepOpen)
            {
                setObjForm((objCurrent) => ({
                    ...objCurrent,
                    acquisitionCost: '',
                    brand: '',
                    equipmentName: '',
                    model: '',
                    serialNumber: '',
                    specifications: '',
                }));
                setBlnIsSubmitting(false);
                window.requestAnimationFrame(() => objEquipmentNameRef.current?.focus());
            }
        } /* end try */ catch (errSubmitError)
        {
            reportError(errSubmitError, 'EquipmentRegistrationModal: handle submit failed.');

            setStrError(equipmentErrorMessage(errSubmitError));
            setBlnIsSubmitting(false);
        }
    } /* end _handleSubmit */

    const blnUnavailable = arrProjects.length === 0 || objOptions.categories.length === 0;

    return (
        <ModalShell
            txtDescription={`Add equipment to the ${strProgram} inventory and generate its QR code.`}
            objFooter={
                <div className="flex flex-col gap-3">
                    {strError ? (
                        <p
                            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800"
                            role="alert"
                        >
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            {strError}
                        </p>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Registration date and asset number are generated automatically.
                        </p>
                    )}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <button
                            className="h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100"
                            disabled={blnIsSubmitting}
                            onClick={onClose}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#0f53b7] bg-white px-4 text-sm font-bold text-[#0f53b7] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={blnIsSubmitting || blnUnavailable}
                            form="equipment-registration-form"
                            name="registration-action"
                            type="submit"
                            value="add-another"
                        >
                            <Plus className="size-4" />
                            Save &amp; add another
                        </button>
                        <button
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f53b7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0b3f8b] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={blnIsSubmitting || blnUnavailable}
                            form="equipment-registration-form"
                            name="registration-action"
                            type="submit"
                            value="finish"
                        >
                            {blnIsSubmitting ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <PackagePlus className="size-4" />
                            )}
                            {blnIsSubmitting ? 'Registering…' : 'Register & finish'}
                        </button>
                    </div>
                </div>
            }
            onClose={onClose}
            title="Register Equipment"
            strWidth="lg"
        >
            <form
                className="space-y-6"
                id="equipment-registration-form"
                noValidate
                onSubmit={(objEvent) => void _handleSubmit(objEvent)}
            >
                <section>
                    <h3 className="text-sm font-black text-slate-900">Assignment</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <Field strLabel="Active project" required>
                            <ProjectCombobox
                                onChange={_selectProject}
                                placeholder={`Search and select a ${strProgram} project`}
                                arrProjects={arrProjects}
                                value={objForm.projectId}
                            />
                        </Field>
                        <Field strLabel="Equipment category" required>
                            <select
                                className={FIELD_CLASS}
                                onChange={(objEvent) =>
                                    _update('categoryId', objEvent.target.value)
                                }
                                required
                                value={objForm.categoryId}
                            >
                                <option value="">Select category</option>
                                {objOptions.categories.map((objCategory) => (
                                    <option key={objCategory.id} value={objCategory.id}>
                                        {objCategory.category_name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    {blnUnavailable ? (
                        <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                            <AlertTriangle className="size-4 shrink-0" />
                            {arrProjects.length === 0
                                ? `No active ${strProgram} projects are available for registration.`
                                : 'No equipment categories are available.'}
                        </p>
                    ) : null}
                </section>

                <section className="border-t border-slate-200 pt-5">
                    <h3 className="text-sm font-black text-slate-900">Equipment identity</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <Field strLabel="Equipment name" required>
                            <input
                                className={FIELD_CLASS}
                                onChange={(objEvent) =>
                                    _update('equipmentName', objEvent.target.value)
                                }
                                placeholder="e.g. Vacuum Packaging Machine"
                                ref={objEquipmentNameRef}
                                required
                                value={objForm.equipmentName}
                            />
                        </Field>
                        <Field strLabel="Serial number" required>
                            <input
                                className={FIELD_CLASS}
                                onChange={(objEvent) =>
                                    _update('serialNumber', objEvent.target.value)
                                }
                                placeholder="Manufacturer serial number"
                                required
                                value={objForm.serialNumber}
                            />
                        </Field>
                        <Field strLabel="Brand" required>
                            <input
                                className={FIELD_CLASS}
                                onChange={(objEvent) => _update('brand', objEvent.target.value)}
                                placeholder="Manufacturer or brand"
                                required
                                value={objForm.brand}
                            />
                        </Field>
                        <Field strLabel="Model" required>
                            <input
                                className={FIELD_CLASS}
                                onChange={(objEvent) => _update('model', objEvent.target.value)}
                                placeholder="Model name or number"
                                required
                                value={objForm.model}
                            />
                        </Field>
                    </div>
                </section>

                <section className="border-t border-slate-200 pt-5">
                    <h3 className="text-sm font-black text-slate-900">Cost and assignment</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <Field strLabel="Procurement cost" required>
                            <input
                                className={FIELD_CLASS}
                                min="0"
                                onChange={(objEvent) =>
                                    _update('acquisitionCost', objEvent.target.value)
                                }
                                placeholder="0.00"
                                required
                                step="0.01"
                                type="number"
                                value={objForm.acquisitionCost}
                            />
                        </Field>
                        <Field strLabel="Supplier" required>
                            <input
                                className={FIELD_CLASS}
                                onChange={(objEvent) =>
                                    _update('supplierName', objEvent.target.value)
                                }
                                placeholder="Supplier or vendor"
                                required
                                value={objForm.supplierName}
                            />
                        </Field>
                        <Field strLabel="Current location" required>
                            <input
                                className={FIELD_CLASS}
                                onChange={(objEvent) => _update('location', objEvent.target.value)}
                                placeholder="Installation or site address"
                                required
                                value={objForm.location}
                            />
                        </Field>
                        <Field strLabel="Initial condition" required>
                            <select
                                className={FIELD_CLASS}
                                onChange={(objEvent) =>
                                    _update(
                                        'condition',
                                        objEvent.target.value as FormState['condition'],
                                    )
                                }
                                value={objForm.condition}
                            >
                                <option value="GOOD">Good</option>
                                <option value="FAIR">Fair</option>
                                <option value="POOR">Poor</option>
                                <option value="NON_FUNCTIONAL">Non-functional</option>
                            </select>
                        </Field>
                    </div>
                </section>

                <section className="border-t border-slate-200 pt-5">
                    <Field strLabel="Technical specifications (optional)">
                        <textarea
                            className={TEXTAREA_CLASS}
                            maxLength={3000}
                            onChange={(objEvent) =>
                                _update('specifications', objEvent.target.value)
                            }
                            placeholder="Capacity, dimensions, power requirements, or other useful specifications"
                            value={objForm.specifications}
                        />
                    </Field>
                </section>
            </form>
        </ModalShell>
    ); // end return
} /* end EquipmentRegistrationModal */
