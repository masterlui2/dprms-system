/**
 * System: DPRMS
 * Purpose: Render document checklist page for the application pages.
 * Programmer: ITD Development Team
 * Copyright: (c) 2026 ITD. All rights reserved.
 */
import { ArrowLeft, FileText, LoaderCircle, XCircle } from 'lucide-react';
import
{
    ArchiveUndoToast,
    DocumentChecklistConfigureView,
    DocumentChecklistFilterBar,
    DocumentChecklistGridView,
    DocumentChecklistHeader,
    DocumentChecklistListView,
    DocumentChecklistProjectTable,
    DocumentChecklistRemarks,
    DocumentChecklistSidebar,
    DocumentReviewModal,
    DocumentTemplateModal,
    DocumentUploadModal,
    DocumentVersionHistoryModal,
    useChecklistModals,
    useChecklistTemplateConfig,
    useDocumentChecklistData,
} from '../../components/admin/document-checklist';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';

/** Render document checklist page and its available actions. */
export function DocumentChecklistPage()
{
    const objData = useDocumentChecklistData();
    const objTemplateConfig = useChecklistTemplateConfig({
        strActiveProgram: objData.activeProgram,
        arrCategories: objData.categories,
        strSelectedCategory: objData.selectedCategory,
        arrEditingItems: objData.editingItems,
        setEditingItems: objData.setEditingItems,
        loadData: objData.reloadActiveProposal,
    });
    const objModals = useChecklistModals({
        objActiveProposal: objData.activeProposal,
        blnIsReadOnly: objData.isReadOnly,
        objCurrentUser: objData.currentUser,
        setEditingItems: objData.setEditingItems,
        setProposals: objData.setProposals,
        txtEditingOverallRemarks: objData.editingOverallRemarks,
        setHistoryList: objData.setHistoryList,
    });
    /** Handle back to projects. */
    const _handleBackToProjects = () =>
    {
        objTemplateConfig.setIsTemplateEditMode(false);
        objTemplateConfig.setTemplateSubTab('active');
        objData.handleBackToProjects();
    };

    return (
        <div className="space-y-5 font-sans">
            <DocumentChecklistHeader
                strActiveProgram={objData.activeProgram}
                blnIsReadOnly={objData.isReadOnly}
                strAutoSaveStatus={objData.autoSaveStatus}
                strLastSavedTime={objData.lastSavedTime}
                blnIsAdmin={objData.isAdmin}
                blnIsFocal={objData.isFocal}
                blnIsTemplateEditMode={objTemplateConfig.isTemplateEditMode}
                setIsTemplateEditMode={objTemplateConfig.setIsTemplateEditMode}
                setTemplateSubTab={objTemplateConfig.setTemplateSubTab}
                exportSummaryCsv={objData.exportSummaryCsv}
                loadData={
                    objData.selectedProposalId ? objData.reloadActiveProposal : objData.loadData
                }
                blnIsLoading={objData.isLoading || objData.isDetailLoading}
                blnIsReviewMode={Boolean(objData.selectedProposalId)}
                onBackToProjects={_handleBackToProjects}
            />

            {objData.isLoading ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
                    <LoaderCircle className="size-8 animate-spin text-[#0f53b7]" />
                    <p className="mt-3 text-sm font-medium text-slate-700">Loading projects…</p>
                </div>
            ) : objData.loadError ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center text-red-500">
                    <XCircle className="size-9 text-rose-500" />
                    <p className="mt-2 text-sm font-semibold">{objData.loadError}</p>
                    <button
                        type="button"
                        onClick={objData.loadData}
                        className="mt-4 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0b3f8b]"
                    >
                        Try again
                    </button>
                </div>
            ) : objData.selectedProposalId && !objData.activeProposal ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
                    {objData.detailLoadError ? (
                        <>
                            <XCircle className="size-9 text-rose-500" />
                            <p className="mt-3 text-sm font-semibold text-slate-800">
                                Documents could not be loaded
                            </p>
                            <p className="mt-1 max-w-md text-xs text-slate-500">
                                {objData.detailLoadError}
                            </p>
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={_handleBackToProjects}
                                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Back to projects
                                </button>
                                <button
                                    type="button"
                                    onClick={objData.reloadActiveProposal}
                                    className="h-9 rounded-xl bg-[#0f53b7] px-4 text-xs font-semibold text-white transition hover:bg-[#0b3f8b]"
                                >
                                    Try again
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <LoaderCircle className="size-8 animate-spin text-[#0f53b7]" />
                            <p className="mt-3 text-sm font-medium text-slate-700">
                                Loading project documents…
                            </p>
                        </>
                    )}
                </div>
            ) : !objData.activeProposal ? (
                <DocumentChecklistProjectTable
                    blnCanReview={objData.canReview}
                    blnIsLoading={objData.isLoading}
                    onSelectProject={objData.handleSelectProposal}
                    arrProposals={objData.programProposals}
                />
            ) : (
                <div className="grid min-w-0 max-w-full grid-cols-1 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <DocumentChecklistSidebar
                        objActiveProposal={objData.activeProposal}
                        objStats={objData.stats}
                        onBackToProjects={_handleBackToProjects}
                        strSelectedCategory={objData.selectedCategory}
                        setSelectedCategory={objData.setSelectedCategory}
                        arrEditingItems={objData.editingItems}
                        arrCategories={objData.categories}
                        blnCanViewHistory={objData.canViewHistory}
                        blnIsHistoryExpanded={objData.isHistoryExpanded}
                        setIsHistoryExpanded={objData.setIsHistoryExpanded}
                        arrHistoryList={objData.historyList}
                    />

                    <main className="space-y-4 min-w-0">
                        {objTemplateConfig.isTemplateEditMode ? (
                            <DocumentChecklistConfigureView
                                strTemplateSubTab={objTemplateConfig.templateSubTab}
                                setTemplateSubTab={objTemplateConfig.setTemplateSubTab}
                                strActiveProgram={objData.activeProgram}
                                arrArchivedTemplates={objTemplateConfig.archivedTemplates}
                                handleRestoreTemplateItem={
                                    objTemplateConfig.handleRestoreTemplateItem
                                }
                                handleOpenAddTemplateModal={
                                    objTemplateConfig.handleOpenAddTemplateModal
                                }
                                arrFilteredItems={objData.filteredItems}
                                intDraggedIndex={objTemplateConfig.draggedIndex}
                                setDraggedIndex={objTemplateConfig.setDraggedIndex}
                                intDragOverIndex={objTemplateConfig.dragOverIndex}
                                setDragOverIndex={objTemplateConfig.setDragOverIndex}
                                handleReorderTemplateItems={
                                    objTemplateConfig.handleReorderTemplateItems
                                }
                                handleToggleTemplateMandatory={
                                    objTemplateConfig.handleToggleTemplateMandatory
                                }
                                objRowMenuOpenId={objTemplateConfig.rowMenuOpenId}
                                setRowMenuOpenId={objTemplateConfig.setRowMenuOpenId}
                                handleOpenEditTemplateModal={
                                    objTemplateConfig.handleOpenEditTemplateModal
                                }
                                handleDeactivateTemplateItem={
                                    objTemplateConfig.handleDeactivateTemplateItem
                                }
                                handleDeleteTemplateItem={
                                    objTemplateConfig.handleDeleteTemplateItem
                                }
                            />
                        ) : (
                            <>
                                <DocumentChecklistFilterBar
                                    strSearchQuery={objData.searchQuery}
                                    setSearchQuery={objData.setSearchQuery}
                                    strViewMode={objData.viewMode}
                                    setViewMode={objData.setViewMode}
                                    strStatusTab={objData.statusTab}
                                    setStatusTab={objData.setStatusTab}
                                    blnIsFilterDropdownOpen={objData.isFilterDropdownOpen}
                                    setIsFilterDropdownOpen={objData.setIsFilterDropdownOpen}
                                    objStats={objData.stats}
                                />

                                {objData.filteredItems.length === 0 ? (
                                    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
                                        <FileText className="size-8 text-slate-300" />
                                        <p className="mt-3 text-sm font-semibold text-slate-800">
                                            No documents found
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Change the search or status filter.
                                        </p>
                                    </div>
                                ) : objData.viewMode === 'grid' ? (
                                    <DocumentChecklistGridView
                                        arrFilteredItems={objData.filteredItems}
                                        objBlobMap={objModals.blobMap}
                                        blnCanReview={objData.canReview}
                                        blnCanUpload={objData.canUpload}
                                        handleOpenReviewModal={objModals.handleOpenReviewModal}
                                        handlePreviewDocument={objModals.handlePreviewDocument}
                                        handleDownloadItem={objModals.handleDownloadItem}
                                        handleOpenUploadModal={objModals.handleOpenUploadModal}
                                        setVersionModalDoc={objModals.setVersionModalDoc}
                                        handleRemoveFile={objModals.handleRemoveFile}
                                        handleToggleItemVerify={objData.handleToggleItemVerify}
                                    />
                                ) : (
                                    <DocumentChecklistListView
                                        arrFilteredItems={objData.filteredItems}
                                        blnIsReadOnly={objData.isReadOnly}
                                        blnCanReview={objData.canReview}
                                        blnCanUpload={objData.canUpload}
                                        blnIsAdmin={objData.isAdmin}
                                        blnIsFocal={objData.isFocal}
                                        blnIsTemplateEditMode={objTemplateConfig.isTemplateEditMode}
                                        objRowMenuOpenId={objTemplateConfig.rowMenuOpenId}
                                        setRowMenuOpenId={objTemplateConfig.setRowMenuOpenId}
                                        handleToggleItemVerify={objData.handleToggleItemVerify}
                                        setVersionModalDoc={objModals.setVersionModalDoc}
                                        handlePreviewDocument={objModals.handlePreviewDocument}
                                        handleOpenReviewModal={objModals.handleOpenReviewModal}
                                        handleOpenUploadModal={objModals.handleOpenUploadModal}
                                        handleRemoveFile={objModals.handleRemoveFile}
                                        handleOpenEditTemplateModal={
                                            objTemplateConfig.handleOpenEditTemplateModal
                                        }
                                        handleDeactivateTemplateItem={
                                            objTemplateConfig.handleDeactivateTemplateItem
                                        }
                                        handleDeleteTemplateItem={
                                            objTemplateConfig.handleDeleteTemplateItem
                                        }
                                    />
                                )}

                                <DocumentChecklistRemarks
                                    blnIsStaff={objData.isStaff}
                                    blnCanReview={objData.canReview}
                                    strAutoSaveStatus={objData.autoSaveStatus}
                                    strLastSavedTime={objData.lastSavedTime}
                                    txtEditingOverallRemarks={objData.editingOverallRemarks}
                                    setEditingOverallRemarks={objData.setEditingOverallRemarks}
                                    blnCanMarkComplete={objData.canMarkComplete}
                                    objStats={objData.stats}
                                    handleMarkReviewCompleted={objData.handleMarkReviewCompleted}
                                    blnIsCompletingReview={objData.isCompletingReview}
                                />
                            </>
                        )}
                    </main>
                </div>
            )}

            <DocumentUploadModal
                objUploadModalItem={objModals.uploadModalItem}
                blnIsUploading={objModals.isUploading}
                blnIsDragging={objModals.isDragging}
                setIsDragging={objModals.setIsDragging}
                objFileInputRef={objModals.fileInputRef}
                objSelectedUploadFile={objModals.selectedUploadFile}
                setSelectedUploadFile={objModals.setSelectedUploadFile}
                handleCloseUploadModal={objModals.handleCloseUploadModal}
                handleDropFile={objModals.handleDropFile}
                validateAndSetFile={objModals.validateAndSetFile}
                handleConfirmUpload={objModals.handleConfirmUpload}
            />

            <DocumentReviewModal
                objReviewModalItem={objModals.reviewModalItem}
                blnIsFullscreen={objModals.isFullscreen}
                setIsFullscreen={objModals.setIsFullscreen}
                objBlobMap={objModals.blobMap}
                blnIsLoadingPreviewBlob={objModals.isLoadingPreviewBlob}
                handleOpenReviewModal={objModals.handleOpenReviewModal}
                handleCloseReviewModal={objModals.handleCloseReviewModal}
                handleDownloadPreviewFile={objModals.handleDownloadPreviewFile}
                blnIsSubmittingReview={objModals.isSubmittingReview}
                setVersionModalDoc={objModals.setVersionModalDoc}
                arrHistoryList={objData.historyList}
                objActiveProposal={objData.activeProposal}
                strReviewDecision={objModals.reviewDecision}
                setReviewDecision={objModals.setReviewDecision}
                txtReviewRemarks={objModals.reviewRemarks}
                setReviewRemarks={objModals.setReviewRemarks}
                handleConfirmReview={objModals.handleConfirmReview}
            />

            <DocumentVersionHistoryModal
                objVersionModalDoc={objModals.versionModalDoc}
                setVersionModalDoc={objModals.setVersionModalDoc}
                handlePreviewDocument={objModals.handlePreviewDocument}
                handleOpenReviewModal={objModals.handleOpenReviewModal}
                handleRestoreArchivedVersion={objModals.handleRestoreArchivedVersion}
            />

            <DocumentTemplateModal
                blnIsTemplateModalOpen={objTemplateConfig.isTemplateModalOpen}
                objEditingTemplateItem={objTemplateConfig.editingTemplateItem}
                strActiveProgram={objData.activeProgram}
                handleCloseTemplateModal={objTemplateConfig.handleCloseTemplateModal}
                blnIsSubmittingTemplate={objTemplateConfig.isSubmittingTemplate}
                handleSaveTemplateModal={objTemplateConfig.handleSaveTemplateModal}
                objTemplateFormData={objTemplateConfig.templateFormData}
                setTemplateFormData={objTemplateConfig.setTemplateFormData}
                arrCategories={objData.categories}
            />

            <DocumentPreviewModal
                blnIsOpen={objModals.previewDoc.isOpen}
                onClose={() =>
                    objModals.setPreviewDoc((objPrevious) => ({ ...objPrevious, isOpen: false }))
                }
                title={objModals.previewDoc.title}
                strFileName={objModals.previewDoc.fileName}
                intFileSize={objModals.previewDoc.fileSize}
                strUploadedAt={objModals.previewDoc.uploadedAt}
                strStatus={objModals.previewDoc.status}
                strBlobUrl={objModals.previewDoc.blobUrl}
                blnIsLoading={objModals.previewDoc.isLoading}
                strError={objModals.previewDoc.error}
                onDownload={objModals.handleDownloadPreviewFile}
                onOpenNewTab={objModals.handleOpenPreviewNewTab}
            />

            <ArchiveUndoToast
                objArchiveToast={objTemplateConfig.archiveToast}
                handleRestoreTemplateItem={objTemplateConfig.handleRestoreTemplateItem}
                objArchiveToastTimerRef={objTemplateConfig.archiveToastTimerRef}
                setArchiveToast={objTemplateConfig.setArchiveToast}
            />
        </div>
    ); // end return
} /* end DocumentChecklistPage */
