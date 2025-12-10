"""
Media Trigger Analysis Framework - Main Orchestrator

CLI interface for the complete analysis pipeline:
1. Capture: Record screen + audio from streaming/local media
2. Analyze: Process captured files through cascade AI models
3. Format: Merge results into database-ready CSV

Usage:
    python main.py capture --media "ShowS01E01"
    python main.py analyze --input ./raw_screenshots
    python main.py format --output ./results
    python main.py full --media "ShowS01E01"  # All steps
"""

import os
import sys
import time
import json
import logging
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
from dataclasses import dataclass, field, asdict
import argparse

try:
    import pandas as pd
    import numpy as np
    from tqdm import tqdm
    from colorama import init, Fore, Style
    init()  # Initialize colorama
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

import yaml

# Import framework modules
from trigger_categories import TRIGGER_CATEGORIES, DetectionType
from capture import ScreenWatcher, AudioWatcher, AUDIO_AVAILABLE
from analyzers.fast_filter import FastFilter
from analyzers.deep_analyzer import DeepAnalyzer
from processing.results_merger import ResultsMerger

# Audio analyzer also requires optional dependencies
try:
    from analyzers.audio_analyzer import AudioAnalyzer
except ImportError:
    AudioAnalyzer = None  # type: ignore


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class AnalysisState:
    """Tracks analysis progress for resumable processing"""
    media_name: str
    started_at: str
    last_processed_index: int = 0
    total_files: int = 0
    processed_files: List[str] = field(default_factory=list)
    results: Dict = field(default_factory=dict)
    
    def save(self, path: Path):
        """Save state to JSON file"""
        with open(path, 'w') as f:
            json.dump(asdict(self), f, indent=2)
    
    @classmethod
    def load(cls, path: Path) -> 'AnalysisState':
        """Load state from JSON file"""
        with open(path, 'r') as f:
            data = json.load(f)
        return cls(**data)


