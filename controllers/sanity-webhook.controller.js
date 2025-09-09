import WebhookService from '../services/webhook.service.js';

export async function sanityWebhook() {
  try {
    const result = await WebhookService.runFullSync();
    return result;
  } catch (error) {
    console.error('Webhook controller error:', error);
    throw error;
  }
}