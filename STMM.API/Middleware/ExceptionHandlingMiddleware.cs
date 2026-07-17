using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using STMM.Business.Exceptions;

namespace STMM.API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "A system error occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var problemDetails = new ProblemDetails
            {
                Instance = context.Request.Path
            };

            switch (exception)
            {
                case NotFoundException notFoundEx:
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    problemDetails.Status = StatusCodes.Status404NotFound;
                    problemDetails.Title = "Resource Not Found";
                    problemDetails.Detail = notFoundEx.Message;
                    break;

                case BadRequestException badRequestEx:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    problemDetails.Status = StatusCodes.Status400BadRequest;
                    problemDetails.Title = "Bad Request";
                    problemDetails.Detail = badRequestEx.Message;
                    break;

                default:
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    problemDetails.Status = StatusCodes.Status500InternalServerError;
                    problemDetails.Title = "Internal Server Error";

                    var isDbError = exception.Message.Contains("transient") || 
                                    exception.Message.Contains("Npgsql") || 
                                    exception.Message.Contains("PostgreSQL") || 
                                    (exception.InnerException != null && (
                                        exception.InnerException.Message.Contains("Npgsql") ||
                                        exception.InnerException.Message.Contains("Connection") ||
                                        exception.InnerException.Message.Contains("Socket")
                                    ));

                    if (isDbError)
                    {
                        problemDetails.Detail = "Database connection failed. Please ensure the database server is running.";
                    }
                    else if (_env.IsDevelopment())
                    {
                        var inner = exception.InnerException != null
                            ? $"\nInnerException: {exception.InnerException.Message}\n{exception.InnerException.StackTrace}"
                            : string.Empty;
                        problemDetails.Detail = $"{exception.Message} \n {exception.StackTrace}{inner}";
                    }
                    else
                    {
                        problemDetails.Detail = "An unexpected error occurred. Please contact the administrator.";
                    }
                    break;
            }

            var result = JsonSerializer.Serialize(problemDetails);
            await context.Response.WriteAsync(result);
        }
    }
}
