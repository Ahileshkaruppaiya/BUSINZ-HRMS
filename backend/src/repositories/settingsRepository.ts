import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { PayrollSettingsModel } from '../types/payroll.js';
import { memoryCache } from '../services/cacheService.js';

const SETTINGS_CACHE_KEY = 'payroll_settings_global';
const SETTINGS_TTL_MS = 60000; // 60 seconds

export class SettingsRepository {
  async getSettings(): Promise<PayrollSettingsModel> {
    const cached = memoryCache.get<PayrollSettingsModel>(SETTINGS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('payroll_settings')
          .select('*')
          .eq('org_key', 'global')
          .maybeSingle();

        if (data && !error) {
          const parsed: PayrollSettingsModel = {
            id: data.id,
            orgKey: data.org_key,
            pfEnabled: data.pf_enabled ?? false,
            pfRate: Number(data.pf_rate) || 12.0,
            pfWageCeiling: Number(data.pf_wage_ceiling) || 15000.0,
            pfWageComponents: data.pf_wage_components || {
              basic: true,
              da: true,
              conveyance: true,
              hra: false,
              attendance_bonus: false,
              overtime: false,
              other_earnings: false,
            },
            esicEnabled: data.esic_enabled ?? false,
            esicRate: Number(data.esic_rate) || 0.75,
            esicSalaryThreshold: Number(data.esic_salary_threshold) || 21000.0,
            esicWageComponents: data.esic_wage_components || {
              basic: true,
              da: true,
              conveyance: true,
              hra: true,
              attendance_bonus: true,
              overtime: true,
              other_earnings: true,
            },
            professionalTaxEnabled: data.professional_tax_enabled ?? false,
            professionalTaxAmount: Number(data.professional_tax_amount) || 0,
            lopEnabled: data.lop_enabled ?? true,
            attendanceBonusEnabled: data.attendance_bonus_enabled ?? false,
            overtimeEnabled: data.overtime_enabled ?? false,
            standardWorkingDays: Number(data.standard_working_days) || 26,
            payrollCycleDay: Number(data.payroll_cycle_day) || 1,
          };

          memoryCache.set(SETTINGS_CACHE_KEY, parsed, SETTINGS_TTL_MS);
          return parsed;
        }
      } catch (err) {
        console.warn('Database error in getSettings:', err);
      }
    }

