import {
  FileText,
  FolderOpen,
  LoaderCircle,
  XCircle,
} from 'lucide-react';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import {
  DocumentChecklistHeader,
  DocumentChecklistSidebar,
  DocumentChecklistFilterBar,
  DocumentChecklistGridView,
  DocumentChecklistListView,
  DocumentChecklistRemarks,
  DocumentChecklistConfigureView,
  DocumentUploadModal,
  DocumentReviewModal,
  ProjectSelectorModal,
  DocumentVersionHistoryModal,
  DocumentTemplateModal,
  ArchiveUndoToast,
  useDocumentChecklistData,
  useChecklistTemplateConfig,
  useChecklistModals,
} from '../../components/admin/document-checklist';

export function DocumentChecklistPage() {
  const data = useDocumentChecklistData();
  const templateConfig = useChecklistTemplateConfig({
    activeProgram: data.activeProgram,
    categories: data.categories,
    selectedCategory: data.selectedCategory,
    editingItems: data.editingItems,
    setEditingItems: data.setEditingItems,
    loadData: data.loadData,
  });
  const modals = useChecklistModals({
    activeProposal: data.activeProposal,
    isReadOnly: data.isReadOnly,
    currentUser: data.currentUser,
    editingItems: data.editingItems,
    setEditingItems: data.setEditingItems,
    setProposals: data.setProposals,
    editingOverallRemarks: data.editingOverallRemarks,
    viewMode: data.viewMode,
    setHistoryList: data.setHistoryList,
  });

  return (
    <div className="space-y-5 font-sans">
      <DocumentChecklistHeader
        activeProgram={data.activeProgram}
        isReadOnly={data.isReadOnly}
        autoSaveStatus={data.autoSaveStatus}
        lastSavedTime={data.lastSavedTime}
        isAdmin={data.isAdmin}
        isFocal={data.isFocal}
        isTemplateEditMode={templateConfig.isTemplateEditMode}
        setIsTemplateEditMode={templateConfig.setIsTemplateEditMode}
        setTemplateSubTab={templateConfig.setTemplateSubTab}
        exportSummaryCsv={data.exportSummaryCsv}
        loadData={data.loadData}
        isLoading={data.isLoading}
      />

      {data.isLoading ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
          <LoaderCircle className="size-8 animate-spin text-[#0f53b7]" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Loading {data.activeProgram} documents…</p>
        </div>
      ) : data.loadError ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center text-red-500">
          <XCircle className="size-9 text-rose-500" />
          <p className="mt-2 text-sm font-bold">{data.loadError}</p>
          <button
            type="button"
            onClick={data.loadData}
            className="mt-4 rounded-xl bg-[#0f53b7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0b3f8b]"
          >
            Try again
          </button>
        </div>
      ) : !data.activeProposal ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#E6EEF4] text-[#285497]">
            <FolderOpen className="size-6" />
          </span>
          <h3 className="mt-3 text-base font-bold text-slate-900">
            No Approved {data.activeProgram} Applications Found
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            There are currently no approved applications under the {data.activeProgram} program to inspect in the document checklist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[305px_1fr] gap-6 items-start">
          <DocumentChecklistSidebar
            activeProposal={data.activeProposal}
            stats={data.stats}
            setIsProjectSelectorOpen={data.setIsProjectSelectorOpen}
            selectedCategory={data.selectedCategory}
            setSelectedCategory={data.setSelectedCategory}
            editingItems={data.editingItems}
            categories={data.categories}
            canViewHistory={data.canViewHistory}
            isHistoryExpanded={data.isHistoryExpanded}
            setIsHistoryExpanded={data.setIsHistoryExpanded}
            historyList={data.historyList}
          />

          <main className="space-y-4 min-w-0">
            {templateConfig.isTemplateEditMode ? (
              <DocumentChecklistConfigureView
                templateSubTab={templateConfig.templateSubTab}
                setTemplateSubTab={templateConfig.setTemplateSubTab}
                activeProgram={data.activeProgram}
                archivedTemplates={templateConfig.archivedTemplates}
                handleRestoreTemplateItem={templateConfig.handleRestoreTemplateItem}
                handleOpenAddTemplateModal={templateConfig.handleOpenAddTemplateModal}
                filteredItems={data.filteredItems}
                draggedIndex={templateConfig.draggedIndex}
                setDraggedIndex={templateConfig.setDraggedIndex}
                dragOverIndex={templateConfig.dragOverIndex}
                setDragOverIndex={templateConfig.setDragOverIndex}
                handleReorderTemplateItems={templateConfig.handleReorderTemplateItems}
                handleToggleTemplateMandatory={templateConfig.handleToggleTemplateMandatory}
                rowMenuOpenId={templateConfig.rowMenuOpenId}
                setRowMenuOpenId={templateConfig.setRowMenuOpenId}
                handleOpenEditTemplateModal={templateConfig.handleOpenEditTemplateModal}
                handleDeactivateTemplateItem={templateConfig.handleDeactivateTemplateItem}
                handleDeleteTemplateItem={templateConfig.handleDeleteTemplateItem}
              />
            ) : (
              <>
                <DocumentChecklistFilterBar
                  searchQuery={data.searchQuery}
                  setSearchQuery={data.setSearchQuery}
                  viewMode={data.viewMode}
                  setViewMode={data.setViewMode}
                  statusTab={data.statusTab}
                  setStatusTab={data.setStatusTab}
                  isFilterDropdownOpen={data.isFilterDropdownOpen}
                  setIsFilterDropdownOpen={data.setIsFilterDropdownOpen}
                  stats={data.stats}
                />

                {data.filteredItems.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-[#B5BFCD]/60 bg-white p-8 text-center">
                    <FileText className="size-8 text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-800">No documents found</p>
                    <p className="text-xs text-slate-500">Try changing your search query or filter tab.</p>
                  </div>
                ) : data.viewMode === 'grid' ? (
                  <DocumentChecklistGridView
                    filteredItems={data.filteredItems}
                    blobMap={modals.blobMap}
                    canReview={data.canReview}
                    canUpload={data.canUpload}
                    activeProposal={data.activeProposal}
                    handleOpenReviewModal={modals.handleOpenReviewModal}
                    handlePreviewDocument={modals.handlePreviewDocument}
                    handleOpenUploadModal={modals.handleOpenUploadModal}
                    setVersionModalDoc={modals.setVersionModalDoc}
                    handleRemoveFile={modals.handleRemoveFile}
                    handleToggleItemVerify={data.handleToggleItemVerify}
                  />
                ) : (
                  <DocumentChecklistListView
                    filteredItems={data.filteredItems}
                    isReadOnly={data.isReadOnly}
                    canReview={data.canReview}
                    canUpload={data.canUpload}
                    isAdmin={data.isAdmin}
                    isFocal={data.isFocal}
                    isTemplateEditMode={templateConfig.isTemplateEditMode}
                    rowMenuOpenId={templateConfig.rowMenuOpenId}
                    setRowMenuOpenId={templateConfig.setRowMenuOpenId}
                    handleToggleItemVerify={data.handleToggleItemVerify}
                    setVersionModalDoc={modals.setVersionModalDoc}
                    handlePreviewDocument={modals.handlePreviewDocument}
                    handleOpenReviewModal={modals.handleOpenReviewModal}
                    handleOpenUploadModal={modals.handleOpenUploadModal}
                    handleRemoveFile={modals.handleRemoveFile}
                    handleOpenEditTemplateModal={templateConfig.handleOpenEditTemplateModal}
                    handleDeactivateTemplateItem={templateConfig.handleDeactivateTemplateItem}
                    handleDeleteTemplateItem={templateConfig.handleDeleteTemplateItem}
                  />
                )}

                <DocumentChecklistRemarks
                  isStaff={data.isStaff}
                  canReview={data.canReview}
                  autoSaveStatus={data.autoSaveStatus}
                  lastSavedTime={data.lastSavedTime}
                  editingOverallRemarks={data.editingOverallRemarks}
                  setEditingOverallRemarks={data.setEditingOverallRemarks}
                  canMarkComplete={data.canMarkComplete}
                  stats={data.stats}
                  handleMarkReviewCompleted={data.handleMarkReviewCompleted}
                  isCompletingReview={data.isCompletingReview}
                />
              </>
            )}
          </main>
        </div>
      )}

      <DocumentUploadModal
        uploadModalItem={modals.uploadModalItem}
        isUploading={modals.isUploading}
        isDragging={modals.isDragging}
        setIsDragging={modals.setIsDragging}
        fileInputRef={modals.fileInputRef}
        selectedUploadFile={modals.selectedUploadFile}
        setSelectedUploadFile={modals.setSelectedUploadFile}
        handleCloseUploadModal={modals.handleCloseUploadModal}
        handleDropFile={modals.handleDropFile}
        validateAndSetFile={modals.validateAndSetFile}
        handleConfirmUpload={modals.handleConfirmUpload}
      />

      <DocumentReviewModal
        reviewModalItem={modals.reviewModalItem}
        isFullscreen={modals.isFullscreen}
        setIsFullscreen={modals.setIsFullscreen}
        blobMap={modals.blobMap}
        isLoadingPreviewBlob={modals.isLoadingPreviewBlob}
        handleOpenReviewModal={modals.handleOpenReviewModal}
        handleCloseReviewModal={modals.handleCloseReviewModal}
        isSubmittingReview={modals.isSubmittingReview}
        setVersionModalDoc={modals.setVersionModalDoc}
        historyList={data.historyList}
        activeProposal={data.activeProposal}
        reviewDecision={modals.reviewDecision}
        setReviewDecision={modals.setReviewDecision}
        reviewRemarks={modals.reviewRemarks}
        setReviewRemarks={modals.setReviewRemarks}
        handleConfirmReview={modals.handleConfirmReview}
      />

      <ProjectSelectorModal
        isProjectSelectorOpen={data.isProjectSelectorOpen}
        setIsProjectSelectorOpen={data.setIsProjectSelectorOpen}
        activeProgram={data.activeProgram}
        modalSearchQuery={data.modalSearchQuery}
        setModalSearchQuery={data.setModalSearchQuery}
        modalFilter={data.modalFilter}
        setModalFilter={data.setModalFilter}
        filteredModalProposals={data.filteredModalProposals}
        activeProposal={data.activeProposal}
        handleSelectProposal={data.handleSelectProposal}
      />

      <DocumentVersionHistoryModal
        versionModalDoc={modals.versionModalDoc}
        setVersionModalDoc={modals.setVersionModalDoc}
        handlePreviewDocument={modals.handlePreviewDocument}
        handleOpenReviewModal={modals.handleOpenReviewModal}
        handleRestoreArchivedVersion={modals.handleRestoreArchivedVersion}
      />

      <DocumentTemplateModal
        isTemplateModalOpen={templateConfig.isTemplateModalOpen}
        editingTemplateItem={templateConfig.editingTemplateItem}
        activeProgram={data.activeProgram}
        handleCloseTemplateModal={templateConfig.handleCloseTemplateModal}
        isSubmittingTemplate={templateConfig.isSubmittingTemplate}
        handleSaveTemplateModal={templateConfig.handleSaveTemplateModal}
        templateFormData={templateConfig.templateFormData}
        setTemplateFormData={templateConfig.setTemplateFormData}
        categories={data.categories}
      />

      <DocumentPreviewModal
        isOpen={modals.previewDoc.isOpen}
        onClose={() => modals.setPreviewDoc((prev) => ({ ...prev, isOpen: false }))}
        title={modals.previewDoc.title}
        fileName={modals.previewDoc.fileName}
        fileSize={modals.previewDoc.fileSize}
        uploadedAt={modals.previewDoc.uploadedAt}
        status={modals.previewDoc.status}
        blobUrl={modals.previewDoc.blobUrl}
        isLoading={modals.previewDoc.isLoading}
        error={modals.previewDoc.error}
        onDownload={modals.handleDownloadPreviewFile}
        onOpenNewTab={modals.handleOpenPreviewNewTab}
      />

      <ArchiveUndoToast
        archiveToast={templateConfig.archiveToast}
        handleRestoreTemplateItem={templateConfig.handleRestoreTemplateItem}
        archiveToastTimerRef={templateConfig.archiveToastTimerRef}
        setArchiveToast={templateConfig.setArchiveToast}
      />
    </div>
  );
}
