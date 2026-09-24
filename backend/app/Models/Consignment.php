<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consignment extends Model
{
    protected $fillable = ['company', 'product_id', 'quantity', 'duration_days', 'start_date', 'distribution_date', 'end_date', 'status', 'distribution_status', 'umkm_id'];

    protected $casts = [
        'start_date' => 'date',
        'distribution_date' => 'date',
        'end_date' => 'date',
    ];

    public function umkm()
    {
        return $this->belongsTo(Umkm::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
