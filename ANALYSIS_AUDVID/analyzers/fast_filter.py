"""
Fast Filter Module (CLIP-based)

Uses CLIP model for rapid semantic similarity detection.
Acts as the first stage in the cascade - fast filtering before deep analysis.
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Union
import logging

try:
    import torch
    from sentence_transformers import SentenceTransformer, util
    from PIL import Image
    import numpy as np
except ImportError as e:
    raise ImportError(f"Missing dependency: {e}. Run: pip install torch sentence-transformers pillow numpy")

import yaml
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from trigger_categories import TRIGGER_CATEGORIES, TriggerCategory, DetectionType


logger = logging.getLogger(__name__)


class FastFilter:
    """
    CLIP-based fast filter for initial trigger screening.
    
    Uses semantic similarity between images and text prompts to rapidly
    identify potentially triggering content for deeper analysis.
    """
    
    def __init__(self, config_path: str = "config.yaml", device: Optional[str] = None):
        """
        Initialize the fast filter with CLIP model.
        
        Args:
            config_path: Path to configuration YAML
            device: Device to use ('cpu', 'cuda', 'mps', or 'auto')
        """
        self.config = self._load_config(config_path)
        
        # Determine device
        analysis_config = self.config.get('analysis', {})
        self.device = device or analysis_config.get('device', 'auto')
        if self.device == 'auto':
            self.device = self._detect_device()
        
        self.batch_size = analysis_config.get('batch_size', 8)
        self.default_threshold = analysis_config.get('clip_threshold', 0.25)
        
        # Load per-category thresholds
        self.category_thresholds = self.config.get('trigger_thresholds', {})
        
        # Load CLIP model
        logger.info(f"Loading CLIP model on {self.device}...")
        self.model = SentenceTransformer('clip-ViT-B-32', device=self.device)
        
        # Pre-compute text embeddings for all triggers
        self._prepare_embeddings()
        
        logger.info(f"FastFilter ready: {len(self.text_prompts)} prompts indexed")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found at {config_path}, using defaults")
            return {}
    
    def _detect_device(self) -> str:
        """Auto-detect best available device"""
        if torch.cuda.is_available():
            return 'cuda'
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return 'mps'
        return 'cpu'
    
    def _prepare_embeddings(self):
        """Pre-compute text embeddings for all trigger prompts"""
        self.text_prompts: List[str] = []
        self.prompt_to_category: Dict[str, str] = {}
        
        # Collect all visual prompts from categories that use CLIP
        for category_name, category in TRIGGER_CATEGORIES.items():
            if category.detection_type in [DetectionType.CLIP, DetectionType.FUSION, DetectionType.VLM]:
                for prompt in category.visual_prompts:
                    self.text_prompts.append(prompt)
                    self.prompt_to_category[prompt] = category_name
        
        # Encode all text prompts
        logger.info(f"Encoding {len(self.text_prompts)} text prompts...")
        self.text_embeddings = self.model.encode(
            self.text_prompts,
            convert_to_tensor=True,
            show_progress_bar=False
        )
        
        # Also add neutral/safe prompts for baseline comparison
        self.safe_prompts = ["neutral scene", "normal movie scene", "safe content"]
        self.safe_embeddings = self.model.encode(
            self.safe_prompts,
            convert_to_tensor=True,
            show_progress_bar=False
        )
    
    def get_threshold(self, category_name: str) -> float:
        """Get the threshold for a specific category"""
        # First check config overrides
        if category_name in self.category_thresholds:
            return self.category_thresholds[category_name]
        
        # Then check category default
        if category_name in TRIGGER_CATEGORIES:
            return TRIGGER_CATEGORIES[category_name].default_threshold
        
        # Fallback to global default
        return self.default_threshold
    
    def analyze_image(self, image: Union[str, Path, Image.Image, np.ndarray]) -> Dict[str, float]:
        """
        Analyze a single image for potential triggers.
        
        Args:
            image: Path to image, PIL Image, or numpy array
        
        Returns:
            Dict mapping category names to their highest similarity scores
        """
        # Convert to PIL Image if needed
        if isinstance(image, (str, Path)):
            image = Image.open(image).convert('RGB')
        elif isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        # Get image embedding
        img_embedding = self.model.encode(
            image,
            convert_to_tensor=True,
            show_progress_bar=False
        )
        
        # Compute similarity with all trigger prompts
        similarities = util.cos_sim(img_embedding, self.text_embeddings)[0]
        
        # Aggregate scores by category (take max per category)
        category_scores: Dict[str, float] = {}
        
        for idx, prompt in enumerate(self.text_prompts):
            category_name = self.prompt_to_category[prompt]
            score = similarities[idx].item()
            
            if category_name not in category_scores:
                category_scores[category_name] = score
            else:
                category_scores[category_name] = max(category_scores[category_name], score)
        
        return category_scores
    
    def is_suspicious(self, scores: Dict[str, float]) -> Tuple[bool, List[str]]:
        """
        Determine if any category exceeds its threshold.
        
        Args:
            scores: Dict of category scores from analyze_image
        
        Returns:
            Tuple of (is_suspicious, list of suspicious category names)
        """
        suspicious_categories = []
        
        for category_name, score in scores.items():
            threshold = self.get_threshold(category_name)
            if score >= threshold:
                suspicious_categories.append(category_name)
        
        return len(suspicious_categories) > 0, suspicious_categories
    
    def analyze_batch(self, images: List[Union[str, Path, Image.Image]]) -> List[Dict[str, float]]:
        """
        Analyze a batch of images efficiently.
        
        Args:
            images: List of image paths or PIL Images
        
        Returns:
            List of category score dicts (one per image)
        """
        # Convert all to PIL Images
        pil_images = []
        for img in images:
            if isinstance(img, (str, Path)):
                pil_images.append(Image.open(img).convert('RGB'))
            elif isinstance(img, np.ndarray):
                pil_images.append(Image.fromarray(img))
            else:
                pil_images.append(img)
        
        # Batch encode images
        img_embeddings = self.model.encode(
            pil_images,
            batch_size=self.batch_size,
            convert_to_tensor=True,
            show_progress_bar=False
        )
        
        # Compute similarities for all images
        all_similarities = util.cos_sim(img_embeddings, self.text_embeddings)
        
        # Convert to category scores for each image
        results = []
        for img_idx in range(len(images)):
            category_scores: Dict[str, float] = {}
            
            for prompt_idx, prompt in enumerate(self.text_prompts):
                category_name = self.prompt_to_category[prompt]
                score = all_similarities[img_idx][prompt_idx].item()
                
                if category_name not in category_scores:
                    category_scores[category_name] = score
                else:
                    category_scores[category_name] = max(category_scores[category_name], score)
            
            results.append(category_scores)
        
        return results
    
    def filter_images(self, image_paths: List[Path]) -> List[Tuple[Path, List[str]]]:
        """
        Filter a list of images, returning only suspicious ones.
        
        Args:
            image_paths: List of paths to analyze
        
        Returns:
            List of (path, suspicious_categories) tuples for suspicious images only
        """
        suspicious_results = []
        
        # Process in batches
        for i in range(0, len(image_paths), self.batch_size):
            batch_paths = image_paths[i:i + self.batch_size]
            batch_scores = self.analyze_batch(batch_paths)
            
            for path, scores in zip(batch_paths, batch_scores):
                is_sus, categories = self.is_suspicious(scores)
                if is_sus:
                    suspicious_results.append((path, categories))
        
        return suspicious_results


def main():
    """CLI entry point for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test CLIP fast filter")
    parser.add_argument('image', help='Path to image to analyze')
    parser.add_argument('--config', default='config.yaml', help='Config file')
    args = parser.parse_args()
    
    logging.basicConfig(level=logging.INFO)
    
    filter = FastFilter(config_path=args.config)
    scores = filter.analyze_image(args.image)
    
    print("\n📊 Analysis Results:")
    print("-" * 40)
    for category, score in sorted(scores.items(), key=lambda x: -x[1]):
        threshold = filter.get_threshold(category)
        status = "⚠️ " if score >= threshold else "  "
        print(f"{status}{category}: {score:.3f} (threshold: {threshold})")
    
    is_sus, categories = filter.is_suspicious(scores)
    if is_sus:
        print(f"\n🚨 SUSPICIOUS: {', '.join(categories)}")
    else:
        print("\n✅ No triggers detected")


if __name__ == "__main__":
    main()
