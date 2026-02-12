import jsPDF from 'jspdf';
// Note: We might need 'jspdf-autotable' for complex tables, but manual positioning is fine for now

interface PrescriptionData {
    id: string;
    created_at: string;
    medications: Array<{
        name: string;
        frequency: string;
        duration: string;
    }>;
    advice: string;
    appointment: {
        doctor_name: string;
        scheduled_at: string;
    };
    patient_name?: string; // Optional if we want to pass it
}

export const generatePrescriptionPDF = (prescription: PrescriptionData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(0, 71, 171); // Medivera Blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Medivera', 20, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Global Healthcare for NRIs', 20, 32);

    // Doctor Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dr. ${prescription.appointment.doctor_name}`, 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`, pageWidth - 60, 55);
    doc.text(`Prescription ID: ${prescription.id.slice(0, 8)}`, pageWidth - 60, 60);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 65, pageWidth - 20, 65);

    // Medications Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Medications', 20, 80);

    // Medications List
    let yPos = 95;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Medicine Name', 20, yPos);
    doc.text('Dosage / Frequency', 100, yPos);
    doc.text('Duration', 160, yPos);

    yPos += 5;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    prescription.medications.forEach((med) => {
        doc.text(med.name, 20, yPos);
        doc.text(med.frequency, 100, yPos);
        doc.text(med.duration, 160, yPos);
        yPos += 10;
    });

    // Advice
    if (prescription.advice) {
        yPos += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Advice / Instructions', 20, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        const splitAdvice = doc.splitTextToSize(prescription.advice, pageWidth - 40);
        doc.text(splitAdvice, 20, yPos);
        yPos += (splitAdvice.length * 7);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a digitally generated prescription.', 20, footerY);
    doc.text('Medivera • www.medivera.com', 20, footerY + 5);

    // Save
    doc.save(`Prescription_${prescription.created_at.split('T')[0]}.pdf`);
};
