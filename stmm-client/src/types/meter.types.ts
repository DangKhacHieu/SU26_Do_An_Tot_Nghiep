export interface MeterDto {
  meterId: number;
  stallId: number | null;
  marketId: number;
  stallCode: string;
  type: string;
  serialNumber: string;
  installedAt: string | null;
  isActive: boolean | null;
  lastReadingValue: number | null;
  lastReadingImageUrl?: string | null;
}

export interface MeterReadingDto {
  meterReadingId: number;
  meterId: number;
  meterSerialNumber: string;
  meterType: string;
  stallCode: string;
  oldValue: number;
  newValue: number;
  consumption: number;
  recordedAt: string;
  createdByUserId: number;
  createdByName: string;
  imageUrl: string;
}

export interface CreateMeterReadingRequest {
  meterId: number;
  newValue: number;
  recordedAt: string;
  imageUrl: string;
}

export interface MeterReadingQueryParams {
  pageNumber?: number;
  pageSize?: number;
  meterType?: string | null;
}

export interface CreateMeterRequest {
  serialNumber: string;
  type: string;
}

export interface UpdateMeterRequest {
  serialNumber: string;
  type: string;
  isActive: boolean;
}
