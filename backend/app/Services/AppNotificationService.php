<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;

class AppNotificationService
{
    public static function notifyUmkms(string $title, string $message, string $url): void
    {
        $notifications = User::where('role', 'umkm')->get(['id'])->map(fn (User $user) => [
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'url' => $url,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        if ($notifications) {
            AppNotification::insert($notifications);
        }
    }

    public static function notifyUser(int $userId, string $title, string $message, string $url): void
    {
        AppNotification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'url' => $url,
        ]);
    }
}
