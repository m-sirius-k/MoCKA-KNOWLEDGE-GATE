// Notion Webhook Event Handler - AI Simulation Output Integration
// Handles incoming webhook events from Notion with signature verification
// ISSUE-ID and ROD number tracking throughout

import admin from 'firebase-admin';
import crypto from 'crypto';
import NotionSync from './notion-sync.js';

const db = admin.firestore();

class NotionWebhook {
  constructor() {
    this.webhookSecret = process.env.NOTION_WEBHOOK_SECRET;
  }

  // Verify HMAC-SHA256 signature
  verifySignature(requestBody, signature) {
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(requestBody)
      .digest('hex');
    return `sha256=${hash}` === signature;
  }

  // Handle page updated events from Notion
  async handlePageUpdated(pageId, issueId, rodNumber, eventData) {
    try {
      console.log(`Processing Notion page update: ${pageId} for ISSUE-${issueId} ROD-${rodNumber}`);
      
      // Extract page properties
      const properties = eventData.properties || {};
      const aiOutput = properties['AI Output']?.title?.[0]?.text?.content || '';
      const model = properties['Model']?.select?.name || 'unknown';
      const tokensUsed = properties['Tokens Used']?.number || 0;
      const cost = properties['Cost']?.number || 0;

      // Log the webhook event to Firestore
      await db.collection('notion_webhook_events').add({
        pageId,
        issueId,
        rodNumber,
        eventType: 'page_updated',
        aiOutput: aiOutput.slice(0, 200),
        model,
        tokensUsed,
        cost,
        timestamp: new Date(),
        status: 'processed',
      });

      return { success: true, message: 'Page update processed' };
    } catch (error) {
      console.error('Notion webhook handler error:', error);
      await db.collection('notion_webhook_events').add({
        pageId,
        issueId,
        rodNumber,
        eventType: 'page_updated',
        error: error.message,
        timestamp: new Date(),
        status: 'error',
      });
      return { success: false, error: error.message };
    }
  }

  // Handle database query change events
  async handleDatabaseChanges(databaseId, issueId, rodNumber, changedPages) {
    try {
      console.log(`Processing ${changedPages.length} page changes in database ${databaseId}`);
      
      for (const page of changedPages) {
        await this.handlePageUpdated(page.id, issueId, rodNumber, page);
      }

      await db.collection('notion_webhook_events').add({
        databaseId,
        issueId,
        rodNumber,
        eventType: 'database_changes',
        changedPagesCount: changedPages.length,
        timestamp: new Date(),
        status: 'processed',
      });

      return { success: true, processedPages: changedPages.length };
    } catch (error) {
      console.error('Database changes handler error:', error);
      return { success: false, error: error.message };
    }
  }

  // Main webhook handler for incoming requests
  async handle(request) {
    try {
      const signature = request.headers['x-notion-signature'] || '';
      const requestBody = request.body || '{}';
      
      // Verify signature
      if (!this.verifySignature(JSON.stringify(requestBody), signature)) {
        throw new Error('Invalid webhook signature');
      }

      const { event_type: eventType, data } = requestBody;
      const { issue_id: issueId, rod_number: rodNumber } = data || {};

      if (!issueId || !rodNumber) {
        throw new Error('Missing ISSUE-ID or ROD number in webhook payload');
      }

      let response;
      switch (eventType) {
        case 'page.updated':
          response = await this.handlePageUpdated(
            data.page_id,
            issueId,
            rodNumber,
            data
          );
          break;
        case 'database.changes':
          response = await this.handleDatabaseChanges(
            data.database_id,
            issueId,
            rodNumber,
            data.changed_pages
          );
          break;
        default:
          console.warn(`Unknown event type: ${eventType}`);
          response = { success: true, message: 'Event received but no handler' };
      }

      return response;
    } catch (error) {
      console.error('Webhook handler error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotionWebhook();
