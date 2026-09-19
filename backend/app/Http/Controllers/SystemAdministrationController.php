<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\Proposal;
use App\Models\Role;
use App\Models\SetupProposal;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SystemAdministrationController extends Controller
{
    public function overview(): JsonResponse
    {
        $users = User::query()
            ->with('role:id,name,code,program_type')
            ->latest('updated_at')
            ->get(['id', 'name', 'email', 'is_active', 'program_type', 'last_login_at', 'created_at']);

        $roles = Role::query()
            ->withCount('user')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'program_type', 'description']);

        $programs = collect(['SETUP', 'GIA'])->map(fn (string $program) => [
            'code' => $program,
            'proposals' => Proposal::query()->where('program_type', $program)->count(),
            'projects' => Project::query()->where('program_type', $program)->count(),
            'active_projects' => Project::query()->where('program_type', $program)->where('status', 'active')->count(),
        ]);

        $municipalities = SetupProposal::query()
            ->whereNotNull('city_municipality')
            ->where('city_municipality', '!=', '')
            ->select('city_municipality', 'province')
            ->selectRaw('COUNT(*) as records_count')
            ->groupBy('city_municipality', 'province')
            ->orderBy('city_municipality')
            ->get();

        $budgets = ProjectBudget::query()
            ->select('program_type', 'status')
            ->selectRaw('COUNT(*) as records_count')
            ->selectRaw('COALESCE(SUM(total_amount), 0) as total_amount')
            ->groupBy('program_type', 'status')
            ->orderBy('program_type')
            ->get();

        $notifications = Notification::query()
            ->select('type')
            ->selectRaw('COUNT(*) as records_count')
            ->selectRaw('SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread_count')
            ->groupBy('type')
            ->orderBy('type')
            ->get();

        return response()->json(['data' => [
            'users' => $users,
            'roles' => $roles,
            'programs' => $programs,
            'municipalities' => $municipalities,
            'budgets' => $budgets,
            'notifications' => $notifications,
            'system' => [
                'database' => DB::connection()->getDriverName(),
                'latest_migration' => DB::table('migrations')->max('migration'),
                'users' => $users->count(),
                'audit_logs' => AuditLog::query()->count(),
                'backup_available' => false,
            ],
        ]]);
    }

    public function updateUserStatus(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot deactivate your own account.');
        $validated = $request->validate(['is_active' => ['required', 'boolean']]);
        $oldValue = $user->is_active;
        $user->update($validated);
        $this->audit($request, 'UPDATE_USER_STATUS', $user, ['is_active' => $oldValue], $validated);

        return response()->json(['data' => $user->fresh()->load('role:id,name,code,program_type')]);
    }

    public function updateUserRole(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot change your own role.');
        $validated = $request->validate([
            'role_id' => ['required', 'integer', Rule::exists('roles', 'id')],
        ]);
        $oldRoles = $user->role()->pluck('roles.id')->all();
        $user->role()->sync([$validated['role_id'] => [
            'assigned_at' => now(),
            'assigned_by' => $request->user()->id,
        ]]);
        $this->audit($request, 'UPDATE_USER_ROLE', $user, ['role_ids' => $oldRoles], ['role_ids' => [(int) $validated['role_id']]]);

        return response()->json(['data' => $user->fresh()->load('role:id,name,code,program_type')]);
    }

    private function audit(Request $request, string $action, User $record, array $old, array $new): void
    {
        AuditLog::query()->create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'module' => 'SYSTEM_ADMINISTRATION',
            'record_type' => User::class,
            'record_id' => $record->id,
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
