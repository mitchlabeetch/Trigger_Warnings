/**
 * TEMPORAL PATTERN DETECTOR
 *
 * Detects escalation sequences and patterns across multiple subtitle cues
 * Example: "Can't take this" → "One way out" → "Goodbye" → [gunshot] = Suicide warning
 *
 * This addresses a major weakness in the v1 algorithm which analyzed
 * each cue independently and missed contextual build-ups.
 *
 * Created by: Claude Code (Legendary Session)
 * Date: 2024-11-11
 */
import { Logger } from '@shared/utils/logger';
const logger = new Logger('TemporalPatternDetector');
export class TemporalPatternDetector {
    recentCues = [];
    detectedPatterns = new Map();
    onPatternDetected = null;
    // Known escalation patterns
    patterns = [
        // ═══════════════════════════════════════════════════════════
        // SUICIDE ESCALATION SEQUENCE
        // ═══════════════════════════════════════════════════════════
        {
            name: 'Suicide Escalation',
            category: 'suicide',
            phases: [
                // Phase 1: Despair
                [
                    'can\'t take this anymore',
                    'can\'t do this anymore',
                    'can\'t go on',
                    'too much to bear',
                    'unbearable',
                    'overwhelming',
                    'give up',
                    'no point',
                    'what\'s the point',
                    'why bother',
                    'worthless',
                    'burden to everyone'
                ],
                // Phase 2: Ideation
                [
                    'one way out',
                    'only one way',
                    'no other option',
                    'only solution',
                    'there\'s no hope',
                    'no way forward',
                    'end this pain',
                    'make it stop',
                    'better off without me',
                    'everyone would be better off'
                ],
                // Phase 3: Farewell
                [
                    'goodbye everyone',
                    'goodbye',
                    'sorry everyone',
                    'forgive me',
                    'tell them I loved them',
                    'tell her I',
                    'tell him I',
                    'this is goodbye',
                    'my final message',
                    'if you\'re reading this',
                    'take care of',
                    'always remember'
                ],
                // Phase 4: Action/Confirmation
                [
                    'suicide',
                    'kill myself',
                    'end it all',
                    '[gunshot]',
                    '[rope tightening]',
                    '[splash]',
                    '[body hitting ground]',
                    'jumped',
                    'pulled the trigger'
                ]
            ],
            minimumPhases: 2, // Need at least 2 consecutive phases
            windowSize: 60, // 60 second window
            baseConfidence: 95,
            description: 'Suicide escalation sequence detected across multiple cues'
        },
        // ═══════════════════════════════════════════════════════════
        // VIOLENCE ESCALATION SEQUENCE
        // ═══════════════════════════════════════════════════════════
        {
            name: 'Violence Escalation',
            category: 'violence',
            phases: [
                // Phase 1: Tension
                [
                    'argument',
                    'shut up',
                    'back off',
                    'leave me alone',
                    'get away from me',
                    'don\'t test me',
                    'you don\'t want to do this',
                    'I\'m warning you',
                    'last warning'
                ],
                // Phase 2: Escalation
                [
                    '[raised voices]',
                    '[yelling]',
                    '[shouting]',
                    'don\'t make me',
                    'I swear to god',
                    'you\'ll regret this',
                    'I\'ll show you',
                    'you asked for this'
                ],
                // Phase 3: Build-up
                [
                    '[door slamming]',
                    '[footsteps approaching]',
                    '[breathing heavily]',
                    '[heavy breathing]',
                    '[weapon cocking]',
                    '[gun loading]',
                    'picked up the',
                    'grabbed the'
                ],
                // Phase 4: Violence
                [
                    '[gunshot]',
                    '[punch]',
                    '[crash]',
                    '[screaming]',
                    '[impact]',
                    '[hitting]',
                    '[fighting]',
                    'shot',
                    'stabbed',
                    'hit',
                    'attacked'
                ]
            ],
            minimumPhases: 2,
            windowSize: 45,
            baseConfidence: 88,
            description: 'Violence escalation sequence detected'
        },
        // ═══════════════════════════════════════════════════════════
        // PANIC ATTACK BUILD-UP
        // ═══════════════════════════════════════════════════════════
        {
            name: 'Panic Attack Build-up',
            category: 'medical_procedures',
            phases: [
                // Phase 1: Physical Symptoms
                [
                    'heart racing',
                    'can\'t breathe',
                    'dizzy',
                    'chest tight',
                    'lightheaded',
                    'sweating',
                    'shaking',
                    'trembling'
                ],
                // Phase 2: Intensification
                [
                    '[hyperventilating]',
                    '[heavy breathing]',
                    '[gasping]',
                    '[breathing rapidly]',
                    'can\'t catch my breath',
                    'heart pounding',
                    'room spinning'
                ],
                // Phase 3: Crisis
                [
                    'help me',
                    'can\'t',
                    'too much',
                    'make it stop',
                    'dying',
                    'heart attack',
                    'call ambulance',
                    'something\'s wrong'
                ]
            ],
            minimumPhases: 2,
            windowSize: 30,
            baseConfidence: 85,
            description: 'Panic attack escalation detected'
        },
        // ═══════════════════════════════════════════════════════════
        // SEXUAL ASSAULT BUILD-UP
        // ═══════════════════════════════════════════════════════════
        {
            name: 'Sexual Assault Build-up',
            category: 'sexual_assault',
            phases: [
                // Phase 1: Pressure/Coercion
                [
                    'come on',
                    'don\'t be like that',
                    'you know you want to',
                    'just relax',
                    'stop fighting it',
                    'nobody has to know'
                ],
                // Phase 2: Resistance
                [
                    'no',
                    'stop',
                    'please don\'t',
                    'get off me',
                    'leave me alone',
                    'I don\'t want to',
                    'let me go'
                ],
                // Phase 3: Assault
                [
                    '[struggling]',
                    '[muffled screaming]',
                    '[crying]',
                    'forced',
                    'held down',
                    'wouldn\'t let go'
                ]
            ],
            minimumPhases: 2,
            windowSize: 40,
            baseConfidence: 98,
            description: 'Sexual assault sequence detected'
        },
        // ═══════════════════════════════════════════════════════════
        // DOMESTIC VIOLENCE ESCALATION
        // ═══════════════════════════════════════════════════════════
        {
            name: 'Domestic Violence Escalation',
            category: 'domestic_violence',
            phases: [
                // Phase 1: Tension Building
                [
                    'where were you',
                    'who were you with',
                    'you\'re lying',
                    'don\'t lie to me',
                    'I don\'t believe you',
                    'you always do this'
                ],
                // Phase 2: Escalation
                [
                    '[argument escalating]',
                    '[yelling]',
                    'you made me do this',
                    'this is your fault',
                    'look what you made me do',
                    'if you hadn\'t'
                ],
                // Phase 3: Violence
                [
                    '[hitting]',
                    '[crash]',
                    '[screaming]',
                    '[crying]',
                    'hit',
                    'pushed',
                    'threw',
                    'slammed'
                ]
            ],
            minimumPhases: 2,
            windowSize: 50,
            baseConfidence: 92,
            description: 'Domestic violence escalation detected'
        },
        // ═══════════════════════════════════════════════════════════
        // JUMP SCARE BUILD-UP
        // ═══════════════════════════════════════════════════════════
        {
            name: 'Jump Scare Build-up',
            category: 'jumpscares',
            phases: [
                // Phase 1: Tension
                [
                    '[tense music]',
                    '[ominous tone]',
                    '[eerie silence]',
                    '[suspenseful music]',
                    'quiet',
                    'too quiet',
                    'something\'s wrong'
                ],
                // Phase 2: Approach
                [
                    '[footsteps approaching]',
                    '[creaking]',
                    '[door slowly opening]',
                    '[breathing]',
                    'did you hear that',
                    'what was that'
                ],
                // Phase 3: Scare
                [
                    '[sudden loud noise]',
                    '[scream]',
                    '[dramatic sting]',
                    '[door bursting open]',
                    'appeared',
                    'jumped out'
                ]
            ],
            minimumPhases: 2,
            windowSize: 20,
            baseConfidence: 80,
            description: 'Jump scare sequence detected'
        },
        // ═══════════════════════════════════════════════════════════
        // MEDICAL EMERGENCY ESCALATION
        // ═══════════════════════════════════════════════════════════
        {
            name: 'Medical Emergency',
            category: 'medical_procedures',
            phases: [
                // Phase 1: Symptoms
                [
                    'something\'s wrong',
                    'don\'t feel well',
                    'feel sick',
                    'pain',
                    'hurts',
                    'bleeding',
                    'dizzy',
                    'weak'
                ],
                // Phase 2: Deterioration
                [
                    'getting worse',
                    'can\'t',
                    'losing',
                    'fading',
                    'cold',
                    'numb',
                    '[gasping]',
                    '[groaning]'
                ],
                // Phase 3: Critical
                [
                    'call ambulance',
                    'call 911',
                    'help',
                    'dying',
                    '[heart monitor]',
                    '[flatline]',
                    'don\'t leave me',
                    'stay with me'
                ]
            ],
            minimumPhases: 2,
            windowSize: 35,
            baseConfidence: 87,
            description: 'Medical emergency escalation detected'
        }
    ];
    /**
     * Add a new subtitle cue to the buffer
     */
    addCue(text, time) {
        this.recentCues.push({ text, time });
        this.cleanOldCues(time);
        this.analyzePatterns(time);
    }
    /**
     * Remove cues older than the maximum window size
     */
    cleanOldCues(currentTime) {
        const maxWindow = Math.max(...this.patterns.map(p => p.windowSize));
        this.recentCues = this.recentCues.filter(cue => currentTime - cue.time <= maxWindow);
    }
    /**
     * Analyze recent cues for escalation patterns
     */
    analyzePatterns(currentTime) {
        for (const pattern of this.patterns) {
            const match = this.checkPattern(pattern, currentTime);
            if (match) {
                // Pattern detected!
                const patternKey = `${pattern.name}-${Math.floor(match.firstCueTime)}`;
                // Check if we've already detected this pattern
                if (this.detectedPatterns.has(patternKey)) {
                    continue; // Skip duplicate
                }
                this.detectedPatterns.set(patternKey, match);
                logger.info(`🎯 PATTERN DETECTED: ${pattern.name} | ` +
                    `Matched ${match.matchedPhases.length}/${pattern.phases.length} phases | ` +
                    `Confidence: ${match.confidence}% | ` +
                    `Time span: ${match.firstCueTime.toFixed(1)}s - ${match.lastCueTime.toFixed(1)}s`);
                // Create warning
                if (this.onPatternDetected) {
                    const warning = this.createWarning(match);
                    this.onPatternDetected(warning);
                }
            }
        }
    }
    /**
     * Check if a pattern matches recent cues
     */
    checkPattern(pattern, currentTime) {
        // Get cues within window
        const relevantCues = this.recentCues.filter(cue => currentTime - cue.time <= pattern.windowSize);
        if (relevantCues.length === 0) {
            return null;
        }
        const matchedPhases = [];
        const matchedCues = [];
        // Check each phase
        for (let phaseIndex = 0; phaseIndex < pattern.phases.length; phaseIndex++) {
            const phase = pattern.phases[phaseIndex];
            // Check if any cue matches this phase
            const matchingCue = relevantCues.find(cue => phase.some(keyword => cue.text.toLowerCase().includes(keyword.toLowerCase())));
            if (matchingCue) {
                matchedPhases.push(phaseIndex);
                matchedCues.push(matchingCue);
            }
        }
        // Check if minimum phases matched
        if (matchedPhases.length < pattern.minimumPhases) {
            return null; // Not enough phases matched
        }
        // Calculate confidence based on:
        // 1. Number of phases matched
        // 2. Sequential order (bonus if phases appear in order)
        // 3. Time span (shorter = higher confidence)
        let confidence = pattern.baseConfidence;
        // Bonus for matching more phases
        const phaseBonus = ((matchedPhases.length - pattern.minimumPhases) / pattern.phases.length) * 10;
        confidence += phaseBonus;
        // Bonus for sequential matching
        const isSequential = this.isSequential(matchedPhases);
        if (isSequential) {
            confidence += 5;
        }
        // Time span bonus (shorter span = higher confidence)
        if (matchedCues.length > 1) {
            const timeSpan = matchedCues[matchedCues.length - 1].time - matchedCues[0].time;
            if (timeSpan < pattern.windowSize * 0.5) {
                confidence += 5; // Fast escalation
            }
        }
        confidence = Math.min(confidence, 100); // Cap at 100
        return {
            pattern,
            matchedPhases,
            confidence,
            firstCueTime: matchedCues[0].time,
            lastCueTime: matchedCues[matchedCues.length - 1].time
        };
    }
    /**
     * Check if matched phases are in sequential order
     */
    isSequential(phases) {
        for (let i = 1; i < phases.length; i++) {
            if (phases[i] <= phases[i - 1]) {
                return false;
            }
        }
        return true;
    }
    /**
     * Create warning from pattern match
     */
    createWarning(match) {
        return {
            id: `pattern-${match.pattern.category}-${Math.floor(match.firstCueTime)}`,
            videoId: 'pattern-detected',
            categoryKey: match.pattern.category,
            startTime: Math.max(0, match.lastCueTime - 5), // 5 second lead time before last cue
            endTime: match.lastCueTime + 10, // 10 seconds after
            submittedBy: 'temporal-pattern-detector',
            status: 'approved',
            score: 0,
            confidenceLevel: Math.round(match.confidence),
            requiresModeration: false,
            description: `${match.pattern.description} (${match.matchedPhases.length}/${match.pattern.phases.length} phases matched)`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    /**
     * Register callback for pattern detection
     */
    onDetection(callback) {
        this.onPatternDetected = callback;
    }
    /**
     * Get all detected patterns
     */
    getDetectedPatterns() {
        return Array.from(this.detectedPatterns.values());
    }
    /**
     * Clear detected patterns
     */
    clear() {
        this.recentCues = [];
        this.detectedPatterns.clear();
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalPatterns: this.patterns.length,
            recentCuesCount: this.recentCues.length,
            detectedPatternsCount: this.detectedPatterns.size
        };
    }
}
//# sourceMappingURL=TemporalPatternDetector.js.map