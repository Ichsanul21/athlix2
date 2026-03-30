<?php

namespace Database\Seeders;

use App\Models\LandingArticle;
use App\Models\LandingGallery;
use App\Models\LandingPriceList;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class LandingContentSeeder extends Seeder
{
    public function run(): void
    {
        $articles = [
            [
                'title' => 'Blueprint Operasional Dojo Modern dengan ATHLIX',
                'category' => 'Operasional',
                'author_name' => 'Tim Produk ATHLIX',
                'reading_time' => 7,
                'excerpt' => 'Cara standardisasi absensi, rapor, dan billing agar manajemen dojo tetap rapi saat jumlah atlet bertambah.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1612182062966-c8f88b7df6d5?auto=format&fit=crop&w=1200&q=80',
                'content' => '<p>Dojo yang tumbuh cepat membutuhkan ritme administrasi yang stabil. ATHLIX membantu menyatukan data atlet, progres latihan, dan penagihan dalam satu alur kerja.</p><p>Dengan workflow yang konsisten, sensei bisa fokus ke pembinaan teknik tanpa terganggu urusan input berulang.</p><h3>Poin Utama</h3><ul><li>Database atlet terpusat</li><li>Rapor historis per periode latihan</li><li>Penyesuaian nominal SPP berbasis role</li></ul>',
                'tags' => ['dojo', 'operasional', 'manajemen'],
                'seo_description' => 'Panduan operasional dojo modern menggunakan ATHLIX dari absensi hingga billing.',
                'is_featured' => true,
                'publish_at' => Carbon::now()->subDays(21),
            ],
            [
                'title' => 'Menata Program Latihan Mingguan Agar Mudah Dibaca Pelatih',
                'category' => 'Pelatihan',
                'author_name' => 'Lead Coach ATHLIX',
                'reading_time' => 5,
                'excerpt' => 'Gunakan struktur agenda yang jelas supaya transisi antar sesi teknik, fisik, dan evaluasi berjalan efektif.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
                'content' => '<p>Setiap program latihan sebaiknya memiliki blok agenda yang spesifik: pemanasan, teknik, simulasi, pendinginan, dan review.</p><p>Di ATHLIX, tiap aktivitas bisa dibuka sebagai accordion detail sehingga pelatih dan orang tua mudah memahami isi sesi.</p>',
                'tags' => ['program', 'pelatih', 'jadwal'],
                'seo_description' => 'Strategi menyusun program latihan mingguan yang jelas dan efektif di ATHLIX.',
                'is_featured' => true,
                'publish_at' => Carbon::now()->subDays(17),
            ],
            [
                'title' => 'Rapor Historis Atlet: Dari Data Menjadi Keputusan Latihan',
                'category' => 'Sports Science',
                'author_name' => 'Performance Analyst ATHLIX',
                'reading_time' => 6,
                'excerpt' => 'Rapor historis membantu sensei melihat tren performa, bukan sekadar skor satu sesi.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
                'content' => '<p>Data historis memberi konteks terhadap naik-turun performa atlet. Dengan tampilan kronologis, evaluasi jadi lebih objektif.</p><p>Pelatih dapat membandingkan stamina, kecepatan, dan kelincahan per periode tanpa kehilangan catatan lama.</p>',
                'tags' => ['rapor', 'analitik', 'atlet'],
                'seo_description' => 'Manfaat rapor historis atlet untuk evaluasi performa jangka menengah dan panjang.',
                'is_featured' => false,
                'publish_at' => Carbon::now()->subDays(14),
            ],
            [
                'title' => 'Skema Penyesuaian Nominal SPP Tanpa Approval Berlapis',
                'category' => 'Keuangan',
                'author_name' => 'Finance Ops ATHLIX',
                'reading_time' => 4,
                'excerpt' => 'Sensei dapat menyesuaikan nominal SPP langsung dari menu pembayaran sesuai kebijakan dojo.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
                'content' => '<p>Dalam kondisi tertentu, nominal SPP perlu diubah cepat. ATHLIX menyediakan alur direct update dengan audit log agar keputusan tetap akuntabel.</p><p>Setiap perubahan menyimpan nilai lama, nilai baru, dan alasan penyesuaian.</p>',
                'tags' => ['billing', 'spp', 'finance'],
                'seo_description' => 'Fitur penyesuaian nominal SPP langsung di ATHLIX dengan audit log terstruktur.',
                'is_featured' => false,
                'publish_at' => Carbon::now()->subDays(11),
            ],
            [
                'title' => 'Standar Posting Internasional untuk CMS Dojo',
                'category' => 'CMS',
                'author_name' => 'Editorial ATHLIX',
                'reading_time' => 8,
                'excerpt' => 'Mulai dari SEO metadata, canonical URL, hingga social card untuk artikel dan galeri.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
                'content' => '<p>CMS ATHLIX mendukung praktik editorial modern: title SEO, meta description, keyword, OG image, preview token, dan revision history.</p><p>Ini memudahkan tim konten menjaga kualitas publikasi lintas kanal.</p>',
                'tags' => ['cms', 'seo', 'konten'],
                'seo_description' => 'Standar posting internasional pada CMS ATHLIX untuk artikel dan galeri.',
                'is_featured' => false,
                'publish_at' => Carbon::now()->subDays(8),
            ],
            [
                'title' => 'Meningkatkan Engagement Orang Tua Lewat Update Visual Latihan',
                'category' => 'Komunikasi',
                'author_name' => 'Community ATHLIX',
                'reading_time' => 5,
                'excerpt' => 'Galeri foto dan video latihan membuat komunikasi progres atlet lebih transparan.',
                'thumbnail_path' => 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
                'content' => '<p>Dokumentasi visual yang rapi membantu orang tua memahami proses latihan, bukan hanya hasil akhir kompetisi.</p><p>Dengan galeri berbasis foto dan video, update dojo terasa lebih hidup dan kredibel.</p>',
                'tags' => ['galeri', 'orang-tua', 'komunikasi'],
                'seo_description' => 'Cara meningkatkan engagement orang tua melalui galeri foto dan video latihan dojo.',
                'is_featured' => true,
                'publish_at' => Carbon::now()->subDays(5),
            ],
        ];

        foreach ($articles as $index => $article) {
            $slug = Str::slug($article['title']);

            LandingArticle::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $article['title'],
                    'translation_key' => $slug,
                    'excerpt' => $article['excerpt'],
                    'content' => $article['content'],
                    'thumbnail_path' => $article['thumbnail_path'],
                    'thumbnail_alt' => $article['title'],
                    'status' => 'published',
                    'is_published' => true,
                    'is_featured' => $article['is_featured'],
                    'publish_at' => $article['publish_at'],
                    'locale' => 'id-ID',
                    'category' => $article['category'],
                    'tags' => $article['tags'],
                    'author_name' => $article['author_name'],
                    'reading_time' => $article['reading_time'],
                    'meta_robots' => 'index,follow',
                    'seo_title' => Str::limit($article['title'] . ' | ATHLIX', 70, ''),
                    'seo_description' => $article['seo_description'],
                    'seo_keywords' => implode(', ', $article['tags']),
                    'og_title' => Str::limit($article['title'], 95, ''),
                    'og_description' => Str::limit($article['seo_description'], 200, ''),
                    'og_image_path' => $article['thumbnail_path'],
                    'sort_order' => $index + 1,
                ]
            );
        }

        $galleries = [
            [
                'title' => 'Morning Drill Kihon - Batch Pemula',
                'media_type' => 'image',
                'caption' => 'Latihan dasar kuda-kuda dan pukulan untuk atlet baru.',
                'description' => 'Sesi fundamental dengan fokus pada postur dan ritme gerak.',
                'category' => 'Training Session',
                'image_path' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
                'video_url' => null,
                'location' => 'Dojo Makassar Utara',
                'photographer_name' => 'ATHLIX Media Team',
                'publish_at' => Carbon::now()->subDays(16),
                'is_featured' => true,
            ],
            [
                'title' => 'Reaction Sparring Session',
                'media_type' => 'video',
                'caption' => 'Drill reaksi cepat antar atlet intermediate.',
                'description' => 'Video dokumentasi sesi reaction sparring dengan pengawasan sensei.',
                'category' => 'Sparring',
                'image_path' => 'https://images.unsplash.com/photo-1544717305-996b815c338c?auto=format&fit=crop&w=1200&q=80',
                'video_url' => 'https://cdn.coverr.co/videos/coverr-boxing-practice-1579/1080p.mp4',
                'location' => 'Dojo Makassar Tengah',
                'photographer_name' => 'ATHLIX Media Team',
                'publish_at' => Carbon::now()->subDays(14),
                'is_featured' => true,
            ],
            [
                'title' => 'Evaluasi Rapor Bulanan Atlet',
                'media_type' => 'image',
                'caption' => 'Sesi review performa fisik dan teknik per atlet.',
                'description' => 'Dokumentasi rapat pelatih saat evaluasi data rapor historis.',
                'category' => 'Evaluation',
                'image_path' => 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
                'video_url' => null,
                'location' => 'ATHLIX Performance Room',
                'photographer_name' => 'ATHLIX Analyst',
                'publish_at' => Carbon::now()->subDays(12),
                'is_featured' => false,
            ],
            [
                'title' => 'Conditioning Camp Highlights',
                'media_type' => 'video',
                'caption' => 'Highlight conditioning camp akhir pekan.',
                'description' => 'Ringkasan video latihan daya tahan dan agility.',
                'category' => 'Conditioning',
                'image_path' => 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1200&q=80',
                'video_url' => 'https://cdn.coverr.co/videos/coverr-training-with-a-punching-bag-4969/1080p.mp4',
                'location' => 'Outdoor Dojo Arena',
                'photographer_name' => 'ATHLIX Visual',
                'publish_at' => Carbon::now()->subDays(10),
                'is_featured' => true,
            ],
            [
                'title' => 'Podium Prestasi Kejuaraan Regional',
                'media_type' => 'image',
                'caption' => 'Momen podium atlet dojo pada kejuaraan regional.',
                'description' => 'Dokumentasi selebrasi dan penyerahan medali.',
                'category' => 'Competition',
                'image_path' => 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
                'video_url' => null,
                'location' => 'GOR Sulawesi Selatan',
                'photographer_name' => 'ATHLIX Event Team',
                'publish_at' => Carbon::now()->subDays(7),
                'is_featured' => true,
            ],
            [
                'title' => 'Dojo Community Day',
                'media_type' => 'video',
                'caption' => 'Kegiatan komunitas dojo bersama orang tua atlet.',
                'description' => 'Video suasana community day dan sesi coaching clinic.',
                'category' => 'Community',
                'image_path' => 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
                'video_url' => 'https://cdn.coverr.co/videos/coverr-group-of-people-jogging-1576/1080p.mp4',
                'location' => 'ATHLIX Community Hall',
                'photographer_name' => 'ATHLIX Community Team',
                'publish_at' => Carbon::now()->subDays(3),
                'is_featured' => true,
            ],
        ];

        foreach ($galleries as $index => $gallery) {
            $slug = Str::slug($gallery['title']);

            LandingGallery::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $gallery['title'],
                    'translation_key' => $slug,
                    'media_type' => $gallery['media_type'],
                    'caption' => $gallery['caption'],
                    'description' => $gallery['description'],
                    'category' => $gallery['category'],
                    'tags' => [Str::slug($gallery['category']), 'athlix', 'dojo'],
                    'photographer_name' => $gallery['photographer_name'],
                    'location' => $gallery['location'],
                    'image_path' => $gallery['image_path'],
                    'video_url' => $gallery['video_url'],
                    'image_alt' => $gallery['title'],
                    'status' => 'published',
                    'is_featured' => $gallery['is_featured'],
                    'publish_at' => $gallery['publish_at'],
                    'locale' => 'id-ID',
                    'meta_robots' => 'index,follow',
                    'seo_title' => Str::limit($gallery['title'] . ' | Galeri ATHLIX', 70, ''),
                    'seo_description' => Str::limit($gallery['description'], 170, ''),
                    'seo_keywords' => 'galeri dojo, latihan atlet, video latihan, athlix',
                    'og_title' => Str::limit($gallery['title'], 95, ''),
                    'og_description' => Str::limit($gallery['description'], 200, ''),
                    'og_image_path' => $gallery['image_path'],
                    'sort_order' => $index + 1,
                ]
            );
        }

        $priceLists = [
            ['title' => 'Program Reguler', 'description' => 'Latihan mingguan untuk atlet aktif.', 'price' => 225000, 'is_featured' => true],
            ['title' => 'Program Prestasi', 'description' => 'Fokus pembinaan atlet kompetisi.', 'price' => 325000, 'is_featured' => true],
            ['title' => 'Sesi Intensif', 'description' => 'Sesi privat untuk target tertentu.', 'price' => 500000, 'is_featured' => false],
        ];

        foreach ($priceLists as $index => $price) {
            LandingPriceList::query()->updateOrCreate(
                ['title' => $price['title']],
                [
                    'description' => $price['description'],
                    'price' => $price['price'],
                    'currency' => 'IDR',
                    'is_featured' => $price['is_featured'],
                    'sort_order' => $index + 1,
                ]
            );
        }
    }
}

