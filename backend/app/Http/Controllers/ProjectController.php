<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = Project::query()
            ->with([
                'proposal.user:id,name,email',
                'proposal.assigned_staff:id,name,email',
                'proposal.assigned_focal:id,name,email',
                'proposal.setup_proposal',
                'proposal.gia_proposal',
                'user:id,name,email',
                'approver:id,name,email',
            ])
            ->orderByDesc('approved_at');

        if ($status) {
            $query->where('status', strtolower($status));
        }

        $projects = $query->get();

        return response()->json([
            'message' => 'Projects retrieved successfully',
            'data' => $projects,
        ], 200);
    }
}
