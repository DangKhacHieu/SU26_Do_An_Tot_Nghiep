import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MeterDetail from './MeterDetail';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'vi' }
  })
}));

const mockMeter = {
  meterId: 10,
  serialNumber: 'WA-XK-01',
  type: 'Water',
  stallId: 5,
  stallCode: 'XK-A01',
  installedAt: '2025-01-01T00:00:00Z',
  isActive: true,
  lastReadingValue: 125,
  lastReadingImageUrl: 'http://localhost/evidence.jpg'
};

describe('MeterDetail Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should render meter details and KPI recorded value correctly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMeter
    }));

    const onBack = vi.fn();

    render(
      <MeterDetail meterId={10} baseUrl="http://localhost" onBack={onBack} />
    );

    await waitFor(() => expect(screen.getAllByText('WA-XK-01')[0]).toBeInTheDocument());
    
    // KPI Value and unit check
    expect(screen.getByText('125')).toBeInTheDocument();
    expect(screen.getByText('m³')).toBeInTheDocument();

    // Location check
    expect(screen.getByText('XK-A01')).toBeInTheDocument();

    // Back button click test
    const backBtn = screen.getByRole('button', { name: /meterdetail.back_to_history/i });
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should render compact evidence photo without stretching', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMeter
    }));

    render(
      <MeterDetail meterId={10} baseUrl="http://localhost" onBack={vi.fn()} />
    );

    await waitFor(() => expect(screen.getAllByText('WA-XK-01')[0]).toBeInTheDocument());

    const img = screen.getByAltText('meterdetail.latest_meter_reading_evidence');
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('meter-evidence-img');
  });
});
