using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddMeterNullableStallAndUserMarketId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_meters_stalls",
                table: "meters");

            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "users",
                type: "integer",
                nullable: true,
                comment: "Thuộc chợ nào (nullable)");

            migrationBuilder.AlterColumn<int>(
                name: "stall_id",
                table: "meters",
                type: "integer",
                nullable: true,
                comment: "Lắp đặt tại sạp nào",
                oldClrType: typeof(int),
                oldType: "integer",
                oldComment: "Lắp đặt tại sạp nào");

            migrationBuilder.CreateIndex(
                name: "idx_users_market_id",
                table: "users",
                column: "market_id");

            migrationBuilder.AddForeignKey(
                name: "fk_meters_stalls",
                table: "meters",
                column: "stall_id",
                principalTable: "stalls",
                principalColumn: "stall_id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_users_markets",
                table: "users",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_meters_stalls",
                table: "meters");

            migrationBuilder.DropForeignKey(
                name: "fk_users_markets",
                table: "users");

            migrationBuilder.DropIndex(
                name: "idx_users_market_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "users");

            migrationBuilder.AlterColumn<int>(
                name: "stall_id",
                table: "meters",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                comment: "Lắp đặt tại sạp nào",
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true,
                oldComment: "Lắp đặt tại sạp nào");

            migrationBuilder.AddForeignKey(
                name: "fk_meters_stalls",
                table: "meters",
                column: "stall_id",
                principalTable: "stalls",
                principalColumn: "stall_id");
        }
    }
}
