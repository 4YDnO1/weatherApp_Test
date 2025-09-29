<?php

namespace App\Http\Controllers;

use App\Models\WeatherReading;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class WeatherController extends Controller
{
    public function last(): JsonResource
    {
        $reading = WeatherReading::orderByDesc('observed_at')->first();
        return JsonResource::make($reading);
    }

    public function recent(Request $request): JsonResource
    {
        $limit = (int) $request->query('limit', 50);
        $limit = max(1, min($limit, 1000));
        $items = WeatherReading::orderByDesc('observed_at')->limit($limit)->get();
        return JsonResource::make($items);
    }

    public function range(Request $request): JsonResource
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);
        $from = Carbon::parse($request->query('from'))->startOfDay();
        $to = Carbon::parse($request->query('to'))->endOfDay();
        $items = WeatherReading::whereBetween('observed_at', [$from, $to])
            ->orderBy('observed_at')
            ->get();
        return JsonResource::make($items);
    }
} 