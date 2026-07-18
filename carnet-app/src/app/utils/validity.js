export function calculateValidity(dateStr, validMonths, fallbackStatus = 'N/A') {
  if (!dateStr) return { status: fallbackStatus, date: null };
  const issueDate = new Date(dateStr);
  // Add timezone offset to fix dates being 1 day off in some timezones
  issueDate.setMinutes(issueDate.getMinutes() + issueDate.getTimezoneOffset());
  
  if (isNaN(issueDate.getTime())) return { status: 'Inválida', date: null };
  
  const expDate = new Date(issueDate);
  expDate.setMonth(expDate.getMonth() + validMonths);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const isVigente = expDate >= today;
  return {
    status: isVigente ? 'Vigente' : 'Vencida',
    date: expDate.toLocaleDateString()
  };
}
