import React, { useState } from 'react';
import InputError from '@/Components/InputError';
import { cn } from '@/lib/utils';

/**
 * FileInput Component with built-in size validation.
 * Default max size is 5MB.
 */
export default function FileInput({ 
    onChange, 
    className, 
    error, 
    maxSizeMB = 5, 
    accept = "image/*", 
    id, 
    ...props 
}) {
    const [localError, setLocalError] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        
        if (file) {
            const sizeInMB = file.size / (1024 * 1024);
            if (sizeInMB > maxSizeMB) {
                const errorMessage = `Ukuran file (${sizeInMB.toFixed(2)}MB) melebihi batas maksimal ${maxSizeMB}MB.`;
                setLocalError(errorMessage);
                // Reset input value so the same file can't be selected again without trigger
                e.target.value = '';
                if (onChange) onChange(null);
                return;
            }
        }
        
        setLocalError(null);
        if (onChange) {
            // We pass the file itself or null, making it easier for useForm
            onChange(file);
        }
    };

    return (
        <div className="w-full space-y-1">
            <input
                id={id}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className={cn(
                    "flex w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-background",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:cursor-pointer",
                    "placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-athlix-red/30 focus-visible:border-athlix-red/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-500 dark:focus-visible:ring-athlix-red/20 dark:focus-visible:border-athlix-red/40",
                    "transition-all duration-300",
                    (localError || error) ? "border-red-500 dark:border-red-500/50" : "",
                    className
                )}
                {...props}
            />
            <InputError message={localError || error} />
        </div>
    );
}
