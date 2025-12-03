# Learning App

A spaced repetition learning application built with Next.js and Supabase.

## Features

- **Add Questions**: Input questions with answers and optional descriptions
- **Game Mode**: Practice with 10 questions (20% difficult, 80% new)
- **Revision Mode**: Systematic review using FIFO queue
- **Progress Tracking**: View learning statistics and learned words
- **Adaptive Scoring**: Questions start at score 4, decrease by 0.5 when correct, increase by 1 when wrong

## Scoring System

- **Initial Score**: 4.0
- **Correct Answer**: -0.5
- **Wrong/Don't Know**: +1.0
- **Learned**: Score ≤ 0 (requires 8 correct answers from initial score)
- **Difficult**: Score ≥ 5.0
- **Max Score**: 10.0

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key
3. Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migration

In your Supabase SQL Editor, run the contents of `schema.sql`:

```sql
-- Copy and paste the contents of schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
learning-app/
├── app/
│   ├── add/          # Add question page
│   ├── game/         # Game mode page
│   ├── revision/     # Revision mode page
│   ├── progress/     # Progress tracking page
│   └── api/          # API routes
│       ├── questions/
│       ├── game/
│       ├── answer/
│       ├── revision/
│       └── progress/
├── lib/
│   ├── supabase.ts   # Supabase client
│   └── scoring.ts    # Scoring logic
└── schema.sql        # Database schema
```

## How It Works

### Game Mode
- Selects 2 difficult questions (score ≥ 5)
- Selects 8 new questions (score < 5)
- Falls back to available questions if queues don't have enough
- Shuffles questions randomly

### Revision Mode
- Uses FIFO queue (oldest reviewed first)
- Shows one question at a time
- Re-queues questions with score > 0 after answering
- Completes when all questions have score ≤ 0

### Progress Tracking
- Total questions count
- Learned questions count (score ≤ 0)
- Progress percentage: (learned / total) * 100
- List of all learned words

## Future Enhancements

- Telegram bot integration for adding questions
- Multi-choice questions for difficult words
- Enhanced statistics and analytics
- Spaced repetition scheduling
