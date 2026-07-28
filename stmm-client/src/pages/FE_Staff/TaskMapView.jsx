import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from "react";
import { getStaffMarketMap } from "../../services/marketApi";
import { TASK_STATUS, TASK_TYPE } from "../../constants/taskEnums";
import readProblemDetail from "../../utils/readProblemDetail";
import "./TaskMapView.css";

export default function TaskMapView({ baseUrl, onBack, onViewDetails }) {
  const { t } = useTranslation();

  const MAP_SCALE = 0.65;
  const [marketMap, setMarketMap] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [utilityStallIdsByTask, setUtilityStallIdsByTask] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStall, setSelectedStall] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(950);
  const [canvasHeight, setCanvasHeight] = useState(650);

  useEffect(() => {
    const originalTitle = document.title;
    document.title = t('taskmapview.stmm_staff_task_map');

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute(t('taskmapview.content')) : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = t('taskmapview.description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(t('taskmapview.content'), t('taskmapview.market_layout_showing_active'));

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute(t('taskmapview.content'), originalDesc);
        } else {
          metaDesc.remove();
        }
      }
    };
  }, []);

  useEffect(() => {
    const loadMapAndTasks = async () => {
      try {
        setLoading(true);
        setError("");
        
        const token = localStorage.getItem(t('taskmapview.token'));
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [mapData, tasksResponse] = await Promise.all([
          getStaffMarketMap(),
          fetch(`${baseUrl}/api/staff/tasks`, { headers }),
        ]);
        if (mapData) {
          setMarketMap(mapData);
          
          let max_x = 900;
          let max_y = 600;
          if (mapData.areas && mapData.areas.length > 0) {
            mapData.areas.forEach((area) => {
              if (area.maxX > max_x) max_x = area.maxX;
              if (area.maxY > max_y) max_y = area.maxY;
            });
          }
          setCanvasWidth(max_x + 50);
          setCanvasHeight(max_y + 50);
        } else {
          throw new Error(t('taskmapview.the_market_map_is'));
        }

        if (!tasksResponse.ok) {
          throw new Error(await readProblemDetail(tasksResponse, t('taskmapview.unable_to_load_assigned')));
        }
        const tasksData = await tasksResponse.json();
        const assignedTasks = Array.isArray(tasksData) ? tasksData : [];
        setTasks(assignedTasks);

        const utilityTasks = assignedTasks.filter(
          (task) =>
            task.taskType === TASK_TYPE.UTILITY_READING &&
            task.status !== TASK_STATUS.COMPLETED &&
            task.status !== TASK_STATUS.CANCELLED,
        );
        const utilityEntries = await Promise.all(
          utilityTasks.map(async (task) => {
            const response = await fetch(`${baseUrl}/api/staff/tasks/${task.taskId}/stalls`, { headers });
            if (!response.ok) {
              throw new Error(await readProblemDetail(response, t('taskmapview.unable_to_load_utility')));
            }
            const stalls = await response.json();
            return [task.taskId, Array.isArray(stalls) ? stalls.map((stall) => stall.stallId) : []];
          }),
        );
        setUtilityStallIdsByTask(Object.fromEntries(utilityEntries));

      } catch (err) {
        console.error(t('taskmapview.unable_to_load_staff'), err);
        setError(err.message || t('taskmapview.unable_to_load_the'));
      } finally {
        setLoading(false);
      }
    };

    loadMapAndTasks();
  }, [baseUrl]);

  const tasksByStall = useMemo(() => {
    const result = {};

    tasks.forEach((task) => {
      if (task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.CANCELLED) {
        return;
      }

      if (task.stallId) {
        if (!result[task.stallId]) result[task.stallId] = [];
        result[task.stallId].push(task);
        return;
      }

      if (task.taskType === TASK_TYPE.UTILITY_READING) {
        for (const stallId of utilityStallIdsByTask[task.taskId] || []) {
          if (!result[stallId]) result[stallId] = [];
          result[stallId].push(task);
        }
        return;
      }

      if (task.areaId && marketMap?.areas) {
        const area = marketMap.areas.find((item) => item.areaId === task.areaId);
        for (const stall of area?.stalls || []) {
          if (!result[stall.stallId]) result[stall.stallId] = [];
          result[stall.stallId].push(task);
        }
      }
    });

    return result;
  }, [marketMap, tasks, utilityStallIdsByTask]);

  const getStatusLabel = (status) => {
    switch (status) {
      case t('taskmapview.available'):
        return t('taskmapview.available');
      case t('taskmapview.rented'):
        return t('taskmapview.rented');
      case t('taskmapview.maintenance'):
        return t('taskmapview.maintenance');
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case t('taskmapview.available'):
        return "#10b981";
      case t('taskmapview.rented'):
        return "#3b82f6";
      case t('taskmapview.maintenance'):
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  const getTaskStatusLabel = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return t('taskmapview.pending');
      case TASK_STATUS.PENDING_APPROVAL: return t('taskmapview.pending_approval');
      case TASK_STATUS.IN_PROGRESS: return t('taskmapview.in_progress');
      default: return status;
    }
  };

  const getTaskTypeLabel = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return t('taskmapview.repair');
      case TASK_TYPE.MAINTENANCE: return t('taskmapview.maintenance');
      case TASK_TYPE.UTILITY_READING: return t('taskmapview.meter_reading');
      default: return type;
    }
  };

  const getTaskTypeClass = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return t('taskmapview.typerepair');
      case TASK_TYPE.MAINTENANCE: return t('taskmapview.typemaintenance');
      case TASK_TYPE.UTILITY_READING: return t('taskmapview.typeutility');
      default: return t('taskmapview.typedefault');
    }
  };

  const getTaskStatusClass = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return t('taskmapview.statuspending');
      case TASK_STATUS.PENDING_APPROVAL: return t('taskmapview.statusapproval');
      case TASK_STATUS.IN_PROGRESS: return t('taskmapview.statusprogress');
      default: return t('taskmapview.statusdefault');
    }
  };

  const handleStallClick = (stall, area) => {
    const enrichedStall = {
      ...stall,
      areaName: area.name,
      areaId: area.areaId,
    };
    setSelectedStall(enrichedStall);
  };

  const allStalls = [];
  if (marketMap?.areas) {
    marketMap.areas.forEach((area) => {
      if (area.stalls) {
        area.stalls.forEach((stall) => {
          allStalls.push({
            ...stall,
            areaId: area.areaId,
            areaName: area.name,
          });
        });
      }
    });
  }

  const stallsWithTasksCount = Object.keys(tasksByStall).length;
  const activeTaskCount = tasks.filter(
    (task) => task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.CANCELLED,
  ).length;

  return (
    <main className="task-map-view-container" id="task-map-main-view">
      <div className="map-view-header">
        <div className="header-left">
          <h1>📍 Task Map View</h1>
        </div>
        <div className="header-right">
          <span className="summary-badge">
            📋 Active Tasks: <strong>{activeTaskCount}</strong>
          </span>
          <span className="summary-badge">
            🏪 Stalls with Tasks: <strong>{stallsWithTasksCount}</strong>
          </span>
          <button className="btn-back-link" id="btn-task-map-back" onClick={onBack}>
            ← Back to List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="map-loading-state">
          <span className="spinner"></span> {t('taskmapview.loading_blueprint_map_and')}</div>
      ) : error ? (
        <div className="map-error-state">
          <p className="error-message">⚠️ Error: {error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            {t('taskmapview.retry')}</button>
        </div>
      ) : (
        <div className={`map-grid-layout ${selectedStall ? "has-selection" : ""}`}>
          <section className="map-canvas-card" id="task-map-canvas-section">
            <div className="map-card-header">
              <h3>{marketMap.marketName} Blueprint Map</h3>
              <p className="address-text">📍 {marketMap.address}</p>
            </div>

            <div className="map-legends">
              <div className="legend-item">
                <span className="legend-dot active-task-dot"></span>
                <span>Stall with Assigned Tasks ({stallsWithTasksCount})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box rented"></span>
                <span>{t('taskmapview.rented')}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box available"></span>
                <span>{t('taskmapview.available')}</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box maintenance"></span>
                <span>{t('taskmapview.maintenance')}</span>
              </div>
            </div>

            <div className="map-viewport">
              <div
                className="blueprint-map-canvas"
                style={{
                  width: `${canvasWidth * MAP_SCALE}px`,
                  height: `${canvasHeight * MAP_SCALE}px`,
                }}
              >
                {marketMap.areas && marketMap.areas.length > 0 ? (
                  marketMap.areas.map((area, idx) => {
                    const defaultX = (idx % 4) * 220 + 30;
                    const defaultY = Math.floor(idx / 4) * 180 + 30;
                    const x = (area.minX !== null ? area.minX : defaultX) * MAP_SCALE;
                    const y = (area.minY !== null ? area.minY : defaultY) * MAP_SCALE;
                    const w = (area.maxX - area.minX || 200) * MAP_SCALE;
                    const h = (area.maxY - area.minY || 160) * MAP_SCALE;

                    return (
                      <div
                        key={area.areaId}
                        className="map-area-block"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${w}px`,
                          height: `${h}px`,
                        }}
                      >
                        <div className="area-title">{area.name}</div>

                        {area.stalls &&
                          area.stalls.map((stall) => {
                            const isSelected = selectedStall?.stallId === stall.stallId;
                            const stallTasks = tasksByStall[stall.stallId] || [];
                            const hasTasks = stallTasks.length > 0;

                            return (
                              <div
                                key={stall.stallId}
                                id={`map-stall-node-${stall.code}`}
                                className={`map-stall-block ${stall.status.toLowerCase()} ${
                                  isSelected ? t('taskmapview.selected') : ""
                                } ${hasTasks ? t('taskmapview.hastasks') : ""}`}
                                style={{
                                  left: `${(stall.mapX ?? 0) * MAP_SCALE}px`,
                                  top: `${(stall.mapY ?? 0) * MAP_SCALE}px`,
                                  width: `${(stall.width || 45) * MAP_SCALE}px`,
                                  height: `${(stall.height || 45) * MAP_SCALE}px`,
                                  transform: t('taskmapview.rotatestallrotation_0deg'),
                                  borderLeft: `3px solid ${getStatusColor(stall.status)}`,
                                }}
                                onClick={() => handleStallClick(stall, area)}
                                title={t('taskmapview.stall_stallcode_stalltaskslength_active')}
                              >
                                <span className="stall-code-text">
                                  {stall.code}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })
                ) : (
                  <div className="map-empty">{t('taskmapview.the_market_layout_has')}</div>
                )}
              </div>
            </div>
          </section>

          {selectedStall && (
            <button
              type="button"
              className="map-drawer-backdrop"
              aria-label={t('taskmapview.close_stall_summary')}
              onClick={() => setSelectedStall(null)}
            />
          )}

          <aside
            className={`map-sidebar-card ${selectedStall ? "is-open" : ""}`}
            id="task-map-details-sidebar"
          >
            {selectedStall ? (
              <div className="drawer-details">
                <div className="drawer-section-header">
                  <div className="drawer-title-group">
                    <span className="section-label">{t('taskmapview.stall_information')}</span>
                    <span
                      className="stall-status-badge"
                      style={{ backgroundColor: getStatusColor(selectedStall.status) }}
                    >
                      {getStatusLabel(selectedStall.status)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="drawer-close-btn"
                    onClick={() => setSelectedStall(null)}
                    aria-label={t('taskmapview.close_stall_summary')}
                  >
                    ×
                  </button>
                </div>

                <div className="stall-main-info">
                  <h4>Stall {selectedStall.code}</h4>
                  <p className="area-info">{t('taskmapview.area')}<strong>{selectedStall.areaName}</strong></p>
                  <p className="owner-info">
                    {t('taskmapview.vendor')}<strong>{selectedStall.businessName || t('taskmapview.no_active_vendor')}</strong>
                  </p>
                  <p className="category-info">
                    {t('taskmapview.category')}<strong>{selectedStall.categoryName || t('taskmapview.not_specified')}</strong>
                  </p>
                </div>

                <hr className="drawer-divider" />

                <div className="drawer-tasks-list">
                  <h5>🛠️ Assigned Tasks ({tasksByStall[selectedStall.stallId]?.length || 0})</h5>

                  {tasksByStall[selectedStall.stallId]?.length > 0 ? (
                    <div className="tasks-scroll-wrap">
                      {tasksByStall[selectedStall.stallId].map((task) => (
                        <div key={task.taskId} className="task-mini-card">
                          <div className="task-card-row1">
                            <span className={`task-badge ${getTaskTypeClass(task.taskType)}`}>
                              {getTaskTypeLabel(task.taskType)}
                            </span>
                            <span className={`task-badge ${getTaskStatusClass(task.status)}`}>
                              {getTaskStatusLabel(task.status)}
                            </span>
                          </div>
                          <div className="task-card-title">{task.title}</div>
                          <div className="task-card-actions">
                            <button
                              className="btn-task-shortcut"
                              id={`btn-go-task-details-${task.taskId}`}
                              onClick={() => onViewDetails(task.taskId)}
                            >
                              {t('taskmapview.go_to_details')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tasks-placeholder">
                      <span className="ok-icon">✅</span>
                      <p>{t('taskmapview.no_active_task_is')}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="drawer-placeholder">
                <span className="placeholder-icon">🏪</span>
                <h4>{t('taskmapview.stall_details_panel')}</h4>
                <p>
                  {t('taskmapview.click_on_any_stall')}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
