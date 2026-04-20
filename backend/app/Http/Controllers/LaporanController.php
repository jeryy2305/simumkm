<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Exports\LaporanExport;
use App\Models\Consignment;
use Carbon\Carbon;

class LaporanController extends Controller
{
    public function export(Request $request)
    {
        try {
            $type = $request->query('type');
            $startDate = $this->parseDate($request->query('start_date'));
            $endDate = $this->parseDate($request->query('end_date'));
            $filterOwner = $request->query('filter_owner');

            if ($type === 'pdf') {
                return $this->exportPdf($startDate, $endDate, $filterOwner);
            } elseif ($type === 'excel') {
                return $this->exportExcel($startDate, $endDate, $filterOwner);
            } else {
                return response()->json(
                    ['error' => 'Invalid type parameter. Use "pdf" or "excel".'],
                    400
                );
            }
        } catch (\Exception $e) {
            \Log::error('Export Error: ' . $e->getMessage());
            return response()->json(
                ['error' => 'Export failed: ' . $e->getMessage()],
                500
            );
        }
    }

    private function parseDate(?string $value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        try {
            return Carbon::parse($value)->startOfDay();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function getMonthlyRecap(?Carbon $startDate, ?Carbon $endDate, ?string $filterOwner): array
    {
        $query = Consignment::with(['product', 'umkm'])->whereIn('status', ['active', 'completed']);

        if ($startDate) {
            $query->whereDate('start_date', '>=', $startDate->toDateString());
        }

        if ($endDate) {
            $query->whereDate('start_date', '<=', $endDate->toDateString());
        }

        if ($filterOwner) {
            $query->whereHas('umkm', function ($q) use ($filterOwner) {
                $q->where('owner', $filterOwner);
            });
        }

        $consignments = $query->get();
        $data = [];

        foreach ($consignments as $consignment) {
            $monthKey = Carbon::parse($consignment->start_date)->format('Y-m');
            $monthLabel = Carbon::parse($consignment->start_date)->format('F Y');
            $ownerName = $consignment->umkm?->owner ?? 'Tidak Diketahui';
            $compositeKey = $ownerName . '-' . $monthKey;

            if (!isset($data[$compositeKey])) {
                $data[$compositeKey] = [
                    'owner' => $ownerName,
                    'month_key' => $monthKey,
                    'month' => $monthLabel,
                    'masuk' => 0,
                    'keluar' => 0,
                    'value' => 0,
                ];
            }

            if ($consignment->status === 'active') {
                $data[$compositeKey]['masuk'] += $consignment->quantity;
            }

            if ($consignment->status === 'completed') {
                $data[$compositeKey]['keluar'] += $consignment->quantity;
                $price = $consignment->product?->price ?? 0;
                $data[$compositeKey]['value'] += $consignment->quantity * $price;
            }
        }

        return array_values(collect($data)->sort(function ($a, $b) {
            // Sort by owner first, then by month_key descending
            if ($a['owner'] !== $b['owner']) {
                return strcmp($a['owner'], $b['owner']);
            }
            return strcmp($b['month_key'], $a['month_key']);
        })->values()->all());
    }

    private function exportPdf(?Carbon $startDate, ?Carbon $endDate, ?string $filterOwner)
    {
        try {
            if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
                return response()->json(
                    ['error' => 'PDF library not installed. Please install: composer require barryvdh/laravel-dompdf'],
                    503
                );
            }

            $monthlyData = $this->getMonthlyRecap($startDate, $endDate, $filterOwner);
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('laporan', [
                'title' => 'Rekapitulasi per Pemilik UMKM',
                'monthlyData' => $monthlyData,
                'periodStart' => $startDate?->format('d-m-Y'),
                'periodEnd' => $endDate?->format('d-m-Y'),
                'filterOwner' => $filterOwner,
            ]);

            return $pdf->download('Rekapan_Bulanan.pdf');
        } catch (\Exception $e) {
            \Log::error('PDF Export Error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function exportExcel(?Carbon $startDate, ?Carbon $endDate, ?string $filterOwner)
    {
        try {
            if (!class_exists('Maatwebsite\Excel\Facades\Excel')) {
                return response()->json(
                    ['error' => 'Excel library not installed. Please install: composer require maatwebsite/excel --ignore-platform-req=ext-gd'],
                    503
                );
            }

            $monthlyData = $this->getMonthlyRecap($startDate, $endDate, $filterOwner);
            return \Maatwebsite\Excel\Facades\Excel::download(new LaporanExport($monthlyData, $filterOwner), 'Rekapan_Bulanan.xlsx');
        } catch (\Exception $e) {
            \Log::error('Excel Export Error: ' . $e->getMessage());
            throw $e;
        }
    }
}
