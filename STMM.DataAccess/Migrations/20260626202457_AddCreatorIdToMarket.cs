using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatorIdToMarket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "creator_id",
                table: "markets",
                type: "integer",
                nullable: true,
                comment: "Quản lý đã tạo ra chợ này");

            migrationBuilder.CreateIndex(
                name: "IX_markets_creator_id",
                table: "markets",
                column: "creator_id");

            migrationBuilder.AddForeignKey(
                name: "fk_markets_users_creator",
                table: "markets",
                column: "creator_id",
                principalTable: "users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_markets_users_creator",
                table: "markets");

            migrationBuilder.DropIndex(
                name: "IX_markets_creator_id",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "creator_id",
                table: "markets");
        }
    }
}
