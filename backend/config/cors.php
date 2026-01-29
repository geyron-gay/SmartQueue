<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */ //10.74.124.165

  'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'logout'], // Add login/register here!

'allowed_methods' => ['*'],

'allowed_origins' => [
    'http://192.168.137.252:5173', 
    'http://localhost:5173',
    'http://127.0.0.1:5173',
],

'allowed_origins_patterns' => [],

'allowed_headers' => ['*'],

'exposed_headers' => [],

'max_age' => 0,

'supports_credentials' => true, // 👈 THIS MUST BE TRUE

];
