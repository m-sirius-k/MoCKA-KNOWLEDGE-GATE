/**
 * Phase 1 Implementation: System Health KPI
 * MoCKA System Defect Mitigation - DR Load Reduction
 * AI-SHARE-001, 026, 028
 * Owner: プロジェクト・リーダー AI
 * Due Date: 2025-11-26
 */

const EventEmitter = require('events');

class SystemHealthKPI extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      approval_turnaround_sla: config.approval_turnaround_sla || 4,
      pending_proposals_sla: config.pending_proposals_sla || 7,
      cycle_time_sla: config.cycle_time_sla || 25,
      auto_prioritization: config.auto_prioritization !== false,
      dashboard_update_interval: config.dashboard_update_interval || 60000,
      ...config
    };
    
    this.health_metrics = {
      approval_turnaround_days: 0,
      status: 'OK',
      pending_proposals: 0,
      cycle_time_days: 0,
      auto_deprioritized: 0
    };
    
    this.kpi_history = [];
    this.alerts = [];
    this.proposal_queue = [];
  }

  /**
   * Record system health status
   * Monitors DR's workload (DRきむら様) and triggers auto-prioritization
   */
  recordHealthStatus(status_data) {
    const {
      approval_turnaround_days,
      pending_proposals_count,
      cycle_time_days,
      auto_deprioritized_count,
      timestamp,
      dr_workload_index
    } = status_data;

    const current_status = {
      approval_turnaround_days: approval_turnaround_days || 0,
      pending_proposals: pending_proposals_count || 0,
      cycle_time_days: cycle_time_days || 0,
      auto_deprioritized: auto_deprioritized_count || 0,
      status: 'OK',
      timestamp: timestamp || new Date().toISOString(),
      dr_workload_index: dr_workload_index || 0.5,
      sla_compliance: {}
    };

    // Check SLA compliance for each metric
    current_status.sla_compliance.approval_sla = approval_turnaround_days <= this.config.approval_turnaround_sla;
    current_status.sla_compliance.pending_sla = pending_proposals_count <= this.config.pending_proposals_sla;
    current_status.sla_compliance.cycle_sla = cycle_time_days <= this.config.cycle_time_sla;

    // Determine overall health status
    const sla_failures = Object.values(current_status.sla_compliance).filter(v => !v).length;
    if (sla_failures >= 2) {
      current_status.status = 'CRITICAL';
      this._triggerAlert('CRITICAL_SLA_BREACH', current_status);
    } else if (sla_failures === 1) {
      current_status.status = 'WARNING';
      this._triggerAlert('WARNING_SLA_APPROACHING', current_status);
    }

    // Check if auto-prioritization needed (high DR workload)
    if (current_status.dr_workload_index > 0.75 && this.config.auto_prioritization) {
      this._triggerAutoPrioritization(current_status);
    }

    this.health_metrics = current_status;
    this.kpi_history.push(current_status);
    
    // Keep history to last 100 records
    if (this.kpi_history.length > 100) {
      this.kpi_history = this.kpi_history.slice(-100);
    }

    this.emit('health:status-updated', current_status);
    return current_status;
  }

  /**
   * Trigger auto-prioritization when DR workload exceeds threshold
   * Automatically deprioritizes lower-urgency proposals
   */
  _triggerAutoPrioritization(status) {
    const priority_rules = {
      high_workload: status.dr_workload_index > 0.75,
      pending_exceeds_sla: status.pending_proposals > this.config.pending_proposals_sla,
      turnaround_exceeds_sla: status.approval_turnaround_days > this.config.approval_turnaround_sla
    };

    if (!Object.values(priority_rules).some(v => v)) {
      return;
    }

    const deprioritization_action = {
      action_id: `APrio-${Date.now()}`,
      triggered_at: new Date().toISOString(),
      reason: priority_rules,
      status: 'AUTO_APPLIED',
      deprioritized_count: 0,
      affected_proposals: []
    };

    // In production: Apply deprioritization logic to proposal queue
    // This is a placeholder for the actual logic
    this.emit('autoPrio:triggered', deprioritization_action);
    
    this._logKPIEvent('AUTO_PRIORITIZATION_TRIGGERED', deprioritization_action);
    
    return deprioritization_action;
  }

  /**
   * Enqueue proposal for processing
   */
  addProposal(proposal) {
    const {
      proposal_id,
      priority,
      urgency_level,
      submitted_at,
      estimated_review_time
    } = proposal;

    const queued_proposal = {
      proposal_id: proposal_id || this._generateProposalId(),
      priority: priority || 'NORMAL',
      urgency_level: urgency_level || 'MEDIUM',
      submitted_at: submitted_at || new Date().toISOString(),
      estimated_review_time: estimated_review_time || 2,
      status: 'QUEUED',
      queue_position: this.proposal_queue.length + 1
    };

    this.proposal_queue.push(queued_proposal);
    this._logKPIEvent('PROPOSAL_QUEUED', queued_proposal);

    return queued_proposal;
  }

  /**
   * Get current SLA status
   */
  getSLAStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: {
        approval_turnaround: {
          current: this.health_metrics.approval_turnaround_days,
          sla: this.config.approval_turnaround_sla,
          compliant: this.health_metrics.approval_turnaround_days <= this.config.approval_turnaround_sla,
          unit: 'days'
        },
        pending_proposals: {
          current: this.health_metrics.pending_proposals,
          sla: this.config.pending_proposals_sla,
          compliant: this.health_metrics.pending_proposals <= this.config.pending_proposals_sla,
          unit: 'count'
        },
        cycle_time: {
          current: this.health_metrics.cycle_time_days,
          sla: this.config.cycle_time_sla,
          compliant: this.health_metrics.cycle_time_days <= this.config.cycle_time_sla,
          unit: 'days'
        }
      },
      overall_status: this.health_metrics.status,
      health_index: this._calculateHealthIndex()
    };
  }

  /**
   * Calculate system health index (0-100)
   */
  _calculateHealthIndex() {
    const metrics = this.health_metrics.sla_compliance || {};
    const compliance_count = Object.values(metrics).filter(v => v).length;
    const total_metrics = Object.keys(metrics).length;
    
    return total_metrics > 0 ? Math.round((compliance_count / total_metrics) * 100) : 100;
  }

  /**
   * Get DR workload status
   */
  getDRWorkloadStatus() {
    return {
      workload_index: this.health_metrics.dr_workload_index || 0,
      status: (this.health_metrics.dr_workload_index || 0) > 0.75 ? 'HIGH' : 'NORMAL',
      pending_items: this.health_metrics.pending_proposals || 0,
      queue_length: this.proposal_queue.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get proposal queue status
   */
  getQueueStatus() {
    const by_priority = {};
    this.proposal_queue.forEach(p => {
      by_priority[p.priority] = (by_priority[p.priority] || 0) + 1;
    });

    return {
      total_queued: this.proposal_queue.length,
      by_priority,
      oldest_proposal_age_hours: this.proposal_queue.length > 0 ?
        Math.round((Date.now() - new Date(this.proposal_queue[0].submitted_at).getTime()) / 3600000) : 0,
      estimated_total_review_time: this.proposal_queue.reduce((sum, p) => sum + (p.estimated_review_time || 0), 0)
    };
  }

  /**
   * Trigger alert for KPI violations
   */
  _triggerAlert(alert_type, details) {
    const alert = {
      alert_id: `ALERT-${Date.now()}`,
      type: alert_type,
      details,
      triggered_at: new Date().toISOString(),
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alert:triggered', alert);
    
    this._logKPIEvent('KPI_ALERT_TRIGGERED', alert);
    
    return alert;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alert_id) {
    const alert = this.alerts.find(a => a.alert_id === alert_id);
    if (alert) {
      alert.resolved = true;
      alert.resolved_at = new Date().toISOString();
      this.emit('alert:resolved', alert);
    }
    return alert;
  }

  /**
   * Generate proposal ID
   */
  _generateProposalId() {
    return `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log KPI event
   */
  _logKPIEvent(action, details) {
    console.log(`[SYSTEM-HEALTH-KPI] ${action}:`, JSON.stringify({
      action,
      details,
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  /**
   * Get KPI history
   */
  getKPIHistory(limit = 10) {
    return this.kpi_history.slice(-limit);
  }
}

/**
 * PHASE 2: DR Workload Auto-Calculation & SLA Auto-Remediation
 * - Automated DR workload index calculation
 * - SLA violation auto-remediation
 * - Proposal priority auto-adjustment (AI-SHARE-001, 026, 028)
 */

class DRWorkloadCalculator {
  constructor(config = {}) {
    this.historyWindow = config.historyWindow || 24 * 60 * 60 * 1000;
    this.metrics = [];
  }

  calculateWorkloadIndex(approvalDays, pendingCount, cycleTimeDays) {
    const approvalFactor = Math.min(approvalDays / 10, 1.0);
    const pendingFactor = Math.min(pendingCount / 20, 1.0);
    const cycleFactor = Math.min(cycleTimeDays / 30, 1.0);
    const workloadIndex = (approvalFactor * 0.40) + (pendingFactor * 0.35) + (cycleFactor * 0.25);
    
    this.metrics.push({
      timestamp: new Date().toISOString(),
      approval_days: approvalDays,
      pending_count: pendingCount,
      cycle_time_days: cycleTimeDays,
      workload_index: workloadIndex
    });
    
    const cutoffTime = Date.now() - this.historyWindow;
    this.metrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime);
    return Math.round(workloadIndex * 100) / 100;
  }

  getTrendAnalysis() {
    if (this.metrics.length < 2) return { trend: 'insufficient_data' };
    const recent = this.metrics.slice(-5);
    const indices = recent.map(m => m.workload_index);
    const avg = indices.reduce((a, b) => a + b, 0) / indices.length;
    const trend = indices[indices.length - 1] > indices[0] ? 'increasing' : 'decreasing';
    return { trend, current: indices[indices.length - 1], average: Math.round(avg * 100) / 100 };
  }
}

class SLAAutoRemediator {
  constructor(config = {}) {
    this.remediationLog = [];
  }

  checkSLAViolations(healthMetrics) {
    const violations = [];
    if (healthMetrics.approval_turnaround_days > 4) violations.push({ type: 'approval_sla_violated', severity: 'high' });
    if (healthMetrics.pending_proposals > 7) violations.push({ type: 'pending_sla_violated', severity: 'high' });
    if (healthMetrics.cycle_time_days > 25) violations.push({ type: 'cycle_time_sla_violated', severity: 'medium' });
    return violations;
  }

  applyAutoRemediation(violations, proposalQueue) {
    const actions = [];
    for (const v of violations) {
      if (v.type === 'approval_sla_violated') actions.push({ type: 'escalate_approvers', affected: 5 });
      if (v.type === 'pending_sla_violated') actions.push({ type: 'auto_deprioritize_low' });
      if (v.type === 'cycle_time_sla_violated') actions.push({ type: 'enable_batch_review' });
    }
    this.remediationLog.push({ timestamp: new Date().toISOString(), actions_count: actions.length, actions });
    return actions;
  }
}

module.exports = SystemHealthKPI;
module.exports.DRWorkloadCalculator = DRWorkloadCalculator;
module.exports.SLAAutoRemediator = SLAAutoRemediator;

module.exports = SystemHealthKPI;
