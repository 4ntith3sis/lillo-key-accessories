import { Request, Response } from 'express';
import { appwriteDatabases, isAppwriteConfigured } from '../config/appwrite.js';
import { env } from '../config/env.js';

export const getHealth = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'LILLO API is running',
  });
};

export const getAppwriteHealth = async (req: Request, res: Response): Promise<void> => {
  if (!isAppwriteConfigured()) {
    res.status(503).json({
      success: false,
      message: 'Appwrite is not configured',
    });
    return;
  }

  try {
    await appwriteDatabases.get(env.appwrite.databaseId);
    res.status(200).json({
      success: true,
      message: 'Appwrite connection is healthy',
    });
  } catch (error) {
    console.warn('[Health] Appwrite ping failed:', error instanceof Error ? error.message : error);
    res.status(503).json({
      success: false,
      message: 'Appwrite connection failed',
    });
  }
};

export default {
  getHealth,
  getAppwriteHealth,
};
