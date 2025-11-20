# MoCKA Access Control Engine
# Version: 1.0
# アクセス制御を実施するエンジン

from enum import Enum
from typing import Dict, List, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import json

class AccessAction(Enum):
    """Accessを求める操作の列挙。"""
    READ = "READ"
    WRITE = "WRITE"
    DELETE = "DELETE"
    AUDIT = "AUDIT"

@dataclass
class AccessRequest:
    """Access求求を表す。"""
    actor: str  # AIやPJLの名前
    resource_id: str  # 特定リソースID
    action: AccessAction  # 実施する操作
    classification: str  # 情報分類 (Public/Restricted/Confidential)
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class AccessDecision:
    """Access求求を訿得した結果。"""
    allowed: bool
    reason: str
    actor: str
    resource_id: str
    action: AccessAction
    timestamp: datetime = field(default_factory=datetime.now)

class AccessControlEngine:
    """MoCKAアクセス制御エンジン。"""

    def __init__(self):
        """Initialize Access Control Engine."""
        self.acl_rules: Dict[Tuple[str, str, str], bool] = {}
        self.access_log: List[AccessDecision] = []
        self.denial_log: List[AccessDecision] = []
        self._initialize_default_rules()

    def _initialize_default_rules(self):
        """Defaultアクセス制御ルールを推定。"""
        # PJL has full access
        self.acl_rules[("PJL", "*", "*")] = True

        # AI agents can read public and assigned restricted content
        self.acl_rules[("AI", "Public", "READ")] = True
        self.acl_rules[("AI", "Restricted", "READ")] = True

        # AI agents can write only to their own resources
        self.acl_rules[("AI", "Public", "WRITE")] = False
        self.acl_rules[("AI", "Restricted", "WRITE")] = False
        self.acl_rules[("AI", "Confidential", "*")] = False

    def evaluate_request(self, request: AccessRequest) -> AccessDecision:
        """Evaluate an access request."""
        allowed = self._check_permission(request)

        reason = self._generate_reason(request, allowed)

        decision = AccessDecision(
            allowed=allowed,
            reason=reason,
            actor=request.actor,
            resource_id=request.resource_id,
            action=request.action
        )

        # Log access
        if allowed:
            self.access_log.append(decision)
        else:
            self.denial_log.append(decision)

        return decision

    def _check_permission(self, request: AccessRequest) -> bool:
        """Check permission based on rules."""
        # PJL has full access
        if request.actor == "PJL":
            return True

        # Check specific rule
        rule_key = (request.actor, request.classification, request.action.value)
        if rule_key in self.acl_rules:
            return self.acl_rules[rule_key]

        # Check wildcard rule
        wildcard_key = (request.actor, request.classification, "*")
        if wildcard_key in self.acl_rules:
            return self.acl_rules[wildcard_key]

        # Default deny
        return False

    def _generate_reason(self, request: AccessRequest, allowed: bool) -> str:
        """Generate human-readable reason for decision."""
        if allowed:
            if request.actor == "PJL":
                return "PJL has full access"
            return f"Access granted: {request.actor} can {request.action.value} {request.classification} content"
        else:
            return f"Access denied: {request.actor} cannot {request.action.value} {request.classification} content"

    def add_rule(self, actor: str, classification: str, action: str, allowed: bool):
        """Add a custom ACL rule."""
        rule_key = (actor, classification, action)
        self.acl_rules[rule_key] = allowed

    def remove_rule(self, actor: str, classification: str, action: str):
        """Remove a custom ACL rule."""
        rule_key = (actor, classification, action)
        if rule_key in self.acl_rules:
            del self.acl_rules[rule_key]

    def get_access_log(self) -> List[AccessDecision]:
        """Get all approved access decisions."""
        return self.access_log

    def get_denial_log(self) -> List[AccessDecision]:
        """Get all denied access decisions."""
        return self.denial_log

    def get_statistics(self) -> dict:
        """Get access control statistics."""
        total_requests = len(self.access_log) + len(self.denial_log)
        return {
            "total_requests": total_requests,
            "approved_requests": len(self.access_log),
            "denied_requests": len(self.denial_log),
            "approval_rate": len(self.access_log) / total_requests if total_requests > 0 else 0,
            "active_rules": len(self.acl_rules)
        }

    def to_dict(self) -> dict:
        """Export to dictionary."""
        return {
            "acl_rules_count": len(self.acl_rules),
            "access_log_count": len(self.access_log),
            "denial_log_count": len(self.denial_log),
            "statistics": self.get_statistics()
        }

    def to_json(self) -> str:
        """Export to JSON string."""
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False, default=str)
