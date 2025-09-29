<?php

// namespace App\Models;

// use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Illuminate\Database\Eloquent\Model;


// ! This do not needed as i noticed that API round coordinates
// ! by 0.0625, so i can do it simply by myself
// ! so original idea store associated values no needed

// class WeatherLocation extends Model
// {
//     protected $fillable = [
// 		'observed_at',
//         'searched_lat',
//         'searched_lon',
//         'approximated_lat',
//         'approximated_lon',
//     ];

//     protected $casts = [
// 		'observed_at'=> 'datetime',
//         'searched_lat' => 'float',
//         'searched_lon' => 'float',
//         'approximated_lat' => 'float',
//         'approximated_lon' => 'float',
//     ];
// } 