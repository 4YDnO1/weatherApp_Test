<?php

namespace App\Console\Commands;

use App\Jobs\FetchWeatherJob;
use Illuminate\Console\Command;

class FetchWeather extends Command
{
    protected $signature = 'weather:fetch {--lat=} {--lon=} {--once : Run only once}';
    protected $description = 'Queue a fetch of current weather and store as a reading';

    public function handle(): int
    {
        $lat = $this->option('lat') ?? env('WEATHER_LAT', '55.7558');
        $lon = $this->option('lon') ?? env('WEATHER_LON', '37.6173');

        dispatch(new FetchWeatherJob((float) $lat, (float) $lon));
        $this->info("Weather fetch queued for lat={$lat}, lon={$lon}");

        return self::SUCCESS;
    }
} 