<?php

namespace App\Services\ProposalModule;

use App\Models\Document;
use App\Models\DocumentChecklistTemplate;
use App\Models\Proposal;
use App\Models\ProposalChecklistHistory;
use App\Models\ProposalChecklistReview;
use App\Models\ProposalChecklistSummary;
use App\Repositories\Contracts\ProposalModule\DocumentChecklistRepositoryInterface;
use App\Services\Contracts\ProposalModule\DocumentChecklistServiceInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Override;

class DocumentChecklistService implements DocumentChecklistServiceInterface
{
    public function __construct(
        protected DocumentChecklistRepositoryInterface $checklistRepository
    ) {}

    #[Override]
    public function getChecklistTemplates(string $programType): Collection
    {
        return $this->checklistRepository->getTemplatesByProgram(strtoupper($programType));
    }

    #[Override]
    public function getProposalChecklist(int $proposalId): array
    {
        $proposal = Proposal::query()
            ->with([
                'user',
                'focal',
                'assigned_focal',
                'setup_proposal',
                'gia_proposal',
                'documents.document_type',
            ])
            ->findOrFail($proposalId);

        $program = strtoupper($proposal->program_type === 'GIA' ? 'GIA' : 'SETUP');
        $templates = $this->checklistRepository->getTemplatesByProgram($program);
        $existingReviews = $this->checklistRepository->getReviewsByProposalId($proposalId)->keyBy('template_item_id');
        $summary = $this->checklistRepository->getSummary($proposalId);

        $uploadedDocs = $proposal->documents;

        $setupData = $proposal->setup_proposal->first();
        $giaData = $proposal->gia_proposal->first();

        $rawBizType = $setupData?->business_type 
            ?? $setupData?->form_snapshot['organizationType']
            ?? $setupData?->form_snapshot['business_type']
            ?? 'Sole Proprietorship';

        $businessType = match (strtoupper(str_replace(['-', '_'], ' ', (string)$rawBizType))) {
            'SOLE PROPRIETORSHIP' => 'Sole Proprietorship',
            'CORPORATION' => 'Corporation',
            'COOPERATIVE' => 'Cooperative',
            'PARTNERSHIP' => 'Partnership',
            default => $rawBizType,
        };

        $spaceOwnership = $setupData?->space_ownership 
            ?? $setupData?->form_snapshot['space_ownership'] 
            ?? 'Owned';

        $rawOrgType = $giaData?->proponent_category 
            ?? $giaData?->agency_type 
            ?? $giaData?->organization_type 
            ?? $giaData?->form_snapshot['organizationType']
            ?? 'Higher Education Institution';

        $orgType = match ($rawOrgType) {
            'Higher Education Institution', 'HEI', 'SUC' => 'HEI',
            'Private Sector', 'Private', 'NGO', 'CSO', 'PO' => 'NGO',
            'Barangay LGU', 'LGU' => 'Barangay LGU',
            default => $rawOrgType,
        };

        $hasEquipment = true;
        if (isset($setupData?->form_snapshot['has_equipment'])) {
            $hasEquipment = (bool) $setupData->form_snapshot['has_equipment'];
        } elseif (isset($giaData?->form_snapshot['has_equipment'])) {
            $hasEquipment = (bool) $giaData->form_snapshot['has_equipment'];
        }

        $items = [];
        $totalRequired = 0;
        $compliedCount = 0;

        foreach ($templates as $template) {
            $isApplicable = $this->evaluateApplicability($template, [
                'business_type' => $businessType,
                'space_ownership' => $spaceOwnership,
                'org_type' => $orgType,
                'has_equipment' => $hasEquipment,
            ]);

            $matchedDoc = $this->findMatchingDocument($template, $uploadedDocs);

            $review = $existingReviews->get($template->id);

            $isPresent = $review ? $review->is_present : false;
            $status = $review ? $review->status : 'Missing';

            if ($matchedDoc) {
                if ($review) {
                    $isPresent = $review->is_present;
                    $status = $review->status;
                } else {
                    $isDocApproved = $matchedDoc->status === 'approved';
                    $isPresent = $isDocApproved;
                    if ($matchedDoc->status === 'approved') {
                        $status = 'Complied';
                    } elseif ($matchedDoc->status === 'returned_for_revision') {
                        $status = 'Needs Revision';
                    } else {
                        $status = 'Under Review';
                    }
                }
            } else {
                if (!$review) {
                    $isPresent = false;
                    $status = 'Missing';
                }
            }

            $remarks = $review?->remarks ?? $matchedDoc?->remarks ?? '';
            $reviewedAt = $review?->reviewed_at?->toIso8601String() ?? $matchedDoc?->reviewed_at?->toIso8601String() ?? null;

            $isMandatory = $template->is_mandatory && $isApplicable;

            if ($isMandatory) {
                $totalRequired++;
                if ($isPresent || $status === 'Complied') {
                    $compliedCount++;
                }
            }

            $items[] = [
                'id' => $template->item_code,
                'template_id' => $template->id,
                'name' => $template->document_name,
                'group' => $template->group_name,
                'set_id' => $program === 'SETUP' ? $template->phase_code : null,
                'stage_id' => $program === 'GIA' ? $template->phase_code : null,
                'is_required' => $isMandatory,
                'is_applicable' => $isApplicable,
                'is_present' => $isPresent,
                'status' => $status,
                'remarks' => $remarks,
                'uploaded_doc' => $matchedDoc ? [
                    'id' => $matchedDoc->id,
                    'file_name' => $matchedDoc->file_name,
                    'file_path' => $matchedDoc->file_path,
                    'file_size' => $matchedDoc->file_size,
                    'mime_type' => $matchedDoc->mime_type,
                    'status' => $matchedDoc->status,
                    'remarks' => $matchedDoc->remarks,
                    'reviewed_at' => $matchedDoc->reviewed_at?->toIso8601String(),
                    'created_at' => $matchedDoc->created_at?->toIso8601String(),
                ] : null,
                'reviewed_at' => $reviewedAt,
            ];
        }

        $compliancePercentage = $totalRequired > 0 ? (int) round(($compliedCount / $totalRequired) * 100) : 0;

        return [
            'proposal_id' => $proposal->id,
            'reference_number' => $proposal->reference_number ?? "PROP-{$proposal->id}",
            'enterprise_name' => $setupData?->business_name ?? $giaData?->organization_name ?? $proposal->title ?? 'Enterprise',
            'proponent_name' => $proposal->user?->name ?? 'Proponent',
            'proponent_email' => $proposal->user?->email ?? '',
            'program' => $program,
            'status' => $proposal->status ?? 'Submitted',
            'submitted_date' => $proposal->submitted_at?->toIso8601String() ?? $proposal->created_at?->toIso8601String(),
            'district' => $giaData?->city_municipality ?? $giaData?->province ?? $setupData?->city_municipality ?? $setupData?->province ?? '',
            'focal_name' => $proposal->assigned_focal?->name ?? $proposal->focal?->name ?? ($program === 'GIA' ? 'GIA Focal' : 'SETUP Focal'),
            'total_required' => $totalRequired,
            'complied_count' => $compliedCount,
            'compliance_percentage' => $compliancePercentage,
            'overall_remarks' => $summary?->overall_remarks ?? '',
            'is_completed' => $summary?->is_completed ?? false,
            'completed_by' => $summary?->completed_by,
            'completed_at' => $summary?->completed_at?->toIso8601String(),
            'last_updated' => $summary?->updated_at?->toIso8601String() ?? $proposal->updated_at?->toIso8601String(),
            'items' => $items,
        ];
    }

