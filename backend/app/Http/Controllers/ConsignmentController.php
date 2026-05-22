<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consignment;

class ConsignmentController extends Controller
{
    public function index()
    {
        return response()->json(Consignment::with('umkm', 'product')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'company' => 'required',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'duration_days' => 'required|integer',
            'start_date' => 'required|date',
            'status' => 'required|in:active,completed,cancelled',
            'umkm_id' => 'required|exists:umkms,id',
        ]);

        $consignment = Consignment::create($request->all());
        return response()->json($consignment, 201);
    }

    public function show(Consignment $consignment)
    {
        return response()->json($consignment->load('umkm', 'product'));
    }

    public function update(Request $request, Consignment $consignment)
    {
        $request->validate([
            'company' => 'required',
            'duration_days' => 'required|integer',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'status' => 'required|in:active,completed,cancelled',
        ]);

        $consignment->update($request->all());
        return response()->json($consignment);
    }

    public function destroy(Consignment $consignment)
    {
        $consignment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
