/**
 * System: DPRMS
 * Purpose: Render tech intervention tab for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { Award, BookOpen, Briefcase, Copy, Layers, Plus, TestTube, Trash2 } from 'lucide-react';
import type {
    ConsultancyItem,
    OtherDostProjectItem,
    SetupMonitoringQuarterRecord,
    SupportServiceItem,
    TechTransferItem,
    TrainingItem,
} from '../../../types/setup_monitoring';
import { quarterStartIsoDate } from '../../../utils/monitoring_date';

interface Props
{
    objRecord: SetupMonitoringQuarterRecord;
    onChange: (objRecord: SetupMonitoringQuarterRecord) => void;
    blnReadOnly?: boolean;
}

/** Render tech intervention tab and its available actions. */
export function TechInterventionTab({ objRecord, onChange, blnReadOnly = false }: Props)
{
    const strDefaultInterventionDate = quarterStartIsoDate(objRecord.year, objRecord.quarter);

    // 1. Consultancies
    const _handleUpdateConsultancy = (
        strId: string,
        strField: keyof ConsultancyItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.consultancies.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            return { ...objItem, [strField]: objValue };
        });
        onChange({ ...objRecord, consultancies: arrUpdated });
    };

    /** Handle add consultancy. */
    const _handleAddConsultancy = () =>
    {
        const objNewItem: ConsultancyItem = {
            id: 'cons_' + Date.now(),
            serviceName: 'Packaging and Labelling Assistance',
            availed: true,
            areaOfIntervention: 'Brand Design & Shelf-life Analysis',
            date: strDefaultInterventionDate,
        };
        onChange({ ...objRecord, consultancies: [...objRecord.consultancies, objNewItem] });
    };

    /** Handle duplicate consultancy. */
    const _handleDuplicateConsultancy = (strId: string) =>
    {
        const objTarget = objRecord.consultancies.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: ConsultancyItem = {
            ...objTarget,
            id: 'cons_' + Date.now(),
            serviceName: `${objTarget.serviceName} (Copy)`,
        };
        const intIndex = objRecord.consultancies.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.consultancies];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, consultancies: arrNewItems });
    };

    /** Handle remove consultancy. */
    const _handleRemoveConsultancy = (strId: string) =>
    {
        onChange({
            ...objRecord,
            consultancies: objRecord.consultancies.filter((objItem) => objItem.id !== strId),
        });
    };

    // 2. Trainings
    const _handleUpdateTraining = (strId: string, strField: keyof TrainingItem, objValue: any) =>
    {
        const arrUpdated = objRecord.trainings.map((objT) =>
        {
            if (objT.id !== strId)
            {
                return objT;
            }
            return { ...objT, [strField]: objValue };
        });
        onChange({ ...objRecord, trainings: arrUpdated });
    };

    /** Handle add training. */
    const _handleAddTraining = () =>
    {
        const objNewItem: TrainingItem = {
            id: 'tr_' + Date.now(),
            category: 'DOST',
            trainingName: 'Food Safety & GMP Seminar',
            date: strDefaultInterventionDate,
        };
        onChange({ ...objRecord, trainings: [...objRecord.trainings, objNewItem] });
    };

    /** Handle duplicate training. */
    const _handleDuplicateTraining = (strId: string) =>
    {
        const objTarget = objRecord.trainings.find((objT) => objT.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: TrainingItem = {
            ...objTarget,
            id: 'tr_' + Date.now(),
            trainingName: `${objTarget.trainingName} (Copy)`,
        };
        const intIndex = objRecord.trainings.findIndex((objT) => objT.id === strId);
        const arrNewItems = [...objRecord.trainings];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, trainings: arrNewItems });
    };

    /** Handle remove training. */
    const _handleRemoveTraining = (strId: string) =>
    {
        onChange({
            ...objRecord,
            trainings: objRecord.trainings.filter((objT) => objT.id !== strId),
        });
    };

    // 3. Tech Transfers
    const _handleUpdateTechTransfer = (
        strId: string,
        strField: keyof TechTransferItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.techTransfers.map((objTt) =>
        {
            if (objTt.id !== strId)
            {
                return objTt;
            }
            return { ...objTt, [strField]: objValue };
        });
        onChange({ ...objRecord, techTransfers: arrUpdated });
    };

    /** Handle add tech transfer. */
    const _handleAddTechTransfer = () =>
    {
        const objNewItem: TechTransferItem = {
            id: 'tt_' + Date.now(),
            type: 'EQUIPMENT',
            details: 'Automated Bottling & Sealing Machine',
            date: strDefaultInterventionDate,
        };
        onChange({ ...objRecord, techTransfers: [...objRecord.techTransfers, objNewItem] });
    };

    /** Handle duplicate tech transfer. */
    const _handleDuplicateTechTransfer = (strId: string) =>
    {
        const objTarget = objRecord.techTransfers.find((objTt) => objTt.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: TechTransferItem = {
            ...objTarget,
            id: 'tt_' + Date.now(),
            details: `${objTarget.details} (Copy)`,
        };
        const intIndex = objRecord.techTransfers.findIndex((objTt) => objTt.id === strId);
        const arrNewItems = [...objRecord.techTransfers];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, techTransfers: arrNewItems });
    };

    /** Handle remove tech transfer. */
    const _handleRemoveTechTransfer = (strId: string) =>
    {
        onChange({
            ...objRecord,
            techTransfers: objRecord.techTransfers.filter((objTt) => objTt.id !== strId),
        });
    };

    // 4. Support Services (Testing & Calibration)
    const _handleUpdateSupport = (
        strId: string,
        strField: keyof SupportServiceItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.supportServices.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            return { ...objItem, [strField]: objValue };
        });
        onChange({ ...objRecord, supportServices: arrUpdated });
    };

    /** Handle add support. */
    const _handleAddSupport = () =>
    {
        const objNewItem: SupportServiceItem = {
            id: 'sup_srv_' + Date.now(),
            type: 'Microbiology',
            productTestedParameters: 'E. coli, Coliform, Yeast & Mold Count',
            date: strDefaultInterventionDate,
        };
        onChange({ ...objRecord, supportServices: [...objRecord.supportServices, objNewItem] });
    };

    /** Handle duplicate support. */
    const _handleDuplicateSupport = (strId: string) =>
    {
        const objTarget = objRecord.supportServices.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: SupportServiceItem = {
            ...objTarget,
            id: 'sup_srv_' + Date.now(),
            productTestedParameters: `${objTarget.productTestedParameters} (Copy)`,
        };
        const intIndex = objRecord.supportServices.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.supportServices];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, supportServices: arrNewItems });
    };

    /** Handle remove support. */
    const _handleRemoveSupport = (strId: string) =>
    {
        onChange({
            ...objRecord,
            supportServices: objRecord.supportServices.filter((objItem) => objItem.id !== strId),
        });
    };

    // 5. Other Projects
    const _handleUpdateOtherProject = (
        strId: string,
        strField: keyof OtherDostProjectItem,
        objValue: any,
    ) =>
    {
        const arrUpdated = objRecord.otherProjects.map((objItem) =>
        {
            if (objItem.id !== strId)
            {
                return objItem;
            }
            return { ...objItem, [strField]: objValue };
        });
        onChange({ ...objRecord, otherProjects: arrUpdated });
    };

    /** Handle add other project. */
    const _handleAddOtherProject = () =>
    {
        const objNewItem: OtherDostProjectItem = {
            id: 'oth_' + Date.now(),
            projectTitle: 'OneSTore Hub E-Commerce Onboarding',
            date: strDefaultInterventionDate,
        };
        onChange({ ...objRecord, otherProjects: [...objRecord.otherProjects, objNewItem] });
    };

    /** Handle duplicate other project. */
    const _handleDuplicateOtherProject = (strId: string) =>
    {
        const objTarget = objRecord.otherProjects.find((objItem) => objItem.id === strId);
        if (!objTarget)
        {
            return;
        }
        const objDup: OtherDostProjectItem = {
            ...objTarget,
            id: 'oth_' + Date.now(),
            projectTitle: `${objTarget.projectTitle} (Copy)`,
        };
        const intIndex = objRecord.otherProjects.findIndex((objItem) => objItem.id === strId);
        const arrNewItems = [...objRecord.otherProjects];
        arrNewItems.splice(intIndex + 1, 0, objDup);
        onChange({ ...objRecord, otherProjects: arrNewItems });
    };

    /** Handle remove other project. */
    const _handleRemoveOtherProject = (strId: string) =>
    {
        onChange({
            ...objRecord,
            otherProjects: objRecord.otherProjects.filter((objItem) => objItem.id !== strId),
        });
    };

    return (
        <div className="space-y-8 font-sans">
            {/* 1. CONSULTANCY SERVICES (EXCEL PAGE 7) */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Briefcase className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                SUMMARY OF INTERVENTION — CONSULTANCY SERVICES
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                MPEX, CPT, Energy Audit, Plant Layout (FS), GMP Assessment, In-House
                                GMP Training, Packaging & Labelling
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddConsultancy}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                        >
                            <Plus className="size-3.5 text-[#285497]" />
                            <span>Add Row</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                            <tr>
                                <th className="py-3 px-3 w-1/3">
                                    Particulars (Consultancy Services)
                                </th>
                                <th className="py-3 px-2 text-center w-24">Availed?</th>
                                <th className="py-3 px-2">Area/s of Intervention</th>
                                <th className="py-3 px-2 w-36">Date</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.consultancies.map((objItem) => (
                                <tr
                                    key={objItem.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objItem.serviceName}
                                            onChange={(objEvent) =>
                                                _handleUpdateConsultancy(
                                                    objItem.id,
                                                    'serviceName',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1 text-center">
                                        <input
                                            type="checkbox"
                                            checked={objItem.availed}
                                            onChange={(objEvent) =>
                                                _handleUpdateConsultancy(
                                                    objItem.id,
                                                    'availed',
                                                    objEvent.target.checked,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="size-4 rounded border-[#B5BFCD] text-[#285497] focus:ring-[#285497]"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={objItem.areaOfIntervention}
                                            onChange={(objEvent) =>
                                                _handleUpdateConsultancy(
                                                    objItem.id,
                                                    'areaOfIntervention',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="date"
                                            value={objItem.date}
                                            onChange={(objEvent) =>
                                                _handleUpdateConsultancy(
                                                    objItem.id,
                                                    'date',
                                                    objEvent.target.value,
                                                )
                                            }
                                            required
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateConsultancy(objItem.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleRemoveConsultancy(objItem.id)
                                                    }
                                                    title="Delete row"
                                                    className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. TRAININGS / SEMINARS CONDUCTED */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <BookOpen className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                SUMMARY OF INTERVENTION — TRAININGS / SEMINARS
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Workforce capacity building, food safety certifications, equipment
                                operation trainings
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddTraining}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                        >
                            <Plus className="size-3.5 text-[#285497]" />
                            <span>Add Row</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                            <tr>
                                <th className="py-3 px-3 w-1/4">Category</th>
                                <th className="py-3 px-2">Training / Seminar Title</th>
                                <th className="py-3 px-2 w-36">Date</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.trainings.map((objT) => (
                                <tr
                                    key={objT.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-1">
                                        <select
                                            value={objT.category}
                                            onChange={(objEvent) =>
                                                _handleUpdateTraining(
                                                    objT.id,
                                                    'category',
                                                    objEvent.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="DOST">DOST</option>
                                            <option value="RDI">RDI</option>
                                            <option value="FPIC">FPIC</option>
                                            <option value="OTHER">OTHER</option>
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objT.trainingName}
                                            onChange={(objEvent) =>
                                                _handleUpdateTraining(
                                                    objT.id,
                                                    'trainingName',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="date"
                                            value={objT.date}
                                            onChange={(objEvent) =>
                                                _handleUpdateTraining(
                                                    objT.id,
                                                    'date',
                                                    objEvent.target.value,
                                                )
                                            }
                                            required
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateTraining(objT.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => _handleRemoveTraining(objT.id)}
                                                    title="Delete row"
                                                    className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. TECHNOLOGY TRANSFER */}
            <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-[#285497] px-6 py-4 text-white">
                    <div className="flex items-center gap-2.5">
                        <Award className="size-5 text-white" />
                        <div>
                            <h3 className="text-base font-bold tracking-wide text-white">
                                SUMMARY OF INTERVENTION — TECHNOLOGY TRANSFER
                            </h3>
                            <p className="text-xs text-blue-100 font-normal">
                                Adopted DOST technologies, specialized machinery, or process
                                commercialization
                            </p>
                        </div>
                    </div>
                    {!blnReadOnly && (
                        <button
                            type="button"
                            onClick={_handleAddTechTransfer}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                        >
                            <Plus className="size-3.5 text-[#285497]" />
                            <span>Add Row</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#E6EEF4] border-b border-[#B5BFCD]/80 text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                            <tr>
                                <th className="py-3 px-3 w-1/4">Type</th>
                                <th className="py-3 px-2">Details / Specifics</th>
                                <th className="py-3 px-2 w-36">Date</th>
                                {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#B5BFCD]/30 text-slate-800">
                            {objRecord.techTransfers.map((objTt) => (
                                <tr
                                    key={objTt.id}
                                    className="hover:bg-[#E6EEF4]/30 transition group"
                                >
                                    <td className="p-1">
                                        <select
                                            value={objTt.type}
                                            onChange={(objEvent) =>
                                                _handleUpdateTechTransfer(
                                                    objTt.id,
                                                    'type',
                                                    objEvent.target.value as any,
                                                )
                                            }
                                            disabled={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1.5 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        >
                                            <option value="TNA">TNA</option>
                                            <option value="EQUIPMENT">EQUIPMENT</option>
                                            <option value="PRODUCTS_DEVELOPED">
                                                PRODUCTS DEVELOPED
                                            </option>
                                            <option value="OTHER">OTHER</option>
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={objTt.details}
                                            onChange={(objEvent) =>
                                                _handleUpdateTechTransfer(
                                                    objTt.id,
                                                    'details',
                                                    objEvent.target.value,
                                                )
                                            }
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    <td className="p-1">
                                        <input
                                            type="date"
                                            value={objTt.date}
                                            onChange={(objEvent) =>
                                                _handleUpdateTechTransfer(
                                                    objTt.id,
                                                    'date',
                                                    objEvent.target.value,
                                                )
                                            }
                                            required
                                            readOnly={blnReadOnly}
                                            className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 text-xs font-normal text-slate-700 focus:border-[#285497] focus:outline-none"
                                        />
                                    </td>
                                    {!blnReadOnly && (
                                        <td className="p-1 text-right w-14">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleDuplicateTechTransfer(objTt.id)
                                                    }
                                                    title="Duplicate row"
                                                    className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                >
                                                    <Copy className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        _handleRemoveTechTransfer(objTt.id)
                                                    }
                                                    title="Delete row"
                                                    className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. SUPPORT SERVICES (TESTING & CALIBRATION) & 5. OTHER PROJECTS */}
            <div className="grid gap-6 lg:grid-cols-2 items-start">
                {/* Testing and Calibration Services */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                    <div>
                        <div className="flex items-center justify-between bg-[#285497] px-5 py-3.5 text-white">
                            <div className="flex items-center gap-2">
                                <TestTube className="size-4.5 text-white" />
                                <h4 className="text-sm font-bold tracking-wide text-white">
                                    TESTING & CALIBRATION SERVICES
                                </h4>
                            </div>
                            {!blnReadOnly && (
                                <button
                                    type="button"
                                    onClick={_handleAddSupport}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                                >
                                    <Plus className="size-3.5 text-[#285497]" />
                                    <span>Add Row</span>
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                                    <tr>
                                        <th className="py-3 px-2 w-28">Type</th>
                                        <th className="py-3 px-3">Product / Parameters</th>
                                        <th className="py-3 px-2 w-32">Date</th>
                                        {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5BFCD]/30">
                                    {objRecord.supportServices.map((objItem) => (
                                        <tr
                                            key={objItem.id}
                                            className="hover:bg-[#E6EEF4]/30 transition group"
                                        >
                                            <td className="p-1">
                                                <select
                                                    value={objItem.type}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateSupport(
                                                            objItem.id,
                                                            'type',
                                                            objEvent.target.value as any,
                                                        )
                                                    }
                                                    disabled={blnReadOnly}
                                                    className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-1 text-xs font-normal text-slate-800 focus:border-[#285497] focus:outline-none"
                                                >
                                                    <option value="Microbiology">
                                                        Microbiology
                                                    </option>
                                                    <option value="Chemical">Chemical</option>
                                                    <option value="Calibration">Calibration</option>
                                                    <option value="Shelf Life">Shelf Life</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={objItem.productTestedParameters}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateSupport(
                                                            objItem.id,
                                                            'productTestedParameters',
                                                            objEvent.target.value,
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="date"
                                                    value={objItem.date}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateSupport(
                                                            objItem.id,
                                                            'date',
                                                            objEvent.target.value,
                                                        )
                                                    }
                                                    required
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-700 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            {!blnReadOnly && (
                                                <td className="p-1 text-right w-14">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleDuplicateSupport(objItem.id)
                                                            }
                                                            title="Duplicate row"
                                                            className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                        >
                                                            <Copy className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleRemoveSupport(objItem.id)
                                                            }
                                                            title="Delete row"
                                                            className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Other Projects */}
                <div className="rounded-2xl border border-[#B5BFCD]/80 bg-white shadow-sm overflow-hidden">
                    <div>
                        <div className="flex items-center justify-between bg-[#285497] px-5 py-3.5 text-white">
                            <div className="flex items-center gap-2">
                                <Layers className="size-4.5 text-white" />
                                <h4 className="text-sm font-bold tracking-wide text-white">
                                    OTHER PROJECTS / INTERVENTIONS
                                </h4>
                            </div>
                            {!blnReadOnly && (
                                <button
                                    type="button"
                                    onClick={_handleAddOtherProject}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-[#285497] shadow-sm transition hover:bg-[#E6EEF4] active:scale-95"
                                >
                                    <Plus className="size-3.5 text-[#285497]" />
                                    <span>Add Row</span>
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white border-b border-[#B5BFCD] text-[11px] font-bold uppercase tracking-wider text-[#285497]">
                                    <tr>
                                        <th className="py-3 px-3">Project Title</th>
                                        <th className="py-3 px-2 w-32">Date</th>
                                        {!blnReadOnly && <th className="py-3 px-2 w-14"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#B5BFCD]/30">
                                    {objRecord.otherProjects.map((objItem) => (
                                        <tr
                                            key={objItem.id}
                                            className="hover:bg-[#E6EEF4]/30 transition group"
                                        >
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={objItem.projectTitle}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateOtherProject(
                                                            objItem.id,
                                                            'projectTitle',
                                                            objEvent.target.value,
                                                        )
                                                    }
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-800 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            <td className="p-1">
                                                <input
                                                    type="date"
                                                    value={objItem.date}
                                                    onChange={(objEvent) =>
                                                        _handleUpdateOtherProject(
                                                            objItem.id,
                                                            'date',
                                                            objEvent.target.value,
                                                        )
                                                    }
                                                    required
                                                    readOnly={blnReadOnly}
                                                    className="h-8 w-full rounded-lg border border-[#B5BFCD] bg-white px-2 font-normal text-slate-700 text-xs focus:border-[#285497] focus:outline-none"
                                                />
                                            </td>
                                            {!blnReadOnly && (
                                                <td className="p-1 text-right w-14">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleDuplicateOtherProject(
                                                                    objItem.id,
                                                                )
                                                            }
                                                            title="Duplicate row"
                                                            className="rounded-md p-1 text-slate-500 hover:bg-[#E6EEF4] hover:text-[#285497] transition"
                                                        >
                                                            <Copy className="size-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                _handleRemoveOtherProject(
                                                                    objItem.id,
                                                                )
                                                            }
                                                            title="Delete row"
                                                            className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ); // end return
} /* end TechInterventionTab */
