<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WeatherController;

Route::get('/weather/last', [WeatherController::class, 'last']);
Route::get('/weather/recent', [WeatherController::class, 'recent']);
Route::get('/weather/range', [WeatherController::class, 'range']); 