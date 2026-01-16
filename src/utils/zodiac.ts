export const getZodiac = (dateString: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const animals = ['🐵', '🐔', '🐶', '🐷', '🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑'];

  return animals[year % 12];
};

export const getZodiacName = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const animals = ['猴', '雞', '狗', '豬', '鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊'];

  return animals[year % 12];
};

// Returns sort index: Rat (0) -> Pig (11)
export const getZodiacSortIndex = (dateString: string): number => {
  if (!dateString) return -1;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return -1;
  const year = date.getFullYear();
  // year % 12 maps to: 0=Monkey, 4=Rat
  // We want Rat to be 0
  // (year % 12 + 8) % 12 maps 4(Rat) -> (4+8)%12 = 0
  return (year % 12 + 8) % 12;
};

export interface Horoscope {
  name: string;
  icon: string;
  index: number; // 0 for Aries, 11 for Pisces
}

export const getHoroscope = (dateString: string): Horoscope | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Aries (Mar 21 - Apr 19) is index 0
  const signs = [
    { name: '魔羯座', icon: '♑', start: [12, 22], index: 9 },
    { name: '水瓶座', icon: '♒', start: [1, 20], index: 10 },
    { name: '雙魚座', icon: '♓', start: [2, 19], index: 11 },
    { name: '牡羊座', icon: '♈', start: [3, 21], index: 0 },
    { name: '金牛座', icon: '♉', start: [4, 20], index: 1 },
    { name: '雙子座', icon: '♊', start: [5, 21], index: 2 },
    { name: '巨蟹座', icon: '♋', start: [6, 21], index: 3 },
    { name: '獅子座', icon: '♌', start: [7, 23], index: 4 },
    { name: '處女座', icon: '♍', start: [8, 23], index: 5 },
    { name: '天秤座', icon: '♎', start: [9, 23], index: 6 },
    { name: '天蠍座', icon: '♏', start: [10, 23], index: 7 },
    { name: '射手座', icon: '♐', start: [11, 22], index: 8 },
  ];

  // Logic to find the sign
  // We can just iterate and check if date >= start date. 
  // But since it wraps around year, simpler approach:

  // Adjusted logic: check specific ranges
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return signs[1]; // Aquarius
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return signs[2]; // Pisces
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return signs[3]; // Aries
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return signs[4]; // Taurus
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return signs[5]; // Gemini
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return signs[6]; // Cancer
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return signs[7]; // Leo
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return signs[8]; // Virgo
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return signs[9]; // Libra
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return signs[10]; // Scorpio
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return signs[11]; // Sagittarius
  return signs[0]; // Capricorn (Dec 22 - Jan 19)
};
