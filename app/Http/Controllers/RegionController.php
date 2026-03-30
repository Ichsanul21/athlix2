<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class RegionController extends Controller
{
    private const BASE_URL = 'https://wilayah.id/api';
    private const CACHE_TTL = 86400; // 24 hours

    public function provinces(): JsonResponse
    {
        $data = Cache::remember('wilayah:provinces', self::CACHE_TTL, function () {
            $response = Http::timeout(10)->get(self::BASE_URL . '/provinces.json');
            return $response->successful() ? $response->json('data', []) : [];
        });

        return response()->json($data);
    }

    public function regencies(string $provinceCode): JsonResponse
    {
        $data = Cache::remember("wilayah:regencies:{$provinceCode}", self::CACHE_TTL, function () use ($provinceCode) {
            $response = Http::timeout(10)->get(self::BASE_URL . "/regencies/{$provinceCode}.json");
            return $response->successful() ? $response->json('data', []) : [];
        });

        return response()->json($data);
    }

    public function districts(string $regencyCode): JsonResponse
    {
        $data = Cache::remember("wilayah:districts:{$regencyCode}", self::CACHE_TTL, function () use ($regencyCode) {
            $response = Http::timeout(10)->get(self::BASE_URL . "/districts/{$regencyCode}.json");
            return $response->successful() ? $response->json('data', []) : [];
        });

        return response()->json($data);
    }

    public function villages(string $districtCode): JsonResponse
    {
        $data = Cache::remember("wilayah:villages:{$districtCode}", self::CACHE_TTL, function () use ($districtCode) {
            $response = Http::timeout(10)->get(self::BASE_URL . "/villages/{$districtCode}.json");
            return $response->successful() ? $response->json('data', []) : [];
        });

        return response()->json($data);
    }
}
