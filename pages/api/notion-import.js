// Notion Data Import - AI Simulation Output Integration
// Imports AI simulation outputs from Notion database
// ISSUE-ID and ROD number tracking throughout

import admin from 'firebase-admin';
import NotionSync from './notion-sync.js';

const db = admin.firestore();

class NotionImport {
  constructor() {
    this.notionSync = NotionSync;
  }

  // Import AI outputs from Notion by ISSUE-ID and ROD number
  async importAIOutputs(issueId, rodNumber) {
    try {
      console.log(`Importing AI outputs from Notion: ISSUE-${issueId} ROD-${rodNumber}`);
      
      const result = await this.notionSync.syncFromNotion(issueId, rodNumber);
      
      if (result.success && result.results.length > 0) {
        // Store imported results in Firestore
        for (const page of result.results) {
          await db.collection('notion_imported_data').add({
            issueId,
            rodNumber,
            pageId: page.id,
            properties: page.properties,
            content: page.content,
            importedAt: new Date(),
          });
        }

        // Log import to Firestore
        await db.collection('notion_import_log').add({
          issueId,
          rodNumber,
          itemsImported: result.results.length,
          status: 'imported',
          timestamp: new Date(),
        });
      }
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      await db.collection('notion_import_log').add({
        issueId,
        rodNumber,
        error: error.message,
        status: 'error',
        timestamp: new Date(),
      });
      return { success: false, error: error.message };
    }
  }

  // Query Notion database with custom filters
  async queryNotion(filters) {
    try {
      const { databaseId, filterConditions } = filters;
      
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({ filter: filterConditions }),
      });

      if (!response.ok) throw new Error(`Notion API error: ${response.statusText}`);

      const data = await response.json();
      
      await db.collection('notion_import_log').add({
        type: 'query',
        resultsCount: data.results.length,
        status: 'success',
        timestamp: new Date(),
      });

      return { success: true, results: data.results };
    } catch (error) {
      console.error('Query error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync imported data to GitHub via webhook
  async syncToGitHub(importedData) {
    try {
      console.log(`Syncing ${importedData.length} items to GitHub`);
      
      const githubWebhookUrl = process.env.GITHUB_WEBHOOK_URL;
      
      for (const item of importedData) {
        await fetch(githubWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GitHub-Event': 'notion_sync',
          },
          body: JSON.stringify({
            issueId: item.issueId,
            rodNumber: item.rodNumber,
            notionData: item,
            timestamp: new Date(),
          }),
        });
      }

      await db.collection('notion_import_log').add({
        type: 'github_sync',
        itemsSynced: importedData.length,
        status: 'synced',
        timestamp: new Date(),
      });

      return { success: true, itemsSynced: importedData.length };
    } catch (error) {
      console.error('GitHub sync error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotionImport();
