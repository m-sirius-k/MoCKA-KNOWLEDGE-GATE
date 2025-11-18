// Notion Data Export - AI Simulation Output Integration
// Exports AI simulation outputs from GitHub to Notion database
// ISSUE-ID and ROD number tracking throughout

import admin from 'firebase-admin';
import NotionSync from './notion-sync.js';

const db = admin.firestore();

class NotionExport {
  constructor() {
    this.notionSync = NotionSync;
  }

  // Export single AI output to Notion
  async exportAIOutput(issueId, rodNumber, aiOutput) {
    try {
      console.log(`Exporting AI output to Notion: ISSUE-${issueId} ROD-${rodNumber}`);
      
      const result = await this.notionSync.syncToNotion(issueId, rodNumber, aiOutput);
      
      if (result.success) {
        // Log export to Firestore
        await db.collection('notion_export_log').add({
          issueId,
          rodNumber,
          pageId: result.pageId,
          status: 'exported',
          timestamp: new Date(),
          model: aiOutput.model,
          tokensUsed: aiOutput.tokensUsed,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Export error:', error);
      await db.collection('notion_export_log').add({
        issueId,
        rodNumber,
        error: error.message,
        status: 'error',
        timestamp: new Date(),
      });
      return { success: false, error: error.message };
    }
  }

  // Batch export multiple AI outputs
  async batchExport(exportItems) {
    try {
      const results = [];
      
      for (const item of exportItems) {
        const result = await this.exportAIOutput(
          item.issueId,
          item.rodNumber,
          item.aiOutput
        );
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      await db.collection('notion_export_log').add({
        type: 'batch_export',
        totalItems: results.length,
        successCount,
        failureCount,
        timestamp: new Date(),
      });

      return { 
        success: failureCount === 0, 
        totalItems: results.length,
        successCount,
        failureCount,
        results 
      };
    } catch (error) {
      console.error('Batch export error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotionExport();
