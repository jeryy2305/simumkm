<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        @page {
            margin: 0cm 0cm;
        }
        body { 
            font-family: 'Helvetica', 'Arial', sans-serif; 
            margin: 0; 
            padding: 0;
            color: #1a202c;
            background: #ffffff;
            line-height: 1.5;
        }

        .container {
            padding: 0 42px 70px;
        }

        /* HEADER */
        .header {
            margin: 0 -42px 26px;
            padding: 22px 42px 18px;
            background: #2446b8;
            border-bottom: 5px solid #70a9ff;
            color: white;
            text-align: center;
        }

        .header-table {
            width: 100%;
            border: none;
        }

        .header-table td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }

        .company-name {
            font-size: 22px;
            font-weight: 900;
            color: white;
            margin: 0;
            letter-spacing: -0.5px;
        }

        .company-tagline {
            font-size: 11px;
            color: #dbeafe;
            letter-spacing: 0.3px;
            margin-top: 4px;
        }

        .report-meta {
            display: none;
        }

        /* TITLE SECTION */
        .title-section {
            margin-bottom: 18px;
            text-align: center;
        }

        .document-title {
            font-size: 18px;
            font-weight: 800;
            color: #17358f;
            margin: 0;
        }

        .period-badge {
            display: block;
            color: #475569;
            padding: 3px 12px;
            font-size: 10px;
            font-weight: 700;
            margin-top: 8px;
        }

        /* SUMMARY CARDS */
        .summary-grid {
            width: 100%;
            margin-bottom: 30px;
        }

        .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 11px;
            width: 22.5%;
            display: inline-block;
            margin-right: 2%;
        }

        .summary-card:last-child {
            margin-right: 0;
        }

        .summary-label {
            font-size: 9px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .summary-value {
            font-size: 13px;
            font-weight: 800;
            color: #1e3a8a;
        }

        /* MAIN TABLE */
        .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            border-radius: 3px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
        }

        .data-table th, .data-table td { 
            border: 1px solid #cbd5e1;
        }

        .data-table th { 
            background: #2446b8; 
            color: white;
            text-transform: uppercase;
            font-size: 10px;
            font-weight: 700;
            padding: 9px 8px;
            text-align: left;
            letter-spacing: 0.5px;
        }

        .data-table td { 
            padding: 8px;
            font-size: 9px;
            color: #334155;
        }

        .data-table tr:last-child td {
            border-bottom: none;
        }

        .data-table tr:nth-child(even) {
            background: #fcfdfe;
        }

        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .font-bold { font-weight: 700; }
        .text-blue { color: #2563eb; }
        .text-green { color: #16a34a; }

        /* SIGNATURE AREA */
        .signature-section {
            margin-top: 42px;
            width: 100%;
        }

        .signature-box {
            width: 31%;
            float: left;
            text-align: center;
            margin-right: 2%;
        }

        .signature-box:last-child { margin-right: 0; }

        .signature-line {
            margin-top: 70px;
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 11px;
            font-weight: 700;
        }

        .signature-title {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
        }

        /* FOOTER */
        .footer {
            position: fixed;
            bottom: 30px;
            left: 50px;
            right: 50px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <table class="header-table">
                <tr>
                    <td colspan="2">
                        <h1 class="company-name">LAPORAN DISTRIBUSI UMKM</h1>
                        <p class="company-tagline">PT. ADE MESTAKUNG ABADI · Sistem Kemitraan UMKM</p>
                        <p class="company-tagline">Periode: {{ $periodStart ?? 'SEMUA' }} — {{ $periodEnd ?? 'SEMUA' }}</p>
                    </td>
                </tr>
            </table>
        </div>

        <!-- TITLE SECTION -->
        <div class="title-section">
            <h2 class="document-title">{{ ($reportType ?? 'owner') === 'profit' ? 'Rekapitulasi Keuntungan Mitra' : 'Rekapitulasi per Pemilik UMKM' }}</h2>
            <div class="period-badge">Dicetak pada: {{ now()->timezone(config('app.timezone', 'Asia/Jakarta'))->format('d F Y H:i') }} WIB</div>
        </div>

        @php
            $totalMasuk = collect($monthlyData)->sum('masuk');
            $totalKeluar = collect($monthlyData)->sum('keluar');
            $totalValue = collect($monthlyData)->sum('value');
            $totalProfit = collect($monthlyData)->flatMap(fn ($row) => $row['items'] ?? [])->sum(fn ($item) => ((float) ($item['quantity'] ?? 0)) * ((float) ($item['partner_profit'] ?? 0)));
        @endphp

        @if(($reportType ?? 'owner') === 'profit')
        <!-- PROFIT TABLE -->
        <table class="data-table">
            <thead>
                <tr>
                    <th>PEMILIK UMKM</th>
                    <th>PRODUK</th>
                    <th class="text-center">UNIT</th>
                    <th class="text-right">KEUNTUNGAN / UNIT</th>
                    <th class="text-right">TOTAL KEUNTUNGAN</th>
                </tr>
            </thead>
            <tbody>
                @forelse(collect($monthlyData)->flatMap(fn ($row) => $row['items'] ?? []) as $item)
                    <tr>
                        <td>{{ $item['owner'] ?? 'Tidak Diketahui' }}</td>
                        <td>{{ $item['name'] }}</td>
                        <td class="text-center">{{ number_format($item['quantity'], 0, ',', '.') }}</td>
                        <td class="text-right">Rp {{ number_format($item['partner_profit'] ?? 0, 0, ',', '.') }}</td>
                        <td class="text-right font-bold">Rp {{ number_format(((float) $item['quantity']) * ((float) ($item['partner_profit'] ?? 0)), 0, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="text-center" style="padding: 40px; color: #94a3b8;">Belum ada data keuntungan mitra.</td></tr>
                @endforelse
            </tbody>
            <tfoot><tr><td colspan="4" class="font-bold">TOTAL KEUNTUNGAN MITRA</td><td class="text-right font-bold text-green">Rp {{ number_format($totalProfit, 0, ',', '.') }}</td></tr></tfoot>
        </table>
        @else
        <!-- DATA TABLE -->
        <table class="data-table">
            <thead>
                <tr>
                    <th width="13%">TANGGAL</th>
                    <th width="18%">PEMILIK UMKM</th>
                    <th width="20%">PRODUK</th>
                    <th width="9%" class="text-center">UNIT</th>
                    <th width="13%" class="text-right">HARGA JUAL</th>
                    <th width="13%" class="text-right">UNTUNG / UNIT</th>
                    <th width="14%" class="text-right">TOTAL UNTUNG</th>
                </tr>
            </thead>
            <tbody>
                @forelse($monthlyData as $row)
                    @php
                        $items = $row['items'] ?? [];
                        $itemCount = count($items);
                    @endphp
                    @if($itemCount > 0)
                        @foreach($items as $index => $item)
                            <tr>
                                <td class="font-bold">{{ $row['date'] }}</td>
                                <td class="font-bold text-blue">{{ $row['owner'] }}</td>
                                <td>{{ $item['name'] }}</td>
                                <td class="text-center">{{ number_format($item['quantity'], 0, ',', '.') }}</td>
                                <td class="text-right">Rp {{ number_format($item['hotel_price'] ?? $item['price'], 0, ',', '.') }}</td>
                                <td class="text-right">Rp {{ number_format($item['partner_profit'] ?? 0, 0, ',', '.') }}</td>
                                <td class="text-right font-bold">Rp {{ number_format(((float) $item['quantity']) * ((float) ($item['partner_profit'] ?? 0)), 0, ',', '.') }}</td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td class="font-bold">{{ $row['date'] }}</td>
                            <td class="font-bold text-blue">{{ $row['owner'] }}</td>
                            <td colspan="4" class="text-center">-</td>
                            <td class="text-right font-bold">Rp 0</td>
                        </tr>
                    @endif
                @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 40px; color: #94a3b8;">
                        Belum ada rekaman distribusi untuk periode ini.
                    </td>
                </tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="6" class="text-left font-bold" style="padding: 10px 8px; background: #f8fafc;">TOTAL KEUNTUNGAN MITRA</td>
                    <td class="text-right font-bold text-green" style="padding: 10px 8px; background: #f8fafc;">Rp {{ number_format($totalProfit, 0, ',', '.') }}</td>
                </tr>
            </tfoot>
        </table>
        @endif

        <!-- SIGNATURE -->
        <div class="signature-section clearfix">
            <div class="signature-box"><p style="font-size: 10px;">Mengetahui,</p><div class="signature-line">Pimpinan / Direktur</div></div>
            <div class="signature-box"><p style="font-size: 10px;">Disetujui,</p><div class="signature-line">Manajer Operasional</div></div>
            <div class="signature-box"><p style="font-size: 10px;">Dibuat oleh,</p><div class="signature-line">Admin Sistem</div></div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            Halaman 1 — Laporan ini dihasilkan secara otomatis oleh Sistem Kemitraan UMKM PT. Ade Mestakung Abadi
        </div>
    </div>
</body>
</html>