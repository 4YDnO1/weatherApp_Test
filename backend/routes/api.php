<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WeatherController;


Route::controller(WeatherController::class)->group(function () {
	Route::get('/weather/last', 'getLast');
	Route::get('/weather/recent', 'recent');
	Route::get('/weather/range', 'range');
	Route::post('/weather/fetch', 'fetch');
});
