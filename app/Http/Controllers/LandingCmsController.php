<?php

namespace App\Http\Controllers;

use App\Models\LandingArticle;
use App\Models\LandingGallery;
use App\Models\LandingPriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LandingCmsController extends Controller
{
    public function index()
    {
        return redirect()->route('cms.articles.index');
    }

    public function articles()
    {
        return Inertia::render('Cms/Articles', [
            'articles' => Inertia::defer(fn () => LandingArticle::query()->latest()->get()),
        ]);
    }

    public function galleries()
    {
        return Inertia::render('Cms/Galleries', [
            'galleries' => Inertia::defer(fn () => LandingGallery::query()->latest()->get()),
        ]);
    }

    public function pricelists()
    {
        return Inertia::render('Cms/PriceLists', [
            'priceLists' => Inertia::defer(fn () => LandingPriceList::query()->latest()->get()),
        ]);
    }

    public function legacy()
    {
        return Inertia::render('Cms/Index', [
            'articles' => Inertia::defer(fn () => LandingArticle::query()->latest()->get()),
            'galleries' => Inertia::defer(fn () => LandingGallery::query()->latest()->get()),
            'priceLists' => Inertia::defer(fn () => LandingPriceList::query()->latest()->get()),
        ]);
    }

    public function storeArticle(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_published' => 'nullable|boolean',
            'thumbnail' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($request->hasFile('thumbnail')) {
            $validated['thumbnail_path'] = $request->file('thumbnail')->store('landing/articles', 'public');
        }

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::lower(Str::random(6));
        $validated['is_published'] = (bool) ($validated['is_published'] ?? true);
        unset($validated['thumbnail']);

        LandingArticle::create($validated);

        return back()->with('success', 'Artikel landing page berhasil ditambahkan.');
    }

    public function destroyArticle(LandingArticle $article)
    {
        if ($article->thumbnail_path) {
            Storage::disk('public')->delete($article->thumbnail_path);
        }

        $article->delete();
        return back()->with('success', 'Artikel berhasil dihapus.');
    }

    public function updateArticle(Request $request, LandingArticle $article)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'sort_order' => 'nullable|integer|min:0',
            'is_published' => 'nullable|boolean',
            'thumbnail' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($request->hasFile('thumbnail')) {
            if ($article->thumbnail_path) {
                Storage::disk('public')->delete($article->thumbnail_path);
            }
            $validated['thumbnail_path'] = $request->file('thumbnail')->store('landing/articles', 'public');
        }

        if ($article->title !== $validated['title']) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . Str::lower(Str::random(6));
        }

        $validated['is_published'] = (bool) ($validated['is_published'] ?? false);
        unset($validated['thumbnail']);

        $article->update($validated);

        return back()->with('success', 'Artikel berhasil diperbarui.');
    }

    public function storeGallery(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'caption' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'image' => 'required|file|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $validated['image_path'] = $request->file('image')->store('landing/galleries', 'public');
        unset($validated['image']);

        LandingGallery::create($validated);

        return back()->with('success', 'Galeri berhasil ditambahkan.');
    }

    public function destroyGallery(LandingGallery $gallery)
    {
        if ($gallery->image_path) {
            Storage::disk('public')->delete($gallery->image_path);
        }

        $gallery->delete();
        return back()->with('success', 'Galeri berhasil dihapus.');
    }

    public function updateGallery(Request $request, LandingGallery $gallery)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'caption' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'image' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($gallery->image_path) {
                Storage::disk('public')->delete($gallery->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('landing/galleries', 'public');
        }

        unset($validated['image']);
        $gallery->update($validated);

        return back()->with('success', 'Galeri berhasil diperbarui.');
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

    public function destroyPriceList(LandingPriceList $priceList)
    {
        $priceList->delete();
        return back()->with('success', 'Pricelist berhasil dihapus.');
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
}
