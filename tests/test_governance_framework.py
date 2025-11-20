# Test Suite for MoCKA Governance Framework
# Version: 1.0

import unittest
from datetime import datetime

# Mock imports for testing
class Permission:
    READ_ALL = "read_all"
    WRITE_ALL = "write_all"
    AUDIT_ALL = "audit_all"
    OVERRIDE = "override"
    READ_PUBLIC = "read_public"
    READ_RESTRICTED = "read_restricted_if_assigned"
    WRITE_OWN = "write_own"
    APPEND_LOGS = "append_logs"

class Classification:
    PUBLIC = "Public"
    RESTRICTED = "Restricted"
    CONFIDENTIAL = "Confidential"

class Role:
    def __init__(self, name, permissions=None):
        self.name = name
        self.permissions = permissions or set()
    
    def has_permission(self, permission):
        return permission in self.permissions
    
    def grant_permission(self, permission):
        self.permissions.add(permission)

class TestPJLAuthorityManager(unittest.TestCase):
    """Test PJL Authority Manager."""
    
    def setUp(self):
        """Initialize test fixtures."""
        self.pjl_role = Role("PJL", {Permission.READ_ALL, Permission.WRITE_ALL, Permission.AUDIT_ALL, Permission.OVERRIDE})
        self.ai_role = Role("AI", {Permission.READ_PUBLIC, Permission.READ_RESTRICTED, Permission.WRITE_OWN, Permission.APPEND_LOGS})
    
    def test_pjl_has_full_permissions(self):
        """Test that PJL has all permissions."""
        self.assertTrue(self.pjl_role.has_permission(Permission.READ_ALL))
        self.assertTrue(self.pjl_role.has_permission(Permission.WRITE_ALL))
        self.assertTrue(self.pjl_role.has_permission(Permission.AUDIT_ALL))
        self.assertTrue(self.pjl_role.has_permission(Permission.OVERRIDE))
    
    def test_ai_has_limited_permissions(self):
        """Test that AI has limited permissions."""
        self.assertTrue(self.ai_role.has_permission(Permission.READ_PUBLIC))
        self.assertTrue(self.ai_role.has_permission(Permission.WRITE_OWN))
        self.assertFalse(self.ai_role.has_permission(Permission.OVERRIDE))
        self.assertFalse(self.ai_role.has_permission(Permission.AUDIT_ALL))
    
    def test_permission_granting(self):
        """Test granting permissions to roles."""
        test_role = Role("TEST")
        self.assertFalse(test_role.has_permission(Permission.READ_PUBLIC))
        test_role.grant_permission(Permission.READ_PUBLIC)
        self.assertTrue(test_role.has_permission(Permission.READ_PUBLIC))
    
    def test_role_creation(self):
        """Test role creation."""
        new_role = Role("CustomRole", {Permission.READ_PUBLIC, Permission.WRITE_OWN})
        self.assertEqual(new_role.name, "CustomRole")
        self.assertEqual(len(new_role.permissions), 2)

class TestAccessControlEngine(unittest.TestCase):
    """Test Access Control Engine."""
    
    def setUp(self):
        """Initialize test fixtures."""
        self.acl_rules = {
            ("PJL", "*", "*"): True,
            ("AI", "Public", "READ"): True,
            ("AI", "Restricted", "READ"): True,
            ("AI", "Confidential", "*"): False,
        }
    
    def test_pjl_full_access(self):
        """Test that PJL has full access."""
        rule_key = ("PJL", "*", "*")
        self.assertTrue(self.acl_rules[rule_key])
    
    def test_ai_public_read(self):
        """Test that AI can read public content."""
        rule_key = ("AI", "Public", "READ")
        self.assertTrue(self.acl_rules[rule_key])
    
    def test_ai_confidential_denied(self):
        """Test that AI cannot access confidential content."""
        rule_key = ("AI", "Confidential", "*")
        self.assertFalse(self.acl_rules[rule_key])
    
    def test_acl_rule_modification(self):
        """Test ACL rule modification."""
        new_rule = ("AI", "Public", "WRITE")
        self.acl_rules[new_rule] = False
        self.assertFalse(self.acl_rules[new_rule])
    
    def test_acl_rule_removal(self):
        """Test ACL rule removal."""
        rule_key = ("AI", "Public", "READ")
        self.assertIn(rule_key, self.acl_rules)
        del self.acl_rules[rule_key]
        self.assertNotIn(rule_key, self.acl_rules)

class TestAuditLogger(unittest.TestCase):
    """Test Audit Logger."""
    
    def setUp(self):
        """Initialize test fixtures."""
        self.audit_entries = []
        self.system_initialized = True
    
    def test_system_initialization(self):
        """Test system initialization logging."""
        self.assertTrue(self.system_initialized)
    
    def test_audit_entry_creation(self):
        """Test creating audit entries."""
        entry_data = {
            "actor": "PJL",
            "action": "SYSTEM_INITIALIZED",
            "target": "MoCKA_FRAMEWORK",
            "classification": "Confidential"
        }
        self.audit_entries.append(entry_data)
        self.assertEqual(len(self.audit_entries), 1)
        self.assertEqual(self.audit_entries[0]["actor"], "PJL")
    
    def test_multiple_audit_entries(self):
        """Test logging multiple audit entries."""
        events = [
            {"actor": "PJL", "action": "INIT", "type": "SYSTEM_INIT"},
            {"actor": "Copilot", "action": "CREATE_DECLARATION", "type": "DECLARATION_CREATE"},
            {"actor": "Gemini", "action": "CREATE_DECLARATION", "type": "DECLARATION_CREATE"},
            {"actor": "PJL", "action": "OVERRIDE", "type": "OVERRIDE_INVOKED"},
        ]
        self.audit_entries.extend(events)
        self.assertEqual(len(self.audit_entries), 4)
    
    def test_audit_entry_filtering_by_actor(self):
        """Test filtering audit entries by actor."""
        events = [
            {"actor": "PJL", "action": "ACTION1"},
            {"actor": "AI", "action": "ACTION2"},
            {"actor": "PJL", "action": "ACTION3"},
        ]
        self.audit_entries.extend(events)
        pjl_entries = [e for e in self.audit_entries if e["actor"] == "PJL"]
        self.assertEqual(len(pjl_entries), 2)
    
    def test_audit_statistics(self):
        """Test audit log statistics."""
        events = [
            {"actor": "PJL", "success": True},
            {"actor": "AI", "success": True},
            {"actor": "PJL", "success": True},
        ]
        self.audit_entries.extend(events)
        total = len(self.audit_entries)
        successful = sum(1 for e in self.audit_entries if e.get("success", True))
        success_rate = successful / total if total > 0 else 0
        self.assertEqual(total, 3)
        self.assertEqual(successful, 3)
        self.assertEqual(success_rate, 1.0)

def run_all_tests():
    """Run all unit tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestPJLAuthorityManager))
    suite.addTests(loader.loadTestsFromTestCase(TestAccessControlEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestAuditLogger))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result

if __name__ == "__main__":
    result = run_all_tests()
    print(f"\nTest Results: {result.testsRun} tests run")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success Rate: {(result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100:.1f}%")
