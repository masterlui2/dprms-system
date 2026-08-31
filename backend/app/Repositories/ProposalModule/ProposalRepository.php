<?php

namespace App\Repositories\ProposalModule;

use App\Models\Proposal;
use App\Repositories\BaseRepository;
use App\Repositories\Contracts\ProposalModule\ProposalRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Override;

class ProposalRepository extends BaseRepository implements ProposalRepositoryInterface{
    public function __construct(Proposal $model)
    {
        parent::__construct($model);
    }

    #[Override]
    public function findByReferenceNumber(string $referenceNumber): ?Proposal
    {
        return $this->model->newQuery()
            ->with([
                'user:id,name,email',
                'focal:id,name,email',
                'reviewed:id,name,email',
                'setup_proposal',
                'gia_proposal',
            ])
            ->where('reference_number', $referenceNumber)
            ->first();
    }

    #[Override]
    public function findBySubmitter(int $userId): Collection
    {
        return $this->model->newQuery()->where("submitted_by",$userId)->get();
    }

    #[Override]
    public function findByStatus(string $status): Collection
    {
        return $this->model->newQuery()->where("status",$status)->get();
    }

    #[Override]
    public function updateStatus(int $id, string $status, ?string $remarks = null): bool
    {
        $proposal = $this->model->newQuery()->find($id);

        if (! $proposal) {
            return false;
        }

        $proposal->status = $status;
        $proposal->remarks = $remarks;

        if ($status === 'APPROVED' && ! $proposal->approved_at) {
            $proposal->approved_at = now();
        } elseif ($status === 'DISAPPROVED') {
            $proposal->disapproved_at = now();
        }

        return $proposal->save();
    }


    #[Override]
    public function findIndex(array $with = []): Collection
    {
        return $this->model->newQuery()->with($with)->get();
    }

    #[Override]
    public function assignProjectStaff(int $userId, int $proposalId): bool
    {
        $proposal = $this->model->newQuery()->find($proposalId);

        if(! $proposal){
            return false;
        }

        $proposal->reviewed_by = $userId;
        $proposal->status = "UNDER_VALIDATION";
        return $proposal->save();
    }

    #[Override]
    public function endorseToFocal(int $proposalId, int $focalId, ?string $remarks = null): bool
    {
        $proposal = $this->model->newQuery()->find($proposalId);

        if (! $proposal) {
            return false;
        }

        $proposal->focal_id = $focalId;
        $proposal->status = 'ENDORSED_TO_FOCAL';
        $proposal->remarks = $remarks;
        return $proposal->save();
    }

    #[Override]
    public function returnForRevision(int $proposalId, ?string $remarks = null): bool
    {
        $proposal = $this->model->newQuery()->find($proposalId);

        if (! $proposal) {
            return false;
        }

        $proposal->status = 'RETURNED';
        $proposal->remarks = $remarks;
        return $proposal->save();
    }

    #[Override]
    public function assignOfficers(int $proposalId, ?int $staffId = null, ?int $focalId = null, ?string $remarks = null): bool
    {
        $proposal = $this->model->newQuery()->find($proposalId);

        if (! $proposal) {
            return false;
        }

        if ($staffId !== null) {
            $proposal->assigned_staff_id = $staffId;
            $proposal->reviewed_by = $staffId;
        }

        if ($focalId !== null) {
            $proposal->assigned_focal_id = $focalId;
            $proposal->focal_id = $focalId;
        }

        if ($remarks !== null) {
            $proposal->remarks = $remarks;
        }

        return $proposal->save();
    }

    #[Override]
    public function approve(int $proposalId, int $directorId, ?string $remarks = null): bool
    {
        $proposal = $this->model->newQuery()->find($proposalId);

        if (! $proposal) {
            return false;
        }

        $proposal->status = 'APPROVED';
        $proposal->approved_at = now();
        $proposal->reviewed_by = $directorId;
        $proposal->remarks = $remarks;
        return $proposal->save();
    }

    #[Override]
    public function disapprove(int $proposalId, int $directorId, ?string $remarks = null): bool
    {
        $proposal = $this->model->newQuery()->find($proposalId);

        if (! $proposal) {
            return false;
        }

        $proposal->status = 'DISAPPROVED';
        $proposal->disapproved_at = now();
        $proposal->reviewed_by = $directorId;
        $proposal->remarks = $remarks;
        return $proposal->save();
    }
}



