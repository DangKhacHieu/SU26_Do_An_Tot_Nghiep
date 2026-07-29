using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AlterBusinessCategoryCodeUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE business_categories DROP CONSTRAINT IF EXISTS business_categories_code_key;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS business_categories_code_key;");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    ALTER TABLE reviews ALTER COLUMN stall_id DROP NOT NULL;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='market_id') THEN
        ALTER TABLE reviews ADD COLUMN market_id integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='responded_at') THEN
        ALTER TABLE reviews ADD COLUMN responded_at timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='response') THEN
        ALTER TABLE reviews ADD COLUMN response text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='status') THEN
        ALTER TABLE reviews ADD COLUMN status text NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_reviews_market_id') THEN
        CREATE INDEX idx_reviews_market_id ON reviews (market_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_reviews_markets' AND table_name='reviews') THEN
        ALTER TABLE reviews ADD CONSTRAINT fk_reviews_markets FOREIGN KEY (market_id) REFERENCES markets(market_id);
    END IF;
END $$;");

            migrationBuilder.CreateIndex(
                name: "business_categories_code_key",
                table: "business_categories",
                columns: new[] { "code", "market_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_reviews_markets",
                table: "reviews");

            migrationBuilder.DropIndex(
                name: "idx_reviews_market_id",
                table: "reviews");

            migrationBuilder.DropIndex(
                name: "business_categories_code_key",
                table: "business_categories");

            migrationBuilder.DropColumn(
                name: "market_id",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "responded_at",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "response",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "status",
                table: "reviews");

            migrationBuilder.AlterColumn<int>(
                name: "stall_id",
                table: "reviews",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                comment: "Đánh giá sạp nào",
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true,
                oldComment: "Đánh giá sạp nào (Nullable nếu đánh giá chợ)");

            migrationBuilder.CreateIndex(
                name: "business_categories_code_key",
                table: "business_categories",
                column: "code",
                unique: true);
        }
    }
}
