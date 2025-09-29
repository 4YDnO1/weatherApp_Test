<?php

namespace App\Http\Controllers;

use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;

use App\Models\Weather;
use App\Http\Requests\WeatherGetRequest;
use App\Jobs\FetchWeatherJob;

class WeatherController extends Controller
{
    public function getLast(WeatherGetRequest $request): JsonResponse
    {
        $validatedData = $request->validated();


        $weatherQuery = Weather::query();
        $weatherQuery->where('lat',  $lat)->where('lon', $lon);
        $weatherData = $weatherQuery->orderByDesc('observed_at')->first();

        return response()->json( $weatherData);
    }

    public function getRecent(WeatherGetRequest $request): JsonResponse
    {
        $validatedData = $request->validated();
        
        $weatherQuery = $this->getWeatherDataBuilder($validatedData);

        $weatherData = $this->fetch($validatedData);
        $limit = 50;

        $weatherQuery = Weather::query();
        $weatherQuery->where('lat', $lat)->where('lon', $lon);
        $weatherData = $weatherQuery->orderByDesc('observed_at')->limit($limit)->get();
        
        return response()->json( $weatherData);
    }

    public function getRange(WeatherGetRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        $from = Carbon::parse($validatedData['from'])->startOfDay();
        $to = Carbon::parse($validatedData['to'])->endOfDay();

        $weatherQuery = $this->getWeatherDataBuilder($validatedData);
        $weatherQuery = $weatherQuery::whereBetween('observed_at', [$from, $to]);

        if ($weatherData = $weatherQuery->get()) {

        }

        $weatherData = $weatherQuery->orderBy('observed_at')->get();
        return response()->json( $weatherData);
    }

    public function fetch(array $validatedData): JsonResponse
    {
        $weatherQuery = $this->getWeatherDataBuilder($validatedData);
        $Minutes15Ago = Carbon::now()->subMinutes(15);
        $wheatherCurrentData = $weatherQuery->where("observed_at", ">", $Minutes15Ago)->first();
        
        $newLastDataAvalaibale = true;
        if ($wheatherCurrentData) {
            $newLastDataAvalaibale = false;
        }


        if ($WeatherLocationData) { 
            $WeatherData = Weather::query()
            ->where('lat', $WeatherLocationData['lat'])
            ->where('lon', $WeatherLocationData['lon']);
        }

        // https://api.open-meteo.com/v1/forecast?latitude=54.9044&longitude=52.3154
        Weather::where('searched_lat', $lat)
            ->where('searched_lon', $lon);

        dispatch(new FetchWeatherJob($lat, $lon, $ftom, $to));
        return response()->json( ['status' => 'queued']);
    }

    /**
     * Helper function to build the base Weather query with lat/lon filters.
     *
     * @param WeatherGetRequest $request
     * @return \Illuminate\Database\Eloquent\Builder
     */
    private function getWeatherDataBuilder($validatedData) 
    {
        $coordinateStep = 0.0625;
        $lat = (float) round($validatedData['lat'] / $coordinateStep) * $coordinateStep;
        $lon = (float) round($validatedData['lon'] / $coordinateStep) * $coordinateStep;

        return Weather::query()
            ->where('lat', $lat)
            ->where('lon', $lon);
    }
} 