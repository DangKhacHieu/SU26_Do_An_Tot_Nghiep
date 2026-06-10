using Microsoft.EntityFrameworkCore;
using FluentValidation;
using AutoMapper;
using STMM.DataAccess.Data;
using STMM.DataAccess.IRepositories;
using STMM.DataAccess.Repositories;
using STMM.Business.Mappers;
using STMM.Business.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using STMM.Business.Services;
using STMM.API.Middleware;
using System.Text.Json.Serialization;
using System.IO;

// Load .env file if it exists in the current directory or parent solution directory
var currentDir = Directory.GetCurrentDirectory();
var dotenvPath = Path.Combine(currentDir, ".env");
if (!File.Exists(dotenvPath))
{
    var parentDir = Directory.GetParent(currentDir)?.FullName;
    if (parentDir != null)
    {
        dotenvPath = Path.Combine(parentDir, ".env");
    }
}

if (File.Exists(dotenvPath))
{
    foreach (var line in File.ReadAllLines(dotenvPath))
    {
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;
        var parts = line.Split('=', 2);
        if (parts.Length == 2)
        {
            var envKey = parts[0].Trim();
            var envVal = parts[1].Trim();
            Environment.SetEnvironmentVariable(envKey, envVal);
        }
    }
}

var builder = WebApplication.CreateBuilder(args);

// Register AppDbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register MemoryCache
builder.Services.AddMemoryCache();

// Register Repositories
builder.Services.AddScoped<IAreaRepository, AreaRepository>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IBusinessCategoryRepository, BusinessCategoryRepository>();
builder.Services.AddScoped<IContractRepository, ContractRepository>();
builder.Services.AddScoped<IContractFileRepository, ContractFileRepository>();
builder.Services.AddScoped<IFaqRepository, FaqRepository>();
builder.Services.AddScoped<IFeeTypeRepository, FeeTypeRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IInvoiceDetailRepository, InvoiceDetailRepository>();
builder.Services.AddScoped<IIssueRepository, IssueRepository>();
builder.Services.AddScoped<IMarketRepository, MarketRepository>();
builder.Services.AddScoped<IMeterRepository, MeterRepository>();
builder.Services.AddScoped<IMeterReadingRepository, MeterReadingRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IRepairPriceRepository, RepairPriceRepository>();
builder.Services.AddScoped<IRequestRepository, RequestRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();
builder.Services.AddScoped<IServiceRegistrationRepository, ServiceRegistrationRepository>();
builder.Services.AddScoped<IStaffTaskRepository, StaffTaskRepository>();
builder.Services.AddScoped<IStallRepository, StallRepository>();
builder.Services.AddScoped<ISystemConfigRepository, SystemConfigRepository>();
builder.Services.AddScoped<ITaskMaterialRepository, TaskMaterialRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IVendorRepository, VendorRepository>();
builder.Services.AddScoped<IViolationRepository, ViolationRepository>();
builder.Services.AddScoped<IViolationTypeRepository, ViolationTypeRepository>();

// Register AutoMapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<MappingProfile>();
});

// Register FluentValidation (Scan all validators in the Business project)
builder.Services.AddValidatorsFromAssembly(typeof(MappingProfile).Assembly);

// Register Business Services
builder.Services.AddScoped<IViolationService, ViolationService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IBillingService, BillingService>();
builder.Services.AddScoped<IIssueService, IssueService>();
builder.Services.AddScoped<IStallTaskService, StallTaskService>();
builder.Services.AddScoped<IStaffTaskService, StaffTaskService>();
builder.Services.AddScoped<IQuotationService, QuotationService>();
builder.Services.AddScoped<IMeterReadingService, MeterReadingService>();
builder.Services.AddScoped<IFileStorageService, CloudinaryStorageService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFaqService, FaqService>();
builder.Services.AddScoped<IContentService, ContentService>();
builder.Services.AddScoped<IAreaService, AreaService>();
builder.Services.AddScoped<IStallService, StallService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IBusinessCategoryService, BusinessCategoryService>();


// 1. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(option =>
    {
        option.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        option.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    });

// 4. CORS Policy (Cho phép React Client kết nối)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 5. Swagger Configuration & Bearer JWT (Để dạng comment chờ login)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    /*
    // Cần cài đặt Package: Microsoft.AspNetCore.Authentication.JwtBearer
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhập: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
    */
});

// 3. JWT Authentication & Authorization
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = System.Text.Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "Bearer";
    options.DefaultChallengeScheme = "Bearer";
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization();



// 6. EPPlus Excel License (Để dạng comment chờ sử dụng Excel)
// Cần cài đặt Package: EPPlus
// OfficeOpenXml.ExcelPackage.License.SetNonCommercialOrganization("STMM");

// 7. SignalR Configuration (Để dạng comment chờ notification)
// builder.Services.AddSignalR();

var app = builder.Build();

// Register Exception Middleware at the beginning of the pipeline to catch all exceptions
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Kích hoạt CORS (Phải đặt trước Auth)
app.UseCors("AllowReact");

// Phân quyền (Mở comment UseAuthentication khi có chức năng login)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();