

@php
    $baseClasses = 'message-box message-box-' . $type;
    
    $icons = [
        'success' => '✔️',
        'error' => '❌', 
        'warning' => '⚠️',
        'info' => 'ℹ️'
    ];

    $icon = $icon ?? $icons[$type] ?? $icons['info'];
@endphp

<div class="{{ $baseClasses }}">
    <div class="message-icon">{{ $icon }}</div>
    <div class="message-content">{{ $message }}</div>
</div>

<style>
    .message-box {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 4px;
        margin-bottom: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        max-width: 100%;
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .message-icon {
        margin-right: 12px;
        font-size: 20px;
    }

    .message-content {
        flex-grow: 1;
        font-size: 14px;
    }

    /* Success Variant */
    .message-box-success {
        background-color: #dff0d8;
        border: 1px solid #d6e9c6;
        color: #3c763d;
    }

    /* Error Variant */
    .message-box-error {
        background-color: #f2dede;
        border: 1px solid #ebccd1;
        color: #a94442;
    }

    /* Warning Variant */
    .message-box-warning {
        background-color: #fcf8e3;
        border: 1px solid #faebcc;
        color: #8a6d3b;
    }

    /* Info Variant */
    .message-box-info {
        background-color: #d9edf7;
        border: 1px solid #bce8f1;
        color: #31708f;
    }

    /* Responsive Design */
    @media (max-width: 600px) {
        .message-box {
            flex-direction: column;
            align-items: flex-start;
        }

        .message-icon {
            margin-right: 0;
            margin-bottom: 8px;
        }
    }
</style>
