import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { PayrollSettingsModel } from '../types/payroll.js';
import { memoryCache } from '../services/cacheService.js';

const SETTINGS_CACHE_KEY = 'payroll_settings_global';
const SETTINGS_TTL_MS = 60000; // 60 seconds

// Fallback in-memory defaults matching project rules
let inMemorySettings: PayrollSettingsModel = {
  id: 'global-settings-id',
  orgKey: 'global',
  pfEnabled: true,
  pfRate: 12.0, // Default project rule: 12%
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
  esicEnabled: true,
  esicRate: 0.75, // Default project rule: 0.75%
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
  professionalTaxEnabled: true,
  professionalTaxAmount: 200.0,
  lopEnabled: true,
  attendanceBonusEnabled: true,
  overtimeEnabled: true,
  standardWorkingDays: 26,
  payrollCycleDay: 1,
};

export class SettingsRepository {
  async getSettings(): Promise<PayrollSettingsModel> {
    const cached = memoryCache.get<PayrollSettingsModel>(SETTINGS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    if (!isRealSupabaseConfigured()) {
      memoryCache.set(SETTINGS_CACHE_KEY, { ...inMemorySettings }, SETTINGS_TTL_MS);
      return { ...inMemorySettings };
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .eq('org_key', 'global')
        .single();

      if (error || !data) {
        memoryCache.set(SETTINGS_CACHE_KEY, { ...inMemorySettings }, SETTINGS_TTL_MS);
        return { ...inMemorySettings };
      }

      const parsed: PayrollSettingsModel = {
        id: data.id,
        orgKey: data.org_key,
        pfEnabled: data.pf_enabled,
        pfRate: Number(data.pf_rate),
        pfWageCeiling: Number(data.pf_wage_ceiling),
        pfWageComponents: data.pf_wage_components,
        esicEnabled: data.esic_enabled,
        esicRate: Number(data.esic_rate),
        esicSalaryThreshold: Number(data.esic_salary_threshold),
        esicWageComponents: data.esic_wage_components,
        professionalTaxEnabled: data.professional_tax_enabled,
        professionalTaxAmount: Number(data.professional_tax_amount),
        lopEnabled: data.lop_enabled,
        attendanceBonusEnabled: data.attendance_bonus_enabled,
        overtimeEnabled: data.overtime_enabled,
        standardWorkingDays: data.standard_working_days,
        payrollCycleDay: data.payroll_cycle_day,
      };

      memoryCache.set(SETTINGS_CACHE_KEY, parsed, SETTINGS_TTL_MS);
      return parsed;
    } catch {
      memoryCache.set(SETTINGS_CACHE_KEY, { ...inMemorySettings }, SETTINGS_TTL_MS);
      return { ...inMemorySettings };
    }
  }

  async updateSettings(updates: Partial<PayrollSettingsModel>): Promise<PayrollSettingsModel> {
    memoryCache.invalidate(SETTINGS_CACHE_KEY);

    inMemorySettings = {
      ...inMemorySettings,
      ...updates,
      pfWageComponents: updates.pfWageComponents
        ? { ...inMemorySettings.pfWageComponents, ...updates.pfWageComponents }
        : inMemorySettings.pfWageComponents,
      esicWageComponents: updates.esicWageComponents
        ? { ...inMemorySettings.esicWageComponents, ...updates.esicWageComponents }
        : inMemorySettings.esicWageComponents,
    };

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

        await supabase
          .from('payroll_settings')
          .update(payload)
          .eq('org_key', 'global');
      } catch (err) {
        console.warn('Could not write settings to Supabase, retained in-memory fallback:', err);
      }
    }

    return this.getSettings();
  }

  async getCompanySettings(): Promise<any> {
    return inMemoryCompanySettings;
  }

  async updateCompanySettings(updates: any): Promise<any> {
    inMemoryCompanySettings = { ...inMemoryCompanySettings, ...updates };
    return inMemoryCompanySettings;
  }

  async getGeofenceSettings(): Promise<any> {
    return inMemoryGeofenceSettings;
  }

  async updateGeofenceSettings(updates: any): Promise<any> {
    inMemoryGeofenceSettings = { ...inMemoryGeofenceSettings, ...updates };
    return inMemoryGeofenceSettings;
  }
}

let inMemoryCompanySettings = {
  companyName: 'Businz Technologies Private Limited',
  legalEntity: 'Businz Technologies Pvt. Ltd.',
  taxIdGst: '33AABCB1234F1Z5',
  pfRegistrationNumber: 'TN/MAS/0045892/000',
  esiRegistrationNumber: '51000789210001001',
  address: 'Businz Towers, Tech Corridor, OMR',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600096',
  contactEmail: 'contact@businz.com',
  contactPhone: '+91 44 2716 8900',
  website: 'https://businz.com',
};

let inMemoryGeofenceSettings = {
  officeName: 'Businz Corporate HQ & Tech Hub',
  address: 'Plot 42, SIDCO Industrial Estate, Sriperumbudur, Tamil Nadu 602105',
  latitude: 13.0827,
  longitude: 80.2707,
  radiusMeters: 200,
  isEnabled: true,
  strictMode: false,
};

export const settingsRepository = new SettingsRepository();

