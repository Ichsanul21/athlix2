<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('landing_articles', function (Blueprint $table) {
            if (! Schema::hasColumn('landing_articles', 'status')) {
                $table->string('status', 20)->default('published');
            }

            if (! Schema::hasColumn('landing_articles', 'category')) {
                $table->string('category')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'tags')) {
                $table->json('tags')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'locale')) {
                $table->string('locale', 10)->default('id-ID');
            }

            if (! Schema::hasColumn('landing_articles', 'author_name')) {
                $table->string('author_name')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'reading_time')) {
                $table->unsignedTinyInteger('reading_time')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'is_featured')) {
                $table->boolean('is_featured')->default(false);
            }

            if (! Schema::hasColumn('landing_articles', 'publish_at')) {
                $table->timestamp('publish_at')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'thumbnail_alt')) {
                $table->string('thumbnail_alt')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'canonical_url')) {
                $table->string('canonical_url')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'seo_title')) {
                $table->string('seo_title', 70)->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'seo_description')) {
                $table->string('seo_description', 170)->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'seo_keywords')) {
                $table->string('seo_keywords')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'meta_robots')) {
                $table->string('meta_robots', 30)->default('index,follow');
            }

            if (! Schema::hasColumn('landing_articles', 'og_title')) {
                $table->string('og_title', 95)->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'og_description')) {
                $table->string('og_description', 200)->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'og_image_path')) {
                $table->string('og_image_path')->nullable();
            }
        });

        if (! $this->hasIndex('landing_articles', 'landing_articles_status_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->index('status');
            });
        }

        if (! $this->hasIndex('landing_articles', 'landing_articles_publish_at_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->index('publish_at');
            });
        }

        DB::table('landing_articles')->where('is_published', true)->update(['status' => 'published']);
        DB::table('landing_articles')->where('is_published', false)->update(['status' => 'draft']);
        DB::table('landing_articles')
            ->where('is_published', true)
            ->whereNull('publish_at')
            ->update(['publish_at' => DB::raw('created_at')]);
        DB::table('landing_articles')->whereNull('locale')->update(['locale' => 'id-ID']);
        DB::table('landing_articles')->whereNull('meta_robots')->update(['meta_robots' => 'index,follow']);

        Schema::table('landing_galleries', function (Blueprint $table) {
            if (! Schema::hasColumn('landing_galleries', 'slug')) {
                $table->string('slug')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'description')) {
                $table->text('description')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'image_alt')) {
                $table->string('image_alt')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'category')) {
                $table->string('category')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'tags')) {
                $table->json('tags')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'locale')) {
                $table->string('locale', 10)->default('id-ID');
            }

            if (! Schema::hasColumn('landing_galleries', 'photographer_name')) {
                $table->string('photographer_name')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'location')) {
                $table->string('location')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'captured_at')) {
                $table->timestamp('captured_at')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'status')) {
                $table->string('status', 20)->default('published');
            }

            if (! Schema::hasColumn('landing_galleries', 'is_featured')) {
                $table->boolean('is_featured')->default(false);
            }

            if (! Schema::hasColumn('landing_galleries', 'publish_at')) {
                $table->timestamp('publish_at')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'canonical_url')) {
                $table->string('canonical_url')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'seo_title')) {
                $table->string('seo_title', 70)->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'seo_description')) {
                $table->string('seo_description', 170)->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'seo_keywords')) {
                $table->string('seo_keywords')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'meta_robots')) {
                $table->string('meta_robots', 30)->default('index,follow');
            }

            if (! Schema::hasColumn('landing_galleries', 'og_title')) {
                $table->string('og_title', 95)->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'og_description')) {
                $table->string('og_description', 200)->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'og_image_path')) {
                $table->string('og_image_path')->nullable();
            }
        });

        if (! $this->hasIndex('landing_galleries', 'landing_galleries_status_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->index('status');
            });
        }

        if (! $this->hasIndex('landing_galleries', 'landing_galleries_publish_at_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->index('publish_at');
            });
        }

        $usedSlugs = [];
        $galleries = DB::table('landing_galleries')
            ->select(['id', 'title', 'slug', 'created_at'])
            ->orderBy('id')
            ->get();

        foreach ($galleries as $gallery) {
            $base = Str::slug((string) ($gallery->slug ?: $gallery->title));
            if ($base === '') {
                $base = 'gallery-' . $gallery->id;
            }

            $slug = $base;
            $suffix = 2;
            while (in_array($slug, $usedSlugs, true) || DB::table('landing_galleries')->where('slug', $slug)->where('id', '!=', $gallery->id)->exists()) {
                $slug = $base . '-' . $suffix;
                $suffix++;
            }

            $usedSlugs[] = $slug;

            DB::table('landing_galleries')
                ->where('id', $gallery->id)
                ->update([
                    'slug' => $slug,
                    'status' => 'published',
                    'publish_at' => $gallery->created_at,
                    'locale' => 'id-ID',
                    'meta_robots' => 'index,follow',
                ]);
        }

        if (! $this->hasIndex('landing_galleries', 'landing_galleries_slug_unique')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->unique('slug');
            });
        }
    }

    public function down(): void
    {
        if ($this->hasIndex('landing_galleries', 'landing_galleries_slug_unique')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->dropUnique('landing_galleries_slug_unique');
            });
        }

        if ($this->hasIndex('landing_galleries', 'landing_galleries_publish_at_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->dropIndex('landing_galleries_publish_at_index');
            });
        }

        if ($this->hasIndex('landing_galleries', 'landing_galleries_status_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->dropIndex('landing_galleries_status_index');
            });
        }

        Schema::table('landing_galleries', function (Blueprint $table) {
            $columns = [
                'slug',
                'description',
                'image_alt',
                'category',
                'tags',
                'locale',
                'photographer_name',
                'location',
                'captured_at',
                'status',
                'is_featured',
                'publish_at',
                'canonical_url',
                'seo_title',
                'seo_description',
                'seo_keywords',
                'meta_robots',
                'og_title',
                'og_description',
                'og_image_path',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('landing_galleries', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        if ($this->hasIndex('landing_articles', 'landing_articles_publish_at_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->dropIndex('landing_articles_publish_at_index');
            });
        }

        if ($this->hasIndex('landing_articles', 'landing_articles_status_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->dropIndex('landing_articles_status_index');
            });
        }

        Schema::table('landing_articles', function (Blueprint $table) {
            $columns = [
                'status',
                'category',
                'tags',
                'locale',
                'author_name',
                'reading_time',
                'is_featured',
                'publish_at',
                'thumbnail_alt',
                'canonical_url',
                'seo_title',
                'seo_description',
                'seo_keywords',
                'meta_robots',
                'og_title',
                'og_description',
                'og_image_path',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('landing_articles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        $driver = DB::getDriverName();

        return match ($driver) {
            'sqlite' => collect(DB::select("PRAGMA index_list('{$table}')"))
                ->contains(fn ($row) => ($row->name ?? null) === $index),
            'mysql' => ! empty(DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$index])),
            'pgsql' => ! empty(DB::select("SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname = ?", [$table, $index])),
            default => false,
        };
    }
};
