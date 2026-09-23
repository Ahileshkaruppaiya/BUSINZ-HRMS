import { Router } from 'express';
import {
  getAiStatus,
  listModels,
  generateAiContent,
  saveAiConfig
} from '../controllers/aiController.js';

export const aiRouter = Router();

// Public/semi-public routes for client UI
aiRouter.get('/status', getAiStatus);
aiRouter.post('/models', listModels);
aiRouter.post('/generate', generateAiContent);
aiRouter.post('/config', saveAiConfig);
