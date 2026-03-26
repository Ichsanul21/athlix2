<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Localization\TranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocalizationController extends Controller
{
    public function __construct(
        private readonly TranslationService $translationService
    ) {
    }

    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => ['nullable', Rule::in(['id', 'en'])],
            'target' => ['nullable', Rule::in(['id', 'en'])],
            'texts' => ['required', 'array', 'min:1', 'max:80'],
            'texts.*' => ['required', 'string', 'max:500'],
        ]);

        $source = $validated['source'] ?? 'id';
        $target = $validated['target'] ?? 'en';
        $texts = array_values(array_unique(array_map(static fn ($item) => trim((string) $item), $validated['texts'])));

        $translations = $this->translationService->translateBatch($texts, $source, $target);

        return response()->json([
            'source' => $source,
            'target' => $target,
            'translations' => $translations,
        ]);
    }
}

