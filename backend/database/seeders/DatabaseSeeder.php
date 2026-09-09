<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(DemoUserSeeder::class);
        $this->call(DocumentTypeSeeder::class);
        $this->call(DocumentChecklistTemplateSeeder::class);
        $this->call(EquipmentCategorySeeder::class);
        $this->call(SetupProjectSeeder::class);
    }
}
