export const calculateAge = (dobString?: string, dodString?: string): string => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const endDate = dodString ? new Date(dodString) : new Date();
    
    // Check for invalid dates
    if (isNaN(birthDate.getTime())) return '';
    if (isNaN(endDate.getTime())) return '';

    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age < 0 ? '0' : age.toString();
};
