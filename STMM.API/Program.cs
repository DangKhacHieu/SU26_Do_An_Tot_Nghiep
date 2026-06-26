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

// Load .env file by traversing up the directory tree to find it
var currentDir = Directory.GetCurrentDirectory();
string? dotenvPath = null;
var dir = new DirectoryInfo(currentDir);
while (dir != null)
{
    var testPath = Path.Combine(dir.FullName, ".env");
    if (File.Exists(testPath))
    {
        dotenvPath = testPath;
        break;
    }
    dir = dir.Parent;
}

if (dotenvPath != null)
{
    Console.WriteLine($"[INFO] Loaded configuration from env file: {dotenvPath}");
    foreach (var line in File.ReadAllLines(dotenvPath))
    {
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            continue;

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex > 0)
        {
            var envKey = line.Substring(0, separatorIndex).Trim();
            var value = line.Substring(separatorIndex + 1).Trim();
            
            if (value.StartsWith("\"") && value.EndsWith("\"") && value.Length >= 2)
            {
                value = value.Substring(1, value.Length - 2);
            }
            else if (value.StartsWith("'") && value.EndsWith("'") && value.Length >= 2)
            {
                value = value.Substring(1, value.Length - 2);
            }
            
            System.Environment.SetEnvironmentVariable(envKey, value);
        }
    }
}
else
{
    Console.WriteLine("[WARN] No .env file found in directory tree.");
}

var builder = WebApplication.CreateBuilder(args);

// Explicitly override configuration with programmatic environment variables if they exist
var envConnection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
if (!string.IsNullOrEmpty(envConnection))
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] = envConnection;
    Console.WriteLine("[INFO] Database connection string successfully overridden from environment variables.");
}

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

// Accountant Portal Services
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IFinancialConfigService, FinancialConfigService>();
builder.Services.AddScoped<IRepairPriceService, RepairPriceService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();

// Other Services from Merge_Code
builder.Services.AddScoped<IStaffTaskService, StaffTaskService>();
builder.Services.AddScoped<IQuotationService, QuotationService>();
builder.Services.AddScoped<IMeterReadingService, MeterReadingService>();
builder.Services.AddScoped<IMeterService, MeterService>();
builder.Services.AddScoped<IFileStorageService, CloudinaryStorageService>();
builder.Services.AddScoped<IVendorServiceManagement, VendorServiceManagement>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFaqService, FaqService>();
builder.Services.AddScoped<IContentService, ContentService>();
builder.Services.AddScoped<IAreaService, AreaService>();
builder.Services.AddScoped<IStallService, StallService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IBusinessCategoryService, BusinessCategoryService>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IRequestService, RequestService>();
builder.Services.AddScoped<IVendorRequestService, VendorRequestService>();
builder.Services.AddScoped<IVendorViolationService, VendorViolationService>();
builder.Services.AddScoped<IMarketService, MarketService>();
builder.Services.AddScoped<IReviewService, ReviewService>();

// Register Background Services
builder.Services.AddHostedService<STMM.API.BackgroundServices.MonthlyBillingWorker>();

// 1. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(option =>
    {
        option.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        option.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
        option.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
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

// 5. Swagger Configuration & Bearer JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
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

// Phân quyền
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();