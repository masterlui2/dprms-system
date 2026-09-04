<?php

namespace Database\Seeders;

use App\Models\EquipmentCategory;
use Illuminate\Database\Seeder;

class EquipmentCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['category_code' => 'PRODUCTION', 'category_name' => 'Production Equipment', 'description' => 'Machinery and tools used directly in production.'],
            ['category_code' => 'PROCESSING', 'category_name' => 'Processing Equipment', 'description' => 'Equipment used to process, package, or preserve products.'],
            ['category_code' => 'TESTING', 'category_name' => 'Testing and Laboratory Equipment', 'description' => 'Testing, measurement, and laboratory instruments.'],
            ['category_code' => 'ICT', 'category_name' => 'ICT Equipment', 'description' => 'Computers, communications, and other digital equipment.'],
            ['category_code' => 'OTHER', 'category_name' => 'Other Equipment', 'description' => 'Assets not covered by the standard equipment categories.'],
        ];

        foreach ($categories as $category) {
            EquipmentCategory::query()->updateOrCreate(
                ['category_code' => $category['category_code']],
                [...$category, 'is_active' => true],
            );
        }
    }
}
