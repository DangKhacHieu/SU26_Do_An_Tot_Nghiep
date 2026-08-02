using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using STMM.DataAccess.Data;

#nullable disable

namespace STMM.DataAccess.Migrations;

/// <summary>
/// Prevents two non-terminal tasks from referencing the same Issue or Request.
/// Before applying this migration, inspect and resolve duplicate active rows.
/// </summary>
[Migration("20260730100000_AddUniqueActiveTaskSource")]
[DbContext(typeof(AppDbContext))]
public partial class AddUniqueActiveTaskSource : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM staff_tasks
                    WHERE issue_id IS NOT NULL
                      AND (status IS NULL OR status NOT IN ('Completed', 'Cancelled'))
                    GROUP BY issue_id
                    HAVING COUNT(*) > 1
                ) THEN
                    RAISE EXCEPTION 'Cannot create active issue task unique index: duplicate active issue tasks exist.';
                END IF;

                IF EXISTS (
                    SELECT 1
                    FROM staff_tasks
                    WHERE request_id IS NOT NULL
                      AND (status IS NULL OR status NOT IN ('Completed', 'Cancelled'))
                    GROUP BY request_id
                    HAVING COUNT(*) > 1
                ) THEN
                    RAISE EXCEPTION 'Cannot create active request task unique index: duplicate active request tasks exist.';
                END IF;
            END $$;
            """);

        migrationBuilder.CreateIndex(
            name: "ux_staff_tasks_active_issue",
            table: "staff_tasks",
            column: "issue_id",
            unique: true,
            filter: "issue_id IS NOT NULL AND (status IS NULL OR status NOT IN ('Completed', 'Cancelled'))");

        migrationBuilder.CreateIndex(
            name: "ux_staff_tasks_active_request",
            table: "staff_tasks",
            column: "request_id",
            unique: true,
            filter: "request_id IS NOT NULL AND (status IS NULL OR status NOT IN ('Completed', 'Cancelled'))");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ux_staff_tasks_active_issue",
            table: "staff_tasks");

        migrationBuilder.DropIndex(
            name: "ux_staff_tasks_active_request",
            table: "staff_tasks");
    }
}
