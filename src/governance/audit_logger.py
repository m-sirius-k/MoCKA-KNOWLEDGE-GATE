# MoCKA Audit Logger
# Version: 1.0
# 監査ログ実装 - 全てのガバナンスイベントを記録

from enum import Enum
from typing import List, Optional, Dict
from dataclasses import dataclass, field, asdict
from datetime import datetime
import json
import uuid

class AuditEventType(Enum):
    """Auditイベントの種類。"""
    SYSTEM_INIT = "SYSTEM_INIT"
    DECLARATION_CREATE = "DECLARATION_CREATE"
    DECLARATION_MODIFY = "DECLARATION_MODIFY"
    REVISION_APPEND = "REVISION_APPEND"
    ACCESS_GRANTED = "ACCESS_GRANTED"
    ACCESS_DENIED = "ACCESS_DENIED"
    OVERRIDE_INVOKED = "OVERRIDE_INVOKED"
    ROLE_CHANGE = "ROLE_CHANGE"
    ACL_MODIFICATION = "ACL_MODIFICATION"

@dataclass
class AuditEntry:
    """Single audit log entry."""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.now)
    event_type: AuditEventType = AuditEventType.SYSTEM_INIT
    actor: str = "SYSTEM"
    role: str = "SYSTEM"
    action: str = ""
    target: str = ""
    classification: str = "Confidential"
    trust_score: float = 5.0
    details: Dict = field(default_factory=dict)
    success: bool = True

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        data['event_type'] = self.event_type.value
        return data

    def to_json_line(self) -> str:
        """Convert to JSON Lines format."""
        return json.dumps(self.to_dict(), ensure_ascii=False)

class AuditLogger:
    """MoCKA監査ロガー。"""

    def __init__(self, max_entries: int = 10000):
        """Initialize Audit Logger."""
        self.audit_entries: List[AuditEntry] = []
        self.max_entries = max_entries
        self.entry_index: Dict[str, AuditEntry] = {}
        self._log_system_init()

    def _log_system_init(self):
        """Log system initialization."""
        entry = AuditEntry(
            event_type=AuditEventType.SYSTEM_INIT,
            actor="SYSTEM",
            action="SYSTEM_INITIALIZED",
            target="MoCKA_GOVERNANCE_FRAMEWORK",
            classification="Confidential",
            trust_score=5.0
        )
        self._add_entry(entry)

    def _add_entry(self, entry: AuditEntry):
        """Add entry to audit log."""
        self.audit_entries.append(entry)
        self.entry_index[entry.event_id] = entry

        # Enforce max entries
        if len(self.audit_entries) > self.max_entries:
            removed_entry = self.audit_entries.pop(0)
            del self.entry_index[removed_entry.event_id]

    def log_event(self, event_type: AuditEventType, actor: str, role: str,
                  action: str, target: str, classification: str = "Confidential",
                  trust_score: float = 5.0, details: Optional[Dict] = None,
                  success: bool = True) -> AuditEntry:
        """Log an audit event."""
        entry = AuditEntry(
            event_type=event_type,
            actor=actor,
            role=role,
            action=action,
            target=target,
            classification=classification,
            trust_score=trust_score,
            details=details or {},
            success=success
        )
        self._add_entry(entry)
        return entry

    def log_declaration_create(self, actor: str, target: str, classification: str = "Restricted") -> AuditEntry:
        """Log declaration creation."""
        return self.log_event(
            event_type=AuditEventType.DECLARATION_CREATE,
            actor=actor,
            role="AI" if actor != "PJL" else "PJL",
            action="CREATE_DECLARATION",
            target=target,
            classification=classification,
            trust_score=3.8 if actor != "PJL" else 5.0
        )

    def log_revision_append(self, actor: str, target: str, classification: str = "Confidential") -> AuditEntry:
        """Log revision append."""
        return self.log_event(
            event_type=AuditEventType.REVISION_APPEND,
            actor=actor,
            role="PJL",
            action="APPEND_REVISION",
            target=target,
            classification=classification,
            trust_score=4.2
        )

    def log_access_decision(self, actor: str, allowed: bool, target: str, action: str) -> AuditEntry:
        """Log access control decision."""
        event_type = AuditEventType.ACCESS_GRANTED if allowed else AuditEventType.ACCESS_DENIED
        return self.log_event(
            event_type=event_type,
            actor=actor,
            role="AI" if actor != "PJL" else "PJL",
            action=action,
            target=target,
            classification="Confidential",
            success=allowed
        )

    def log_override(self, actor: str, target: str, reason: str = "") -> AuditEntry:
        """Log PJL override action."""
        return self.log_event(
            event_type=AuditEventType.OVERRIDE_INVOKED,
            actor=actor,
            role="PJL",
            action="INVOKE_OVERRIDE",
            target=target,
            classification="Restricted",
            trust_score=5.0,
            details={"reason": reason}
        )

    def get_entries(self, limit: Optional[int] = None) -> List[AuditEntry]:
        """Get audit entries."""
        if limit:
            return self.audit_entries[-limit:]
        return self.audit_entries

    def get_entries_by_actor(self, actor: str) -> List[AuditEntry]:
        """Get entries by actor."""
        return [e for e in self.audit_entries if e.actor == actor]

    def get_entries_by_type(self, event_type: AuditEventType) -> List[AuditEntry]:
        """Get entries by event type."""
        return [e for e in self.audit_entries if e.event_type == event_type]

    def export_jsonl(self) -> str:
        """Export all entries as JSON Lines."""
        return "\n".join(e.to_json_line() for e in self.audit_entries)

    def get_statistics(self) -> dict:
        """Get audit log statistics."""
        return {
            "total_entries": len(self.audit_entries),
            "event_types": {
                et.value: len([e for e in self.audit_entries if e.event_type == et])
                for et in AuditEventType
            },
            "actors": list(set(e.actor for e in self.audit_entries)),
            "success_rate": sum(1 for e in self.audit_entries if e.success) / len(self.audit_entries) if self.audit_entries else 0
        }

    def to_dict(self) -> dict:
        """Export to dictionary."""
        return {
            "total_entries": len(self.audit_entries),
            "statistics": self.get_statistics(),
            "entries_sample": [e.to_dict() for e in self.audit_entries[-5:]]
        }

    def to_json(self) -> str:
        """Export to JSON string."""
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False, default=str)
