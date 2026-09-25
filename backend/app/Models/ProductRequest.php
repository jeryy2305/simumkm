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
        'partner_profit',
        'tester_delivery_date',
        'purpose',
        'status',
        'participation_deadline',
        'taken_by_umkm_id',
        'price_offered',
        'rejection_reason',
    ];

    protected $casts = [
        'participation_deadline' => 'datetime',
    ];

    public function takenByUmkm()
    {
        return $this->belongsTo(Umkm::class, 'taken_by_umkm_id');
    }

    public function offers()
    {
        return $this->hasMany(ProductRequestOffer::class);
    }
}
