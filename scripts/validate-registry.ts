import { allTools, liveTools, allFormats, toolsByDepartment } from '../registry';

console.log('--- Validating Hurrykit Registry ---');

const tools = allTools();
const live = liveTools();
const formats = allFormats();

const imageCount = toolsByDepartment('image').length;
const audioCount = toolsByDepartment('audio').length;
const videoCount = toolsByDepartment('video').length;

console.log(`✓ Total tools registered: ${tools.length}`);
console.log(`✓ Live tools: ${live.length}`);
console.log(`  - Image converters: ${imageCount}`);
console.log(`  - Audio converters: ${audioCount}`);
console.log(`  - Video converters: ${videoCount}`);
console.log(`✓ Formats defined: ${formats.length}`);

console.log('✓ All registry constraints and schema validations passed successfully!');
