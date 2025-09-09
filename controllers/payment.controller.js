import paypal from '@paypal/checkout-server-sdk';
import paypalClient from '../config/payment.config.js';

export const createPayment = async (req, res) => {
  const { amount } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount
      }
    }]
  });

  try {
    const order = await paypalClient.execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const capturePayment = async (req, res) => {
  const { orderID } = req.body;

  const request = new paypal.orders.OrdersCaptureRequest(orderID);

  try {
    const capture = await paypalClient.execute(request);
    res.json(capture.result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};