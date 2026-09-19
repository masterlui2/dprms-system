/**
 * System: DPRMS
 * Purpose: Render document template modal for the frontend.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { LoaderCircle, PlusCircle, X } from 'lucide-react';
import React from 'react';
import type { DocumentChecklistItem } from '../../../../services/document_checklist_store';
import type { ChecklistCategoryItem } from '../types';

export interface TemplateFormState
{
    document_name: string;
    phase_code: string;
    phase_title: string;
    group_name: string;
    is_mandatory: boolean;
    sort_order?: number;
}

interface DocumentTemplateModalProps
{
    blnIsTemplateModalOpen: boolean;
    objEditingTemplateItem: DocumentChecklistItem | null;
    strActiveProgram: string;
    handleCloseTemplateModal: () => void;
    blnIsSubmittingTemplate: boolean;
    handleSaveTemplateModal: (objEvent: React.FormEvent) => void;
    objTemplateFormData: TemplateFormState;
    setTemplateFormData: React.Dispatch<React.SetStateAction<TemplateFormState>>;
    arrCategories: ChecklistCategoryItem[];
}

/** Render document template modal and its available actions. */
export function DocumentTemplateModal({
    blnIsTemplateModalOpen,
    objEditingTemplateItem,
    strActiveProgram,
    handleCloseTemplateModal,
    blnIsSubmittingTemplate,
    handleSaveTemplateModal,
    objTemplateFormData,
    setTemplateFormData,
    arrCategories,
}: DocumentTemplateModalProps)
{
    if (!blnIsTemplateModalOpen)
    {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
        >
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 bg-[#E6EEF4]/60 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-[#0f53b7] text-white shadow-xs">
                            <PlusCircle className="size-5" />
                        </span>
                        <div>
                            <h3
                                id="template-modal-title"
                                className="text-base font-bold text-slate-900"
                            >
                                {objEditingTemplateItem
                                    ? 'Edit Requirement'
                                    : `Add ${strActiveProgram} Requirement`}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {objEditingTemplateItem
                                    ? 'Update requirement details'
                                    : `Add a new document requirement for ${strActiveProgram}`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseTemplateModal}
                        disabled={blnIsSubmittingTemplate}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close modal"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSaveTemplateModal} className="p-6 space-y-4">
                    <div>
                        <label
                            htmlFor="document_name"
                            className="block text-xs font-bold text-slate-700 mb-1"
                        >
                            Document Requirement Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            id="document_name"
                            type="text"
                            required
                            value={objTemplateFormData.document_name}
                            onChange={(objEvent) =>
                                setTemplateFormData((objPrevious) => ({
                                    ...objPrevious,
                                    document_name: objEvent.target.value,
                                }))
                            }
                            placeholder="e.g. Mayor's Business Permit 2026"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="phase_code"
                                className="block text-xs font-bold text-slate-700 mb-1"
                            >
                                {strActiveProgram === 'GIA' ? 'Stage Category' : 'SET Category'}{' '}
                                <span className="text-rose-500">*</span>
                            </label>
                            <select
                                id="phase_code"
                                value={objTemplateFormData.phase_code}
                                onChange={(objEvent) =>
                                {
                                    const strValue = objEvent.target.value;
                                    const objCatMatch = arrCategories.find(
                                        (objItem) => objItem.id === strValue,
                                    );
                                    setTemplateFormData((objPrevious) => ({
                                        ...objPrevious,
                                        phase_code: strValue,
                                        phase_title: objCatMatch?.name || objPrevious.phase_title,
                                    }));
                                }}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                {arrCategories.map((objItem) => (
                                    <option key={objItem.id} value={objItem.id}>
                                        {objItem.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="group_name"
                                className="block text-xs font-bold text-slate-700 mb-1"
                            >
                                Group Category <span className="text-rose-500">*</span>
                            </label>
                            <input
                                id="group_name"
                                type="text"
                                required
                                value={objTemplateFormData.group_name}
                                onChange={(objEvent) =>
                                    setTemplateFormData((objPrevious) => ({
                                        ...objPrevious,
                                        group_name: objEvent.target.value,
                                    }))
                                }
                                placeholder="e.g. Business Documents"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <input
                            id="is_mandatory"
                            type="checkbox"
                            checked={objTemplateFormData.is_mandatory}
                            onChange={(objEvent) =>
                                setTemplateFormData((objPrevious) => ({
                                    ...objPrevious,
                                    is_mandatory: objEvent.target.checked,
                                }))
                            }
                            className="size-4 rounded border-slate-300 text-[#0f53b7] focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                            htmlFor="is_mandatory"
                            className="text-xs font-semibold text-slate-800 cursor-pointer select-none"
                        >
                            Mandatory Requirement (Includes item in total compliance count
                            calculation)
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleCloseTemplateModal}
                            disabled={blnIsSubmittingTemplate}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={blnIsSubmittingTemplate}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3f8b] transition shadow-xs cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {blnIsSubmittingTemplate && (
                                <LoaderCircle className="size-3.5 animate-spin" />
                            )}
                            <span>
                                {objEditingTemplateItem ? 'Save Changes' : 'Add Requirement'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ); // end return
} /* end DocumentTemplateModal */
