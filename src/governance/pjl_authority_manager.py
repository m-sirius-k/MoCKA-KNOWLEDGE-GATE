# MoCKA PJL Authority Manager
# Version: 1.0
# PJL (Project Lead) 権限管理システム

from enum import Enum
from typing import Dict, List, Set
from dataclasses import dataclass, field
from datetime import datetime
import json

class Permission(Enum):
    """PJL権限を次列挙。"""
    READ_ALL = "read_all"
    WRITE_ALL = "write_all"
    AUDIT_ALL = "audit_all"
    OVERRIDE = "override"
    READ_PUBLIC = "read_public"
    READ_RESTRICTED = "read_restricted_if_assigned"
    WRITE_OWN = "write_own"
    APPEND_LOGS = "append_logs"

class Classification(Enum):
    """3段階の情報分類。"""
    PUBLIC = "Public"
    RESTRICTED = "Restricted"
    CONFIDENTIAL = "Confidential"

@dataclass
class Role:
    """MoCKA内のロール定群。"""
    name: str
    permissions: Set[Permission] = field(default_factory=set)
    description: str = ""

    def has_permission(self, permission: Permission) -> bool:
        """Permissionを次推断しているか確事。"""
        return permission in self.permissions

    def grant_permission(self, permission: Permission):
        """Permissionを付与。"""
        self.permissions.add(permission)

    def revoke_permission(self, permission: Permission):
        """Permissionを取り上げ。"""
        self.permissions.discard(permission)

@dataclass
class AccessControlEntry:
    """Access Control Listの単一エントリ。"""
    role_name: str
    classification: Classification
    readable: bool = False
    writable: bool = False
    audit_readable: bool = False
    timestamp: datetime = field(default_factory=datetime.now)

class PJLAuthorityManager:
    """PJL (Project Lead) 権限管理システム。"""

    def __init__(self):
        """Initialize PJL Authority Manager."""
        self.roles: Dict[str, Role] = {}
        self.acl: Dict[str, List[AccessControlEntry]] = {}
        self.initialization_time = datetime.now()
        self._initialize_default_roles()

    def _initialize_default_roles(self):
        """Defaultロールを初期化。"""
        # PJLロール - 完全な権限
        pjl_role = Role(
            name="PJL",
            description="Project Lead holds complete sovereignty over all knowledge assets"
        )
        pjl_role.permissions = {
            Permission.READ_ALL,
            Permission.WRITE_ALL,
            Permission.AUDIT_ALL,
            Permission.OVERRIDE
        }
        self.roles["PJL"] = pjl_role

        # AIロール - 限定的な権限
        ai_role = Role(
            name="AI",
            description="AI agents can read public/assigned content and write own declarations"
        )
        ai_role.permissions = {
            Permission.READ_PUBLIC,
            Permission.READ_RESTRICTED,
            Permission.WRITE_OWN,
            Permission.APPEND_LOGS
        }
        self.roles["AI"] = ai_role

    def get_role(self, role_name: str) -> Role:
        """Retrieve a role by name."""
        if role_name not in self.roles:
            raise ValueError(f"Role '{role_name}' not found")
        return self.roles[role_name]

    def create_role(self, name: str, description: str = "") -> Role:
        """Create a new role."""
        if name in self.roles:
            raise ValueError(f"Role '{name}' already exists")
        role = Role(name=name, description=description)
        self.roles[name] = role
        return role

    def delete_role(self, role_name: str):
        """Delete a role."""
        if role_name in ["PJL", "AI"]:
            raise ValueError(f"Cannot delete system role '{role_name}'")
        if role_name in self.roles:
            del self.roles[role_name]

    def check_access(self, role_name: str, permission: Permission) -> bool:
        """Check if a role has a specific permission."""
        if role_name not in self.roles:
            return False
        return self.roles[role_name].has_permission(permission)

    def set_acl(self, resource_id: str, acl_entries: List[AccessControlEntry]):
        """Set Access Control List for a resource."""
        self.acl[resource_id] = acl_entries

    def get_acl(self, resource_id: str) -> List[AccessControlEntry]:
        """Get Access Control List for a resource."""
        return self.acl.get(resource_id, [])

    def can_read(self, role_name: str, resource_id: str, classification: Classification) -> bool:
        """Check if a role can read a resource with given classification."""
        role = self.get_role(role_name)
        
        # PJL can read everything
        if role_name == "PJL":
            return True
        
        # AI agents
        if role_name == "AI":
            if classification == Classification.PUBLIC:
                return role.has_permission(Permission.READ_PUBLIC)
            elif classification in [Classification.RESTRICTED, Classification.CONFIDENTIAL]:
                return role.has_permission(Permission.READ_RESTRICTED)
        
        return False

    def can_write(self, role_name: str, resource_id: str) -> bool:
        """Check if a role can write to a resource."""
        role = self.get_role(role_name)
        
        if role_name == "PJL":
            return role.has_permission(Permission.WRITE_ALL)
        
        if role_name == "AI":
            return role.has_permission(Permission.WRITE_OWN)
        
        return False

    def to_dict(self) -> dict:
        """Export to dictionary."""
        return {
            "initialization_time": self.initialization_time.isoformat(),
            "roles": {
                role_name: {
                    "name": role.name,
                    "permissions": [p.value for p in role.permissions],
                    "description": role.description
                }
                for role_name, role in self.roles.items()
            },
            "acl_count": len(self.acl)
        }

    def to_json(self) -> str:
        """Export to JSON string."""
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)
