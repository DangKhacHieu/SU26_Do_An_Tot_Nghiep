using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class Phase2_FinancialDataStandardization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "requests",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "payments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedAt",
                table: "payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VerifiedByUserId",
                table: "payments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "original_payment_id",
                table: "payments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "rejected_at",
                table: "payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "rejected_by_user_id",
                table: "payments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "payments",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceType",
                table: "invoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "violation_id",
                table: "invoices",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "invoices",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.CreateIndex(
                name: "IX_payments_original_payment_id",
                table: "payments",
                column: "original_payment_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_violation_id",
                table: "invoices",
                column: "violation_id");

            migrationBuilder.AddForeignKey(
                name: "fk_invoices_violations",
                table: "invoices",
                column: "violation_id",
                principalTable: "violations",
                principalColumn: "violation_id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_payments_original_payment",
                table: "payments",
                column: "original_payment_id",
                principalTable: "payments",
                principalColumn: "payment_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_invoices_violations",
                table: "invoices");

            migrationBuilder.DropForeignKey(
                name: "fk_payments_original_payment",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "IX_payments_original_payment_id",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "IX_invoices_violation_id",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "requests");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "VerifiedAt",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "VerifiedByUserId",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "original_payment_id",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "rejected_at",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "rejected_by_user_id",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "InvoiceType",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "violation_id",
                table: "invoices");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "invoices");
        }
    }
}
