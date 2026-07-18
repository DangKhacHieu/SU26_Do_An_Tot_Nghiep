using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStallCodeUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropUniqueConstraint(
                name: "stalls_code_key",
                table: "stalls");

            migrationBuilder.CreateIndex(
                name: "stalls_code_key",
                table: "stalls",
                column: "code");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "stalls_code_key",
                table: "stalls");

            migrationBuilder.AddUniqueConstraint(
                name: "stalls_code_key",
                table: "stalls",
                column: "code");
        }
    }
}
