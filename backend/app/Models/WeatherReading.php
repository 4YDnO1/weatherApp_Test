<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeatherReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'observed_at',
        'temperature_c',
        'wind_speed_ms',
        'pressure_hpa',
        'humidity_pct',
        'source',
        'raw',
    ];

    protected $casts = [
        'observed_at' => 'datetime',
        'raw' => 'array',
    ];
} 