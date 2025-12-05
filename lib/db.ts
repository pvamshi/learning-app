import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import type { RxDatabase, RxCollection } from 'rxdb';

// Add plugins
addRxPlugin(RxDBMigrationSchemaPlugin);
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

// Question schema
const questionSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    question_text: {
      type: 'string',
    },
    answer: {
      type: 'string',
    },
    description: {
      type: ['string', 'null'],
    },
    score: {
      type: 'number',
      minimum: 0,
      maximum: 10,
    },
    created_at: {
      type: 'string',
      format: 'date-time',
    },
    last_reviewed_at: {
      type: ['string', 'null'],
      format: 'date-time',
    },
    is_dirty: {
      type: 'boolean',
      default: false,
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
      default: [],
    },
  },
  required: ['id', 'question_text', 'answer', 'score', 'created_at'],
} as const;

// Attempt schema
const attemptSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    question_id: {
      type: 'string',
    },
    correct: {
      type: 'boolean',
    },
    answered_at: {
      type: 'string',
      format: 'date-time',
    },
    is_synced: {
      type: 'boolean',
      default: false,
    },
  },
  required: ['id', 'question_id', 'correct', 'answered_at'],
} as const;

export type QuestionDocument = {
  id: string;
  question_text: string;
  answer: string;
  description: string | null;
  score: number;
  created_at: string;
  last_reviewed_at: string | null;
  is_dirty: boolean;
  tags: string[];
};

export type AttemptDocument = {
  id: string;
  question_id: string;
  correct: boolean;
  answered_at: string;
  is_synced: boolean;
};

type QuestionCollection = RxCollection<QuestionDocument>;
type AttemptCollection = RxCollection<AttemptDocument>;

type DatabaseCollections = {
  questions: QuestionCollection;
  attempts: AttemptCollection;
};

type DatabaseType = RxDatabase<DatabaseCollections>;

let dbPromise: Promise<DatabaseType> | null = null;

export async function getDatabase(): Promise<DatabaseType> {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase<DatabaseCollections>({
    name: 'learningapp',
    storage: wrappedValidateAjvStorage({
      storage: getRxStorageDexie(),
    }),
  }).then(async (db) => {
    // Create collections
    await db.addCollections({
      questions: {
        schema: questionSchema,
        migrationStrategies: {
          1: function (oldDoc: any) {
            // Add tags field to existing documents
            oldDoc.tags = oldDoc.tags || [];
            return oldDoc;
          },
        },
      },
      attempts: {
        schema: attemptSchema,
      },
    });

    return db;
  });

  return dbPromise;
}

// Generate UUID (simple version)
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
