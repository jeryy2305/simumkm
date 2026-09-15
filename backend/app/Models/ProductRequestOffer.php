<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductRequestOffer extends Model
{
    protected $fillable = [
        'product_request_id',
        'umkm_id',
        'price_offered',
        'status',
    ];

    public function productRequest()
    {
        return $this->belongsTo(ProductRequest::class);
    }

    public function umkm()
    {
        return $this->belongsTo(Umkm::class);
    }
}