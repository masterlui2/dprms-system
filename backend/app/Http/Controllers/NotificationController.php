<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\ProjectModule\MonitoringDeadlineService;
use App\Services\UniversalNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly MonitoringDeadlineService $deadlines,
        private readonly UniversalNotificationService $notifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->deadlines->syncOverdueNotifications($request->user());
        $this->notifications->syncRepaymentReminders($request->user());
        $query = Notification::query()->where('user_id', $request->user()->id);

        return response()->json([
            'data' => [
                'unread_count' => (clone $query)->where('is_read', false)->count(),
                'notifications' => $query->latest()->limit(30)->get()->map(fn (Notification $notification) => [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'category' => $notification->category,
                    'program' => $notification->program,
                    'actor_name' => $notification->actor_name,
                    'actor_role' => $notification->actor_role,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'action_url' => $notification->action_url,
                    'is_read' => $notification->is_read,
                    'created_at' => $notification->created_at?->toIso8601String(),
                ]),
            ],
        ]);
    }

    public function markRead(Request $request, Notification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::query()
            ->where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    public function markUnread(Request $request, Notification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['is_read' => false, 'read_at' => null]);

        return response()->json(['message' => 'Notification marked as unread.']);
    }
}
