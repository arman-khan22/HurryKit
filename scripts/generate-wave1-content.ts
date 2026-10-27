import * as fs from 'fs';
import * as path from 'path';

interface ToolContentDef {
  file: string;
  h1: string;
  intro: string;
  whyTitle: string;
  whyText: string;
  howSteps: string[];
  specs: { label: string; value: string }[];
  tips: string[];
  faqs: { q: string; a: string }[];
}

const tools: ToolContentDef[] = [
  {
    file: 'tools/heic-to-jpg.md',
    h1: 'Convert HEIC to JPG Online (Private & In-Browser)',
    intro: 'Convert Apple HEIC photos into universally compatible JPGs instantly in your browser. Zero upload, complete privacy, batch downloading.',
    whyTitle: 'Why Convert HEIC to JPG?',
    whyText: `Apple devices capture photos in High Efficiency Image Container (HEIC) format by default to cut storage footprint in half while preserving 10-bit color data and depth maps. However, HEIC files frequently fail to open on Windows PCs without paid codec extensions, and they remain unsupported by many corporate portals, school submission systems, photo print kiosks, and older smart TVs.

Converting your HEIC images to standard JPEG format creates universal files that open instantly in every photo viewer, browser, operating system, and office productivity suite without requiring third-party software. Hurrykit handles the entire decoding and encoding process locally on your CPU via WebAssembly, guaranteeing zero server uploads and total privacy.`,
    howSteps: [
      'Select or drag and drop your iPhone .heic or .heif photos into the converter above.',
      'Adjust the output quality slider between 70% and 100% (default 90% delivers pristine visual fidelity with minimal file size).',
      'Click "Convert All" to process all images directly in your browser.',
      'Download your converted JPG images individually or package them into a single ZIP archive.'
    ],
    specs: [
      { label: 'Input Format', value: 'HEIC / HEIF (Apple iOS 11+, macOS High Sierra+)' },
      { label: 'Output Format', value: 'Standard JPEG / JPG (Baseline & Progressive)' },
      { label: 'Processing Engine', value: 'In-browser libheif compiled to WebAssembly' },
      { label: 'Maximum Batch Size', value: '50 photos per batch, up to 100 MB per file' }
    ],
    tips: [
      'For general photo sharing via messaging apps or email attachments, the 90% default quality provides an ideal balance of visual fidelity and compact size.',
      'Batch conversion works completely offline once the page has loaded in your browser window.',
      'EXIF orientation metadata is automatically parsed to ensure portrait and landscape photos remain correctly aligned.',
      'No data is uploaded to remote cloud servers, making this safe for private personal pictures and confidential documents.'
    ],
    faqs: [
      {
        q: 'Does converting HEIC to JPG reduce photo quality?',
        a: 'Hurrykit uses a 90% quality default (fully adjustable up to 100%), ensuring virtually indistinguishable visual quality while making the image viewable on any device.'
      },
      {
        q: 'Are my personal photos uploaded to any server?',
        a: 'No. All decoding and encoding happens 100% inside your browser using WebAssembly. Your photos never leave your device.'
      },
      {
        q: 'Can I convert multiple iPhone HEIC photos at once?',
        a: 'Yes. You can select or drop up to 50 photos in a single batch and download them all individually or as a single convenient ZIP archive.'
      },
      {
        q: 'Why won\'t my Windows PC open HEIC photos?',
        a: 'Windows does not include the HEIC/HEVC codec by default without a paid Microsoft Store add-on. Converting your photos to JPG solves this instantly with zero cost.'
      }
    ]
  },
  {
    file: 'tools/heic-to-png.md',
    h1: 'Convert HEIC to PNG Online with Transparent Support',
    intro: 'Convert Apple HEIC photos into uncompressed, lossless PNG graphics directly in your browser. Perfect for design work, screenshots, and graphic editing.',
    whyTitle: 'Why Convert HEIC to PNG?',
    whyText: `While JPEG is ideal for standard photography, PNG (Portable Network Graphics) is the preferred standard when you need lossless fidelity, crisp line art, sharp text edges, or transparent background preservation. Converting Apple HEIC photos to PNG is especially valuable when working with iPhone screenshots, sticker cutouts, portrait mode cutouts with alpha channels, or assets destined for Photoshop, Figma, and Canva.

By converting directly to PNG, you eliminate the DCT block compression artifacts introduced by JPEG encoders. Hurrykit renders your HEIC images through high-precision WebAssembly decoders directly to 24-bit RGB or 32-bit RGBA pixel buffers, outputting clean, uncompressed PNG files with zero quality degradation.`,
    howSteps: [
      'Drop your .heic or .heif files into the designated drop area above.',
      'Review output options, including alpha channel retention and color depth.',
      'Click "Convert All" to transform your files locally inside your browser.',
      'Save your pristine PNG files individually or as a compressed batch ZIP.'
    ],
    specs: [
      { label: 'Input Format', value: 'HEIC, HEIF container' },
      { label: 'Output Format', value: 'PNG (Portable Network Graphics, 24-bit / 32-bit RGBA)' },
      { label: 'Compression', value: 'Lossless DEFLATE algorithm' },
      { label: 'Privacy Level', value: '100% client-side WebAssembly execution' }
    ],
    tips: [
      'PNG files are lossless and therefore larger than JPGs. Use PNG when crisp text, sharp borders, or alpha transparency are essential.',
      'If you have cutout stickers created in iOS 16+, converting to PNG preserves their transparent backgrounds.',
      'All processing runs locally on your computer or phone hardware, meaning you do not consume internet upload bandwidth.'
    ],
    faqs: [
      {
        q: 'Is converting HEIC to PNG free and private?',
        a: 'Yes. Hurrykit executes all processing 100% locally on your device via WebAssembly. Your files are never uploaded to any remote server.'
      },
      {
        q: 'Does PNG retain higher quality than JPG?',
        a: 'Yes. PNG uses lossless compression, meaning no pixel data or sharp edges are discarded during encoding. This makes it superior for screenshots and graphics.'
      },
      {
        q: 'Can I convert multiple files at the same time?',
        a: 'Yes. You can add up to 50 files in a single batch and download them individually or as a complete ZIP archive.'
      },
      {
        q: 'What is the maximum file size supported?',
        a: 'Files up to 100 MB each are supported with zero quality loss and immediate client-side decoding.'
      }
    ]
  },
  {
    file: 'tools/webp-to-jpg.md',
    h1: 'Convert WebP to JPG Online Instantly',
    intro: 'Transform modern WebP web images into universal JPG photos in milliseconds. Eliminate compatibility headaches in image editors and legacy software.',
    whyTitle: 'Why Convert WebP to JPG?',
    whyText: `WebP was developed by Google to accelerate the web by providing superior lossy and lossless compression for web graphics. While modern web browsers render WebP effortlessly, many desktop photo editing applications, legacy image viewers, print shop software, and word processors still refuse to open or import .webp files.

If you have downloaded product images, stock photos, or social media graphics in WebP format and need to paste them into Microsoft Word, edit them in older desktop software, or upload them to portals that enforce .jpg extensions, this converter solves your problem instantly. Everything runs directly on your machine without transmitting images across the internet.`,
    howSteps: [
      'Select or drag .webp images into the browser upload panel.',
      'Adjust the JPEG quality level using the slider (90% recommended for high-resolution graphics).',
      'Hit "Convert All" to transcode the image buffers locally.',
      'Download your fresh JPG files to your downloads folder.'
    ],
    specs: [
      { label: 'Input Format', value: 'Google WebP (Lossy and Lossless)' },
      { label: 'Output Format', value: 'JPEG / JFIF compliant photo' },
      { label: 'Engine', value: 'Native HTML5 Canvas & WebAssembly' },
      { label: 'Speed', value: 'Sub-50ms per typical web image' }
    ],
    tips: [
      'WebP images that contain transparent areas will have their transparent pixels rendered against a clean white background in the resulting JPG.',
      'You can convert multiple downloaded web images simultaneously to save time.',
      'Because conversions occur in-memory, you can process sensitive company graphics or personal photos safely.'
    ],
    faqs: [
      {
        q: 'Why are images downloaded from Google and web pages saved as WebP?',
        a: 'Websites serve WebP because it reduces bandwidth usage by 25% to 34% compared to JPEG. However, older software cannot open WebP, requiring conversion to JPG.'
      },
      {
        q: 'Will converting WebP to JPG degrade image quality?',
        a: 'When converted at 90% to 95% quality, visual differences are imperceptible to the human eye while restoring 100% device compatibility.'
      },
      {
        q: 'Does this converter store copies of my images?',
        a: 'No. Hurrykit runs locally in your browser. No files are ever sent to a server or saved on cloud disks.'
      },
      {
        q: 'How many WebP files can I convert at once?',
        a: 'You can convert up to 50 images in a single batch.'
      }
    ]
  },
  {
    file: 'tools/webp-to-png.md',
    h1: 'Convert WebP to PNG Online with Alpha Transparency',
    intro: 'Convert WebP graphics to PNG format with full transparency preservation and zero loss of quality. In-browser processing with maximum privacy.',
    whyTitle: 'Why Convert WebP to PNG?',
    whyText: `WebP format is widely utilized across web pages for logos, transparent product renders, and website illustrations. However, when you download these images for use in digital art programs, vector editors, video editing suites, or design mockups, many desktop tools fail to recognize WebP files or strip their transparency channels.

Converting WebP to PNG ensures that transparent backgrounds, drop shadows, and subtle alpha gradients remain completely intact. PNG is the gold standard for lossless raster graphics across Adobe Creative Cloud, Affinity, Figma, Sketch, and Blender. Hurrykit decodes WebP alpha bitplanes accurately and encodes clean PNG chunks right inside your browser.`,
    howSteps: [
      'Drag and drop your WebP image files onto the converter interface.',
      'Ensure transparency preservation is active in the conversion options.',
      'Click "Convert All" to generate PNG graphics in real time.',
      'Download your transparent PNG images instantly.'
    ],
    specs: [
      { label: 'Input Format', value: 'WebP (with or without Alpha transparency channel)' },
      { label: 'Output Format', value: 'PNG 32-bit RGBA (lossless)' },
      { label: 'Transparency', value: '100% alpha channel fidelity preserved' },
      { label: 'Execution', value: 'Zero-latency local client-side computation' }
    ],
    tips: [
      'If your WebP contains transparent cutout areas, PNG is the best format to retain that transparency.',
      'PNG preserves pixel-perfect sharpness for user interface mockups, app icons, and logos.',
      'Process entire asset packs in one click with the batch queue feature.'
    ],
    faqs: [
      {
        q: 'Does WebP to PNG conversion keep transparent backgrounds?',
        a: 'Yes. Full 8-bit alpha transparency is preserved, ensuring logos, cutouts, and stickers keep their transparent backdrops.'
      },
      {
        q: 'Is there any quality loss when converting WebP to PNG?',
        a: 'No. PNG is a lossless format, so the decoded WebP pixel data is stored without further compression degradation.'
      },
      {
        q: 'Is my data secure when using Hurrykit?',
        a: 'Completely secure. The converter runs inside your web browser sandbox. No image data is ever uploaded or transmitted across the network.'
      },
      {
        q: 'Can I use this tool on my phone or tablet?',
        a: 'Yes, Hurrykit works smoothly on iOS Safari, Android Chrome, and all modern mobile web browsers.'
      }
    ]
  },
  {
    file: 'tools/jpg-to-png.md',
    h1: 'Convert JPG to PNG Online with Lossless Quality',
    intro: 'Convert lossy JPEG pictures into lossless PNG format without uploading files. Fast, private, in-browser conversion with batch support.',
    whyTitle: 'Why Convert JPG to PNG?',
    whyText: `JPEG files are compressed using lossy Discrete Cosine Transform algorithms, which can introduce compression artifacts, color banding, and blurriness around high-contrast edges when edited and re-saved multiple times. Converting your JPG files to PNG creates a stable, lossless master file that can be cropped, retouched, annotated, and re-saved repeatedly without suffering generation loss.

Furthermore, many application submission portals, game engine asset pipelines, and graphic design templates require PNG format for textures, overlays, and technical drawings. Hurrykit performs this conversion client-side in a split second, wrapping your photo data in standard PNG chunks without server involvement.`,
    howSteps: [
      'Drop your .jpg or .jpeg images into the converter box above.',
      'Select any desired dimension scaling or color formatting options.',
      'Click "Convert All" to convert images directly in your browser.',
      'Download individual PNG files or grab the complete batch archive.'
    ],
    specs: [
      { label: 'Input Format', value: 'JPEG / JPG / JFIF' },
      { label: 'Output Format', value: 'PNG (24-bit Truecolor)' },
      { label: 'Compression', value: 'Lossless DEFLATE' },
      { label: 'Upload Requirement', value: 'None (Runs 100% in client browser)' }
    ],
    tips: [
      'Converting JPG to PNG prevents future quality degradation during multi-stage editing workflows.',
      'PNG files will generally have a larger file size than the source JPG because PNG uses lossless compression.',
      'Use this tool when preparing assets for print layouts, technical documentation, or software interfaces.'
    ],
    faqs: [
      {
        q: 'Will converting JPG to PNG increase the image resolution or quality?',
        a: 'It will not magically restore data lost in the original JPEG compression, but it prevents any further quality loss during subsequent edits and saves.'
      },
      {
        q: 'Why is the resulting PNG larger than the original JPG?',
        a: 'JPG uses aggressive lossy compression, while PNG stores pixel data losslessly. The increased file size is normal and expected.'
      },
      {
        q: 'Is there a limit on how many JPGs I can convert?',
        a: 'You can convert up to 50 files per batch, with each file up to 100 MB.'
      },
      {
        q: 'Are my images kept private?',
        a: 'Yes. All conversions happen on your local machine. No images are sent to any remote server.'
      }
    ]
  },
  {
    file: 'tools/png-to-jpg.md',
    h1: 'Convert PNG to JPG Online with Custom Background',
    intro: 'Convert heavy PNG images to lightweight JPG photos directly in your browser. Shrink file sizes by up to 80% with customizable background fill.',
    whyTitle: 'Why Convert PNG to JPG?',
    whyText: `PNG is the ideal format for logos and screenshots requiring transparency, but photographic PNG images often balloon in size to 10MB to 30MB or more. When uploading images to websites, attaching them to emails, or publishing them to digital storefronts, massive PNG files waste bandwidth and hurt page loading speed.

Converting PNG to JPG applies intelligent lossy compression to reduce file sizes by 70% to 90% while maintaining crisp photographic visual fidelity. Because JPEG does not support transparency, Hurrykit gives you full control over the background fill color (clean white by default, with black or custom tones available).`,
    howSteps: [
      'Select or drop your PNG files into the converter area.',
      'Set your target JPG quality slider (90% is the recommended sweet spot).',
      'Choose your preferred background color for any transparent areas (default is clean white).',
      'Click "Convert All" to process your files in milliseconds, then download the results.'
    ],
    specs: [
      { label: 'Input Format', value: 'PNG (8-bit, 24-bit, 32-bit RGBA)' },
      { label: 'Output Format', value: 'JPEG / JPG' },
      { label: 'Background Handling', value: 'Automatic solid fill for alpha pixels (White, Black, Custom)' },
      { label: 'Size Reduction', value: 'Typically 70% to 90% smaller' }
    ],
    tips: [
      'For screenshots of documents or websites, 85%–90% quality produces razor-sharp text with dramatically reduced file weight.',
      'Check the background color preview to ensure transparent logos blend smoothly into your chosen backdrop.',
      'Conversions process entirely inside your browser memory, guaranteeing speed and complete privacy.'
    ],
    faqs: [
      {
        q: 'Why convert PNG to JPG?',
        a: 'PNG files are lossless and can be extremely large, especially for complex photos. Converting to JPG dramatically reduces file size (often by 70-90%) for faster web loading and easier email attachments.'
      },
      {
        q: 'What happens to transparent backgrounds in PNG?',
        a: 'JPG does not support transparency. Hurrykit fills transparent areas with clean white by default, or you can select black or light grey in the options panel.'
      },
      {
        q: 'Are any image files uploaded to Hurrykit servers?',
        a: 'Zero bytes leave your computer. The conversion is performed directly in your web browser using HTML5 Canvas and WebAssembly.'
      },
      {
        q: 'Can I batch convert multiple PNG screenshots at once?',
        a: 'Yes, you can drop up to 50 PNG files at a time and download them individually or as a single ZIP archive.'
      }
    ]
  },
  {
    file: 'tools/avif-to-jpg.md',
    h1: 'Convert AVIF to JPG Online for Universal Compatibility',
    intro: 'Convert next-generation AVIF images to universal JPEG format in your browser. Fast, local decoding without sending files to the cloud.',
    whyTitle: 'Why Convert AVIF to JPG?',
    whyText: `AVIF (AV1 Image File Format) is an ultra-modern image compression format derived from the AV1 video codec. It offers remarkable compression efficiency, often beating WebP and JPEG by 50% or more. However, software adoption for AVIF is still fragmented: many desktop graphics editors, operating system file pickers, email clients, and social networks do not yet support .avif files.

When you download an AVIF photo from the web and find you cannot open it in Photoshop, attach it to a job application, or share it on Discord, converting to JPG is the quickest remedy. Hurrykit decodes AV1 video frames directly in WebAssembly and saves standard JPEG files that work everywhere.`,
    howSteps: [
      'Drag and drop your .avif files into the conversion area.',
      'Select your desired output quality (85%–95% recommended).',
      'Click "Convert All" to transcode the AVIF images locally.',
      'Download your universal JPG files instantly.'
    ],
    specs: [
      { label: 'Input Format', value: 'AVIF (AV1 Image File Format)' },
      { label: 'Output Format', value: 'Standard JPEG / JPG' },
      { label: 'Decoding Technology', value: 'WebAssembly AV1 software decoder' },
      { label: 'Performance', value: 'Fast client-side rendering with zero network delay' }
    ],
    tips: [
      'Keep quality at 90% or higher to preserve the rich color range and dynamic detail of high-quality AVIF photos.',
      'Batch conversion is fully supported: drop all your downloaded AVIF images to convert them in sequence.',
      'Because AV1 decoding is CPU intensive, modern multi-core devices will process batches significantly faster.'
    ],
    faqs: [
      {
        q: 'Why can\'t I open AVIF images on my computer?',
        a: 'AVIF is a newer format based on the AV1 video codec. Many legacy photo viewers, office applications, and operating systems lack built-in AVIF codecs.'
      },
      {
        q: 'Does converting AVIF to JPG reduce image quality?',
        a: 'Converting to high-quality JPG (90%+) retains virtually all visual detail while unlocking complete compatibility across all devices and software.'
      },
      {
        q: 'Are my AVIF files uploaded to external servers?',
        a: 'No. Hurrykit processes all images locally inside your browser via WebAssembly. Your photos never touch a remote server.'
      },
      {
        q: 'Can I convert animated AVIF files to JPG?',
        a: 'For animated AVIF sequences, Hurrykit converts the first keyframe into a high-resolution still JPG photo.'
      }
    ]
  },
  {
    file: 'tools/svg-to-png.md',
    h1: 'Convert SVG Vector to PNG Online at High Resolution',
    intro: 'Rasterize scalable SVG vector graphics into high-resolution PNG images with transparent backgrounds. Render at custom scale factors locally.',
    whyTitle: 'Why Convert SVG to PNG?',
    whyText: `Scalable Vector Graphics (SVG) are ideal for responsive web design and resolution-independent icons. However, social media platforms, presentation software like PowerPoint, digital marketing banners, and certain content management systems do not accept vector SVG uploads or fail to render embedded CSS styling correctly.

Rasterizing SVG vectors to PNG produces a crisp bitmap with full alpha transparency support that looks sharp on retina screens and displays consistently across all software. Hurrykit renders your SVG code against an HTML5 canvas at your specified scale factor (1x, 2x, 4x for ultra-high-definition graphics) directly in your browser.`,
    howSteps: [
      'Drop your .svg files or paste your raw SVG graphics into the upload area.',
      'Select your target rendering scale (1x for standard, 2x for Retina, 4x for high-res print).',
      'Click "Convert All" to rasterize the vector paths to PNG pixels.',
      'Download your crisp transparent PNG graphics.'
    ],
    specs: [
      { label: 'Input Format', value: 'SVG (XML-based Vector Graphics)' },
      { label: 'Output Format', value: 'PNG (32-bit RGBA with full transparency)' },
      { label: 'Resolution Options', value: '1x, 2x (Retina), 4x (Ultra HD)' },
      { label: 'Security', value: 'Sandboxed SVG rasterization in client DOM' }
    ],
    tips: [
      'Choose 2x or 4x scale if you plan to use the resulting PNG in presentations, print materials, or high-density mobile screens.',
      'Embedded fonts and CSS animations within the SVG are evaluated during rendering for faithful reproduction.',
      'Zero server round-trips guarantee that proprietary vector illustrations and company branding assets remain completely confidential.'
    ],
    faqs: [
      {
        q: 'Can I export SVG to PNG with a transparent background?',
        a: 'Yes. Transparent vector backgrounds are fully preserved as 32-bit alpha channels in the exported PNG.'
      },
      {
        q: 'How do I ensure the rasterized PNG is not blurry on high-resolution screens?',
        a: 'Select the 2x or 4x resolution multiplier in the settings panel to render vectors at double or quadruple pixel density.'
      },
      {
        q: 'Are complex SVG gradients and filters supported?',
        a: 'Yes. Modern browser rendering engines parse SVG paths, linear/radial gradients, and CSS clip paths with precision.'
      },
      {
        q: 'Is there any risk of malicious SVG script injection?',
        a: 'No. Hurrykit sandboxes SVG rendering safely within browser canvas drawing routines with script execution disabled.'
      }
    ]
  },
  {
    file: 'tools/opus-to-mp3.md',
    h1: 'Convert OPUS Audio to MP3 Online (WhatsApp Voice Notes)',
    intro: 'Convert WhatsApp voice notes and OPUS audio recordings to universal MP3 files. High-bitrate libmp3lame encoding right inside your browser.',
    whyTitle: 'Why Convert OPUS to MP3?',
    whyText: `OPUS is an outstanding, highly modern audio codec designed by the IETF for interactive speech and music streaming. WhatsApp, Telegram, Skype, and Discord use OPUS (frequently wrapped in .ogg or .opus containers) for all voice notes. However, default media players on Windows, older car audio stereos, MP3 players, and standard audio transcription services often cannot play raw OPUS files.

Converting OPUS to universal MP3 format allows you to archive important voice notes, listen to them on any MP3-capable device, import them into audio editing software like Audacity, or submit them to automated transcription tools. Hurrykit uses an in-browser WebAssembly build of FFmpeg to transcode your audio directly on your device.`,
    howSteps: [
      'Select or drag your .opus or WhatsApp audio files into the converter.',
      'Choose your preferred MP3 bitrate (128 kbps is optimal for speech; 192 kbps or 320 kbps for music).',
      'Click "Convert All" to start local FFmpeg WebAssembly encoding.',
      'Download your MP3 audio files immediately.'
    ],
    specs: [
      { label: 'Input Format', value: 'OPUS audio (.opus, .ogg, WhatsApp voice messages)' },
      { label: 'Output Format', value: 'MP3 (MPEG-1 Audio Layer III)' },
      { label: 'Encoder', value: 'FFmpeg libmp3lame compiled to WebAssembly' },
      { label: 'Bitrate Options', value: '128 kbps, 192 kbps, 256 kbps, 320 kbps' }
    ],
    tips: [
      'For voice recordings and spoken memos, 128 kbps or 192 kbps produces pristine speech clarity with minimal file size.',
      'WhatsApp voice notes copied from mobile phones can be dropped directly into the converter without manual renaming.',
      'Because voice messages often contain private and confidential conversations, client-side processing guarantees zero data leakage.'
    ],
    faqs: [
      {
        q: 'Can I convert WhatsApp voice notes using this tool?',
        a: 'Yes. WhatsApp saves voice messages as OPUS audio. You can drag them directly into Hurrykit and convert them into standard MP3 files.'
      },
      {
        q: 'Does converting OPUS to MP3 affect audio clarity?',
        a: 'Hurrykit encodes using high-grade psychoacoustic modeling at bitrates up to 320 kbps, preserving full clarity for voices and instruments.'
      },
      {
        q: 'Are private voice recordings uploaded to your servers?',
        a: 'Never. The entire FFmpeg engine runs inside your web browser via WebAssembly. Your audio files never leave your device.'
      },
      {
        q: 'Can I convert multiple audio files at once?',
        a: 'Yes, you can add multiple voice notes to the batch queue and download them individually or as a single ZIP archive.'
      }
    ]
  },
  {
    file: 'tools/m4a-to-mp3.md',
    h1: 'Convert M4A Voice Memos to MP3 Online',
    intro: 'Convert Apple Voice Memos and iTunes M4A audio files into universal MP3 format. Fast in-browser conversion with customizable bitrates and privacy.',
    whyTitle: 'Why Convert M4A to MP3?',
    whyText: `Apple iPhone Voice Memos, QuickTime audio recordings, and iTunes downloads are saved in MPEG-4 Audio (.m4a) containers encoded with AAC or ALAC. While Apple hardware plays M4A effortlessly, many older automotive USB stereos, non-Apple DJ software, podcast distribution tools, and transcription services still demand standard MP3 files.

Converting your M4A voice memos and song recordings to MP3 provides universal playback compatibility across every computer, Android smartphone, smart speaker, and media system. Hurrykit processes your audio tracks locally using FFmpeg WebAssembly, eliminating wait times and server privacy concerns.`,
    howSteps: [
      'Select or drop your Apple .m4a audio files into the converter.',
      'Select your desired MP3 bitrate (192 kbps standard, 320 kbps for audiophile fidelity).',
      'Click "Convert All" to transcode the AAC audio streams locally.',
      'Save your finished MP3 files to your local drive.'
    ],
    specs: [
      { label: 'Input Format', value: 'M4A (MPEG-4 Audio with AAC or ALAC codec)' },
      { label: 'Output Format', value: 'MP3 (MPEG Audio Layer III)' },
      { label: 'Processing', value: 'In-browser WebAssembly FFmpeg worker' },
      { label: 'Max File Size', value: 'Up to 500 MB per audio file' }
    ],
    tips: [
      'If you recorded a lecture, meeting, or interview on an iPhone Voice Memo, 192 kbps provides outstanding vocal presence.',
      'For music tracks recorded in lossless ALAC, select 320 kbps MP3 to preserve dynamic range and frequency separation.',
      'Conversions do not rely on server queues, so your files begin processing the instant you click convert.'
    ],
    faqs: [
      {
        q: 'How do I convert iPhone Voice Memos to MP3?',
        a: 'Share or air-drop the Voice Memo file (.m4a) to your computer or open Hurrykit on your iPhone browser, drop the file, and download the MP3.'
      },
      {
        q: 'What is the best bitrate for M4A to MP3 conversion?',
        a: '192 kbps is the recommended sweet spot for podcasts and voice notes. For music, 320 kbps provides maximum fidelity.'
      },
      {
        q: 'Is my audio uploaded to a third-party server?',
        a: 'No. All conversion operations take place entirely on your device via client-side WebAssembly.'
      },
      {
        q: 'Can I convert protected M4P files from Apple Music?',
        a: 'No, DRM-encrypted files like Apple Music M4P files cannot be converted. Only unprotected audio files like Voice Memos and personal recordings are supported.'
      }
    ]
  },
  {
    file: 'tools/wav-to-mp3.md',
    h1: 'Convert Studio WAV to MP3 Online at up to 320 kbps',
    intro: 'Convert uncompressed WAV audio files into lightweight, universal MP3s. Encode at up to 320 kbps entirely in your browser with zero server uploads.',
    whyTitle: 'Why Convert WAV to MP3?',
    whyText: `WAV (Waveform Audio File Format) is the gold standard uncompressed format used in digital audio workstations (DAWs), podcast studio recorders, and musical production. While pristine in acoustic fidelity, 16-bit or 24-bit 44.1kHz stereo WAV files consume roughly 10MB of storage for every single minute of recorded sound (~50MB for a standard 5-minute song).

Converting WAV to MP3 applies perceptual psychoacoustic encoding to strip out frequencies imperceptible to human ears, slashing file sizes by up to 90% (from 50MB down to 5MB) while retaining sparkling audio clarity. This makes the files easy to email, upload to podcast hosting platforms, stream on websites, or play on mobile devices.`,
    howSteps: [
      'Select or drag your .wav audio tracks into the converter window.',
      'Choose your preferred MP3 bitrate: 128 kbps (speech), 192 kbps (balanced), or 320 kbps (studio fidelity).',
      'Click "Convert All" to transcode the uncompressed PCM samples into MP3 frames.',
      'Download your compact MP3 files.'
    ],
    specs: [
      { label: 'Input Format', value: 'WAV / RIFF (16-bit, 24-bit PCM audio)' },
      { label: 'Output Format', value: 'MP3 (CBR / VBR encoding up to 320 kbps)' },
      { label: 'Size Reduction', value: 'Typically 85% to 90% smaller than raw WAV' },
      { label: 'Engine', value: 'FFmpeg libmp3lame in WebAssembly' }
    ],
    tips: [
      'Select 320 kbps if you are distributing demo music tracks to listeners who value pristine sound reproduction.',
      'Use 192 kbps for podcast episodes to balance fast listener download times with natural voice timbre.',
      'Because conversion takes place on your device, even large 200MB WAV master files process rapidly without bandwidth delays.'
    ],
    faqs: [
      {
        q: 'What bitrate should I select for MP3?',
        a: '192 kbps is the balanced default offering CD-like quality for general listening. For archival or professional production, choose 320 kbps. For speech recordings or audiobooks, 128 kbps provides smaller file sizes.'
      },
      {
        q: 'Why convert WAV to MP3?',
        a: 'WAV files store raw uncompressed audio data (typically 10 MB per minute of audio). MP3 cuts file size by up to 90% while retaining high audio fidelity.'
      },
      {
        q: 'Is my audio uploaded anywhere?',
        a: 'Never. All audio encoding runs locally on your computer or phone using an in-browser WebAssembly port of FFmpeg (libmp3lame).'
      },
      {
        q: 'Does converting WAV to MP3 lose audio data?',
        a: 'MP3 is a lossy compression format, but at 256 or 320 kbps, the difference compared to uncompressed WAV is virtually indistinguishable to the human ear.'
      }
    ]
  },
  {
    file: 'tools/mp3-to-wav.md',
    h1: 'Convert MP3 to Uncompressed 16-Bit WAV Online',
    intro: 'Decode compressed MP3 files into uncompressed 16-bit PCM WAV audio. Prepare audio for editing in DAWs, audio software, and hardware samplers.',
    whyTitle: 'Why Convert MP3 to WAV?',
    whyText: `While MP3 is the most common format for listening to music and podcasts, professional audio editing software, older hardware samplers, digital audio workstations (like Pro Tools, Ableton, and FL Studio), and game engines frequently require uncompressed PCM WAV files to perform low-latency editing and mixing without decoding CPU overhead.

Converting your MP3 files to 16-bit 44.1kHz or 48kHz WAV audio provides a standardized, uncompressed audio container ready for track editing, sound effects design, or burning to standard red-book Audio CDs. Hurrykit decompresses the MPEG audio frames locally via WebAssembly, delivering clean, bit-accurate PCM audio data directly to your computer.`,
    howSteps: [
      'Drop your .mp3 audio tracks into the converter.',
      'Choose output sample rate (44.1 kHz for CD audio or 48 kHz for video post-production).',
      'Click "Convert All" to decode the MP3 streams into uncompressed WAV files.',
      'Download your finished WAV tracks instantly.'
    ],
    specs: [
      { label: 'Input Format', value: 'MP3 (MPEG-1/2 Audio Layer III)' },
      { label: 'Output Format', value: 'WAV (16-bit Linear PCM, 44.1kHz / 48kHz)' },
      { label: 'Compatibility', value: '100% compatible with all DAWs, samplers, and CD burning software' },
      { label: 'Privacy', value: 'No audio leaves your local machine' }
    ],
    tips: [
      'Converting MP3 to WAV will expand the file size significantly because the audio is uncompressed.',
      'While converting to WAV cannot restore frequencies removed during the initial MP3 compression, it ensures maximum compatibility with production software.',
      'Batch conversion is fully supported for whole albums or sample sound libraries.'
    ],
    faqs: [
      {
        q: 'Does converting MP3 to WAV improve the sound quality?',
        a: 'No. The audio data discarded when the MP3 was originally created cannot be recreated, but converting to WAV allows seamless editing in audio software that requires uncompressed input.'
      },
      {
        q: 'Why did the file size increase after converting to WAV?',
        a: 'WAV files contain raw, uncompressed PCM audio samples. A 5 MB MP3 typically expands to around 40 MB to 50 MB in uncompressed 16-bit WAV format.'
      },
      {
        q: 'Can I burn these WAV files to an Audio CD?',
        a: 'Yes. The output 16-bit 44.1kHz WAV format matches the Red Book Audio CD specification perfectly.'
      },
      {
        q: 'Is my audio private when using Hurrykit?',
        a: 'Yes. Processing runs entirely in your web browser via WebAssembly without uploading files to remote servers.'
      }
    ]
  },
  {
    file: 'tools/mp4-to-mp3.md',
    h1: 'Extract MP3 Audio from MP4 Video Online',
    intro: 'Extract pristine audio tracks from MP4 video files and save as MP3. Fast in-browser extraction using WebAssembly FFmpeg with complete privacy.',
    whyTitle: 'Why Extract MP3 Audio from MP4 Videos?',
    whyText: `Whether you want to listen to a recorded conference presentation, university lecture, music performance, podcast video, or interview while walking or driving, video files take up enormous amounts of storage space and drain battery life by keeping your screen active.

Extracting the audio stream into an MP3 file gives you a lightweight, universal audio recording that plays in background mode on any mobile device, car stereo, or music player. Because Hurrykit processes files locally on your device using WebAssembly FFmpeg, you can extract audio from large video files in seconds without waiting for hours to upload gigabytes over home broadband.`,
    howSteps: [
      'Drop your MP4 video file into the converter upload area.',
      'Choose your preferred MP3 bitrate (192 kbps is standard, 320 kbps for highest fidelity).',
      'Click "Convert All" to demux the video container and transcode the audio track.',
      'Download your new MP3 audio track instantly.'
    ],
    specs: [
      { label: 'Input Format', value: 'MP4 container (H.264 / H.265 / AV1 with AAC audio)' },
      { label: 'Output Format', value: 'MP3 (up to 320 kbps stereo)' },
      { label: 'Engine', value: 'In-browser WebAssembly FFmpeg demuxer & encoder' },
      { label: 'Max Video Size', value: 'Up to 500 MB per video file' }
    ],
    tips: [
      'Extracting audio from a video file typically reduces storage footprint by 90% to 95%.',
      'Because no video bytes are uploaded over the internet, conversion completes much faster than cloud-based video converters.',
      'Use 320 kbps when extracting music concerts or acoustic recordings to capture rich bass and high treble clarity.'
    ],
    faqs: [
      {
        q: 'Does extracting audio reduce quality?',
        a: 'Hurrykit decodes the video\'s native audio stream and re-encodes to MP3 at your chosen bitrate (up to 320 kbps), preserving crisp highs and deep bass.'
      },
      {
        q: 'Can I extract audio from large video files?',
        a: 'Yes! Videos up to 500 MB can be processed. Because no bytes are uploaded over the internet, extraction is much faster than cloud converters.'
      },
      {
        q: 'Are my personal videos kept private?',
        a: '100%. Processing happens entirely on your machine. Your video never leaves your browser.'
      },
      {
        q: 'Can I extract audio on an iPhone or Android phone?',
        a: 'Yes. Hurrykit runs directly in mobile browsers like Safari and Chrome without installing any mobile apps.'
      }
    ]
  },
  {
    file: 'tools/mov-to-mp4.md',
    h1: 'Convert Apple MOV Video to MP4 Online',
    intro: 'Convert iPhone and QuickTime MOV video clips to universal MP4 format in your browser. Eliminate playback errors with complete privacy.',
    whyTitle: 'Why Convert MOV to MP4?',
    whyText: `Apple iPhones, iPads, and Mac computers record video in QuickTime MOV container format by default. While MOV files play effortlessly on Apple devices, they frequently run into compatibility barriers when shared with Windows users, uploaded to web platforms, or played on Android phones, smart TVs, and video game consoles.

Converting Apple MOV videos to standard MP4 (MPEG-4 Part 14) with H.264 video and AAC audio ensures universal playback across every operating system, streaming platform, and digital device on the planet. Hurrykit executes this conversion directly in your browser using WebAssembly FFmpeg, protecting your personal video footage from cloud security risks.`,
    howSteps: [
      'Select or drag your .mov video files into the drop zone above.',
      'Select your desired video quality preset or leave on balanced default.',
      'Click "Convert All" to start the local WebAssembly FFmpeg conversion.',
      'Download your universal MP4 video files to your device.'
    ],
    specs: [
      { label: 'Input Format', value: 'QuickTime MOV (Apple ProRes, H.264, HEVC)' },
      { label: 'Output Format', value: 'MP4 (H.264 / AVC video with AAC audio)' },
      { label: 'Compatibility', value: 'Universal across Windows, macOS, Android, iOS, Linux, Web' },
      { label: 'Processing Security', value: 'Zero cloud uploads; 100% in-browser' }
    ],
    tips: [
      'If your MOV was shot on a modern iPhone in HDR, converting to standard H.264 MP4 ensures vivid colors render properly on standard dynamic range computer screens.',
      'Converting large video clips locally saves mobile data and avoids slow cloud upload times.',
      'Batch conversion lets you convert multiple camera clips in a single session.'
    ],
    faqs: [
      {
        q: 'Why won\'t my Apple MOV video play on Windows?',
        a: 'Windows Media Player and older video apps lack native support for certain Apple MOV codecs and metadata tracks. Converting to MP4 solves this problem instantly.'
      },
      {
        q: 'Does converting MOV to MP4 lower video quality?',
        a: 'Hurrykit uses high-grade H.264 encoding with visually lossless rate factors, ensuring your converted MP4 looks virtually identical to the original MOV.'
      },
      {
        q: 'Are my private videos uploaded to external servers?',
        a: 'No. The entire conversion process runs inside your web browser via WebAssembly. Your videos never leave your computer.'
      },
      {
        q: 'What is the maximum MOV file size I can convert?',
        a: 'You can convert video files up to 500 MB directly in your browser.'
      }
    ]
  },
  {
    file: 'tools/mkv-to-mp4.md',
    h1: 'Convert MKV Video Container to Universal MP4 Online',
    intro: 'Convert MKV video files into universal MP4 format with zero uploads. Play your videos smoothly on iPhone, iPad, Apple TV, and web browsers.',
    whyTitle: 'Why Convert MKV to MP4?',
    whyText: `Matroska Video (MKV) is a popular open-standard video container capable of holding unlimited video, audio, and subtitle tracks. However, Apple devices (iPhone, iPad, Mac QuickTime Player) and default web browsers refuse to play MKV containers natively, making it frustrating to watch downloaded videos, home movie backups, or drone recordings.

Converting MKV to MP4 remuxes or transcodes the media streams into the world\'s most widely supported multimedia container. Once converted to MP4, your video will play smoothly in QuickTime, Safari, iOS Photos, and any mobile media player. Hurrykit performs this conversion directly inside your browser using WebAssembly.`,
    howSteps: [
      'Select or drag your .mkv video files into the upload window.',
      'Select your output options for audio and video streams.',
      'Click "Convert All" to process the video locally on your CPU.',
      'Download your converted MP4 video file.'
    ],
    specs: [
      { label: 'Input Format', value: 'MKV (Matroska Multimedia Container)' },
      { label: 'Output Format', value: 'MP4 (MPEG-4 Part 14 Container)' },
      { label: 'Audio Streams', value: 'AAC Stereo encoding for maximum compatibility' },
      { label: 'Data Privacy', value: 'Zero bytes transferred to external servers' }
    ],
    tips: [
      'Because MKV files often contain surround sound tracks (AC3/DTS) that mobile phones cannot play, Hurrykit downmixes audio to high-quality stereo AAC.',
      'Converting locally avoids the security risk of uploading personal video archives to unknown cloud conversion websites.',
      'Fast modern laptops with multi-core processors will transcode videos in just a fraction of their runtime.'
    ],
    faqs: [
      {
        q: 'Why doesn\'t QuickTime or iPhone open MKV files?',
        a: 'Apple operating systems do not support the MKV container format natively. Converting the file to MP4 makes it immediately playable in QuickTime, Photos, and Safari.'
      },
      {
        q: 'Does converting MKV to MP4 reduce video quality?',
        a: 'When using Hurrykit\'s default high-bitrate H.264 profile, image quality is maintained with virtually zero perceived loss in sharpness or color fidelity.'
      },
      {
        q: 'Are my videos uploaded to any server during conversion?',
        a: 'No. All processing happens entirely inside your browser using WebAssembly. Your files remain 100% private on your machine.'
      },
      {
        q: 'Can I convert MKV files with soft subtitles?',
        a: 'Hurrykit converts the primary video and audio streams into standard MP4. For hardcoded subtitles, ensure they are burned into the source video stream.'
      }
    ]
  },
  {
    file: 'tools/avi-to-mp4.md',
    h1: 'Convert Legacy AVI Video to Modern MP4 Online',
    intro: 'Modernize legacy AVI video files into standard MP4 format directly in your browser. Play old home videos and camcorder clips on modern phones and tablets.',
    whyTitle: 'Why Convert AVI to MP4?',
    whyText: `AVI (Audio Video Interleave) was introduced by Microsoft in 1992 and was the standard format for video cameras, digital cameras, and PC multimedia for decades. However, AVI lacks support for modern streaming protocols, modern video compression algorithms, and mobile playback. Smartphones, tablets, smart TVs, and web browsers cannot play AVI files natively.

Converting your archival AVI home videos, digital camcorder clips, and security recordings to MP4 brings them into the modern era. MP4 offers dramatically superior compression efficiency and universal playback on every iPhone, Android device, Mac, and Windows PC. Hurrykit converts your AVI files locally on your computer with complete privacy.`,
    howSteps: [
      'Drag and drop your legacy .avi video files into the converter area.',
      'Choose your target quality profile (Balanced recommended).',
      'Click "Convert All" to decode the legacy DivX/Xvid streams into modern H.264 MP4.',
      'Download your modern MP4 video files.'
    ],
    specs: [
      { label: 'Input Format', value: 'AVI (Audio Video Interleave with DivX, Xvid, or DV codecs)' },
      { label: 'Output Format', value: 'MP4 (H.264 video with AAC audio)' },
      { label: 'Compression Gain', value: 'Often 50% to 75% smaller file size with equal or better clarity' },
      { label: 'Privacy', value: '100% client-side WebAssembly execution' }
    ],
    tips: [
      'Converting older camcorder AVI files to MP4 often cuts file size in half while making them easy to share via WhatsApp, Google Drive, or YouTube.',
      'Deinterlacing filters are automatically applied to interlaced camcorder footage to eliminate horizontal jagged lines.',
      'No files are transmitted to cloud servers, protecting precious family memories and private recordings.'
    ],
    faqs: [
      {
        q: 'Why won\'t my smartphone or tablet play AVI files?',
        a: 'AVI is a legacy 1990s container that modern mobile operating systems (iOS and Android) do not support natively. Converting to MP4 resolves this immediately.'
      },
      {
        q: 'Will converting AVI to MP4 make the file size smaller?',
        a: 'Yes. Modern H.264 compression is vastly more efficient than older AVI codecs (like DivX or Cinepak), typically reducing file size by 50% or more.'
      },
      {
        q: 'Are my private family videos kept secure?',
        a: 'Yes, 100%. The conversion runs locally inside your browser via WebAssembly. Your videos are never uploaded to the cloud.'
      },
      {
        q: 'Can I convert multiple AVI clips at once?',
        a: 'Yes. You can add multiple clips to the queue and convert them sequentially in a single batch.'
      }
    ]
  },
  {
    file: 'tools/webm-to-mp4.md',
    h1: 'Convert WebM Video to MP4 Online for Any Player',
    intro: 'Convert downloaded WebM videos into universal MP4 files in your browser. Compatible with all video editing software, mobile devices, and media players.',
    whyTitle: 'Why Convert WebM to MP4?',
    whyText: `WebM is an open media file format developed for HTML5 web video, commonly utilizing VP8 or VP9 video codecs with Vorbis or Opus audio. While web browsers like Chrome and Firefox excel at playing WebM, many video editing applications (such as Adobe Premiere Pro, Final Cut Pro, and DaVinci Resolve), default Windows video editors, and mobile gallery apps refuse to import or play WebM files.

Converting your WebM screen recordings, online video clips, and web downloads to MP4 restores universal compatibility. MP4 files import cleanly into all editing software and play without glitches on all iPhones, iPads, Android devices, and smart televisions. Hurrykit performs this transcoding directly in your browser without requiring server uploads.`,
    howSteps: [
      'Select or drag your .webm video files into the upload box.',
      'Select your output video quality preset.',
      'Click "Convert All" to transcode VP8/VP9 streams to H.264 MP4 locally.',
      'Download your finished MP4 video files.'
    ],
    specs: [
      { label: 'Input Format', value: 'WebM (VP8, VP9, AV1 video with Opus/Vorbis audio)' },
      { label: 'Output Format', value: 'MP4 (H.264 video with AAC audio)' },
      { label: 'Engine', value: 'WebAssembly FFmpeg transcoding pipeline' },
      { label: 'Supported Size', value: 'Up to 500 MB per video clip' }
    ],
    tips: [
      'Screen recordings captured in Chrome or Firefox are often saved as WebM. Converting to MP4 makes them easy to edit in desktop software.',
      'Because transcoding occurs in your browser, you never have to wait for large video files to upload to a remote server.',
      'Audio streams are converted to standard stereo AAC to guarantee playback on every sound system.'
    ],
    faqs: [
      {
        q: 'Why can\'t I import WebM videos into my video editor?',
        a: 'Many professional video editing suites do not support the WebM container or VP8/VP9 codecs. Converting to standard MP4 solves this problem instantly.'
      },
      {
        q: 'Does converting WebM to MP4 lose visual quality?',
        a: 'Hurrykit uses high-bitrate H.264 encoding to preserve crisp text, vibrant colors, and smooth frame rates from the original video.'
      },
      {
        q: 'Is this converter safe for sensitive business recordings?',
        a: 'Yes. All video processing takes place 100% on your device via WebAssembly. No data is ever sent across the internet.'
      },
      {
        q: 'Can I convert WebM files on my mobile phone?',
        a: 'Yes, Hurrykit works in mobile web browsers without installing additional software.'
      }
    ]
  },
  {
    file: 'tools/hevc-to-h264.md',
    h1: 'Convert HEVC (H.265) to H.264 Video Online',
    intro: 'Transcode high-efficiency HEVC (H.265) videos to universal H.264 (AVC) in your browser. Fix black-screen playback errors on older PCs and TVs.',
    whyTitle: 'Why Convert HEVC to H.264?',
    whyText: `Modern smartphones (like recent iPhones and Samsung Galaxy devices), action cameras (GoPro), and drones capture 4K video using High Efficiency Video Coding (HEVC / H.265) to cut file sizes in half. However, HEVC playback requires specialized hardware decoders or paid operating system extensions. On older computers, Windows media players, web browsers, and smart TVs, HEVC videos often result in a black screen with audio only.

Converting HEVC to standard H.264 (Advanced Video Coding) restores full playback compatibility with virtually every screen and operating system manufactured in the last fifteen years. Hurrykit transcodes your video footage locally on your hardware using WebAssembly FFmpeg, ensuring fast processing and complete confidentiality.`,
    howSteps: [
      'Drop your HEVC/H.265 video files into the converter area.',
      'Choose your preferred H.264 quality profile (Balanced is recommended).',
      'Click "Convert All" to re-encode the video stream locally.',
      'Download your universally compatible H.264 MP4 video.'
    ],
    specs: [
      { label: 'Input Codec', value: 'HEVC / H.265 (High Efficiency Video Coding)' },
      { label: 'Output Codec', value: 'H.264 / AVC (Advanced Video Coding, Baseline & Main profiles)' },
      { label: 'Container', value: 'Universal MP4 container' },
      { label: 'Processing Architecture', value: 'In-browser WebAssembly CPU/Worker pipeline' }
    ],
    tips: [
      'Converting HEVC to H.264 eliminates the "Codec missing" or black screen error on Windows PCs.',
      'If you are uploading videos to web portals that reject H.265, H.264 is universally accepted.',
      'Because video re-encoding is computationally intensive, running on a plugged-in computer provides the fastest speeds.'
    ],
    faqs: [
      {
        q: 'Why does my HEVC video show a black screen with sound on Windows?',
        a: 'Windows 10 and 11 do not include the HEVC video codec out of the box. Converting the video to H.264 allows it to play natively in Windows Media Player and Movies & TV.'
      },
      {
        q: 'Will converting from HEVC to H.264 increase the video file size?',
        a: 'Because H.264 is an older compression standard than H.265, maintaining the same visual quality may result in a slightly larger file size, but with 100% universal compatibility.'
      },
      {
        q: 'Are my private video files uploaded to your servers?',
        a: 'No. All decoding and re-encoding executes entirely inside your browser via WebAssembly. Your files never leave your computer.'
      },
      {
        q: 'Can I convert 4K GoPro and drone videos?',
        a: 'Yes, files up to 500 MB can be converted directly in your browser.'
      }
    ]
  },
  {
    file: 'tools/mp4-to-gif.md',
    h1: 'Convert MP4 Video Clip to Animated GIF Online',
    intro: 'Turn MP4 video clips into looping animated GIFs right inside your browser. Perfect for social media, Slack reactions, memes, and email newsletters.',
    whyTitle: 'Why Convert MP4 to GIF?',
    whyText: `Short video clips are great, but many platforms—including GitHub readmes, email newsletters, Slack channels, Discord reaction slots, and forum signatures—do not allow embedded video players or require user click-to-play interactions. Animated GIFs play and loop automatically on every platform without requiring any video player controls or plugins.

Converting an MP4 clip into an animated GIF creates an instantly shareable visual snippet. Hurrykit optimizes color palettes using spatial and temporal dithering algorithms in WebAssembly, preventing color banding and keeping GIF file sizes manageable while preserving fluid motion.`,
    howSteps: [
      'Select or drop your MP4 video clip into the converter interface.',
      'Set your target frame rate (10 fps to 15 fps recommended for compact GIFs) and dimensions.',
      'Click "Convert All" to generate the animated GIF frames in your browser.',
      'Preview and download your looping animated GIF.'
    ],
    specs: [
      { label: 'Input Format', value: 'MP4 video (H.264 / AAC)' },
      { label: 'Output Format', value: 'Animated GIF (CompuServe GIF89a)' },
      { label: 'Palette Generation', value: 'Adaptive 256-color palette with Floyd-Steinberg dithering' },
      { label: 'Processing', value: '100% in-browser WebAssembly' }
    ],
    tips: [
      'Keep your source clips short (under 10 seconds) to ensure your GIF file size remains compact for sharing.',
      'Choosing 12 to 15 frames per second provides smooth motion while saving significant file weight compared to 30 fps.',
      'Because all processing occurs in-browser, you can turn sensitive screen recordings into GIFs without uploading to cloud services.'
    ],
    faqs: [
      {
        q: 'How do I keep my GIF file size small?',
        a: 'Limit your clip duration to 3–6 seconds, reduce the resolution slightly, and use a frame rate of 10 to 15 fps.'
      },
      {
        q: 'Does Hurrykit add watermarks to generated GIFs?',
        a: 'Never. Hurrykit is 100% free and places zero watermarks or branding on your converted animations.'
      },
      {
        q: 'Are my video clips uploaded anywhere?',
        a: 'No. The GIF generation engine runs locally inside your browser via WebAssembly. Your videos remain completely private.'
      },
      {
        q: 'Can I convert videos from my phone into GIFs?',
        a: 'Yes. Hurrykit works in mobile browsers on iOS and Android with no apps required.'
      }
    ]
  },
  {
    file: 'tools/gif-to-mp4.md',
    h1: 'Convert Animated GIF to Lightweight MP4 Video Online',
    intro: 'Convert heavy animated GIFs into lightweight MP4 videos directly in your browser. Shrink file sizes by up to 90% while adding play/pause controls.',
    whyTitle: 'Why Convert GIF to MP4?',
    whyText: `The GIF format was created in 1987 and was never designed for modern high-resolution animation or long video playback. Because GIF encodes every frame as an uncompressed 256-color bitmap without inter-frame motion vector compression, even a short 5-second animation can easily weigh 10MB to 20MB.

Converting animated GIFs to modern MP4 (H.264) video typically shrinks the file footprint by 80% to 95% while dramatically improving playback smoothness and color fidelity. Furthermore, Instagram, TikTok, and many modern social media platforms do not allow uploading raw .gif files directly to feeds or stories, requiring MP4 video format instead. Hurrykit converts your GIFs to MP4 locally in seconds.`,
    howSteps: [
      'Drop your animated .gif files into the converter window.',
      'Select your preferred MP4 video quality setting.',
      'Click "Convert All" to transcode the GIF frames into an H.264 MP4 stream.',
      'Download your compact MP4 video file.'
    ],
    specs: [
      { label: 'Input Format', value: 'Animated GIF (GIF87a / GIF89a)' },
      { label: 'Output Format', value: 'MP4 (H.264 video stream)' },
      { label: 'Compression Efficiency', value: 'Typically 80% to 95% smaller file size' },
      { label: 'Platform Support', value: 'Ready for Instagram Reels, TikTok, YouTube Shorts, Web' }
    ],
    tips: [
      'Converting heavy GIFs to MP4 dramatically speeds up page load times on web pages and blogs.',
      'MP4 videos allow users to pause, seek, and scrub through animations, which is impossible with standard GIFs.',
      'Batch conversion lets you compress whole libraries of GIFs in a single session.'
    ],
    faqs: [
      {
        q: 'Why is an MP4 video so much smaller than an animated GIF?',
        a: 'GIF stores full bitmap images for every frame, while MP4 uses advanced inter-frame compression that only stores differences between frames, slashing file size by up to 95%.'
      },
      {
        q: 'Can I post the converted MP4 to Instagram and TikTok?',
        a: 'Yes! Instagram and TikTok require MP4 video format for feed posts, Reels, and Stories.'
      },
      {
        q: 'Are any files uploaded to remote servers during conversion?',
        a: 'No. The conversion is performed 100% locally on your machine via WebAssembly. Your files are completely private.'
      },
      {
        q: 'Does Hurrykit put any watermarks on the converted MP4?',
        a: 'No. All conversions are completely watermark-free.'
      }
    ]
  }
];

