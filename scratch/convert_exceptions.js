const fs = require('fs');
const crypto = require('crypto');

function slugify(text) {
    let slug = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    slug = slug.replace(/đ/g, "d").replace(/Đ/g, "D");
    slug = slug.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
    slug = slug.replace(/_+/g, "_").replace(/^_|_$/g, "");
    if (slug.length > 40) slug = slug.substring(0, 40).replace(/_$/, "");
    return slug;
}

const filePaths = [
    'STMM.Business/Services/VendorRequestService.cs',
    'STMM.Business/Services/VendorServiceManagement.cs',
    'STMM.Business/Services/VendorViolationService.cs',
    'STMM.Business/Services/ViolationService.cs',
    'STMM.Business/Services/MarketAreaService.cs',
    'STMM.Business/Services/StallService.cs',
    'STMM.Business/Services/AccountService.cs',
    'STMM.Business/Services/NotificationService.cs'
];

let viDict = {};

filePaths.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Match throw new Exception("..."); or throw new Exception($"...");
    const regex = /throw\s+new\s+([A-Za-z0-9_]+Exception)\s*\(\s*(\$?"[^"]*")\s*\)/g;
    
    content = content.replace(regex, (match, exType, strContent) => {
        // strContent is like '"Mô tả không được để trống."' or '$"Không tìm thấy ID {id}."'
        let isInterpolated = strContent.startsWith('$');
        let innerText = strContent.replace(/^\$?"|"/g, '');
        
        let slug = "ERR_" + slugify(innerText);
        // Handle interpolations
        let args = [];
        let cleanText = innerText.replace(/\{([^}]+)\}/g, (m, varName) => {
            args.push(varName);
            return `{{arg${args.length - 1}}}`;
        });
        
        viDict[slug] = cleanText;

        if (args.length > 0) {
            let argString = args.join("}|{");
            return `throw new ${exType}($"${slug}|{${argString}}")`;
        } else {
            return `throw new ${exType}("${slug}")`;
        }
    });

    if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
});

fs.writeFileSync('scratch/vi_new_errors.json', JSON.stringify(viDict, null, 2), 'utf8');
console.log("Extracted errors to scratch/vi_new_errors.json");
