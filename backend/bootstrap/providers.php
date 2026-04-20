<?php

use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    Barryvdh\DomPDF\ServiceProvider::class,
    Maatwebsite\Excel\ExcelServiceProvider::class,
];