const CONTENT_DIR = path.join(process.cwd(), 'content');

for (const t of tools) {
  const filePath = path.join(CONTENT_DIR, t.file);
  
  // Format frontmatter FAQs
  const frontmatterFaqs = t.faqs
    .map((f) => `  - q: ${JSON.stringify(f.q)}\n    a: ${JSON.stringify(f.a)}`)
    .join('\n');

  // Format steps
  const stepsMd = t.howSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n');

  // Format specs
  const specsMd = t.specs.map((s) => `- **${s.label}:** ${s.value}`).join('\n');

  // Format tips
  const tipsMd = t.tips.map((tip) => `- ${tip}`).join('\n');

  // Format markdown FAQs
  const mdFaqs = t.faqs
    .map((f) => `### ${f.q}\n${f.a}`)
    .join('\n\n');

  const content = `---
intro: ${JSON.stringify(t.intro)}
faqs:
${frontmatterFaqs}
---

# ${t.h1}

${t.intro}

## ${t.whyTitle}

${t.whyText}

## How to Convert

${stepsMd}

## Technical Specifications & Details

${specsMd}

## Tips & Best Practices

${tipsMd}

## Frequently Asked Questions

${mdFaqs}
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Generated: ${t.file}`);
}

console.log('Finished writing all 20 Wave 1 tools content files.');
