<?php

namespace App\Actions;

use App\Models\Weather;

class WeatherCreateAction
{
    public static function handle(array $weatherData)
    {
        return Weather::create($weatherData);
    }
}