/**
 * Phase 1 Implementation: Divergence Score + Divergence Review Board
 * MoCKA System Defect Mitigation - AI-SHARE-014, 013
 * Owner: 倫理・コンプライアンスAI (Ethics & Compliance AI)
 * Due Date: 2025-11-26
 * 
 * Purpose:
 * - Calculate Divergence Score for PJL decisions
 * - Identify when expert bias may introduce novel risks
 * - Trigger Divergence Review Board for scores > 80
 * - Monitor Diversity Index across PJLS layer
 */

const crypto = require('crypto');

class DivergenceScoreChecker {
  constructor(config = {}) {
    this.config = {
      divergence_threshold: config.divergence_threshold || 80,
      depth_score_min: config.depth_score_min || 500,
      diversity_target: config.diversity_target || 0.75,
      ...config
    };
    
    this.audit_log = [];
    this.review_board_triggers = [];
  }

  /**
   * Calculate Divergence Score based on:
   * 1. Distance from historical knowledge (divergence_score)
   * 2. Cross-disciplinary approach (diversity assessment)
   * 3. Depth of analysis requirements
   */
  calculateDivergenceScore(pjl_decision) {
    const {
      decision_id,
      proposed_solution,
      historical_precedents,
      cross_disciplinary_score,
      expert_profile,
      risk_assessment,
      timestamp
    } = pjl_decision;

    // Step 1: Calculate distance from known knowledge
    const historical_distance = this._calculateHistoricalDistance(
      proposed_solution,
      historical_precedents
    );

    // Step 2: Assess cross-disciplinary novelty
    const novelty_factor = this._assessNoveltyFactor(
      cross_disciplinary_score,
      expert_profile
    );

    // Step 3: Calculate overall Divergence Score (0-100)
    const divergence_score = Math.min(
      100,
      Math.round((historical_distance * 0.4) + (novelty_factor * 0.6))
    );

    // Step 4: Calculate Diversity Index (for PJLS monitoring)
    const diversity_index = cross_disciplinary_score > 0.7 ? 1 : 0;

    const result = {
      decision_id,
      divergence_score,
      historical_distance,
      novelty_factor,
      diversity_index,
      risk_level: this._assessRiskLevel(divergence_score, risk_assessment),
      requires_review: divergence_score > this.config.divergence_threshold,
      timestamp,
      calculated_at: new Date().toISOString(),
      hash: crypto.createHash('sha256')
        .update(JSON.stringify({ decision_id, divergence_score, timestamp }))
        .digest('hex')
    };

    // Log for audit trail
    this._logAudit('DIVERGENCE_SCORE_CALCULATED', result);

    // Trigger Review Board if necessary
    if (result.requires_review) {
      this._triggerReviewBoard(result);
    }

    return result;
  }

  /**
   * Calculate distance from historical precedents (0-100)
   */
  _calculateHistoricalDistance(proposed, precedents = []) {
    if (!precedents || precedents.length === 0) {
      return 100; // Completely novel
    }

    // Simple similarity matching (in production, use vector DB or ML model)
    const similarities = precedents.map(p => {
      const common_elements = this._countCommonElements(proposed, p);
      return common_elements / Math.max(proposed.length, p.length);
    });

    const max_similarity = Math.max(...similarities, 0);
    return Math.round((1 - max_similarity) * 100);
  }

  /**
   * Assess novelty factor based on cross-disciplinary approach
   */
  _assessNoveltyFactor(cross_disc_score, expert_profile) {
    const score = (cross_disc_score || 0.5) * 100;
    
    // Penalize excessive specialization (potential bias)
    const specialization_penalty = expert_profile?.specialization_depth > 0.9 ? 20 : 0;
    
    return Math.max(0, Math.min(100, score + specialization_penalty));
  }

