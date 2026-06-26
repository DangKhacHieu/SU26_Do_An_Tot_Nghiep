import React, { useState, useEffect } from "react";
import { getMarketMap } from "../../services/marketApi";
import { TASK_STATUS, TASK_TYPE } from "../../constants/taskEnums";
import "./TaskMapView.css";

export default function TaskMapView({ userId, baseUrl, onBack, onViewDetails }) {
  const MAP_SCALE = 0.65;
  const [marketMap, setMarketMap] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStall, setSelectedStall] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(950);
  const [canvasHeight, setCanvasHeight] = useState(650);

  // SEO & metadata management
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "STMM - Bản đồ Tác vụ Nhân viên";

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute("content") : "";

    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", "Sơ đồ mặt bằng phân công công việc và quản lý tác vụ kỹ thuật của nhân viên hiện trường STMM.");

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute("content", originalDesc);
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
        
        // 1. Fetch market map (default marketId = 1)
        const mapData = await getMarketMap(1);
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
          throw new Error("Không tìm thấy sơ đồ chợ.");
        }

        // 2. Fetch tasks assigned to the current staff
        const tasksUrl = `${baseUrl}/api/staff/tasks?userId=${userId}&pageSize=1000`;
        const tasksResponse = await fetch(tasksUrl);
        if (!tasksResponse.ok) {
          throw new Error(`Không thể tải danh sách công việc: ${tasksResponse.statusText}`);
        }
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.items || []);

      } catch (err) {
        console.error("Lỗi khi tải dữ liệu bản đồ tác vụ:", err);
        setError(err.message || "Đã xảy ra lỗi không xác định.");
      } finally {
        setLoading(false);
      }
    };

    loadMapAndTasks();
  }, [userId, baseUrl]);

  // Filter tasks that are active (not Completed and not Cancelled)
  const activeTasks = tasks.filter(
    (t) => t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.CANCELLED
  );

  // Group active tasks by stallId
  const tasksByStall = {};
  activeTasks.forEach((task) => {
    if (task.stallId) {
      if (!tasksByStall[task.stallId]) {
        tasksByStall[task.stallId] = [];
      }
      tasksByStall[task.stallId].push(task);
    }
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case "Available":
        return "Trống";
      case "Rented":
        return "Đã thuê";
      case "Maintenance":
        return "Bảo trì";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "#10b981"; // Green
      case "Rented":
        return "#3b82f6"; // Blue
      case "Maintenance":
        return "#f59e0b"; // Orange
      default:
        return "#94a3b8"; // Grey
    }
  };

  const getTaskStatusLabel = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return "Pending";
      case TASK_STATUS.PENDING_APPROVAL: return "Pending Approval";
      case TASK_STATUS.IN_PROGRESS: return "In Progress";
      default: return status;
    }
  };

  const getTaskTypeLabel = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return "Repair";
      case TASK_TYPE.MAINTENANCE: return "Maintenance";
      case TASK_TYPE.UTILITY_READING: return "Meter Reading";
      case TASK_TYPE.CASH_COLLECTION: return "Cash Collection";
      default: return type;
    }
  };

  const getTaskTypeClass = (type) => {
    switch (type) {
      case TASK_TYPE.REPAIR: return "type-repair";
      case TASK_TYPE.MAINTENANCE: return "type-maintenance";
      case TASK_TYPE.UTILITY_READING: return "type-utility";
      case TASK_TYPE.CASH_COLLECTION: return "type-cash";
      default: return "type-default";
    }
  };

  const getTaskStatusClass = (status) => {
    switch (status) {
      case TASK_STATUS.PENDING: return "status-pending";
      case TASK_STATUS.PENDING_APPROVAL: return "status-approval";
      case TASK_STATUS.IN_PROGRESS: return "status-progress";
      default: return "status-default";
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

  // Find flat list of all stalls to count and render legends
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

  return (
    <main className="task-map-view-container" id="task-map-main-view">
      {/* Header controls */}
      <div className="map-view-header">
        <div className="header-left">
          <h1>📍 Task Map View</h1>
        </div>
        <div className="header-right">
          <span className="summary-badge">
            📋 Active Tasks: <strong>{activeTasks.length}</strong>
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
          <span className="spinner"></span> Loading blueprint map and tasks...
        </div>
      ) : error ? (
        <div className="map-error-state">
          <p className="error-message">⚠️ Error: {error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : (
        <div className={`map-grid-layout ${selectedStall ? "has-selection" : ""}`}>
          {/* Left Column: Interactive Map Grid */}
          <section className="map-canvas-card" id="task-map-canvas-section">
            <div className="map-card-header">
              <h3>{marketMap.marketName} Blueprint Map</h3>
              <p className="address-text">📍 {marketMap.address}</p>
            </div>

            {/* Legend strip */}
            <div className="map-legends">
              <div className="legend-item">
                <span className="legend-dot active-task-dot"></span>
                <span>Stall with Assigned Tasks ({stallsWithTasksCount})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box rented"></span>
                <span>Rented</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box available"></span>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-color-box maintenance"></span>
                <span>Maintenance</span>
              </div>
            </div>

            {/* Blueprint Map Canvas wrapper */}
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
                                  isSelected ? "selected" : ""
                                } ${hasTasks ? "has-tasks" : ""}`}
                                style={{
                                  left: `${(stall.mapX ?? 0) * MAP_SCALE}px`,
                                  top: `${(stall.mapY ?? 0) * MAP_SCALE}px`,
                                  width: `${(stall.width || 45) * MAP_SCALE}px`,
                                  height: `${(stall.height || 45) * MAP_SCALE}px`,
                                  transform: `rotate(${stall.rotation || 0}deg)`,
                                  borderLeft: `3px solid ${getStatusColor(stall.status)}`,
                                }}
                                onClick={() => handleStallClick(stall, area)}
                                title={`Stall ${stall.code} - ${stallTasks.length} active tasks`}
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
                  <div className="map-empty">Sơ đồ chưa được cấu hình phân khu.</div>
                )}
              </div>
            </div>
          </section>

          {selectedStall && (
            <button
              type="button"
              className="map-drawer-backdrop"
              aria-label="Close stall summary"
              onClick={() => setSelectedStall(null)}
            />
          )}

          {/* Right Column: Stall Details & Tasks Drawer */}
          <aside
            className={`map-sidebar-card ${selectedStall ? "is-open" : ""}`}
            id="task-map-details-sidebar"
          >
            {selectedStall ? (
              <div className="drawer-details">
                <div className="drawer-section-header">
                  <div className="drawer-title-group">
                    <span className="section-label">Stall Information</span>
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
                    aria-label="Close stall summary"
                  >
                    ×
                  </button>
                </div>

                <div className="stall-main-info">
                  <h4>Stall {selectedStall.code}</h4>
                  <p className="area-info">Phân khu: <strong>{selectedStall.areaName}</strong></p>
                  <p className="owner-info">
                    Chủ sạp: <strong>{selectedStall.businessName || "Chưa có thông tin thuê"}</strong>
                  </p>
                  <p className="category-info">
                    Ngành hàng: <strong>{selectedStall.categoryName || "Chưa thiết lập"}</strong>
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
                              Go to Details →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-tasks-placeholder">
                      <span className="ok-icon">✅</span>
                      <p>Không có tác vụ chưa hoàn thành được giao cho bạn tại sạp này.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="drawer-placeholder">
                <span className="placeholder-icon">🏪</span>
                <h4>Stall Details Panel</h4>
                <p>
                  Click on any stall on the map layout to inspect its details and review tasks assigned to you. Stalls marked with 🛠️ have active tasks.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
