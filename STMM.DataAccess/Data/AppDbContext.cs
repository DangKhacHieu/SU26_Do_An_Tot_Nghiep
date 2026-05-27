using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Area> Areas { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Contract> Contracts { get; set; }

    public virtual DbSet<ContractFile> ContractFiles { get; set; }

    public virtual DbSet<Faq> Faqs { get; set; }

    public virtual DbSet<FeeType> FeeTypes { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<InvoiceDetail> InvoiceDetails { get; set; }

    public virtual DbSet<Issue> Issues { get; set; }

    public virtual DbSet<Market> Markets { get; set; }

    public virtual DbSet<Meter> Meters { get; set; }

    public virtual DbSet<MeterReading> MeterReadings { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Request> Requests { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Service> Services { get; set; }

    public virtual DbSet<ServiceRegistration> ServiceRegistrations { get; set; }

    public virtual DbSet<StaffTask> StaffTasks { get; set; }

    public virtual DbSet<Stall> Stalls { get; set; }

    public virtual DbSet<SystemConfig> SystemConfigs { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Vendor> Vendors { get; set; }

    public virtual DbSet<Violation> Violations { get; set; }

    public virtual DbSet<ViolationType> ViolationTypes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Area>(entity =>
        {
            entity.HasKey(e => e.AreaId).HasName("areas_pkey");

            entity.ToTable("areas");

            entity.Property(e => e.AreaId)
                .HasComment("Mã khu vực")
                .HasColumnName("area_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Ngày khởi tạo")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasComment("Mô tả khu vực")
                .HasColumnName("description");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasComment("Đánh dấu xóa mềm")
                .HasColumnName("is_deleted");
            entity.Property(e => e.MarketId)
                .HasComment("Thuộc chợ nào")
                .HasColumnName("market_id");
            entity.Property(e => e.MaxX)
                .HasComment("Tọa độ góc phải trên trên Floor Map")
                .HasColumnName("max_x");
            entity.Property(e => e.MaxY)
                .HasComment("Tọa độ góc phải trên trên Floor Map")
                .HasColumnName("max_y");
            entity.Property(e => e.MinX)
                .HasComment("Tọa độ góc trái dưới trên Floor Map")
                .HasColumnName("min_x");
            entity.Property(e => e.MinY)
                .HasComment("Tọa độ góc trái dưới trên Floor Map")
                .HasColumnName("min_y");
            entity.Property(e => e.Name)
                .HasComment("Tên khu vực (VD: \"Khu A - Thực phẩm\")")
                .HasColumnName("name");

            entity.HasOne(d => d.Market).WithMany(p => p.Areas)
                .HasForeignKey(d => d.MarketId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_areas_markets");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.LogId).HasName("audit_logs_pkey");

            entity.ToTable("audit_logs");

            entity.Property(e => e.LogId)
                .HasComment("Mã bản ghi nhật ký")
                .HasColumnName("log_id");
            entity.Property(e => e.Action)
                .HasComment("Mô tả hành động (VD: \"Tạo hóa đơn\", \"Xóa sạp\")")
                .HasColumnName("action");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Thời điểm ghi nhận")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(50)
                .HasComment("Địa chỉ IP của thiết bị thực hiện")
                .HasColumnName("ip_address");
            entity.Property(e => e.UserId)
                .HasComment("Người dùng thực hiện hành động")
                .HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_audit_logs_users");
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.HasKey(e => e.ContractId).HasName("contracts_pkey");

            entity.ToTable("contracts");

            entity.HasIndex(e => new { e.StallId, e.VendorId, e.Status, e.IsDeleted }, "idx_contracts_lookup");

            entity.Property(e => e.ContractId)
                .HasComment("Mã hợp đồng")
                .HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Ngày tạo hợp đồng")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("Thời điểm xóa mềm")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.Deposit)
                .HasPrecision(18, 2)
                .HasComment("Tiền đặt cọc (VNĐ)")
                .HasColumnName("deposit");
            entity.Property(e => e.EndDate)
                .HasComment("Ngày kết thúc hợp đồng")
                .HasColumnName("end_date");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasComment("Đánh dấu xóa mềm")
                .HasColumnName("is_deleted");
            entity.Property(e => e.RentFee)
                .HasPrecision(18, 2)
                .HasComment("Giá thuê hàng tháng (VNĐ)")
                .HasColumnName("rent_fee");
            entity.Property(e => e.StallId)
                .HasComment("Hợp đồng thuê sạp nào")
                .HasColumnName("stall_id");
            entity.Property(e => e.StartDate)
                .HasComment("Ngày bắt đầu hợp đồng")
                .HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Active'::character varying")
                .HasComment("Trạng thái (Active, Expired, Terminated)")
                .HasColumnName("status");
            entity.Property(e => e.VendorId)
                .HasComment("Tiểu thương ký hợp đồng")
                .HasColumnName("vendor_id");

            entity.HasOne(d => d.Stall).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_contracts_stalls");

            entity.HasOne(d => d.Vendor).WithMany(p => p.Contracts)
                .HasForeignKey(d => d.VendorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_contracts_vendors");
        });

        modelBuilder.Entity<ContractFile>(entity =>
        {
            entity.HasKey(e => e.ContractFileId).HasName("contract_files_pkey");

            entity.ToTable("contract_files");

            entity.Property(e => e.ContractFileId)
                .HasComment("Mã bản ghi file hợp đồng")
                .HasColumnName("contract_file_id");
            entity.Property(e => e.ContractId)
                .HasComment("Thuộc hợp đồng nào")
                .HasColumnName("contract_id");
            entity.Property(e => e.FileUrl)
                .HasComment("Link file hợp đồng scan (PDF/Image)")
                .HasColumnName("file_url");

            entity.HasOne(d => d.Contract).WithMany(p => p.ContractFiles)
                .HasForeignKey(d => d.ContractId)
                .HasConstraintName("fk_contract_files_contracts");
        });

        modelBuilder.Entity<Faq>(entity =>
        {
            entity.HasKey(e => e.FaqId).HasName("faqs_pkey");

            entity.ToTable("faqs");

            entity.Property(e => e.FaqId)
                .HasComment("Mã định danh câu hỏi")
                .HasColumnName("faq_id");
            entity.Property(e => e.Answer)
                .HasComment("Nội dung câu trả lời")
                .HasColumnName("answer");
            entity.Property(e => e.Category)
                .HasMaxLength(50)
                .HasDefaultValueSql("'General'::character varying")
                .HasComment("Phân loại (General, Contract, Payment, Rules)")
                .HasColumnName("category");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedByUserId)
                .HasComment("Admin/Manager tạo FAQ")
                .HasColumnName("created_by_user_id");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("Đánh dấu ẩn/hiện FAQ")
                .HasColumnName("is_active");
            entity.Property(e => e.Question)
                .HasComment("Nội dung câu hỏi")
                .HasColumnName("question");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.Faqs)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_faqs_users");
        });

        modelBuilder.Entity<FeeType>(entity =>
        {
            entity.HasKey(e => e.FeeTypeId).HasName("fee_types_pkey");

            entity.ToTable("fee_types");

            entity.Property(e => e.FeeTypeId)
                .HasComment("Mã loại phí")
                .HasColumnName("fee_type_id");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết loại phí")
                .HasColumnName("description");
            entity.Property(e => e.Name)
                .HasComment("Tên loại phí (Thuê sạp, Điện, Nước, Phạt...)")
                .HasColumnName("name");
            entity.Property(e => e.Unit)
                .HasComment("Đơn vị tính (kWh, m³, tháng)")
                .HasColumnName("unit");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.InvoiceId).HasName("invoices_pkey");

            entity.ToTable("invoices");

            entity.HasIndex(e => new { e.Month, e.Year, e.Status, e.IsDeleted }, "idx_invoices_report");

            entity.Property(e => e.InvoiceId)
                .HasComment("Mã định danh hóa đơn")
                .HasColumnName("invoice_id");
            entity.Property(e => e.AdjustedFromId)
                .HasComment("Trỏ về ID hóa đơn gốc bị lỗi (nếu có)")
                .HasColumnName("adjusted_from_id");
            entity.Property(e => e.ContractId)
                .HasComment("Hóa đơn tính cho hợp đồng nào")
                .HasColumnName("contract_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DueDate)
                .HasComment("Hạn chót thanh toán")
                .HasColumnName("due_date");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasColumnName("is_deleted");
            entity.Property(e => e.Month)
                .HasComment("Tháng tính hóa đơn")
                .HasColumnName("month");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Unpaid'::character varying")
                .HasComment("Trạng thái (Unpaid, Paid, Adjusted)")
                .HasColumnName("status");
            entity.Property(e => e.TotalAmount)
                .HasPrecision(18, 2)
                .HasComment("Tổng số tiền phải nộp (VNĐ)")
                .HasColumnName("total_amount");
            entity.Property(e => e.Year)
                .HasComment("Năm tính hóa đơn")
                .HasColumnName("year");

            entity.HasOne(d => d.AdjustedFrom).WithMany(p => p.InverseAdjustedFrom)
                .HasForeignKey(d => d.AdjustedFromId)
                .HasConstraintName("fk_invoices_adjusted_invoices");

            entity.HasOne(d => d.Contract).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.ContractId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_invoices_contracts");
        });

        modelBuilder.Entity<InvoiceDetail>(entity =>
        {
            entity.HasKey(e => e.InvoiceDetailId).HasName("invoice_details_pkey");

            entity.ToTable("invoice_details");

            entity.Property(e => e.InvoiceDetailId)
                .HasComment("Mã bản ghi chi tiết hóa đơn")
                .HasColumnName("invoice_detail_id");
            entity.Property(e => e.Amount)
                .HasPrecision(18, 2)
                .HasComment("Thành tiền")
                .HasColumnName("amount");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết khoản phí")
                .HasColumnName("description");
            entity.Property(e => e.FeeTypeId)
                .HasComment("Loại phí áp dụng")
                .HasColumnName("fee_type_id");
            entity.Property(e => e.InvoiceId)
                .HasComment("Thuộc hóa đơn nào")
                .HasColumnName("invoice_id");
            entity.Property(e => e.Quantity)
                .HasComment("Số lượng tiêu thụ")
                .HasColumnName("quantity");
            entity.Property(e => e.UnitPrice)
                .HasPrecision(18, 2)
                .HasComment("Đơn giá")
                .HasColumnName("unit_price");

            entity.HasOne(d => d.FeeType).WithMany(p => p.InvoiceDetails)
                .HasForeignKey(d => d.FeeTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_invoice_details_fee_types");

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceDetails)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("fk_invoice_details_invoices");
        });

        modelBuilder.Entity<Issue>(entity =>
        {
            entity.HasKey(e => e.IssueId).HasName("issues_pkey");

            entity.ToTable("issues");

            entity.Property(e => e.IssueId)
                .HasComment("Mã sự cố")
                .HasColumnName("issue_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedByUserId)
                .HasComment("Staff báo cáo")
                .HasColumnName("created_by_user_id");
            entity.Property(e => e.Description)
                .HasComment("Chi tiết tình trạng")
                .HasColumnName("description");
            entity.Property(e => e.ImageUrl)
                .HasComment("Ảnh sự cố")
                .HasColumnName("image_url");
            entity.Property(e => e.StallId)
                .HasComment("Sự cố tại sạp nào")
                .HasColumnName("stall_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Reported'::character varying")
                .HasComment("Trạng thái (Reported, InProgress, Resolved)")
                .HasColumnName("status");
            entity.Property(e => e.Title)
                .HasComment("Mô tả ngắn gọn")
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.Issues)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_issues_users");

            entity.HasOne(d => d.Stall).WithMany(p => p.Issues)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_issues_stalls");
        });

        modelBuilder.Entity<Market>(entity =>
        {
            entity.HasKey(e => e.MarketId).HasName("markets_pkey");

            entity.ToTable("markets");

            entity.Property(e => e.MarketId)
                .HasComment("Mã định danh chợ")
                .HasColumnName("market_id");
            entity.Property(e => e.Address)
                .HasComment("Địa chỉ chợ")
                .HasColumnName("address");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Ngày khởi tạo")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasComment("Đánh dấu xóa mềm")
                .HasColumnName("is_deleted");
            entity.Property(e => e.MarketName)
                .HasComment("Tên chợ")
                .HasColumnName("market_name");
        });

        modelBuilder.Entity<Meter>(entity =>
        {
            entity.HasKey(e => e.MeterId).HasName("meters_pkey");

            entity.ToTable("meters");

            entity.HasIndex(e => e.SerialNumber, "meters_serial_number_key").IsUnique();

            entity.Property(e => e.MeterId)
                .HasComment("Mã công tơ")
                .HasColumnName("meter_id");
            entity.Property(e => e.InstalledAt)
                .HasComment("Ngày lắp đặt")
                .HasColumnName("installed_at");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("Công tơ còn hoạt động hay đã thay thế")
                .HasColumnName("is_active");
            entity.Property(e => e.SerialNumber)
                .HasMaxLength(100)
                .HasComment("Số seri trên mặt đồng hồ")
                .HasColumnName("serial_number");
            entity.Property(e => e.StallId)
                .HasComment("Lắp đặt tại sạp nào")
                .HasColumnName("stall_id");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasComment("Loại công tơ (Electricity, Water)")
                .HasColumnName("type");

            entity.HasOne(d => d.Stall).WithMany(p => p.Meters)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_meters_stalls");
        });

        modelBuilder.Entity<MeterReading>(entity =>
        {
            entity.HasKey(e => e.MeterReadingId).HasName("meter_readings_pkey");

            entity.ToTable("meter_readings");

            entity.Property(e => e.MeterReadingId)
                .HasComment("Mã bản ghi chỉ số điện nước")
                .HasColumnName("meter_reading_id");
            entity.Property(e => e.CreatedByUserId)
                .HasComment("Định danh Staff ghi số")
                .HasColumnName("created_by_user_id");
            entity.Property(e => e.ImageUrl)
                .HasComment("Link ảnh chụp mặt đồng hồ để đối soát")
                .HasColumnName("image_url");
            entity.Property(e => e.IsSynced)
                .HasDefaultValue(true)
                .HasComment("Trạng thái đồng bộ dữ liệu")
                .HasColumnName("is_synced");
            entity.Property(e => e.MeterId)
                .HasComment("Liên kết mã công tơ")
                .HasColumnName("meter_id");
            entity.Property(e => e.NewValue)
                .HasComment("Chỉ số mới do Staff nhập")
                .HasColumnName("new_value");
            entity.Property(e => e.OldValue)
                .HasComment("Chỉ số cũ kỳ trước")
                .HasColumnName("old_value");
            entity.Property(e => e.RecordedAt)
                .HasComment("Ngày ghi số thực tế")
                .HasColumnName("recorded_at");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.MeterReadings)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_meter_readings_users");

            entity.HasOne(d => d.Meter).WithMany(p => p.MeterReadings)
                .HasForeignKey(d => d.MeterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_meter_readings_meters");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotiId).HasName("notifications_pkey");

            entity.ToTable("notifications");

            entity.Property(e => e.NotiId)
                .HasComment("Mã thông báo")
                .HasColumnName("noti_id");
            entity.Property(e => e.Content)
                .HasComment("Nội dung chi tiết thông báo")
                .HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Thời điểm tạo thông báo")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedByUserId)
                .HasComment("Người tạo thông báo")
                .HasColumnName("created_by_user_id");
            entity.Property(e => e.IsRead)
                .HasDefaultValue(false)
                .HasComment("Trạng thái đã đọc")
                .HasColumnName("is_read");
            entity.Property(e => e.NotiType)
                .HasMaxLength(50)
                .HasDefaultValueSql("'System'::character varying")
                .HasComment("Loại thông báo (System, Invoice, Violation, Request)")
                .HasColumnName("noti_type");
            entity.Property(e => e.TargetRole)
                .HasMaxLength(50)
                .HasComment("Gửi tới toàn bộ vai trò (broadcast)")
                .HasColumnName("target_role");
            entity.Property(e => e.TargetUserId)
                .HasComment("Gửi tới cá nhân cụ thể")
                .HasColumnName("target_user_id");
            entity.Property(e => e.Title)
                .HasComment("Tiêu đề thông báo")
                .HasColumnName("title");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.NotificationCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_notifications_created_by_users");

            entity.HasOne(d => d.TargetUser).WithMany(p => p.NotificationTargetUsers)
                .HasForeignKey(d => d.TargetUserId)
                .HasConstraintName("fk_notifications_target_users");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("payments_pkey");

            entity.ToTable("payments");

            entity.Property(e => e.PaymentId)
                .HasComment("Mã bản ghi giao dịch")
                .HasColumnName("payment_id");
            entity.Property(e => e.Amount)
                .HasPrecision(18, 2)
                .HasComment("Số tiền thực thu (VNĐ)")
                .HasColumnName("amount");
            entity.Property(e => e.InvoiceId)
                .HasComment("Thanh toán cho hóa đơn nào")
                .HasColumnName("invoice_id");
            entity.Property(e => e.Method)
                .HasMaxLength(50)
                .HasComment("Phương thức nộp tiền (Momo, Cash)")
                .HasColumnName("method");
            entity.Property(e => e.PaidAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Thời điểm thanh toán")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("paid_at");
            entity.Property(e => e.TransactionCode)
                .HasMaxLength(100)
                .HasComment("Mã giao dịch hoặc mã biên nhận")
                .HasColumnName("transaction_code");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Payments)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_payments_invoices");
        });

        modelBuilder.Entity<Request>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("requests_pkey");

            entity.ToTable("requests");

            entity.Property(e => e.RequestId)
                .HasComment("Mã yêu cầu")
                .HasColumnName("request_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết")
                .HasColumnName("description");
            entity.Property(e => e.InvoiceId)
                .HasComment("Điền nếu Kháng nghị hóa đơn")
                .HasColumnName("invoice_id");
            entity.Property(e => e.RequestType)
                .HasMaxLength(50)
                .HasComment("FacilityIssue, ViolationAppeal, InvoiceDispute")
                .HasColumnName("request_type");
            entity.Property(e => e.StallId)
                .HasComment("Yêu cầu liên quan tới sạp nào")
                .HasColumnName("stall_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Pending'::character varying")
                .HasComment("Trạng thái (Pending, Approved, Rejected, Processing, Completed)")
                .HasColumnName("status");
            entity.Property(e => e.Title)
                .HasComment("Tiêu đề yêu cầu")
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.VendorId)
                .HasComment("Tiểu thương gửi yêu cầu")
                .HasColumnName("vendor_id");
            entity.Property(e => e.ViolationId)
                .HasComment("Điền nếu Kháng nghị vi phạm")
                .HasColumnName("violation_id");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Requests)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("fk_requests_invoices");

            entity.HasOne(d => d.Stall).WithMany(p => p.Requests)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_requests_stalls");

            entity.HasOne(d => d.Vendor).WithMany(p => p.Requests)
                .HasForeignKey(d => d.VendorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_requests_vendors");

            entity.HasOne(d => d.Violation).WithMany(p => p.Requests)
                .HasForeignKey(d => d.ViolationId)
                .HasConstraintName("fk_requests_violations");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId).HasName("reviews_pkey");

            entity.ToTable("reviews");

            entity.Property(e => e.ReviewId)
                .HasComment("Mã đánh giá")
                .HasColumnName("review_id");
            entity.Property(e => e.Comment)
                .HasComment("Nhận xét")
                .HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Rating)
                .HasComment("Điểm (1-5 sao)")
                .HasColumnName("rating");
            entity.Property(e => e.StallId)
                .HasComment("Đánh giá sạp nào")
                .HasColumnName("stall_id");
            entity.Property(e => e.UserId)
                .HasComment("Customer đánh giá")
                .HasColumnName("user_id");

            entity.HasOne(d => d.Stall).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_reviews_stalls");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_reviews_users");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("roles_pkey");

            entity.ToTable("roles");

            entity.HasIndex(e => e.Name, "roles_name_key").IsUnique();

            entity.Property(e => e.RoleId)
                .HasComment("Mã định danh vai trò hệ thống")
                .HasColumnName("role_id");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết phạm vi quyền hạn")
                .HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasComment("Tên vai trò (Admin, Manager, Accountant, Staff, Vendor, Customer)")
                .HasColumnName("name");
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.ServiceId).HasName("services_pkey");

            entity.ToTable("services");

            entity.Property(e => e.ServiceId)
                .HasComment("Mã định danh dịch vụ")
                .HasColumnName("service_id");
            entity.Property(e => e.BillingCycle)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Monthly'::character varying")
                .HasComment("Chu kỳ tính phí (One-time, Monthly, Yearly)")
                .HasColumnName("billing_cycle");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedByUserId)
                .HasComment("Admin/Manager nào là người tạo dịch vụ này")
                .HasColumnName("created_by_user_id");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết quyền lợi")
                .HasColumnName("description");
            entity.Property(e => e.FeeTypeId)
                .HasComment("Liên kết với bảng fee_types để tự động xuất hóa đơn")
                .HasColumnName("fee_type_id");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("Trạng thái dịch vụ")
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasComment("Tên dịch vụ (VD: Vệ sinh, Wifi)")
                .HasColumnName("name");
            entity.Property(e => e.Price)
                .HasPrecision(18, 2)
                .HasComment("Đơn giá dịch vụ (VNĐ)")
                .HasColumnName("price");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.Services)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_services_users");

            entity.HasOne(d => d.FeeType).WithMany(p => p.Services)
                .HasForeignKey(d => d.FeeTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_services_fee_types");
        });

        modelBuilder.Entity<ServiceRegistration>(entity =>
        {
            entity.HasKey(e => e.RegistrationId).HasName("service_registrations_pkey");

            entity.ToTable("service_registrations");

            entity.HasIndex(e => new { e.VendorId, e.StallId, e.ServiceId, e.Status }, "idx_service_registrations");

            entity.Property(e => e.RegistrationId)
                .HasComment("Mã đăng ký dịch vụ")
                .HasColumnName("registration_id");
            entity.Property(e => e.CancelledAt)
                .HasComment("Thời điểm hủy dịch vụ")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("cancelled_at");
            entity.Property(e => e.RegisteredAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Thời điểm đăng ký")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("registered_at");
            entity.Property(e => e.ServiceId)
                .HasComment("Đăng ký dịch vụ nào")
                .HasColumnName("service_id");
            entity.Property(e => e.StallId)
                .HasComment("Sạp nào thụ hưởng dịch vụ")
                .HasColumnName("stall_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Active'::character varying")
                .HasComment("Trạng thái (Pending, Active, Cancelled)")
                .HasColumnName("status");
            entity.Property(e => e.VendorId)
                .HasComment("Tiểu thương nào đăng ký")
                .HasColumnName("vendor_id");

            entity.HasOne(d => d.Service).WithMany(p => p.ServiceRegistrations)
                .HasForeignKey(d => d.ServiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_service_registrations_services");

            entity.HasOne(d => d.Stall).WithMany(p => p.ServiceRegistrations)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_service_registrations_stalls");

            entity.HasOne(d => d.Vendor).WithMany(p => p.ServiceRegistrations)
                .HasForeignKey(d => d.VendorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_service_registrations_vendors");
        });

        modelBuilder.Entity<StaffTask>(entity =>
        {
            entity.HasKey(e => e.TaskId).HasName("staff_tasks_pkey");

            entity.ToTable("staff_tasks");

            entity.Property(e => e.TaskId)
                .HasComment("Mã tác vụ")
                .HasColumnName("task_id");
            entity.Property(e => e.AssignedToUserId)
                .HasComment("Staff được giao việc (Nhiệm vụ chung)")
                .HasColumnName("assigned_to_user_id");
            entity.Property(e => e.CompletedAt)
                .HasComment("Thời điểm hoàn thành")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.Deadline)
                .HasComment("Hạn chót")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deadline");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết")
                .HasColumnName("description");
            entity.Property(e => e.IssueId)
                .HasComment("Nguồn: Sự cố nội bộ")
                .HasColumnName("issue_id");
            entity.Property(e => e.OverdueReason)
                .HasComment("Lý do hoàn thành trễ hạn do Staff nhập khi đóng task quá hạn")
                .HasColumnName("overdue_reason");
            entity.Property(e => e.RequestId)
                .HasComment("Nguồn: Yêu cầu từ Vendor")
                .HasColumnName("request_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Pending'::character varying")
                .HasComment("Pending, In_Progress, Completed, Overdue")
                .HasColumnName("status");
            entity.Property(e => e.TaskType)
                .HasMaxLength(50)
                .HasComment("Repair, Maintenance, UtilityReading, CashCollection")
                .HasColumnName("task_type");
            entity.Property(e => e.Title)
                .HasComment("Tiêu đề tác vụ")
                .HasColumnName("title");

            entity.HasOne(d => d.AssignedToUser).WithMany(p => p.StaffTasks)
                .HasForeignKey(d => d.AssignedToUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_staff_tasks_users");

            entity.HasOne(d => d.Issue).WithMany(p => p.StaffTasks)
                .HasForeignKey(d => d.IssueId)
                .HasConstraintName("fk_staff_tasks_issues");

            entity.HasOne(d => d.Request).WithMany(p => p.StaffTasks)
                .HasForeignKey(d => d.RequestId)
                .HasConstraintName("fk_staff_tasks_requests");
        });

        modelBuilder.Entity<Stall>(entity =>
        {
            entity.HasKey(e => e.StallId).HasName("stalls_pkey");

            entity.ToTable("stalls");

            entity.HasIndex(e => new { e.MapX, e.MapY, e.Width, e.Height, e.Status, e.IsDeleted }, "idx_stalls_map");

            entity.HasIndex(e => e.Code, "stalls_code_key").IsUnique();

            entity.Property(e => e.StallId)
                .HasComment("Mã định danh quầy sạp")
                .HasColumnName("stall_id");
            entity.Property(e => e.AreaId)
                .HasComment("Thuộc khu vực phân khu nào trong chợ")
                .HasColumnName("area_id");
            entity.Property(e => e.Category)
                .HasMaxLength(50)
                .HasComment("Phân loại ngành hàng kinh doanh")
                .HasColumnName("category");
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .HasComment("Số hiệu sạp vật lý (VD: A-102)")
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Ngày khởi tạo")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("Thời điểm xóa mềm")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.FireInsuranceExpiry)
                .HasComment("Ngày hết hạn bảo hiểm hỏa hoạn bắt buộc")
                .HasColumnName("fire_insurance_expiry");
            entity.Property(e => e.Height)
                .HasComment("Kích thước hiển thị sạp trên Web UI")
                .HasColumnName("height");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasComment("Đánh dấu xóa mềm")
                .HasColumnName("is_deleted");
            entity.Property(e => e.MapX)
                .HasComment("Tọa độ điểm neo trên Floor Map")
                .HasColumnName("map_x");
            entity.Property(e => e.MapY)
                .HasComment("Tọa độ điểm neo trên Floor Map")
                .HasColumnName("map_y");
            entity.Property(e => e.Rotation)
                .HasDefaultValueSql("0")
                .HasComment("Góc xoay hiển thị sạp trên Floor Map")
                .HasColumnName("rotation");
            entity.Property(e => e.Size)
                .HasComment("Diện tích mặt bằng sạp (m²)")
                .HasColumnName("size");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Available'::character varying")
                .HasComment("Tình trạng sạp (Available, Rented, Maintenance)")
                .HasColumnName("status");
            entity.Property(e => e.SvgPath)
                .HasComment("Chuỗi dữ liệu vẽ vector hình dạng sạp tự do")
                .HasColumnName("svg_path");
            entity.Property(e => e.Width)
                .HasComment("Kích thước hiển thị sạp trên Web UI")
                .HasColumnName("width");

            entity.HasOne(d => d.Area).WithMany(p => p.Stalls)
                .HasForeignKey(d => d.AreaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_stalls_areas");
        });

        modelBuilder.Entity<SystemConfig>(entity =>
        {
            entity.HasKey(e => e.ConfigId).HasName("system_configs_pkey");

            entity.ToTable("system_configs");

            entity.HasIndex(e => e.ConfigKey, "system_configs_config_key_key").IsUnique();

            entity.Property(e => e.ConfigId)
                .HasComment("Mã cấu hình")
                .HasColumnName("config_id");
            entity.Property(e => e.ConfigKey)
                .HasMaxLength(100)
                .HasComment("Khóa cấu hình (VD: \"invoice_due_days\")")
                .HasColumnName("config_key");
            entity.Property(e => e.ConfigValue)
                .HasComment("Giá trị cấu hình tương ứng")
                .HasColumnName("config_value");
            entity.Property(e => e.Description)
                .HasComment("Mô tả ý nghĩa cấu hình")
                .HasColumnName("description");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Thời điểm cập nhật gần nhất")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedByUserId)
                .HasComment("Admin/Manager cập nhật cấu hình")
                .HasColumnName("updated_by_user_id");

            entity.HasOne(d => d.UpdatedByUser).WithMany(p => p.SystemConfigs)
                .HasForeignKey(d => d.UpdatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_system_configs_users");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("users_pkey");

            entity.ToTable("users");

            entity.HasIndex(e => e.Cccd, "idx_users_cccd");

            entity.HasIndex(e => new { e.Email, e.Phone, e.Status, e.IsDeleted }, "idx_users_login");

            entity.HasIndex(e => e.Cccd, "users_cccd_key").IsUnique();

            entity.HasIndex(e => e.Email, "users_email_key").IsUnique();

            entity.HasIndex(e => e.Phone, "users_phone_key").IsUnique();

            entity.Property(e => e.UserId)
                .HasComment("Mã định danh người dùng")
                .HasColumnName("user_id");
            entity.Property(e => e.Cccd)
                .HasMaxLength(20)
                .HasComment("Số Căn cước công dân phục vụ làm hợp đồng")
                .HasColumnName("cccd");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Ngày giờ khởi tạo tài khoản")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("Thời điểm thực hiện xóa mềm")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasComment("Email đăng nhập và nhận thông báo tài chính")
                .HasColumnName("email");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasComment("Đánh dấu xóa mềm tài khoản")
                .HasColumnName("is_deleted");
            entity.Property(e => e.LastLogin)
                .HasComment("Ghi nhận thời gian đăng nhập gần nhất")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("last_login");
            entity.Property(e => e.Name)
                .HasComment("Họ và tên đầy đủ")
                .HasColumnName("name");
            entity.Property(e => e.OtpCode)
                .HasMaxLength(10)
                .HasComment("Mã OTP xác minh quên mật khẩu/đổi số điện thoại")
                .HasColumnName("otp_code");
            entity.Property(e => e.OtpExpiredAt)
                .HasComment("Thời gian hết hạn của mã OTP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("otp_expired_at");
            entity.Property(e => e.Password)
                .HasMaxLength(255)
                .HasComment("Mật khẩu băm (BCrypt / Argon2)")
                .HasColumnName("password");
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .HasComment("Số điện thoại liên lạc")
                .HasColumnName("phone");
            entity.Property(e => e.RoleId)
                .HasComment("Liên kết tới bảng roles")
                .HasColumnName("role_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Active'::character varying")
                .HasComment("Trạng thái tài khoản (Active, Suspended, Locked)")
                .HasColumnName("status");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Ngày giờ cập nhật gần nhất")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_users_roles");
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasKey(e => e.VendorId).HasName("vendors_pkey");

            entity.ToTable("vendors");

            entity.HasIndex(e => e.TaxCode, "vendors_tax_code_key").IsUnique();

            entity.HasIndex(e => e.UserId, "vendors_user_id_key").IsUnique();

            entity.Property(e => e.VendorId)
                .HasComment("Mã tiểu thương")
                .HasColumnName("vendor_id");
            entity.Property(e => e.Address)
                .HasComment("Địa chỉ kinh doanh")
                .HasColumnName("address");
            entity.Property(e => e.BusinessLicense)
                .HasComment("Link giấy phép kinh doanh scan")
                .HasColumnName("business_license");
            entity.Property(e => e.BusinessName)
                .HasComment("Tên cơ sở kinh doanh")
                .HasColumnName("business_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasComment("Ngày khởi tạo hồ sơ")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.DeletedAt)
                .HasComment("Thời điểm xóa mềm")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("deleted_at");
            entity.Property(e => e.IsDeleted)
                .HasDefaultValue(false)
                .HasComment("Đánh dấu xóa mềm")
                .HasColumnName("is_deleted");
            entity.Property(e => e.TaxCode)
                .HasMaxLength(50)
                .HasComment("Mã số thuế doanh nghiệp")
                .HasColumnName("tax_code");
            entity.Property(e => e.UserId)
                .HasComment("Quan hệ 1-1 với tài khoản đăng nhập")
                .HasColumnName("user_id");

            entity.HasOne(d => d.User).WithOne(p => p.Vendor)
                .HasForeignKey<Vendor>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_vendors_users");
        });

        modelBuilder.Entity<Violation>(entity =>
        {
            entity.HasKey(e => e.ViolationId).HasName("violations_pkey");

            entity.ToTable("violations");

            entity.Property(e => e.ViolationId)
                .HasComment("Mã vi phạm")
                .HasColumnName("violation_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedByUserId)
                .HasComment("Staff lập biên bản")
                .HasColumnName("created_by_user_id");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết")
                .HasColumnName("description");
            entity.Property(e => e.FineAmount)
                .HasPrecision(18, 2)
                .HasDefaultValueSql("0")
                .HasComment("Số tiền phạt thực tế (VNĐ) - auto-fill từ default_fine, Staff có thể override")
                .HasColumnName("fine_amount");
            entity.Property(e => e.ImageUrl)
                .HasComment("Minh chứng hình ảnh")
                .HasColumnName("image_url");
            entity.Property(e => e.NotifiedAt)
                .HasComment("Thời điểm thông báo cho Vendor")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("notified_at");
            entity.Property(e => e.StallId)
                .HasComment("Sạp vi phạm")
                .HasColumnName("stall_id");
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValueSql("'Pending'::character varying")
                .HasComment("Trạng thái (Pending, Notified, Appealed, Finalized)")
                .HasColumnName("status");
            entity.Property(e => e.Title)
                .HasComment("Tiêu đề vi phạm")
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("updated_at");
            entity.Property(e => e.ViolationTypeId)
                .HasComment("Loại vi phạm (FK tới violation_types)")
                .HasColumnName("violation_type_id");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.Violations)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_violations_users");

            entity.HasOne(d => d.Stall).WithMany(p => p.Violations)
                .HasForeignKey(d => d.StallId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_violations_stalls");

            entity.HasOne(d => d.ViolationType).WithMany(p => p.Violations)
                .HasForeignKey(d => d.ViolationTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_violations_types");
        });

        modelBuilder.Entity<ViolationType>(entity =>
        {
            entity.HasKey(e => e.ViolationTypeId).HasName("violation_types_pkey");

            entity.ToTable("violation_types");

            entity.Property(e => e.ViolationTypeId)
                .HasComment("Mã loại vi phạm")
                .HasColumnName("violation_type_id");
            entity.Property(e => e.DefaultFine)
                .HasPrecision(18, 2)
                .HasDefaultValueSql("0")
                .HasComment("Mức phạt mặc định theo loại (VNĐ)")
                .HasColumnName("default_fine");
            entity.Property(e => e.Description)
                .HasComment("Mô tả chi tiết loại vi phạm")
                .HasColumnName("description");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasComment("Đánh dấu ẩn/hiện loại vi phạm")
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasComment("Tên loại vi phạm (VD: Lấn chiếm, Vệ sinh, PCCC, Kinh doanh trái phép)")
                .HasColumnName("name");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
