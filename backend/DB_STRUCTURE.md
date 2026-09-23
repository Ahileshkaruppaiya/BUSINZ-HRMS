# ApexHRMS — Complete Database Structure

Source: `schema.sql` (runs on PostgreSQL 15+ / Supabase)

> All primary keys and foreign keys are `UUID` (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
> `employees.auth_id` links to `auth.users(id)`.
> All money / numeric values are `DOUBLE PRECISION` so Supabase/PostgREST returns native JSON numbers.
> Columns marked `TS` are `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

---

## 1. `roles`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| key | TEXT | UNIQUE, NOT NULL |
| created_at | TS | |

Seeded: `Super Admin`, `HR Admin`, `Dept Manager`, `Employee`, `Finance Manager`.

---

## 2. `permissions` (normalized RBAC)
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| role_id | UUID | FK → roles(id), NOT NULL, ON DELETE CASCADE |
| module | TEXT | NOT NULL |
| action | TEXT | NOT NULL |
| created_at | TS | |
| | | UNIQUE (role_id, module, action) |

---

## 3. `departments`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| name | TEXT | NOT NULL |
| code | TEXT | UNIQUE, NOT NULL |
| head_id | UUID | FK → employees(id), ON DELETE SET NULL (circular, added via ALTER) |
| budget | DOUBLE PRECISION | NOT NULL, default 0 |
| created_at / updated_at | TS | |

---

## 4. `employees`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| auth_id | UUID | FK → auth.users(id), UNIQUE, nullable, ON DELETE SET NULL |
| employee_id | TEXT | UNIQUE, NOT NULL |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | NOT NULL |
| email | TEXT | UNIQUE, NOT NULL |
| phone | TEXT | nullable |
| dob | DATE | nullable |
| gender | enum hr_gender | Male / Female / Other |
| address | TEXT | nullable |
| department_id | UUID | FK → departments(id), ON DELETE SET NULL |
| designation | TEXT | nullable |
| reporting_manager_id | UUID | FK → employees(id), ON DELETE SET NULL |
| reporting_manager_name | TEXT | nullable (denormalized for frontend) |
| joining_date | DATE | nullable |
| employment_type | enum hr_employment_type | NOT NULL, default 'Full-Time' |
| status | enum hr_employee_status | NOT NULL, default 'Active' |
| avatar_url | TEXT | nullable |
| basic_salary | DOUBLE PRECISION | NOT NULL, default 0 |
| allowances_hra | DOUBLE PRECISION | NOT NULL, default 0 |
| allowances_transport | DOUBLE PRECISION | NOT NULL, default 0 |
| allowances_medical | DOUBLE PRECISION | NOT NULL, default 0 |
| allowances_special | DOUBLE PRECISION | NOT NULL, default 0 |
| bank_name | TEXT | nullable |
| account_number | TEXT | nullable |
| ifsc_code | TEXT | nullable |
| branch | TEXT | nullable |
| attendance_method | TEXT | NOT NULL, default 'Face Scan' |
| gps_allowed | BOOLEAN | NOT NULL, default TRUE |
| face_registered | BOOLEAN | NOT NULL, default FALSE |
| face_photo_url | TEXT | nullable |
| role_id | UUID | FK → roles(id), NOT NULL, ON DELETE RESTRICT |
| created_at / updated_at | TS | |

---

## 5. `designations`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| department_id | UUID | FK → departments(id), NOT NULL, ON DELETE CASCADE |
| level | TEXT | nullable |
| created_at / updated_at | TS | |

---

## 6. `employee_documents`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| type | TEXT | nullable |
| url | TEXT | NOT NULL (Storage path) |
| upload_date | DATE | NOT NULL, default CURRENT_DATE |
| created_at | TS | |

---

## 7. `attendance_records`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE CASCADE |
| date | DATE | NOT NULL |
| check_in | TIMESTAMPTZ | nullable |
| check_out | TIMESTAMPTZ | nullable |
| working_hours | DOUBLE PRECISION | NOT NULL, default 0 (computed by trigger) |
| status | enum hr_attendance_status | NOT NULL, default 'Present' |
| late_status | TEXT | NOT NULL, default 'On Time' |
| location_lat | DOUBLE PRECISION | nullable |
| location_lng | DOUBLE PRECISION | nullable |
| location_address | TEXT | nullable |
| in_geofence | BOOLEAN | NOT NULL, default TRUE |
| face_verified | BOOLEAN | NOT NULL, default FALSE |
| method | TEXT | NOT NULL, default 'Face' |
| created_at / updated_at | TS | |
| | | UNIQUE (employee_id, date) |

---

## 8. `face_logs`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE CASCADE |
| timestamp | TIMESTAMPTZ | NOT NULL, default NOW() |
| type | TEXT | NOT NULL (Check-In / Check-Out) |
| status | TEXT | NOT NULL (Success / No Match / Spoof Detected) |
| photo_url | TEXT | nullable (Storage path) |
| confidence_score | DOUBLE PRECISION | nullable |
| created_at | TS | |

---

## 9. `leave_requests`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE RESTRICT |
| leave_type | enum hr_leave_type | NOT NULL |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |
| days_count | INT | NOT NULL, CHECK (> 0) |
| reason | TEXT | nullable |
| status | enum hr_request_status | NOT NULL, default 'Pending' |
| applied_date | DATE | NOT NULL, default CURRENT_DATE |
| approved_by | UUID | FK → employees(id), nullable, ON DELETE SET NULL |
| comment | TEXT | nullable |
| created_at / updated_at | TS | |
| | | CHECK (end_date >= start_date) |

---

## 10. `shifts`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| shift_name | TEXT | NOT NULL |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| break_duration_mins | INT | NOT NULL, default 0 |
| working_hours | DOUBLE PRECISION | NOT NULL, default 8 |
| grace_period_mins | INT | NOT NULL, default 15 |
| color | TEXT | NOT NULL, default '#3B82F6' |
| created_at / updated_at | TS | |

---

## 11. `shift_assignments` (join)
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| shift_id | UUID | FK → shifts(id), NOT NULL, ON DELETE CASCADE |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE CASCADE |
| | | UNIQUE (shift_id, employee_id) |

---

## 12. `shift_requests`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE CASCADE |
| current_shift_id | UUID | FK → shifts(id), NOT NULL, ON DELETE RESTRICT |
| requested_shift_id | UUID | FK → shifts(id), NOT NULL, ON DELETE RESTRICT |
| requested_date | DATE | NOT NULL |
| reason | TEXT | nullable |
| status | enum hr_request_status | NOT NULL, default 'Pending' |
| approved_by | UUID | FK → employees(id), nullable, ON DELETE SET NULL |
| created_at / updated_at | TS | |

---

## 13. `tasks`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| description | TEXT | nullable |
| assigned_employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE RESTRICT |
| assigned_by | UUID | FK → employees(id), nullable, ON DELETE SET NULL |
| department_id | UUID | FK → departments(id), nullable, ON DELETE SET NULL |
| priority | enum hr_task_priority | NOT NULL, default 'Medium' |
| due_date | DATE | nullable |
| status | enum hr_task_status | NOT NULL, default 'To Do' |
| created_at / updated_at | TS | |

---

## 14. `performance_scores`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE RESTRICT |
| overall_score | DOUBLE PRECISION | NOT NULL, default 0 |
| task_completion_rate | DOUBLE PRECISION | NOT NULL, default 0 |
| attendance_score | DOUBLE PRECISION | NOT NULL, default 0 |
| goal_achievement | DOUBLE PRECISION | NOT NULL, default 0 |
| manager_rating | DOUBLE PRECISION | NOT NULL, default 0 |
| avatar_url | TEXT | nullable |
| period | TEXT | NOT NULL (e.g. "2026-08") |
| created_at / updated_at | TS | |
| | | UNIQUE (employee_id, period) |

---

## 15. `performance_history` (monthly chart data)
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| performance_id | UUID | FK → performance_scores(id), NOT NULL, ON DELETE CASCADE |
| month | TEXT | NOT NULL (e.g. "Aug") |
| score | DOUBLE PRECISION | NOT NULL |
| created_at | TS | |
| | | UNIQUE (performance_id, month) |

---

## 16. `job_openings`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| department_id | UUID | FK → departments(id), NOT NULL, ON DELETE RESTRICT |
| location | TEXT | nullable |
| type | TEXT | NOT NULL, default 'Full-Time' |
| experience | TEXT | nullable |
| positions | INT | NOT NULL, default 1, CHECK (> 0) |
| status | TEXT | NOT NULL, default 'Active' |
| posted_date | DATE | NOT NULL, default CURRENT_DATE |
| salary_range | TEXT | nullable (e.g. "$120k - $150k") |
| description | TEXT | nullable |
| created_at / updated_at | TS | |

---

## 17. `candidates`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| job_id | UUID | FK → job_openings(id), NOT NULL, ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| phone | TEXT | nullable |
| stage | TEXT | NOT NULL, default 'Applied' |
| applied_date | DATE | NOT NULL, default CURRENT_DATE |
| referrer_employee_id | UUID | FK → employees(id), nullable, ON DELETE SET NULL |
| referrer_name | TEXT | nullable |
| resume_url | TEXT | nullable (Storage path) |
| rating | DOUBLE PRECISION | NOT NULL, default 0 |
| notes | TEXT | nullable |
| created_at / updated_at | TS | |

---

## 18. `expenses`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE RESTRICT |
| category | TEXT | NOT NULL |
| amount | DOUBLE PRECISION | NOT NULL, CHECK (>= 0) |
| date | DATE | NOT NULL |
| description | TEXT | nullable |
| receipt_url | TEXT | nullable (Storage path) |
| status | enum hr_expense_status | NOT NULL, default 'Pending Manager' |
| approved_by | UUID | FK → employees(id), nullable, ON DELETE SET NULL |
| created_at / updated_at | TS | |

---

## 19. `notifications` (broadcast)
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| message | TEXT | NOT NULL |
| timestamp | TIMESTAMPTZ | NOT NULL, default NOW() |
| priority | TEXT | NOT NULL, default 'Normal' |
| category | TEXT | NOT NULL, default 'Announcement' |
| link | TEXT | nullable |
| created_at | TS | |

---

## 20. `notification_recipients` (join)
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| notification_id | UUID | FK → notifications(id), NOT NULL, ON DELETE CASCADE |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE CASCADE |
| is_read | BOOLEAN | NOT NULL, default FALSE |
| read_at | TIMESTAMPTZ | nullable |
| | | UNIQUE (notification_id, employee_id) |

---

## 21. `payroll_records`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| employee_id | UUID | FK → employees(id), NOT NULL, ON DELETE RESTRICT |
| payroll_month | DATE | NOT NULL (1st of month, e.g. 2026-08-01) |
| basic_salary | DOUBLE PRECISION | NOT NULL, default 0 |
| allowances | DOUBLE PRECISION | NOT NULL, default 0 |
| bonus | DOUBLE PRECISION | NOT NULL, default 0 |
| tax_deduction | DOUBLE PRECISION | NOT NULL, default 0 |
| leave_deduction | DOUBLE PRECISION | NOT NULL, default 0 |
| working_days | INT | NOT NULL, default 0 |
| present_days | INT | NOT NULL, default 0 |
| paid_leaves | INT | NOT NULL, default 0 |
| unpaid_leaves | INT | NOT NULL, default 0 |
| net_salary | DOUBLE PRECISION | NOT NULL, default 0 |
| status | enum hr_payroll_status | NOT NULL, default 'Pending' |
| created_at / updated_at | TS | |
| | | UNIQUE (employee_id, payroll_month) |

---

## 22. `assets`
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| asset_tag | TEXT | UNIQUE, NOT NULL |
| name | TEXT | NOT NULL |
| category | TEXT | NOT NULL |
| serial_number | TEXT | UNIQUE, nullable |
| assigned_employee_id | UUID | FK → employees(id), nullable, ON DELETE SET NULL |
| assigned_department_id | UUID | FK → departments(id), nullable, ON DELETE SET NULL |
| assigned_date | DATE | nullable |
| purchase_date | DATE | nullable |
| purchase_cost | DOUBLE PRECISION | NOT NULL, default 0 |
| warranty_expiry | DATE | nullable |
| status | enum hr_asset_status | NOT NULL, default 'Available' |
| condition | enum hr_asset_condition | NOT NULL, default 'Good' |
| notes | TEXT | nullable |
| created_at / updated_at | TS | |

---

## 23. `geofence_config` (singleton)
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| enabled | BOOLEAN | NOT NULL, default TRUE |
| office_name | TEXT | NOT NULL |
| center_lat | DOUBLE PRECISION | NOT NULL |
| center_lng | DOUBLE PRECISION | NOT NULL |
| radius_meters | INT | NOT NULL, CHECK (> 0) |
| enforce_strictly | BOOLEAN | NOT NULL, default TRUE |
| created_at / updated_at | TS | |

---

## 24. `workflow_config` (singleton)
| column | type | constraints |
|---|---|---|
| id | UUID | PK |
| format | enum hr_workflow_format | NOT NULL, default 'MANAGER_HR_DUAL' |
| format_name | TEXT | NOT NULL |
| allow_employee_direct_edit | BOOLEAN | NOT NULL, default FALSE |
| require_hr_acceptance | BOOLEAN | NOT NULL, default TRUE |
| created_at / updated_at | TS | |

---

## PostgreSQL Enum Types
| type | values |
|---|---|
| hr_gender | Male, Female, Other |
| hr_employment_type | Full-Time, Part-Time, Contract, Intern |
| hr_employee_status | Active, On Leave, Terminated |
| hr_attendance_status | Present, Absent, Late, Half Day, Work From Home, On Leave |
| hr_leave_type | Casual Leave, Sick Leave, Paid Leave, Unpaid Leave, Work From Home |
| hr_request_status | Pending, Approved, Rejected |
| hr_task_status | To Do, In Progress, Completed, Overdue |
| hr_task_priority | Low, Medium, High, Urgent |
| hr_expense_status | Pending Manager, Pending Finance, Approved, Rejected, Reimbursed |
| hr_payroll_status | Pending, Verified, Processed, Paid |
| hr_asset_status | Assigned, Available, Under Maintenance, Retired |
| hr_asset_condition | New, Good, Fair, Needs Repair |
| hr_workflow_format | HR_ONLY, MANAGER_HR_DUAL, AUTO_APPROVE_LOW |

## Storage Buckets
| bucket | public |
|---|---|
| employee-documents | private |
| face-photos | private |
| resumes | private |
| receipts | private |
| avatars | public |

## Summary
- 24 tables, 13 enums, 5 storage buckets
- All PK/FK = UUID; money/numeric = DOUBLE PRECISION
- RLS enabled on all 24 tables
- Triggers: auto `updated_at`; `working_hours` computed from check-in/check-out
- Seed: 5 roles + full RBAC permission matrix + geofence & workflow config

## Relations Overview
- employees.department_id → departments.id · employees.reporting_manager_id → employees.id · employees.role_id → roles.id · employees.auth_id → auth.users.id
- departments.head_id → employees.id (circular)
- attendance_records / face_logs / leave_requests / tasks / performance_scores / expenses / payroll_records .employee_id → employees.id
- shift_assignments: shift_id → shifts.id, employee_id → employees.id
- shift_requests: current_shift_id / requested_shift_id → shifts.id
- performance_history.performance_id → performance_scores.id
- candidates.job_id → job_openings.id, referrer_employee_id → employees.id
- notification_recipients: notification_id → notifications.id, employee_id → employees.id