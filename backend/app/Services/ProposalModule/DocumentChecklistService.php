<?php

namespace App\Services\ProposalModule;

use App\Models\Document;
use App\Models\DocumentChecklistTemplate;
use App\Models\DocumentType;
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
    public const TEMPLATE_CODE_TO_DOC_TYPE_NAME = [
        // SETUP SET 1
        'setup-s1-tna-01' => 'Filled-out TNA Form 01',
        'setup-s1-gad-assessment' => 'GAD Assessment (GWP)',
        'setup-s1-gad-checklist' => 'GAD Checklist for S&T Interventions in MSMEs',
        'setup-s1-hazard-hunter' => 'Hazard Hunter',
        'setup-s1-mayors-permit' => "Recent Mayor's Permit",
        'setup-s1-dti-registration' => 'DTI Registration Certificate',
        'setup-s1-bir-registration' => 'BIR Registration',
        'setup-s1-blank-or' => 'Photocopy of Blank Official Receipt',
        'setup-s1-equipment-quotations' => 'Three (3) Valid Equipment Quotations',
        'setup-s1-lease-contract' => 'Lease Contract for Rented Manufacturing Space',
        'setup-s1-corp-board-res' => 'Notarized Board Resolution',
        'setup-s1-corp-sec-cda' => 'SEC Registration Certificate',
        'setup-s1-corp-aoi' => 'Articles of Incorporation / Cooperation',
        'setup-s1-corp-sec-cert' => "Secretary's Certificate of Incumbent Officers",
        'setup-s1-fs-financial-position' => 'Statement of Financial Position',
        'setup-s1-fs-financial-operation' => 'Statement of Financial Operations',
        'setup-s1-fs-cash-flows' => 'Statement of Cash Flows',
        'setup-s1-fs-changes-equity' => "Statement of Changes in Owner's Equity",
        'setup-s1-fs-notes' => 'Notes to Financial Statements',
        'setup-s1-loi-commitment' => 'Letter of Intent for SETUP Assistance',

        // SETUP SET 2
        'setup-s2-biodata' => 'Bio-data of the Approved Signatory',
        'setup-s2-govt-id' => 'Valid Government-issued ID of the Approved Signatory',
        'setup-s2-brgy-cert' => 'Barangay Certificate of Permanent Residence',
        'setup-s2-omnibus' => 'Omnibus Affidavit',
        'setup-s2-tna-form-4' => 'TNA Form 4',

        // SETUP SET 3
        'setup-s3-request-funds' => 'Request for Release of Funds',
        'setup-s3-lbp-waiver' => 'Waiver and Authorization to Tag LBP Account',
        'setup-s3-payee-form' => 'Payee Data Form',
        'setup-s3-notarized-moa' => 'Notarized and Signed MOA',
        'setup-s3-pre-project-sheet' => 'Pre-Project Implementation Sheet',
        'setup-s3-notice-approval' => 'Notice of Approval',
        'setup-s3-approved-lib' => 'Approved Line-Item Budget',
        'setup-s3-ard-approval' => 'Recommending Approval of ARD',
        'setup-s3-psto-endorsement' => 'Endorsement Letter from C/PSTO',
        'setup-s3-final-proposal' => 'Final Copy of Project Proposal',
        'setup-s3-rtec-report' => 'RTEC Report',
        'setup-s3-risk-register' => 'Candidate Risk Register',
        'setup-s3-seti-scorecard' => 'SETI Scorecard',

        // GIA Stage 01
        'gia-s1-loi' => 'Letter of Intent or for Collaboration duly signed by the Head of IA',
        'gia-s1-endorsement' => 'Endorsement Letter from C/PSTO',
        'gia-s1-eligibility' => 'Project Leader Eligibility Checklist',
        'gia-s1-dost-form-4' => 'Complete Project Proposal Form',
        'gia-s1-dost-form-6' => 'Approved Line-Item Budget',
        'gia-s1-dost-form-5' => 'Workplan and Implementation Schedule',
        'gia-s1-rtec-report' => 'RTEC Report',
        'gia-s1-seti-scorecard' => 'SETI Scorecard',
        'gia-s1-gad-checklist' => 'GAD Checklist for S&T Interventions in MSMEs',
        'gia-s1-moa-resolution' => 'Notarized and Signed MOA',
        'gia-s1-cfa' => 'Certificate of Availability of Funds / Counterpart Funding',
        'gia-s1-ched-accreditation' => 'CHED Accreditation',
        'gia-s1-good-track-record' => 'Certification of Good Track Record with DOST',
        'gia-s1-sec-cda-dole' => 'SEC/CDA/DOLE Registration and Articles of Incorporation/Cooperation with By-Laws',
        'gia-s1-audited-fs' => 'Audited Financial Statements for the past three (3) years',
        'gia-s1-sworn-affidavit' => 'Sworn Affidavit of no relationship',
        'gia-s1-secretary-cert' => "Secretary's Certificate of directors and officers",
        'gia-s1-board-resolution' => 'Board Resolution for the engagement of the NGO/CSO/PO for the project, assignment of the official representative, and authority to sign related documents and transact with DOST Davao Region',

        // GIA Stage 02
        'gia-s2-request-release' => 'Request for Release of Funds',
        'gia-s2-payee-data-form' => 'Payee Data Form',
        'gia-s2-notarized-moa' => 'Notarized and Signed MOA',
        'gia-s2-rtec-report' => 'RTEC Report',
        'gia-s2-dost-form-4b' => 'Complete Project Proposal Form',
        'gia-s2-dost-form-6' => 'Approved Line-Item Budget',
        'gia-s2-dost-form-5' => 'Workplan and Implementation Schedule',
        'gia-s2-cfa' => 'Certificate of Availability of Funds / Counterpart Funding',
        'gia-s2-loi' => 'Letter of Intent or for Collaboration duly signed by the Head of IA',
        'gia-s2-dost-form-7' => 'Certification of Good Track Record with DOST',
        'gia-s2-brgy-bond' => 'Bond of Barangay Captain and Barangay Treasurer with an amount that can cover the funds to be granted',
        'gia-s2-brgy-certification' => 'Certification or other equivalent documents of previously handled projects through downloaded funds from external sources, preferably government agencies, as applicable',
        'gia-s2-ched-accreditation' => 'CHED Accreditation',
        'gia-s2-good-track-record' => 'Certification of Good Track Record with DOST',
    ];

    public const STATUS_COMPLIED = 'Complied';
    public const STATUS_MISSING = 'Missing';
    public const STATUS_UNDER_REVIEW = 'Under Review';
    public const STATUS_NEEDS_REVISION = 'Needs Revision';

    public static function normalizeStatus(?string $status): string
    {
        return match (strtolower(trim((string) $status))) {
            'complied', 'approved' => self::STATUS_COMPLIED,
            'needs revision', 'needs_revision', 'returned_for_revision', 'returned' => self::STATUS_NEEDS_REVISION,
            'under review', 'under_review', 'pending' => self::STATUS_UNDER_REVIEW,
            default => self::STATUS_MISSING,
        };
    }

    public function __construct(
        protected DocumentChecklistRepositoryInterface $checklistRepository
    ) {}

    #[Override]
    public function getChecklistTemplates(string $programType, bool $includeInactive = false): Collection
    {
        return $this->checklistRepository->getTemplatesByProgram(strtoupper($programType), $includeInactive);
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
                'documents.archived_versions',
            ])
            ->findOrFail($proposalId);

        $program = strtoupper($proposal->program_type === 'GIA' ? 'GIA' : 'SETUP');
        $templates = $this->checklistRepository->getTemplatesByProgram($program);
        $existingReviews = $this->checklistRepository->getReviewsByProposalId($proposalId)->keyBy('template_item_id');
        $summary = $this->checklistRepository->getSummary($proposalId);
        $allDocTypes = DocumentType::query()->select(['id', 'name', 'applicable_program'])->get();

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

            $expectedDocTypeId = $this->resolveDocumentTypeId($template->item_code, $program, $allDocTypes);
            $isInternal = $this->isInternalDocumentTemplate($template, $expectedDocTypeId, $allDocTypes);

            $review = $existingReviews->get($template->id);

            $matchedDoc = null;
            if ($review && $review->document_id) {
                $matchedDoc = $uploadedDocs->firstWhere('id', $review->document_id);
            }
            if (! $matchedDoc) {
                $matchedDoc = $this->findMatchingDocument($template, $uploadedDocs, $program, $expectedDocTypeId, $isInternal);
            }

            if ($matchedDoc) {
                if ($review && $review->status && in_array(self::normalizeStatus($review->status), [self::STATUS_COMPLIED, self::STATUS_NEEDS_REVISION], true)) {
                    $status = self::normalizeStatus($review->status);
                    $isPresent = ($status === self::STATUS_COMPLIED);
                } else {
                    $status = self::normalizeStatus($matchedDoc->status);
                    $isPresent = ($status === self::STATUS_COMPLIED);
                }
            } else {
                if ($isInternal) {
                    $status = self::STATUS_MISSING;
                    $isPresent = false;
                } else {
                    $status = $review ? self::normalizeStatus($review->status) : self::STATUS_MISSING;
                    $isPresent = (bool) ($review?->is_present ?? false);
                }
            }

            $remarks = $review?->remarks ?? $matchedDoc?->remarks ?? '';
            $reviewedAt = $review?->reviewed_at?->toIso8601String() ?? $matchedDoc?->reviewed_at?->toIso8601String() ?? null;

            $isMandatory = $template->is_mandatory && $isApplicable;

            if ($isMandatory) {
                $totalRequired++;
                if ($isPresent || $status === self::STATUS_COMPLIED) {
                    $compliedCount++;
                }
            }

            $items[] = [
                'id' => $template->item_code,
                'template_id' => $template->id,
                'document_type_id' => $expectedDocTypeId,
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
                    'document_type_id' => $matchedDoc->document_type_id,
                    'file_name' => $matchedDoc->file_name,
                    'file_path' => $matchedDoc->file_path,
                    'file_size' => $matchedDoc->file_size,
                    'mime_type' => $matchedDoc->mime_type,
                    'status' => $matchedDoc->status,
                    'remarks' => $matchedDoc->remarks,
                    'reviewed_at' => $matchedDoc->reviewed_at?->toIso8601String(),
                    'created_at' => $matchedDoc->created_at?->toIso8601String(),
                    'document_type' => $matchedDoc->document_type ? [
                        'id' => $matchedDoc->document_type->id,
                        'name' => $matchedDoc->document_type->name,
                        'group' => $matchedDoc->document_type->group,
                    ] : null,
                    'archived_versions' => $matchedDoc->archived_versions?->map(fn($v) => [
                        'id' => $v->id,
                        'file_name' => $v->file_name,
                        'file_path' => $v->file_path,
                        'file_size' => $v->file_size,
                        'status' => $v->status,
                        'remarks' => $v->remarks,
                        'archived_at' => $v->archived_at?->toIso8601String(),
                    ])->values()->toArray() ?? [],
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

            if (!empty($data['document_id'])) {
                $docStatus = match ($data['status'] ?? '') {
                    self::STATUS_COMPLIED => 'approved',
                    self::STATUS_NEEDS_REVISION => 'returned_for_revision',
                    self::STATUS_UNDER_REVIEW => 'pending',
                    default => null,
                };
                if ($docStatus) {
                    Document::query()->where('id', (int) $data['document_id'])->update([
                        'status' => $docStatus,
                        'reviewed_by' => $userId,
                        'reviewed_at' => now(),
                        'remarks' => $data['remarks'] ?? null,
                    ]);
                }
            }

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
        DB::transaction(function () use ($proposalId, $payload, $userId) {
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
                        $docId = $item['document_id'] ?? $item['uploaded_doc']['id'] ?? $item['uploadedDoc']['id'] ?? null;
                        $reviewData = [
                            'is_present' => $item['is_present'] ?? false,
                            'status' => $item['status'] ?? 'Under Review',
                            'remarks' => $item['remarks'] ?? null,
                            'reviewed_by' => $userId,
                            'reviewed_at' => now(),
                        ];
                        if ($docId) {
                            $reviewData['document_id'] = $docId;
                            $docStatus = match ($reviewData['status']) {
                                self::STATUS_COMPLIED => 'approved',
                                self::STATUS_NEEDS_REVISION => 'returned_for_revision',
                                self::STATUS_UNDER_REVIEW => 'pending',
                                default => null,
                            };
                            if ($docStatus) {
                                Document::query()->where('id', (int) $docId)->update([
                                    'status' => $docStatus,
                                    'reviewed_by' => $userId,
                                    'reviewed_at' => now(),
                                    'remarks' => $reviewData['remarks'] ?? null,
                                ]);
                            }
                        } elseif (array_key_exists('document_id', $item) && $item['document_id'] === null) {
                            $reviewData['document_id'] = null;
                        }

                        $this->checklistRepository->updateOrCreateReview($proposalId, $templateId, $reviewData);
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
        });

        return $this->getProposalChecklist($proposalId);
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

    #[Override]
    public function createTemplate(array $data): DocumentChecklistTemplate
    {
        return $this->checklistRepository->createTemplate($data);
    }

    #[Override]
    public function updateTemplate(int $id, array $data): DocumentChecklistTemplate
    {
        return $this->checklistRepository->updateTemplate($id, $data);
    }

    #[Override]
    public function restoreTemplate(int $id): DocumentChecklistTemplate
    {
        return $this->checklistRepository->updateTemplate($id, ['is_active' => true]);
    }

    #[Override]
    public function deleteTemplate(int $id): bool
    {
        return $this->checklistRepository->deleteTemplate($id);
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

    public static function normalizeText(?string $value): string
    {
        if (!$value) {
            return '';
        }
        $cleaned = preg_replace('/^[a-z0-9]+[\.\)]\s*/i', '', $value);
        $cleaned = preg_replace('/[^a-z0-9]+/i', ' ', (string) $cleaned);
        return trim(strtolower((string) $cleaned));
    }

    protected function resolveDocumentTypeId(string $itemCode, string $program, Collection $allDocTypes): ?int
    {
        $targetName = self::TEMPLATE_CODE_TO_DOC_TYPE_NAME[$itemCode] ?? null;
        if (!$targetName) {
            return null;
        }

        $matched = $allDocTypes->first(function (DocumentType $dt) use ($targetName, $program) {
            return $dt->name === $targetName && in_array($dt->applicable_program, [$program, 'BOTH'], true);
        });

        return $matched?->id ?? $allDocTypes->firstWhere('name', $targetName)?->id;
    }

    public function isInternalDocumentTemplate(
        DocumentChecklistTemplate $template,
        ?int $targetDocTypeId,
        Collection $allDocTypes
    ): bool {
        if ($targetDocTypeId) {
            $docType = $allDocTypes->firstWhere('id', $targetDocTypeId);
            if ($docType && ! $docType->is_applicant_visible) {
                return true;
            }
        }

        $phase = strtoupper((string) ($template->phase_code ?? ''));
        if (in_array($phase, ['SET3', 'STAGE 02', 'STAGE 03', 'STAGE 04', 'STAGE 05', 'STAGE02', 'STAGE03', 'STAGE04', 'STAGE05'], true)) {
            return true;
        }

        return in_array($template->item_code, [
            'setup-s1-tna-01',
            'setup-s1-gad-assessment',
            'setup-s1-gad-checklist',
            'setup-s1-hazard-hunter',
            'setup-s2-tna-form-4',
            'setup-s3-pre-project-sheet',
            'setup-s3-request-funds',
            'setup-s3-lbp-waiver',
            'setup-s3-payee-form',
            'setup-s3-notarized-moa',
            'setup-s3-notice-approval',
            'setup-s3-approved-lib',
            'setup-s3-ard-approval',
            'setup-s3-psto-endorsement',
            'setup-s3-final-proposal',
            'setup-s3-rtec-report',
            'setup-s3-risk-register',
            'setup-s3-seti-scorecard',
            'gia-s1-endorsement',
            'gia-s1-rtec-report',
            'gia-s1-seti-scorecard',
        ], true);
    }

    protected function findMatchingDocument(
        DocumentChecklistTemplate $template,
        Collection $uploadedDocs,
        string $program,
        ?int $targetDocTypeId = null,
        bool $isInternal = false
    ): ?Document {
        if ($targetDocTypeId) {
            $direct = $uploadedDocs->firstWhere('document_type_id', $targetDocTypeId);
            if ($direct) {
                return $direct;
            }
        }

        $canonicalName = self::TEMPLATE_CODE_TO_DOC_TYPE_NAME[$template->item_code] ?? null;
        if ($canonicalName) {
            $exactTypeMatch = $uploadedDocs->first(function (Document $doc) use ($canonicalName, $program) {
                if (! $doc->document_type) {
                    return false;
                }
                if ($doc->document_type->set_number === 'PROPOSAL') {
                    return false;
                }
                if (! in_array($doc->document_type->applicable_program, [$program, 'BOTH'], true)) {
                    return false;
                }
                return strcasecmp(trim($doc->document_type->name), trim($canonicalName)) === 0;
            });

            if ($exactTypeMatch) {
                return $exactTypeMatch;
            }
        }

        if ($isInternal) {
            return null;
        }

        $normalizedTarget = self::normalizeText($canonicalName ?: $template->document_name);

        return $uploadedDocs->first(function (Document $doc) use ($normalizedTarget, $program) {
            if ($doc->document_type && $doc->document_type->set_number === 'PROPOSAL') {
                return false;
            }
            if ($doc->document_type && ! in_array($doc->document_type->applicable_program, [$program, 'BOTH'], true)) {
                return false;
            }

            $normalizedType = self::normalizeText($doc->document_type?->name);
            if ($normalizedType) {
                if ($normalizedType === $normalizedTarget
                    || (strlen($normalizedType) >= 3 && str_contains($normalizedTarget, $normalizedType))
                    || (strlen($normalizedTarget) >= 3 && str_contains($normalizedType, $normalizedTarget))
                ) {
                    return true;
                }
            }

            $normalizedFile = self::normalizeText(pathinfo($doc->file_name ?? '', PATHINFO_FILENAME));
            if ($normalizedFile && strlen($normalizedFile) >= 3) {
                if ($normalizedFile === $normalizedTarget
                    || str_contains($normalizedTarget, $normalizedFile)
                    || str_contains($normalizedFile, $normalizedTarget)
                ) {
                    return true;
                }
            }

            return false;
        });
    }
}
