/**
 * System: DPRMS
 * Purpose: Coordinate checklist template config state and interactions.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import
{
    createChecklistTemplate,
    deleteChecklistTemplate,
    fetchChecklistTemplates,
    restoreChecklistTemplate,
    updateChecklistTemplate,
    type DocumentChecklistItem,
} from '../../../../services/document_checklist_store';
import { reportError } from '../../../../utils/error_reporting';
import type { TemplateFormState } from '../modals/DocumentTemplateModal';
import type { ChecklistCategoryItem } from '../types';

interface UseChecklistTemplateConfigProps
{
    strActiveProgram: 'SETUP' | 'GIA';
    arrCategories: ChecklistCategoryItem[];
    strSelectedCategory: string;
    arrEditingItems: DocumentChecklistItem[];
    setEditingItems: React.Dispatch<React.SetStateAction<DocumentChecklistItem[]>>;
    loadData: () => Promise<void>;
}

/** Coordinate checklist template config state and effects. */
export function useChecklistTemplateConfig({
    strActiveProgram,
    arrCategories,
    strSelectedCategory,
    arrEditingItems,
    setEditingItems,
    loadData,
}: UseChecklistTemplateConfigProps)
{
    const [blnIsTemplateEditMode, setBlnIsTemplateEditMode] = useState(false);
    const [blnIsTemplateModalOpen, setBlnIsTemplateModalOpen] = useState(false);
    const [objEditingTemplateItem, setObjEditingTemplateItem] =
        useState<DocumentChecklistItem | null>(null);
    const [objTemplateFormData, setObjTemplateFormData] = useState<TemplateFormState>({
        document_name: '',
        group_name: '',
        phase_code: '',
        phase_title: '',
        is_mandatory: true,
        sort_order: 1,
    });
    const [blnIsSubmittingTemplate, setBlnIsSubmittingTemplate] = useState(false);
    const [arrArchivedTemplates, setArrArchivedTemplates] = useState<any[]>([]);
    const [strTemplateSubTab, setStrTemplateSubTab] = useState<'active' | 'archived'>('active');
    const [objRowMenuOpenId, setObjRowMenuOpenId] = useState<string | number | null>(null);
    const [objArchiveToast, setObjArchiveToast] = useState<{
        id: number;
        name: string;
        templateId?: number;
    } | null>(null);
    const objArchiveToastTimerRef = useRef<any>(null);
    const [intDraggedIndex, setIntDraggedIndex] = useState<number | null>(null);
    const [intDragOverIndex, setIntDragOverIndex] = useState<number | null>(null);

    const _fetchArchivedTemplates = useCallback(async () =>
    {
        try
        {
            const arrAllTemplates = await fetchChecklistTemplates(strActiveProgram, true);
            const arrInactives = arrAllTemplates.filter((objT: any) => objT.is_active === false);
            setArrArchivedTemplates(arrInactives);
        } catch (errCaught)
        {
            reportError(
                errCaught,
                'use_checklist_template_config: fetch archived templates failed.',
            );

            setArrArchivedTemplates([]);
        }
    }, [strActiveProgram]);

    useEffect(() =>
    {
        if (blnIsTemplateEditMode)
        {
            void _fetchArchivedTemplates();
        }
    }, [_fetchArchivedTemplates, blnIsTemplateEditMode]);

    /** Handle open add template modal. */
    const _handleOpenAddTemplateModal = () =>
    {
        setObjEditingTemplateItem(null);
        const strCurrentPhase =
            strSelectedCategory !== 'ALL'
                ? strSelectedCategory
                : strActiveProgram === 'GIA'
                    ? '01'
                    : 'SET1';
        const objPhaseTitleMatch = arrCategories.find((objItem) => objItem.id === strCurrentPhase);
        setObjTemplateFormData({
            document_name: '',
            group_name: 'General Requirements',
            phase_code: strCurrentPhase,
            phase_title:
                objPhaseTitleMatch?.name ||
                (strActiveProgram === 'GIA'
                    ? 'Stage 01: Proposal Submission'
                    : 'SET 1 (Prior to TNA)'),
            is_mandatory: true,
            sort_order: (arrEditingItems.length || 0) + 1,
        });
        setBlnIsTemplateModalOpen(true);
    };

    /** Handle open edit template modal. */
    const _handleOpenEditTemplateModal = (objItem: DocumentChecklistItem) =>
    {
        setObjEditingTemplateItem(objItem);
        const strPhaseCode =
            objItem.setId || objItem.stageId || (strActiveProgram === 'GIA' ? '01' : 'SET1');
        const objPhaseTitleMatch = arrCategories.find(
            (objItemValue) => objItemValue.id === strPhaseCode,
        );
        setObjTemplateFormData({
            document_name: objItem.name,
            group_name: objItem.group || 'General Requirements',
            phase_code: strPhaseCode,
            phase_title: objPhaseTitleMatch?.name || 'Requirement Category',
            is_mandatory: objItem.isRequired,
            sort_order: 1,
        });
        setBlnIsTemplateModalOpen(true);
    };

    /** Handle close template modal. */
    const _handleCloseTemplateModal = () =>
    {
        if (blnIsSubmittingTemplate)
        {
            return;
        }
        setBlnIsTemplateModalOpen(false);
        setObjEditingTemplateItem(null);
    };

    /** Handle save template modal. */
    const _handleSaveTemplateModal = async (objEvent: React.FormEvent) =>
    {
        objEvent.preventDefault();
        if (!objTemplateFormData.document_name.trim())
        {
            Swal.fire({
                icon: 'warning',
                title: 'Requirement Name Required',
                text: 'Please enter a valid document requirement name.',
                confirmButtonColor: '#0f53b7',
            });
            return;
        }

        setBlnIsSubmittingTemplate(true);
        try
        {
            if (objEditingTemplateItem?.templateId)
            {
                await updateChecklistTemplate(objEditingTemplateItem.templateId, {
                    document_name: objTemplateFormData.document_name,
                    group_name: objTemplateFormData.group_name,
                    phase_code: objTemplateFormData.phase_code,
                    phase_title: objTemplateFormData.phase_title,
                    is_mandatory: objTemplateFormData.is_mandatory,
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Template Updated',
                    text: 'The requirement template item was successfully updated.',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } else
            {
                const strItemCode = `${strActiveProgram.toLowerCase()}-${objTemplateFormData.phase_code.toLowerCase()}-${Date.now().toString(36)}`;
                await createChecklistTemplate({
                    program_type: strActiveProgram,
                    phase_code: objTemplateFormData.phase_code,
                    phase_title: objTemplateFormData.phase_title,
                    item_code: strItemCode,
                    document_name: objTemplateFormData.document_name,
                    group_name: objTemplateFormData.group_name,
                    is_mandatory: objTemplateFormData.is_mandatory,
                    sort_order: objTemplateFormData.sort_order,
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Requirement Created',
                    text: 'New template requirement added successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
            setBlnIsTemplateModalOpen(false);
            await loadData();
            await _fetchArchivedTemplates();
        } /* end try */ catch (errError: any)
        {
            reportError(
                errError,
                'use_checklist_template_config: handle save template modal failed.',
            );

            Swal.fire({
                icon: 'error',
                title: 'Operation Failed',
                text:
                    errError?.response?.data?.message ||
                    errError?.message ||
                    'Could not save template item.',
                confirmButtonColor: '#0f53b7',
            });
        } finally
        {
            setBlnIsSubmittingTemplate(false);
        }
    }; /* end _handleSaveTemplateModal */

    /** Handle toggle template mandatory. */
    const _handleToggleTemplateMandatory = async (objItem: DocumentChecklistItem) =>
    {
        const blnNextMandatory = !objItem.isRequired;
        setEditingItems((arrPrevious) =>
            arrPrevious.map((objIndex) =>
                objIndex.id === objItem.id
                    ? { ...objIndex, isRequired: blnNextMandatory }
                    : objIndex,
            ),
        );

        if (objItem.templateId)
        {
            try
            {
                await updateChecklistTemplate(objItem.templateId, {
                    is_mandatory: blnNextMandatory,
                });
            } catch (errError)
            {
                reportError(
                    errError,
                    'use_checklist_template_config: handle toggle template mandatory failed.',
                );

                reportError(errError, 'Failed to update template mandatory status on backend:');
            }
        }
    };

    /** Handle reorder template items. */
    const _handleReorderTemplateItems = async (intFromIndex: number, intToIndex: number) =>
    {
        if (
            intFromIndex === intToIndex ||
            intFromIndex < 0 ||
            intToIndex < 0 ||
            intFromIndex >= arrEditingItems.length ||
            intToIndex >= arrEditingItems.length
        )
        {
            return;
        }

        const arrUpdated = [...arrEditingItems];
        const [objMovedItem] = arrUpdated.splice(intFromIndex, 1);
        arrUpdated.splice(intToIndex, 0, objMovedItem);

        setEditingItems(arrUpdated);

        try
        {
            const arrPromises = arrUpdated.map((objItem, intIndex) =>
            {
                if (objItem.templateId)
                {
                    return updateChecklistTemplate(objItem.templateId, {
                        sort_order: intIndex + 1,
                    });
                }
                return Promise.resolve();
            });
            await Promise.all(arrPromises);
        } catch (errError)
        {
            reportError(
                errError,
                'use_checklist_template_config: handle reorder template items failed.',
            );

            reportError(errError, 'Failed to update drag-and-drop sort order:');
        }
    }; /* end _handleReorderTemplateItems */

    /** Handle deactivate template item. */
    const _handleDeactivateTemplateItem = async (objItem: DocumentChecklistItem) =>
    {
        try
        {
            if (!objItem.templateId)
            {
                Swal.fire({
                    icon: 'info',
                    title: 'Built-in Requirement',
                    text: 'This requirement is hardcoded in frontend configuration. Please select a database template item to deactivate.',
                    confirmButtonColor: '#0f53b7',
                });
                return;
            }

            const objResult = await Swal.fire({
                title: 'Deactivate Requirement Item?',
                html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Are you sure you want to deactivate this requirement template?</p>
          <div class="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs font-bold text-slate-800">
            ${objItem.name}
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

            if (!objResult.isConfirmed)
            {
                return;
            }

            try
            {
                await deleteChecklistTemplate(objItem.templateId);

                if (objArchiveToastTimerRef.current)
                {
                    clearTimeout(objArchiveToastTimerRef.current);
                }

                setObjArchiveToast({
                    id: Date.now(),
                    name: objItem.name,
                    templateId: objItem.templateId,
                });

                objArchiveToastTimerRef.current = setTimeout(() =>
                {
                    setObjArchiveToast(null);
                }, 6000);

                await loadData();
                await _fetchArchivedTemplates();
            } catch (errError: any)
            {
                reportError(
                    errError,
                    'use_checklist_template_config: handle deactivate template item failed.',
                );

                Swal.fire({
                    icon: 'error',
                    title: 'Deactivation Failed',
                    text:
                        errError?.response?.data?.message ||
                        'Unable to deactivate requirement template.',
                    confirmButtonColor: '#0f53b7',
                });
            }
        } catch (errOperation)
        {
            /* end try */

            reportError(
                errOperation,
                'use_checklist_template_config: handle deactivate template item failed.',
            );
            throw errOperation;
        }
    }; /* end _handleDeactivateTemplateItem */

    /** Handle delete template item. */
    const _handleDeleteTemplateItem = async (objItem: DocumentChecklistItem) =>
    {
        try
        {
            if (!objItem.templateId)
            {
                Swal.fire({
                    icon: 'info',
                    title: 'Built-in Requirement',
                    text: 'This requirement is hardcoded in frontend configuration and cannot be deleted.',
                    confirmButtonColor: '#0f53b7',
                });
                return;
            }

            const objResult = await Swal.fire({
                title: 'Delete Requirement Item?',
                html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Are you sure you want to delete this requirement template?</p>
          <div class="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs font-bold text-rose-900">
            ${objItem.name}
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

            if (!objResult.isConfirmed)
            {
                return;
            }

            try
            {
                await deleteChecklistTemplate(objItem.templateId);
                Swal.fire({
                    icon: 'success',
                    title: 'Requirement Deleted',
                    text: 'The requirement template has been deleted successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                await loadData();
                await _fetchArchivedTemplates();
            } catch (errError: any)
            {
                reportError(
                    errError,
                    'use_checklist_template_config: handle delete template item failed.',
                );

                Swal.fire({
                    icon: 'error',
                    title: 'Deletion Failed',
                    text:
                        errError?.response?.data?.message ||
                        'Unable to delete requirement template.',
                    confirmButtonColor: '#0f53b7',
                });
            }
        } catch (errOperation)
        {
            /* end try */

            reportError(
                errOperation,
                'use_checklist_template_config: handle delete template item failed.',
            );
            throw errOperation;
        }
    }; /* end _handleDeleteTemplateItem */

    /** Handle restore template item. */
    const _handleRestoreTemplateItem = async (intTemplateId: number, strTemplateName: string) =>
    {
        try
        {
            const objResult = await Swal.fire({
                title: 'Revert & Restore Requirement?',
                html: `
        <div class="text-left space-y-2 pt-1">
          <p class="text-xs text-slate-600">Reactivating this requirement will bring it back into the active checklist for <b>${strActiveProgram}</b>.</p>
          <div class="rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs font-bold text-slate-800">
            ${strTemplateName}
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

            if (!objResult.isConfirmed)
            {
                return;
            }

            try
            {
                await restoreChecklistTemplate(intTemplateId);
                Swal.fire({
                    icon: 'success',
                    title: 'Requirement Restored',
                    text: 'The requirement has been restored and reactivated successfully.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                await loadData();
                await _fetchArchivedTemplates();
            } catch (errError: any)
            {
                reportError(
                    errError,
                    'use_checklist_template_config: handle restore template item failed.',
                );

                Swal.fire({
                    icon: 'error',
                    title: 'Restoration Failed',
                    text: errError?.response?.data?.message || 'Unable to restore template.',
                    confirmButtonColor: '#0f53b7',
                });
            }
        } catch (errOperation)
        {
            /* end try */

            reportError(
                errOperation,
                'use_checklist_template_config: handle restore template item failed.',
            );
            throw errOperation;
        }
    }; /* end _handleRestoreTemplateItem */

    return {
        isTemplateEditMode: blnIsTemplateEditMode,
        setIsTemplateEditMode: setBlnIsTemplateEditMode,
        isTemplateModalOpen: blnIsTemplateModalOpen,
        setIsTemplateModalOpen: setBlnIsTemplateModalOpen,
        editingTemplateItem: objEditingTemplateItem,
        setEditingTemplateItem: setObjEditingTemplateItem,
        templateFormData: objTemplateFormData,
        setTemplateFormData: setObjTemplateFormData,
        isSubmittingTemplate: blnIsSubmittingTemplate,
        archivedTemplates: arrArchivedTemplates,
        templateSubTab: strTemplateSubTab,
        setTemplateSubTab: setStrTemplateSubTab,
        rowMenuOpenId: objRowMenuOpenId,
        setRowMenuOpenId: setObjRowMenuOpenId,
        archiveToast: objArchiveToast,
        setArchiveToast: setObjArchiveToast,
        archiveToastTimerRef: objArchiveToastTimerRef,
        draggedIndex: intDraggedIndex,
        setDraggedIndex: setIntDraggedIndex,
        dragOverIndex: intDragOverIndex,
        setDragOverIndex: setIntDragOverIndex,
        handleOpenAddTemplateModal: _handleOpenAddTemplateModal,
        handleOpenEditTemplateModal: _handleOpenEditTemplateModal,
        handleCloseTemplateModal: _handleCloseTemplateModal,
        handleSaveTemplateModal: _handleSaveTemplateModal,
        handleToggleTemplateMandatory: _handleToggleTemplateMandatory,
        handleReorderTemplateItems: _handleReorderTemplateItems,
        handleDeactivateTemplateItem: _handleDeactivateTemplateItem,
        handleDeleteTemplateItem: _handleDeleteTemplateItem,
        handleRestoreTemplateItem: _handleRestoreTemplateItem,
    };
} /* end useChecklistTemplateConfig */
