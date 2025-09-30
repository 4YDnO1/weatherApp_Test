<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class WeatherGetRangeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'lat' => 'required|numeric|min:-90|max:90',
            'lon' => 'required|numeric|min:-180|max:180',
            'from' => [
                'required',
                'date',
                'date_format:Y-m-d',
                'before_or_equal:to'
            ],
            'to' => [
                'required',
                'date',
                'date_format:Y-m-d',
                'after_or_equal:from'
            ],
        ];
    }
	 /**
      * Handle a failed validation attempt.
      *
      * @param  \Illuminate\Contracts\Validation\Validator  $validator
      * @return void
      *
      * @throws \Illuminate\Validation\ValidationException
      */
	protected function failedValidation(Validator $validator): never
	{
		throw new HttpResponseException(response()->json([
			'errors' => $validator->errors(),
			'status' => false,
		], 422));
	}
    /**
     * Custom message for validation
     *
     * @return array
     */
    public function messages(): array	
    {
        return [
            'lat.required' => 'Latitude is required.',
            'lat.numeric' => 'Latitude must be a number.',
            'lat.min' => 'Latitude must be at least -90.',
            'lat.max' => 'Latitude must be at most 90.',

            'lon.required' => 'Longitude is required.',
            'lon.numeric' => 'Longitude must be a number.',
            'lon.min' => 'Longitude must be at least -180.',
            'lon.max' => 'Longitude must be at most 180.',

            'from.required' => 'The "from" date is required.',
			'from.date' => 'The "from" date must be a valid date.',
            'from.date_format' => 'The "from" date must be in YYYY-MM-DD format.',
            'from.before_or_equal' => 'The "from" date must be before or equal to the "to" date.',

			'to.required' => 'The "to" date is required.',
            'to.date' => 'The "to" date must be a valid date.',
            'to.date_format' => 'The "to" date must be in YYYY-MM-DD format.',
            'to.after_or_equal' => 'The "to" date must be after or equal to the "from" date.',
        ];
    }
}