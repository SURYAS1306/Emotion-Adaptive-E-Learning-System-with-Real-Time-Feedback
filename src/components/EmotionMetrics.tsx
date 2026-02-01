/**
 * EmotionMetrics Component
 * 
 * Displays real-time emotion metrics including:
 * - Frustration Index
 * - Boredom Index
 * - Cognitive Load Score
 * - Engagement Score
 * 
 * Also provides emotion-based difficulty suggestions for adaptive learning.
 * This component is central to the Emotion-Adaptive E-Learning System's
 * feedback mechanism.
 */

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  Battery,
  BrainCircuit,
  Flame,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  Coffee,
  Target,
  ArrowRight,
  Lightbulb,
  Smile,
  Frown,
  Meh,
} from "lucide-react";
import type { UnifiedEmotionState, EmotionType } from "@/types/emotion";
import type { DifficultyLevel } from "@/data/codingProblems";

// ============ Types ============

interface EmotionMetricsProps {
  /** Current unified emotion state from the emotion engine */
  emotionState: UnifiedEmotionState;
  /** Current emotion type for additional context */
  currentEmotion: EmotionType;
  /** Optional: Current difficulty level being shown */
  currentDifficulty?: DifficultyLevel;
  /** Callback when user accepts difficulty suggestion */
  onSuggestDifficulty?: (difficulty: DifficultyLevel) => void;
  /** Whether to show the difficulty suggestion card */
  showSuggestion?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

interface MetricConfig {
  label: string;
  icon: React.ReactNode;
  value: number;
  color: string;
  bgColor: string;
  description: string;
  trend?: "up" | "down" | "stable";
}

// ============ Helper Functions ============

/**
 * Get the suggested difficulty based on emotional state.
 * 
 * Logic:
 * - Happy/Surprised + high engagement → Medium (challenge them)
 * - Neutral + moderate engagement → Medium
 * - Sad/Frustrated/Angry/Fear + low engagement → Easy (support them)
 * - High frustration (>0.6) → Easy
 * - High boredom (>0.5) + high engagement → Hard (they need more challenge)
 * - Low cognitive load + high engagement → Hard
 */
export function getSuggestedDifficulty(
  emotionState: UnifiedEmotionState,
  currentEmotion: EmotionType
): { difficulty: DifficultyLevel; reason: string; shouldPrompt: boolean } {
  const { frustration, boredom, engagement, cognitive_load, attention } = emotionState;

  // High frustration always suggests easier content
  if (frustration > 0.6) {
    return {
      difficulty: "easy",
      reason: "You seem frustrated. Let's try something easier to build confidence.",
      shouldPrompt: true,
    };
  }

  // Sad or fearful emotions with low engagement
  if (
    (currentEmotion === "sad" || currentEmotion === "fear" || currentEmotion === "angry") &&
    engagement < 0.5
  ) {
    return {
      difficulty: "easy",
      reason: "Taking a step back might help. Try an easier problem to regain momentum.",
      shouldPrompt: true,
    };
  }

  // High boredom with good attention - they're under-challenged
  if (boredom > 0.5 && attention > 0.6) {
    return {
      difficulty: "hard",
      reason: "You seem ready for more challenge! Try a harder problem.",
      shouldPrompt: true,
    };
  }

  // Happy/surprised with good engagement - medium challenge
  if (
    (currentEmotion === "happy" || currentEmotion === "surprised") &&
    engagement > 0.5
  ) {
    return {
      difficulty: "medium",
      reason: "Great mood! A medium difficulty problem would be perfect.",
      shouldPrompt: false,
    };
  }

  // Low cognitive load with high engagement - can handle more
  if (cognitive_load === "low" && engagement > 0.6) {
    return {
      difficulty: "hard",
      reason: "You're handling this well. Ready for something more challenging?",
      shouldPrompt: false,
    };
  }

  // High cognitive load - ease off
  if (cognitive_load === "high") {
    return {
      difficulty: "easy",
      reason: "High cognitive load detected. Consider an easier problem.",
      shouldPrompt: engagement < 0.4,
    };
  }

  // Default: medium
  return {
    difficulty: "medium",
    reason: "You're in a good learning state. Medium difficulty is recommended.",
    shouldPrompt: false,
  };
}

/**
 * Get color classes based on metric value and type
 */
function getMetricColor(value: number, isNegative: boolean = false): { color: string; bgColor: string } {
  if (isNegative) {
    // For negative metrics like frustration/boredom, high is bad
    if (value > 0.7) return { color: "text-red-500", bgColor: "bg-red-500" };
    if (value > 0.4) return { color: "text-amber-500", bgColor: "bg-amber-500" };
    return { color: "text-green-500", bgColor: "bg-green-500" };
  } else {
    // For positive metrics like engagement, high is good
    if (value > 0.7) return { color: "text-green-500", bgColor: "bg-green-500" };
    if (value > 0.4) return { color: "text-amber-500", bgColor: "bg-amber-500" };
    return { color: "text-red-500", bgColor: "bg-red-500" };
  }
}

/**
 * Get cognitive load color
 */
function getCognitiveLoadColor(load: "low" | "medium" | "high"): { color: string; bgColor: string; value: number } {
  switch (load) {
    case "low":
      return { color: "text-green-500", bgColor: "bg-green-500", value: 0.33 };
    case "medium":
      return { color: "text-amber-500", bgColor: "bg-amber-500", value: 0.66 };
    case "high":
      return { color: "text-red-500", bgColor: "bg-red-500", value: 1.0 };
  }
}

/**
 * Get emotion icon
 */
function getEmotionIcon(emotion: EmotionType) {
  switch (emotion) {
    case "happy":
    case "surprised":
      return <Smile className="h-4 w-4" />;
    case "sad":
    case "fear":
    case "angry":
    case "disgust":
      return <Frown className="h-4 w-4" />;
    default:
      return <Meh className="h-4 w-4" />;
  }
}

// ============ Sub-components ============

interface MetricCardProps {
  metric: MetricConfig;
  compact?: boolean;
}

function MetricCard({ metric, compact = false }: MetricCardProps) {
  const percentage = Math.round(metric.value * 100);

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-help">
            <div className={metric.color}>{metric.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium truncate">{metric.label}</span>
                <span className={`text-xs font-bold ${metric.color}`}>{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium">{metric.label}</p>
          <p className="text-xs text-muted-foreground">{metric.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Card className="p-4 emotion-card emotion-transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${metric.bgColor}/20 ${metric.color}`}>
            {metric.icon}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{metric.label}</h4>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
        </div>
        <span className={`text-2xl font-bold ${metric.color}`}>{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </Card>
  );
}

// ============ Main Component ============

export function EmotionMetrics({
  emotionState,
  currentEmotion,
  currentDifficulty,
  onSuggestDifficulty,
  showSuggestion = true,
  compact = false,
}: EmotionMetricsProps) {
  // Calculate metrics
  const metrics: MetricConfig[] = useMemo(() => {
    const frustrationColors = getMetricColor(emotionState.frustration, true);
    const boredomColors = getMetricColor(emotionState.boredom, true);
    const engagementColors = getMetricColor(emotionState.engagement, false);
    const cognitiveColors = getCognitiveLoadColor(emotionState.cognitive_load);

    return [
      {
        label: "Frustration Index",
        icon: <Flame className="h-4 w-4" />,
        value: emotionState.frustration,
        color: frustrationColors.color,
        bgColor: frustrationColors.bgColor,
        description: emotionState.frustration > 0.6 
          ? "High frustration detected. Consider taking a break or trying easier content."
          : emotionState.frustration > 0.3
            ? "Moderate frustration. You're being challenged appropriately."
            : "Low frustration. You're in a good learning state.",
      },
      {
        label: "Boredom Index",
        icon: <Coffee className="h-4 w-4" />,
        value: emotionState.boredom,
        color: boredomColors.color,
        bgColor: boredomColors.bgColor,
        description: emotionState.boredom > 0.5
          ? "You might need more challenge. Try harder problems!"
          : emotionState.boredom > 0.3
            ? "Engagement is moderate. Content difficulty seems appropriate."
            : "Low boredom. You're well engaged with the content.",
      },
      {
        label: "Cognitive Load",
        icon: <BrainCircuit className="h-4 w-4" />,
        value: cognitiveColors.value,
        color: cognitiveColors.color,
        bgColor: cognitiveColors.bgColor,
        description: emotionState.cognitive_load === "high"
          ? "High mental load. Consider breaking down the problem."
          : emotionState.cognitive_load === "medium"
            ? "Moderate cognitive load. Good learning zone."
            : "Low cognitive load. You might be ready for more complexity.",
      },
      {
        label: "Engagement Score",
        icon: <Zap className="h-4 w-4" />,
        value: emotionState.engagement,
        color: engagementColors.color,
        bgColor: engagementColors.bgColor,
        description: emotionState.engagement > 0.7
          ? "Highly engaged! You're in the flow state."
          : emotionState.engagement > 0.4
            ? "Moderately engaged. Stay focused!"
            : "Low engagement. Try to find what interests you.",
      },
    ];
  }, [emotionState]);

  // Get difficulty suggestion
  const suggestion = useMemo(
    () => getSuggestedDifficulty(emotionState, currentEmotion),
    [emotionState, currentEmotion]
  );

  const shouldShowSuggestionCard =
    showSuggestion &&
    suggestion.shouldPrompt &&
    currentDifficulty !== suggestion.difficulty;

  const getDifficultyBadgeColor = (diff: DifficultyLevel) => {
    switch (diff) {
      case "easy":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40";
      case "medium":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40";
      case "hard":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40";
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Current emotion badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Emotion State</span>
          <Badge variant="outline" className="capitalize gap-1">
            {getEmotionIcon(currentEmotion)}
            {currentEmotion}
          </Badge>
        </div>

        {/* Compact metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} compact />
          ))}
        </div>

        {/* Attention indicator */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Target className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">Attention</span>
              <span className="text-xs font-bold">{Math.round(emotionState.attention * 100)}%</span>
            </div>
            <Progress value={emotionState.attention * 100} className="h-1.5" />
          </div>
        </div>

        {/* Compact suggestion */}
        {shouldShowSuggestionCard && onSuggestDifficulty && (
          <Card className="p-3 border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium">Suggestion</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{suggestion.reason}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-7"
              onClick={() => onSuggestDifficulty(suggestion.difficulty)}
            >
              Switch to {suggestion.difficulty}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with current emotion */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Emotion Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Real-time learning state analysis
          </p>
        </div>
        <Badge variant="outline" className="capitalize gap-2 px-3 py-1">
          {getEmotionIcon(currentEmotion)}
          {currentEmotion}
          <span className="text-muted-foreground">
            ({Math.round(emotionState.confidence * 100)}% conf)
          </span>
        </Badge>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {/* Attention bar */}
      <Card className="p-4 emotion-card emotion-transition">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="font-medium">Attention Level</span>
          </div>
          <span className="text-lg font-bold">
            {Math.round(emotionState.attention * 100)}%
          </span>
        </div>
        <Progress value={emotionState.attention * 100} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">
          {emotionState.attention > 0.7
            ? "Excellent focus! You're fully engaged."
            : emotionState.attention > 0.4
              ? "Moderate attention. Try to minimize distractions."
              : "Low attention detected. Consider taking a short break."}
        </p>
      </Card>

      {/* Difficulty suggestion card */}
      {shouldShowSuggestionCard && onSuggestDifficulty && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/10 emotion-transition">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">Adaptive Suggestion</h4>
                <Badge className={getDifficultyBadgeColor(suggestion.difficulty)}>
                  {suggestion.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {suggestion.reason}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onSuggestDifficulty(suggestion.difficulty)}
                  className="gap-1"
                >
                  Switch to {suggestion.difficulty}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {currentDifficulty && (
                  <span className="text-xs text-muted-foreground">
                    Current: {currentDifficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick summary for non-prompting state */}
      {!shouldShowSuggestionCard && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm">
              <span className="font-medium">Recommended difficulty: </span>
              <Badge
                variant="outline"
                className={`ml-1 ${getDifficultyBadgeColor(suggestion.difficulty)}`}
              >
                {suggestion.difficulty}
              </Badge>
              <span className="text-muted-foreground ml-2 text-xs">
                {suggestion.reason}
              </span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default EmotionMetrics;
