import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useEmotionContext } from "@/contexts/EmotionContext";
import { useEmotionStream } from "@/domain/emotion/useEmotionStream";
import EmotionCamera from "@/components/EmotionCamera";
import EmotionChat from "@/components/EmotionChat";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  HelpCircle,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  Sparkles,
  ChevronRight,
  Code2,
  ExternalLink,
} from "lucide-react";
import {
  learningTopics,
  quizQuestions,
  type DifficultyLevel,
  type QuizQuestion,
} from "@/data/learningContent";
import type { EmotionType } from "@/types/emotion";
import EmotionMetrics, { getSuggestedDifficulty } from "@/components/EmotionMetrics";

const FRUSTRATION_EMOTIONS: EmotionType[] = ["angry", "sad", "fear"];
const BOREDOM_EMOTIONS: EmotionType[] = ["neutral"];

export default function LearningQuiz() {
  const { currentEmotion, setCurrentEmotion } = useEmotionContext();
  const { state: unifiedEmotionState } = useEmotionStream(currentEmotion, {
    faceStreamActive: true,
    enableStreaming: true,
    mode: "adaptive",
  });
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [quizComplete, setQuizComplete] = useState(false);

  // Use both discrete emotion and unified state for adaptation
  const highFrustration = unifiedEmotionState.frustration > 0.6;
  const suggestEasierContent =
    FRUSTRATION_EMOTIONS.includes(currentEmotion) ||
    highFrustration ||
    wrongStreak >= 2;

  const currentQuestion = quizQuestions[currentQuestionIndex] as
    | QuizQuestion
    | undefined;
  const totalQuestions = quizQuestions.length;
  const progressPercent = quizStarted
    ? ((currentQuestionIndex + (showResult ? 1 : 0)) / totalQuestions) * 100
    : 0;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      "emotion-happy",
      "emotion-sad",
      "emotion-angry",
      "emotion-surprised",
      "emotion-fear",
      "emotion-disgust",
      "emotion-neutral"
    );
    root.classList.add(`emotion-${currentEmotion}`);
  }, [currentEmotion]);

  useEffect(() => {
    if (suggestEasierContent && wrongStreak >= 1) {
      setShowHint(true);
    }
  }, [suggestEasierContent, wrongStreak]);

  const handleEmotionDetected = (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    setShowResult(true);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setWrongStreak(0);
    } else {
      setWrongStreak((w) => w + 1);
      setShowHint(true);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    if (currentQuestionIndex + 1 >= totalQuestions) {
      setQuizComplete(true);
    } else {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const handleRestartQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectCount(0);
    setShowHint(false);
    setWrongStreak(0);
    setQuizComplete(false);
  };

  const getDifficultyColor = (d: DifficultyLevel) => {
    switch (d) {
      case "easy":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40";
      case "medium":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40";
      case "hard":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40";
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 emotion-transition">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="inline-block px-6 py-3 rounded-full emotion-gradient-bg emotion-transition mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-7 w-7" />
                  Learn & Quiz
                </h1>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Emotion-Adaptive E-Learning • Content adapts to your state
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="capitalize emotion-transition border-primary/40 bg-primary/5"
            >
              {currentEmotion} mode
            </Badge>
            {suggestEasierContent && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Hints enabled
              </Badge>
            )}
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span>Eng: {Math.round(unifiedEmotionState.engagement * 100)}%</span>
              <span>Attn: {Math.round(unifiedEmotionState.attention * 100)}%</span>
              <span>Frust: {Math.round(unifiedEmotionState.frustration * 100)}%</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="learn" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3 h-12 emotion-transition bg-muted/80">
            <TabsTrigger
              value="learn"
              className="data-[state=active]:emotion-gradient-bg data-[state=active]:text-white"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Learn
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="data-[state=active]:emotion-gradient-bg data-[state=active]:text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Quiz
            </TabsTrigger>
            <TabsTrigger
              value="coding"
              className="data-[state=active]:emotion-gradient-bg data-[state=active]:text-white"
            >
              <Code2 className="h-4 w-4 mr-2" />
              Coding Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn" className="space-y-6">
            <Card className="emotion-card emotion-transition overflow-hidden">
              <div className="p-6 border-b bg-card/50">
                <h2 className="text-xl font-semibold">Learning Modules</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Explore topics on emotion detection and adaptive learning.
                </p>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {learningTopics.map((topic) => (
                  <AccordionItem
                    key={topic.id}
                    value={topic.id}
                    className="border-b last:border-0"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 emotion-transition">
                      <div className="flex items-center gap-3 text-left">
                        {completedTopics.has(topic.id) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-primary shrink-0" />
                        )}
                        <div>
                          <span className="font-medium">{topic.title}</span>
                          <span className="flex items-center gap-2 text-muted-foreground text-sm font-normal mt-1">
                            <Clock className="h-3 w-3" />
                            {topic.estimatedMinutes} min
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <p className="text-muted-foreground mb-4">
                        {topic.description}
                      </p>
                      <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
                        <div className="whitespace-pre-wrap text-foreground/90">
                          {topic.content}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Key points:</p>
                        <ul className="space-y-1">
                          {topic.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        className="mt-4 emotion-transition"
                        onClick={() =>
                          setCompletedTopics((s) => new Set(s).add(topic.id))
                        }
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as complete
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            {/* Emotion detection panel - same as main page */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
            {!quizStarted ? (
              <Card className="emotion-card emotion-transition p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full emotion-gradient-bg mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Adaptive Quiz</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Test your knowledge on emotion-adaptive e-learning. Hints may
                  appear when you are struggling.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <Badge variant="outline">{quizQuestions.length} questions</Badge>
                  <Badge variant="outline">Mixed difficulty</Badge>
                  <Badge variant="outline">Hints available</Badge>
                </div>
                <Button
                  size="lg"
                  onClick={() => setQuizStarted(true)}
                  className="emotion-transition"
                >
                  Start Quiz
                </Button>
              </Card>
            ) : quizComplete ? (
              <Card className="emotion-card emotion-transition p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full emotion-gradient-bg mb-4">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                <p className="text-2xl font-semibold text-primary mb-2">
                  {correctCount} / {totalQuestions} correct
                </p>
                <p className="text-muted-foreground mb-6">
                  {correctCount >= totalQuestions * 0.8
                    ? "Excellent! You have a strong grasp of emotion-adaptive learning."
                    : correctCount >= totalQuestions * 0.6
                      ? "Good job! Review the modules to strengthen your understanding."
                      : "Keep learning! Revisit the topics and try again."}
                </p>
                <Button
                  onClick={handleRestartQuiz}
                  variant="outline"
                  className="emotion-transition"
                >
                  Try Again
                </Button>
              </Card>
            ) : currentQuestion ? (
              <Card className="emotion-card emotion-transition overflow-hidden">
                <div className="p-6 border-b bg-card/50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getDifficultyColor(currentQuestion.difficulty)}
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="w-32 h-2" />
                </div>
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold">
                    {currentQuestion.question}
                  </h3>
                  <RadioGroup
                    value={selectedAnswer?.toString() ?? ""}
                    onValueChange={(v) => setSelectedAnswer(parseInt(v, 10))}
                    disabled={showResult}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, idx) => {
                      const isCorrect = idx === currentQuestion.correctIndex;
                      const isSelected = selectedAnswer === idx;
                      const showCorrect = showResult && isCorrect;
                      const showWrong =
                        showResult && isSelected && !isCorrect;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center space-x-3 rounded-lg border-2 p-4 emotion-transition cursor-pointer ${
                            showCorrect
                              ? "border-green-500 bg-green-500/10"
                              : showWrong
                                ? "border-red-500 bg-red-500/10"
                                : "border-border hover:border-primary/50 hover:bg-muted/30"
                          }`}
                        >
                          <RadioGroupItem
                            value={idx.toString()}
                            id={`opt-${idx}`}
                          />
                          <Label
                            htmlFor={`opt-${idx}`}
                            className="flex-1 cursor-pointer flex items-center gap-2"
                          >
                            {option}
                            {showCorrect && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {showWrong && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {(showHint || suggestEasierContent) && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 flex gap-3">
                      <HelpCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          Hint
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.hint}
                        </p>
                      </div>
                    </div>
                  )}

                  {showResult && (
                    <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 space-y-2">
                      <p className="font-medium">Explanation</p>
                      <p className="text-sm text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!showResult ? (
                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={selectedAnswer === null}
                        className="emotion-transition"
                      >
                        Submit
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        className="emotion-transition"
                      >
                        {currentQuestionIndex + 1 >= totalQuestions
                          ? "Finish"
                          : "Next"}
                      </Button>
                    )}
                    {!showHint && !suggestEasierContent && (
                      <Button
                        variant="outline"
                        onClick={() => setShowHint(true)}
                        disabled={showResult}
                        className="emotion-transition"
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Show hint
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ) : null}
              </div>

              {/* Emotion panel - camera + chat + metrics */}
              <div className="xl:col-span-1 space-y-4">
                <div className="xl:sticky xl:top-6 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground xl:block hidden">
                    Real-time emotion detection adapts hints and feedback during the quiz
                  </p>
                  <EmotionCamera onEmotionDetected={handleEmotionDetected} compact />
                  
                  {/* Emotion Metrics Panel */}
                  <Card className="p-3 emotion-card emotion-transition">
                    <EmotionMetrics
                      emotionState={unifiedEmotionState}
                      currentEmotion={currentEmotion}
                      currentDifficulty={currentQuestion?.difficulty}
                      showSuggestion={true}
                      compact
                    />
                  </Card>
                  
                  <EmotionChat onEmotionDetected={handleEmotionDetected} compact />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Coding Test Tab */}
          <TabsContent value="coding" className="space-y-6">
            <Card className="emotion-card emotion-transition p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full emotion-gradient-bg mb-6">
                <Code2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3">Coding Test</h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                Practice your coding skills with LeetCode-style problems. Write code,
                run tests, and get instant feedback — all while the system adapts to
                your emotional state.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <Badge variant="outline" className="px-3 py-1">
                  <Code2 className="h-3.5 w-3.5 mr-1" />
                  Multiple Languages
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  9+ Problems
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Lightbulb className="h-3.5 w-3.5 mr-1" />
                  Adaptive Hints
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  <Trophy className="h-3.5 w-3.5 mr-1" />
                  Easy to Hard
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-2xl font-bold text-green-600">Easy</p>
                  <p className="text-sm text-muted-foreground">3 problems</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-2xl font-bold text-amber-600">Medium</p>
                  <p className="text-sm text-muted-foreground">3 problems</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-2xl font-bold text-red-600">Hard</p>
                  <p className="text-sm text-muted-foreground">3 problems</p>
                </div>
              </div>
              <Button asChild size="lg" className="emotion-transition gap-2">
                <Link to="/coding">
                  Start Coding
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </Card>

            {/* Features explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 emotion-card emotion-transition">
                <Code2 className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Monaco Editor</h3>
                <p className="text-sm text-muted-foreground">
                  Full-featured code editor with syntax highlighting and autocomplete.
                </p>
              </Card>
              <Card className="p-4 emotion-card emotion-transition">
                <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Instant Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Run test cases and get immediate results with detailed output.
                </p>
              </Card>
              <Card className="p-4 emotion-card emotion-transition">
                <Lightbulb className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Smart Hints</h3>
                <p className="text-sm text-muted-foreground">
                  Hints appear when you're struggling — adapts to your frustration level.
                </p>
              </Card>
              <Card className="p-4 emotion-card emotion-transition">
                <Sparkles className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Adaptive Difficulty</h3>
                <p className="text-sm text-muted-foreground">
                  System suggests easier or harder problems based on your emotion state.
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 rounded-lg bg-card emotion-card text-center text-sm text-muted-foreground emotion-transition">
          <p>
            Emotion-Adaptive E-Learning System • Content and hints adapt based on
            detected emotion and performance.
          </p>
        </div>
      </div>
    </div>
  );
}
