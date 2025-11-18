// Notion Bidirectional Sync - AI Simulation Output Integration
// Supports automatic creation, update, and retrieval of AI simulation outputs in Notion
// ISSUE-ID and ROD number tracking throughout

import admin from 'firebase-admin';
import crypto from 'crypto';

const db = admin.firestore();

class NotionSync {
  constructor() {
    this.apiUrl = 'https://api.notion.com/v1';
    this.apiKey = process.env.NOTION_API_KEY;
    this.databaseId = process.env.NOTION_DATABASE_ID;
  }

  // Verify HMAC-SHA256 signature for Notion webhooks
  verifyNotionSignature(payload, signature) {
    const hash = crypto
      .createHmac('sha256', process.env.NOTION_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  // Create or update Notion page with AI output
  async syncToNotion(issueId, rodNumber, aiOutput) {
    try {
      const payload = {
        parent: { database_id: this.databaseId },
        properties: {
          'AI Output': { title: [{ text: { content: aiOutput.slice(0, 100) } }] },
          'Issue ID': { rich_text: [{ text: { content: issueId } }] },
          'Rod Number': { rich_text: [{ text: { content: rodNumber } }] },
          'Model': { select: { name: aiOutput.model || 'unknown' } },
          'Tokens Used': { number: aiOutput.tokensUsed || 0 },
          'Cost': { number: aiOutput.cost || 0 },
          'Created': { date: { start: new Date().toISOString() } },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: aiOutput.content } }],
            },
          },
        ],
      };

      const response = await fetch(`${this.apiUrl}/pages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Notion API error: ${response.statusText}`);

      const pageData = await response.json();
      
      // Log to Firestore
      await db.collection('notion_integration_log').add({
        issueId,
        rodNumber,
        pageId: pageData.id,
        action: 'create',
        timestamp: new Date(),
        status: 'success',
      });

      return { success: true, pageId: pageData.id };
    } catch (error) {
      console.error('Notion sync error:', error);
      await db.collection('notion_integration_log').add({
        issueId,
        rodNumber,
        error: error.message,
        action: 'create',
        timestamp: new Date(),
        status: 'error',
      });
      return { success: false, error: error.message };
    }
  }

  // Retrieve AI outputs from Notion database
  async syncFromNotion(issueId, rodNumber) {
    try {
      const response = await fetch(`${this.apiUrl}/databases/${this.databaseId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          filter: {
            and: [
              { property: 'Issue ID', rich_text: { equals: issueId } },
              { property: 'Rod Number', rich_text: { equals: rodNumber } },
            ],
          },
        }),
      });

      if (!response.ok) throw new Error(`Notion API error: ${response.statusText}`);

      const data = await response.json();
      
      await db.collection('notion_integration_log').add({
        issueId,
        rodNumber,
        resultsCount: data.results.length,
        action: 'query',
        timestamp: new Date(),
        status: 'success',
      });

      return { success: true, results: data.results };
    } catch (error) {
      console.error('Notion fetch error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotionSync();
