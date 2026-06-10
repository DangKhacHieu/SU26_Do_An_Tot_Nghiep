using AutoMapper;
using STMM.DataAccess.Entities;
using STMM.Business.DTOs.Violation;
using STMM.Business.DTOs.Auth;
using STMM.Business.DTOs.User;
using STMM.Business.DTOs.Notification;
using STMM.Business.DTOs.Meter;
using STMM.Business.DTOs.Task;
using STMM.Business.DTOs.Area;
using STMM.Business.DTOs.Stall;
using STMM.Business.DTOs.BusinessCategory;

namespace STMM.Business.Mappers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // BusinessCategory mappings
            CreateMap<BusinessCategory, BusinessCategoryDto>()
                .ForMember(dest => dest.StallsCount, opt => opt.Ignore())
                .ForMember(dest => dest.AreasCount, opt => opt.Ignore());

            CreateMap<CreateBusinessCategoryRequest, BusinessCategory>()
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Areas, opt => opt.Ignore())
                .ForMember(dest => dest.Stalls, opt => opt.Ignore());

            CreateMap<UpdateBusinessCategoryRequest, BusinessCategory>()
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore())
                .ForMember(dest => dest.Code, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Areas, opt => opt.Ignore())
                .ForMember(dest => dest.Stalls, opt => opt.Ignore());
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
            // Auth mappings
            CreateMap<STMM.DataAccess.Entities.User, UserDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.Name : "Unknown"));

            // Notification mappings
            CreateMap<Notification, NotificationDto>();

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

            // User and Role mappings
            CreateMap<Role, RoleDto>();
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.Name : string.Empty));
            CreateMap<User, UserDetailDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.Name : string.Empty))
                .ForMember(dest => dest.RoleDescription, opt => opt.MapFrom(src => src.Role != null ? src.Role.Description : string.Empty));

            // FAQ mappings
            CreateMap<Faq, STMM.Business.DTOs.Faq.FaqDto>();

            // Content (Notification) mappings
            CreateMap<Notification, STMM.Business.DTOs.Content.ContentDto>()
                .ForMember(dest => dest.TargetUserName, opt => opt.MapFrom(src => src.TargetUser != null ? src.TargetUser.Name : string.Empty));

            // Area mappings
            CreateMap<Area, AreaDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null));

            CreateMap<AreaDto, Area>()
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.Market, opt => opt.Ignore())
                .ForMember(dest => dest.Stalls, opt => opt.Ignore());

            CreateMap<CreateAreaRequest, Area>()
                .ForMember(dest => dest.AreaId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.Market, opt => opt.Ignore())
                .ForMember(dest => dest.Stalls, opt => opt.Ignore());

            CreateMap<UpdateAreaRequest, Area>()
                .ForMember(dest => dest.AreaId, opt => opt.Ignore())
                .ForMember(dest => dest.MarketId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.Market, opt => opt.Ignore())
                .ForMember(dest => dest.Stalls, opt => opt.Ignore());

            // Stall mappings
            CreateMap<Stall, StallDto>()
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Area != null ? src.Area.Name : null))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null));

            CreateMap<CreateStallDto, Stall>()
                .ForMember(dest => dest.StallId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Area, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.Contracts, opt => opt.Ignore())
                .ForMember(dest => dest.Issues, opt => opt.Ignore())
                .ForMember(dest => dest.Meters, opt => opt.Ignore())
                .ForMember(dest => dest.Requests, opt => opt.Ignore())
                .ForMember(dest => dest.Reviews, opt => opt.Ignore())
                .ForMember(dest => dest.ServiceRegistrations, opt => opt.Ignore())
                .ForMember(dest => dest.Violations, opt => opt.Ignore());

            CreateMap<UpdateStallDto, Stall>()
                .ForMember(dest => dest.StallId, opt => opt.Ignore())
                .ForMember(dest => dest.AreaId, opt => opt.Ignore())
                .ForMember(dest => dest.MapX, opt => opt.Ignore())
                .ForMember(dest => dest.MapY, opt => opt.Ignore())
                .ForMember(dest => dest.Width, opt => opt.Ignore())
                .ForMember(dest => dest.Height, opt => opt.Ignore())
                .ForMember(dest => dest.Rotation, opt => opt.Ignore())
                .ForMember(dest => dest.SvgPath, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Area, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.Contracts, opt => opt.Ignore())
                .ForMember(dest => dest.Issues, opt => opt.Ignore())
                .ForMember(dest => dest.Meters, opt => opt.Ignore())
                .ForMember(dest => dest.Requests, opt => opt.Ignore())
                .ForMember(dest => dest.Reviews, opt => opt.Ignore())
                .ForMember(dest => dest.ServiceRegistrations, opt => opt.Ignore())
                .ForMember(dest => dest.Violations, opt => opt.Ignore());

            // Notification mappings
            CreateMap<Notification, NotificationDto>();
        }
    }
}
