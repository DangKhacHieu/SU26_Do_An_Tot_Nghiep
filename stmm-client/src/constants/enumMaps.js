/**
 * enumMaps.js — Enum display maps cho toàn bộ FE
 *
 * NGUYÊN TẮC:
 * - `cls` luôn là raw CSS class token, KHÔNG qua t()
 * - `labelKey` là i18n key để render label
 * - Dùng getEnumLabel() để lấy label đã dịch tại render, không lưu vào state
 * - filter/payload/so sánh LUÔN dùng raw enum value (key của map)
 */

// ─── Issue Status ────────────────────────────────────────────────────────────
export const ISSUE_STATUS_MAP = {
  Reported:   { labelKey: 'enums.issue.Reported',   cls: 'reported'   },
  InProgress: { labelKey: 'enums.issue.InProgress', cls: 'inprogress' },
  Resolved:   { labelKey: 'enums.issue.Resolved',   cls: 'resolved'   },
  Closed:     { labelKey: 'enums.issue.Closed',     cls: 'closed'     },
};

// ─── Violation Status ─────────────────────────────────────────────────────────
export const VIOLATION_STATUS_MAP = {
  Pending:   { labelKey: 'enums.violation.Pending',   cls: 'pending'   },
  Notified:  { labelKey: 'enums.violation.Notified',  cls: 'notified'  },
  Appealed:  { labelKey: 'enums.violation.Appealed',  cls: 'appealed'  },
  Finalized: { labelKey: 'enums.violation.Finalized', cls: 'finalized' },
  Approved:  { labelKey: 'enums.violation.Approved',  cls: 'approved'  },
  Rejected:  { labelKey: 'enums.violation.Rejected',  cls: 'rejected'  },
};

// ─── Meter Type ───────────────────────────────────────────────────────────────
export const METER_TYPE_MAP = {
  Electricity: { labelKey: 'enums.meter.Electricity', icon: '⚡' },
  Water:       { labelKey: 'enums.meter.Water',       icon: '💧' },
};

// ─── Task Status CSS tones (static — KHÔNG dịch, dùng làm CSS modifier) ──────
export const TASK_STATUS_TONE = {
  Pending:         'warning',
  PendingApproval: 'approval',
  In_Progress:     'progress',
  Completed:       'success',
  Cancelled:       'cancelled',
};

// ─── Task Type CSS class tokens (static — KHÔNG dịch) ────────────────────────
export const TASK_TYPE_CLASS = {
  Repair:         'type-repair',
  UtilityReading: 'type-utility',
};

// ─── Task Status CSS class tokens (static — KHÔNG dịch) ──────────────────────
export const TASK_STATUS_CLASS = {
  Pending:         'status-pending',
  PendingApproval: 'status-approval',
  In_Progress:     'status-progress',
  Completed:       'status-completed',
  Cancelled:       'status-cancelled',
};

/**
 * Helper: Trả về label đã dịch từ map. Nếu không có → fallback raw value.
 *
 * @param {string} rawValue   - Giá trị enum từ API/state (ví dụ: 'Pending')
 * @param {object} labelMap   - Map có dạng { [rawValue]: { labelKey, cls } }
 * @param {Function} t        - Hàm dịch từ useTranslation()
 * @returns {string}          - Chuỗi đã dịch hoặc rawValue nếu không có mapping
 */
export function getEnumLabel(rawValue, labelMap, t) {
  const entry = labelMap[rawValue];
  if (!entry) return rawValue ?? '';
  return t(entry.labelKey, { defaultValue: rawValue });
}

/**
 * Helper: Trả về CSS class từ map. Nếu không có → fallback class mặc định.
 *
 * @param {string} rawValue     - Giá trị enum từ API/state
 * @param {object} labelMap     - Map có dạng { [rawValue]: { labelKey, cls } }
 * @param {string} [fallback]   - CSS class fallback (mặc định: 'status-pending')
 * @returns {string}            - CSS class string
 */
export function getEnumCls(rawValue, labelMap, fallback = 'pending') {
  const entry = labelMap[rawValue];
  return entry ? entry.cls : fallback;
}
