<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UmkmUserDashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/umkm/dashboard', [UmkmUserDashboardController::class, 'index'])->name('umkm.dashboard');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::post('/profile/update', [ProfileController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/change-password', [ProfileController::class, 'changePassword'])->name('profile.change-password');
});
