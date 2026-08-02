using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueMeterReadingPerDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM meter_readings
                        GROUP BY meter_id, recorded_at
                        HAVING COUNT(*) > 1
                    ) THEN
                        RAISE EXCEPTION 'Cannot create meter reading unique index: duplicate meter/date rows exist.';
                    END IF;
                END $$;
                """);

            migrationBuilder.CreateIndex(
                name: "meter_readings_meter_id_recorded_at_key",
                table: "meter_readings",
                columns: new[] { "meter_id", "recorded_at" },
                unique: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "meter_readings_meter_id_recorded_at_key",
                table: "meter_readings");

        }
    }
}
