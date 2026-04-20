<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consignment extends Model
{
    protected $fillable = ['company', 'location', 'product_id', 'quantity', 'duration_days', 'start_date', 'end_date', 'status', 'umkm_id'];

    public function umkm()
    {
        return $this->belongsTo(Umkm::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
