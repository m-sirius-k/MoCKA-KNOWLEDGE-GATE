import admin from 'firebase-admin';
import fetch from 'node-fetch';

const db = admin.firestore();

export const PLATFORM_TYPES = {
  NOTION: 'notion',
  SLACK: 'slack',
  DISCORD: 'discord',
  GITHUB: 'github',
  NOTEBOOKLM: 'notebooklm',
  MEM_AI: 'mem-ai'
};

const platformConfigs = {
  [PLATFORM_TYPES.NOTION]: {
    baseUrl: 'https://api.notion.com/v1',
    version: '2022-06-28',
    endpoints: {
      databases: '/databases',
      pages: '/pages',
      users: '/users'
    }
  },
  [PLATFORM_TYPES.SLACK]: {
    baseUrl: 'https://slack.com/api',
    endpoints: {
      chat: '/chat.postMessage',
      channels: '/conversations.list',
      threads: '/conversations.history'
    }
  },
  [PLATFORM_TYPES.DISCORD]: {
    baseUrl: 'https://discord.com/api/v10',
    endpoints: {
      messages: '/channels/{channelId}/messages',
      channels: '/guilds/{guildId}/channels',
      threads: '/channels/{channelId}/threads'
    }
  }
};

export class PlatformIntegrationFactory {
  static async createIntegration(platform, config) {
    switch (platform) {
      case PLATFORM_TYPES.NOTION:
        return new NotionIntegration(config);
      case PLATFORM_TYPES.SLACK:
        return new SlackIntegration(config);
      case PLATFORM_TYPES.DISCORD:
        return new DiscordIntegration(config);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

class BaseIntegration {
  constructor(config) {
    this.config = config;
    this.platform = config.platform;
    this.apiKey = config.apiKey;
    this.baseUrl = platformConfigs[this.platform].baseUrl;
    this.db = db;
  }

  async logIntegration(issueId, rodNumber, action, result) {
    const timestamp = new Date().toISOString();
    const docId = `${this.platform}-${issueId}-${rodNumber}-${Date.now()}`;

    await this.db.collection('platform_integration_logs').doc(docId).set({
      platform: this.platform,
      issueId,
      rodNumber,
      action,
      timestamp,
      status: result.success ? 'success' : 'failed',
      result,
      metadata: this.config.metadata || {}
    });
  }

  async sendRequest(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      return { success: response.ok, data: result, status: response.status };
    } catch (error) {
      console.error(`Request to ${this.platform} failed:`, error);
      return { success: false, error: error.message };
    }
  }
}

class NotionIntegration extends BaseIntegration {
  async postToDB(issueId, rodNumber, content) {
    const payload = {
      parent: { database_id: this.config.databaseId },
      properties: {
        'ISSUE-ID': { title: [{ text: { content: issueId } }] },
        'ROD Number': { rich_text: [{ text: { content: rodNumber } }] },
        'Content': { rich_text: [{ text: { content: content.substring(0, 2000) } }] }
      }
    };

    const result = await this.sendRequest('POST', '/pages', payload, {
      'Notion-Version': platformConfigs[PLATFORM_TYPES.NOTION].version
    });

    await this.logIntegration(issueId, rodNumber, 'post_to_db', result);
    return result;
  }
}

class SlackIntegration extends BaseIntegration {
  async postMessage(issueId, rodNumber, content) {
    const payload = {
      channel: this.config.channelId,
      text: `ISSUE-${issueId} / ROD-${rodNumber}`,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `ISSUE-${issueId} (ROD-${rodNumber})` }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: content }
        }
      ]
    };

    const result = await this.sendRequest('POST', '/chat.postMessage', payload);
    await this.logIntegration(issueId, rodNumber, 'post_message', result);
    return result;
  }
}

class DiscordIntegration extends BaseIntegration {
  async sendMessage(issueId, rodNumber, content) {
    const endpoint = `/channels/${this.config.channelId}/messages`;
    const payload = {
      embeds: [{
        title: `ISSUE-${issueId}`,
        description: content,
        fields: [{
          name: 'ROD Number',
          value: rodNumber,
          inline: true
        }],
        timestamp: new Date().toISOString()
      }]
    };

    const result = await this.sendRequest('POST', endpoint, payload);
    await this.logIntegration(issueId, rodNumber, 'send_message', result);
    return result;
  }
}

export default PlatformIntegrationFactory;
