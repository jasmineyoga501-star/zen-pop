import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalPaymentProps {
    amount: string;
    onSuccess: (details: any) => void;
}

export const PayPalPayment: React.FC<PayPalPaymentProps> = ({ amount, onSuccess }) => {
    return (
        <PayPalScriptProvider options={{ clientId: "test" }}>
            <PayPalButtons
                style={{ layout: "horizontal", height: 45 }}
                createOrder={(_, actions) => {
                    return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                            {
                                amount: {
                                    currency_code: "USD",
                                    value: amount,
                                },
                            },
                        ],
                    });
                }}
                onApprove={async (_, actions) => {
                    if (actions.order) {
                        const details = await actions.order.capture();
                        onSuccess(details);
                    }
                }}
            />
        </PayPalScriptProvider>
    );
};
