<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'category', 'price', 'partner_profit', 'hotel_price', 'status', 'umkm_id', 'quantity'];

    public function umkm()
    {
        return $this->belongsTo(Umkm::class);
    }

    public function consignments()
    {
        return $this->hasMany(Consignment::class);
    }
}
