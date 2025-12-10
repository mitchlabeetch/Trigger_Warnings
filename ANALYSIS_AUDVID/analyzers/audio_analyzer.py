"""
Audio Analyzer Module (CLAP-based)

Uses CLAP (Contrastive Language-Audio Pretraining) for zero-shot
audio classification to detect audio triggers like emetophobia sounds.
"""

import time
from pathlib import Path
from typing import Dict, List, Optional, Union
import logging

try:
    import torch
    from transformers import AutoProcessor, ClapModel
    import librosa
    import numpy as np
except ImportError as e:
    raise ImportError(
        f"Missing dependency: {e}. "
        "Run: pip install torch transformers librosa soundfile"
    )

import yaml
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from trigger_categories import TRIGGER_CATEGORIES, DetectionType, get_all_audio_prompts


logger = logging.getLogger(__name__)


class AudioAnalyzer:
    """
    CLAP-based audio analyzer for trigger sound detection.
    
    Uses zero-shot classification to match audio clips against
    text descriptions of triggering sounds.
    """
    
    def __init__(self, config_path: str = "config.yaml", device: Optional[str] = None):
        """
        Initialize the audio analyzer with CLAP model.
        
        Args:
            config_path: Path to configuration YAML
            device: Device to use ('cpu', 'cuda', 'mps', or 'auto')
        """
        self.config = self._load_config(config_path)
        
        analysis_config = self.config.get('analysis', {})
        self.device = device or analysis_config.get('device', 'auto')
        if self.device == 'auto':
            self.device = self._detect_device()
        
        self.default_threshold = analysis_config.get('clip_threshold', 0.25)
        self.category_thresholds = self.config.get('trigger_thresholds', {})
        
        # Load CLAP model
        logger.info(f"Loading CLAP model on {self.device}...")
        self.model_name = "laion/clap-htsat-unfused"
        self.processor = AutoProcessor.from_pretrained(self.model_name)
        self.model = ClapModel.from_pretrained(self.model_name).to(self.device)
        self.model.eval()
        
        # Prepare audio prompts
        self._prepare_prompts()
        
        logger.info(f"AudioAnalyzer ready: {len(self.audio_prompts)} prompts indexed")
    
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
    
    def _prepare_prompts(self):
        """Prepare audio prompts for classification"""
        self.audio_prompts: List[str] = []
        self.prompt_to_category: Dict[str, str] = {}
        
        # Collect audio prompts from categories that use audio
        for category_name, category in TRIGGER_CATEGORIES.items():
            if category.detection_type == DetectionType.FUSION:
                for prompt in category.audio_prompts:
                    self.audio_prompts.append(prompt)
                    self.prompt_to_category[prompt] = category_name
        
        # Add safe/neutral prompts for baseline
        self.safe_prompts = [
            "silence",
            "background music",
            "normal conversation",
            "ambient noise"
        ]
        
        # All prompts including safe ones
        self.all_prompts = self.audio_prompts + self.safe_prompts
        
        # Pre-compute text embeddings
        with torch.no_grad():
            inputs = self.processor(text=self.all_prompts, return_tensors="pt", padding=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            self.text_embeddings = self.model.get_text_features(**inputs)
    
    def load_audio(self, audio_path: Union[str, Path], target_sr: int = 48000) -> np.ndarray:
        """
        Load and preprocess audio file.
        
        Args:
            audio_path: Path to audio file (WAV, MP3, etc.)
            target_sr: Target sample rate
        
        Returns:
            Audio waveform as numpy array
        """
        # Load audio file
        waveform, sr = librosa.load(str(audio_path), sr=target_sr, mono=True)
        return waveform
    
    def analyze_audio(
        self,
        audio: Union[str, Path, np.ndarray],
        sample_rate: int = 48000
    ) -> Dict[str, float]:
        """
        Analyze audio clip for potential triggers.
        
        Args:
            audio: Path to audio file or numpy waveform
            sample_rate: Sample rate (only needed if audio is numpy array)
        
        Returns:
            Dict mapping category names to their similarity scores
        """
        # Load audio if path provided
        if isinstance(audio, (str, Path)):
            waveform = self.load_audio(audio)
        else:
            waveform = audio
        
        # Process audio through CLAP
        with torch.no_grad():
            inputs = self.processor(
                audios=waveform,
                sampling_rate=sample_rate,
                return_tensors="pt",
                padding=True
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            audio_embedding = self.model.get_audio_features(**inputs)
        
        # Compute similarity with all prompts
        similarities = torch.nn.functional.cosine_similarity(
            audio_embedding.unsqueeze(1),
            self.text_embeddings.unsqueeze(0),
            dim=-1
        )[0]
        
        # Aggregate scores by category (only for trigger prompts, not safe ones)
        category_scores: Dict[str, float] = {}
        
        for idx, prompt in enumerate(self.audio_prompts):
            if idx < len(self.audio_prompts):  # Only trigger prompts
                category_name = self.prompt_to_category[prompt]
                score = similarities[idx].item()
                
                if category_name not in category_scores:
                    category_scores[category_name] = score
                else:
                    category_scores[category_name] = max(category_scores[category_name], score)
        
        return category_scores
    
    def get_threshold(self, category_name: str) -> float:
        """Get the threshold for a specific category"""
        if category_name in self.category_thresholds:
            return self.category_thresholds[category_name]
        
        if category_name in TRIGGER_CATEGORIES:
            return TRIGGER_CATEGORIES[category_name].default_threshold
        
        return self.default_threshold
    
    def is_trigger_detected(self, scores: Dict[str, float]) -> tuple[bool, List[str]]:
        """
        Determine if any audio trigger exceeds its threshold.
        
        Args:
            scores: Dict of category scores
        
        Returns:
            Tuple of (is_detected, list of detected categories)
        """
        detected = []
        
        for category, score in scores.items():
            threshold = self.get_threshold(category)
            if score >= threshold:
                detected.append(category)
        
        return len(detected) > 0, detected
    
    def analyze_batch(
        self,
        audio_paths: List[Union[str, Path]]
    ) -> List[Dict[str, float]]:
        """
        Analyze multiple audio files.
        
        Args:
            audio_paths: List of paths to audio files
        
        Returns:
            List of category score dicts
        """
        results = []
        for path in audio_paths:
            try:
                scores = self.analyze_audio(path)
                results.append(scores)
            except Exception as e:
                logger.error(f"Failed to analyze {path}: {e}")
                results.append({})
        
        return results


def main():
    """CLI entry point for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test CLAP audio analyzer")
    parser.add_argument('audio', help='Path to audio file')
    parser.add_argument('--config', default='config.yaml', help='Config file')
    args = parser.parse_args()
    
    logging.basicConfig(level=logging.INFO)
    
    analyzer = AudioAnalyzer(config_path=args.config)
    scores = analyzer.analyze_audio(args.audio)
    
    print("\n🎵 Audio Analysis Results:")
    print("-" * 40)
    
    if not scores:
        print("No audio trigger categories configured")
        return
    
    for category, score in sorted(scores.items(), key=lambda x: -x[1]):
        threshold = analyzer.get_threshold(category)
        status = "⚠️ " if score >= threshold else "  "
        print(f"{status}{category}: {score:.3f} (threshold: {threshold})")
    
    is_detected, categories = analyzer.is_trigger_detected(scores)
    if is_detected:
        print(f"\n🚨 AUDIO TRIGGER DETECTED: {', '.join(categories)}")
    else:
        print("\n✅ No audio triggers detected")


if __name__ == "__main__":
    main()
