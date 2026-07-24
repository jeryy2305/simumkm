<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductRequest extends Model
{
    protected $fillable = [
        'name',
        'category',
        'quantity',
        'reference_price',
        'description',
        'purpose',
        'status',
        'taken_by_umkm_id',
        'price_offered',
    ];

    public function takenByUmkm()
    {
        return $this->belongsTo(Umkm::class, 'taken_by_umkm_id');
    }
}
