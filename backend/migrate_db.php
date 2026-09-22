<?php
// backend/migrate_db.php

$host = '127.0.0.1';
$port = 5432;
$pgUser = 'postgres';
$pgPass = 'ArgaDani77';
$dbName = 'sim_umkm';

echo "1. Connecting to PostgreSQL server...\n";
try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=postgres", $pgUser, $pgPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT 1 FROM pg_database WHERE datname = '$dbName'");
    if (!$stmt->fetch()) {
        $pdo->exec("CREATE DATABASE \"$dbName\";");
        echo "   Database '$dbName' created successfully in PostgreSQL.\n";
    } else {
        echo "   Database '$dbName' already exists in PostgreSQL.\n";
    }
} catch (PDOException $e) {
    echo "ERROR connecting/creating PostgreSQL database: " . $e->getMessage() . "\n";
    exit(1);
}

echo "2. Running Laravel migrations on PostgreSQL...\n";
exec('php artisan migrate:fresh --seed --force', $output, $returnCode);
echo implode("\n", $output) . "\n";

if ($returnCode !== 0) {
    echo "Migration failed with code $returnCode.\n";
    exit(1);
}

echo "3. Checking for MySQL data to transfer...\n";
try {
    $mysqlPdo = new PDO("mysql:host=127.0.0.1;port=3306;dbname=$dbName", "root", "");
    $mysqlPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pgPdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbName", $pgUser, $pgPass);
    $pgPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $tables = ['users', 'umkms', 'products', 'consignments', 'product_requests', 'hotels'];

    foreach ($tables as $table) {
        echo "   Migrating table '$table'...\n";
        $stmt = $mysqlPdo->query("SELECT * FROM `$table`");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($rows)) {
            echo "   Table '$table' has no data in MySQL. Skipping.\n";
            continue;
        }

        foreach ($rows as $row) {
            $cols = array_keys($row);
            $colNames = implode(', ', array_map(fn($c) => "\"$c\"", $cols));
            $placeholders = implode(', ', array_fill(0, count($cols), '?'));

            // Use ON CONFLICT DO NOTHING to avoid duplicate PKs (e.g. seeded admin user)
            $sql = "INSERT INTO \"$table\" ($colNames) VALUES ($placeholders) ON CONFLICT DO NOTHING";
            $pgStmt = $pgPdo->prepare($sql);
            $pgStmt->execute(array_values($row));
        }

        // Reset PostgreSQL sequence to max(id) + 1
        $seqStmt = $pgPdo->query("SELECT setval(pg_get_serial_sequence('$table', 'id'), COALESCE(max(id), 1)) FROM \"$table\";");
        $seqStmt->fetch();
        echo "   Migrated " . count($rows) . " rows for table '$table'. Sequence reset.\n";
    }

    echo "\nData migration from MySQL to PostgreSQL completed successfully!\n";
} catch (PDOException $e) {
    echo "Note on MySQL data transfer: " . $e->getMessage() . "\n";
    echo "Migration to PostgreSQL structure is complete!\n";
}
