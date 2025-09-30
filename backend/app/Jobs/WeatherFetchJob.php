<?php

namespace App\Jobs;

use App\Actions\WeatherCreateAction;
use App\Models\Weather;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WeatherFetchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public float $lat;
    public float $lon;
    public Carbon|null $from;
    public Carbon|null $to;
    public bool $isCurrent;
    public array $storedDates;

    public function __construct(float $lat, float $lon, Carbon|null $from, Carbon|null $to, bool $isCurrent, array $storedDates)
    {
        $this->lat = $lat;
        $this->lon = $lon;
        $this->from = $from;
        $this->to = $to;
        $this->isCurrent = $isCurrent;
        $this->storedDates = $storedDates;
    }

    // no nedeed, as it will be fetched if not relevant data founded
    public function handle(): bool
    {
        Log::info('FetchWeatherJob started', [
            'latitude' => $this->lat,
            'longitude' => $this->lon,
            'start_date' => $this->from?->toDateString(),
            'end_date' => $this->to?->toDateString(),
        ]);

        $url = 'https://api.open-meteo.com/v1/forecast';
        $dataNamesString = 'relative_humidity_2m,surface_pressure,temperature_2m,windspeed_10m';
        $params = [
            'latitude' => $this->lat,
            'longitude' => $this->lon,
            'timezone' => 'UTC',
        ];

        if ($this->isCurrent) {
            $params += [
                'current' => $dataNamesString,
            ];
        }
        if ($this->to !== null and $this->from !== null) {
            $params += [
                'hourly' => $dataNamesString,
                'start_date' => $this->from->toDateString(),
                'end_date' => $this->to->toDateString(),
            ];
        }

        $response = Http::timeout(10)->get($url, $params);
        if (!$response->ok()) return false;


        $data = $response->json();
        if (!$data) return false;
        
        if (
            isset($data['current']['time']) &&
            !in_array(Carbon::parse($data['current']['time']), $this->storedDates)
        ) {
            $c_time = data_get($data, 'current.time');
            $observedAt = $c_time ? Carbon::parse($c_time) : now();

            $c_temperature = data_get($data, 'current.temperature_2m');
            $c_windspeed = data_get($data, 'current.windspeed_10m');
            $c_pressure = data_get($data, 'current.surface_pressure');
            $c_humidity = data_get($data, 'current.relative_humidity_2m');
    
            $currentWeatherData = [
                'observed_at' => $observedAt,
                'lat' => $this->lat,
                'lon' => $this->lon,
                'temperature_c' => $c_temperature,
                'wind_speed_ms' => $c_windspeed ? ($c_windspeed / 3.6) : null,
                'pressure_hpa' => $c_pressure,
                'humidity_pct' => $c_humidity,
                'source' => 'open-meteo',
            ];
            $isStored = WeatherCreateAction::handle($currentWeatherData);
            
            if ($isStored) {
                $this->storedDates += [
                    $observedAt
                ];
            }
        }

        if (
            isset($data['hourly']['time'])
        ) {
            
            foreach ($data['hourly']['time'] as $idx => $time) {
                $observedAt = Carbon::parse($time);
                
                if (in_array( $observedAt, $this->storedDates)) continue;
                // dd($observedAt, $this->storedDates);
                $h_temperature = data_get($data, key: "hourly.temperature_2m.$idx");
                $h_windspeed = data_get($data, "hourly.windspeed_10m.$idx");
                $h_pressure = data_get($data, "hourly.surface_pressure.$idx");
                $h_humidity = data_get($data, "hourly.relative_humidity_2m.$idx");

                $hourlyWeatherData = [
                    'observed_at' => $observedAt,
                    'lat' => $this->lat,
                    'lon' => $this->lon,
                    'temperature_c' => $h_temperature,
                    'wind_speed_ms' => $h_windspeed ? ($h_windspeed / 3.6) : null,
                    'pressure_hpa' => $h_pressure,
                    'humidity_pct' => $h_humidity,
                    'source' => 'open-meteo',
                ];
                WeatherCreateAction::handle($hourlyWeatherData);
            }
        }

        Log::info('FetchWeatherJob ended success', [
            'latitude' => $this->lat,
            'longitude' => $this->lon,
            'from' => $this->from,
            'to' => $this->to,
            'getedData' => $data
        ]);

        return true;
    }
} 