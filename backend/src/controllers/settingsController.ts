import { Request, Response, NextFunction } from 'express';
import { settingsRepository } from '../repositories/settingsRepository.js';
import {
  updateCompanySettingsSchema,
  updateGeofenceSettingsSchema,
} from '../validators/settingsValidators.js';

export const getCompanySettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const companyId = req.user?.company_id || (req.query.company_id as string) || (req.headers['x-company-id'] as string);
    const company = await settingsRepository.getCompanySettings(companyId);
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
    const companyId = req.user?.company_id || validated.company_id || (req.headers['x-company-id'] as string);
    const updated = await settingsRepository.updateCompanySettings(validated, companyId);
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
