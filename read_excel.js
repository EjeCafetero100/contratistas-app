const XLSX = require('xlsx');
const fs = require('fs');

const file = 'Proveedores, Contratistas y VisitantesP.xlsx';
const workbook = XLSX.readFile(file);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Columns:');
if (data.length > 0) {
  console.log(data[0]);
} else {
  console.log('Empty sheet');
}
