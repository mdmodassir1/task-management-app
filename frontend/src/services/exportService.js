import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Import autoTable properly
import autoTable from 'jspdf-autotable';

// Format date for export
const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format priority for display
const formatPriority = (priority) => {
  const priorities = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  };
  return priorities[priority] || priority;
};

// Format status for display
const formatStatus = (status) => {
  const statuses = {
    todo: 'To Do',
    inprogress: 'In Progress',
    review: 'Review',
    done: 'Done'
  };
  return statuses[status] || status;
};

// Export to PDF
export const exportToPDF = (tasks, projectName) => {
  const doc = new jsPDF('landscape');
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text(`Task Report - ${projectName}`, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  // Add summary
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
  
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Summary:`, 14, 42);
  doc.setFontSize(10);
  doc.text(`• Total Tasks: ${totalTasks}`, 20, 50);
  doc.text(`• Completed: ${completedTasks}`, 20, 58);
  doc.text(`• In Progress: ${inProgressTasks}`, 20, 66);
  doc.text(`• To Do: ${todoTasks}`, 80, 50);
  doc.text(`• High Priority: ${highPriorityTasks}`, 80, 58);
  
  // Prepare table data
  const tableData = tasks.map(task => [
    task.title,
    formatStatus(task.status),
    formatPriority(task.priority),
    task.assignees?.map(a => a.name).join(', ') || 'Unassigned',
    formatDate(task.dueDate),
    task.comments?.length || 0
  ]);
  
  // Add table using autoTable
  autoTable(doc, {
    startY: 75,
    head: [['Task Title', 'Status', 'Priority', 'Assignees', 'Due Date', 'Comments']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 40 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Task Management App`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save PDF
  doc.save(`${projectName.replace(/\s+/g, '_')}_Tasks_Report.pdf`);
};

// Export to Excel
export const exportToExcel = (tasks, projectName) => {
  const excelData = tasks.map(task => ({
    'Task Title': task.title,
    'Description': task.description || '',
    'Status': formatStatus(task.status),
    'Priority': formatPriority(task.priority),
    'Assignees': task.assignees?.map(a => a.name).join(', ') || 'Unassigned',
    'Due Date': formatDate(task.dueDate),
    'Comments Count': task.comments?.length || 0,
    'Created At': formatDate(task.createdAt),
    'Task ID': task._id
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  worksheet['!cols'] = [
    { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 12 },
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(blob, `${projectName.replace(/\s+/g, '_')}_Tasks_Report.xlsx`);
};

// Export to CSV
export const exportToCSV = (tasks, projectName) => {
  const headers = [
    'Task Title', 'Description', 'Status', 'Priority', 'Assignees',
    'Due Date', 'Comments Count', 'Created At'
  ];
  
  const rows = tasks.map(task => [
    `"${task.title.replace(/"/g, '""')}"`,
    `"${(task.description || '').replace(/"/g, '""')}"`,
    formatStatus(task.status),
    formatPriority(task.priority),
    `"${task.assignees?.map(a => a.name).join(', ') || 'Unassigned'}"`,
    formatDate(task.dueDate),
    task.comments?.length || 0,
    formatDate(task.createdAt)
  ]);
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${projectName.replace(/\s+/g, '_')}_Tasks_Report.csv`);
};

// Export Kanban to PDF
export const exportKanbanToPDF = (columns, projectName) => {
  const doc = new jsPDF('landscape');
  
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text(`Kanban Board - ${projectName}`, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  let yPosition = 45;
  const columnWidth = 70;
  const startX = 14;
  
  const columnOrder = [
    { id: 'todo', title: 'To Do', color: [33, 150, 243] },
    { id: 'inprogress', title: 'In Progress', color: [255, 152, 0] },
    { id: 'review', title: 'Review', color: [156, 39, 176] },
    { id: 'done', title: 'Done', color: [76, 175, 80] }
  ];
  
  columnOrder.forEach((col, index) => {
    const x = startX + (index * columnWidth);
    const tasksInColumn = columns[col.id]?.tasks || [];
    
    doc.setFillColor(...col.color);
    doc.rect(x, yPosition, columnWidth - 2, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`${col.title} (${tasksInColumn.length})`, x + 2, yPosition + 7);
    
    doc.setFillColor(248, 249, 250);
    doc.rect(x, yPosition + 10, columnWidth - 2, 150, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, yPosition + 10, columnWidth - 2, 150, 'S');
    
    let taskY = yPosition + 17;
    tasksInColumn.slice(0, 8).forEach((task) => {
      if (taskY > 280) return;
      
      doc.setFillColor(255, 255, 255);
      doc.rect(x + 2, taskY, columnWidth - 6, 15, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(x + 2, taskY, columnWidth - 6, 15, 'S');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      const title = task.title.length > 20 ? task.title.substring(0, 17) + '...' : task.title;
      doc.text(title, x + 5, taskY + 5);
      
      const priorityColors = {
        low: [76, 175, 80],
        medium: [255, 152, 0],
        high: [244, 67, 54],
        urgent: [156, 39, 176]
      };
      const pColor = priorityColors[task.priority] || [100, 100, 100];
      doc.setFillColor(...pColor);
      doc.roundedRect(x + 5, taskY + 8, 15, 4, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text(formatPriority(task.priority).substring(0, 3), x + 6, taskY + 11);
      
      taskY += 20;
    });
    
    if (tasksInColumn.length > 8) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text(`+ ${tasksInColumn.length - 8} more tasks`, x + 5, taskY + 3);
    }
  });
  
  doc.save(`${projectName.replace(/\s+/g, '_')}_Kanban_Board.pdf`);
};