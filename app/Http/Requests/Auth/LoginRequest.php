<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'identifier' => ['nullable', 'string', 'max:255', 'required_without:email'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'required_without:identifier'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $password = $this->string('password')->toString();
        $remember = $this->boolean('remember');
        $identifier = $this->resolveInputIdentifier();

        if ($this->looksLikeAthletePhone($identifier)) {
            $athleteUser = $this->resolveAthleteUserByPhone($identifier);
            $attempted = $athleteUser
                ? Auth::attempt(['id' => $athleteUser->id, 'password' => $password], $remember)
                : false;
        } else {
            $credentials = $this->resolveEmailCredentials($identifier);
            $athleteUserByEmail = $this->resolveAthleteUserByEmail($credentials['email']);
            if ($athleteUserByEmail) {
                throw ValidationException::withMessages([
                    'identifier' => 'Akun atlet wajib login menggunakan no HP dengan format 08...',
                ]);
            }

            $attempted = Auth::attempt([
                'email' => $credentials['email'],
                'password' => $password,
            ], $remember);
        }

        if (! $attempted) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'identifier' => trans('auth.failed'),
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'identifier' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->resolveInputIdentifier()).'|'.$this->ip());
    }

    /**
     * @return array{email: string}
     */
    private function resolveEmailCredentials(string $identifier): array
    {
        if (! filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages([
                'identifier' => 'Gunakan email valid atau no HP atlet dengan format 08...',
            ]);
        }

        return [
            'email' => Str::lower($identifier),
        ];
    }

    private function looksLikeAthletePhone(string $identifier): bool
    {
        $normalized = $this->normalizePhone($identifier);

        return str_starts_with($normalized, '08');
    }

    private function resolveAthleteUserByPhone(string $identifier): ?User
    {
        $normalizedPhone = $this->normalizePhone($identifier);

        if (! preg_match('/^08[0-9]{8,13}$/', $normalizedPhone)) {
            throw ValidationException::withMessages([
                'identifier' => 'Format no HP atlet harus diawali 08 dan hanya berisi angka.',
            ]);
        }

        $internationalPhone = '62' . substr($normalizedPhone, 1);
        $variants = array_values(array_unique([
            $normalizedPhone,
            $internationalPhone,
            '+' . $internationalPhone,
        ]));

        $user = User::query()
            ->whereIn('phone_number', $variants)
            ->orderByDesc('id')
            ->first();

        if ($user && ! in_array($user->role, ['murid', 'athlete'], true)) {
            throw ValidationException::withMessages([
                'identifier' => 'Login no HP hanya berlaku untuk akun atlet.',
            ]);
        }

        return $user;
    }

    private function resolveAthleteUserByEmail(string $email): ?User
    {
        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [Str::lower($email)])
            ->first();

        if ($user && in_array($user->role, ['murid', 'athlete'], true)) {
            return $user;
        }

        return null;
    }

    private function normalizePhone(string $identifier): string
    {
        return preg_replace('/[^0-9]/', '', $identifier) ?? '';
    }

    private function resolveInputIdentifier(): string
    {
        $identifier = trim((string) $this->input('identifier', ''));
        if ($identifier !== '') {
            return $identifier;
        }

        return trim((string) $this->input('email', ''));
    }
}
