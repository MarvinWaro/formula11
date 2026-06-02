<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@gmail.com',
                'role' => Role::SUPER_ADMIN,
            ],
            [
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
                'role' => Role::ADMIN,
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->where('email', $account['email'])->first();

            if ($user === null) {
                $user = User::factory()->create([
                    'name' => $account['name'],
                    'email' => $account['email'],
                    'password' => Hash::make('12345678'),
                ]);
            } else {
                $user->update([
                    'password' => Hash::make('12345678'),
                ]);
            }

            $user->assignRole($account['role']);
        }
    }
}