    #[Override]
    public function updateItemReview(int $proposalId, int $templateItemId, array $data, int $userId): ProposalChecklistReview
    {
        return DB::transaction(function () use ($proposalId, $templateItemId, $data, $userId) {
            $template = DocumentChecklistTemplate::query()->findOrFail($templateItemId);

            $review = $this->checklistRepository->updateOrCreateReview($proposalId, $templateItemId, [
                'document_id' => $data['document_id'] ?? null,
                'is_present' => $data['is_present'] ?? false,
                'status' => $data['status'] ?? 'Under Review',
                'remarks' => $data['remarks'] ?? null,
                'reviewed_by' => $userId,
                'reviewed_at' => now(),
            ]);

            $action = ($data['status'] ?? '') === 'Complied' ? 'REVIEW_APPROVED' : 'REVIEW_RETURNED';
            $this->logActivity(
                $proposalId,
                $userId,
                $action,
                $template->document_name,
                null,
                "Status updated to {$data['status']}. Remarks: " . ($data['remarks'] ?? 'None')
            );

            return $review;
        });
    }

    #[Override]
    public function batchSaveReviews(int $proposalId, array $payload, int $userId): array
    {
        return DB::transaction(function () use ($proposalId, $payload, $userId) {
            if (isset($payload['overall_remarks'])) {
                $this->checklistRepository->updateOrCreateSummary($proposalId, [
                    'overall_remarks' => $payload['overall_remarks'],
                ]);
            }

            if (!empty($payload['items']) && is_array($payload['items'])) {
                foreach ($payload['items'] as $item) {
                    $templateId = $item['template_id'] ?? null;
                    if (!$templateId && !empty($item['id'])) {
                        $template = DocumentChecklistTemplate::query()
                            ->where('item_code', $item['id'])
                            ->first();
                        $templateId = $template?->id;
                    }

                    if ($templateId) {
                        $this->checklistRepository->updateOrCreateReview($proposalId, $templateId, [
                            'is_present' => $item['is_present'] ?? false,
                            'status' => $item['status'] ?? 'Under Review',
                            'remarks' => $item['remarks'] ?? null,
                            'reviewed_by' => $userId,
                            'reviewed_at' => now(),
                        ]);
                    }
                }
            }

            $this->logActivity(
                $proposalId,
                $userId,
                'UPDATE_REMARKS',
                null,
                null,
                'Saved checklist review updates and notes.'
            );

            return $this->getProposalChecklist($proposalId);
        });
    }

