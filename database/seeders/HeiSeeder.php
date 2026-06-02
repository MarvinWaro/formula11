<?php

namespace Database\Seeders;

use App\Models\Hei;
use Illuminate\Database\Seeder;

class HeiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $heis = [
            ['name' => 'Sultan Kudarat State University', 'abbreviation' => 'SKSU', 'region' => 'Region XII'],
            ['name' => 'STI College General Santos', 'abbreviation' => 'STI-GenSan', 'region' => 'Region XII'],
            ['name' => 'Ramon Magsaysay Memorial Colleges', 'abbreviation' => 'RMMC', 'region' => 'Region XII'],
            ['name' => 'University of Southern Mindanao', 'abbreviation' => 'USM', 'region' => 'Region XII'],
            ['name' => 'South East Asian Institute of Technology', 'abbreviation' => 'SEAIT', 'region' => 'Region XII'],
            ['name' => 'UST General Santos', 'abbreviation' => 'UST-GenSan', 'region' => 'Region XII'],
            ['name' => 'Greenvalley College', 'abbreviation' => 'GVC', 'region' => 'Region XII'],
            ['name' => 'MIST College of Technology', 'abbreviation' => 'MIST', 'region' => 'Region XII'],
            ['name' => 'Holy Child Central College', 'abbreviation' => 'HCCC', 'region' => 'Region XII'],
            ['name' => 'MSU - Maguindanao', 'abbreviation' => 'MSU-Mag', 'region' => 'BARMM'],
            ['name' => 'North Valley College Foundation', 'abbreviation' => 'NVCF', 'region' => 'Region XII'],
            ['name' => 'Southern Christian College', 'abbreviation' => 'SCC', 'region' => 'Region XII'],
            ['name' => 'St. Alexius College', 'abbreviation' => 'SAC', 'region' => 'Region XII'],
            ['name' => 'Aviation Institute of General Santos', 'abbreviation' => 'AIGS', 'region' => 'Region XII'],
            ['name' => 'Holy Trinity College', 'abbreviation' => 'HTC', 'region' => 'Region XII'],
            ['name' => 'Notre Dame of Dadiangas University', 'abbreviation' => 'NDDU', 'region' => 'Region XII'],
            ['name' => 'Central Mindanao Colleges - Kidapawan', 'abbreviation' => 'CMC', 'region' => 'Region XII'],
            ['name' => 'Mindanao State University', 'abbreviation' => 'MSU', 'region' => 'Region XII'],
            ['name' => 'CHED XII', 'abbreviation' => 'CHED-XII', 'region' => 'Region XII'],
        ];

        foreach ($heis as $hei) {
            Hei::updateOrCreate(['name' => $hei['name']], $hei);
        }
    }
}
