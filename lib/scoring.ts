export const INITIAL_SCORE = 4.0;
export const MAX_SCORE = 10.0;
export const MIN_SCORE = 0.0;
export const CORRECT_PENALTY = -1.0;
export const WRONG_PENALTY = 1.0;
export const DIFFICULT_THRESHOLD = 5.0;

export function calculateNewScore(currentScore: number, correct: boolean): number {
  let newScore = correct
    ? currentScore + CORRECT_PENALTY
    : currentScore + WRONG_PENALTY;

  // Clamp to min/max
  newScore = Math.max(MIN_SCORE, Math.min(MAX_SCORE, newScore));

  // Skip score 4 to keep questions in active learning pool
  if (newScore === 4) {
    newScore = correct ? 3 : 5;
  }

  return newScore;
}

export function isLearned(score: number): boolean {
  return score <= MIN_SCORE;
}

export function isDifficult(score: number): boolean {
  return score >= DIFFICULT_THRESHOLD;
}

export function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const userInput = userAnswer.trim().toLowerCase();

  // Split correct answer by common delimiters (comma, semicolon)
  const parts = correctAnswer.split(/[,;]/);

  const acceptableAnswers: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim().toLowerCase();
    if (!trimmed) continue;

    // Extract content in parentheses
    const parenMatch = trimmed.match(/^([^(]*)\s*\(([^)]+)\)(.*)$/);
    if (parenMatch) {
      // Add main part (before parentheses)
      const mainPart = (parenMatch[1] + parenMatch[3]).trim();
      if (mainPart) acceptableAnswers.push(mainPart);

      // Add parentheses content
      const parenContent = parenMatch[2].trim();
      if (parenContent) acceptableAnswers.push(parenContent);

      // Add full answer with parentheses
      acceptableAnswers.push(trimmed);
    } else {
      acceptableAnswers.push(trimmed);
    }
  }

  // Check if user input matches any acceptable answer
  return acceptableAnswers.some(ans => ans === userInput);
}