class TriggerAnalyzer:
    """
    Main orchestrator for the trigger analysis pipeline.
    
    Coordinates capture, analysis, and post-processing modules.
    """
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize the analyzer with configuration"""
        self.config_path = config_path
        self.config = self._load_config(config_path)
        
        # Paths
        paths = self.config.get('paths', {})
        self.screenshot_dir = Path(paths.get('raw_screenshots', './raw_screenshots'))
        self.audio_dir = Path(paths.get('raw_audio', './raw_audio'))
        self.intermediate_csv = Path(paths.get('intermediate_csv', './media_analysis_log.csv'))
        self.final_csv = Path(paths.get('final_csv', './final_database_upload.csv'))
        self.state_file = Path(paths.get('state_file', './analysis_state.json'))
        
        # Lazy-load analyzers (initialized when needed)
        self._fast_filter: Optional[FastFilter] = None
        self._deep_analyzer: Optional[DeepAnalyzer] = None
        self._audio_analyzer: Optional[AudioAnalyzer] = None
        self._merger: Optional[ResultsMerger] = None
    
    def _load_config(self, path: str) -> dict:
        """Load configuration from YAML"""
        try:
            with open(path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found: {path}")
            return {}
    
    @property
    def fast_filter(self) -> FastFilter:
        """Lazy-load CLIP fast filter"""
        if self._fast_filter is None:
            print(f"{Fore.CYAN}Loading CLIP model...{Style.RESET_ALL}")
            self._fast_filter = FastFilter(self.config_path)
        return self._fast_filter
    
    @property
    def deep_analyzer(self) -> DeepAnalyzer:
        """Lazy-load VLM deep analyzer"""
        if self._deep_analyzer is None:
            print(f"{Fore.CYAN}Loading VLM (Ollama)...{Style.RESET_ALL}")
            self._deep_analyzer = DeepAnalyzer(self.config_path)
        return self._deep_analyzer
    
    @property
    def audio_analyzer(self) -> AudioAnalyzer:
        """Lazy-load CLAP audio analyzer"""
        if self._audio_analyzer is None:
            print(f"{Fore.CYAN}Loading CLAP model...{Style.RESET_ALL}")
            self._audio_analyzer = AudioAnalyzer(self.config_path)
        return self._audio_analyzer
    
    @property
    def merger(self) -> ResultsMerger:
        """Lazy-load results merger"""
        if self._merger is None:
            self._merger = ResultsMerger(self.config_path)
        return self._merger
    
    def capture(self, media_name: Optional[str] = None, audio_enabled: bool = True):
        """
        Run capture mode: record screen + audio.
        
        Args:
            media_name: Override name from config
            audio_enabled: Whether to capture audio alongside video
        """
        print(f"\n{Fore.GREEN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}📹 CAPTURE MODE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'='*60}{Style.RESET_ALL}\n")
        
        # Initialize watchers
        screen_watcher = ScreenWatcher(self.config_path)
        if media_name:
            screen_watcher.media_name = media_name
        
        audio_thread = None
        if audio_enabled:
            audio_watcher = AudioWatcher(self.config_path)
            if media_name:
                audio_watcher.media_name = media_name
            
            # Start audio in background thread
            audio_thread = audio_watcher.run_in_thread()
        
        # Run screen capture (blocking)
        screen_watcher.run()
        
        # Stop audio if running
        if audio_thread and audio_watcher:
            audio_watcher.stop()
            audio_thread.join(timeout=2)
        
        print(f"\n{Fore.GREEN}✅ Capture complete!{Style.RESET_ALL}")
        print(f"Screenshots: {self.screenshot_dir}")
        print(f"Audio: {self.audio_dir}")
    
    def analyze(self, input_dir: Optional[Path] = None, resume: bool = True):
        """
        Run analysis mode: process captured files through AI pipeline.
        
        Args:
            input_dir: Override screenshot directory
            resume: Resume from previous progress if available
        """
        print(f"\n{Fore.BLUE}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.BLUE}🔍 ANALYSIS MODE{Style.RESET_ALL}")
        print(f"{Fore.BLUE}{'='*60}{Style.RESET_ALL}\n")
        
        input_dir = input_dir or self.screenshot_dir
        
        # Get list of files to process
        image_files = sorted(list(input_dir.glob("*.jpg")) + list(input_dir.glob("*.png")))
        
        if not image_files:
            print(f"{Fore.YELLOW}No images found in {input_dir}{Style.RESET_ALL}")
            return
        
        print(f"Found {len(image_files)} images to analyze")
        
        # Check for resume state
        state = None
        start_index = 0
        
        if resume and self.state_file.exists():
            try:
                state = AnalysisState.load(self.state_file)
                if state.total_files == len(image_files):
                    start_index = state.last_processed_index
                    print(f"{Fore.CYAN}Resuming from file {start_index}/{len(image_files)}{Style.RESET_ALL}")
            except Exception as e:
                logger.warning(f"Could not resume: {e}")
        
        if state is None:
            media_config = self.config.get('media', {})
            state = AnalysisState(
                media_name=media_config.get('name', 'UnknownMedia'),
                started_at=datetime.now().isoformat(),
                total_files=len(image_files)
            )
        
        # Prepare results CSV
        results_data = []
        
        # Category columns
        category_names = list(TRIGGER_CATEGORIES.keys())
        
        # Analysis loop
        print(f"\n{Fore.CYAN}Starting cascade analysis...{Style.RESET_ALL}")
        
        use_vlm = self.deep_analyzer.is_ollama_available()
        if not use_vlm:
            print(f"{Fore.YELLOW}⚠️ Ollama not available - skipping VLM confirmation{Style.RESET_ALL}")
        
        analysis_config = self.config.get('analysis', {})
        batch_size = analysis_config.get('batch_size', 8)
        
        # Progress bar
        pbar = tqdm(total=len(image_files), initial=start_index, desc="Analyzing")
        
        for i in range(start_index, len(image_files), batch_size):
            batch_files = image_files[i:i + batch_size]
            
            # Fast filter (CLIP)
            batch_scores = self.fast_filter.analyze_batch([str(f) for f in batch_files])
            
            for j, (img_path, scores) in enumerate(zip(batch_files, batch_scores)):
                # Parse timestamp from filename
                timestamp_sec = self._parse_timestamp(img_path.name)
                
                # Initialize result row
                row = {
                    'filename': img_path.name,
                    'timestamp_sec': timestamp_sec
                }
                
                # Check each category
                is_suspicious, suspicious_cats = self.fast_filter.is_suspicious(scores)
                
                for cat_name in category_names:
                    row[cat_name] = False
                    
                    if cat_name in suspicious_cats:
                        # For non-VLM categories, CLIP is enough
                        category = TRIGGER_CATEGORIES[cat_name]
                        
                        if use_vlm and category.detection_type != DetectionType.YOLO:
                            # Deep confirmation with VLM
                            vlm_result = self.deep_analyzer.analyze_trigger(
                                img_path, cat_name
                            )
                            row[cat_name] = vlm_result['confirmed']
                        else:
                            # Trust CLIP for this category
                            row[cat_name] = True
                
                results_data.append(row)
                state.last_processed_index = i + j + 1
                pbar.update(1)
            
            # Save state periodically
            if i % (batch_size * 10) == 0:
                state.save(self.state_file)
        
        pbar.close()
        
        # Save final results
        results_df = pd.DataFrame(results_data)
        results_df.to_csv(self.intermediate_csv, index=False)
        
        print(f"\n{Fore.GREEN}✅ Analysis complete!{Style.RESET_ALL}")
        print(f"Raw results: {self.intermediate_csv}")
        
        # Summary
        print(f"\n{Fore.CYAN}Detection Summary:{Style.RESET_ALL}")
        for cat_name in category_names:
            count = results_df[cat_name].sum()
            if count > 0:
                print(f"  {cat_name}: {count} detections")
        
        # Cleanup state file
        if self.state_file.exists():
            self.state_file.unlink()
    
    def format(self, input_csv: Optional[Path] = None, output_csv: Optional[Path] = None):
        """
        Run format mode: merge results into database CSV.
        
        Args:
            input_csv: Override intermediate CSV path
            output_csv: Override output CSV path
        """
        print(f"\n{Fore.MAGENTA}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.MAGENTA}📊 FORMAT MODE{Style.RESET_ALL}")
        print(f"{Fore.MAGENTA}{'='*60}{Style.RESET_ALL}\n")
        
        result = self.merger.process_csv(input_csv, output_csv)
        
        print(f"\n{Fore.GREEN}✅ Formatting complete!{Style.RESET_ALL}")
        print(f"Output: {output_csv or self.final_csv}")
        
        # Show result
        print(f"\n{Fore.CYAN}Final Database Row:{Style.RESET_ALL}")
        print(result.T.to_string())
    
    def full_pipeline(
        self,
        media_name: str,
        audio_enabled: bool = True,
        cleanup: bool = True
    ):
        """
        Run complete pipeline: capture → analyze → format.
        
        Args:
            media_name: Name to use for this media
            audio_enabled: Capture audio
            cleanup: Delete raw files after processing
        """
        print(f"\n{Fore.WHITE}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.WHITE}🎬 FULL PIPELINE: {media_name}{Style.RESET_ALL}")
        print(f"{Fore.WHITE}{'='*60}{Style.RESET_ALL}\n")
        
        # Update config with media name
        self.config['media']['name'] = media_name
        
        # Step 1: Capture
        self.capture(media_name, audio_enabled)
        
        input("Press Enter when ready to analyze...")
        
        # Step 2: Analyze
        self.analyze()
        
        # Step 3: Format
        self.format()
        
        # Step 4: Cleanup (optional)
        if cleanup:
            print(f"\n{Fore.YELLOW}Cleaning up raw files...{Style.RESET_ALL}")
            for f in self.screenshot_dir.glob("*"):
                f.unlink()
            for f in self.audio_dir.glob("*"):
                f.unlink()
        
        print(f"\n{Fore.GREEN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✅ PIPELINE COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}Output: {self.final_csv}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'='*60}{Style.RESET_ALL}\n")
    
    def _parse_timestamp(self, filename: str) -> float:
        """Parse timestamp from filename"""
        try:
            parts = filename.split('_')
            for part in parts:
                part_clean = part.replace('.jpg', '').replace('.png', '')
                if len(part_clean) == 6 and part_clean.isdigit():
                    hours = int(part_clean[:2])
                    minutes = int(part_clean[2:4])
                    seconds = int(part_clean[4:6])
                    return hours * 3600 + minutes * 60 + seconds
        except Exception:
            pass
        return 0.0


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Media Trigger Analysis Framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py capture --media "BreakingBadS01E01"
  python main.py analyze --input ./raw_screenshots
  python main.py format --output ./results/triggers.csv
  python main.py full --media "MovieName"
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Capture command
    capture_parser = subparsers.add_parser('capture', help='Record screen + audio')
    capture_parser.add_argument('--media', help='Media name (e.g., ShowS01E01)')
    capture_parser.add_argument('--no-audio', action='store_true', help='Disable audio capture')
    capture_parser.add_argument('--config', default='config.yaml', help='Config file')
    
    # Analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Process captured files')
    analyze_parser.add_argument('--input', type=Path, help='Input directory')
    analyze_parser.add_argument('--no-resume', action='store_true', help='Start fresh')
    analyze_parser.add_argument('--config', default='config.yaml', help='Config file')
    
    # Format command
    format_parser = subparsers.add_parser('format', help='Merge results to database CSV')
    format_parser.add_argument('--input', type=Path, help='Input CSV')
    format_parser.add_argument('--output', type=Path, help='Output CSV')
    format_parser.add_argument('--config', default='config.yaml', help='Config file')
    
    # Full command
    full_parser = subparsers.add_parser('full', help='Run complete pipeline')
    full_parser.add_argument('--media', required=True, help='Media name')
    full_parser.add_argument('--no-audio', action='store_true', help='Disable audio')
    full_parser.add_argument('--no-cleanup', action='store_true', help='Keep raw files')
    full_parser.add_argument('--config', default='config.yaml', help='Config file')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    config_path = getattr(args, 'config', 'config.yaml')
    analyzer = TriggerAnalyzer(config_path)
    
    if args.command == 'capture':
        analyzer.capture(
            media_name=args.media,
            audio_enabled=not args.no_audio
        )
    
    elif args.command == 'analyze':
        analyzer.analyze(
            input_dir=args.input,
            resume=not args.no_resume
        )
    
    elif args.command == 'format':
        analyzer.format(
            input_csv=args.input,
            output_csv=args.output
        )
    
    elif args.command == 'full':
        analyzer.full_pipeline(
            media_name=args.media,
            audio_enabled=not args.no_audio,
            cleanup=not args.no_cleanup
        )


if __name__ == "__main__":
    main()
