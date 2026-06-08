import { useState, useCallback, useRef } from 'react';

/**
 * useQuiz — manages the active quiz session
 *
 * @param {object} paper — the question paper object with { questions, title, ... }
 * @returns quiz state and action handlers
 */
export function useQuiz(paper) {
  const questions = paper?.questions ?? [];
  const total = questions.length;

  // answers: { [questionId]: "A" | "B" | "C" | "D" }
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const startedAt = useRef(Date.now());

  const selectAnswer = useCallback((questionId, option) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }, [submitted]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const unansweredIds = questions
    .filter((q) => !answers[q.id])
    .map((q) => q.id);

  const trySubmit = useCallback(() => {
    setSubmitAttempted(true);
    return allAnswered;
  }, [allAnswered]);

  const confirmSubmit = useCallback(() => {
    if (!allAnswered) return null;
    setSubmitted(true);
    return buildResults();
  }, [allAnswered, answers, questions]); // eslint-disable-line

  const buildResults = useCallback(() => {
    let correct = 0;
    const review = questions.map((q) => {
      const chosen = answers[q.id] ?? null;
      const isCorrect = chosen === q.correct;
      if (isCorrect) correct++;
      return {
        ...q,
        chosen,
        isCorrect,
      };
    });

    const elapsedSeconds = Math.floor((Date.now() - startedAt.current) / 1000);
    const score = Math.round((correct / total) * 100);

    return {
      score,
      correct,
      wrong: total - correct,
      total,
      elapsedSeconds,
      review,
    };
  }, [answers, questions, total]);

  const reset = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
    setSubmitAttempted(false);
    startedAt.current = Date.now();
  }, []);

  return {
    answers,
    submitted,
    submitAttempted,
    answeredCount,
    allAnswered,
    unansweredIds,
    selectAnswer,
    trySubmit,
    confirmSubmit,
    buildResults,
    reset,
  };
}
