const fs = require('fs');
const crypto = require('crypto');

function slugify(text) {
    let slug = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    slug = slug.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    slug = slug.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    slug = slug.replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (slug.length > 50) slug = slug.substring(0, 50).replace(/_$/, '');
    return slug;
}

const filePaths = [
    'STMM.Business/Services/RequestService.cs',
    'STMM.Business/Services/FeedbackService.cs',
    'STMM.Business/Services/BillingService.cs',
    'STMM.Business/Services/VendorInvoiceService.cs',
    'STMM.Business/Services/AreaService.cs',
    'STMM.Business/Services/StallService.cs',
    'STMM.Business/Services/UserService.cs',
    'STMM.Business/Services/UserProfileService.cs',
    'STMM.Business/Services/AuthService.cs',
    'STMM.Business/Services/NotificationService.cs',
    'STMM.Business/Services/MarketService.cs'
];

let viDict = {};

filePaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log('Skipping ' + filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    const regex = /throw\s+new\s+([A-Za-z0-9_]+Exception)\s*\(\s*(\$?"[^"]*")\s*\)/g;
    
    content = content.replace(regex, (match, exType, strContent) => {
        let isInterpolated = strContent.startsWith('$');
        let innerText = strContent.replace(/^\$?"|"/g, '');
        
        let slug = 'ERR_' + slugify(innerText);
        
        // Skip if already converted
        if (innerText.startsWith('ERR_')) return match;
        
        let args = [];
        let cleanText = innerText.replace(/\{([^}]+)\}/g, (m, varName) => {
            args.push(varName);
            return `{{arg${args.length - 1}}}`;
        });
        
        viDict[slug] = cleanText;

        if (args.length > 0) {
            let argString = args.join('}|{');
            return `throw new ${exType}($"${slug}|{${argString}}")`;
        } else {
            return `throw new ${exType}("${slug}")`;
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
    }
});

fs.writeFileSync('scratch/vi_new_errors_3.json', JSON.stringify(viDict, null, 2), 'utf8');
console.log('Extracted errors to scratch/vi_new_errors_3.json');
