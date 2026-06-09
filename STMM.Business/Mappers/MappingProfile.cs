using AutoMapper;
using STMM.DataAccess.Entities;
using STMM.Business.DTOs.Violation;
using STMM.Business.DTOs.Auth;
using STMM.Business.DTOs.User;
using STMM.Business.DTOs.Notification;

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
            // Auth mappings
            CreateMap<STMM.DataAccess.Entities.User, UserDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.Name : "Unknown"));

            // Notification mappings
            CreateMap<Notification, NotificationDto>();
        }
    }
}
