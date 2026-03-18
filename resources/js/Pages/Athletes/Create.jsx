import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Create({ auth, belts }) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        athlete_code: 'ATH-' + Math.floor(1000 + Math.random() * 9000),
        current_belt_id: belts[0]?.id || '',
        dob: '',
        gender: 'M',
        specialization: 'both',
        latest_weight: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('athletes.store'));
    };

    return (
        <AdminLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-neutral-800 dark:text-neutral-200">Register New Athlete</h2>}
        >
            <Head title="Add Athlete" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <Link href={route('athletes.index')} className="inline-flex items-center text-sm text-neutral-500 hover:text-athlix-red transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Directory
                    </Link>

                    <Card>
                        <CardHeader>
                            <CardTitle>Athlete Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input 
                                            value={data.full_name} 
                                            onChange={e => setData('full_name', e.target.value)} 
                                            placeholder="Enter full name"
                                            required
                                        />
                                        {errors.full_name && <p className="text-xs text-athlix-red">{errors.full_name}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Athlete ID Code</label>
                                        <Input 
                                            value={data.athlete_code} 
                                            onChange={e => setData('athlete_code', e.target.value)} 
                                            placeholder="ATH-XXXX"
                                            required
                                        />
                                        {errors.athlete_code && <p className="text-xs text-athlix-red">{errors.athlete_code}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Belt Level</label>
                                        <select 
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-athlix-red"
                                            value={data.current_belt_id}
                                            onChange={e => setData('current_belt_id', e.target.value)}
                                        >
                                            {belts.map(belt => (
                                                <option key={belt.id} value={belt.id}>{belt.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Date of Birth</label>
                                        <Input 
                                            type="date"
                                            value={data.dob} 
                                            onChange={e => setData('dob', e.target.value)} 
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Gender</label>
                                        <select 
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-athlix-red"
                                            value={data.gender}
                                            onChange={e => setData('gender', e.target.value)}
                                        >
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Weight (kg)</label>
                                        <Input 
                                            type="number"
                                            step="0.1"
                                            value={data.latest_weight} 
                                            onChange={e => setData('latest_weight', e.target.value)} 
                                            placeholder="e.g. 65.5"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Specialization</label>
                                        <select 
                                            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-athlix-red"
                                            value={data.specialization}
                                            onChange={e => setData('specialization', e.target.value)}
                                        >
                                            <option value="kata">Kata</option>
                                            <option value="kumite">Kumite</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" className="w-full h-12 text-lg" disabled={processing}>
                                        {processing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                        Create Athlete Profile
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
