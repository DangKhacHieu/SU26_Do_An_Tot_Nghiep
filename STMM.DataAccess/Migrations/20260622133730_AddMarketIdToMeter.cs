using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketIdToMeter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "meters",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                comment: "Thuộc chợ nào");

            migrationBuilder.CreateIndex(
                name: "idx_meters_market_id",
                table: "meters",
                column: "market_id");

            migrationBuilder.Sql("UPDATE meters SET market_id = a.market_id FROM stalls s JOIN areas a ON s.area_id = a.area_id WHERE meters.stall_id = s.stall_id;");
            migrationBuilder.Sql("UPDATE meters SET market_id = (SELECT market_id FROM markets LIMIT 1) WHERE market_id = 0;");

            migrationBuilder.AddForeignKey(
                name: "fk_meters_markets",
                table: "meters",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_meters_markets",
                table: "meters");

            migrationBuilder.DropIndex(
                name: "idx_meters_market_id",
                table: "meters");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "meters");
        }
    }
}
