import { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
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
    label: 'Repair',
    description: 'Infrastructure or equipment repair',
    icon: Wrench,
  },
  {
    value: 'Maintenance',
    label: 'Maintenance',
    description: 'Routine inspection or upkeep',
    icon: ClipboardPlus,
  },
  {
    value: 'UtilityReading',
    label: 'Utility Reading',
    description: 'Meter reading by market area',
    icon: Zap,
  },
];

const LINK_SOURCES = [
  {
    value: 'none',
    label: 'No source',
    description: 'Create a standalone task',
  },
  {
    value: 'request',
    label: 'Customer Request',
    description: 'Work from a vendor/customer request',
  },
  {
    value: 'issue',
    label: 'Infrastructure Issue',
    description: 'Work from a reported facility issue',
  },
];

const formatCompactDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
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
  const [taskType, setTaskType] = useState('Repair');
  const [title, setTitle] = useState(preFilledTitle || '');
  const [description, setDescription] = useState(preFilledDescription || '');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [areaId, setAreaId] = useState('');

  const [linkSource, setLinkSource] = useState('none');
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
  const [utilityReadingTasks, setUtilityReadingTasks] = useState([]);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
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
        const res = await fetch(`${baseUrl}/api/manager/users?roleName=Staff`);
        if (res.ok) {
          const data = await res.json();
          setStaffs(data.filter(u => u.status === 'Active') || []);
        } else {
          addToastRef.current('Cannot load staff list.', 'error');
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
        addToastRef.current('Cannot load staff list.', 'error');
      } finally {
        setLoadingStaffs(false);
      }
    };

    const fetchAreas = async () => {
      setLoadingAreas(true);
      try {
        const res = await fetch(`${baseUrl}/api/Areas`);
        if (res.ok) {
          const data = await res.json();
          setAreas(data || []);
        } else {
          addToastRef.current('Cannot load market areas.', 'error');
        }
      } catch (err) {
        console.error('Error fetching areas:', err);
      } finally {
        setLoadingAreas(false);
      }
    };

    const fetchUtilityReadingTasks = async () => {
      setLoadingUtilityTasks(true);
      try {
        const res = await fetch(`${baseUrl}/api/manager/tasks`);
        if (res.ok) {
          const data = await res.json();
          const tasks = Array.isArray(data) ? data : [];
          setUtilityReadingTasks(tasks.filter((task) => (task.taskType || task.TaskType) === 'UtilityReading'));
        } else {
          addToastRef.current('Cannot load existing utility reading assignments.', 'error');
        }
      } catch (err) {
        console.error('Error fetching utility reading tasks:', err);
      } finally {
        setLoadingUtilityTasks(false);
      }
    };

    fetchStaffs();
    fetchAreas();
    fetchUtilityReadingTasks();
  }, [baseUrl]);

  const assignedUtilityAreas = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const map = new Map();

    utilityReadingTasks.forEach(task => {
      const status = task.status || task.Status;
      const createdAt = task.createdAt || task.CreatedAt;
      const taskAreaId = task.areaId || task.AreaId;

      if (!taskAreaId || !createdAt || status === 'Cancelled') return;

      const createdDate = new Date(createdAt);
      if (Number.isNaN(createdDate.getTime())) return;
      if (createdDate.getMonth() !== currentMonth || createdDate.getFullYear() !== currentYear) return;

      map.set(String(taskAreaId), {
        taskId: task.taskId || task.TaskId,
        assignedToName: task.assignedToName || task.AssignedToName || 'another staff member',
        status,
      });
    });

    return map;
  }, [utilityReadingTasks]);

  useEffect(() => {
    if (linkSource !== 'request' || requestsLoadedRef.current) return;

    let cancelled = false;
    requestsLoadedRef.current = true;

    const fetchRequests = async () => {
      setLoadingRequests(true);
      setRequestLoadError('');
      try {
        const res = await fetch(`${baseUrl}/api/manager/requests?status=Pending&requestType=FacilityIssue&pageSize=100`);
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
          setRequestLoadError('Cannot load pending requests list.');
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
  }, [linkSource, baseUrl]);

  useEffect(() => {
    if (linkSource !== 'issue' || issuesLoadedRef.current) return;

    let cancelled = false;
    issuesLoadedRef.current = true;

    const fetchIssues = async () => {
      setLoadingIssues(true);
      setIssueLoadError('');
      try {
        const res = await fetch(`${baseUrl}/api/manager/issues?pageNumber=1&pageSize=100&sortDescending=true`);
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
          setIssueLoadError('Cannot load infrastructure issues list.');
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
  }, [linkSource, baseUrl]);

  const handleTaskTypeChange = (nextType) => {
    setTaskType(nextType);
    setAreaId('');
    setLinkSource('none');
    setRequestId('');
    setIssueId('');
    setFormErrors({});
  };

  const handleLinkSourceChange = (nextSource) => {
    setLinkSource(nextSource);
    setFormErrors({});

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
    if (!nextRequestId) return;

    const selectedRequest = requests.find(item => String(item.requestId || item.RequestId) === nextRequestId);
    if (!selectedRequest) return;

    const selectedTitle = selectedRequest.title || selectedRequest.Title || '';
    const selectedDescription = selectedRequest.description || selectedRequest.Description || '';
    const selectedStallCode = selectedRequest.stallCode || selectedRequest.StallCode;
    const selectedStallId = selectedRequest.stallId || selectedRequest.StallId;

    if (!title.trim() && selectedTitle) {
      setTitle(`${taskType === 'Maintenance' ? 'Maintenance' : 'Repair'}: ${selectedTitle}`);
    }

    if (!description.trim()) {
      const stallLabel = selectedStallCode || (selectedStallId ? `ID: ${selectedStallId}` : 'N/A');
      setDescription(`Handle customer request at stall ${stallLabel}.\n\nRequest details:\n${selectedDescription || selectedTitle}`);
    }
  };

  const handleIssueChange = (nextIssueId) => {
    setIssueId(nextIssueId);
    if (!nextIssueId) return;

    const selectedIssue = issues.find(item => String(item.issueId || item.IssueId) === nextIssueId);
    if (!selectedIssue) return;

    const selectedTitle = selectedIssue.title || selectedIssue.Title || '';
    const selectedDescription = selectedIssue.description || selectedIssue.Description || '';
    const selectedStallCode = selectedIssue.stallCode || selectedIssue.StallCode;
    const selectedStallId = selectedIssue.stallId || selectedIssue.StallId;

    if (!title.trim() && selectedTitle) {
      setTitle(`${taskType === 'Maintenance' ? 'Maintenance' : 'Repair'}: ${selectedTitle}`);
    }

    if (!description.trim()) {
      const stallLabel = selectedStallCode || (selectedStallId ? `ID: ${selectedStallId}` : 'N/A');
      setDescription(`Handle infrastructure issue at stall ${stallLabel}.\n\nIssue details:\n${selectedDescription || selectedTitle}`);
    }
  };

  const validate = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    }

    if (!assignedToUserId) {
      errors.assignedToUserId = 'Please assign this task to a staff member.';
    }

    if (taskType === 'UtilityReading' && !areaId) {
      errors.areaId = 'Please select a market area for utility reading.';
    }

    if (taskType === 'UtilityReading' && areaId && assignedUtilityAreas.has(String(areaId))) {
      const assignment = assignedUtilityAreas.get(String(areaId));
      errors.areaId = `This area already has a utility reading task assigned to ${assignment.assignedToName}.`;
    }

    if (linkSource === 'request' && (taskType === 'Repair' || taskType === 'Maintenance') && !requestId) {
      errors.requestId = 'Please select a customer request to link.';
    }

    if (linkSource === 'issue' && (taskType === 'Repair' || taskType === 'Maintenance') && !issueId) {
      errors.issueId = 'Please select an infrastructure issue to link.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const body = {
      assignedToUserId: parseInt(assignedToUserId),
      taskType,
      title: title.trim(),
      description: description.trim() || null,
      areaId: taskType === 'UtilityReading' ? parseInt(areaId) : null,
      requestId: (linkSource === 'request' && (taskType === 'Repair' || taskType === 'Maintenance') && requestId) ? parseInt(requestId) : null,
      issueId: taskType !== 'UtilityReading' && preFilledIssueId
        ? parseInt(preFilledIssueId)
        : (linkSource === 'issue' && (taskType === 'Repair' || taskType === 'Maintenance') && issueId)
          ? parseInt(issueId)
          : null,
    };

    try {
      const res = await fetch(`${baseUrl}/api/manager/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        addToast('Task created successfully!', 'success');
        const data = await res.json();
        onSuccess(data);
      } else {
        const errText = await res.text();
        addToast(errText || 'Failed to create task.', 'error');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      addToast('Network error. Failed to create task.', 'error');
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
              <h3>Create Operational Task</h3>
              <p>Assign work to staff and optionally connect related records.</p>
            </div>
          </div>
          <button id="btn-create-task-close" className="ctm-close" onClick={onClose} type="button" title="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ctm-body">
            <section className="ctm-section">
              <div className="ctm-section-head">
                <div>
                  <h4>Task information</h4>
                  <p>Choose the task category and describe the work clearly.</p>
                </div>
              </div>

              <div className="ctm-field">
                <label className="ctm-label required-field">Task type</label>
                <div className="ctm-type-grid" id="select-create-task-type" role="radiogroup" aria-label="Task type">
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
                          <strong>{type.label}</strong>
                          <small>{type.description}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ctm-field">
                <label className="ctm-label required-field">Task label</label>
                <input
                  id="input-create-task-title"
                  type="text"
                  className={`ctm-input ${formErrors.title ? 'is-error' : ''}`}
                  placeholder="Enter a short task name..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                />
                {formErrors.title && <span className="ctm-error">{formErrors.title}</span>}
              </div>

              <div className="ctm-field">
                <label className="ctm-label">Operational description</label>
                <textarea
                  id="textarea-create-task-desc"
                  className="ctm-textarea"
                  rows="4"
                  placeholder="Add context, constraints, location notes, or acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </section>

            <section className="ctm-section">
              <div className="ctm-section-head">
                <div>
                  <h4>Assignment & links</h4>
                  <p>Select the responsible staff member and connect related records.</p>
                </div>
              </div>

              <div className="ctm-field">
                <label className="ctm-label required-field">
                  <UserCheck size={14} /> Assign to staff
                </label>
                <select
                  id="select-create-task-staff"
                  className={`ctm-select ${formErrors.assignedToUserId ? 'is-error' : ''}`}
                  value={assignedToUserId}
                  onChange={(e) => setAssignedToUserId(e.target.value)}
                  disabled={loadingStaffs || submitting}
                >
                  <option value="">Select active staff</option>
                  {staffs.map(s => (
                    <option key={s.userId} value={s.userId}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
                {loadingStaffs && <span className="ctm-helper">Loading staff...</span>}
                {formErrors.assignedToUserId && <span className="ctm-error">{formErrors.assignedToUserId}</span>}
              </div>

              {taskType === 'UtilityReading' && (
                <div className="ctm-field">
                  <label className="ctm-label required-field">
                    <MapPin size={14} /> Market area
                  </label>
                  <select
                    id="select-create-task-area"
                    className={`ctm-select ${formErrors.areaId ? 'is-error' : ''}`}
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                    disabled={loadingAreas || loadingUtilityTasks || submitting}
                  >
                    <option value="">Select area to measure</option>
                    {areas.map(a => {
                      const id = a.areaId || a.AreaId;
                      const name = a.name || a.Name;
                      const desc = a.description || a.Description || 'No description';
                      const assignment = assignedUtilityAreas.get(String(id));
                      return (
                        <option key={id} value={id} disabled={Boolean(assignment)}>
                          {name} ({desc}){assignment ? ` - already assigned to ${assignment.assignedToName}` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {loadingAreas && <span className="ctm-helper">Loading areas...</span>}
                  {loadingUtilityTasks && <span className="ctm-helper">Checking this month's utility reading assignments...</span>}
                  {!loadingAreas && !loadingUtilityTasks && areas.length > 0 && assignedUtilityAreas.size >= areas.length && (
                    <span className="ctm-helper">All areas already have utility reading tasks this month.</span>
                  )}
                  {formErrors.areaId && <span className="ctm-error">{formErrors.areaId}</span>}
                </div>
              )}

              {preFilledIssueId && (taskType === 'Repair' || taskType === 'Maintenance') ? (
                <div className="ctm-linked-panel">
                  <div className="ctm-linked-icon">
                    <Link2 size={15} />
                  </div>
                  <div>
                    <span className="ctm-kicker">Linked infrastructure issue</span>
                    <strong>Issue #{preFilledIssueId}</strong>
                  </div>
                </div>
              ) : (
                (taskType === 'Repair' || taskType === 'Maintenance') && (
                  <div className="ctm-link-box">
                    <div className="ctm-source-segment" role="radiogroup" aria-label="Task source">
                      {LINK_SOURCES.map(source => {
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
                              <strong>{source.label}</strong>
                              <small>{source.description}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {linkSource === 'request' && (
                      <div className="ctm-source-panel">
                        <div className="ctm-source-panel-head">
                          <label className="ctm-label required-field">Select request</label>
                          <span className="ctm-source-count">{requests.length} shown</span>
                        </div>
                        {loadingRequests && <span className="ctm-helper">Loading requests...</span>}
                        {requestLoadError && <span className="ctm-error">{requestLoadError}</span>}
                        {!loadingRequests && !requestLoadError && requests.length === 0 && (
                          <span className="ctm-helper">No pending facility requests available.</span>
                        )}
                        {!loadingRequests && !requestLoadError && requests.length > 0 && (
                          <div className="ctm-source-list" role="listbox" aria-label="Pending requests">
                            {requests.map(item => {
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
                                    <small>{stallCode ? `Stall ${stallCode}` : stallId ? `Stall ID ${stallId}` : 'No stall'} - {status} - {formatCompactDate(createdAt)}</small>
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
                          <label className="ctm-label required-field">Select issue</label>
                          <span className="ctm-source-count">{issues.length} shown</span>
                        </div>
                        {loadingIssues && <span className="ctm-helper">Loading issues...</span>}
                        {issueLoadError && <span className="ctm-error">{issueLoadError}</span>}
                        {!loadingIssues && !issueLoadError && issues.length === 0 && (
                          <span className="ctm-helper">No unassigned open issues available.</span>
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
                                    <small>{stallCode ? `Stall ${stallCode}` : stallId ? `Stall ID ${stallId}` : 'No stall'} - {status} - {formatCompactDate(createdAt)}</small>
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
                  <span>Please review the highlighted fields before creating the task.</span>
                </div>
              )}
            </section>
          </div>

          <div className="ctm-footer">
            <button id="btn-create-task-cancel" type="button" className="ctm-btn ctm-btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button id="btn-create-task-submit" type="submit" className="ctm-btn ctm-btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
