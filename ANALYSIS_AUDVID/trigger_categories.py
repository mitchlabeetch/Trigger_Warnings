"""
Trigger Categories and Detection Configuration

Maps CSV column names to detection methods (CLIP, YOLO, VLM, CLAP)
with optimized prompts for each trigger type.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict


class DetectionType(Enum):
    """Type of AI model used for detection"""
    CLIP = "clip"           # Semantic similarity (fast)
    YOLO = "yolo"           # Object detection (fastest)
    VLM = "vlm"             # Vision-Language Model (deep, slow)
    CLAP = "clap"           # Audio classification
    FUSION = "fusion"       # Combined audio + visual


@dataclass
class TriggerCategory:
    """Definition of a trigger category with detection configuration"""
    
    # Database column name (matches Supabase schema)
    column_name: str
    
    # Primary detection method
    detection_type: DetectionType
    
    # CLIP/VLM prompts for visual detection
    visual_prompts: List[str] = field(default_factory=list)
    
    # CLAP prompts for audio detection
    audio_prompts: List[str] = field(default_factory=list)
    
    # YOLO class IDs (COCO dataset)
    yolo_class_ids: List[int] = field(default_factory=list)
    
    # Default confidence threshold (can be overridden in config.yaml)
    default_threshold: float = 0.25
    
    # Whether this is safety-critical (lower threshold, OR logic for fusion)
    safety_critical: bool = False
    
    # VLM confirmation prompt template
    vlm_prompt_template: str = "Does this image contain {trigger}? Answer YES or NO."


# Define all trigger categories with optimized prompts
TRIGGER_CATEGORIES: Dict[str, TriggerCategory] = {
    
    "Violence": TriggerCategory(
        column_name="Violence_timestamps",
        detection_type=DetectionType.CLIP,
        visual_prompts=[
            "physical violence",
            "person punching",
            "person hitting another person",
            "fight scene",
            "assault",
            "kicking someone",
            "choking someone"
        ],
        default_threshold=0.28,
        vlm_prompt_template="Is there physical violence or fighting in this image? Answer YES or NO."
    ),
    
    "Blood/Gore": TriggerCategory(
        column_name="Blood/Gore_timestamps",
        detection_type=DetectionType.CLIP,
        visual_prompts=[
            "blood",
            "gore",
            "bloody wound",
            "open wound",
            "severe injury",
            "bloody scene",
            "graphic injury"
        ],
        default_threshold=0.30,
        vlm_prompt_template="Is there blood or gore visible in this image? Answer YES or NO."
    ),
    
    "Self-Harm/Suicide": TriggerCategory(
        column_name="Self-Harm/Suicide_timestamps",
        detection_type=DetectionType.CLIP,
        visual_prompts=[
            "self harm",
            "cutting wrist",
            "person attempting suicide",
            "hanging",
            "overdose pills",
            "person on ledge about to jump",
            "razor blade near wrist"
        ],
        default_threshold=0.20,  # Lower threshold for safety-critical
        safety_critical=True,
        vlm_prompt_template="Does this image depict self-harm or suicidal behavior? Answer YES or NO."
    ),
    
    "Sexual_Assault/Rape": TriggerCategory(
        column_name="Sexual_Assault/Rape_timestamps",
        detection_type=DetectionType.CLIP,
        visual_prompts=[
            "sexual assault",
            "non-consensual touching",
            "person forcing themselves on another",
            "victim struggling against attacker",
            "sexual violence",
            "rape scene"
        ],
        default_threshold=0.18,  # Lowest threshold for most critical
        safety_critical=True,
        vlm_prompt_template="Does this image depict sexual assault or non-consensual contact? Answer YES or NO."
    ),
    
    "Medical_Context/Hospitals": TriggerCategory(
        column_name="Medical_Context/Hospitals_timestamps",
        detection_type=DetectionType.CLIP,
        visual_prompts=[
            "hospital room",
            "surgery room",
            "doctor performing surgery",
            "medical equipment",
            "IV drip",
            "syringe needle",
            "hospital bed",
            "operating table"
        ],
        default_threshold=0.26,
        vlm_prompt_template="Is this a medical or hospital setting? Answer YES or NO."
    ),
    
    "Spiders": TriggerCategory(
        column_name="Spiders_timestamps",
        detection_type=DetectionType.YOLO,
        visual_prompts=[
            "spider",
            "tarantula",
            "large spider"
        ],
        # COCO doesn't have spider, so we'll use CLIP as fallback
        # For a custom YOLO model trained on spiders, add class ID here
        yolo_class_ids=[],  # Empty = use CLIP fallback
        default_threshold=0.50,  # Higher threshold for object detection
        vlm_prompt_template="Is there a spider in this image? Answer YES or NO."
    ),
    
    "Spitting/Vomiting": TriggerCategory(
        column_name="Spitting/Vomiting_timestamps",
        detection_type=DetectionType.FUSION,  # Audio + Visual combined
        visual_prompts=[
            "person vomiting",
            "person retching over toilet",
            "person about to vomit",
            "person clutching stomach in pain",
            "person bending over toilet",
            "motion sickness",
            "person spitting"
        ],
        audio_prompts=[
            "sound of vomiting",
            "person retching",
            "gagging sound",
            "heaving sound"
        ],
        default_threshold=0.22,
        safety_critical=True,  # Use OR logic for fusion
        vlm_prompt_template="Is someone vomiting or about to vomit in this image? Answer YES or NO."
    ),
    
    "Alcohol": TriggerCategory(
        column_name="Alcohol_timestamps",
        detection_type=DetectionType.CLIP,
        visual_prompts=[
            "drinking alcohol",
            "beer bottle",
            "wine glass",
            "whiskey glass",
            "drunk person",
            "bar with alcohol",
            "cocktail drink"
        ],
        default_threshold=0.28,
        vlm_prompt_template="Is alcohol being consumed or prominently shown? Answer YES or NO."
    ),
    
    "Drugs/Smoking": TriggerCategory(
        column_name="Drugs/Smoking_timestamps",
        detection_type=DetectionType.CLIP,
        visual_prompts=[
            "smoking cigarette",
            "injecting drugs",
            "snorting cocaine",
            "smoking marijuana",
            "drug use",
            "drug paraphernalia",
            "syringe with drugs"
        ],
        default_threshold=0.27,
        vlm_prompt_template="Is drug use or smoking depicted in this image? Answer YES or NO."
    )
}


def get_all_visual_prompts() -> List[str]:
    """Get flattened list of all unique visual prompts"""
    all_prompts = []
    for category in TRIGGER_CATEGORIES.values():
        all_prompts.extend(category.visual_prompts)
    return list(set(all_prompts))


def get_all_audio_prompts() -> List[str]:
    """Get flattened list of all unique audio prompts"""
    all_prompts = []
    for category in TRIGGER_CATEGORIES.values():
        all_prompts.extend(category.audio_prompts)
    # Add neutral prompts for baseline comparison
    all_prompts.extend(["silence", "background music", "normal conversation"])
    return list(set(all_prompts))


def get_column_names() -> List[str]:
    """Get ordered list of database column names"""
    return [cat.column_name for cat in TRIGGER_CATEGORIES.values()]


def get_category_by_column(column_name: str) -> Optional[TriggerCategory]:
    """Lookup category by its database column name"""
    for category in TRIGGER_CATEGORIES.values():
        if category.column_name == column_name:
            return category
    return None


# Quick access to safety-critical categories (for OR logic in fusion)
SAFETY_CRITICAL_CATEGORIES = [
    name for name, cat in TRIGGER_CATEGORIES.items() 
    if cat.safety_critical
]
