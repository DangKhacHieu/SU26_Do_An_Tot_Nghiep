using System;

namespace STMM.Business.DTOs.User
{
    public class UserDetailDto
    {
        public int UserId { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string RoleDescription { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Cccd { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? LastLogin { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? BusinessName { get; set; }
    }
}
