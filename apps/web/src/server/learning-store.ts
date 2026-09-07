import 'server-only';
import path from 'node:path';
import { createLearningStore } from './learning-storage-core';

const store = createLearningStore(path.join(process.cwd(), '.data', 'learning-records.json'));
export const { getLearningData, saveProfile, getWorkspace, patchWorkspace, saveLearningOutcome, saveSessionCompletion, expressionAction, importMaterial } = store;
