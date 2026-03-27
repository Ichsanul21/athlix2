<?php

namespace Database\Seeders;

use App\Models\LandingArticle;
use App\Models\LandingGallery;
use App\Models\LandingPriceList;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LandingContentSeeder extends Seeder
{
    public function run(): void
    {
        $articles = [
            [
                'title' => 'ATHLIX untuk Operasional Dojo Harian',
                'excerpt' => 'Kelola database atlet, absensi, rapor, notifikasi, dan billing dalam satu alur kerja.',
                'content' => 'ATHLIX membantu dojo mengelola operasional harian dengan ritme kerja yang terstruktur dan mudah dipantau.',
            ],
            [
                'title' => 'Dynamic Billing untuk Administrasi yang Fleksibel',
                'excerpt' => 'Default iuran, override per atlet, approval queue, sampai invoice run bulanan.',
                'content' => 'Sistem billing dinamis membuat penyesuaian iuran lebih transparan tanpa mengorbankan akuntabilitas.',
            ],
            [
                'title' => 'PWA Atlet dan Sensei untuk Tatami',
                'excerpt' => 'Absensi QR, kondisi fisik, jadwal, dan notifikasi tetap jalan di mobile.',
                'content' => 'Akses modul PWA dirancang untuk kondisi lapangan dengan interaksi cepat dan data yang tetap sinkron.',
            ],
        ];

        foreach ($articles as $index => $article) {
            LandingArticle::query()->create([
                'title' => $article['title'],
                'slug' => Str::slug($article['title']) . '-' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'excerpt' => $article['excerpt'],
                'content' => $article['content'],
                'thumbnail_path' => SeedAssetsSeeder::ARTICLE_THUMB,
                'is_published' => true,
                'sort_order' => $index + 1,
            ]);
        }

        $galleries = [
            ['title' => 'Sesi Kihon Makassar', 'caption' => 'Evaluasi teknik dasar dan koreksi postur.'],
            ['title' => 'Kelas Prestasi Kumite', 'caption' => 'Drill tactical dan simulasi pertandingan.'],
            ['title' => 'Monitoring Kondisi Fisik', 'caption' => 'Pendataan fisik berkala untuk pembinaan aman.'],
            ['title' => 'Briefing Sensei', 'caption' => 'Sinkronisasi program latihan dan target mingguan.'],
        ];

        foreach ($galleries as $index => $gallery) {
            LandingGallery::query()->create([
                'title' => $gallery['title'],
                'caption' => $gallery['caption'],
                'image_path' => SeedAssetsSeeder::GALLERY_IMAGE,
                'sort_order' => $index + 1,
            ]);
        }

        $priceLists = [
            ['title' => 'Program Reguler', 'description' => 'Latihan mingguan untuk murid aktif.', 'price' => 225000, 'is_featured' => true],
            ['title' => 'Program Prestasi', 'description' => 'Fokus pembinaan atlet kompetisi.', 'price' => 325000, 'is_featured' => true],
            ['title' => 'Sesi Intensif', 'description' => 'Sesi privat untuk target tertentu.', 'price' => 500000, 'is_featured' => false],
        ];

        foreach ($priceLists as $index => $price) {
            LandingPriceList::query()->create([
                'title' => $price['title'],
                'description' => $price['description'],
                'price' => $price['price'],
                'currency' => 'IDR',
                'is_featured' => $price['is_featured'],
                'sort_order' => $index + 1,
            ]);
        }
    }
}
