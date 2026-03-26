import { useLanguage } from '@/Components/LanguageProvider';

function IndonesiaFlag() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 rounded-full border border-neutral-200" aria-hidden="true">
            <rect x="0" y="0" width="24" height="12" fill="#DC2626" />
            <rect x="0" y="12" width="24" height="12" fill="#FFFFFF" />
        </svg>
    );
}

function UsFlag() {
    return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 rounded-full border border-neutral-200" aria-hidden="true">
            <rect width="24" height="24" fill="#FFFFFF" />
            <rect y="0" width="24" height="2" fill="#DC2626" />
            <rect y="4" width="24" height="2" fill="#DC2626" />
            <rect y="8" width="24" height="2" fill="#DC2626" />
            <rect y="12" width="24" height="2" fill="#DC2626" />
            <rect y="16" width="24" height="2" fill="#DC2626" />
            <rect y="20" width="24" height="2" fill="#DC2626" />
            <rect x="0" y="0" width="10" height="10" fill="#1D4ED8" />
        </svg>
    );
}

const OPTIONS = [
    { value: 'id', label: 'ID', icon: IndonesiaFlag },
    { value: 'en', label: 'EN', icon: UsFlag },
];

export default function LanguageSwitch({ compact = false }) {
    const { locale, setLocale } = useLanguage();

    return (
        <div className={`inline-flex items-center rounded-xl border border-neutral-200 bg-white p-1 shadow-sm ${compact ? '' : 'gap-1'}`}>
            {OPTIONS.map((option) => {
                const active = locale === option.value;
                const FlagIcon = option.icon;

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setLocale(option.value)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-black tracking-wide transition-all ${
                            active ? 'bg-athlix-red text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                        aria-label={option.value === 'id' ? 'Bahasa Indonesia' : 'English'}
                        title={option.value === 'id' ? 'Bahasa Indonesia' : 'English'}
                    >
                        <FlagIcon />
                        <span>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
