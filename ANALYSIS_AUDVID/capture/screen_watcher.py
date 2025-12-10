"""
Screen Watcher Module

Captures screenshots from the primary monitor at configurable FPS.
Features:
- Scene change detection to skip redundant frames
- Keyboard controls (S=Start, Q=Quit)
- Timestamp-based filenames for synchronization
"""

import os
import time
import datetime
from pathlib import Path
from typing import Optional, Tuple
import logging

try:
    import mss
    import mss.tools
except ImportError:
    raise ImportError("Please install mss: pip install mss")

try:
    import keyboard
except ImportError:
    raise ImportError("Please install keyboard: pip install keyboard")

try:
    import numpy as np
    from PIL import Image
except ImportError:
    raise ImportError("Please install numpy pillow: pip install numpy pillow")

import yaml


logger = logging.getLogger(__name__)


class ScreenWatcher:
    """Captures screen content at specified FPS with optional scene detection"""
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize the screen watcher with configuration"""
        self.config = self._load_config(config_path)
        
        # Extract relevant settings
        capture_config = self.config.get('capture', {})
        self.fps = capture_config.get('fps', 2)
        self.monitor_index = capture_config.get('monitor_index', 1)
        self.use_scene_detection = capture_config.get('use_scene_detection', True)
        self.scene_threshold = capture_config.get('scene_threshold', 0.95)
        
        # Media info
        media_config = self.config.get('media', {})
        self.media_name = media_config.get('name', 'UnknownMedia')
        
        # Output paths
        paths_config = self.config.get('paths', {})
        self.output_folder = Path(paths_config.get('raw_screenshots', './raw_screenshots'))
        self.output_folder.mkdir(parents=True, exist_ok=True)
        
        # State
        self.is_running = False
        self.frame_interval = 1.0 / self.fps
        self.last_frame: Optional[np.ndarray] = None
        self.frame_count = 0
        
        logger.info(f"ScreenWatcher initialized: {self.fps} FPS, monitor {self.monitor_index}")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found at {config_path}, using defaults")
            return {}
    
    def _calculate_similarity(self, frame1: np.ndarray, frame2: np.ndarray) -> float:
        """
        Calculate similarity between two frames using downsampled comparison.
        Returns value between 0 (completely different) and 1 (identical).
        """
        if frame1 is None or frame2 is None:
            return 0.0
        
        # Downsample for faster comparison (16x16 thumbnail)
        size = (16, 16)
        img1 = Image.fromarray(frame1).convert('L').resize(size)
        img2 = Image.fromarray(frame2).convert('L').resize(size)
        
        arr1 = np.array(img1, dtype=np.float32)
        arr2 = np.array(img2, dtype=np.float32)
        
        # Normalized cross-correlation
        mean1, mean2 = arr1.mean(), arr2.mean()
        std1, std2 = arr1.std(), arr2.std()
        
        if std1 < 0.01 or std2 < 0.01:
            return 1.0 if std1 < 0.01 and std2 < 0.01 else 0.0
        
        correlation = ((arr1 - mean1) * (arr2 - mean2)).mean() / (std1 * std2)
        return max(0.0, min(1.0, (correlation + 1) / 2))
    
    def _generate_filename(self, elapsed_seconds: float) -> str:
        """
        Generate filename in format: MediaName_HHMMSS_1or2.jpg
        The 1or2 suffix indicates first or second half of the second.
        """
        hours = int(elapsed_seconds // 3600)
        minutes = int((elapsed_seconds % 3600) // 60)
        seconds = int(elapsed_seconds % 60)
        
        timestamp_str = f"{hours:02d}{minutes:02d}{seconds:02d}"
        
        # Determine if first or second half of the second
        fractional = elapsed_seconds - int(elapsed_seconds)
        frame_idx = "1" if fractional < 0.5 else "2"
        
        return f"{self.media_name}_{timestamp_str}_{frame_idx}.jpg"
    
    def capture_frame(self, sct: mss.mss, monitor: dict) -> Tuple[np.ndarray, bytes]:
        """Capture a single frame and return as numpy array + raw bytes"""
        sct_img = sct.grab(monitor)
        
        # Convert to numpy array (BGRA format from mss)
        frame = np.frombuffer(sct_img.rgb, dtype=np.uint8)
        frame = frame.reshape((sct_img.height, sct_img.width, 3))
        
        return frame, mss.tools.to_png(sct_img.rgb, sct_img.size)
    
    def run(self):
        """
        Main capture loop with keyboard controls.
        Press 'S' to start, 'Q' to quit.
        """
        print(f"\n{'='*60}")
        print(f"📹 SCREEN WATCHER READY")
        print(f"{'='*60}")
        print(f"Media: {self.media_name}")
        print(f"FPS: {self.fps}")
        print(f"Scene Detection: {'ON' if self.use_scene_detection else 'OFF'}")
        print(f"Output: {self.output_folder}")
        print(f"\n1. Open your streaming service")
        print(f"2. Pause video at 00:00")
        print(f"3. Press 'S' to START")
        print(f"4. Press 'Q' to QUIT\n")
        
        # Wait for start
        print("Waiting for 'S' to start...")
        keyboard.wait('s')
        print("\n✅ STARTED! Play your video now.\n")
        
        start_time = time.time()
        saved_count = 0
        skipped_count = 0
        
        with mss.mss() as sct:
            monitor = sct.monitors[self.monitor_index]
            logger.info(f"Capturing monitor: {monitor}")
            
            try:
                while True:
                    loop_start = time.time()
                    
                    # Check for quit
                    if keyboard.is_pressed('q'):
                        print("\n⏹️ Stopping capture...")
                        break
                    
                    # Capture frame
                    frame, raw_data = self.capture_frame(sct, monitor)
                    
                    # Scene change detection
                    should_save = True
                    if self.use_scene_detection and self.last_frame is not None:
                        similarity = self._calculate_similarity(frame, self.last_frame)
                        if similarity > self.scene_threshold:
                            should_save = False
                            skipped_count += 1
                    
                    if should_save:
                        # Generate filename and save
                        elapsed = time.time() - start_time
                        filename = self._generate_filename(elapsed)
                        filepath = self.output_folder / filename
                        
                        # Convert and save as JPEG for smaller file size
                        img = Image.fromarray(frame)
                        img.save(filepath, 'JPEG', quality=85)
                        
                        saved_count += 1
                        self.last_frame = frame
                        
                        # Progress indicator
                        if saved_count % 10 == 0:
                            elapsed_td = datetime.timedelta(seconds=int(elapsed))
                            print(f"[{elapsed_td}] Saved: {saved_count}, Skipped: {skipped_count}")
                    
                    self.frame_count += 1
                    
                    # Maintain FPS
                    process_time = time.time() - loop_start
                    sleep_time = self.frame_interval - process_time
                    if sleep_time > 0:
                        time.sleep(sleep_time)
            
            except KeyboardInterrupt:
                pass
        
        print(f"\n{'='*60}")
        print(f"📊 CAPTURE COMPLETE")
        print(f"{'='*60}")
        print(f"Total frames: {self.frame_count}")
        print(f"Saved: {saved_count}")
        print(f"Skipped (similar): {skipped_count}")
        print(f"Efficiency: {100 * skipped_count / max(1, self.frame_count):.1f}% reduction")
        print(f"Output folder: {self.output_folder}\n")


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Capture screenshots from screen")
    parser.add_argument('--config', default='config.yaml', help='Path to config file')
    parser.add_argument('--media', help='Override media name from config')
    args = parser.parse_args()
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    watcher = ScreenWatcher(config_path=args.config)
    
    if args.media:
        watcher.media_name = args.media
    
    watcher.run()


if __name__ == "__main__":
    main()
