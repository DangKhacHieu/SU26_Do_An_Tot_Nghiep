const fs = require('fs');
const path = require('path');

const locales = ['vi', 'en'];

locales.forEach(locale => {
    const filePath = path.join(__dirname, '..', 'stmm-client', 'src', 'locales', `${locale}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.errors) {
        data.errors = {};
    }
    
    if (locale === 'vi') {
        data.errors.MARKET_DEACTIVATE_ACTIVE_CONTRACTS = "Không thể ngưng hoạt động chợ vì còn {{arg0}} hợp đồng đang hoạt động. Vui lòng chấm dứt hợp đồng trước.";
        data.errors.MARKET_DEACTIVATE_UNPAID_INVOICES = "Không thể ngưng hoạt động chợ vì còn {{arg0}} hóa đơn chưa thanh toán. Vui lòng thu hồi công nợ trước.";
        data.errors.MARKET_DEACTIVATE_ACTIVE_SERVICES = "Không thể ngưng hoạt động chợ vì còn {{arg0}} dịch vụ đang hoạt động. Vui lòng hủy dịch vụ trước.";
    } else {
        data.errors.MARKET_DEACTIVATE_ACTIVE_CONTRACTS = "Cannot deactivate the market because there are {{arg0}} active contracts. Please terminate them first.";
        data.errors.MARKET_DEACTIVATE_UNPAID_INVOICES = "Cannot deactivate the market because there are {{arg0}} unpaid invoices. Please collect the debts first.";
        data.errors.MARKET_DEACTIVATE_ACTIVE_SERVICES = "Cannot deactivate the market because there are {{arg0}} active services. Please cancel them first.";
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${locale}.json`);
});
