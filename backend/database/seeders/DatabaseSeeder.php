<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(DemoUserSeeder::class);
        $this->call(DocumentTypeSeeder::class);
        $this->call(EquipmentCategorySeeder::class);
    }
}
