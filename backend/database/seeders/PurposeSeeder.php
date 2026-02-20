<?php

namespace Database\Seeders;

use App\Models\Purpose;
use Illuminate\Database\Seeder;

class PurposeSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // Registrar-IT
            ['department' => 'Registrar-IT', 'name' => 'Transcript of Records (TOR)'],
            ['department' => 'Registrar-IT', 'name' => 'Request for Evaluation'],
            ['department' => 'Registrar-IT', 'name' => 'Honorable Dismissal'],
            ['department' => 'Registrar-IT', 'name' => 'Diploma Release'],

            // Register-Crim (Keep an eye on the spelling: Registrar vs Register)
            ['department' => 'Registrar-Crim', 'name' => 'Criminology Board Exam Docs'],
            ['department' => 'Registrar-Crim', 'name' => 'Uniform/Gear Clearance'],
            ['department' => 'Registrar-Crim', 'name' => 'Enrollment Validation'],

            // Cashier
            ['department' => 'Cashier', 'name' => 'Tuition Fee Payment'],
            ['department' => 'Cashier', 'name' => 'Examination Permit'],
            ['department' => 'Cashier', 'name' => 'Miscellaneous Fees'],
            ['department' => 'Cashier', 'name' => 'Refund Request'],

            // SSG
            ['department' => 'SSG', 'name' => 'Membership Fee'],
            ['department' => 'SSG', 'name' => 'ID Lanyard/Case'],
            ['department' => 'SSG', 'name' => 'Event Registration'],
            ['department' => 'SSG', 'name' => 'Student Concerns'],

            ['department' => 'Registrar-Bsoa', 'name' => 'Membership Fee'],
            ['department' => 'Registrar-Bsoa', 'name' => 'ID Lanyard/Case'],
            ['department' => 'Registrar-Bsoa', 'name' => 'Event Registration'],
            ['department' => 'Registrar-Bsoa', 'name' => 'Student Concerns'],
        ];

        foreach ($data as $item) {
            Purpose::create($item);
        }
    }
}