import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Sparkles, Send, User, Bot, Loader2 } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { useState, useEffect, useRef } from 'react';

export default function Index({ auth }) {
    const { ai_response } = usePage().props;
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Halo Sensei, saya Gemini AI. Ada yang bisa saya bantu analisis hari ini?' }
    ]);
    const scrollRef = useRef(null);

    const { data, setData, post, processing, reset } = useForm({
        message: '',
    });

    useEffect(() => {
        if (ai_response) {
            setMessages(prev => [
                ...prev, 
                { role: 'user', text: ai_response.user },
                { role: 'bot', text: ai_response.bot }
            ]);
            reset();
        }
    }, [ai_response]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const submit = (e) => {
        e.preventDefault();
        if (data.message.trim() === '') return;
        post(route('ai-assistant.chat'), {
            preserveScroll: true,
            onSuccess: () => reset()
        });
    };

    return (
        <AdminLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-athlix-red" />
                    <h2 className="text-xl font-bold tracking-tight uppercase">Asisten Gemini AI</h2>
                </div>
            }
        >
            <Head title="Gemini AI" />

            <div className="py-6 h-[calc(100vh-160px)]">
                <div className="mx-auto max-w-4xl h-full px-4 sm:px-6 lg:px-8 flex flex-col">
                    
                    <Card className="flex-1 border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm overflow-hidden flex flex-col mb-4 animate-fade-in-up">
                        {/* Chat History */}
                        <div ref={scrollRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl flex gap-3 ${
                                        msg.role === 'user' 
                                        ? 'bg-athlix-red text-white shadow-md shadow-athlix-red/20 rounded-tr-sm' 
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-sm'
                                    }`}>
                                        <div className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center ${
                                            msg.role === 'user' ? 'bg-white/20' : 'bg-athlix-red text-white shadow-sm'
                                        }`}>
                                            {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                                        </div>
                                        <div className="text-sm font-medium leading-relaxed">
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {processing && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-athlix-red" />
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Gemini sedang berpikir...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={submit} className="p-3 sm:p-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border-t border-neutral-200/80 dark:border-neutral-800">
                            <div className="relative">
                                <Input 
                                    value={data.message}
                                    onChange={e => setData('message', e.target.value)}
                                    placeholder="Tanya performa, jadwal, atau analisis keuangan..." 
                                    className="pr-14 h-12 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-sm"
                                    disabled={processing}
                                />
                                <Button 
                                    size="icon" 
                                    type="submit"
                                    disabled={processing || !data.message.trim()}
                                    className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl shadow-md"
                                >
                                    <Send size={16} />
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 animate-fade-in-up fill-both" style={{ animationDelay: '200ms' }}>
                        {[
                            { label: 'Cek Performa', msg: 'Bagaimana performa atlet bulan ini?' },
                            { label: 'Cek Tunggakan', msg: 'Ada berapa atlet yang belum bayar?' },
                            { label: 'Kehadiran', msg: 'Bagaimana tren kehadiran minggu ini?' },
                        ].map((btn, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setData('message', btn.msg)}
                                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-athlix-red hover:text-athlix-red transition-all duration-300 hover:shadow-sm active:scale-95"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
