<?php

namespace Tests\Feature;

use App\Http\Requests\Project\BatchInterventionRequest;
use App\Http\Requests\Project\BatchMarketRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class MonitoringDateValidationTest extends TestCase
{
    public function test_monitoring_batch_requests_accept_iso_dates(): void
    {
        $market = Validator::make(
            $this->marketPayload('2026-07-01'),
            (new BatchMarketRequest)->rules(),
        );
        $intervention = Validator::make(
            $this->interventionPayload('2026-06-12'),
            (new BatchInterventionRequest)->rules(),
        );

        $this->assertFalse($market->fails());
        $this->assertFalse($intervention->fails());
    }

    public function test_monitoring_batch_requests_reject_informal_dates(): void
    {
        $market = Validator::make(
            $this->marketPayload('July 2026'),
            (new BatchMarketRequest)->rules(),
        );
        $intervention = Validator::make(
            $this->interventionPayload('Jun 12'),
            (new BatchInterventionRequest)->rules(),
        );

        $this->assertTrue($market->fails());
        $this->assertArrayHasKey('creates.0.effective_date', $market->errors()->toArray());
        $this->assertTrue($intervention->fails());
        $this->assertArrayHasKey('creates.0.date', $intervention->errors()->toArray());
    }

    private function marketPayload(string $date): array
    {
        return [
            'creates' => [[
                'temp_id' => 'local-market-1',
                'market_name' => 'Test Market',
                'address' => 'Mati City',
                'condition' => 'new',
                'effective_date' => $date,
                'contact_person' => 'Juan Dela Cruz',
                'service' => 'Processed food',
                'volume' => '100 units',
            ]],
        ];
    }

    private function interventionPayload(string $date): array
    {
        return [
            'creates' => [[
                'temp_id' => 'intervention-1',
                'name' => 'Food Safety Training',
                'type' => 'TRAINING',
                'availed' => true,
                'intervention' => 'DOST',
                'date' => $date,
            ]],
        ];
    }
}
