using FluentValidation;
using STMM.Business.DTOs.Task;
using System;

namespace STMM.Business.Validators
{
    public class CompleteTaskValidator : AbstractValidator<CompleteTaskRequest>
    {
        public CompleteTaskValidator()
        {
            RuleFor(x => x.ImageAfterUrl)
                .Must(IsValidUrl)
                .When(x => !string.IsNullOrEmpty(x.ImageAfterUrl))
                .WithMessage("Image after must be a valid URL.");

            RuleFor(x => x.ImageBeforeUrl)
                .Must(IsValidUrl)
                .When(x => !string.IsNullOrEmpty(x.ImageBeforeUrl))
                .WithMessage("Image before must be a valid URL.");
        }

        private bool IsValidUrl(string? url)
        {
            return Uri.TryCreate(url, UriKind.Absolute, out _);
        }
    }
}
