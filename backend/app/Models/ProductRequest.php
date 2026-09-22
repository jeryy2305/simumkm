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
        'hotel_departure_date',
        'description',
        'purpose',
        'status',
        'participation_deadline',
        'taken_by_umkm_id',
        'price_offered',
        'delivered_to_partner_at',
        'rejection_reason',
    ];

    protected $casts = [
        'delivered_to_partner_at' => 'datetime',
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
