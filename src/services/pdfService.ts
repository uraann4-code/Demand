import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PurchaseItem, FormData } from '../types';
import { format } from 'date-fns';

// Add type declaration for jspdf-autotable as it might not be strictly typed in imports
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePurchaseFormPDF = (formData: FormData, items: PurchaseItem[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const universityText = 'BAHRIA UNIVERSITY ISLAMABAD CAMPUS';
  const universityTextWidth = doc.getTextWidth(universityText);
  doc.text(universityText, (pageWidth - universityTextWidth) / 2, 20);

  doc.setFontSize(12);
  const formTitle = 'PURCHASE APPROVAL FORM';
  const formTitleWidth = doc.getTextWidth(formTitle);
  doc.text(formTitle, (pageWidth - formTitleWidth) / 2, 27);

  doc.setLineWidth(0.5);
  doc.line((pageWidth - universityTextWidth) / 2, 21.5, (pageWidth + universityTextWidth) / 2, 21.5);
  doc.line((pageWidth - formTitleWidth) / 2, 28.5, (pageWidth + formTitleWidth) / 2, 28.5);

  // Section I
  doc.setFontSize(12);
  doc.text('I', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.text('It is requested that an amount of Rs. ________________ may please be sanctioned to purchase following', margin, 50);
  doc.text('items for official use. Justification of each item is mentioned against each:', margin, 58);

  // Table
  const tableData = items.map(item => [
    item.srNo,
    item.description,
    'Exam', // Dept is usually Exam in the provided PDF
    item.qty,
    item.justification,
    '' // Approx cost left blank for manual fill as per PDF screenshots
  ]);

  doc.autoTable({
    startY: 65,
    head: [['SR #', 'DESCRIPTION', 'DEPT', 'QTY', 'JUSTIFICATION', 'APPROX COST']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    styles: { textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 50 },
      5: { cellWidth: 25 },
    },
    margin: { left: margin, right: margin }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 20;

  // Signatures Section I
  doc.setFontSize(11);
  doc.text('Signature: ______________________', margin, finalY);
  doc.text('Signature: ______________________', pageWidth - margin - 60, finalY);
  
  finalY += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Demand Raised by: ', margin, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text('Samina khan', margin + 35, finalY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Head of Department: ', pageWidth - margin - 60, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text('____________', pageWidth - margin - 22, finalY);

  finalY += 10;
  const datedFormatted = formData.dated ? format(new Date(formData.dated), 'd MMMM yyyy') : format(new Date(), 'd MMMM yyyy');
  doc.text(`Dated: ${datedFormatted}`, margin, finalY);
  doc.text(`Dated: ${datedFormatted}`, pageWidth - margin - 60, finalY);

  // Section II
  finalY += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('II', pageWidth / 2, finalY, { align: 'center' });
  
  finalY += 15;
  doc.setFont('helvetica', 'normal');
  doc.text('Recommended/ Not Recommended', margin, finalY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('PROCUREMENT OFFICER', pageWidth - margin, finalY, { align: 'right' });

  finalY += 25;
  doc.setFont('helvetica', 'normal');
  doc.text('A sum of Rs. _________________ Approved/ Not approved', margin, finalY);

  finalY += 30;
  doc.setFont('helvetica', 'bold');
  doc.text(formData.approverTitle || 'DIRECTOR CAMPUS', pageWidth - margin, finalY, { align: 'right' });

  // Save the PDF
  doc.save(`Purchase_Approval_Form_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
