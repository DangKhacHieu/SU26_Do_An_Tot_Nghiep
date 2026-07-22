using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddQuotationDecisionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "payer_contract_clause",
                table: "requests",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                comment: "Điều khoản hợp đồng làm căn cứ xác định bên chịu phí");

            migrationBuilder.AddColumn<string>(
                name: "payer_decision_note",
                table: "requests",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                comment: "Ghi chú cho quyết định xử lý báo giá gần nhất của Manager");

            migrationBuilder.AddColumn<string>(
                name: "vendor_reject_reason",
                table: "requests",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                comment: "Lý do Vendor từ chối báo giá gần nhất");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "payer_contract_clause",
                table: "requests");

            migrationBuilder.DropColumn(
                name: "payer_decision_note",
                table: "requests");

            migrationBuilder.DropColumn(
                name: "vendor_reject_reason",
                table: "requests");
        }
    }
}
