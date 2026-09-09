<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\AssetCapital;
use App\Models\Employee;
use App\Models\EquipmentCategory;
use App\Models\EquipmentConditionLog;
use App\Models\EquipmentQrCode;
use App\Models\EquipmentRegistry;
use App\Models\GiaDeliverableTracking;
use App\Models\GiaProgressReport;
use App\Models\GiaProposal;
use App\Models\Intervention;
use App\Models\Linkage;
use App\Models\Market;
use App\Models\Narrative;
use App\Models\Product;
use App\Models\ProductCost;
use App\Models\ProductionMaterial;
use App\Models\Project;
use App\Models\ProjectBudget;
use App\Models\ProjectLedger;
use App\Models\ProjectMonitoringRecord;
use App\Models\Proposal;
use App\Models\QuarterlyMetrics;
use App\Models\RepaymentTransaction;
use App\Models\Role;
use App\Models\SetupProgressReport;
use App\Models\SetupProposal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoProjectsSeeder extends Seeder
{
    public function run(): void
    {
        $setupRole = Role::query()->where('code', 'MSME_PROPONENT')->firstOrFail();
        $giaRole = Role::query()->where('code', 'GIA_PROJECT_LEADER')->firstOrFail();

        $director = User::query()->where('email', 'director@dost.gov.ph')->first();
        $setupStaff = User::query()->where('email', 'setup.staff@dost.gov.ph')->first();
        $setupFocal = User::query()->where('email', 'setup.focal@dost.gov.ph')->first();
        $giaStaff = User::query()->where('email', 'gia.staff@dost.gov.ph')->first();
        $giaFocal = User::query()->where('email', 'gia.focal@dost.gov.ph')->first();
        $equipmentCategories = EquipmentCategory::query()->pluck('id', 'category_name')->all();

        $setupProjectsData = [
            [
                'email' => 'setup.demo01@dost.gov.ph',
                'name' => 'Elena Cruz',
                'reference' => 'SETUP-2026-0001',
                'title' => 'Modernization of Virgin Coconut Oil (VCO) Cold-Press and Centrifuge Extraction Line',
                'business_name' => 'Oriental Virgin Coco Products',
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Agriculture / Coconut Processing',
                'enterprise_size' => 'SMALL',
                'years' => 7,
                'address' => 'Barangay Corporacion, Lupon, Davao Oriental',
                'city' => 'Lupon',
                'budget' => 2400000.00,
                'refunded' => 600000.00,
                'full_release' => '2026-03-09',
                'compliance' => 100.00,
                'start_date' => '2026-03-15',
                'end_date' => '2029-03-15',
                'phone' => '09174561001',
                'bank_branch' => 'Landbank Lupon Branch',
                'payments' => [66666.67, 66666.67, 66666.67, 66666.67, 333333.32],
                'products' => [
                    ['name' => 'Virgin Coconut Oil 250ml', 'specs' => 'Cold-pressed centrifuge grade A', 'unit' => 'Bottle', 'base_price' => 180.00, 'base_qty' => 1250],
                    ['name' => 'Virgin Coconut Oil 500ml', 'specs' => 'Export quality pure VCO', 'unit' => 'Bottle', 'base_price' => 320.00, 'base_qty' => 850],
                    ['name' => 'VCO Moisturizing Herbal Soap', 'specs' => 'Organic cold-process 100g bar', 'unit' => 'Piece', 'base_price' => 65.00, 'base_qty' => 1900],
                    ['name' => 'Organic Coconut Flour 1kg', 'specs' => 'Defatted dietary fiber', 'unit' => 'Pack', 'base_price' => 95.00, 'base_qty' => 650],
                ],
                'materials' => [
                    ['mat' => 'Mature Dehusked Coconuts', 'unit' => 'Piece', 'cost' => 12, 'qty' => 4500],
                    ['mat' => 'Food-Grade 500ml PET Bottles', 'unit' => 'Piece', 'cost' => 8, 'qty' => 1200],
                    ['mat' => 'Tamper-Evident Caps & Induction Liners', 'unit' => 'Piece', 'cost' => 3, 'qty' => 2100],
                ],
                'assets' => [
                    ['name' => 'High-Speed Centrifuge Extractor', 'type' => 'Equipment: Centrifuge Line', 'lifespan' => 10, 'cost' => 480000.00, 'year' => 2026],
                    ['name' => 'Hydraulic Coconut Meat Cold Press', 'type' => 'Equipment: Cold Press', 'lifespan' => 10, 'cost' => 360000.00, 'year' => 2026],
                    ['name' => 'GMP Cleanroom Extraction Facility', 'type' => 'Building: Processing Facility', 'lifespan' => 20, 'cost' => 620000.00, 'year' => 2025],
                ],
                'market_name' => 'Davao Region Wellness Outlets & Supermarkets',
            ],
            [
                'email' => 'setup.demo02@dost.gov.ph',
                'name' => 'Roberto Tan',
                'reference' => 'SETUP-2026-0002',
                'title' => 'Upgrading of Precision Cacao Fermentation and Bean Processing System',
                'business_name' => 'Mandaya Heritage Cacao Producers',
                'business_type' => 'COOPERATIVE',
                'industry_sector' => 'Food Processing',
                'enterprise_size' => 'SMALL',
                'years' => 6,
                'address' => 'Poblacion, San Isidro, Davao Oriental',
                'city' => 'San Isidro',
                'budget' => 1950000.00,
                'refunded' => 450000.00,
                'full_release' => '2026-02-09',
                'compliance' => 100.00,
                'start_date' => '2026-02-20',
                'end_date' => '2029-02-20',
                'phone' => '09183452002',
                'bank_branch' => 'Landbank Mati Branch',
                'payments' => [54166.67, 54166.67, 54166.67, 54166.67, 54166.67, 179166.65],
                'pending_payment' => 54166.67,
                'products' => [
                    ['name' => 'Fermented Dried Cacao Beans (kg)', 'specs' => 'Single-origin Criollo-Trinitario', 'unit' => 'Kilogram', 'base_price' => 240.00, 'base_qty' => 1500],
                    ['name' => 'Traditional Pure Tablea (200g)', 'specs' => '100% unsweetened cacao mass roll', 'unit' => 'Roll', 'base_price' => 110.00, 'base_qty' => 1100],
                    ['name' => 'Artisanal Dark Chocolate 70% (50g)', 'specs' => 'Bean-to-bar single estate bar', 'unit' => 'Bar', 'base_price' => 95.00, 'base_qty' => 1400],
                    ['name' => 'Roasted Cacao Nibs (250g)', 'specs' => 'Organic lightly roasted crunchy nibs', 'unit' => 'Pouch', 'base_price' => 135.00, 'base_qty' => 700],
                ],
                'materials' => [
                    ['mat' => 'Wet Cacao Pods & Fresh Beans', 'unit' => 'Kilogram', 'cost' => 55, 'qty' => 2800],
                    ['mat' => 'Artisan Foil Barrier Pouches', 'unit' => 'Piece', 'cost' => 6, 'qty' => 2400],
                    ['mat' => 'Tablea Wrapping Wax Paper', 'unit' => 'Sheet', 'cost' => 2, 'qty' => 1500],
                ],
                'assets' => [
                    ['name' => 'Precision Controlled Solar Dryer & Fermenter', 'type' => 'Equipment: Cacao Dryer', 'lifespan' => 8, 'cost' => 380000.00, 'year' => 2026],
                    ['name' => 'Stone Melangeur Chocolate Conche', 'type' => 'Equipment: Conching Machine', 'lifespan' => 10, 'cost' => 290000.00, 'year' => 2026],
                    ['name' => 'Solar Tunnel Greenhouse Dryer', 'type' => 'Building: Solar Greenhouse', 'lifespan' => 15, 'cost' => 450000.00, 'year' => 2025],
                ],
                'market_name' => 'Mati & Davao City Artisanal Coffee Shops & Coops',
            ],
            [
                'email' => 'setup.demo03@dost.gov.ph',
                'name' => 'Marissa Reyes',
                'reference' => 'SETUP-2026-0003',
                'title' => 'Adoption of Semi-Automated Rice Milling and Drying Technology',
                'business_name' => 'Banaybanay Golden Grains Milling Corp.',
                'business_type' => 'CORPORATION',
                'industry_sector' => 'Agriculture / Post-Harvest',
                'enterprise_size' => 'MEDIUM',
                'years' => 9,
                'address' => 'Poblacion, Banaybanay, Davao Oriental',
                'city' => 'Banaybanay',
                'budget' => 3200000.00,
                'refunded' => 1200000.00,
                'full_release' => '2025-10-09',
                'compliance' => 100.00,
                'start_date' => '2025-10-20',
                'end_date' => '2028-10-20',
                'phone' => '09204563003',
                'bank_branch' => 'Landbank Banaybanay Agri-Hub',
                'payments' => [88888.89, 88888.89, 88888.89, 88888.89, 88888.89, 88888.89, 88888.89, 88888.89, 88888.89, 399999.99],
                'products' => [
                    ['name' => 'Premium Dinorado Rice (25kg)', 'specs' => 'Grade 1 aromatic whole grain', 'unit' => 'Sack', 'base_price' => 1350.00, 'base_qty' => 480],
                    ['name' => 'Premium Sinandomeng Rice (25kg)', 'specs' => 'Well-milled soft grain quality', 'unit' => 'Sack', 'base_price' => 1150.00, 'base_qty' => 620],
                    ['name' => 'Nutrient Brown Rice (5kg)', 'specs' => 'Unpolished high-fiber rice', 'unit' => 'Pack', 'base_price' => 280.00, 'base_qty' => 500],
                    ['name' => 'Rice Bran D1 (50kg)', 'specs' => 'Feed grade fine rice bran', 'unit' => 'Sack', 'base_price' => 450.00, 'base_qty' => 350],
                ],
                'materials' => [
                    ['mat' => 'Fresh Harvest Banaybanay Palay', 'unit' => 'Sack', 'cost' => 1100, 'qty' => 1200],
                    ['mat' => 'Woven Polypropylene Sacks (25kg)', 'unit' => 'Piece', 'cost' => 18, 'qty' => 1100],
                    ['mat' => 'Oxygen Absorber Packs', 'unit' => 'Piece', 'cost' => 4, 'qty' => 500],
                ],
                'assets' => [
                    ['name' => 'Multi-Pass Rubber Roll Rice Dehusker', 'type' => 'Equipment: Milling System', 'lifespan' => 12, 'cost' => 850000.00, 'year' => 2025],
                    ['name' => 'Recirculating Batch Grain Dryer 10-Ton', 'type' => 'Equipment: Grain Dryer', 'lifespan' => 15, 'cost' => 950000.00, 'year' => 2025],
                    ['name' => 'Grain Storage Warehouse & Silo Foundation', 'type' => 'Building: Grain Warehouse', 'lifespan' => 25, 'cost' => 800000.00, 'year' => 2024],
                ],
                'market_name' => 'Banaybanay Rice Wholesalers & Tagum Traders',
            ],
            [
                'email' => 'setup.demo04@dost.gov.ph',
                'name' => 'Danilo Santos',
                'reference' => 'SETUP-2026-0004',
                'title' => 'Technological Upgrading of Smoked and Dried Fish Processing Facility',
                'business_name' => 'Baganga Coastal Aqua-Marine Foods',
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Food Processing',
                'enterprise_size' => 'MICRO',
                'years' => 4,
                'address' => 'Barangay Lambajon, Baganga, Davao Oriental',
                'city' => 'Baganga',
                'budget' => 1450000.00,
                'refunded' => 250000.00,
                'full_release' => '2026-06-09',
                'compliance' => 100.00,
                'start_date' => '2026-06-15',
                'end_date' => '2029-06-15',
                'phone' => '09225674004',
                'bank_branch' => 'Landbank Baganga Branch',
                'payments' => [150000.00, 100000.00],
                'products' => [
                    ['name' => 'Smoked Deboned Milkfish 350g', 'specs' => 'Naturally smoked vacuum pack', 'unit' => 'Pack', 'base_price' => 165.00, 'base_qty' => 1400],
                    ['name' => 'Dried Split Flying Fish 250g', 'specs' => 'Sun and mechanical hybrid dried', 'unit' => 'Pack', 'base_price' => 125.00, 'base_qty' => 1600],
                    ['name' => 'Spanish Style Sardines 220g', 'specs' => 'Glass jar in pure corn oil', 'unit' => 'Jar', 'base_price' => 115.00, 'base_qty' => 1100],
                ],
                'materials' => [
                    ['mat' => 'Fresh Catch Bangus & Marine Fish', 'unit' => 'Kilogram', 'cost' => 135, 'qty' => 1800],
                    ['mat' => 'Food-Grade Retort Vacuum Pouches', 'unit' => 'Piece', 'cost' => 7, 'qty' => 2800],
                    ['mat' => 'Glass Food Jars 220ml with Lug Caps', 'unit' => 'Piece', 'cost' => 14, 'qty' => 1200],
                ],
                'assets' => [
                    ['name' => 'Stainless Industrial Smokehouse Chamber', 'type' => 'Equipment: Smoking Machine', 'lifespan' => 10, 'cost' => 310000.00, 'year' => 2026],
                    ['name' => 'Commercial Chamber Vacuum Sealer', 'type' => 'Equipment: Packaging', 'lifespan' => 8, 'cost' => 140000.00, 'year' => 2026],
                    ['name' => 'Hygienic Marine Fish Drying Shelter', 'type' => 'Building: Drying Facility', 'lifespan' => 15, 'cost' => 350000.00, 'year' => 2025],
                ],
                'market_name' => 'Baganga Public Market & Davao City Pasalubong Hubs',
            ],
            [
                'email' => 'setup.demo05@dost.gov.ph',
                'name' => 'Carmen Garcia',
                'reference' => 'SETUP-2026-0005',
                'title' => 'Precision Woodworking and CNC Furniture Manufacturing Enhancement',
                'business_name' => 'GovGen Artisan Furniture & Woodcraft',
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Furniture / Woodcraft',
                'enterprise_size' => 'SMALL',
                'years' => 8,
                'address' => 'Tiblawan, Governor Generoso, Davao Oriental',
                'city' => 'Governor Generoso',
                'budget' => 2100000.00,
                'refunded' => 800000.00,
                'full_release' => '2025-09-09',
                'compliance' => 100.00,
                'start_date' => '2025-09-18',
                'end_date' => '2028-09-18',
                'phone' => '09196785005',
                'bank_branch' => 'DBP Mati Branch',
                'payments' => [87500.00, 87500.00, 87500.00, 87500.00, 87500.00, 87500.00, 87500.00, 87500.00, 100000.00],
                'products' => [
                    ['name' => 'Solid Mahogany Dining Set (6-Seat)', 'specs' => 'Kiln-dried plantation hardwood', 'unit' => 'Set', 'base_price' => 32000.00, 'base_qty' => 12],
                    ['name' => 'CNC Mandaya Motif Accent Panel', 'specs' => 'Precision 3D ethnic wall art', 'unit' => 'Piece', 'base_price' => 4500.00, 'base_qty' => 45],
                    ['name' => 'Modular Ergonomic Office Desk', 'specs' => 'Treated hardwood with grommets', 'unit' => 'Piece', 'base_price' => 12500.00, 'base_qty' => 24],
                ],
                'materials' => [
                    ['mat' => 'Kiln-Dried Certified Plantation Timber', 'unit' => 'Board Foot', 'cost' => 65, 'qty' => 3200],
                    ['mat' => 'Polyurethane Clear Finishes & Sanding Rolls', 'unit' => 'Set', 'cost' => 450, 'qty' => 40],
                    ['mat' => 'Heavy-Duty Hardware Fittings & Hinges', 'unit' => 'Set', 'cost' => 180, 'qty' => 80],
                ],
                'assets' => [
                    ['name' => 'Heavy-Duty 3-Axis Wood CNC Router', 'type' => 'Equipment: CNC Machinery', 'lifespan' => 10, 'cost' => 620000.00, 'year' => 2025],
                    ['name' => 'Industrial Thickness Planer and Shaper', 'type' => 'Equipment: Woodworking', 'lifespan' => 12, 'cost' => 280000.00, 'year' => 2025],
                    ['name' => 'Carpentry Workshop and Dust Extraction Bay', 'type' => 'Building: Workshop Facility', 'lifespan' => 20, 'cost' => 520000.00, 'year' => 2024],
                ],
                'market_name' => 'Davao City Hotel & Institutional Furniture Clients',
            ],
            [
                'email' => 'setup.demo06@dost.gov.ph',
                'name' => 'Leandro Lim',
                'reference' => 'SETUP-2026-0006',
                'title' => 'Modernization of Coffee Bean Hulling, Sorting and Roasting Facility',
                'business_name' => 'Mount Hamiguitan Highland Coffee Co.',
                'business_type' => 'PARTNERSHIP',
                'industry_sector' => 'Food Processing',
                'enterprise_size' => 'MICRO',
                'years' => 5,
                'address' => 'La Union, San Isidro, Davao Oriental',
                'city' => 'San Isidro',
                'budget' => 1750000.00,
                'refunded' => 380000.00,
                'full_release' => '2026-04-09',
                'compliance' => 100.00,
                'start_date' => '2026-04-18',
                'end_date' => '2029-04-18',
                'phone' => '09177896006',
                'bank_branch' => 'Landbank Mati Branch',
                'payments' => [100000.00, 100000.00, 100000.00, 80000.00],
                'pending_payment' => 48611.11,
                'products' => [
                    ['name' => 'Specialty Arabica Roast 250g', 'specs' => 'Single-origin Mount Hamiguitan', 'unit' => 'Pouch', 'base_price' => 275.00, 'base_qty' => 1200],
                    ['name' => 'Highland Robusta Reserve 500g', 'specs' => 'Bold espresso dark roast blend', 'unit' => 'Pouch', 'base_price' => 320.00, 'base_qty' => 950],
                    ['name' => 'Drip Coffee Bags (Box of 10)', 'specs' => 'Travel-ready single-serve drip', 'unit' => 'Box', 'base_price' => 210.00, 'base_qty' => 800],
                ],
                'materials' => [
                    ['mat' => 'Raw Red Ripe Coffee Cherries', 'unit' => 'Kilogram', 'cost' => 90, 'qty' => 3500],
                    ['mat' => 'Foil Valve Coffee Pouches 250g', 'unit' => 'Piece', 'cost' => 14, 'qty' => 2200],
                    ['mat' => 'Drip Filter Paper Packs', 'unit' => 'Box', 'cost' => 65, 'qty' => 250],
                ],
                'assets' => [
                    ['name' => 'Fluid-Bed Micro Roaster with Thermocouple', 'type' => 'Equipment: Coffee Roaster', 'lifespan' => 10, 'cost' => 420000.00, 'year' => 2026],
                    ['name' => 'Optical Color Coffee Bean Sorter', 'type' => 'Equipment: Bean Sorter', 'lifespan' => 10, 'cost' => 290000.00, 'year' => 2026],
                    ['name' => 'Coffee Cupping and Roasting Laboratory', 'type' => 'Building: Roastery Lab', 'lifespan' => 20, 'cost' => 380000.00, 'year' => 2025],
                ],
                'market_name' => 'Specialty Cafes in Davao City & Mati Coastal Resorts',
            ],
            [
                'email' => 'setup.demo07@dost.gov.ph',
                'name' => 'Teresa Villanueva',
                'reference' => 'SETUP-2026-0007',
                'title' => 'Mechanization of Seaweed Drying and Semi-Refined Carrageenan Production',
                'business_name' => 'Tarragona Seaweed Harvesters Association',
                'business_type' => 'COOPERATIVE',
                'industry_sector' => 'Aquaculture / Marine Products',
                'enterprise_size' => 'SMALL',
                'years' => 7,
                'address' => 'Lucatan, Tarragona, Davao Oriental',
                'city' => 'Tarragona',
                'budget' => 1600000.00,
                'refunded' => 200000.00,
                'full_release' => '2026-07-09',
                'compliance' => 100.00,
                'start_date' => '2026-07-15',
                'end_date' => '2029-07-15',
                'phone' => '09188907007',
                'bank_branch' => 'Landbank Mati Branch',
                'payments' => [200000.00],
                'products' => [
                    ['name' => 'Clean Dried Kappaphycus Cottonii (kg)', 'specs' => 'Moisture content <35% grade A', 'unit' => 'Kilogram', 'base_price' => 95.00, 'base_qty' => 3200],
                    ['name' => 'Semi-Refined Carrageenan (kg)', 'specs' => 'Alkali-treated food grade chips', 'unit' => 'Kilogram', 'base_price' => 280.00, 'base_qty' => 900],
                    ['name' => 'Organic Seaweed Biostimulant (1L)', 'specs' => 'Liquid foliar plant stimulant', 'unit' => 'Bottle', 'base_price' => 175.00, 'base_qty' => 600],
                ],
                'materials' => [
                    ['mat' => 'Fresh Harvested Eucheuma Cottonii', 'unit' => 'Kilogram', 'cost' => 22, 'qty' => 8500],
                    ['mat' => 'Technical Grade Potassium Hydroxide', 'unit' => 'Kilogram', 'cost' => 110, 'qty' => 350],
                    ['mat' => 'Heavy Woven Moisture-Proof Sacks', 'unit' => 'Piece', 'cost' => 25, 'qty' => 400],
                ],
                'assets' => [
                    ['name' => 'Solar Hybrid Greenhouse Tunnel Dryer', 'type' => 'Equipment: Solar Dryer', 'lifespan' => 8, 'cost' => 320000.00, 'year' => 2026],
                    ['name' => 'Mechanical Chopper & Pulverizer Mill', 'type' => 'Equipment: Pulverizer', 'lifespan' => 10, 'cost' => 260000.00, 'year' => 2026],
                    ['name' => 'Seaweed Treatment & Soaking Vat Bay', 'type' => 'Building: Soaking Vats', 'lifespan' => 15, 'cost' => 340000.00, 'year' => 2025],
                ],
                'market_name' => 'Regional Carrageenan Exporters and Agri Wholesalers',
            ],
            [
                'email' => 'setup.demo08@dost.gov.ph',
                'name' => 'Arturo Mercado',
                'reference' => 'SETUP-2026-0008',
                'title' => 'Upgrading of Cold Storage and Chilling System for Marine Catches',
                'business_name' => 'Cateel Blue Ocean Fisherfolk Enterprise',
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Fisheries / Cold Chain',
                'enterprise_size' => 'MEDIUM',
                'years' => 10,
                'address' => 'Barangay San Alfonso, Cateel, Davao Oriental',
                'city' => 'Cateel',
                'budget' => 2800000.00,
                'refunded' => 1050000.00,
                'full_release' => '2025-08-09',
                'compliance' => 100.00,
                'start_date' => '2025-08-20',
                'end_date' => '2028-08-20',
                'phone' => '09209018008',
                'bank_branch' => 'Landbank Baganga-Cateel Branch',
                'payments' => [105000.00, 105000.00, 105000.00, 105000.00, 105000.00, 105000.00, 105000.00, 105000.00, 105000.00, 105000.00],
                'products' => [
                    ['name' => 'Frozen Yellowfin Tuna Loins (kg)', 'specs' => 'Blast frozen sashimi grade', 'unit' => 'Kilogram', 'base_price' => 420.00, 'base_qty' => 1100],
                    ['name' => 'IQF Mahi-Mahi Portions (kg)', 'specs' => 'Vacuum sealed portion cuts', 'unit' => 'Kilogram', 'base_price' => 310.00, 'base_qty' => 950],
                    ['name' => 'Sanitary Food Tube Ice (10kg)', 'specs' => 'Purified water block tube ice', 'unit' => 'Bag', 'base_price' => 85.00, 'base_qty' => 2200],
                ],
                'materials' => [
                    ['mat' => 'Fresh Hook & Line Tuna & Pelagic Fish', 'unit' => 'Kilogram', 'cost' => 210, 'qty' => 2400],
                    ['mat' => 'Barrier Thermal Cryogenic Bags', 'unit' => 'Piece', 'cost' => 12, 'qty' => 2000],
                    ['mat' => 'Insulated Cold Storage Styro Boxes', 'unit' => 'Piece', 'cost' => 120, 'qty' => 250],
                ],
                'assets' => [
                    ['name' => '10-Ton Industrial Cold Storage Freezer', 'type' => 'Equipment: Cold Storage', 'lifespan' => 15, 'cost' => 920000.00, 'year' => 2025],
                    ['name' => 'Blast Freezing Chamber (-40C)', 'type' => 'Equipment: Blast Freezer', 'lifespan' => 12, 'cost' => 550000.00, 'year' => 2025],
                    ['name' => 'Cold Chain Docking & Holding Facility', 'type' => 'Building: Cold Storage Hub', 'lifespan' => 25, 'cost' => 750000.00, 'year' => 2024],
                ],
                'market_name' => 'General Santos City & Davao City Seafood Processors',
            ],
            [
                'email' => 'setup.demo09@dost.gov.ph',
                'name' => 'Grace Bautista',
                'reference' => 'SETUP-2026-0009',
                'title' => 'Automation of Honey Clarification, Bottling and Tamper-Proof Packaging',
                'business_name' => 'Caraga Forest Honey & Apiary Products',
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Food Processing',
                'enterprise_size' => 'MICRO',
                'years' => 4,
                'address' => 'Poblacion, Caraga, Davao Oriental',
                'city' => 'Caraga',
                'budget' => 1250000.00,
                'refunded' => 0.0,
                'full_release' => '2026-05-09',
                'compliance' => 100.00,
                'start_date' => '2026-05-18',
                'end_date' => '2029-05-18',
                'phone' => '09220129009',
                'bank_branch' => 'DBP Mati Branch',
                'payments' => [],
                'products' => [
                    ['name' => 'Pure Wild Forest Honey 350ml', 'specs' => 'Raw unfiltered Apis dorsata honey', 'unit' => 'Jar', 'base_price' => 260.00, 'base_qty' => 1100],
                    ['name' => 'Stingless Bee Honey 200ml', 'specs' => 'Medicinal high-antioxidant honey', 'unit' => 'Bottle', 'base_price' => 380.00, 'base_qty' => 600],
                    ['name' => 'Honeycomb Cut Comb 150g', 'specs' => 'Fresh comb in acrylic container', 'unit' => 'Box', 'base_price' => 220.00, 'base_qty' => 550],
                    ['name' => 'Propolis Throat Spray 30ml', 'specs' => 'Purified propolis oral tincture', 'unit' => 'Bottle', 'base_price' => 190.00, 'base_qty' => 450],
                ],
                'materials' => [
                    ['mat' => 'Wild Foraged Honeycomb & Raw Honey', 'unit' => 'Liter', 'cost' => 220, 'qty' => 650],
                    ['mat' => 'Hexagonal Glass Jars & Wooden Dippers', 'unit' => 'Set', 'cost' => 26, 'qty' => 1200],
                    ['mat' => 'Shrink Neck Bands & Foil Labels', 'unit' => 'Piece', 'cost' => 4, 'qty' => 1800],
                ],
                'assets' => [
                    ['name' => 'Dehumidifying Honey Dehydrator', 'type' => 'Equipment: Clarifier', 'lifespan' => 10, 'cost' => 280000.00, 'year' => 2026],
                    ['name' => 'Pneumatic Semi-Auto Liquid Piston Filler', 'type' => 'Equipment: Bottling Line', 'lifespan' => 8, 'cost' => 160000.00, 'year' => 2026],
                    ['name' => 'Honey Clarification & Packaging Clean Bay', 'type' => 'Building: Cleanroom Bay', 'lifespan' => 15, 'cost' => 310000.00, 'year' => 2025],
                ],
                'market_name' => 'Organic Grocers in Davao City & Region XI Pharmacies',
            ],
            [
                'email' => 'setup.demo10@dost.gov.ph',
                'name' => 'Noel Fernandez',
                'reference' => 'SETUP-2026-0010',
                'title' => 'Productivity and Packaging Enhancement for Biodegradable Agri-Food Packaging Hub',
                'business_name' => 'Mati Eco-Packaging and Food Innovation Hub',
                'business_type' => 'SOLE-PROPRIETORSHIP',
                'industry_sector' => 'Packaging & Food Innovation',
                'enterprise_size' => 'SMALL',
                'years' => 5,
                'address' => 'Barangay Dahican, Mati City, Davao Oriental',
                'city' => 'Mati City',
                'budget' => 1850000.00,
                'refunded' => 0.0,
                'full_release' => null,
                'is_awaiting_ledger' => true,
                'compliance' => 100.00,
                'start_date' => '2026-03-01',
                'end_date' => '2029-03-01',
                'phone' => '09171231010',
                'bank_branch' => 'Landbank Mati Provincial Capitol Branch',
                'payments' => [],
                'pending_payment' => null,
                'products' => [
                    ['name' => 'Cassava Starch Meal Trays (50s)', 'specs' => 'Grease and water resistant hot food box', 'unit' => 'Pack', 'base_price' => 340.00, 'base_qty' => 800],
                    ['name' => 'Banana Fiber Gift Bags (20s)', 'specs' => 'Artisanal natural eco-luxury retail bag', 'unit' => 'Pack', 'base_price' => 260.00, 'base_qty' => 650],
                    ['name' => 'Kraft Barrier Stand-Up Pouches (100s)', 'specs' => 'Lined biodegradable food pouch', 'unit' => 'Pack', 'base_price' => 450.00, 'base_qty' => 500],
                ],
                'materials' => [
                    ['mat' => 'Industrial Modified Cassava Starch', 'unit' => 'Sack', 'cost' => 950, 'qty' => 280],
                    ['mat' => 'Extracted Banana Plant Fiber Bundles', 'unit' => 'Bundle', 'cost' => 180, 'qty' => 450],
                    ['mat' => 'Eco-Friendly Plant-Based Adhesive Resins', 'unit' => 'Liter', 'cost' => 120, 'qty' => 300],
                ],
                'assets' => [
                    ['name' => 'Thermoforming Hot-Press Molding Unit', 'type' => 'Equipment: Thermoformer', 'lifespan' => 10, 'cost' => 480000.00, 'year' => 2026],
                    ['name' => 'Hydraulic Die-Cutting & Creasing Press', 'type' => 'Equipment: Die Cutter', 'lifespan' => 12, 'cost' => 310000.00, 'year' => 2026],
                    ['name' => 'Eco-Packaging Production & Forming Facility', 'type' => 'Building: Packaging Bay', 'lifespan' => 20, 'cost' => 450000.00, 'year' => 2025],
                ],
                'market_name' => 'Mati City Tourism Resorts & Davao Food Caterers',
            ],
        ];

        $employeePool = [
            ['name' => 'Arnel Padasas', 'gender' => 'Male', 'age' => 29, 'status' => 'Regular', 'group' => 'None', 'rate' => 460.00],
            ['name' => 'Jonalyn Cañete', 'gender' => 'Female', 'age' => 24, 'status' => 'Regular', 'group' => 'None', 'rate' => 450.00],
            ['name' => 'Reynaldo Dizon', 'gender' => 'Male', 'age' => 62, 'status' => 'Regular', 'group' => 'Senior', 'rate' => 480.00],
            ['name' => 'Maricel Mabuhay', 'gender' => 'Female', 'age' => 33, 'status' => 'Contract-Based', 'group' => 'None', 'rate' => 430.00],
            ['name' => 'Eduardo Matabalan', 'gender' => 'Male', 'age' => 38, 'status' => 'Contract-Based', 'group' => 'None', 'rate' => 425.00],
            ['name' => 'Lourdes Dumandan', 'gender' => 'Female', 'age' => 27, 'status' => 'Project-Based', 'group' => 'None', 'rate' => 440.00],
        ];

        foreach ($setupProjectsData as $data) {
            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'is_active' => true,
                    'program_type' => 'SETUP',
                    'password' => Hash::make('Dprms@123'),
                ],
            );
            $user->role()->sync([$setupRole->id => ['assigned_at' => now()]]);

            $proposal = Proposal::query()->updateOrCreate(
                ['reference_number' => $data['reference']],
                [
                    'submitted_by' => $user->id,
                    'focal_id' => $setupFocal?->id,
                    'assigned_staff_id' => $setupStaff?->id,
                    'assigned_focal_id' => $setupFocal?->id,
                    'program_type' => 'SETUP',
                    'title' => $data['title'],
                    'status' => 'APPROVED',
                    'submitted_at' => !empty($data['full_release']) ? Carbon::parse($data['full_release'])->subMonths(2) : Carbon::parse($data['start_date'])->subMonths(2),
                    'approved_at' => !empty($data['full_release']) ? Carbon::parse($data['full_release'])->subMonth() : Carbon::parse($data['start_date'])->subMonth(),
                ],
            );

            $formSnapshot = [
                'businessName' => $data['business_name'],
                'contactPerson' => $data['name'],
                'contactNumber' => $data['phone'],
                'businessAddress' => $data['address'],
                'industrySector' => $data['industry_sector'],
                'businessType' => $data['business_type'],
                'enterpriseSize' => $data['enterprise_size'],
            ];
            if (!empty($data['full_release'])) {
                $formSnapshot['fullRelease'] = $data['full_release'];
                $formSnapshot['fullReleaseDate'] = $data['full_release'];
            }

            SetupProposal::query()->updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'business_name' => $data['business_name'],
                    'business_type' => $data['business_type'],
                    'industry_sector' => $data['industry_sector'],
                    'enterprise_size' => $data['enterprise_size'],
                    'years_in_operation' => $data['years'],
                    'business_address' => $data['address'],
                    'region' => 'Region XI',
                    'province' => 'Davao Oriental',
                    'city_municipality' => $data['city'],
                    'form_snapshot' => $formSnapshot,
                ],
            );

            $project = Project::query()->updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'created_by' => $user->id,
                    'approved_by' => $director?->id ?? $user->id,
                    'program_type' => 'SETUP',
                    'status' => 'active',
                    'start_date' => $data['start_date'],
                    'expected_end_date' => $data['end_date'],
                    'notes' => 'Active SETUP enterprise under DOST Region XI technology monitoring.',
                    'approved_at' => !empty($data['full_release']) ? Carbon::parse($data['full_release'])->subMonth() : Carbon::parse($data['start_date'])->subMonth(),
                ],
            );

            if (empty($data['is_awaiting_ledger']) && !empty($data['full_release'])) {
                ProjectBudget::query()->updateOrCreate(
                    ['proposal_id' => $proposal->id],
                    [
                        'created_by' => $director?->id ?? $user->id,
                        'program_type' => 'SETUP',
                        'total_amount' => $data['budget'],
                        'budget_ceiling' => $data['budget'],
                        'currency' => 'PHP',
                        'fiscal_year' => 2026,
                        'full_release_date' => $data['full_release'],
                        'amortization_start_date' => Carbon::parse($data['full_release'])->addMonths(2)->toDateString(),
                        'repayment_term_months' => 36,
                        'status' => 'ACTIVE',
                        'notes' => 'SETUP Innovation-Enabling Fund release approved.',
                    ],
                );
            }

            $eqIdx = 0;
            foreach ($data['assets'] as $asset) {
                if (!str_starts_with($asset['type'], 'Equipment')) {
                    continue;
                }
                $eqIdx++;
                $categoryName = 'Production Equipment';
                if (stripos($asset['type'], 'Processing') !== false || stripos($asset['name'], 'Dryer') !== false || stripos($asset['name'], 'Press') !== false || stripos($asset['name'], 'Conche') !== false || stripos($asset['name'], 'Mill') !== false || stripos($asset['name'], 'Freezer') !== false || stripos($asset['name'], 'Clarifier') !== false || stripos($asset['name'], 'Bottling') !== false || stripos($asset['name'], 'Die Cutter') !== false || stripos($asset['name'], 'Thermoformer') !== false) {
                    $categoryName = 'Processing Equipment';
                }
                $categoryId = $equipmentCategories[$categoryName] ?? 1;

                $equipment = EquipmentRegistry::query()->updateOrCreate(
                    [
                        'proposal_id' => $proposal->id,
                        'equipment_name' => $asset['name'],
                    ],
                    [
                        'category_id' => $categoryId,
                        'added_by' => $setupStaff?->id ?? $user->id,
                        'program_type' => 'SETUP',
                        'brand' => 'AgriTech / DOST-MIRDC Fabricated',
                        'model' => 'EQ-' . sprintf('%03d', $eqIdx),
                        'serial_number' => 'SN-' . $data['reference'] . '-' . sprintf('%02d', $eqIdx),
                        'property_number' => 'PROP-' . $data['reference'] . '-' . sprintf('%02d', $eqIdx),
                        'unit' => 'unit',
                        'acquisition_cost' => $asset['cost'],
                        'acquisition_date' => $data['full_release'] ?? Carbon::parse($data['start_date'])->subDays(15)->toDateString(),
                        'installed_at' => $data['start_date'],
                        'supplier_name' => 'DOST Accredited Technology Fabricator',
                        'location' => $data['address'],
                        'specifications' => 'Industrial grade machinery deployed under DOST SETUP intervention.',
                        'status' => 'ISSUED',
                        'current_condition' => 'GOOD',
                        'approved_by' => $director?->id ?? $user->id,
                        'approved_at' => $proposal->approved_at ?? Carbon::now(),
                        'last_checked_at' => Carbon::now()->subDays(rand(2, 18)),
                        'notes' => 'Operational and integrated into beneficiary production workflow.',
                    ]
                );

                $qrCode = EquipmentQrCode::query()->updateOrCreate(
                    ['equipment_id' => $equipment->id],
                    [
                        'qr_code_reference' => 'QR-' . $data['reference'] . '-' . sprintf('%02d', $eqIdx),
                        'qr_code_data' => 'DPRMS:SETUP:EQUIPMENT:' . $equipment->id . ':' . $data['reference'],
                        'qr_code_image_path' => 'equipment-qr/' . $equipment->id . '.svg',
                        'is_active' => true,
                        'generated_by' => $setupStaff?->id ?? $user->id,
                    ]
                );

                EquipmentConditionLog::query()->firstOrCreate(
                    [
                        'equipment_id' => $equipment->id,
                        'qr_code_id' => $qrCode->id,
                    ],
                    [
                        'uploaded_by' => $setupStaff?->id ?? $user->id,
                        'previous_condition' => 'GOOD',
                        'new_condition' => 'GOOD',
                        'update_reason' => 'SITE_VISIT',
                        'remarks' => 'Inspected on-site; equipment is fully operational and meeting safety protocols.',
                        'recommendations' => 'Maintain periodic lubrication and monthly maintenance log.',
                        'scanned_at' => Carbon::now()->subDays(rand(5, 20)),
                    ]
                );
            }

            $monitoring = ProjectMonitoringRecord::query()->updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'assigned_monitor' => $setupStaff?->id ?? $setupFocal?->id,
                    'program_type' => 'SETUP',
                    'implementation_status' => 'IN_PROGRESS',
                    'start_date' => $data['start_date'],
                    'expected_end_date' => $data['end_date'],
                    'overall_compliance' => $data['compliance'],
                    'last_monitored_at' => Carbon::now()->subDays(rand(3, 20)),
                    'monitoring_notes' => 'Quarterly technology intervention and productivity targets verified.',
                ],
            );

            $startDate = Carbon::parse($data['start_date']);
            $startYear = $startDate->year;
            $startQuarter = $startDate->quarter;
            $currentYear = 2026;
            $currentQuarter = 3;

            $quarterPeriods = [];
            for ($y = $startYear; $y <= $currentYear; $y++) {
                $minQ = ($y === $startYear) ? $startQuarter : 1;
                $maxQ = ($y === $currentYear) ? $currentQuarter : 4;
                for ($q = $minQ; $q <= $maxQ; $q++) {
                    $quarterPeriods[] = ['year' => $y, 'quarter' => $q];
                }
            }

            foreach ($quarterPeriods as $qp) {
                $q = $qp['quarter'];
                $y = $qp['year'];

                $quarterSubmissionDates = [
                    1 => Carbon::create($y, 4, rand(8, 18), 10, 30),
                    2 => Carbon::create($y, 7, rand(8, 18), 14, 15),
                    3 => Carbon::create($y, 9, rand(1, 8), 11, 0),
                    4 => Carbon::create($y + 1, 1, rand(8, 18), 9, 45),
                ];
                $submittedAt = $quarterSubmissionDates[$q] ?? Carbon::now();

                $quarterMetric = QuarterlyMetrics::query()->updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'quarter' => $q,
                        'year' => $y,
                    ],
                    [
                        'submitted_by' => $user->id,
                        'submitted_at' => $submittedAt,
                    ]
                );

                $quarterMetric->products()->delete();
                $quarterMetric->employees()->delete();
                $quarterMetric->product_cost()->delete();
                $quarterMetric->asset()->delete();
                $quarterMetric->asset_capital()->delete();
                $quarterMetric->intervention()->delete();
                $quarterMetric->linkage()->delete();
                $quarterMetric->market()->delete();
                $quarterMetric->narrative()->delete();
                $quarterMetric->production_material()->delete();

                $quarterFactor = 0.85 + (rand(0, 45) / 100);

                foreach ($data['products'] as $prod) {
                    $qty = (int) round($prod['base_qty'] * $quarterFactor * (rand(92, 115) / 100));
                    Product::query()->create([
                        'quarter_id' => $quarterMetric->id,
                        'product_name' => $prod['name'],
                        'specifications' => $prod['specs'],
                        'unit' => $prod['unit'],
                        'price' => $prod['base_price'],
                        'quantity' => $qty,
                    ]);
                }

                $assignedEmployees = array_slice($employeePool, 0, rand(4, 6));
                foreach ($assignedEmployees as $emp) {
                    Employee::query()->create([
                        'quarter_id' => $quarterMetric->id,
                        'employee_name' => $emp['name'],
                        'age' => $emp['age'],
                        'status' => $emp['status'],
                        'gender' => $emp['gender'],
                        'sectoral_group' => $emp['group'],
                        'days_of_attendance' => rand(58, 66),
                        'salary_rate' => $emp['rate'] + rand(-15, 20),
                    ]);
                }

                $costs = [
                    ['particulars' => 'Electricity & Facility Power', 'type' => 'OPERATION', 'base' => 22000],
                    ['particulars' => 'Fuel & Transport Logistics', 'type' => 'OPERATION', 'base' => 12000],
                    ['particulars' => 'Machine Maintenance & Consumables', 'type' => 'OPERATION', 'base' => 7500],
                    ['particulars' => 'Plant Direct Production Labor', 'type' => 'LABOR', 'base' => 42000],
                    ['particulars' => 'Technical & QA Supervision', 'type' => 'LABOR', 'base' => 24000],
                    ['particulars' => 'Sanitation & Safety Consumables', 'type' => 'MISCELLANEOUS', 'base' => 4500],
                    ['particulars' => 'Communications & Office Overhead', 'type' => 'MISCELLANEOUS', 'base' => 3200],
                ];

                foreach ($costs as $costItem) {
                    $m1 = round($costItem['base'] * $quarterFactor * (rand(90, 112) / 100), 2);
                    $m2 = round($costItem['base'] * $quarterFactor * (rand(90, 112) / 100), 2);
                    $m3 = round($costItem['base'] * $quarterFactor * (rand(90, 112) / 100), 2);
                    ProductCost::query()->create([
                        'quarter_id' => $quarterMetric->id,
                        'particulars' => $costItem['particulars'],
                        'type' => $costItem['type'],
                        'month_1' => $m1,
                        'month_2' => $m2,
                        'month_3' => $m3,
                    ]);
                }

                foreach ($data['materials'] as $mat) {
                    $qty = (int) round($mat['qty'] * $quarterFactor * (rand(90, 115) / 100));
                    ProductionMaterial::query()->create([
                        'quarter_id' => $quarterMetric->id,
                        'materials' => $mat['mat'],
                        'unit' => $mat['unit'],
                        'quantity' => $qty,
                        'cost' => (int) $mat['cost'],
                    ]);
                }

                foreach ($data['assets'] as $asset) {
                    Asset::query()->create([
                        'quarter_id' => $quarterMetric->id,
                        'asset_name' => $asset['name'],
                        'type' => $asset['type'],
                        'lifespan' => $asset['lifespan'],
                        'year_acquired' => $asset['year'],
                        'cost' => $asset['cost'],
                    ]);
                }

                AssetCapital::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'name' => 'Revolving Operating Capital (Cash in Bank)',
                    'amount' => round(rand(220000, 450000) + (rand(0, 99) / 100), 2),
                ]);

                Intervention::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'name' => 'Good Manufacturing Practices (GMP) & Food Safety Standards',
                    'type' => 'CONSULTANCY',
                    'availed' => '1',
                    'intervention' => 'Technology verification and plant layout optimization under SETUP',
                    'date' => $submittedAt->copy()->subDays(rand(15, 40))->toDateString(),
                ]);

                Intervention::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'name' => 'Preventive Equipment Maintenance and Calibration',
                    'type' => 'TRAINING',
                    'availed' => '1',
                    'intervention' => 'Hands-on training for plant technicians and machine operators',
                    'date' => $submittedAt->copy()->subDays(rand(5, 20))->toDateString(),
                ]);

                Linkage::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'name' => 'Provincial Retailers & Supermarket Distributors',
                    'type' => 'forward',
                    'male_quantity' => rand(5, 14),
                    'female_quantity' => rand(6, 16),
                ]);

                Linkage::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'name' => 'Local Smallholder Farmer & Fisherfolk Suppliers',
                    'type' => 'backward',
                    'male_quantity' => rand(12, 28),
                    'female_quantity' => rand(10, 22),
                ]);

                Market::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'market_name' => $data['market_name'],
                    'address' => $data['address'],
                    'condition' => 'old',
                    'effective_date' => $startDate->toDateString(),
                    'contact_person' => $data['name'],
                    'service' => 'Commercial Delivery & Wholesale Supply',
                    'volume' => number_format((int) round(2500 * $quarterFactor)) . ' units',
                ]);

                Narrative::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'particular' => 'Seasonal raw material price adjustment and periodic freight delay.',
                    'type' => 'PROBLEMS',
                    'intervention' => 'Partnered with regional supplier cooperatives to secure steady monthly deliveries.',
                ]);

                Narrative::query()->create([
                    'quarter_id' => $quarterMetric->id,
                    'particular' => 'Expansion of production capacity and secondary commercial distribution line.',
                    'type' => 'PLANS',
                    'intervention' => 'Consulting with DOST PSTO Davao Oriental for packaging design and barcoding support.',
                ]);

                $calculatedGrossSales = $quarterMetric->products()->sum('gross_sales');
                $calculatedVolume = (int) $quarterMetric->products()->sum('quantity');
                $calculatedEmployees = (int) $quarterMetric->employees()->count();
                $calculatedTotalCost = $quarterMetric->product_cost()->sum('total');

                $quarterMetric->update([
                    'gross_sales' => $calculatedGrossSales,
                    'production_volume' => $calculatedVolume,
                    'employee_count' => $calculatedEmployees,
                    'total_cost' => $calculatedTotalCost,
                ]);

                SetupProgressReport::query()->updateOrCreate(
                    [
                        'monitoring_record_id' => $monitoring->id,
                        'reporting_year' => $y,
                        'reporting_quarter' => $q,
                    ],
                    [
                        'submitted_by' => $user->id,
                        'report_type' => 'QUARTERLY',
                        'reporting_period' => "Q{$q} {$y}",
                        'income_generated' => $calculatedGrossSales,
                        'employment_generated' => $calculatedEmployees,
                        'production_output' => "Quarterly production output reached " . number_format($calculatedVolume) . " units post-upgrading.",
                        'status' => 'ACCEPTED',
                        'due_date' => $submittedAt->copy()->addDays(5)->toDateString(),
                        'submitted_at' => $submittedAt,
                        'reviewed_by' => $setupStaff?->id,
                        'reviewed_at' => $submittedAt->copy()->addDays(2),
                    ],
                );
            }

            $oldLedgers = ProjectLedger::query()
                ->where('project_id', $project->id)
                ->where('program_type', 'SETUP')
                ->where('ledger_type', 'repayment')
                ->get();
            if ($oldLedgers->isNotEmpty()) {
                RepaymentTransaction::query()->whereIn('project_ledger_id', $oldLedgers->pluck('id'))->delete();
                ProjectLedger::query()->whereIn('id', $oldLedgers->pluck('id'))->delete();
            }

            if (empty($data['is_awaiting_ledger']) && !empty($data['full_release'])) {
                $amortizationStartDate = Carbon::parse($data['full_release'])->addMonths(2);
                $monthlyBase = round($data['budget'] / 36, 2);
                $payments = $data['payments'] ?? [];
                $pendingPayment = $data['pending_payment'] ?? null;

                for ($i = 0; $i < 36; $i++) {
                    $dueDate = $amortizationStartDate->copy()->addMonths($i);
                    $periodLabel = $dueDate->format('F Y');
                    $installmentAmount = ($i === 35)
                        ? round($data['budget'] - ($monthlyBase * 35), 2)
                        : $monthlyBase;

                    $hasPayment = isset($payments[$i]);
                    $paidAmount = $hasPayment ? $installmentAmount : 0.0;

                    $status = 'pending';
                    if ($paidAmount >= $installmentAmount) {
                        $status = 'paid';
                    } elseif ($dueDate->isBefore(today()) && ! $hasPayment) {
                        $status = 'overdue';
                    }

                    $ledger = ProjectLedger::query()->create([
                        'project_id' => $project->id,
                        'program_type' => 'SETUP',
                        'ledger_type' => 'repayment',
                        'period_label' => $periodLabel,
                        'amount' => $installmentAmount,
                        'due_date' => $dueDate->toDateString(),
                        'status' => $status,
                        'notes' => 'SETUP 36-month monthly repayment schedule.',
                    ]);

                    if ($hasPayment) {
                        $paymentDate = $dueDate->copy()->subDays(rand(1, 4));
                        RepaymentTransaction::query()->create([
                            'project_ledger_id' => $ledger->id,
                            'uploaded_by' => $user->id,
                            'verified_by' => $setupStaff?->id ?? $user->id,
                            'amount_paid' => $paidAmount,
                            'payment_due' => $dueDate->toDateString(),
                            'payment_date' => $paymentDate->toDateString(),
                            'bank_branch' => $data['bank_branch'] ?? 'Landbank Mati Branch',
                            'check_number' => 'CHK-' . rand(100000, 999999),
                            'check_date' => $paymentDate->toDateString(),
                            'or_number' => 'OR-' . $dueDate->format('Y') . '-' . sprintf('%04d', rand(1000, 9999)),
                            'status' => 'verified',
                            'verified_at' => $paymentDate->copy()->addDays(rand(1, 3)),
                            'remarks' => 'Verified and validated by DOST Accounting and PSTO Focal.',
                        ]);
                    } elseif (! empty($data['pending_payment']) && $i === count($payments)) {
                        $submitDate = Carbon::now()->subDays(rand(1, 3));
                        RepaymentTransaction::query()->create([
                            'project_ledger_id' => $ledger->id,
                            'uploaded_by' => $user->id,
                            'verified_by' => null,
                            'amount_paid' => $installmentAmount,
                            'payment_due' => $dueDate->toDateString(),
                            'payment_date' => $submitDate->toDateString(),
                            'bank_branch' => $data['bank_branch'] ?? 'Landbank Mati Branch',
                            'check_number' => 'CHK-' . rand(100000, 999999),
                            'check_date' => $submitDate->toDateString(),
                            'or_number' => 'OR-PENDING-' . sprintf('%04d', rand(1000, 9999)),
                            'status' => 'pending',
                            'verified_at' => null,
                            'remarks' => 'Submitted by cooperator via DPRMS portal for verification.',
                        ]);
                    }
                }
            }
        }

        $giaProjectsData = [
            [
                'email' => 'gia.demo01@dost.gov.ph',
                'name' => 'Dr. Arlene Dalisay',
                'reference' => 'GIA-2026-0001',
                'title' => 'Deployment of Smart Water Quality Monitoring and Solar Desalination for Coastal Communities',
                'agency' => 'Davao Oriental State University',
                'address' => 'Guang-guang, Dahican, Mati City, Davao Oriental',
                'category' => 'Higher Education Institution',
                'research_type' => 'Community-Based Science and Technology Project',
                'research_cat' => 'Disaster Risk Reduction and Management',
                'budget' => 4500000.00,
                'start_date' => '2025-12-09',
                'end_date' => '2027-12-09',
                'milestone_progress' => 75.0,
                'deliverables' => [
                    ['title' => 'Baseline coastal water salinity and pathogen profiling', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Installation of 5 IoT solar desalination units in Barangay Dahican', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Community water association technical and maintenance training', 'status' => 'IN_PROGRESS', 'pct' => 75],
                    ['title' => 'Final deployment evaluation and municipal turn-over protocol', 'status' => 'PENDING', 'pct' => 25],
                ],
            ],
            [
                'email' => 'gia.demo02@dost.gov.ph',
                'name' => 'Prof. Benjamin Aquino',
                'reference' => 'GIA-2026-0002',
                'title' => 'Establishment of Community-Based Mangrove Crab Hatchery and Nursery Technology',
                'agency' => 'Provincial Government of Davao Oriental',
                'address' => 'Capitol Complex, Mati City, Davao Oriental',
                'category' => 'Barangay LGU',
                'research_type' => 'Technology Transfer',
                'research_cat' => 'Agriculture and Fisheries',
                'budget' => 3800000.00,
                'start_date' => '2025-11-15',
                'end_date' => '2027-11-15',
                'milestone_progress' => 60.0,
                'deliverables' => [
                    ['title' => 'Hatchery site engineering and water recirculation system setup', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Broodstock procurement and initial larval rearing trials', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Crab nursery expansion and juvenile distribution to 4 fisherfolk coops', 'status' => 'IN_PROGRESS', 'pct' => 40],
                    ['title' => 'Economic viability and crablet survival rate terminal report', 'status' => 'PENDING', 'pct' => 0],
                ],
            ],
            [
                'email' => 'gia.demo03@dost.gov.ph',
                'name' => 'Engr. Christine Soriano',
                'reference' => 'GIA-2026-0003',
                'title' => 'Solar-Powered Post-Harvest Seaweed Drying System with IoT Ambient Moisture Sensor',
                'agency' => 'Municipal Government of Tarragona',
                'address' => 'Municipal Hall, Tarragona, Davao Oriental',
                'category' => 'Barangay LGU',
                'research_type' => 'Technology Transfer',
                'research_cat' => 'Agriculture and Fisheries',
                'budget' => 2950000.00,
                'start_date' => '2026-01-10',
                'end_date' => '2028-01-10',
                'milestone_progress' => 85.0,
                'deliverables' => [
                    ['title' => 'Fabrication of hybrid greenhouse solar dryer modules', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Integration of IoT moisture sensors and automated ventilation louvers', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Comparative pilot drying validation with local Kappaphycus seaweed', 'status' => 'IN_PROGRESS', 'pct' => 55],
                ],
            ],
            [
                'email' => 'gia.demo04@dost.gov.ph',
                'name' => 'Dr. Dennis Macaraeg',
                'reference' => 'GIA-2026-0004',
                'title' => 'Disaster Risk Reduction Early Warning and Automated Rain Gauge Telemetry Network',
                'agency' => 'Provincial Disaster Risk Reduction Management Office',
                'address' => 'Capitol Hill, Mati City, Davao Oriental',
                'category' => 'Barangay LGU',
                'research_type' => 'Community-Based Science and Technology Project',
                'research_cat' => 'Disaster Risk Reduction and Management',
                'budget' => 5200000.00,
                'start_date' => '2025-08-01',
                'end_date' => '2027-08-01',
                'milestone_progress' => 80.0,
                'deliverables' => [
                    ['title' => 'Geohazard risk mapping for 10 river basin catchments', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Deployment of 12 solar telemetry automated rain gauges (ARG)', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Central PDRRMO real-time telemetry dashboard and SMS alert bridge', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Community evacuation simulation and standard operating protocol handover', 'status' => 'IN_PROGRESS', 'pct' => 20],
                ],
            ],
            [
                'email' => 'gia.demo05@dost.gov.ph',
                'name' => 'Dr. Eleanor Ramos',
                'reference' => 'GIA-2026-0005',
                'title' => 'Commercialization of Indigenous Rice and Corn Bio-Fertilizer Formulation',
                'agency' => 'DOrSU College of Agriculture & Forestry',
                'address' => 'Banaybanay Campus, Davao Oriental',
                'category' => 'Higher Education Institution',
                'research_type' => 'Research and Development',
                'research_cat' => 'Agriculture and Fisheries',
                'budget' => 3600000.00,
                'start_date' => '2025-10-15',
                'end_date' => '2027-10-15',
                'milestone_progress' => 70.0,
                'deliverables' => [
                    ['title' => 'Isolation and mass culturing of local mycorrhizal fungi strains', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Bio-fertilizer carrier formulation and pilot composting field trials', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'On-farm comparative yield trials across 50 hectares in Banaybanay', 'status' => 'IN_PROGRESS', 'pct' => 10],
                ],
            ],
            [
                'email' => 'gia.demo06@dost.gov.ph',
                'name' => 'Prof. Fernando Morales',
                'reference' => 'GIA-2026-0006',
                'title' => 'Community Nutrition Intervention through Complementary Food Production Facility',
                'agency' => 'Municipal Government of Lupon',
                'address' => 'Municipal Health Center, Lupon, Davao Oriental',
                'category' => 'Barangay LGU',
                'research_type' => 'Community-Based Science and Technology Project',
                'research_cat' => 'Health',
                'budget' => 2750000.00,
                'start_date' => '2026-02-01',
                'end_date' => '2028-02-01',
                'milestone_progress' => 55.0,
                'deliverables' => [
                    ['title' => 'DOST-FNRI food processing equipment procurement and installation', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Trial formulation of Rice-Mongo curls and baby food blend packets', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'FDA-LTO inspection readiness and hygiene standard operating procedure', 'status' => 'IN_PROGRESS', 'pct' => 20],
                    ['title' => 'Barangay feeding program pilot targeting 500 undernourished infants', 'status' => 'PENDING', 'pct' => 0],
                ],
            ],
            [
                'email' => 'gia.demo07@dost.gov.ph',
                'name' => 'Engr. Gloria Panganiban',
                'reference' => 'GIA-2026-0007',
                'title' => 'Establishment of S&T Innovation and Bamboo Value-Addition Training Hub',
                'agency' => 'Cateel Bamboo Producers Federation',
                'address' => 'Livelihood Center, Cateel, Davao Oriental',
                'category' => 'Private Sector',
                'research_type' => 'Capability Building and Training',
                'research_cat' => 'Community Development',
                'budget' => 3100000.00,
                'start_date' => '2025-09-01',
                'end_date' => '2027-09-01',
                'milestone_progress' => 75.0,
                'deliverables' => [
                    ['title' => 'Bamboo treatment and preservative pressure soaking vat fabrication', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Engineered bamboo slitting and laminating machine installation', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Hands-on skills development training for 40 local artisans', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Product prototype exhibition and market linkage agreements', 'status' => 'PENDING', 'pct' => 0],
                ],
            ],
            [
                'email' => 'gia.demo08@dost.gov.ph',
                'name' => 'Dr. Hector Valenzuela',
                'reference' => 'GIA-2026-0008',
                'title' => 'Heritage Cacao Gene Bank and Disease-Resistant Clonal Propagation Nursery',
                'agency' => 'Davao Oriental Cacao Industry Development Council',
                'address' => 'Batobato, San Isidro, Davao Oriental',
                'category' => 'Private Sector',
                'research_type' => 'Research and Development',
                'research_cat' => 'Agriculture and Fisheries',
                'budget' => 4100000.00,
                'start_date' => '2025-11-01',
                'end_date' => '2027-11-01',
                'milestone_progress' => 65.0,
                'deliverables' => [
                    ['title' => 'DNA-fingerprinting of 25 century-old heirloom Criollo cacao trees', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Clonal nursery construction with automated misting and shade control', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Grafting of 50,000 disease-resistant scions for smallholder farmers', 'status' => 'IN_PROGRESS', 'pct' => 60],
                    ['title' => 'Pest-resilience field monitoring and cacao flavor quality profiling', 'status' => 'PENDING', 'pct' => 0],
                ],
            ],
            [
                'email' => 'gia.demo09@dost.gov.ph',
                'name' => 'Prof. Imelda Castro',
                'reference' => 'GIA-2026-0009',
                'title' => 'Digital S&T Resource Center and Interactive Science Learning Commons for Remote Schools',
                'agency' => 'DepEd Division of Davao Oriental',
                'address' => 'Poblacion, Governor Generoso, Davao Oriental',
                'category' => 'Barangay LGU',
                'research_type' => 'Capability Building and Training',
                'research_cat' => 'Education',
                'budget' => 2400000.00,
                'start_date' => '2026-01-05',
                'end_date' => '2027-01-05',
                'milestone_progress' => 85.0,
                'deliverables' => [
                    ['title' => 'Deployment of 15 DOST STARBOOKS digital offline kiosks', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Teacher capability training on interactive STEM and science pedagogy', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Quarterly usage analytics and student science quiz evaluation', 'status' => 'IN_PROGRESS', 'pct' => 55],
                ],
            ],
            [
                'email' => 'gia.demo10@dost.gov.ph',
                'name' => 'Engr. Jaime Salcedo',
                'reference' => 'GIA-2026-0010',
                'title' => 'Off-Grid Solar Cold Chain and Micro-Refrigeration for Marginalized Fisherfolk',
                'agency' => 'Boston Fisherfolk Co-operative Association',
                'address' => 'Barangay Poblacion, Boston, Davao Oriental',
                'category' => 'Private Sector',
                'research_type' => 'Community-Based Science and Technology Project',
                'research_cat' => 'Agriculture and Fisheries',
                'budget' => 3450000.00,
                'start_date' => '2025-10-01',
                'end_date' => '2027-10-01',
                'milestone_progress' => 70.0,
                'deliverables' => [
                    ['title' => 'Engineering site evaluation and solar array foundation construction', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Installation of 5-ton daily capacity solar ice flake maker', 'status' => 'COMPLETED', 'pct' => 100],
                    ['title' => 'Cooperative tariff setting and energy storage battery maintenance training', 'status' => 'IN_PROGRESS', 'pct' => 80],
                    ['title' => 'Post-harvest spoilage reduction and revenue increase final evaluation', 'status' => 'PENDING', 'pct' => 0],
                ],
            ],
        ];

        foreach ($giaProjectsData as $data) {
            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'is_active' => true,
                    'program_type' => 'GIA',
                    'password' => Hash::make('Dprms@123'),
                ],
            );
            $user->role()->sync([$giaRole->id => ['assigned_at' => now()]]);

            $proposal = Proposal::query()->updateOrCreate(
                ['reference_number' => $data['reference']],
                [
                    'submitted_by' => $user->id,
                    'focal_id' => $giaFocal?->id,
                    'assigned_staff_id' => $giaStaff?->id,
                    'assigned_focal_id' => $giaFocal?->id,
                    'program_type' => 'GIA',
                    'title' => $data['title'],
                    'status' => 'APPROVED',
                    'submitted_at' => Carbon::parse($data['start_date'])->subMonths(3),
                    'approved_at' => Carbon::parse($data['start_date'])->subMonth(),
                ],
            );

            GiaProposal::query()->updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'proponent_category' => $data['category'],
                    'organization_name' => $data['agency'],
                    'office_address' => $data['address'],
                    'position' => 'Project Leader',
                    'contact_number' => '0917' . rand(1000000, 9999999),
                    'research_type' => $data['research_type'],
                    'research_category' => $data['research_cat'],
                    'form_snapshot' => [
                        'projectLeader' => $data['name'],
                        'organization_name' => $data['agency'],
                        'agency' => $data['agency'],
                        'office_address' => $data['address'],
                        'siteOfImplementation' => $data['address'],
                        'generalObjective' => 'S&T Community Innovation and Technology Deployment.',
                    ],
                ],
            );

            $project = Project::query()->updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'created_by' => $user->id,
                    'approved_by' => $director?->id ?? $user->id,
                    'program_type' => 'GIA',
                    'status' => 'active',
                    'start_date' => $data['start_date'],
                    'expected_end_date' => $data['end_date'],
                    'notes' => 'DOST Grants-In-Aid high impact regional S&T project.',
                    'approved_at' => Carbon::parse($data['start_date'])->subMonth(),
                ],
            );

            ProjectBudget::query()->updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'created_by' => $director?->id ?? $user->id,
                    'program_type' => 'GIA',
                    'total_amount' => $data['budget'],
                    'budget_ceiling' => $data['budget'],
                    'currency' => 'PHP',
                    'fiscal_year' => 2026,
                    'full_release_date' => $data['start_date'],
                    'status' => 'ACTIVE',
                    'notes' => 'DOST Grants-In-Aid (GIA) Approved Project Funding',
                ],
            );

            $giaEquipmentList = [
                'GIA-2026-0001' => ['name' => 'IoT Smart Salinity & Water Desalination Unit', 'cost' => 680000.00, 'cat' => 'Testing and Laboratory Equipment'],
                'GIA-2026-0002' => ['name' => 'Recirculating Water Aquaculture Filtration System', 'cost' => 540000.00, 'cat' => 'Processing Equipment'],
                'GIA-2026-0003' => ['name' => 'Hybrid Greenhouse Solar Dryer & Ambient IoT Array', 'cost' => 420000.00, 'cat' => 'Processing Equipment'],
                'GIA-2026-0004' => ['name' => 'Telemetry Rain Gauge & Automated Weather Sensor Station', 'cost' => 380000.00, 'cat' => 'ICT Equipment'],
                'GIA-2026-0005' => ['name' => 'Steam-Distillation Essential Oil Extractor', 'cost' => 490000.00, 'cat' => 'Processing Equipment'],
                'GIA-2026-0006' => ['name' => 'Solar-Assisted Cold Storage & Marine Blast Chiller', 'cost' => 720000.00, 'cat' => 'Production Equipment'],
                'GIA-2026-0007' => ['name' => 'Vacuum Cacao Dehydrator & Convection Dryer', 'cost' => 360000.00, 'cat' => 'Processing Equipment'],
                'GIA-2026-0008' => ['name' => 'IoT Coastal Pathogen & Water Spectrophotometer', 'cost' => 450000.00, 'cat' => 'Testing and Laboratory Equipment'],
                'GIA-2026-0009' => ['name' => 'Fermentation Bioreactor & Microbial Culture Tank', 'cost' => 510000.00, 'cat' => 'Production Equipment'],
                'GIA-2026-0010' => ['name' => 'Tele-Health Clinical Diagnostic Terminal & Hub', 'cost' => 390000.00, 'cat' => 'ICT Equipment'],
            ];

            if (isset($giaEquipmentList[$data['reference']])) {
                $giaEq = $giaEquipmentList[$data['reference']];
                $categoryId = $equipmentCategories[$giaEq['cat']] ?? 1;

                $equipment = EquipmentRegistry::query()->updateOrCreate(
                    [
                        'proposal_id' => $proposal->id,
                        'equipment_name' => $giaEq['name'],
                    ],
                    [
                        'category_id' => $categoryId,
                        'added_by' => $giaStaff?->id ?? $user->id,
                        'program_type' => 'GIA',
                        'brand' => 'DOST Research Consortium / Fabricated',
                        'model' => 'GIA-EQ-01',
                        'serial_number' => 'SN-' . $data['reference'] . '-01',
                        'property_number' => 'PROP-' . $data['reference'] . '-01',
                        'unit' => 'unit',
                        'acquisition_cost' => $giaEq['cost'],
                        'acquisition_date' => $data['start_date'],
                        'installed_at' => Carbon::parse($data['start_date'])->addDays(15)->toDateString(),
                        'supplier_name' => 'DOST Certified Research Fabricator',
                        'location' => $data['address'],
                        'specifications' => 'S&T equipment deployed under DOST GIA project grant.',
                        'status' => 'ISSUED',
                        'current_condition' => 'GOOD',
                        'approved_by' => $director?->id ?? $user->id,
                        'approved_at' => $proposal->approved_at ?? Carbon::now(),
                        'last_checked_at' => Carbon::now()->subDays(rand(2, 14)),
                        'notes' => 'Deployed for project implementation and community verification.',
                    ]
                );

                $qrCode = EquipmentQrCode::query()->updateOrCreate(
                    ['equipment_id' => $equipment->id],
                    [
                        'qr_code_reference' => 'QR-' . $data['reference'] . '-01',
                        'qr_code_data' => 'DPRMS:GIA:EQUIPMENT:' . $equipment->id . ':' . $data['reference'],
                        'qr_code_image_path' => 'equipment-qr/' . $equipment->id . '.svg',
                        'is_active' => true,
                        'generated_by' => $giaStaff?->id ?? $user->id,
                    ]
                );

                EquipmentConditionLog::query()->firstOrCreate(
                    [
                        'equipment_id' => $equipment->id,
                        'qr_code_id' => $qrCode->id,
                    ],
                    [
                        'uploaded_by' => $giaStaff?->id ?? $user->id,
                        'previous_condition' => 'GOOD',
                        'new_condition' => 'GOOD',
                        'update_reason' => 'SITE_VISIT',
                        'remarks' => 'Inspected on site; verified operational under research parameters.',
                        'recommendations' => 'Periodic calibration and maintenance logging.',
                        'scanned_at' => Carbon::now()->subDays(rand(5, 20)),
                    ]
                );
            }

            $monitoring = ProjectMonitoringRecord::query()->updateOrCreate(
                ['proposal_id' => $proposal->id],
                [
                    'assigned_monitor' => $giaFocal?->id ?? $giaStaff?->id,
                    'program_type' => 'GIA',
                    'implementation_status' => 'IN_PROGRESS',
                    'start_date' => $data['start_date'],
                    'expected_end_date' => $data['end_date'],
                    'overall_compliance' => 100.00,
                    'last_monitored_at' => Carbon::now()->subDays(rand(2, 14)),
                    'monitoring_notes' => 'Milestone progress validated by DOST GIA Monitoring Team.',
                ],
            );

            foreach ($data['deliverables'] as $idx => $deliv) {
                GiaDeliverableTracking::query()->updateOrCreate(
                    [
                        'monitoring_record_id' => $monitoring->id,
                        'deliverable_number' => $idx + 1,
                    ],
                    [
                        'deliverable_title' => $deliv['title'],
                        'deliverable_desription' => $deliv['title'] . ' under approved work and financial plan.',
                        'expected_completion' => Carbon::parse($data['start_date'])->addMonths(($idx + 1) * 6)->toDateString(),
                        'actual_completion' => $deliv['status'] === 'COMPLETED' ? Carbon::parse($data['start_date'])->addMonths(($idx + 1) * 5)->toDateString() : null,
                        'status' => $deliv['status'],
                        'completion_percentage' => $deliv['pct'],
                        'updated_by' => $giaStaff?->id,
                    ],
                );
            }

            $startDate = Carbon::parse($data['start_date']);
            if ($startDate->year === 2025) {
                GiaProgressReport::query()->updateOrCreate(
                    [
                        'monitoring_record_id' => $monitoring->id,
                        'reporting_year' => 2025,
                        'reporting_period' => 'Semestral Report 2 2025',
                    ],
                    [
                        'submitted_by' => $user->id,
                        'report_type' => 'PROGRESS',
                        'research_progress' => 'Initial setup and community baseline orientation concluded on schedule.',
                        'objectivves_achieved' => 'Site validation and equipment procurement specifications finalized.',
                        'budget_utilization' => round($data['budget'] * 0.28, 2),
                        'status' => 'ACCEPTED',
                        'due_date' => Carbon::parse('2026-01-31'),
                        'submitted_at' => Carbon::parse('2026-01-20'),
                        'reviewed_by' => $giaStaff?->id,
                        'reviewed_at' => Carbon::parse('2026-01-25'),
                    ],
                );
            }

            GiaProgressReport::query()->updateOrCreate(
                [
                    'monitoring_record_id' => $monitoring->id,
                    'reporting_year' => 2026,
                    'reporting_period' => 'Semestral Report 1 2026',
                ],
                [
                    'submitted_by' => $user->id,
                    'report_type' => 'PROGRESS',
                    'research_progress' => 'Project implementation progressing according to approved Gantt chart.',
                    'objectivves_achieved' => 'Target milestones met with community stakeholder participation.',
                    'budget_utilization' => round($data['budget'] * 0.48, 2),
                    'status' => 'ACCEPTED',
                    'due_date' => Carbon::parse('2026-07-31'),
                    'submitted_at' => Carbon::parse('2026-07-25'),
                    'reviewed_by' => $giaStaff?->id,
                    'reviewed_at' => Carbon::parse('2026-07-28'),
                ],
            );
        }
    }
}
