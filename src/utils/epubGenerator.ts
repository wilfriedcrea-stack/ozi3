import JSZip from 'jszip';
import { Artbook } from '../types';
import { normalizeImageUrl } from './imageUtils';
import { formatPriceXofWithEur } from './currency';

interface GenerateEpubOptions {
  artbook: Artbook;
  userName?: string;
  userEmail?: string;
  isPaid?: boolean;
  transactionRef?: string;
}

interface LoadedImageAsset {
  data: Uint8Array;
  ext: 'jpg' | 'png' | 'webp';
  mediaType: string;
}

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchImageAsset(url: string): Promise<LoadedImageAsset | null> {
  if (!url) return null;
  try {
    const resolved = normalizeImageUrl(url);
    const response = await fetch(resolved, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const mime = (blob.type || 'image/jpeg').toLowerCase();

    let ext: 'jpg' | 'png' | 'webp' = 'jpg';
    let mediaType = 'image/jpeg';
    if (mime.includes('png')) {
      ext = 'png';
      mediaType = 'image/png';
    } else if (mime.includes('webp')) {
      ext = 'webp';
      mediaType = 'image/webp';
    }

    const buffer = await blob.arrayBuffer();
    return {
      data: new Uint8Array(buffer),
      ext,
      mediaType,
    };
  } catch {
    return null;
  }
}

export async function generateAndDownloadArtbookEpub({
  artbook,
  userName = 'Lecteur OZI',
  userEmail = 'lecteur@ozi.africa',
  isPaid = false,
  transactionRef,
}: GenerateEpubOptions): Promise<{ success: boolean; filename: string }> {
  try {
    const zip = new JSZip();

    // 1. mimetype MUST be the first file and uncompressed (STORE)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    zip.file(
      'META-INF/container.xml',
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
    );

    const oebps = zip.folder('OEBPS');
    if (!oebps) {
      throw new Error('Impossible de créer le conteneur OEBPS.');
    }

    // 3. CSS stylesheet
    oebps.file(
      'styles.css',
      `body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #111827;
  margin: 0;
  padding: 5%;
  line-height: 1.6;
}
.cover-page {
  text-align: center;
  padding-top: 2em;
}
.badge {
  display: inline-block;
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e14f41;
  margin-bottom: 1em;
}
h1 {
  font-size: 1.8em;
  margin: 0.4em 0;
  color: #090a0f;
}
h2 {
  font-size: 1.3em;
  margin-top: 1.5em;
  color: #090a0f;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}
.artist {
  font-size: 1.05em;
  color: #4b5563;
  font-weight: 600;
  margin-bottom: 1.5em;
}
.art-img {
  max-width: 100%;
  max-height: 75vh;
  height: auto;
  display: block;
  margin: 1em auto;
  border-radius: 6px;
}
.plate-box {
  text-align: center;
  page-break-after: always;
}
.plate-caption {
  font-size: 0.85em;
  color: #6b7280;
  margin-top: 0.75em;
}
.meta-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1em 1.2em;
  margin: 1.5em 0;
  font-size: 0.9em;
}
.license {
  font-size: 0.8em;
  color: #6b7280;
  margin-top: 2em;
  border-top: 1px solid #e5e7eb;
  padding-top: 1em;
}`
    );

    const manifestItems: string[] = [
      `<item id="styles" href="styles.css" media-type="text/css"/>`,
      `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
      `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    ];
    const spineItems: string[] = [];
    const navLinks: { id: string; href: string; title: string }[] = [];

    // 4. Load cover image
    const coverAsset = await fetchImageAsset(artbook.coverUrl);
    let coverHref = '';
    if (coverAsset) {
      coverHref = `images/cover.${coverAsset.ext}`;
      oebps.file(coverHref, coverAsset.data);
      manifestItems.push(
        `<item id="cover-image" href="${coverHref}" media-type="${coverAsset.mediaType}" properties="cover-image"/>`
      );
    }

    // 5. Cover XHTML
    const editionLabel = isPaid
      ? `Édition Certifiée (${formatPriceXofWithEur(artbook.price)})`
      : 'Édition Digitale Officielle OZI';
    const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(artbook.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="cover-page">
    <div class="badge">OZI ÉDITIONS ART • ${escapeXml(editionLabel)}</div>
    ${coverHref ? `<img class="art-img" src="${coverHref}" alt="${escapeXml(artbook.title)}"/>` : ''}
    <h1>${escapeXml(artbook.title)}</h1>
    <div class="artist">Par ${escapeXml(artbook.artistName)}</div>
    <div class="meta-card">
      <div><strong>Pages :</strong> ${artbook.pageCount} pages HD</div>
      <div><strong>Année :</strong> ${artbook.releaseYear}</div>
      <div><strong>Délivré à :</strong> ${escapeXml(userName)} (${escapeXml(userEmail)})</div>
      ${transactionRef ? `<div><strong>Référence :</strong> ${escapeXml(transactionRef)}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
    oebps.file('cover.xhtml', coverXhtml);
    manifestItems.push(`<item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="cover-page"/>`);
    navLinks.push({ id: 'cover-page', href: 'cover.xhtml', title: 'Couverture' });

    // 6. Editorial XHTML
    const editorialXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Présentation — ${escapeXml(artbook.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h2>À propos de l'Artbook</h2>
  <p>${escapeXml(artbook.description || `Recueil d'illustrations officiel de ${artbook.artistName}.`)}</p>

  <h2>L'Artiste : ${escapeXml(artbook.artistName)}</h2>
  <p>Cet artbook réunit des planches originales, recherches graphiques et concepts préparatoires supervisés directement par ${escapeXml(artbook.artistName)} pour la collection OZI Éditions.</p>

  <div class="license">
    <strong>Conditions de licence :</strong> Tous droits réservés à ${escapeXml(artbook.artistName)} et OZI Plateforme. Usage strictement personnel et non exclusif. Toute reproduction ou diffusion sans autorisation écrite est interdite.
  </div>
</body>
</html>`;
    oebps.file('editorial.xhtml', editorialXhtml);
    manifestItems.push(`<item id="editorial" href="editorial.xhtml" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="editorial"/>`);
    navLinks.push({ id: 'editorial', href: 'editorial.xhtml', title: 'Note éditoriale' });

    // 7. Preview plates XHTML
    const previewList = Array.isArray(artbook.previewImages) ? artbook.previewImages.filter(Boolean) : [];
    for (let i = 0; i < previewList.length; i++) {
      const plateNum = i + 1;
      const plateAsset = await fetchImageAsset(previewList[i]);
      let plateImgTag = `<p><em>Planche haute définition ${plateNum} — ${escapeXml(artbook.title)}</em></p>`;
      if (plateAsset) {
        const plateImgHref = `images/plate_${plateNum}.${plateAsset.ext}`;
        oebps.file(plateImgHref, plateAsset.data);
        manifestItems.push(
          `<item id="plate-img-${plateNum}" href="${plateImgHref}" media-type="${plateAsset.mediaType}"/>`
        );
        plateImgTag = `<img class="art-img" src="${plateImgHref}" alt="Planche ${plateNum}"/>`;
      }

      const plateFile = `plate_${plateNum}.xhtml`;
      const plateXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Planche 0${plateNum} — ${escapeXml(artbook.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="plate-box">
    <div class="badge">Planche 0${plateNum} / 0${previewList.length}</div>
    ${plateImgTag}
    <div class="plate-caption">${escapeXml(artbook.title)} • Par ${escapeXml(artbook.artistName)}</div>
  </div>
</body>
</html>`;
      oebps.file(plateFile, plateXhtml);
      manifestItems.push(`<item id="plate-${plateNum}" href="${plateFile}" media-type="application/xhtml+xml"/>`);
      spineItems.push(`<itemref idref="plate-${plateNum}"/>`);
      navLinks.push({ id: `plate-${plateNum}`, href: plateFile, title: `Planche 0${plateNum}` });
    }

    // 8. nav.xhtml (EPUB 3 navigation)
    const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Table des matières</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table des matières</h1>
    <ol>
      ${navLinks.map(item => `<li><a href="${item.href}">${escapeXml(item.title)}</a></li>`).join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;
    oebps.file('nav.xhtml', navXhtml);

    // 9. toc.ncx (EPUB 2 compatibility)
    const bookUuid = `urn:uuid:ozi-artbook-${artbook.id}`;
    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookUuid)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(artbook.title)}</text></docTitle>
  <navMap>
    ${navLinks
      .map(
        (item, idx) => `<navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${escapeXml(item.title)}</text></navLabel>
      <content src="${item.href}"/>
    </navPoint>`
      )
      .join('\n    ')}
  </navMap>
</ncx>`;
    oebps.file('toc.ncx', tocNcx);

    // 10. content.opf
    const modifiedIso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${escapeXml(bookUuid)}</dc:identifier>
    <dc:title>${escapeXml(artbook.title)}</dc:title>
    <dc:creator>${escapeXml(artbook.artistName)}</dc:creator>
    <dc:publisher>OZI Éditions</dc:publisher>
    <dc:language>fr</dc:language>
    <dc:description>${escapeXml(artbook.description)}</dc:description>
    <meta property="dcterms:modified">${modifiedIso}</meta>
    ${coverAsset ? `<meta name="cover" content="cover-image"/>` : ''}
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
    oebps.file('content.opf', contentOpf);

    // 11. Build blob & trigger download
    const epubBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
    });

    const cleanTitle = artbook.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanArtist = artbook.artistName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `OZI_Artbook_${cleanTitle}_${cleanArtist}.epub`;

    const blobUrl = URL.createObjectURL(epubBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    return { success: true, filename };
  } catch (err) {
    console.error('Failed to generate EPUB:', err);
    return { success: false, filename: '' };
  }
}
