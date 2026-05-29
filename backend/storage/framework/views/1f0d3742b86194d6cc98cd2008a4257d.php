<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?php echo e($title); ?></title>
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

        /* SIDEBAR DECORATION */
        .sidebar-accent {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 8px;
            background: #1e3a8a;
        }

        .container {
            padding: 40px 50px;
        }

        /* HEADER */
        .header {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
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
            font-size: 24px;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0;
            letter-spacing: -0.5px;
        }

        .company-tagline {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
        }

        .report-meta {
            text-align: right;
            font-size: 10px;
            color: #94a3b8;
        }

        /* TITLE SECTION */
        .title-section {
            margin-bottom: 35px;
        }

        .document-title {
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }

        .period-badge {
            display: inline-block;
            background: #f1f5f9;
            color: #475569;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 11px;
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
            border-radius: 12px;
            padding: 15px;
            width: 31%;
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
            font-size: 16px;
            font-weight: 800;
            color: #1e3a8a;
        }

        /* MAIN TABLE */
        .data-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
        }

        .data-table th, .data-table td { 
            border: 1px solid #cbd5e1;
        }

        .data-table th { 
            background: #1e3a8a; 
            color: white;
            text-transform: uppercase;
            font-size: 10px;
            font-weight: 700;
            padding: 14px 12px;
            text-align: left;
            letter-spacing: 0.5px;
        }

        .data-table td { 
            padding: 12px; 
            font-size: 11px;
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
            margin-top: 60px;
            width: 100%;
        }

        .signature-box {
            width: 200px;
            float: right;
            text-align: center;
        }

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
    <div class="sidebar-accent"></div>

    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <table class="header-table">
                <tr>
                    <td>
                        <h1 class="company-name">PT. ADE MESTAKUNG ABADI</h1>
                        <p class="company-tagline">Solusi Kemitraan UMKM Terpercaya</p>
                    </td>
                    <td class="report-meta">
                        Dokumen ID: RPT-<?php echo e(date('YmdHis')); ?><br>
                        Dicetak pada: <?php echo e(date('d/m/Y H:i')); ?>

                    </td>
                </tr>
            </table>
        </div>

        <!-- TITLE SECTION -->
        <div class="title-section">
            <h2 class="document-title"><?php echo e($title); ?></h2>
            <div class="period-badge">
                PERIODE: <?php echo e($periodStart ?? 'SEMUA'); ?> — <?php echo e($periodEnd ?? 'SEMUA'); ?>

            </div>
        </div>

        <?php
            $totalMasuk = collect($monthlyData)->sum('masuk');
            $totalKeluar = collect($monthlyData)->sum('keluar');
            $totalValue = collect($monthlyData)->sum('value');
        ?>

        <!-- DATA TABLE -->
        <table class="data-table">
            <thead>
                <tr>
                    <th width="15%">TANGGAL</th>
                    <th width="25%">PEMILIK UMKM</th>
                    <th width="25%">NAMA PRODUK</th>
                    <th width="10%" class="text-center">STOK</th>
                    <th width="12%" class="text-center">HARGA / UNIT</th>
                    <th width="13%" class="text-right">TOTAL HARGA</th>
                </tr>
            </thead>
            <tbody>
                <?php $__empty_1 = true; $__currentLoopData = $monthlyData; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <?php
                        $items = $row['items'] ?? [];
                        $itemCount = count($items);
                    ?>
                    <?php if($itemCount > 0): ?>
                        <?php $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <tr>
                                <?php if($index === 0): ?>
                                    <td rowSpan="<?php echo e($itemCount); ?>" class="font-bold"><?php echo e($row['date']); ?></td>
                                    <td rowSpan="<?php echo e($itemCount); ?>" class="font-bold text-blue"><?php echo e($row['owner']); ?></td>
                                <?php endif; ?>
                                <td><?php echo e($item['name']); ?></td>
                                <td class="text-center"><?php echo e(number_format($item['quantity'], 0, ',', '.')); ?></td>
                                <td class="text-center">Rp <?php echo e(number_format($item['price'], 0, ',', '.')); ?></td>
                                <?php if($index === 0): ?>
                                    <td rowSpan="<?php echo e($itemCount); ?>" class="text-right font-bold">Rp <?php echo e(number_format($row['value'], 0, ',', '.')); ?></td>
                                <?php endif; ?>
                            </tr>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    <?php else: ?>
                        <tr>
                            <td class="font-bold"><?php echo e($row['date']); ?></td>
                            <td class="font-bold text-blue"><?php echo e($row['owner']); ?></td>
                            <td colspan="3" class="text-center">-</td>
                            <td class="text-right font-bold">Rp <?php echo e(number_format($row['value'], 0, ',', '.')); ?></td>
                        </tr>
                    <?php endif; ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="6" class="text-center" style="padding: 40px; color: #94a3b8;">
                        Belum ada rekaman distribusi untuk periode ini.
                    </td>
                </tr>
                <?php endif; ?>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" class="text-left font-bold" style="padding: 14px 12px; background: #f8fafc;">TOTAL AKUMULASI NILAI</td>
                    <td class="text-right font-bold" style="padding: 14px 12px; background: #f8fafc;">Rp <?php echo e(number_format($totalValue, 0, ',', '.')); ?></td>
                </tr>
            </tfoot>
        </table>

        <!-- SIGNATURE -->
        <div class="signature-section clearfix">
            <div class="signature-box">
                <p style="font-size: 11px; margin-bottom: 5px;">Bandar Lampung, <?php echo e(date('d F Y')); ?></p>
                <p style="font-size: 11px; font-weight: 700; margin-bottom: 60px;">Mengetahui, Manajer Operasional</p>
                <div class="signature-line">ADMINISTRATOR SISTEM</div>
                <div class="signature-title">PT. Ade Mestakung Abadi</div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            Halaman 1 — Laporan ini dihasilkan secara otomatis oleh Sistem Kemitraan UMKM PT. Ade Mestakung Abadi
        </div>
    </div>
</body>
</html><?php /**PATH C:\Users\Hp\sim-umkm\backend\resources\views/laporan.blade.php ENDPATH**/ ?>