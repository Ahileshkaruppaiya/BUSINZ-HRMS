import { Request, Response, NextFunction } from 'express';
import { settingsRepository } from '../repositories/settingsRepository.js';
import {
  updateCompanySettingsSchema,
  updateGeofenceSettingsSchema,
} from '../validators/settingsValidators.js';

export const getCompanySettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await settingsRepository.getCompanySettings();
    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCompanySettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = updateCompanySettingsSchema.parse(req.body);
    const updated = await settingsRepository.updateCompanySettings(validated);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const getGeofenceSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const geofence = await settingsRepository.getGeofenceSettings();
    res.status(200).json({
      success: true,
      data: geofence,
    });
  } catch (err) {
    next(err);
  }
};

export const updateGeofenceSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = updateGeofenceSettingsSchema.parse(req.body);
    const updated = await settingsRepository.updateGeofenceSettings(validated);
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
