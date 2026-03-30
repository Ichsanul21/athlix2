<?php

namespace App\Http\Controllers;

use App\Models\LandingArticle;
use App\Models\LandingGallery;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class LandingController extends Controller
{
    public function index(): InertiaResponse
    {
        $tablesReady = $this->landingTablesReady();

        return Inertia::render('Landing/Index', [
            'localeAlternates' => $this->buildLandingAlternates(),
            'articles' => Inertia::defer(fn () => $tablesReady
                ? LandingArticle::query()
                    ->live()
                    ->orderByDesc('is_featured')
                    ->orderBy('sort_order')
                    ->orderByDesc('publish_at')
                    ->take(6)
                    ->get([
                        'id',
                        'title',
                        'slug',
                        'excerpt',
                        'thumbnail_path',
                        'thumbnail_alt',
                        'category',
                        'publish_at',
                        'reading_time',
                        'seo_description',
                        'locale',
                    ])
                : collect()),
            'galleries' => Inertia::defer(fn () => $tablesReady
                ? LandingGallery::query()
                    ->live()
                    ->orderByDesc('is_featured')
                    ->orderBy('sort_order')
                    ->orderByDesc('publish_at')
                    ->take(12)
                    ->get([
                        'id',
                        'title',
                        'slug',
                        'caption',
                        'location',
                        'media_type',
                        'image_path',
                        'video_url',
                        'image_alt',
                        'publish_at',
                        'locale',
                    ])
                : collect()),
        ]);
    }

    public function registerDojo(Request $request)
    {
        $validated = $request->validate([
            'dojo_name' => 'required|string|max:255',
            'country' => 'nullable|string|max:255',
            'province_code' => 'nullable|string|max:255',
            'province_name' => 'nullable|string|max:255',
            'regency_code' => 'nullable|string|max:255',
            'regency_name' => 'nullable|string|max:255',
            'district_code' => 'nullable|string|max:255',
            'district_name' => 'nullable|string|max:255',
            'village_code' => 'nullable|string|max:255',
            'village_name' => 'nullable|string|max:255',
            'address_detail' => 'nullable|string',
            'timezone' => 'required|string|max:255',
            'saas_plan_name' => 'required|string|max:255',
            'pic_name' => 'required|string|max:255',
            'pic_email' => 'required|email|max:255',
            'pic_phone' => 'required|string|max:255',
        ]);

        \App\Models\DojoRegistration::create(array_merge($validated, ['status' => 'pending']));

        return back()->with('success', 'Pendaftaran dojo telah diterima. Kami akan segera menghubungi Anda.');
    }

    public function showArticle(Request $request, string $slug): InertiaResponse
    {
        $article = $this->resolveArticleForDisplay($slug, $request->query('preview'));

        return Inertia::render('Landing/ArticleShow', [
            'article' => $this->serializeArticle($article),
            'alternates' => $this->buildArticleAlternates($article),
            'previewMode' => ! $this->isLiveArticle($article),
            'relatedArticles' => Inertia::defer(fn () => LandingArticle::query()
                ->live()
                ->where('id', '!=', $article->id)
                ->orderByDesc('is_featured')
                ->orderByDesc('publish_at')
                ->take(3)
                ->get([
                    'id',
                    'title',
                    'slug',
                    'excerpt',
                ])),
        ]);
    }

    public function showGallery(Request $request, string $slug): InertiaResponse
    {
        $gallery = $this->resolveGalleryForDisplay($slug, $request->query('preview'));

        return Inertia::render('Landing/GalleryShow', [
            'gallery' => $this->serializeGallery($gallery),
            'alternates' => $this->buildGalleryAlternates($gallery),
            'previewMode' => ! $this->isLiveGallery($gallery),
            'relatedGalleries' => Inertia::defer(fn () => LandingGallery::query()
                ->live()
                ->where('id', '!=', $gallery->id)
                ->orderByDesc('is_featured')
                ->orderByDesc('publish_at')
                ->take(6)
                ->get([
                    'id',
                    'title',
                    'slug',
                    'media_type',
                    'image_path',
                    'video_url',
                    'image_alt',
                ])),
        ]);
    }

    public function sitemap(): Response
    {
        $tablesReady = $this->landingTablesReady();
        $articles = $tablesReady
            ? LandingArticle::query()
                ->live()
                ->whereNotNull('slug')
                ->get([
                    'id',
                    'slug',
                    'locale',
                    'translation_key',
                    'canonical_url',
                    'publish_at',
                    'created_at',
                    'updated_at',
                ])
            : collect();

        $galleries = $tablesReady
            ? LandingGallery::query()
                ->live()
                ->whereNotNull('slug')
                ->get([
                    'id',
                    'slug',
                    'locale',
                    'translation_key',
                    'canonical_url',
                    'publish_at',
                    'created_at',
                    'updated_at',
                ])
            : collect();

        $articleGroups = $articles->groupBy(fn (LandingArticle $article) => $this->translationGroupKey($article->translation_key, 'article', $article->id));
        $galleryGroups = $galleries->groupBy(fn (LandingGallery $gallery) => $this->translationGroupKey($gallery->translation_key, 'gallery', $gallery->id));

        $lastContentUpdate = collect([
            $articles->max('updated_at'),
            $galleries->max('updated_at'),
        ])->filter()->max();

        $urls = [[
            'loc' => route('landing.index', [], true),
            'lastmod' => optional($lastContentUpdate)->toAtomString() ?? now()->toAtomString(),
            'alternates' => $this->buildLandingAlternates(),
        ]];

        foreach ($articles as $article) {
            $groupKey = $this->translationGroupKey($article->translation_key, 'article', $article->id);
            $alternates = $this->normalizeAlternates(
                $articleGroups->get($groupKey, collect())->push($article)->unique('id'),
                fn (LandingArticle $variant) => $this->articleUrl($variant)
            );

            $urls[] = [
                'loc' => $this->articleUrl($article),
                'lastmod' => optional($article->updated_at ?? $article->publish_at ?? $article->created_at)?->toAtomString(),
                'alternates' => $alternates,
            ];
        }

        foreach ($galleries as $gallery) {
            $groupKey = $this->translationGroupKey($gallery->translation_key, 'gallery', $gallery->id);
            $alternates = $this->normalizeAlternates(
                $galleryGroups->get($groupKey, collect())->push($gallery)->unique('id'),
                fn (LandingGallery $variant) => $this->galleryUrl($variant)
            );

            $urls[] = [
                'loc' => $this->galleryUrl($gallery),
                'lastmod' => optional($gallery->updated_at ?? $gallery->publish_at ?? $gallery->created_at)?->toAtomString(),
                'alternates' => $alternates,
            ];
        }

        return response()
            ->view('seo.sitemap', ['urls' => $urls], 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    public function robots(): Response
    {
        $content = implode("\n", [
            'User-agent: *',
            'Allow: /',
            'Disallow: /cms',
            'Disallow: /login',
            'Sitemap: ' . route('seo.sitemap', [], true),
        ]) . "\n";

        return response($content, 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    private function resolveArticleForDisplay(string $slug, ?string $previewToken): LandingArticle
    {
        $previewToken = trim((string) $previewToken);

        if ($previewToken !== '') {
            $previewArticle = LandingArticle::query()
                ->where('slug', $slug)
                ->where('preview_token', hash('sha256', $previewToken))
                ->where(function ($query): void {
                    $query
                        ->whereNull('preview_token_expires_at')
                        ->orWhere('preview_token_expires_at', '>', now());
                })
                ->first();

            if ($previewArticle) {
                return $previewArticle;
            }
        }

        return LandingArticle::query()
            ->live()
            ->where('slug', $slug)
            ->firstOrFail();
    }

    private function resolveGalleryForDisplay(string $slug, ?string $previewToken): LandingGallery
    {
        $previewToken = trim((string) $previewToken);

        if ($previewToken !== '') {
            $previewGallery = LandingGallery::query()
                ->where('slug', $slug)
                ->where('preview_token', hash('sha256', $previewToken))
                ->where(function ($query): void {
                    $query
                        ->whereNull('preview_token_expires_at')
                        ->orWhere('preview_token_expires_at', '>', now());
                })
                ->first();

            if ($previewGallery) {
                return $previewGallery;
            }
        }

        return LandingGallery::query()
            ->live()
            ->where('slug', $slug)
            ->firstOrFail();
    }

    private function serializeArticle(LandingArticle $article): array
    {
        return $article->only([
            'id',
            'title',
            'slug',
            'excerpt',
            'content',
            'category',
            'author_name',
            'reading_time',
            'thumbnail_path',
            'thumbnail_alt',
            'canonical_url',
            'seo_title',
            'seo_description',
            'seo_keywords',
            'meta_robots',
            'og_title',
            'og_description',
            'og_image_path',
            'locale',
            'publish_at',
            'created_at',
            'updated_at',
        ]);
    }

    private function serializeGallery(LandingGallery $gallery): array
    {
        return $gallery->only([
            'id',
            'title',
            'slug',
            'caption',
            'description',
            'category',
            'media_type',
            'photographer_name',
            'location',
            'captured_at',
            'image_path',
            'video_url',
            'image_alt',
            'canonical_url',
            'seo_title',
            'seo_description',
            'seo_keywords',
            'meta_robots',
            'og_title',
            'og_description',
            'og_image_path',
            'locale',
            'publish_at',
            'created_at',
            'updated_at',
        ]);
    }

    private function buildArticleAlternates(LandingArticle $article): array
    {
        if (! $article->translation_key) {
            return $this->normalizeAlternates(
                collect([$article]),
                fn (LandingArticle $variant) => $this->articleUrl($variant)
            );
        }

        $variants = LandingArticle::query()
            ->live()
            ->where('translation_key', $article->translation_key)
            ->whereNotNull('slug')
            ->get([
                'id',
                'slug',
                'locale',
                'canonical_url',
            ])
            ->push($article)
            ->unique('id');

        return $this->normalizeAlternates(
            $variants,
            fn (LandingArticle $variant) => $this->articleUrl($variant)
        );
    }

    private function buildGalleryAlternates(LandingGallery $gallery): array
    {
        if (! $gallery->translation_key) {
            return $this->normalizeAlternates(
                collect([$gallery]),
                fn (LandingGallery $variant) => $this->galleryUrl($variant)
            );
        }

        $variants = LandingGallery::query()
            ->live()
            ->where('translation_key', $gallery->translation_key)
            ->whereNotNull('slug')
            ->get([
                'id',
                'slug',
                'locale',
                'canonical_url',
            ])
            ->push($gallery)
            ->unique('id');

        return $this->normalizeAlternates(
            $variants,
            fn (LandingGallery $variant) => $this->galleryUrl($variant)
        );
    }

    private function buildLandingAlternates(): array
    {
        if (! $this->landingTablesReady()) {
            return [
                ['locale' => 'id-ID', 'href' => route('landing.index', ['lang' => 'id-ID'], true)],
                ['locale' => 'en-US', 'href' => route('landing.index', ['lang' => 'en-US'], true)],
                ['locale' => 'x-default', 'href' => route('landing.index', [], true)],
            ];
        }

        $locales = LandingArticle::query()
            ->live()
            ->whereNotNull('locale')
            ->pluck('locale')
            ->merge(
                LandingGallery::query()
                    ->live()
                    ->whereNotNull('locale')
                    ->pluck('locale')
            )
            ->map(fn ($locale) => trim((string) $locale))
            ->filter()
            ->unique()
            ->values();

        if ($locales->isEmpty()) {
            $locales = collect(['id-ID', 'en-US']);
        }

        $alternates = $locales->map(function (string $locale): array {
            return [
                'locale' => $locale,
                'href' => route('landing.index', ['lang' => $locale], true),
            ];
        })->values();

        $alternates->push([
            'locale' => 'x-default',
            'href' => route('landing.index', [], true),
        ]);

        return $alternates->all();
    }

    private function normalizeAlternates(Collection $records, callable $resolveHref): array
    {
        $uniqueLocales = [];

        foreach ($records as $record) {
            $locale = trim((string) ($record->locale ?? 'id-ID'));
            if ($locale === '' || isset($uniqueLocales[$locale])) {
                continue;
            }

            $uniqueLocales[$locale] = $resolveHref($record);
        }

        if (empty($uniqueLocales)) {
            $uniqueLocales['id-ID'] = route('landing.index', [], true);
        }

        $xDefault = $uniqueLocales['en-US'] ?? reset($uniqueLocales);
        $uniqueLocales['x-default'] = $xDefault ?: route('landing.index', [], true);

        return collect($uniqueLocales)
            ->map(fn (string $href, string $locale): array => [
                'locale' => $locale,
                'href' => $href,
            ])
            ->values()
            ->all();
    }

    private function articleUrl(LandingArticle $article): string
    {
        return $this->canonicalOrFallback(
            $article->canonical_url,
            route('landing.articles.show', ['slug' => $article->slug], true)
        );
    }

    private function galleryUrl(LandingGallery $gallery): string
    {
        return $this->canonicalOrFallback(
            $gallery->canonical_url,
            route('landing.galleries.show', ['slug' => $gallery->slug], true)
        );
    }

    private function canonicalOrFallback(?string $canonicalUrl, string $fallback): string
    {
        $canonicalUrl = trim((string) $canonicalUrl);

        if ($canonicalUrl === '') {
            return $fallback;
        }

        if (str_starts_with($canonicalUrl, 'http://') || str_starts_with($canonicalUrl, 'https://')) {
            return $canonicalUrl;
        }

        return url($canonicalUrl);
    }

    private function translationGroupKey(?string $translationKey, string $prefix, int $id): string
    {
        return trim((string) $translationKey) !== ''
            ? (string) $translationKey
            : $prefix . '-' . $id;
    }

    private function landingTablesReady(): bool
    {
        return Schema::hasTable('landing_articles') && Schema::hasTable('landing_galleries');
    }

    private function isLiveArticle(LandingArticle $article): bool
    {
        $published = $article->status === LandingArticle::STATUS_PUBLISHED
            || ($article->status === null && (bool) $article->is_published);

        if (! $published) {
            return false;
        }

        return ! $article->publish_at || $article->publish_at->lte(now());
    }

    private function isLiveGallery(LandingGallery $gallery): bool
    {
        $published = $gallery->status === LandingGallery::STATUS_PUBLISHED
            || $gallery->status === null;

        if (! $published) {
            return false;
        }

        return ! $gallery->publish_at || $gallery->publish_at->lte(now());
    }
}
