using AutoMapper;
using STMM.DataAccess.Entities;
using STMM.Business.DTOs.Violation;
using STMM.Business.DTOs.Meter;
using STMM.Business.DTOs.Task;

namespace STMM.Business.Mappers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Violation mappings
            CreateMap<Violation, ViolationDto>()
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedByUserId))
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Stall != null ? src.Stall.Code : string.Empty));

            CreateMap<CreateViolationRequest, Violation>()
                .ForMember(dest => dest.ViolationId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedByUserId, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.NotifiedAt, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedByUser, opt => opt.Ignore())
                .ForMember(dest => dest.ViolationType, opt => opt.Ignore())
                .ForMember(dest => dest.Requests, opt => opt.Ignore())
                .ForMember(dest => dest.Stall, opt => opt.Ignore());

            CreateMap<ViolationType, ViolationTypeDto>();

            // Meter mappings
            CreateMap<Meter, MeterDto>()
                .ForMember(d => d.StallCode, o => o.MapFrom(s => s.Stall != null ? s.Stall.Code : string.Empty))
                .ForMember(d => d.InstalledAt, o => o.MapFrom(s => s.InstalledAt.HasValue ? s.InstalledAt.Value.ToString("yyyy-MM-dd") : null))
                .ForMember(d => d.LastReadingValue, o => o.Ignore()); // Will be populated in service

            // MeterReading mappings
            CreateMap<MeterReading, MeterReadingDto>()
                .ForMember(d => d.MeterSerialNumber, o => o.MapFrom(s => s.Meter != null ? s.Meter.SerialNumber : string.Empty))
                .ForMember(d => d.MeterType, o => o.MapFrom(s => s.Meter != null ? s.Meter.Type : string.Empty))
                .ForMember(d => d.StallCode, o => o.MapFrom(s => s.Meter != null && s.Meter.Stall != null ? s.Meter.Stall.Code : string.Empty))
                .ForMember(d => d.CreatedByName, o => o.MapFrom(s => s.CreatedByUser != null ? s.CreatedByUser.Name : string.Empty))
                .ForMember(d => d.RecordedAt, o => o.MapFrom(s => s.RecordedAt.ToString("yyyy-MM-dd")));

            // Task mappings
            CreateMap<StaffTask, TaskDto>()
                .ForMember(dest => dest.AssignedToName, opt => opt.MapFrom(src => src.AssignedToUser != null ? src.AssignedToUser.Name : string.Empty))
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Area != null ? src.Area.Name : string.Empty))
                .ForMember(dest => dest.Materials, opt => opt.MapFrom(src => src.TaskMaterials));

            CreateMap<StaffTask, TaskSummaryDto>()
                .ForMember(dest => dest.AssignedToName, opt => opt.MapFrom(src => src.AssignedToUser != null ? src.AssignedToUser.Name : string.Empty))
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Area != null ? src.Area.Name : string.Empty));

            CreateMap<TaskMaterial, TaskMaterialDto>();
        }
    }
}
