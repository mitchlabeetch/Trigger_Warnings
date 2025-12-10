"""
Deep Analyzer Module (VLM via Ollama)

Uses Moondream or similar vision-language models via Ollama API
for deep confirmation of suspicious frames.
"""

import base64
import time
from pathlib import Path
from typing import Optional, Dict, Union
import logging

try:
    import requests
    from PIL import Image
    import numpy as np
except ImportError as e:
    raise ImportError(f"Missing dependency: {e}. Run: pip install requests pillow numpy")

import yaml
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from trigger_categories import TRIGGER_CATEGORIES


logger = logging.getLogger(__name__)


class DeepAnalyzer:
    """
    Vision-Language Model analyzer using Ollama API.
    
    This is the "expensive" step in the cascade - only called on
    frames that passed the fast filter. Uses natural language 
    prompts to confirm or deny detected triggers.
    """
    
    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialize the deep analyzer.
        
        Args:
            config_path: Path to configuration YAML
        """
        self.config = self._load_config(config_path)
        
        analysis_config = self.config.get('analysis', {})
        self.ollama_url = analysis_config.get('ollama_url', 'http://localhost:11434/api/generate')
        self.model_name = analysis_config.get('vlm_model', 'moondream')
        self.timeout = analysis_config.get('vlm_timeout', 30)
        self.threshold = analysis_config.get('vlm_threshold', 0.6)
        
        # Test connection
        self._test_connection()
        
        logger.info(f"DeepAnalyzer ready: model={self.model_name}")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found at {config_path}, using defaults")
            return {}
    
    def _test_connection(self):
        """Test that Ollama is running and model is available"""
        try:
            # Check if Ollama is running
            response = requests.get(
                self.ollama_url.replace('/api/generate', '/api/tags'),
                timeout=5
            )
            response.raise_for_status()
            
            # Check if model is pulled
            models = response.json().get('models', [])
            model_names = [m.get('name', '').split(':')[0] for m in models]
            
            if self.model_name not in model_names:
                logger.warning(
                    f"Model '{self.model_name}' not found. "
                    f"Available models: {model_names}. "
                    f"Run: ollama pull {self.model_name}"
                )
        except requests.exceptions.ConnectionError:
            logger.warning(
                f"Cannot connect to Ollama at {self.ollama_url}. "
                "Make sure Ollama is running: ollama serve"
            )
        except Exception as e:
            logger.warning(f"Ollama connection test failed: {e}")
    
    def _image_to_base64(self, image: Union[str, Path, Image.Image, np.ndarray]) -> str:
        """Convert image to base64 string for Ollama API"""
        # Convert to PIL Image if needed
        if isinstance(image, (str, Path)):
            img = Image.open(image)
        elif isinstance(image, np.ndarray):
            img = Image.fromarray(image)
        else:
            img = image
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if too large (Moondream has limits)
        max_size = 1024
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to bytes
        from io import BytesIO
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        
        return base64.b64encode(buffer.read()).decode('utf-8')
    
    def analyze_trigger(
        self,
        image: Union[str, Path, Image.Image, np.ndarray],
        trigger_category: str,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Confirm a specific trigger in an image using VLM.
        
        Args:
            image: Image to analyze
            trigger_category: Category name from TRIGGER_CATEGORIES
            custom_prompt: Optional custom prompt (overrides default)
        
        Returns:
            Dict with 'confirmed' (bool), 'confidence' (float), 'raw_response' (str)
        """
        # Get category info
        category = TRIGGER_CATEGORIES.get(trigger_category)
        
        if custom_prompt:
            prompt = custom_prompt
        elif category:
            prompt = category.vlm_prompt_template.format(trigger=trigger_category)
        else:
            prompt = f"Does this image contain {trigger_category}? Answer YES or NO."
        
        # Convert image to base64
        image_b64 = self._image_to_base64(image)
        
        # Build request
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "images": [image_b64],
            "stream": False,
            "options": {
                "temperature": 0.1,  # Low temperature for consistent yes/no
                "num_predict": 50    # Short response
            }
        }
        
        try:
            start_time = time.time()
            
            response = requests.post(
                self.ollama_url,
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            elapsed = time.time() - start_time
            
            result = response.json()
            raw_response = result.get('response', '').strip().lower()
            
            # Parse response - look for yes/no patterns
            confirmed = False
            confidence = 0.0
            
            # Strong yes indicators
            if any(x in raw_response for x in ['yes', 'correct', 'affirmative', 'indeed', 'certainly']):
                confirmed = True
                confidence = 0.85
                
                # Boost confidence for emphatic responses
                if any(x in raw_response for x in ['definitely', 'clearly', 'obviously']):
                    confidence = 0.95
            
            # Strong no indicators
            elif any(x in raw_response for x in ['no', 'not', 'negative', 'cannot see', 'don\'t see']):
                confirmed = False
                confidence = 0.85
            
            # Uncertain responses
            else:
                # Check for hedging language
                if any(x in raw_response for x in ['possibly', 'maybe', 'might', 'unclear', 'hard to tell']):
                    # Default to safe (trigger detected) but with low confidence
                    confirmed = True
                    confidence = 0.5
                else:
                    # Can't parse, assume negative but log
                    logger.warning(f"Unparseable VLM response: {raw_response[:100]}")
                    confirmed = False
                    confidence = 0.3
            
            return {
                'confirmed': confirmed,
                'confidence': confidence,
                'raw_response': raw_response,
                'elapsed_seconds': elapsed,
                'category': trigger_category
            }
        
        except requests.exceptions.Timeout:
            logger.error(f"VLM timeout after {self.timeout}s")
            return {
                'confirmed': True,  # Fail safe - assume trigger present
                'confidence': 0.0,
                'raw_response': 'TIMEOUT',
                'elapsed_seconds': self.timeout,
                'category': trigger_category
            }
        
        except requests.exceptions.RequestException as e:
            logger.error(f"VLM request failed: {e}")
            return {
                'confirmed': True,  # Fail safe
                'confidence': 0.0,
                'raw_response': f'ERROR: {e}',
                'elapsed_seconds': 0,
                'category': trigger_category
            }
    
    def analyze_multiple_triggers(
        self,
        image: Union[str, Path, Image.Image, np.ndarray],
        trigger_categories: list
    ) -> Dict[str, Dict]:
        """
        Check multiple trigger categories for a single image.
        
        Args:
            image: Image to analyze
            trigger_categories: List of category names to check
        
        Returns:
            Dict mapping category names to their analysis results
        """
        # Convert image once
        image_b64 = self._image_to_base64(image)
        
        results = {}
        for category in trigger_categories:
            result = self.analyze_trigger(image, category)
            results[category] = result
        
        return results
    
    def is_ollama_available(self) -> bool:
        """Check if Ollama service is running"""
        try:
            response = requests.get(
                self.ollama_url.replace('/api/generate', '/api/tags'),
                timeout=2
            )
            return response.status_code == 200
        except:
            return False


def main():
    """CLI entry point for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test VLM deep analyzer")
    parser.add_argument('image', help='Path to image to analyze')
    parser.add_argument('--category', default='Violence', help='Trigger category')
    parser.add_argument('--prompt', help='Custom prompt to use')
    parser.add_argument('--config', default='config.yaml', help='Config file')
    args = parser.parse_args()
    
    logging.basicConfig(level=logging.INFO)
    
    analyzer = DeepAnalyzer(config_path=args.config)
    
    if not analyzer.is_ollama_available():
        print("❌ Ollama is not running. Start it with: ollama serve")
        return
    
    result = analyzer.analyze_trigger(
        args.image,
        args.category,
        custom_prompt=args.prompt
    )
    
    print("\n🔬 Deep Analysis Results:")
    print("-" * 40)
    print(f"Category: {result['category']}")
    print(f"Confirmed: {'🚨 YES' if result['confirmed'] else '✅ NO'}")
    print(f"Confidence: {result['confidence']:.0%}")
    print(f"Time: {result['elapsed_seconds']:.2f}s")
    print(f"\nRaw Response: {result['raw_response'][:200]}")


if __name__ == "__main__":
    main()
