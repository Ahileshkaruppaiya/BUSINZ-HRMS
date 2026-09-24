import { settingsRepository } from '../repositories/settingsRepository.js';
import { updateCompanySettingsSchema, updateGeofenceSettingsSchema, } from '../validators/settingsValidators.js';
export const getCompanySettings = async (_req, res, next) => {
    try {
        const company = await settingsRepository.getCompanySettings();
        res.status(200).json({
            success: true,
            data: company,
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateCompanySettings = async (req, res, next) => {
    try {
        const validated = updateCompanySettingsSchema.parse(req.body);
        const updated = await settingsRepository.updateCompanySettings(validated);
        res.status(200).json({
            success: true,
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
};
export const getGeofenceSettings = async (_req, res, next) => {
    try {
        const geofence = await settingsRepository.getGeofenceSettings();
        res.status(200).json({
            success: true,
            data: geofence,
        });
    }
    catch (err) {
        next(err);
    }
};
export const updateGeofenceSettings = async (req, res, next) => {
    try {
        const validated = updateGeofenceSettingsSchema.parse(req.body);
        const updated = await settingsRepository.updateGeofenceSettings(validated);
        res.status(200).json({
            success: true,
            data: updated,
        });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=settingsController.js.map