    #[Override]
    public function completeReview(int $proposalId, ?string $finalRemarks, int $userId): ProposalChecklistSummary
    {
        return DB::transaction(function () use ($proposalId, $finalRemarks, $userId) {
            $summary = $this->checklistRepository->updateOrCreateSummary($proposalId, [
                'overall_remarks' => $finalRemarks,
                'is_completed' => true,
                'completed_by' => $userId,
                'completed_at' => now(),
            ]);

            $this->logActivity(
                $proposalId,
                $userId,
                'COMPLETE_REVIEW',
                null,
                null,
                'Document checklist review officially completed and verified.'
            );

            return $summary;
        });
    }

    #[Override]
    public function getChecklistHistory(int $proposalId): Collection
    {
        return $this->checklistRepository->getHistories($proposalId);
    }

    #[Override]
    public function logActivity(int $proposalId, int $userId, string $action, ?string $itemName, ?string $fileName, ?string $details = null, ?array $metadata = null): ProposalChecklistHistory
    {
        return $this->checklistRepository->createHistory([
            'proposal_id' => $proposalId,
            'user_id' => $userId,
            'action' => $action,
            'item_name' => $itemName,
            'file_name' => $fileName,
            'details' => $details,
            'metadata' => $metadata,
        ]);
    }

    protected function evaluateApplicability(DocumentChecklistTemplate $template, array $context): bool
    {
        $rules = $template->applicability_rules;
        if (empty($rules)) {
            return true;
        }

        if (!empty($rules['business_types']) && is_array($rules['business_types'])) {
            $bizType = $context['business_type'] ?? '';
            if (!in_array($bizType, $rules['business_types'], true)) {
                return false;
            }
        }

        if (!empty($rules['space_ownership'])) {
            $space = $context['space_ownership'] ?? '';
            if (strcasecmp($space, $rules['space_ownership']) !== 0) {
                return false;
            }
        }

        if (!empty($rules['org_types']) && is_array($rules['org_types'])) {
            $orgType = $context['org_type'] ?? '';
            if (!in_array($orgType, $rules['org_types'], true)) {
                return false;
            }
        }

        if (isset($rules['has_equipment']) && $rules['has_equipment'] === true) {
            $hasEquipment = $context['has_equipment'] ?? true;
            if (!$hasEquipment) {
                return false;
            }
        }

        return true;
    }

