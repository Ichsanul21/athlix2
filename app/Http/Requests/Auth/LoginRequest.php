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
        // Since UI restricts to numbers mostly, but allow fallback for email for legacy admins
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $attempted = Auth::attempt([
                'email' => Str::lower($identifier),
                'password' => $password,
            ], $remember);
        } else {
            $normalizedPhone = $this->normalizePhone($identifier);
            $userByPhone = $this->resolveUserByPhone($normalizedPhone);
            
            $attempted = $userByPhone
                ? Auth::attempt(['id' => $userByPhone->id, 'password' => $password], $remember)
                : false;
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

    private function resolveUserByPhone(string $normalizedPhone): ?User
    {
        if (! preg_match('/^08[0-9]{8,13}$/', $normalizedPhone)) {
            throw ValidationException::withMessages([
                'identifier' => 'Format no HP harus diawali 08 dan hanya berisi angka.',
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

        return $user;
    }

    private function resolveAthleteUserByEmail(string $email): ?User
    {
        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [Str::lower($email)])
            ->first();

        if ($user && in_array($user->role, ['atlet', 'murid', 'athlete'], true)) {
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
