import React from 'react';
import { LoaderCircle, PlusCircle, X } from 'lucide-react';
import type { DocumentChecklistItem } from '../../../../services/documentChecklistStore';
import type { ChecklistCategoryItem } from '../types';

export interface TemplateFormState {
  document_name: string;
  phase_code: string;
  phase_title: string;
  group_name: string;
  is_mandatory: boolean;
  sort_order?: number;
}

interface DocumentTemplateModalProps {
  isTemplateModalOpen: boolean;
  editingTemplateItem: DocumentChecklistItem | null;
  activeProgram: string;
  handleCloseTemplateModal: () => void;
  isSubmittingTemplate: boolean;
  handleSaveTemplateModal: (e: React.FormEvent) => void;
  templateFormData: TemplateFormState;
  setTemplateFormData: React.Dispatch<React.SetStateAction<TemplateFormState>>;
  categories: ChecklistCategoryItem[];
}

export function DocumentTemplateModal({
  isTemplateModalOpen,
  editingTemplateItem,
  activeProgram,
  handleCloseTemplateModal,
  isSubmittingTemplate,
  handleSaveTemplateModal,
  templateFormData,
  setTemplateFormData,
  categories,
}: DocumentTemplateModalProps) {
  if (!isTemplateModalOpen) return null;

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
              <h3 id="template-modal-title" className="text-base font-bold text-slate-900">
                {editingTemplateItem ? 'Edit Requirement' : `Add ${activeProgram} Requirement`}
              </h3>
              <p className="text-xs text-slate-500">
                {editingTemplateItem ? 'Update requirement details' : `Add a new document requirement for ${activeProgram}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseTemplateModal}
            disabled={isSubmittingTemplate}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSaveTemplateModal} className="p-6 space-y-4">
          <div>
            <label htmlFor="document_name" className="block text-xs font-bold text-slate-700 mb-1">
              Document Requirement Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="document_name"
              type="text"
              required
              value={templateFormData.document_name}
              onChange={(e) => setTemplateFormData((prev) => ({ ...prev, document_name: e.target.value }))}
              placeholder="e.g. Mayor's Business Permit 2026"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phase_code" className="block text-xs font-bold text-slate-700 mb-1">
                {activeProgram === 'GIA' ? 'Stage Category' : 'SET Category'} <span className="text-rose-500">*</span>
              </label>
              <select
                id="phase_code"
                value={templateFormData.phase_code}
                onChange={(e) => {
                  const val = e.target.value;
                  const catMatch = categories.find((c) => c.id === val);
                  setTemplateFormData((prev) => ({
                    ...prev,
                    phase_code: val,
                    phase_title: catMatch?.name || prev.phase_title,
                  }));
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="group_name" className="block text-xs font-bold text-slate-700 mb-1">
                Group Category <span className="text-rose-500">*</span>
              </label>
              <input
                id="group_name"
                type="text"
                required
                value={templateFormData.group_name}
                onChange={(e) => setTemplateFormData((prev) => ({ ...prev, group_name: e.target.value }))}
                placeholder="e.g. Business Documents"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#0f53b7] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <input
              id="is_mandatory"
              type="checkbox"
              checked={templateFormData.is_mandatory}
              onChange={(e) => setTemplateFormData((prev) => ({ ...prev, is_mandatory: e.target.checked }))}
              className="size-4 rounded border-slate-300 text-[#0f53b7] focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="is_mandatory" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
              Mandatory Requirement (Includes item in total compliance count calculation)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseTemplateModal}
              disabled={isSubmittingTemplate}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTemplate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3f8b] transition shadow-xs cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmittingTemplate && <LoaderCircle className="size-3.5 animate-spin" />}
              <span>{editingTemplateItem ? 'Save Changes' : 'Add Requirement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
