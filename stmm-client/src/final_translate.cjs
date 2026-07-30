const fs = require('fs');

const file = 'C:/Users/VivoBook/.gemini/antigravity/worktrees/SU26_Do_An_Tot_Nghiep/manage-stall-layout-editor/stmm-client/src/pages/FE_Manager/MarketArea/components/MarketWizard.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
    { s: 'setGridError(res.errorMessage || "Không thể tạo lưới.");', r: 'setGridError(res.errorMessage || t("marketFloorPlan.wizard.err_grid"));' },
    { s: 'setGridError("Lỗi kết nối khi lấy dữ liệu xem trước.");', r: 'setGridError(t("marketFloorPlan.wizard.err_preview_conn"));' },
    { s: "let mostCommonPrefix = 'Sạp';", r: 'let mostCommonPrefix = t("marketFloorPlan.wizard.stall_prefix");' },
    { s: 'alert("Tên chợ phải dài ít nhất 5 ký tự.");', r: 'alert(t("marketFloorPlan.wizard.err_name_len"));' },
    { s: 'alert("Vui lòng nhập địa chỉ chợ.");', r: 'alert(t("marketFloorPlan.wizard.err_address"));' },
    { s: 'alert("Vui lòng nhập tổng diện tích hợp lệ.");', r: 'alert(t("marketFloorPlan.wizard.err_area"));' },
    { s: "alert(\"Vui lòng vẽ ranh giới chợ và nhấn t('marketwizard.closed') trước khi đi tiếp.\");", r: 'alert(t("marketFloorPlan.wizard.err_draw_boundary"));' },
    { s: 'alert(`Lỗi: Diện tích hình vẽ thực tế (${Math.round(drawnAreaM2)}m²) lớn hơn quá nhiều so với diện tích bạn khai báo (${declaredSize}m²). Vui lòng vẽ lại nhỏ hơn hoặc tăng diện tích khai báo!`);', r: 'alert(t("marketFloorPlan.wizard.err_area_mismatch", { drawn: Math.round(drawnAreaM2), declared: declaredSize }));' },
    { s: 'alert("Vui lòng tạo ít nhất 1 khu vực.");', r: 'alert(t("marketFloorPlan.wizard.err_min_area"));' },
    { s: 'alert(`Lỗi ranh giới: Khu vực "${a.name}" đang lồi ra khỏi ranh giới chợ! Vui lòng kéo các điểm vào bên trong.`);', r: 'alert(t("marketFloorPlan.wizard.err_area_out", { name: a.name }));' },
    { s: 'alert(`Lỗi chồng lấp: Khu vực "${a.name}t(\\'marketwizard.is_pressing_on_the\\')${areas[j].name}"! Vui lòng tách chúng ra.`);', r: 'alert(t("marketFloorPlan.wizard.err_area_overlap", { name1: a.name, name2: areas[j].name }));' },
    { s: 'alert(`Lỗi sức chứa: Tổng diện tích các khu vực (${Math.round(totalAreasSize)}m²) vượt quá tổng diện tích chợ (${declaredMarketSize}m²). Vui lòng điều chỉnh hoặc xóa bớt khu vực!`);', r: 'alert(t("marketFloorPlan.wizard.err_capacity_total", { total: Math.round(totalAreasSize), max: declaredMarketSize }));' },
    { s: 'alert(`Lỗi: ${errorMsg}\\n\\n[Chi tiết kỹ thuật: ${error.message} | HTTP ${error.response?.status}]`);', r: 'alert(t("marketFloorPlan.wizard.err_save_detail", { msg: errorMsg, detail: error.message, status: error.response?.status }));' },
    { s: "{'🏪 Tạo'}<span>{'Chợ Mới'}</span>", r: "{'🏪 ' + t('marketFloorPlan.wizard.create')}<span>{t('marketFloorPlan.wizard.new_market')}</span>" },
    { s: "aria-label={'Các bước tạo chợ'}", r: "aria-label={t('marketFloorPlan.wizard.steps')}" },
    { s: "{ num: 1, label: 'Thông tin & Bản đồ' }", r: "{ num: 1, label: t('marketFloorPlan.wizard.step_info') }" },
    { s: "{ num: 2, label: 'Phân khu vực' }", r: "{ num: 2, label: t('marketFloorPlan.wizard.step_area') }" },
    { s: "aria-label={'Hủy tạo chợ'}", r: "aria-label={t('marketFloorPlan.wizard.cancel_title')}" },
    { s: "{'📋 Thông tin chung'}", r: "{'📋 ' + t('marketFloorPlan.wizard.general_info')}" },
    { s: "{'Tên chợ'}", r: "{t('marketFloorPlan.wizard.market_name')}" },
    { s: "placeholder={'Vd: Chợ Bến Thành'}", r: "placeholder={t('marketFloorPlan.wizard.market_name_ph')}" },
    { s: "{'Địa chỉ'}", r: "{t('marketFloorPlan.wizard.address')}" },
    { s: "placeholder={'Vd: Quận 1, TP.HCM'}", r: "placeholder={t('marketFloorPlan.wizard.address_ph')}" },
    { s: "{'Tổng diện tích (m²)'}", r: "{t('marketFloorPlan.wizard.total_area')}" },
    { s: "{'Vẽ ranh giới chợ'}", r: "{t('marketFloorPlan.wizard.draw_boundary')}" },
    { s: "{'Click liên tiếp lên vùng bản đồ bên phải để đặt các điểm góc, sau đó nhấn'}<strong>{'Khép kín'}</strong>.", r: "{t('marketFloorPlan.wizard.draw_inst_1')}<strong>{t('marketFloorPlan.wizard.close_shape')}</strong>." },
    { s: "✔ Khép kín ({marketInfo.points.length} điểm)", r: "✔ {t('marketFloorPlan.wizard.close_shape')} ({marketInfo.points.length} {t('marketFloorPlan.wizard.points')})" },
    { s: "{'✅ Đã hoàn thành hình dạng chợ!'}", r: "{'✅ ' + t('marketFloorPlan.wizard.shape_done')}" },
    { s: "{'↺ Vẽ lại'}", r: "{'↺ ' + t('marketFloorPlan.wizard.redraw')}" },
    { s: "{'🗺️ Phân lô khu vực (Lưới)'}", r: "{'🗺️ ' + t('marketFloorPlan.wizard.grid_area')}" },
    { s: "{'Hệ thống sẽ tự động rải đều các khu vực lên mặt bằng chợ.'}", r: "{t('marketFloorPlan.wizard.grid_desc')}" },
    { s: "{'Chọn ngành hàng...'}", r: "{t('marketFloorPlan.wizard.select_cat')}" },
    { s: "📊 Thông số xem trước", r: "📊 {t('marketFloorPlan.wizard.preview_stats')}" },
    { s: "Tổng diện tích: <b>{gridStats.totalAreaM2} m²</b>", r: "{t('marketFloorPlan.wizard.total_area_colon')} <b>{gridStats.totalAreaM2} m²</b>" },
    { s: "Diện tích sử dụng: <b>{gridStats.usableAreaM2} m²</b>", r: "{t('marketFloorPlan.wizard.usable_area')} <b>{gridStats.usableAreaM2} m²</b>" },
    { s: "Diện tích lối đi: <b>{gridStats.aisleAreaM2} m²</b>", r: "{t('marketFloorPlan.wizard.aisle_area')} <b>{gridStats.aisleAreaM2} m²</b>" },
    { s: "Trung bình mỗi lô: <b>{gridStats.averageZoneAreaM2} m²</b>", r: "{t('marketFloorPlan.wizard.avg_lot_area')} <b>{gridStats.averageZoneAreaM2} m²</b>" },
    { s: "Số khu vực tạo ra: <b>{gridStats.generatedZones}</b> (Tối đa: {gridStats.maxAllowedZones})", r: "{t('marketFloorPlan.wizard.lots_created')} <b>{gridStats.generatedZones}</b> ({t('marketFloorPlan.wizard.max_prefix')}: {gridStats.maxAllowedZones})" },
    { s: "Đang chờ cấu hình...", r: "{t('marketFloorPlan.wizard.waiting_config')}" },
    { s: "a.stalls?.length > 0 ? `${a.stalls.length} sạp bên trong` : 'Chưa có sạp'", r: "a.stalls?.length > 0 ? `${a.stalls.length} ${t('marketFloorPlan.wizard.stalls_inside')}` : t('marketFloorPlan.wizard.no_stalls')" },
    { s: "a.stalls?.length > 0 ? '${a.stalls.length} sạp bên trong' : 'Chưa có sạp'", r: "a.stalls?.length > 0 ? `${a.stalls.length} ${t('marketFloorPlan.wizard.stalls_inside')}` : t('marketFloorPlan.wizard.no_stalls')" },
    { s: "title={'Sửa'}", r: "title={t('marketFloorPlan.wizard.edit')}" },
    { s: "title={'Xóa'}", r: "title={t('marketFloorPlan.wizard.delete')}" },
    { s: "{'✏️ Chỉnh sửa thông tin'}", r: "{'✏️ ' + t('marketFloorPlan.wizard.edit_info')}" },
    { s: "{'Tên khu vực'}", r: "{t('marketFloorPlan.wizard.area_name')}" },
    { s: "{'Diện tích (m²)'}", r: "{t('marketFloorPlan.wizard.area_size')}" },
    { s: "{'Ngành hàng'}", r: "{t('marketFloorPlan.wizard.category')}" },
    { s: "alert(\"Tên khu vực này đã tồn tại trong lưới. Vui lòng chọn tên khác!\");", r: "alert(t('marketFloorPlan.wizard.err_dup_name'));" },
    { s: 'alert(`Lỗi sức chứa: Quỹ đất còn trống của chợ chỉ còn ${Math.round(remaining)}m².\\nBạn đang nhập ${targetSize}m² cho khu vực này, vượt quá mức cho phép! Vui lòng nhập số nhỏ hơn hoặc bằng ${Math.round(remaining)}m².`);', r: "alert(t('marketFloorPlan.wizard.err_capacity_area', { remaining: Math.round(remaining), target: targetSize }));" },
    { s: "{'Sinh sạp tự động'}", r: "{t('marketFloorPlan.wizard.step_stall')}" },
    { s: "{'Tiền tố mã sạp'}", r: "{t('marketFloorPlan.wizard.stall_prefix_lbl')}" },
    { s: "{'Số lượng sạp'}", r: "{t('marketFloorPlan.wizard.stall_count')}" },
    { s: "{'Diện tích mỗi sạp (m²)'}", r: "{t('marketFloorPlan.wizard.stall_size')}" },
    { s: "placeholder={'Tự động tính...'}", r: "placeholder={t('marketFloorPlan.wizard.auto_calc')}" },
    { s: "{'Rộng (m)'}", r: "{t('marketFloorPlan.wizard.width_m')}" },
    { s: "✅ Đã sinh {areas[selectedAreaIndex].stalls.length} sạp.", r: "✅ {t('marketFloorPlan.wizard.generated')} {areas[selectedAreaIndex].stalls.length} {t('marketFloorPlan.wizard.stalls')}" },
    { s: "<span className={styles.canvasBadge}>{marketInfo.points.length} điểm</span>", r: "<span className={styles.canvasBadge}>{marketInfo.points.length} {t('marketFloorPlan.wizard.points')}</span>" },
    { s: "<span className={styles.canvasBadge}>{areas.length} khu vực</span>", r: "<span className={styles.canvasBadge}>{areas.length} {t('marketFloorPlan.wizard.areas')}</span>" },
    { s: "<span className={styles.canvasBadge}>{areas.reduce((s, a) => s + a.stalls.length, 0)} sạp</span>", r: "<span className={styles.canvasBadge}>{areas.reduce((s, a) => s + a.stalls.length, 0)} {t('marketFloorPlan.wizard.stalls')}</span>" },
    { s: "{loading ? '⏳ {t(\\'marketFloorPlan.wizard.saving\\')}' : '✅ Hoàn tất & {t(\\'marketFloorPlan.wizard.save\\')}'}", r: "{loading ? '⏳ ' + t('marketFloorPlan.wizard.saving') : '✅ ' + t('marketFloorPlan.wizard.finish_save')}" }
];

