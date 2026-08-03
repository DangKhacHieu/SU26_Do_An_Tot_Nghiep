import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UtilityChecklistManager from './UtilityChecklistManager';

const { translate } = vi.hoisted(() => ({
  translate: (key) => key
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: translate
  })
}));

const stalls = [
  {
    stallId: 11,
    stallCode: 'A-01',
    stallStatus: 'Rented',
    hasElectricityMeter: true,
    hasWaterMeter: true,
    hasElectricityReadingThisMonth: true,
    hasWaterReadingThisMonth: true,
    hasReadingThisMonth: true
  },
  {
    stallId: 12,
    stallCode: 'A-02',
    stallStatus: 'Rented',
    hasElectricityMeter: true,
    hasWaterMeter: true,
    hasElectricityReadingThisMonth: true,
    hasWaterReadingThisMonth: false,
    hasReadingThisMonth: false
  }
];

describe('UtilityChecklistManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should show manager progress as a read-only checklist', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => stalls
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<UtilityChecklistManager taskId={7} baseUrl="http://localhost" />);

    await waitFor(() => expect(screen.getByText('A-01')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost/api/manager/tasks/7/stalls',
      expect.any(Object)
    );
    expect(screen.queryByText('utilitychecklist.record')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'utilitychecklist.pending_count' }));
    await waitFor(() => expect(screen.getByText('A-02')).toBeInTheDocument());
    expect(screen.queryByText('A-01')).not.toBeInTheDocument();
  });

  it('should show a retry action when the checklist cannot load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Checklist unavailable' })
    }));

    render(<UtilityChecklistManager taskId={7} baseUrl="http://localhost" />);

    await waitFor(() => expect(screen.getByText('Checklist unavailable')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'utilitychecklist.retry' })).toBeInTheDocument();
  });
});
