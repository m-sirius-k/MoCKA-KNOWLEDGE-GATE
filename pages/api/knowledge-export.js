/**
 * Knowledge Export/Share API
 * Export knowledge base data in multiple formats
 * No external dependencies - pure file-system based export
 */

import fs from 'fs';
import path from 'path';

/**
 * Export knowledge base
 * GET /api/knowledge-export?format=<json|csv|markdown>&issue=<ISSUE-ID>&rod=<ROD-ID>
 * Returns: Exported knowledge data in requested format
 */
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { format = 'json', issue, rod } = req.query;

    if (!['json', 'csv', 'markdown'].includes(format)) {
      return res.status(400).json({ 
        error: 'Invalid format. Supported: json, csv, markdown',
        example: '/api/knowledge-export?format=json&issue=ISSUE-001'
      });
    }

    // Collect knowledge data
    const docsPath = path.join(process.cwd(), 'docs');
    const knowledgeData = collectKnowledge(docsPath, issue, rod);

    // Format and return based on format parameter
    let contentType = 'application/json';
    let content = knowledgeData;

    if (format === 'csv') {
      contentType = 'text/csv';
      content = convertToCSV(knowledgeData);
      res.setHeader('Content-Disposition', 'attachment; filename="knowledge-export.csv"');
    } else if (format === 'markdown') {
      contentType = 'text/markdown';
      content = convertToMarkdown(knowledgeData);
      res.setHeader('Content-Disposition', 'attachment; filename="knowledge-export.md"');
    } else {
      content = JSON.stringify(knowledgeData, null, 2);
    }

    res.setHeader('Content-Type', contentType);
    res.status(200).send(content);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Export failed',
      message: error.message 
    });
  }
}

/**
 * Collect knowledge data from file system
 */
function collectKnowledge(dir, issue, rod) {
  const data = {
    metadata: {
      exportDate: new Date().toISOString(),
      filters: { issue, rod },
      totalRecords: 0
    },
    records: []
  };

  function walkDir(currentPath) {
    try {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Apply filters
          if (issue && !fullPath.includes(issue)) continue;
          if (rod && !fullPath.includes(rod)) continue;
          walkDir(fullPath);
        } else if (stat.isFile() && file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const json = JSON.parse(content);
            const relativePath = fullPath.replace(process.cwd(), '');

            data.records.push({
              path: relativePath,
              file,
              data: json,
              size: stat.size,
              modified: new Date(stat.mtime).toISOString()
            });
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (e) {
      // Skip directories
    }
  }

  walkDir(dir);
  data.metadata.totalRecords = data.records.length;
  return data;
}

/**
 * Convert to CSV format
 */
function convertToCSV(data) {
  const headers = ['File Path', 'Issue ID', 'Rod Number', 'Modified Date', 'Size (bytes)'];
  const rows = [headers.join(',')];

  for (const record of data.records) {
    const row = [
      `"${record.path}"`,
      record.data.issue_id || '',
      record.data.rod_number || '',
      record.modified,
      record.size
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Convert to Markdown format
 */
function convertToMarkdown(data) {
  let markdown = '# Knowledge Export\n\n';
  markdown += `**Export Date:** ${data.metadata.exportDate}\n`;
  markdown += `**Total Records:** ${data.metadata.totalRecords}\n\n`;

  if (data.metadata.filters.issue) {
    markdown += `**Filtered by Issue:** ${data.metadata.filters.issue}\n`;
  }
  if (data.metadata.filters.rod) {
    markdown += `**Filtered by Rod:** ${data.metadata.filters.rod}\n`;
  }

  markdown += '\n## Records\n\n';

  for (const record of data.records) {
    markdown += `### ${record.file}\n`;
    markdown += `- **Path:** ${record.path}\n`;
    markdown += `- **Modified:** ${record.modified}\n`;
    markdown += `- **Size:** ${record.size} bytes\n`;
    markdown += '\n```json\n';
    markdown += JSON.stringify(record.data, null, 2);
    markdown += '\n```\n\n';
  }

  return markdown;
}
