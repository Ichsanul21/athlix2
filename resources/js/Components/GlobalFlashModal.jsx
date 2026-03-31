import React, { useEffect, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';

export default function GlobalFlashModal() {
    const { flash } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [alertData, setAlertData] = useState({ type: 'info', message: '' });
    const timerRef = useRef(null);

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

    // Auto-dismiss after 4 seconds for success/info, longer for error/warning
    useEffect(() => {
        if (isOpen) {
            clearTimeout(timerRef.current);
            const delay = (alertData.type === 'error' || alertData.type === 'warning') ? 6000 : 4000;
            timerRef.current = setTimeout(() => setIsOpen(false), delay);
        }
        return () => clearTimeout(timerRef.current);
    }, [isOpen, alertData.type]);

    const handleClose = () => {
        clearTimeout(timerRef.current);
        setIsOpen(false);
    };

    const config = {
        success: {
            icon: <CheckCircle2 size={48} strokeWidth={1.5} className="text-emerald-500" />,
            ring: 'ring-emerald-500/20',
            bgIcon: 'bg-emerald-50 dark:bg-emerald-500/10',
            btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20',
            title: 'Berhasil!',
            accent: 'text-emerald-600 dark:text-emerald-400',
        },
        error: {
            icon: <XCircle size={48} strokeWidth={1.5} className="text-red-500" />,
            ring: 'ring-red-500/20',
            bgIcon: 'bg-red-50 dark:bg-red-500/10',
            btnClass: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20',
            title: 'Terjadi Kesalahan!',
            accent: 'text-red-600 dark:text-red-400',
        },
        warning: {
            icon: <AlertCircle size={48} strokeWidth={1.5} className="text-amber-500" />,
            ring: 'ring-amber-500/20',
            bgIcon: 'bg-amber-50 dark:bg-amber-500/10',
            btnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20',
            title: 'Peringatan',
            accent: 'text-amber-600 dark:text-amber-400',
        },
        info: {
            icon: <Info size={48} strokeWidth={1.5} className="text-blue-500" />,
            ring: 'ring-blue-500/20',
            bgIcon: 'bg-blue-50 dark:bg-blue-500/10',
            btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
            title: 'Informasi',
            accent: 'text-blue-600 dark:text-blue-400',
        }
    };

    const activeConfig = config[alertData.type] || config.info;

    return (
        <Modal show={isOpen} onClose={handleClose} maxWidth="sm" centered>
            <div className="p-8 text-center space-y-5">
                {/* Icon with ring pulse */}
                <div className="flex justify-center">
                    <div className={`p-4 rounded-full ${activeConfig.bgIcon} ring-8 ${activeConfig.ring} transition-all duration-500`}>
                        {activeConfig.icon}
                    </div>
                </div>

                {/* Title & Message */}
                <div className="space-y-2">
                    <h3 className={`text-xl font-black uppercase tracking-tight ${activeConfig.accent}`}>
                        {activeConfig.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-[280px] mx-auto">
                        {alertData.message}
                    </p>
                </div>

                {/* Button */}
                <div className="pt-2">
                    <Button
                        onClick={handleClose}
                        className={`w-full font-bold text-sm uppercase tracking-widest rounded-xl h-11 ${activeConfig.btnClass}`}
                    >
                        Tutup
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
