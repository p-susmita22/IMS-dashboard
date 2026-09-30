// Validation Rules:
// 1. Name: Only characters and spaces (no numbers)
// 2. Phone: Exactly 10 digits, does not start with 0
// 3. Email: Standard email format

export const validateName = (name) => {
  if (!name || name.trim() === '') return 'Name is required';
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(name)) return 'Name should only contain letters and spaces (no numbers or special characters)';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Phone number is required';
  // Remove any spaces or dashes just in case, though we want exactly 10 digits
  const cleanPhone = phone.replace(/[\s-]/g, '');
  const phoneRegex = /^[1-9]\d{9}$/;
  if (!phoneRegex.test(cleanPhone)) return 'Phone number must be exactly 10 digits and cannot start with 0';
  return null;
};

export const validateEmail = (email) => {
  if (!email || email.trim() === '') return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};
