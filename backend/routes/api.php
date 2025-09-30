<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WeatherController;


Route::controller(WeatherController::class)->group(function () {
	Route::get('/weather/last', 'getLast');
	Route::get('/weather/recent', 'getRecent');
	Route::get('/weather/range', 'getRange');
	Route::post('/weather/fetch', 'fetch');
});