    protected function findMatchingDocument(DocumentChecklistTemplate $template, Collection $uploadedDocs): ?Document
    {
        $code = strtolower($template->item_code);
        $tmplName = strtolower(preg_replace('/^\d+\.\s*/', '', $template->document_name));

        return $uploadedDocs->first(function (Document $doc) use ($code, $tmplName) {
            $typeName = strtolower($doc->document_type?->name ?? '');
            $fileName = strtolower($doc->file_name ?? '');

            if ($typeName && (str_contains($tmplName, $typeName) || str_contains($typeName, $tmplName))) {
                return true;
            }

            if (str_contains($code, 'dti') && (str_contains($typeName, 'dti') || str_contains($fileName, 'dti'))) return true;
            if (str_contains($code, 'bir') && (str_contains($typeName, 'bir') || str_contains($fileName, 'bir'))) return true;
            if (str_contains($code, 'mayor') && (str_contains($typeName, 'mayor') || str_contains($fileName, 'mayor'))) return true;
            if (str_contains($code, 'receipt') && (str_contains($typeName, 'receipt') || str_contains($fileName, 'receipt'))) return true;
            if (str_contains($code, 'quotation') && (str_contains($typeName, 'quotation') || str_contains($fileName, 'quotation') || str_contains($fileName, 'quote'))) return true;
            if (str_contains($code, 'lease') && (str_contains($typeName, 'lease') || str_contains($fileName, 'lease') || str_contains($typeName, 'ownership') || str_contains($fileName, 'ownership'))) return true;
            if (str_contains($code, 'board-res') && (str_contains($typeName, 'board resolution') || str_contains($fileName, 'board_res') || str_contains($fileName, 'board-res'))) return true;
            if (str_contains($code, 'articles') && (str_contains($typeName, 'articles') || str_contains($fileName, 'articles') || str_contains($typeName, 'by-laws'))) return true;
            if (str_contains($code, 'sec-cert') && (str_contains($typeName, 'secretary') || str_contains($fileName, 'sec_cert') || str_contains($fileName, 'secretary'))) return true;
            if (str_contains($code, 'financial') && (str_contains($typeName, 'financial') || str_contains($fileName, 'financial') || str_contains($typeName, 'balance sheet') || str_contains($fileName, 'fs'))) return true;
            if (str_contains($code, 'letter-of-intent') && (str_contains($typeName, 'intent') || str_contains($fileName, 'intent') || str_contains($fileName, 'loi'))) return true;
            if (str_contains($code, 'tna-01') && (str_contains($typeName, 'tna form 01') || str_contains($fileName, 'tna_01') || str_contains($fileName, 'tna-01') || str_contains($fileName, 'tna_form_1'))) return true;
            if (str_contains($code, 'gad-assessment') && (str_contains($typeName, 'gwp') || str_contains($fileName, 'gwp') || str_contains($fileName, 'gad_assessment'))) return true;
            if (str_contains($code, 'gad-checklist') && (str_contains($typeName, 'gad checklist') || str_contains($fileName, 'gad_checklist') || str_contains($fileName, 'gad-checklist'))) return true;
            if (str_contains($code, 'hazard-hunter') && (str_contains($typeName, 'hazard') || str_contains($fileName, 'hazard'))) return true;
            if (str_contains($code, 'biodata') && (str_contains($typeName, 'bio-data') || str_contains($typeName, 'cv') || str_contains($fileName, 'biodata') || str_contains($fileName, 'cv'))) return true;
            if (str_contains($code, 'govt-id') && (str_contains($typeName, 'government-issued id') || str_contains($typeName, 'valid id') || str_contains($fileName, 'valid_id') || str_contains($fileName, 'govt_id'))) return true;
            if (str_contains($code, 'brgy-cert') && (str_contains($typeName, 'barangay') || str_contains($fileName, 'barangay') || str_contains($fileName, 'brgy'))) return true;
            if (str_contains($code, 'omnibus') && (str_contains($typeName, 'omnibus') || str_contains($fileName, 'omnibus'))) return true;

            if (str_contains($code, 'dost-form-1') && (str_contains($typeName, 'form 1') || str_contains($typeName, 'form 1a') || str_contains($typeName, 'form 1b') || str_contains($typeName, 'proposal form') || str_contains($fileName, 'form_1') || str_contains($fileName, 'form1'))) return true;
            if (str_contains($code, 'dost-form-2') && (str_contains($typeName, 'form 2') || str_contains($typeName, 'workplan') || str_contains($fileName, 'form_2') || str_contains($fileName, 'workplan'))) return true;
            if (str_contains($code, 'dost-form-3') && (str_contains($typeName, 'form 3') || str_contains($typeName, 'financial plan') || str_contains($typeName, 'lib') || str_contains($fileName, 'form_3') || str_contains($fileName, 'budget') || str_contains($fileName, 'lib'))) return true;
            if (str_contains($code, 'dost-form-4') && (str_contains($typeName, 'form 4') || str_contains($typeName, 'gender') || str_contains($fileName, 'form_4') || str_contains($fileName, 'gad'))) return true;
            if (str_contains($code, 'dost-form-5') && (str_contains($typeName, 'form 5') || str_contains($typeName, 'curriculum vitae') || str_contains($fileName, 'form_5') || str_contains($fileName, 'cv'))) return true;
            if (str_contains($code, 'dost-form-6') && (str_contains($typeName, 'form 6') || str_contains($typeName, 'endorsement') || str_contains($fileName, 'form_6') || str_contains($fileName, 'endorsement'))) return true;
            if (str_contains($code, 'cofunding') && (str_contains($typeName, 'co-funding') || str_contains($typeName, 'counterpart') || str_contains($fileName, 'cofunding') || str_contains($fileName, 'counterpart'))) return true;
            if (str_contains($code, 'sec-cda') && (str_contains($typeName, 'sec') || str_contains($typeName, 'cda') || str_contains($fileName, 'sec') || str_contains($fileName, 'cda'))) return true;
            if (str_contains($code, 'audited-fs') && (str_contains($typeName, 'audited') || str_contains($fileName, 'audited') || str_contains($fileName, 'fs'))) return true;

            $tmplWords = array_filter(explode(' ', preg_replace('/[^a-z0-9 ]/', '', $tmplName)), fn($w) => strlen($w) > 3 && !in_array($w, ['from', 'with', 'that', 'this', 'form', 'copy', 'each', 'past', 'years', 'least', 'indicates', 'indicating']));
            $typeWords = array_filter(explode(' ', preg_replace('/[^a-z0-9 ]/', '', $typeName)), fn($w) => strlen($w) > 3);
            if (count(array_intersect($tmplWords, $typeWords)) >= 2) {
                return true;
            }

            return false;
        });
    }
}
