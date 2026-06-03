using FluentAssertions;
using FluentValidation.TestHelper;
using STMM.Business.DTOs.Violation;
using STMM.Business.Validators;

namespace STMM.Tests.Validators
{
    public class CreateViolationRequestValidatorTests
    {
        private readonly CreateViolationRequestValidator _validator;

        public CreateViolationRequestValidatorTests()
        {
            _validator = new CreateViolationRequestValidator();
        }

        private static CreateViolationRequest CreateValidRequest() => new()
        {
            StallId = 1,
            ViolationTypeId = 1,
            Title = "Vi phạm vệ sinh",
            Description = "Sạp hàng không đảm bảo vệ sinh an toàn thực phẩm",
            ImageUrl = "https://storage.example.com/violations/img001.jpg",
            FineAmount = 500000
        };

        [Fact]
        public void Validate_ValidRequest_ShouldPass()
        {
            // Arrange
            var request = CreateValidRequest();

            // Act
            var result = _validator.TestValidate(request);

            // Assert
            result.ShouldNotHaveAnyValidationErrors();
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void Validate_EmptyTitle_ShouldFail(string? title)
        {
            var request = CreateValidRequest();
            request.Title = title!;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Title);
        }

        [Fact]
        public void Validate_TitleTooLong_ShouldFail()
        {
            var request = CreateValidRequest();
            request.Title = new string('A', 501);

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Title);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void Validate_EmptyDescription_ShouldFail(string? description)
        {
            var request = CreateValidRequest();
            request.Description = description!;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.Description);
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void Validate_EmptyImageUrl_ShouldFail(string? imageUrl)
        {
            var request = CreateValidRequest();
            request.ImageUrl = imageUrl!;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.ImageUrl);
        }

        [Fact]
        public void Validate_InvalidImageUrlFormat_ShouldFail()
        {
            var request = CreateValidRequest();
            request.ImageUrl = "not-a-valid-url";

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.ImageUrl);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Validate_InvalidStallId_ShouldFail(int stallId)
        {
            var request = CreateValidRequest();
            request.StallId = stallId;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.StallId);
        }

        [Fact]
        public void Validate_NegativeFineAmount_ShouldFail()
        {
            var request = CreateValidRequest();
            request.FineAmount = -100;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.FineAmount);
        }

        [Fact]
        public void Validate_ZeroFineAmount_ShouldPass()
        {
            var request = CreateValidRequest();
            request.FineAmount = 0;

            var result = _validator.TestValidate(request);

            result.ShouldNotHaveValidationErrorFor(x => x.FineAmount);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Validate_InvalidViolationTypeId_ShouldFail(int violationTypeId)
        {
            var request = CreateValidRequest();
            request.ViolationTypeId = violationTypeId;

            var result = _validator.TestValidate(request);

            result.ShouldHaveValidationErrorFor(x => x.ViolationTypeId);
        }
    }
}
