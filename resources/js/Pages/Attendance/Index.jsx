import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ScanLine } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function Index({ auth, attendances }) {
    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="text-xl font-bold leading-tight text-neutral-800 dark:text-neutral-200">Attendance Logs</h2>}
        >
            <Head title="Attendance Logs" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
                    
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">Log Kehadiran Hari Ini</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                onClick={() => router.get(route('attendance.scan'))}
                                className="h-10 px-6 rounded-xl font-black uppercase tracking-widest gap-2 bg-athlix-red hover:bg-red-700 text-white shadow-lg shadow-athlix-red/20 transition-all active:scale-95" 
                            >
                                <ScanLine size={18} />
                                <span className="hidden sm:inline">Scan Kehadiran</span>
                                <span className="sm:hidden">Scan</span>
                            </Button>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800 overflow-hidden hidden md:block animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Athlete</th>
                                        <th className="px-6 py-4">Belt</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendances.map((attendance, idx) => (
                                        <tr key={attendance.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-300 animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 40}ms` }}>
                                            <td className="px-6 py-4 font-mono text-neutral-500">
                                                {new Date(attendance.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <div className="text-[10px] uppercase">{new Date(attendance.recorded_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red flex items-center justify-center font-bold text-xs">
                                                        {attendance.athlete?.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-athlix-black dark:text-athlix-white">{attendance.athlete?.full_name}</div>
                                                        <div className="text-xs text-neutral-400">Code: {attendance.athlete?.athlete_code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-xs">
                                                    <span className="w-2.5 h-2.5 rounded-full mr-2 ring-2 ring-white dark:ring-neutral-900" style={{ backgroundColor: attendance.athlete?.belt?.color_hex }}></span>
                                                    {attendance.athlete?.belt?.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                                    attendance.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${attendance.status === 'present' ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`}></div>
                                                    {attendance.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {attendances.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-16 text-center text-neutral-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center animate-float">
                                                        <span className="text-2xl">📋</span>
                                                    </div>
                                                    <p className="font-medium">No attendance logs found for today.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {attendances.map((attendance, idx) => (
                            <Card key={attendance.id} className="animate-fade-in-up fill-both" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-athlix-red/20 to-athlix-red/5 text-athlix-red flex items-center justify-center font-bold text-sm">
                                        {attendance.athlete?.full_name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-sm">{attendance.athlete?.full_name}</p>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                                                attendance.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-600'
                                            }`}>{attendance.status}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                {new Date(attendance.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: attendance.athlete?.belt?.color_hex }}></span>
                                                {attendance.athlete?.belt?.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {attendances.length === 0 && (
                            <div className="py-16 text-center text-neutral-400">
                                <p className="font-medium">No attendance logs found for today.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
