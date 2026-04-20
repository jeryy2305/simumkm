<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class LaporanExport implements FromCollection, WithHeadings
{
    private array $rows;
    private ?string $filterOwner;

    public function __construct(array $rows, ?string $filterOwner = null)
    {
        $this->rows = $rows;
        $this->filterOwner = $filterOwner;
    }

    public function collection(): Collection
    {
        $data = collect();

        // Add filter info if present
        if ($this->filterOwner) {
            $data->push(['Filter Pemilik UMKM:', $this->filterOwner]);
            $data->push([]); // Empty row
        }

        // Add data rows
        $data = $data->merge(collect($this->rows)->map(function (array $row) {
            return [
                $row['owner'] ?? 'Tidak Diketahui',
                $row['month'] ?? '-',
                $row['masuk'] ?? 0,
                $row['keluar'] ?? 0,
                $row['value'] ?? 0,
            ];
        }));

        return $data;
    }

    public function headings(): array
    {
        return [
            'Pemilik UMKM',
            'Bulan',
            'Unit Masuk',
            'Unit Keluar',
            'Nilai Distribusi',
        ];
    }
}