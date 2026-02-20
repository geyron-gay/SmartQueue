<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $data = [

            // Registrar-IT Staff
            [
                'name' => 'CAS',
                'email' => 'registrar.cas@.com',
                'student_id' => null,
                'department' => 'Registrar-CAS',
               
                'password' => Hash::make('password123'),
                'role' => 'staff',
            ],

            [
                'name' => 'BSOA',
                'email' => 'registrar.bsoa@.com',
                'student_id' => null,
                'department' => 'Registrar-BSOA',
               
                'password' => Hash::make('password123'),
                'role' => 'staff',
            ],

            // Registrar-Crim Staff
            [
                'name' => 'CRIM',
                'email' => 'registrar.crim@.com',
                'student_id' => null,
                'department' => 'Register-Crim',
                
                'password' => Hash::make('password123'),
                'role' => 'staff',
            ],

            // Cashier Staff
            [
                'name' => 'EDUC',
                'email' => 'cashier@.com',
                'student_id' => null,
                'department' => 'Cashier',
             
                'password' => Hash::make('password123'),
                'role' => 'staff',
            ],
        ];

        foreach ($data as $item) {
            User::create($item);
        }
    }
}
