<?php

namespace App\Console\Commands;

use App\Models\WeatherReading;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Carbon;

class FetchWeather extends Command
{
    protected $signature = 'weather:fetch {--once : Run only once instead of hourly schedule}';
    protected $description = 'Fetch current weather and store as a reading';

    public function handle(): int
    {
        $lat = env('WEATHER_LAT', '55.7558');
        $lon = env('WEATHER_LON', '37.6173');

        $url = 'https://api.open-meteo.com/v1/forecast';
        $params = [
            'latitude' => $lat,
            'longitude' => $lon,
            'current_weather' => true,
            'hourly' => 'relativehumidity_2m,surface_pressure,temperature_2m,windspeed_10m',
            'timezone' => 'UTC',
        ];

        $response = Http::timeout(10)->get($url, $params);
        if (!$response->ok()) {
            $this->error('Failed to fetch weather: ' . $response->status());
            return self::FAILURE;
        }
        $data = $response->json();

        $temperature = data_get($data, 'current_weather.temperature');
        $windspeed = data_get($data, 'current_weather.windspeed');
        $time = data_get($data, 'current_weather.time');
        $observedAt = $time ? Carbon::parse($time) : now();

        $pressure = null;
        $humidity = null;
        // Try to pick matching hour from hourly datasets
        $hourIndex = null;
        if (isset($data['hourly']['time'])) {
            foreach ($data['hourly']['time'] as $idx => $t) {
                if (Carbon::parse($t)->equalTo($observedAt->copy()->minute(0)->second(0))) {
                    $hourIndex = $idx; break;
                }
            }
        }
        if ($hourIndex !== null) {
            $pressure = data_get($data, 'hourly.surface_pressure.' . $hourIndex);
            $humidity = data_get($data, 'hourly.relativehumidity_2m.' . $hourIndex);
        }

        WeatherReading::create([
            'observed_at' => $observedAt,
            'temperature_c' => $temperature,
            'wind_speed_ms' => $windspeed ? ($windspeed / 3.6) : null,
            'pressure_hpa' => $pressure,
            'humidity_pct' => $humidity,
            'source' => 'open-meteo',
            'raw' => $data,
        ]);

        $this->info('Weather stored at ' . $observedAt->toDateTimeString());
        return self::SUCCESS;
    }
} 