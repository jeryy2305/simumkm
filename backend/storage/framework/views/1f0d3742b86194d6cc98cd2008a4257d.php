<!DOCTYPE html>
<html>
<head>
    <title><?php echo e($title); ?></title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            margin: 0; 
            padding: 40px;
            color: #2d3748;
            background: #ffffff;
        }

        /* HEADER */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #1e3a8a;
        }

        .left, .right {
            width: 80px;
        }

        .center {
            flex: 1;
            text-align: center;
        }

        /* LOGO */
        .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }

        /* COMPANY TEXT */
        .company {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 0;
        }

        .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* TITLE */
        .title {
            text-align: center;
            font-size: 26px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 20px 0;
        }

        /* INFO */
        .info {
            font-size: 13px;
            margin-bottom: 5px;
        }

        .info strong {
            color: #1e3a8a;
        }

        /* TABLE */
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
        }

        th, td { 
            border: 1px solid #e2e8f0; 
            padding: 10px; 
            font-size: 13px;
        }

        th { 
            background: #1e3a8a; 
            color: white;
            text-transform: uppercase;
            font-size: 11px;
            text-align: center;
        }

        td {
            text-align: center;
        }

        tr:nth-child(even) {
            background: #f8fafc;
        }

        /* EMPTY */
        .empty {
            text-align: center;
            color: #94a3b8;
            padding: 20px;
        }

        /* FOOTER */
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <div class="header">

        <!-- CENTER COMPANY -->
        <div class="center">
            <p class="company">PT. Ade Mestakung Abadi</p>
            <p class="subtitle">Sistem Kemitraan UMKM</p>
        </div>

        <!-- RIGHT (BALANCER) -->
        <div class="right"></div>

    </div>

    <!-- TITLE -->
    <div class="title"><?php echo e($title); ?></div>

    <!-- INFO -->
    <p class="info">
        <strong>Periode:</strong> <?php echo e($periodStart ?? 'Semua'); ?> s/d <?php echo e($periodEnd ?? 'Semua'); ?>

    </p>

    <?php if($filterOwner): ?>
    <p class="info">
        <strong>Pemilik UMKM:</strong> <?php echo e($filterOwner); ?>

    </p>
    <?php endif; ?>

    <p class="info">
        <strong>Tanggal Cetak:</strong> <?php echo e(date('d-m-Y H:i:s')); ?>

    </p>

    <!-- TABLE -->
    <table>
        <thead>
            <tr>
                <th>Pemilik UMKM</th>
                <th>Bulan</th>
                <th>Unit Masuk</th>
                <th>Unit Keluar</th>
                <th>Nilai Distribusi (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $monthlyData; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
            <tr>
                <td><?php echo e($row['owner'] ?? 'Tidak Diketahui'); ?></td>
                <td><?php echo e($row['month']); ?></td>
                <td><?php echo e($row['masuk']); ?></td>
                <td><?php echo e($row['keluar']); ?></td>
                <td>Rp <?php echo e(number_format($row['value'], 0, ',', '.')); ?></td>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
            <tr>
                <td colspan="5" class="empty">Tidak ada data untuk periode ini.</td>
            </tr>
            <?php endif; ?>
        </tbody>
    </table>

    <!-- FOOTER -->
    <div class="footer">
        Laporan Sistem Kemitraan UMKM
    </div>

</body>
</html><?php /**PATH C:\Users\Hp\sim-umkm\backend\resources\views/laporan.blade.php ENDPATH**/ ?>