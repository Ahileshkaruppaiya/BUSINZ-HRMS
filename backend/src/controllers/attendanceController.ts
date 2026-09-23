import { Request, Response, NextFunction } from 'express';
import { attendanceRepository } from '../repositories/attendanceRepository.js';
import { punchSchema, verifyFaceSchema } from '../validators/attendanceValidators.js';

export const getAttendanceLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, employeeId, status } = req.query;
    const logs = await attendanceRepository.getAttendanceLogs({
      date: date as string,
      employeeId: employeeId as string,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

export const recordPunch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = punchSchema.parse(req.body);
    const targetEmpId = validated.employeeId || req.user?.employeeId;

    if (!targetEmpId) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'employeeId is required to record attendance',
          details: [],
        },
      });
      return;
    }

    const punch = await attendanceRepository.recordPunch({
      ...validated,
      employeeId: targetEmpId,
    });

    res.status(201).json({
      success: true,
      data: punch,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyFace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = verifyFaceSchema.parse(req.body);
    const targetEmpId = validated.employeeId || req.user?.employeeId || 'EMP-001';

    const result = await attendanceRepository.verifyFace(targetEmpId, validated.facePhotoBase64);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getTodaySummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await attendanceRepository.getTodaySummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

export const getShiftStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employeeId = (req.query.employeeId as string) || req.user?.employeeId;
    if (!employeeId) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'employeeId is required to check shift status',
          details: [],
        },
      });
      return;
    }

    const status = await attendanceRepository.getShiftAttendanceStatus(employeeId);
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
};
