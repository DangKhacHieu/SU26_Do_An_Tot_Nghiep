import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../../utils/authHeaders';
import {
  AlertCircle,
  Calendar,
  ClipboardPlus,
  Link2,
  MapPin,
  UserCheck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import './CreateTaskModal.css';

const TASK_TYPES = [
  {
    value: 'Repair',
    labelKey: 'createtaskmodal.repair',
    descriptionKey: 'createtaskmodal.repair_description',
    icon: Wrench,
  },
  {
    value: 'UtilityReading',
    labelKey: 'createtaskmodal.utility_reading',
    descriptionKey: 'createtaskmodal.utility_reading_description',
    icon: Zap,
  },
];

const LINK_SOURCES = [
  {
    value: 'none',
    labelKey: 'createtaskmodal.no_source',
    descriptionKey: 'createtaskmodal.no_source_description',
  },
  {
    value: 'request',
    labelKey: 'createtaskmodal.customer_request',
    descriptionKey: 'createtaskmodal.customer_request_description',
  },
  {
    value: 'issue',
    labelKey: 'createtaskmodal.infrastructure_issue',
    descriptionKey: 'createtaskmodal.infrastructure_issue_description',
  },
];

const formatCompactDate = (dateStr, locale) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function CreateTaskModal({
  baseUrl,
  onClose,
  onSuccess,
  addToast,
  preFilledIssueId = null,
  preFilledTitle = '',
  preFilledDescription = '',
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US';
  const [taskType, setTaskType] = useState('Repair');
  const [title, setTitle] = useState(preFilledTitle || '');
  const [description, setDescription] = useState(preFilledDescription || '');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [areaId, setAreaId] = useState('');

  const [linkSource, setLinkSource] = useState(preFilledIssueId ? 'issue' : 'request');
  const [requests, setRequests] = useState([]);
  const [requestId, setRequestId] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestLoadError, setRequestLoadError] = useState('');
  const [issues, setIssues] = useState([]);
  const [issueId, setIssueId] = useState('');
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issueLoadError, setIssueLoadError] = useState('');
  const requestsLoadedRef = useRef(false);
  const issuesLoadedRef = useRef(false);
  const addToastRef = useRef(addToast);

  const [staffs, setStaffs] = useState([]);
  const [areas, setAreas] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [utilityReadingTasks, setUtilityReadingTasks] = useState([]);
  const [allManagerTasks, setAllManagerTasks] = useState([]);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingStalls, setLoadingStalls] = useState(false);
  const [loadingUtilityTasks, setLoadingUtilityTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  useEffect(() => {
    requestsLoadedRef.current = false;
    issuesLoadedRef.current = false;
    setRequests([]);
    setIssues([]);
    setRequestLoadError('');
    setIssueLoadError('');
  }, [baseUrl]);

  useEffect(() => {
    const fetchStaffs = async () => {
      setLoadingStaffs(true);
      try {
        const res = await fetch(`${baseUrl}/api/manager/users?roleName=Staff`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setStaffs(data.filter(u => u.status === 'Active') || []);
        } else {
          addToastRef.current(t('createtaskmodal.cannot_load_staff'), 'error');
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
        addToastRef.current(t('createtaskmodal.cannot_load_staff'), 'error');
      } finally {
        setLoadingStaffs(false);
      }
    };

    const fetchAreas = async () => {
      setLoadingAreas(true);
      try {
        const res = await fetch(`${baseUrl}/api/Areas`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setAreas(data || []);
        } else {
          addToastRef.current(t('createtaskmodal.cannot_load_areas'), 'error');
        }
      } catch (err) {
        console.error('Error fetching areas:', err);
      } finally {
        setLoadingAreas(false);
      }
    };

    const fetchStalls = async () => {
      setLoadingStalls(true);
      try {
        const res = await fetch(`${baseUrl}/api/Stalls`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setStalls(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching stalls:', err);
      } finally {
        setLoadingStalls(false);
      }
    };

    const fetchUtilityReadingTasks = async () => {
      setLoadingUtilityTasks(true);
      try {
        const res = await fetch(`${baseUrl}/api/manager/tasks`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const tasks = Array.isArray(data) ? data : [];
          setAllManagerTasks(tasks);
          setUtilityReadingTasks(tasks.filter((task) => (task.taskType || task.TaskType) === 'UtilityReading'));
        } else {
          addToastRef.current(t('createtaskmodal.cannot_load_utility_assignments'), 'error');
        }
      } catch (err) {
        console.error('Error fetching utility reading tasks:', err);
      } finally {
        setLoadingUtilityTasks(false);
      }
    };

    fetchStaffs();
    fetchAreas();
    fetchStalls();
    fetchUtilityReadingTasks();
  }, [baseUrl, t]);

  const activeRequestIdsSet = useMemo(() => {
    const set = new Set();
    allManagerTasks.forEach((task) => {
      const reqId = task.requestId || task.RequestId;
      const status = task.status || task.Status;
      if (reqId && status !== 'Completed' && status !== 'Cancelled') {
        set.add(String(reqId));
      }
    });
    return set;
  }, [allManagerTasks]);

  const availableRequests = useMemo(() => {
    return requests.filter((item) => {
      const id = item.requestId || item.RequestId;
      const activeTaskId = item.activeTaskId || item.ActiveTaskId;
      if (activeTaskId) return false;
      return !activeRequestIdsSet.has(String(id));
    });
  }, [requests, activeRequestIdsSet]);

  const currentPeriodLabel = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}/${year}`;
  }, []);

  const areasWithStallsSet = useMemo(() => {
    const set = new Set();
    stalls.forEach((stall) => {
      const aId = stall.areaId || stall.AreaId;
      const status = (stall.status || stall.Status || '').toLowerCase();
      if (aId && status === 'rented') {
        set.add(String(aId));
      }
    });
    return set;
  }, [stalls]);

  const assignedUtilityAreas = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const map = new Map();

    utilityReadingTasks.forEach(task => {
      const status = task.status || task.Status;
      const createdAt = task.createdAt || task.CreatedAt;
      const completedAt = task.completedAt || task.CompletedAt;
      const taskAreaId = task.areaId || task.AreaId;

      if (!taskAreaId || status === 'Cancelled') return;

      const createdDate = createdAt ? new Date(createdAt) : null;
      const completedDate = completedAt ? new Date(completedAt) : null;

      const isCreatedInPeriod = createdDate && !Number.isNaN(createdDate.getTime()) &&
        createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      const isCompletedInPeriod = completedDate && !Number.isNaN(completedDate.getTime()) &&
        completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
      const isUncompleted = status !== 'Completed';

      if (isUncompleted || isCreatedInPeriod || isCompletedInPeriod) {
        const periodStr = createdDate && !Number.isNaN(createdDate.getTime())
          ? `${String(createdDate.getMonth() + 1).padStart(2, '0')}/${createdDate.getFullYear()}`
          : currentPeriodLabel;

        map.set(String(taskAreaId), {
          taskId: task.taskId || task.TaskId,
          assignedToName: task.assignedToName || task.AssignedToName || 'another staff member',
          status,
          period: periodStr,
        });
      }
    });

    return map;
  }, [utilityReadingTasks, currentPeriodLabel]);

  useEffect(() => {
    if (linkSource !== 'request' || requestsLoadedRef.current) return;

    let cancelled = false;
    requestsLoadedRef.current = true;

    const fetchRequests = async () => {
      setLoadingRequests(true);
      setRequestLoadError('');
      try {
        const res = await fetch(`${baseUrl}/api/manager/requests?status=Pending&requestType=FacilityIssue&pageSize=100`, { headers: getAuthHeaders() });
        if (!res.ok) {
          throw new Error(`Request list failed with status ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setRequests(data.items || data.Items || []);
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        if (!cancelled) {
          requestsLoadedRef.current = false;
          setRequests([]);
          setRequestId('');
          setRequestLoadError(t('createtaskmodal.cannot_load_requests'));
        }
      } finally {
        if (!cancelled) {
          setLoadingRequests(false);
        }
      }
    };

    fetchRequests();

    return () => {
      cancelled = true;
    };
  }, [linkSource, baseUrl, t]);

  useEffect(() => {
    if (linkSource !== 'issue' || issuesLoadedRef.current) return;

    let cancelled = false;
    issuesLoadedRef.current = true;

    const fetchIssues = async () => {
      setLoadingIssues(true);
      setIssueLoadError('');
      try {
        const res = await fetch(`${baseUrl}/api/manager/issues?pageNumber=1&pageSize=100&sortDescending=true`, { headers: getAuthHeaders() });
        if (!res.ok) {
          throw new Error(`Issue list failed with status ${res.status}`);
        }

        const data = await res.json();
        const availableIssues = (data.items || data.Items || []).filter(item => {
          const status = item.status || item.Status;
          const assignedTaskId = item.assignedTaskId || item.AssignedTaskId;
          return !assignedTaskId && status !== 'Resolved' && status !== 'Closed';
        });

        if (!cancelled) {
          setIssues(availableIssues);
        }
      } catch (err) {
        console.error('Error fetching issues:', err);
        if (!cancelled) {
          issuesLoadedRef.current = false;
          setIssues([]);
          setIssueId('');
          setIssueLoadError(t('createtaskmodal.cannot_load_issues'));
        }
      } finally {
        if (!cancelled) {
          setLoadingIssues(false);
        }
      }
    };

    fetchIssues();

    return () => {
      cancelled = true;
    };
  }, [linkSource, baseUrl, t]);

  const clearAutoFilledContent = () => {
    setTitle('');
    setDescription('');
  };

  const handleTaskTypeChange = (nextType) => {
    setTaskType(nextType);
    setAreaId('');
    setLinkSource(nextType === 'Repair' ? 'request' : 'none');
    setRequestId('');
    setIssueId('');
    setFormErrors({});
    clearAutoFilledContent();
  };

  const handleLinkSourceChange = (nextSource) => {
    setLinkSource(nextSource);
    setFormErrors({});
    clearAutoFilledContent();

    if (nextSource !== 'request') {
      setRequestId('');
      setRequestLoadError('');
    }

    if (nextSource !== 'issue') {
      setIssueId('');
      setIssueLoadError('');
    }
  };

  const handleRequestChange = (nextRequestId) => {
    setRequestId(nextRequestId);
    if (!nextRequestId) {
      clearAutoFilledContent();
      return;
    }

    const selectedRequest = availableRequests.find(item => String(item.requestId || item.RequestId) === nextRequestId);
    if (!selectedRequest) return;

    const selectedTitle = selectedRequest.title || selectedRequest.Title || '';
    const selectedDescription = selectedRequest.description || selectedRequest.Description || '';
    const selectedStallCode = selectedRequest.stallCode || selectedRequest.StallCode;
    const selectedStallId = selectedRequest.stallId || selectedRequest.StallId;

    setTitle(selectedTitle ? `Repair: ${selectedTitle}` : '');

    const stallLabel = selectedStallCode || (selectedStallId ? `ID: ${selectedStallId}` : 'N/A');
    setDescription(`Handle customer request at stall ${stallLabel}.\n\nRequest details:\n${selectedDescription || selectedTitle}`);
  };

  const handleIssueChange = (nextIssueId) => {
    setIssueId(nextIssueId);
    if (!nextIssueId) {
      clearAutoFilledContent();
      return;
    }

    const selectedIssue = issues.find(item => String(item.issueId || item.IssueId) === nextIssueId);
    if (!selectedIssue) return;

    const selectedTitle = selectedIssue.title || selectedIssue.Title || '';
    const selectedDescription = selectedIssue.description || selectedIssue.Description || '';
    const selectedStallCode = selectedIssue.stallCode || selectedIssue.StallCode;
    const selectedStallId = selectedIssue.stallId || selectedIssue.StallId;

    setTitle(selectedTitle ? `Repair: ${selectedTitle}` : '');

    const stallLabel = selectedStallCode || (selectedStallId ? `ID: ${selectedStallId}` : 'N/A');
    setDescription(`Handle infrastructure issue at stall ${stallLabel}.\n\nIssue details:\n${selectedDescription || selectedTitle}`);
  };

  const validate = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = t('createtaskmodal.title_required');
    } else if (title.trim().length < 5) {
      errors.title = t('createtaskmodal.title_too_short');
    }

    if (!assignedToUserId) {
      errors.assignedToUserId = t('createtaskmodal.staff_required');
    }

    if (taskType === 'UtilityReading') {
      if (!areaId) {
        errors.areaId = t('createtaskmodal.area_required', { defaultValue: 'Please select an area for meter reading.' });
      } else if (!areasWithStallsSet.has(String(areaId)) && !loadingStalls) {
        errors.areaId = t('createtaskmodal.no_active_stalls', { defaultValue: 'No active stalls' });
      } else if (assignedUtilityAreas.has(String(areaId))) {
        const assignment = assignedUtilityAreas.get(String(areaId));
        errors.areaId = t('createtaskmodal.area_already_assigned', { staffName: assignment.assignedToName });
      }
    }

    if (taskType === 'Repair' && linkSource === 'none') {
      errors.linkSource = t('createtaskmodal.source_required', 'Repair tasks must be linked to a Request or Issue.');
    }

    if (linkSource === 'request' && taskType === 'Repair' && !requestId) {
      errors.requestId = t('createtaskmodal.request_required');
    }

    if (linkSource === 'issue' && taskType === 'Repair' && !issueId && !preFilledIssueId) {
      errors.issueId = t('createtaskmodal.issue_required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      const modalBody = document.querySelector('.ctm-body');
      if (modalBody) modalBody.scrollTop = 0;
      return;
    }

    setSubmitting(true);

    const body = {
      assignedToUserId: parseInt(assignedToUserId),
      taskType,
      title: title.trim(),
      description: description.trim() || null,
      areaId: taskType === 'UtilityReading' ? parseInt(areaId) : null,
      requestId: (linkSource === 'request' && taskType === 'Repair' && requestId) ? parseInt(requestId) : null,
      issueId: taskType !== 'UtilityReading' && preFilledIssueId
        ? parseInt(preFilledIssueId)
        : (linkSource === 'issue' && taskType === 'Repair' && issueId)
          ? parseInt(issueId)
          : null,
    };

    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        addToast(t('createtaskmodal.created_successfully'), 'success');
        const data = await res.json();
        onSuccess(data);
      } else {
        const errText = await res.text();
        addToast(errText || t('createtaskmodal.create_failed'), 'error');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      addToast(t('createtaskmodal.network_error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ctm-overlay" onClick={onClose}>
      <div className="ctm-container" onClick={(e) => e.stopPropagation()}>
        <div className="ctm-header">
          <div className="ctm-title-wrap">
            <span className="ctm-title-icon">
              <ClipboardPlus size={18} />
            </span>
            <div>
              <h3>{t('createtaskmodal.title')}</h3>
              <p>{t('createtaskmodal.subtitle')}</p>
            </div>
          </div>
          <button id="btn-create-task-close" className="ctm-close" onClick={onClose} type="button" title={t('createtaskmodal.close')}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ctm-body">
            {Object.keys(formErrors).length > 0 && (
              <div className="ctm-alert ctm-alert-top" style={{ marginBottom: '16px', borderRadius: '10px' }}>
                <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#991b1b', fontSize: '13.5px', display: 'block', marginBottom: '4px' }}>
                    ⚠️ {t('createtaskmodal.review_fields', 'Please check and correct the invalid fields below.')}
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#b91c1c', fontSize: '12.5px', lineHeight: 1.5 }}>
                    {Object.values(formErrors).map((errMessage, index) => (
                      <li key={index}>{errMessage}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <section className="ctm-section">
              <div className="ctm-section-head">
                <div>
                  <h4>{t('createtaskmodal.task_information')}</h4>
                  <p>{t('createtaskmodal.task_information_help')}</p>
                </div>
              </div>

              <div className="ctm-field">
                <label className="ctm-label required-field">{t('createtaskmodal.task_type')}</label>
                <div className="ctm-type-grid" id="select-create-task-type" role="radiogroup" aria-label={t('createtaskmodal.task_type')}>
                  {TASK_TYPES.map((type) => {
                    const Icon = type.icon;
                    const selected = taskType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        className={`ctm-type-card ${selected ? 'active' : ''}`}
                        onClick={() => handleTaskTypeChange(type.value)}
                        disabled={submitting}
                        role="radio"
                        aria-checked={selected}
                      >
                        <span className="ctm-type-icon">
                          <Icon size={16} />
                        </span>
                        <span className="ctm-type-copy">
                          <strong>{t(type.labelKey)}</strong>
                          <small>{t(type.descriptionKey)}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ctm-field">
                <label className="ctm-label required-field">{t('createtaskmodal.task_label')}</label>
                <input
                  id="input-create-task-title"
                  type="text"
                  className={`ctm-input ${formErrors.title ? 'is-error' : ''}`}
                  placeholder={t('createtaskmodal.task_label_placeholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                />
                {formErrors.title && <span className="ctm-error">{formErrors.title}</span>}
              </div>

              <div className="ctm-field">
                <label className="ctm-label">{t('createtaskmodal.description')}</label>
                <textarea
                  id="textarea-create-task-desc"
                  className="ctm-textarea"
                  rows="4"
                  placeholder={t('createtaskmodal.description_placeholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </section>

            <section className="ctm-section">
              <div className="ctm-section-head">
                <div>
                  <h4>{t('createtaskmodal.assignment_links')}</h4>
                  <p>{t('createtaskmodal.assignment_links_help')}</p>
                </div>
              </div>

              <div className="ctm-field">
                <label className="ctm-label required-field">
                  <UserCheck size={14} /> {t('createtaskmodal.assign_to_staff')}
                </label>
                <select
                  id="select-create-task-staff"
                  className={`ctm-select ${formErrors.assignedToUserId ? 'is-error' : ''}`}
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  disabled={loadingStaffs || submitting}
                >
                  <option value="">{t('createtaskmodal.select_active_staff')}</option>
                  {staffs.map(s => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                {loadingStaffs && <span className="ctm-helper">{t('createtaskmodal.loading_staff')}</span>}
                {formErrors.assignedToUserId && <span className="ctm-error">{formErrors.assignedToUserId}</span>}
              </div>

              {taskType === 'UtilityReading' && (
                <div className="ctm-field">
                  <div className="ctm-utility-banner">
                    <Calendar size={18} className="ctm-utility-banner-icon" />
                    <div className="ctm-utility-banner-text">
                      <strong>
                        {t('createtaskmodal.utility_period_title', {
                          period: currentPeriodLabel,
                          defaultValue: `Reading Period: Month ${currentPeriodLabel}`
                        })}
                      </strong>
                      <p>
                        {t('createtaskmodal.utility_period_desc', {
                          defaultValue: 'Each area can only be assigned 1 meter reading task per calendar month.'
                        })}
                      </p>
                    </div>
                  </div>

                  <label className="ctm-label required-field">
                    <MapPin size={14} /> {t('createtaskmodal.market_area')}
                  </label>
                  <select
                    id="select-create-task-area"
                    className={`ctm-select ${formErrors.areaId ? 'is-error' : ''}`}
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    disabled={loadingAreas || loadingStalls || loadingUtilityTasks || submitting}
                  >
                    <option value="">{t('createtaskmodal.select_area')}</option>
                    {areas.map(a => {
                      const id = a.areaId || a.AreaId;
                      const name = a.name || a.Name;
                      const desc = a.description || a.Description || 'No description';
                      const assignment = assignedUtilityAreas.get(String(id));
                      const hasStalls = areasWithStallsSet.has(String(id));

                      let label = '';
                      let isDisabled = false;

                      if (!hasStalls && !loadingStalls) {
                        isDisabled = true;
                        label = `🔒 ${name} (${desc}) - ${t('createtaskmodal.no_active_stalls', { defaultValue: 'No active stalls' })}`;
                      } else if (assignment) {
                        isDisabled = true;
                        const periodLabel = assignment.period || currentPeriodLabel;
                        label = `🔒 ${name} (${desc}) - ${assignment.status === 'Completed'
                            ? t('createtaskmodal.already_completed', { period: periodLabel, defaultValue: `Completed meter reading for month ${periodLabel}` })
                            : t('createtaskmodal.already_assigned_to', { staffName: assignment.assignedToName, period: periodLabel, defaultValue: `Assigned task for month ${periodLabel} (${assignment.assignedToName})` })}`;
                      } else {
                        label = `🟢 ${name} (${desc}) - ${t('createtaskmodal.ready_to_assign', { defaultValue: 'Ready to assign task' })}`;
                      }

                      return (
                        <option key={id} value={id} disabled={isDisabled}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  {loadingAreas && <span className="ctm-helper">{t('createtaskmodal.loading_areas')}</span>}
                  {loadingUtilityTasks && <span className="ctm-helper">{t('createtaskmodal.checking_assignments')}</span>}
                  {!loadingAreas && !loadingUtilityTasks && areas.length > 0 && assignedUtilityAreas.size >= areas.length && (
                    <span className="ctm-helper ctm-helper-warning">
                      ⚠️ {t('createtaskmodal.all_areas_assigned', { defaultValue: 'All areas have been assigned meter reading tasks for this month.' })}
                    </span>
                  )}
                  {formErrors.areaId && <span className="ctm-error">{formErrors.areaId}</span>}
                </div>
              )}

              {preFilledIssueId && taskType === 'Repair' ? (
                <div className="ctm-linked-panel">
                  <div className="ctm-linked-icon">
                    <Link2 size={15} />
                  </div>
                  <div>
                    <span className="ctm-kicker">{t('createtaskmodal.linked_issue')}</span>
                    <strong>Issue #{preFilledIssueId}</strong>
                  </div>
                </div>
              ) : (
                taskType === 'Repair' && (
                  <div className="ctm-link-box">
                    <div className="ctm-source-segment" role="radiogroup" aria-label={t('createtaskmodal.task_source')}>
                      {LINK_SOURCES.filter(s => s.value !== 'none').map(source => {
                        const selected = linkSource === source.value;
                        return (
                          <button
                            key={source.value}
                            type="button"
                            className={`ctm-source-option ${selected ? 'active' : ''}`}
                            onClick={() => handleLinkSourceChange(source.value)}
                            disabled={submitting}
                            role="radio"
                            aria-checked={selected}
                          >
                            <span className="ctm-source-radio" />
                            <span>
                              <strong>{t(source.labelKey)}</strong>
                              <small>{t(source.descriptionKey)}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {linkSource === 'request' && (
                      <div className="ctm-source-panel">
                        <div className="ctm-source-panel-head">
                          <label className="ctm-label required-field">{t('createtaskmodal.select_request')}</label>
                          <span className="ctm-source-count">{t('createtaskmodal.records_shown', { count: availableRequests.length })}</span>
                        </div>
                        {loadingRequests && <span className="ctm-helper">{t('createtaskmodal.loading_requests')}</span>}
                        {requestLoadError && <span className="ctm-error">{requestLoadError}</span>}
                        {!loadingRequests && !requestLoadError && availableRequests.length === 0 && (
                          <span className="ctm-helper">{t('createtaskmodal.no_requests')}</span>
                        )}
                        {!loadingRequests && !requestLoadError && availableRequests.length > 0 && (
                          <div className="ctm-source-list" role="listbox" aria-label="Pending requests">
                            {availableRequests.map(item => {
                              const id = item.requestId || item.RequestId;
                              const itemTitle = item.title || item.Title || 'Untitled request';
                              const stallCode = item.stallCode || item.StallCode;
                              const stallId = item.stallId || item.StallId;
                              const status = item.status || item.Status || 'Pending';
                              const createdAt = item.createdAt || item.CreatedAt;
                              const selected = String(id) === requestId;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  className={`ctm-source-item ${selected ? 'selected' : ''}`}
                                  onClick={() => handleRequestChange(String(id))}
                                  disabled={submitting}
                                  role="option"
                                  aria-selected={selected}
                                >
                                  <span className="ctm-item-radio" />
                                  <span className="ctm-item-main">
                                    <strong>#REQ-{id}: {itemTitle}</strong>
                                    <small>{stallCode ? t('createtaskmodal.stall_code', { code: stallCode }) : stallId ? t('createtaskmodal.stall_id', { id: stallId }) : t('createtaskmodal.no_stall')} - {status} - {formatCompactDate(createdAt, locale)}</small>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {formErrors.requestId && <span className="ctm-error">{formErrors.requestId}</span>}
                      </div>
                    )}

                    {linkSource === 'issue' && (
                      <div className="ctm-source-panel">
                        <div className="ctm-source-panel-head">
                          <label className="ctm-label required-field">{t('createtaskmodal.select_issue')}</label>
                          <span className="ctm-source-count">{t('createtaskmodal.records_shown', { count: issues.length })}</span>
                        </div>
                        {loadingIssues && <span className="ctm-helper">{t('createtaskmodal.loading_issues')}</span>}
                        {issueLoadError && <span className="ctm-error">{issueLoadError}</span>}
                        {!loadingIssues && !issueLoadError && issues.length === 0 && (
                          <span className="ctm-helper">{t('createtaskmodal.no_issues')}</span>
                        )}
                        {!loadingIssues && !issueLoadError && issues.length > 0 && (
                          <div className="ctm-source-list" role="listbox" aria-label="Unassigned issues">
                            {issues.map(item => {
                              const id = item.issueId || item.IssueId;
                              const itemTitle = item.title || item.Title || 'Untitled issue';
                              const stallCode = item.stallCode || item.StallCode;
                              const stallId = item.stallId || item.StallId;
                              const status = item.status || item.Status || 'Reported';
                              const createdAt = item.createdAt || item.CreatedAt;
                              const selected = String(id) === issueId;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  className={`ctm-source-item ${selected ? 'selected' : ''}`}
                                  onClick={() => handleIssueChange(String(id))}
                                  disabled={submitting}
                                  role="option"
                                  aria-selected={selected}
                                >
                                  <span className="ctm-item-radio" />
                                  <span className="ctm-item-main">
                                    <strong>#ISSUE-{id}: {itemTitle}</strong>
                                    <small>{stallCode ? t('createtaskmodal.stall_code', { code: stallCode }) : stallId ? t('createtaskmodal.stall_id', { id: stallId }) : t('createtaskmodal.no_stall')} - {status} - {formatCompactDate(createdAt, locale)}</small>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {formErrors.issueId && <span className="ctm-error">{formErrors.issueId}</span>}
                      </div>
                    )}
                  </div>
                )
              )}

              {Object.keys(formErrors).length > 0 && (
                <div className="ctm-alert">
                  <AlertCircle size={15} />
                  <span>{t('createtaskmodal.review_fields')}</span>
                </div>
              )}
            </section>
          </div>

          <div className="ctm-footer">
            <button id="btn-create-task-cancel" type="button" className="ctm-btn ctm-btn-secondary" onClick={onClose} disabled={submitting}>
              {t('createtaskmodal.cancel')}
            </button>
            <button id="btn-create-task-submit" type="submit" className="ctm-btn ctm-btn-primary" disabled={submitting}>
              {submitting ? t('createtaskmodal.creating') : t('createtaskmodal.create_task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
