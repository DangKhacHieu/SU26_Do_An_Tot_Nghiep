using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AlterMeterSerialNumberUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE meters DROP CONSTRAINT IF EXISTS meters_serial_number_key;");

            migrationBuilder.CreateIndex(
                name: "meters_serial_number_key",
                table: "meters",
                columns: new[] { "market_id", "serial_number" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "meters_serial_number_key",
                table: "meters");

            migrationBuilder.Sql("ALTER TABLE meters ADD CONSTRAINT meters_serial_number_key UNIQUE (serial_number);");
        }
    }
}
