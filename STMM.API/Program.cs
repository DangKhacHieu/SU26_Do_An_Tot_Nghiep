using Microsoft.EntityFrameworkCore;
using FluentValidation;
using AutoMapper;
using STMM.DataAccess.Data;
using STMM.DataAccess.UnitOfWork;
using STMM.Business.Mappers;
using STMM.Business.Interfaces;
using STMM.Business.Services;
using STMM.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Register AppDbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Unit of Work
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Register AutoMapper
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<MappingProfile>();
});

// Register FluentValidation (Scan all validators in the Business project)
builder.Services.AddValidatorsFromAssembly(typeof(MappingProfile).Assembly);

// Register Business Services
builder.Services.AddScoped<IViolationService, ViolationService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Register Exception Middleware at the beginning of the pipeline to catch all exceptions
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();