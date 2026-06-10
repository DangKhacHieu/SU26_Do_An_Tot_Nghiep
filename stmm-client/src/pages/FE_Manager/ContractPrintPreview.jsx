import { useState } from "react";
import { createPortal } from "react-dom";
import "./ContractPrintPreview.css";

export default function ContractPrintPreview({ contract, onClose, onSaveSuccess, addToast }) {
  // Configurable Bên A details
  const [lessor, setLessor] = useState({
    name: "CÔNG TY TNHH QUẢN LÝ CHỢ TRUNG TÂM MHMS",
    address: "Khu Phố 6, Phường Linh Trung, Thành phố Thủ Đức, TP. Hồ Chí Minh",
    taxCode: "0312345678",
    cccd: "079090123456",
    licenseNum: "0312345678",
    licenseIssuer: "Sở Kế hoạch và Đầu tư TP.HCM",
    licenseDate: "15/01/2020",
    phone: "028.3724.4555",
    email: "management@centralmarket.vn",
    representative: "Nguyễn Văn Trưởng",
    position: "Giám Đốc Điều Hành",
    bankAccount: "1029384756",
    bankName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) - Chi nhánh TP.HCM",
  });

  // Configurable Bên B details (business name, address, tax code, bank account, bank name)
  const [lessee, setLessee] = useState({
    businessName: contract?.vendorBusinessName || contract?.vendorName || "",
    address: contract?.vendorAddress || "",
    taxCode: contract?.vendorTaxCode || "",
    bankAccount: contract?.vendorBankAccount || "",
    bankName: contract?.vendorBankName || "",
  });

  const [saving, setSaving] = useState(false);

  const handleSaveVendorInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5056/api/manager/contracts/${contract.contractId}/vendor-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: lessee.businessName.trim() || null,
          address: lessee.address.trim() || null,
          taxCode: lessee.taxCode.trim() || null,
          bankAccount: lessee.bankAccount.trim() || null,
          bankName: lessee.bankName.trim() || null,
        }),
      });

      if (res.ok) {
        const updatedContract = await res.json();
        if (addToast) {
          addToast("Lưu thông tin Bên B thành công!", "success");
        }
        if (onSaveSuccess) {
          onSaveSuccess(updatedContract);
        }
      } else {
        const data = await res.json();
        if (addToast) {
          addToast(data.message || "Không thể lưu thông tin Bên B.", "error");
        }
      }
    } catch (err) {
      if (addToast) {
        addToast("Lỗi kết nối máy chủ.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Calculate lease term in months/years
  const calculateDuration = () => {
    if (!contract?.startDate || !contract?.endDate) return "N/A";
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 360) {
      const years = (diffDays / 365).toFixed(1);
      return `${years} năm`;
    }
    const months = (diffDays / 30.4).toFixed(0);
    return `${months} tháng`;
  };

  const formatCurrency = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  // Convert number to Vietnamese words for currency
  const numberToWords = (num) => {
    if (num === 0) return "Không đồng";
    
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const places = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
    
    let words = "";
    let temp = Math.floor(num);
    let placeIndex = 0;
    
    while (temp > 0) {
      const chunk = temp % 1000;
      if (chunk > 0) {
        let chunkWords = "";
        const hundreds = Math.floor(chunk / 100);
        const tens = Math.floor((chunk % 100) / 10);
        const ones = chunk % 10;
        
        if (hundreds > 0) {
          chunkWords += units[hundreds] + " trăm ";
        } else if (words !== "") {
          chunkWords += "không trăm ";
        }
        
        if (tens > 1) {
          chunkWords += units[tens] + " mươi ";
          if (ones === 1) chunkWords += "mốt";
          else if (ones === 5) chunkWords += "lăm";
          else if (ones > 0) chunkWords += units[ones];
        } else if (tens === 1) {
          chunkWords += "mười ";
          if (ones === 5) chunkWords += "lăm";
          else if (ones > 0) chunkWords += units[ones];
        } else {
          if (ones > 0) {
            if (hundreds > 0 || words !== "") chunkWords += "lẻ ";
            chunkWords += units[ones];
          }
        }
        words = chunkWords + " " + places[placeIndex] + " " + words;
      }
      temp = Math.floor(temp / 1000);
      placeIndex++;
    }
    
    words = words.trim().replace(/\s+/g, " ");
    return words.charAt(0).toUpperCase() + words.slice(1) + " đồng chẵn";
  };

  const handlePrint = () => {
    window.print();
  };

  // Format today's date
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, "0");
  const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
  const todayYear = today.getFullYear();

  return createPortal(
    <div className="print-preview-modal animate-fade-in">
      <div className="print-controls no-print">
        <div className="controls-header">
          <h3>Cấu hình & Xuất file PDF</h3>
          <button className="btn-close-preview" onClick={onClose}>
            ✕ Đóng
          </button>
        </div>

        <div className="control-group">
          <h4>Thông tin Bên A (Bên Cho Thuê)</h4>
          <div className="control-row">
            <label>Tên Công ty/Cá nhân</label>
            <input 
              type="text" 
              value={lessor.name} 
              onChange={(e) => setLessor({ ...lessor, name: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Địa chỉ trụ sở chính</label>
            <input 
              type="text" 
              value={lessor.address} 
              onChange={(e) => setLessor({ ...lessor, address: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Mã số thuế</label>
            <input 
              type="text" 
              value={lessor.taxCode} 
              onChange={(e) => setLessor({ ...lessor, taxCode: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Số CCCD/CMND</label>
            <input 
              type="text" 
              value={lessor.cccd} 
              onChange={(e) => setLessor({ ...lessor, cccd: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Số ĐKKD / Giấy phép</label>
            <input 
              type="text" 
              value={lessor.licenseNum} 
              onChange={(e) => setLessor({ ...lessor, licenseNum: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Do cơ quan nào cấp</label>
            <input 
              type="text" 
              value={lessor.licenseIssuer} 
              onChange={(e) => setLessor({ ...lessor, licenseIssuer: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Cấp ngày</label>
            <input 
              type="text" 
              value={lessor.licenseDate} 
              onChange={(e) => setLessor({ ...lessor, licenseDate: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Điện thoại</label>
            <input 
              type="text" 
              value={lessor.phone} 
              onChange={(e) => setLessor({ ...lessor, phone: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Email</label>
            <input 
              type="text" 
              value={lessor.email} 
              onChange={(e) => setLessor({ ...lessor, email: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Người đại diện</label>
            <input 
              type="text" 
              value={lessor.representative} 
              onChange={(e) => setLessor({ ...lessor, representative: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Chức vụ</label>
            <input 
              type="text" 
              value={lessor.position} 
              onChange={(e) => setLessor({ ...lessor, position: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Số tài khoản ngân hàng</label>
            <input 
              type="text" 
              value={lessor.bankAccount} 
              onChange={(e) => setLessor({ ...lessor, bankAccount: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Tại Ngân hàng</label>
            <input 
              type="text" 
              value={lessor.bankName} 
              onChange={(e) => setLessor({ ...lessor, bankName: e.target.value })} 
            />
          </div>
        </div>

        <div className="control-group">
          <h4>Thông tin Bên B (Bên Thuê)</h4>
          <div className="control-row">
            <label>Tên Tổ chức/Công ty/Cá nhân</label>
            <input 
              type="text" 
              placeholder="Tên Bên B" 
              value={lessee.businessName} 
              onChange={(e) => setLessee({ ...lessee, businessName: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Địa chỉ trụ sở chính</label>
            <input 
              type="text" 
              placeholder="Địa chỉ" 
              value={lessee.address} 
              onChange={(e) => setLessee({ ...lessee, address: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Mã số thuế</label>
            <input 
              type="text" 
              placeholder="Mã số thuế" 
              value={lessee.taxCode} 
              onChange={(e) => setLessee({ ...lessee, taxCode: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Số tài khoản ngân hàng Bên B</label>
            <input 
              type="text" 
              placeholder="Số tài khoản" 
              value={lessee.bankAccount} 
              onChange={(e) => setLessee({ ...lessee, bankAccount: e.target.value })} 
            />
          </div>
          <div className="control-row">
            <label>Tại Ngân hàng Bên B</label>
            <input 
              type="text" 
              placeholder="Tên ngân hàng" 
              value={lessee.bankName} 
              onChange={(e) => setLessee({ ...lessee, bankName: e.target.value })} 
            />
          </div>
          <button 
            type="button" 
            className="btn-save-vendor-info"
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background-color 0.2s"
            }}
            onClick={handleSaveVendorInfo}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu thông tin Bên B"}
          </button>
        </div>

        <div className="control-group tip-box">
          <h4>💡 Hướng dẫn tải PDF</h4>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
            1. Chọn <strong>Lưu dưới dạng PDF</strong> làm Máy in đích.<br />
            2. Trong phần <strong>Cài đặt khác</strong>, hãy <strong>BỎ CHỌN "Tiêu đề và chân trang" (Headers and footers)</strong> để xóa các dòng địa chỉ web và ngày tháng in trên trang giấy.<br />
            3. Đặt Tỷ lệ (Scale) là <strong>100%</strong> hoặc <strong>Vừa vặn với trang</strong>.
          </p>
        </div>

        <div className="actions-panel">
          <button className="btn-print-action" onClick={handlePrint}>
            Xuất file PDF
          </button>
        </div>

      </div>

      <div className="print-preview-container print-area">
        
        {/* PAGE 1: NATIONAL HEADER, TITLE, BASIS, LESSOR & LESSEE */}
        <div className="a4-page">
          <div className="print-header">
            <div className="header-national">
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
              <span>Độc lập – Tự do – Hạnh phúc</span>
              <div className="header-divider"></div>
            </div>
            <div className="header-title">
              <h2>HỢP ĐỒNG THUÊ KIOT</h2>
              <span>Số: {contract?.contractId ? String(contract.contractId).padStart(4, "0") : "....."}/HĐ-MHMS</span>
            </div>
          </div>

          <div className="print-content">
            <ul className="legal-basis">
              <li>Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015;</li>
              <li>Căn cứ Luật Kinh doanh bất động sản số 29/2023/QH15 ngày 28 tháng 11 năm 2023;</li>
              <li>Căn cứ Luật Đất đai số 31/2024/QH15 ngày 18 tháng 01 năm 2024;</li>
              <li>Căn cứ nhu cầu và sự thỏa thuận của hai bên.</li>
            </ul>

            <p className="intro-text">
              Hôm nay, ngày {todayDay} tháng {todayMonth} năm {todayYear}, tại văn phòng Ban quản lý Chợ Trung Tâm, chúng tôi gồm:
            </p>

            <div className="party-info">
              <h3>BÊN A: TÊN CÔNG TY/CÁ NHÂN CHO THUÊ</h3>
              <ul>
                <li>• <strong>Tên Tổ chức/Công ty/Cá nhân:</strong> {lessor.name}</li>
                <li>• <strong>Địa chỉ trụ sở chính:</strong> {lessor.address}</li>
                <li>• <strong>Mã số thuế/Số:</strong> {lessor.taxCode}</li>
                <li>• <strong>CCCD/CMND:</strong> {lessor.cccd}</li>
                <li>• <strong>Giấy chứng nhận đăng ký doanh nghiệp số:</strong> {lessor.licenseNum}</li>
                <li>• <strong>Do:</strong> {lessor.licenseIssuer} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Cấp ngày:</strong> {lessor.licenseDate}</li>
                <li>• <strong>Điện thoại:</strong> {lessor.phone} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Email:</strong> {lessor.email}</li>
                <li>• <strong>Người đại diện:</strong> {lessor.representative} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Chức vụ:</strong> {lessor.position}</li>
                <li>• <strong>Tài khoản ngân hàng:</strong> {lessor.bankAccount}</li>
                <li>• <strong>Tại Ngân hàng:</strong> {lessor.bankName}</li>
              </ul>
              <p className="party-abbreviation">(Sau đây gọi tắt là bên A)</p>
            </div>

            <div className="party-info" style={{ marginTop: "12pt" }}>
              <h3>BÊN B: TÊN CÔNG TY/CÁ NHÂN THUÊ</h3>
              <ul>
                <li>• <strong>Tên Tổ chức/Công ty/Cá nhân:</strong> {lessee.businessName || "..................................................."}</li>
                <li>• <strong>Địa chỉ trụ sở chính/thường trú:</strong> {lessee.address || "..................................................."}</li>
                <li>• <strong>Mã số thuế/Số:</strong> {lessee.taxCode || "..................................................."}</li>
                <li>• <strong>CCCD/CMND:</strong> {contract?.vendorCccd || "..................................................."}</li>
                <li>• <strong>Giấy chứng nhận đăng ký doanh nghiệp số:</strong> {lessee.taxCode ? `GPDKKD số ${lessee.taxCode}` : "..................................................."}</li>
                <li>• <strong>Do:</strong> Sở Kế hoạch và Đầu tư &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Cấp ngày:</strong> ...............................</li>
                <li>• <strong>Điện thoại:</strong> {contract?.vendorPhone || "................................"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Email:</strong> {contract?.vendorEmail || "................................"}</li>
                <li>• <strong>Người đại diện:</strong> {contract?.vendorName || "................................"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Chức vụ:</strong> Đại diện pháp luật</li>
                <li>• <strong>Tài khoản ngân hàng:</strong> {lessee.bankAccount || "..................................................."}</li>
                <li>• <strong>Tại Ngân hàng:</strong> {lessee.bankName || "..................................................."}</li>
              </ul>
              <p className="party-abbreviation">(Sau đây gọi tắt là bên B)</p>
            </div>

            <p className="agreement-clause" style={{ marginTop: "10pt" }}>
              Hai Bên (sau đây gọi chung là "Các Bên" và gọi riêng là "Mỗi Bên") thống nhất ký kết Hợp đồng thuê KIOT này (sau đây gọi là "Hợp đồng") với các điều khoản và điều kiện sau đây:
            </p>
          </div>
        </div>

        {/* PAGE 3: DEFINITIONS AND STALL DETAILS */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">1. ĐỊNH NGHĨA VÀ GIẢI THÍCH</div>
            <p className="clause-item"><strong>1.1. Trong Hợp đồng này, các thuật ngữ dưới đây được hiểu như sau:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Ki-ốt:</strong> là không gian kinh doanh cụ thể, có vách ngăn, cửa ra vào và các tiện ích cơ bản, thuộc sở hữu hợp pháp của Bên A, được cho Bên B thuê theo các điều khoản của Hợp đồng này.</li>
              <li><strong>b. Giá thuê:</strong> là khoản tiền mà Bên B phải thanh toán cho Bên A định kỳ để sử dụng Ki-ốt, không bao gồm các chi phí dịch vụ, tiện ích khác trừ khi có thỏa thuận riêng.</li>
              <li><strong>c. Tiền đặt cọc:</strong> là khoản tiền mà Bên B nộp cho Bên A để đảm bảo việc thực hiện các nghĩa vụ trong Hợp đồng và sẽ được hoàn trả hoặc khấu trừ theo quy định tại Điều 5 của Hợp đồng này.</li>
              <li><strong>d. Hư hỏng lớn:</strong> là những hỏng hóc gây ảnh hưởng nghiêm trọng đến kết cấu, an toàn hoặc chức năng cơ bản của Ki-ốt như sập tường, dột mái, hỏng hệ thống điện/nước chính.</li>
              <li><strong>e. Hao mòn tự nhiên:</strong> là sự suy giảm chất lượng, giá trị của Ki-ốt và trang thiết bị gắn liền với Ki-ốt do quá trình sử dụng bình thường, không do lỗi cố ý hoặc sơ suất của Bên B.</li>
              <li><strong>f. Sự kiện Bất khả kháng:</strong> là một sự kiện xảy ra một cách khách quan, không thể lường trước được và không thể khắc phục được mặc dù đã áp dụng mọi biện pháp cần thiết và trong khả năng cho phép.</li>
              <li><strong>g. Thiết bị:</strong> là các vật dụng, máy móc, trang thiết bị được lắp đặt trong Ki-ốt phục vụ cho mục đích kinh doanh của Bên B.</li>
            </ul>
            <p className="clause-item"><strong>1.2 Giải thích:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Tiêu đề và các điều khoản chỉ nhằm mục đích tham khảo, không có giá trị diễn giải hay giới hạn nội dung của Hợp đồng.</li>
              <li><strong>b.</strong> Hợp đồng này được diễn giải một cách toàn diện và thiện chí. Trong trường hợp có bất kỳ sự mâu thuẫn nào giữa các điều khoản, các bên sẽ ưu tiên thảo luận và thống nhất để giải quyết.</li>
              <li><strong>c.</strong> Việc tham chiếu đến "ngày", "tháng", "năm" trong Hợp đồng này được hiểu là các ngày dương lịch.</li>
            </ul>

            <div className="section-title">2. ĐỐI TƯỢNG VÀ MỤC ĐÍCH THUÊ</div>
            <p className="clause-item"><strong>2.1 Đối tượng thuê:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Bên A đồng ý cho Bên B thuê một Ki-ốt duy nhất, thuộc quyền sở hữu/sử dụng hợp pháp của Bên A.</li>
              <li><strong>b.</strong> Thông tin chi tiết về Ki-ốt bao gồm:</li>
              <ul className="bullet-sub-list">
                <li>• Vị trí chính xác: Ki-ốt số <strong>{contract?.stallCode || "....."}</strong>, tại khu vực <strong>{contract?.areaName || "....."}</strong>, thuộc <strong>{contract?.marketName || "MHMS Central Market"}</strong>.</li>
                <li>• Diện tích sàn: <strong>{contract?.stallSize ? `${contract.stallSize} m²` : "..... m²"}</strong>.</li>
                <li>• Tình trạng ban đầu: Ki-ốt được bàn giao cho Bên B với tình trạng mới hoàn toàn, có sẵn sàn gạch, trần thạch cao, hệ thống chiếu sáng cơ bản.</li>
                <li>• Thiết bị gắn liền: Hệ thống điều hòa, cửa cuốn bảo vệ, tủ cấp điện riêng biệt.</li>
              </ul>
            </ul>
            <p className="clause-item"><strong>2.2 Mục đích thuê:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Ki-ốt được sử dụng để kinh doanh hoạt động thương mại và các dịch vụ hợp pháp phù hợp với khu chợ.</li>
              <li><strong>b.</strong> Bên B cam kết không sử dụng Ki-ốt vào bất kỳ mục đích nào khác ngoài mục đích đã ghi trong Hợp đồng này mà chưa có sự đồng ý bằng văn bản của Bên A.</li>
              <li><strong>c.</strong> Bên B cam kết không sử dụng Ki-ốt cho các hoạt động vi phạm pháp luật Việt Nam. Bất kỳ thiệt hại nào phát sinh do vi phạm này, Bên B phải hoàn toàn chịu trách nhiệm.</li>
            </ul>
          </div>
        </div>

        {/* PAGE 4: LEASE TERM AND RENT FEES */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">3. THỜI HẠN THUÊ VÀ GIA HẠN HỢP ĐỒNG</div>
            <p className="clause-item"><strong>3.1 Thời hạn thuê:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Thời hạn thuê Ki-ốt là <strong>{calculateDuration()}</strong>, kể từ ngày <strong>{contract?.startDate || "....."}</strong> đến hết ngày <strong>{contract?.endDate || "....."}</strong>.</li>
              <li><strong>b.</strong> Trong trường hợp thời gian bàn giao thực tế khác với ngày bắt đầu trong Hợp đồng, hai bên sẽ lập Biên bản bàn giao Ki-ốt, và thời hạn thuê sẽ được tính từ ngày bàn giao thực tế.</li>
            </ul>
            <p className="clause-item"><strong>3.2 Gia hạn Hợp đồng:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Trước khi Hợp đồng hết hạn <strong>60 (sáu mươi)</strong> ngày, nếu Bên B có nhu cầu tiếp tục thuê, Bên B phải gửi thông báo bằng văn bản cho Bên A.</li>
              <li><strong>b.</strong> Trong trường hợp Bên A đồng ý gia hạn, hai bên sẽ thảo luận và ký kết phụ lục Hợp đồng hoặc Hợp đồng mới với các điều khoản được thỏa thuận lại, bao gồm nhưng không giới hạn ở Giá thuê, thời hạn thuê, và các quyền lợi, nghĩa vụ khác.</li>
              <li><strong>c.</strong> Nếu Bên B không gửi thông báo đúng thời hạn hoặc hai bên không đạt được thỏa thuận về việc gia hạn, Hợp đồng này sẽ chấm dứt hiệu lực khi hết thời hạn đã thỏa thuận và Bên B phải bàn giao Ki-ốt cho Bên A.</li>
            </ul>
            <p className="clause-item"><strong>3.3 Chấm dứt Hợp đồng trước thời hạn:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Hợp đồng có thể bị chấm dứt trước thời hạn bởi sự thỏa thuận bằng văn bản của cả hai Bên.</li>
              <li><strong>b.</strong> Bên A có quyền đơn phương chấm dứt Hợp đồng trước thời hạn nếu Bên B vi phạm nghiêm trọng các điều khoản đã thỏa thuận và không khắc phục trong thời gian <strong>15 (mười lăm)</strong> ngày kể từ ngày nhận được thông báo bằng văn bản từ Bên A.</li>
              <li><strong>c.</strong> Bên B có quyền đơn phương chấm dứt Hợp đồng trước thời hạn nếu Bên A vi phạm nghiêm trọng các nghĩa vụ của mình, gây ảnh hưởng đến hoạt động kinh doanh của Bên B và không khắc phục trong thời gian <strong>15 (mười lăm)</strong> ngày kể từ ngày nhận được thông báo bằng văn bản từ Bên B.</li>
            </ul>

            <div className="section-title">4. GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
            <p className="clause-item"><strong>4.1 Giá thuê:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Giá thuê Ki-ốt là: <strong>{formatCurrency(contract?.rentFee)} VND/tháng</strong> (Bằng chữ: <em>{numberToWords(contract?.rentFee)}</em>).</li>
              <li><strong>b.</strong> Giá thuê này là cố định trong suốt thời hạn thuê đầu tiên của Hợp đồng và có thể được điều chỉnh sau đó.</li>
              <li><strong>c.</strong> Việc điều chỉnh Giá thuê (nếu có) khi gia hạn sẽ được thực hiện vào chu kỳ tiếp theo, với mức tăng không quá <strong>10%</strong> so với giá thuê của kỳ trước.</li>
            </ul>
            <p className="clause-item"><strong>4.2 Các chi phí khác:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Các chi phí phát sinh trong quá trình thuê như điện, nước, internet, phí vệ sinh, phí bảo vệ, v.v. sẽ do Bên B tự chi trả.</li>
              <li><strong>b.</strong> Mức phí cụ thể cho từng loại dịch vụ sẽ được tính dựa trên đồng hồ đo riêng hoặc quy định thực tế của Ban quản lý chợ/khu vực.</li>
            </ul>
            <p className="clause-item"><strong>4.3 Phương thức và thời điểm thanh toán:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Bên B sẽ thanh toán tiền thuê và các chi phí khác cho Bên A định kỳ từ ngày <strong>01 đến ngày 05</strong> mỗi tháng.</li>
              <li><strong>b.</strong> Hình thức thanh toán: Chuyển khoản ngân hàng.</li>
              <li><strong>c.</strong> Thông tin chuyển khoản: Bên B sẽ chuyển tiền vào tài khoản của Bên A như đã nêu trong phần mở đầu của Hợp đồng này. Bên B phải ghi rõ nội dung chuyển khoản.</li>
            </ul>
            <p className="clause-item"><strong>4.4 Xử lý chậm thanh toán:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Nếu Bên B chậm thanh toán tiền thuê quá <strong>05 (năm)</strong> ngày so với thời hạn đã thỏa thuận, Bên B sẽ phải chịu lãi phạt chậm trả.</li>
              <li><strong>b.</strong> Mức lãi phạt chậm trả là <strong>0.1%</strong> trên tổng số tiền thuê chậm trả cho mỗi ngày chậm trả.</li>
              <li><strong>c.</strong> Sau khi thời gian chậm trả vượt quá <strong>30 (ba mươi)</strong> ngày, Bên A có quyền đơn phương chấm dứt Hợp đồng, thu hồi Ki-ốt và Bên B phải bồi thường thiệt hại cho Bên A theo quy định tại Điều 10 của Hợp đồng này.</li>
            </ul>
          </div>
        </div>

        {/* PAGE 5: DEPOSIT AND LESSOR RIGHTS */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">5. TIỀN ĐẶT CỌC</div>
            <p className="clause-item"><strong>5.1 Số tiền đặt cọc:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Bên B đặt cọc cho Bên A một khoản tiền là: <strong>{formatCurrency(contract?.deposit)} VND</strong> (Bằng chữ: <em>{numberToWords(contract?.deposit)}</em>).</li>
              <li><strong>b.</strong> Khoản tiền này tương đương với khoảng {contract?.rentFee ? (contract.deposit / contract.rentFee).toFixed(1) : "..."} tháng tiền thuê và được thanh toán cùng thời điểm ký kết Hợp đồng này.</li>
            </ul>
            <p className="clause-item"><strong>5.2 Mục đích sử dụng tiền đặt cọc:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Khoản tiền đặt cọc này được sử dụng để đảm bảo Bên B thực hiện đầy đủ và đúng các nghĩa vụ đã cam kết trong Hợp đồng.</li>
              <li><strong>b.</strong> Trong trường hợp Bên B vi phạm Hợp đồng, Bên A có quyền sử dụng một phần hoặc toàn bộ tiền đặt cọc để bù đắp các thiệt hại phát sinh.</li>
              <li><strong>c.</strong> Sau khi Hợp đồng kết thúc, nếu Bên B đã thực hiện đầy đủ nghĩa vụ của mình và bàn giao lại Ki-ốt trong tình trạng ban đầu (trừ hao mòn tự nhiên), Bên A sẽ hoàn trả toàn bộ tiền đặt cọc cho Bên B.</li>
            </ul>
            <p className="clause-item"><strong>5.3 Hoàn trả tiền đặt cọc:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Tiền đặt cọc sẽ được hoàn trả cho Bên B trong vòng <strong>07 (bảy)</strong> ngày làm việc kể từ ngày Hợp đồng chấm dứt và hai bên đã ký Biên bản bàn giao Ki-ốt.</li>
              <li><strong>b.</strong> Nếu Bên B đơn phương chấm dứt Hợp đồng trước thời hạn mà không có lý do chính đáng hoặc vi phạm Hợp đồng dẫn đến việc chấm dứt, Bên B sẽ mất toàn bộ tiền đặt cọc.</li>
            </ul>

            <div className="section-title">6. QUYỀN VÀ NGHĨA VỤ CỦA BÊN CHO THUÊ (BÊN A)</div>
            <p className="clause-item"><strong>6.1 Quyền của Bên A:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Quyền nhận thanh toán và yêu cầu thực hiện nghĩa vụ:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên A có quyền nhận đầy đủ và đúng hạn số tiền thuê cùng các chi phí dịch vụ khác theo quy định tại Điều 4 của Hợp đồng.</li>
                <li>• Trong trường hợp Bên B chậm thanh toán hoặc vi phạm bất kỳ nghĩa vụ nào, Bên A có quyền gửi thông báo bằng văn bản yêu cầu Bên B khắc phục trong một khoảng thời gian hợp lý.</li>
                <li>• Nếu Bên B không thực hiện đúng theo thông báo, Bên A có quyền áp dụng các biện pháp xử lý vi phạm đã được quy định, bao gồm cả việc tính lãi phạt chậm trả và thu hồi Ki-ốt.</li>
              </ul>
              <li><strong>b. Quyền kiểm tra và giám sát:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên A có quyền, sau khi đã thông báo trước cho Bên B ít nhất <strong>24 (hai mươi bốn)</strong> giờ, được vào Ki-ốt để kiểm tra tình trạng sử dụng, bảo trì, hoặc thực hiện các công việc sửa chữa lớn (nếu cần).</li>
                <li>• Bên A có quyền yêu cầu Bên B ngừng ngay các hành vi vi phạm Hợp đồng, đặc biệt là việc sử dụng Ki-ốt sai mục đích, kinh doanh hàng hóa cấm, hoặc gây ảnh hưởng đến an ninh trật tự, vệ sinh môi trường của khu vực xung quanh.</li>
              </ul>
              <li><strong>c. Quyền đơn phương chấm dứt Hợp đồng:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên A có quyền đơn phương chấm dứt Hợp đồng và thu hồi Ki-ốt nếu Bên B vi phạm nghiêm trọng một trong các điều khoản của Hợp đồng này và không khắc phục sau <strong>15 (mười lăm)</strong> ngày kể từ ngày nhận được thông báo bằng văn bản từ Bên A.</li>
                <li>• Các vi phạm nghiêm trọng bao gồm nhưng không giới hạn: không thanh toán tiền thuê trong thời gian dài, sử dụng Ki-ốt sai mục đích, cho thuê lại Ki-ốt mà không có sự đồng ý của Bên A.</li>
              </ul>
              <li><strong>d. Quyền định đoạt tài sản:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên A có quyền bán, chuyển nhượng hoặc thế chấp Ki-ốt cho bên thứ ba, với điều kiện phải thông báo trước bằng văn bản cho Bên B và đảm bảo các quyền lợi của Bên B theo Hợp đồng này không bị ảnh hưởng.</li>
                <li>• Trong trường hợp có sự thay đổi về quyền sở hữu Ki-ốt, Hợp đồng này vẫn có hiệu lực và Bên B vẫn được quyền thuê Ki-ốt cho đến hết thời hạn đã thỏa thuận.</li>
              </ul>
            </ul>
          </div>
        </div>

        {/* PAGE 6: LESSOR OBLIGATIONS & LESSEE RIGHTS */}
        <div className="a4-page">
          <div className="print-content">
            <p className="clause-item"><strong>6.2 Nghĩa vụ của Bên A:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Nghĩa vụ bàn giao và duy trì Ki-ốt:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Giao Ki-ốt cho Bên B đúng thời hạn, đúng vị trí và trong tình trạng đã thỏa thuận tại Điều 2 của Hợp đồng này.</li>
                <li>• Đảm bảo Ki-ốt không có tranh chấp về quyền sở hữu hoặc quyền sử dụng trong suốt thời gian Hợp đồng có hiệu lực.</li>
                <li>• Chịu trách nhiệm sửa chữa các hư hỏng lớn của Ki-ốt (như kết cấu, mái, hệ thống điện/nước chính) do hao mòn tự nhiên hoặc Sự kiện Bất khả kháng. Bên A phải tiến hành sửa chữa trong vòng <strong>07 (bảy)</strong> ngày kể từ khi nhận được thông báo của Bên B.</li>
              </ul>
              <li><strong>b. Nghĩa vụ cung cấp tiện ích:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Cung cấp đầy đủ và ổn định các dịch vụ tiện ích cơ bản như điện, nước, đảm bảo hệ thống hoạt động bình thường, tuân thủ các quy định hiện hành.</li>
                <li>• Phối hợp với Ban quản lý chợ/khu vực để đảm bảo môi trường kinh doanh thuận lợi, an toàn cho Bên B.</li>
              </ul>
              <li><strong>c. Nghĩa vụ hỗ trợ và hợp tác:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Phối hợp và hỗ trợ Bên B trong việc hoàn tất các thủ tục pháp lý cần thiết để đăng ký hoạt động tại Ki-ốt, nếu có yêu cầu.</li>
                <li>• Hoàn trả tiền đặt cọc và các khoản tiền khác (nếu có) cho Bên B theo đúng quy định of Hợp đồng khi Hợp đồng chấm dứt.</li>
              </ul>
            </ul>

            <div className="section-title">7. QUYỀN VÀ NGHĨA VỤ CỦA BÊN THUÊ (BÊN B)</div>
            <p className="clause-item"><strong>7.1 Quyền của Bên B:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Quyền sử dụng và kinh doanh:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Nhận và sử dụng Ki-ốt đúng thời hạn để tiến hành hoạt động kinh doanh theo mục đích đã thỏa thuận tại Điều 2 của Hợp đồng.</li>
                <li>• Được tự do trang trí nội thất bên trong Ki-ốt, sắp xếp và trưng bày hàng hóa phục vụ mục đích kinh doanh, với điều kiện không làm ảnh hưởng đến kết cấu chính của Ki-ốt và tuân thủ các quy định cải tạo.</li>
                <li>• Được yêu cầu Bên A sửa chữa kịp thời các hư hỏng lớn không phải do lỗi của mình gây ra, đảm bảo hoạt động kinh doanh không bị gián đoạn.</li>
              </ul>
              <li><strong>b. Quyền về thông tin và bảo mật:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Được quyền yêu cầu Bên A cung cấp các thông tin liên quan đến việc sử dụng Ki-ốt, bao gồm nhưng không giới hạn ở các quy định của Ban quản lý, thông báo về việc sửa chữa bảo trì của khu vực chung.</li>
                <li>• Được giữ bí mật các thông tin kinh doanh của mình trong suốt thời gian thuê và sau khi Hợp đồng chấm dứt.</li>
              </ul>
              <li><strong>c. Quyền gia hạn và chấm dứt Hợp đồng:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Được ưu tiên gia hạn Hợp đồng nếu có nhu cầu tiếp tục thuê và tuân thủ các quy định của Hợp đồng này.</li>
                <li>• Có quyền đơn phương chấm dứt Hợp đồng trong trường hợp Bên A vi phạm nghiêm trọng nghĩa vụ của mình và không khắc phục sau <strong>15 (mười lăm)</strong> ngày kể từ ngày Bên B gửi thông báo bằng văn bản.</li>
              </ul>
            </ul>
          </div>
        </div>

        {/* PAGE 7: LESSEE OBLIGATIONS & MAINTENANCE */}
        <div className="a4-page">
          <div className="print-content">
            <p className="clause-item"><strong>7.2 Nghĩa vụ của Bên B:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Nghĩa vụ thanh toán và tài chính:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Thanh toán đầy đủ và đúng hạn tiền thuê, tiền đặt cọc và các chi phí dịch vụ khác theo thỏa thuận tại Điều 4 của Hợp đồng.</li>
                <li>• Tự chịu trách nhiệm về mọi khoản thuế, phí, lệ phí liên quan đến hoạt động kinh doanh của mình tại Ki-ốt theo quy định của pháp luật.</li>
              </ul>
              <li><strong>b. Nghĩa vụ sử dụng và bảo quản:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Sử dụng Ki-ốt đúng mục đích đã cam kết, không được phép sử dụng vào các hoạt động vi phạm pháp luật hoặc đạo đức xã hội.</li>
                <li>• Chịu trách nhiệm hoàn toàn về việc bảo quản, giữ gìn Ki-ốt, không được gây hư hỏng, mất mát tài sản bên trong Ki-ốt và các trang thiết bị do Bên A cung cấp.</li>
                <li>• Tự sửa chữa các hư hỏng nhỏ phát sinh trong quá trình sử dụng như hỏng bóng đèn, vòi nước, ổ khóa, v.v.</li>
              </ul>
              <li><strong>c. Nghĩa vụ về an ninh trật tự và môi trường:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Tuân thủ mọi quy định về phòng cháy chữa cháy, an ninh trật tự, vệ sinh môi trường của khu vực chợ.</li>
                <li>• Đảm bảo không gây ồn ào, xả thải bừa bãi, hoặc các hành vi khác gây ảnh hưởng đến các Ki-ốt và khu vực xung quanh.</li>
                <li>• Chịu trách nhiệm bồi thường mọi thiệt hại vật chất hoặc phi vật chất mà mình gây ra cho Bên A hoặc các bên thứ ba.</li>
              </ul>
              <li><strong>d. Nghĩa vụ bàn giao:</strong> Khi Hợp đồng chấm dứt, Bên B có nghĩa vụ bàn giao lại Ki-ốt cho Bên A trong tình trạng ban đầu (trừ hao mòn tự nhiên) và tháo dỡ toàn bộ tài sản, thiết bị thuộc sở hữu của mình ra khỏi Ki-ốt.</li>
            </ul>

            <div className="section-title">8. SỬA CHỮA, CẢI TẠO VÀ BẢO TRÌ</div>
            <p className="clause-item"><strong>8.1 Sửa chữa và bảo trì:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Trách nhiệm của Bên A:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên A có trách nhiệm sửa chữa các hư hỏng lớn của Ki-ốt, bao gồm nhưng không giới hạn: các kết cấu chịu lực, hệ thống mái, tường chính, hệ thống cấp thoát nước và điện chính.</li>
                <li>• Khi phát sinh hư hỏng lớn, Bên B phải thông báo ngay cho Bên A. Bên A sẽ cử nhân sự đến kiểm tra trong vòng <strong>24 (hai mươi bốn)</strong> giờ và tiến hành sửa chữa sớm nhất.</li>
                <li>• Nếu Bên A không thực hiện nghĩa vụ này trong thời gian hợp lý, Bên B có quyền tự thuê sửa chữa và yêu cầu Bên A hoàn lại chi phí hợp lý dựa trên hóa đơn chứng từ.</li>
              </ul>
              <li><strong>b. Trách nhiệm của Bên B:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên B có trách nhiệm bảo trì và sửa chữa các hư hỏng nhỏ, phát sinh trong quá trình sử dụng Ki-ốt (thay bóng đèn, sửa vòi nước rò rỉ, ổ khóa).</li>
                <li>• Bên B phải giữ gìn vệ sinh chung, đảm bảo Ki-ốt và khu vực xung quanh luôn sạch sẽ, gọn gàng.</li>
              </ul>
              <li><strong>c. Phân định trách nhiệm:</strong> Mọi hư hỏng phát sinh do lỗi cố ý hoặc sơ suất của Bên B (làm vỡ kính, hỏng thiết bị do dùng sai cách) sẽ do Bên B chịu toàn bộ chi phí sửa chữa và bồi thường.</li>
            </ul>
          </div>
        </div>

        {/* PAGE 8: ALTERATIONS, SUBLEASE & LIABILITIES */}
        <div className="a4-page">
          <div className="print-content">
            <p className="clause-item"><strong>8.2 Cải tạo và lắp đặt:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Thỏa thuận về cải tạo:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên B có quyền cải tạo, trang trí nội thất bên trong Ki-ốt để phục vụ mục đích kinh doanh.</li>
                <li>• Tuy nhiên, mọi cải tạo đụng chạm cấu trúc thép, đục tường, thay đổi hệ thống điện nước chính đều phải được sự đồng ý bằng văn bản của Bên A trước khi thực hiện.</li>
                <li>• Bên B phải gửi bản vẽ thiết kế hoặc mô tả chi tiết kế hoạch cải tạo để Bên A xem xét và chấp thuận.</li>
              </ul>
              <li><strong>b. Trách nhiệm của Bên B sau cải tạo:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên B chịu hoàn toàn trách nhiệm về tính an toàn, chi phí và các vấn đề pháp lý liên quan đến cải tạo của mình.</li>
                <li>• Khi Hợp đồng chấm dứt, Bên B có nghĩa vụ hoàn trả Ki-ốt về tình trạng ban đầu (trừ những thỏa thuận khác bằng văn bản) bằng chi phí của mình.</li>
              </ul>
            </ul>

            <div className="section-title">9. CHUYỂN NHƯỢNG VÀ CHO THUÊ LẠI</div>
            <p className="clause-item"><strong>9.1 Chuyển nhượng Hợp đồng:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Điều kiện chuyển nhượng:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Hợp đồng này được ký kết dựa trên sự tin tưởng giữa hai bên và các quyền, nghĩa vụ trong Hợp đồng là không thể tự ý chuyển nhượng.</li>
                <li>• Bên B không được chuyển nhượng toàn bộ hoặc một phần quyền và nghĩa vụ cho bên thứ ba khi chưa được sự đồng ý bằng văn bản của Bên A.</li>
              </ul>
              <li><strong>b. Xử lý vi phạm:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Nếu vi phạm, Bên A có quyền đơn phương chấm dứt Hợp đồng ngay lập tức mà không bồi thường.</li>
                <li>• Bên B sẽ bị mất toàn bộ số tiền đặt cọc và phải bồi thường cho Bên A mọi thiệt hại phát sinh.</li>
                <li>• Giao dịch tự ý chuyển nhượng của Bên B sẽ vô hiệu đối với Bên A.</li>
              </ul>
            </ul>
            <p className="clause-item"><strong>9.2 Cho thuê lại:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a. Điều kiện cho thuê lại:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Bên B không được phép cho bên thứ ba thuê lại Ki-ốt hoặc một phần Ki-ốt khi chưa được sự đồng ý bằng văn bản của Bên A.</li>
                <li>• Yêu cầu cho thuê lại phải gửi bằng văn bản nêu rõ thông tin bên thuê lại, thời gian thuê và điều khoản liên quan.</li>
                <li>• Bên A có quyền chấp thuận hoặc từ chối mà không cần đưa ra lý do.</li>
              </ul>
              <li><strong>b. Trách nhiệm khi cho thuê lại:</strong></li>
              <ul className="bullet-sub-list">
                <li>• Nếu được Bên A đồng ý, Bên B vẫn chịu trách nhiệm hoàn toàn đối với Bên A về mọi hoạt động của bên thuê lại.</li>
                <li>• Các điều khoản trong hợp đồng thuê lại không được trái với các điều khoản của Hợp đồng này.</li>
              </ul>
            </ul>
          </div>
        </div>

        {/* PAGE 9: BREACH, FORCE MAJEURE, DISPUTES & CONTRACT END */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">10. VI PHẠM HỢP ĐỒNG VÀ TRÁCH NHIỆM BỒI THƯỜNG</div>
            <p className="clause-item"><strong>10.1 Xử lý vi phạm:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Nếu một Bên vi phạm các điều khoản, Bên bị vi phạm có quyền yêu cầu Bên vi phạm chấm dứt hành vi vi phạm và khắc phục hậu quả.</li>
              <li><strong>b.</strong> Trường hợp vi phạm không được khắc phục trong thời gian thỏa thuận, Bên bị vi phạm có quyền đơn phương chấm dứt Hợp đồng và yêu cầu bồi thường thiệt hại.</li>
            </ul>
            <p className="clause-item"><strong>10.2 Trách nhiệm bồi thường:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Nếu Bên A đơn phương chấm dứt Hợp đồng trái luật, Bên A phải bồi thường cho Bên B một khoản tiền tương đương với <strong>02 (hai)</strong> tháng tiền thuê.</li>
              <li><strong>b.</strong> Nếu Bên B đơn phương chấm dứt Hợp đồng hoặc vi phạm Hợp đồng dẫn đến việc chấm dứt, Bên B sẽ bị mất toàn bộ tiền đặt cọc và phải bồi thường cho Bên A các thiệt hại thực tế phát sinh.</li>
            </ul>

            <div className="section-title">11. SỰ KIỆN BẤT KHẢ KHÁNG</div>
            <p className="clause-item"><strong>11.1 Khái niệm và thông báo:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Sự kiện Bất khả kháng là sự kiện xảy ra ngoài tầm kiểm soát của các bên như thiên tai, chiến tranh, bạo loạn, hỏa hoạn lớn, chính sách pháp luật thay đổi.</li>
              <li><strong>b.</strong> Bên chịu ảnh hưởng phải ngay lập tức thông báo bằng văn bản cho bên kia về sự kiện đó và các hậu quả có thể xảy ra trong vòng 24 giờ.</li>
            </ul>
            <p className="clause-item"><strong>11.2 Hậu quả của Sự kiện Bất khả kháng:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Bên bị ảnh hưởng sẽ được miễn trừ trách nhiệm đối với các nghĩa vụ bị trì hoãn hoặc không thể thực hiện do Sự kiện Bất khả kháng.</li>
              <li><strong>b.</strong> Nếu Sự kiện Bất khả kháng kéo dài quá <strong>90 (chín mươi)</strong> ngày liên tục, các bên có quyền thảo luận để chấm dứt Hợp đồng.</li>
            </ul>

            <div className="section-title">12. GIẢI QUYẾT TRANH CHẤP</div>
            <p className="clause-item"><strong>12.1 Thương lượng và hòa giải:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Mọi tranh chấp phát sinh trong quá trình thực hiện Hợp đồng sẽ được giải quyết trước hết bằng thương lượng trên tinh thần thiện chí.</li>
              <li><strong>b.</strong> Các bên cam kết nỗ lực hòa giải trong vòng <strong>30 (ba mươi)</strong> ngày kể từ ngày phát sinh tranh chấp.</li>
            </ul>
            <p className="clause-item"><strong>12.2 Tòa án có thẩm quyền:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Nếu không thể thương lượng giải quyết, một trong hai bên có quyền đưa vụ việc ra Tòa án nhân dân có thẩm quyền tại nơi có Ki-ốt để giải quyết.</li>
              <li><strong>b.</strong> Quyết định của Tòa án có thẩm quyền là quyết định cuối cùng và ràng buộc các bên. Chi phí tố tụng sẽ do bên thua kiện chịu.</li>
            </ul>
          </div>
        </div>

        {/* PAGE 10: MISCELLANEOUS CLAUSES & SIGNATURES */}
        <div className="a4-page">
          <div className="print-content">
            <div className="section-title">13. ĐIỀU KHOẢN CHUNG</div>
            <p className="clause-item"><strong>13.1 Hiệu lực Hợp đồng:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Hợp đồng này có hiệu lực kể từ ngày ký.</li>
              <li><strong>b.</strong> Bất kỳ sự thay đổi, bổ sung nào đối với Hợp đồng phải được lập thành văn bản phụ lục có chữ ký của cả hai bên.</li>
            </ul>
            <p className="clause-item"><strong>13.2 Thông báo:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Mọi thông báo giữa các bên phải được lập thành văn bản và gửi đến địa chỉ đã ghi trong phần mở đầu của Hợp đồng.</li>
              <li><strong>b.</strong> Thông báo được coi là đã nhận khi gửi trực tiếp có xác nhận, hoặc <strong>03 (ba)</strong> ngày sau khi gửi qua bưu điện bảo đảm.</li>
            </ul>
            <p className="clause-item"><strong>13.3 Bảo mật thông tin:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Các bên cam kết giữ bí mật mọi thông tin kinh doanh, tài chính liên quan đến Ki-ốt và hoạt động kinh doanh của nhau.</li>
              <li><strong>b.</strong> Điều khoản bảo mật này vẫn có hiệu lực sau khi Hợp đồng chấm dứt.</li>
            </ul>
            <p className="clause-item"><strong>13.4 Tính toàn vẹn của Hợp đồng:</strong></p>
            <ul className="sub-clause-list">
              <li><strong>a.</strong> Hợp đồng này cùng các phụ lục là toàn bộ thỏa thuận giữa hai bên và thay thế mọi thỏa thuận, đàm phán trước đó.</li>
              <li><strong>b.</strong> Nếu bất kỳ điều khoản nào của Hợp đồng bị tuyên bố là vô hiệu, bất hợp pháp, các điều khoản còn lại vẫn có đầy đủ hiệu lực.</li>
            </ul>
            <p className="clause-item"><strong>13.5 Số lượng Hợp đồng:</strong> Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để thực hiện.</p>

            <p className="closing-statement" style={{ marginTop: "2rem", fontStyle: "italic", textAlign: "center" }}>
              Các Bên đã đọc, hiểu rõ, đồng ý và hoàn toàn tự nguyện ký kết Hợp đồng này.
            </p>

            <div className="signature-section" style={{ marginTop: "2.5rem" }}>
              <div className="signature-col">
                <strong>ĐẠI DIỆN BÊN A</strong>
                <span>(Ký, ghi rõ họ tên)</span>
                <div className="signature-space"></div>
                <strong>{lessor.representative}</strong>
              </div>
              <div className="signature-col">
                <strong>ĐẠI DIỆN BÊN B</strong>
                <span>(Ký, ghi rõ họ tên)</span>
                <div className="signature-space"></div>
                <strong>{contract?.vendorName || "...................................."}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
