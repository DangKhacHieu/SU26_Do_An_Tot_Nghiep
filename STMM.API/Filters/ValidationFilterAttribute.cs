using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace STMM.API.Filters
{
    public class ValidationFilterAttribute : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                // Retrieve all validation errors
                var errors = context.ModelState
                    .Where(e => e.Value != null && e.Value.Errors.Count > 0)
                    .SelectMany(kvp => kvp.Value!.Errors.Select(e => new
                    {
                        Field = kvp.Key,
                        Error = e.ErrorMessage
                    }))
                    .ToList();

                var firstError = errors.FirstOrDefault()?.Error;
                var response = new
                {
                    Status = 400,
                    Message = !string.IsNullOrEmpty(firstError) ? firstError : "Dữ liệu đầu vào không hợp lệ",
                    Errors = errors
                };

                context.Result = new BadRequestObjectResult(response);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
            // Do nothing after the action executes
        }
    }
}
