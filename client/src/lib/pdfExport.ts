// PDF export functionality using jsPDF
import jsPDF from 'jspdf';

export interface ExportResponse {
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  overallProgress: number;
  completedChapters: number;
  totalChapters: number;
  chapters: Array<{
    title: string;
    completionRate: number;
  }>;
  assessments: Array<{
    assessmentType: 'pre' | 'post';
    completedAt: string;
    responses: Array<{
      questionId: number;
      rating: number;
    }>;
  }>;
  reflections?: any;
}

export interface ExportData {
  user: any;
  chapters: any[];
  progress: any[];
  assessments: any[];
  reflections: any[];
}

export async function exportToPDF(): Promise<void> {
  try {
    // Fetch export data from backend
    const response = await fetch('/api/export', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch export data');
    }
    
    const exportData: ExportResponse = await response.json();
    
    // Generate PDF using jsPDF
    const pdf = new jsPDF();
    generatePDFReport(pdf, exportData);
    
    // Download the PDF
    const fileName = `ACT_Workbook_Progress_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

function generatePDFReport(pdf: jsPDF, data: ExportResponse): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 6;
  let yPosition = margin;

  // Helper function to add text with automatic page breaks
  function addText(text: string, fontSize: number = 10, isBold: boolean = false, indent: number = 0) {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    // Handle multi-line text
    const lines = pdf.splitTextToSize(text, pageWidth - margin * 2 - indent);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin + indent, yPosition);
      yPosition += lineHeight;
    });
  }

  // Header
  addText('ACT Workbook Progress Report', 18, true);
  addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
  yPosition += 5;

  // User Information
  if (data.user) {
    addText('Personal Information', 14, true);
    addText(`Name: ${data.user.firstName || ''} ${data.user.lastName || ''}`, 10);
    addText(`Email: ${data.user.email || 'Not provided'}`, 10);
    yPosition += 5;
  }

  // Overall Progress
  addText('Overall Progress Summary', 14, true);
  addText(`Progress: ${data.overallProgress || 0}%`, 12);
  addText(`Chapters Completed: ${data.completedChapters || 0} out of ${data.totalChapters || 7}`, 12);
  yPosition += 5;

  // Chapter Progress
  if (data.chapters && data.chapters.length > 0) {
    addText('Chapter Progress', 14, true);
    data.chapters.forEach((chapter) => {
      const progress = chapter.completionRate || 0;
      const progressBar = '#'.repeat(Math.floor(progress / 10)) + '.'.repeat(10 - Math.floor(progress / 10));
      addText(`${chapter.title}: ${progress}% [${progressBar}]`, 10, false, 5);
    });
    yPosition += 5;
  }

  // Assessments
  if (data.assessments && data.assessments.length > 0) {
    addText('Assessment Results', 14, true);
    
    data.assessments.forEach((assessment) => {
      const assessmentType = assessment.assessmentType.toUpperCase();
      const completedDate = assessment.completedAt 
        ? new Date(assessment.completedAt).toLocaleDateString() 
        : 'Date not available';
      addText(`${assessmentType} Assessment (Completed: ${completedDate})`, 12, true);
      
      if (assessment.responses && assessment.responses.length > 0) {
        // Calculate average score
        const totalScore = assessment.responses.reduce((sum, response) => sum + response.rating, 0);
        const averageScore = (totalScore / assessment.responses.length).toFixed(1);
        addText(`Average Score: ${averageScore}/5.0`, 10, false, 5);
        
        // Group responses by category if possible
        addText('Response Summary:', 10, false, 5);
        assessment.responses.forEach((response) => {
          addText(`Q${response.questionId}: ${response.rating}/5`, 9, false, 10);
        });
      }
      yPosition += 3;
    });
  }

  // Progress comparison if both assessments exist
  const preAssessment = data.assessments?.find((a) => a.assessmentType === 'pre');
  const postAssessment = data.assessments?.find((a) => a.assessmentType === 'post');
  
  if (preAssessment && postAssessment && 
      preAssessment.responses?.length > 0 && postAssessment.responses?.length > 0) {
    addText('Progress Comparison', 14, true);
    
    const preAvg = preAssessment.responses.reduce((sum, r) => sum + r.rating, 0) / preAssessment.responses.length;
    const postAvg = postAssessment.responses.reduce((sum, r) => sum + r.rating, 0) / postAssessment.responses.length;
    
    addText(`Pre-Assessment Average: ${preAvg.toFixed(1)}/5.0`, 10, false, 5);
    addText(`Post-Assessment Average: ${postAvg.toFixed(1)}/5.0`, 10, false, 5);
    
    if (preAvg > 0) {
      const improvement = ((postAvg - preAvg) / preAvg * 100).toFixed(1);
      addText(`Overall Improvement: ${improvement}%`, 10, true, 5);
    } else {
      addText(`Improvement: Cannot calculate (baseline was 0)`, 10, false, 5);
    }
    yPosition += 5;
  }

  // Footer
  if (yPosition > pageHeight - 40) {
    pdf.addPage();
    yPosition = margin;
  }
  
  yPosition = pageHeight - 30;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This report was generated from your ACT Workbook journey.', margin, yPosition);
  pdf.text('Continue your path toward psychological flexibility and living a values-driven life.', margin, yPosition + 5);
  
  // Add page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
  }
}
