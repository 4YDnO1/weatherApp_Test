<?php

namespace App\Jobs;

use App\Models\Weather;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class FetchWeatherJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public float $lat;
    public float $lon;
    public Carbon $from;
    public Carbon $to;

    public function __construct(float $lat, float $lon, Carbon $from, Carbon $to)
    {
        $this->lat = $lat;
        $this->lon = $lon;
        $this->from = $from;
        $this->to = $to;
    }

    // no nedeed, as it will be fetched if not relevant data founded
    public function handle(): void
    {
        $url = 'https://api.open-meteo.com/v1/forecast';
        $params = [
            'latitude' => $this->lat,
            'longitude' => $this->lon,
            'current_weather' => true,
            'hourly' => 'relativehumidity_2m,surface_pressure,temperature_2m,windspeed_10m',
            'timezone' => 'UTC',
        ];

        $response = Http::timeout(10)->get($url, $params);
        if (!$response->ok()) {
            return;
        }
        $data = $response->json();

        $temperature = data_get($data, 'current_weather.temperature');
        $windspeed = data_get($data, 'current_weather.windspeed');
        $time = data_get($data, 'current_weather.time');
        $observedAt = $time ? Carbon::parse($time) : now();

        $pressure = null;
        $humidity = null;
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

        Weather::create([
            'observed_at' => $observedAt,
            'lat' => $this->lat,
            'lon' => $this->lon,
            'temperature_c' => $temperature,
            'wind_speed_ms' => $windspeed ? ($windspeed / 3.6) : null,
            'pressure_hpa' => $pressure,
            'humidity_pct' => $humidity,
            'source' => 'open-meteo',
            'raw' => $data,
        ]);
    }
} 