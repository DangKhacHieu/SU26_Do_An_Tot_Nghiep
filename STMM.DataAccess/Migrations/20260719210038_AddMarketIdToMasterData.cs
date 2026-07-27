using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketIdToMasterData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropUniqueConstraint(
                name: "system_configs_config_key_key",
                table: "system_configs");

            migrationBuilder.DropUniqueConstraint(
                name: "repair_prices_item_name_key",
                table: "repair_prices");

            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "violation_types",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "system_configs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "services",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "repair_prices",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "market_id",
                table: "fee_types",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_violation_types_market_id",
                table: "violation_types",
                column: "market_id");

            migrationBuilder.CreateIndex(
                name: "idx_system_configs_market_key",
                table: "system_configs",
                columns: new[] { "market_id", "config_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_services_market_id",
                table: "services",
                column: "market_id");

            migrationBuilder.CreateIndex(
                name: "idx_repair_prices_market_item",
                table: "repair_prices",
                columns: new[] { "market_id", "item_name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fee_types_market_id",
                table: "fee_types",
                column: "market_id");

            migrationBuilder.AddForeignKey(
                name: "fk_fee_types_markets",
                table: "fee_types",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id");

            migrationBuilder.AddForeignKey(
                name: "fk_repair_prices_markets",
                table: "repair_prices",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id");

            migrationBuilder.AddForeignKey(
                name: "fk_services_markets",
                table: "services",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id");

            migrationBuilder.AddForeignKey(
                name: "fk_system_configs_markets",
                table: "system_configs",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id");

            migrationBuilder.AddForeignKey(
                name: "fk_violation_types_markets",
                table: "violation_types",
                column: "market_id",
                principalTable: "markets",
                principalColumn: "market_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_fee_types_markets",
                table: "fee_types");

            migrationBuilder.DropForeignKey(
                name: "fk_repair_prices_markets",
                table: "repair_prices");

            migrationBuilder.DropForeignKey(
                name: "fk_services_markets",
                table: "services");

            migrationBuilder.DropForeignKey(
                name: "fk_system_configs_markets",
                table: "system_configs");

            migrationBuilder.DropForeignKey(
                name: "fk_violation_types_markets",
                table: "violation_types");

            migrationBuilder.DropIndex(
                name: "IX_violation_types_market_id",
                table: "violation_types");

            migrationBuilder.DropIndex(
                name: "idx_system_configs_market_key",
                table: "system_configs");

            migrationBuilder.DropIndex(
                name: "IX_services_market_id",
                table: "services");

            migrationBuilder.DropIndex(
                name: "idx_repair_prices_market_item",
                table: "repair_prices");

            migrationBuilder.DropIndex(
                name: "IX_fee_types_market_id",
                table: "fee_types");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "violation_types");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "system_configs");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "services");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "repair_prices");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "fee_types");

            migrationBuilder.CreateIndex(
                name: "system_configs_config_key_key",
                table: "system_configs",
                column: "config_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "repair_prices_item_name_key",
                table: "repair_prices",
                column: "item_name",
                unique: true);
        }
    }
}
