<?php

namespace Tests\Feature;

use App\Models\LandingArticle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingSeoAndPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_contains_hreflang_and_content_urls(): void
    {
        LandingArticle::query()->create([
            'title' => 'Panduan Dojo',
            'slug' => 'panduan-dojo',
            'translation_key' => 'dojo-guide',
            'excerpt' => 'Panduan operasional.',
            'content' => 'Konten artikel bahasa Indonesia.',
            'status' => 'published',
            'is_published' => true,
            'publish_at' => now()->subDay(),
            'locale' => 'id-ID',
        ]);

        LandingArticle::query()->create([
            'title' => 'Dojo Guide',
            'slug' => 'dojo-guide-en',
            'translation_key' => 'dojo-guide',
            'excerpt' => 'Operational guide.',
            'content' => 'English article content.',
            'status' => 'published',
            'is_published' => true,
            'publish_at' => now()->subDay(),
            'locale' => 'en-US',
        ]);

        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $response->assertSee('panduan-dojo', false);
        $response->assertSee('dojo-guide-en', false);
        $response->assertSee('hreflang="id-ID"', false);
        $response->assertSee('hreflang="en-US"', false);
    }

    public function test_robots_endpoint_includes_sitemap_line(): void
    {
        $response = $this->get('/robots.txt');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $response->assertSee('Disallow: /cms');
        $response->assertSee('Sitemap: ' . url('/sitemap.xml'));
    }

    public function test_draft_article_requires_valid_preview_token(): void
    {
        $token = 'preview-token-123';

        LandingArticle::query()->create([
            'title' => 'Draft Internal',
            'slug' => 'draft-internal',
            'translation_key' => 'draft-internal',
            'excerpt' => 'Draft.',
            'content' => 'Konten draft internal.',
            'status' => 'draft',
            'is_published' => false,
            'publish_at' => null,
            'locale' => 'id-ID',
            'preview_token' => hash('sha256', $token),
            'preview_token_expires_at' => now()->addDay(),
        ]);

        $this->get('/artikel/draft-internal')->assertNotFound();
        $this->get('/artikel/draft-internal?preview=invalid-token')->assertNotFound();

        $previewResponse = $this->get('/artikel/draft-internal?preview=' . $token);
        $previewResponse->assertOk();
        $previewResponse->assertSee('Draft Internal');
        $previewResponse->assertSee('previewMode');
    }
}
