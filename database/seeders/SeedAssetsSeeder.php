<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class SeedAssetsSeeder extends Seeder
{
    public const PROFILE_PHOTO = 'seed/profile-placeholder.svg';
    public const ATHLETE_PHOTO = 'seed/athlete-placeholder.svg';
    public const ARTICLE_THUMB = 'seed/article-placeholder.svg';
    public const GALLERY_IMAGE = 'seed/gallery-placeholder.svg';
    public const CERTIFICATE = 'seed/certificate-placeholder.svg';
    public const IDENTITY_DOCUMENT = 'seed/identity-placeholder.svg';
    public const ABSENCE_DOCUMENT = 'attendance-documents/seed-absence-placeholder.pdf';

    public function run(): void
    {
        Storage::disk('public')->put(self::PROFILE_PHOTO, $this->buildPlaceholderSvg('ATHLIX PROFILE', '#1F2937', '#F8FAFC'));
        Storage::disk('public')->put(self::ATHLETE_PHOTO, $this->buildPlaceholderSvg('ATHLIX ATHLETE', '#991B1B', '#F8FAFC'));
        Storage::disk('public')->put(self::ARTICLE_THUMB, $this->buildPlaceholderSvg('ATHLIX ARTICLE', '#B91C1C', '#F8FAFC'));
        Storage::disk('public')->put(self::GALLERY_IMAGE, $this->buildPlaceholderSvg('ATHLIX GALLERY', '#0F766E', '#F8FAFC'));
        Storage::disk('public')->put(self::CERTIFICATE, $this->buildPlaceholderSvg('ATHLIX CERTIFICATE', '#111827', '#F8FAFC'));
        Storage::disk('public')->put(self::IDENTITY_DOCUMENT, $this->buildPlaceholderSvg('ATHLIX DOCUMENT', '#1D4ED8', '#F8FAFC'));
        Storage::disk('public')->put(self::ABSENCE_DOCUMENT, $this->buildPlaceholderPdf());
    }

    private function buildPlaceholderSvg(string $label, string $background, string $foreground): string
    {
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 628" width="1200" height="628">
  <rect width="1200" height="628" fill="{$background}" />
  <g fill="{$foreground}" font-family="Arial, sans-serif">
    <text x="80" y="220" font-size="72" font-weight="700">{$label}</text>
    <text x="80" y="290" font-size="36" opacity="0.9">ATHLIX Seed Asset</text>
    <text x="80" y="360" font-size="28" opacity="0.75">Digunakan untuk simulasi data lokal dan production demo</text>
  </g>
</svg>
SVG;
    }

    private function buildPlaceholderPdf(): string
    {
        return "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 64>>stream\nBT /F1 12 Tf 24 90 Td (ATHLIX Absence Document Placeholder) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000243 00000 n \n0000000360 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n430\n%%EOF";
    }
}
