<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('weather_readings', function (Blueprint $table) {
            $table->id();
            $table->timestamp('observed_at')->index();
            $table->float('temperature_c')->nullable();
            $table->float('wind_speed_ms')->nullable();
            $table->float('pressure_hpa')->nullable();
            $table->float('humidity_pct')->nullable();
            $table->string('source')->default('open-meteo');
            $table->json('raw')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weather_readings');
    }
}; 