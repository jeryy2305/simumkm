<?php
$tables = ["users", "umkms", "product_requests", "product_request_offers", "products", "consignments"];
$schema = [];
foreach ($tables as $table) {
    $schema[$table] = \Illuminate\Support\Facades\Schema::getColumnListing($table);
}
echo json_encode($schema, JSON_PRETTY_PRINT);

