<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LocalizationTranslateTest extends TestCase
{
    public function test_it_translates_text_batch(): void
    {
        Http::fake([
            'translate.googleapis.com/*' => Http::response([
                [['Athlete Database', 'Database Atlet', null, null, 3]],
                null,
                'id',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/localization/translate', [
            'source' => 'id',
            'target' => 'en',
            'texts' => ['Database Atlet'],
        ]);

        $response->assertOk()
            ->assertJsonPath('source', 'id')
            ->assertJsonPath('target', 'en')
            ->assertJsonPath('translations.Database Atlet', 'Athlete Database');
    }
}

