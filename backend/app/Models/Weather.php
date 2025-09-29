<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Weather extends Model
{
    protected $fillable = [
        'observed_at',
        'lat',
        'lon',
        'temperature_c',
        'wind_speed_ms',
        'pressure_hpa',
        'humidity_pct',
        'source',
        'raw',
    ];

    protected $casts = [
        'observed_at' => 'datetime',
        'lat' => 'float',
        'lon' => 'float',
        'raw' => 'array',
    ];
} 