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
        doctor_qualification?: string;
        doctor_registration_number?: string;
    };
    patient_name?: string;
    patient_age?: string;
    patient_gender?: string;
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
    doc.text('Digital Healthcare', 20, 32);

    // Teleconsultation Label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 71, 171);
    doc.text('TELECONSULTATION', pageWidth - 60, 50);
    doc.setDrawColor(0, 71, 171);
    doc.roundedRect(pageWidth - 66, 44, 52, 10, 2, 2, 'S');

    // Doctor Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dr. ${prescription.appointment.doctor_name}`, 20, 55);

    let doctorY = 60;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (prescription.appointment.doctor_qualification) {
        doc.text(prescription.appointment.doctor_qualification, 20, doctorY);
        doctorY += 5;
    }
    if (prescription.appointment.doctor_registration_number) {
        doc.text(`Reg. No: ${prescription.appointment.doctor_registration_number}`, 20, doctorY);
        doctorY += 5;
    }

    // Date & ID on right side
    doc.text(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`, pageWidth - 60, 60);
    doc.text(`Prescription ID: ${prescription.id.slice(0, 8)}`, pageWidth - 60, 65);

    // Patient Details
    doctorY = Math.max(doctorY, 70) + 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, doctorY, pageWidth - 20, doctorY);
    doctorY += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient:', 20, doctorY);
    doc.setFont('helvetica', 'normal');
    const patientName = prescription.patient_name || 'N/A';
    const patientDetails = [patientName];
    if (prescription.patient_age) patientDetails.push(`Age: ${prescription.patient_age}`);
    if (prescription.patient_gender) patientDetails.push(prescription.patient_gender);
    doc.text(patientDetails.join('  |  '), 48, doctorY);

    // Divider
    doctorY += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, doctorY, pageWidth - 20, doctorY);

    // Medications Header
    let yPos = doctorY + 12;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Medications', 20, yPos);

    // Medications Table Header
    yPos += 15;
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
    doc.text('This is a digitally generated teleconsultation prescription.', 20, footerY);
    doc.text('Medivera • www.medivera.com', 20, footerY + 5);

    // Save
    doc.save(`Prescription_${prescription.created_at.split('T')[0]}.pdf`);
};
