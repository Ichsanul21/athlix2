import React, { useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export default function GlobalFlashModal() {
    const { flash } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [alertData, setAlertData] = useState({ type: 'info', message: '' });

    useEffect(() => {
        if (flash?.success) {
            setAlertData({ type: 'success', message: flash.success });
            setIsOpen(true);
        } else if (flash?.error) {
            setAlertData({ type: 'error', message: flash.error });
            setIsOpen(true);
        } else if (flash?.warning) {
            setAlertData({ type: 'warning', message: flash.warning });
            setIsOpen(true);
        } else if (flash?.info) {
            setAlertData({ type: 'info', message: flash.info });
            setIsOpen(true);
        }
    }, [flash]);

    const handleClose = () => {
        setIsOpen(false);
        // We might want to clear flash messages in the session if we don't want them reappearing on back/forward
        // However, inertia clears them automatically on next visit usually.
    };

    const config = {
        success: {
            icon: <CheckCircle2 size={42} className="text-emerald-500" />,
            bgWrapper: 'bg-emerald-50 dark:bg-emerald-500/10',
            btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            title: 'Berhasil!'
        },
        error: {
            icon: <XCircle size={42} className="text-red-500" />,
            bgWrapper: 'bg-red-50 dark:bg-red-500/10',
            btnClass: 'bg-red-600 hover:bg-red-700 text-white',
            title: 'Terjadi Kesalahan!'
        },
        warning: {
            icon: <AlertCircle size={42} className="text-amber-500" />,
            bgWrapper: 'bg-amber-50 dark:bg-amber-500/10',
            btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
            title: 'Peringatan'
        },
        info: {
            icon: <Info size={42} className="text-blue-500" />,
            bgWrapper: 'bg-blue-50 dark:bg-blue-500/10',
            btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
            title: 'Informasi'
        }
    };

    const activeConfig = config[alertData.type] || config.info;

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="sm">
            <div className="p-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-2">
                    <div className={`p-3 rounded-full ${activeConfig.bgWrapper}`}>
                        {activeConfig.icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-neutral-800 dark:text-neutral-100">
                        {activeConfig.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {alertData.message}
                    </p>
                </div>
                <div className="pt-4">
                    <Button 
                        onClick={handleClose} 
                        className={`w-full font-bold ${activeConfig.btnClass}`}
                    >
                        Tutup
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
