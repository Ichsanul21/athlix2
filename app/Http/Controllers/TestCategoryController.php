<?php

namespace App\Http\Controllers;

use App\Models\ReportCategory;
use App\Models\ReportSubCategory;
use App\Models\ReportTest;
use App\Models\TestLabel;
use App\Models\Dojo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestCategoryController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if ($user->isSuperAdmin()) {
            $dojos = Dojo::orderBy('name')->get(['id', 'name']);
            $selectedDojoId = (int) request('dojo_id', $dojos->first()?->id);
        } else {
            $dojos = [];
            $selectedDojoId = (int) $user->dojo_id;
        }

        $selectedLabelId = (int) request('label_id', 0);

        $labels = TestLabel::where('dojo_id', $selectedDojoId)
            ->orderBy('name')
            ->get();

        if ($selectedLabelId === 0 && $labels->isNotEmpty()) {
            $selectedLabelId = $labels->first()->id;
        }

        $categories = ReportCategory::where('dojo_id', $selectedDojoId)
            ->when($selectedLabelId > 0, fn($q) => $q->where('test_label_id', $selectedLabelId))
            ->when($selectedLabelId === 0, fn($q) => $q->whereNull('test_label_id'))
            ->with(['subCategories.tests'])
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('TestCategory/Index', [
            'dojos' => $dojos,
            'selectedDojoId' => $selectedDojoId,
            'labels' => $labels,
            'selectedLabelId' => $selectedLabelId,
            'categories' => $categories,
        ]);
    }

    public function storeCategory(Request $request)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'dojo_id' => 'required|integer|exists:dojos,id',
            'test_label_id' => 'required|integer|exists:test_labels,id',
        ]);

        $cat = ReportCategory::create($validated);

        return back()->with('success', "Kategori \"{$cat->name}\" berhasil ditambahkan.");
    }

    public function updateCategory(Request $request, ReportCategory $reportCategory)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate(['name' => 'required|string|max:100']);
        $reportCategory->update($validated);

        return back()->with('success', "Kategori \"{$validated['name']}\" berhasil diperbarui.");
    }

    public function destroyCategory(ReportCategory $reportCategory)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $name = $reportCategory->name;
        $reportCategory->delete();

        return back()->with('success', "Kategori \"{$name}\" berhasil dihapus.");
    }

    public function storeSubCategory(Request $request)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate([
            'report_category_id' => 'required|integer|exists:report_categories,id',
            'name' => 'required|string|max:100',
        ]);

        ReportSubCategory::create($validated);

        return back()->with('success', "Sub-kategori \"{$validated['name']}\" berhasil ditambahkan.");
    }

    public function updateSubCategory(Request $request, ReportSubCategory $reportSubCategory)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate(['name' => 'required|string|max:100']);
        $reportSubCategory->update($validated);

        return back()->with('success', "Sub-kategori \"{$validated['name']}\" berhasil diperbarui.");
    }

    public function destroySubCategory(ReportSubCategory $reportSubCategory)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $name = $reportSubCategory->name;
        $reportSubCategory->delete();

        return back()->with('success', "Sub-kategori \"{$name}\" berhasil dihapus.");
    }

    public function storeTest(Request $request)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate([
            'report_sub_category_id' => 'required|integer|exists:report_sub_categories,id',
            'name' => 'required|string|max:100',
            'unit' => 'required|in:duration,repetition,distance',
            'min_threshold' => 'required|numeric|min:0',
            'max_threshold' => 'required|numeric|min:0|gt:min_threshold',
            'max_duration_seconds' => 'nullable|integer|min:1',
        ]);

        ReportTest::create($validated);

        return back()->with('success', "Test \"{$validated['name']}\" berhasil ditambahkan.");
    }

    public function updateTest(Request $request, ReportTest $reportTest)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'unit' => 'required|in:duration,repetition,distance',
            'min_threshold' => 'required|numeric|min:0',
            'max_threshold' => 'required|numeric|min:0|gt:min_threshold',
            'max_duration_seconds' => 'nullable|integer|min:1',
        ]);

        $reportTest->update($validated);

        return back()->with('success', "Test \"{$validated['name']}\" berhasil diperbarui.");
    }

    public function destroyTest(ReportTest $reportTest)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $name = $reportTest->name;
        $reportTest->delete();

        return back()->with('success', "Test \"{$name}\" berhasil dihapus.");
    }
    public function storeLabel(Request $request)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'dojo_id' => 'required|integer|exists:dojos,id',
        ]);

        $label = TestLabel::create($validated);

        return back()->with('success', "Label \"{$label->name}\" berhasil ditambahkan.");
    }

    public function updateLabel(Request $request, TestLabel $testLabel)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $validated = $request->validate(['name' => 'required|string|max:100']);
        $testLabel->update($validated);

        return back()->with('success', "Label \"{$testLabel->name}\" berhasil diperbarui.");
    }

    public function destroyLabel(TestLabel $testLabel)
    {
        $user = auth()->user();
        if (! $user?->isCoachGroup()) abort(403);

        $name = $testLabel->name;
        $testLabel->delete();

        return back()->with('success', "Label \"{$name}\" berhasil dihapus.");
    }
}
