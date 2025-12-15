<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final readonly class DpoService
{
    private string $companyToken;
    private string $serviceType;
    private string $baseUrl;
    private bool $testMode;

    public function __construct()
    {
        $this->companyToken = config('services.dpo.company_token');
        $this->serviceType = config('services.dpo.service_type', '3854');
        $this->baseUrl = config('services.dpo.test_mode', true)
            ? 'https://secure1.sandbox.directpay.online/API/v6/'
            : 'https://secure.3gdirectpay.com/API/v6/';
        $this->testMode = config('services.dpo.test_mode', true);
    }

    /**
     * Create a payment token for a transaction
     *
     */
    public function createToken(array $orderData): array
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/xml',
            ])->post($this->baseUrl . 'createToken', [
                'API3G' => $this->buildCreateTokenXml($orderData),
            ]);

            
            if ($response->successful()) {
                $xml = simplexml_load_string($response->body());

                
                if (isset($xml->Result) && (string)$xml->Result === '000') {
                    return [
                        'success' => true,
                        'token' => (string)$xml->TransToken,
                        'redirect_url' => $this->getPaymentUrl((string)$xml->TransToken),
                        'transaction_ref' => $orderData['reference'],
                    ];
                }

                
                Log::channel('payment')->error('DPO token creation failed', [
                    'response' => $response->body(),
                    'error_code' => isset($xml->Result) ? (string)$xml->Result : 'unknown',
                    'error_message' => isset($xml->ResultExplanation) ? (string)$xml->ResultExplanation : 'Unknown error',
                ]);

                return [
                    'success' => false,
                    'error_code' => isset($xml->Result) ? (string)$xml->Result : 'unknown',
                    'error_message' => isset($xml->ResultExplanation) ? (string)$xml->ResultExplanation : 'Failed to create payment token',
                ];
            }

            
            Log::channel('payment')->error('DPO API HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'error_code' => 'http_error',
                'error_message' => 'HTTP error ' . $response->status(),
            ];
        } catch (\Exception $e) {
            
            Log::channel('payment')->error('DPO API exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error_code' => 'exception',
                'error_message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify a transaction token
     *
     */
    public function verifyToken(string $transactionToken): array
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/xml',
            ])->post($this->baseUrl . 'verifyToken', [
                'API3G' => $this->buildVerifyTokenXml($transactionToken),
            ]);

            
            if ($response->successful()) {
                $xml = simplexml_load_string($response->body());

                
                if (isset($xml->Result) && (string)$xml->Result === '000') {
                    
                    return [
                        'success' => true,
                        'status' => 'success',
                        'transaction_ref' => isset($xml->TransactionRef) ? (string)$xml->TransactionRef : null,
                        'customer_name' => isset($xml->CustomerName) ? (string)$xml->CustomerName : null,
                        'customer_phone' => isset($xml->CustomerPhone) ? (string)$xml->CustomerPhone : null,
                        'customer_email' => isset($xml->CustomerEmail) ? (string)$xml->CustomerEmail : null,
                        'amount' => isset($xml->TransactionAmount) ? (string)$xml->TransactionAmount : null,
                        'currency' => isset($xml->TransactionCurrency) ? (string)$xml->TransactionCurrency : null,
                        'payment_method' => isset($xml->PaymentMethod) ? (string)$xml->PaymentMethod : null,
                        'card_number' => isset($xml->CustomerCreditCard) ? (string)$xml->CustomerCreditCard : null,
                        'transaction_date' => isset($xml->TransactionDate) ? (string)$xml->TransactionDate : null,
                        'raw_response' => $response->body(),
                    ];
                } elseif (isset($xml->Result) && (string)$xml->Result === '001') {
                    
                    return [
                        'success' => true,
                        'status' => 'pending',
                        'transaction_ref' => isset($xml->TransactionRef) ? (string)$xml->TransactionRef : null,
                        'raw_response' => $response->body(),
                    ];
                } else {
                    
                    return [
                        'success' => false,
                        'status' => 'failed',
                        'error_code' => isset($xml->Result) ? (string)$xml->Result : 'unknown',
                        'error_message' => isset($xml->ResultExplanation) ? (string)$xml->ResultExplanation : 'Unknown error',
                        'raw_response' => $response->body(),
                    ];
                }
            }

            
            Log::channel('payment')->error('DPO token verification HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'status' => 'error',
                'error_code' => 'http_error',
                'error_message' => 'HTTP error ' . $response->status(),
            ];
        } catch (\Exception $e) {
            
            Log::channel('payment')->error('DPO token verification exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'status' => 'error',
                'error_code' => 'exception',
                'error_message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check transaction status
     *
     */
    public function checkTransactionStatus(string $companyRef): array
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/xml',
            ])->post($this->baseUrl . 'queryTransaction', [
                'API3G' => $this->buildQueryTransactionXml($companyRef),
            ]);

            if ($response->successful()) {
                $xml = simplexml_load_string($response->body());

                if (isset($xml->Result) && (string)$xml->Result === '000') {
                    return [
                        'success' => true,
                        'status' => 'completed',
                        'transaction_status' => isset($xml->Status) ? (string)$xml->Status : null,
                        'transaction_ref' => isset($xml->TransactionRef) ? (string)$xml->TransactionRef : null,
                        'raw_response' => $response->body(),
                    ];
                } else {
                    return [
                        'success' => false,
                        'status' => 'failed',
                        'error_code' => isset($xml->Result) ? (string)$xml->Result : 'unknown',
                        'error_message' => isset($xml->ResultExplanation) ? (string)$xml->ResultExplanation : 'Unknown error',
                        'raw_response' => $response->body(),
                    ];
                }
            }

            Log::channel('payment')->error('DPO transaction status check HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'status' => 'error',
                'error_code' => 'http_error',
                'error_message' => 'HTTP error ' . $response->status(),
            ];
        } catch (\Exception $e) {
            Log::channel('payment')->error('DPO transaction status check exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'status' => 'error',
                'error_code' => 'exception',
                'error_message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Refund a transaction
     *
     * @param float  $amount Amount to refund. If null, full refund will be processed
     * @param string $reason Reason for refund
     */
    public function refundTransaction(string $transactionToken, ?float $amount = null, string $reason = 'Customer requested'): array
    {
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/xml',
            ])->post($this->baseUrl . 'refundTransaction', [
                'API3G' => $this->buildRefundTransactionXml($transactionToken, $amount, $reason),
            ]);

            if ($response->successful()) {
                $xml = simplexml_load_string($response->body());

                if (isset($xml->Result) && (string)$xml->Result === '000') {
                    return [
                        'success' => true,
                        'refund_token' => isset($xml->RefundToken) ? (string)$xml->RefundToken : null,
                        'message' => 'Refund processed successfully',
                        'raw_response' => $response->body(),
                    ];
                } else {
                    return [
                        'success' => false,
                        'error_code' => isset($xml->Result) ? (string)$xml->Result : 'unknown',
                        'error_message' => isset($xml->ResultExplanation) ? (string)$xml->ResultExplanation : 'Refund failed',
                        'raw_response' => $response->body(),
                    ];
                }
            }

            Log::channel('payment')->error('DPO refund HTTP error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'error_code' => 'http_error',
                'error_message' => 'HTTP error ' . $response->status(),
            ];
        } catch (\Exception $e) {
            Log::channel('payment')->error('DPO refund exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error_code' => 'exception',
                'error_message' => 'An error occurred: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get the payment URL for a transaction token
     *
     */
    public function getPaymentUrl(string $transactionToken): string
    {
        $baseUrl = $this->testMode
            ? 'https://secure1.sandbox.directpay.online/payv3.php'
            : 'https://secure.3gdirectpay.com/payv3.php';

        return $baseUrl . '?ID=' . $transactionToken;
    }

    /**
     * Build XML for create token request
     *
     */
    private function buildCreateTokenXml(array $orderData): string
    {
        $companyRef = $orderData['reference'];
        $amount = $orderData['amount'];
        $currency = $orderData['currency'] ?? 'ZAR';
        $customerEmail = $orderData['email'];
        $customerFirstName = $orderData['first_name'] ?? '';
        $customerLastName = $orderData['last_name'] ?? '';
        $customerPhone = $orderData['phone'] ?? '';
        $redirectUrl = $orderData['redirect_url'];
        $backUrl = $orderData['back_url'];
        $description = $orderData['description'] ?? 'Order Payment';
        $billingAddress = $orderData['address'] ?? '';
        $billingCity = $orderData['city'] ?? '';
        $billingState = $orderData['state'] ?? '';
        $billingPostalCode = $orderData['postal_code'] ?? '';
        $billingCountry = $orderData['country'] ?? '';

        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="utf-8"?><API3G></API3G>');

        
        $xml->addChild('CompanyToken', $this->companyToken);
        $xml->addChild('Request', 'createToken');
        $xml->addChild('Transaction', '');
        $xml->Transaction->addChild('PaymentAmount', (string)$amount);
        $xml->Transaction->addChild('PaymentCurrency', $currency);
        $xml->Transaction->addChild('CompanyRef', $companyRef);
        $xml->Transaction->addChild('RedirectURL', $redirectUrl);
        $xml->Transaction->addChild('BackURL', $backUrl);
        $xml->Transaction->addChild('CompanyRefUnique', '1');
        $xml->Transaction->addChild('PTL', '5');

        
        if (!empty($billingAddress) || !empty($billingCity) || !empty($billingState) || !empty($billingPostalCode) || !empty($billingCountry)) {
            $xml->addChild('BillingAddress', '');

            if (!empty($billingAddress)) {
                $xml->BillingAddress->addChild('Address1', $billingAddress);
            }

            if (!empty($billingCity)) {
                $xml->BillingAddress->addChild('City', $billingCity);
            }

            if (!empty($billingState)) {
                $xml->BillingAddress->addChild('State', $billingState);
            }

            if (!empty($billingPostalCode)) {
                $xml->BillingAddress->addChild('PostalCode', $billingPostalCode);
            }

            if (!empty($billingCountry)) {
                $xml->BillingAddress->addChild('Country', $billingCountry);
            }
        }

        
        $xml->Transaction->addChild('PreferedPaymentOptions', config('services.dpo.preferred_payment_options', ''));

        
        $xml->addChild('Services', '');
        $xml->Services->addChild('Service', '');
        $xml->Services->Service->addChild('ServiceType', $this->serviceType);
        $xml->Services->Service->addChild('ServiceDescription', $description);
        $xml->Services->Service->addChild('ServiceDate', date('Y/m/d H:i'));

        
        if (!empty($customerEmail) || !empty($customerFirstName) || !empty($customerLastName) || !empty($customerPhone)) {
            $xml->addChild('Customer', '');

            if (!empty($customerFirstName)) {
                $xml->Customer->addChild('FirstName', $customerFirstName);
            }

            if (!empty($customerLastName)) {
                $xml->Customer->addChild('LastName', $customerLastName);
            }

            if (!empty($customerEmail)) {
                $xml->Customer->addChild('Email', $customerEmail);
            }

            if (!empty($customerPhone)) {
                $xml->Customer->addChild('Phone', $customerPhone);
            }
        }

        return $xml->asXML();
    }

    /**
     * Build XML for verify token request
     *
     */
    private function buildVerifyTokenXml(string $transactionToken): string
    {
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="utf-8"?><API3G></API3G>');

        $xml->addChild('CompanyToken', $this->companyToken);
        $xml->addChild('Request', 'verifyToken');
        $xml->addChild('TransactionToken', $transactionToken);

        return $xml->asXML();
    }

    /**
     * Build XML for query transaction request
     *
     */
    private function buildQueryTransactionXml(string $companyRef): string
    {
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="utf-8"?><API3G></API3G>');

        $xml->addChild('CompanyToken', $this->companyToken);
        $xml->addChild('Request', 'queryTransaction');
        $xml->addChild('CompanyRef', $companyRef);

        return $xml->asXML();
    }

    /**
     * Build XML for refund transaction request
     *
     */
    private function buildRefundTransactionXml(string $transactionToken, ?float $amount = null, string $reason = 'Customer requested'): string
    {
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="utf-8"?><API3G></API3G>');

        $xml->addChild('CompanyToken', $this->companyToken);
        $xml->addChild('Request', 'refundTransaction');
        $xml->addChild('TransactionToken', $transactionToken);

        if ($amount !== null) {
            $xml->addChild('RefundAmount', (string)$amount);
        }

        $xml->addChild('RefundReason', $reason);

        return $xml->asXML();
    }
}
