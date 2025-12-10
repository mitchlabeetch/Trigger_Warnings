"""
Capture Package

Modules for capturing screen and audio content from streaming platforms.
"""

from .screen_watcher import ScreenWatcher

# AudioWatcher requires pyaudio which needs portaudio system library
try:
    from .audio_watcher import AudioWatcher
    AUDIO_AVAILABLE = True
except ImportError:
    AudioWatcher = None  # type: ignore
    AUDIO_AVAILABLE = False

__all__ = ['ScreenWatcher', 'AudioWatcher', 'AUDIO_AVAILABLE']
