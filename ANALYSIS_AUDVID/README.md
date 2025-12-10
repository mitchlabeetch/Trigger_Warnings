# Media Trigger Analysis Framework

An automated pipeline for detecting triggering content in media using cascade AI models with synchronized audio + visual processing.

## Features

- 🎬 **Multi-Platform Support**: Works with any streaming service (requires DRM bypass setup)
- 🔊 **Audio + Visual**: Combined detection for triggers like emetophobia
- ⚡ **Cascade Architecture**: Fast CLIP filter → Deep VLM analysis (only when needed)
- 📊 **Database-Ready Output**: CSV format matching Supabase schema
- 🔄 **Resumable Processing**: Pause/resume for long media

## Quick Start

### 1. Prerequisites

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Ollama and pull Moondream model
brew install ollama  # (or see https://ollama.ai for other OS)
ollama pull moondream
```

### 2. Disable Hardware Acceleration (Required for Streaming)

**Chrome/Edge/Brave:**

1. Settings → System
2. Turn OFF "Use graphics acceleration"
3. Restart browser

### 3. Run Analysis

```bash
# Capture mode: Watch and record
python main.py capture --media "ShowNameS01E01"

# Analyze mode: Process captured files
python main.py analyze --input ./raw_screenshots

# Full pipeline: Merge and format results
python main.py format --output ./results
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 UNIFIED WATCHER                     │
│     Screen (2 FPS) + Audio (2s chunks)              │
└──────────────────┬──────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌──────────────┐       ┌──────────────┐
│   VISUAL     │       │    AUDIO     │
│  ─────────   │       │   ─────────  │
│  CLIP Filter │       │    CLAP      │
│  YOLO Detect │       │   Zero-shot  │
│  VLM Confirm │       │ Classification│
└──────┬───────┘       └──────┬───────┘
       │                      │
       └──────────┬───────────┘
                  ▼
         ┌───────────────┐
         │ FUSION ENGINE │
         │  OR logic for │
         │  high-risk    │
         └───────┬───────┘
                 ▼
         ┌───────────────┐
         │ POST-PROCESS  │
         │ Merge + Pad   │
         │ → Database CSV│
         └───────────────┘
```

## Trigger Categories

| Category      | Detection Method     | Notes                            |
| ------------- | -------------------- | -------------------------------- |
| Violence      | CLIP + VLM           | Semantic understanding           |
| Blood/Gore    | CLIP + VLM           | High threshold                   |
| Self-Harm     | CLIP + VLM           | Safety-critical, lower threshold |
| SA/Rape       | CLIP + VLM           | Safety-critical, lower threshold |
| Medical       | CLIP                 | Context detection                |
| Spiders       | YOLO                 | Object detection                 |
| Emetophobia   | CLIP + CLAP (Fusion) | Audio cues precede visual        |
| Alcohol       | CLIP                 | Object + context                 |
| Drugs/Smoking | CLIP                 | Object + context                 |

## Configuration

Edit `config.yaml` to customize:

```yaml
media:
  name: 'MyShow'
  imdb_id: 'tt1234567'

capture:
  fps: 2
  use_scene_detection: true

analysis:
  clip_threshold: 0.25
  vlm_threshold: 0.6
  device: 'auto' # cpu, cuda, mps, or auto
```

## Output Format

The final CSV matches your Supabase schema:

```csv
Name,IMDb_ID,Violence_timestamps,Blood/Gore_timestamps,...
"Show Name","tt1234567","00:05:00-00:05:10;00:15:00-00:15:05","",...
```

## License

For accessibility purposes only. Part of the Trigger Warnings Extension project.
