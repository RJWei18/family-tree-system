import Papa from 'papaparse';
import type { Member, Relationship, Gender } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper to normalize date from YYYY/M/D to YYYY-MM-DD
const normalizeDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  // Replace slashes with dashes
  let formatted = dateStr.replace(/\//g, '-');
  // Check if it matches YYYY-M-D and needs padding
  const parts = formatted.split('-');
  if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
  }
  return formatted;
};

// Helper to format date for export (YYYY/M/D) or keep standard? 
// User provided CSV had YYYY/M/D. Let's try to output YYYY/M/D for consistency.
const formatDateForExport = (dateStr?: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parseInt(parts[0])}/${parseInt(parts[1])}/${parseInt(parts[2])}`;
    }
    return dateStr;
};

// Generate CSV string from data
const generateCSVContent = (members: Member[], relationships: Relationship[]) => {
  const data = members.map(m => {
    // Find relationships
    const fatherRel = relationships.find(r => r.targetMemberId === m.id && r.type === 'parent' && members.find(p => p.id === r.sourceMemberId)?.gender === 'male');
    const motherRel = relationships.find(r => r.targetMemberId === m.id && r.type === 'parent' && members.find(p => p.id === r.sourceMemberId)?.gender === 'female');
    const spouseRel = relationships.find(r => (r.sourceMemberId === m.id || r.targetMemberId === m.id) && r.type === 'spouse');
    
    const spouseId = spouseRel 
        ? (spouseRel.sourceMemberId === m.id ? spouseRel.targetMemberId : spouseRel.sourceMemberId) 
        : '';
        
    // Combine name
    const fullName = `${m.lastName || ''}${m.firstName || ''}`;

    return {
      'ID': m.id,
      '姓名': fullName,
      '性別': m.gender === 'male' ? 'M' : m.gender === 'female' ? 'F' : 'Other',
      '稱謂': m.title || '',
      '狀態': m.status || '',
      '出生日期': formatDateForExport(m.dateOfBirth),
      '死亡日期': formatDateForExport(m.dateOfDeath),
      '位置': m.location || '',
      '父親ID': fatherRel ? fatherRel.sourceMemberId : '',
      '母親ID': motherRel ? motherRel.sourceMemberId : '',
      '配偶ID': spouseId,
      '照片URL': m.photoUrl || ''
    };
  });

  return Papa.unparse(data);
};

export const exportToCSV = (members: Member[], relationships: Relationship[]) => {
  const csv = generateCSVContent(members, relationships);
  const BOM = "\uFEFF";
  const content = BOM + csv;
  const filename = `family_tree_export_${new Date().toISOString().slice(0,10)}.csv`;

  // Try to use File constructor for better filename handling support
  let url;
  try {
      const file = new File([content], filename, { type: 'text/csv;charset=utf-8' });
      url = URL.createObjectURL(file);
  } catch (e) {
      console.warn('File constructor not supported, falling back to Blob', e);
      // Fallback
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      url = URL.createObjectURL(blob);
  }
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename); 
  // Force target self to avoid new tab random ID behavior in some browsers
  link.target = "_self";
  
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
};

// New function to copy to clipboard
export const copyCSVToClipboard = async (members: Member[], relationships: Relationship[]): Promise<void> => {
    const csv = generateCSVContent(members, relationships);
    try {
        await navigator.clipboard.writeText(csv);
        alert('CSV 內容已複製到剪貼簿！您可以直接貼到 Google Sheet 或 Excel 中。');
    } catch (err) {
        console.error('Failed to copy', err);
        // Fallback for insecure context
        const textArea = document.createElement("textarea");
        textArea.value = csv;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('CSV 內容已複製到剪貼簿！');
        } catch (err) {
            console.error('Fallback copy failed', err);
            alert('複製失敗，請手動匯出');
        }
        document.body.removeChild(textArea);
    }
};

// Generic parser logic
const processParseResults = (results: any, resolve: any) => {
    const parsedMembers: Member[] = [];
    const rawRelationships: any[] = [];

    results.data.forEach((row: any) => {
       // Skip empty rows
       if (!row['ID'] && !row['姓名']) return;

       const fullName = (row['姓名'] || '').trim();
       const firstName = fullName;
       const lastName = '';

       const genderRaw = row['性別']; 
       let gender: Gender = 'other';
       if (genderRaw === 'M' || genderRaw === '男') gender = 'male';
       else if (genderRaw === 'F' || genderRaw === '女') gender = 'female';

       const member: Member = {
         id: row['ID'] || uuidv4(),
         firstName,
         lastName,
         gender,
         title: row['稱謂'],
         status: row['狀態'],
         dateOfBirth: normalizeDate(row['出生日期']),
         dateOfDeath: normalizeDate(row['死亡日期']),
         location: row['位置'],
         photoUrl: row['照片URL'],
         bio: '' 
       };
       parsedMembers.push(member);

       rawRelationships.push({
         memberId: member.id,
         fatherId: row['父親ID'],
         motherId: row['母親ID'],
         spouseId: row['配偶ID']
       });
    });
    
    resolve({ members: parsedMembers, relationships: rawRelationships });
};

export const parseCSV = (file: File): Promise<{ members: Member[], relationships: any[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => processParseResults(results, resolve),
      error: (error) => reject(error)
    });
  });
};

export const parseCSVFromURL = (url: string): Promise<{ members: Member[], relationships: any[] }> => {
    return new Promise((resolve, reject) => {
        // Add cache-busting timestamp to force fresh fetch
        const separator = url.includes('?') ? '&' : '?';
        const freshUrl = `${url}${separator}_t=${Date.now()}`;

        Papa.parse(freshUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => processParseResults(results, resolve),
            error: (error) => reject(error)
        });
    });
};
