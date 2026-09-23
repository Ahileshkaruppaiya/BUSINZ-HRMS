import { Request, Response } from 'express';

let inMemoryApiKey: string = process.env.GEMINI_API_KEY || '';
let inMemoryModel: string = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const cleanKey = (key?: string): string => {
  if (!key) return '';
  return key.trim().replace(/^['"]|['"]$/g, '').replace(/^Bearer\s+/i, '').trim();
};

export const getEffectiveKey = (reqKey?: string): string => {
  const reqClean = cleanKey(reqKey);
  if (reqClean) return reqClean;
  const memClean = cleanKey(inMemoryApiKey);
  if (memClean) return memClean;
  return cleanKey(process.env.GEMINI_API_KEY);
};

export const getAiStatus = async (_req: Request, res: Response): Promise<void> => {
  const effectiveKey = getEffectiveKey();
  res.json({
    success: true,
    data: {
      isConfigured: Boolean(effectiveKey),
      hasServerKey: Boolean(cleanKey(process.env.GEMINI_API_KEY)),
      model: inMemoryModel,
      source: cleanKey(process.env.GEMINI_API_KEY) ? 'server_env' : (inMemoryApiKey ? 'session' : 'none'),
    }
  });
};

export const listModels = async (req: Request, res: Response): Promise<void> => {
  const apiKey = getEffectiveKey(req.body?.apiKey || (req.headers['x-gemini-api-key'] as string));
  
  if (!apiKey) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Google Gemini API Key is required. Please provide a valid key.'
      }
    });
    return;
  }

  try {
    const googleRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    const data = await googleRes.json();

    if (!googleRes.ok) {
      const errMsg = data.error?.message || `Google API returned status ${googleRes.status}`;
      let friendlyMessage = errMsg;
      if (errMsg.includes('API key not valid')) {
        friendlyMessage = 'Google Gemini API key is not valid. Please verify your key from Google AI Studio (https://aistudio.google.com/app/apikey).';
      } else if (errMsg.includes('Expected OAuth 2 access token') || errMsg.includes('devconsole-project') || errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
        friendlyMessage = 'Google Generative Language API is not enabled for this project. In Google AI Studio (https://aistudio.google.com/app/apikey), click "Create API key" and choose "Create API key in new project" for instant one-click activation, or enable "Generative Language API" in Google Cloud Console.';
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: friendlyMessage,
          rawMessage: errMsg
        }
      });
      return;
    }

    const models = (data.models || [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({
        name: m.name.replace(/^models\//, ''),
        displayName: m.displayName || m.name,
        description: m.description || '',
        supportedGenerationMethods: m.supportedGenerationMethods || []
      }));

    res.json({
      success: true,
      data: {
        models,
        count: models.length
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Failed to reach Google Generative AI servers'
      }
    });
  }
};

export const generateAiContent = async (req: Request, res: Response): Promise<void> => {
  const apiKey = getEffectiveKey(req.body?.apiKey || (req.headers['x-gemini-api-key'] as string));
  
  if (!apiKey) {
    res.status(400).json({
      success: false,
      error: {
        code: 'NO_API_KEY',
        message: 'No Gemini API Key provided. Please configure your key in Settings -> Integrations & APIs.'
      }
    });
    return;
  }

  let targetModel = req.body?.model || inMemoryModel || 'gemini-2.0-flash';
  if (targetModel.includes('3.6-flash')) targetModel = 'gemini-2.0-flash';

  const contents = req.body?.contents;
  if (!contents || !Array.isArray(contents) || contents.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONTENTS',
        message: 'Missing or invalid contents payload for generateContent'
      }
    });
    return;
  }

  const callModel = async (modelName: string) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1000,
        }
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || `Google API error ${response.status}`);
    }
    const candidate = result.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    return text || '';
  };

  try {
    let outputText = '';
    let modelUsed = targetModel;
    try {
      outputText = await callModel(targetModel);
    } catch (err: any) {
      if (targetModel !== 'gemini-1.5-flash') {
        outputText = await callModel('gemini-1.5-flash');
        modelUsed = 'gemini-1.5-flash';
      } else {
        throw err;
      }
    }

    res.json({
      success: true,
      data: {
        text: outputText,
        modelUsed
      }
    });
  } catch (err: any) {
    const rawMsg = err.message || '';
    let friendlyMessage = rawMsg || 'Gemini content generation failed';
    if (rawMsg.includes('Expected OAuth 2 access token') || rawMsg.includes('devconsole-project') || rawMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
      friendlyMessage = 'Google Generative Language API is not enabled for this project. In Google AI Studio (https://aistudio.google.com/app/apikey), click "Create API key" and choose "Create API key in new project" for instant one-click activation, or enable "Generative Language API" in Google Cloud Console.';
    } else if (rawMsg.includes('API key not valid')) {
      friendlyMessage = 'Google Gemini API key is not valid. Please verify your key from Google AI Studio (https://aistudio.google.com/app/apikey).';
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: friendlyMessage
      }
    });
  }
};

export const saveAiConfig = async (req: Request, res: Response): Promise<void> => {
  const { apiKey, model } = req.body;
  if (apiKey !== undefined) {
    const cleaned = cleanKey(apiKey);
    inMemoryApiKey = cleaned;

    // Safely persist to backend/.env file so server restarts preserve the key
    try {
      const fs = await import('fs');
      const path = await import('path');
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleaned}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${cleaned}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf-8');
      }
    } catch {
      // Non-fatal, memory key is already updated
    }
  }
  if (model) inMemoryModel = model;

  res.json({
    success: true,
    message: 'AI configuration updated successfully',
    data: {
      hasKey: Boolean(inMemoryApiKey),
      model: inMemoryModel
    }
  });
};
