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
            $reportType = $request->query('report_type', 'owner');

            if ($type === 'pdf') {
                return $this->exportPdf($startDate, $endDate, $filterOwner, $reportType);
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
            $dateKey = Carbon::parse($consignment->start_date)->format('Y-m-d');
            $dateLabel = Carbon::parse($consignment->start_date)->translatedFormat('d F Y');
            $ownerName = $consignment->umkm?->owner ?? 'Tidak Diketahui';
            $compositeKey = $ownerName . '-' . $dateKey;

            if (!isset($data[$compositeKey])) {
                $data[$compositeKey] = [
                    'owner' => $ownerName,
                    'date_key' => $dateKey,
                    'date' => $dateLabel,
                    'masuk' => 0,
                    'keluar' => 0,
                    'value' => 0,
                    'items' => [],
                ];
            }

            $data[$compositeKey]['items'][] = [
                'owner' => $ownerName,
                'name' => $consignment->product?->name ?? 'Produk Unknown',
                'quantity' => $consignment->product?->quantity ?? 0,
                'price' => $consignment->product?->price ?? 0,
                'hotel_price' => $consignment->product?->hotel_price ?? $consignment->product?->price ?? 0,
                'partner_profit' => $consignment->product?->partner_profit ?? 0,
                'status' => $consignment->status,
            ];

            if ($consignment->status === 'active') {
                $data[$compositeKey]['masuk'] += $consignment->product ? $consignment->product->quantity : 0;
            }

            if ($consignment->status === 'completed') {
                $qty = $consignment->product ? $consignment->product->quantity : 0;
                $data[$compositeKey]['keluar'] += $qty;
                $price = $consignment->product?->price ?? 0;
                $data[$compositeKey]['value'] += $qty * $price;
            }
        }

        return collect($data)->sort(function ($a, $b) {
            if ($a['date_key'] !== $b['date_key']) {
                return strcmp($b['date_key'], $a['date_key']);
            }
            return strcmp($a['owner'], $b['owner']);
        })->values()->all();
    }

    private function exportPdf(?Carbon $startDate, ?Carbon $endDate, ?string $filterOwner, string $reportType)
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
                'reportType' => $reportType === 'profit' ? 'profit' : 'owner',
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

    public function getHotelPenitipanData(Request $request)
    {
        $hotelName = $request->query('hotel_name');
        $startDate = $this->parseDate($request->query('start_date'));
        $endDate = $this->parseDate($request->query('end_date'));

        $data = $this->fetchHotelPenitipanData($hotelName, $startDate, $endDate);

        return response()->json($data);
    }

    public function exportHotelPenitipanPdf(Request $request)
    {
        $hotelName = $request->query('hotel_name');
        $startDate = $this->parseDate($request->query('start_date'));
        $endDate = $this->parseDate($request->query('end_date'));

        $data = $this->fetchHotelPenitipanData($hotelName, $startDate, $endDate);

        if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
            return response()->json(
                ['error' => 'PDF library not installed.'],
                503
            );
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('rekap-hotel-penitipan', [
            'title' => 'Rekapitulasi Penitipan Hotel',
            'hotelName' => $hotelName ? $hotelName : 'Semua Hotel',
            'periodStart' => $startDate ? $startDate->format('d-m-Y') : 'SEMUA',
            'periodEnd' => $endDate ? $endDate->format('d-m-Y') : 'SEMUA',
            'rows' => $data['rows'],
            'totalTagihan' => $data['total_tagihan'],
            'printedAt' => now()->timezone(config('app.timezone', 'Asia/Jakarta'))->translatedFormat('d F Y H:i') . ' WIB',
        ]);

        $safeName = $hotelName ? \Illuminate\Support\Str::slug($hotelName) : 'Semua';
        return $pdf->download("Rekap_Penitipan_Hotel_{$safeName}.pdf");
    }

    private function fetchHotelPenitipanData(?string $hotelName, ?Carbon $startDate, ?Carbon $endDate): array
    {
        $query = Consignment::with(['product', 'umkm']);

        if ($hotelName && $hotelName !== '' && $hotelName !== 'all') {
            $query->where('company', $hotelName);
        }

        if ($startDate) {
            $query->whereDate('start_date', '>=', $startDate->toDateString());
        }

        if ($endDate) {
            $query->whereDate('start_date', '<=', $endDate->toDateString());
        }

        $consignments = $query->orderBy('start_date', 'desc')->get();
        $rows = [];
        $totalTagihan = 0;

        foreach ($consignments as $index => $c) {
            $stok = (int) ($c->quantity ?? $c->product?->quantity ?? 0);
            $hargaJual = (float) ($c->product?->hotel_price ?? (($c->product?->price ?? 0) + ($c->product?->partner_profit ?? 0)));
            if ($hargaJual <= 0) {
                $hargaJual = (float) ($c->product?->price ?? 0);
            }
            $total = $stok * $hargaJual;
            $totalTagihan += $total;

            $rows[] = [
                'no' => $index + 1,
                'tanggal' => Carbon::parse($c->start_date)->translatedFormat('d F Y'),
                'date_raw' => $c->start_date,
                'hotel' => $c->company,
                'produk' => $c->product?->name ?? 'Produk Unknown',
                'stok' => $stok,
                'harga_jual' => $hargaJual,
                'total' => $total,
            ];
        }

        return [
            'hotel_name' => $hotelName ?: 'Semua Hotel',
            'period_start' => $startDate ? $startDate->format('Y-m-d') : null,
            'period_end' => $endDate ? $endDate->format('Y-m-d') : null,
            'rows' => $rows,
            'total_tagihan' => $totalTagihan,
        ];
    }
}
