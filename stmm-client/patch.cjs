const fs = require('fs');
const path = './src/pages/FE_Manager/MarketArea/components/MarketWizard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace in handleGlobalMouseUp
content = content.replace(
    /const bbox = getBoundingBox\(area\.points\);\s*updated\[indexToUpdate\] = \{\s*\.\.\.area,\s*svgPath: pointsToSvgPath\(area\.points, true\),\s*minX: bbox\.minX,\s*minY: bbox\.minY,\s*maxX: bbox\.maxX,\s*maxY: bbox\.maxY,\s*\};/,
    `const bbox = getBoundingBox(area.points);
                  const normalizedPoints = area.points.map(p => [p[0] - bbox.minX, p[1] - bbox.minY]);
                  updated[indexToUpdate] = {
                      ...area,
                      svgPath: pointsToSvgPath(area.points, true),
                      polygonClipPath: pointsToSvgPath(normalizedPoints, true),
                      minX: bbox.minX,
                      minY: bbox.minY,
                      maxX: bbox.maxX,
                      maxY: bbox.maxY,
                  };`
);

// Replace in generateGridAreas
content = content.replace(
    /newAreas\.push\(\{\s*name: `\$\{prefix\} \$\{String\.fromCharCode\(65 \+ r\)\}\$\{c \+ 1\}`,\s*categoryName: gridConfig\.categoryName,\s*points: normalizedPoints,\s*polygonClipPath: pointsToSvgPath\(normalizedPoints, true\),\s*svgPath: pointsToSvgPath\(normalizedPoints, true\),/,
    `newAreas.push({
                    name: \`\${prefix} \${String.fromCharCode(65 + r)}\${c + 1}\`,
                    categoryName: gridConfig.categoryName,
                    points: clippedPoints,
                    svgPath: pointsToSvgPath(clippedPoints, true),
                    polygonClipPath: pointsToSvgPath(normalizedPoints, true),`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Patch applied!");
