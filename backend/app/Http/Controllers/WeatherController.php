<?php

namespace App\Http\Controllers;

use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;

use App\Models\Weather;
use App\Http\Requests\WeatherGetRequest;
use App\Http\Requests\WeatherGetRangeRequest;
use App\Jobs\WeatherFetchJob;

class WeatherController extends Controller
{
    public function getLast(WeatherGetRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        $this->fetch($validatedData);

        $weatherQuery = $this->getWeatherDataBuilder($validatedData);
        $weatherData = $weatherQuery
            ->where('observed_at', '<', Carbon::now())
            ->orderByDesc('observed_at')
            ->first();

        return response()->json( $weatherData);
    }

    public function getRecent(WeatherGetRequest $request): JsonResponse
    {
        $validatedData = $request->validated();
        $validatedData['from'] = now()->subDays(3)->startOfDay();
        $validatedData['to'] = now()->addDay()->endOfDay();
        
        $result = $this->fetch($validatedData);

        $limit = 50;
        $weatherQuery = $this->getWeatherDataBuilder($validatedData);
        $weatherData = $weatherQuery
            ->where('observed_at',  '<', now()->endOfDay())
            ->orderByDesc('observed_at')
            ->limit($limit)
            ->get();

        return response()->json( $weatherData);
    }

    public function getRange(WeatherGetRangeRequest $request): JsonResponse
    {
        $validatedData = $request->validated();

        $this->fetch($validatedData);

        $from = Carbon::parse($validatedData['from'])->startOfDay();
        $to = Carbon::parse($validatedData['to'])->endOfDay();

        $weatherQuery = $this->getWeatherDataBuilder($validatedData);
        $weatherData = $weatherQuery
            ->whereBetween('observed_at',  [$from, $to])
            ->orderByDesc('observed_at')
            ->get();
        return response()->json( $weatherData);
    }

    // fetch new data if there missing in database
    // 1) no data for last 15 mins or
    // 2) not enough data for range
    public function fetch(array $searchedData): JsonResponse
    {
        $weatherQuery = $this->getWeatherDataBuilder($searchedData);
        $Minutes15Ago = Carbon::now()->subMinutes(15);
        $wheatherCurrentDate = $weatherQuery
            ->whereBetween('observed_at', [$Minutes15Ago, Carbon::now()])
            ->first('observed_at');

        $newLastDataAvalaibale = !isset($wheatherCurrentDate['observed_at']);

        $from = isset($searchedData['from']) ?
            Carbon::parse($searchedData['from'])->startOfDay():
            Carbon::now()->startOfDay();
        $to = isset($searchedData['to']) ?
            Carbon::parse($searchedData['to'])->endOfDay() :
            Carbon::now()->endOfDay();
        
            
        $weatherQuery2 = $this->getWeatherDataBuilder($searchedData);
        $weatherHoursDates = $weatherQuery2
            ->whereBetween('observed_at', [$from, $to])
            ->get('observed_at')
            ->map(function ($weather) {
                $observedAt = Carbon::parse($weather['observed_at']);
                if ($observedAt->minute === 0) return $observedAt;
                return null;
            })
            ->filter();

        $newHoursDataNeeded = count($weatherHoursDates) < 24 * ($from->diffInDays($to) + 1);
        // dd($from, $to, $searchedData, count($weatherHoursDates), $from->diffInDays($to) + 1, $weatherHoursDates->toArray());
        if ($newLastDataAvalaibale || $newHoursDataNeeded) {
            $coordinateStep = 0.0625;
            $lat = (float) round($searchedData['lat'] / $coordinateStep) * $coordinateStep;
            $lon = (float) round($searchedData['lon'] / $coordinateStep) * $coordinateStep;
    
            dispatch(new WeatherFetchJob($lat, $lon, $from, $to, $newLastDataAvalaibale, $weatherHoursDates->toArray()));
            return response()->json( ['status' => 'queued']);
        }

        return response()->json( ['status' => 'noFetchNeeded']);
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