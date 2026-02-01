import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { UnifiedEmotionState } from "@/types/emotion";

type Difficulty = "easy" | "medium" | "hard";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
  hint: string;
  explanation: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    difficulty: "easy",
    question: "2 + 3 = ?",
    options: ["4", "5", "6", "7"],
    correctIndex: 1,
    hint: "Think of counting 3, then 2 more.",
    explanation: "2 + 3 = 5 because adding 2 to 3 moves you two steps forward on the number line.",
  },
  {
    id: "q2",
    difficulty: "medium",
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2"],
    correctIndex: 1,
    hint: "Use the power rule: d/dx (xⁿ) = n·xⁿ⁻¹.",
    explanation: "By the power rule, d/dx (x²) = 2·x¹ = 2x.",
  },
  {
    id: "q3",
    difficulty: "hard",
    question:
      "A function f(x) grows such that each value is twice the previous one. Which function best models this?",
    options: ["f(x) = x + 2", "f(x) = 2x", "f(x) = 2^x", "f(x) = x²"],
    correctIndex: 2,
    hint: "Doubling repeatedly is exponential behaviour.",
    explanation:
      "Repeated doubling is exponential: f(x) = 2^x. Linear and quadratic functions do not double at each step.",
  },
];

export interface AdaptiveQuizProps {
  /** Current unified emotion state driving adaptation decisions. */
  emotionState: UnifiedEmotionState;
}

export function AdaptiveQuiz({ emotionState }: AdaptiveQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  const currentQuestion = QUESTIONS[currentIndex];

  const isAnswerCorrect =
    selectedIndex !== null && selectedIndex === currentQuestion.correctIndex;

  const difficultyLabel = useMemo(() => {
    switch (currentQuestion.difficulty) {
      case "easy":
        return "Easy";
      case "medium":
        return "Medium";
      case "hard":
        return "Hard";
      default:
        return "";
    }
  }, [currentQuestion.difficulty]);

  const adaptationSummary = useMemo(() => {
    const { emotion, attention, engagement, frustration, boredom, cognitive_load } =
      emotionState;

    let decision = "Maintain current difficulty.";
    let nextDifficulty: Difficulty = currentQuestion.difficulty;
    let recommendBreak = false;
    let showHintRecommended = false;

    // Rule 1: High frustration + low attention -> easier + hint
    if (frustration > 0.6 && attention < 0.5) {
      decision = "You appear frustrated and less attentive. Lowering difficulty and suggesting a hint.";
      if (currentQuestion.difficulty === "hard") {
        nextDifficulty = "medium";
      } else if (currentQuestion.difficulty === "medium") {
        nextDifficulty = "easy";
      }
      showHintRecommended = true;
    }

    // Rule 2: Bored + high attention -> harder questions
    if (boredom > 0.5 && attention > 0.6) {
      decision =
        "You seem attentive but possibly bored. Increasing difficulty to keep you challenged.";
      if (currentQuestion.difficulty === "easy") {
        nextDifficulty = "medium";
      } else if (currentQuestion.difficulty === "medium") {
        nextDifficulty = "hard";
      }
    }

    // Rule 3: High cognitive load + negative emotions -> recommend short break
    if (
      cognitive_load === "high" &&
      (emotion === "angry" || emotion === "sad" || emotion === "fear")
    ) {
      recommendBreak = true;
    }

    return {
      decision,
      nextDifficulty,
      recommendBreak,
      showHintRecommended,
    };
  }, [emotionState, currentQuestion.difficulty]);

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    setAttemptCount((c) => c + 1);
    if (selectedIndex === currentQuestion.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    // Choose next question based on adaptation decision
    const targetDifficulty = adaptationSummary.nextDifficulty;

    const candidates = QUESTIONS.filter(
      (q) => q.difficulty === targetDifficulty && q.id !== currentQuestion.id
    );

    let next = currentIndex;
    if (candidates.length > 0) {
      const currentId = currentQuestion.id;
      const idx = QUESTIONS.findIndex((q) => q.id === currentId);
      let candidateIndex = QUESTIONS.findIndex(
        (q) => q.id === candidates[0].id
      );
      if (candidateIndex === -1) {
        candidateIndex = (idx + 1) % QUESTIONS.length;
      }
      next = candidateIndex;
    } else {
      next = (currentIndex + 1) % QUESTIONS.length;
    }

    setCurrentIndex(next);
    setSelectedIndex(null);
    setShowHint(false);
    setShowExplanation(false);
  };

  const mastery =
    attemptCount === 0 ? 0 : Math.round((correctCount / attemptCount) * 100);

  return (
    <Card className="p-6 space-y-4 emotion-card emotion-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Emotion-Adaptive Quiz (POC)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Difficulty and feedback adapt based on your emotion and engagement.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-muted-foreground tracking-wide">
            Current Difficulty
          </p>
          <p className="text-base font-semibold">{difficultyLabel}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Estimated engagement:{" "}
          <span className="font-semibold">
            {Math.round(emotionState.engagement * 100)}%
          </span>{" "}
          · Attention:{" "}
          <span className="font-semibold">
            {Math.round(emotionState.attention * 100)}%
          </span>{" "}
          · Frustration:{" "}
          <span className="font-semibold">
            {Math.round(emotionState.frustration * 100)}%
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Cognitive load:{" "}
          <span className="font-semibold capitalize">
            {emotionState.cognitive_load}
          </span>{" "}
          · Boredom:{" "}
          <span className="font-semibold">
            {Math.round(emotionState.boredom * 100)}%
          </span>
        </p>
      </div>

      <div className="mt-2">
        <p className="text-sm font-medium mb-1">Mastery estimate</p>
        <Progress value={mastery} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {correctCount} correct out of {attemptCount} attempts (
          {mastery}%)
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <p className="font-medium">{currentQuestion.question}</p>
        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrect = index === currentQuestion.correctIndex;

            let variant: "outline" | "default" = "outline";
            if (showExplanation && isSelected) {
              variant = isCorrect ? "default" : "outline";
            } else if (isSelected) {
              variant = "default";
            }

            return (
              <Button
                key={option}
                variant={variant}
                className="w-full justify-start"
                onClick={() => setSelectedIndex(index)}
              >
                <span className="mr-2 font-mono text-xs">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Button
          variant="outline"
          onClick={() => setShowHint(true)}
          disabled={showHint}
        >
          Show Hint
        </Button>
        <Button onClick={handleSubmit} disabled={selectedIndex === null}>
          Check Answer
        </Button>
        <Button
          variant="ghost"
          onClick={handleNext}
          disabled={!showExplanation}
        >
          Next Question
        </Button>
      </div>

      {showHint && (
        <div className="mt-3 p-3 rounded-md bg-muted text-sm">
          <p className="font-semibold mb-1">Hint</p>
          <p>{currentQuestion.hint}</p>
        </div>
      )}

      {showExplanation && (
        <div className="mt-3 p-3 rounded-md bg-muted text-sm">
          <p className="font-semibold mb-1">
            {isAnswerCorrect ? "Correct!" : "Let’s review the concept"}
          </p>
          <p>{currentQuestion.explanation}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            System decision: {adaptationSummary.decision}
          </p>
          {adaptationSummary.recommendBreak && (
            <p className="mt-1 text-xs text-red-500">
              You appear to be under high cognitive load. Consider taking a
              short break before continuing.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

