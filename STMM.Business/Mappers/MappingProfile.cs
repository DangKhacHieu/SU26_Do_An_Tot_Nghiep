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
using STMM.Business.DTOs.Contract;
using STMM.Business.DTOs.Request;

using STMM.Business.DTOs.Market;
using STMM.Business.DTOs.Review;
using STMM.Business.DTOs.AuditLog;
using STMM.Business.DTOs.Feedback;
using STMM.Business.DTOs.Issue;

namespace STMM.Business.Mappers
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // AuditLog mapping
            CreateMap<AuditLog, AuditLogDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.Name : "Unknown"))
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User != null ? src.User.Email : "Unknown"))
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.User != null && src.User.Role != null ? src.User.Role.Name : "Unknown"));

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
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.Name : string.Empty))
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Stall != null ? src.Stall.Code : string.Empty))
                .ForMember(dest => dest.ViolationTypeName, opt => opt.MapFrom(src => src.ViolationType != null ? src.ViolationType.Name : string.Empty));

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

            // Infrastructure issue mappings
            CreateMap<Issue, IssueDto>()
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Stall != null ? src.Stall.Code : string.Empty))
                .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.Name : string.Empty))
                .ForMember(dest => dest.AssignedTaskId, opt => opt.MapFrom(src => src.StaffTasks.FirstOrDefault() != null ? src.StaffTasks.FirstOrDefault()!.TaskId : (int?)null))
                .ForMember(dest => dest.AssignedTaskStatus, opt => opt.MapFrom(src => src.StaffTasks.FirstOrDefault() != null ? src.StaffTasks.FirstOrDefault()!.Status : null));

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
                .ForMember(dest => dest.RequestPaidBy, opt => opt.MapFrom(src => src.Request != null ? src.Request.PaidBy : null))
                .ForMember(dest => dest.Materials, opt => opt.MapFrom(src => src.TaskMaterials))
                .ForMember(dest => dest.StallId, opt => opt.MapFrom(src => src.Request != null ? src.Request.StallId : (src.Issue != null ? src.Issue.StallId : (int?)null)))
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Request != null && src.Request.Stall != null ? src.Request.Stall.Code : (src.Issue != null && src.Issue.Stall != null ? src.Issue.Stall.Code : null)));

            CreateMap<StaffTask, TaskSummaryDto>()
                .ForMember(dest => dest.AssignedToName, opt => opt.MapFrom(src => src.AssignedToUser != null ? src.AssignedToUser.Name : string.Empty))
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Area != null ? src.Area.Name : string.Empty))
                .ForMember(dest => dest.StallId, opt => opt.MapFrom(src => src.Request != null ? src.Request.StallId : (src.Issue != null ? src.Issue.StallId : (int?)null)))
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Request != null && src.Request.Stall != null ? src.Request.Stall.Code : (src.Issue != null && src.Issue.Stall != null ? src.Issue.Stall.Code : null)));

            CreateMap<TaskMaterial, TaskMaterialDto>();

            // User and Role mappings
            CreateMap<Role, RoleDto>();
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.Name : string.Empty));
            CreateMap<User, UserDetailDto>()
                .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.Name : string.Empty))
                .ForMember(dest => dest.RoleDescription, opt => opt.MapFrom(src => src.Role != null ? src.Role.Description : string.Empty))
                .ForMember(dest => dest.BusinessName, opt => opt.MapFrom(src => src.Vendor != null ? src.Vendor.BusinessName : string.Empty));

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

            // Contract mappings
            CreateMap<Contract, ContractDto>()
                .ForMember(d => d.StallCode, o => o.MapFrom(s => s.Stall.Code))
                .ForMember(d => d.StallSize, o => o.MapFrom(s => s.Stall.Size))
                .ForMember(d => d.AreaName, o => o.MapFrom(s => s.Stall.Area.Name))
                .ForMember(d => d.MarketName, o => o.MapFrom(s => s.Stall.Area.Market.MarketName))
                .ForMember(d => d.VendorName, o => o.MapFrom(s => s.Vendor.User.Name))
                .ForMember(d => d.VendorEmail, o => o.MapFrom(s => s.Vendor.User.Email))
                .ForMember(d => d.VendorPhone, o => o.MapFrom(s => s.Vendor.User.Phone))
                .ForMember(d => d.VendorCccd, o => o.MapFrom(s => s.Vendor.User.Cccd))
                .ForMember(d => d.VendorAddress, o => o.MapFrom(s => s.Vendor.Address))
                .ForMember(d => d.VendorTaxCode, o => o.MapFrom(s => s.Vendor.TaxCode))
                .ForMember(d => d.VendorBusinessName, o => o.MapFrom(s => s.Vendor.BusinessName))
                .ForMember(d => d.VendorBankAccount, o => o.MapFrom(s => s.Vendor.BankAccount))
                .ForMember(d => d.VendorBankName, o => o.MapFrom(s => s.Vendor.BankName));

            CreateMap<ContractFile, ContractFileDto>();

            // Request mappings
            CreateMap<Request, RequestDto>()
                .ForMember(dest => dest.VendorName, opt => opt.MapFrom(src => src.Vendor != null && src.Vendor.User != null ? src.Vendor.User.Name : string.Empty))
                .ForMember(dest => dest.BusinessName, opt => opt.MapFrom(src => src.Vendor != null ? src.Vendor.BusinessName : string.Empty))
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Stall != null ? src.Stall.Code : string.Empty))
                .ForMember(dest => dest.InvoiceName, opt => opt.MapFrom(src => src.Invoice != null ? 
                    (src.Invoice.InvoiceDetails != null && src.Invoice.InvoiceDetails.Any(d => d.FeeType != null && (d.FeeType.Name.ToLower().Contains("phạt") || d.FeeType.Name.ToLower().Contains("penalty"))) ? "Hóa đơn tiền phạt" : 
                    (src.Invoice.InvoiceDetails != null && src.Invoice.InvoiceDetails.Count == 1 && !new[] { "điện", "nước", "rác", "bảo vệ", "thuê", "electric", "water", "waste", "rent", "security" }.Any(k => src.Invoice.InvoiceDetails.First().FeeType != null && src.Invoice.InvoiceDetails.First().FeeType.Name.ToLower().Contains(k))) ? src.Invoice.InvoiceDetails.First().FeeType.Name : 
                    $"Hóa đơn tháng {src.Invoice.Month}/{src.Invoice.Year}") : null))
                .ForMember(dest => dest.InvoiceType, opt => opt.MapFrom(src => src.Invoice != null ? 
                    (src.Invoice.InvoiceDetails != null && src.Invoice.InvoiceDetails.Any(d => d.FeeType != null && (d.FeeType.Name.ToLower().Contains("phạt") || d.FeeType.Name.ToLower().Contains("penalty"))) ? "Phạt vi phạm" : 
                    (src.Invoice.InvoiceDetails != null && src.Invoice.InvoiceDetails.Count == 1 && !new[] { "điện", "nước", "rác", "bảo vệ", "thuê", "electric", "water", "waste", "rent", "security" }.Any(k => src.Invoice.InvoiceDetails.First().FeeType != null && src.Invoice.InvoiceDetails.First().FeeType.Name.ToLower().Contains(k))) ? "Phát sinh" : 
                    "Định kỳ") : null))
                .ForMember(dest => dest.InvoiceMonthYear, opt => opt.MapFrom(src => src.Invoice != null ? $"Tháng {src.Invoice.Month}/{src.Invoice.Year}" : null))
                .ForMember(dest => dest.InvoiceTotalAmount, opt => opt.MapFrom(src => src.Invoice != null ? src.Invoice.TotalAmount : (decimal?)null))
                .ForMember(dest => dest.InvoiceStatus, opt => opt.MapFrom(src => src.Invoice != null ? src.Invoice.Status : null))
                .ForMember(dest => dest.ViolationTitle, opt => opt.MapFrom(src => src.Violation != null ? src.Violation.Title : null))
                .ForMember(dest => dest.ViolationFineAmount, opt => opt.MapFrom(src => src.Violation != null ? src.Violation.FineAmount : (decimal?)null))
                .ForMember(dest => dest.ViolationStatus, opt => opt.MapFrom(src => src.Violation != null ? src.Violation.Status : null));

            // Market mappings
            CreateMap<Market, MarketDto>()
                .ForMember(dest => dest.AreasCount, opt => opt.MapFrom(src => src.Areas.Count(a => a.IsDeleted != true)))
                .ForMember(dest => dest.StallsCount, opt => opt.MapFrom(src => src.Areas.Where(a => a.IsDeleted != true).SelectMany(a => a.Stalls).Count(s => s.IsDeleted != true)));

            CreateMap<Market, MarketMapDto>();
            CreateMap<Area, AreaMapDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null));
            CreateMap<Stall, StallMapDto>()
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Area != null ? src.Area.Name : null))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
                .ForMember(dest => dest.BusinessName, opt => opt.MapFrom(src => src.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true).Select(c => c.Vendor.BusinessName).FirstOrDefault()));

            CreateMap<Review, ReviewDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.Name : string.Empty))
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Stall != null ? src.Stall.Code : string.Empty))
                .ForMember(dest => dest.MarketName, opt => opt.MapFrom(src => src.Market != null ? src.Market.MarketName : string.Empty))
                .ForMember(dest => dest.Response, opt => opt.MapFrom(src => src.Response))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.RespondedAt, opt => opt.MapFrom(src => src.RespondedAt));

            // Feedback (Vendor respond to review) mappings
            CreateMap<Review, FeedbackDto>()
                .ForMember(dest => dest.FeedbackId, opt => opt.MapFrom(src => src.ReviewId))
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Comment))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.Name : string.Empty))
                .ForMember(dest => dest.StallCode, opt => opt.MapFrom(src => src.Stall != null ? src.Stall.Code : string.Empty))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt.HasValue ? src.CreatedAt.Value : DateTime.MinValue));

            CreateMap<CreateReviewRequest, Review>()
                .ForMember(dest => dest.ReviewId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Stall, opt => opt.Ignore())
                .ForMember(dest => dest.Market, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());

            // Stall highest-rated mapping
            CreateMap<Stall, HighestRatedStallDto>()
                .ForMember(dest => dest.AreaName, opt => opt.MapFrom(src => src.Area != null ? src.Area.Name : string.Empty))
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : string.Empty))
                .ForMember(dest => dest.AverageRating, opt => opt.Ignore());
        }
    }
}

