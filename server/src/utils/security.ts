import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (passwordPlano: string, passwordAlmacenado: string): Promise<boolean> => {
  // Si ya es un hash de bcrypt (comienza con $2a$ o $2b$)
  if (passwordAlmacenado.startsWith('$2a$') || passwordAlmacenado.startsWith('$2b$')) {
    return bcrypt.compare(passwordPlano, passwordAlmacenado);
  }
  // Respaldo para pruebas locales directas en texto plano
  return passwordPlano === passwordAlmacenado;
};