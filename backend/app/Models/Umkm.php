<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Umkm extends Model
{
    protected $fillable = ['name', 'owner', 'phone', 'address', 'join_date', 'status', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function consignments()
    {
        return $this->hasMany(Consignment::class);
    }
}
