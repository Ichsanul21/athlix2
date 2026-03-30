<?php

namespace App\Http\Controllers;

use App\Models\LandingArticle;
use App\Models\LandingContentRevision;
use App\Models\LandingGallery;
use App\Models\LandingPriceList;
use App\Models\DojoRegistration;
use App\Models\Dojo;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LandingCmsController extends Controller
{
    private const PREVIEW_TOKEN_TTL_HOURS = 168;

    public function index()
    {
        return redirect()->route('cms.articles.index');
    }

    public function dojoRegistrations(): Response
    {
        return Inertia::render('Cms/DojoRegistrations', [
            'registrations' => Inertia::defer(fn () => DojoRegistration::query()->latest()->get()),
        ]);
    }

    public function approveRegistration(DojoRegistration $dojoRegistration)
    {
        if ($dojoRegistration->status !== 'pending') {
            return back()->with('error', 'Pendaftaran tidak dalam status pending.');
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($dojoRegistration) {
            $today = now()->toDateString();
            $subscriptionDates = \App\Models\Dojo::computeSubscriptionDates($today, 1);

            $dojo = Dojo::create([
                'name'                       => $dojoRegistration->dojo_name,
                'contact_name'               => $dojoRegistration->pic_name,
                'contact_email'              => $dojoRegistration->pic_email,
                'contact_phone'              => $dojoRegistration->pic_phone,
                'country'                    => $dojoRegistration->country,
                'province_code'              => $dojoRegistration->province_code,
                'province_name'              => $dojoRegistration->province_name,
                'regency_code'               => $dojoRegistration->regency_code,
                'regency_name'               => $dojoRegistration->regency_name,
                'district_code'              => $dojoRegistration->district_code,
                'district_name'              => $dojoRegistration->district_name,
                'village_code'               => $dojoRegistration->village_code,
                'village_name'               => $dojoRegistration->village_name,
                'address_detail'             => $dojoRegistration->address_detail,
                'timezone'                   => $dojoRegistration->timezone,
                'is_active'                  => true,
                'saas_plan_name'             => $dojoRegistration->saas_plan_name,
                'monthly_saas_fee'           => $dojoRegistration->saas_plan_name === 'Advance' ? 1200000 : ($dojoRegistration->saas_plan_name === 'Pro' ? 600000 : 300000),
                'billing_cycle_months'       => 1,
                'subscription_started_at'    => $today,
                'subscription_expires_at'    => $subscriptionDates['subscription_expires_at'],
                'grace_period_stage1_ends_at' => $subscriptionDates['grace_period_stage1_ends_at'],
                'grace_period_ends_at'       => $subscriptionDates['grace_period_ends_at'],
                'is_saas_blocked'            => false,
            ]);

            User::create([
                'name' => $dojoRegistration->pic_name,
                'email' => $dojoRegistration->pic_email,
                'phone_number' => $dojoRegistration->pic_phone,
                'role' => 'dojo_admin',
                'dojo_id' => $dojo->id,
                'password' => Hash::make('password@123'),
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]);

            $dojoRegistration->update(['status' => 'approved']);
        });

        return back()->with('success', 'Pendaftaran Dojo '. $dojoRegistration->dojo_name .' berhasil disetujui. Akun admin dibuat.');
    }

    public function rejectRegistration(DojoRegistration $dojoRegistration)
    {
        if ($dojoRegistration->status !== 'pending') {
            return back()->with('error', 'Pendaftaran tidak dalam status pending.');
        }

        $dojoRegistration->update(['status' => 'rejected']);

        return back()->with('success', 'Pendaftaran ditolak.');
    }

    public function destroyRegistration(DojoRegistration $dojoRegistration)
    {
        $dojoRegistration->delete();
        return back()->with('success', 'Record pendaftaran dihapus permanen.');
    }

    public function articles(): Response
    {
        return Inertia::render('Cms/Articles', [
            'articles' => Inertia::defer(fn () => LandingArticle::query()->editorial()->get()),
            'revisions' => Inertia::defer(fn () => LandingContentRevision::query()
                ->where('revisable_type', LandingArticle::class)
                ->latest('id')
                ->take(150)
                ->get([
                    'id',
                    'revisable_id',
                    'action',
                    'change_summary',
                    'changed_fields',
                    'approval_notes',
                    'created_by',
                    'actor_name',
                    'created_at',
                ])),
            'statusOptions' => collect(LandingArticle::STATUSES)->map(fn (string $status) => [
                'value' => $status,
                'label' => Str::headline($status),
            ])->values(),
            'robotOptions' => collect(LandingArticle::META_ROBOTS_OPTIONS)->map(fn (string $robots) => [
                'value' => $robots,
                'label' => $robots,
            ])->values(),
        ]);
    }

    public function galleries(): Response
    {
        return Inertia::render('Cms/Galleries', [
            'galleries' => Inertia::defer(fn () => LandingGallery::query()->editorial()->get()),
            'revisions' => Inertia::defer(fn () => LandingContentRevision::query()
                ->where('revisable_type', LandingGallery::class)
                ->latest('id')
                ->take(150)
                ->get([
                    'id',
                    'revisable_id',
                    'action',
                    'change_summary',
                    'changed_fields',
                    'approval_notes',
                    'created_by',
                    'actor_name',
                    'created_at',
                ])),
            'statusOptions' => collect(LandingGallery::STATUSES)->map(fn (string $status) => [
                'value' => $status,
                'label' => Str::headline($status),
            ])->values(),
            'robotOptions' => collect(LandingGallery::META_ROBOTS_OPTIONS)->map(fn (string $robots) => [
                'value' => $robots,
                'label' => $robots,
            ])->values(),
        ]);
    }

    public function pricelists(): Response
    {
        return Inertia::render('Cms/PriceLists', [
            'priceLists' => Inertia::defer(fn () => LandingPriceList::query()->latest()->get()),
        ]);
    }

    public function legacy(): Response
    {
        return Inertia::render('Cms/Index', [
            'articles' => Inertia::defer(fn () => LandingArticle::query()->latest()->get()),
            'galleries' => Inertia::defer(fn () => LandingGallery::query()->latest()->get()),
            'priceLists' => Inertia::defer(fn () => LandingPriceList::query()->latest()->get()),
        ]);
    }

    public function storeArticle(Request $request)
    {
        $validated = $request->validate($this->articleRules());
        $payload = $this->prepareArticlePayload($validated, $request);

        $article = LandingArticle::query()->create($payload);
        $summary = $validated['revision_summary'] ?? 'Artikel dibuat';

        $this->recordRevision(
            $article,
            'created',
            null,
            $this->snapshotForRevision($article),
            $summary,
            $article->approval_notes
        );

        return back()->with('success', 'Artikel berhasil disimpan.');
    }

    public function updateArticle(Request $request, LandingArticle $article)
    {
        $validated = $request->validate($this->articleRules($article));
        $before = $this->snapshotForRevision($article);
        $payload = $this->prepareArticlePayload($validated, $request, $article);

        $article->update($payload);
        $article->refresh();

        $after = $this->snapshotForRevision($article);
        $summary = $validated['revision_summary'] ?? $this->guessRevisionSummary($before, $after, 'artikel');

        $this->recordRevision(
            $article,
            'updated',
            $before,
            $after,
            $summary,
            $article->approval_notes
        );

        return back()->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroyArticle(LandingArticle $article)
    {
        $before = $this->snapshotForRevision($article);

        $this->recordRevision(
            $article,
            'deleted',
            $before,
            [],
            'Artikel dihapus',
            $article->approval_notes
        );

        $this->deletePublicFile($article->thumbnail_path);
        $this->deletePublicFile($article->og_image_path);

        $article->delete();

        return back()->with('success', 'Artikel berhasil dihapus.');
    }

    public function uploadArticleEditorImage(Request $request)
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,avif,gif', 'max:8192'],
        ]);

        $path = $request->file('image')->store('landing/articles/editor', 'public');

        return response()->json([
            'path' => $path,
            'url' => asset('storage/' . $path),
        ]);
    }

    public function refreshArticlePreviewToken(LandingArticle $article)
    {
        $before = $this->snapshotForRevision($article);
        [$token, $hashedToken, $expiresAt] = $this->generatePreviewTokenPayload();

        $article->update([
            'preview_token' => $hashedToken,
            'preview_token_expires_at' => $expiresAt,
        ]);
        $article->refresh();

        $this->recordRevision(
            $article,
            'preview_token_refreshed',
            $before,
            $this->snapshotForRevision($article),
            'Preview token artikel diregenerasi',
            $article->approval_notes
        );

        return response()->json([
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
            'preview_url' => route('landing.articles.show', ['slug' => $article->slug], true) . '?preview=' . urlencode($token),
        ]);
    }

    public function storeGallery(Request $request)
    {
        $validated = $request->validate($this->galleryRules());
        $payload = $this->prepareGalleryPayload($validated, $request);

        $gallery = LandingGallery::query()->create($payload);
        $summary = $validated['revision_summary'] ?? 'Galeri dibuat';

        $this->recordRevision(
            $gallery,
            'created',
            null,
            $this->snapshotForRevision($gallery),
            $summary,
            $gallery->approval_notes
        );

        return back()->with('success', 'Galeri berhasil disimpan.');
    }

    public function updateGallery(Request $request, LandingGallery $gallery)
    {
        $validated = $request->validate($this->galleryRules($gallery));
        $before = $this->snapshotForRevision($gallery);
        $payload = $this->prepareGalleryPayload($validated, $request, $gallery);

        $gallery->update($payload);
        $gallery->refresh();

        $after = $this->snapshotForRevision($gallery);
        $summary = $validated['revision_summary'] ?? $this->guessRevisionSummary($before, $after, 'galeri');

        $this->recordRevision(
            $gallery,
            'updated',
            $before,
            $after,
            $summary,
            $gallery->approval_notes
        );

        return back()->with('success', 'Galeri berhasil diperbarui.');
    }

    public function destroyGallery(LandingGallery $gallery)
    {
        $before = $this->snapshotForRevision($gallery);

        $this->recordRevision(
            $gallery,
            'deleted',
            $before,
            [],
            'Galeri dihapus',
            $gallery->approval_notes
        );

        $this->deletePublicFile($gallery->image_path);
        $this->deletePublicFile($gallery->og_image_path);

        $gallery->delete();

        return back()->with('success', 'Galeri berhasil dihapus.');
    }

    public function refreshGalleryPreviewToken(LandingGallery $gallery)
    {
        $before = $this->snapshotForRevision($gallery);
        [$token, $hashedToken, $expiresAt] = $this->generatePreviewTokenPayload();

        $gallery->update([
            'preview_token' => $hashedToken,
            'preview_token_expires_at' => $expiresAt,
        ]);
        $gallery->refresh();

        $this->recordRevision(
            $gallery,
            'preview_token_refreshed',
            $before,
            $this->snapshotForRevision($gallery),
            'Preview token galeri diregenerasi',
            $gallery->approval_notes
        );

        return response()->json([
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
            'preview_url' => route('landing.galleries.show', ['slug' => $gallery->slug], true) . '?preview=' . urlencode($token),
        ]);
    }

    public function storePriceList(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'sort_order' => 'nullable|integer|min:0',
            'is_featured' => 'nullable|boolean',
        ]);

        $validated['currency'] = $validated['currency'] ?? 'IDR';
        $validated['is_featured'] = (bool) ($validated['is_featured'] ?? false);

        LandingPriceList::create($validated);

        return back()->with('success', 'Pricelist berhasil ditambahkan.');
    }

    public function updatePriceList(Request $request, LandingPriceList $priceList)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'sort_order' => 'nullable|integer|min:0',
            'is_featured' => 'nullable|boolean',
        ]);

        $validated['currency'] = $validated['currency'] ?? 'IDR';
        $validated['is_featured'] = (bool) ($validated['is_featured'] ?? false);

        $priceList->update($validated);

        return back()->with('success', 'Pricelist berhasil diperbarui.');
    }

    public function destroyPriceList(LandingPriceList $priceList)
    {
        $priceList->delete();

        return back()->with('success', 'Pricelist berhasil dihapus.');
    }

    private function articleRules(?LandingArticle $article = null): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('landing_articles', 'slug')->ignore($article?->id)],
            'translation_key' => ['nullable', 'string', 'max:150'],
            'excerpt' => ['nullable', 'string', 'max:700'],
            'content' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:120'],
            'tags' => ['nullable', 'string', 'max:500'],
            'locale' => ['nullable', 'string', 'max:10'],
            'author_name' => ['nullable', 'string', 'max:120'],
            'reading_time' => ['nullable', 'integer', 'min:1', 'max:120'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(LandingArticle::STATUSES)],
            'approval_notes' => ['nullable', 'string', 'max:5000'],
            'revision_summary' => ['nullable', 'string', 'max:500'],
            'is_featured' => ['nullable', 'boolean'],
            'publish_at' => ['nullable', 'date'],
            'is_published' => ['nullable', 'boolean'],
            'thumbnail' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
            'thumbnail_alt' => ['nullable', 'string', 'max:255'],
            'canonical_url' => ['nullable', 'url', 'max:2048'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:170'],
            'seo_keywords' => ['nullable', 'string', 'max:255'],
            'meta_robots' => ['nullable', Rule::in(LandingArticle::META_ROBOTS_OPTIONS)],
            'og_title' => ['nullable', 'string', 'max:95'],
            'og_description' => ['nullable', 'string', 'max:200'],
            'og_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
        ];
    }

    private function galleryRules(?LandingGallery $gallery = null): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('landing_galleries', 'slug')->ignore($gallery?->id)],
            'translation_key' => ['nullable', 'string', 'max:150'],
            'media_type' => ['nullable', Rule::in(LandingGallery::MEDIA_TYPES)],
            'caption' => ['nullable', 'string', 'max:700'],
            'description' => ['nullable', 'string', 'max:2000'],
            'category' => ['nullable', 'string', 'max:120'],
            'tags' => ['nullable', 'string', 'max:500'],
            'locale' => ['nullable', 'string', 'max:10'],
            'photographer_name' => ['nullable', 'string', 'max:120'],
            'location' => ['nullable', 'string', 'max:255'],
            'captured_at' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(LandingGallery::STATUSES)],
            'approval_notes' => ['nullable', 'string', 'max:5000'],
            'revision_summary' => ['nullable', 'string', 'max:500'],
            'is_featured' => ['nullable', 'boolean'],
            'publish_at' => ['nullable', 'date'],
            'image' => [$gallery ? 'nullable' : 'required', 'file', 'mimes:jpg,jpeg,png,webp,avif', 'max:10240'],
            'video_url' => ['nullable', 'required_if:media_type,video', 'url', 'max:2048'],
            'image_alt' => ['nullable', 'string', 'max:255'],
            'canonical_url' => ['nullable', 'url', 'max:2048'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:170'],
            'seo_keywords' => ['nullable', 'string', 'max:255'],
            'meta_robots' => ['nullable', Rule::in(LandingGallery::META_ROBOTS_OPTIONS)],
            'og_title' => ['nullable', 'string', 'max:95'],
            'og_description' => ['nullable', 'string', 'max:200'],
            'og_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,avif', 'max:8192'],
        ];
    }

    private function prepareArticlePayload(array $validated, Request $request, ?LandingArticle $article = null): array
    {
        $payload = $validated;
        $status = $validated['status'] ?? null;
        if (! $status) {
            $status = (bool) ($validated['is_published'] ?? false)
                ? LandingArticle::STATUS_PUBLISHED
                : LandingArticle::STATUS_DRAFT;
        }

        $isPublished = $status === LandingArticle::STATUS_PUBLISHED;

        $payload['slug'] = $this->generateUniqueSlug(
            LandingArticle::class,
            (string) ($validated['slug'] ?? $validated['title'] ?? 'artikel'),
            $article?->id
        );
        $payload['translation_key'] = $this->normalizeTranslationKey($validated['translation_key'] ?? $payload['slug']);
        $payload['status'] = $status;
        $payload['is_published'] = $isPublished;
        $payload['is_featured'] = (bool) ($validated['is_featured'] ?? false);
        $payload['tags'] = $this->normalizeTags($validated['tags'] ?? []);
        $payload['locale'] = $validated['locale'] ?? 'id-ID';
        $payload['publish_at'] = $this->resolvePublishAt($validated['publish_at'] ?? null, $isPublished);
        $payload['meta_robots'] = $validated['meta_robots'] ?? 'index,follow';
        $payload['reading_time'] = (int) ($validated['reading_time'] ?? 0);
        $payload['approval_notes'] = $this->normalizeNullableText($validated['approval_notes'] ?? null);

        if ($payload['reading_time'] <= 0) {
            $payload['reading_time'] = $this->estimateReadingTime((string) ($validated['content'] ?? ''));
        }

        if (empty($payload['excerpt'])) {
            $payload['excerpt'] = Str::limit(trim(strip_tags((string) ($validated['content'] ?? ''))), 220);
        }

        $payload['content'] = $this->sanitizeRichContent((string) ($validated['content'] ?? ''));

        if ($request->hasFile('thumbnail')) {
            $this->deletePublicFile($article?->thumbnail_path);
            $payload['thumbnail_path'] = $request->file('thumbnail')->store('landing/articles', 'public');
        }

        if ($request->hasFile('og_image')) {
            $this->deletePublicFile($article?->og_image_path);
            $payload['og_image_path'] = $request->file('og_image')->store('landing/articles/og', 'public');
        }

        $statusChanged = $article && $article->status !== $status;
        $notesChanged = $article && $article->approval_notes !== $payload['approval_notes'];
        $shouldStampReview = $article
            ? ($statusChanged || $notesChanged)
            : (in_array($status, [LandingArticle::STATUS_REVIEW, LandingArticle::STATUS_PUBLISHED, LandingArticle::STATUS_ARCHIVED], true) || ! empty($payload['approval_notes']));

        if ($shouldStampReview) {
            $payload['reviewed_by'] = Auth::id();
            $payload['reviewed_at'] = now();
        }

        unset($payload['thumbnail'], $payload['og_image'], $payload['revision_summary']);

        return $payload;
    }

    private function prepareGalleryPayload(array $validated, Request $request, ?LandingGallery $gallery = null): array
    {
        $payload = $validated;
        $status = $validated['status'] ?? LandingGallery::STATUS_DRAFT;
        $isPublished = $status === LandingGallery::STATUS_PUBLISHED;

        $payload['slug'] = $this->generateUniqueSlug(
            LandingGallery::class,
            (string) ($validated['slug'] ?? $validated['title'] ?? 'galeri'),
            $gallery?->id
        );
        $payload['translation_key'] = $this->normalizeTranslationKey($validated['translation_key'] ?? $payload['slug']);
        $payload['media_type'] = $validated['media_type'] ?? LandingGallery::MEDIA_IMAGE;
        $payload['status'] = $status;
        $payload['is_featured'] = (bool) ($validated['is_featured'] ?? false);
        $payload['tags'] = $this->normalizeTags($validated['tags'] ?? []);
        $payload['locale'] = $validated['locale'] ?? 'id-ID';
        $payload['publish_at'] = $this->resolvePublishAt($validated['publish_at'] ?? null, $isPublished);
        $payload['meta_robots'] = $validated['meta_robots'] ?? 'index,follow';
        $payload['approval_notes'] = $this->normalizeNullableText($validated['approval_notes'] ?? null);
        $payload['video_url'] = $payload['media_type'] === LandingGallery::MEDIA_VIDEO
            ? $this->normalizeNullableText($validated['video_url'] ?? $gallery?->video_url)
            : null;

        if (empty($payload['caption']) && ! empty($payload['description'])) {
            $payload['caption'] = Str::limit(strip_tags((string) $payload['description']), 255);
        }

        if ($request->hasFile('image')) {
            $this->deletePublicFile($gallery?->image_path);
            $payload['image_path'] = $request->file('image')->store('landing/galleries', 'public');
        }

        if ($request->hasFile('og_image')) {
            $this->deletePublicFile($gallery?->og_image_path);
            $payload['og_image_path'] = $request->file('og_image')->store('landing/galleries/og', 'public');
        }

        $statusChanged = $gallery && $gallery->status !== $status;
        $notesChanged = $gallery && $gallery->approval_notes !== $payload['approval_notes'];
        $shouldStampReview = $gallery
            ? ($statusChanged || $notesChanged)
            : (in_array($status, [LandingGallery::STATUS_REVIEW, LandingGallery::STATUS_PUBLISHED, LandingGallery::STATUS_ARCHIVED], true) || ! empty($payload['approval_notes']));

        if ($shouldStampReview) {
            $payload['reviewed_by'] = Auth::id();
            $payload['reviewed_at'] = now();
        }

        unset($payload['image'], $payload['og_image'], $payload['revision_summary']);

        return $payload;
    }

    private function generateUniqueSlug(string $modelClass, string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source);
        if ($base === '') {
            $base = 'content';
        }

        $base = Str::limit($base, 180, '');
        $slug = $base;
        $counter = 2;

        while ($modelClass::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = Str::limit($base, 170, '') . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function normalizeTranslationKey(?string $translationKey): string
    {
        $translationKey = trim((string) $translationKey);
        $normalized = Str::slug($translationKey);

        return $normalized !== '' ? Str::limit($normalized, 150, '') : Str::random(12);
    }

    private function normalizeTags(array|string|null $rawTags): array
    {
        if (is_array($rawTags)) {
            $parts = $rawTags;
        } else {
            $parts = preg_split('/[,;\r\n]+/', (string) $rawTags) ?: [];
        }

        $normalized = [];
        foreach ($parts as $part) {
            $tag = Str::limit(trim((string) $part), 40, '');
            if ($tag !== '') {
                $normalized[] = $tag;
            }
        }

        return array_values(array_unique($normalized));
    }

    private function normalizeNullableText(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }

    private function estimateReadingTime(string $content): int
    {
        $wordCount = str_word_count(strip_tags($content));

        return max(1, (int) ceil($wordCount / 220));
    }

    private function resolvePublishAt(?string $publishAt, bool $isPublished): ?Carbon
    {
        if (! $publishAt) {
            return $isPublished ? now() : null;
        }

        try {
            return Carbon::parse($publishAt);
        } catch (\Throwable) {
            return $isPublished ? now() : null;
        }
    }

    private function deletePublicFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    private function sanitizeRichContent(string $html): string
    {
        $clean = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html) ?? '';
        $clean = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $clean) ?? '';
        $clean = preg_replace('/on\w+="[^"]*"/i', '', $clean) ?? '';
        $clean = preg_replace("/on\w+='[^']*'/i", '', $clean) ?? '';
        $clean = preg_replace('/javascript:/i', '', $clean) ?? '';

        $allowedTags = '<p><br><b><strong><i><em><u><h1><h2><h3><h4><h5><h6><blockquote><ul><ol><li><a><img><figure><figcaption><pre><code><hr><span><div>';

        return trim(strip_tags($clean, $allowedTags));
    }

    private function generatePreviewTokenPayload(): array
    {
        $token = Str::random(48);
        $hashedToken = hash('sha256', $token);
        $expiresAt = now()->addHours(self::PREVIEW_TOKEN_TTL_HOURS);

        return [$token, $hashedToken, $expiresAt];
    }

    private function snapshotForRevision(Model $model): array
    {
        if ($model instanceof LandingArticle) {
            return $model->only([
                'id',
                'title',
                'slug',
                'translation_key',
                'excerpt',
                'content',
                'status',
                'publish_at',
                'locale',
                'category',
                'tags',
                'author_name',
                'reading_time',
                'is_featured',
                'sort_order',
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
                'approval_notes',
                'reviewed_by',
                'reviewed_at',
                'preview_token_expires_at',
                'updated_at',
            ]);
        }

        if ($model instanceof LandingGallery) {
            return $model->only([
                'id',
                'title',
                'slug',
                'translation_key',
                'media_type',
                'caption',
                'description',
                'status',
                'publish_at',
                'locale',
                'category',
                'tags',
                'photographer_name',
                'location',
                'captured_at',
                'is_featured',
                'sort_order',
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
                'approval_notes',
                'reviewed_by',
                'reviewed_at',
                'preview_token_expires_at',
                'updated_at',
            ]);
        }

        return $model->toArray();
    }

    private function recordRevision(
        Model $model,
        string $action,
        ?array $before,
        array $after,
        ?string $summary = null,
        ?string $approvalNotes = null
    ): void {
        LandingContentRevision::query()->create([
            'revisable_type' => $model::class,
            'revisable_id' => $model->getKey(),
            'action' => $action,
            'change_summary' => $summary,
            'changed_fields' => $this->detectChangedFields($before, $after),
            'snapshot_before' => $before,
            'snapshot_after' => $after,
            'approval_notes' => $approvalNotes,
            'created_by' => Auth::id(),
            'actor_name' => Auth::user()?->name,
            'created_at' => now(),
        ]);
    }

    private function detectChangedFields(?array $before, array $after): array
    {
        if ($before === null) {
            return array_values(array_keys($after));
        }

        $changed = [];
        $keys = array_unique(array_merge(array_keys($before), array_keys($after)));

        foreach ($keys as $key) {
            $previous = $before[$key] ?? null;
            $current = $after[$key] ?? null;

            if (json_encode($previous) !== json_encode($current)) {
                $changed[] = $key;
            }
        }

        return $changed;
    }

    private function guessRevisionSummary(array $before, array $after, string $label): string
    {
        if (($before['status'] ?? null) !== ($after['status'] ?? null)) {
            return 'Status ' . $label . ' diperbarui dari ' . ($before['status'] ?? '-') . ' ke ' . ($after['status'] ?? '-');
        }

        if (($before['title'] ?? null) !== ($after['title'] ?? null)) {
            return 'Judul ' . $label . ' diperbarui';
        }

        if (($before['publish_at'] ?? null) !== ($after['publish_at'] ?? null)) {
            return 'Jadwal publish ' . $label . ' diperbarui';
        }

        return 'Konten ' . $label . ' diperbarui';
    }
}
