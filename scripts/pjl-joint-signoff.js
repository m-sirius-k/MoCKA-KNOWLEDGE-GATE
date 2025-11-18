/**
 * Phase 1 Implementation: PJL Joint Sign-off Mechanism
 * MoCKA System Defect Mitigation - AI-SHARE-019, 020
 * Owner: PJLメタ協調委員会
 * Due Date: 2025-11-26
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class PJLJointSignoff extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      required_signatures: 2,
      signature_algorithm: 'sha256',
      timeout_ms: 5 * 24 * 60 * 60 * 1000,
      ...config
    };
    this.signoff_records = new Map();
    this.signature_log = [];
    this.handover_queue = [];
  }

  initiateHandover(handover_request) {
    const {
      handover_id,
      from_pjl,
      to_pjl,
      project_id,
      rod_number,
      decision_items,
      risk_assessment,
      timestamp
    } = handover_request;

    if (!from_pjl || !to_pjl || !rod_number) {
      throw new Error('Missing required handover information');
    }

    const handover_ticket = {
      handover_id: handover_id || this._generateHandoverId(),
      from_pjl,
      to_pjl,
      project_id,
      rod_number,
      decision_items: decision_items || [],
      risk_assessment,
      status: 'PENDING_SIGNATURES',
      created_at: timestamp || new Date().toISOString(),
      signatures: {
        from_pjl: null,
        to_pjl: null
      },
      signature_timestamps: {},
      deadline: new Date(Date.now() + this.config.timeout_ms).toISOString(),
      handover_timestamp: null
    };

    this.signoff_records.set(handover_ticket.handover_id, handover_ticket);
    this.handover_queue.push(handover_ticket.handover_id);
    this._logSignatureEvent('HANDOVER_INITIATED', handover_ticket);
    this.emit('handover:initiated', handover_ticket);

    return handover_ticket;
  }

  signoffFromPJL(handover_id, from_pjl_public_key, from_pjl_private_key) {
    return this._applySignature(
      handover_id,
      'from_pjl',
      from_pjl_public_key,
      from_pjl_private_key
    );
  }

  signoffToPJL(handover_id, to_pjl_public_key, to_pjl_private_key) {
    return this._applySignature(
      handover_id,
      'to_pjl',
      to_pjl_public_key,
      to_pjl_private_key
    );
  }

  _applySignature(handover_id, signer_role, public_key, private_key) {
    const record = this.signoff_records.get(handover_id);
    
    if (!record) {
      throw new Error(`Handover not found: ${handover_id}`);
    }

    if (record.status !== 'PENDING_SIGNATURES') {
      throw new Error(`Handover cannot be signed: current status ${record.status}`);
    }

    const data_to_sign = JSON.stringify({
      handover_id: record.handover_id,
      rod_number: record.rod_number,
      project_id: record.project_id,
      from_pjl: record.from_pjl,
      to_pjl: record.to_pjl,
      timestamp: new Date().toISOString()
    });

    const signature = crypto
      .createHmac(this.config.signature_algorithm, private_key)
      .update(data_to_sign)
      .digest('hex');

    record.signatures[signer_role] = signature;
    record.signature_timestamps[signer_role] = new Date().toISOString();

    this._logSignatureEvent('SIGNATURE_APPLIED', {
      handover_id,
      signer_role,
      public_key: public_key.substring(0, 16) + '...',
      signature: signature.substring(0, 16) + '...'
    });

    if (this._allSignaturesComplete(record)) {
      this._completeHandover(record);
    }

    return {
      handover_id,
      signer_role,
      signature_accepted: true,
      status: record.status,
      remaining_signatures: this._getRemainingSignatures(record)
    };
  }

  _allSignaturesComplete(record) {
    return (
      record.signatures.from_pjl !== null &&
      record.signatures.to_pjl !== null
    );
  }

  _getRemainingSignatures(record) {
    const remaining = [];
    if (!record.signatures.from_pjl) remaining.push('from_pjl');
    if (!record.signatures.to_pjl) remaining.push('to_pjl');
    return remaining;
  }

  _completeHandover(record) {
    record.status = 'COMPLETED';
    record.handover_timestamp = new Date().toISOString();

    this._logSignatureEvent('HANDOVER_COMPLETED', {
      handover_id: record.handover_id,
      from_pjl: record.from_pjl,
      to_pjl: record.to_pjl,
      rod_number: record.rod_number,
      completed_at: record.handover_timestamp
    });

    this.emit('handover:completed', record);
    this.handover_queue = this.handover_queue.filter(id => id !== record.handover_id);
  }

  verifyHandover(handover_id) {
    const record = this.signoff_records.get(handover_id);
    
    if (!record) {
      return { valid: false, reason: 'Handover not found' };
    }

    if (record.status !== 'COMPLETED') {
      return { valid: false, reason: `Handover status is ${record.status}` };
    }

    const signatures_valid = (
      record.signatures.from_pjl !== null &&
      record.signatures.to_pjl !== null
    );

    return {
      valid: signatures_valid,
      handover_id,
      rod_number: record.rod_number,
      from_pjl: record.from_pjl,
      to_pjl: record.to_pjl,
      completed_at: record.handover_timestamp,
      reason: signatures_valid ? 'Handover verified' : 'Invalid signatures'
    };
  }

  getHandoverStatus(handover_id) {
    const record = this.signoff_records.get(handover_id);
    
    if (!record) {
      return { error: 'Handover not found' };
    }

    return {
      handover_id,
      status: record.status,
      rod_number: record.rod_number,
      from_pjl: record.from_pjl,
      to_pjl: record.to_pjl,
      signatures: {
        from_pjl: record.signatures.from_pjl !== null ? 'SIGNED' : 'PENDING',
        to_pjl: record.signatures.to_pjl !== null ? 'SIGNED' : 'PENDING'
      },
      created_at: record.created_at,
      deadline: record.deadline,
      completed_at: record.handover_timestamp
    };
  }

  getPendingHandovers() {
    return this.handover_queue
      .map(id => this.signoff_records.get(id))
      .filter(record => record && record.status === 'PENDING_SIGNATURES')
      .map(record => ({
        handover_id: record.handover_id,
        from_pjl: record.from_pjl,
        to_pjl: record.to_pjl,
        rod_number: record.rod_number,
        created_at: record.created_at,
        deadline: record.deadline,
        signatures_needed: this._getRemainingSignatures(record)
      }));
  }

  _generateHandoverId() {
    return `HO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  _logSignatureEvent(action, details) {
    const log_entry = {
      action,
      details,
      timestamp: new Date().toISOString(),
      actor: 'PJL-Joint-Signoff-System'
    };
    
    this.signature_log.push(log_entry);
    console.log(`[JOINT-SIGNOFF] ${action}:`, JSON.stringify(log_entry, null, 2));
  }

  getAuditTrail(filter = {}) {
    let filtered = this.signature_log;
    if (filter.action) {
      filtered = filtered.filter(e => e.action === filter.action);
    }
    return filtered;
  }
}

module.exports = PJLJointSignoff;
