import { getPasswordStrength } from '../../utils/validation';

interface Props {
  password: string;
}

export const PasswordStrength: React.FC<Props> = ({ password }) => {
  if (!password) return null;

  const { strength, label, color } = getPasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-600">Password Strength</span>
        <span className={`text-xs font-black ${color.replace('bg-', 'text-')}`}>{label}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${strength}%` }}
        />
      </div>
    </div>
  );
};
