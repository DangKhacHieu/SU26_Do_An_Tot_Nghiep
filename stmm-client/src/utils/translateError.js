/**
 * Smart Error Message Translator Utility
 * Translates backend & client validation error messages dynamically based on current i18next language.
 */

export const translateError = (rawMsg, t) => {
  if (!rawMsg) return "";
  if (typeof rawMsg !== "string") return String(rawMsg);

  const clean = rawMsg.trim();
  if (!clean) return "";

  // 1. Direct match with i18n dictionary
  const directMatch = t(clean);
  if (directMatch && directMatch !== clean) {
    return directMatch;
  }

  // 2. Match with or without trailing period
  const withDot = clean.endsWith(".") ? clean : `${clean}.`;
  const withoutDot = clean.replace(/\.+$/, "");

  const dotMatch = t(withDot);
  if (dotMatch && dotMatch !== withDot) {
    return dotMatch;
  }

  const noDotMatch = t(withoutDot);
  if (noDotMatch && noDotMatch !== withoutDot) {
    return noDotMatch;
  }

  // 3. Pattern-based intelligent matching for common validation messages
  const lower = clean.toLowerCase();

  // Password requirement (8-12 characters, uppercase, lowercase, numbers, special characters)
  if (
    (lower.includes("mật khẩu") && (lower.includes("8-12") || lower.includes("8 đến 12") || lower.includes("chữ hoa"))) ||
    (lower.includes("password") && lower.includes("8-12"))
  ) {
    return t("Mật khẩu phải từ 8-12 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
  }

  // Invalid email or password
  if (
    lower.includes("email hoặc mật khẩu không chính xác") ||
    lower.includes("incorrect email or password") ||
    lower.includes("email/mật khẩu không chính xác") ||
    (lower.includes("email") && lower.includes("mật khẩu") && lower.includes("chính xác"))
  ) {
    return t("Email hoặc mật khẩu không chính xác.");
  }

  // Incorrect password
  if (lower.includes("mật khẩu không chính xác") || lower.includes("incorrect password")) {
    return t("Mật khẩu không chính xác.");
  }

  // Account does not exist
  if (lower.includes("tài khoản không tồn tại") || lower.includes("account does not exist") || lower.includes("email không tồn tại")) {
    return t("Tài khoản không tồn tại.");
  }

  // Account locked
  if (lower.includes("tài khoản đã bị khóa") || lower.includes("account is locked") || lower.includes("tạm dừng")) {
    return t("Tài khoản đã bị khóa hoặc tạm dừng.");
  }

  // Unverified email
  if (lower.includes("chưa được xác thực") || lower.includes("not been verified")) {
    return t("Tài khoản chưa được xác thực email. Vui lòng xác thực trước khi đăng nhập.");
  }

  // Name validation
  if (lower.includes("họ và tên") || lower.includes("họ tên") || (lower.includes("name") && lower.includes("required"))) {
    if (lower.includes("vượt quá") || lower.includes("exceed")) {
      return t("Họ và tên không được vượt quá 100 ký tự.");
    }
    return t("Họ và tên không được để trống.");
  }

  // Email format & required
  if (lower.includes("email")) {
    if (lower.includes("đã được sử dụng") || lower.includes("already in use")) {
      return t("Email đã được sử dụng.");
    }
    if (lower.includes("định dạng") || lower.includes("invalid email")) {
      return t("Email không đúng định dạng.");
    }
    if (lower.includes("trống") || lower.includes("required")) {
      return t("Email không được để trống.");
    }
  }

  // Password required
  if (lower.includes("mật khẩu") || lower.includes("password")) {
    if (lower.includes("trống") || lower.includes("required")) {
      return t("Mật khẩu không được để trống.");
    }
    if (lower.includes("khớp") || lower.includes("match")) {
      return t("Mật khẩu mới và mật khẩu xác nhận không khớp.");
    }
  }

  // Phone number validation
  if (lower.includes("số điện thoại") || lower.includes("phone")) {
    if (lower.includes("đã được sử dụng") || lower.includes("already in use")) {
      return t("Số điện thoại đã được sử dụng.");
    }
    if (lower.includes("chữ số") || lower.includes("digits")) {
      return t("Số điện thoại phải chứa từ 9 đến 11 chữ số.");
    }
    if (lower.includes("trống") || lower.includes("required")) {
      return t("Số điện thoại không được để trống.");
    }
  }

  // CCCD validation
  if (lower.includes("cccd")) {
    if (lower.includes("chữ số") || lower.includes("digits")) {
      return t("Số CCCD phải chứa từ 9 đến 12 chữ số.");
    }
    if (lower.includes("trống") || lower.includes("required")) {
      return t("Số CCCD không được để trống.");
    }
  }

  // Review / Market Feedback
  if (lower.includes("đánh giá") || lower.includes("review")) {
    if (lower.includes("nội dung") || lower.includes("comment")) {
      return t("Vui lòng nhập nội dung đánh giá của bạn.");
    }
    if (lower.includes("sao") || lower.includes("rating")) {
      return t("Vui lòng chọn số sao đánh giá.");
    }
  }

  // Network / Connection
  if (lower.includes("không kết nối được api") || lower.includes("err_network") || lower.includes("network error")) {
    return t("Không kết nối được API. Hãy kiểm tra API đã chạy đúng cổng trong file .env chưa.");
  }

  // Fallback to original or i18n
  return t(clean);
};
