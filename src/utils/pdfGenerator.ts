import { jsPDF } from 'jspdf';
import { Artbook } from '../types';

interface GeneratePdfOptions {
  artbook: Artbook;
  userName?: string;
  userEmail?: string;
  isPaid?: boolean;
  transactionRef?: string;
}

// Helper to safely load image as base64 for PDF embedding
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    // Return null in case of CORS or network error, fallback will be drawn
    return null;
  }
}

export async function generateAndDownloadArtbookPdf({
  artbook,
  userName = 'Lecteur OZI',
  userEmail = 'lecteur@ozi.africa',
  isPaid = false,
  transactionRef
}: GeneratePdfOptions): Promise<{ success: boolean; filename: string }> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

    // ==========================================
    // PAGE 1: LUXURY COVER PAGE
    // ==========================================
    // Background: Dark Obsidian
    doc.setFillColor(9, 10, 15);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative double border in OZI Coral & Gold
    doc.setDrawColor(255, 134, 121); // #ff8679 Coral
    doc.setLineWidth(1.2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setDrawColor(251, 146, 60); // #fb923c Orange gold
    doc.setLineWidth(0.4);
    doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

    // Header badge
    doc.setTextColor(255, 134, 121);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OZI ÉDITIONS ART • RECUEIL OFFICIEL HAUTE DÉFINITION', pageWidth / 2, 28, { align: 'center' });

    // Decorative line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(40, 32, pageWidth - 40, 32);

    // Try embedding the cover image
    const coverBase64 = await loadImageAsBase64(artbook.coverUrl);
    if (coverBase64) {
      try {
        // Draw centered artwork rectangle with frame
        const imgW = 120;
        const imgH = 120;
        const imgX = (pageWidth - imgW) / 2;
        const imgY = 42;
        doc.addImage(coverBase64, 'JPEG', imgX, imgY, imgW, imgH);

        doc.setDrawColor(255, 134, 121);
        doc.setLineWidth(0.8);
        doc.rect(imgX, imgY, imgW, imgH);
      } catch (err) {
        console.warn('PDF image rendering fallback');
      }
    } else {
      // Geometric elegant fallback
      doc.setFillColor(20, 22, 32);
      doc.rect(35, 45, pageWidth - 70, 110, 'F');
      doc.setDrawColor(255, 134, 121);
      doc.rect(35, 45, pageWidth - 70, 110);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text('COUVERTURE OFFICIELLE', pageWidth / 2, 100, { align: 'center' });
    }

    // Title & Artist
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    const splitTitle = doc.splitTextToSize(artbook.title, pageWidth - 40);
    doc.text(splitTitle, pageWidth / 2, 185, { align: 'center' });

    doc.setTextColor(251, 146, 60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Artiste : ${artbook.artistName}`, pageWidth / 2, 205, { align: 'center' });

    // Status Pill
    doc.setTextColor(isPaid ? '#fbbf24' : '#34d399');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(
      isPaid ? `ÉDITION CERTIFIÉE — ${artbook.price.toLocaleString()} FCFA` : 'ÉDITION DIGITALE LIBRE & GRATUITE',
      pageWidth / 2,
      218,
      { align: 'center' }
    );

    // Meta details
    doc.setTextColor(161, 161, 170);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${artbook.pageCount} Pages • Année ${artbook.releaseYear} • Format Spécial Collectionneur`, pageWidth / 2, 235, { align: 'center' });

    // Recipient stamp
    doc.setFillColor(18, 20, 28);
    doc.roundedRect(30, 248, pageWidth - 60, 24, 3, 3, 'F');
    doc.setDrawColor(60, 64, 80);
    doc.roundedRect(30, 248, pageWidth - 60, 24, 3, 3);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Exemplaire certifié délivré à : ${userName}`, pageWidth / 2, 256, { align: 'center' });
    doc.setTextColor(161, 161, 170);
    doc.setFont('helvetica', 'normal');
    doc.text(`Email : ${userEmail} • ${new Date().toLocaleDateString('fr-FR')} ${transactionRef ? `• Ref : ${transactionRef}` : ''}`, pageWidth / 2, 264, { align: 'center' });

    // ==========================================
    // PAGE 2: EDITORIAL & INTRO
    // ==========================================
    doc.addPage();
    doc.setFillColor(12, 13, 18);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header
    doc.setTextColor(255, 134, 121);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('OZI ÉDITIONS • NOTE ÉDITORIALE & CONTEXTE', 20, 25);

    doc.setDrawColor(255, 134, 121);
    doc.setLineWidth(0.6);
    doc.line(20, 28, pageWidth - 20, 28);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`À propos de l'Artbook : ${artbook.title}`, 20, 42);

    // Description text
    doc.setTextColor(212, 212, 216);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitDesc = doc.splitTextToSize(artbook.description, pageWidth - 40);
    doc.text(splitDesc, 20, 52);

    // Artist Section
    doc.setTextColor(251, 146, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`L'Artiste : ${artbook.artistName}`, 20, 110);

    doc.setTextColor(212, 212, 216);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const artistNote = `Cet artbook est le fruit d'un travail d'exploration graphique approfondi, spécialement mis en page pour préserver les couleurs originales, la finesse des encrages et la dynamique des compositions. Chaque planche a été vérifiée et validée sous la supervision directe de l'artiste pour l'application et la plateforme OZI.`;
    doc.text(doc.splitTextToSize(artistNote, pageWidth - 40), 20, 120);

    // License Box
    doc.setFillColor(18, 20, 28);
    doc.roundedRect(20, 160, pageWidth - 40, 60, 3, 3, 'F');
    doc.setDrawColor(255, 134, 121);
    doc.setLineWidth(0.4);
    doc.roundedRect(20, 160, pageWidth - 40, 60, 3, 3);

    doc.setTextColor(255, 134, 121);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CONDITIONS DE LICENCE & PROPRIÉTÉ INTELLECTUELLE', 26, 172);

    doc.setTextColor(161, 161, 170);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const licenseText = `Ce document numérique est protégé par le Code de la Propriété Intellectuelle et les traités internationaux relatifs au droit d'auteur.
Tous droits réservés à l'artiste (${artbook.artistName}) et à OZI Plateforme.
Le téléchargement confère un droit d'usage strictement personnel et non exclusif.
Toute reproduction, diffusion publique, revente ou modification sans autorisation écrite préalable est rigoureusement interdite.`;
    doc.text(doc.splitTextToSize(licenseText, pageWidth - 52), 26, 182);

    // Footer signature
    doc.setTextColor(113, 113, 122);
    doc.setFontSize(8);
    doc.text('OZI Plateforme — Vitrine officielle & Studio Créateur Panafricain', 20, pageHeight - 15);
    doc.text('Page 02 / 07', pageWidth - 20, pageHeight - 15, { align: 'right' });

    // ==========================================
    // PAGES 3 to 7: THE 5 PREVIEW ARTWORKS
    // ==========================================
    for (let i = 0; i < artbook.previewImages.length; i++) {
      const imgUrl = artbook.previewImages[i];
      const pageIndex = i + 1;

      doc.addPage();
      doc.setFillColor(9, 10, 15);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Top banner with plate number
      doc.setTextColor(255, 134, 121);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`PLANCHE EXCLUSIVE 0${pageIndex} / 05 — ${artbook.title.toUpperCase()}`, 20, 18);

      doc.setTextColor(161, 161, 170);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Artiste : ${artbook.artistName}`, pageWidth - 20, 18, { align: 'right' });

      doc.setDrawColor(40, 42, 54);
      doc.setLineWidth(0.4);
      doc.line(20, 22, pageWidth - 20, 22);

      // Load preview image
      const imgBase64 = await loadImageAsBase64(imgUrl);
      if (imgBase64) {
        try {
          const frameW = pageWidth - 40; // 170mm
          const frameH = 210; // 210mm
          const frameX = 20;
          const frameY = 28;

          // Background mat for the art piece
          doc.setFillColor(15, 17, 24);
          doc.rect(frameX, frameY, frameW, frameH, 'F');

          // Embed image
          doc.addImage(imgBase64, 'JPEG', frameX, frameY, frameW, frameH);

          // Subtle frame outline
          doc.setDrawColor(255, 134, 121);
          doc.setLineWidth(0.3);
          doc.rect(frameX, frameY, frameW, frameH);
        } catch (e) {
          console.warn('Preview embed warning:', e);
        }
      } else {
        // Fallback display card
        doc.setFillColor(18, 20, 28);
        doc.rect(20, 28, pageWidth - 40, 210, 'F');
        doc.setDrawColor(255, 134, 121);
        doc.rect(20, 28, pageWidth - 40, 210);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text(`Aperçu Haute Définition Planche 0${pageIndex}`, pageWidth / 2, 130, { align: 'center' });
      }

      // Plate caption at bottom
      doc.setTextColor(212, 212, 216);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Illustration & concept : ${artbook.artistName} • Collection OZI`, 20, 254);

      doc.setTextColor(113, 113, 122);
      doc.setFontSize(8);
      doc.text('Édition certifiée OZI Artbooks', 20, pageHeight - 15);
      doc.text(`Page 0${pageIndex + 2} / 07`, pageWidth - 20, pageHeight - 15, { align: 'right' });
    }

    // Save and trigger direct browser download
    const cleanTitle = artbook.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanArtist = artbook.artistName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `OZI_Artbook_${cleanTitle}_${cleanArtist}.pdf`;

    doc.save(filename);
    return { success: true, filename };
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    return { success: false, filename: '' };
  }
}
