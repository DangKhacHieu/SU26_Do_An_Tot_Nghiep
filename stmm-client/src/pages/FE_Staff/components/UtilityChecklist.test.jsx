import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UtilityChecklist from './UtilityChecklist';

const { translate } = vi.hoisted(() => ({
  translate: (key) => key
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: translate
  })
}));

vi.mock('../RecordMeterReadingModal', () => ({
  default: () => null
}));

const createStall = (id, completed) => ({
  stallId: id,
  stallCode: `A-0${id}`,
  stallStatus: 'Rented',
  hasElectricityMeter: true,
  hasWaterMeter: true,
  hasElectricityReadingThisMonth: true,
  hasWaterReadingThisMonth: completed,
  hasReadingThisMonth: completed
});

describe('UtilityChecklist', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should filter pending stalls and paginate five rows at a time', async () => {
    const stalls = [
      createStall(1, true),
      createStall(2, false),
      createStall(3, true),
      createStall(4, true),
      createStall(5, true),
      createStall(6, false)
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => stalls
    }));

    render(
      <UtilityChecklist
        taskId={7}
        baseUrl="http://localhost"
        taskStatus="In_Progress"
      />
    );

    await waitFor(() => expect(screen.getByText('A-01')).toBeInTheDocument());
    expect(screen.queryByText('A-06')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'utilitychecklist.next_page' }));
    expect(screen.getByText('A-06')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'utilitychecklist.pending_count' }));
    await waitFor(() => expect(screen.getByText('A-02')).toBeInTheDocument());
    expect(screen.getByText('A-06')).toBeInTheDocument();
    expect(screen.queryByText('A-01')).not.toBeInTheDocument();
  });

  it('should keep a completed task read only', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [createStall(2, false)]
    }));

    render(
      <UtilityChecklist
        taskId={7}
        baseUrl="http://localhost"
        taskStatus="Completed"
      />
    );

    await waitFor(() => expect(screen.getByText('A-02')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'utilitychecklist.record' })).not.toBeInTheDocument();
    expect(screen.getByText('utilitychecklist.review_required')).toBeInTheDocument();
  });

  it('should show an error state with retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Unable to load checklist' })
    }));

    render(
      <UtilityChecklist
        taskId={7}
        baseUrl="http://localhost"
        taskStatus="Pending"
      />
    );

    await waitFor(() => expect(screen.getByText('Unable to load checklist')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'utilitychecklist.retry' })).toBeInTheDocument();
  });
});
