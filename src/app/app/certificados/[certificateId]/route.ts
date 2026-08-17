import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const { certificateId } = await params;
  
  // No MVP, se começar com preview-, geramos um mock.
  // Em produção, buscaríamos os dados do certificado no Supabase pelo certificateId.
  const isPreview = certificateId.startsWith('preview-');
  const courseId = isPreview ? certificateId.replace('preview-', '') : certificateId;

  // Mock dados
  const studentName = "Dra. Polyana (Mock)";
  const courseName = "Imersão Clínica de Felinos — Parte 1";
  const workload = "20 horas";
  const issueDate = new Date().toLocaleDateString('pt-BR');
  const validationCode = isPreview ? "PREV-IEW-123" : "VAL-ID-CODE";

  try {
    // Configura jsPDF: landscape, milímetros, formato A4
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Dimensões A4 landscape: 297 x 210
    const width = 297;
    const height = 210;

    // Fundo Creme #F7F3EC
    doc.setFillColor(247, 243, 236);
    doc.rect(0, 0, width, height, 'F');

    // Borda Ameixa #40264F
    doc.setDrawColor(64, 38, 79);
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20);
    
    // Borda Dourada interna #C6A15B
    doc.setDrawColor(198, 161, 91);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, width - 24, height - 24);

    // Textos Principais
    doc.setTextColor(64, 38, 79); // Ameixa
    
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICADO DE CONCLUSÃO", width / 2, 50, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Certificamos que", width / 2, 75, { align: 'center' });

    // Nome do aluno
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(198, 161, 91); // Dourado
    doc.text(studentName, width / 2, 95, { align: 'center' });

    // Texto descritivo
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(64, 38, 79);
    doc.text("concluiu com êxito o curso", width / 2, 115, { align: 'center' });

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(courseName, width / 2, 130, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Carga horária total: ${workload}`, width / 2, 145, { align: 'center' });

    // Assinatura e Data
    doc.setDrawColor(64, 38, 79);
    doc.setLineWidth(0.5);
    
    // Linha de assinatura
    doc.line(60, 175, 130, 175);
    doc.setFontSize(12);
    doc.text("Dra. Polyana (Instrutora)", 95, 182, { align: 'center' });
    
    // Assinatura escaneada (Mock placeholder text since we don't have the image file)
    // Em produção: doc.addImage(base64Image, 'PNG', x, y, w, h);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(101, 66, 122); // Roxo
    doc.text("Assinatura Escaneada", 95, 170, { align: 'center' });

    // Data
    doc.setTextColor(64, 38, 79);
    doc.setFont("helvetica", "normal");
    doc.text(`Data de Emissão: ${issueDate}`, 210, 170, { align: 'center' });
    doc.text(`Código de Validação: ${validationCode}`, 210, 180, { align: 'center' });

    // Saída do PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Certificado_${courseId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    return new NextResponse('Erro ao gerar certificado', { status: 500 });
  }
}
