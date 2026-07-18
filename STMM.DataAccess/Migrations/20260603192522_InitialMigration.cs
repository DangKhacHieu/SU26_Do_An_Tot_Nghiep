using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace STMM.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "business_categories",
                columns: table => new
                {
                    category_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh ngành hàng")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    code = table.Column<string>(type: "text", nullable: false, comment: "Mã code ngành hàng (VD: FOOD, FASHION)"),
                    name = table.Column<string>(type: "text", nullable: false, comment: "Tên ngành hàng (VD: Thực phẩm tươi sống, Quần áo)"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết và các quy định riêng cho ngành hàng này"),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true, comment: "Trạng thái hoạt động"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("business_categories_pkey", x => x.category_id);
                },
                comment: "Danh mục ngành hàng kinh doanh");

            migrationBuilder.CreateTable(
                name: "fee_types",
                columns: table => new
                {
                    fee_type_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã loại phí")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    name = table.Column<string>(type: "text", nullable: false, comment: "Tên loại phí (Thuê sạp, Điện, Nước, Phạt...)"),
                    unit = table.Column<string>(type: "text", nullable: true, comment: "Đơn vị tính (kWh, m³, tháng)"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết loại phí")
                },
                constraints: table =>
                {
                    table.PrimaryKey("fee_types_pkey", x => x.fee_type_id);
                },
                comment: "Các loại phí trong hệ thống");

            migrationBuilder.CreateTable(
                name: "markets",
                columns: table => new
                {
                    market_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh chợ")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    market_name = table.Column<string>(type: "text", nullable: false, comment: "Tên chợ"),
                    address = table.Column<string>(type: "text", nullable: true, comment: "Địa chỉ chợ"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Ngày khởi tạo"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false, comment: "Đánh dấu xóa mềm")
                },
                constraints: table =>
                {
                    table.PrimaryKey("markets_pkey", x => x.market_id);
                },
                comment: "Danh mục chợ");

            migrationBuilder.CreateTable(
                name: "repair_prices",
                columns: table => new
                {
                    repair_price_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh hạng mục giá sửa chữa")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    item_name = table.Column<string>(type: "text", nullable: false, comment: "Tên vật tư/thiết bị (VD: Bóng đèn tuýp, Vòi nước inox). Dòng đặc biệt \"Vật tư khác\" dùng khi vật tư ngoài danh mục — Staff tự nhập đơn giá"),
                    unit = table.Column<string>(type: "text", nullable: false, comment: "Đơn vị tính (Cái, Mét, Bộ, Công...)"),
                    price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Đơn giá áp dụng (VNĐ). Bằng 0 nếu là dòng \"Vật tư khác\" — Staff override khi chọn"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết quy cách vật tư"),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true, comment: "Trạng thái hoạt động (ẩn/hiện khỏi danh sách chọn)"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("repair_prices_pkey", x => x.repair_price_id);
                },
                comment: "Danh mục đơn giá vật tư sửa chữa");

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    role_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh vai trò hệ thống")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    name = table.Column<string>(type: "text", nullable: false, comment: "Tên vai trò (Admin, Manager, Accountant, Staff, Vendor, Customer)"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết phạm vi quyền hạn")
                },
                constraints: table =>
                {
                    table.PrimaryKey("roles_pkey", x => x.role_id);
                },
                comment: "Phân hệ phân quyền & định danh (roles)");

            migrationBuilder.CreateTable(
                name: "violation_types",
                columns: table => new
                {
                    violation_type_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã loại vi phạm")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    name = table.Column<string>(type: "text", nullable: false, comment: "Tên loại vi phạm (VD: Lấn chiếm, Vệ sinh, PCCC, Kinh doanh trái phép)"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết loại vi phạm"),
                    default_fine = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true, defaultValueSql: "0", comment: "Mức phạt mặc định theo loại (VNĐ)"),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true, comment: "Đánh dấu ẩn/hiện loại vi phạm")
                },
                constraints: table =>
                {
                    table.PrimaryKey("violation_types_pkey", x => x.violation_type_id);
                },
                comment: "Danh mục loại vi phạm");

            migrationBuilder.CreateTable(
                name: "areas",
                columns: table => new
                {
                    area_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã khu vực")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    market_id = table.Column<int>(type: "integer", nullable: false, comment: "Thuộc chợ nào"),
                    category_id = table.Column<int>(type: "integer", nullable: true, comment: "Ngành hàng chủ đạo của khu vực này (Tùy chọn)"),
                    name = table.Column<string>(type: "text", nullable: false, comment: "Tên khu vực (VD: \"Khu A - Thực phẩm\")"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả khu vực"),
                    min_x = table.Column<double>(type: "double precision", nullable: true, comment: "Tọa độ góc trái dưới trên Floor Map"),
                    min_y = table.Column<double>(type: "double precision", nullable: true, comment: "Tọa độ góc trái dưới trên Floor Map"),
                    max_x = table.Column<double>(type: "double precision", nullable: true, comment: "Tọa độ góc phải trên trên Floor Map"),
                    max_y = table.Column<double>(type: "double precision", nullable: true, comment: "Tọa độ góc phải trên trên Floor Map"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Ngày khởi tạo"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false, comment: "Đánh dấu xóa mềm")
                },
                constraints: table =>
                {
                    table.PrimaryKey("areas_pkey", x => x.area_id);
                    table.ForeignKey(
                        name: "fk_areas_business_categories",
                        column: x => x.category_id,
                        principalTable: "business_categories",
                        principalColumn: "category_id");
                    table.ForeignKey(
                        name: "fk_areas_markets",
                        column: x => x.market_id,
                        principalTable: "markets",
                        principalColumn: "market_id");
                },
                comment: "Khu vực trong chợ");

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh người dùng")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    role_id = table.Column<int>(type: "integer", nullable: false, comment: "Liên kết tới bảng roles"),
                    name = table.Column<string>(type: "text", nullable: false, comment: "Họ và tên đầy đủ"),
                    email = table.Column<string>(type: "text", nullable: false, comment: "Email đăng nhập và nhận thông báo tài chính"),
                    password = table.Column<string>(type: "text", nullable: false, comment: "Mật khẩu băm (BCrypt / Argon2)"),
                    phone = table.Column<string>(type: "text", nullable: false, comment: "Số điện thoại liên lạc"),
                    cccd = table.Column<string>(type: "text", nullable: false, comment: "Số Căn cước công dân phục vụ làm hợp đồng"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Active'::text", comment: "Trạng thái tài khoản (Active, Suspended, Locked)"),
                    otp_code = table.Column<string>(type: "text", nullable: true, comment: "Mã OTP xác minh quên mật khẩu/đổi số điện thoại"),
                    otp_expired_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời gian hết hạn của mã OTP"),
                    last_login = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Ghi nhận thời gian đăng nhập gần nhất"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Ngày giờ khởi tạo tài khoản"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Ngày giờ cập nhật gần nhất"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false, comment: "Đánh dấu xóa mềm tài khoản"),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời điểm thực hiện xóa mềm")
                },
                constraints: table =>
                {
                    table.PrimaryKey("users_pkey", x => x.user_id);
                    table.ForeignKey(
                        name: "fk_users_roles",
                        column: x => x.role_id,
                        principalTable: "roles",
                        principalColumn: "role_id");
                },
                comment: "Thông tin tài khoản người dùng");

            migrationBuilder.CreateTable(
                name: "stalls",
                columns: table => new
                {
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh quầy sạp")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    code = table.Column<string>(type: "text", nullable: false, comment: "Số hiệu sạp vật lý (VD: A-102)"),
                    area_id = table.Column<int>(type: "integer", nullable: false, comment: "Thuộc khu vực phân khu nào trong chợ"),
                    category_id = table.Column<int>(type: "integer", nullable: false, comment: "Ngành hàng kinh doanh bắt buộc của sạp"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Available'::text", comment: "Tình trạng sạp (Available, Rented, Maintenance)"),
                    size = table.Column<double>(type: "double precision", nullable: true, comment: "Diện tích mặt bằng sạp (m²)"),
                    map_x = table.Column<double>(type: "double precision", nullable: true, comment: "Tọa độ điểm neo trên Floor Map"),
                    map_y = table.Column<double>(type: "double precision", nullable: true, comment: "Tọa độ điểm neo trên Floor Map"),
                    width = table.Column<double>(type: "double precision", nullable: true, comment: "Kích thước hiển thị sạp trên Web UI"),
                    height = table.Column<double>(type: "double precision", nullable: true, comment: "Kích thước hiển thị sạp trên Web UI"),
                    rotation = table.Column<double>(type: "double precision", nullable: true, defaultValueSql: "0", comment: "Góc xoay hiển thị sạp trên Floor Map"),
                    svg_path = table.Column<string>(type: "text", nullable: true, comment: "Chuỗi dữ liệu vẽ vector hình dạng sạp tự do"),
                    fire_insurance_expiry = table.Column<DateOnly>(type: "date", nullable: true, comment: "Ngày hết hạn bảo hiểm hỏa hoạn bắt buộc"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Ngày khởi tạo"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false, comment: "Đánh dấu xóa mềm"),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời điểm xóa mềm")
                },
                constraints: table =>
                {
                    table.PrimaryKey("stalls_pkey", x => x.stall_id);
                    table.ForeignKey(
                        name: "fk_stalls_areas",
                        column: x => x.area_id,
                        principalTable: "areas",
                        principalColumn: "area_id");
                    table.ForeignKey(
                        name: "fk_stalls_business_categories",
                        column: x => x.category_id,
                        principalTable: "business_categories",
                        principalColumn: "category_id");
                },
                comment: "Thông tin quầy sạp");

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã bản ghi nhật ký")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false, comment: "Người dùng thực hiện hành động"),
                    action = table.Column<string>(type: "text", nullable: false, comment: "Mô tả hành động (VD: \"Tạo hóa đơn\", \"Xóa sạp\")"),
                    ip_address = table.Column<string>(type: "text", nullable: true, comment: "Địa chỉ IP của thiết bị thực hiện"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Thời điểm ghi nhận")
                },
                constraints: table =>
                {
                    table.PrimaryKey("audit_logs_pkey", x => x.log_id);
                    table.ForeignKey(
                        name: "fk_audit_logs_users",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Nhật ký hoạt động của người dùng");

            migrationBuilder.CreateTable(
                name: "faqs",
                columns: table => new
                {
                    faq_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh câu hỏi")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    category = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'General'::text", comment: "Phân loại (General, Contract, Payment, Rules)"),
                    question = table.Column<string>(type: "text", nullable: false, comment: "Nội dung câu hỏi"),
                    answer = table.Column<string>(type: "text", nullable: false, comment: "Nội dung câu trả lời"),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Admin/Manager tạo FAQ"),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true, comment: "Đánh dấu ẩn/hiện FAQ"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("faqs_pkey", x => x.faq_id);
                    table.ForeignKey(
                        name: "fk_faqs_users",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Câu hỏi thường gặp");

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    noti_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã thông báo")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    title = table.Column<string>(type: "text", nullable: false, comment: "Tiêu đề thông báo"),
                    content = table.Column<string>(type: "text", nullable: false, comment: "Nội dung chi tiết thông báo"),
                    noti_type = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'System'::text", comment: "Loại thông báo (System, Invoice, Violation, Request)"),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Người tạo thông báo"),
                    target_role = table.Column<string>(type: "text", nullable: true, comment: "Gửi tới toàn bộ vai trò (broadcast)"),
                    target_user_id = table.Column<int>(type: "integer", nullable: true, comment: "Gửi tới cá nhân cụ thể"),
                    is_read = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false, comment: "Trạng thái đã đọc"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Thời điểm tạo thông báo")
                },
                constraints: table =>
                {
                    table.PrimaryKey("notifications_pkey", x => x.noti_id);
                    table.ForeignKey(
                        name: "fk_notifications_created_by_users",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                    table.ForeignKey(
                        name: "fk_notifications_target_users",
                        column: x => x.target_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Thông báo hệ thống");

            migrationBuilder.CreateTable(
                name: "services",
                columns: table => new
                {
                    service_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh dịch vụ")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    name = table.Column<string>(type: "text", nullable: false, comment: "Tên dịch vụ (VD: Vệ sinh, Wifi)"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết quyền lợi"),
                    price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Đơn giá dịch vụ (VNĐ)"),
                    billing_cycle = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Monthly'::text", comment: "Chu kỳ tính phí (One-time, Monthly, Yearly)"),
                    fee_type_id = table.Column<int>(type: "integer", nullable: false, comment: "Liên kết với bảng fee_types để tự động xuất hóa đơn"),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Admin/Manager nào là người tạo dịch vụ này"),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true, comment: "Trạng thái dịch vụ"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("services_pkey", x => x.service_id);
                    table.ForeignKey(
                        name: "fk_services_fee_types",
                        column: x => x.fee_type_id,
                        principalTable: "fee_types",
                        principalColumn: "fee_type_id");
                    table.ForeignKey(
                        name: "fk_services_users",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Danh mục các dịch vụ của chợ");

            migrationBuilder.CreateTable(
                name: "system_configs",
                columns: table => new
                {
                    config_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã cấu hình")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    config_key = table.Column<string>(type: "text", nullable: false, comment: "Khóa cấu hình (VD: \"invoice_due_days\")"),
                    config_value = table.Column<string>(type: "text", nullable: false, comment: "Giá trị cấu hình tương ứng"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả ý nghĩa cấu hình"),
                    updated_by_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Admin/Manager cập nhật cấu hình"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Thời điểm cập nhật gần nhất")
                },
                constraints: table =>
                {
                    table.PrimaryKey("system_configs_pkey", x => x.config_id);
                    table.ForeignKey(
                        name: "fk_system_configs_users",
                        column: x => x.updated_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Cấu hình hệ thống");

            migrationBuilder.CreateTable(
                name: "vendors",
                columns: table => new
                {
                    vendor_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã tiểu thương")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false, comment: "Quan hệ 1-1 với tài khoản đăng nhập"),
                    business_name = table.Column<string>(type: "text", nullable: false, comment: "Tên cơ sở kinh doanh"),
                    tax_code = table.Column<string>(type: "text", nullable: true, comment: "Mã số thuế doanh nghiệp"),
                    business_license = table.Column<string>(type: "text", nullable: true, comment: "Link giấy phép kinh doanh scan"),
                    address = table.Column<string>(type: "text", nullable: true, comment: "Địa chỉ kinh doanh"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Ngày khởi tạo hồ sơ"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false, comment: "Đánh dấu xóa mềm"),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời điểm xóa mềm")
                },
                constraints: table =>
                {
                    table.PrimaryKey("vendors_pkey", x => x.vendor_id);
                    table.ForeignKey(
                        name: "fk_vendors_users",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Thông tin tiểu thương");

            migrationBuilder.CreateTable(
                name: "issues",
                columns: table => new
                {
                    issue_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã sự cố")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Sự cố tại khu vực gần sạp nào (dùng để định vị địa lý)"),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Staff báo cáo sự cố khi đi tuần"),
                    title = table.Column<string>(type: "text", nullable: false, comment: "Mô tả ngắn gọn sự cố"),
                    description = table.Column<string>(type: "text", nullable: false, comment: "Chi tiết tình trạng hỏng hóc hạ tầng chung"),
                    image_url = table.Column<string>(type: "text", nullable: true, comment: "Ảnh chụp hiện trường sự cố"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Reported'::text", comment: "Vòng đời: Reported → InProgress → Resolved | Closed"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("issues_pkey", x => x.issue_id);
                    table.ForeignKey(
                        name: "fk_issues_stalls",
                        column: x => x.stall_id,
                        principalTable: "stalls",
                        principalColumn: "stall_id");
                    table.ForeignKey(
                        name: "fk_issues_users",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Sự cố hạ tầng chung do nhân viên báo cáo");

            migrationBuilder.CreateTable(
                name: "meters",
                columns: table => new
                {
                    meter_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã công tơ")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Lắp đặt tại sạp nào"),
                    type = table.Column<string>(type: "text", nullable: false, comment: "Loại công tơ (Electricity, Water)"),
                    serial_number = table.Column<string>(type: "text", nullable: false, comment: "Số seri trên mặt đồng hồ"),
                    installed_at = table.Column<DateOnly>(type: "date", nullable: true, comment: "Ngày lắp đặt"),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true, comment: "Công tơ còn hoạt động hay đã thay thế")
                },
                constraints: table =>
                {
                    table.PrimaryKey("meters_pkey", x => x.meter_id);
                    table.ForeignKey(
                        name: "fk_meters_stalls",
                        column: x => x.stall_id,
                        principalTable: "stalls",
                        principalColumn: "stall_id");
                },
                comment: "Thông tin công tơ điện nước");

            migrationBuilder.CreateTable(
                name: "reviews",
                columns: table => new
                {
                    review_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã đánh giá")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Đánh giá sạp nào"),
                    user_id = table.Column<int>(type: "integer", nullable: false, comment: "Customer đánh giá"),
                    rating = table.Column<int>(type: "integer", nullable: false, comment: "Điểm (1-5 sao)"),
                    comment = table.Column<string>(type: "text", nullable: true, comment: "Nhận xét"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("reviews_pkey", x => x.review_id);
                    table.ForeignKey(
                        name: "fk_reviews_stalls",
                        column: x => x.stall_id,
                        principalTable: "stalls",
                        principalColumn: "stall_id");
                    table.ForeignKey(
                        name: "fk_reviews_users",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Đánh giá từ khách hàng");

            migrationBuilder.CreateTable(
                name: "violations",
                columns: table => new
                {
                    violation_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã vi phạm")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Sạp vi phạm"),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Staff lập biên bản"),
                    violation_type_id = table.Column<int>(type: "integer", nullable: false, comment: "Loại vi phạm (FK tới violation_types)"),
                    title = table.Column<string>(type: "text", nullable: false, comment: "Tiêu đề vi phạm"),
                    description = table.Column<string>(type: "text", nullable: false, comment: "Mô tả chi tiết"),
                    image_url = table.Column<string>(type: "text", nullable: false, comment: "Minh chứng hình ảnh bắt buộc"),
                    fine_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true, defaultValueSql: "0", comment: "Số tiền phạt thực tế (VNĐ) - auto-fill từ default_fine, Staff có thể override"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Pending'::text", comment: "Trạng thái (Pending, Notified, Appealed, Finalized)"),
                    notified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời điểm thông báo cho Vendor"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("violations_pkey", x => x.violation_id);
                    table.ForeignKey(
                        name: "fk_violations_stalls",
                        column: x => x.stall_id,
                        principalTable: "stalls",
                        principalColumn: "stall_id");
                    table.ForeignKey(
                        name: "fk_violations_types",
                        column: x => x.violation_type_id,
                        principalTable: "violation_types",
                        principalColumn: "violation_type_id");
                    table.ForeignKey(
                        name: "fk_violations_users",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Biên bản ghi nhận vi phạm");

            migrationBuilder.CreateTable(
                name: "contracts",
                columns: table => new
                {
                    contract_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã hợp đồng")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Hợp đồng thuê sạp nào"),
                    vendor_id = table.Column<int>(type: "integer", nullable: false, comment: "Tiểu thương ký hợp đồng"),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false, comment: "Ngày bắt đầu hợp đồng"),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false, comment: "Ngày kết thúc hợp đồng"),
                    rent_fee = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Giá thuê hàng tháng (VNĐ)"),
                    deposit = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Tiền đặt cọc (VNĐ)"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Active'::text", comment: "Trạng thái (Active, Expired, Terminated)"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Ngày tạo hợp đồng"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false, comment: "Đánh dấu xóa mềm"),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời điểm xóa mềm")
                },
                constraints: table =>
                {
                    table.PrimaryKey("contracts_pkey", x => x.contract_id);
                    table.ForeignKey(
                        name: "fk_contracts_stalls",
                        column: x => x.stall_id,
                        principalTable: "stalls",
                        principalColumn: "stall_id");
                    table.ForeignKey(
                        name: "fk_contracts_vendors",
                        column: x => x.vendor_id,
                        principalTable: "vendors",
                        principalColumn: "vendor_id");
                },
                comment: "Hợp đồng thuê sạp");

            migrationBuilder.CreateTable(
                name: "service_registrations",
                columns: table => new
                {
                    registration_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã đăng ký dịch vụ")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    service_id = table.Column<int>(type: "integer", nullable: false, comment: "Đăng ký dịch vụ nào"),
                    vendor_id = table.Column<int>(type: "integer", nullable: false, comment: "Tiểu thương nào đăng ký"),
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Sạp nào thụ hưởng dịch vụ"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Active'::text", comment: "Trạng thái (Pending, Active, Cancelled)"),
                    registered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Thời điểm đăng ký"),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời điểm hủy dịch vụ")
                },
                constraints: table =>
                {
                    table.PrimaryKey("service_registrations_pkey", x => x.registration_id);
                    table.ForeignKey(
                        name: "fk_service_registrations_services",
                        column: x => x.service_id,
                        principalTable: "services",
                        principalColumn: "service_id");
                    table.ForeignKey(
                        name: "fk_service_registrations_stalls",
                        column: x => x.stall_id,
                        principalTable: "stalls",
                        principalColumn: "stall_id");
                    table.ForeignKey(
                        name: "fk_service_registrations_vendors",
                        column: x => x.vendor_id,
                        principalTable: "vendors",
                        principalColumn: "vendor_id");
                },
                comment: "Đăng ký sử dụng dịch vụ");

            migrationBuilder.CreateTable(
                name: "meter_readings",
                columns: table => new
                {
                    meter_reading_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã bản ghi chỉ số điện nước")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    meter_id = table.Column<int>(type: "integer", nullable: false, comment: "Liên kết mã công tơ"),
                    old_value = table.Column<double>(type: "double precision", nullable: false, comment: "Chỉ số cũ kỳ trước"),
                    new_value = table.Column<double>(type: "double precision", nullable: false, comment: "Chỉ số mới do Staff nhập"),
                    recorded_at = table.Column<DateOnly>(type: "date", nullable: false, comment: "Ngày ghi số thực tế"),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Định danh Staff ghi số"),
                    image_url = table.Column<string>(type: "text", nullable: false, comment: "Link ảnh chụp mặt đồng hồ để đối soát"),
                    is_synced = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true, comment: "Trạng thái đồng bộ dữ liệu")
                },
                constraints: table =>
                {
                    table.PrimaryKey("meter_readings_pkey", x => x.meter_reading_id);
                    table.ForeignKey(
                        name: "fk_meter_readings_meters",
                        column: x => x.meter_id,
                        principalTable: "meters",
                        principalColumn: "meter_id");
                    table.ForeignKey(
                        name: "fk_meter_readings_users",
                        column: x => x.created_by_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Chỉ số ghi nhận từ công tơ");

            migrationBuilder.CreateTable(
                name: "contract_files",
                columns: table => new
                {
                    contract_file_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã bản ghi file hợp đồng")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    contract_id = table.Column<int>(type: "integer", nullable: false, comment: "Thuộc hợp đồng nào"),
                    file_url = table.Column<string>(type: "text", nullable: false, comment: "Link file hợp đồng scan (PDF/Image)")
                },
                constraints: table =>
                {
                    table.PrimaryKey("contract_files_pkey", x => x.contract_file_id);
                    table.ForeignKey(
                        name: "fk_contract_files_contracts",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id",
                        onDelete: ReferentialAction.Cascade);
                },
                comment: "File hợp đồng đính kèm");

            migrationBuilder.CreateTable(
                name: "invoices",
                columns: table => new
                {
                    invoice_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã định danh hóa đơn")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    contract_id = table.Column<int>(type: "integer", nullable: false, comment: "Hóa đơn tính cho hợp đồng nào"),
                    month = table.Column<int>(type: "integer", nullable: false, comment: "Tháng tính hóa đơn"),
                    year = table.Column<int>(type: "integer", nullable: false, comment: "Năm tính hóa đơn"),
                    total_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Tổng số tiền phải nộp (VNĐ)"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Unpaid'::text", comment: "Trạng thái (Unpaid, Paid, Adjusted)"),
                    due_date = table.Column<DateOnly>(type: "date", nullable: true, comment: "Hạn chót thanh toán"),
                    adjusted_from_id = table.Column<int>(type: "integer", nullable: true, comment: "Trỏ về ID hóa đơn gốc bị lỗi (nếu có)"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("invoices_pkey", x => x.invoice_id);
                    table.ForeignKey(
                        name: "fk_invoices_adjusted_invoices",
                        column: x => x.adjusted_from_id,
                        principalTable: "invoices",
                        principalColumn: "invoice_id");
                    table.ForeignKey(
                        name: "fk_invoices_contracts",
                        column: x => x.contract_id,
                        principalTable: "contracts",
                        principalColumn: "contract_id");
                },
                comment: "Hóa đơn dịch vụ và thuê sạp");

            migrationBuilder.CreateTable(
                name: "invoice_details",
                columns: table => new
                {
                    invoice_detail_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã bản ghi chi tiết hóa đơn")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    invoice_id = table.Column<int>(type: "integer", nullable: false, comment: "Thuộc hóa đơn nào"),
                    fee_type_id = table.Column<int>(type: "integer", nullable: false, comment: "Loại phí áp dụng"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết khoản phí"),
                    quantity = table.Column<double>(type: "double precision", nullable: false, comment: "Số lượng tiêu thụ"),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Đơn giá"),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Thành tiền")
                },
                constraints: table =>
                {
                    table.PrimaryKey("invoice_details_pkey", x => x.invoice_detail_id);
                    table.ForeignKey(
                        name: "fk_invoice_details_fee_types",
                        column: x => x.fee_type_id,
                        principalTable: "fee_types",
                        principalColumn: "fee_type_id");
                    table.ForeignKey(
                        name: "fk_invoice_details_invoices",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "invoice_id",
                        onDelete: ReferentialAction.Cascade);
                },
                comment: "Chi tiết các khoản phí trên hóa đơn");

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    payment_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã bản ghi giao dịch")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    invoice_id = table.Column<int>(type: "integer", nullable: false, comment: "Thanh toán cho hóa đơn nào"),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Số tiền thực thu (VNĐ)"),
                    method = table.Column<string>(type: "text", nullable: false, comment: "Phương thức nộp tiền (Momo, Cash)"),
                    transaction_code = table.Column<string>(type: "text", nullable: true, comment: "Mã giao dịch hoặc mã biên nhận"),
                    paid_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP", comment: "Thời điểm thanh toán")
                },
                constraints: table =>
                {
                    table.PrimaryKey("payments_pkey", x => x.payment_id);
                    table.ForeignKey(
                        name: "fk_payments_invoices",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "invoice_id");
                },
                comment: "Thông tin thanh toán giao dịch");

            migrationBuilder.CreateTable(
                name: "requests",
                columns: table => new
                {
                    request_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã yêu cầu")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    vendor_id = table.Column<int>(type: "integer", nullable: false, comment: "Tiểu thương gửi yêu cầu"),
                    stall_id = table.Column<int>(type: "integer", nullable: false, comment: "Yêu cầu liên quan tới sạp nào"),
                    request_type = table.Column<string>(type: "text", nullable: false, comment: "FacilityIssue, ViolationAppeal, InvoiceDispute"),
                    violation_id = table.Column<int>(type: "integer", nullable: true, comment: "Điền nếu Kháng nghị vi phạm"),
                    invoice_id = table.Column<int>(type: "integer", nullable: true, comment: "Điền nếu Kháng nghị hóa đơn"),
                    title = table.Column<string>(type: "text", nullable: false, comment: "Tiêu đề yêu cầu"),
                    description = table.Column<string>(type: "text", nullable: false, comment: "Mô tả chi tiết"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Pending'::text", comment: "Vòng đời: Pending → Quoted → Approved → Completed | Rejected"),
                    quotation_text = table.Column<string>(type: "text", nullable: true, comment: "Bảng kê chi tiết báo giá vật tư dạng văn bản — sinh tự động từ danh sách task_materials"),
                    quotation_amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true, comment: "Tổng chi phí báo giá dự kiến (VNĐ)"),
                    is_quote_approved = table.Column<bool>(type: "boolean", nullable: true, comment: "Kết quả duyệt báo giá: null=Chờ duyệt | true=Đã duyệt | false=Từ chối"),
                    paid_by = table.Column<string>(type: "text", nullable: true, comment: "Đối tượng chi trả: Vendor=Tiểu thương chịu | Market=Chợ chịu. Quyết định ai duyệt báo giá khi status=Quoted"),
                    repair_rating = table.Column<int>(type: "integer", nullable: true, comment: "Đánh giá chất lượng sửa chữa của Vendor (1–5 sao)"),
                    repair_comment = table.Column<string>(type: "text", nullable: true, comment: "Bình luận nhận xét của Vendor sau khi sửa chữa hoàn thành"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("requests_pkey", x => x.request_id);
                    table.ForeignKey(
                        name: "fk_requests_invoices",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "invoice_id");
                    table.ForeignKey(
                        name: "fk_requests_stalls",
                        column: x => x.stall_id,
                        principalTable: "stalls",
                        principalColumn: "stall_id");
                    table.ForeignKey(
                        name: "fk_requests_vendors",
                        column: x => x.vendor_id,
                        principalTable: "vendors",
                        principalColumn: "vendor_id");
                    table.ForeignKey(
                        name: "fk_requests_violations",
                        column: x => x.violation_id,
                        principalTable: "violations",
                        principalColumn: "violation_id");
                },
                comment: "Yêu cầu từ tiểu thương");

            migrationBuilder.CreateTable(
                name: "staff_tasks",
                columns: table => new
                {
                    task_id = table.Column<int>(type: "integer", nullable: false, comment: "Mã tác vụ")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    assigned_to_user_id = table.Column<int>(type: "integer", nullable: false, comment: "Staff được giao việc"),
                    request_id = table.Column<int>(type: "integer", nullable: true, comment: "Nguồn: Yêu cầu từ Vendor (FK → requests)"),
                    issue_id = table.Column<int>(type: "integer", nullable: true, comment: "Nguồn: Sự cố hạ tầng chung (FK → issues)"),
                    task_type = table.Column<string>(type: "text", nullable: false, comment: "Repair, Maintenance, UtilityReading, CashCollection"),
                    title = table.Column<string>(type: "text", nullable: false, comment: "Tiêu đề tác vụ"),
                    description = table.Column<string>(type: "text", nullable: true, comment: "Mô tả chi tiết công việc cần làm"),
                    status = table.Column<string>(type: "text", nullable: true, defaultValueSql: "'Pending'::text", comment: "Vòng đời: Pending → PendingApproval → In_Progress → Completed | Cancelled"),
                    image_before_url = table.Column<string>(type: "text", nullable: true, comment: "Ảnh chụp hiện trạng hỏng hóc trước khi sửa (bắt buộc khi Completed)"),
                    image_after_url = table.Column<string>(type: "text", nullable: true, comment: "Ảnh chụp nghiệm thu sau khi sửa xong (bắt buộc khi Completed)"),
                    actual_cost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true, comment: "Tổng chi phí vật tư thực tế = SUM(task_materials.amount). Kế toán dùng để tính OPEX cuối tháng"),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, comment: "Thời điểm hoàn thành thực tế"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("tasks_pkey", x => x.task_id);
                    table.ForeignKey(
                        name: "fk_staff_tasks_issues",
                        column: x => x.issue_id,
                        principalTable: "issues",
                        principalColumn: "issue_id");
                    table.ForeignKey(
                        name: "fk_staff_tasks_requests",
                        column: x => x.request_id,
                        principalTable: "requests",
                        principalColumn: "request_id");
                    table.ForeignKey(
                        name: "fk_staff_tasks_users",
                        column: x => x.assigned_to_user_id,
                        principalTable: "users",
                        principalColumn: "user_id");
                },
                comment: "Tác vụ giao cho nhân viên thực hiện");

            migrationBuilder.CreateTable(
                name: "task_materials",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false, comment: "Mã bản ghi vật tư sử dụng")
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    task_id = table.Column<int>(type: "integer", nullable: false, comment: "Thuộc tác vụ nào (FK → tasks)"),
                    repair_price_id = table.Column<int>(type: "integer", nullable: false, comment: "Hạng mục giá được chọn (FK → repair_prices). Bắt buộc — dùng dòng \"Vật tư khác\" nếu vật tư ngoài danh mục"),
                    item_name = table.Column<string>(type: "text", nullable: false, comment: "Tên vật tư — copy từ repair_prices.item_name lúc chọn (tránh mất dữ liệu khi danh mục thay đổi)"),
                    quantity = table.Column<double>(type: "double precision", nullable: false, comment: "Số lượng thực tế đã sử dụng"),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Đơn giá — copy từ repair_prices.price. Staff override nếu là dòng \"Vật tư khác\""),
                    amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false, comment: "Thành tiền = quantity × unit_price")
                },
                constraints: table =>
                {
                    table.PrimaryKey("task_materials_pkey", x => x.id);
                    table.ForeignKey(
                        name: "fk_task_materials_prices",
                        column: x => x.repair_price_id,
                        principalTable: "repair_prices",
                        principalColumn: "repair_price_id");
                    table.ForeignKey(
                        name: "fk_task_materials_staff_tasks",
                        column: x => x.task_id,
                        principalTable: "staff_tasks",
                        principalColumn: "task_id",
                        onDelete: ReferentialAction.Cascade);
                },
                comment: "Vật tư sử dụng cho các tác vụ");

            migrationBuilder.CreateIndex(
                name: "idx_areas_category_id",
                table: "areas",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "idx_areas_market_id",
                table: "areas",
                column: "market_id");

            migrationBuilder.CreateIndex(
                name: "idx_audit_logs_user_id",
                table: "audit_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "business_categories_code_key",
                table: "business_categories",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_contract_files_contract_id",
                table: "contract_files",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_contracts_lookup",
                table: "contracts",
                columns: new[] { "stall_id", "vendor_id", "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "idx_contracts_stall_id",
                table: "contracts",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "idx_contracts_vendor_id",
                table: "contracts",
                column: "vendor_id");

            migrationBuilder.CreateIndex(
                name: "idx_faqs_created_by_user_id",
                table: "faqs",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_invoice_details_fee_type_id",
                table: "invoice_details",
                column: "fee_type_id");

            migrationBuilder.CreateIndex(
                name: "idx_invoice_details_invoice_id",
                table: "invoice_details",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "idx_invoices_adjusted_from_id",
                table: "invoices",
                column: "adjusted_from_id");

            migrationBuilder.CreateIndex(
                name: "idx_invoices_contract_id",
                table: "invoices",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "idx_invoices_report",
                table: "invoices",
                columns: new[] { "month", "year", "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "idx_issues_created_by_user_id",
                table: "issues",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_issues_stall_id",
                table: "issues",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "idx_meter_readings_created_by_user_id",
                table: "meter_readings",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_meter_readings_meter_id",
                table: "meter_readings",
                column: "meter_id");

            migrationBuilder.CreateIndex(
                name: "idx_meters_stall_id",
                table: "meters",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "meters_serial_number_key",
                table: "meters",
                column: "serial_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_notifications_created_by_user_id",
                table: "notifications",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_notifications_target_user_id",
                table: "notifications",
                column: "target_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_payments_invoice_id",
                table: "payments",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "repair_prices_item_name_key",
                table: "repair_prices",
                column: "item_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_requests_invoice_id",
                table: "requests",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "idx_requests_stall_id",
                table: "requests",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "idx_requests_vendor_id",
                table: "requests",
                column: "vendor_id");

            migrationBuilder.CreateIndex(
                name: "idx_requests_violation_id",
                table: "requests",
                column: "violation_id");

            migrationBuilder.CreateIndex(
                name: "idx_reviews_stall_id",
                table: "reviews",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "idx_reviews_user_id",
                table: "reviews",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "roles_name_key",
                table: "roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_service_registrations",
                table: "service_registrations",
                columns: new[] { "vendor_id", "stall_id", "service_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_service_registrations_service_id",
                table: "service_registrations",
                column: "service_id");

            migrationBuilder.CreateIndex(
                name: "idx_service_registrations_stall_id",
                table: "service_registrations",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "idx_service_registrations_vendor_id",
                table: "service_registrations",
                column: "vendor_id");

            migrationBuilder.CreateIndex(
                name: "idx_services_created_by_user_id",
                table: "services",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_services_fee_type_id",
                table: "services",
                column: "fee_type_id");

            migrationBuilder.CreateIndex(
                name: "idx_staff_tasks_assigned_to_user_id",
                table: "staff_tasks",
                column: "assigned_to_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_staff_tasks_issue_id",
                table: "staff_tasks",
                column: "issue_id");

            migrationBuilder.CreateIndex(
                name: "idx_staff_tasks_request_id",
                table: "staff_tasks",
                column: "request_id");

            migrationBuilder.CreateIndex(
                name: "idx_stalls_area_id",
                table: "stalls",
                column: "area_id");

            migrationBuilder.CreateIndex(
                name: "idx_stalls_category",
                table: "stalls",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "idx_stalls_map",
                table: "stalls",
                columns: new[] { "map_x", "map_y", "width", "height", "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "stalls_code_key",
                table: "stalls",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_system_configs_updated_by_user_id",
                table: "system_configs",
                column: "updated_by_user_id");

            migrationBuilder.CreateIndex(
                name: "system_configs_config_key_key",
                table: "system_configs",
                column: "config_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_task_materials_repair_price_id",
                table: "task_materials",
                column: "repair_price_id");

            migrationBuilder.CreateIndex(
                name: "idx_task_materials_task",
                table: "task_materials",
                column: "task_id");

            migrationBuilder.CreateIndex(
                name: "idx_users_cccd",
                table: "users",
                column: "cccd");

            migrationBuilder.CreateIndex(
                name: "idx_users_login",
                table: "users",
                columns: new[] { "email", "phone", "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "idx_users_role_id",
                table: "users",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "users_cccd_key",
                table: "users",
                column: "cccd",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "users_email_key",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "users_phone_key",
                table: "users",
                column: "phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "vendors_tax_code_key",
                table: "vendors",
                column: "tax_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "vendors_user_id_key",
                table: "vendors",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_violations_created_by_user_id",
                table: "violations",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_violations_stall_id",
                table: "violations",
                column: "stall_id");

            migrationBuilder.CreateIndex(
                name: "idx_violations_violation_type_id",
                table: "violations",
                column: "violation_type_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "contract_files");

            migrationBuilder.DropTable(
                name: "faqs");

            migrationBuilder.DropTable(
                name: "invoice_details");

            migrationBuilder.DropTable(
                name: "meter_readings");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.DropTable(
                name: "service_registrations");

            migrationBuilder.DropTable(
                name: "system_configs");

            migrationBuilder.DropTable(
                name: "task_materials");

            migrationBuilder.DropTable(
                name: "meters");

            migrationBuilder.DropTable(
                name: "services");

            migrationBuilder.DropTable(
                name: "repair_prices");

            migrationBuilder.DropTable(
                name: "staff_tasks");

            migrationBuilder.DropTable(
                name: "fee_types");

            migrationBuilder.DropTable(
                name: "issues");

            migrationBuilder.DropTable(
                name: "requests");

            migrationBuilder.DropTable(
                name: "invoices");

            migrationBuilder.DropTable(
                name: "violations");

            migrationBuilder.DropTable(
                name: "contracts");

            migrationBuilder.DropTable(
                name: "violation_types");

            migrationBuilder.DropTable(
                name: "stalls");

            migrationBuilder.DropTable(
                name: "vendors");

            migrationBuilder.DropTable(
                name: "areas");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "business_categories");

            migrationBuilder.DropTable(
                name: "markets");

            migrationBuilder.DropTable(
                name: "roles");
        }
    }
}
