import type { DocumentChecklistItem } from '../../../services/documentChecklistStore';

export function formatFileSize(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function getItemComplianceState(item: DocumentChecklistItem) {
  const hasFile = Boolean(item.uploadedDoc);
  const isReturned =
    hasFile && (item.status === 'Needs Revision' || item.uploadedDoc?.status === 'returned_for_revision');
  const isApproved =
    item.status === 'Complied' && (item.uploadedDoc?.status === 'approved' || !hasFile || Boolean(item.reviewedAt));

  if (isReturned) {
    return {
      type: 'RETURNED' as const,
      label: 'Revision',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80',
      iconClass: 'bg-rose-500 text-white',
    };
  }

  if (isApproved || (item.isPresent && !isReturned)) {
    return {
      type: 'SATISFIED' as const,
      label: 'Verified',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      iconClass: 'bg-emerald-500 text-white',
    };
  }

  if (hasFile) {
    return {
      type: 'UNDER_REVIEW' as const,
      label: 'In Review',
      badgeClass: 'bg-blue-50 text-[#0f53b7] border border-blue-200/80',
      iconClass: 'bg-[#0f53b7] text-white',
    };
  }

  return {
    type: 'PENDING' as const,
    label: null,
    badgeClass: '',
    iconClass: 'bg-slate-100 text-slate-400',
  };
}
