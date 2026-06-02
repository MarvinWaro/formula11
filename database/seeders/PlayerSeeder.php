<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courtOwners = [
            ['name' => 'Paraiso Verde Pickleball Court', 'email' => 'paraiso@gmail.com'],
        ];

        foreach ($courtOwners as $owner) {
            $user = User::query()->where('email', $owner['email'])->first();

            if ($user === null) {
                $user = User::factory()->create([
                    'name' => $owner['name'],
                    'email' => $owner['email'],
                    'password' => Hash::make('12345678'),
                ]);
            } else {
                $user->update(['password' => Hash::make('12345678')]);
            }

            $user->assignRole(Role::COURT_OWNER);
        }

        $players = [
            ['name' => 'Juan dela Cruz', 'email' => 'juan@gmail.com'],
            ['name' => 'Maria Clara', 'email' => 'maria@gmail.com'],
            ['name' => 'Jose Rizal', 'email' => 'jose@gmail.com'],
            ['name' => 'Andres Bonifacio', 'email' => 'andres@gmail.com'],
            ['name' => 'Emilio Aguinaldo', 'email' => 'emilio@gmail.com'],
            ['name' => 'Gabriela Silang', 'email' => 'gabriela@gmail.com'],
            ['name' => 'Lapu Lapu', 'email' => 'lapu@gmail.com'],
            ['name' => 'Melchora Aquino', 'email' => 'melchora@gmail.com'],
            ['name' => 'Antonio Luna', 'email' => 'antonio@gmail.com'],
            ['name' => 'Gregorio del Pilar', 'email' => 'gregorio@gmail.com'],
            ['name' => 'Tandang Sora', 'email' => 'sora@gmail.com'],
            ['name' => 'Apolinario Mabini', 'email' => 'apolinario@gmail.com'],
        ];

        foreach ($players as $player) {
            $user = User::query()->where('email', $player['email'])->first();

            if ($user === null) {
                $user = User::factory()->create([
                    'name' => $player['name'],
                    'email' => $player['email'],
                    'password' => Hash::make('12345678'),
                ]);
            } else {
                $user->update(['password' => Hash::make('12345678')]);
            }

            $user->assignRole(Role::PLAYER);
        }
    }
}
