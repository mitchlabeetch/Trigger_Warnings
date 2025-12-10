"""
Audio Watcher Module

Captures system audio (loopback) in synchronized chunks.
Platform-specific:
- Windows: Uses pyaudiowpatch (WASAPI loopback)
- macOS: Requires BlackHole or similar virtual audio driver
- Linux: Uses PulseAudio monitor
"""

import os
import sys
import time
import wave
import threading
import datetime
from pathlib import Path
from typing import Optional
import logging

try:
    import numpy as np
except ImportError:
    raise ImportError("Please install numpy: pip install numpy")

import yaml


logger = logging.getLogger(__name__)


# Platform-specific audio import
if sys.platform == 'win32':
    try:
        import pyaudiowpatch as pyaudio
        AUDIO_BACKEND = "WASAPI"
    except ImportError:
        raise ImportError("Windows: pip install pyaudiowpatch")
else:
    try:
        import pyaudio
        AUDIO_BACKEND = "PyAudio"
    except ImportError:
        raise ImportError("Please install pyaudio: pip install pyaudio")


class AudioWatcher:
    """Captures system audio in synchronized chunks for analysis"""
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize the audio watcher with configuration"""
        self.config = self._load_config(config_path)
        
        # Extract relevant settings
        capture_config = self.config.get('capture', {})
        self.chunk_duration = capture_config.get('audio_chunk_seconds', 2)
        self.sample_rate = capture_config.get('sample_rate', 48000)
        self.audio_enabled = capture_config.get('audio_enabled', True)
        
        # Media info
        media_config = self.config.get('media', {})
        self.media_name = media_config.get('name', 'UnknownMedia')
        
        # Output paths
        paths_config = self.config.get('paths', {})
        self.output_folder = Path(paths_config.get('raw_audio', './raw_audio'))
        self.output_folder.mkdir(parents=True, exist_ok=True)
        
        # Audio settings
        self.channels = 2  # Stereo
        self.sample_format = pyaudio.paInt16
        self.frames_per_buffer = 1024
        
        # State
        self.is_running = False
        self._stop_event = threading.Event()
        
        logger.info(f"AudioWatcher initialized: {AUDIO_BACKEND} backend")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found at {config_path}, using defaults")
            return {}
    
    def _get_loopback_device(self, p: pyaudio.PyAudio) -> Optional[dict]:
        """
        Find the system loopback device for recording system audio.
        
        Windows (WASAPI): Looks for loopback devices
        macOS: Requires BlackHole virtual audio driver
        Linux: Uses PulseAudio monitor
        """
        if sys.platform == 'win32':
            # Windows WASAPI loopback
            try:
                wasapi_info = p.get_host_api_info_by_type(pyaudio.paWASAPI)
                for i in range(p.get_device_count()):
                    device = p.get_device_info_by_index(i)
                    if (device.get('hostApi') == wasapi_info.get('index') and
                        device.get('maxInputChannels') > 0 and
                        'Loopback' in device.get('name', '')):
                        return device
                
                # Fallback: any WASAPI input device (often named 'Stereo Mix')
                for i in range(p.get_device_count()):
                    device = p.get_device_info_by_index(i)
                    if (device.get('hostApi') == wasapi_info.get('index') and
                        device.get('maxInputChannels') > 0):
                        name = device.get('name', '').lower()
                        if 'stereo mix' in name or 'what u hear' in name:
                            return device
            except Exception as e:
                logger.warning(f"WASAPI lookup failed: {e}")
        
        elif sys.platform == 'darwin':
            # macOS: Look for BlackHole or similar virtual audio device
            for i in range(p.get_device_count()):
                device = p.get_device_info_by_index(i)
                name = device.get('name', '').lower()
                if device.get('maxInputChannels') > 0:
                    if any(x in name for x in ['blackhole', 'soundflower', 'loopback']):
                        return device
            
            logger.warning(
                "macOS: No virtual audio device found. "
                "Install BlackHole (https://github.com/ExistentialAudio/BlackHole) "
                "and configure Multi-Output Device in Audio MIDI Setup."
            )
        
        else:
            # Linux: Look for PulseAudio monitor
            for i in range(p.get_device_count()):
                device = p.get_device_info_by_index(i)
                name = device.get('name', '').lower()
                if device.get('maxInputChannels') > 0:
                    if 'monitor' in name or 'pulse' in name:
                        return device
        
        # Fallback: first input device
        for i in range(p.get_device_count()):
            device = p.get_device_info_by_index(i)
            if device.get('maxInputChannels') > 0:
                logger.warning(f"Using fallback device: {device.get('name')}")
                return device
        
        return None
    
    def _generate_filename(self, timestamp: float) -> str:
        """Generate filename in format: MediaName_HHMMSS.wav"""
        hours = int(timestamp // 3600)
        minutes = int((timestamp % 3600) // 60)
        seconds = int(timestamp % 60)
        
        timestamp_str = f"{hours:02d}{minutes:02d}{seconds:02d}"
        return f"{self.media_name}_{timestamp_str}.wav"
    
    def _save_wav_async(self, frames: list, filepath: Path, p: pyaudio.PyAudio, 
                        device_rate: int):
        """Save audio frames to WAV file in background thread"""
        def save():
            try:
                with wave.open(str(filepath), 'wb') as wf:
                    wf.setnchannels(self.channels)
                    wf.setsampwidth(p.get_sample_size(self.sample_format))
                    wf.setframerate(device_rate)
                    wf.writeframes(b''.join(frames))
            except Exception as e:
                logger.error(f"Failed to save {filepath}: {e}")
        
        threading.Thread(target=save, daemon=True).start()
    
    def run(self, start_time: Optional[float] = None):
        """
        Main audio capture loop.
        
        Args:
            start_time: Reference start time (for sync with video capture)
                       If None, uses current time.
        """
        if not self.audio_enabled:
            logger.info("Audio capture disabled in config")
            return
        
        print(f"\n🎤 AUDIO WATCHER")
        print(f"Backend: {AUDIO_BACKEND}")
        print(f"Chunk Duration: {self.chunk_duration}s")
        print(f"Output: {self.output_folder}\n")
        
        p = pyaudio.PyAudio()
        
        try:
            device = self._get_loopback_device(p)
            
            if not device:
                print("❌ No loopback audio device found!")
                print("\nInstructions:")
                if sys.platform == 'win32':
                    print("- Enable 'Stereo Mix' in Sound settings > Recording")
                elif sys.platform == 'darwin':
                    print("- Install BlackHole: brew install blackhole-2ch")
                    print("- Set up Multi-Output Device in Audio MIDI Setup")
                else:
                    print("- Ensure PulseAudio is running with monitor source")
                return
            
            device_rate = int(device.get('defaultSampleRate', self.sample_rate))
            device_channels = min(self.channels, int(device.get('maxInputChannels', 2)))
            
            print(f"👂 Recording from: {device.get('name')}")
            print(f"   Sample Rate: {device_rate} Hz")
            print(f"   Channels: {device_channels}")
            
            stream = p.open(
                format=self.sample_format,
                channels=device_channels,
                rate=device_rate,
                input=True,
                frames_per_buffer=self.frames_per_buffer,
                input_device_index=device.get('index')
            )
            
            if start_time is None:
                start_time = time.time()
            
            self.is_running = True
            self._stop_event.clear()
            
            saved_count = 0
            chunks_per_second = device_rate // self.frames_per_buffer
            frames_per_chunk = chunks_per_second * self.chunk_duration
            
            print("🎙️ Recording started... (Ctrl+C or call stop() to end)\n")
            
            while not self._stop_event.is_set():
                try:
                    # Collect frames for one chunk
                    frames = []
                    for _ in range(frames_per_chunk):
                        if self._stop_event.is_set():
                            break
                        data = stream.read(self.frames_per_buffer, exception_on_overflow=False)
                        frames.append(data)
                    
                    if frames:
                        # Calculate timestamp relative to start
                        elapsed = time.time() - start_time
                        filename = self._generate_filename(elapsed)
                        filepath = self.output_folder / filename
                        
                        # Save async
                        self._save_wav_async(frames, filepath, p, device_rate)
                        saved_count += 1
                        
                        # Progress
                        elapsed_td = datetime.timedelta(seconds=int(elapsed))
                        print(f"[{elapsed_td}] Audio chunks: {saved_count}", end='\r')
                
                except Exception as e:
                    logger.error(f"Recording error: {e}")
                    break
            
            stream.stop_stream()
            stream.close()
            
            print(f"\n\n🎤 Audio capture complete: {saved_count} chunks saved")
        
        except Exception as e:
            logger.error(f"Audio watcher error: {e}")
        finally:
            p.terminate()
            self.is_running = False
    
    def stop(self):
        """Signal the capture loop to stop"""
        self._stop_event.set()
    
    def run_in_thread(self, start_time: Optional[float] = None) -> threading.Thread:
        """Run audio capture in a background thread"""
        thread = threading.Thread(
            target=self.run,
            kwargs={'start_time': start_time},
            daemon=True
        )
        thread.start()
        return thread


def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Capture system audio")
    parser.add_argument('--config', default='config.yaml', help='Path to config file')
    parser.add_argument('--media', help='Override media name from config')
    args = parser.parse_args()
    
    logging.basicConfig(level=logging.INFO)
    
    watcher = AudioWatcher(config_path=args.config)
    
    if args.media:
        watcher.media_name = args.media
    
    try:
        watcher.run()
    except KeyboardInterrupt:
        watcher.stop()
        print("\nStopped by user")


if __name__ == "__main__":
    main()
