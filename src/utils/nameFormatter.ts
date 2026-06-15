/**
 * Formats a user's name part (first name, middle name, last name)
 * by capitalizing the first letter and making the rest lowercase,
 * while exempting suffixes (Roman numerals like II, III, and Jr, Sr).
 */
export function formatNamePart(part: string | undefined | null): string {
  if (!part) return '';
  
  const ROMAN_NUMERALS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  const OTHER_SUFFIXES = ['jr', 'jr.', 'sr', 'sr.'];
  
  return part
    .split(/\s+/)
    .map(spaceWord => {
      if (!spaceWord) return '';
      return spaceWord
        .split('-')
        .map(word => {
          if (!word) return '';
          const lowerWord = word.toLowerCase();
          
          // Handle Roman numerals (e.g. II, III, IV) -> keep full uppercase
          if (ROMAN_NUMERALS.includes(lowerWord)) {
            return word.toUpperCase();
          }
          
          // Handle other suffixes (e.g. Jr, Sr) -> capitalize first, keep dot
          if (OTHER_SUFFIXES.includes(lowerWord)) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }
          
          // Handle standard words
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('-');
    })
    .join(' ');
}

/**
 * Formats a full user name given first, middle, and last names.
 */
export function formatFullName(
  firstName: string | undefined | null,
  lastName: string | undefined | null,
  middleName?: string | undefined | null
): string {
  const fName = formatNamePart(firstName);
  const mName = formatNamePart(middleName);
  const lName = formatNamePart(lastName);
  
  if (!fName && !lName) return '';
  
  return `${fName}${mName ? ' ' + mName : ''} ${lName}`.trim();
}