  /**
   * Assess risk level (LOW, MEDIUM, HIGH) based on divergence score and risk assessment
   */
  _assessRiskLevel(divergence_score, risk_assessment = {}) {
    const base_risk = risk_assessment?.base_level || 'MEDIUM';
    const risk_map = { 'LOW': 0, 'MEDIUM': 50, 'HIGH': 100 };
    const combined = (risk_map[base_risk] || 50 + divergence_score) / 2;

    if (combined > 75) return 'HIGH';
    if (combined > 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Trigger Divergence Review Board for high divergence scores
   */
  _triggerReviewBoard(divergence_result) {
    const review_id = `DRB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const review_ticket = {
      review_id,
      decision_id: divergence_result.decision_id,
      divergence_score: divergence_result.divergence_score,
      risk_level: divergence_result.risk_level,
      status: 'PENDING_REVIEW',
      triggered_at: new Date().toISOString(),
      required_approvers: [
        'Ethics-AI-01',
        'Compliance-AI-01',
        'Domain-Expert-AI'
      ],
      approval_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      signature: {
        trigger_agent: 'Ethics-Compliance-AI',
        trigger_timestamp: new Date().toISOString()
      }
    };

    this.review_board_triggers.push(review_ticket);
    this._logAudit('REVIEW_BOARD_TRIGGERED', review_ticket);
    
    return review_ticket;
  }

  /**
   * Monitor Diversity Index across PJLS layer (AI-SHARE-013)
   */
  calculateDiversityIndex(pjl_decisions) {
    if (!pjl_decisions || pjl_decisions.length === 0) {
      return 0;
    }

    const diversity_scores = pjl_decisions.map(d => {
      const cross_disc = d.cross_disciplinary_score || 0.5;
      return cross_disc > 0.7 ? 1 : 0;
    });

    const diversity_index = diversity_scores.reduce((a, b) => a + b, 0) / pjl_decisions.length;
    
    this._logAudit('DIVERSITY_INDEX_CALCULATED', {
      total_decisions: pjl_decisions.length,
      diversity_index,
      calculated_at: new Date().toISOString()
    });

    return diversity_index;
  }

  /**
   * Get Divergence Review Board status
   */
  getReviewBoardStatus() {
    return {
      total_triggered: this.review_board_triggers.length,
      pending_reviews: this.review_board_triggers.filter(r => r.status === 'PENDING_REVIEW'),
      completed_reviews: this.review_board_triggers.filter(r => r.status === 'COMPLETED'),
      triggers: this.review_board_triggers
    };
  }

  /**
   * Utility: count common elements between two arrays
   */
  _countCommonElements(arr1, arr2) {
    if (!arr1 || !arr2) return 0;
    return arr1.filter(e => arr2.includes(e)).length;
  }

  /**
   * Audit logging for compliance (AI-SHARE-016)
   */
  _logAudit(action, details) {
    const audit_entry = {
      action,
      details,
      timestamp: new Date().toISOString(),
      actor: 'Ethics-Compliance-AI'
    };
    
    this.audit_log.push(audit_entry);
    
    // In production: Send to centralized audit system (AI-SHARE-016)
    console.log(`[AUDIT] ${action}:`, JSON.stringify(audit_entry, null, 2));
  }

  /**
   * Get audit trail for review
   */
  getAuditTrail(filter = {}) {
    let filtered = this.audit_log;
    
    if (filter.action) {
      filtered = filtered.filter(e => e.action === filter.action);
    }
    if (filter.start_date) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filter.start_date));
    }
    
    return filtered;
  }
}

// Export for use in MoCKA system
module.exports = DivergenceScoreChecker;

// Test/Example usage
if (require.main === module) {
  const checker = new DivergenceScoreChecker({
    divergence_threshold: 80,
    divergence_review_board: true
  });

  // Test case: Novel cross-disciplinary decision
  const test_decision = {
    decision_id: 'PJL-2025-1101-001',
    proposed_solution: ['AI-driven', 'cross-functional', 'novel-approach'],
    historical_precedents: [
      ['AI-driven', 'traditional'],
      ['manual', 'cross-functional']
    ],
    cross_disciplinary_score: 0.85,
    expert_profile: { specialization_depth: 0.92 },
    risk_assessment: { base_level: 'MEDIUM' },
    timestamp: new Date().toISOString()
  };

  const result = checker.calculateDivergenceScore(test_decision);
  console.log('\n=== Divergence Score Result ===');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n=== Review Board Status ===');
  console.log(JSON.stringify(checker.getReviewBoardStatus(), null, 2));

  // ===== DRB Integration: Auto-Escalation & Unified Audit Logging =====

class DRBIntegration {
  constructor(config = {}) {
    this.config = config;
    this.escalation_log = [];
    this.unified_audit_log = [];
    this.decision_cache = new Map();
  }

  // Auto-escalation on high divergence
  autoEscalate(divergence_result, pjl_signoff_decision) {
    const escalation_id = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const escalation_decision = {
      escalation_id,
      decision_id: divergence_result.decision_id,
      divergence_score: divergence_result.divergence_score,
      risk_level: divergence_result.risk_level,
      requires_escalation: divergence_result.divergence_score > this.config.escalation_threshold || false,
      escalation_type: this._determineEscalationType(divergence_result),
      assigned_reviewers: this._assignReviewers(divergence_result),
      timestamp: new Date().toISOString(),
      original_pjl_decision: pjl_signoff_decision,
      escalation_reason: this._generateEscalationReason(divergence_result)
    };

    if (escalation_decision.requires_escalation) {
      this.escalation_log.push(escalation_decision);
      this._logUnifiedAudit('ESCALATION_TRIGGERED', escalation_decision);
    }

    return escalation_decision;
  }

  _determineEscalationType(divergence_result) {
    const score = divergence_result.divergence_score;
    if (score >= 90) return 'CRITICAL';
    if (score >= 80) return 'HIGH';
    if (score >= 70) return 'MEDIUM';
    return 'LOW';
  }

  _assignReviewers(divergence_result) {
    const risk = divergence_result.risk_level;
    const base_reviewers = ['Ethics-AI-01', 'Compliance-AI-01'];
    
    if (risk === 'HIGH') {
      base_reviewers.push('Domain-Expert-AI', 'Security-AI-01');
    }
    if (divergence_result.novelty_factor > 80) {
      base_reviewers.push('Innovation-Review-AI');
    }
    return base_reviewers;
  }

  _generateEscalationReason(divergence_result) {
    const reasons = [];
    if (divergence_result.divergence_score > 80) {
      reasons.push('High divergence score from historical precedents');
    }
    if (divergence_result.novelty_factor > 80) {
      reasons.push('Novel cross-disciplinary approach detected');
    }
    if (divergence_result.risk_level === 'HIGH') {
      reasons.push('High risk assessment');
    }
    return reasons.join(' | ');
  }

  // Unified audit logging for compliance
  _logUnifiedAudit(action, details) {
    const audit_entry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      system_version: '2.0-DRB-Integration',
      actor_agents: ['Ethics-Compliance-AI', 'DRB-Integration']
    };
    
    this.unified_audit_log.push(audit_entry);
    
    // Log to console for monitoring
    console.log(`[UNIFIED-AUDIT] ${action}:`, JSON.stringify(audit_entry, null, 2));
    
    return audit_entry;
  }

  // Get unified audit trail across both systems
  getUnifiedAuditTrail(filters = {}) {
    let trail = this.unified_audit_log;
    
    if (filters.action) {
      trail = trail.filter(e => e.action === filters.action);
    }
    if (filters.start_date) {
      trail = trail.filter(e => new Date(e.timestamp) >= new Date(filters.start_date));
    }
    if (filters.end_date) {
      trail = trail.filter(e => new Date(e.timestamp) <= new Date(filters.end_date));
    }
    
    return trail;
  }

  // Get escalation statistics
  getEscalationStats() {
    const critical = this.escalation_log.filter(e => e.escalation_type === 'CRITICAL').length;
    const high = this.escalation_log.filter(e => e.escalation_type === 'HIGH').length;
    const medium = this.escalation_log.filter(e => e.escalation_type === 'MEDIUM').length;
    const low = this.escalation_log.filter(e => e.escalation_type === 'LOW').length;
    
    return {
      total_escalations: this.escalation_log.length,
      by_type: { CRITICAL: critical, HIGH: high, MEDIUM: medium, LOW: low },
      last_escalation: this.escalation_log[this.escalation_log.length - 1] || null
    };
  }
}

// Export DRB Integration for use in MoCKA system
module.exports.DRBIntegration = DRBIntegration;
module.exports.DivergenceScoreChecker = DivergenceScoreChecker;
}
