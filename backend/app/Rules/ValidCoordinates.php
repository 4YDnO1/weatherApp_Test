<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCoordinates implements ValidationRule
{
    /**
     * Create a new rule instance.
     *
     * @return void
     */
    public function __construct()
    {
        
    }

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute  The name of the attribute being validated.
     * @param  mixed  $value The value of the attribute.
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     * @return bool
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_array($value) || !isset($value['lat']) || !isset($value['lon'])) {
            $fail('lontitude or latidute is not numeric');
        }

        $lat = $value['lat'];
        $lon = $value['lon'];

        // Check if latitude and longitude are numeric.
        if (!is_numeric($lat) || !is_numeric($lon)) {
            $fail('lontitude or latidute is not numeric');
        }
        if ($lat < -90 || $lat > 90) {
			$fail('latidute in not in range of -90 to 90');
        }
        if ($lon < -180 || $lon > 180) {
            $fail('lontitude in not in range of -180 to 180');
        }
    }
}