replacements.forEach(r => {
    content = content.split(r.s).join(r.r);
});

fs.writeFileSync(file, content, 'utf8');

const viPath = 'C:/Users/VivoBook/.gemini/antigravity/worktrees/SU26_Do_An_Tot_Nghiep/manage-stall-layout-editor/stmm-client/src/locales/vi.json';
const enPath = 'C:/Users/VivoBook/.gemini/antigravity/worktrees/SU26_Do_An_Tot_Nghiep/manage-stall-layout-editor/stmm-client/src/locales/en.json';

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

Object.assign(vi.marketFloorPlan.wizard, {
    err_area_mismatch: 'Lỗi: Diện tích hình vẽ thực tế ({{drawn}}m²) lớn hơn quá nhiều so với diện tích bạn khai báo ({{declared}}m²). Vui lòng vẽ lại nhỏ hơn hoặc tăng diện tích khai báo!',
    err_area_out: 'Lỗi ranh giới: Khu vực "{{name}}" đang lồi ra khỏi ranh giới chợ! Vui lòng kéo các điểm vào bên trong.',
    err_area_overlap: 'Lỗi chồng lấp: Khu vực "{{name1}}" đang đè lên "{{name2}}"! Vui lòng tách chúng ra.',
    err_capacity_total: 'Lỗi sức chứa: Tổng diện tích các khu vực ({{total}}m²) vượt quá tổng diện tích chợ ({{max}}m²). Vui lòng điều chỉnh hoặc xóa bớt khu vực!',
    err_save_detail: 'Lỗi: {{msg}}\\n\\n[Chi tiết kỹ thuật: {{detail}} | HTTP {{status}}]',
    err_capacity_area: 'Lỗi sức chứa: Quỹ đất còn trống của chợ chỉ còn {{remaining}}m².\\nBạn đang nhập {{target}}m² cho khu vực này, vượt quá mức cho phép! Vui lòng nhập số nhỏ hơn hoặc bằng {{remaining}}m².',
    waiting_config: 'Đang chờ cấu hình...',
    generated: 'Đã sinh',
    max_prefix: 'Tối đa'
});

Object.assign(en.marketFloorPlan.wizard, {
    err_area_mismatch: 'Error: Actual drawn area ({{drawn}}m²) is much larger than the declared area ({{declared}}m²). Please redraw smaller or increase declared area!',
    err_area_out: 'Boundary Error: Area "{{name}}" is protruding outside the market boundary! Please drag points inside.',
    err_area_overlap: 'Overlap Error: Area "{{name1}}" is overlapping with "{{name2}}"! Please separate them.',
    err_capacity_total: 'Capacity Error: Total size of all areas ({{total}}m²) exceeds market size ({{max}}m²). Please adjust or delete areas!',
    err_save_detail: 'Error: {{msg}}\\n\\n[Technical details: {{detail}} | HTTP {{status}}]',
    err_capacity_area: 'Capacity Error: Remaining free space is only {{remaining}}m².\\nYou are entering {{target}}m² for this area, exceeding the limit! Please enter a number less than or equal to {{remaining}}m².',
    waiting_config: 'Waiting for configuration...',
    generated: 'Generated',
    max_prefix: 'Max'
});

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2), 'utf8');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

console.log('Final translation applied!');
