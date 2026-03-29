<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('landing_articles', function (Blueprint $table) {
            if (! Schema::hasColumn('landing_articles', 'translation_key')) {
                $table->string('translation_key', 150)->nullable()->after('slug');
            }

            if (! Schema::hasColumn('landing_articles', 'preview_token')) {
                $table->string('preview_token', 64)->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'preview_token_expires_at')) {
                $table->timestamp('preview_token_expires_at')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'approval_notes')) {
                $table->text('approval_notes')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'reviewed_by')) {
                $table->unsignedBigInteger('reviewed_by')->nullable();
            }

            if (! Schema::hasColumn('landing_articles', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable();
            }
        });

        Schema::table('landing_galleries', function (Blueprint $table) {
            if (! Schema::hasColumn('landing_galleries', 'translation_key')) {
                $table->string('translation_key', 150)->nullable()->after('slug');
            }

            if (! Schema::hasColumn('landing_galleries', 'preview_token')) {
                $table->string('preview_token', 64)->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'preview_token_expires_at')) {
                $table->timestamp('preview_token_expires_at')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'approval_notes')) {
                $table->text('approval_notes')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'reviewed_by')) {
                $table->unsignedBigInteger('reviewed_by')->nullable();
            }

            if (! Schema::hasColumn('landing_galleries', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable();
            }
        });

        if (! $this->hasIndex('landing_articles', 'landing_articles_translation_key_locale_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->index(['translation_key', 'locale']);
            });
        }

        if (! $this->hasIndex('landing_articles', 'landing_articles_preview_token_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->index('preview_token');
            });
        }

        if (! $this->hasIndex('landing_galleries', 'landing_galleries_translation_key_locale_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->index(['translation_key', 'locale']);
            });
        }

        if (! $this->hasIndex('landing_galleries', 'landing_galleries_preview_token_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->index('preview_token');
            });
        }

        DB::table('landing_articles')->whereNull('translation_key')->update([
            'translation_key' => DB::raw('slug'),
        ]);

        DB::table('landing_galleries')->whereNull('translation_key')->update([
            'translation_key' => DB::raw('slug'),
        ]);

        if (! Schema::hasTable('landing_content_revisions')) {
            Schema::create('landing_content_revisions', function (Blueprint $table) {
                $table->id();
                $table->morphs('revisable');
                $table->string('action', 60);
                $table->string('change_summary', 500)->nullable();
                $table->json('changed_fields')->nullable();
                $table->json('snapshot_before')->nullable();
                $table->json('snapshot_after')->nullable();
                $table->text('approval_notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->string('actor_name')->nullable();
                $table->timestamp('created_at')->useCurrent();

                $table->index('created_by');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('landing_content_revisions')) {
            Schema::drop('landing_content_revisions');
        }

        if ($this->hasIndex('landing_galleries', 'landing_galleries_preview_token_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->dropIndex('landing_galleries_preview_token_index');
            });
        }

        if ($this->hasIndex('landing_galleries', 'landing_galleries_translation_key_locale_index')) {
            Schema::table('landing_galleries', function (Blueprint $table) {
                $table->dropIndex('landing_galleries_translation_key_locale_index');
            });
        }

        if ($this->hasIndex('landing_articles', 'landing_articles_preview_token_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->dropIndex('landing_articles_preview_token_index');
            });
        }

        if ($this->hasIndex('landing_articles', 'landing_articles_translation_key_locale_index')) {
            Schema::table('landing_articles', function (Blueprint $table) {
                $table->dropIndex('landing_articles_translation_key_locale_index');
            });
        }

        Schema::table('landing_galleries', function (Blueprint $table) {
            $columns = [
                'translation_key',
                'preview_token',
                'preview_token_expires_at',
                'approval_notes',
                'reviewed_by',
                'reviewed_at',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('landing_galleries', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('landing_articles', function (Blueprint $table) {
            $columns = [
                'translation_key',
                'preview_token',
                'preview_token_expires_at',
                'approval_notes',
                'reviewed_by',
                'reviewed_at',
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
