import { AUTH_MODE } from "../../components/auth/constants/auth";
import { AuthCard } from "../../components/auth/auth-card";
export default function RegisterPage() {
  return <AuthCard mode={AUTH_MODE.REGISTER} />;
}
