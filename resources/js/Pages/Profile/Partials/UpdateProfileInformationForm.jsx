import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import FileInput from '@/Components/FileInput';
import { Skeleton } from '@/Components/ui/skeleton';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth?.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user?.name || '',
            email: user?.email || '',
            phone_number: user?.phone_number || '',
            profile_photo: null,
        });

    useEffect(() => {
        if (user) {
            setData({
                name: user.name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                profile_photo: null,
            });
        }
    }, [user, setData]);

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            forceFormData: true,
        });
    };

    if (!user) {
        return (
            <section className={className}>
                <header>
                    <h2 className="text-lg font-medium text-gray-900 ">
                        Profile Information
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 ">
                        Update your account's profile information and email address.
                    </p>
                </header>
                <div className="mt-6 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </section>
        );
    }

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 ">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 ">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="phone_number" value="No. WhatsApp" />

                    <TextInput
                        id="phone_number"
                        type="text"
                        className="mt-1 block w-full"
                        value={data.phone_number}
                        onChange={(e) => setData('phone_number', e.target.value)}
                        required
                    />

                    <InputError className="mt-2" message={errors.phone_number} />
                </div>

                <div>
                    <InputLabel htmlFor="profile_photo" value="Foto Profile" />

                    <FileInput
                        id="profile_photo"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="mt-1"
                        onChange={(file) => setData('profile_photo', file)}
                        error={errors.profile_photo}
                    />

                    {user?.profile_photo_url && (
                        <img src={user.profile_photo_url} alt="Profile" className="mt-2 h-16 w-16 rounded-full object-cover border" />
                    )}
                </div>

                {mustVerifyEmail && user?.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 ">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2  dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600 ">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 ">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}

