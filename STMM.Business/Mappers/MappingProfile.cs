using AutoMapper;
using STMM.DataAccess.Entities;
using STMM.Business.DTOs.Violation;
using STMM.Business.DTOs.Area;
using STMM.Business.DTOs.Stall;

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
                .ForMember(dest => dest.Status, opt => opt.Ignore())
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
        }
    }
}
