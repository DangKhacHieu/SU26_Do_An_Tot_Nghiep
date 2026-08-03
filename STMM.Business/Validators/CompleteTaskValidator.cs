using FluentValidation;
using STMM.Business.DTOs.Task;
using System;

namespace STMM.Business.Validators
{
    public class CompleteTaskValidator : AbstractValidator<CompleteTaskRequest>
    {
        public CompleteTaskValidator()
        {
            RuleFor(x => x.CompletionNotes)
                .MaximumLength(1000)
                .WithMessage("Completion notes cannot exceed 1000 characters.");
        }
    }
}
