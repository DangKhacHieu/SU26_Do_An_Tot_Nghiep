using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketCustomShapes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {


            migrationBuilder.AddColumn<double>(
                name: "MaxX",
                table: "markets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MaxY",
                table: "markets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MinX",
                table: "markets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MinY",
                table: "markets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "markets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SvgPath",
                table: "markets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SvgPath",
                table: "areas",
                type: "text",
                nullable: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_meters_stalls",
                table: "meters");

            migrationBuilder.DropColumn(
                name: "bank_account",
                table: "vendors");

            migrationBuilder.DropColumn(
                name: "bank_name",
                table: "vendors");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "requests");

            migrationBuilder.DropColumn(
                name: "MaxX",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "MaxY",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "MinX",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "MinY",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "SvgPath",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "size",
                table: "markets");

            migrationBuilder.DropColumn(
                name: "SvgPath",
                table: "areas");

            migrationBuilder.DropColumn(
                name: "size",
                table: "areas");

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
