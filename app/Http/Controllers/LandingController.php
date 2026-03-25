<?php

namespace App\Http\Controllers;

use App\Models\LandingArticle;
use App\Models\LandingGallery;
use App\Models\LandingPriceList;
use Inertia\Inertia;

class LandingController extends Controller
{
    public function index()
    {
        return Inertia::render('Landing/Index', [
            'articles' => Inertia::defer(fn () => LandingArticle::query()->where('is_published', true)->orderBy('sort_order')->latest()->take(6)->get()),
            'galleries' => Inertia::defer(fn () => LandingGallery::query()->orderBy('sort_order')->latest()->take(12)->get()),
            'priceLists' => Inertia::defer(fn () => LandingPriceList::query()->orderByDesc('is_featured')->orderBy('sort_order')->get()),
        ]);
    }
}
