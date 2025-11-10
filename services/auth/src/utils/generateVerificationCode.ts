/**
 * The function generates a verification code by combining a timestamp and a random number.
 * @returns The function `generateVerificationCode` returns a verification code that is a combination
 * of the current timestamp and a random 2-digit number, with the final code being a 5-digit string.
 */
const generateVerificationCode = () => {
  const timestamp = new Date().getTime().toString();
  const randomNum = Math.floor(10 + Math.random() * 90);

  const code = (timestamp + randomNum).slice(-5);

  return code;
};

export default generateVerificationCode;
