import paypal from '@paypal/checkout-server-sdk';
import { paypalConfig } from '../config/payment.config.js';

const environment = paypalConfig.mode === 'sandbox'
  ? new paypal.core.SandboxEnvironment(paypalConfig.clientId, paypalConfig.clientSecret)
  : new paypal.core.LiveEnvironment(paypalConfig.clientId, paypalConfig.clientSecret);

const client = new paypal.core.PayPalHttpClient(environment);

// services/paypal.service.js
export const createPaypalOrder = async (amount) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: "USD",
        value: amount.toString()
      }
    }],
    application_context: {
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
    }
  });
  const order = await client.execute(request);
  return order.result;
};

export const capturePaypalOrder = async (orderId) => {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const capture = await client.execute(request);
  return capture.result;
};