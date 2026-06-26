<?php

use Illuminate\Support\Facades\Route;

Route::get('/test', static fn () => response()->json([
    'message' => 'Laravel API Connected',
]));
