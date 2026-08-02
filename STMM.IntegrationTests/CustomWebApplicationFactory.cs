using System;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Data.Common;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;

namespace STMM.IntegrationTests
{
    public class CustomWebApplicationFactory<TProgram>
        : WebApplicationFactory<TProgram> where TProgram : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                var descriptors = services.Where(d => 
                    d.ServiceType.FullName != null && 
                    (d.ServiceType.FullName.Contains("DbContextOptions") || 
                     d.ServiceType.FullName.Contains("Npgsql") || 
                     d.ServiceType.FullName.Contains("DbConnection"))
                ).ToList();

                foreach (var descriptor in descriptors)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryDbForTesting");
                });

                var sp = services.BuildServiceProvider();

                using (var scope = sp.CreateScope())
                {
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AppDbContext>();

                    db.Database.EnsureCreated();

                    try
                    {
                        InitializeDbForTests(db);
                    }
                    catch (Exception)
                    {
                        // Log error
                    }
                }
            });
        }

        private void InitializeDbForTests(AppDbContext db)
        {
            // Add some test data
            if (!db.Markets.Any())
            {
                db.Markets.Add(new Market { MarketId = 1, MarketName = "Market 1", Address = "Address 1", Status = "Active" });
                db.Markets.Add(new Market { MarketId = 2, MarketName = "Market 2", Address = "Address 2", Status = "Active" });
                
                db.Users.Add(new User { UserId = 1, Name = "Admin User", Phone = "0123456780", RoleId = 1, MarketId = 1 });
                db.Users.Add(new User { UserId = 2, Name = "Accountant User", Phone = "0123456789", RoleId = 4, MarketId = 1 });
                
                db.Areas.Add(new Area { AreaId = 1, Name = "Khu A", MarketId = 1 });
                db.Stalls.Add(new Stall { StallId = 1, Code = "A1", AreaId = 1, CategoryId = 1 });
                db.Contracts.Add(new Contract { ContractId = 1, StallId = 1, VendorId = 1, Status = "Active" });
                
                db.FeeTypes.Add(new FeeType { FeeTypeId = 1, Name = "Rent" });
                db.FeeTypes.Add(new FeeType { FeeTypeId = 2, Name = "Electricity" });
                db.FeeTypes.Add(new FeeType { FeeTypeId = 3, Name = "Water" });
                db.FeeTypes.Add(new FeeType { FeeTypeId = 4, Name = "Trash" });

                db.Invoices.Add(new Invoice 
                { 
                    InvoiceId = 1, 
                    ContractId = 1, 
                    Month = 5, 
                    Year = 2026, 
                    TotalAmount = 1000000, 
                    Status = "Unpaid", 
                    InvoiceType = "Periodic" 
                });
                
                db.SaveChanges();
            }
        }
    }
}
