import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Mail } from '../../assets/icons/Mail';
import { Eye } from '../../assets/icons/Eye';
import { Store } from '../../assets/icons/Store';
import Loader from '../../components/ui/Loader';

const SellerLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Verify user is a seller in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (!userData || userData.role !== 'seller') {
        // Sign out if not a seller
        await auth.signOut();
        throw new Error('Access denied. Seller account required.');
      }

      // Force token refresh to get latest claims
      await user.getIdToken(true);

      // Success
      setRedirecting(true);
      navigate('/seller/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Failed to login. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {redirecting && <Loader fullScreen />}
    <div className="min-h-screen bg-gradient-to-br from-zoop-obsidian via-gray-900 to-zoop-obsidian flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zoop-moss rounded-2xl mb-4 shadow-2xl">
            <Store width={40} height={40} className="text-zoop-obsidian" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Seller Portal
          </h1>
          <p className="text-gray-400">
            Sign in to manage your store
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width={20} height={20} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent outline-none ${loading ? "border-zoop-moss bg-zoop-moss/5 animate-pulse" : "border-gray-200"}`}
                  placeholder="seller@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-zoop-moss focus:border-transparent outline-none ${loading ? "border-zoop-moss bg-zoop-moss/5 animate-pulse" : "border-gray-200"}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Eye width={20} height={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-zoop-moss focus:ring-zoop-moss" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-zoop-moss font-bold hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-zoop-obsidian text-white rounded-xl font-black uppercase tracking-wider hover:bg-zoop-moss hover:text-zoop-obsidian transition-all shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have a seller account?{' '}
              <Link to="/seller/onboarding" className="text-zoop-moss font-bold hover:underline">
                Register Now
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default SellerLogin;
