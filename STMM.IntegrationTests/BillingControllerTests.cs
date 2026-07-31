using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using STMM.API;
using Xunit;

namespace STMM.IntegrationTests
{
    public class BillingControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public BillingControllerTests(CustomWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetInvoiceDetail_WithoutAuth_ReturnsUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/staff/billing/invoices/1");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
    }
}
