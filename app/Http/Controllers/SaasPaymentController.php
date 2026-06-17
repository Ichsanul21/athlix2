<?php

namespace App\Http\Controllers;

use App\Models\Dojo;
use App\Models\LandingPriceList;
use App\Models\SaasOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SaasPaymentController extends Controller
{
    /**
     * Create a renewal order and get a Midtrans Snap Token.
     */
    public function createRenewalOrder(Request $request)
    {
        $user = auth()->user();
        $dojoId = $user?->dojo_id;

        if (!$dojoId) {
            return response()->json(['message' => 'Dojo tidak terhubung dengan akun Anda.'], 400);
        }

        $dojo = Dojo::findOrFail($dojoId);

        $validPlans = LandingPriceList::pluck('title')->toArray();
        if (empty($validPlans)) {
            $validPlans = ['Basic', 'Pro', 'Advance'];
        }

        $request->validate([
            'requested_plan_name' => ['required', 'string', \Illuminate\Validation\Rule::in($validPlans)],
            'billing_cycle_months' => 'required|integer|in:1,3,6,12',
        ]);

        $planName = $request->requested_plan_name;
        $months = (int) $request->billing_cycle_months;

        // Retrieve price from price lists
        $price = LandingPriceList::where('title', $planName)->first()?->price;
        if (!$price) {
            // Fallbacks if database record doesn't exist
            $price = match ($planName) {
                'Advance' => 1750000,
                'Pro'     => 700000,
                'Basic'   => 350000,
                default   => 350000
            };
        }

        $amount = $price * $months;

        // Generate a unique order ID
        $orderId = 'SAAS-' . $dojoId . '-' . time() . '-' . rand(100, 999);

        // Call Midtrans Snap API
        $isProduction = config('services.midtrans.is_production');
        $serverKey = config('services.midtrans.server_key');
        $snapUrl = $isProduction 
            ? 'https://app.midtrans.com/snap/v1/transactions' 
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $authHeader = 'Basic ' . base64_encode($serverKey . ':');

        // Determine callback notification URL
        $callbackUrl = route('saas.payment.callback');

        if (!$isProduction) {
            try {
                // Auto-detect running ngrok tunnel to override callback URL
                $ngrokResponse = Http::timeout(1)->get('http://127.0.0.1:4040/api/tunnels');
                if ($ngrokResponse->successful()) {
                    $tunnels = $ngrokResponse->json('tunnels');
                    if (!empty($tunnels)) {
                        $publicUrl = $tunnels[0]['public_url'] ?? null;
                        if ($publicUrl) {
                            $parsedRoute = parse_url($callbackUrl);
                            $parsedNgrok = parse_url($publicUrl);
                            
                            $callbackUrl = ($parsedNgrok['scheme'] ?? 'https') . '://' . ($parsedNgrok['host'] ?? '') 
                                . ($parsedRoute['path'] ?? '/api/saas/payment/callback')
                                . (isset($parsedRoute['query']) ? '?' . $parsedRoute['query'] : '');
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore and use default route() generator
            }
        }

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $amount,
            ],
            'item_details' => [
                [
                    'id' => strtolower($planName),
                    'price' => (int) $price,
                    'quantity' => $months,
                    'name' => 'SaaS Subscription ' . $planName . ' (' . $months . ' Bulan)',
                ]
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number ?? '',
            ]
        ];

        try {
            $headers = [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Authorization' => $authHeader,
            ];

            if ($callbackUrl) {
                $headers['X-Override-Notification'] = $callbackUrl;
            }

            $request = Http::withHeaders($headers);

            if (!$isProduction) {
                $request->withoutVerifying();
            }

            Log::info('Initiating Midtrans Snap request', [
                'order_id' => $orderId,
                'notification_url' => $callbackUrl ?? 'dashboard-default'
            ]);

            $response = $request->post($snapUrl, $payload);

            if ($response->failed()) {
                Log::error('Midtrans Snap request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return response()->json(['message' => 'Gagal menghubungi server pembayaran Midtrans.'], 502);
            }

            $result = $response->json();
            $snapToken = $result['token'] ?? null;

            if (!$snapToken) {
                return response()->json(['message' => 'Token pembayaran tidak diterima dari Midtrans.'], 502);
            }

            // Create Saas Order
            $order = SaasOrder::create([
                'dojo_id' => $dojoId,
                'order_id' => $orderId,
                'plan_name' => $planName,
                'billing_cycle_months' => $months,
                'amount' => $amount,
                'status' => 'pending',
                'snap_token' => $snapToken,
            ]);

            return response()->json([
                'order' => $order,
                'snap_token' => $snapToken,
            ]);

        } catch (\Exception $e) {
            Log::error('SaasPaymentController create error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Terjadi kesalahan sistem saat memproses pembayaran.'], 500);
        }
    }

    /**
     * Midtrans Notification Webhook Callback handler.
     */
    public function midtransCallback(Request $request)
    {
        $orderId = $request->order_id;
        $statusCode = $request->status_code;
        $grossAmount = $request->gross_amount;
        $signatureKey = $request->signature_key;

        $serverKey = config('services.midtrans.server_key');

        // Verify Signature
        $input = $orderId . $statusCode . $grossAmount . $serverKey;
        $localSignature = hash('sha512', $input);

        if ($localSignature !== $signatureKey) {
            Log::warning('Midtrans Webhook: Invalid Signature', [
                'order_id' => $orderId,
                'signature_received' => $signatureKey,
                'signature_expected' => $localSignature
            ]);
            return response()->json(['message' => 'Invalid Signature'], 403);
        }

        $order = SaasOrder::where('order_id', $orderId)->first();
        if (!$order) {
            Log::warning('Midtrans Webhook: Order not found', ['order_id' => $orderId]);
            return response()->json(['message' => 'Order not found'], 404);
        }

        $transactionStatus = $request->transaction_status;
        $paymentType = $request->payment_type;

        Log::info('Midtrans Webhook notification received', [
            'order_id' => $orderId,
            'status' => $transactionStatus
        ]);

        if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
            if ($transactionStatus === 'capture' && $request->fraud_status === 'challenge') {
                $order->update(['status' => 'challenge']);
            } else {
                $order->update([
                    'status' => 'paid',
                    'payment_type' => $paymentType,
                    'paid_at' => now(),
                ]);

                // Update Dojo Subscription
                $dojo = $order->dojo;
                if ($dojo) {
                    $currentExpiry = $dojo->subscription_expires_at;
                    
                    // If subscription has expired (or is trial that is already past), we extend from today.
                    // Otherwise, we append to the current expiry date.
                    $baseDate = ($currentExpiry && Carbon::parse($currentExpiry)->isFuture())
                        ? Carbon::parse($currentExpiry)
                        : now();

                    $newExpiry = $baseDate->copy()->addMonths($order->billing_cycle_months)->subDay();
                    $newGrace1 = $newExpiry->copy()->addDays(7);
                    $newGrace2 = $newExpiry->copy()->addDays(14);

                    $dojo->update([
                        'saas_plan_name' => $order->plan_name,
                        'monthly_saas_fee' => $order->amount / $order->billing_cycle_months,
                        'billing_cycle_months' => $order->billing_cycle_months,
                        'subscription_expires_at' => $newExpiry->toDateString(),
                        'grace_period_stage1_ends_at' => $newGrace1->toDateString(),
                        'grace_period_ends_at' => $newGrace2->toDateString(),
                        'is_saas_blocked' => false,
                        'saas_block_reason' => null,
                        'blocked_at' => null,
                    ]);

                    Log::info('Dojo subscription successfully renewed', [
                        'dojo_id' => $dojo->id,
                        'new_plan' => $order->plan_name,
                        'new_expiry' => $newExpiry->toDateString()
                    ]);
                }
            }
        } elseif (in_array($transactionStatus, ['deny', 'expire', 'cancel'], true)) {
            $order->update(['status' => 'failed']);
        } elseif ($transactionStatus === 'pending') {
            $order->update(['status' => 'pending']);
        }

        return response()->json(['message' => 'Callback processed successfully']);
    }

    /**
     * Check status of Saas Order.
     */
    public function checkOrderStatus(SaasOrder $order)
    {
        $user = auth()->user();
        if ($order->dojo_id !== $user->dojo_id && !$user->isSuperAdmin()) {
            abort(403);
        }

        return response()->json([
            'status' => $order->status,
            'paid_at' => $order->paid_at ? $order->paid_at->toIso8601String() : null,
        ]);
    }
}
