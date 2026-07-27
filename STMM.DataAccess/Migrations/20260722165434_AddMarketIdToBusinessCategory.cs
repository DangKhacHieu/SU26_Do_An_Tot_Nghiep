using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketIdToBusinessCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "business_categories",
                type: "integer",
                nullable: true,
                comment: "Thuộc chợ nào (Nullable cho danh mục mặc định)");

            migrationBuilder.CreateIndex(
                name: "IX_business_categories_market_id",
                table: "business_categories",
                column: "market_id");

            migrationBuilder.AddForeignKey(
                name: "fk_business_categories_markets",
                table: "business_categories",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_business_categories_markets",
                table: "business_categories");

            migrationBuilder.DropIndex(
                name: "IX_business_categories_market_id",
                table: "business_categories");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "business_categories");
        }
    }
}
