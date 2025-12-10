"""
Results Merger Module

Converts raw boolean CSV (per-second detections) to merged timestamp ranges
with configurable padding for safety margins.
"""

import os
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import timedelta
import logging

try:
    import pandas as pd
    import numpy as np
except ImportError as e:
    raise ImportError(f"Missing dependency: {e}. Run: pip install pandas numpy")

import yaml
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from trigger_categories import TRIGGER_CATEGORIES


logger = logging.getLogger(__name__)


class ResultsMerger:
    """
    Merges per-second boolean detections into timestamp ranges.
    
    Handles:
    - Padding (safety margin before/after triggers)
    - Interval merging (combine overlapping ranges)
    - Format conversion to database schema
    """
    
    def __init__(self, config_path: str = "config.yaml"):
        """
        Initialize the results merger.
        
        Args:
            config_path: Path to configuration YAML
        """
        self.config = self._load_config(config_path)
        
        processing_config = self.config.get('processing', {})
        self.padding_seconds = processing_config.get('padding_seconds', 2)
        self.min_gap_seconds = processing_config.get('min_gap_seconds', 4)
        
        # Media info
        media_config = self.config.get('media', {})
        self.media_name = media_config.get('name', 'UnknownMedia')
        self.imdb_id = media_config.get('imdb_id', '')
        
        # Paths
        paths_config = self.config.get('paths', {})
        self.input_csv = Path(paths_config.get('intermediate_csv', './media_analysis_log.csv'))
        self.output_csv = Path(paths_config.get('final_csv', './final_database_upload.csv'))
        
        logger.info(f"ResultsMerger: padding={self.padding_seconds}s, min_gap={self.min_gap_seconds}s")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            return {}
    
    @staticmethod
    def format_time(seconds: float) -> str:
        """Convert seconds to HH:MM:SS format"""
        seconds = max(0, int(seconds))
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    
    @staticmethod
    def parse_time(time_str: str) -> int:
        """Convert HH:MM:SS to seconds"""
        parts = time_str.split(':')
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        return int(parts[0])
    
    def merge_intervals(
        self,
        timestamps: List[float],
        padding: Optional[float] = None,
        min_gap: Optional[float] = None
    ) -> List[Tuple[float, float]]:
        """
        Merge a list of positive detection timestamps into intervals.
        
        Args:
            timestamps: List of seconds where trigger was detected
            padding: Seconds to add before/after each detection
            min_gap: Minimum gap between intervals (merge if closer)
        
        Returns:
            List of (start, end) tuples in seconds
        """
        if not timestamps:
            return []
        
        padding = padding if padding is not None else self.padding_seconds
        min_gap = min_gap if min_gap is not None else self.min_gap_seconds
        
        # Create initial intervals with padding
        intervals = []
        for ts in sorted(set(timestamps)):
            start = max(0, ts - padding)
            end = ts + padding
            intervals.append((start, end))
        
        # Merge overlapping/close intervals
        if not intervals:
            return []
        
        merged = [intervals[0]]
        
        for current_start, current_end in intervals[1:]:
            last_start, last_end = merged[-1]
            
            # Check if overlap or gap is small enough to merge
            if current_start <= last_end + min_gap:
                # Extend the previous interval
                new_end = max(last_end, current_end)
                merged[-1] = (last_start, new_end)
            else:
                # Start a new interval
                merged.append((current_start, current_end))
        
        return merged
    
    def intervals_to_string(self, intervals: List[Tuple[float, float]]) -> str:
        """
        Convert list of intervals to semicolon-separated string.
        
        Format: "HH:MM:SS-HH:MM:SS;HH:MM:SS-HH:MM:SS"
        """
        if not intervals:
            return ""
        
        formatted = []
        for start, end in intervals:
            formatted.append(f"{self.format_time(start)}-{self.format_time(end)}")
        
        return ";".join(formatted)
    
    def process_csv(
        self,
        input_path: Optional[Path] = None,
        output_path: Optional[Path] = None
    ) -> pd.DataFrame:
        """
        Process the raw boolean CSV into database format.
        
        Args:
            input_path: Path to raw CSV (defaults to config)
            output_path: Path to save result (defaults to config)
        
        Returns:
            DataFrame with merged timestamps
        """
        input_path = input_path or self.input_csv
        output_path = output_path or self.output_csv
        
        # Load raw CSV
        logger.info(f"Loading raw analysis from {input_path}")
        df = pd.read_csv(input_path)
        
        # Expected columns: timestamp_sec, and one boolean column per category
        if 'timestamp_sec' not in df.columns:
            # Try to parse filename for timestamp
            if 'filename' in df.columns:
                df['timestamp_sec'] = df['filename'].apply(self._parse_filename_timestamp)
            else:
                raise ValueError("CSV must have 'timestamp_sec' or 'filename' column")
        
        # Get all trigger category columns
        category_columns = []
        for cat_name, cat_info in TRIGGER_CATEGORIES.items():
            col_name = cat_name  # Or the short name used in the raw CSV
            if col_name in df.columns:
                category_columns.append(col_name)
        
        logger.info(f"Processing {len(category_columns)} trigger categories")
        
        # Build the final row
        result = {
            'Name': self.media_name,
            'IMDb_ID': self.imdb_id
        }
        
        for col_name in category_columns:
            # Get category info for column naming
            category = TRIGGER_CATEGORIES.get(col_name)
            output_col = category.column_name if category else f"{col_name}_timestamps"
            
            # Find all positive detections
            positive_mask = df[col_name] == True
            if positive_mask.any():
                timestamps = df.loc[positive_mask, 'timestamp_sec'].tolist()
                intervals = self.merge_intervals(timestamps)
                result[output_col] = self.intervals_to_string(intervals)
                
                logger.info(f"  {col_name}: {len(timestamps)} detections → {len(intervals)} intervals")
            else:
                result[output_col] = ""
        
        # Create output DataFrame
        output_df = pd.DataFrame([result])
        
        # Save to CSV
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_df.to_csv(output_path, index=False)
        
        logger.info(f"Saved merged results to {output_path}")
        
        return output_df
    
    def _parse_filename_timestamp(self, filename: str) -> float:
        """
        Parse timestamp from filename format: MediaName_HHMMSS_1.jpg
        Returns seconds.
        """
        try:
            parts = filename.split('_')
            # Find the HHMMSS part (6 digits)
            for part in parts:
                if len(part) == 6 and part.isdigit():
                    hours = int(part[:2])
                    minutes = int(part[2:4])
                    seconds = int(part[4:6])
                    return hours * 3600 + minutes * 60 + seconds
        except Exception:
            pass
        return 0.0
    
    def merge_multiple_analyses(
        self,
        visual_csv: Path,
        audio_csv: Optional[Path] = None
    ) -> pd.DataFrame:
        """
        Merge visual and audio analysis results using OR logic for fusion categories.
        
        Args:
            visual_csv: Path to visual analysis CSV
            audio_csv: Path to audio analysis CSV (optional)
        
        Returns:
            Combined DataFrame
        """
        # Load visual results
        visual_df = pd.read_csv(visual_csv)
        
        if audio_csv and audio_csv.exists():
            audio_df = pd.read_csv(audio_csv)
            
            # For fusion categories (like Spitting/Vomiting), OR the results
            for cat_name, category in TRIGGER_CATEGORIES.items():
                if category.detection_type.value == 'fusion':
                    if cat_name in visual_df.columns and cat_name in audio_df.columns:
                        # Merge by timestamp, take OR
                        merged = visual_df.merge(
                            audio_df[['timestamp_sec', cat_name]],
                            on='timestamp_sec',
                            how='outer',
                            suffixes=('_visual', '_audio')
                        )
                        visual_df[cat_name] = (
                            merged[f'{cat_name}_visual'].fillna(False) |
                            merged[f'{cat_name}_audio'].fillna(False)
                        )
        
        return visual_df


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Merge analysis results")
    parser.add_argument('--input', help='Input CSV path')
    parser.add_argument('--output', help='Output CSV path')
    parser.add_argument('--config', default='config.yaml', help='Config file')
    args = parser.parse_args()
    
    logging.basicConfig(level=logging.INFO)
    
    merger = ResultsMerger(config_path=args.config)
    
    input_path = Path(args.input) if args.input else None
    output_path = Path(args.output) if args.output else None
    
    result = merger.process_csv(input_path, output_path)
    
    print("\n📊 Merged Results:")
    print("-" * 60)
    print(result.T.to_string())


if __name__ == "__main__":
    main()
