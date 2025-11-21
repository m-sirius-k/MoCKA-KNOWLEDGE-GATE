src/phase8/utils/i18n.py# Phase 8: Multilingual Support Manager
# Internationalization (i18n) for MoCKA 2.0 Global Expansion

import os
import json
from typing import Dict, Optional

class I18nManager:
    """
    Manages translations for MoCKA 2.0 across multiple languages.
    Supports: English (en), Chinese Simplified (zh), Spanish (es)
    """

    def __init__(self, default_lang: str = "en"):
        """
        Initialize I18nManager with default language.
        
        Args:
            default_lang: Default language code (en, zh, es)
        """
        self.default_lang = default_lang
        self.translations: Dict[str, Dict[str, str]] = {}
        self.locales_dir = os.path.join(
            os.path.dirname(__file__),
            "..", "..", "..",
            "locales"
        )
        self.load_locales()

    def load_locales(self) -> None:
        """
        Load all available locale JSON files into memory.
        Supports: en.json, zh.json, es.json
        """
        locale_files = ["en.json", "zh.json", "es.json"]
        
        for filename in locale_files:
            filepath = os.path.join(self.locales_dir, filename)
            try:
                if os.path.exists(filepath):
                    lang_code = filename.split(".")[0]
                    with open(filepath, "r", encoding="utf-8") as f:
                        self.translations[lang_code] = json.load(f)
                        print(f"[i18n] Loaded {lang_code}: {len(self.translations[lang_code])} keys")
            except Exception as e:
                print(f"[i18n] Error loading {filename}: {e}")

    def translate(self, key: str, lang: Optional[str] = None) -> str:
        """
        Translate a key to the specified language.
        Falls back to default language if key or language not found.
        
        Args:
            key: Translation key (e.g., "task_completion_rate")
            lang: Target language code (e.g., "en", "zh", "es")
            
        Returns:
            Translated string, or key if translation not found
        """
        target_lang = lang or self.default_lang
        
        # Try to get from target language
        if target_lang in self.translations:
            if key in self.translations[target_lang]:
                return self.translations[target_lang][key]
        
        # Fallback to default language
        if self.default_lang in self.translations:
            if key in self.translations[self.default_lang]:
                return self.translations[self.default_lang][key]
        
        # Return key as last resort
        return key

    def available_languages(self) -> list:
        """
        Get list of available language codes.
        
        Returns:
            List of language codes (e.g., ["en", "zh", "es"])
        """
        return sorted(list(self.translations.keys()))

    def get_all_keys(self, lang: Optional[str] = None) -> list:
        """
        Get all translation keys for a language.
        
        Args:
            lang: Language code (defaults to default_lang)
            
        Returns:
            List of all translation keys
        """
        target_lang = lang or self.default_lang
        return list(self.translations.get(target_lang, {}).keys())

    def translate_dict(self, keys_dict: Dict[str, str], lang: Optional[str] = None) -> Dict[str, str]:
        """
        Translate multiple keys at once (batch translation).
        
        Args:
            keys_dict: Dictionary with keys to translate
            lang: Target language code
            
        Returns:
            Dictionary with translated values
        """
        return {k: self.translate(k, lang) for k in keys_dict.keys()}

    def get_status(self) -> dict:
        """
        Get current status of i18n manager.
        
        Returns:
            Dictionary with status information
        """
        return {
            "default_language": self.default_lang,
            "available_languages": self.available_languages(),
            "languages_loaded": len(self.translations),
            "total_keys": {lang: len(keys) for lang, keys in self.translations.items()}
        }


# Global i18n instance
_i18n_instance: Optional[I18nManager] = None

def get_i18n(default_lang: str = "en") -> I18nManager:
    """
    Get or create global i18n manager instance.
    
    Args:
        default_lang: Default language for new instance
        
    Returns:
        Global I18nManager instance
    """
    global _i18n_instance
    if _i18n_instance is None:
        _i18n_instance = I18nManager(default_lang)
    return _i18n_instance


# Example usage and testing
if __name__ == "__main__":
    print("\n=== MoCKA 2.0 Phase 8: i18n Manager Test ===")
    
    i18n = I18nManager(default_lang="en")
    
    print("\n1. Available Languages:")
    print(f"   Languages: {i18n.available_languages()}")
    
    print("\n2. Status:")
    status = i18n.get_status()
    for key, value in status.items():
        print(f"   {key}: {value}")
    
    print("\n3. Sample Translations:")
    test_keys = [
        "task_completion_rate",
        "sla_compliance_rate",
        "improvement_proposals",
        "average_trust_score",
        "requeue_rate"
    ]
    
    for lang in i18n.available_languages():
        print(f"\n   Language: {lang}")
        for key in test_keys:
            translation = i18n.translate(key, lang)
            print(f"      {key} -> {translation}")
    
    print("\n=== Test Complete ===")