    const emptyDefault: PayrollSettingsModel = {
      id: 'global',
      orgKey: 'global',
      pfEnabled: false,
      pfRate: 12.0,
      pfWageCeiling: 15000.0,
      pfWageComponents: {
        basic: true,
        da: true,
        conveyance: true,
        hra: false,
        attendance_bonus: false,
        overtime: false,
        other_earnings: false,
      },
      esicEnabled: false,
      esicRate: 0.75,
      esicSalaryThreshold: 21000.0,
      esicWageComponents: {
        basic: true,
        da: true,
        conveyance: true,
        hra: true,
        attendance_bonus: true,
        overtime: true,
        other_earnings: true,
      },
      professionalTaxEnabled: false,
      professionalTaxAmount: 0,
      lopEnabled: true,
      attendanceBonusEnabled: false,
      overtimeEnabled: false,
      standardWorkingDays: 26,
      payrollCycleDay: 1,
    };
    return emptyDefault;
  }

  async updateSettings(updates: Partial<PayrollSettingsModel>): Promise<PayrollSettingsModel> {
    memoryCache.invalidate(SETTINGS_CACHE_KEY);

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const payload: Record<string, unknown> = {};

        if (updates.pfEnabled !== undefined) payload.pf_enabled = updates.pfEnabled;
        if (updates.pfRate !== undefined) payload.pf_rate = updates.pfRate;
        if (updates.pfWageCeiling !== undefined) payload.pf_wage_ceiling = updates.pfWageCeiling;
        if (updates.pfWageComponents !== undefined) payload.pf_wage_components = updates.pfWageComponents;
        if (updates.esicEnabled !== undefined) payload.esic_enabled = updates.esicEnabled;
        if (updates.esicRate !== undefined) payload.esic_rate = updates.esicRate;
        if (updates.esicSalaryThreshold !== undefined) payload.esic_salary_threshold = updates.esicSalaryThreshold;
        if (updates.esicWageComponents !== undefined) payload.esic_wage_components = updates.esicWageComponents;
        if (updates.professionalTaxEnabled !== undefined) payload.professional_tax_enabled = updates.professionalTaxEnabled;
        if (updates.professionalTaxAmount !== undefined) payload.professional_tax_amount = updates.professionalTaxAmount;
        if (updates.lopEnabled !== undefined) payload.lop_enabled = updates.lopEnabled;
        if (updates.attendanceBonusEnabled !== undefined) payload.attendance_bonus_enabled = updates.attendanceBonusEnabled;
        if (updates.overtimeEnabled !== undefined) payload.overtime_enabled = updates.overtimeEnabled;
        if (updates.standardWorkingDays !== undefined) payload.standard_working_days = updates.standardWorkingDays;
        if (updates.payrollCycleDay !== undefined) payload.payroll_cycle_day = updates.payrollCycleDay;

        await supabase
          .from('payroll_settings')
          .update(payload)
          .eq('org_key', 'global');
      } catch (err) {
        console.warn('Could not write settings to Supabase:', err);
      }
    }

    return this.getSettings();
  }

  async getCompanySettings(): Promise<any> {
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from('company_settings')
          .select('setting_val')
          .eq('setting_key', 'company_info')
          .maybeSingle();

        if (data?.setting_val && typeof data.setting_val === 'object') {
          return data.setting_val;
        }
      } catch (err) {
        console.warn('Database error in getCompanySettings:', err);
      }
    }

    return {
      companyName: '',
      legalEntity: '',
      taxIdGst: '',
      pfRegistrationNumber: '',
      esiRegistrationNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
    };
  }

  async updateCompanySettings(updates: any): Promise<any> {
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const current = await this.getCompanySettings();
        const merged = { ...current, ...updates };

        const { data: existing } = await supabase
          .from('company_settings')
          .select('id')
          .eq('setting_key', 'company_info')
          .maybeSingle();

        if (existing?.id) {
          await supabase
            .from('company_settings')
            .update({ setting_val: merged, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('company_settings')
            .insert({ setting_key: 'company_info', setting_val: merged });
        }

        return merged;
      } catch (err) {
        console.warn('Could not save company settings to Supabase:', err);
      }
    }

    return updates;
  }

  async getGeofenceSettings(): Promise<any> {
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();

        // 1. Try company_settings geofence_config
        const { data: csData } = await supabase
          .from('company_settings')
          .select('setting_val')
          .eq('setting_key', 'geofence_config')
          .maybeSingle();

        if (csData?.setting_val) {
          const v = csData.setting_val;
          return {
            officeName: v.officeName || '',
            address: v.officeName || '',
            latitude: v.centerLat || 0,
            longitude: v.centerLng || 0,
            radiusMeters: v.radiusMeters || 200,
            isEnabled: v.enabled ?? true,
            strictMode: v.enforceStrictly ?? false,
          };
        }

        // 2. Try geofence_config table
        const { data: gfData } = await supabase
          .from('geofence_config')
          .select('*')
          .maybeSingle();

        if (gfData) {
          return {
            officeName: gfData.office_name || '',
            address: gfData.office_name || '',
            latitude: gfData.center_lat || 0,
            longitude: gfData.center_lng || 0,
            radiusMeters: gfData.radius_meters || 200,
            isEnabled: gfData.enabled ?? true,
            strictMode: gfData.enforce_strictly ?? false,
          };
        }
      } catch (err) {
        console.warn('Database error in getGeofenceSettings:', err);
      }
    }

    return {
      officeName: '',
      address: '',
      latitude: 0,
      longitude: 0,
      radiusMeters: 200,
      isEnabled: false,
      strictMode: false,
    };
  }

  async updateGeofenceSettings(updates: any): Promise<any> {
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const current = await this.getGeofenceSettings();
        const merged = { ...current, ...updates };

        const settingVal = {
          enabled: merged.isEnabled,
          centerLat: merged.latitude,
          centerLng: merged.longitude,
          officeName: merged.officeName,
          radiusMeters: merged.radiusMeters,
          enforceStrictly: merged.strictMode,
        };

        const { data: existing } = await supabase
          .from('company_settings')
          .select('id')
          .eq('setting_key', 'geofence_config')
          .maybeSingle();

        if (existing?.id) {
          await supabase
            .from('company_settings')
            .update({ setting_val: settingVal, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('company_settings')
            .insert({ setting_key: 'geofence_config', setting_val: settingVal });
        }

        return merged;
      } catch (err) {
        console.warn('Could not save geofence settings to Supabase:', err);
      }
    }

    return updates;
  }
}

export const settingsRepository = new SettingsRepository();
