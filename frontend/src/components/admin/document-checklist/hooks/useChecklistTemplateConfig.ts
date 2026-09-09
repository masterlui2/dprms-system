import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  createChecklistTemplate,
  deleteChecklistTemplate,
  fetchChecklistTemplates,
  restoreChecklistTemplate,
  updateChecklistTemplate,
  type DocumentChecklistItem,
} from '../../../../services/documentChecklistStore';
import type { ChecklistCategoryItem } from '../types';
import type { TemplateFormState } from '../modals/DocumentTemplateModal';

interface UseChecklistTemplateConfigProps {
  activeProgram: 'SETUP' | 'GIA';
  categories: ChecklistCategoryItem[];
  selectedCategory: string;
  editingItems: DocumentChecklistItem[];
  setEditingItems: React.Dispatch<React.SetStateAction<DocumentChecklistItem[]>>;
  loadData: () => Promise<void>;
}

export function useChecklistTemplateConfig({
  activeProgram,
  categories,
  selectedCategory,
  editingItems,
  setEditingItems,
  loadData,
}: UseChecklistTemplateConfigProps) {
  const [isTemplateEditMode, setIsTemplateEditMode] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateItem, setEditingTemplateItem] = useState<DocumentChecklistItem | null>(null);
  const [templateFormData, setTemplateFormData] = useState<TemplateFormState>({
    document_name: '',
    group_name: '',
    phase_code: '',
    phase_title: '',
    is_mandatory: true,
    sort_order: 1,
  });
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const [archivedTemplates, setArchivedTemplates] = useState<any[]>([]);
  const [templateSubTab, setTemplateSubTab] = useState<'active' | 'archived'>('active');
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | number | null>(null);
  const [archiveToast, setArchiveToast] = useState<{ id: number; name: string; templateId?: number } | null>(null);
  const archiveToastTimerRef = useRef<any>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchArchivedTemplates = async () => {
    try {
      const allTemplates = await fetchChecklistTemplates(activeProgram, true);
      const inactives = allTemplates.filter((t: any) => t.is_active === false);
      setArchivedTemplates(inactives);
    } catch {
      setArchivedTemplates([]);
    }
  };

  useEffect(() => {
    fetchArchivedTemplates();
  }, [activeProgram]);

  const handleOpenAddTemplateModal = () => {
    setEditingTemplateItem(null);
    const currentPhase = selectedCategory !== 'ALL' ? selectedCategory : (activeProgram === 'GIA' ? '01' : 'SET1');
    const phaseTitleMatch = categories.find((c) => c.id === currentPhase);
    setTemplateFormData({
      document_name: '',
      group_name: 'General Requirements',
      phase_code: currentPhase,
      phase_title: phaseTitleMatch?.name || (activeProgram === 'GIA' ? 'Stage 01: Proposal Submission' : 'SET 1 (Prior to TNA)'),
      is_mandatory: true,
      sort_order: (editingItems.length || 0) + 1,
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplateModal = (item: DocumentChecklistItem) => {
    setEditingTemplateItem(item);
    const phaseCode = item.setId || item.stageId || (activeProgram === 'GIA' ? '01' : 'SET1');
    const phaseTitleMatch = categories.find((c) => c.id === phaseCode);
    setTemplateFormData({
      document_name: item.name,
      group_name: item.group || 'General Requirements',
      phase_code: phaseCode,
      phase_title: phaseTitleMatch?.name || 'Requirement Category',
      is_mandatory: item.isRequired,
      sort_order: 1,
    });
    setIsTemplateModalOpen(true);
  };

  const handleCloseTemplateModal = () => {
    if (isSubmittingTemplate) return;
    setIsTemplateModalOpen(false);
    setEditingTemplateItem(null);
  };

  const handleSaveTemplateModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormData.document_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Requirement Name Required',
        text: 'Please enter a valid document requirement name.',
        confirmButtonColor: '#0f53b7',
      });
      return;
    }

    setIsSubmittingTemplate(true);
    try {
      if (editingTemplateItem?.templateId) {
        await updateChecklistTemplate(editingTemplateItem.templateId, {
          document_name: templateFormData.document_name,
          group_name: templateFormData.group_name,
          phase_code: templateFormData.phase_code,
          phase_title: templateFormData.phase_title,
          is_mandatory: templateFormData.is_mandatory,
        });
        Swal.fire({
          icon: 'success',
          title: 'Template Updated',
          text: 'The requirement template item was successfully updated.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const itemCode = `${activeProgram.toLowerCase()}-${templateFormData.phase_code.toLowerCase()}-${Date.now().toString(36)}`;
        await createChecklistTemplate({
          program_type: activeProgram,
          phase_code: templateFormData.phase_code,
          phase_title: templateFormData.phase_title,
          item_code: itemCode,
          document_name: templateFormData.document_name,
          group_name: templateFormData.group_name,
          is_mandatory: templateFormData.is_mandatory,
          sort_order: templateFormData.sort_order,
        });
        Swal.fire({
          icon: 'success',
          title: 'Requirement Created',
          text: 'New template requirement added successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setIsTemplateModalOpen(false);
      await loadData();
      await fetchArchivedTemplates();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err?.response?.data?.message || err?.message || 'Could not save template item.',
        confirmButtonColor: '#0f53b7',
      });
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleToggleTemplateMandatory = async (item: DocumentChecklistItem) => {
    const nextMandatory = !item.isRequired;
    setEditingItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isRequired: nextMandatory } : i))
    );

    if (item.templateId) {
      try {
        await updateChecklistTemplate(item.templateId, {
          is_mandatory: nextMandatory,
        });
      } catch (err) {
        console.warn('Failed to update template mandatory status on backend:', err);
      }
    }
  };

  const handleReorderTemplateItems = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= editingItems.length || toIndex >= editingItems.length) return;

    const updated = [...editingItems];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    setEditingItems(updated);

    try {
      const promises = updated.map((item, index) => {
        if (item.templateId) {
          return updateChecklistTemplate(item.templateId, { sort_order: index + 1 });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    } catch (err) {
      console.warn('Failed to update drag-and-drop sort order:', err);
    }
  };

  const handleDeactivateTemplateItem = async (item: DocumentChecklistItem) => {
    if (!item.templateId) {
      Swal.fire({
        icon: 'info',
        title: 'Built-in Requirement',
        text: 'This requirement is hardcoded in frontend configuration. Please select a database template item to deactivate.',
        confirmButtonColor: '#0f53b7',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Deactivate Requirement Item?',
      html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Are you sure you want to deactivate this requirement template?</p>
          <div class="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-bold text-slate-800">
            ${item.name}
          </div>
          <p class="text-[11px] text-slate-400">
            It will be hidden from future proposal checklists. Historical proposal records will remain intact.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Deactivate Requirement',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl p-6 font-sans' },
    });

    if (!result.isConfirmed) return;

    try {
      await deleteChecklistTemplate(item.templateId);

      if (archiveToastTimerRef.current) {
        clearTimeout(archiveToastTimerRef.current);
      }

      setArchiveToast({
        id: Date.now(),
        name: item.name,
        templateId: item.templateId,
      });

      archiveToastTimerRef.current = setTimeout(() => {
        setArchiveToast(null);
      }, 6000);

      await loadData();
      await fetchArchivedTemplates();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Deactivation Failed',
        text: err?.response?.data?.message || 'Unable to deactivate requirement template.',
        confirmButtonColor: '#0f53b7',
      });
    }
  };

  const handleDeleteTemplateItem = async (item: DocumentChecklistItem) => {
    if (!item.templateId) {
      Swal.fire({
        icon: 'info',
        title: 'Built-in Requirement',
        text: 'This requirement is hardcoded in frontend configuration and cannot be deleted.',
        confirmButtonColor: '#0f53b7',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Requirement Item?',
      html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Are you sure you want to delete this requirement template?</p>
          <div class="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs font-bold text-rose-900">
            ${item.name}
          </div>
          <p class="text-[11px] text-slate-400">
            This requirement item will be removed from the checklist configuration.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete Requirement',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl p-6 font-sans' },
    });

    if (!result.isConfirmed) return;

    try {
      await deleteChecklistTemplate(item.templateId);
      Swal.fire({
        icon: 'success',
        title: 'Requirement Deleted',
        text: 'The requirement template has been deleted successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadData();
      await fetchArchivedTemplates();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Deletion Failed',
        text: err?.response?.data?.message || 'Unable to delete requirement template.',
        confirmButtonColor: '#0f53b7',
      });
    }
  };

  const handleRestoreTemplateItem = async (templateId: number, templateName: string) => {
    const result = await Swal.fire({
      title: 'Revert & Restore Requirement?',
      html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Reactivating this requirement will bring it back into the active checklist for <b>${activeProgram}</b>.</p>
          <div class="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs font-bold text-slate-800">
            ${templateName}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f53b7',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Revert & Restore',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-3xl p-6 font-sans' },
    });

    if (!result.isConfirmed) return;

    try {
      await restoreChecklistTemplate(templateId);
      Swal.fire({
        icon: 'success',
        title: 'Requirement Restored',
        text: 'The requirement has been restored and reactivated successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      await loadData();
      await fetchArchivedTemplates();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Restoration Failed',
        text: err?.response?.data?.message || 'Unable to restore template.',
        confirmButtonColor: '#0f53b7',
      });
    }
  };

  return {
    isTemplateEditMode,
    setIsTemplateEditMode,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    editingTemplateItem,
    setEditingTemplateItem,
    templateFormData,
    setTemplateFormData,
    isSubmittingTemplate,
    archivedTemplates,
    templateSubTab,
    setTemplateSubTab,
    rowMenuOpenId,
    setRowMenuOpenId,
    archiveToast,
    setArchiveToast,
    archiveToastTimerRef,
    draggedIndex,
    setDraggedIndex,
    dragOverIndex,
    setDragOverIndex,
    handleOpenAddTemplateModal,
    handleOpenEditTemplateModal,
    handleCloseTemplateModal,
    handleSaveTemplateModal,
    handleToggleTemplateMandatory,
    handleReorderTemplateItems,
    handleDeactivateTemplateItem,
    handleDeleteTemplateItem,
    handleRestoreTemplateItem,
  };
}
