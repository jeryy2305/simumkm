<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UmkmController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ConsignmentController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\UmkmUserDashboardController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\ProfileController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['api', 'auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::apiResource('umkms', UmkmController::class);
    Route::put('/umkms/{umkm}/status', [UmkmController::class, 'updateStatus']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('consignments', ConsignmentController::class);

    // UMKM User Routes
    Route::get('/umkm-user/dashboard', [UmkmUserDashboardController::class, 'dashboard']);
    Route::get('/umkm-user/products', [UmkmUserDashboardController::class, 'products']);
    Route::get('/umkm-user/consignments', [UmkmUserDashboardController::class, 'consignments']);

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'updateProfile']);
    Route::post('/profile/password', [ProfileController::class, 'changePassword']);

    // Admin Routes
    Route::get('/admin/dashboard/stats', [AdminDashboardController::class, 'stats']);
    Route::get('/admin/dashboard/activities', [AdminDashboardController::class, 'activities']);

    Route::get('/export', [LaporanController::class, 'export']);
});