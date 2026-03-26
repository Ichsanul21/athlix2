<?php

namespace App\Services\Localization;

use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TranslationService
{
    /**
     * @param  array<int, string>  $texts
     * @return array<string, string>
     */
    public function translateBatch(array $texts, string $source = 'id', string $target = 'en'): array
    {
        $result = [];
        $missing = [];

        foreach ($texts as $text) {
            $clean = trim((string) $text);
            if ($clean === '') {
                continue;
            }

            if (isset($result[$clean])) {
                continue;
            }

            if ($source === $target) {
                $result[$clean] = $clean;
                continue;
            }

            $cacheKey = sprintf('translation.%s.%s.%s', $source, $target, md5($clean));
            $cached = Cache::get($cacheKey);
            if (is_string($cached) && $cached !== '') {
                $result[$clean] = $cached;
                continue;
            }

            $missing[$clean] = $cacheKey;
        }

        if (! empty($missing)) {
            $responses = Http::pool(function (Pool $pool) use ($missing, $source, $target) {
                $requests = [];
                foreach (array_keys($missing) as $text) {
                    $requests[$text] = $pool
                        ->as($text)
                        ->timeout(10)
                        ->retry(1, 200)
                        ->get('https://translate.googleapis.com/translate_a/single', [
                            'client' => 'gtx',
                            'sl' => $source,
                            'tl' => $target,
                            'dt' => 't',
                            'q' => $text,
                        ]);
                }

                return $requests;
            });

            foreach ($missing as $text => $cacheKey) {
                $response = $responses[$text] ?? null;
                $translated = '';
                if ($response && $response->successful()) {
                    $translated = $this->parseGoogleTranslateResponse($response->json());
                }

                $translated = $translated !== '' ? $translated : $text;
                $result[$text] = $translated;
                Cache::put($cacheKey, $translated, now()->addDays(30));
            }
        }

        return $result;
    }

    public function translateSingle(string $text, string $source = 'id', string $target = 'en'): string
    {
        $clean = trim($text);
        if ($clean === '' || $source === $target) {
            return $clean;
        }

        $cacheKey = sprintf('translation.%s.%s.%s', $source, $target, md5($clean));

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($clean, $source, $target) {
            $response = Http::timeout(10)
                ->retry(1, 200)
                ->get('https://translate.googleapis.com/translate_a/single', [
                    'client' => 'gtx',
                    'sl' => $source,
                    'tl' => $target,
                    'dt' => 't',
                    'q' => $clean,
                ]);

            if (! $response->successful()) {
                return $clean;
            }

            $translated = $this->parseGoogleTranslateResponse($response->json());

            return $translated !== '' ? $translated : $clean;
        });
    }

    /**
     * @param  mixed  $payload
     */
    private function parseGoogleTranslateResponse($payload): string
    {
        if (! is_array($payload) || ! isset($payload[0]) || ! is_array($payload[0])) {
            return '';
        }

        $chunks = [];
        foreach ($payload[0] as $segment) {
            if (is_array($segment) && isset($segment[0]) && is_string($segment[0])) {
                $chunks[] = $segment[0];
            }
        }

        return trim(implode('', $chunks));
    }
}
