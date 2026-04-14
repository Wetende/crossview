let paystackPopupPromise = null;

function resolvePaystackConstructor() {
    return window.PaystackPop || window.Paystack || null;
}

export function loadPaystackPopup() {
    const ExistingConstructor = resolvePaystackConstructor();
    if (ExistingConstructor) {
        return Promise.resolve(ExistingConstructor);
    }

    if (paystackPopupPromise) {
        return paystackPopupPromise;
    }

    paystackPopupPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[data-paystack-popup="true"]');
        if (existingScript) {
            existingScript.addEventListener("load", () => {
                const Constructor = resolvePaystackConstructor();
                if (Constructor) {
                    resolve(Constructor);
                    return;
                }
                reject(new Error("Paystack popup is unavailable after script load."));
            });
            existingScript.addEventListener("error", () => {
                reject(new Error("Failed to load Paystack popup."));
            });
            return;
        }

        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v2/inline.js";
        script.async = true;
        script.dataset.paystackPopup = "true";
        script.onload = () => {
            const Constructor = resolvePaystackConstructor();
            if (Constructor) {
                resolve(Constructor);
                return;
            }
            reject(new Error("Paystack popup loaded without a usable constructor."));
        };
        script.onerror = () => {
            reject(new Error("Failed to load Paystack popup."));
        };
        document.body.appendChild(script);
    });

    return paystackPopupPromise;
}

export async function resumePaystackTransaction({
    accessCode,
    publicKey,
    onSuccess,
    onCancel,
    onLoad,
    onError,
}) {
    if (!publicKey) {
        throw new Error("Paystack public key is not configured.");
    }
    if (!accessCode) {
        throw new Error("Missing Paystack access code.");
    }

    const PaystackConstructor = await loadPaystackPopup();
    const popup = new PaystackConstructor();
    return popup.resumeTransaction(accessCode, {
        onSuccess,
        onCancel,
        onLoad,
        onError,
    });
}
