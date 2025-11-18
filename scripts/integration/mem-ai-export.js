/**
 * Mem.ai to GitHub Export Script
 * 
 * This script exports notes from Mem.ai collections to GitHub as markdown files.
 * It uses the Mem.ai API to fetch notes and the GitHub API to create/update files.
 * 
 * Prerequisites:
 * - MEM_API_KEY: Mem.ai API key
 * - GITHUB_TOKEN: GitHub personal access token
 * - MEM_COLLECTION_ID: The Mem collection ID to export
 * 
 * Usage:
 * MEM_API_KEY=xxx GITHUB_TOKEN=xxx MEM_COLLECTION_ID=yyy node mem-ai-export.js
 */

const axios = require('axios');
const { Octokit } = require('@octokit/rest');
const path = require('path');

// Configuration
const MEM_API_KEY = process.env.MEM_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const MEM_COLLECTION_ID = process.env.MEM_COLLECTION_ID;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'nsjpkimura-del';
const GITHUB_REPO = process.env.GITHUB_REPO || 'MoCKA-KNOWLEDGE-GATE';
const EXPORT_PATH = process.env.EXPORT_PATH || 'exported-mems';

if (!MEM_API_KEY) throw new Error('MEM_API_KEY is required');
if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
if (!MEM_COLLECTION_ID) throw new Error('MEM_COLLECTION_ID is required');

// Initialize API clients
const memAPI = axios.create({
  baseURL: 'https://api.mem.ai/v0',
  headers: {
    'Authorization': `Bearer ${MEM_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

/**
 * Fetch mems from Mem.ai collection
 */
async function fetchMems() {
  try {
    console.log(`Fetching mems from collection: ${MEM_COLLECTION_ID}`);
    const response = await memAPI.get('/mems', {
      params: {
        collection_id: MEM_COLLECTION_ID
      }
    });
    console.log(`Found ${response.data.length || 0} mems`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching mems:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Convert mem content to GitHub-friendly format
 */
function formatMemContent(mem) {
  let content = mem.content || '';
  
  // Add metadata header
  const header = `---\nmem_id: ${mem.id}\ncreated_at: ${mem.createdAt || new Date().toISOString()}\nmodified_at: ${mem.modifiedAt || new Date().toISOString()}\n---\n\n`;
  
  return header + content;
}

/**
 * Create or update file in GitHub
 */
async function commitToGitHub(mem, filePath) {
  try {
    const content = formatMemContent(mem);
    const encodedContent = Buffer.from(content).toString('base64');
    
    console.log(`Creating/updating file: ${filePath}`);
    
    try {
      // Try to get existing file to get SHA for update
      const existingFile = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: filePath
      });
      
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: filePath,
        message: `Update mem: ${mem.id}`,
        content: encodedContent,
        sha: existingFile.data.sha
      });
      console.log(`Updated: ${filePath}`);
    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist, create it
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: filePath,
          message: `Add mem: ${mem.id}`,
          content: encodedContent
        });
        console.log(`Created: ${filePath}`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(`Error committing to GitHub: ${filePath}`, error.message);
    throw error;
  }
}

/**
 * Generate filename from mem
 */
function generateFilename(mem, index) {
  const titleMatch = mem.content?.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-') : `mem-${index}`;
  return path.join(EXPORT_PATH, `${title}.md`);
}

/**
 * Main export function
 */
async function exportMems() {
  try {
    console.log('\n=== Mem.ai to GitHub Export ===\n');
    console.log(`Configuration:`);
    console.log(`  Collection ID: ${MEM_COLLECTION_ID}`);
    console.log(`  Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    console.log(`  Export Path: ${EXPORT_PATH}\n`);
    
    const mems = await fetchMems();
    
    if (!mems || mems.length === 0) {
      console.log('No mems found to export.');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < mems.length; i++) {
      try {
        const mem = mems[i];
        const filePath = generateFilename(mem, i);
        await commitToGitHub(mem, filePath);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to export mem ${i}:`, error.message);
      }
    }
    
    console.log(`\n=== Export Complete ===`);
    console.log(`Total mems: ${mems.length}`);
    console.log(`Successfully exported: ${successCount}`);
    console.log(`Failed: ${errorCount}\n`);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  exportMems();
}

module.exports = {
  fetchMems,
  commitToGitHub,
  generateFilename,
  exportMems
};
