<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Rekapitulasi Penitipan Hotel' }}</title>
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

        .hotel-subtitle {
            font-size: 13px;
            font-weight: 700;
            color: #2563eb;
            margin-top: 4px;
        }

        .period-badge {
            display: block;
            color: #475569;
            padding: 3px 12px;
            font-size: 10px;
            font-weight: 700;
            margin-top: 6px;
        }

        /* MAIN TABLE */
        .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            border-radius: 4px;
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
            padding: 10px 8px;
            text-align: left;
            letter-spacing: 0.5px;
        }

        .data-table td { 
            padding: 9px 8px;
            font-size: 10px;
            color: #334155;
        }

        .data-table tr:nth-child(even) {
            background: #f8fafc;
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
                        <h1 class="company-name">REKAPITULASI PENITIPAN HOTEL</h1>
                        <p class="company-tagline">PT. ADE MESTAKUNG ABADI · Sistem Kemitraan UMKM</p>
                        <p class="company-tagline">Periode: {{ $periodStart ?? 'SEMUA' }} — {{ $periodEnd ?? 'SEMUA' }}</p>
                    </td>
                </tr>
            </table>
        </div>

        <!-- TITLE SECTION -->
        <div class="title-section">
            <h2 class="document-title">Laporan Rekapitulasi Penitipan</h2>
            <div class="hotel-subtitle">Hotel: {{ $hotelName ?? 'Semua Hotel' }}</div>
            <div class="period-badge">Dicetak pada: {{ $printedAt ?? now()->timezone(config('app.timezone', 'Asia/Jakarta'))->format('d F Y H:i') }} WIB</div>
        </div>

        <!-- DATA TABLE -->
        <table class="data-table">
            <thead>
                <tr>
                    <th width="7%" class="text-center">NO</th>
                    <th width="18%">TANGGAL</th>
                    <th width="33%">PRODUK</th>
                    <th width="10%" class="text-center">STOK</th>
                    <th width="16%" class="text-right">HARGA JUAL</th>
                    <th width="16%" class="text-right">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                @forelse($rows as $item)
                    <tr>
                        <td class="text-center font-bold">{{ $item['no'] }}</td>
                        <td>{{ $item['tanggal'] }}</td>
                        <td class="font-bold text-blue">{{ $item['produk'] }}</td>
                        <td class="text-center font-bold">{{ number_format($item['stok'], 0, ',', '.') }}</td>
                        <td class="text-right">Rp {{ number_format($item['harga_jual'], 0, ',', '.') }}</td>
                        <td class="text-right font-bold">Rp {{ number_format($item['total'], 0, ',', '.') }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="text-center" style="padding: 40px; color: #94a3b8;">
                            Belum ada rekaman penitipan hotel untuk periode ini.
                        </td>
                    </tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" class="text-left font-bold" style="padding: 12px 10px; background: #f8fafc; font-size: 11px;">TOTAL TAGIHAN</td>
                    <td class="text-right font-bold text-green" style="padding: 12px 10px; background: #f8fafc; font-size: 12px;">Rp {{ number_format($totalTagihan ?? 0, 0, ',', '.') }}</td>
                </tr>
            </tfoot>
        </table>

        <!-- SIGNATURE -->
        <div class="signature-section clearfix">
            <div class="signature-box"><p style="font-size: 10px;">Mengetahui,</p><div class="signature-line">Pimpinan / Direktur</div></div>
            <div class="signature-box"><p style="font-size: 10px;">Disetujui,</p><div class="signature-line">Manajer Operasional</div></div>
            <div class="signature-box"><p style="font-size: 10px;">Dibuat oleh,</p><div class="signature-line">Admin Sistem</div></div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            Laporan ini dihasilkan secara otomatis oleh Sistem Kemitraan UMKM PT. Ade Mestakung Abadi
        </div>
    </div>
</body>
</html>
