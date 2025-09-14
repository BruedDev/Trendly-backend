import fetch from 'node-fetch';
import { paypalConfig } from '../config/payment.config.js';

/**
 * Verify webhook PayPal
 * PayPal không verify bằng HMAC mà phải gọi API verify
 */
export const verifyPaypalWebhook = async (req, res, next) => {
  try {
    const transmissionId = req.header('Paypal-Transmission-Id');
    const transmissionSig = req.header('Paypal-Transmission-Sig');
    const transmissionTime = req.header('Paypal-Transmission-Time');
    const certUrl = req.header('Paypal-Cert-Url');
    const authAlgo = req.header('Paypal-Auth-Algo');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID; // bạn phải set trong .env
    const eventBody = req.body;

    const response = await fetch(`${paypalConfig.mode === 'sandbox'
      ? 'https://api.sandbox.paypal.com'
      : 'https://api.paypal.com'}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64')
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: eventBody
      })
    });

    const result = await response.json();

    if (result.verification_status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Webhook PayPal không hợp lệ' });
    }

    next();
  } catch (err) {
    console.error('verifyPaypalWebhook error:', err);
    res.status(500).json({ error: 'Lỗi xác thực PayPal' });
  }
};

// /**
//  * Verify chữ ký Momo (HMAC)
//  */
// export const verifyMomoSignature = (req, res, next) => {
//   try {
//     const { signature, ...rest } = req.body;
//     const rawData = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('&');
//     const expectedSignature = crypto
//       .createHmac('sha256', momoConfig.secretKey)
//       .update(rawData)
//       .digest('hex');

//     if (signature !== expectedSignature) {
//       return res.status(400).json({ error: 'Chữ ký Momo không hợp lệ' });
//     }
//     next();
//   } catch (err) {
//     console.error('verifyMomoSignature error:', err);
//     res.status(500).json({ error: 'Lỗi xác thực Momo' });
//   }
// };

