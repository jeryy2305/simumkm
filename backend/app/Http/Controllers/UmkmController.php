<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\Umkm;
use App\Models\User;

class UmkmController extends Controller
{
    public function index()
    {
        return response()->json(Umkm::with('user')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'owner' => 'required',
            'phone' => 'required',
            'address' => 'nullable|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'join_date' => 'required|date',
        ]);

        $user = User::create([
            'name' => $request->owner,
            'email' => $request->email,
            'password' => $request->password,
            'role' => 'umkm',
        ]);

        $umkm = Umkm::create([
            'name' => $request->owner,
            'owner' => $request->owner,
            'phone' => $request->phone,
            'address' => $request->address ?? null,
            'join_date' => $request->join_date,
            'status' => 'active',
            'user_id' => $user->id,
        ]);

        return response()->json($umkm->load('user'), 201);
    }

    public function show(Umkm $umkm)
    {
        return response()->json($umkm->load('user', 'products', 'consignments'));
    }

    public function update(Request $request, Umkm $umkm)
    {
        $request->validate([
            'owner' => 'required',
            'phone' => 'required',
            'address' => 'nullable|string',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($umkm->user_id)],
            'password' => ['nullable', 'string', 'min:8'],
            'join_date' => 'required|date',
        ]);

        $user = $umkm->user;
        if ($user) {
            $user->email = $request->email;
            if ($request->filled('password')) {
                $user->password = $request->password;
            }
            $user->save();
        }

        $umkm->update($request->only(['owner', 'phone', 'address', 'join_date']));
        $umkm->update(['name' => $request->owner]);
        return response()->json($umkm->load('user'));
    }

    public function updateStatus(Request $request, Umkm $umkm)
    {
        $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        $umkm->update(['status' => $request->status]);
        return response()->json($umkm->load('user'));
    }

    public function destroy(Umkm $umkm)
    {
        if ($umkm->user) {
            $umkm->user->delete();
        } else {
            $umkm->delete();
        }
        return response()->json(['message' => 'Deleted']);
    }
}
