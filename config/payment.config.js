export const paypalConfig = {
  clientId: process.env.PAYPAL_CLIENT_ID || "",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
  mode: process.env.PAYPAL_MODE || "sandbox",
  webhookId: process.env.PAYPAL_WEBHOOK_ID || "",
};

// sau này mới áp dụng phần khối này
// export const momoConfig = {
//   partnerCode: process.env.MOMO_PARTNER_CODE,
//   accessKey: process.env.MOMO_ACCESS_KEY,
//   secretKey: process.env.MOMO_SECRET_KEY,
//   endpoint: process.env.MOMO_ENDPOINT
// };

// export const zalopayConfig = {
//   appId: process.env.ZALO_APP_ID,
//   key1: process.env.ZALO_KEY1,
//   key2: process.env.ZALO_KEY2,
//   endpoint: process.env.ZALO_ENDPOINT
// };
