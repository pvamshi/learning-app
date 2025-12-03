export const INITIAL_SCORE = 4.0;
export const MAX_SCORE = 10.0;
export const MIN_SCORE = 0.0;
export const CORRECT_PENALTY = -0.5;
export const WRONG_PENALTY = 1.0;
export const DIFFICULT_THRESHOLD = 5.0;

export function calculateNewScore(currentScore: number, correct: boolean): number {
  const newScore = correct 
    ? currentScore + CORRECT_PENALTY 
    : currentScore + WRONG_PENALTY;
  
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, newScore));
}

export function isLearned(score: number): boolean {
  return score <= MIN_SCORE;
}

export function isDifficult(score: number): boolean {
  return score >= DIFFICULT_THRESHOLD;
}

export function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}
