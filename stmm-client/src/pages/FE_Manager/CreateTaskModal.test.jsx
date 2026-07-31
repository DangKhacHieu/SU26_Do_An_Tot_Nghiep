import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateTaskModal from './CreateTaskModal';

const { translate } = vi.hoisted(() => ({
  translate: (key, options) => {
    if (key === 'createtaskmodal.utility_period_title') {
      return `Kỳ ghi chỉ số: Tháng ${options?.period || ''}`;
    }
    if (key === 'createtaskmodal.already_assigned_to') {
      return `Đã giao task tháng ${options?.period} (${options?.staffName})`;
    }
    if (key === 'createtaskmodal.ready_to_assign') {
      return 'Sẵn sàng giao task';
    }
    return key;
  }
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: translate,
    i18n: { resolvedLanguage: 'vi-VN' }
  })
}));

describe('CreateTaskModal - UtilityReading Restriction', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should disable area option in dropdown if already assigned in current month', async () => {
    const now = new Date();
    const currentMonthStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const staffData = [{ userId: 1, name: 'Staff A', email: 'staffa@example.com', status: 'Active' }];
    const areaData = [
      { areaId: 101, name: 'Khu A', description: 'Khu thương mại' },
      { areaId: 102, name: 'Khu B', description: 'Khu ẩm thực' }
    ];
    const existingTasks = [
      {
        taskId: 1,
        taskType: 'UtilityReading',
        areaId: 101,
        assignedToName: 'Staff A',
        status: 'In_Progress',
        createdAt: now.toISOString()
      }
    ];

    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/manager/users')) {
        return Promise.resolve({ ok: true, json: async () => staffData });
      }
      if (url.includes('/api/Areas')) {
        return Promise.resolve({ ok: true, json: async () => areaData });
      }
      if (url.includes('/api/manager/tasks')) {
        return Promise.resolve({ ok: true, json: async () => existingTasks });
      }
      return Promise.resolve({ ok: false });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <CreateTaskModal
        baseUrl="http://localhost:5056"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        addToast={mockAddToast}
      />
    );

    // Switch task type to UtilityReading
    const utilityRadio = await screen.findByRole('radio', { name: /createtaskmodal.utility_reading/i });
    fireEvent.click(utilityRadio);

    // Check utility period banner is displayed
    await waitFor(() => {
      expect(screen.getByText(`Kỳ ghi chỉ số: Tháng ${currentMonthStr}`)).toBeInTheDocument();
    });

    // Check area select dropdown options
    const areaSelect = document.querySelector('#select-create-task-area');
    expect(areaSelect).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    const disabledOption = options.find((opt) => opt.value === '101');
    const enabledOption = options.find((opt) => opt.value === '102');

    expect(disabledOption).toBeDisabled();
    expect(disabledOption.textContent).toContain('🔒 Khu A');
    expect(disabledOption.textContent).toContain('Staff A');

    expect(enabledOption).not.toBeDisabled();
    expect(enabledOption.textContent).toContain('🟢 Khu B');
  });

  it('should clear auto-filled title and description when link source changes', async () => {
    const staffData = [{ userId: 1, name: 'Staff A', status: 'Active' }];
    const issueData = [
      { issueId: 5, title: 'Ống nước bị bể', description: 'Ống nước nối cho sạp Bà Hana', stallCode: 'XK-A01' }
    ];

    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/manager/users')) {
        return Promise.resolve({ ok: true, json: async () => staffData });
      }
      if (url.includes('/api/Areas')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes('/api/manager/tasks')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes('/api/manager/issues')) {
        return Promise.resolve({ ok: true, json: async () => ({ items: issueData }) });
      }
      return Promise.resolve({ ok: false });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <CreateTaskModal
        baseUrl="http://localhost:5056"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        addToast={mockAddToast}
      />
    );

    // Click Infrastructure Issue source
    const issueSource = screen.getByText('createtaskmodal.infrastructure_issue');
    fireEvent.click(issueSource);

    // Click issue 5 item card
    const issueCard = await screen.findByText(/Ống nước bị bể/);
    fireEvent.click(issueCard);

    // Verify title and description are auto-filled
    const titleInput = screen.getByPlaceholderText('createtaskmodal.task_label_placeholder');
    const descTextarea = screen.getByPlaceholderText('createtaskmodal.description_placeholder');

    expect(titleInput.value).toContain('Ống nước bị bể');
    expect(descTextarea.value).toContain('Ống nước nối cho sạp Bà Hana');

    // Switch link source back to No source
    const noSource = screen.getByText('createtaskmodal.no_source');
    fireEvent.click(noSource);

    // Title and description should be cleared
    expect(titleInput.value).toBe('');
    expect(descTextarea.value).toBe('');
  });
});
